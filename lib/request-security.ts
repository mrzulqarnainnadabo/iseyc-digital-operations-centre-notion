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

/** Parse JSON only after checking its media type and actual encoded size. */
export async function readBoundedJson(
  req: Request,
  maxBytes = 16_384
): Promise<BoundedJsonResult> {
  const contentType = req.headers.get("content-type") || "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    return { ok: false, reason: "content_type" };
  }
  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    return { ok: false, reason: "too_large" };
  }
  try {
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
}
