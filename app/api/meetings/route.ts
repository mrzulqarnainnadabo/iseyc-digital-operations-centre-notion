import { NextRequest } from "next/server";
import { privateJson } from "@/lib/private-response";
import { requireStaffSession } from "@/lib/auth";
import { isSameOriginRequest, readBoundedJson } from "@/lib/request-security";
import { configFlags, createMeeting, listMeetings } from "@/lib/notion";
import { legacySessionCanCreateMeeting, legacySessionCanReadMeeting } from "@/lib/legacy-session-boundary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await requireStaffSession())) {
    return privateJson({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const flags = configFlags();
  if (!flags.token || !flags.meetings) {
    return privateJson(
      { ok: false, error: "The Notion Meetings source is not configured." },
      { status: 503 }
    );
  }

  const requestUrl = new URL(req.url);
  const cursor = requestUrl.searchParams.get("cursor") || undefined;
  if (cursor && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cursor)) {
    return privateJson({ ok: false, error: "Invalid page cursor." }, { status: 400 });
  }

  try {
    const page = await listMeetings({ cursor, pageSize: 25 });
    const meetings = page.meetings.filter((meeting) =>
      legacySessionCanReadMeeting(meeting.sensitivity)
    );
    return privateJson({
      ok: true,
      meetings,
      nextCursor: page.nextCursor,
    });
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
  const allowedFields = ["title", "conveningBody", "meetingDate", "summary", "sensitivity"];
  if (Object.keys(input).some((key) => !allowedFields.includes(key))) {
    return privateJson({ ok: false, error: "Unexpected meeting fields." }, { status: 400 });
  }

  const asText = (value: unknown) => typeof value === "string" ? value.trim() : "";
  const title = asText(input.title);
  const conveningBody = asText(input.conveningBody);
  const meetingDate = asText(input.meetingDate);
  const summary = asText(input.summary);
  if (title.length < 5 || title.length > 200) {
    return privateJson({ ok: false, error: "Meeting title must be between 5 and 200 characters." }, { status: 400 });
  }
  if (conveningBody.length > 200 || summary.length > 1900) {
    return privateJson({ ok: false, error: "Meeting details exceed the allowed length." }, { status: 400 });
  }
  if (meetingDate && (!/^\d{4}-\d{2}-\d{2}$/.test(meetingDate) ||
      Number.isNaN(Date.parse(`${meetingDate}T00:00:00.000Z`)) ||
      new Date(`${meetingDate}T00:00:00.000Z`).toISOString().slice(0, 10) !== meetingDate)) {
    return privateJson({ ok: false, error: "Meeting date must be a valid calendar date." }, { status: 400 });
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
      conveningBody,
      meetingDate,
      summary,
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
