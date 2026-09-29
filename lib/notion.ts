import { Client } from "@notionhq/client";

export type MeetingStatus = "New" | "Draft" | "In review" | "Approved" | "Archived";
export type MeetingRecord = {
  id: string;
  title: string;
  status: MeetingStatus;
  conveningBody: string;
  meetingDate: string;
  summary: string;
  sensitivity: string;
};

export class NotionConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotionConfigError";
  }
}

const MANDATE_BLOCKLIST = new Set(["19b213d55bfc4ce8a653a05147cbbe2a"]);
const MEETING_PROPS = {
  title: ["Name", "Title"],
  status: ["Status"],
  conveningBody: ["Convening body", "ConveningBody"],
  meetingDate: ["Meeting date", "Date"],
  summary: ["Summary", "Notes"],
  sensitivity: ["Sensitivity"],
} as const;

export function notion(): Client | null {
  const auth = process.env.NOTION_TOKEN?.trim();
  return auth ? new Client({ auth }) : null;
}

export function dbId(envName: string): string {
  return (process.env[envName] || "").replace(/-/g, "").trim();
}

export function assertInternalDb(id: string): void {
  if (MANDATE_BLOCKLIST.has(id)) {
    throw new NotionConfigError("DOC is configured with the Civic Mandate database. Use the internal Meetings database instead.");
  }
}

function requireNotionDatabase(): { client: Client; database_id: string } {
  const client = notion();
  const database_id = dbId("NOTION_MEETINGS_DATABASE_ID");
  if (!client) throw new NotionConfigError("Notion is not configured. Add NOTION_TOKEN on the server.");
  if (!database_id) throw new NotionConfigError("Meetings database is not configured. Add NOTION_MEETINGS_DATABASE_ID.");
  assertInternalDb(database_id);
  return { client, database_id };
}

export function textProp(prop: unknown): string {
  if (!prop || typeof prop !== "object") return "";
  const p = prop as Record<string, unknown>;
  if (p.type === "title" && Array.isArray(p.title))
    return p.title.map((t) => (t && typeof t === "object" && "plain_text" in t ? String(t.plain_text || "") : "")).join("").trim();
  if (p.type === "rich_text" && Array.isArray(p.rich_text))
    return p.rich_text.map((t) => (t && typeof t === "object" && "plain_text" in t ? String(t.plain_text || "") : "")).join("").trim();
  if (p.type === "select" && p.select && typeof p.select === "object" && "name" in p.select)
    return String(p.select.name || "");
  if (p.type === "status" && p.status && typeof p.status === "object" && "name" in p.status)
    return String(p.status.name || "");
  if (p.type === "date" && p.date && typeof p.date === "object" && "start" in p.date)
    return String(p.date.start || "");
  return "";
}

function firstProp(props: Record<string, unknown>, names: readonly string[]): string {
  for (const name of names) {
    const value = textProp(props[name]);
    if (value) return value;
  }
  return "";
}

function toMeetingRecord(page: { id: string; properties: Record<string, unknown> }): MeetingRecord {
  const props = page.properties;
  const title = firstProp(props, MEETING_PROPS.title);
  const status = firstProp(props, MEETING_PROPS.status) || "New";
  const allowed: MeetingStatus[] = ["New", "Draft", "In review", "Approved", "Archived"];
  return {
    id: page.id,
    title: title || "Untitled meeting",
    status: allowed.includes(status as MeetingStatus) ? status as MeetingStatus : "New",
    conveningBody: firstProp(props, MEETING_PROPS.conveningBody) || "—",
    meetingDate: firstProp(props, MEETING_PROPS.meetingDate),
    summary: firstProp(props, MEETING_PROPS.summary),
    sensitivity: firstProp(props, MEETING_PROPS.sensitivity) || "Standard",
  };
}

export async function listMeetings(): Promise<MeetingRecord[]> {
  const { client, database_id } = requireNotionDatabase();
  try {
    const res = await client.databases.query({ database_id, page_size: 50 });
    return res.results
      .filter((r): r is typeof r & { properties: Record<string, unknown> } => "properties" in r)
      .map((page) => toMeetingRecord({ id: page.id, properties: page.properties as Record<string, unknown> }));
  } catch {
    throw new NotionConfigError("Could not read the Meetings database. Check that the integration is connected and the database permissions are shared.");
  }
}

export async function getMeeting(id: string): Promise<MeetingRecord | null> {
  const client = notion();
  if (!client) throw new NotionConfigError("Notion is not configured. Add NOTION_TOKEN on the server.");
  try {
    const page = await client.pages.retrieve({ page_id: id });
    if (!("properties" in page)) return null;
    return toMeetingRecord({ id: page.id, properties: page.properties as Record<string, unknown> });
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
  const { client, database_id } = requireNotionDatabase();
  const properties: Record<string, unknown> = {
    Name: { title: [{ text: { content: input.title.slice(0, 200) } }] },
    Status: { select: { name: "New" } },
    Summary: { rich_text: [{ text: { content: input.summary.slice(0, 1900) } }] },
  };
  if (input.conveningBody) properties["Convening body"] = { rich_text: [{ text: { content: input.conveningBody.slice(0, 200) } }] };
  if (input.meetingDate) properties["Meeting date"] = { date: { start: input.meetingDate } };
  if (input.sensitivity) properties.Sensitivity = { select: { name: input.sensitivity } };
  try {
    const page = await client.pages.create({ parent: { database_id }, properties: properties as never });
    return { id: page.id };
  } catch {
    throw new NotionConfigError("Could not create the meeting. Check the Meetings database property names/types and integration permissions.");
  }
}

export async function setMeetingStatus(id: string, status: Exclude<MeetingStatus, "New">): Promise<void> {
  const client = notion();
  if (!client) throw new NotionConfigError("Notion is not configured. Add NOTION_TOKEN on the server.");
  try {
    await client.pages.update({ page_id: id, properties: { Status: { select: { name: status } } } });
  } catch {
    throw new NotionConfigError("Could not update this meeting. Check that the Status property is a select/status field and the integration can edit the database.");
  }
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
