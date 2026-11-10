const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

require.extensions[".ts"] = (mod, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS }
  }).outputText;
  mod._compile(js, filename);
};

const { DOC_NAV } = require("../lib/nav.ts");
const { COUNCIL_ROLES, ROLE_GROUPS } = require("../lib/council-roles.ts");
const root = path.join(__dirname, "..");
const opsRoot = path.join(root, "app/ops");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

function collectPages(directory, prefix = "/ops") {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectPages(absolute, prefix + "/" + entry.name);
    return entry.name === "page.tsx" ? [prefix] : [];
  });
}

test("every internal operations navigation link resolves to a real page", () => {
  const pages = new Set(["/ops", ...collectPages(opsRoot)]);
  const internal = DOC_NAV.filter((item) => !item.external);
  assert.ok(internal.length > 0, "operations navigation should not be empty");
  for (const item of internal) {
    assert.ok(pages.has(item.href.split("#")[0]), `Navigation item "${item.label}" points to missing route ${item.href}`);
  }
});

test("every operations page is covered by the authenticated operations layout", () => {
  const layoutPath = path.join(opsRoot, "layout.tsx");
  assert.ok(fs.existsSync(layoutPath), "operations layout must exist");
  const layout = fs.readFileSync(layoutPath, "utf8");
  assert.match(layout, /requireStaffSession/);
  assert.match(layout, /redirect\(["']\/login["']\)/);
  const pages = collectPages(opsRoot);
  assert.ok(pages.length >= 6, "route inventory should include the current operations modules");
});

test("external navigation points only to published ISEYC civic intelligence products", () => {
  const external = DOC_NAV.filter((item) => item.external);
  assert.deepEqual(external.map((item) => item.label).sort(), ["Civic Brain", "Civic Mandate", "Civic Observatory"]);
  assert.ok(external.every((item) => item.href.startsWith("https://")));
  assert.ok(external.every((item) => !/operators|admin|submission|member/i.test(item.href)));
});

test("command home defines exactly four departments and keeps Communications as a shared function", () => {
  const source = fs.readFileSync(path.join(opsRoot, "page.tsx"), "utf8");
  for (const name of [
    "Education & Capacity Building",
    "Health & Well-being",
    "Digital Systems & Technology",
    "Civic Affairs"
  ]) assert.ok(source.includes(name), `Missing department: ${name}`);
  assert.match(source, /Shared function · not a fifth department/);
  assert.match(source, /Communications coordination/);
  assert.match(source, /Seat occupancy not connected/);
  assert.doesNotMatch(source, /National coverage|members nationwide|appointed department head/i);
});

test("module readiness is reachable from the persistent navigation", () => {
  assert.ok(DOC_NAV.some((item) => item.href === "/ops/readiness"));
});

test("executive desk is an authenticated source-backed coordination workspace", () => {
  const page = read("app/ops/executive/page.tsx");
  const nav = read("lib/nav.ts");
  assert.match(page, /requireStaffSession/);
  assert.match(page, /listMeetings/);
  assert.match(page, /listRegister/);
  assert.match(page, /Upcoming meetings/);
  assert.match(page, /Action register/);
  assert.match(page, /Digital Chamber/);
  assert.match(page, /first loaded page/);
  assert.match(page, /does not confer executive appointment/);
  assert.match(nav, /Executive desk/);
  assert.match(nav, /Meetings calendar/);
  assert.match(nav, /Council sessions/);
});

test("meeting intake stores structured preparation in the canonical Meetings database", () => {
  const form = read("app/ops/intake/page.tsx");
  const api = read("app/api/meetings/route.ts");
  const adapter = read("lib/notion.ts");
  const detail = read("app/ops/review/[id]/page.tsx");
  for (const field of ["meetingType", "purpose", "meetingTime", "venue", "meetingOwnerRole", "agenda", "requiredParticipants", "preReading", "decisionsSought", "minutesOwnerRole"]) {
    assert.ok(form.includes(field), `Meeting form missing ${field}`);
    assert.ok(api.includes(field), `Meeting API missing ${field}`);
    assert.ok(adapter.includes(field), `Notion adapter missing ${field}`);
  }
  assert.match(adapter, /Linked actions/);
  assert.match(detail, /Meeting brief/);
  assert.match(detail, /Draft minutes/);
  assert.match(form, /Standard-sensitivity intake only/);
});

test("action progress can be self-reported without enabling completion or closure", () => {
  const api = read("app/ops/api/actions/[id]/route.ts");
  const adapter = read("lib/notion-registers.ts");
  const ui = read("components/OperationalRegister.tsx");
  assert.match(api, /isSameOriginRequest/);
  assert.match(api, /requireStaffSession/);
  assert.match(api, /input\.status !== "In progress" && input\.status !== "Blocked"/);
  assert.match(api, /Done and closure require a separate authorised review/);
  assert.match(adapter, /updateActionProgress/);
  assert.match(adapter, /\["Open", "In progress", "Blocked"\]/);
  assert.match(ui, /Update working progress/);
  assert.match(ui, /Self-reported working status only/);
  assert.match(ui, /does not mark an action Done or close it/);
});

test("meeting collaboration is limited to draft notes on Standard records", () => {
  const api = read("app/api/meetings/[id]/route.ts");
  const adapter = read("lib/notion.ts");
  const detail = read("app/ops/review/[id]/page.tsx");
  assert.match(api, /isSameOriginRequest/);
  assert.match(api, /requireStaffSession/);
  assert.match(api, /draftKeys = \["attendanceNotes", "draftMinutes", "outcomeSummary"\]/);
  assert.match(api, /updateMeetingDraft\(id, draftInput\)/);
  assert.match(adapter, /parent\.database_id/);
  assert.match(adapter, /sensitivity !== "Standard"/);
  assert.match(adapter, /Attendance & apologies/);
  assert.match(adapter, /Draft minutes/);
  assert.match(detail, /Save draft notes/);
  assert.match(detail, /shared staff key does not identify the editor/);
  assert.match(detail, /do not verify attendance, establish quorum, approve minutes or certify a decision/);
});

test("actions can be linked to an existing Standard meeting without granting decision authority", () => {
  const adapter = read("lib/notion-registers.ts");
  const api = read("app/ops/api/registers/[kind]/route.ts");
  const component = read("components/OperationalRegister.tsx");
  assert.match(adapter, /getMeeting\(input\.sourceMeetingId\)/);
  assert.match(adapter, /meeting\.sensitivity !== "Standard"/);
  assert.match(adapter, /properties\["Source meeting"\]/);
  assert.match(api, /sourceMeetingId/);
  assert.match(component, /Related meeting · optional/);
  assert.match(component, /does not certify a decision/);
});

test("operations errors recover without exposing exception details", () => {
  const errorBoundary = fs.readFileSync(path.join(opsRoot, "error.tsx"), "utf8");
  assert.match(errorBoundary, /^"use client";/);
  assert.match(errorBoundary, /role="alert"/);
  assert.match(errorBoundary, /onClick=\{reset\}/);
  assert.match(errorBoundary, /No record was changed/);
  assert.doesNotMatch(errorBoundary, /error\.message/);
});

test("operations loading state is announced accessibly", () => {
  const loading = fs.readFileSync(path.join(opsRoot, "loading.tsx"), "utf8");
  assert.match(loading, /aria-busy="true"/);
  assert.match(loading, /aria-live="polite"/);
  assert.match(loading, /Loading operations view/);
});

test("actions, chamber and communications expose authenticated Notion-backed initial workflows", () => {
  for (const [name, kind] of [["actions","actions"],["chamber","chamber"],["media","media"]]) {
    const page = fs.readFileSync(path.join(opsRoot, name, "page.tsx"), "utf8");
    assert.match(page, /requireStaffSession/);
    assert.match(page, /OperationalRegister/);
    assert.ok(page.includes(`kind="${kind}"`));
  }
  const component = fs.readFileSync(path.join(root, "components/OperationalRegister.tsx"), "utf8");
  assert.match(component, /Save to Notion/);
  assert.match(component, /human-authorised/);
  assert.match(component, /Accountable owner role · required/);
  assert.match(component, /required minLength=\{2\} maxLength=\{180\}/);
  assert.match(component, /does not assign access or imply a named appointment/);

  const api = fs.readFileSync(path.join(opsRoot, "api/registers/[kind]/route.ts"), "utf8");
  assert.match(api, /isSameOriginRequest/);
  assert.match(api, /requireStaffSession/);
  assert.match(api, /readBoundedJson/);
  assert.match(api, /createRegisterDraft/);
  const adapter = fs.readFileSync(path.join(root, "lib/notion-registers.ts"), "utf8");
  assert.match(adapter, /NOTION_ACTIONS_DATABASE_ID/);
  assert.match(adapter, /NOTION_MEDIA_DATABASE_ID/);
  assert.match(adapter, /NOTION_CHAMBER_DATABASE_ID/);
  assert.match(adapter, /client\.databases\.query/);
  assert.match(adapter, /client\.pages\.create/);
});


test("Notion operational registers expose bounded cursor pagination", () => {
  const adapter = read("lib/notion-registers.ts");
  const api = read("app/ops/api/registers/[kind]/route.ts");
  const ui = read("components/OperationalRegister.tsx");
  assert.match(adapter, /start_cursor/);
  assert.match(adapter, /next_cursor/);
  assert.match(adapter, /has_more/);
  assert.match(api, /Invalid pagination cursor/);
  assert.match(api, /nextCursor: page.nextCursor/);
  assert.match(ui, /\[\.\.\.current, \.\.\.data\.records\]/);
  assert.match(ui, /\[\.\.\.current, \.\.\.data\.records\]/);
});

test("institutional design tokens and reduced-motion accessibility are present", () => {
  const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");
  const shell = fs.readFileSync(path.join(root, "components/DocShell.tsx"), "utf8");
  const dashboard = fs.readFileSync(path.join(opsRoot, "page.tsx"), "utf8");
  for (const token of ["--iseyc-forest-950", "--iseyc-cream-50", "--iseyc-gold-600", "--iseyc-border"]) {
    assert.ok(css.includes(token), `Missing design token ${token}`);
  }
  assert.match(css, /prefers-reduced-motion/);
  assert.match(shell, /aria-label="Primary mobile navigation"/);
  assert.doesNotMatch(shell, /aria-label="Mobile navigation"/);
  assert.match(shell, /fixed inset-x-0 bottom-0/);
  assert.match(shell, /aria-label="Primary navigation"/);
  assert.match(shell, /min-h-\[44px\]/);
  assert.match(dashboard, /Not operational/);
  assert.match(dashboard, /Published civic systems/);
});


test("department desks show sourced meeting activity without implying staffing or task completion", () => {
  const department = fs.readFileSync(path.join(opsRoot, "departments/[department]/page.tsx"), "utf8");
  const calendar = fs.readFileSync(path.join(opsRoot, "calendar/page.tsx"), "utf8");
  const board = fs.readFileSync(path.join(opsRoot, "calendar/CalendarBoard.tsx"), "utf8");
  const seat = fs.readFileSync(path.join(opsRoot, "seat/page.tsx"), "utf8");
  assert.match(department, /task register/i);
  assert.match(department, /Not connected/);
  assert.match(department, /listMeetings/);
  assert.match(department, /filterLegacyVisibleMeetings/);
  assert.match(department, /No matching department meetings/);
  assert.match(department, /not inferred from login identity/);
  assert.match(calendar, /requireStaffSession/);
  assert.match(calendar, /listMeetings/);
  assert.match(board, /No meeting is recorded for this date/);
  assert.match(board, /does not create attendance, invitations, minutes or action assignments/);
  assert.match(calendar, /pageSize: 50/);
  assert.match(board, /first loaded page \(up to 50 records\)/);
  assert.match(board, /This month · loaded page/);
  assert.match(board, /meetings with a valid scheduled date in this loaded page/);
  for (const name of [
    "Education & Capacity Building",
    "Health & Well-being",
    "Digital Systems & Technology",
    "Civic Affairs"
  ]) assert.ok(department.includes(name));
  assert.match(seat, /No active appointment record is linked to this session/);
  assert.match(seat, /Generic seat packet/i);
  assert.match(seat, /AI is staff to the seat, never the seat-holder/);
});

test("AI draft and human decision components preserve the authority boundary", () => {
  const ai = fs.readFileSync(path.join(root, "components/AIDraftBanner.tsx"), "utf8");
  const decisions = fs.readFileSync(path.join(root, "components/HumanDecisionPanel.tsx"), "utf8");
  const status = fs.readFileSync(path.join(root, "components/StatusBadge.tsx"), "utf8");
  const review = fs.readFileSync(path.join(opsRoot, "review/[id]/page.tsx"), "utf8");
  assert.match(ai, /AI draft — not an institutional decision/);
  assert.match(decisions, /Accept/);
  assert.match(decisions, /Edit/);
  assert.match(decisions, /Return/);
  assert.match(decisions, /Reject/);
  assert.match(decisions, /disabled/);
  assert.match(review, /scoped appointment permissions/);
  assert.match(review, /HumanDecisionPanel/);
  for (const label of ["Operational", "Partial", "Not operational", "Published", "Draft", "Awaiting human review", "Verified"]) {
    assert.ok(status.includes(label), `Missing status style: ${label}`);
  }
});

test("department-first public home keeps supporting systems secondary and operations protected", () => {
  const home = fs.readFileSync(path.join(root, "app/page.tsx"), "utf8");
  const opsLayout = fs.readFileSync(path.join(root, "app/ops/layout.tsx"), "utf8");
  assert.match(home, /PublicShell/);
  assert.match(home, /Four departments\. One institution\. Clear public information\./);
  assert.match(home, /Digital infrastructure behind the departments/);
  assert.match(home, /Civic Mandate/);
  assert.match(home, /Civic Brain/);
  assert.doesNotMatch(home, /requireStaffSession|listMeetings|@\/lib\/notion/);
  assert.match(opsLayout, /requireStaffSession/);
  assert.match(opsLayout, /redirect\("\/login"\)/);
  assert.doesNotMatch(home, /members nationwide|national impact|campaign/i);
});

test("department applications integration check validates schema without reading applicant rows", () => {
  const notion = fs.readFileSync(path.join(root, "lib/notion.ts"), "utf8");
  const start = notion.indexOf("export async function verifyDepartmentApplicationsConnection");
  const end = notion.indexOf("export function configFlags", start);
  assert.ok(start >= 0 && end > start, "connection verifier must be present");
  const verifier = notion.slice(start, end);
  assert.match(verifier, /client\.databases\.retrieve/);
  assert.match(verifier, /"Application Status": "status"/);
  assert.match(verifier, /"Applicant Name": "rich_text"/);
  assert.match(verifier, /"Consent Confirmed": "checkbox"/);
  assert.doesNotMatch(verifier, /databases\.query|pages\.query|pages\.create|pages\.update/);
  assert.match(notion, /NOTION_DEPARTMENT_APPLICATIONS_DATABASE_ID/);
  const integrationDoc = fs.readFileSync(path.join(root, "docs/DEPARTMENT-APPLICATIONS-INTEGRATION.md"), "utf8");
  assert.doesNotMatch(integrationDoc, /\b[0-9a-f]{32}\b/i, "private Notion database IDs must not be published in documentation");
  const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
  assert.match(readme, /existence and the Vercel integration.s access must be verified/);
  const route = fs.readFileSync(path.join(root, "app/api/department-applications/connection/route.ts"), "utf8");
  assert.match(route, /result\.configured && result\.accessible && result\.schemaReady/);
  assert.match(route, /ok: ready/);
  assert.match(route, /status: ready \? 200 : 503/);
});


test("register forms send only fields accepted by their route and communications reads its saved brief", () => {
  const component = fs.readFileSync(path.join(root, "components/OperationalRegister.tsx"), "utf8");
  const adapter = fs.readFileSync(path.join(root, "lib/notion-registers.ts"), "utf8");
  const route = fs.readFileSync(path.join(opsRoot, "api/registers/[kind]/route.ts"), "utf8");
  assert.match(component, /kind === "media"/);
  assert.match(component, /sourceMeetingId/);
  assert.match(component, /expectedEvidence/);
  assert.match(component, /Array\.isArray\(data\.records\)/);
  assert.match(component, /setRows\(\[\]\)/);
  assert.match(adapter, /detail: "Notes"/);
  assert.match(adapter, /readText\(props\.Notes\).*readText\(props\.Channel\)/);
  assert.match(route, /kind === "media" \? \["title", "detail", "channel"\]/);
  assert.match(route, /sourceMeetingId/);
  assert.match(route, /kind === "actions" && detail.length < 2/);
  assert.match(route, /kind === "actions" \|\| kind === "chamber"\) && !date/);
  assert.match(component, /Due date · required/);
  assert.match(component, /Session date · required/);
});

test("external invitation server validation requires an accountable owner role and eligibility filters relationships", () => {
  const route = fs.readFileSync(path.join(opsRoot, "api/external-engagement/route.ts"), "utf8");
  const adapter = fs.readFileSync(path.join(root, "lib/external-engagement.ts"), "utf8");
  const page = fs.readFileSync(path.join(opsRoot, "partners/page.tsx"), "utf8");
  assert.match(route, /ownerRole\.length < 2/);
  assert.match(adapter, /prop\.type === "date"/);
  assert.match(adapter, /relationshipStatus: read\(p\.properties\?\.\["Relationship status"\]\)/);
  assert.match(page, /\["Paused", "Declined", "Former collaborator"\]/);
  assert.match(page, /loading \|\| !loaded/);
});

test("external engagement prevents duplicate records and rejects stale meeting handoff IDs", () => {
  const adapter = fs.readFileSync(path.join(root, "lib/external-engagement.ts"), "utf8");
  const route = fs.readFileSync(path.join(opsRoot, "api/external-engagement/route.ts"), "utf8");
  const page = fs.readFileSync(path.join(opsRoot, "partners/page.tsx"), "utf8");
  assert.match(adapter, /DUPLICATE_ORGANISATION/);
  assert.match(adapter, /DUPLICATE_CONTACT/);
  assert.match(adapter, /does not belong to the selected organisation/);
  assert.match(route, /status: 409/);
  assert.match(page, /result\.meetings\?\.some/);
  assert.match(page, /candidate : result\.meetings\?\.\[0\]/);
  assert.match(page, /activeView === "directory"/);
  assert.match(page, /activeView === "invitations"/);
  assert.match(page, /activeView === "agreements"/);
});

test("external organisation, contact and approved-meeting selectors paginate independently", () => {
  const notion = read("lib/notion.ts");
  const adapter = read("lib/external-engagement.ts");
  const route = read("app/ops/api/external-engagement/route.ts");
  const page = read("app/ops/partners/page.tsx");
  assert.match(notion, /hasMore: boolean/);
  assert.match(notion, /hasMore: res\.has_more === true/);
  assert.match(adapter, /listExternalOptions\(cursors: \{ organisations\?: string; contacts\?: string; meetings\?: string \}/);
  assert.match(adapter, /organisationsNextCursor: orgPages\.nextCursor/);
  assert.match(adapter, /contactsNextCursor: contactPages\.nextCursor/);
  assert.match(adapter, /meetingsNextCursor: meetings\.nextCursor/);
  assert.match(route, /organisationsCursor/);
  assert.match(route, /contactsCursor/);
  assert.match(route, /meetingsCursor/);
  assert.match(route, /optionsScope: "independently cursor-paginated/);
  assert.match(page, /Load more organisations/);
  assert.match(page, /Load more contacts/);
  assert.match(page, /Load more approved meetings/);
  assert.match(page, /loadMoreOptions\(kind: OptionKind\)/);
  assert.match(page, /organisationsHasMore/);
  assert.match(page, /contactsHasMore/);
  assert.match(page, /meetingsHasMore/);
  assert.match(page, /if \(!appendInvitations\)/);
  assert.match(page, /setInviteOrg\(current => current \|\| result\.organisations\?\.find\(eligibleOrganisation\)/);
  assert.match(page, /nextCursorKey/);
  assert.match(page, /hasMoreKey/);
});

test("external invitation register uses validated cursor pagination and preserves loaded records", () => {
  const adapter = read("lib/external-engagement.ts");
  const route = read("app/ops/api/external-engagement/route.ts");
  const page = read("app/ops/partners/page.tsx");
  assert.match(adapter, /start_cursor/);
  assert.match(adapter, /next_cursor/);
  assert.match(adapter, /has_more/);
  assert.match(adapter, /listExternalInvitations\(cursor\?: string\)/);
  assert.match(route, /const invitationCursor = params\.get\("cursor"\)/);
  assert.match(route, /cursorPattern = \/\^\[a-f0-9-\]\{32,36\}\$\/i/);
  assert.match(route, /Invalid register pagination cursor/);
  assert.match(route, /invitationsNextCursor/);
  assert.match(route, /invitationsHasMore/);
  assert.match(page, /Load more invitations/);
  assert.match(page, /\[\.\.\.current\.invitations, \.\.\.result\.invitations\]/);
  assert.match(route, /invitationsScope: "cursor-paginated"/);
});

test("external engagement is authenticated, linked and draft-only until human dispatch", () => {
  const adapter = fs.readFileSync(path.join(root, "lib/external-engagement.ts"), "utf8");
  const route = fs.readFileSync(path.join(opsRoot, "api/external-engagement/route.ts"), "utf8");
  const page = fs.readFileSync(path.join(opsRoot, "partners/page.tsx"), "utf8");
  const notion = fs.readFileSync(path.join(root, "lib/notion.ts"), "utf8");
  assert.match(adapter, /NOTION_PARTNER_ORGANISATIONS_DATABASE_ID/);
  assert.match(adapter, /NOTION_EXTERNAL_CONTACTS_DATABASE_ID/);
  assert.match(adapter, /NOTION_MEETING_INVITATIONS_DATABASE_ID/);
  assert.match(adapter, /Approved/);
  assert.match(adapter, /Standard/);
  assert.match(adapter, /Verification status/);
  assert.match(adapter, /Verified/);
  assert.match(adapter, /Contact status/);
  assert.match(adapter, /Former collaborator/);
  assert.match(adapter, /Relationship status/);
  assert.match(adapter, /pages\.create/);
  assert.match(route, /isSameOriginRequest/);
  assert.match(route, /requireStaffSession/);
  assert.match(route, /readBoundedJson/);
  assert.match(route, /status: "Draft"/);
  assert.match(route, /Not sent/);
  assert.match(route, /subject.length < 5/);
  assert.match(route, /draft.length < 20/);
  assert.match(adapter, /Invitation subject/);
  assert.match(adapter, /Invitation draft/);
  assert.match(page, /Invitation message draft/);
  assert.match(page, /Create invitation draft/);
  assert.match(page, /Draft only/);
  assert.match(page, /verified identity and recorded contact basis/);
  const meetingReview = fs.readFileSync(path.join(opsRoot, "review/[id]/page.tsx"), "utf8");
  assert.match(meetingReview, /Prepare external invitations/);
  assert.match(meetingReview, /meeting.status === "Approved"/);
  assert.match(notion, /NOTION_MEETING_INVITATIONS_DATABASE_ID/);
  assert.ok(DOC_NAV.some((item) => item.href === "/ops/partners"));
});


test("external engagement list responses do not disclose private email or phone fields to shared-key sessions", () => {
  const adapter = fs.readFileSync(path.join(root, "lib/external-engagement.ts"), "utf8");
  const route = fs.readFileSync(path.join(opsRoot, "api/external-engagement/route.ts"), "utf8");
  assert.match(route, /requireStaffSession/);
  assert.match(adapter, /row\(p, "Contact", "Official role", "Contact status"\)/);
  assert.doesNotMatch(adapter, /row\(p, "Contact", "Work email"/);
  assert.match(adapter, /detail: read\(p\.properties\?\.\["Organisation type"\]\)/);
  assert.doesNotMatch(adapter, /read\(p\.properties\?\.\["Official email"\]\)/);
  assert.doesNotMatch(adapter, /read\(p\.properties\?\.\["Work email"\]\)/);
  assert.match(adapter, /if \(input\.email\) properties\["Work email"\]/);
  assert.match(adapter, /if \(input\.phone\) properties\["Work phone"\]/);
});

test("external engagement keeps contact channels private and invitations as unsent drafts", () => {
  const adapter = read("lib/external-engagement.ts");
  const route = read("app/ops/api/external-engagement/route.ts");
  const page = read("app/ops/partners/page.tsx");
  const start = adapter.indexOf("export async function listExternalOptions(");
  const end = adapter.indexOf("export async function listExternalInvitations(", start);
  assert.ok(start >= 0 && end > start);
  const publicListing = adapter.slice(start, end);
  assert.doesNotMatch(publicListing, /Work email|Work phone|\.email|\.phone_number/i);
  assert.match(route, /requireStaffSession/);
  assert.match(route, /privateJson/);
  assert.match(route, /isSameOriginRequest/);
  assert.match(route, /readBoundedJson/);
  assert.match(route, /Not sent — human approval and external dispatch are still required/);
  assert.match(page, /x\.status === "Active" && x\.verified/);
  assert.match(page, /It has NOT been sent/);
  assert.match(adapter, /Unverified/);
  assert.match(adapter, /Not recorded/);
});


test("readiness page uses the approved fourth department name and plain operational language", () => {
  const readiness = read("app/ops/readiness/page.tsx");
  assert.match(readiness, /Civic Affairs & Public Accountability/);
  assert.doesNotMatch(readiness, /name: "Civic Affairs"/);
  assert.match(readiness, /not yet implemented or connected/);
  assert.doesNotMatch(readiness, /Placeholder/);
});

test("operations shell carries the approved ISEYC identity and institutional signature", () => {
  const layout = read("app/layout.tsx");
  const shell = read("components/DocShell.tsx");
  assert.match(layout, /ISEYC \| Digital Operations Centre/);
  assert.match(layout, /institutional operating environment/);
  assert.match(shell, /Empowering Youth, Shaping Communities/);
  assert.match(shell, /iseycglobal@gmail\.com/);
  assert.match(shell, /@iseyc_global/);
  assert.match(shell, /iseyc-seal\.svg/);
});

test("officer access page uses the approved full Civic Affairs department name", () => {
  const access = read("app/ops/access/page.tsx");
  assert.match(access, /Civic Affairs & Public Accountability/);
});

test("meeting review queue does not imply it handles every institutional approval", () => {
  const page = read("app/ops/queue/page.tsx");
  const nav = read("lib/nav.ts");
  assert.match(page, /Meeting review queue/);
  assert.match(page, /This queue covers meeting briefs only/);
  assert.match(page, /Department programme, finance and other institutional approvals are not managed here/);
  assert.match(nav, /label: "Meeting review queue"/);
});

test("department workspaces use distinct identity marks and every in-page navigation target resolves", () => {
  const page = read("app/ops/departments/[department]/page.tsx");
  const styles = read("app/globals.css");
  const definitions = read("lib/departments.ts");
  assert.match(page, /function DepartmentMark/);
  for (const discipline of ["education", "health", "digital-systems", "civic-affairs"]) {
    assert.ok(page.includes(`department === "${discipline}"`) || discipline === "civic-affairs", `Missing visual identity for ${discipline}`);
  }
  assert.match(page, /id="shared-tools"/);
  assert.match(page, /\["#shared-tools", "Shared tools"\]/);
  assert.doesNotMatch(page, /id="tools"/);
  assert.match(styles, /ops-department-mark--education/);
  assert.match(styles, /ops-department-mark--health/);
  assert.match(styles, /ops-department-mark--digital/);
  assert.match(styles, /ops-department-mark--civic/);
  assert.match(definitions, /name: "Digital Systems & Technology"/);
  assert.match(definitions, /name: "Civic Affairs & Public Accountability"/);
});

test("department draft forms are collapsed until requested and clearly explain their status", () => {
  const programme = read("components/DepartmentProgrammePanel.tsx");
  const workplan = read("components/DepartmentWorkPlanPanel.tsx");
  const report = read("components/DepartmentReportPanel.tsx");
  for (const [name, source] of [["programme", programme], ["work plan", workplan], ["report", report]]) {
    assert.match(source, /<details className=/, `${name} form should be collapsible`);
    assert.match(source, /<summary/, `${name} form needs a visible disclosure label`);
  }
  assert.match(programme, /Save programme draft/);
  assert.match(workplan, /Save work-plan item/);
  assert.match(report, /Save report draft/);
  assert.match(programme, /Creation is limited to Planning/);
  assert.match(report, /Draft only/);
});

test("department work plans cannot link programmes across departments or unrelated databases", () => {
  const adapter = read("lib/notion-department-workplans.ts");
  const route = read("app/ops/api/department-workplans/route.ts");
  assert.match(adapter, /NOTION_DEPARTMENT_PROGRAMMES_DATABASE_ID/);
  assert.match(adapter, /client\.pages\.retrieve/);
  assert.match(adapter, /relatedProgramme\.parent\?\.database_id/);
  assert.match(adapter, /relatedDepartment !== DEPARTMENT_SELECT\[input\.departmentId\]/);
  assert.match(adapter, /same department/);
  assert.match(route, /Programme relation must be a valid Notion page id/);
});

test("department programme dates reject an end date before the start date", () => {
  const route = read("app/ops/api/department-programmes/route.ts");
  assert.match(route, /endDate < startDate/);
  assert.match(route, /End date cannot be earlier than the start date/);
  assert.match(route, /validDate\(startDate\)/);
  assert.match(route, /validDate\(endDate\)/);
});

test("council role guide defines bounded templates without inventing appointments", () => {
  const page = read("app/ops/council/page.tsx");
  const framework = read("docs/COUNCIL-ROLE-AND-DEVELOPMENT-FRAMEWORK.md");
  assert.ok(COUNCIL_ROLES.length >= 10);
  assert.equal(new Set(COUNCIL_ROLES.map((role) => role.id)).size, COUNCIL_ROLES.length);
  assert.deepEqual(ROLE_GROUPS.filter((group) => COUNCIL_ROLES.some((role) => role.group === group)).length, ROLE_GROUPS.length);
  for (const role of COUNCIL_ROLES) {
    assert.ok(role.purpose && role.reportsTo && role.authorityBoundary, `Incomplete role template: ${role.id}`);
    assert.ok(role.responsibilities.length && role.weeklyPractice.length && role.development.length, `Missing operating guide: ${role.id}`);
  }
  assert.match(page, /No appointments or permissions created/);
  assert.match(page, /Personal development and authority limits/);
  assert.ok(framework.includes("existing **IDCC — Appointment & Role Register**"));
  assert.match(framework, /Automation should handle reminders/);
  assert.ok(DOC_NAV.some((item) => item.href === "/ops/council"));
});

test("Presidential Council guide links to a bounded operating compact", () => {
  const page = read("app/ops/council/page.tsx");
  const compact = read("docs/PRESIDENTIAL-COUNCIL-OPERATING-COMPACT.md");
  assert.match(page, /Council roles & leadership guide/);
  assert.match(page, /\/docs\/PRESIDENTIAL-COUNCIL-OPERATING-COMPACT\.md/);
  for (const heading of [
    "Council operating rhythm",
    "Decision and approval gates",
    "Department approval cycle",
    "Meeting record standard",
    "Lean council test",
    "Review and adoption"
  ]) assert.ok(compact.includes(heading), `Operating compact missing section: ${heading}`);
  assert.match(compact, /Authority not configured/);
  assert.match(compact, /shared staff key cannot prove who attended/);
  assert.match(compact, /Automation must not approve/);
});
