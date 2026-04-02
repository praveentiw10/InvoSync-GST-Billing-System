import { uploadInvoiceToGoogleDrive } from "./_lib/invoice-service.js";
import { handleOptions, readJsonBody, sendJson } from "./_lib/http.js";

export default async function handler(request, response) {
  if (handleOptions(request, response)) {
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, message: "Method not allowed." });
    return;
  }

  let payload = {};

  try {
    payload = await readJsonBody(request);
  } catch (error) {
    sendJson(response, 400, {
      ok: false,
      message: error instanceof Error ? error.message : "Invalid request body."
    });
    return;
  }

  const { attachmentName, attachmentContent, mimeType } = payload ?? {};

  if (!attachmentContent) {
    sendJson(response, 400, {
      ok: false,
      message: "Invoice attachment is required."
    });
    return;
  }

  try {
    const uploadedFile = await uploadInvoiceToGoogleDrive({
      attachmentName,
      attachmentContent,
      mimeType
    });

    sendJson(response, 200, {
      ok: true,
      message: "Invoice saved to Google Drive.",
      file: uploadedFile
    });
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to save invoice to Google Drive."
    });
  }
}

