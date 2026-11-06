import { createRemoteJWKSet, jwtVerify } from "jose";
import { safeEqual } from "@/lib/oidc-primitives";
export {
  OIDC_STATE_COOKIE,
  OIDC_NONCE_COOKIE,
  OIDC_VERIFIER_COOKIE,
  PENDING_IDENTITY_COOKIE,
  googleOidcConfigured,
  createOidcTransaction,
  safeEqual,
  signPendingIdentity,
  verifyPendingIdentity,
} from "@/lib/oidc-primitives";

const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export async function verifyGoogleIdToken(
  token: string,
  expectedNonce: string
): Promise<{ subject: string }> {
  const clientId = process.env.DOC_GOOGLE_CLIENT_ID?.trim();
  if (!clientId) throw new Error("Google identity is not configured");

  const { payload } = await jwtVerify(token, GOOGLE_JWKS, {
    issuer: GOOGLE_ISSUERS,
    audience: clientId,
    requiredClaims: ["sub", "iss", "aud", "exp", "iat", "nonce", "email", "email_verified"],
    clockTolerance: 5,
  });

  if (
    typeof payload.sub !== "string" ||
    !payload.sub ||
    typeof payload.nonce !== "string" ||
    !safeEqual(payload.nonce, expectedNonce) ||
    payload.email_verified !== true ||
    typeof payload.email !== "string" ||
    !payload.email.includes("@")
  ) {
    throw new Error("Google identity claims are incomplete or unverified");
  }

  return { subject: payload.sub };
}
