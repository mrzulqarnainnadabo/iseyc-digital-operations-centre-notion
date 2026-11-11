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
  // Persist using exact live Notion select options; UI labels remain canonical.
  "digital-systems": "Digital Systems & Technology",
  "civic-affairs": "Civic Affairs & Public Accountability",
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

function departmentFilter(departmentId?: OpsDepartmentId) {
  return departmentId && isOpsDepartmentId(departmentId)
    ? { property: "Department", select: { equals: DEPARTMENT_SELECT[departmentId] } }
    : undefined;
}

import type { ProgrammeRecord, ProgrammeStatus, WorkPriority, RiskLevel } from "@/lib/department-operations";

const PROGRAMME_TYPE_FILTER = { property: "Work Type", select: { equals: "Programme" } };

function urlProp(prop: unknown): string {
  if (!prop || typeof prop !== "object") return "";
  const value = prop as Record<string, unknown>;
  return value.type === "url" && typeof value.url === "string" ? value.url : "";
}

function mapPriority(raw: string): WorkPriority {
  const allowed: WorkPriority[] = ["Critical", "High", "Medium", "Low"];
  return allowed.includes(raw as WorkPriority) ? raw as WorkPriority : "Unspecified";
}

function mapRiskLevel(raw: string): RiskLevel {
  const allowed: RiskLevel[] = ["Low", "Moderate", "High", "Critical"];
  return allowed.includes(raw as RiskLevel) ? raw as RiskLevel : "Unspecified";
}

function mapStatus(raw: string): ProgrammeStatus {
  const allowed: ProgrammeStatus[] = [
    "Proposed", "Approved", "In Progress", "Under Review",
    "Completed", "Paused", "Cancelled", "Unspecified",
  ];
  return (allowed.includes(raw as ProgrammeStatus) ? raw : "Unspecified") as ProgrammeStatus;
}

function mapRow(page: any): ProgrammeRecord {
  const props = page.properties || {};
  return {
    id: page.id,
    title: textProp(props["Programme / Work Item"]) || "Untitled programme",
    description: "",
    objectives: textProp(props["Intended Outcome"]),
    departmentId: departmentIdFromNotionSelect(textProp(props.Department)),
    targetCommunity: "",
    geography: "",
    activities: "",
    deliverables: textProp(props["Acceptance Criteria"]),
    startDate: textProp(props["Start Date"]),
    endDate: textProp(props["Due Date"]),
    accountableRole: textProp(props["Accountable Role"]),
    priority: mapPriority(textProp(props.Priority)),
    riskLevel: mapRiskLevel(textProp(props["Risk Level"])),
    contributors: textProp(props.Contributors),
    status: mapStatus(textProp(props.Status)),
    evidenceNote: urlProp(props["Evidence / Deliverable"]),
    url: typeof page.url === "string" ? page.url : "",
  };
}

export async function listDepartmentProgrammes(options: {
  departmentId?: OpsDepartmentId;
  cursor?: string;
}): Promise<{ rows: ProgrammeRecord[]; nextCursor: string | null; hasMore: boolean }> {
  const { client, databaseId } = database();
  const department = departmentFilter(options.departmentId);
  const response = await client.databases.query({
    database_id: databaseId,
    page_size: 50,
    filter: department
      ? { and: [PROGRAMME_TYPE_FILTER, department] }
      : PROGRAMME_TYPE_FILTER,
    ...(options.cursor ? { start_cursor: options.cursor } : {}),
  });
  const rows = response.results
    .filter((page: any) => page.object === "page")
    .map((page: any) => mapRow(page));
  return { rows, nextCursor: response.next_cursor || null, hasMore: response.has_more === true };
}

export async function createDepartmentProgrammeDraft(input: {
  title: string;
  departmentId: OpsDepartmentId;
  objectives?: string;
  deliverables?: string;
  startDate?: string;
  endDate?: string;
  accountableRole?: string;
  priority?: WorkPriority;
  riskLevel?: RiskLevel;
  contributors?: string;
  evidenceUrl?: string;
}): Promise<{ id: string; url: string; status: string }> {
  const { client, databaseId } = database();
  if (!isOpsDepartmentId(input.departmentId)) throw new Error("Invalid department.");
  const properties: Record<string, unknown> = {
    "Programme / Work Item": { title: [{ text: { content: input.title.trim().slice(0, 180) } }] },
    Department: { select: { name: DEPARTMENT_SELECT[input.departmentId] } },
    "Work Type": { select: { name: "Programme" } },
    Status: { status: { name: "Proposed" } },
  };
  if (input.objectives) {
    properties["Intended Outcome"] = { rich_text: [{ text: { content: input.objectives.slice(0, 1800) } }] };
  }
  if (input.deliverables) {
    properties["Acceptance Criteria"] = { rich_text: [{ text: { content: input.deliverables.slice(0, 1800) } }] };
  }
  if (input.accountableRole) {
    properties["Accountable Role"] = { rich_text: [{ text: { content: input.accountableRole.slice(0, 180) } }] };
  }
  if (input.priority && input.priority !== "Unspecified") properties.Priority = { select: { name: input.priority } };
  if (input.riskLevel && input.riskLevel !== "Unspecified") properties["Risk Level"] = { select: { name: input.riskLevel } };
  if (input.contributors) properties.Contributors = { rich_text: [{ text: { content: input.contributors.slice(0, 1000) } }] };
  if (input.startDate) properties["Start Date"] = { date: { start: input.startDate } };
  if (input.endDate) properties["Due Date"] = { date: { start: input.endDate } };
  if (input.evidenceUrl) properties["Evidence / Deliverable"] = { url: input.evidenceUrl };
  const page = await client.pages.create({ parent: { database_id: databaseId }, properties: properties as any });
  return { id: page.id, url: (page as any).url || "", status: "Proposed" };
}
