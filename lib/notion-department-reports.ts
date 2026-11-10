import { dbId, notion, assertInternalDb, textProp } from "@/lib/notion";
import {
  isOpsDepartmentId,
  type DepartmentReportRecord,
  type OpsDepartmentId,
  type ReportType,
  departmentIdFromNotionSelect,
} from "@/lib/department-operations";

const ENV = "NOTION_DEPARTMENT_REPORTS_DATABASE_ID" as const;

const DEPARTMENT_SELECT: Record<OpsDepartmentId, string> = {
  education: "Education",
  health: "Health",
  "digital-systems": "Digital Systems",
  "civic-affairs": "Civic Affairs",
};

function database() {
  const client = notion();
  const databaseId = dbId(ENV);
  if (!client || !databaseId) throw new Error("Department reports register is not configured.");
  assertInternalDb(databaseId, ENV);
  return { client, databaseId };
}

export function departmentReportsConfigured(): boolean {
  return Boolean(process.env.NOTION_TOKEN?.trim() && dbId(ENV));
}

function mapReportType(raw: string): ReportType {
  const allowed: ReportType[] = [
    "Activity",
    "Programme",
    "Monthly department",
    "Coordination",
    "Other",
  ];
  return (allowed.includes(raw as ReportType) ? raw : "Other") as ReportType;
}

function mapRow(page: any): DepartmentReportRecord {
  const props = page.properties || {};
  const deptRaw = textProp(props.Department);
  const departmentId = departmentIdFromNotionSelect(deptRaw);
  const statusRaw = textProp(props.Status);
  const status =
    statusRaw === "Draft" ||
    statusRaw === "Submitted for review" ||
    statusRaw === "Archived"
      ? statusRaw
      : "Unspecified";
  return {
    id: page.id,
    title: textProp(props.Name) || "Untitled report",
    reportType: mapReportType(textProp(props["Report type"])),
    departmentId,
    period: textProp(props.Period) || "",
    summary: textProp(props.Summary) || "",
    challenges: textProp(props.Challenges) || "",
    outstandingActions: textProp(props["Outstanding actions"]) || "",
    recommendations: textProp(props.Recommendations) || "",
    status,
    url: typeof page.url === "string" ? page.url : "",
  };
}

export async function listDepartmentReports(options: {
  departmentId?: OpsDepartmentId;
  cursor?: string;
}): Promise<{ rows: DepartmentReportRecord[]; nextCursor: string | null; hasMore: boolean }> {
  const { client, databaseId } = database();
  const filter =
    options.departmentId && isOpsDepartmentId(options.departmentId)
      ? {
          property: "Department",
          select: { equals: DEPARTMENT_SELECT[options.departmentId] },
        }
      : undefined;
  const response = await client.databases.query({
    database_id: databaseId,
    page_size: 50,
    ...(options.cursor ? { start_cursor: options.cursor } : {}),
    ...(filter ? { filter } : {}),
  });
  const rows = response.results
    .filter((p: any) => p.object === "page")
    .map((p: any) => mapRow(p));
  return {
    rows,
    nextCursor: response.next_cursor || null,
    hasMore: response.has_more === true,
  };
}

export async function createDepartmentReportDraft(input: {
  title: string;
  departmentId: OpsDepartmentId;
  reportType?: ReportType;
  period?: string;
  summary?: string;
  challenges?: string;
  outstandingActions?: string;
  recommendations?: string;
}): Promise<{ id: string; url: string; status: string }> {
  const { client, databaseId } = database();
  if (!isOpsDepartmentId(input.departmentId)) throw new Error("Invalid department.");
  const reportType = input.reportType || "Activity";
  const properties: Record<string, unknown> = {
    Name: { title: [{ text: { content: input.title.trim().slice(0, 180) } }] },
    Department: { select: { name: DEPARTMENT_SELECT[input.departmentId] } },
    Status: { select: { name: "Draft" } },
    "Report type": { select: { name: reportType } },
  };
  if (input.period) {
    properties.Period = {
      rich_text: [{ text: { content: input.period.slice(0, 120) } }],
    };
  }
  if (input.summary) {
    properties.Summary = {
      rich_text: [{ text: { content: input.summary.slice(0, 1800) } }],
    };
  }
  if (input.challenges) {
    properties.Challenges = {
      rich_text: [{ text: { content: input.challenges.slice(0, 1800) } }],
    };
  }
  if (input.outstandingActions) {
    properties["Outstanding actions"] = {
      rich_text: [{ text: { content: input.outstandingActions.slice(0, 1800) } }],
    };
  }
  if (input.recommendations) {
    properties.Recommendations = {
      rich_text: [{ text: { content: input.recommendations.slice(0, 1800) } }],
    };
  }

  const page = await client.pages.create({
    parent: { database_id: databaseId },
    properties: properties as any,
  });
  return { id: page.id, url: (page as any).url || "", status: "Draft" };
}
