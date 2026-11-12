import { NextRequest } from "next/server";
import { privateJson } from "@/lib/private-response";
import { requireCapability } from "@/lib/require-capability";
import { isSameOriginRequest, readBoundedJson } from "@/lib/request-security";
import {
  createExternalContact, createMeetingInvitation, createOrganisation,
  externalRegistersConfigured, listExternalInvitations, listExternalOptions,
} from "@/lib/external-engagement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const validEmail = (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validUrl = (value: string) => {
  if (!value) return true;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
};

export async function GET(request: NextRequest) {
  const access = await requireCapability("ops.browse");
  if (!access.ok) return access.response;
  if (!externalRegistersConfigured()) return privateJson({ ok: false, error: "External engagement registers are not configured in this environment. No records are shown." }, { status: 503 });
  const params = new URL(request.url).searchParams;
  const cursors = {
    organisations: params.get("organisationsCursor") || undefined,
    contacts: params.get("contactsCursor") || undefined,
    meetings: params.get("meetingsCursor") || undefined,
  };
  const invitationCursor = params.get("cursor") || undefined;
  const cursorPattern = /^[a-f0-9-]{32,36}$/i;
  if ([...Object.values(cursors), invitationCursor].some((cursor) => cursor && !cursorPattern.test(cursor))) {
    return privateJson({ ok: false, error: "Invalid register pagination cursor." }, { status: 400 });
  }
  try {
    const [options, invitationPage] = await Promise.all([listExternalOptions(cursors), listExternalInvitations(invitationCursor)]);
    return privateJson({
      ok: true, ...options,
      invitations: invitationPage.invitations,
      invitationsNextCursor: invitationPage.nextCursor,
      invitationsHasMore: invitationPage.hasMore,
      source: "notion",
      optionsScope: "independently cursor-paginated (up to 50 records per source page)",
      invitationsScope: "cursor-paginated",
    });
  } catch {
    return privateJson({ ok: false, error: "External engagement records could not be retrieved. No cached or estimated records are shown." }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return privateJson({ ok: false, error: "Forbidden" }, { status: 403 });
  const writeAccess = await requireCapability("ops.meeting.standard");
  if (!writeAccess.ok) return writeAccess.response;
  if (!externalRegistersConfigured()) return privateJson({ ok: false, error: "External engagement registers are not configured." }, { status: 503 });
  const parsed = await readBoundedJson(request, 8192);
  if (!parsed.ok) {
    const status = parsed.reason === "too_large" ? 413 : parsed.reason === "content_type" ? 415 : 400;
    return privateJson({ ok: false, error: "Invalid external engagement request." }, { status });
  }
  if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) return privateJson({ ok: false, error: "Invalid request body." }, { status: 400 });
  const body = parsed.value as Record<string, unknown>;
  const action = text(body.action, 30);
  try {
    if (action === "organisation") {
      const allowed = ["action", "name", "type", "website", "email", "phone", "location", "owner"];
      if (Object.keys(body).some(k => !allowed.includes(k))) return privateJson({ ok: false, error: "Unexpected organisation fields." }, { status: 400 });
      const name = text(body.name, 180), type = text(body.type, 80), website = text(body.website, 500), email = text(body.email, 254);
      const validTypes = ["Government institution", "Civil society organisation", "University or research institution", "Private sector", "Development partner", "Professional association", "Community organisation", "Media organisation", "Other"];
      if (name.length < 2 || !validTypes.includes(type) || !validEmail(email) || !validUrl(website)) return privateJson({ ok: false, error: "Provide an organisation name, valid type, and valid official contact details." }, { status: 400 });
      const created = await createOrganisation({ name, type, website, email, phone: text(body.phone, 40), location: text(body.location, 160), owner: text(body.owner, 120) });
      return privateJson({ ok: true, action, created, verification: "Unverified — manual verification required" }, { status: 201 });
    }
    if (action === "contact") {
      const allowed = ["action", "name", "organisationId", "role", "email", "phone", "owner"];
      if (Object.keys(body).some(k => !allowed.includes(k))) return privateJson({ ok: false, error: "Unexpected contact fields." }, { status: 400 });
      const name = text(body.name, 140), organisationId = text(body.organisationId, 80), email = text(body.email, 254);
      if (name.length < 2 || !organisationId || !validEmail(email)) return privateJson({ ok: false, error: "Provide a contact name, organisation and valid work email." }, { status: 400 });
      const created = await createExternalContact({ name, organisationId, role: text(body.role, 140), email, phone: text(body.phone, 40), owner: text(body.owner, 120) });
      return privateJson({ ok: true, action, created, verification: "Unverified — manual verification required" }, { status: 201 });
    }
    if (action === "invitation") {
      const allowed = ["action", "title", "meetingId", "organisationId", "contactId", "participation", "purpose", "subject", "draft", "agendaItems", "ownerRole", "channel"];
      if (Object.keys(body).some(k => !allowed.includes(k))) return privateJson({ ok: false, error: "Unexpected invitation fields." }, { status: 400 });
      const title = text(body.title, 180), meetingId = text(body.meetingId, 80), organisationId = text(body.organisationId, 80);
      const participation = text(body.participation, 80), channel = text(body.channel, 40), purpose = text(body.purpose, 1000), subject = text(body.subject, 180), draft = text(body.draft, 1800), ownerRole = text(body.ownerRole, 120);
      const roles = ["Observer", "Presenter", "Technical contributor", "Panelist", "Resource person", "Institutional representative", "Prospective partner", "Host", "Other"];
      if (title.length < 3 || !meetingId || !organisationId || !roles.includes(participation) || !["Email", "Official letter", "Phone", "Other"].includes(channel) || purpose.length < 5 || subject.length < 5 || draft.length < 20 || ownerRole.length < 2) return privateJson({ ok: false, error: "Complete the meeting, verified organisation, participation role, channel, subject, purpose and invitation draft (minimum 20 characters)." }, { status: 400 });
      const created = await createMeetingInvitation({ title, meetingId, organisationId, contactId: text(body.contactId, 80) || undefined, participation, purpose, subject, draft, agendaItems: text(body.agendaItems, 800), ownerRole, channel });
      return privateJson({ ok: true, action, created, status: "Draft", dispatch: "Not sent — human approval and external dispatch are still required" }, { status: 201 });
    }
    return privateJson({ ok: false, error: "Unknown action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "DUPLICATE_ORGANISATION") return privateJson({ ok: false, error: "This organisation is already registered. Open the existing record instead." }, { status: 409 });
    if (message === "DUPLICATE_CONTACT") return privateJson({ ok: false, error: "This contact is already registered for the selected organisation." }, { status: 409 });
    return privateJson({ ok: false, error: "The record could not be saved. Check the Notion integration access and register schema." }, { status: 502 });
  }
}
