import { dbId, notion, assertInternalDb, textProp } from "@/lib/notion";
import {
  isOpsDepartmentId,
  type OpsDepartmentId,
  type WorkPlanRecord,
  type WorkPlanStatus,
} from "@/lib/department-operations";

const ENV = "NOTION_DEPARTMENT_WORKPLANS_DATABASE_ID" as const;

const DEPARTMENT_SELECT: Record<OpsDepartmentId, string> = {
  education: "Education",
  health: "Health",
  "digital-systems": "Digital Systems",
  "civic-affairs": "Civic Affairs",
};

function database() {
  const client = notion();
  const databaseId = dbId(ENV);
  if (!client || !databaseId) throw new Error("Department work plans register is not configured.");
  assertInternalDb(databaseId, ENV);
  return { client, databaseId };
}

export function departmentWorkPlansConfigured(): boolean {
  return Boolean(process.env.NOTION_TOKEN?.trim() && dbId(ENV));
}

function mapStatus(raw: string): WorkPlanStatus {
  const allowed: WorkPlanStatus[] = [
    "Planned",
    "In progress",
    "Blocked",
    "Completed",
    "Deferred",
    "Unspecified",
  ];
  return (allowed.includes(raw as WorkPlanStatus) ? raw : "Unspecified") as WorkPlanStatus;
}

function mapRow(page: any): WorkPlanRecord {
  const props = page.properties || {};
  const deptRaw = textProp(props.Department);
  let departmentId: OpsDepartmentId = "education";
  for (const [id, label] of Object.entries(DEPARTMENT_SELECT)) {
    if (label === deptRaw) {
      departmentId = id as OpsDepartmentId;
      break;
    }
  }
  const programmeRelation = props.Programme?.relation;
  const programmeId =
    Array.isArray(programmeRelation) && programmeRelation[0]?.id
      ? String(programmeRelation[0].id)
      : "";
  return {
    id: page.id,
    title: textProp(props.Name) || "Untitled work-plan item",
    objective: textProp(props.Objective) || "",
    departmentId,
    programmeId,
    deliverable: textProp(props.Deliverable) || "",
    dueDate: textProp(props["Due date"]) || "",
    dependencies: textProp(props.Dependencies) || "",
    accountableRole: textProp(props["Accountable role"]) || "",
    status: mapStatus(textProp(props.Status)),
    progressNote: textProp(props["Progress note"]) || "",
    evidenceNote: textProp(props["Evidence notes"]) || "",
    url: typeof page.url === "string" ? page.url : "",
  };
}

export async function listDepartmentWorkPlans(options: {
  departmentId?: OpsDepartmentId;
  cursor?: string;
}): Promise<{ rows: WorkPlanRecord[]; nextCursor: string | null; hasMore: boolean }> {
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

export async function createDepartmentWorkPlanDraft(input: {
  title: string;
  departmentId: OpsDepartmentId;
  programmeId?: string;
  objective?: string;
  deliverable?: string;
  dueDate?: string;
  dependencies?: string;
  accountableRole?: string;
  progressNote?: string;
  evidenceNote?: string;
}): Promise<{ id: string; url: string; status: string }> {
  const { client, databaseId } = database();
  if (!isOpsDepartmentId(input.departmentId)) throw new Error("Invalid department.");
  const properties: Record<string, unknown> = {
    Name: { title: [{ text: { content: input.title.trim().slice(0, 180) } }] },
    Department: { select: { name: DEPARTMENT_SELECT[input.departmentId] } },
    Status: { select: { name: "Planned" } },
  };
  if (input.programmeId && /^[a-f0-9-]{32,36}$/i.test(input.programmeId)) {
    properties.Programme = { relation: [{ id: input.programmeId }] };
  }
  if (input.objective) {
    properties.Objective = {
      rich_text: [{ text: { content: input.objective.slice(0, 1800) } }],
    };
  }
  if (input.deliverable) {
    properties.Deliverable = {
      rich_text: [{ text: { content: input.deliverable.slice(0, 1800) } }],
    };
  }
  if (input.dependencies) {
    properties.Dependencies = {
      rich_text: [{ text: { content: input.dependencies.slice(0, 500) } }],
    };
  }
  if (input.accountableRole) {
    properties["Accountable role"] = {
      rich_text: [{ text: { content: input.accountableRole.slice(0, 180) } }],
    };
  }
  if (input.progressNote) {
    properties["Progress note"] = {
      rich_text: [{ text: { content: input.progressNote.slice(0, 1800) } }],
    };
  }
  if (input.evidenceNote) {
    properties["Evidence notes"] = {
      rich_text: [{ text: { content: input.evidenceNote.slice(0, 1800) } }],
    };
  }
  if (input.dueDate) properties["Due date"] = { date: { start: input.dueDate } };

  const page = await client.pages.create({
    parent: { database_id: databaseId },
    properties: properties as any,
  });
  return { id: page.id, url: (page as any).url || "", status: "Planned" };
}
