const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("canonical department labels are used without changing stable public slugs", () => {
  const departments = read("lib/departments.ts");
  for (const label of [
    "Education and Capacity Building",
    "Department of Health and Well-being",
    "Software and Technology",
    "Civic Department",
  ]) assert.ok(departments.includes(`name: "${label}"`), `missing canonical label: ${label}`);

  assert.match(departments, /slug: "education"/);
  assert.match(departments, /slug: "health"/);
  assert.match(departments, /slug: "technology"/);
  assert.match(departments, /slug: "civic"/);
});

test("Notion mapping accepts canonical and legacy labels while preserving unknown values", () => {
  const operations = read("lib/department-operations.ts");
  for (const label of [
    "education & capacity building",
    "education and capacity building",
    "health & well-being",
    "department of health and well-being",
    "software & technology",
    "software and technology",
    "civic department",
  ]) assert.ok(operations.includes(`case "${label}":`), `missing Notion mapping: ${label}`);

  assert.match(operations, /default:\s*return "Unspecified"/);
  assert.match(operations, /id: "education"/);
  assert.match(operations, /id: "health"/);
  assert.match(operations, /id: "digital-systems"/);
  assert.match(operations, /id: "civic-affairs"/);
});

test("department operating model defines the shared intelligence-to-action boundaries", () => {
  const model = read("docs/intelligence-to-action-operating-model.md");
  for (const phrase of [
    "Intelligence Observatory",
    "not a fifth department",
    "all four departments",
    "Civic Department",
    "Civic Mandate",
    "Civic Brain",
    "only records explicitly approved for publication",
    "Kaduna South",
    "not a prevalence estimate",
    "human review",
    "stable department IDs",
  ]) assert.ok(model.includes(phrase), `operating model missing: ${phrase}`);
});


test("each department workspace renders only validated Observatory evidence or an explicit gap state", () => {
  const page = read("app/ops/departments/[department]/page.tsx");
  assert.match(page, /getDepartmentEvidence\(evidenceSlug\)/);
  assert.match(page, /id="intelligence"/);
  assert.match(page, /evidence\.status === "ready" \|\| evidence\.status === "stale"/);
  assert.match(page, /evidence\.status === "not-integrated"/);
  assert.match(page, /evidence\.status === "invalid"/);
  assert.match(page, /observation\.referencePeriod/);
  assert.match(page, /observation\.unit/);
  assert.match(page, /observation\.sourceAttribution/);
  assert.match(page, /observation\.geoLevel/);
  assert.match(page, /observation\.sourceUrl/);
  assert.match(page, /No proxy metric is substituted/);
});


test("department snapshot adapter validates the Observatory v1 contract and preserves source distinctions", () => {
  const adapter = read("lib/department-snapshots.ts");
  const page = read("app/ops/departments/[department]/page.tsx");
  assert.match(adapter, /https:\/\/iseyc-civic-intelligence-observatory\.vercel\.app/);
  assert.match(adapter, /\/api\/evidence\/snapshots/);
  assert.match(adapter, /iseyc-observatory-national-snapshots-v1/);
  assert.match(adapter, /contractVersion !== "1\.0\.0"/);
  assert.match(adapter, /payload\.recordCount !== payload\.records\.length/);
  assert.match(adapter, /httpsUrl\(value\.sourceUrl\)/);
  assert.match(adapter, /value\.limitations\.every\(nonEmpty\)/);
  assert.match(adapter, /departmentIds\.every\(nonEmpty\)/);
  assert.match(adapter, /payload\.limitations\.length > 10/);
  assert.match(adapter, /AbortSignal\.timeout\(8000\)/);
  assert.match(page, /getDepartmentSnapshots\(department\)/);
  assert.match(page, /Snapshot · not a live publisher feed/);
  assert.match(page, /record\.referencePeriod/);
  assert.match(page, /record\.geography\.label/);
  assert.match(page, /record\.publisher/);
  assert.match(page, /record\.limitations/);
  assert.match(page, /No cached or estimated replacement records are shown/);
});
