import { NextRequest, NextResponse } from "next/server";
import { requireStaffSession } from "@/lib/auth";
import { createRegisterDraft, isRegisterKind, listRegister, registerConfigured } from "@/lib/notion-registers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ kind: string }> };

export async function GET(_request: NextRequest, context: Context) {
  if (!(await requireStaffSession())) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { kind } = await context.params;
  if (!isRegisterKind(kind)) return NextResponse.json({ error: "Unknown register." }, { status: 404 });
  if (!registerConfigured(kind)) return NextResponse.json({ error: "Register is not configured. No records are shown." }, { status: 503 });
  try { return NextResponse.json({ records: await listRegister(kind), source: "notion", pageSize: 50 }); }
  catch { return NextResponse.json({ error: "The Notion register could not be reached. No cached or estimated records are shown." }, { status: 502 }); }
}
export async function POST(request: NextRequest, context: Context) {
  if (!(await requireStaffSession())) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { kind } = await context.params;
  if (!isRegisterKind(kind)) return NextResponse.json({ error: "Unknown register." }, { status: 404 });
  if (!registerConfigured(kind)) return NextResponse.json({ error: "Register is not configured." }, { status: 503 });
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "A valid JSON body is required." }, { status: 400 }); }
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const detail = typeof body?.detail === "string" ? body.detail.trim() : "";
  const date = typeof body?.date === "string" ? body.date : "";
  const channel = typeof body?.channel === "string" ? body.channel : "";
  if (!title || title.length > 180 || detail.length > 1800) return NextResponse.json({ error: "Provide a title (1–180 characters) and detail up to 1,800 characters." }, { status: 400 });
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "Date must use YYYY-MM-DD." }, { status: 400 });
  if (kind === "media" && channel && !["X", "WhatsApp", "Website", "Other"].includes(channel)) return NextResponse.json({ error: "Choose a valid communications channel." }, { status: 400 });
  try {
    const created = await createRegisterDraft(kind, { title, detail, date, channel });
    return NextResponse.json({ created, status: kind === "actions" ? "Open" : kind === "media" ? "Draft" : "Scheduled" }, { status: 201 });
  } catch { return NextResponse.json({ error: "The record could not be saved to Notion. Check the integration's database access and schema." }, { status: 502 }); }
}
