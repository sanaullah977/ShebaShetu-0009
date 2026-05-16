type JsonObject = Record<string, any>;

export async function parseJsonResponse<T = JsonObject>(
  response: Response,
  fallbackMessage = "Request failed. Please try again.",
): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(response.ok ? "Unexpected server response." : sanitizeResponseText(text, fallbackMessage));
  }

  let payload: JsonObject;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Server returned invalid JSON.");
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload) || fallbackMessage);
  }

  return payload as T;
}

export function errorMessage(error: unknown, fallbackMessage = "Something went wrong. Please try again.") {
  return error instanceof Error && error.message ? error.message : fallbackMessage;
}

function extractErrorMessage(payload: JsonObject) {
  const error = payload.error;
  if (typeof error === "string") return error;
  if (error && typeof error.message === "string") return error.message;
  if (typeof payload.message === "string") return payload.message;
  return "";
}

function sanitizeResponseText(text: string, fallbackMessage: string) {
  const trimmed = text.trim();
  if (!trimmed || /<!doctype html|<html[\s>]/i.test(trimmed)) {
    return fallbackMessage;
  }

  const plain = trimmed.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return plain.slice(0, 180) || fallbackMessage;
}
