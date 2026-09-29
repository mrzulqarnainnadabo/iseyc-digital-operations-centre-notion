import { NextRequest, NextResponse } from "next/server";
import { requireStaffSession } from "@/lib/auth";
import { getMeeting, setMeetingStatus, NotionConfigError, MeetingStatus } from "@/lib/notion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRANSITIONS = {
  New: ["Draft", "In review", "Archived"],
  Draft: ["In review", "Archived"],
  "In review": ["Approved", "Archived"],
  Approved: ["Archived"],
  Archived: [],
} as const;

function errorResponse(error: unknown, fallback: string) {
  if (error instanceof NotionConfigError) return NextResponse.json({ ok: false, error: error.message, data: null }, { status: 503 });
  return NextResponse.json({ ok: false, error: fallback, data: null }, { status: 500 });
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireStaffSession())) return NextResponse.json({ ok: false, error: "Unauthorized.", data: null }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const meeting = await getMeeting(id);
    if (!meeting) return NextResponse.json({ ok: false, error: "Meeting record not found.", data: null }, { status: 404 });
    return NextResponse.json({ ok: true, error: null, data: meeting });
  } catch (error) { return errorResponse(error, "Could not load the meeting record."); }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireStaffSession())) return NextResponse.json({ ok: false, error: "Unauthorized.", data: null }, { status: 401 });
  const { id } = await ctx.params;
  let body: { status?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body.", data: null }, { status: 400 });
  }
  const requested = body.status;
  const allowedStatuses = ["Draft", "In review", "Approved", "Archived"] as const;
  if (typeof requested !== "string" || !allowedStatuses.includes(requested as typeof allowedStatuses[number])) {
    return NextResponse.json({ ok: false, error: "Invalid meeting status.", data: null }, { status: 400 });
  }
  try {
    const current = await getMeeting(id);
    if (!current) return NextResponse.json({ ok: false, error: "Meeting record not found.", data: null }, { status: 404 });
    if (!(TRANSITIONS[current.status] as readonly string[]).includes(requested)) {
      return NextResponse.json({ ok: false, error: `Cannot move a ${current.status} record to ${requested}.`, data: null }, { status: 400 });
    }
    await setMeetingStatus(id, requested as Exclude<MeetingStatus, "New">);
    return NextResponse.json({ ok: true, error: null, data: await getMeeting(id) });
  } catch (error) { return errorResponse(error, "Could not update the meeting record."); }
}
