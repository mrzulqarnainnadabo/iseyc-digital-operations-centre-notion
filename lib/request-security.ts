import { NextRequest } from "next/server";

/**
 * Require browser mutations to originate from the same origin as the request.
 * This is a CSRF defence-in-depth check; it does not replace authentication.
 */
export function isSameOriginRequest(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === req.nextUrl.origin;
  } catch {
    return false;
  }
}

export type BoundedJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: "content_type" | "too_large" | "invalid_json" };

/**
 * Parse JSON with a streaming byte ceiling. Checking size only after req.text()
 * would still buffer an unbounded body in memory, so chunks are counted before
 * being retained. Content-Length is an early rejection hint, never trusted as
 * the sole limit because clients can omit or misstate it.
 */
export async function readBoundedJson(
  req: Request,
  maxBytes = 16_384
): Promise<BoundedJsonResult> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    return { ok: false, reason: "invalid_json" };
  }

  const contentType = req.headers.get("content-type") || "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    return { ok: false, reason: "content_type" };
  }

  const contentLength = req.headers.get("content-length");
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength)) {
      return { ok: false, reason: "invalid_json" };
    }
    const declaredBytes = Number(contentLength);
    if (!Number.isSafeInteger(declaredBytes)) {
      return { ok: false, reason: "invalid_json" };
    }
    if (declaredBytes > maxBytes) {
      return { ok: false, reason: "too_large" };
    }
  }

  if (!req.body) return { ok: false, reason: "invalid_json" };

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        return { ok: false, reason: "too_large" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, reason: "invalid_json" };
  } finally {
    reader.releaseLock();
  }

  try {
    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
}
