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
    "published-only",
    "Kaduna South",
    "not a prevalence estimate",
    "human review",
    "stable department IDs",
  ]) assert.ok(model.includes(phrase), `operating model missing: ${phrase}`);
});
