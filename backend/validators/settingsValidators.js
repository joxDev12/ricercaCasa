const { body, param } = require("express-validator");

const featureCodeValidator = [
  param("code")
    .trim()
    .matches(/^[a-z0-9_-]+$/)
    .withMessage("feature code non valido"),
];

const featureConfigurationValidators = [
  ...featureCodeValidator,
  body("schemaVersion")
    .isInt({ min: 1 })
    .withMessage("schemaVersion non valida"),
  body("status")
    .isIn(["pending", "configured", "disabled", "invalid"])
    .withMessage("status non valido"),
  body("configuration")
    .isObject()
    .withMessage("configuration deve essere oggetto"),
];

module.exports = { featureCodeValidator, featureConfigurationValidators };
