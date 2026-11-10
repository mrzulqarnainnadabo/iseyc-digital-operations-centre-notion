import { NextRequest } from "next/server";
import { privateJson } from "@/lib/private-response";
import { requireStaffSession } from "@/lib/auth";
import { isSameOriginRequest, readBoundedJson } from "@/lib/request-security";
import { updateActionProgress, registerConfigured } from "@/lib/notion-registers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSameOriginRequest(request)) return privateJson({ ok: false, error: "Forbidden" }, { status: 403 });
  if (!(await requireStaffSession())) return privateJson({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!registerConfigured("actions")) return privateJson({ ok: false, error: "Action register is not configured." }, { status: 503 });

  const parsed = await readBoundedJson(request, 4096);
  if (!parsed.ok) {
    const status = parsed.reason === "too_large" ? 413 : parsed.reason === "content_type" ? 415 : 400;
    return privateJson({ ok: false, error: "Invalid action progress update." }, { status });
  }
  const body = parsed.value;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return privateJson({ ok: false, error: "Invalid request body." }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  const allowed = ["status", "progressUpdate", "blocker"];
  if (!Object.keys(input).length || Object.keys(input).some((key) => !allowed.includes(key))) {
    return privateJson({ ok: false, error: "Unexpected action update fields." }, { status: 400 });
  }
  if (input.status !== "In progress" && input.status !== "Blocked") {
    return privateJson({ ok: false, error: "Only In progress or Blocked can be self-reported here. Done and closure require a separate authorised review." }, { status: 400 });
  }
  if (typeof input.progressUpdate !== "string" || typeof input.blocker !== "string") {
    return privateJson({ ok: false, error: "Progress update and blocker fields must be text." }, { status: 400 });
  }
  const progressUpdate = input.progressUpdate.trim();
  const blocker = input.blocker.trim();
  if (!progressUpdate || (input.status === "Blocked" && !blocker)) {
    return privateJson({ ok: false, error: "A progress update is required, and a blocker reason is required for Blocked status." }, { status: 400 });
  }
  if (progressUpdate.length > 1000 || blocker.length > 500) {
    return privateJson({ ok: false, error: "Progress update or blocker exceeds the allowed length." }, { status: 400 });
  }

  try {
    const { id } = await context.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return privateJson({ ok: false, error: "Action record not found." }, { status: 404 });
    }
    await updateActionProgress(id, { status: input.status, progressUpdate, blocker });
    return privateJson({ ok: true, updated: true, status: input.status, selfReported: true });
  } catch {
    return privateJson({ ok: false, error: "The action could not be updated. It may be unavailable or no longer eligible for working-progress updates." }, { status: 409 });
  }
}
