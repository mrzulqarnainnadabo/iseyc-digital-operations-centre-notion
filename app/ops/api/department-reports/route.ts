import { NextRequest } from "next/server";
import { privateJson } from "@/lib/private-response";
import { requireStaffSession } from "@/lib/auth";
import { isSameOriginRequest, readBoundedJson } from "@/lib/request-security";
import {
  isOpsDepartmentId,
  type OpsDepartmentId,
  type ReportType,
} from "@/lib/department-operations";
import {
  createDepartmentReportDraft,
  departmentReportsConfigured,
  listDepartmentReports,
} from "@/lib/notion-department-reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CURSOR_RE = /^[a-f0-9-]{32,36}$/i;
const REPORT_TYPES: ReportType[] = [
  "Activity",
  "Programme",
  "Monthly department",
  "Coordination",
  "Other",
];

export async function GET(request: NextRequest) {
  if (!(await requireStaffSession())) {
    return privateJson({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!departmentReportsConfigured()) {
    return privateJson(
      {
        ok: false,
        error: "Department reports register is not configured. No records are shown.",
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
    const page = await listDepartmentReports({
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
          "The department reports register could not be reached. No cached or estimated records are shown.",
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
  if (!departmentReportsConfigured()) {
    return privateJson(
      { ok: false, error: "Department reports register is not configured." },
      { status: 503 }
    );
  }
  const parsed = await readBoundedJson(request);
  if (!parsed.ok) {
    const status =
      parsed.reason === "too_large" ? 413 : parsed.reason === "content_type" ? 415 : 400;
    return privateJson({ ok: false, error: "Invalid report request." }, { status });
  }
  const body = parsed.value;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return privateJson({ ok: false, error: "Invalid request body." }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  const allowed = [
    "title",
    "departmentId",
    "reportType",
    "period",
    "summary",
    "challenges",
    "outstandingActions",
    "recommendations",
  ];
  if (Object.keys(input).some((key) => !allowed.includes(key))) {
    return privateJson({ ok: false, error: "Unexpected fields." }, { status: 400 });
  }
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const departmentId = typeof input.departmentId === "string" ? input.departmentId : "";
  if (title.length < 3 || title.length > 180) {
    return privateJson(
      { ok: false, error: "Provide a report title between 3 and 180 characters." },
      { status: 400 }
    );
  }
  if (!isOpsDepartmentId(departmentId)) {
    return privateJson({ ok: false, error: "Select a valid department." }, { status: 400 });
  }
  const reportTypeRaw = typeof input.reportType === "string" ? input.reportType : "Activity";
  if (!REPORT_TYPES.includes(reportTypeRaw as ReportType)) {
    return privateJson({ ok: false, error: "Invalid report type." }, { status: 400 });
  }
  const str = (key: string, max: number) =>
    typeof input[key] === "string" ? (input[key] as string).trim().slice(0, max) : "";
  try {
    const created = await createDepartmentReportDraft({
      title,
      departmentId,
      reportType: reportTypeRaw as ReportType,
      period: str("period", 120),
      summary: str("summary", 1800),
      challenges: str("challenges", 1800),
      outstandingActions: str("outstandingActions", 1800),
      recommendations: str("recommendations", 1800),
    });
    return privateJson(
      {
        ok: true,
        created,
        status: "Draft",
        note: "Draft submission for review is not institutional approval or certification.",
      },
      { status: 201 }
    );
  } catch {
    return privateJson(
      {
        ok: false,
        error:
          "The report could not be saved to Notion. Check the integration's database access and schema.",
      },
      { status: 502 }
    );
  }
}
