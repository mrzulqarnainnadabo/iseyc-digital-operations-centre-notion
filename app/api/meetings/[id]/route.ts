import { NextRequest } from "next/server";
import { privateJson } from "@/lib/private-response";
import { requireCapability } from "@/lib/require-capability";
import { isSameOriginRequest, readBoundedJson } from "@/lib/request-security";
import { getMeeting, setMeetingStatus, updateMeetingDraft } from "@/lib/notion";
import { legacySessionCanReadMeeting, legacySessionCanSetMeetingStatus } from "@/lib/legacy-session-boundary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const access = await requireCapability("ops.browse");
  if (!access.ok) return access.response;

  try {
    const { id } = await ctx.params;
    const meeting = await getMeeting(id);
    if (!meeting || !legacySessionCanReadMeeting(meeting.sensitivity)) {
      return privateJson({ ok: false, error: "Not found" }, { status: 404 });
    }
    return privateJson({ ok: true, meeting });
  } catch {
    return privateJson(
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
    return privateJson({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const access = await requireCapability("ops.meeting.standard");
  if (!access.ok) return access.response;

  const parsed = await readBoundedJson(req, 8_192);
  if (!parsed.ok) {
    const status = parsed.reason === "too_large" ? 413 : parsed.reason === "content_type" ? 415 : 400;
    return privateJson({ ok: false, error: "Invalid meeting update request." }, { status });
  }
  const body = parsed.value;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return privateJson({ ok: false, error: "Invalid request body" }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  const { id } = await ctx.params;
  const keys = Object.keys(input);

  if (keys.length === 1 && keys[0] === "status") {
    const allowed = ["In review", "Approved", "Archived", "Draft"] as const;
    if (!allowed.includes(input.status as (typeof allowed)[number])) {
      return privateJson({ ok: false, error: "Invalid status" }, { status: 400 });
    }
    if (!legacySessionCanSetMeetingStatus(input.status)) {
      return privateJson(
        { ok: false, error: "Approval requires individually authorised officer access." },
        { status: 403 }
      );
    }
    try {
      const existing = await getMeeting(id);
      if (!existing || !legacySessionCanReadMeeting(existing.sensitivity)) {
        return privateJson({ ok: false, error: "Not found" }, { status: 404 });
      }
      await setMeetingStatus(id, input.status as (typeof allowed)[number]);
      const meeting = await getMeeting(id);
      if (!meeting || !legacySessionCanReadMeeting(meeting.sensitivity)) {
        return privateJson({ ok: false, error: "Not found" }, { status: 404 });
      }
      return privateJson({ ok: true, meeting });
    } catch {
      return privateJson({ ok: false, error: "Unable to update meeting." }, { status: 500 });
    }
  }

  const draftKeys = ["attendanceNotes", "draftMinutes", "outcomeSummary"];
  if (!keys.length || keys.some((key) => !draftKeys.includes(key))) {
    return privateJson({ ok: false, error: "Only draft attendance notes, draft minutes and draft outcome notes can be edited here." }, { status: 400 });
  }
  const draftInput: { attendanceNotes?: string; draftMinutes?: string; outcomeSummary?: string } = {};
  for (const key of draftKeys) {
    if (!(key in input)) continue;
    if (typeof input[key] !== "string") {
      return privateJson({ ok: false, error: "Draft meeting fields must be text." }, { status: 400 });
    }
    const value = (input[key] as string).trim();
    const max = key === "draftMinutes" ? 1900 : 1000;
    if (value.length > max) {
      return privateJson({ ok: false, error: "Draft meeting field exceeds the allowed length." }, { status: 400 });
    }
    draftInput[key as keyof typeof draftInput] = value;
  }

  try {
    const existing = await getMeeting(id);
    if (!existing || !legacySessionCanReadMeeting(existing.sensitivity)) {
      return privateJson({ ok: false, error: "Not found" }, { status: 404 });
    }
    await updateMeetingDraft(id, draftInput);
    const meeting = await getMeeting(id);
    if (!meeting || !legacySessionCanReadMeeting(meeting.sensitivity)) {
      return privateJson({ ok: false, error: "Not found" }, { status: 404 });
    }
    return privateJson({ ok: true, meeting, draftOnly: true });
  } catch {
    return privateJson({ ok: false, error: "Unable to save draft meeting notes." }, { status: 500 });
  }
}
