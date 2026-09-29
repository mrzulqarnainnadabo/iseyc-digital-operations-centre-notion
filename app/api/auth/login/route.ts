import { NextRequest, NextResponse } from "next/server";
import { isValidStaffKey, SESSION_COOKIE, signSession, staffKeyConfigured, sessionCookieOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!staffKeyConfigured()) {
    return NextResponse.json({ ok: false, error: "Staff sign-in is not configured on the server.", data: null }, { status: 503 });
  }
  let body: { key?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body.", data: null }, { status: 400 });
  }
  const key = (body.key || "").trim();
  if (!isValidStaffKey(key)) {
    return NextResponse.json({ ok: false, error: "Invalid staff key.", data: null }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true, error: null, data: null });
  res.cookies.set(SESSION_COOKIE, signSession(key), sessionCookieOptions());
  return res;
}
