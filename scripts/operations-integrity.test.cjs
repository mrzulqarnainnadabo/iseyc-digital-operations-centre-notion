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
    ["actions", /Not operational — no action records are being managed here/],
    ["chamber", /Not operational — no Chamber sessions or resolutions are recorded here/],
    ["media", /Not operational — no editorial or publishing workflow is connected/]
  ];
  for (const [name, warning] of modules) {
    const source = fs.readFileSync(path.join(opsRoot, name, "page.tsx"), "utf8");
    assert.match(source, warning, `${name} must state its non-operational status`);
    assert.match(source, /Required workflow before launch/);
    assert.match(source, /\/ops\/readiness/);
  }
});
