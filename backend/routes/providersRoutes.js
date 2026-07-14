const express = require("express");
const providersController = require("../controller/providersController");

const router = express.Router();

router.get("/", providersController.index);

module.exports = router;
