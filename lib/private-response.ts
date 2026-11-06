import { NextResponse } from "next/server";

/**
 * Private DOC/auth API responses must never be stored by browsers, shared
 * proxies or intermediary caches. Vary on Cookie to prevent cross-session
 * response reuse if a cache is misconfigured.
 */
export function privateResponseHeaders(existing?: HeadersInit): Headers {
  const headers = new Headers(existing);
  headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  headers.set("Pragma", "no-cache");
  headers.set("Vary", "Cookie");
  return headers;
}

export function privateJson(
  body: unknown,
  init: ResponseInit = {}
): NextResponse {
  return NextResponse.json(body, {
    ...init,
    headers: privateResponseHeaders(init.headers),
  });
}
