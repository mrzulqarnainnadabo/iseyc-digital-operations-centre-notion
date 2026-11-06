import { NextRequest, NextResponse } from "next/server";
import { privateJson } from "@/lib/private-response";
import { SESSION_COOKIE } from "@/lib/auth";
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
    path: "/",
    maxAge: 0,
  });
  return res;
}
