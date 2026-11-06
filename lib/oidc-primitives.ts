import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const OIDC_STATE_COOKIE = "iseyc_doc_oidc_state";
export const OIDC_NONCE_COOKIE = "iseyc_doc_oidc_nonce";
export const OIDC_VERIFIER_COOKIE = "iseyc_doc_oidc_verifier";
export const PENDING_IDENTITY_COOKIE = "iseyc_doc_identity_pending";
const PENDING_TTL_SECONDS = 15 * 60;

export function docAppOrigin(): string | null {
  const raw = process.env.DOC_APP_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (
      (process.env.NODE_ENV === "production" && url.protocol !== "https:") ||
      !["https:", "http:"].includes(url.protocol) ||
      url.username || url.password || url.pathname !== "/" || url.search || url.hash
    ) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function googleOidcConfigured(): boolean {
  return Boolean(
    docAppOrigin() &&
    process.env.DOC_GOOGLE_CLIENT_ID?.trim() &&
    process.env.DOC_GOOGLE_CLIENT_SECRET?.trim() &&
    process.env.DOC_SESSION_SECRET &&
    Buffer.byteLength(process.env.DOC_SESSION_SECRET) >= 32
  );
}

export function createOidcTransaction() {
  const state = randomBytes(32).toString("base64url");
  const nonce = randomBytes(32).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { state, nonce, verifier, challenge };
}

export function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Short-lived proof that Google verified an identity. This cookie is
 * deliberately NOT accepted by requireStaffSession and grants no DOC access.
 */
export function signPendingIdentity(subject: string): string {
  const secret = process.env.DOC_SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32 || !subject) {
    throw new Error("Pending identity signing is not configured");
  }
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    sub: subject,
    iat: issuedAt,
    exp: issuedAt + PENDING_TTL_SECONDS,
  })).toString("base64url");
  const signature = createHmac("sha256", secret).update(`doc-pending-identity:${payload}`).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyPendingIdentity(token: string | undefined): boolean {
  const secret = process.env.DOC_SESSION_SECRET;
  if (!token || !secret || Buffer.byteLength(secret) < 32) return false;
  const parts = token.split(".");
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]{43}$/.test(parts[1])) return false;
  const expected = createHmac("sha256", secret).update(`doc-pending-identity:${parts[0]}`).digest("base64url");
  if (!safeEqual(parts[1], expected)) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")) as {
      sub?: unknown; iat?: unknown; exp?: unknown;
    };
    const now = Math.floor(Date.now() / 1000);
    return typeof payload.sub === "string" && payload.sub.length > 0 &&
      Number.isSafeInteger(payload.iat) && Number.isSafeInteger(payload.exp) &&
      Number(payload.iat) <= now + 30 && Number(payload.exp) > now &&
      Number(payload.exp) - Number(payload.iat) <= PENDING_TTL_SECONDS;
  } catch {
    return false;
  }
}
