import { dbId, notion, assertInternalDb, getMeeting } from "@/lib/notion";

export type RegisterKind = "actions" | "media" | "chamber";
type Row = { id: string; title: string; status: string; detail: string; date: string; url: string; department: string; priority: string; expectedEvidence: string; blocker: string; sourceMeetingId: string; purpose: string; chairRole: string; secretaryRole: string; agenda: string; attendanceBasis: string; decisionItems: string; draftMinutes: string; decisionOutcome: string };
const CONFIG = {
  actions: { env: "NOTION_ACTIONS_DATABASE_ID", title: "Name", status: "Status", detail: "Owner", date: "Due date" },
  media: { env: "NOTION_MEDIA_DATABASE_ID", title: "Name", status: "Status", detail: "Notes", date: "" },
  chamber: { env: "NOTION_CHAMBER_DATABASE_ID", title: "Name", status: "Status", detail: "Summary", date: "Session date" },
} as const;
function config(kind: RegisterKind) { return CONFIG[kind]; }
function readText(p: any): string {
  if (!p) return "";
  if (p.type === "title") return (p.title || []).map((x: any) => x.plain_text || "").join("");
  if (p.type === "rich_text") return (p.rich_text || []).map((x: any) => x.plain_text || "").join("");
  if (p.type === "select") return p.select?.name || "";
  if (p.type === "status") return p.status?.name || "";
  if (p.type === "date") return p.date?.start || "";
  return "";
}
function database(kind: RegisterKind) {
  const client = notion();
  const databaseId = dbId(config(kind).env);
  if (!client || !databaseId) throw new Error("This Notion register is not configured.");
  assertInternalDb(databaseId, config(kind).env);
  return { client, databaseId };
}
export function registerConfigured(kind: RegisterKind) {
  return Boolean(process.env.NOTION_TOKEN?.trim() && dbId(config(kind).env));
}
export async function listRegister(kind: RegisterKind, cursor?: string): Promise<{ rows: Row[]; nextCursor: string | null; hasMore: boolean }> {
  const { client, databaseId } = database(kind);
  const response = await client.databases.query({
    database_id: databaseId,
    page_size: 50,
    ...(cursor ? { start_cursor: cursor } : {}),
  });
  const rows = response.results.filter((p: any) => p.object === "page").map((p: any) => {
    const props = p.properties || {};
    return { id: p.id, title: readText(props[config(kind).title]) || "Untitled record",
      status: readText(props[config(kind).status]) || "Unspecified",
      detail: kind === "media" ? [readText(props.Notes), readText(props.Channel)].filter(Boolean).join(" · ") : readText(props[config(kind).detail]), date: config(kind).date ? readText(props[config(kind).date]) : "",
      url: typeof p.url === "string" ? p.url : "",
      department: readText(props.Department),
      priority: readText(props.Priority),
      expectedEvidence: readText(props["Expected evidence"]),
      blocker: readText(props["Blocker / support required"]),
      sourceMeetingId: Array.isArray(props["Source meeting"]?.relation) && typeof props["Source meeting"].relation[0]?.id === "string" ? props["Source meeting"].relation[0].id : "",
      purpose: readText(props["Session purpose"]),
      chairRole: readText(props["Chair role"]),
      secretaryRole: readText(props["Secretary role"]),
      agenda: readText(props.Agenda),
      attendanceBasis: readText(props["Attendance and quorum basis"]),
      decisionItems: readText(props["Decision items"]),
      draftMinutes: readText(props["Draft minutes"]),
      decisionOutcome: readText(props["Decision outcome"]),
    };
  });
  return { rows, nextCursor: response.next_cursor || null, hasMore: response.has_more === true };
}
export async function createRegisterDraft(kind: RegisterKind, input: {
  title: string;
  detail?: string;
  date?: string;
  channel?: string;
  department?: string;
  priority?: string;
  expectedEvidence?: string;
  blocker?: string;
  notes?: string;
  sourceMeetingId?: string;
  purpose?: string;
  chairRole?: string;
  secretaryRole?: string;
  agenda?: string;
  attendanceBasis?: string;
  decisionItems?: string;
  draftMinutes?: string;
  decisionOutcome?: string;
}) {
  const { client, databaseId } = database(kind);
  const properties: Record<string, unknown> = {
    Name: { title: [{ text: { content: input.title.trim().slice(0, 180) } }] },
  };
  if (kind === "actions") {
    properties.Status = { select: { name: "Open" } };
    if (input.detail) properties.Owner = { rich_text: [{ text: { content: input.detail.slice(0, 180) } }] };
    if (input.date) properties["Due date"] = { date: { start: input.date } };
    if (input.department) properties.Department = { select: { name: input.department } };
    if (input.priority) properties.Priority = { select: { name: input.priority } };
    if (input.expectedEvidence) properties["Expected evidence"] = { rich_text: [{ text: { content: input.expectedEvidence.slice(0, 500) } }] };
    if (input.blocker) properties["Blocker / support required"] = { rich_text: [{ text: { content: input.blocker.slice(0, 500) } }] };
    if (input.notes) properties.Notes = { rich_text: [{ text: { content: input.notes.slice(0, 1000) } }] };
    if (input.sourceMeetingId) {
      const meeting = await getMeeting(input.sourceMeetingId);
      if (!meeting || meeting.sensitivity !== "Standard") throw new Error("Source meeting is unavailable or not eligible for this register.");
      properties["Source meeting"] = { relation: [{ id: meeting.id }] };
    }
  } else if (kind === "media") {
    properties.Status = { select: { name: "Draft" } };
    if (input.channel) properties.Channel = { select: { name: input.channel } };
    if (input.detail) properties.Notes = { rich_text: [{ text: { content: input.detail.slice(0, 1800) } }] };
  } else {
    properties.Status = { select: { name: "Scheduled" } };
    if (input.date) properties["Session date"] = { date: { start: input.date } };
    if (input.detail) properties.Summary = { rich_text: [{ text: { content: input.detail.slice(0, 1800) } }] };
    const chamberFields: Record<string, string | undefined> = {
      "Session purpose": input.purpose,
      "Chair role": input.chairRole,
      "Secretary role": input.secretaryRole,
      Agenda: input.agenda,
      "Attendance and quorum basis": input.attendanceBasis,
      "Decision items": input.decisionItems,
      "Draft minutes": input.draftMinutes,
      "Decision outcome": input.decisionOutcome,
    };
    for (const [name, value] of Object.entries(chamberFields)) {
      if (value?.trim()) properties[name] = { rich_text: [{ text: { content: value.trim().slice(0, 1800) } }] };
    }
  }
  const page = await client.pages.create({ parent: { database_id: databaseId }, properties: properties as any });
  return { id: page.id, url: (page as any).url || "" };
}
export function isRegisterKind(value: string): value is RegisterKind {
  return value === "actions" || value === "media" || value === "chamber";
}
