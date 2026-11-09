const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("public homepage establishes ISEYC and departments before supporting intelligence", () => {
  const home = read("app/page.tsx");
  const shell = read("components/PublicShell.tsx");
  const registry = read("lib/departments.ts");
  assert.match(home, /PublicShell/);
  assert.match(home, /getDepartmentMandateRecords/);
  assert.match(home, /getDepartmentEvidence/);
  assert.match(home, /Building capable people\. Stronger communities\./);
  assert.match(home, /What communities report\. What evidence supports\. What is still unknown\./);
  assert.match(home, /published records only/);
  assert.match(home, /No national coverage score is claimed/);
  assert.match(home, /Provisional keyword match · not institutional taxonomy/);
  assert.match(home, /not a measure of national need/);
  assert.match(home, /Institutional responsibility mapping remains incomplete/);
  assert.doesNotMatch(home, /requireStaffSession|listMeetings|@\/lib\/notion/);
  for (const label of ["Education & Capacity Building", "Health & Well-being", "Software & Technology", "Civic Department"]) {
    assert.ok(home.includes("departments.map"));
    assert.ok(registry.includes(label), `Missing department: ${label}`);
  }
  for (const label of ["Home", "Departments", "Explore", "Report", "Method"]) {
    assert.match(shell, new RegExp(`label: "${label}"`));
  }
  assert.doesNotMatch(shell, /Public Information & Civic Intelligence/);
  assert.doesNotMatch(shell, /public-mobile-menu/);
  const institutionPosition = home.indexOf('aria-labelledby="home-title"');
  const departmentsPosition = home.indexOf('aria-labelledby="departments-heading"');
  const intelligencePosition = home.indexOf('aria-labelledby="intelligence-title"');
  assert.ok(institutionPosition >= 0 && departmentsPosition > institutionPosition && intelligencePosition > departmentsPosition, "institution and departments must precede supporting intelligence");
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


test("Software & Technology has one canonical public route across homepage, directory and department workspace", () => {
  const registry = read("lib/departments.ts");
  const detail = read("app/departments/[department]/page.tsx");
  const home = read("app/page.tsx");
  const directory = read("app/departments/page.tsx");
  const workspace = read("components/DepartmentWorkspace.tsx");
  assert.match(registry, /slug === "software-technology" \? "technology" : slug/);
  assert.match(registry, /slug === "technology" \? "software-technology" : slug/);
  assert.match(detail, /getDepartmentRouteSlug/);
  assert.match(home, /getDepartmentRouteSlug\(department\.slug\)/);
  assert.match(directory, /getDepartmentRouteSlug\(department\.slug\)/);
  assert.match(workspace, /publicSlug:"software-technology"/);
});

test("Health uses its calm teal identity consistently across public and internal department surfaces", () => {
  const css = read("app/globals.css");
  const readiness = read("app/ops/readiness/page.tsx");
  assert.match(css, /dept-card--health \{ border-left-color: #287a70; \}/);
  assert.match(css, /department-tile--health\{[^}]*#e5f1ee[^}]*#287a70/);
  assert.match(css, /department-hero--health\{[^}]*#e5f1ee[^}]*#287a70/);
  assert.match(readiness, /tone:"border-l-\[#287a70\] bg-\[#e5f1ee\]"/);
});


test("ISEYC institutional branding uses the supplied official seal and one approved identity system", () => {
  const wordmark = read("public/iseyc-wordmark.svg");
  const seal = read("public/iseyc-seal.svg");
  const shell = read("components/PublicShell.tsx");
  const layout = read("app/layout.tsx");
  const css = read("app/globals.css");
  const standard = read("docs/ISEYC-BRAND-SYSTEM.md");
  assert.match(wordmark, /href="\/iseyc-seal\.svg"/);
  assert.match(wordmark, /Empowering Youth, Shaping Communities/);
  assert.match(seal, /official seal/);
  assert.match(shell, /src="\/iseyc-wordmark\.svg"/);
  assert.match(shell, /UNDERSTANDING PUBLIC NEEDS/);
  assert.match(layout, /icons: \{ icon: "\/iseyc-seal\.svg"/);
  assert.match(css, /--iseyc-forest-950: #071f18/);
  assert.match(css, /--iseyc-forest-900: #0b2d22/);
  assert.match(css, /--iseyc-gold-700: #80621f/);
  assert.match(standard, /The supplied official ISEYC seal remains the source of truth/);
});
