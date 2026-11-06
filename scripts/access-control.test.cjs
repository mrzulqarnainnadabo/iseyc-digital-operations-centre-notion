const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (mod, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS }
  }).outputText;
  mod._compile(js, filename);
};
const policy = require("../lib/access-control.ts");
const legacyBoundary = require("../lib/legacy-session-boundary.ts");
const loginInput = require("../lib/login-input.ts");
const now = new Date("2026-11-06T12:00:00.000Z");
const context = (extra = {}) => ({
  googleSubject: "member",
  membership: {
    status: "Approved",
    googleSubject: "member",
    emailVerified: true,
    effectiveFrom: "2026-01-01T00:00:00.000Z",
    effectiveUntil: "2027-01-01T00:00:00.000Z"
  },
  appointments: [],
  delegations: [],
  nationalPresidentGoogleSubject: "president",
  ...extra
});

test("approved verified linked active member is admitted", () => {
  assert.deepEqual(policy.checkMemberAccess(context(), now), { allowed: true });
});
test("missing membership is denied", () => {
  assert.equal(policy.checkMemberAccess(context({ membership: null }), now).allowed, false);
});
test("membership alone does not grant officer permissions", () => {
  assert.equal(policy.hasOfficerPermission(context(), "meetings.approve", now), false);
});
test("appointment grants only its explicit permission when bound to the authenticated subject", () => {
  const c = context({ appointments: [{
    googleSubject: "member",
    status: "Active", role: "Secretary General",
    scope: { type: "global" },
    permissions: ["meetings.read"]
  }] });
  assert.equal(policy.hasOfficerPermission(c, "meetings.read", now, { type: "global" }), true);
  assert.equal(policy.hasOfficerPermission(c, "meetings.approve", now, { type: "global" }), false);
});
test("appointment linked to another Google subject cannot grant permissions", () => {
  const c = context({ appointments: [{
    googleSubject: "different-member",
    status: "Active", role: "Officer",
    scope: { type: "global" },
    permissions: ["meetings.read"]
  }] });
  assert.equal(policy.hasOfficerPermission(c, "meetings.read", now, { type: "global" }), false);
});
test("appointment missing an explicit Google subject binding is denied", () => {
  const c = context({ appointments: [{
    status: "Active", role: "Officer",
    scope: { type: "global" },
    permissions: ["meetings.read"]
  }] });
  assert.equal(policy.hasOfficerPermission(c, "meetings.read", now, { type: "global" }), false);
});

test("membership administrator cannot decide without delegation", () => {
  const c = context({ appointments: [{
    googleSubject: "member",
    status: "Active", role: "Membership Administrator",
    scope: { type: "global" },
    permissions: ["membership.records.manage"]
  }] });
  assert.equal(policy.canAdministerMembershipRecords(c, now), true);
  assert.equal(policy.canDecideMembership(c, "approve", now), false);
});
test("President cannot bypass membership verification", () => {
  const c = context({ googleSubject: "president", membership: null });
  assert.equal(policy.canDecideMembership(c, "approve", now), false);
});
test("President with active membership can decide and manage delegations", () => {
  const c = context({
    googleSubject: "president",
    membership: {
      status: "Approved", googleSubject: "president", emailVerified: true,
      effectiveFrom: "2026-01-01T00:00:00.000Z",
      effectiveUntil: "2027-01-01T00:00:00.000Z"
    }
  });
  assert.equal(policy.canDecideMembership(c, "approve", now), true);
  assert.equal(policy.canManageMembershipDelegations(c, now), true);
});
test("delegate receives only current explicit decision scope", () => {
  const c = context({ delegations: [{
    delegateGoogleSubject: "member", grantedByGoogleSubject: "president",
    decisionScopes: ["approve"], effectiveFrom: "2026-10-01T00:00:00.000Z",
    effectiveUntil: "2026-12-01T00:00:00.000Z"
  }] });
  assert.equal(policy.canDecideMembership(c, "approve", now), true);
  assert.equal(policy.canDecideMembership(c, "suspend", now), false);
});
test("revoked delegation is denied", () => {
  const c = context({ delegations: [{
    delegateGoogleSubject: "member", grantedByGoogleSubject: "president",
    decisionScopes: ["approve"], effectiveFrom: "2026-10-01T00:00:00.000Z",
    effectiveUntil: "2026-12-01T00:00:00.000Z",
    revokedAt: "2026-11-01T00:00:00.000Z"
  }] });
  assert.equal(policy.canDecideMembership(c, "approve", now), false);
});
test("member can read own record but not another member's", () => {
  assert.equal(policy.canReadMembershipRecord(context(), "member", now), true);
  assert.equal(policy.canReadMembershipRecord(context(), "other", now), false);
});
test("governance actor must match authenticated subject", () => {
  assert.equal(policy.canAttributeGovernanceAction(context(), "member"), true);
  assert.equal(policy.canAttributeGovernanceAction(context(), "imposter"), false);
});

test("malformed delegation without decision scopes is denied safely", () => {
  const c = context({ delegations: [{
    delegateGoogleSubject: "member",
    grantedByGoogleSubject: "president",
    effectiveFrom: "2026-10-01T00:00:00.000Z",
    effectiveUntil: "2026-12-01T00:00:00.000Z"
  }] });
  assert.equal(policy.canDecideMembership(c, "approve", now), false);
});
test("malformed appointment collection fails closed", () => {
  const c = context({ appointments: null });
  assert.equal(policy.hasOfficerPermission(c, "meetings.read", now), false);
});

test("malformed appointment entries and permission fields fail closed", () => {
  const c = context({ appointments: [null, { status: "Active" }, {
    status: "Active", permissions: "meetings.approve"
  }] });
  assert.equal(policy.hasOfficerPermission(c, "meetings.approve", now, { type: "global" }), false);
});
test("invalid authorization context and invalid clock fail closed", () => {
  assert.equal(policy.checkMemberAccess(null, now).allowed, false);
  assert.equal(policy.checkMemberAccess(context(), new Date("invalid")).allowed, false);
});
test("malformed membership date fields fail closed", () => {
  const c = context({ membership: {
    status: "Approved", googleSubject: "member", emailVerified: true,
    effectiveFrom: 42
  } });
  assert.equal(policy.checkMemberAccess(c, now).allowed, false);
});
test("malformed delegation entries fail closed without throwing", () => {
  const c = context({ delegations: [null, { delegateGoogleSubject: "member",
    grantedByGoogleSubject: "president", decisionScopes: "approve",
    effectiveFrom: "2026-10-01T00:00:00.000Z",
    effectiveUntil: "2026-12-01T00:00:00.000Z" }] });
  assert.equal(policy.canDecideMembership(c, "approve", now), false);
});
test("unknown membership decision is denied", () => {
  assert.equal(policy.canDecideMembership(context({ googleSubject: "president",
    membership: { status: "Approved", googleSubject: "president", emailVerified: true }
  }), "delete", now), false);
});
test("empty or non-string audit identities are denied", () => {
  assert.equal(policy.canAttributeGovernanceAction(context(), ""), false);
  assert.equal(policy.canAttributeGovernanceAction(context(), null), false);
});

test("future and expired appointments do not grant officer access", () => {
  const future = context({ appointments: [{
    googleSubject: "member",
    status: "Active", role: "Officer", permissions: ["meetings.read"],
    effectiveFrom: "2026-12-01T00:00:00.000Z"
  }] });
  const expired = context({ appointments: [{
    googleSubject: "member",
    status: "Active", role: "Officer", permissions: ["meetings.read"],
    effectiveUntil: "2026-11-01T00:00:00.000Z"
  }] });
  assert.equal(policy.hasOfficerPermission(future, "meetings.read", now, { type: "global" }), false);
  assert.equal(policy.hasOfficerPermission(expired, "meetings.read", now, { type: "global" }), false);
});
test("unknown or malformed permission values never grant access", () => {
  const c = context({ appointments: [{
    googleSubject: "member",
    status: "Active", role: "Officer", permissions: ["meetings.read", null]
  }] });
  assert.equal(policy.hasOfficerPermission(c, "meetings.read", now), false);
});
test("membership outside effective dates is denied", () => {
  const future = context({ membership: {
    status: "Approved", googleSubject: "member", emailVerified: true,
    effectiveFrom: "2026-12-01T00:00:00.000Z"
  } });
  const expired = context({ membership: {
    status: "Approved", googleSubject: "member", emailVerified: true,
    effectiveUntil: "2026-11-01T00:00:00.000Z"
  } });
  assert.equal(policy.checkMemberAccess(future, now).allowed, false);
  assert.equal(policy.checkMemberAccess(expired, now).allowed, false);
});
test("malformed membership record fails closed without throwing", () => {
  assert.equal(policy.checkMemberAccess(context({ membership: "Approved" }), now).allowed, false);
});
test("a delegate cannot decide after the delegation end date", () => {
  const c = context({ delegations: [{
    delegateGoogleSubject: "member", grantedByGoogleSubject: "president",
    decisionScopes: ["approve"], effectiveFrom: "2026-10-01T00:00:00.000Z",
    effectiveUntil: "2026-11-01T00:00:00.000Z"
  }] });
  assert.equal(policy.canDecideMembership(c, "approve", now), false);
});

test("legacy shared session can read only standard meetings", () => {
  assert.equal(legacyBoundary.legacySessionCanReadMeeting("Standard"), true);
  assert.equal(legacyBoundary.legacySessionCanReadMeeting("Restricted"), false);
  assert.equal(legacyBoundary.legacySessionCanReadMeeting(undefined), false);
  assert.equal(legacyBoundary.legacySessionCanReadMeeting(null), false);
  assert.equal(legacyBoundary.legacySessionCanReadMeeting("Unclassified"), false);
});
test("legacy shared session cannot create restricted meetings", () => {
  assert.equal(legacyBoundary.legacySessionCanCreateMeeting("Standard"), true);
  assert.equal(legacyBoundary.legacySessionCanCreateMeeting("Restricted"), false);
});
test("legacy shared session cannot approve meeting records", () => {
  assert.equal(legacyBoundary.legacySessionCanSetMeetingStatus("In review"), true);
  assert.equal(legacyBoundary.legacySessionCanSetMeetingStatus("Archived"), false);
  assert.equal(legacyBoundary.legacySessionCanSetMeetingStatus("Draft"), false);
  assert.equal(legacyBoundary.legacySessionCanSetMeetingStatus("Approved"), false);
  assert.equal(legacyBoundary.legacySessionCanSetMeetingStatus("unknown"), false);
});

test("login input parser rejects malformed and non-string payloads", () => {
  assert.equal(loginInput.readStaffKeyInput(null), null);
  assert.equal(loginInput.readStaffKeyInput([]), null);
  assert.equal(loginInput.readStaffKeyInput("secret"), null);
  assert.equal(loginInput.readStaffKeyInput({ key: 123 }), null);
  assert.equal(loginInput.readStaffKeyInput({ key: "   " }), null);
  assert.equal(loginInput.readStaffKeyInput({ key: "x".repeat(513) }), null);
});
test("login input parser trims valid string keys without coercion", () => {
  assert.equal(loginInput.readStaffKeyInput({ key: "  valid-key  " }), "valid-key");
});

test("dashboard aggregates exclude restricted and unclassified meetings", () => {
  const records = [
    { id: "standard", sensitivity: "Standard", status: "New" },
    { id: "restricted", sensitivity: "Restricted", status: "New" },
    { id: "missing", status: "New" },
    { id: "unclassified", sensitivity: "Unclassified", status: "New" },
    { id: "lowercase", sensitivity: "standard", status: "New" }
  ];
  const visible = legacyBoundary.filterLegacyVisibleMeetings(records);
  assert.deepEqual(visible.map((record) => record.id), ["standard"]);
  assert.equal(visible.length, 1);
});


test("membership administrator may read records but cannot decide", () => {
  const c = context({ appointments: [{
    googleSubject: "member",
    status: "Active", role: "Membership Administrator",
    scope: { type: "global" },
    permissions: ["membership.records.manage"]
  }] });
  assert.equal(policy.canReadMembershipRecord(c, "another-member", now), true);
  assert.equal(policy.canDecideMembership(c, "approve", now), false);
});

test("ordinary member cannot read another member's record", () => {
  const c = context();
  assert.equal(policy.canReadMembershipRecord(c, "another-member", now), false);
});

test("unverified or inactive member cannot read even their own record", () => {
  const unverified = context({ membership: {
    status: "Approved", googleSubject: "member", emailVerified: false
  } });
  const suspended = context({ membership: {
    status: "Suspended", googleSubject: "member", emailVerified: true
  } });
  assert.equal(policy.canReadMembershipRecord(unverified, "member", now), false);
  assert.equal(policy.canReadMembershipRecord(suspended, "member", now), false);
});

test("President identity alone does not grant record administration", () => {
  const c = context({
    googleSubject: "president",
    membership: { status: "Suspended", googleSubject: "president", emailVerified: true }
  });
  assert.equal(policy.canAdministerMembershipRecords(c, now), false);
  assert.equal(policy.canReadMembershipRecord(c, "another-member", now), false);
});

test("revoked or expired appointment cannot administer membership records", () => {
  const revoked = context({ appointments: [{
    googleSubject: "member",
    status: "Revoked", role: "Membership Administrator",
    scope: { type: "global" },
    permissions: ["membership.records.manage"]
  }] });
  const expired = context({ appointments: [{
    googleSubject: "member",
    status: "Active", role: "Membership Administrator",
    scope: { type: "global" },
    permissions: ["membership.records.manage"],
    effectiveUntil: "2026-11-01T00:00:00.000Z"
  }] });
  assert.equal(policy.canAdministerMembershipRecords(revoked, now), false);
  assert.equal(policy.canAdministerMembershipRecords(expired, now), false);
});

test("delegation from anyone other than the recorded President is denied", () => {
  const c = context({ delegations: [{
    delegateGoogleSubject: "member", grantedByGoogleSubject: "another-officer",
    decisionScopes: ["approve"], effectiveFrom: "2026-10-01T00:00:00.000Z",
    effectiveUntil: "2026-12-01T00:00:00.000Z"
  }] });
  assert.equal(policy.canDecideMembership(c, "approve", now), false);
});

const privateResponse = require("../lib/private-response.ts");
test("private DOC API responses prohibit storage and vary by session cookie", () => {
  const headers = privateResponse.privateResponseHeaders({ "X-Test": "preserved" });
  assert.equal(headers.get("Cache-Control"), "private, no-store, max-age=0, must-revalidate");
  assert.equal(headers.get("Pragma"), "no-cache");
  assert.equal(headers.get("Vary"), "Cookie");
  assert.equal(headers.get("X-Test"), "preserved");
});

const requestSecurity = require("../lib/request-security.ts");
test("bounded JSON parser accepts JSON within the configured byte limit", async () => {
  const request = new Request("https://doc.example/api", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ status: "In review" })
  });
  const result = await requestSecurity.readBoundedJson(request, 128);
  assert.deepEqual(result, { ok: true, value: { status: "In review" } });
});

test("bounded JSON parser rejects incorrect media types", async () => {
  const request = new Request("https://doc.example/api", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: "{}"
  });
  assert.deepEqual(await requestSecurity.readBoundedJson(request), {
    ok: false, reason: "content_type"
  });
});

test("bounded JSON parser rejects oversized and malformed payloads", async () => {
  const oversized = new Request("https://doc.example/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note: "x".repeat(100) })
  });
  const malformed = new Request("https://doc.example/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{"
  });
  assert.deepEqual(await requestSecurity.readBoundedJson(oversized, 32), {
    ok: false, reason: "too_large"
  });
  assert.deepEqual(await requestSecurity.readBoundedJson(malformed), {
    ok: false, reason: "invalid_json"
  });
});

const permissionCatalogue = require("../lib/doc-permissions.ts");
test("closed DOC permission catalogue accepts only declared capabilities", () => {
  assert.equal(permissionCatalogue.isDocPermission("meetings.read"), true);
  assert.equal(permissionCatalogue.isDocPermission("membership.records.manage"), true);
  assert.equal(permissionCatalogue.isDocPermission("superuser.all"), false);
  assert.equal(permissionCatalogue.isDocPermission(""), false);
  assert.equal(permissionCatalogue.isDocPermission(null), false);
});

test("unknown permission identifiers cannot be granted by an appointment", () => {
  const c = context({ appointments: [{
    googleSubject: "member",
    status: "Active", role: "Officer", permissions: ["superuser.all"]
  }] });
  assert.equal(policy.hasOfficerPermission(c, "superuser.all", now, { type: "global" }), false);
});

function collectRouteFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = require("node:path").join(directory, entry.name);
    if (entry.isDirectory()) return collectRouteFiles(full);
    return entry.isFile() && entry.name === "route.ts" ? [full] : [];
  });
}

test("every DOC API route declares private caching or an explicit public classification", () => {
  const routes = collectRouteFiles(require("node:path").join(__dirname, "../app/api"));
  assert.ok(routes.length > 0, "API route inventory should not be empty");
  for (const route of routes) {
    const source = fs.readFileSync(route, "utf8");
    assert.ok(
      source.includes("privateJson(") || source.includes("privateResponseHeaders(") || source.includes("PUBLIC_API_ROUTE:"),
      `${route} must use private no-store response handling or declare PUBLIC_API_ROUTE with an explicit public rationale`
    );
  }
});

test("bounded JSON parser rejects oversized declared content before reading the body", async () => {
  const request = new Request("https://doc.example/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": "4096"
    },
    body: "{}"
  });
  assert.deepEqual(await requestSecurity.readBoundedJson(request, 32), {
    ok: false, reason: "too_large"
  });
});

test("bounded JSON parser enforces the limit while streaming chunked bodies", async () => {
  let cancelled = false;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('{"note":"'));
      controller.enqueue(new TextEncoder().encode("x".repeat(64)));
      controller.enqueue(new TextEncoder().encode('"}'));
    },
    cancel() { cancelled = true; }
  });
  const request = new Request("https://doc.example/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: stream,
    duplex: "half"
  });
  assert.deepEqual(await requestSecurity.readBoundedJson(request, 32), {
    ok: false, reason: "too_large"
  });
  assert.equal(cancelled, true);
});

test("bounded JSON parser rejects invalid UTF-8 instead of replacement-decoding it", async () => {
  const request = new Request("https://doc.example/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: new Uint8Array([0x7b, 0x22, 0x78, 0x22, 0x3a, 0xff, 0x7d])
  });
  assert.deepEqual(await requestSecurity.readBoundedJson(request), {
    ok: false, reason: "invalid_json"
  });
});

test("sensitive DOC API handlers retain their authentication and CSRF guards", () => {
  const root = require("node:path").join(__dirname, "../app/api");
  const contracts = [
    ["auth/login/route.ts", ["POST"], ["isSameOriginRequest"], []],
    ["auth/logout/route.ts", ["POST"], ["isSameOriginRequest"], []],
    ["meetings/route.ts", ["GET", "POST"], ["isSameOriginRequest"], ["requireStaffSession"]],
    ["meetings/[id]/route.ts", ["GET", "PATCH"], ["isSameOriginRequest"], ["requireStaffSession"]]
  ];

  for (const [relativePath, methods, csrfGuards, authGuards] of contracts) {
    const source = fs.readFileSync(require("node:path").join(root, relativePath), "utf8");
    for (const method of methods) {
      assert.match(source, new RegExp(`export async function ${method}\\b`),
        `${relativePath} must retain ${method}`);
    }
    for (const guard of csrfGuards) {
      assert.ok(source.includes(guard), `${relativePath} must retain ${guard}`);
    }
    for (const guard of authGuards) {
      assert.ok(source.includes(guard), `${relativePath} must retain ${guard}`);
    }
  }
});

test("production responses include baseline browser security headers", async () => {
  const configPath = require.resolve("../next.config.js");
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  delete require.cache[configPath];
  const config = require("../next.config.js");
  const entries = await config.headers();
  if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = previousNodeEnv;
  delete require.cache[configPath];

  const route = entries.find((entry) => entry.source === "/:path*");
  assert.ok(route, "security headers should apply to all routes");
  const headers = Object.fromEntries(route.headers.map(({ key, value }) => [key, value]));
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.equal(headers["X-Permitted-Cross-Domain-Policies"], "none");
  assert.equal(headers["Permissions-Policy"], "camera=(), microphone=(), geolocation=()");
  assert.equal(headers["Strict-Transport-Security"], "max-age=31536000");
});

test("department appointment is limited to its assigned department", () => {
  const c = context({ appointments: [{
    googleSubject: "member",
    status: "Active", role: "Department Head",
    scope: { type: "department", departmentId: "health" },
    permissions: ["department.manage", "meetings.read"]
  }] });
  assert.equal(policy.hasOfficerPermission(c, "department.manage", now,
    { type: "department", departmentId: "health" }), true);
  assert.equal(policy.hasOfficerPermission(c, "department.manage", now,
    { type: "department", departmentId: "education" }), false);
  assert.equal(policy.hasOfficerPermission(c, "department.manage", now,
    { type: "global" }), false);
});

test("department appointment cannot be used when resource scope is omitted", () => {
  const c = context({ appointments: [{
    googleSubject: "member",
    status: "Active", role: "Department Head",
    scope: { type: "department", departmentId: "health" },
    permissions: ["department.manage"]
  }] });
  assert.equal(policy.hasOfficerPermission(c, "department.manage", now), false);
});

test("appointment without an explicit scope fails closed", () => {
  const c = context({ appointments: [{
    googleSubject: "member",
    status: "Active", role: "Officer", permissions: ["meetings.read"]
  }] });
  assert.equal(policy.hasOfficerPermission(c, "meetings.read", now,
    { type: "global" }), false);
});

test("explicit global appointment may access a department resource", () => {
  const c = context({ appointments: [{
    googleSubject: "member",
    status: "Active", role: "National Officer",
    scope: { type: "global" },
    permissions: ["department.read"]
  }] });
  assert.equal(policy.hasOfficerPermission(c, "department.read", now,
    { type: "department", departmentId: "civic" }), true);
});

test("malformed department scope fails closed", () => {
  const c = context({ appointments: [{
    googleSubject: "member",
    status: "Active", role: "Department Head",
    scope: { type: "department", departmentId: "" },
    permissions: ["department.manage"]
  }] });
  assert.equal(policy.hasOfficerPermission(c, "department.manage", now,
    { type: "department", departmentId: "health" }), false);
});


const auth = require("../lib/auth.ts");
const { createHmac, randomBytes } = require("node:crypto");

test("signed staff sessions accept valid tokens and reject tampering", () => {
  const previous = process.env.ISEYC_STAFF_KEY;
  process.env.ISEYC_STAFF_KEY = "test-only-key-with-sufficient-entropy";
  try {
    const token = auth.signSession(process.env.ISEYC_STAFF_KEY);
    assert.equal(auth.verifySessionToken(token), true);
    const parts = token.split(".");
    parts[2] = "0".repeat(64);
    assert.equal(auth.verifySessionToken(parts.join(".")), false);
    assert.equal(auth.verifySessionToken(token + ".extra"), false);
  } finally {
    if (previous === undefined) delete process.env.ISEYC_STAFF_KEY;
    else process.env.ISEYC_STAFF_KEY = previous;
  }
});

test("signed staff sessions reject malformed nonce and signature encodings", () => {
  const previous = process.env.ISEYC_STAFF_KEY;
  const secret = "test-only-key-with-sufficient-entropy";
  process.env.ISEYC_STAFF_KEY = secret;
  try {
    const issuedAt = Math.floor(Date.now() / 1000);
    const sign = (nonce) => {
      const payload = `${issuedAt}.${nonce}`;
      const signature = createHmac("sha256", secret)
        .update(`doc-session:${payload}`).digest("hex");
      return `${payload}.${signature}`;
    };
    assert.equal(auth.verifySessionToken(sign("short")), false);
    assert.equal(auth.verifySessionToken(sign("!").padEnd(22, "!")), false);
    const validNonce = randomBytes(16).toString("base64url");
    const malformedSignature = `${issuedAt}.${validNonce}.${"A".repeat(64)}`;
    assert.equal(auth.verifySessionToken(malformedSignature), false);
  } finally {
    if (previous === undefined) delete process.env.ISEYC_STAFF_KEY;
    else process.env.ISEYC_STAFF_KEY = previous;
  }
});

test("signed staff sessions reject expired and implausibly future timestamps", () => {
  const previous = process.env.ISEYC_STAFF_KEY;
  const secret = "test-only-key-with-sufficient-entropy";
  process.env.ISEYC_STAFF_KEY = secret;
  try {
    const nonce = randomBytes(16).toString("base64url");
    const signedAt = (timestamp) => {
      const payload = `${timestamp}.${nonce}`;
      const signature = createHmac("sha256", secret)
        .update(`doc-session:${payload}`).digest("hex");
      return `${payload}.${signature}`;
    };
    const nowSeconds = Math.floor(Date.now() / 1000);
    assert.equal(auth.verifySessionToken(signedAt(nowSeconds - 13 * 60 * 60)), false);
    assert.equal(auth.verifySessionToken(signedAt(nowSeconds + 120)), false);
    assert.equal(auth.verifySessionToken(signedAt(nowSeconds + 30)), true);
  } finally {
    if (previous === undefined) delete process.env.ISEYC_STAFF_KEY;
    else process.env.ISEYC_STAFF_KEY = previous;
  }
});

test("every operational page inherits the authenticated operations layout", () => {
  const root = require("node:path").join(__dirname, "../app/ops");
  const layout = fs.readFileSync(require("node:path").join(root, "layout.tsx"), "utf8");
  assert.ok(layout.includes("requireStaffSession"), "operations layout must verify staff session");
  assert.ok(layout.includes('redirect("/login")'), "unauthenticated operations visits must redirect");
  const pages = [];
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = require("node:path").join(directory, entry.name);
      if (entry.isDirectory() && entry.name !== "api") walk(full);
      else if (entry.isFile() && entry.name === "page.tsx") pages.push(full);
    }
  };
  walk(root);
  assert.ok(pages.length > 0, "operations page inventory should not be empty");
  assert.ok(pages.every((page) => page.startsWith(root)), "all operations pages must be inside the protected route group");
});


test("readiness register distinguishes placeholders from implemented workflows", () => {
  const readiness = fs.readFileSync(require("node:path").join(__dirname, "../app/ops/readiness/page.tsx"), "utf8");
  const dashboard = fs.readFileSync(require("node:path").join(__dirname, "../app/ops/page.tsx"), "utf8");
  assert.ok(readiness.includes("Placeholder"));
  assert.ok(readiness.includes("Not connected"));
  assert.ok(readiness.includes("not verified individual identity"));
  assert.ok(readiness.includes("Do not enter real membership"));
  assert.ok(dashboard.includes("Environment configuration"));
  assert.ok(dashboard.includes("Not connected"));
  assert.ok(dashboard.includes("Configured"));
  assert.ok(dashboard.includes('href="/ops/readiness"'));
});


const notionAdapter = require("../lib/notion.ts");

test("Notion database IDs are canonicalized and bound to the declared DOC database setting", () => {
  const previous = process.env.NOTION_MEETINGS_DATABASE_ID;
  process.env.NOTION_MEETINGS_DATABASE_ID = "19B213D5-5BFC-4CE8-A653-A05147CBBE2A";
  try {
    assert.equal(notionAdapter.dbId("NOTION_MEETINGS_DATABASE_ID"), "19b213d55bfc4ce8a653a05147cbbe2a");
    assert.throws(
      () => notionAdapter.assertInternalDb("19B213D5-5BFC-4CE8-A653-A05147CBBE2A", "NOTION_MEETINGS_DATABASE_ID"),
      /Civic Mandate public database/
    );
    assert.throws(
      () => notionAdapter.assertInternalDb("19b213d55bfc4ce8a653a05147cbbe2a", "NOTION_MEETINGS_DATABASE_ID"),
      /Civic Mandate public database/
    );
    assert.throws(
      () => notionAdapter.assertInternalDb("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "NOTION_MEETINGS_DATABASE_ID"),
      /unconfigured or invalid DOC database/
    );
  } finally {
    if (previous === undefined) delete process.env.NOTION_MEETINGS_DATABASE_ID;
    else process.env.NOTION_MEETINGS_DATABASE_ID = previous;
  }
});

test("malformed Notion database IDs are not treated as configured", () => {
  const previous = process.env.TEST_NOTION_DATABASE_ID;
  try {
    for (const value of ["", "not-a-database", "aaaaaaaa", "g".repeat(32), "a".repeat(33)]) {
      process.env.TEST_NOTION_DATABASE_ID = value;
      assert.equal(notionAdapter.dbId("TEST_NOTION_DATABASE_ID"), "");
    }
  } finally {
    if (previous === undefined) delete process.env.TEST_NOTION_DATABASE_ID;
    else process.env.TEST_NOTION_DATABASE_ID = previous;
  }
});

test("meeting status adapter revalidates configured database parent before writing", () => {
  const source = fs.readFileSync(require("node:path").join(__dirname, "../lib/notion.ts"), "utf8");
  const start = source.indexOf("export async function setMeetingStatus(");
  const end = source.indexOf("\nexport function configFlags()", start);
  assert.ok(start >= 0 && end > start, "status adapter should be present");
  const implementation = source.slice(start, end);
  assert.ok(implementation.includes('client.pages.retrieve({ page_id: id })'));
  assert.ok(implementation.includes("canonicalNotionId(page.parent.database_id) !== database_id"));
  assert.ok(implementation.indexOf("client.pages.retrieve") < implementation.indexOf("client.pages.update"));
});

test("every non-approved membership lifecycle state is denied", () => {
  for (const status of ["Pending", "Rejected", "Suspended", "Expired", "Revoked", "Unknown", "", null]) {
    const member = { ...context().membership, status };
    assert.equal(
      policy.checkMemberAccess(context({ membership: member }), now).allowed,
      false,
      `membership status ${String(status)} must be denied`
    );
  }
});

test("identity binding requires the exact immutable subject and verified email", () => {
  assert.equal(
    policy.checkMemberAccess(context({ membership: { ...context().membership, googleSubject: "different-subject" } }), now).allowed,
    false
  );
  assert.equal(
    policy.checkMemberAccess(context({ membership: { ...context().membership, emailVerified: false } }), now).allowed,
    false
  );
});

test("membership effective-date boundaries are inclusive and malformed dates deny", () => {
  const startsNow = { ...context().membership, effectiveFrom: now.toISOString() };
  const endsNow = { ...context().membership, effectiveUntil: now.toISOString() };
  assert.equal(policy.checkMemberAccess(context({ membership: startsNow }), now).allowed, true);
  assert.equal(policy.checkMemberAccess(context({ membership: endsNow }), now).allowed, true);
  for (const badDate of ["not-a-date", "", 123, {}]) {
    const malformed = { ...context().membership, effectiveFrom: badDate };
    assert.equal(policy.checkMemberAccess(context({ membership: malformed }), now).allowed, false);
  }
});

test("department appointments cannot cross department boundaries", () => {
  const c = context({ appointments: [{
    googleSubject: "member",
    status: "Active", role: "Department Officer",
    scope: { type: "department", departmentId: "health" },
    permissions: ["department.manage"]
  }] });
  assert.equal(policy.hasOfficerPermission(c, "department.manage", now, { type: "department", departmentId: "health" }), true);
  for (const scope of [
    { type: "department", departmentId: "education" },
    { type: "global" },
    { type: "department", departmentId: "" },
    null
  ]) {
    assert.equal(policy.hasOfficerPermission(c, "department.manage", now, scope), false);
  }
});

test("inactive, expired, revoked and unknown appointment states grant no permissions", () => {
  for (const status of ["Inactive", "Expired", "Revoked", "Pending", "Unknown", null]) {
    const c = context({ appointments: [{
      status, role: "Officer", scope: { type: "global" }, permissions: ["meetings.read"]
    }] });
    assert.equal(
      policy.hasOfficerPermission(c, "meetings.read", now, { type: "global" }),
      false,
      `appointment status ${String(status)} must be denied`
    );
  }
});

test("President authority remains tied to the configured President subject", () => {
  const president = context({
    googleSubject: "president",
    membership: {
      status: "Approved", googleSubject: "president", emailVerified: true,
      effectiveFrom: "2026-01-01T00:00:00.000Z",
      effectiveUntil: "2027-01-01T00:00:00.000Z"
    }
  });
  assert.equal(policy.canManageMembershipDelegations(president, now), true);
  assert.equal(policy.canManageMembershipDelegations(context(), now), false);
  assert.equal(policy.canDecideMembership(context({ nationalPresidentGoogleSubject: null }), "approve", now), false);
});

test("delegation cannot be self-issued or granted by a non-President", () => {
  for (const grantor of ["member", "another-officer", "", null]) {
    const c = context({ delegations: [{
      delegateGoogleSubject: "member",
      grantedByGoogleSubject: grantor,
      decisionScopes: ["approve"],
      effectiveFrom: "2026-10-01T00:00:00.000Z",
      effectiveUntil: "2026-12-01T00:00:00.000Z"
    }] });
    assert.equal(policy.canDecideMembership(c, "approve", now), false);
  }
});
