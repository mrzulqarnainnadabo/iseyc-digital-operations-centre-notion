const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const apiRoot = path.join(__dirname, "../app/api");

function collectRoutes(directory, prefix = "") {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    const relative = prefix ? path.join(prefix, entry.name) : entry.name;
    if (entry.isDirectory()) return collectRoutes(absolute, relative);
    return entry.name === "route.ts" ? [relative.replaceAll(path.sep, "/")] : [];
  });
}

const contracts = {
  "auth/login/route.ts": {
    methods: ["POST"],
    required: ["isSameOriginRequest", "readBoundedJson", "readStaffKeyInput", "isLoginRateLimited", "recordLoginFailure", "clearLoginFailures", "privateJson"],
    forbidden: ["requireStaffSession"]
  },
  "auth/logout/route.ts": {
    methods: ["POST"],
    required: ["isSameOriginRequest", "SESSION_COOKIE", "privateJson"],
    forbidden: []
  },
  "auth/oidc/start/route.ts": {
    methods: ["GET"],
    required: ["googleOidcConfigured", "createOidcTransaction", "privateResponseHeaders"],
    forbidden: []
  },
  "auth/oidc/callback/route.ts": {
    methods: ["GET"],
    required: ["googleOidcConfigured", "safeEqual", "verifyGoogleIdToken", "signPendingIdentity", "privateJson", "privateResponseHeaders"],
    forbidden: []
  },
  "auth/oidc/status/route.ts": {
    methods: ["GET"],
    required: ["privateJson", "verifyPendingIdentity", "accessGranted: false"],
    forbidden: []
  },
  "meetings/route.ts": {
    methods: ["GET", "POST"],
    required: ["requireCapability", "ops.browse", "ops.meeting.standard", "privateJson", "configFlags", "legacySessionCanReadMeeting", "legacySessionCanCreateMeeting"],
    forbidden: []
  },
  "meetings/[id]/route.ts": {
    methods: ["GET", "PATCH"],
    required: ["requireCapability", "ops.browse", "ops.meeting.standard", "privateJson", "legacySessionCanReadMeeting", "legacySessionCanSetMeetingStatus"],
    forbidden: []
  },
  "department-applications/connection/route.ts": {
    methods: ["GET"],
    required: ["requireCapability", "ops.browse", "privateJson", "verifyDepartmentApplicationsConnection"],
    forbidden: ["pages.query", "pages.create", "Applicant Name", "Applicant Statement"]
  }
};

test("API route inventory matches the reviewed security register", () => {
  const actual = collectRoutes(apiRoot).sort();
  const expected = Object.keys(contracts).sort();
  assert.deepEqual(
    actual,
    expected,
    "A new or removed API route requires an explicit security-register and test review"
  );
});

for (const [route, contract] of Object.entries(contracts)) {
  test(`${route} preserves its reviewed method and security contract`, () => {
    const absolute = path.join(apiRoot, route);
    const source = fs.readFileSync(absolute, "utf8");
    const methods = [...source.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)\s*\(/g)]
      .map((match) => match[1])
      .sort();
    assert.deepEqual(methods, [...contract.methods].sort(), "HTTP method surface changed");
    for (const marker of contract.required) {
      assert.ok(source.includes(marker), `Missing required security marker: ${marker}`);
    }
    for (const marker of contract.forbidden) {
      assert.equal(source.includes(marker), false, `Unexpected security marker: ${marker}`);
    }
  });
}

test("operations API route inventory is explicit and shared-session boundaries are enforced", () => {
  const opsRoot = path.join(__dirname, "../app/ops/api");
  const actual = collectRoutes(opsRoot).sort();
  const expected = [
    "actions/[id]/route.ts",
    "auth/oidc/status/route.ts",
    "department-applications/connection/route.ts",
    "department-programmes/route.ts",
    "department-reports/route.ts",
    "department-workplans/route.ts",
    "external-engagement/route.ts",
    "meetings/[id]/route.ts",
    "meetings/route.ts",
    "registers/[kind]/route.ts"
  ].sort();
  assert.deepEqual(actual, expected, "A new operations API route requires security review");

  for (const route of actual) {
    const source = fs.readFileSync(path.join(opsRoot, route), "utf8");
    assert.ok(source.includes("requireStaffSession") || source.includes("requireCapability") || source.includes("from \"../../../../../api/") || source.includes("from \"../../../../api/") || source.includes("from \"../../../api/"),
      `${route} must authenticate directly or delegate to an independently guarded API handler`);
    if (/route\.ts$/.test(route) && !route.includes("connection") && !route.includes("status") && !route.includes("[id]")) {
      if (source.includes("export async function POST") || source.includes("export async function PATCH")) {
        // Operations aliases delegate to the canonical /api handler. Verify
        // the actual handler guards rather than requiring duplicated checks.
        const guardSource = route === "meetings/route.ts"
          ? fs.readFileSync(path.join(__dirname, "../app/api/meetings/route.ts"), "utf8")
          : source;
        assert.ok(guardSource.includes("isSameOriginRequest"), `${route} POST must enforce same-origin in its handler`);
        assert.ok(guardSource.includes("readBoundedJson"), `${route} POST must use bounded JSON parsing in its handler`);
      }
    }
  }
});

test("no DOC API route is implicitly treated as public", () => {
  const routes = collectRoutes(apiRoot);
  for (const route of routes) {
    const source = fs.readFileSync(path.join(apiRoot, route), "utf8");
    assert.ok(
      source.includes("privateJson(") || source.includes("privateResponseHeaders(") || source.includes("PUBLIC_API_ROUTE:"),
      `${route} must use private no-store response handling or be explicitly documented as public`
    );
  }
});

function assertInOrder(source, markers, label) {
  let previous = -1;
  for (const marker of markers) {
    const index = source.indexOf(marker);
    assert.ok(index >= 0, `${label}: missing ${marker}`);
    assert.ok(index > previous, `${label}: ${marker} must follow the preceding guard`);
    previous = index;
  }
}

test("state-changing DOC routes enforce origin and session checks before parsing or writing", () => {
  const login = fs.readFileSync(path.join(apiRoot, "auth/login/route.ts"), "utf8");
  assertInOrder(login, ["isSameOriginRequest(req)", "readBoundedJson(req", "isValidStaffKey(key)", "signSession(key)"], "login");

  const createMeeting = fs.readFileSync(path.join(apiRoot, "meetings/route.ts"), "utf8");
  const postBody = createMeeting.slice(createMeeting.indexOf("export async function POST"));
  assertInOrder(postBody, ["isSameOriginRequest(req)", "requireCapability(\"ops.meeting.standard\")", "readBoundedJson(req", "createMeeting({"], "meeting POST");

  const updateMeeting = fs.readFileSync(path.join(apiRoot, "meetings/[id]/route.ts"), "utf8");
  const patchBody = updateMeeting.slice(updateMeeting.indexOf("export async function PATCH"));
  assertInOrder(patchBody, ["isSameOriginRequest(req)", "requireCapability(\"ops.meeting.standard\")", "readBoundedJson(req", "getMeeting(id)", "setMeetingStatus(id"], "meeting PATCH");
});

test("protected meeting reads authenticate and fail closed when Notion is not configured", () => {
  const collection = fs.readFileSync(path.join(apiRoot, "meetings/route.ts"), "utf8");
  const getBody = collection.slice(collection.indexOf("export async function GET"));
  assertInOrder(getBody, ["requireCapability(\"ops.browse\")", "configFlags()", "listMeetings({ cursor"], "meeting GET");
  assert.match(getBody, /The Notion Meetings source is not configured/);

  const detail = fs.readFileSync(path.join(apiRoot, "meetings/[id]/route.ts"), "utf8");
  const getDetail = detail.slice(detail.indexOf("export async function GET"));
  assertInOrder(getDetail, ["requireCapability(\"ops.browse\")", "getMeeting(id)"], "meeting detail GET");
});

test("meeting pagination rejects malformed continuation cursors before calling Notion", () => {
  const source = fs.readFileSync(path.join(apiRoot, "meetings/route.ts"), "utf8");
  assert.ok(source.includes("const isNotionId = (value: string) =>"));
  assert.ok(source.includes("cursor && !isNotionId(cursor)"));
  assert.ok(source.includes("requestedMeetingId && !isNotionId(requestedMeetingId)"));
  assert.ok(source.includes("Invalid page cursor"));
  assert.ok(source.includes("status: 400"));
});


test("staff login throttles repeated failures and clears the local bucket after success", () => {
  const login = fs.readFileSync(path.join(apiRoot, "auth/login/route.ts"), "utf8");
  const limiter = fs.readFileSync(path.join(__dirname, "../lib/login-rate-limit.ts"), "utf8");
  assertInOrder(login, [
    'req.headers.get("x-real-ip")',
    "isLoginRateLimited(clientIp)",
    "readBoundedJson(req",
    "isValidStaffKey(key)",
    "recordLoginFailure(clientIp)",
    "clearLoginFailures(clientIp)",
    "signSession(key)"
  ], "staff login throttling");
  assert.match(login, /status: 429/);
  assert.match(login, /"Retry-After": "900"/);
  assert.match(limiter, /WINDOW_MS = 15 \* 60 \* 1000/);
  assert.match(limiter, /MAX_FAILURES = 5/);
  assert.match(limiter, /MAX_CLIENTS = 5000/);
  assert.match(limiter, /prune\(now\)/);
  assert.match(limiter, /failures\.delete\(clientIp\)/);
  assert.match(limiter, /Serverless instances do not share memory/);
  assert.doesNotMatch(login, /headers\.get\(["\']x-forwarded-for["\']/i);
});

test("department applications connection diagnostic is read-only and returns no applicant records", () => {
  const source = fs.readFileSync(path.join(apiRoot, "department-applications/connection/route.ts"), "utf8");
  assertInOrder(source, ["requireCapability(\"ops.browse\")", "verifyDepartmentApplicationsConnection()"], "department applications connection check");
  assert.match(source, /schemaReady/);
  assert.match(source, /privateJson/);
  assert.doesNotMatch(source, /pages\.query|pages\.create|Applicant Name|Applicant Statement/);
});


test("Google OIDC verifies identity but cannot grant operations access", () => {
  const callback = fs.readFileSync(path.join(apiRoot, "auth/oidc/callback/route.ts"), "utf8");
  const status = fs.readFileSync(path.join(apiRoot, "auth/oidc/status/route.ts"), "utf8");
  assert.ok(callback.includes("verifyGoogleIdToken"));
  assert.ok(callback.includes("signPendingIdentity"));
  assert.equal(callback.includes("signSession("), false);
  assert.equal(callback.includes("SESSION_COOKIE,"), false);
  assert.equal(callback.includes("requireStaffSession("), false);
  assert.ok(status.includes("identityVerified"));
  assert.ok(status.includes("accessGranted: false"));
  assert.match(status, /membership and appointment authorisation are not connected/);
});

test("legacy shared-key sessions are explicitly limited to standard meeting records", () => {
  const boundary = fs.readFileSync(path.join(__dirname, "../lib/legacy-session-boundary.ts"), "utf8");
  assert.match(boundary, /sensitivity === "Standard"/);
  assert.match(boundary, /status === "In review"/);
  assert.match(boundary, /not a replacement for individual/);
  assert.match(boundary, /role-based authorization/);
});

test("login throttling documents the distributed enforcement requirement", () => {
  const limiter = fs.readFileSync(path.join(__dirname, "../lib/login-rate-limit.ts"), "utf8");
  assert.match(limiter, /Serverless instances do not share memory/);
  assert.match(limiter, /distributed (?:edge\\/)?WAF limit/);
  assert.match(limiter, /POST \/api\/auth\/login/);
});


const opsApiRoot = path.join(__dirname, "../app/ops/api");

test("every Operations Centre API route has an explicit capability boundary or a reviewed identity-only delegation", () => {
  const opsRoot = path.join(__dirname, "../app/ops/api");
  const actual = collectRoutes(opsRoot).sort();
  const expected = [
    "actions/[id]/route.ts",
    "auth/oidc/status/route.ts",
    "department-applications/connection/route.ts",
    "department-programmes/route.ts",
    "department-reports/route.ts",
    "department-workplans/route.ts",
    "external-engagement/route.ts",
    "meetings/[id]/route.ts",
    "meetings/route.ts",
    "registers/[kind]/route.ts"
  ].sort();
  assert.deepEqual(actual, expected, "A new operations API route requires security review");

  const contracts = {
    "department-programmes/route.ts": ["ops.browse", "ops.draft.programme"],
    "department-workplans/route.ts": ["ops.browse", "ops.draft.workplan"],
    "department-reports/route.ts": ["ops.browse", "ops.draft.report"],
    "registers/[kind]/route.ts": ["ops.browse", "ops.action.propose", "ops.draft.communications", "ops.meeting.standard"],
    "external-engagement/route.ts": ["ops.browse", "ops.meeting.standard"],
    "actions/[id]/route.ts": ["ops.action.progress"]
  };
  for (const [route, capabilities] of Object.entries(contracts)) {
    const source = fs.readFileSync(path.join(opsRoot, route), "utf8");
    assert.ok(source.includes("requireCapability"), route + " must use the capability gate");
    for (const capability of capabilities) {
      assert.ok(source.includes(capability), route + " must declare " + capability);
    }
    assert.ok(source.includes("privateJson("), route + " must return private responses");
  }

  const delegated = [
    ["meetings/route.ts", "../app/api/meetings/route.ts"],
    ["meetings/[id]/route.ts", "../app/api/meetings/[id]/route.ts"],
    ["department-applications/connection/route.ts", "../app/api/department-applications/connection/route.ts"]
  ];
  for (const [route, canonical] of delegated) {
    const wrapper = fs.readFileSync(path.join(opsRoot, route), "utf8");
    assert.match(wrapper, /from ["']\.\.?\/.*api\//);
    const source = fs.readFileSync(path.join(__dirname, canonical), "utf8");
    assert.ok(source.includes('requireCapability("ops.browse")'), route + " canonical handler must require ops.browse");
  }

  const status = fs.readFileSync(path.join(__dirname, "../app/api/auth/oidc/status/route.ts"), "utf8");
  assert.ok(status.includes("verifyPendingIdentity"), "OIDC status is identity-only, not an operations session");
  assert.ok(status.includes("accessGranted: false"), "OIDC identity must not grant operations access");
});

test("operations API guards precede Notion reads and writes", () => {
  const root = path.join(__dirname, "../app/ops/api");
  const api = path.join(__dirname, "../app/api");
  const order = (source, markers, label) => assertInOrder(source, markers, label);

  for (const [file, capability, readMarker, writeMarker] of [
    ["department-programmes/route.ts", "ops.browse", "listDepartmentProgrammes(", "createDepartmentProgrammeDraft("],
    ["department-workplans/route.ts", "ops.browse", "listDepartmentWorkPlans(", "createDepartmentWorkPlanDraft("],
    ["department-reports/route.ts", "ops.browse", "listDepartmentReports(", "createDepartmentReportDraft("],
    ["registers/[kind]/route.ts", "ops.browse", "listRegister(", "createRegisterDraft("],
    ["external-engagement/route.ts", "ops.browse", "listExternalOptions(", "createOrganisation("]
  ]) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    const getBody = source.slice(source.indexOf("export async function GET"));
    order(getBody, ['requireCapability("' + capability + '")', readMarker], file + " GET");
    const postBody = source.slice(source.indexOf("export async function POST"));
    order(postBody, ["isSameOriginRequest(", "requireCapability(", "readBoundedJson(", writeMarker], file + " POST");
  }

  const meetings = fs.readFileSync(path.join(api, "meetings/route.ts"), "utf8");
  order(meetings.slice(meetings.indexOf("export async function GET")),
    ['requireCapability("ops.browse")', "configFlags()", "listMeetings("], "meetings GET");
  order(meetings.slice(meetings.indexOf("export async function POST")),
    ["isSameOriginRequest(", 'requireCapability("ops.meeting.standard")', "readBoundedJson(", "createMeeting("], "meetings POST");

  const meetingDetail = fs.readFileSync(path.join(api, "meetings/[id]/route.ts"), "utf8");
  order(meetingDetail.slice(meetingDetail.indexOf("export async function GET")),
    ['requireCapability("ops.browse")', "getMeeting("], "meeting detail GET");
  order(meetingDetail.slice(meetingDetail.indexOf("export async function PATCH")),
    ["isSameOriginRequest(", 'requireCapability("ops.meeting.standard")', "readBoundedJson(", "getMeeting("], "meeting detail PATCH");

  const action = fs.readFileSync(path.join(root, "actions/[id]/route.ts"), "utf8");
  order(action, ["isSameOriginRequest(", 'requireCapability("ops.action.progress")', "status: 503"], "action progress");
  assert.doesNotMatch(action, /updateActionProgress\s*\(/, "shared staff must not write action progress");

  const connection = fs.readFileSync(path.join(api, "department-applications/connection/route.ts"), "utf8");
  order(connection, ['requireCapability("ops.browse")', "verifyDepartmentApplicationsConnection("], "connection diagnostic");
});

test("shared-key sessions cannot write unattributed action progress", () => {
  const source = fs.readFileSync(path.join(opsApiRoot, "actions/[id]/route.ts"), "utf8");
  assert.ok(source.includes('requireCapability("ops.action.progress")'));
  assert.match(source, /Individual officer identity and verified action assignment are not connected/);
  assert.match(source, /Shared staff access cannot attribute progress/);
  assert.match(source, /status: 503/);
  assert.equal(source.includes("updateActionProgress("), false);
  const panel = fs.readFileSync(path.join(__dirname, "../components/OperationalRegister.tsx"), "utf8");
  assert.match(panel, /Progress updates are paused/);
  assert.match(panel, /Shared staff access cannot record accountable progress/);
  assert.equal(panel.includes("ActionProgressForm"), false);
  assert.match(panel, /Proposed owner role/);
  assert.doesNotMatch(panel, /Accountable owner role/);
});
