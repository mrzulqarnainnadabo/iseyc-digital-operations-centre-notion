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
type InternalDatabaseEnv = "NOTION_MEETINGS_DATABASE_ID";

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

const MEETING_PAGE_SIZE = 25;
const MAX_NOTION_CURSOR_LENGTH = 256;

export function isValidMeetingCursor(cursor: unknown): cursor is string {
  return typeof cursor === "string" &&
    cursor.length > 0 &&
    cursor.length <= MAX_NOTION_CURSOR_LENGTH &&
    !/[\u0000-\u001f\u007f]/.test(cursor);
}

function toMeetingRecord(page: { id: string; properties: Record<string, unknown> }): MeetingRecord {
  const props = page.properties as Record<string, any>;
  return {
    id: page.id,
    title: textProp(props.Name) || textProp(props.Title) || "Untitled meeting",
    status: textProp(props.Status) || "New",
    conveningBody: textProp(props["Convening body"]) || textProp(props.ConveningBody) || "—",
    meetingDate: textProp(props["Meeting date"]) || textProp(props.Date) || "",
    summary: textProp(props.Summary) || textProp(props.Notes) || "",
    sensitivity: textProp(props.Sensitivity) || "Unclassified",
  };
}

/**
 * Fetch one bounded page only. The Notion-side sensitivity filter is essential:
 * legacy sessions must never receive restricted records through pagination.
 */
export async function listMeetingsPage(cursor?: string): Promise<MeetingPage> {
  const client = notion();
  const database_id = dbId("NOTION_MEETINGS_DATABASE_ID");
  if (!client || !database_id) throw new Error("Notion Meetings source is not configured.");
  assertInternalDb(database_id, "NOTION_MEETINGS_DATABASE_ID");

  const res = await client.databases.query({
    database_id,
    page_size: MEETING_PAGE_SIZE,
    filter: {
      property: "Sensitivity",
      select: { equals: "Standard" },
    },
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    ...(cursor ? { start_cursor: cursor } : {}),
  });

  const pages = res.results.filter(
    (result): result is typeof result & { id: string; properties: Record<string, unknown> } =>
      "properties" in result
  );
  const nextCursor = res.has_more ? res.next_cursor ?? null : null;
  if (res.has_more && !nextCursor) {
    throw new Error("Notion returned has_more without a next_cursor");
  }

  return {
    meetings: pages.map((page) => toMeetingRecord(page)),
    nextCursor,
    hasMore: Boolean(res.has_more),
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
    return toMeetingRecord({ id: page.id, properties: props });
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

export function configFlags() {
  return {
    token: Boolean(process.env.NOTION_TOKEN?.trim()),
    meetings: Boolean(dbId("NOTION_MEETINGS_DATABASE_ID")),
    media: Boolean(dbId("NOTION_MEDIA_DATABASE_ID")),
    chamber: Boolean(dbId("NOTION_CHAMBER_DATABASE_ID")),
    actions: Boolean(dbId("NOTION_ACTIONS_DATABASE_ID")),
    staffKey: Boolean(process.env.ISEYC_STAFF_KEY?.trim()),
  };
}
