function getDesktopBridge() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.desktop ?? null;
}

function openExternalLink(url) {
  if (typeof window === "undefined") {
    return;
  }

  window.location.assign(url);
}

function toAbsoluteUrl(url) {
  if (typeof window === "undefined") {
    return url;
  }

  try {
    return new URL(url, window.location.origin).toString();
  } catch {
    return url;
  }
}

const WINDOWS_INSTALLER_PATTERN = /setup.*\.exe$/i;

function extractFileNameFromUrl(urlValue) {
  const raw = String(urlValue || "").trim();

  if (!raw) {
    return "";
  }

  try {
    const parsed = new URL(raw, typeof window !== "undefined" ? window.location.origin : undefined);
    return decodeURIComponent(parsed.pathname.split("/").pop() || "").trim();
  } catch {
    return raw.split(/[?#]/)[0].split("/").pop()?.trim() || "";
  }
}

function isUnsafeStandaloneExe(fileName) {
  const normalized = String(fileName || "").trim();

  if (!normalized) {
    return false;
  }

  return normalized.toLowerCase().endsWith(".exe") && !WINDOWS_INSTALLER_PATTERN.test(normalized);
}

function assertSafeDesktopArtifact(fileName, sourceLabel) {
  if (!isUnsafeStandaloneExe(fileName)) {
    return;
  }

  throw new Error(
    `${sourceLabel} is providing a standalone .exe (${fileName}). Use a Setup*.exe installer (or .zip/.msi package) so required DLL files are included.`
  );
}

export function isDesktopRuntime() {
  const bridge = getDesktopBridge();
  return Boolean(bridge && typeof bridge.sendInvoice === "function");
}

export async function sendInvoiceFromRenderer(payload) {
  const bridge = getDesktopBridge();

  if (bridge && typeof bridge.sendInvoice === "function") {
    return bridge.sendInvoice(payload);
  }

  const response = await fetch("/api/send-invoice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Unable to send invoice email.");
  }

  return {
    ok: true,
    queued: false,
    message: data.message || "Invoice emailed successfully."
  };
}

export async function saveInvoiceToGoogleDriveFromRenderer(payload) {
  const bridge = getDesktopBridge();

  if (bridge && typeof bridge.saveInvoiceToGoogleDrive === "function") {
    return bridge.saveInvoiceToGoogleDrive(payload);
  }

  const response = await fetch("/api/save-invoice-to-drive", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Unable to save invoice to Google Drive.");
  }

  return {
    ok: true,
    message: data.message || "Invoice saved to Google Drive.",
    file: data.file || null
  };
}

export async function downloadDesktopAppFromRenderer() {
  const bridge = getDesktopBridge();

  if (bridge) {
    if (typeof bridge.downloadDesktopApp === "function") {
      const result = await bridge.downloadDesktopApp();

      if (result?.ok) {
        return result;
      }

      throw new Error(result?.message || "Unable to find desktop installer.");
    }

    throw new Error("Desktop app needs a restart to enable this button. Close it and run npm run dev:desktop again.");
  }

  const fallbackUrl = String(import.meta.env.VITE_DESKTOP_DOWNLOAD_URL || "").trim();

  if (fallbackUrl) {
    assertSafeDesktopArtifact(extractFileNameFromUrl(fallbackUrl), "VITE_DESKTOP_DOWNLOAD_URL");
    openExternalLink(fallbackUrl);
    return {
      ok: true,
      mode: "url",
      message: "Opening desktop app download page."
    };
  }

  try {
    const response = await fetch("/api/desktop-download-link");
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data?.url) {
      throw new Error(data?.message || "Desktop installer is not available right now.");
    }

    const serverFileName = String(data.fileName || "").trim();
    const urlFileName = extractFileNameFromUrl(String(data.url || ""));
    const resolvedFileName = serverFileName || urlFileName;
    assertSafeDesktopArtifact(resolvedFileName, "Desktop download endpoint");

    openExternalLink(toAbsoluteUrl(String(data.url)));
    return {
      ok: true,
      mode: String(data.mode || "url"),
      message: data.message || "Opening desktop app download."
    };
  } catch (error) {
    throw new Error(
      error instanceof Error && error.message
        ? error.message
        : "Desktop download link is not configured. Set VITE_DESKTOP_DOWNLOAD_URL in your .env."
    );
  }
}

export async function getEmailQueueStatusFromDesktop() {
  const bridge = getDesktopBridge();

  if (!bridge || typeof bridge.getEmailQueueStatus !== "function") {
    return { queueSize: 0 };
  }

  return bridge.getEmailQueueStatus();
}

export async function processEmailQueueFromDesktop() {
  const bridge = getDesktopBridge();

  if (!bridge || typeof bridge.processEmailQueue !== "function") {
    return { processed: 0, remaining: 0 };
  }

  return bridge.processEmailQueue();
}

export function subscribeToEmailQueueUpdates(callback) {
  const bridge = getDesktopBridge();

  if (!bridge || typeof bridge.onEmailQueueUpdated !== "function") {
    return () => {};
  }

  return bridge.onEmailQueueUpdated(callback);
}
