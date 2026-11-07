import { NextRequest } from "next/server";
import { GET as getOidcStatus } from "../../../../../api/auth/oidc/status/route";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return getOidcStatus(req);
}
