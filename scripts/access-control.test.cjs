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
test("appointment grants only its explicit permission", () => {
  const c = context({ appointments: [{
    status: "Active", role: "Secretary General", permissions: ["meetings.read"]
  }] });
  assert.equal(policy.hasOfficerPermission(c, "meetings.read", now), true);
  assert.equal(policy.hasOfficerPermission(c, "meetings.approve", now), false);
});
test("membership administrator cannot decide without delegation", () => {
  const c = context({ appointments: [{
    status: "Active", role: "Membership Administrator",
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
  assert.equal(policy.hasOfficerPermission(c, "meetings.approve", now), false);
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
    status: "Active", role: "Officer", permissions: ["meetings.read"],
    effectiveFrom: "2026-12-01T00:00:00.000Z"
  }] });
  const expired = context({ appointments: [{
    status: "Active", role: "Officer", permissions: ["meetings.read"],
    effectiveUntil: "2026-11-01T00:00:00.000Z"
  }] });
  assert.equal(policy.hasOfficerPermission(future, "meetings.read", now), false);
  assert.equal(policy.hasOfficerPermission(expired, "meetings.read", now), false);
});
test("unknown or malformed permission values never grant access", () => {
  const c = context({ appointments: [{
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
    status: "Active", role: "Membership Administrator",
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
    status: "Revoked", role: "Membership Administrator",
    permissions: ["membership.records.manage"]
  }] });
  const expired = context({ appointments: [{
    status: "Active", role: "Membership Administrator",
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
    status: "Active", role: "Officer", permissions: ["superuser.all"]
  }] });
  assert.equal(policy.hasOfficerPermission(c, "superuser.all", now), false);
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
      source.includes("privateJson(") || source.includes("PUBLIC_API_ROUTE:"),
      `${route} must use privateJson or declare PUBLIC_API_ROUTE with an explicit public rationale`
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
