import { dbId, notion, assertInternalDb, type MeetingRecord } from "@/lib/notion";
import { listMeetings } from "@/lib/notion";

export type ExternalOption = { id: string; title: string; detail: string; status: string; url: string; organisationId?: string; verified?: boolean; relationshipStatus?: string };
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
  if (prop.type === "status") return prop.status?.name || "";
  if (prop.type === "date") return prop.date?.start || "";
  if (prop.type === "checkbox") return prop.checkbox === true ? "true" : "false";
  if (prop.type === "email") return prop.email || "";
  if (prop.type === "phone_number") return prop.phone_number || "";
  if (prop.type === "url") return prop.url || "";
  if (prop.type === "relation") return (prop.relation || []).map((x: any) => x.id).join(",");
  return "";
}
async function query(kind: Kind, cursor?: string) {
  const { client, id } = database(kind);
  const result = await client.databases.query({
    database_id: id,
    page_size: 50,
    ...(cursor ? { start_cursor: cursor } : {}),
  });
  return {
    pages: result.results.filter((p: any) => p.object === "page"),
    nextCursor: result.next_cursor || null,
    hasMore: result.has_more === true,
  };
}
function row(page: any, titleProp: string, detailProp: string, statusProp: string): ExternalOption {
  const props = page.properties || {};
  return { id: page.id, title: read(props[titleProp]) || "Untitled", detail: read(props[detailProp]), status: read(props[statusProp]), url: page.url || "" };
}
export function externalRegistersConfigured() {
  return Boolean(process.env.NOTION_TOKEN?.trim() && dbId(ENV.organisations) && dbId(ENV.contacts) && dbId(ENV.invitations) && dbId("NOTION_MEETINGS_DATABASE_ID"));
}
export async function listExternalOptions(cursors: { organisations?: string; contacts?: string; meetings?: string } = {}) {
  const [orgPages, contactPages, meetings] = await Promise.all([
    query("organisations", cursors.organisations),
    query("contacts", cursors.contacts),
    listMeetings({ pageSize: 50, cursor: cursors.meetings }),
  ]);
  const organisations = orgPages.pages.map((p: any) => ({ ...row(p, "Organisation", "Organisation type", "Verification status"), relationshipStatus: read(p.properties?.["Relationship status"]), detail: read(p.properties?.["Organisation type"]) }));
  const contacts = contactPages.pages.map((p: any) => ({ ...row(p, "Contact", "Official role", "Contact status"), organisationId: read(p.properties?.Organisation).split(",")[0] || "", verified: p.properties?.Verified?.checkbox === true }));
  const meetingOptions = meetings.meetings.filter((m: MeetingRecord) => m.status === "Approved" && m.sensitivity === "Standard").map((m: MeetingRecord) => ({ id: m.id, title: m.title, detail: m.meetingDate, status: m.status, url: "" }));
  return {
    organisations, contacts, meetings: meetingOptions,
    organisationsNextCursor: orgPages.nextCursor, organisationsHasMore: orgPages.hasMore,
    contactsNextCursor: contactPages.nextCursor, contactsHasMore: contactPages.hasMore,
    meetingsNextCursor: meetings.nextCursor, meetingsHasMore: meetings.hasMore,
  };
}
export async function listExternalInvitations(cursor?: string) {
  const result = await query("invitations", cursor);
  const invitations = result.pages.map((p: any) => {
    const x = p.properties || {};
    return {
      id: p.id, title: read(x.Invitation) || "Untitled invitation",
      organisation: read(x.Organisation), contact: read(x["External contact"]),
      meeting: read(x.Meeting), status: read(x["Invitation status"]) || "Draft",
      participation: read(x["Participation type"]), purpose: read(x["Invitation purpose"]), subject: read(x["Invitation subject"]), draft: read(x["Invitation draft"]),
      sentOn: read(x["Sent on"]), url: p.url || "",
    };
  });
  return { invitations, nextCursor: result.nextCursor, hasMore: result.hasMore };
}
export async function createOrganisation(input: { name: string; type: string; website?: string; email?: string; phone?: string; location?: string; owner?: string }) {
  const { client, id } = database("organisations");
  const duplicate = await client.databases.query({ database_id: id, filter: { property: "Organisation", title: { equals: input.name } }, page_size: 1 });
  if (duplicate.results.length) throw new Error("DUPLICATE_ORGANISATION");
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
  const duplicate = await client.databases.query({ database_id: id, filter: { and: [{ property: "Contact", title: { equals: input.name } }, { property: "Organisation", relation: { contains: input.organisationId } }] }, page_size: 1 });
  if (duplicate.results.length) throw new Error("DUPLICATE_CONTACT");
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
export async function createMeetingInvitation(input: { title: string; meetingId: string; organisationId: string; contactId?: string; participation: string; purpose: string; subject: string; draft: string; agendaItems?: string; ownerRole: string; channel: string }) {
  const { client, id } = database("invitations");
  const [meeting, organisation, contact] = await Promise.all([
    client.pages.retrieve({ page_id: input.meetingId }) as Promise<any>,
    client.pages.retrieve({ page_id: input.organisationId }) as Promise<any>,
    input.contactId ? client.pages.retrieve({ page_id: input.contactId }) as Promise<any> : Promise.resolve(null),
  ]);
  if (meeting.parent?.database_id?.replace(/-/g, "") !== dbId("NOTION_MEETINGS_DATABASE_ID")) throw new Error("The selected meeting is not in the approved DOC Meetings register.");
  const meetingProps = meeting.properties || {};
  if (read(meetingProps.Status) !== "Approved" || read(meetingProps.Sensitivity) !== "Standard") throw new Error("External invitations require an Approved, Standard-sensitivity meeting.");
  if (organisation.parent?.database_id?.replace(/-/g, "") !== dbId(ENV.organisations)) throw new Error("The selected organisation is not in the approved Partner Organisations register.");
  if (read(organisation.properties?.["Verification status"]) !== "Verified") throw new Error("The organisation must be verified before an invitation can be prepared.");
  if (["Paused", "Declined", "Former collaborator"].includes(read(organisation.properties?.["Relationship status"]))) throw new Error("The organisation relationship is paused, declined or former and cannot receive a new invitation.");
  if (input.contactId && contact?.parent?.database_id?.replace(/-/g, "") !== dbId(ENV.contacts)) throw new Error("The selected contact is not in the approved External Contacts register.");
  if (input.contactId && read(contact.properties?.Organisation).split(",").map((value: string) => value.trim()).includes(input.organisationId) === false) throw new Error("The selected contact does not belong to the selected organisation.");
  if (input.contactId && (contact.properties?.Verified?.checkbox !== true || read(contact.properties?.["Contact status"]) !== "Active" || !["Official institutional channel", "Consent recorded"].includes(read(contact.properties?.["Consent / contact basis"])))) throw new Error("The named contact must be verified, active and have a recorded contact basis before invitation.");
  const properties: Record<string, unknown> = {
    Invitation: { title: [{ text: { content: input.title } }] },
    Meeting: { relation: [{ id: input.meetingId }] },
    Organisation: { relation: [{ id: input.organisationId }] },
    "Participation type": { select: { name: input.participation } },
    "Invitation status": { select: { name: "Draft" } },
    "Invitation purpose": { rich_text: [{ text: { content: input.purpose } }] },
    "Invitation subject": { rich_text: [{ text: { content: input.subject } }] },
    "Invitation draft": { rich_text: [{ text: { content: input.draft } }] },
    "Invitation owner role": { rich_text: [{ text: { content: input.ownerRole } }] },
    "Invitation channel": { select: { name: input.channel } },
  };
  if (input.contactId) properties["External contact"] = { relation: [{ id: input.contactId }] };
  if (input.agendaItems) properties["Agenda items"] = { rich_text: [{ text: { content: input.agendaItems } }] };
  const page = await client.pages.create({ parent: { database_id: id }, properties: properties as any });
  return { id: page.id, url: (page as any).url || "" };
}
