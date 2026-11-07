import { NextRequest } from "next/server";
import { GET as getMeeting, PATCH as updateMeeting } from "../../../../api/meetings/[id]/route";

type Context = { params: Promise<{ id: string }> };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, context: Context) {
  return getMeeting(req, context);
}

export async function PATCH(req: NextRequest, context: Context) {
  return updateMeeting(req, context);
}
