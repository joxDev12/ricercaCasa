const express = require("express");
const favoritesController = require("../controller/favoritesController");
const appointmentsRoutes = require("./appointmentsRoutes");
const notesRoutes = require("./notesRoutes");
const { validate } = require("../middleware/validate");
const {
  favoriteIdValidator,
  favoritesListValidators,
  favoriteStatusValidators,
  saveFavoriteValidators,
} = require("../validators/favoriteValidators");

const router = express.Router();

router.get("/keys", favoritesController.keys);
router.get("/", favoritesListValidators, validate, favoritesController.index);
router.get("/:id", favoriteIdValidator, validate, favoritesController.show);
router.patch(
  "/:id/status",
  favoriteStatusValidators,
  validate,
  favoritesController.updateStatus
);
router.use("/:id/notes", notesRoutes);
router.use("/:id/appointments", appointmentsRoutes);
router.post("/", saveFavoriteValidators, validate, favoritesController.create);
router.delete(
  "/:id/property",
  favoriteIdValidator,
  validate,
  favoritesController.destroyProperty
);
router.delete("/:id", favoriteIdValidator, validate, favoritesController.destroy);

module.exports = router;
