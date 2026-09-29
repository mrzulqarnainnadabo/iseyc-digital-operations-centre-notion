import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "iseyc_doc_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function configuredKey(): string | null {
  const key = process.env.ISEYC_STAFF_KEY?.trim();
  return key ? key : null;
}

export function staffKeyConfigured(): boolean {
  return Boolean(configuredKey());
}

export function isValidStaffKey(key: string | null | undefined): boolean {
  const expected = configuredKey();
  if (!expected || !key) return false;
  const actual = Buffer.from(key);
  const reference = Buffer.from(expected);
  return actual.length === reference.length && timingSafeEqual(actual, reference);
}

export function signSession(key: string): string {
  const secret = configuredKey();
  if (!secret) throw new Error("ISEYC_STAFF_KEY is not configured");
  const sig = createHmac("sha256", secret).update(`doc:${key}`).digest("hex");
  return `${Buffer.from(key).toString("base64url")}.${sig}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  const secret = configuredKey();
  if (!token || !secret) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  try {
    const key = Buffer.from(payload, "base64url").toString("utf8");
    if (!isValidStaffKey(key)) return false;
    const expected = createHmac("sha256", secret).update(`doc:${key}`).digest("hex");
    const actual = Buffer.from(sig);
    const reference = Buffer.from(expected);
    return actual.length === reference.length && timingSafeEqual(actual, reference);
  } catch {
    return false;
  }
}

export async function requireStaffSession(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(COOKIE)?.value);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export { COOKIE as SESSION_COOKIE };
