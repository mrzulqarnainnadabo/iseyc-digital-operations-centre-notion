import { NextRequest, NextResponse } from "next/server";
import { privateJson, privateResponseHeaders } from "@/lib/private-response";
import { SESSION_COOKIE_PATH } from "@/lib/auth";
import {
  docAppOrigin,
  googleOidcConfigured,
  OIDC_NONCE_COOKIE,
  OIDC_STATE_COOKIE,
  OIDC_VERIFIER_COOKIE,
  PENDING_IDENTITY_COOKIE,
  safeEqual,
  signPendingIdentity,
  verifyGoogleIdToken,
} from "@/lib/google-oidc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clearTransactionCookies(response: NextResponse) {
  for (const name of [OIDC_STATE_COOKIE, OIDC_NONCE_COOKIE, OIDC_VERIFIER_COOKIE]) {
    response.cookies.set(name, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/auth/oidc", maxAge: 0 });
  }
  response.cookies.set(PENDING_IDENTITY_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: SESSION_COOKIE_PATH, maxAge: 0 });
}

function loginRedirect(origin: string, result: string) {
  const response = NextResponse.redirect(new URL(`/login?oidc=${result}`, origin));
  for (const [name, value] of privateResponseHeaders(response.headers)) response.headers.set(name, value);
  clearTransactionCookies(response);
  return response;
}

export async function GET(req: NextRequest) {
  const configuredOrigin = docAppOrigin();
  const requestOrigin = req.nextUrl.origin;
  if (!configuredOrigin) {
    return privateJson({ ok: false, error: "Google sign-in is not configured." }, { status: 503 });
  }
  if (requestOrigin !== configuredOrigin || !googleOidcConfigured()) {
    return loginRedirect(configuredOrigin, "unavailable");
  }
  const origin = configuredOrigin;

  const code = req.nextUrl.searchParams.get("code");
  const returnedState = req.nextUrl.searchParams.get("state");
  const expectedState = req.cookies.get(OIDC_STATE_COOKIE)?.value;
  const nonce = req.cookies.get(OIDC_NONCE_COOKIE)?.value;
  const verifier = req.cookies.get(OIDC_VERIFIER_COOKIE)?.value;

  if (
    req.nextUrl.searchParams.has("error") ||
    !code || code.length > 4096 ||
    !returnedState || !expectedState || !safeEqual(returnedState, expectedState) ||
    !nonce || !verifier
  ) {
    return loginRedirect(origin, "failed");
  }

  try {
    const redirectUri = new URL("/api/auth/oidc/callback", origin).toString();
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.DOC_GOOGLE_CLIENT_ID!.trim(),
      client_secret: process.env.DOC_GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    });
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!tokenResponse.ok) return loginRedirect(origin, "failed");

    const tokens: unknown = await tokenResponse.json();
    if (!tokens || typeof tokens !== "object" || typeof (tokens as { id_token?: unknown }).id_token !== "string") {
      return loginRedirect(origin, "failed");
    }
    const identity = await verifyGoogleIdToken((tokens as { id_token: string }).id_token, nonce);

    const response = loginRedirect(origin, "pending");
    response.cookies.set(PENDING_IDENTITY_COOKIE, signPendingIdentity(identity.subject, identity.email), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/ops",
      maxAge: 900,
    });
    return response;
  } catch {
    return loginRedirect(origin, "failed");
  }
}
