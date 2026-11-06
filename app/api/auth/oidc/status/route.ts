import { NextRequest } from "next/server";
import { privateJson } from "@/lib/private-response";
import { PENDING_IDENTITY_COOKIE, verifyPendingIdentity } from "@/lib/google-oidc";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const identityVerified = verifyPendingIdentity(req.cookies.get(PENDING_IDENTITY_COOKIE)?.value);
  return privateJson({
    identityVerified,
    accessGranted: false,
    message: identityVerified
      ? "Google identity verified. ISEYC membership and appointment authorisation are not connected; command access remains restricted."
      : "No verified Google identity is present.",
  });
}
