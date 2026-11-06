import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "iseyc_doc_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

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

/**
 * Issue a short-lived signed session token without embedding the staff key
 * in the cookie payload. This remains a shared-key gate, not user identity.
 */
export function signSession(key: string): string {
  if (!isValidStaffKey(key)) throw new Error("Invalid staff key");

  const issuedAt = Math.floor(Date.now() / 1000);
  const nonce = randomBytes(16).toString("base64url");
  const payload = `${issuedAt}.${nonce}`;
  const signature = createHmac("sha256", key)
    .update(`doc-session:${payload}`)
    .digest("hex");

  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token || !staffKeyConfigured()) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [issuedAtText, nonce, signature] = parts;
  // signSession always emits a 16-byte base64url nonce (22 chars) and a
  // lowercase SHA-256 HMAC hex digest (64 chars). Reject alternate or
  // oversized encodings before doing cryptographic work.
  if (!/^\\d{1,12}$/.test(issuedAtText) ||
      !/^[A-Za-z0-9_-]{22}$/.test(nonce) ||
      !/^[a-f0-9]{64}$/.test(signature)) return false;

  const issuedAt = Number(issuedAtText);
  if (!Number.isSafeInteger(issuedAt)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (issuedAt > now + 60 || now - issuedAt > SESSION_TTL_SECONDS) return false;

  const secret = process.env.ISEYC_STAFF_KEY?.trim();
  if (!secret) return false;

  try {
    const expected = createHmac("sha256", secret)
      .update(`doc-session:${issuedAtText}.${nonce}`)
      .digest("hex");
    const a = Buffer.from(signature);
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
