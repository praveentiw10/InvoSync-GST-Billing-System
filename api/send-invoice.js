import { createTransporter, normalizeAttachmentContent } from "./_lib/invoice-service.js";
import { handleOptions, readJsonBody, sendJson } from "./_lib/http.js";

export default async function handler(request, response) {
  if (handleOptions(request, response)) {
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, message: "Method not allowed." });
    return;
  }

  const transporter = createTransporter();

  if (!transporter) {
    sendJson(response, 500, {
      ok: false,
      message: "SMTP configuration is missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and FROM_EMAIL."
    });
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

  const { to, subject, message, attachmentName, attachmentContent } = payload ?? {};

  if (!to || !attachmentContent) {
    sendJson(response, 400, {
      ok: false,
      message: "Recipient email and invoice attachment are required."
    });
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
          content: normalizeAttachmentContent(attachmentContent),
          encoding: "base64"
        }
      ]
    });

    sendJson(response, 200, { ok: true, message: "Invoice emailed successfully." });
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to send the invoice email."
    });
  }
}

