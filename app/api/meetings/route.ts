import { NextRequest } from "next/server";
import { privateJson } from "@/lib/private-response";
import { requireStaffSession } from "@/lib/auth";
import { isSameOriginRequest, readBoundedJson } from "@/lib/request-security";
import { createMeeting, listMeetings } from "@/lib/notion";
import { legacySessionCanCreateMeeting, legacySessionCanReadMeeting } from "@/lib/legacy-session-boundary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireStaffSession())) {
    return privateJson({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const meetings = (await listMeetings()).filter((meeting) =>
      legacySessionCanReadMeeting(meeting.sensitivity)
    );
    return privateJson({ ok: true, meetings });
  } catch {
    return privateJson(
      { ok: false, error: "Unable to retrieve meetings." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return privateJson({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  if (!(await requireStaffSession())) {
    return privateJson({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await readBoundedJson(req, 16_384);
  if (!parsed.ok) {
    const status = parsed.reason === "too_large" ? 413 : parsed.reason === "content_type" ? 415 : 400;
    return privateJson({ ok: false, error: "Invalid meeting request." }, { status });
  }
  const body = parsed.value;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return privateJson({ ok: false, error: "Invalid request body" }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  const asText = (value: unknown) => typeof value === "string" ? value.trim() : "";
  const title = asText(input.title);
  if (title.length < 5) {
    return privateJson(
      { ok: false, error: "Title must be at least 5 characters." },
      { status: 400 }
    );
  }

  // Do not coerce missing or unknown values to Standard: that would let a
  // malformed client request bypass the restricted-intake boundary.
  if (input.sensitivity !== "Standard") {
    return privateJson(
      { ok: false, error: "Legacy staff access may create Standard meetings only. Explicit Standard sensitivity is required." },
      { status: 403 }
    );
  }
  const sensitivity = "Standard";
  if (!legacySessionCanCreateMeeting(sensitivity)) {
    return privateJson(
      { ok: false, error: "Meeting intake is unavailable for this session." },
      { status: 403 }
    );
  }

  try {
    const created = await createMeeting({
      title,
      conveningBody: asText(input.conveningBody),
      meetingDate: asText(input.meetingDate),
      summary: asText(input.summary),
      sensitivity,
    });
    return privateJson({ ok: true, id: created.id });
  } catch {
    return privateJson(
      { ok: false, error: "Unable to create meeting." },
      { status: 500 }
    );
  }
}
