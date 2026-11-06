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
      source.includes("privateJson(") || source.includes("PUBLIC_API_ROUTE:"),
      `${route} must be private by default or explicitly documented as public`
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
  assertInOrder(getBody, ["requireStaffSession()", "configFlags()", "listMeetings()"], "meeting GET");
  assert.match(getBody, /The Notion Meetings source is not configured/);

  const detail = fs.readFileSync(path.join(apiRoot, "meetings/[id]/route.ts"), "utf8");
  const getDetail = detail.slice(detail.indexOf("export async function GET"));
  assertInOrder(getDetail, ["requireStaffSession()", "getMeeting(id)"], "meeting detail GET");
});
