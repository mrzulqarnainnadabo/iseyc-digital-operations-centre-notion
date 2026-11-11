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
  assert.match(adapter, /DEPARTMENTS\.includes\(value\.departmentId as OpsDepartmentId\)/);
  assert.match(adapter, /DEPARTMENTS\.includes\(id as OpsDepartmentId\)/);
  assert.match(adapter, /payload\.limitations\.length > 10/);
  assert.match(adapter, /AbortSignal\.timeout\(8000\)/);
  assert.match(page, /getDepartmentSnapshots\(department\)/);
  assert.match(page, /Snapshot · not a live publisher feed/);
  assert.match(page, /record\.referencePeriod/);
  assert.match(page, /record\.geography\.label/);
  assert.match(page, /record\.publisher/);
  assert.match(page, /metric\.measurementType/);
  assert.match(page, /record\.limitations/);
  assert.match(page, /No cached or estimated replacement records are shown/);
});


test("department draft forms can attach a source selected from the validated Observatory feed", () => {
  const page = read("app/ops/departments/[department]/page.tsx");
  for (const componentPath of [
    "components/DepartmentProgrammePanel.tsx",
    "components/DepartmentWorkPlanPanel.tsx",
    "components/DepartmentReportPanel.tsx",
  ]) {
    const component = read(componentPath);
    assert.match(component, /DepartmentEvidenceOption/);
    assert.match(component, /evidenceOptions\.map\(\(option\)/);
    assert.match(component, /option\.sourceUrl/);
    assert.match(component, /The Observatory record ID is not stored/);
  }
  assert.match(page, /snapshots\.records\.map\(\(record\)/);
  assert.match(page, /evidenceOptions=\{evidenceOptions\}/);
});


test("department programme and work-plan drafts use existing priority, risk and ownership fields", () => {
  const types = read("lib/department-operations.ts");
  const programmes = read("lib/notion-department-programmes.ts");
  const workplans = read("lib/notion-department-workplans.ts");
  const programmeRoute = read("app/ops/api/department-programmes/route.ts");
  const workplanRoute = read("app/ops/api/department-workplans/route.ts");
  const programmePanel = read("components/DepartmentProgrammePanel.tsx");
  const workplanPanel = read("components/DepartmentWorkPlanPanel.tsx");

  assert.match(types, /priority: WorkPriority/);
  assert.match(types, /riskLevel: RiskLevel/);
  assert.match(types, /contributors: string/);
  assert.match(programmes, /properties\.Priority = \{ select: \{ name: input\.priority \} \}/);
  assert.match(programmes, /properties\["Risk Level"\] = \{ select: \{ name: input\.riskLevel \} \}/);
  assert.match(programmes, /properties\.Contributors = \{ rich_text:/);
  assert.match(workplans, /startDate: textProp\(props\["Start Date"\]\)/);
  assert.match(workplans, /properties\["Start Date"\] = \{ date:/);
  assert.match(workplans, /properties\.Priority = \{ select:/);
  assert.match(workplans, /properties\["Risk Level"\] = \{ select:/);
  assert.match(programmeRoute, /"priority"/);
  assert.match(programmeRoute, /"riskLevel"/);
  assert.match(workplanRoute, /"startDate"/);
  assert.match(workplanRoute, /"contributors"/);
  assert.match(programmePanel, /Supporting teams \/ roles/);
  assert.match(workplanPanel, /Supporting teams \/ roles/);
});

test("department report drafts distinguish completed outputs from planned work", () => {
  const reports = read("lib/notion-department-reports.ts");
  const route = read("app/ops/api/department-reports/route.ts");
  const panel = read("components/DepartmentReportPanel.tsx");
  assert.match(reports, /outputs: textProp\(props\.Outputs\)/);
  assert.match(reports, /plannedWork: textProp\(props\["Planned Work"\]\)/);
  assert.match(reports, /preparedByRole: textProp\(props\["Prepared By Role"\]\)/);
  assert.match(reports, /properties\.Outputs = \{ rich_text:/);
  assert.match(reports, /properties\["Planned Work"\] = \{ rich_text:/);
  assert.match(route, /"outputs"/);
  assert.match(route, /"plannedWork"/);
  assert.match(route, /"preparedByRole"/);
  assert.match(panel, /Outputs delivered/);
  assert.match(panel, /Planned work/);
  assert.match(panel, /Prepared by role · title only/);
  assert.doesNotMatch(reports, /Reviewed By Role|Budget Summary/);
  assert.doesNotMatch(route, /"reviewedByRole"|"budgetSummary"/);
});




test("each department receives grounded evidence interpretation and a next verification step", () => {
  const briefs = read("lib/department-evidence-briefs.ts");
  const page = read("app/ops/departments/[department]/page.tsx");
  for (const department of ["education", "health", "digital-systems", "civic-affairs"]) {
    assert.match(briefs, new RegExp('"' + department + '"|\\b' + department + ':'));
  }
  assert.match(briefs, /classroom quality, teacher availability, learning outcomes/);
  assert.match(briefs, /Kaduna facility conditions, medicine availability, staffing/);
  assert.match(briefs, /household device ownership, internet quality, digital-skills prevalence/);
  assert.match(briefs, /civic participation, public trust, representation, accountability/);
  assert.match(page, /Turn evidence into better questions/);
  assert.match(page, /What it cannot establish/);
  assert.match(page, /Next evidence step/);
});
