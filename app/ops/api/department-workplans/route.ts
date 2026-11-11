import { NextRequest } from "next/server";
import { privateJson } from "@/lib/private-response";
import { requireStaffSession } from "@/lib/auth";
import { isSameOriginRequest, readBoundedJson } from "@/lib/request-security";
import { isOpsDepartmentId, type OpsDepartmentId, type WorkPriority, type RiskLevel } from "@/lib/department-operations";
import {
  createDepartmentWorkPlanDraft,
  departmentWorkPlansConfigured,
  listDepartmentWorkPlans,
} from "@/lib/notion-department-workplans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CURSOR_RE = /^[a-f0-9-]{32,36}$/i;

function validEvidenceUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

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
    "objective",
    "deliverable",
    "startDate",
    "dueDate",
    "accountableRole",
    "priority",
    "riskLevel",
    "contributors",
    "evidenceUrl",
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
  const startDate = typeof input.startDate === "string" ? input.startDate.trim() : "";
  const dueDate = typeof input.dueDate === "string" ? input.dueDate.trim() : "";
  if ((startDate && !validDate(startDate)) || (dueDate && !validDate(dueDate))) {
    return privateJson({ ok: false, error: "Work-plan dates must be valid YYYY-MM-DD dates." }, { status: 400 });
  }
  if (startDate && dueDate && dueDate < startDate) {
    return privateJson({ ok: false, error: "Due date cannot be earlier than the start date." }, { status: 400 });
  }
  const str = (key: string, max: number) =>
    typeof input[key] === "string" ? (input[key] as string).trim().slice(0, max) : "";
  const priority = str("priority", 20);
  const riskLevel = str("riskLevel", 20);
  const contributors = str("contributors", 1000);
  const priorities: WorkPriority[] = ["Critical", "High", "Medium", "Low", "Unspecified"];
  const risks: RiskLevel[] = ["Low", "Moderate", "High", "Critical", "Unspecified"];
  if (priority && !priorities.includes(priority as WorkPriority)) {
    return privateJson({ ok: false, error: "Select a valid work-plan priority." }, { status: 400 });
  }
  if (riskLevel && !risks.includes(riskLevel as RiskLevel)) {
    return privateJson({ ok: false, error: "Select a valid work-plan risk level." }, { status: 400 });
  }
  const evidenceUrl = str("evidenceUrl", 2048);
  if (!validEvidenceUrl(evidenceUrl)) {
    return privateJson({ ok: false, error: "Evidence link must be a valid HTTPS URL." }, { status: 400 });
  }

  try {
    const created = await createDepartmentWorkPlanDraft({
      title,
      departmentId,
      objective: str("objective", 1800),
      deliverable: str("deliverable", 1800),
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      accountableRole: str("accountableRole", 180),
      priority: (priority || "Unspecified") as WorkPriority,
      riskLevel: (riskLevel || "Unspecified") as RiskLevel,
      contributors: contributors || undefined,
      evidenceUrl: evidenceUrl || undefined,
    });
    return privateJson(
      {
        ok: true,
        created,
        status: "Proposed",
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
