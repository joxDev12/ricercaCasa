const { body, query } = require("express-validator");

const searchValidators = [
  body("provider").trim().equals("immobiliare_it"),
  body("location").trim().isLength({ min: 2 }),
  body("locationPath")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 300 })
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/),
  body("transactionType").isIn(["rent", "sale"]),
  body("maxPrice").optional({ values: "null" }).isFloat({ gt: 0 }),
  body("page").optional().isInt({ min: 1 }).toInt(),
];

const locationSuggestionValidators = [
  query("q").trim().isLength({ min: 2, max: 100 }),
  query("contextLabel").optional().trim().isLength({ max: 100 }),
  query("contextPath")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/),
];

module.exports = { locationSuggestionValidators, searchValidators };
