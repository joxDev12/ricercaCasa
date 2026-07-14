const assert = require("node:assert/strict");
const test = require("node:test");
const {
  assertSafeConfigurationKeys,
  normalizeProfileInput,
} = require("../services/settingsService");
const { ValidationError } = require("../utils/errors");

test("normalizeProfileInput trims profile fields", () => {
  assert.deepEqual(
    normalizeProfileInput({
      displayName: "  Mario Rossi  ",
      contactEmail: "  Mario@Example.COM  ",
      locale: " it-IT ",
      timezone: " Europe/Rome ",
    }),
    {
      displayName: "Mario Rossi",
      contactEmail: "Mario@example.com",
      locale: "it-IT",
      timezone: "Europe/Rome",
    }
  );
});

test("assertSafeConfigurationKeys rejects secret-like keys", () => {
  assert.throws(
    () => assertSafeConfigurationKeys({ smtp: { password: "hidden" } }),
    ValidationError
  );
});
