const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "../lib/department-snapshots.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const loaded = new Module(sourcePath, module);
loaded.filename = sourcePath;
loaded.paths = Module._nodeModulePaths(path.dirname(sourcePath));
loaded._compile(compiled, sourcePath);
const { getDepartmentSnapshots } = loaded.exports;

const baseObservation = (overrides = {}) => ({
  id: "ncc-broadband-penetration-sep-2026",
  title: "Broadband penetration",
  value: 59.05,
  unit: "% subscription-based penetration",
  referencePeriod: "September 2026",
  measurementType: "Active broadband subscriptions as a percentage of estimated population",
  sourceId: "ncc-industry-statistics-2026",
  sourcePublisher: "Nigerian Communications Commission (NCC)",
  sourceUrl: "https://ncc.gov.ng/market-data-reports/industry-statistics",
  geoLevel: "national",
  geographicCoverage: "Nigeria",
  departments: ["software-technology", "civic"],
  sourceType: "official_source",
  interpretation: "Subscription-based penetration, not unique internet users.",
  limitations: ["Subscriptions are not unique people."],
  ...overrides,
});

const payload = (overrides = {}) => {
  const observations = [
    baseObservation(),
    baseObservation({
      id: "ncc-broadband-subscriptions-sep-2026",
      title: "Active broadband subscriptions",
      value: 128020463,
      unit: "subscriptions",
      measurementType: "Active broadband subscriptions across mobile and fixed services",
    }),
  ];
  return {
    contractVersion: "1.0.0",
    source: "iseyc-observatory-curated-source-snapshots-v1",
    status: "curated",
    checkedAt: "2026-11-12",
    recordCount: observations.length,
    observations,
    catalogOnlySources: [{
      id: "ncc-state-coverage",
      title: "NCC state-level connectivity coverage",
      publisher: "Nigerian Communications Commission",
      url: "https://ncc.gov.ng/market-data-reports/industry-statistics",
      status: "partial",
      note: "State-level coverage extraction is pending.",
      departments: ["software-technology"],
    }],
    reconciliationNotes: [{
      id: "digital-access-measurement-definitions",
      severity: "high",
      title: "Digital access measures use different denominators",
      detail: "Subscription penetration is not the same as individual internet use.",
      action: "Obtain state-level coverage and quality measures.",
    }],
    limitations: ["Curated, dated transcriptions; not live publisher feeds."],
    ...overrides,
  };
};

test("department adapter maps the new source-snapshot contract and department IDs", async (t) => {
  const originalFetch = global.fetch;
  let calls = 0;
  let requestedUrl = "";
  global.fetch = async (url) => {
    calls += 1;
    requestedUrl = String(url);
    return new Response(JSON.stringify(payload()), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  t.after(() => { global.fetch = originalFetch; });

  const result = await getDepartmentSnapshots("digital-systems");
  assert.equal(result.status, "ready");
  assert.equal(result.records.length, 2);
  assert.equal(result.totalRecords, 2);
  assert.equal(result.records[0].departmentId, "digital-systems");
  assert.ok(result.records[0].departmentIds.includes("digital-systems"));
  assert.equal(result.records[0].metrics[0].value, "59.05");
  assert.equal(result.records[0].metrics[0].label, "Reported value");
  assert.ok(!result.records.some((record) => record.recordStatus === "superseded"));
  assert.equal(result.catalogue.length, 1);
  assert.equal(result.reconciliationNotes.length, 1);
  assert.match(requestedUrl, /api\/evidence\/source-snapshots/);
  assert.equal(new URL(requestedUrl).searchParams.get("departmentId"), "software-technology");

  const cached = await getDepartmentSnapshots("digital-systems");
  assert.equal(cached.status, "ready");
  assert.equal(calls, 1, "same department request should use bounded per-runtime cache");
});

test("department adapter hides superseded health totals from normal department views", async (t) => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    const health = payload();
    health.observations = [
      baseObservation({ id: "health-current-total", title: "Current health expenditure", departments: ["health", "civic"], sourceType: "published_research" }),
      baseObservation({ id: "health-old-total", title: "Earlier health expenditure total", value: 614.55, unit: "₦ billion", departments: ["health", "civic"], sourceType: "published_research", recordStatus: "superseded", supersededBy: "health-current-total" }),
    ];
    health.recordCount = 2;
    health.catalogOnlySources = [];
    health.reconciliationNotes = [{
      id: "health-total-reconciliation", severity: "high",
      title: "Health expenditure totals differ",
      detail: "Two publications report different totals.",
      action: "Reconcile state-level BIRs."
    }];
    return new Response(JSON.stringify(health), { status: 200 });
  };
  t.after(() => { global.fetch = originalFetch; });

  const result = await getDepartmentSnapshots("health");
  assert.equal(result.status, "ready");
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].id, "health-current-total");
  assert.ok(result.reconciliationNotes.some((note) => note.id === "health-total-reconciliation"));
});

test("department adapter maps civic-affairs to the Observatory civic department", async (t) => {
  const originalFetch = global.fetch;
  let requestedUrl = "";
  global.fetch = async (url) => {
    requestedUrl = String(url);
    const civic = payload();
    civic.observations = [baseObservation({ departments: ["civic"], id: "civic-fiscal-context" })];
    civic.recordCount = 1;
    civic.catalogOnlySources = [];
    civic.reconciliationNotes = [];
    return new Response(JSON.stringify(civic), { status: 200 });
  };
  t.after(() => { global.fetch = originalFetch; });

  const result = await getDepartmentSnapshots("civic-affairs");
  assert.equal(result.status, "ready");
  assert.equal(result.records[0].departmentId, "civic-affairs");
  assert.equal(new URL(requestedUrl).searchParams.get("departmentId"), "civic");
});

test("department adapter rejects mismatched counts and withholds invalid records", async (t) => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    const bad = payload();
    bad.recordCount = 99;
    return new Response(JSON.stringify(bad), { status: 200 });
  };
  t.after(() => { global.fetch = originalFetch; });

  const result = await getDepartmentSnapshots("health");
  assert.equal(result.status, "invalid");
  assert.deepEqual(result.records, []);
});

test("department adapter fails closed when Observatory is unavailable", async (t) => {
  const originalFetch = global.fetch;
  global.fetch = async () => new Response("unavailable", { status: 503 });
  t.after(() => { global.fetch = originalFetch; });

  const result = await getDepartmentSnapshots("education");
  assert.equal(result.status, "unavailable");
  assert.deepEqual(result.records, []);
});
