const { body, param } = require("express-validator");

const duplicateCandidateDecisionValidators = [
  param("id").isInt({ min: 1 }).toInt(),
  body("decision").isIn(["confirmed", "rejected"]),
];

module.exports = { duplicateCandidateDecisionValidators };
