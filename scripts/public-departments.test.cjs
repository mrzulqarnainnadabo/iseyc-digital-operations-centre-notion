const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("public home and navigation expose all four named departments", () => {
  const home = read("app/page.tsx");
  const shell = read("components/PublicShell.tsx");
  const registry = read("lib/departments.ts");
  for (const label of ["Education and Capacity Building", "Department of Health and Well-being", "Software and Technology", "Civic Department"]) {
    assert.ok(home.includes("departments.map"));
    assert.ok(registry.includes(label), `Missing department: ${label}`);
  }
  assert.match(shell, /href: "\/departments", label: "Departments"/);
  assert.match(home, /Four departments\. One institution\. Clear public information\./);
  assert.match(home, /Digital infrastructure behind the departments/);
  const departmentsPosition = home.indexOf('aria-labelledby="departments-heading"');
  const systemsPosition = home.indexOf('aria-labelledby="systems-heading"');
  assert.ok(departmentsPosition >= 0 && systemsPosition > departmentsPosition, "departments must precede supporting systems");
});

test("department detail routes are public and never query private operations records", () => {
  const page = read("app/departments/[department]/page.tsx");
  const directory = read("app/departments/page.tsx");
  for (const file of [page, directory]) {
    assert.doesNotMatch(file, /requireStaffSession|listMeetings|@\/lib\/notion|app\/ops/);
    assert.match(file, /PublicShell/);
  }
  assert.match(page, /notFound\(\)/);
  assert.match(page, /generateStaticParams/);
});

test("department topics cover the requested distinct public information needs", () => {
  const registry = read("lib/departments.ts");
  for (const phrase of [/School infrastructure/i, /Teacher availability/i, /Literacy, skills/i, /Primary healthcare access/i, /Essential medicines/i, /service availability/i, /Maternal & child health/i, /Digital literacy/i, /Digital public infrastructure/i, /Responsible technology & AI/i, /Civic education & responsibilities/i, /Institutional mandates/i, /Accountability & transparency/i]) {
    assert.match(registry, phrase, `Missing topic: ${phrase}`);
  }
});

test("evidence framework distinguishes four classifications and never upgrades announcements or reports", () => {
  const evidence = read("lib/public-evidence.ts");
  const page = read("app/departments/[department]/page.tsx");
  for (const label of ["Published public data", "Institutional announcement", "Community report", "Verified implementation"]) {
    assert.ok(evidence.includes(label), `Missing evidence classification ${label}`);
  }
  assert.match(evidence, /verification/);
  assert.match(page, /Community reports do not establish prevalence/);
  assert.match(page, /Announcements do not prove implementation/);
  assert.match(page, /Published statistics do not automatically describe current conditions/);
});

test("Observatory adapter uses a bounded refresh cache and requests only verified allowlisted public series", () => {
  const evidence = read("lib/public-evidence.ts");
  const page = read("app/departments/[department]/page.tsx");
  assert.match(evidence, /https:\/\/iseyc-civic-intelligence-observatory\.vercel\.app/);
  assert.match(evidence, /\/api\/evidence\/observations/);
  assert.match(evidence, /wb-nga-se-prm-enrr/);
  assert.match(evidence, /wb-nga-sh-dyn-mort/);
  assert.match(page, /dynamic = "force-dynamic"/);
  assert.match(evidence, /cache: "no-store"/);
  assert.match(evidence, /CACHE_TTL_MS = 60 \* 60 \* 1000/);
  assert.match(evidence, /FAILURE_CACHE_TTL_MS = 60 \* 1000/);
  assert.match(evidence, /MAX_RECEIPT_AGE_MS = 24 \* 60 \* 60 \* 1000/);
  assert.match(evidence, /AbortSignal\.timeout\(8000\)/);
  assert.match(evidence, /WORLD_BANK_DATA_URLS/);
  assert.match(evidence, /candidate\.geoLevel !== "national"/);
  assert.match(evidence, /candidate\.geoCode !== "NGA"/);
  assert.match(evidence, /candidate\.datasetId !== WORLD_BANK_DATASET_ID/);
  assert.match(evidence, /candidate\.sourceUrl !== expectedSource/);
  assert.match(evidence, /candidate\.methodologyRef !== expectedMethodologyRef/);
  assert.match(evidence, /payload\.receipt\.datasetId !== WORLD_BANK_DATASET_ID/);
  assert.match(evidence, /status: "unavailable"/);
  assert.match(evidence, /status: "invalid"/);
  assert.match(evidence, /status: "not-integrated"/);
});

test("evidence pages disclose publisher, unit, geography, reference period, retrieval time and limitations", () => {
  const page = read("app/departments/[department]/page.tsx");
  for (const field of ["referencePeriod", "indicator.unit", "sourcePublisher", "methodologyNotes", "retrievedAt", "limitations", "sourceUrl"]) {
    assert.ok(page.includes(field), `Missing provenance field ${field}`);
  }
  assert.match(page, /National estimate · Nigeria \(NGA\)/);
  assert.match(page, /publication date for these observations/);
  assert.match(page, /receipt over 24 hours old/);
  assert.match(page, /does not show expired cached data or substitute zero/);
  assert.match(page, /No proxy statistic is substituted/);
});

test("department routes are present in the served route manifest", () => {
  const routes = JSON.parse(read("public/manus-routes.json"));
  assert.ok(routes.routes.some((route) => route.path === "/departments"));
  assert.ok(routes.routes.some((route) => route.path === "/departments/:department"));
});
