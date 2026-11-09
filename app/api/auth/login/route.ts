import { NextRequest, NextResponse } from "next/server";
import { privateJson } from "@/lib/private-response";
import {
  isValidStaffKey,
  SESSION_COOKIE,
  SESSION_COOKIE_PATH,
  signSession,
  staffKeyConfigured,
} from "@/lib/auth";
import { isSameOriginRequest, readBoundedJson } from "@/lib/request-security";
import { readStaffKeyInput } from "@/lib/login-input";
import { clearLoginFailures, isLoginRateLimited, recordLoginFailure } from "@/lib/login-rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return privateJson({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  // Vercel supplies x-real-ip at the trusted edge. Never trust arbitrary
  // x-forwarded-for values from the request when identifying a login client.
  const clientIp = req.headers.get("x-real-ip")?.trim().slice(0, 64) || "unknown";
  if (isLoginRateLimited(clientIp)) {
    return privateJson(
      { ok: false, error: "Too many sign-in attempts. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": "900" } }
    );
  }

  if (!staffKeyConfigured()) {
    return privateJson(
      { ok: false, error: "Sign-in is temporarily unavailable." },
      { status: 503 }
    );
  }

  const parsed = await readBoundedJson(req, 2_048);
  if (!parsed.ok) {
    const status = parsed.reason === "too_large" ? 413 : parsed.reason === "content_type" ? 415 : 400;
    return privateJson({ ok: false, error: "Invalid sign-in request." }, { status });
  }

  const key = readStaffKeyInput(parsed.value);
  if (!key || !isValidStaffKey(key)) {
    recordLoginFailure(clientIp);
    return privateJson({ ok: false, error: "Invalid staff key" }, { status: 401 });
  }

  clearLoginFailures(clientIp);

  const res = privateJson({ ok: true });
  res.cookies.set(SESSION_COOKIE, signSession(key), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: SESSION_COOKIE_PATH,
    maxAge: 60 * 60 * 12,
  });
  return res;
}
