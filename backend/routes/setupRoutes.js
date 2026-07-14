const express = require("express");
const setupController = require("../controller/setupController");
const { requireSetupToken } = require("../middleware/requireSetupToken");
const { validate } = require("../middleware/validate");
const { profileValidators } = require("../validators/setupValidators");

const router = express.Router();

router.get("/status", requireSetupToken, setupController.status);
router.post(
  "/complete",
  requireSetupToken,
  profileValidators,
  validate,
  setupController.complete
);

module.exports = router;
