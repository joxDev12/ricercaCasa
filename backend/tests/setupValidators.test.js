const assert = require("node:assert/strict");
const test = require("node:test");
const { validationResult } = require("express-validator");
const {
  initialSetupValidators,
  profileValidators,
} = require("../validators/setupValidators");

test("setup validators require consent and final confirmation", async () => {
  const request = {
    body: {
      displayName: "Mario",
      contactEmail: "mario@example.com",
      locale: "it-IT",
      timezone: "Europe/Rome",
      scrapingConsent: false,
      confirmSetup: false,
    },
  };

  await Promise.all(initialSetupValidators.map((validator) => validator.run(request)));

  const errors = validationResult(request).array();
  assert.equal(errors.some((error) => error.path === "scrapingConsent"), true);
  assert.equal(errors.some((error) => error.path === "confirmSetup"), true);
});

test("profile validators accept settings update without setup-only fields", async () => {
  const request = {
    body: {
      displayName: "Mario",
      contactEmail: "mario@example.com",
      locale: "it-IT",
      timezone: "Europe/Rome",
    },
  };

  await Promise.all(profileValidators.map((validator) => validator.run(request)));

  assert.deepEqual(validationResult(request).array(), []);
});
