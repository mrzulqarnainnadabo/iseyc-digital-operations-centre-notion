import { NextRequest, NextResponse } from "next/server";
import { requireStaffSession } from "@/lib/auth";
import { getMeeting, setMeetingStatus } from "@/lib/notion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await requireStaffSession())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const meeting = await getMeeting(id);
  if (!meeting) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, meeting });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await requireStaffSession())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const allowed = ["In review", "Approved", "Archived", "Draft"] as const;
  if (!allowed.includes(body.status as (typeof allowed)[number])) {
    return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 });
  }
  try {
    await setMeetingStatus(id, body.status as (typeof allowed)[number]);
    const meeting = await getMeeting(id);
    return NextResponse.json({ ok: true, meeting });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
