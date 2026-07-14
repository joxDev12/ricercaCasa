const { body, query } = require("express-validator");

const searchValidators = [
  body("provider").optional().trim().isIn(["immobiliare_it", "idealista_it", "casa_it"]),
  body("providers").optional().isArray({ min: 1, max: 3 }),
  body("providers.*").optional().trim().isIn(["immobiliare_it", "idealista_it", "casa_it"]),
  body("location").trim().isLength({ min: 2 }),
  body("locationPath")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 300 })
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/),
  body("providerContexts").optional().isObject(),
  body("pagination").optional().isObject(),
  body("transactionType").isIn(["rent", "sale"]),
  body("maxPrice").optional({ values: "null" }).isFloat({ gt: 0 }),
  body("page").optional().isInt({ min: 1 }).toInt(),
];

const locationSuggestionValidators = [
  query("q").trim().isLength({ min: 2, max: 100 }),
  query("providers").optional().trim().isLength({ max: 120 }),
  query("contextLabel").optional().trim().isLength({ max: 100 }),
  query("contextPath")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/),
];

module.exports = { locationSuggestionValidators, searchValidators };
