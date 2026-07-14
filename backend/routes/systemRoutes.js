const express = require("express");
const systemController = require("../controller/systemController");

const router = express.Router();

router.get("/info", systemController.info);
router.get("/health", systemController.health);

module.exports = router;
