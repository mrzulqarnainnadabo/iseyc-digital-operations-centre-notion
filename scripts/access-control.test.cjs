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
