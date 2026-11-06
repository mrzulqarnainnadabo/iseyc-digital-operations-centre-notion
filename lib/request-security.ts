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
