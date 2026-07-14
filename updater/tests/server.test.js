const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

test("updater wizard page exists", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");
  assert.match(html, /Wizard locale installazione/);
  assert.match(html, /\/updater\/setup\/complete/);
});
