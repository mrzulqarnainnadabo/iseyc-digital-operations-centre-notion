import { dbId, notion, assertInternalDb } from "@/lib/notion";

export type RegisterKind = "actions" | "media" | "chamber";
type Row = { id: string; title: string; status: string; detail: string; date: string; url: string };
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
      url: typeof p.url === "string" ? p.url : "" };
  });
  return { rows, nextCursor: response.next_cursor || null, hasMore: response.has_more === true };
}
export async function createRegisterDraft(kind: RegisterKind, input: { title: string; detail?: string; date?: string; channel?: string }) {
  const { client, databaseId } = database(kind);
  const properties: Record<string, unknown> = {
    Name: { title: [{ text: { content: input.title.trim().slice(0, 180) } }] },
  };
  if (kind === "actions") {
    properties.Status = { select: { name: "Open" } };
    if (input.detail) properties.Owner = { rich_text: [{ text: { content: input.detail.slice(0, 180) } }] };
    if (input.date) properties["Due date"] = { date: { start: input.date } };
  } else if (kind === "media") {
    properties.Status = { select: { name: "Draft" } };
    if (input.channel) properties.Channel = { select: { name: input.channel } };
    if (input.detail) properties.Notes = { rich_text: [{ text: { content: input.detail.slice(0, 1800) } }] };
  } else {
    properties.Status = { select: { name: "Scheduled" } };
    if (input.date) properties["Session date"] = { date: { start: input.date } };
    if (input.detail) properties.Summary = { rich_text: [{ text: { content: input.detail.slice(0, 1800) } }] };
  }
  const page = await client.pages.create({ parent: { database_id: databaseId }, properties: properties as any });
  return { id: page.id, url: (page as any).url || "" };
}
export function isRegisterKind(value: string): value is RegisterKind {
  return value === "actions" || value === "media" || value === "chamber";
}
