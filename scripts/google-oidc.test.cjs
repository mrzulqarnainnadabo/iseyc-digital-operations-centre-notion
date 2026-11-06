const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

require.extensions[".ts"] = (mod, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  mod._compile(js, filename);
};

const root = path.join(__dirname, "..");
const oidc = require("../lib/google-oidc.ts");

test("Google OIDC transaction uses independent high-entropy state, nonce and PKCE verifier", () => {
  const tx = oidc.createOidcTransaction();
  assert.ok(tx.state.length >= 43);
  assert.ok(tx.nonce.length >= 43);
  assert.ok(tx.verifier.length >= 43);
  assert.ok(tx.challenge.length >= 43);
  assert.notEqual(tx.state, tx.nonce);
  assert.notEqual(tx.verifier, tx.challenge);
});

test("Google OIDC is disabled unless client credentials and a 32-byte session secret exist", () => {
  const prior = {
    id: process.env.DOC_GOOGLE_CLIENT_ID,
    secret: process.env.DOC_GOOGLE_CLIENT_SECRET,
    signing: process.env.DOC_SESSION_SECRET,
  };
  try {
    delete process.env.DOC_GOOGLE_CLIENT_ID;
    delete process.env.DOC_GOOGLE_CLIENT_SECRET;
    delete process.env.DOC_SESSION_SECRET;
    assert.equal(oidc.googleOidcConfigured(), false);
    process.env.DOC_GOOGLE_CLIENT_ID = "client-id";
    process.env.DOC_GOOGLE_CLIENT_SECRET = "client-secret";
    process.env.DOC_SESSION_SECRET = "too-short";
    assert.equal(oidc.googleOidcConfigured(), false);
    process.env.DOC_SESSION_SECRET = "a".repeat(32);
    assert.equal(oidc.googleOidcConfigured(), true);
  } finally {
    if (prior.id === undefined) delete process.env.DOC_GOOGLE_CLIENT_ID; else process.env.DOC_GOOGLE_CLIENT_ID = prior.id;
    if (prior.secret === undefined) delete process.env.DOC_GOOGLE_CLIENT_SECRET; else process.env.DOC_GOOGLE_CLIENT_SECRET = prior.secret;
    if (prior.signing === undefined) delete process.env.DOC_SESSION_SECRET; else process.env.DOC_SESSION_SECRET = prior.signing;
  }
});

test("pending Google identity proof is signed, short-lived and tamper-evident", () => {
  const prior = process.env.DOC_SESSION_SECRET;
  process.env.DOC_SESSION_SECRET = "test-only-signing-secret-that-is-at-least-32-bytes";
  try {
    const token = oidc.signPendingIdentity("google-subject-test");
    assert.equal(oidc.verifyPendingIdentity(token), true);
    assert.equal(oidc.verifyPendingIdentity(token + "x"), false);
    assert.equal(oidc.verifyPendingIdentity(""), false);
  } finally {
    if (prior === undefined) delete process.env.DOC_SESSION_SECRET;
    else process.env.DOC_SESSION_SECRET = prior;
  }
});

test("Google identity proof is not accepted as a DOC operations session", () => {
  const auth = fs.readFileSync(path.join(root, "lib/auth.ts"), "utf8");
  const opsLayout = fs.readFileSync(path.join(root, "app/ops/layout.tsx"), "utf8");
  const status = fs.readFileSync(path.join(root, "app/api/auth/oidc/status/route.ts"), "utf8");
  assert.match(auth, /verifySessionToken\(jar\.get\(COOKIE\)\?\.value\)/);
  assert.doesNotMatch(auth, /PENDING_IDENTITY_COOKIE/);
  assert.match(opsLayout, /requireStaffSession/);
  assert.match(status, /accessGranted: false/);
});

test("Google OIDC callback validates state, PKCE, nonce, issuer, audience and verified email", () => {
  const start = fs.readFileSync(path.join(root, "app/api/auth/oidc/start/route.ts"), "utf8");
  const callback = fs.readFileSync(path.join(root, "app/api/auth/oidc/callback/route.ts"), "utf8");
  const helper = fs.readFileSync(path.join(root, "lib/google-oidc.ts"), "utf8");
  assert.match(start, /code_challenge_method.*S256/);
  assert.match(start, /prompt.*select_account/);
  assert.match(callback, /safeEqual\(returnedState, expectedState\)/);
  assert.match(callback, /code_verifier: verifier/);
  assert.match(callback, /verifyGoogleIdToken/);
  assert.match(helper, /issuer: GOOGLE_ISSUERS/);
  assert.match(helper, /audience: clientId/);
  assert.match(helper, /payload\.email_verified !== true/);
  assert.match(helper, /payload\.nonce/);
});
