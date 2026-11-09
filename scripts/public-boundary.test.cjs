const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("public root is a public intelligence pulse and does not load restricted operations", () => {
  const page = read("app/page.tsx");
  assert.match(page, /PublicShell/);
  assert.ok(page.includes("What is happening across Nigeria?"));
  assert.match(page, /getDepartmentMandateRecords/);
  assert.match(page, /getDepartmentEvidence/);
  assert.match(page, /provisional keyword match/);
  assert.match(page, /Not yet computed/);
  assert.equal(page.includes("requireStaffSession"), false);
  assert.equal(page.includes("listMeetings"), false);
  assert.equal(page.includes("@/lib/notion"), false);
  assert.match(read("app/layout.tsx"), /index: true/);
  assert.match(read("app/ops/layout.tsx"), /index: false/);
  assert.match(read("app/login/layout.tsx"), /index: false/);
});

test("public shell uses the official seal and functional public navigation", () => {
  const shell = read("components/PublicShell.tsx");
  assert.ok(shell.includes('src="/iseyc-seal.svg"'));
  for (const label of ["Home", "Departments", "Explore", "Report", "Method"]) {
    assert.match(shell, new RegExp(`label: "${label}"`));
  }
  for (const url of [
    "https://2027-street-mandate.vercel.app",
    "https://iseyc-civic-brain.vercel.app",
    "https://iseyc-civic-intelligence-observatory.vercel.app",
  ]) assert.ok(shell.includes(url));
  assert.match(shell, /label: "Observatory"/);
  assert.match(shell, /youth-led public intelligence institution for Nigeria/);
  assert.doesNotMatch(shell, /Public Information & Civic Intelligence|public-mobile-menu/);
  assert.match(shell, /Skip to content/);
});

test("institutional Tailwind tokens match the approved palette", () => {
  const config = read("tailwind.config.js");
  for (const token of ["#123b2f", "#194b3b", "#e8f0ea", "#faf9f5", "#202923", "#626d65", "#a7833f", "#e4e6df"]) {
    assert.ok(config.includes(token), `Missing institutional token ${token}`);
  }
});

test("restricted session cookie is scoped to /ops only", () => {
  assert.match(read("lib/auth.ts"), /SESSION_COOKIE_PATH = "\/ops"/);
  assert.match(read("app/api/auth/login/route.ts"), /path: SESSION_COOKIE_PATH/);
  assert.match(read("app/api/auth/logout/route.ts"), /path: SESSION_COOKIE_PATH/);
  assert.match(read("app/api/auth/oidc/callback/route.ts"), /path: SESSION_COOKIE_PATH/);
  assert.match(read("app/api/auth/oidc/start/route.ts"), /path: "\/api\/auth\/oidc"/);
  assert.match(read("app/api/auth/oidc/start/route.ts"), /path: SESSION_COOKIE_PATH/);
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
  assert.match(collection, /export async function GET\(req: NextRequest\)\s*\{\s*return getMeetings\(req\);/);
  assert.match(collection, /export async function POST\(req: NextRequest\)\s*\{\s*return createMeeting\(req\);/);
  const detail = read("app/ops/api/meetings/[id]/route.ts");
  assert.ok(detail.includes('from "../../../../api/meetings/[id]/route"'));
  assert.match(detail, /getMeeting\(req, context\)|updateMeeting\(req, context\)/);
  assert.match(read("app/ops/api/auth/oidc/status/route.ts"), /getOidcStatus\(req\)/);
  assert.match(read("app/ops/layout.tsx"), /requireStaffSession/);
  const commandHome = read("app/ops/page.tsx");
  assert.match(commandHome, /requireStaffSession/);
  assert.match(commandHome, /if \(!\(await requireStaffSession\(\)\)\) redirect\("\/login"\)/);
  assert.ok(commandHome.indexOf("requireStaffSession") < commandHome.indexOf("listMeetings({ pageSize: 25 })"));
});
