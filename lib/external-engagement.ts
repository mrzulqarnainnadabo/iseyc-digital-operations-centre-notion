import { dbId, notion, assertInternalDb, type MeetingRecord } from "@/lib/notion";
import { listMeetings } from "@/lib/notion";

export type ExternalOption = { id: string; title: string; detail: string; status: string; url: string };
const ENV = {
  organisations: "NOTION_PARTNER_ORGANISATIONS_DATABASE_ID",
  contacts: "NOTION_EXTERNAL_CONTACTS_DATABASE_ID",
  invitations: "NOTION_MEETING_INVITATIONS_DATABASE_ID",
} as const;
type Kind = keyof typeof ENV;

function database(kind: Kind) {
  const client = notion();
  const id = dbId(ENV[kind]);
  if (!client || !id) throw new Error("The external engagement register is not configured.");
  assertInternalDb(id, ENV[kind]);
  return { client, id };
}
function read(prop: any): string {
  if (!prop) return "";
  if (prop.type === "title") return (prop.title || []).map((x: any) => x.plain_text || "").join("");
  if (prop.type === "rich_text") return (prop.rich_text || []).map((x: any) => x.plain_text || "").join("");
  if (prop.type === "select") return prop.select?.name || "";
  if (prop.type === "email") return prop.email || "";
  if (prop.type === "phone_number") return prop.phone_number || "";
  if (prop.type === "url") return prop.url || "";
  if (prop.type === "relation") return (prop.relation || []).map((x: any) => x.id).join(",");
  return "";
}
async function query(kind: Kind) {
  const { client, id } = database(kind);
  const result = await client.databases.query({ database_id: id, page_size: 50 });
  return result.results.filter((p: any) => p.object === "page");
}
function row(page: any, titleProp: string, detailProp: string, statusProp: string): ExternalOption {
  const props = page.properties || {};
  return { id: page.id, title: read(props[titleProp]) || "Untitled", detail: read(props[detailProp]), status: read(props[statusProp]), url: page.url || "" };
}
export function externalRegistersConfigured() {
  return Boolean(process.env.NOTION_TOKEN?.trim() && dbId(ENV.organisations) && dbId(ENV.contacts) && dbId(ENV.invitations) && dbId("NOTION_MEETINGS_DATABASE_ID"));
}
export async function listExternalOptions() {
  const [orgPages, contactPages, meetings] = await Promise.all([
    query("organisations"), query("contacts"), listMeetings({ pageSize: 50 }),
  ]);
  const organisations = orgPages.map((p: any) => row(p, "Organisation", "Organisation type", "Verification status"));
  const contacts = contactPages.map((p: any) => row(p, "Contact", "Work email", "Contact status"));
  const meetingOptions = meetings.meetings.map((m: MeetingRecord) => ({ id: m.id, title: m.title, detail: m.meetingDate, status: m.status, url: "" }));
  return { organisations, contacts, meetings: meetingOptions };
}
export async function listExternalInvitations() {
  const pages = await query("invitations");
  return pages.map((p: any) => {
    const x = p.properties || {};
    return {
      id: p.id, title: read(x.Invitation) || "Untitled invitation",
      organisation: read(x.Organisation), contact: read(x["External contact"]),
      meeting: read(x.Meeting), status: read(x["Invitation status"]) || "Draft",
      participation: read(x["Participation type"]), purpose: read(x["Invitation purpose"]),
      sentOn: read(x["Sent on"]), url: p.url || "",
    };
  });
}
export async function createOrganisation(input: { name: string; type: string; website?: string; email?: string; phone?: string; location?: string; owner?: string }) {
  const { client, id } = database("organisations");
  const properties: Record<string, unknown> = {
    Organisation: { title: [{ text: { content: input.name } }] },
    "Organisation type": { select: { name: input.type } },
    "Relationship status": { select: { name: "Prospect" } },
    "Verification status": { select: { name: "Unverified" } },
  };
  if (input.website) properties.Website = { url: input.website };
  if (input.email) properties["Official email"] = { email: input.email };
  if (input.phone) properties["Official phone"] = { phone_number: input.phone };
  if (input.location) properties.Location = { rich_text: [{ text: { content: input.location } }] };
  if (input.owner) properties["ISEYC relationship owner"] = { rich_text: [{ text: { content: input.owner } }] };
  const page = await client.pages.create({ parent: { database_id: id }, properties: properties as any });
  return { id: page.id, url: (page as any).url || "" };
}
export async function createExternalContact(input: { name: string; organisationId: string; role?: string; email?: string; phone?: string; owner?: string }) {
  const { client, id } = database("contacts");
  const organisation = await client.pages.retrieve({ page_id: input.organisationId }) as any;
  if (organisation.parent?.database_id?.replace(/-/g, "") !== dbId(ENV.organisations)) throw new Error("The selected organisation is not in the approved Partner Organisations register.");
  const properties: Record<string, unknown> = {
    Contact: { title: [{ text: { content: input.name } }] },
    Organisation: { relation: [{ id: input.organisationId }] },
    "Contact status": { select: { name: "Unverified" } },
    "Consent / contact basis": { select: { name: "Not recorded" } },
  };
  if (input.role) properties["Official role"] = { rich_text: [{ text: { content: input.role } }] };
  if (input.email) properties["Work email"] = { email: input.email };
  if (input.phone) properties["Work phone"] = { phone_number: input.phone };
  if (input.owner) properties["ISEYC relationship owner"] = { rich_text: [{ text: { content: input.owner } }] };
  const page = await client.pages.create({ parent: { database_id: id }, properties: properties as any });
  return { id: page.id, url: (page as any).url || "" };
}
export async function createMeetingInvitation(input: { title: string; meetingId: string; organisationId: string; contactId?: string; participation: string; purpose: string; agendaItems?: string; ownerRole: string; channel: string }) {
  const { client, id } = database("invitations");
  const [meeting, organisation, contact] = await Promise.all([
    client.pages.retrieve({ page_id: input.meetingId }) as Promise<any>,
    client.pages.retrieve({ page_id: input.organisationId }) as Promise<any>,
    input.contactId ? client.pages.retrieve({ page_id: input.contactId }) as Promise<any> : Promise.resolve(null),
  ]);
  if (meeting.parent?.database_id?.replace(/-/g, "") !== dbId("NOTION_MEETINGS_DATABASE_ID")) throw new Error("The selected meeting is not in the approved DOC Meetings register.");
  if (organisation.parent?.database_id?.replace(/-/g, "") !== dbId(ENV.organisations)) throw new Error("The selected organisation is not in the approved Partner Organisations register.");
  if (input.contactId && contact?.parent?.database_id?.replace(/-/g, "") !== dbId(ENV.contacts)) throw new Error("The selected contact is not in the approved External Contacts register.");
  const properties: Record<string, unknown> = {
    Invitation: { title: [{ text: { content: input.title } }] },
    Meeting: { relation: [{ id: input.meetingId }] },
    Organisation: { relation: [{ id: input.organisationId }] },
    "Participation type": { select: { name: input.participation } },
    "Invitation status": { select: { name: "Draft" } },
    "Invitation purpose": { rich_text: [{ text: { content: input.purpose } }] },
    "Invitation owner role": { rich_text: [{ text: { content: input.ownerRole } }] },
    "Invitation channel": { select: { name: input.channel } },
  };
  if (input.contactId) properties["External contact"] = { relation: [{ id: input.contactId }] };
  if (input.agendaItems) properties["Agenda items"] = { rich_text: [{ text: { content: input.agendaItems } }] };
  const page = await client.pages.create({ parent: { database_id: id }, properties: properties as any });
  return { id: page.id, url: (page as any).url || "" };
}
