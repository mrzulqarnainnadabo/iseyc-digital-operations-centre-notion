import { Client } from "@notionhq/client";

export function notion(): Client | null {
  const auth = process.env.NOTION_TOKEN?.trim();
  if (!auth) return null;
  return new Client({ auth });
}

function canonicalNotionId(id: string): string {
  return id.replace(/-/g, "").trim().toLowerCase();
}

const NOTION_DATABASE_ID_PATTERN = /^[a-f0-9]{32}$/;
type InternalDatabaseEnv = "NOTION_MEETINGS_DATABASE_ID" | "NOTION_DEPARTMENT_APPLICATIONS_DATABASE_ID" | "NOTION_PARTNER_ORGANISATIONS_DATABASE_ID" | "NOTION_EXTERNAL_CONTACTS_DATABASE_ID" | "NOTION_MEETING_INVITATIONS_DATABASE_ID" | "NOTION_ACTIONS_DATABASE_ID" | "NOTION_MEDIA_DATABASE_ID" | "NOTION_CHAMBER_DATABASE_ID" | "NOTION_DEPARTMENT_PROGRAMMES_DATABASE_ID" | "NOTION_DEPARTMENT_WORKPLANS_DATABASE_ID" | "NOTION_DEPARTMENT_REPORTS_DATABASE_ID";

export function dbId(envName: string): string {
  const candidate = canonicalNotionId(process.env[envName] || "");
  return NOTION_DATABASE_ID_PATTERN.test(candidate) ? candidate : "";
}

const MANDATE_BLOCKLIST = new Set(["19b213d55bfc4ce8a653a05147cbbe2a"]);

/**
 * Bind each operational adapter to its declared internal database setting.
 * A syntactically valid Notion ID is not, by itself, proof that it is an
 * approved DOC database. Do not pass request-supplied IDs to this function.
 */
export function assertInternalDb(id: string, envName: InternalDatabaseEnv): void {
  const configuredId = dbId(envName);
  const candidate = canonicalNotionId(id);
  if (!configuredId || !NOTION_DATABASE_ID_PATTERN.test(candidate) || candidate !== configuredId) {
    throw new Error("Refusing to use an unconfigured or invalid DOC database.");
  }
  if (MANDATE_BLOCKLIST.has(candidate)) {
    throw new Error("Refusing to use Civic Mandate public database for DOC operations.");
  }
}

export function textProp(prop: unknown): string {
  if (!prop || typeof prop !== "object") return "";
  const p = prop as Record<string, any>;
  if (p.type === "title")
    return (p.title || []).map((t: any) => t.plain_text || "").join("").trim();
  if (p.type === "rich_text")
    return (p.rich_text || []).map((t: any) => t.plain_text || "").join("").trim();
  if (p.type === "select") return p.select?.name || "";
  if (p.type === "status") return p.status?.name || "";
  if (p.type === "date") return p.date?.start || "";
  return "";
}

export type MeetingRecord = {
  id: string;
  title: string;
  status: string;
  conveningBody: string;
  meetingDate: string;
  summary: string;
  sensitivity: string;
};

export type MeetingPage = {
  meetings: MeetingRecord[];
  nextCursor: string | null;
  hasMore: boolean;
};

/**
 * Read one bounded page from the internal Meetings database.
 * Never walk every Notion cursor inside a single request: callers explicitly
 * request subsequent pages, keeping memory and upstream API work bounded.
 */
export async function listMeetings(options: {
  cursor?: string;
  pageSize?: number;
} = {}): Promise<MeetingPage> {
  const client = notion();
  const database_id = dbId("NOTION_MEETINGS_DATABASE_ID");
  if (!client || !database_id) return { meetings: [], nextCursor: null, hasMore: false };
  assertInternalDb(database_id, "NOTION_MEETINGS_DATABASE_ID");

  const pageSize = Math.min(50, Math.max(1, Math.floor(options.pageSize ?? 25)));
  const cursor = options.cursor?.trim();
  const res = await client.databases.query({
    database_id,
    page_size: pageSize,
    ...(cursor ? { start_cursor: cursor } : {}),
  });

  const pages = res.results.filter(
    (result): result is typeof result & { properties: Record<string, unknown> } =>
      "properties" in result
  );

  const meetings = pages.map((page) => {
    const props = page.properties as Record<string, any>;
    return {
      id: page.id,
      title: textProp(props.Name) || textProp(props.Title) || "Untitled meeting",
      status: textProp(props.Status) || "New",
      conveningBody:
        textProp(props["Convening body"]) || textProp(props.ConveningBody) || "—",
      meetingDate: textProp(props["Meeting date"]) || textProp(props.Date) || "",
      summary: textProp(props.Summary) || textProp(props.Notes) || "",
      sensitivity: textProp(props.Sensitivity) || "Unclassified",
    };
  });

  if (res.has_more && !res.next_cursor) {
    throw new Error("Notion returned has_more without a next_cursor");
  }

  return {
    meetings,
    nextCursor: res.has_more ? res.next_cursor ?? null : null,
    hasMore: res.has_more === true,
  };
}

export async function getMeeting(id: string): Promise<MeetingRecord | null> {
  const client = notion();
  const database_id = dbId("NOTION_MEETINGS_DATABASE_ID");
  if (!client || !database_id) return null;
  assertInternalDb(database_id, "NOTION_MEETINGS_DATABASE_ID");
  try {
    const page: any = await client.pages.retrieve({ page_id: id });
    if (!("properties" in page) || typeof page.parent?.database_id !== "string" || canonicalNotionId(page.parent.database_id) !== database_id) return null;
    const props = page.properties;
    return {
      id: page.id,
      title: textProp(props.Name) || textProp(props.Title) || "Untitled meeting",
      status: textProp(props.Status) || "New",
      conveningBody:
        textProp(props["Convening body"]) || textProp(props.ConveningBody) || "—",
      meetingDate: textProp(props["Meeting date"]) || textProp(props.Date) || "",
      summary: textProp(props.Summary) || textProp(props.Notes) || "",
      sensitivity: textProp(props.Sensitivity) || "Unclassified",
    };
  } catch {
    return null;
  }
}

export async function createMeeting(input: {
  title: string;
  conveningBody: string;
  meetingDate: string;
  summary: string;
  sensitivity: string;
}): Promise<{ id: string }> {
  const client = notion();
  const database_id = dbId("NOTION_MEETINGS_DATABASE_ID");
  if (!client || !database_id) {
    throw new Error("NOTION_TOKEN or NOTION_MEETINGS_DATABASE_ID not configured");
  }
  assertInternalDb(database_id, "NOTION_MEETINGS_DATABASE_ID");
  const properties: Record<string, unknown> = {
    Name: { title: [{ text: { content: input.title.slice(0, 200) } }] },
    Status: { select: { name: "New" } },
    Summary: {
      rich_text: [{ text: { content: input.summary.slice(0, 1900) } }],
    },
  };
  if (input.conveningBody) {
    properties["Convening body"] = {
      rich_text: [{ text: { content: input.conveningBody.slice(0, 200) } }],
    };
  }
  if (input.meetingDate) {
    properties["Meeting date"] = { date: { start: input.meetingDate } };
  }
  if (input.sensitivity) {
    properties.Sensitivity = { select: { name: input.sensitivity } };
  }
  const page = await client.pages.create({
    parent: { database_id },
    properties: properties as any,
  });
  return { id: page.id };
}

export async function setMeetingStatus(
  id: string,
  status: "In review" | "Approved" | "Archived" | "Draft"
): Promise<void> {
  const client = notion();
  const database_id = dbId("NOTION_MEETINGS_DATABASE_ID");
  if (!client || !database_id) throw new Error("Notion meetings database not configured");
  assertInternalDb(database_id, "NOTION_MEETINGS_DATABASE_ID");

  // Re-check the page's parent immediately before mutation. Callers should
  // enforce authorization too, but this adapter must never mutate a page
  // outside the configured internal Meetings database.
  const page: any = await client.pages.retrieve({ page_id: id });
  if (typeof page.parent?.database_id !== "string" ||
      canonicalNotionId(page.parent.database_id) !== database_id) {
    throw new Error("Refusing to update a page outside the configured Meetings database.");
  }

  await client.pages.update({
    page_id: id,
    properties: { Status: { select: { name: status } } },
  });
}

export type DepartmentApplicationsConnection = {
  configured: boolean;
  accessible: boolean;
  schemaReady: boolean;
  missingProperties: string[];
};

/**
 * Verify the dedicated Notion integration can retrieve the department
 * applications database and that its expected intake schema is present.
 * This intentionally does not query or expose applicant rows.
 */
export async function verifyDepartmentApplicationsConnection(): Promise<DepartmentApplicationsConnection> {
  const client = notion();
  const database_id = dbId("NOTION_DEPARTMENT_APPLICATIONS_DATABASE_ID");
  if (!client || !database_id) {
    return {
      configured: false,
      accessible: false,
      schemaReady: false,
      missingProperties: [],
    };
  }
  assertInternalDb(database_id, "NOTION_DEPARTMENT_APPLICATIONS_DATABASE_ID");

  const database: any = await client.databases.retrieve({ database_id });
  const properties = database?.properties;
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) {
    throw new Error("Department applications database returned an invalid schema.");
  }

  const required: Record<string, string> = {
    Application: "title",
    Department: "select",
    "Applicant Name": "rich_text",
    Email: "email",
    Phone: "phone_number",
    "Application Status": "status",
    "Submitted At": "date",
    "Consent Confirmed": "checkbox",
  };
  const missingProperties = Object.entries(required)
    .filter(([name, type]) => properties[name]?.type !== type)
    .map(([name]) => name);

  return {
    configured: true,
    accessible: true,
    schemaReady: missingProperties.length === 0,
    missingProperties,
  };
}

export function configFlags() {
  return {
    token: Boolean(process.env.NOTION_TOKEN?.trim()),
    meetings: Boolean(dbId("NOTION_MEETINGS_DATABASE_ID")),
    media: Boolean(dbId("NOTION_MEDIA_DATABASE_ID")),
    chamber: Boolean(dbId("NOTION_CHAMBER_DATABASE_ID")),
    actions: Boolean(dbId("NOTION_ACTIONS_DATABASE_ID")),
    departmentApplications: Boolean(dbId("NOTION_DEPARTMENT_APPLICATIONS_DATABASE_ID")),
    staffKey: Boolean(process.env.ISEYC_STAFF_KEY?.trim()),
  };
}
