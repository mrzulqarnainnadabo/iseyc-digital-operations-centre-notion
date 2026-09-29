import { NextRequest, NextResponse } from "next/server";
import { requireStaffSession } from "@/lib/auth";
import { createMeeting, listMeetings, NotionConfigError } from "@/lib/notion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(error: unknown, fallback: string) {
  if (error instanceof NotionConfigError) {
    return NextResponse.json({ ok: false, error: error.message, data: null }, { status: 503 });
  }
  return NextResponse.json({ ok: false, error: fallback, data: null }, { status: 500 });
}

export async function GET() {
  if (!(await requireStaffSession())) return NextResponse.json({ ok: false, error: "Unauthorized.", data: null }, { status: 401 });
  try {
    const meetings = await listMeetings();
    return NextResponse.json({ ok: true, error: null, data: meetings });
  } catch (error) {
    return errorResponse(error, "Could not load the meeting queue.");
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireStaffSession())) return NextResponse.json({ ok: false, error: "Unauthorized.", data: null }, { status: 401 });
  let body: { title?: string; conveningBody?: string; meetingDate?: string; summary?: string; sensitivity?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body.", data: null }, { status: 400 });
  }
  const title = (body.title || "").trim();
  if (title.length < 5) {
    return NextResponse.json({ ok: false, error: "Meeting title must be at least 5 characters.", data: null }, { status: 400 });
  }
  try {
    const created = await createMeeting({
      title,
      conveningBody: (body.conveningBody || "").trim(),
      meetingDate: (body.meetingDate || "").trim(),
      summary: (body.summary || "").trim(),
      sensitivity: body.sensitivity === "Restricted" ? "Restricted" : "Standard",
    });
    return NextResponse.json({ ok: true, error: null, data: { id: created.id } });
  } catch (error) {
    return errorResponse(error, "Could not create the meeting.");
  }
}
