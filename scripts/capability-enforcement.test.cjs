const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("requireCapability authenticates before authorizing", () => {
  const source = read("lib/require-capability.ts");
  assert.match(source, /requireStaffSession/);
  assert.match(source, /sessionAllows/);
  assert.match(source, /modeFromStaffSession/);
  assert.match(source, /status: 401/);
  assert.match(source, /status: 403/);
  assert.match(source, /CAPABILITY_DENIED/);
});

test("mutating department routes require draft capabilities", () => {
  assert.match(read("app/ops/api/department-programmes/route.ts"), /ops\.draft\.programme/);
  assert.match(read("app/ops/api/department-workplans/route.ts"), /ops\.draft\.workplan/);
  assert.match(read("app/ops/api/department-reports/route.ts"), /ops\.draft\.report/);
});

test("action progress requires appointment capability and still fails closed", () => {
  const source = read("app/ops/api/actions/[id]/route.ts");
  assert.match(source, /ops\.action\.progress/);
  assert.match(source, /ACTION_AUTHORITY_UNAVAILABLE|Individual officer identity/);
  assert.doesNotMatch(source, /requireStaffSession\(\)/);
});

test("register POST maps kind to capability", () => {
  const source = read("app/ops/api/registers/[kind]/route.ts");
  assert.match(source, /ops\.action\.propose/);
  assert.match(source, /ops\.draft\.communications/);
  assert.match(source, /ops\.meeting\.standard/);
});

test("API routes no longer use bare requireStaffSession", () => {
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === "route.ts") {
        const source = fs.readFileSync(full, "utf8");
        assert.doesNotMatch(
          source,
          /requireStaffSession/,
          `route still uses requireStaffSession: ${full}`
        );
      }
    }
  }
  walk(path.join(root, "app"));
});

test("shared staff matrix still excludes approve publish assign progress", () => {
  const source = read("lib/session-capabilities.ts");
  assert.match(source, /ops\.draft\.communications/);
  assert.match(source, /APPOINTMENT_REQUIRED_CAPABILITIES/);
  for (const cap of ["ops.approve", "ops.publish", "ops.assign", "ops.action.progress"]) {
    assert.match(source, new RegExp(cap.replace(".", "\\.")));
  }
});

test("Notion client uses a bounded timeout", () => {
  assert.match(read("lib/notion.ts"), /timeoutMs:\s*20_000/);
});
