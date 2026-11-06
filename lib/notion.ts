import { Client } from "@notionhq/client";

export function notion(): Client | null {
  const auth = process.env.NOTION_TOKEN?.trim();
  if (!auth) return null;
  return new Client({ auth });
}

export function dbId(envName: string): string {
  return (process.env[envName] || "").replace(/-/g, "").trim();
}

const MANDATE_BLOCKLIST = new Set(["19b213d55bfc4ce8a653a05147cbbe2a"]);

export function assertInternalDb(id: string): void {
  if (MANDATE_BLOCKLIST.has(id)) {
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

export async function listMeetings(): Promise<MeetingRecord[]> {
  const client = notion();
  const database_id = dbId("NOTION_MEETINGS_DATABASE_ID");
  if (!client || !database_id) return [];
  assertInternalDb(database_id);
  const pages: Array<{ id: string; properties: Record<string, unknown> }> = [];
  let cursor: string | undefined;

  // Notion caps page_size at 100. Follow every cursor so older records do not
  // silently disappear from the operational meeting register.
  do {
    const res = await client.databases.query({
      database_id,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    for (const result of res.results) {
      if ("properties" in result) {
        pages.push(result as { id: string; properties: Record<string, unknown> });
      }
    }
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
    if (res.has_more && !cursor) {
      throw new Error("Notion returned has_more without a next_cursor");
    }
  } while (cursor);

  return pages.map((page) => {
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
}

export async function getMeeting(id: string): Promise<MeetingRecord | null> {
  const client = notion();
  const database_id = dbId("NOTION_MEETINGS_DATABASE_ID");
  if (!client || !database_id) return null;
  assertInternalDb(database_id);
  try {
    const page: any = await client.pages.retrieve({ page_id: id });
    if (!("properties" in page) || typeof page.parent?.database_id !== "string" || page.parent.database_id.replace(/-/g, "").trim() !== database_id) return null;
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
  assertInternalDb(database_id);
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
  if (!client) throw new Error("Notion not configured");
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
