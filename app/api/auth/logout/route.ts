import { NextRequest, NextResponse } from "next/server";
import { privateJson } from "@/lib/private-response";
import { SESSION_COOKIE, SESSION_COOKIE_PATH } from "@/lib/auth";
import { OIDC_NONCE_COOKIE, OIDC_STATE_COOKIE, OIDC_VERIFIER_COOKIE, PENDING_IDENTITY_COOKIE } from "@/lib/google-oidc";
import { isSameOriginRequest } from "@/lib/request-security";

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return privateJson({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const res = privateJson({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: SESSION_COOKIE_PATH,
    maxAge: 0,
  });
  for (const name of [OIDC_STATE_COOKIE, OIDC_NONCE_COOKIE, OIDC_VERIFIER_COOKIE]) {
    res.cookies.set(name, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/oidc",
      maxAge: 0,
    });
  }
  res.cookies.set(PENDING_IDENTITY_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/ops",
    maxAge: 0,
  });
  return res;
}
