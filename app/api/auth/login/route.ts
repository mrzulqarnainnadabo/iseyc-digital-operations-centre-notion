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

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return privateJson({ ok: false, error: "Forbidden" }, { status: 403 });
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
    return privateJson({ ok: false, error: "Invalid staff key" }, { status: 401 });
  }

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
