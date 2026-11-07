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

test("planned operational modules cannot present placeholders as live workflows", () => {
  const modules = [
    ["actions", /data-status="not-operational"/],
    ["chamber", /data-status="not-operational"/],
    ["media", /data-status="not-operational"/]
  ];
  for (const [name, warning] of modules) {
    const source = fs.readFileSync(path.join(opsRoot, name, "page.tsx"), "utf8");
    assert.match(source, warning, `${name} must state its non-operational status`);
    assert.match(source, /\/ops\/readiness/);
  }
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


test("department desks and Day-1 packet do not imply staffing or appointments", () => {
  const department = fs.readFileSync(path.join(opsRoot, "departments/[department]/page.tsx"), "utf8");
  const seat = fs.readFileSync(path.join(opsRoot, "seat/page.tsx"), "utf8");
  assert.match(department, /Not operational/);
  assert.match(department, /task register not connected/i);
  assert.match(department, /data-source-state="not-connected"/);
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

test("public home composes public systems while operations retain server-side access control", () => {
  const home = fs.readFileSync(path.join(root, "app/page.tsx"), "utf8");
  const opsLayout = fs.readFileSync(path.join(root, "app/ops/layout.tsx"), "utf8");
  assert.match(home, /PublicShell/);
  assert.match(home, /Understand what is happening in Nigeria/);
  assert.match(home, /Civic Mandate/);
  assert.match(home, /Civic Brain/);
  assert.doesNotMatch(home, /requireStaffSession|listMeetings|@\/lib\/notion/);
  assert.match(opsLayout, /requireStaffSession/);
  assert.match(opsLayout, /redirect\("\/login"\)/);
  assert.doesNotMatch(home, /members nationwide|national impact|campaign/i);
});
