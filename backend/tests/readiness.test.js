const assert = require("node:assert/strict");
const test = require("node:test");
const { areRequiredMigrationsApplied } = require("../utils/readiness");

test("readiness fails when even one local migration is missing", () => {
  assert.equal(
    areRequiredMigrationsApplied(
      ["001_create_sources", "002_create_saved_listings"],
      ["001_create_sources"]
    ),
    false
  );
});

test("readiness passes when all local migrations are applied", () => {
  assert.equal(
    areRequiredMigrationsApplied(
      ["001_create_sources", "002_create_saved_listings"],
      ["001_create_sources", "002_create_saved_listings"]
    ),
    true
  );
});
