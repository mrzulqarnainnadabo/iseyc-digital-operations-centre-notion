import { NextRequest } from "next/server";
import { privateJson } from "@/lib/private-response";
import { requireStaffSession } from "@/lib/auth";
import { isSameOriginRequest, readBoundedJson } from "@/lib/request-security";
import { isOpsDepartmentId, type OpsDepartmentId } from "@/lib/department-operations";
import {
  createDepartmentWorkPlanDraft,
  departmentWorkPlansConfigured,
  listDepartmentWorkPlans,
} from "@/lib/notion-department-workplans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CURSOR_RE = /^[a-f0-9-]{32,36}$/i;
const ID_RE = /^[a-f0-9-]{32,36}$/i;

function validDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const parsed = Date.parse(value + "T00:00:00.000Z");
  if (Number.isNaN(parsed)) return false;
  return new Date(parsed).toISOString().slice(0, 10) === value;
}

export async function GET(request: NextRequest) {
  if (!(await requireStaffSession())) {
    return privateJson({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!departmentWorkPlansConfigured()) {
    return privateJson(
      {
        ok: false,
        error: "Department work plans register is not configured. No records are shown.",
        configured: false,
      },
      { status: 503 }
    );
  }
  const params = new URL(request.url).searchParams;
  const department = params.get("department") || undefined;
  if (department && !isOpsDepartmentId(department)) {
    return privateJson({ ok: false, error: "Unknown department." }, { status: 400 });
  }
  const cursor = params.get("cursor") || undefined;
  if (cursor && !CURSOR_RE.test(cursor)) {
    return privateJson({ ok: false, error: "Invalid pagination cursor." }, { status: 400 });
  }
  try {
    const page = await listDepartmentWorkPlans({
      departmentId: department as OpsDepartmentId | undefined,
      cursor,
    });
    return privateJson({
      ok: true,
      configured: true,
      records: page.rows,
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
      pageSize: 50,
      source: "notion",
    });
  } catch {
    return privateJson(
      {
        ok: false,
        error:
          "The department work plans register could not be reached. No cached or estimated records are shown.",
      },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return privateJson({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  if (!(await requireStaffSession())) {
    return privateJson({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!departmentWorkPlansConfigured()) {
    return privateJson(
      { ok: false, error: "Department work plans register is not configured." },
      { status: 503 }
    );
  }
  const parsed = await readBoundedJson(request);
  if (!parsed.ok) {
    const status =
      parsed.reason === "too_large" ? 413 : parsed.reason === "content_type" ? 415 : 400;
    return privateJson({ ok: false, error: "Invalid work-plan request." }, { status });
  }
  const body = parsed.value;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return privateJson({ ok: false, error: "Invalid request body." }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  const allowed = [
    "title",
    "departmentId",
    "programmeId",
    "objective",
    "deliverable",
    "dueDate",
    "dependencies",
    "accountableRole",
    "progressNote",
    "evidenceNote",
  ];
  if (Object.keys(input).some((key) => !allowed.includes(key))) {
    return privateJson({ ok: false, error: "Unexpected fields." }, { status: 400 });
  }
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const departmentId = typeof input.departmentId === "string" ? input.departmentId : "";
  if (title.length < 3 || title.length > 180) {
    return privateJson(
      { ok: false, error: "Provide a work-plan title between 3 and 180 characters." },
      { status: 400 }
    );
  }
  if (!isOpsDepartmentId(departmentId)) {
    return privateJson({ ok: false, error: "Select a valid department." }, { status: 400 });
  }
  const programmeId =
    typeof input.programmeId === "string" ? input.programmeId.trim() : "";
  if (programmeId && !ID_RE.test(programmeId)) {
    return privateJson(
      { ok: false, error: "Programme relation must be a valid Notion page id." },
      { status: 400 }
    );
  }
  const dueDate = typeof input.dueDate === "string" ? input.dueDate.trim() : "";
  if (dueDate && !validDate(dueDate)) {
    return privateJson({ ok: false, error: "Due date must be YYYY-MM-DD." }, { status: 400 });
  }
  const str = (key: string, max: number) =>
    typeof input[key] === "string" ? (input[key] as string).trim().slice(0, max) : "";
  try {
    const created = await createDepartmentWorkPlanDraft({
      title,
      departmentId,
      programmeId: programmeId || undefined,
      objective: str("objective", 1800),
      deliverable: str("deliverable", 1800),
      dueDate: dueDate || undefined,
      dependencies: str("dependencies", 500),
      accountableRole: str("accountableRole", 180),
      progressNote: str("progressNote", 1800),
      evidenceNote: str("evidenceNote", 1800),
    });
    return privateJson(
      {
        ok: true,
        created,
        status: "Planned",
        note: "Completion claims require evidence; role titles are not appointments.",
      },
      { status: 201 }
    );
  } catch {
    return privateJson(
      {
        ok: false,
        error:
          "The work-plan item could not be saved to Notion. Check the integration's database access and schema.",
      },
      { status: 502 }
    );
  }
}
