const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("public root is a public composer and does not load restricted operations", () => {
  const page = read("app/page.tsx");
  assert.match(page, /PublicShell/);
  assert.match(page, /Explore public information/);
  assert.doesNotMatch(page, /requireStaffSession|listMeetings|@\/lib\/notion/);
  assert.match(read("app/layout.tsx"), /index: true/);
  assert.match(read("app/ops/layout.tsx"), /index: false/);
  assert.match(read("app/login/layout.tsx"), /index: false/);
});

test("public shell uses the official seal asset", () => {
  assert.match(read("components/PublicShell.tsx"), /src="\/iseyc-seal\.svg"/);
});

test("restricted session cookie is scoped to /ops only", () => {
  assert.match(read("lib/auth.ts"), /SESSION_COOKIE_PATH = "\/ops"/);
  assert.match(read("app/api/auth/login/route.ts"), /path: "\/ops"/);
  assert.match(read("app/api/auth/logout/route.ts"), /path: "\/ops"/);
  assert.match(read("app/api/auth/oidc/callback/route.ts"), /path: "\/ops"/);
  assert.match(read("app/api/auth/oidc/start/route.ts"), /path: "\/api\/auth\/oidc"/);
});

test("browser operational requests stay under the restricted cookie path", () => {
  for (const file of [
    "app/ops/intake/page.tsx",
    "app/ops/queue/page.tsx",
    "app/ops/review/[id]/page.tsx",
  ]) assert.match(read(file), /\/ops\/api\/meetings/);
  assert.match(read("app/login/page.tsx"), /\/ops\/api\/auth\/oidc\/status/);
});

test("ops API aliases delegate to existing server-authorized handlers", () => {
  const collection = read("app/ops/api/meetings/route.ts");
  assert.ok(collection.includes('from "../../../api/meetings/route"'));
  assert.match(collection, /getMeetings\(req\)|createMeeting\(req\)/);
  const detail = read("app/ops/api/meetings/[id]/route.ts");
  assert.ok(detail.includes('from "../../../../api/meetings/[id]/route"'));
  assert.match(detail, /getMeeting\(req, context\)|updateMeeting\(req, context\)/);
  assert.match(read("app/ops/api/auth/oidc/status/route.ts"), /getOidcStatus\(req\)/);
  assert.match(read("app/ops/layout.tsx"), /requireStaffSession/);
});
