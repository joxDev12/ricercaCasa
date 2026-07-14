const { body } = require("express-validator");

const profileValidators = [
  body("displayName")
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage("displayName obbligatorio"),
  body("contactEmail")
    .optional({ values: "falsy" })
    .trim()
    .isEmail()
    .withMessage("contactEmail non valida"),
  body("locale")
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage("locale non valida"),
  body("timezone")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("timezone non valida"),
  body("scrapingConsent")
    .isBoolean({ strict: true })
    .custom((value) => value === true)
    .withMessage("scrapingConsent richiesto"),
  body("confirmSetup")
    .isBoolean({ strict: true })
    .custom((value) => value === true)
    .withMessage("confirmSetup richiesto"),
];

module.exports = { profileValidators };
