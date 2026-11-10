import { dbId, notion, assertInternalDb, textProp } from "@/lib/notion";
import {
  isOpsDepartmentId,
  type OpsDepartmentId,
  type ProgrammeRecord,
  type ProgrammeStatus,
  departmentIdFromNotionSelect,
} from "@/lib/department-operations";

const ENV = "NOTION_DEPARTMENT_PROGRAMMES_DATABASE_ID" as const;

const DEPARTMENT_SELECT: Record<OpsDepartmentId, string> = {
  education: "Education",
  health: "Health",
  "digital-systems": "Digital Systems",
  "civic-affairs": "Civic Affairs",
};

const DRAFT_STATUSES = new Set(["Planning", "Draft"]);

function database() {
  const client = notion();
  const databaseId = dbId(ENV);
  if (!client || !databaseId) throw new Error("Department programmes register is not configured.");
  assertInternalDb(databaseId, ENV);
  return { client, databaseId };
}

export function departmentProgrammesConfigured(): boolean {
  return Boolean(process.env.NOTION_TOKEN?.trim() && dbId(ENV));
}

function mapStatus(raw: string): ProgrammeStatus {
  const allowed: ProgrammeStatus[] = [
    "Planning",
    "Draft",
    "Active",
    "On hold",
    "Completed",
    "Closed",
    "Unspecified",
  ];
  return (allowed.includes(raw as ProgrammeStatus) ? raw : "Unspecified") as ProgrammeStatus;
}

function mapRow(page: any): ProgrammeRecord {
  const props = page.properties || {};
  const deptRaw = textProp(props.Department);
  const departmentId = departmentIdFromNotionSelect(deptRaw);
  return {
    id: page.id,
    title: textProp(props.Name) || "Untitled programme",
    description: textProp(props.Description) || "",
    objectives: textProp(props.Objectives) || "",
    departmentId,
    targetCommunity: textProp(props["Target community"]) || "",
    geography: textProp(props.Geography) || "",
    activities: textProp(props.Activities) || "",
    deliverables: textProp(props.Deliverables) || "",
    startDate: textProp(props["Start date"]) || "",
    endDate: textProp(props["End date"]) || "",
    accountableRole: textProp(props["Accountable role"]) || "",
    status: mapStatus(textProp(props.Status)),
    evidenceNote: textProp(props["Evidence notes"]) || "",
    url: typeof page.url === "string" ? page.url : "",
  };
}

export async function listDepartmentProgrammes(options: {
  departmentId?: OpsDepartmentId;
  cursor?: string;
}): Promise<{ rows: ProgrammeRecord[]; nextCursor: string | null; hasMore: boolean }> {
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

export async function createDepartmentProgrammeDraft(input: {
  title: string;
  departmentId: OpsDepartmentId;
  objectives?: string;
  targetCommunity?: string;
  geography?: string;
  activities?: string;
  deliverables?: string;
  startDate?: string;
  endDate?: string;
  accountableRole?: string;
  evidenceNote?: string;
  status?: "Planning" | "Draft";
}): Promise<{ id: string; url: string; status: string }> {
  const { client, databaseId } = database();
  if (!isOpsDepartmentId(input.departmentId)) {
    throw new Error("Invalid department.");
  }
  const status = input.status && DRAFT_STATUSES.has(input.status) ? input.status : "Draft";
  const properties: Record<string, unknown> = {
    Name: { title: [{ text: { content: input.title.trim().slice(0, 180) } }] },
    Department: { select: { name: DEPARTMENT_SELECT[input.departmentId] } },
    Status: { select: { name: status } },
  };
  if (input.objectives) {
    properties.Objectives = {
      rich_text: [{ text: { content: input.objectives.slice(0, 1800) } }],
    };
  }
  if (input.targetCommunity) {
    properties["Target community"] = {
      rich_text: [{ text: { content: input.targetCommunity.slice(0, 500) } }],
    };
  }
  if (input.geography) {
    properties.Geography = {
      rich_text: [{ text: { content: input.geography.slice(0, 500) } }],
    };
  }
  if (input.activities) {
    properties.Activities = {
      rich_text: [{ text: { content: input.activities.slice(0, 1800) } }],
    };
  }
  if (input.deliverables) {
    properties.Deliverables = {
      rich_text: [{ text: { content: input.deliverables.slice(0, 1800) } }],
    };
  }
  if (input.accountableRole) {
    properties["Accountable role"] = {
      rich_text: [{ text: { content: input.accountableRole.slice(0, 180) } }],
    };
  }
  if (input.evidenceNote) {
    properties["Evidence notes"] = {
      rich_text: [{ text: { content: input.evidenceNote.slice(0, 1800) } }],
    };
  }
  if (input.startDate) properties["Start date"] = { date: { start: input.startDate } };
  if (input.endDate) properties["End date"] = { date: { start: input.endDate } };

  const page = await client.pages.create({
    parent: { database_id: databaseId },
    properties: properties as any,
  });
  return { id: page.id, url: (page as any).url || "", status };
}
