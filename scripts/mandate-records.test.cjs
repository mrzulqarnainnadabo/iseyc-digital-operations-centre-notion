const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("mandate feed uses allowlisted public API only", () => {
  const source = read("lib/mandate-records.ts");
  assert.match(source, /2027-street-mandate\.vercel\.app/);
  assert.match(source, /\/api\/v1\/community-records/);
  assert.match(source, /publicationBoundary !== "published-only"/);
  assert.match(source, /contractVersion !== CONTRACT/);
  assert.match(source, /publicationStatus !== "published"/);
  assert.doesNotMatch(source, /@notionhq\/client|NOTION_TOKEN|listMeetings|requireStaffSession/);
  assert.match(source, /prevalenceNote/);
  assert.match(source, /AbortSignal\.timeout\(8000\)/);
  assert.match(source, /matchingMode: "provisional-keyword"/);
  assert.match(source, /primaryDepartment/);
  assert.match(source, /classificationNote/);
});

test("department pages load mandate records without private Notion", () => {
  const page = read("app/departments/[department]/page.tsx");
  assert.match(page, /getDepartmentMandateRecords/);
  assert.match(page, /Published community records/);
  assert.match(page, /prevalenceNote/);
  const prevalenceDisclosureAt = page.indexOf("{mandate.prevalenceNote}");
  const readyBranchAt = page.indexOf('{mandate.status === "ready"');
  assert.ok(prevalenceDisclosureAt >= 0 && prevalenceDisclosureAt < readyBranchAt, "prevalence limitation must render before ready/empty/error branching");
  assert.match(page, /classificationNote/);
  assert.match(page, /provisional keyword/);
  assert.match(page, /Contribute information/);
  assert.match(page, /iseyc-civic-brain\.vercel\.app/);
  assert.doesNotMatch(page, /@\/lib\/notion|requireStaffSession|listMeetings/);
});

test("public homepage leads with the institution and departments before supporting intelligence", () => {
  const page = read("app/page.tsx");
  const institutionAt = page.indexOf('aria-labelledby="home-title"');
  const departmentsAt = page.indexOf('aria-labelledby="departments-heading"');
  const intelligenceAt = page.indexOf('aria-labelledby="intelligence-title"');
  assert.ok(institutionAt >= 0 && departmentsAt > institutionAt && intelligenceAt > departmentsAt);
  assert.match(page, /getDepartmentMandateRecords/);
  assert.match(page, /getDepartmentEvidence/);
  assert.match(page, /No national coverage score is claimed/);
});
