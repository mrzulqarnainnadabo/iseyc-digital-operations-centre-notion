const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "lib/runtime-portability.ts"), "utf8");

test("portability inventory classifies auth crypto as Node-dependent", () => {
  assert.match(source, /lib\/auth\.ts/);
  assert.match(source, /B_node_dependent/);
  assert.match(source, /lib\/session-capabilities\.ts/);
  assert.match(source, /A_portable_logic/);
  assert.match(source, /lib\/notion\.ts/);
  assert.match(source, /D_external_integration/);
});

test("inventory documents official seal as static public", () => {
  assert.match(source, /iseyc-seal\.svg/);
  assert.match(source, /E_static_public/);
});

test("listed inventory files exist in the repository", () => {
  const paths = [...source.matchAll(/path: "([^"]+)"/g)].map((m) => m[1]);
  assert.ok(paths.length >= 20, "expected a substantial inventory");
  for (const relative of paths) {
    assert.ok(fs.existsSync(path.join(root, relative)), `missing ${relative}`);
  }
});

test("auth module still uses cryptographic session verification", () => {
  const auth = fs.readFileSync(path.join(root, "lib/auth.ts"), "utf8");
  assert.match(auth, /createHmac|timingSafeEqual/);
  assert.match(auth, /SESSION_COOKIE_PATH = "\/ops"/);
  assert.match(auth, /shared-key gate|shared key/i);
});
