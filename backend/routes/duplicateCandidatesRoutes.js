const express = require("express");
const duplicateCandidatesController = require("../controller/duplicateCandidatesController");
const { validate } = require("../middleware/validate");
const {
  duplicateCandidateDecisionValidators,
} = require("../validators/duplicateCandidateValidators");

const router = express.Router();

router.patch(
  "/:id",
  duplicateCandidateDecisionValidators,
  validate,
  duplicateCandidatesController.update
);

module.exports = router;
