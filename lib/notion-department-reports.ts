import { dbId, notion, assertInternalDb, textProp } from "@/lib/notion";
import {
  isOpsDepartmentId,
  type OpsDepartmentId,
  departmentIdFromNotionSelect,
} from "@/lib/department-operations";

const ENV = "NOTION_DEPARTMENT_PROGRAMMES_DATABASE_ID" as const;
const DEPARTMENT_SELECT: Record<OpsDepartmentId, string> = {
  education: "Education & Capacity Building",
  health: "Health & Well-being",
  "digital-systems": "Software & Technology",
  "civic-affairs": "Civic Department",
};

function database() {
  const client = notion();
  const databaseId = dbId(ENV);
  if (!client || !databaseId) throw new Error("Department programmes and work register is not configured.");
  assertInternalDb(databaseId, ENV);
  return { client, databaseId };
}

export function departmentProgrammesConfigured(): boolean {
  return Boolean(process.env.NOTION_TOKEN?.trim() && dbId(ENV));
}

export function departmentWorkPlansConfigured(): boolean {
  return departmentProgrammesConfigured();
}

function urlProp(prop: unknown): string {
  if (!prop || typeof prop !== "object") return "";
  const value = prop as Record<string, unknown>;
  return value.type === "url" && typeof value.url === "string" ? value.url : "";
}

function departmentFilter(departmentId?: OpsDepartmentId) {
  return departmentId && isOpsDepartmentId(departmentId)
    ? { property: "Department", select: { equals: DEPARTMENT_SELECT[departmentId] } }
    : undefined;
}

import type { DepartmentReportRecord, ReportType } from "@/lib/department-operations";

function mapReportType(raw: string): ReportType {
  const allowed: ReportType[] = ["Weekly", "Monthly", "Quarterly", "Annual"];
  return (allowed.includes(raw as ReportType) ? raw : "Unspecified") as ReportType;
}

function mapRow(page: any): DepartmentReportRecord {
  const props = page.properties || {};
  const statusRaw = textProp(props.Status);
  const allowedStatuses = ["Draft", "Submitted", "Under Review", "Accepted", "Revision Required", "Archived"];
  const status = allowedStatuses.includes(statusRaw)
    ? statusRaw as DepartmentReportRecord["status"]
    : "Unspecified";
  return {
    id: page.id,
    title: textProp(props["Report / Period"]) || "Untitled report",
    reportType: mapReportType(textProp(props["Reporting Cycle"])),
    departmentId: departmentIdFromNotionSelect(textProp(props.Department)),
    periodStart: textProp(props["Reporting Period Start"]),
    periodEnd: textProp(props["Reporting Period End"]),
    summary: textProp(props["Completed Work"]),
    challenges: textProp(props["Risks & Blockers"]),
    outstandingActions: textProp(props["Decisions Required"]),
    recommendations: textProp(props["Outcomes / Evidence"]),
    status,
    url: typeof page.url === "string" ? page.url : "",
  };
}

export async function listDepartmentReports(options: {
  departmentId?: OpsDepartmentId;
  cursor?: string;
}): Promise<{ rows: DepartmentReportRecord[]; nextCursor: string | null; hasMore: boolean }> {
  const { client, databaseId } = database();
  const department = departmentFilter(options.departmentId);
  const response = await client.databases.query({
    database_id: databaseId,
    page_size: 50,
    ...(department ? { filter: department } : {}),
    ...(options.cursor ? { start_cursor: options.cursor } : {}),
  });
  const rows = response.results
    .filter((page: any) => page.object === "page")
    .map((page: any) => mapRow(page));
  return { rows, nextCursor: response.next_cursor || null, hasMore: response.has_more === true };
}

export async function createDepartmentReportDraft(input: {
  title: string;
  departmentId: OpsDepartmentId;
  reportType?: ReportType;
  periodStart?: string;
  periodEnd?: string;
  summary?: string;
  challenges?: string;
  outstandingActions?: string;
  recommendations?: string;
}): Promise<{ id: string; url: string; status: string }> {
  const { client, databaseId } = database();
  if (!isOpsDepartmentId(input.departmentId)) throw new Error("Invalid department.");
  const cycle = input.reportType && input.reportType !== "Unspecified" ? input.reportType : "Monthly";
  const properties: Record<string, unknown> = {
    "Report / Period": { title: [{ text: { content: input.title.trim().slice(0, 180) } }] },
    Department: { select: { name: DEPARTMENT_SELECT[input.departmentId] } },
    "Reporting Cycle": { select: { name: cycle } },
    Status: { status: { name: "Draft" } },
  };
  if (input.periodStart) properties["Reporting Period Start"] = { date: { start: input.periodStart } };
  if (input.periodEnd) properties["Reporting Period End"] = { date: { start: input.periodEnd } };
  if (input.summary) properties["Completed Work"] = { rich_text: [{ text: { content: input.summary.slice(0, 1800) } }] };
  if (input.challenges) properties["Risks & Blockers"] = { rich_text: [{ text: { content: input.challenges.slice(0, 1800) } }] };
  if (input.outstandingActions) properties["Decisions Required"] = { rich_text: [{ text: { content: input.outstandingActions.slice(0, 1800) } }] };
  if (input.recommendations) properties["Outcomes / Evidence"] = { rich_text: [{ text: { content: input.recommendations.slice(0, 1800) } }] };
  const page = await client.pages.create({ parent: { database_id: databaseId }, properties: properties as any });
  return { id: page.id, url: (page as any).url || "", status: "Draft" };
}
