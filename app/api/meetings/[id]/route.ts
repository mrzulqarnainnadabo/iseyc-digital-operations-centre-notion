import { NextRequest, NextResponse } from "next/server";
import { requireStaffSession } from "@/lib/auth";
import { isSameOriginRequest } from "@/lib/request-security";
import { getMeeting, setMeetingStatus } from "@/lib/notion";
import { legacySessionCanReadMeeting, legacySessionCanSetMeetingStatus } from "@/lib/legacy-session-boundary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await requireStaffSession())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await ctx.params;
    const meeting = await getMeeting(id);
    if (!meeting || !legacySessionCanReadMeeting(meeting.sensitivity)) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, meeting });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to retrieve meeting." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  if (!(await requireStaffSession())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  const allowed = ["In review", "Approved", "Archived", "Draft"] as const;
  if (!allowed.includes(input.status as (typeof allowed)[number])) {
    return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 });
  }

  if (!legacySessionCanSetMeetingStatus(input.status)) {
    return NextResponse.json(
      { ok: false, error: "Approval requires individually authorised officer access." },
      { status: 403 }
    );
  }

  try {
    const { id } = await ctx.params;
    const existing = await getMeeting(id);
    if (!existing || !legacySessionCanReadMeeting(existing.sensitivity)) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    await setMeetingStatus(id, input.status as (typeof allowed)[number]);
    const meeting = await getMeeting(id);
    if (!meeting || !legacySessionCanReadMeeting(meeting.sensitivity)) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, meeting });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to update meeting." },
      { status: 500 }
    );
  }
}
