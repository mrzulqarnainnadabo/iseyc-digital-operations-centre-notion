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
const root = path.join(__dirname, "..");
const opsRoot = path.join(root, "app/ops");

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
    assert.ok(pages.has(item.href), `Navigation item "${item.label}" points to missing route ${item.href}`);
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

test("external navigation is restricted to the two published civic products", () => {
  const external = DOC_NAV.filter((item) => item.external);
  assert.deepEqual(external.map((item) => item.label).sort(), ["Civic Brain", "Civic Mandate"]);
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


test("institutional design tokens and reduced-motion accessibility are present", () => {
  const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");
  const shell = fs.readFileSync(path.join(root, "components/DocShell.tsx"), "utf8");
  const dashboard = fs.readFileSync(path.join(opsRoot, "page.tsx"), "utf8");
  for (const token of ["--iseyc-forest-950", "--iseyc-cream-50", "--iseyc-gold-600", "--iseyc-border"]) {
    assert.ok(css.includes(token), `Missing design token ${token}`);
  }
  assert.match(css, /prefers-reduced-motion/);
  assert.match(shell, /aria-label="Mobile navigation"/);
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
  assert.match(adapter, /pages\.create/);
  assert.match(route, /isSameOriginRequest/);
  assert.match(route, /requireStaffSession/);
  assert.match(route, /readBoundedJson/);
  assert.match(route, /status: "Draft"/);
  assert.match(route, /Not sent/);
  assert.match(page, /Create invitation draft/);
  assert.match(page, /has NOT been sent/);
  assert.match(page, /verified and active/);
  assert.match(notion, /NOTION_MEETING_INVITATIONS_DATABASE_ID/);
  assert.ok(DOC_NAV.some((item) => item.href === "/ops/partners"));
});
