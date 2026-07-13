const express = require("express");
const annunciController = require("../controller/annunciController");

const router = express.Router();

router.get("/", annunciController.index);

module.exports = router;
