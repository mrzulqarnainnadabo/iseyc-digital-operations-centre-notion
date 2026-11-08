import { NextRequest } from "next/server";
import { GET as getMeetings, POST as createMeeting } from "../../../api/meetings/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return getMeetings(req);
}

export async function POST(req: NextRequest) {
  return createMeeting(req);
}
