import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, ipcMain, shell } from "electron";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const EMAIL_QUEUE_FILE = "email-queue.json";
const QUEUE_RETRY_INTERVAL_MS = 60_000;
const RETRYABLE_SMTP_CODES = new Set(["ENOTFOUND", "EAI_AGAIN", "ETIMEDOUT", "ECONNRESET", "ECONNREFUSED", "ENETUNREACH", "EHOSTUNREACH"]);
const INSTALLER_FILE_PATTERN = /setup.*\.exe$/i;
const INSTALLER_SCAN_DEPTH = 3;
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink";
const PLACEHOLDER_ENV_VALUES = new Set([
  "optional-drive-folder-id",
  "your-google-oauth-client-id",
  "your-google-oauth-client-secret",
  "your-google-oauth-refresh-token",
  "your-google-drive-folder-id"
]);

let mainWindow = null;
let queueTimer = null;
let processingQueue = false;

function loadEnvironmentFiles() {
  const envCandidates = [
    path.join(process.cwd(), ".env"),
    path.join(app.getAppPath(), ".env"),
    path.join(path.dirname(process.execPath), ".env")
  ];

  for (const envPath of envCandidates) {
    if (existsSync(envPath)) {
      dotenv.config({ path: envPath, override: false });
    }
  }
}

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true" || Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
}


function getDesktopDownloadUrl() {
  return process.env.DESKTOP_DOWNLOAD_URL || process.env.VITE_DESKTOP_DOWNLOAD_URL || "";
}

function normalizeGoogleConfigValue(value) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return "";
  }

  const lower = normalized.toLowerCase();

  if (PLACEHOLDER_ENV_VALUES.has(lower) || lower === "null" || lower === "undefined" || lower === "none") {
    return "";
  }

  return normalized;
}

function getGoogleDriveConfig() {
  return {
    clientId: normalizeGoogleConfigValue(process.env.GOOGLE_DRIVE_CLIENT_ID),
    clientSecret: normalizeGoogleConfigValue(process.env.GOOGLE_DRIVE_CLIENT_SECRET),
    refreshToken: normalizeGoogleConfigValue(process.env.GOOGLE_DRIVE_REFRESH_TOKEN),
    folderId: normalizeGoogleConfigValue(process.env.GOOGLE_DRIVE_FOLDER_ID)
  };
}

function validateGoogleDriveConfig(config) {
  const missing = [];

  if (!config.clientId) {
    missing.push("GOOGLE_DRIVE_CLIENT_ID");
  }

  if (!config.clientSecret) {
    missing.push("GOOGLE_DRIVE_CLIENT_SECRET");
  }

  if (!config.refreshToken) {
    missing.push("GOOGLE_DRIVE_REFRESH_TOKEN");
  }

  if (missing.length) {
    throw new Error(`Google Drive configuration is missing: ${missing.join(", ")}.`);
  }
}

async function getGoogleDriveAccessToken(config) {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken,
    grant_type: "refresh_token"
  });

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
  const tokenPayload = await tokenResponse.json().catch(() => ({}));

  if (!tokenResponse.ok || !tokenPayload.access_token) {
    const reason = String(tokenPayload.error_description || tokenPayload.error || "").trim();
    throw new Error(reason ? `Unable to authorize Google Drive: ${reason}` : "Unable to authorize Google Drive.");
  }

  return tokenPayload.access_token;
}

async function uploadInvoiceToGoogleDrive(payload) {
  const config = getGoogleDriveConfig();
  validateGoogleDriveConfig(config);

  const accessToken = await getGoogleDriveAccessToken(config);
  const resolvedMimeType = String(payload.mimeType || "application/pdf").trim() || "application/pdf";
  const metadata = {
    name: String(payload.attachmentName || `invoice-${Date.now()}.pdf`),
    mimeType: resolvedMimeType
  };

  if (config.folderId) {
    metadata.parents = [config.folderId];
  }

  const fileBuffer = Buffer.from(normalizeAttachmentContent(payload.attachmentContent), "base64");
  const boundary = `invoicegen_${Date.now().toString(36)}`;
  const multipartHead = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    `Content-Type: ${resolvedMimeType}`,
    "",
    ""
  ].join("\r\n");
  const multipartTail = `\r\n--${boundary}--`;
  const requestPayload = Buffer.concat([Buffer.from(multipartHead, "utf8"), fileBuffer, Buffer.from(multipartTail, "utf8")]);

  const uploadResponse = await fetch(GOOGLE_DRIVE_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`
    },
    body: requestPayload
  });
  const uploadResult = await uploadResponse.json().catch(() => ({}));

  if (!uploadResponse.ok || !uploadResult.id) {
    const reason = String(uploadResult.error?.message || uploadResult.error || "").trim();
    throw new Error(reason ? `Unable to upload invoice to Google Drive: ${reason}` : "Unable to upload invoice to Google Drive.");
  }

  return uploadResult;
}

function validateDriveUploadPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid Google Drive upload payload.");
  }

  if (!payload.attachmentContent) {
    throw new Error("Invoice attachment is required.");
  }
}

async function collectExecutables(directory, depth, bucket) {
  if (depth > INSTALLER_SCAN_DEPTH || !existsSync(directory)) {
    return;
  }

  let entries = [];

  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".exe")) {
      bucket.push(fullPath);
      continue;
    }

    if (entry.isDirectory()) {
      await collectExecutables(fullPath, depth + 1, bucket);
    }
  }
}

async function findDesktopInstaller() {
  const candidateDirs = [
    path.join(process.cwd(), "release"),
    path.join(app.getAppPath(), "release"),
    path.join(path.dirname(process.execPath), "release"),
    path.join(path.dirname(process.execPath), "..", "release")
  ];
  const uniqueDirs = [...new Set(candidateDirs.map((dir) => path.resolve(dir)))];
  const executables = [];

  for (const dir of uniqueDirs) {
    await collectExecutables(dir, 0, executables);
  }

  if (!executables.length) {
    return null;
  }

  const usableExecutables = executables.filter((filePath) => path.basename(filePath).toLowerCase() !== "electron.exe");

  if (!usableExecutables.length) {
    return null;
  }

  const setupFile = usableExecutables.find((filePath) => INSTALLER_FILE_PATTERN.test(path.basename(filePath)));

  return setupFile ?? null;
}
function getQueueFilePath() {
  return path.join(app.getPath("userData"), EMAIL_QUEUE_FILE);
}

async function readEmailQueue() {
  try {
    const raw = await fs.readFile(getQueueFilePath(), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }

    return [];
  }
}

async function writeEmailQueue(queue) {
  await fs.mkdir(path.dirname(getQueueFilePath()), { recursive: true });
  await fs.writeFile(getQueueFilePath(), JSON.stringify(queue, null, 2), "utf8");
}

function toErrorMessage(error, fallback) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function normalizeAttachmentContent(content) {
  const value = String(content || "");
  return value.includes(",") ? value.split(",")[1] : value;
}

function validatePayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid invoice email payload.");
  }

  if (!payload.to) {
    throw new Error("Recipient email is required.");
  }

  if (!payload.attachmentContent) {
    throw new Error("Invoice attachment is required.");
  }
}

function isRetryableError(error) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String(error.code || "") : "";

  if (RETRYABLE_SMTP_CODES.has(code)) {
    return true;
  }

  const message = toErrorMessage(error, "").toLowerCase();
  return message.includes("network") || message.includes("timeout") || message.includes("connection");
}

async function sendInvoiceEmail(payload) {
  const transporter = createTransporter();

  if (!transporter) {
    const error = new Error("SMTP configuration is missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and FROM_EMAIL in .env.");
    error.code = "SMTP_CONFIG_MISSING";
    throw error;
  }

  await transporter.sendMail({
    from: process.env.FROM_EMAIL || process.env.SMTP_USER,
    to: payload.to,
    subject: payload.subject || "Tax Invoice",
    text: payload.message || "Please find the attached invoice.",
    html: `<p>${String(payload.message || "Please find the attached invoice.").replace(/\n/g, "<br />")}</p>`,
    attachments: [
      {
        filename: payload.attachmentName || "invoice.pdf",
        content: normalizeAttachmentContent(payload.attachmentContent),
        encoding: "base64"
      }
    ]
  });
}

async function publishQueueUpdate() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  const queue = await readEmailQueue();
  mainWindow.webContents.send("email-queue-updated", { queueSize: queue.length });
}

async function enqueueEmail(payload, reason) {
  const queue = await readEmailQueue();
  queue.push({
    id: randomUUID(),
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    lastError: reason
  });
  await writeEmailQueue(queue);
  await publishQueueUpdate();
  return queue.length;
}

async function processEmailQueue() {
  if (processingQueue) {
    const queue = await readEmailQueue();
    return { processed: 0, remaining: queue.length };
  }

  processingQueue = true;

  try {
    const queue = await readEmailQueue();

    if (!queue.length) {
      return { processed: 0, remaining: 0 };
    }

    const remaining = [];
    let processed = 0;

    for (const job of queue) {
      try {
        validatePayload(job.payload);
        await sendInvoiceEmail(job.payload);
        processed += 1;
      } catch (error) {
        remaining.push({
          ...job,
          retryCount: Number(job.retryCount || 0) + 1,
          lastAttemptAt: new Date().toISOString(),
          lastError: toErrorMessage(error, "Unable to send queued invoice email.")
        });

        if (!isRetryableError(error)) {
          continue;
        }
      }
    }

    await writeEmailQueue(remaining);
    await publishQueueUpdate();
    return { processed, remaining: remaining.length };
  } finally {
    processingQueue = false;
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1180,
    minHeight: 720,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (DEV_SERVER_URL && url.startsWith(DEV_SERVER_URL)) {
      return;
    }

    if (!DEV_SERVER_URL && url.startsWith("file://")) {
      return;
    }

    event.preventDefault();
    void shell.openExternal(url);
  });

  if (DEV_SERVER_URL) {
    void mainWindow.loadURL(DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function registerIpcHandlers() {
  ipcMain.handle("download-desktop-app", async () => {
    const installerPath = await findDesktopInstaller();

    if (installerPath) {
      const openError = await shell.openPath(installerPath);

      if (!openError) {
        return {
          ok: true,
          mode: "local",
          message: `Launching installer: ${path.basename(installerPath)}`
        };
      }

      shell.showItemInFolder(installerPath);
      return {
        ok: true,
        mode: "local",
        message: `Installer found. Opened folder: ${installerPath}`
      };
    }

    const fallbackUrl = getDesktopDownloadUrl();

    if (fallbackUrl) {
      await shell.openExternal(fallbackUrl);
      return {
        ok: true,
        mode: "url",
        message: "Opening download page in your browser."
      };
    }

    return {
      ok: false,
      mode: "none",
      message:
        "Installer not found. Build the NSIS setup with npm run build:desktop (do not distribute win-unpacked/*.exe directly) or set DESKTOP_DOWNLOAD_URL in .env."
    };
  });

  ipcMain.handle("send-invoice", async (_event, payload) => {
    validatePayload(payload);

    try {
      await sendInvoiceEmail(payload);
      return {
        ok: true,
        queued: false,
        message: "Invoice emailed successfully."
      };
    } catch (error) {
      if (isRetryableError(error)) {
        const queueSize = await enqueueEmail(payload, toErrorMessage(error, "Unable to send invoice email right now."));
        return {
          ok: true,
          queued: true,
          queueSize,
          message: "No network connection. The invoice email has been queued and will retry automatically."
        };
      }

      throw new Error(toErrorMessage(error, "Unable to send invoice email."));
    }
  });

  ipcMain.handle("save-invoice-to-drive", async (_event, payload) => {
    validateDriveUploadPayload(payload);

    try {
      const file = await uploadInvoiceToGoogleDrive(payload);
      return {
        ok: true,
        message: "Invoice saved to Google Drive.",
        file
      };
    } catch (error) {
      throw new Error(toErrorMessage(error, "Unable to save invoice to Google Drive."));
    }
  });

  ipcMain.handle("get-email-queue-status", async () => {
    const queue = await readEmailQueue();
    return { queueSize: queue.length };
  });

  ipcMain.handle("process-email-queue", async () => {
    return processEmailQueue();
  });
}

app.whenReady().then(async () => {
  loadEnvironmentFiles();
  registerIpcHandlers();
  createMainWindow();
  await publishQueueUpdate();
  await processEmailQueue();

  queueTimer = setInterval(() => {
    void processEmailQueue();
  }, QUEUE_RETRY_INTERVAL_MS);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("before-quit", () => {
  if (queueTimer) {
    clearInterval(queueTimer);
    queueTimer = null;
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});










