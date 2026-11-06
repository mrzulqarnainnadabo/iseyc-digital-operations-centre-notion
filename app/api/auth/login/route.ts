import { NextRequest, NextResponse } from "next/server";
import { privateJson } from "@/lib/private-response";
import {
  isValidStaffKey,
  SESSION_COOKIE,
  signSession,
  staffKeyConfigured,
} from "@/lib/auth";
import { isSameOriginRequest } from "@/lib/request-security";
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return privateJson({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const key = readStaffKeyInput(body);
  if (!key || !isValidStaffKey(key)) {
    return privateJson({ ok: false, error: "Invalid staff key" }, { status: 401 });
  }

  const res = privateJson({ ok: true });
  res.cookies.set(SESSION_COOKIE, signSession(key), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
