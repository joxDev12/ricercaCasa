const { body, param, query } = require("express-validator");

const saveFavoriteValidators = [
  body("provider").trim().equals("immobiliare_it"),
  body("externalId").trim().isInt({ min: 1 }),
  body("sourceUrl")
    .trim()
    .custom((value, { req }) => {
      return value === `https://www.immobiliare.it/annunci/${req.body.externalId}/`;
    })
    .withMessage("URL annuncio Immobiliare.it non valido"),
  body("transactionType").isIn(["rent", "sale"]),
  body("title").trim().isLength({ min: 1, max: 500 }),
  body("price").optional({ values: "null" }).isFloat({ min: 0 }).toFloat(),
  body("pricePeriod")
    .optional({ values: "null" })
    .isIn(["month", "week", "day", "total"]),
  body("currency").trim().equals("EUR"),
  body("locationLabel")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 500 }),
  body("propertyType")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 100 }),
  body("surfaceM2").optional({ values: "null" }).isFloat({ min: 0 }).toFloat(),
  body("rooms").optional({ values: "null" }).isInt({ min: 0 }).toInt(),
  body("floor").optional({ values: "null" }).trim().isLength({ max: 50 }),
  body("shortDescription").optional({ values: "null" }).trim(),
  body("mainImageUrl").optional({ values: "null" }).isURL(),
  body("advertiserName").optional({ values: "null" }).trim().isLength({ max: 255 }),
  body("advertiserType").optional({ values: "null" }).trim().isLength({ max: 80 }),
];

const favoriteIdValidator = [param("id").isInt({ min: 1 }).toInt()];

const favoritesListValidators = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  query("transactionType").optional().isIn(["rent", "sale"]),
  query("maxPrice").optional().isFloat({ gt: 0 }),
  query("location").optional().trim().isLength({ min: 1 }),
  query("sort").optional().isIn(["saved_at_desc", "price_asc", "price_desc"]),
];

module.exports = {
  favoriteIdValidator,
  favoritesListValidators,
  saveFavoriteValidators,
};
