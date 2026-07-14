const { body, param, query } = require("express-validator");
const { getScraper } = require("../scraper");
const { isProviderCode } = require("../scraper/shared/contracts");

const saveFavoriteValidators = [
  body("provider")
    .trim()
    .custom((value) => isProviderCode(value)),
  body("externalId").trim().isLength({ min: 1, max: 150 }),
  body("sourceUrl")
    .trim()
    .custom((value, { req }) => {
      const scraper = getScraper(req.body.provider);
      return scraper.validateSourceUrl(value);
    })
    .withMessage("URL annuncio provider non valido"),
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
  body("variants").optional().isArray({ min: 1, max: 10 }),
  body("variants.*.provider")
    .optional()
    .trim()
    .custom((value) => isProviderCode(value)),
  body("variants.*.externalId").optional().trim().isLength({ min: 1, max: 150 }),
  body("variants.*.sourceUrl")
    .optional()
    .trim()
    .custom((value, { req, pathValues }) => {
      const index = Number(pathValues[0]);
      const provider = req.body.variants?.[index]?.provider;
      return provider ? getScraper(provider).validateSourceUrl(value) : false;
    }),
];

const favoriteIdValidator = [param("id").isInt({ min: 1 }).toInt()];

const favoritesListValidators = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  query("transactionType").optional().isIn(["rent", "sale"]),
  query("maxPrice").optional().isFloat({ gt: 0 }),
  query("location").optional().trim().isLength({ min: 1 }),
  query("provider").optional().isIn(["immobiliare_it", "idealista_it", "casa_it"]),
  query("managementStatus")
    .optional()
    .isIn([
      "saved",
      "to_contact",
      "contacted",
      "appointment_scheduled",
      "visited",
      "discarded",
    ]),
  query("hasFutureAppointment").optional().isBoolean(),
  query("sort")
    .optional()
    .isIn(["saved_at_desc", "price_asc", "price_desc", "appointment_asc"]),
];

const favoriteStatusValidators = [
  param("id").isInt({ min: 1 }).toInt(),
  body("status").isIn([
    "saved",
    "to_contact",
    "contacted",
    "appointment_scheduled",
    "visited",
    "discarded",
  ]),
];

module.exports = {
  favoriteIdValidator,
  favoritesListValidators,
  favoriteStatusValidators,
  saveFavoriteValidators,
};
