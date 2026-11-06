import { NextRequest } from "next/server";
import { privateJson } from "@/lib/private-response";
import { requireStaffSession } from "@/lib/auth";
import { isSameOriginRequest, readBoundedJson } from "@/lib/request-security";
import { getMeeting, setMeetingStatus } from "@/lib/notion";
import { legacySessionCanReadMeeting, legacySessionCanSetMeetingStatus } from "@/lib/legacy-session-boundary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  if (!(await requireStaffSession())) {
    return privateJson({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

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

  if (!(await requireStaffSession())) {
    return privateJson({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

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
  if (Object.keys(input).some((key) => key !== "status")) {
    return privateJson({ ok: false, error: "Unexpected meeting update fields." }, { status: 400 });
  }
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
    const { id } = await ctx.params;
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
    return privateJson(
      { ok: false, error: "Unable to update meeting." },
      { status: 500 }
    );
  }
}
