import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "iseyc_doc_session";

export function staffKeyConfigured(): boolean {
  return Boolean(process.env.ISEYC_STAFF_KEY?.trim());
}

export function isValidStaffKey(key: string | null | undefined): boolean {
  const expected = process.env.ISEYC_STAFF_KEY?.trim();
  if (!expected || !key) return false;
  try {
    const a = Buffer.from(key);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function signSession(key: string): string {
  const secret = process.env.ISEYC_STAFF_KEY || "doc";
  const sig = createHmac("sha256", secret).update(`doc:${key}`).digest("hex");
  return `${Buffer.from(key).toString("base64url")}.${sig}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token || !staffKeyConfigured()) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  try {
    const key = Buffer.from(payload, "base64url").toString("utf8");
    if (!isValidStaffKey(key)) return false;
    const expected = createHmac("sha256", process.env.ISEYC_STAFF_KEY!)
      .update(`doc:${key}`)
      .digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function requireStaffSession(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(COOKIE)?.value);
}

export { COOKIE as SESSION_COOKIE };
