const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("department programme work-plan and report APIs are authenticated draft-only and fail closed", () => {
  for (const name of ["department-programmes", "department-workplans", "department-reports"]) {
    const route = read(`app/ops/api/${name}/route.ts`);
    assert.match(route, /requireStaffSession/);
    assert.match(route, /isSameOriginRequest/);
    assert.match(route, /privateJson/);
    assert.match(route, /isOpsDepartmentId/);
    assert.match(route, /Invalid pagination cursor/);
  }
  assert.match(read("app/ops/api/department-programmes/route.ts"), /Only Planning or Draft/);
  assert.match(read("app/ops/api/department-workplans/route.ts"), /Planned/);
  assert.match(read("app/ops/api/department-reports/route.ts"), /not institutional approval/);
});

test("department programme work-plan and report Notion adapters bind internal databases", () => {
  for (const file of [
    "lib/notion-department-programmes.ts",
    "lib/notion-department-workplans.ts",
    "lib/notion-department-reports.ts",
  ]) {
    const source = read(file);
    assert.match(source, /assertInternalDb/);
    assert.match(source, /NOTION_DEPARTMENT_/);
  }
  const notion = read("lib/notion.ts");
  assert.match(notion, /NOTION_DEPARTMENT_PROGRAMMES_DATABASE_ID/);
  assert.match(notion, /NOTION_DEPARTMENT_WORKPLANS_DATABASE_ID/);
  assert.match(notion, /NOTION_DEPARTMENT_REPORTS_DATABASE_ID/);
});

test("department desks mount programme work-plan and report panels with tools", () => {
  assert.match(read("components/DepartmentProgrammePanel.tsx"), /Save programme draft/);
  assert.match(read("components/DepartmentWorkPlanPanel.tsx"), /Save work-plan item/);
  assert.match(read("components/DepartmentReportPanel.tsx"), /Save report draft/);
  const desk = read("app/ops/departments/[department]/page.tsx");
  assert.match(desk, /DepartmentProgrammePanel/);
  assert.match(desk, /DepartmentWorkPlanPanel/);
  assert.match(desk, /DepartmentReportPanel/);
  assert.match(desk, /id="tools"/);
  assert.match(desk, /fn\.activities/);
  assert.match(desk, /fn\.outputs/);
  assert.match(desk, /task register/i);
  assert.match(desk, /Not connected/);
});

test("readiness documents department operating architecture without inventing live data", () => {
  const readiness = read("app/ops/readiness/page.tsx");
  assert.match(readiness, /DepartmentArchitectureDiagram/);
  assert.match(readiness, /NOTION_DEPARTMENT_/);
  assert.match(readiness, /No programme instances are invented/);
});
