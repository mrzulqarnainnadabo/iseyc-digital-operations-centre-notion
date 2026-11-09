import { NextRequest } from "next/server";
import { GET as checkConnection } from "../../../../api/department-applications/connection/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return checkConnection(req);
}
