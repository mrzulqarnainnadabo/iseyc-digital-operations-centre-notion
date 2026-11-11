const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("department register readiness checks the app's own credentials and exact schemas", () => {
  const adapter = read("lib/department-register-readiness.ts");
  const notion = read("lib/notion.ts");
  const page = read("app/ops/readiness/page.tsx");

  for (const env of [
    "NOTION_DEPARTMENT_PROGRAMMES_DATABASE_ID",
    "NOTION_DEPARTMENT_REPORTS_DATABASE_ID",
  ]) {
    assert.ok(adapter.includes(env), "missing register env: " + env);
    assert.ok(notion.includes(env), "database ID is not an approved internal ID: " + env);
  }

  for (const property of [
    "Programme / Work Item",
    "Department",
    "Work Type",
    "Intended Outcome",
    "Acceptance Criteria",
    "Priority",
    "Risk Level",
    "Contributors",
    "Report / Period",
    "Reporting Cycle",
    "Completed Work",
    "Outputs",
    "Planned Work",
    "Prepared By Role",
    "Data Limitations",
  ]) assert.ok(adapter.includes(property), "required schema field missing: " + property);

  assert.match(adapter, /client\.databases\.retrieve/);
  assert.doesNotMatch(adapter, /client\.databases\.query|client\.pages\.(create|update)/);
  assert.match(adapter, /assertInternalDb\(databaseId, envName\)/);
  assert.match(adapter, /schemaReady: missingProperties\.length === 0/);
  assert.match(page, /verifyDepartmentRegisterReadiness\(\)/);
  assert.match(page, /read-only check reads no programme or report rows and does not test write permissions or grant staff authority/);
  assert.match(page, /Access not verified/);
  assert.match(page, /Schema incomplete/);
  assert.match(page, /configFlags\(\)/);
  assert.match(page, /Shared coordination connections/);
  assert.match(page, /does not establish individual identity or appointment/);
  assert.match(page, /do not prove that the Notion API can read or write each register/);
});

test("department register readiness never exposes records or credentials", () => {
  const adapter = read("lib/department-register-readiness.ts");
  assert.doesNotMatch(adapter, /process\.env\.NOTION_TOKEN\s*\)/);
  assert.doesNotMatch(adapter, /Appointee Name|Official Email|Applicant Name/);
  assert.match(adapter, /missingProperties/);
  assert.match(adapter, /configured: false/);
  assert.match(adapter, /accessible: false/);
});
