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
    required: ["requireStaffSession", "privateJson", "configFlags", "legacySessionCanReadMeeting", "legacySessionCanCreateMeeting"],
    forbidden: []
  },
  "meetings/[id]/route.ts": {
    methods: ["GET", "PATCH"],
    required: ["requireStaffSession", "privateJson", "legacySessionCanReadMeeting", "legacySessionCanSetMeetingStatus"],
    forbidden: []
  },
  "department-applications/connection/route.ts": {
    methods: ["GET"],
    required: ["requireStaffSession", "privateJson", "verifyDepartmentApplicationsConnection"],
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
    assert.deepEqual(exportedMethods, [...contract.methods].sort(), "HTTP method surface changed");
    for (const marker of contract.required) {
      assert.ok(source.includes(marker), `Missing required security marker: ${marker}`);
    }
    for (const marker of contract.forbidden) {
      assert.equal(source.includes(marker), false, `Unexpected security marker: ${marker}`);
    }
  });
}

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
  assertInOrder(postBody, ["isSameOriginRequest(req)", "requireStaffSession()", "readBoundedJson(req", "createMeeting({"], "meeting POST");

  const updateMeeting = fs.readFileSync(path.join(apiRoot, "meetings/[id]/route.ts"), "utf8");
  const patchBody = updateMeeting.slice(updateMeeting.indexOf("export async function PATCH"));
  assertInOrder(patchBody, ["isSameOriginRequest(req)", "requireStaffSession()", "readBoundedJson(req", "getMeeting(id)", "setMeetingStatus(id"], "meeting PATCH");
});

test("protected meeting reads authenticate and fail closed when Notion is not configured", () => {
  const collection = fs.readFileSync(path.join(apiRoot, "meetings/route.ts"), "utf8");
  const getBody = collection.slice(collection.indexOf("export async function GET"));
  assertInOrder(getBody, ["requireStaffSession()", "configFlags()", "listMeetings({ cursor"], "meeting GET");
  assert.match(getBody, /The Notion Meetings source is not configured/);

  const detail = fs.readFileSync(path.join(apiRoot, "meetings/[id]/route.ts"), "utf8");
  const getDetail = detail.slice(detail.indexOf("export async function GET"));
  assertInOrder(getDetail, ["requireStaffSession()", "getMeeting(id)"], "meeting detail GET");
});

test("meeting pagination rejects malformed continuation cursors before calling Notion", () => {
  const source = fs.readFileSync(path.join(apiRoot, "meetings/route.ts"), "utf8");
  assert.ok(source.includes("cursor && !/^[0-9a-f]{8}-"));
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
  assertInOrder(source, ["requireStaffSession()", "verifyDepartmentApplicationsConnection()"], "department applications connection check");
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
  assert.match(limiter, /distributed Vercel Firewall\/WAF limit/);
  assert.match(limiter, /POST \/api\/auth\/login/);
});


const opsApiRoot = path.join(__dirname, "../app/ops/api");

test("every Operations Centre API route is private and every mutation is same-origin and session protected", () => {
  const routes = collectRoutes(opsApiRoot);
  assert.ok(routes.length > 0, "Operations Centre API route inventory must not be empty");

  for (const route of routes) {
    const wrapper = fs.readFileSync(path.join(opsApiRoot, route), "utf8");
    const delegated = wrapper.includes('from "../../../api/') || wrapper.includes('from "../../../../api/');
    const source = delegated ? fs.readFileSync(path.join(apiRoot, route), "utf8") : wrapper;
    assert.ok(source.includes("requireStaffSession()"), `${route} must require an authenticated staff session in its handler`);
    assert.ok(source.includes("privateJson(") || source.includes("privateResponseHeaders("), `${route} must use private no-store response handling in its handler`);

    const methods = [...source.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)\s*\(/g)]
      .map((match) => match[1]);
    for (const method of methods.filter((item) => item !== "GET")) {
      const body = source.slice(source.indexOf(`export async function ${method}`));
      assertInOrder(
        body,
        ["isSameOriginRequest(", "requireStaffSession()"],
        `${route} ${method}`
      );
    }
  }
});

test("shared-key sessions cannot write unattributed action progress", () => {
  const source = fs.readFileSync(path.join(opsApiRoot, "actions/[id]/route.ts"), "utf8");
  assert.ok(source.includes("requireStaffSession()"));
  assert.match(source, /Individual officer identity and verified action assignment are not connected/);
  assert.match(source, /Shared staff access cannot attribute progress/);
  assert.match(source, /status: 503/);
  assert.equal(source.includes("updateActionProgress("), false);
  const panel = fs.readFileSync(path.join(__dirname, "../components/OperationalRegister.tsx"), "utf8");
  assert.match(panel, /Progress updates are paused/);
  assert.match(panel, /Shared staff access cannot record accountable progress/);
  assert.equal(panel.includes("ActionProgressForm"), false);
});
