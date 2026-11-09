import { NextRequest } from "next/server";
import { privateJson } from "@/lib/private-response";
import { requireStaffSession } from "@/lib/auth";
import { isSameOriginRequest, readBoundedJson } from "@/lib/request-security";
import { createRegisterDraft, isRegisterKind, listRegister, registerConfigured } from "@/lib/notion-registers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ kind: string }> };

export async function GET(_request: NextRequest, context: Context) {
  if (!(await requireStaffSession())) return privateJson({ ok: false, error: "Unauthorized" }, { status: 401 });
  const { kind } = await context.params;
  if (!isRegisterKind(kind)) return privateJson({ ok: false, error: "Unknown register." }, { status: 404 });
  if (!registerConfigured(kind)) return privateJson({ ok: false, error: "Register is not configured. No records are shown." }, { status: 503 });
  try { return privateJson({ ok: true, records: await listRegister(kind), source: "notion", pageSize: 50, scope: "first page only" }); }
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
  const allowed = kind === "media" ? ["title", "detail", "channel"] : ["title", "detail", "date"];
  if (Object.keys(input).some((key) => !allowed.includes(key))) return privateJson({ ok: false, error: "Unexpected fields." }, { status: 400 });
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const detail = typeof input.detail === "string" ? input.detail.trim() : "";
  const date = typeof input.date === "string" ? input.date : "";
  const channel = typeof input.channel === "string" ? input.channel : "";
  if (title.length < 3 || title.length > 180 || detail.length > 1800) return privateJson({ ok: false, error: "Provide a title (3–180 characters) and detail up to 1,800 characters." }, { status: 400 });
  if (date && (!/^\\d{4}-\\d{2}-\\d{2}$/.test(date) || Number.isNaN(Date.parse(date + "T00:00:00.000Z")) || new Date(date + "T00:00:00.000Z").toISOString().slice(0, 10) !== date)) return privateJson({ ok: false, error: "Date must be a valid calendar date in YYYY-MM-DD format." }, { status: 400 });
  if (kind === "media" && !["X", "WhatsApp", "Website", "Other"].includes(channel)) return privateJson({ ok: false, error: "Choose a valid communications channel." }, { status: 400 });
  try {
    const created = await createRegisterDraft(kind, { title, detail, date, channel });
    return privateJson({ ok: true, created, status: kind === "actions" ? "Open" : kind === "media" ? "Draft" : "Scheduled" }, { status: 201 });
  } catch { return privateJson({ ok: false, error: "The record could not be saved to Notion. Check the integration's database access and schema." }, { status: 502 }); }
}
