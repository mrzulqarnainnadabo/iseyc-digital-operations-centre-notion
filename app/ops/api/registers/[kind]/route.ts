import { NextRequest } from "next/server";
import { privateJson } from "@/lib/private-response";
import { requireStaffSession } from "@/lib/auth";
import { isSameOriginRequest, readBoundedJson } from "@/lib/request-security";
import { createRegisterDraft, isRegisterKind, listRegister, registerConfigured } from "@/lib/notion-registers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ kind: string }> };

export async function GET(request: NextRequest, context: Context) {
  if (!(await requireStaffSession())) return privateJson({ ok: false, error: "Unauthorized" }, { status: 401 });
  const { kind } = await context.params;
  if (!isRegisterKind(kind)) return privateJson({ ok: false, error: "Unknown register." }, { status: 404 });
  if (!registerConfigured(kind)) return privateJson({ ok: false, error: "Register is not configured. No records are shown." }, { status: 503 });
  const cursor = new URL(request.url).searchParams.get("cursor") || undefined;
  if (cursor && (!/^[a-f0-9-]{32,36}$/i.test(cursor))) {
    return privateJson({ ok: false, error: "Invalid pagination cursor." }, { status: 400 });
  }
  try {
    const page = await listRegister(kind, cursor);
    return privateJson({ ok: true, records: page.rows, nextCursor: page.nextCursor, hasMore: page.hasMore, pageSize: 50, source: "notion" });
  }
  catch { return privateJson({ ok: false, error: "The Notion register could not be reached. No cached or estimated records are shown." }, { status: 502 }); }
}
export async function POST(request: NextRequest, context: Context) {
  if (!isSameOriginRequest(request)) return privateJson({ ok: false, error: "Forbidden" }, { status: 403 });
  if (!(await requireStaffSession())) return privateJson({ ok: false, error: "Unauthorized" }, { status: 401 });
  const { kind } = await context.params;
  if (!isRegisterKind(kind)) return privateJson({ ok: false, error: "Unknown register." }, { status: 404 });
  if (!registerConfigured(kind)) return privateJson({ ok: false, error: "Register is not configured." }, { status: 503 });
  const parsed = await readBoundedJson(request, 8192);
  if (!parsed.ok) {
    const status = parsed.reason === "too_large" ? 413 : parsed.reason === "content_type" ? 415 : 400;
    return privateJson({ ok: false, error: "Invalid register request." }, { status });
  }
  const body = parsed.value;
  if (!body || typeof body !== "object" || Array.isArray(body)) return privateJson({ ok: false, error: "Invalid request body." }, { status: 400 });
  const input = body as Record<string, unknown>;
  const allowed = kind === "media" ? ["title", "detail", "channel"] : kind === "actions" ? ["title", "detail", "date", "department", "priority", "expectedEvidence", "blocker", "notes", "sourceMeetingId"] : ["title", "detail", "date", "purpose", "chairRole", "secretaryRole", "agenda", "attendanceBasis", "decisionItems", "draftMinutes", "decisionOutcome"];
  if (Object.keys(input).some((key) => !allowed.includes(key))) return privateJson({ ok: false, error: "Unexpected fields." }, { status: 400 });
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const detail = typeof input.detail === "string" ? input.detail.trim() : "";
  const date = typeof input.date === "string" ? input.date : "";
  const channel = typeof input.channel === "string" ? input.channel : "";
  const department = typeof input.department === "string" ? input.department : "";
  const priority = typeof input.priority === "string" ? input.priority : "";
  const expectedEvidence = typeof input.expectedEvidence === "string" ? input.expectedEvidence.trim() : "";
  const blocker = typeof input.blocker === "string" ? input.blocker.trim() : "";
  const notes = typeof input.notes === "string" ? input.notes.trim() : "";
  const sourceMeetingId = typeof input.sourceMeetingId === "string" ? input.sourceMeetingId.trim() : "";
  const purpose = typeof input.purpose === "string" ? input.purpose.trim() : "";
  const chairRole = typeof input.chairRole === "string" ? input.chairRole.trim() : "";
  const secretaryRole = typeof input.secretaryRole === "string" ? input.secretaryRole.trim() : "";
  const agenda = typeof input.agenda === "string" ? input.agenda.trim() : "";
  const attendanceBasis = typeof input.attendanceBasis === "string" ? input.attendanceBasis.trim() : "";
  const decisionItems = typeof input.decisionItems === "string" ? input.decisionItems.trim() : "";
  const draftMinutes = typeof input.draftMinutes === "string" ? input.draftMinutes.trim() : "";
  const decisionOutcome = typeof input.decisionOutcome === "string" ? input.decisionOutcome.trim() : "";
  if (title.length < 3 || title.length > 180 || detail.length > 1800) return privateJson({ ok: false, error: "Provide a title (3–180 characters) and detail up to 1,800 characters." }, { status: 400 });
  if (kind === "chamber" && [purpose, chairRole, secretaryRole, agenda, attendanceBasis, decisionItems, draftMinutes, decisionOutcome].some((value) => value.length > 1800)) return privateJson({ ok: false, error: "Chamber session details exceed the allowed length." }, { status: 400 });
  if (kind === "actions") {
    const departments = ["Executive", "Education", "Health", "Digital Systems", "Civic Affairs", "Institution-wide"];
    const priorities = ["Urgent", "High", "Normal", "Low"];
    if (department && !departments.includes(department)) return privateJson({ ok: false, error: "Choose a valid department." }, { status: 400 });
    if (priority && !priorities.includes(priority)) return privateJson({ ok: false, error: "Choose a valid priority." }, { status: 400 });
    if (expectedEvidence.length > 500 || blocker.length > 500 || notes.length > 1000) return privateJson({ ok: false, error: "Action evidence, blocker or notes exceed the allowed length." }, { status: 400 });
    if (sourceMeetingId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sourceMeetingId)) return privateJson({ ok: false, error: "Choose a valid source meeting." }, { status: 400 });
  }
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date + "T00:00:00.000Z")) || new Date(date + "T00:00:00.000Z").toISOString().slice(0, 10) !== date)) return privateJson({ ok: false, error: "Date must be a valid calendar date in YYYY-MM-DD format." }, { status: 400 });
  if ((kind === "actions" || kind === "chamber") && !date) return privateJson({ ok: false, error: kind === "actions" ? "An accountable owner and due date are required for every action." : "A session date is required before scheduling a Chamber session." }, { status: 400 });
  if (kind === "actions" && detail.length < 2) return privateJson({ ok: false, error: "Enter the responsible officer role for this action." }, { status: 400 });
  if (kind === "media" && !["X", "WhatsApp", "Website", "Other"].includes(channel)) return privateJson({ ok: false, error: "Choose a valid communications channel." }, { status: 400 });
  try {
    const created = await createRegisterDraft(kind, { title, detail, date, channel, department, priority, expectedEvidence, blocker, notes, sourceMeetingId, purpose, chairRole, secretaryRole, agenda, attendanceBasis, decisionItems, draftMinutes, decisionOutcome });
    return privateJson({ ok: true, created, status: kind === "actions" ? "Open" : kind === "media" ? "Draft" : "Scheduled" }, { status: 201 });
  } catch { return privateJson({ ok: false, error: "The record could not be saved to Notion. Check the integration's database access and schema." }, { status: 502 }); }
}
