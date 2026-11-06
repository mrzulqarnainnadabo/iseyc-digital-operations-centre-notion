import { NextRequest, NextResponse } from "next/server";
import {
  createOidcTransaction,
  googleOidcConfigured,
  OIDC_NONCE_COOKIE,
  OIDC_STATE_COOKIE,
  OIDC_VERIFIER_COOKIE,
} from "@/lib/google-oidc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!googleOidcConfigured()) {
    return NextResponse.redirect(new URL("/login?oidc=unavailable", req.nextUrl.origin));
  }

  const { state, nonce, verifier, challenge } = createOidcTransaction();
  const callback = new URL("/api/auth/oidc/callback", req.nextUrl.origin);
  const authorize = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorize.searchParams.set("client_id", process.env.DOC_GOOGLE_CLIENT_ID!.trim());
  authorize.searchParams.set("redirect_uri", callback.toString());
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", "openid email profile");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("nonce", nonce);
  authorize.searchParams.set("code_challenge", challenge);
  authorize.searchParams.set("code_challenge_method", "S256");
  authorize.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authorize);
  response.headers.set("Cache-Control", "no-store");
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
  };
  response.cookies.set(OIDC_STATE_COOKIE, state, cookieOptions);
  response.cookies.set(OIDC_NONCE_COOKIE, nonce, cookieOptions);
  response.cookies.set(OIDC_VERIFIER_COOKIE, verifier, cookieOptions);
  return response;
}
