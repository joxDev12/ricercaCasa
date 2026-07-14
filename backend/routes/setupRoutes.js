const express = require("express");
const setupController = require("../controller/setupController");
const { requireSetupToken } = require("../middleware/requireSetupToken");
const { validate } = require("../middleware/validate");
const { initialSetupValidators } = require("../validators/setupValidators");

const router = express.Router();

router.get("/status", requireSetupToken, setupController.status);
router.post(
  "/complete",
  requireSetupToken,
  initialSetupValidators,
  validate,
  setupController.complete
);

module.exports = router;
