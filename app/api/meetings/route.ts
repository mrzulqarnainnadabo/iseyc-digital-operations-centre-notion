import { NextRequest, NextResponse } from "next/server";
import { requireStaffSession } from "@/lib/auth";
import { createMeeting, listMeetings } from "@/lib/notion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireStaffSession())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const meetings = await listMeetings();
    return NextResponse.json({ ok: true, meetings });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to list meetings";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
  const title = (body.title || "").trim();
  if (title.length < 5) {
    return NextResponse.json(
      { ok: false, error: "Title must be at least 5 characters." },
      { status: 400 }
    );
  }
  try {
    const created = await createMeeting({
      title,
      conveningBody: (body.conveningBody || "").trim(),
      meetingDate: (body.meetingDate || "").trim(),
      summary: (body.summary || "").trim(),
      sensitivity: body.sensitivity === "Restricted" ? "Restricted" : "Standard",
    });
    return NextResponse.json({ ok: true, id: created.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
