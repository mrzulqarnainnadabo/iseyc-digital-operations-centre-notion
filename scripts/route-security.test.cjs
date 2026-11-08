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
    required: ["isSameOriginRequest", "readBoundedJson", "readStaffKeyInput", "privateJson"],
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
    const exportedMethods = [...source.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)\s*\(/g)]
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
  assertInOrder(getBody, ["requireStaffSession()", "configFlags()", "isValidMeetingCursor(cursorParam)", "listMeetingsPage(cursorParam ?? undefined)"], "meeting GET");
  assert.match(getBody, /The Notion Meetings source is not configured/);

  const detail = fs.readFileSync(path.join(apiRoot, "meetings/[id]/route.ts"), "utf8");
  const getDetail = detail.slice(detail.indexOf("export async function GET"));
  assertInOrder(getDetail, ["requireStaffSession()", "getMeeting(id)"], "meeting detail GET");
});


test("meeting queue pagination remains bounded and filters Standard records at the Notion query", () => {
  const notion = fs.readFileSync(path.join(__dirname, "../lib/notion.ts"), "utf8");
  assert.match(notion, /const MEETING_PAGE_SIZE = 25/);
  assert.match(notion, /page_size: MEETING_PAGE_SIZE/);
  assert.match(notion, /property: "Sensitivity",\s*select: \{ equals: "Standard" \}/);
  assert.match(notion, /sorts: \[\{ timestamp: "created_time", direction: "descending" \}\]/);
  assert.match(notion, /start_cursor: cursor/);
  assert.doesNotMatch(notion, /do\s*\{[\s\S]*?\}\s*while\s*\(cursor\)/);
});

test("meeting queue cursor input is bounded and rejects control characters", () => {
  const notion = fs.readFileSync(path.join(__dirname, "../lib/notion.ts"), "utf8");
  assert.match(notion, /MAX_NOTION_CURSOR_LENGTH = 256/);
  assert.match(notion, /isValidMeetingCursor\(cursor: unknown\)/);
  const route = fs.readFileSync(path.join(apiRoot, "meetings/route.ts"), "utf8");
  assert.match(route, /cursorParam !== null && !isValidMeetingCursor\(cursorParam\)/);
  const alias = fs.readFileSync(path.join(__dirname, "../app/ops/api/meetings/route.ts"), "utf8");
  assert.match(alias, /getMeetings\(req\)/);
});

test("queue UI exposes bounded previous/next navigation and labels page-local counts", () => {
  const queue = fs.readFileSync(path.join(__dirname, "../app/ops/queue/page.tsx"), "utf8");
  assert.match(queue, /Page \{pageIndex \+ 1\}/);
  assert.match(queue, /onClick=\{goPrevious\}/);
  assert.match(queue, /onClick=\{goNext\}/);
  assert.match(queue, /Records on this page/);
  assert.match(queue, /Filters apply to this page|status on this page/);
});
