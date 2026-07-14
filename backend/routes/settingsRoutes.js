const express = require("express");
const settingsController = require("../controller/settingsController");
const { validate } = require("../middleware/validate");
const {
  featureCodeValidator,
  featureConfigurationValidators,
} = require("../validators/settingsValidators");
const { profileValidators } = require("../validators/setupValidators");

const router = express.Router();

router.get("/", settingsController.showProfile);
router.patch("/profile", profileValidators, validate, settingsController.updateProfile);
router.get("/features", settingsController.listFeatures);
router.get(
  "/features/:code",
  featureCodeValidator,
  validate,
  settingsController.showFeature
);
router.put(
  "/features/:code",
  featureConfigurationValidators,
  validate,
  settingsController.putFeature
);

module.exports = router;
