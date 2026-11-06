import { NextRequest, NextResponse } from "next/server";
import { requireStaffSession } from "@/lib/auth";
import { isSameOriginRequest } from "@/lib/request-security";
import { createMeeting, listMeetings } from "@/lib/notion";
import { legacySessionCanCreateMeeting, legacySessionCanReadMeeting } from "@/lib/legacy-session-boundary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireStaffSession())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const meetings = (await listMeetings()).filter((meeting) =>
      legacySessionCanReadMeeting(meeting.sensitivity)
    );
    return NextResponse.json({ ok: true, meetings });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to retrieve meetings." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  if (!(await requireStaffSession())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    title?: string;
    conveningBody?: string;
    meetingDate?: string;
    summary?: string;
    sensitivity?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const title = (typeof body.title === "string" ? body.title : "").trim();
  if (title.length < 5) {
    return NextResponse.json(
      { ok: false, error: "Title must be at least 5 characters." },
      { status: 400 }
    );
  }

  const sensitivity = body.sensitivity === "Restricted" ? "Restricted" : "Standard";
  if (!legacySessionCanCreateMeeting(sensitivity)) {
    return NextResponse.json(
      { ok: false, error: "Restricted meeting intake requires individually authorised officer access." },
      { status: 403 }
    );
  }

  try {
    const created = await createMeeting({
      title,
      conveningBody: (body.conveningBody || "").trim(),
      meetingDate: (body.meetingDate || "").trim(),
      summary: (body.summary || "").trim(),
      sensitivity,
    });
    return NextResponse.json({ ok: true, id: created.id });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unable to create meeting." },
      { status: 500 }
    );
  }
}
