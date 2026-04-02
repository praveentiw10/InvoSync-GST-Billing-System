import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const INSTALLER_FILE_PATTERN = /setup.*\.exe$/i;
const INSTALLER_SCAN_DEPTH = 3;
const MSI_FILE_PATTERN = /\.msi$/i;
const ZIP_FILE_PATTERN = /\.zip$/i;
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink";
const PLACEHOLDER_ENV_VALUES = new Set([
  "optional-drive-folder-id",
  "your-google-oauth-client-id",
  "your-google-oauth-client-secret",
  "your-google-oauth-refresh-token",
  "your-google-drive-folder-id"
]);

app.use(cors());
app.use(express.json({ limit: "25mb" }));

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
  return String(process.env.DESKTOP_DOWNLOAD_URL || process.env.VITE_DESKTOP_DOWNLOAD_URL || "").trim();
}

function extractFileNameFromUrl(urlValue) {
  const fallback = String(urlValue || "").split(/[?#]/)[0];
  const fallbackName = path.basename(fallback).trim();

  try {
    const parsed = new URL(String(urlValue));
    const parsedName = path.basename(parsed.pathname || "").trim();
    return parsedName || fallbackName;
  } catch {
    return fallbackName;
  }
}

function isUnsafeStandaloneExe(fileName) {
  const normalized = String(fileName || "").trim();

  if (!normalized) {
    return false;
  }

  return normalized.toLowerCase().endsWith(".exe") && !INSTALLER_FILE_PATTERN.test(normalized);
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

function normalizeAttachmentContent(content) {
  const value = String(content || "");
  return value.includes(",") ? value.split(",")[1] : value;
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

async function uploadInvoiceToGoogleDrive({ attachmentName, attachmentContent, mimeType }) {
  const config = getGoogleDriveConfig();
  validateGoogleDriveConfig(config);

  const accessToken = await getGoogleDriveAccessToken(config);
  const resolvedMimeType = String(mimeType || "application/pdf").trim() || "application/pdf";
  const metadata = {
    name: String(attachmentName || `invoice-${Date.now()}.pdf`),
    mimeType: resolvedMimeType
  };

  if (config.folderId) {
    metadata.parents = [config.folderId];
  }

  const fileBuffer = Buffer.from(normalizeAttachmentContent(attachmentContent), "base64");
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
  const payload = Buffer.concat([Buffer.from(multipartHead, "utf8"), fileBuffer, Buffer.from(multipartTail, "utf8")]);

  const uploadResponse = await fetch(GOOGLE_DRIVE_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`
    },
    body: payload
  });
  const uploadPayload = await uploadResponse.json().catch(() => ({}));

  if (!uploadResponse.ok || !uploadPayload.id) {
    const reason = String(uploadPayload.error?.message || uploadPayload.error || "").trim();
    throw new Error(reason ? `Unable to upload invoice to Google Drive: ${reason}` : "Unable to upload invoice to Google Drive.");
  }

  return uploadPayload;
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
    const lowerName = entry.name.toLowerCase();

    if (entry.isFile() && (lowerName.endsWith(".exe") || lowerName.endsWith(".msi") || lowerName.endsWith(".zip"))) {
      bucket.push(fullPath);
      continue;
    }

    if (entry.isDirectory()) {
      await collectExecutables(fullPath, depth + 1, bucket);
    }
  }
}

async function findDesktopInstaller() {
  const searchRoots = [path.join(process.cwd(), "release"), path.join(process.cwd(), "..", "release")].map((dir) => path.resolve(dir));
  const artifacts = [];

  for (const rootDir of [...new Set(searchRoots)]) {
    await collectExecutables(rootDir, 0, artifacts);
  }

  if (!artifacts.length) {
    return null;
  }

  const usableArtifacts = artifacts.filter((filePath) => path.basename(filePath).toLowerCase() !== "electron.exe");

  if (!usableArtifacts.length) {
    return null;
  }

  const setupInstaller = usableArtifacts.find((filePath) => INSTALLER_FILE_PATTERN.test(path.basename(filePath)));

  if (setupInstaller) {
    return setupInstaller;
  }

  const msiInstaller = usableArtifacts.find((filePath) => MSI_FILE_PATTERN.test(path.basename(filePath)));

  if (msiInstaller) {
    return msiInstaller;
  }

  const zipPackage = usableArtifacts.find((filePath) => ZIP_FILE_PATTERN.test(path.basename(filePath)));

  if (zipPackage) {
    return zipPackage;
  }

  return null;
}

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/desktop-download-link", async (_request, response) => {
  const externalUrl = getDesktopDownloadUrl();

  if (externalUrl) {
    const externalFileName = extractFileNameFromUrl(externalUrl);

    if (isUnsafeStandaloneExe(externalFileName)) {
      response.status(500).json({
        ok: false,
        message:
          "DESKTOP_DOWNLOAD_URL points to a standalone .exe. Use a Setup*.exe installer (or .zip/.msi package) instead."
      });
      return;
    }

    response.json({
      ok: true,
      mode: "url",
      url: externalUrl,
      fileName: externalFileName,
      message: "Opening desktop app download page."
    });
    return;
  }

  const installerPath = await findDesktopInstaller();

  if (!installerPath) {
    response.status(404).json({
      ok: false,
      message:
        "Desktop installer not found. Build the NSIS setup with npm run build:desktop (do not distribute win-unpacked/*.exe directly) or set DESKTOP_DOWNLOAD_URL in .env."
    });
    return;
  }

  response.json({
    ok: true,
    mode: "local",
    url: "/api/desktop-installer",
    fileName: path.basename(installerPath),
    message: `Downloading ${path.basename(installerPath)}`
  });
});

app.get("/api/desktop-installer", async (_request, response) => {
  const installerPath = await findDesktopInstaller();

  if (!installerPath) {
    const externalUrl = getDesktopDownloadUrl();

    if (externalUrl) {
      const externalFileName = extractFileNameFromUrl(externalUrl);

      if (isUnsafeStandaloneExe(externalFileName)) {
        response.status(500).json({
          ok: false,
          message:
            "DESKTOP_DOWNLOAD_URL points to a standalone .exe. Use a Setup*.exe installer (or .zip/.msi package) instead."
        });
        return;
      }

      response.redirect(externalUrl);
      return;
    }

    response.status(404).json({
      ok: false,
      message:
        "Desktop installer not found. Build the NSIS setup with npm run build:desktop (do not distribute win-unpacked/*.exe directly) or set DESKTOP_DOWNLOAD_URL in .env."
    });
    return;
  }

  response.download(installerPath, path.basename(installerPath), (error) => {
    if (error && !response.headersSent) {
      response.status(500).json({
        ok: false,
        message: "Unable to start desktop installer download."
      });
    }
  });
});

app.post("/api/send-invoice", async (request, response) => {
  const transporter = createTransporter();

  if (!transporter) {
    response.status(500).json({
      message: "SMTP configuration is missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and FROM_EMAIL in .env."
    });
    return;
  }

  const { to, subject, message, attachmentName, attachmentContent } = request.body ?? {};

  if (!to || !attachmentContent) {
    response.status(400).json({ message: "Recipient email and invoice attachment are required." });
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to,
      subject: subject || "Tax Invoice",
      text: message || "Please find the attached invoice.",
      html: `<p>${(message || "Please find the attached invoice.").replace(/\n/g, "<br />")}</p>`,
      attachments: [
        {
          filename: attachmentName || "invoice.pdf",
          content: String(attachmentContent).split(",")[1],
          encoding: "base64"
        }
      ]
    });

    response.json({ ok: true });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : "Unable to send the invoice email."
    });
  }
});

app.post("/api/save-invoice-to-drive", async (request, response) => {
  const { attachmentName, attachmentContent, mimeType } = request.body ?? {};

  if (!attachmentContent) {
    response.status(400).json({ message: "Invoice attachment is required." });
    return;
  }

  try {
    const uploadedFile = await uploadInvoiceToGoogleDrive({
      attachmentName,
      attachmentContent,
      mimeType
    });

    response.json({
      ok: true,
      message: "Invoice saved to Google Drive.",
      file: uploadedFile
    });
  } catch (error) {
    response.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : "Unable to save invoice to Google Drive."
    });
  }
});

app.listen(port, () => {
  console.log(`Invoice email server listening on http://localhost:${port}`);
});
