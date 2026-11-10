import { NextRequest } from "next/server";
import { privateJson } from "@/lib/private-response";
import { requireStaffSession } from "@/lib/auth";
import { isSameOriginRequest, readBoundedJson } from "@/lib/request-security";
import { isOpsDepartmentId, type OpsDepartmentId } from "@/lib/department-operations";
import {
  createDepartmentProgrammeDraft,
  departmentProgrammesConfigured,
  listDepartmentProgrammes,
} from "@/lib/notion-department-programmes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CURSOR_RE = /^[a-f0-9-]{32,36}$/i;

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
  if (!departmentProgrammesConfigured()) {
    return privateJson(
      {
        ok: false,
        error: "Department programmes register is not configured. No records are shown.",
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
    const page = await listDepartmentProgrammes({
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
          "The department programmes register could not be reached. No cached or estimated records are shown.",
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
  if (!departmentProgrammesConfigured()) {
    return privateJson(
      { ok: false, error: "Department programmes register is not configured." },
      { status: 503 }
    );
  }
  const parsed = await readBoundedJson(request);
  if (!parsed.ok) {
    const status =
      parsed.reason === "too_large" ? 413 : parsed.reason === "content_type" ? 415 : 400;
    return privateJson({ ok: false, error: "Invalid programme request." }, { status });
  }
  const body = parsed.value;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return privateJson({ ok: false, error: "Invalid request body." }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  const allowed = [
    "title",
    "departmentId",
    "objectives",
    "targetCommunity",
    "geography",
    "activities",
    "deliverables",
    "startDate",
    "endDate",
    "accountableRole",
    "evidenceNote",
    "status",
  ];
  if (Object.keys(input).some((key) => !allowed.includes(key))) {
    return privateJson({ ok: false, error: "Unexpected fields." }, { status: 400 });
  }
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const departmentId = typeof input.departmentId === "string" ? input.departmentId : "";
  if (title.length < 3 || title.length > 180) {
    return privateJson(
      { ok: false, error: "Provide a programme title between 3 and 180 characters." },
      { status: 400 }
    );
  }
  if (!isOpsDepartmentId(departmentId)) {
    return privateJson({ ok: false, error: "Select a valid department." }, { status: 400 });
  }
  const statusRaw = typeof input.status === "string" ? input.status : "Draft";
  if (statusRaw !== "Planning" && statusRaw !== "Draft") {
    return privateJson(
      {
        ok: false,
        error:
          "Only Planning or Draft programme records may be created under the transitional shared-key session.",
      },
      { status: 400 }
    );
  }
  const str = (key: string, max: number) =>
    typeof input[key] === "string" ? (input[key] as string).trim().slice(0, max) : "";
  const startDate = str("startDate", 10);
  const endDate = str("endDate", 10);
  if (startDate && !validDate(startDate)) {
    return privateJson(
      { ok: false, error: "Start date must be YYYY-MM-DD." },
      { status: 400 }
    );
  }
  if (endDate && !validDate(endDate)) {
    return privateJson({ ok: false, error: "End date must be YYYY-MM-DD." }, { status: 400 });
  }
  if (startDate && endDate && endDate < startDate) {
    return privateJson(
      { ok: false, error: "End date cannot be earlier than the start date." },
      { status: 400 }
    );
  }
  const accountableRole = str("accountableRole", 180);
  try {
    const created = await createDepartmentProgrammeDraft({
      title,
      departmentId,
      objectives: str("objectives", 1800),
      targetCommunity: str("targetCommunity", 500),
      geography: str("geography", 500),
      activities: str("activities", 1800),
      deliverables: str("deliverables", 1800),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      accountableRole: accountableRole || undefined,
      evidenceNote: str("evidenceNote", 1800),
      status: statusRaw,
    });
    return privateJson(
      {
        ok: true,
        created,
        status: created.status,
        note: "Role titles do not assign personal authority or appointments.",
      },
      { status: 201 }
    );
  } catch {
    return privateJson(
      {
        ok: false,
        error:
          "The programme could not be saved to Notion. Check the integration's database access and schema.",
      },
      { status: 502 }
    );
  }
}
