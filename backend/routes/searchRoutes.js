const express = require("express");
const searchController = require("../controller/searchController");
const { validate } = require("../middleware/validate");
const {
  locationSuggestionValidators,
  searchValidators,
} = require("../validators/searchValidators");

const router = express.Router();

router.get(
  "/locations",
  locationSuggestionValidators,
  validate,
  searchController.locations
);
router.post("/", searchValidators, validate, searchController.search);

module.exports = router;
