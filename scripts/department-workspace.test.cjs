const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("department workspaces use the approved four-department identity and real registers", () => {
  const adapter = read("lib/department-workspace.ts");
  const page = read("app/ops/departments/[department]/page.tsx");
  const ui = read("components/DepartmentWorkspace.tsx");
  const css = read("app/globals.css");
  for (const name of ["Education & Capacity Building", "Health & Well-being", "Software & Technology", "Civic Department"]) assert.ok(adapter.includes(name));
  assert.match(adapter, /NOTION_PROGRAMMES_DATABASE_ID/);
  assert.match(adapter, /NOTION_DEPARTMENT_REPORTS_DATABASE_ID/);
  assert.match(adapter, /NOTION_LEARNING_DATABASE_ID/);
  assert.match(adapter, /All Departments/);
  assert.match(adapter, /filter:\{property:"Department",select:\{equals:department\}\}/);
  assert.match(adapter, /Status:\{status:\{name:"Proposed"\}\}/);
  assert.match(adapter, /Status:\{status:\{name:"Draft"\}\}/);
  assert.match(adapter, /timeZone:"Africa\/Lagos"/);
  assert.match(adapter, /dueSoonWork:dueSoon.length/);
  assert.match(page, /DepartmentWorkspace/);
  for (const tab of ["overview", "work", "reports", "learning", "meetings"]) assert.ok(ui.includes(`"${tab}"`));
  for (const style of ["education", "health", "technology", "civic"]) assert.ok(css.includes(`.department-desk--${style}`));
});

test("department report drafts can be assembled from register records without inventing outcomes", () => {
  const ui = read("components/DepartmentWorkspace.tsx");
  assert.match(ui, /Build draft from work register/);
  assert.match(ui, /No work items are marked Completed in the connected register/);
  assert.match(ui, /No proposed or active work items are recorded in the connected register/);
  assert.match(ui, /does not independently verify delivery, outcomes, reach or expenditure/);
  assert.match(ui, /Missing risk assessments are not assumed to be low/);
});

test("learning workspace shows approved modules without implying individual completion", () => {
  const adapter = read("lib/department-workspace.ts");
  const ui = read("components/DepartmentWorkspace.tsx");
  const notion = read("lib/notion.ts");
  assert.match(adapter, /Learning Module \/ Assessment/);
  assert.match(adapter, /Mandatory/);
  assert.match(adapter, /Learning Objectives/);
  assert.match(notion, /NOTION_LEARNING_DATABASE_ID/);
  assert.match(ui, /Learning & competency library/);
  assert.match(ui, /not a record of individual completion/);
});

test("department programme intake requires owner, intended outcome, acceptance criteria and dated delivery", () => {
  const adapter = read("lib/department-workspace.ts");
  const route = read("app/ops/api/departments/[department]/route.ts");
  const ui = read("components/DepartmentWorkspace.tsx");
  assert.match(adapter, /input\.owner\.trim\(\)\.length<2/);
  assert.match(adapter, /input\.outcome\.trim\(\)\.length<8/);
  assert.match(adapter, /input\.acceptance\.trim\(\)\.length<5/);
  assert.match(adapter, /input\.dueDate<input\.startDate/);
  assert.match(route, /requireStaffSession/);
  assert.match(route, /isSameOriginRequest/);
  assert.match(route, /readBoundedJson/);
  assert.match(ui, /Accountable role/);
  assert.match(ui, /Acceptance criteria/);
  assert.match(ui, /Save proposed work/);
});

test("department reporting preserves limitations and keeps reports in Draft until human review", () => {
  const adapter = read("lib/department-workspace.ts");
  const route = read("app/ops/api/departments/[department]/route.ts");
  const ui = read("components/DepartmentWorkspace.tsx");
  assert.match(adapter, /Data Limitations/);
  assert.match(adapter, /Status:\{status:\{name:"Draft"\}\}/);
  assert.match(adapter, /input\.periodEnd<input\.periodStart/);
  assert.match(route, /Draft — not submitted or approved/);
  assert.match(ui, /Data limitations/);
  assert.match(ui, /Save report draft/);
  assert.match(ui, /Submission and acceptance require the authorised review process/);
});

test("department workspace fails closed and never substitutes demo records", () => {
  const route = read("app/ops/api/departments/[department]/route.ts");
  const ui = read("components/DepartmentWorkspace.tsx");
  assert.match(route, /No records are shown/);
  assert.match(route, /No cached or estimated records are shown/);
  assert.match(ui, /setWorkspace\(null\)/);
  assert.match(ui, /No programme or work records yet/);
  assert.match(ui, /Register unavailable; no records are shown/);
});
