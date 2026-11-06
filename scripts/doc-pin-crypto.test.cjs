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

const pin = require("../lib/pin-crypto.ts");

test("DOC PIN uses salted scrypt and verifies only the matching six-digit value", async () => {
  const previous = process.env.DOC_PIN_PEPPER;
  process.env.DOC_PIN_PEPPER = "test-only-doc-pin-pepper-with-more-than-32-bytes";
  try {
    const encoded = await pin.hashDocPin("042719");
    const secondEncoded = await pin.hashDocPin("042719");
    assert.notEqual(encoded, secondEncoded, "each PIN hash must use an independent random salt");
    assert.match(encoded, /^scrypt\$32768\$8\$1\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{43}$/);
    assert.equal(encoded.includes("042719"), false);
    assert.equal(await pin.verifyDocPin("042719", encoded), true);
    assert.equal(await pin.verifyDocPin("042718", encoded), false);
    assert.equal(await pin.verifyDocPin("042719", "not-a-valid-record"), false);
  } finally {
    if (previous === undefined) delete process.env.DOC_PIN_PEPPER;
    else process.env.DOC_PIN_PEPPER = previous;
  }
});

test("DOC PIN rejects malformed inputs and missing server-side pepper", async () => {
  const previous = process.env.DOC_PIN_PEPPER;
  try {
    delete process.env.DOC_PIN_PEPPER;
    await assert.rejects(pin.hashDocPin("123456"), /pepper is not configured/);
    await assert.rejects(pin.verifyDocPin("123456", "invalid"), /pepper is not configured/);
    process.env.DOC_PIN_PEPPER = "test-only-doc-pin-pepper-with-more-than-32-bytes";
    for (const value of ["12345", "1234567", "12a456", "", " 12345"]) {
      await assert.rejects(pin.hashDocPin(value), /exactly six digits/);
    }
    assert.equal(await pin.verifyDocPin("12345", "invalid"), false);
  } finally {
    if (previous === undefined) delete process.env.DOC_PIN_PEPPER;
    else process.env.DOC_PIN_PEPPER = previous;
  }
});
