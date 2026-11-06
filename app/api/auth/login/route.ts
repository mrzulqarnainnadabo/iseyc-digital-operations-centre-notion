import { NextRequest, NextResponse } from "next/server";
import {
  isValidStaffKey,
  SESSION_COOKIE,
  signSession,
  staffKeyConfigured,
} from "@/lib/auth";
import { isSameOriginRequest } from "@/lib/request-security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  if (!staffKeyConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Sign-in is temporarily unavailable." },
      { status: 503 }
    );
  }

  let body: { key?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const key = (body.key || "").trim();
  if (!isValidStaffKey(key)) {
    return NextResponse.json({ ok: false, error: "Invalid staff key" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, signSession(key), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
