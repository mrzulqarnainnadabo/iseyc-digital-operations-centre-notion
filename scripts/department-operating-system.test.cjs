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
  const programmeRoute = read("app/ops/api/department-programmes/route.ts");
  assert.match(programmeRoute, /createDepartmentProgrammeDraft/);
  assert.doesNotMatch(programmeRoute, /input\.status|statusRaw/);
  assert.match(read("app/ops/api/department-workplans/route.ts"), /Proposed/);
  assert.match(read("app/ops/api/department-reports/route.ts"), /not institutional approval/);
  const reportRoute = read("app/ops/api/department-reports/route.ts");
  assert.match(reportRoute, /REPORT_TYPES: ReportType\[\] = \["Weekly", "Monthly", "Quarterly", "Annual"\]/);
  assert.match(reportRoute, /periodEnd < periodStart/);
  assert.match(reportRoute, /validDate\(periodStart\)/);
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
  assert.match(read("lib/notion-department-workplans.ts"), /NOTION_DEPARTMENT_PROGRAMMES_DATABASE_ID/);
  assert.match(notion, /NOTION_DEPARTMENT_REPORTS_DATABASE_ID/);
});

test("Notion adapters use the actual live register titles, property types and select options", () => {
  const programmes = read("lib/notion-department-programmes.ts");
  const workplans = read("lib/notion-department-workplans.ts");
  const reports = read("lib/notion-department-reports.ts");
  for (const source of [programmes, workplans, reports]) {
    assert.match(source, /"Education & Capacity Building"/);
    assert.match(source, /"Health & Well-being"/);
  }
  for (const source of [programmes, workplans]) {
    assert.match(source, /"Programme \/ Work Item"/);
    assert.match(source, /Status: \{ status: \{ name: "Proposed" \} \}/);
  }
  assert.match(programmes, /"Work Type": \{ select: \{ name: "Programme" \} \}/);
  assert.match(workplans, /"Work Type": \{ select: \{ name: "Operations" \} \}/);
  assert.match(reports, /NOTION_DEPARTMENT_REPORTS_DATABASE_ID/);
  for (const field of ["Report \/ Period", "Reporting Cycle", "Reporting Period Start", "Completed Work", "Risks & Blockers", "Decisions Required", "Outcomes \/ Evidence"]) {
    assert.ok(reports.includes(field), `Reports adapter is missing live schema field: ${field}`);
  }
  assert.match(reports, /Status: \{ status: \{ name: "Draft" \} \}/);
  for (const source of [programmes, workplans, reports]) {
    assert.match(source, /"digital-systems": "Software & Technology"/);
    assert.match(source, /"civic-affairs": "Civic Department"/);
  }
  assert.doesNotMatch(reports, /props\.Name|props\["Report type"\]|Status: \{ select:/);
  assert.match(reports, /properties\["Reporting Period Start"\] = \{\s*date: \{ start: input\.periodStart, \.\.\.\(input\.periodEnd/);
  assert.match(reports, /props\["Reporting Period Start"\]\?\.date\?\.end/);
  assert.doesNotMatch(reports, /Reporting Period End/);

});

test("unknown Notion department values remain Unspecified across all registers", () => {
  const model = read("lib/department-operations.ts");
  assert.match(model, /export type DepartmentRecordId = OpsDepartmentId \| "Cross-departmental" \| "Unspecified"/);
  assert.match(model, /default:\s*return "Unspecified"/);
  for (const file of [
    "lib/notion-department-programmes.ts",
    "lib/notion-department-workplans.ts",
    "lib/notion-department-reports.ts",
  ]) {
    const adapter = read(file);
    assert.match(adapter, /departmentIdFromNotionSelect\(textProp\(props\.Department\)\)/);
    assert.doesNotMatch(adapter, /let departmentId: OpsDepartmentId = "education"/);
  }
  assert.match(model, /case "software & technology":\s*return "digital-systems"/);
  assert.match(model, /case "civic department":\s*return "civic-affairs"/);
  assert.match(model, /WORKPLAN_REGISTER_ENV = PROGRAMME_REGISTER_ENV/);
  assert.match(model, /case "civic department":\s*return "civic-affairs"/);
});

test("department desks mount programme work-plan and report panels with tools", () => {
  assert.match(read("components/DepartmentProgrammePanel.tsx"), /Save programme proposal/);
  assert.match(read("components/DepartmentWorkPlanPanel.tsx"), /Save work-plan item/);
  assert.match(read("components/DepartmentReportPanel.tsx"), /Save report draft/);
  const desk = read("app/ops/departments/[department]/page.tsx");
  assert.match(desk, /DepartmentProgrammePanel/);
  assert.match(desk, /DepartmentWorkPlanPanel/);
  assert.match(desk, /DepartmentReportPanel/);
  assert.match(desk, /id="shared-tools"/);
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


test("department readiness and environment example document the two actual shared Notion registers", () => {
  const readiness = read("app/ops/readiness/page.tsx");
  const env = read(".env.example");
  assert.match(readiness, /IDCC — Programmes & Work Register/);
  assert.match(readiness, /IDCC — Department Reports & Scorecards/);
  assert.match(readiness, /Work Type = Operations/);
  assert.match(readiness, /do not create a duplicate work-plan database/);
  assert.doesNotMatch(readiness, /Create and share DCC Department Programmes, Work Plans and Reports databases/);
  assert.match(env, /NOTION_DEPARTMENT_PROGRAMMES_DATABASE_ID=/);
  assert.match(env, /NOTION_DEPARTMENT_REPORTS_DATABASE_ID=/);
  assert.doesNotMatch(env, /NOTION_DEPARTMENT_WORKPLANS_DATABASE_ID=/);
});


// The live Notion schema retains legacy select labels; UI-facing names remain canonical.
test("department adapters preserve canonical UI labels while writing exact live Notion select values", () => {
  const model = read("lib/department-operations.ts");
  assert.match(model, /name: "Software and Technology"/);
  assert.match(model, /name: "Civic Department"/);
  for (const file of [
    "lib/notion-department-programmes.ts",
    "lib/notion-department-workplans.ts",
    "lib/notion-department-reports.ts",
  ]) {
    const source = read(file);
    assert.match(source, /"digital-systems": "Software & Technology"/);
    assert.match(source, /"civic-affairs": "Civic Department"/);
    assert.match(source, /Department: \{ select: \{ name: DEPARTMENT_SELECT\[input\.departmentId\] \} \}/);
  }
  assert.match(model, /case "software & technology":\s*return "digital-systems"/);
  assert.match(model, /case "civic department":\s*return "civic-affairs"/);
});
