const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "lib/session-capabilities.ts"), "utf8");

test("shared staff cannot approve, publish, assign, or attribute action progress", () => {
  assert.match(source, /ops\.action\.progress/);
  assert.match(source, /ops\.approve/);
  assert.match(source, /ops\.publish/);
  assert.match(source, /ops\.assign/);
  assert.match(source, /APPOINTMENT_REQUIRED_CAPABILITIES/);
  assert.match(source, /Shared staff access is not sufficient/);
  assert.match(source, /ops\.draft\.programme/);
  assert.match(source, /ops\.browse/);
});

test("session capability module stays free of Node and Notion imports", () => {
  assert.doesNotMatch(source, /node:crypto|from ["']crypto["']|@notionhq|process\.env|next\/headers/);
});

test("access-control remains pure and is not bound to shared staff key as authority", () => {
  const access = fs.readFileSync(path.join(root, "lib/access-control.ts"), "utf8");
  assert.doesNotMatch(access, /ISEYC_STAFF_KEY/);
  assert.match(access, /hasOfficerPermission/);
  assert.match(access, /appointments/);
});

test("action progress route continues to refuse shared-session attribution", () => {
  const route = fs.readFileSync(path.join(root, "app/ops/api/actions/[id]/route.ts"), "utf8");
  assert.match(route, /Individual officer identity and verified action assignment are not connected/);
  assert.match(route, /No action record was changed/);
});
