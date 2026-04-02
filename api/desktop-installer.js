import { extractFileNameFromUrl, getDesktopDownloadUrl, isUnsafeStandaloneExe } from "./_lib/invoice-service.js";
import { handleOptions, sendJson, setCorsHeaders } from "./_lib/http.js";

export default async function handler(request, response) {
  if (handleOptions(request, response)) {
    return;
  }

  if (request.method !== "GET") {
    sendJson(response, 405, { ok: false, message: "Method not allowed." });
    return;
  }

  const externalUrl = getDesktopDownloadUrl();

  if (!externalUrl) {
    sendJson(response, 404, {
      ok: false,
      message: "Desktop installer is not configured. Set DESKTOP_DOWNLOAD_URL (or VITE_DESKTOP_DOWNLOAD_URL)."
    });
    return;
  }

  const fileName = extractFileNameFromUrl(externalUrl);

  if (isUnsafeStandaloneExe(fileName)) {
    sendJson(response, 500, {
      ok: false,
      message: "DESKTOP_DOWNLOAD_URL points to a standalone .exe. Use a Setup*.exe installer (or .zip/.msi package) instead."
    });
    return;
  }

  setCorsHeaders(response);
  response.redirect(302, externalUrl);
}

