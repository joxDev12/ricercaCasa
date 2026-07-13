const express = require("express");
const favoritesController = require("../controller/favoritesController");
const { validate } = require("../middleware/validate");
const {
  favoriteIdValidator,
  favoritesListValidators,
  saveFavoriteValidators,
} = require("../validators/favoriteValidators");

const router = express.Router();

router.get("/", favoritesListValidators, validate, favoritesController.index);
router.get("/:id", favoriteIdValidator, validate, favoritesController.show);
router.post("/", saveFavoriteValidators, validate, favoritesController.create);
router.delete("/:id", favoriteIdValidator, validate, favoritesController.destroy);

module.exports = router;
