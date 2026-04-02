export function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

export function sendJson(response, statusCode, payload) {
  setCorsHeaders(response);
  response.status(statusCode).json(payload);
}

export function handleOptions(request, response) {
  if (request.method !== "OPTIONS") {
    return false;
  }

  setCorsHeaders(response);
  response.status(204).end();
  return true;
}

export async function readJsonBody(request) {
  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  if (typeof request.body === "string" && request.body.trim()) {
    try {
      return JSON.parse(request.body);
    } catch {
      throw new Error("Request body must be valid JSON.");
    }
  }

  const rawBody = await new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });

  if (!rawBody || !String(rawBody).trim()) {
    return {};
  }

  try {
    return JSON.parse(String(rawBody));
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

