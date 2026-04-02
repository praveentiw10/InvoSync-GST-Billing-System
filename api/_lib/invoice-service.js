import nodemailer from "nodemailer";
import path from "node:path";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink";
const WINDOWS_INSTALLER_PATTERN = /setup.*\.exe$/i;
const PLACEHOLDER_ENV_VALUES = new Set([
  "optional-drive-folder-id",
  "your-google-oauth-client-id",
  "your-google-oauth-client-secret",
  "your-google-oauth-refresh-token",
  "your-google-drive-folder-id"
]);

export function createTransporter() {
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

export function normalizeAttachmentContent(content) {
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

export async function uploadInvoiceToGoogleDrive({ attachmentName, attachmentContent, mimeType }) {
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

export function getDesktopDownloadUrl() {
  return String(process.env.DESKTOP_DOWNLOAD_URL || process.env.VITE_DESKTOP_DOWNLOAD_URL || "").trim();
}

export function extractFileNameFromUrl(urlValue) {
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

export function isUnsafeStandaloneExe(fileName) {
  const normalized = String(fileName || "").trim();

  if (!normalized) {
    return false;
  }

  return normalized.toLowerCase().endsWith(".exe") && !WINDOWS_INSTALLER_PATTERN.test(normalized);
}

