const { body, param } = require("express-validator");

const createNoteValidators = [
  param("id").isInt({ min: 1 }).toInt(),
  body("body").trim().isLength({ min: 1, max: 10000 }),
];

const updateNoteValidators = [
  param("id").isInt({ min: 1 }).toInt(),
  param("noteId").isInt({ min: 1 }).toInt(),
  body("body").trim().isLength({ min: 1, max: 10000 }),
];

const noteRouteValidators = [
  param("id").isInt({ min: 1 }).toInt(),
  param("noteId").isInt({ min: 1 }).toInt(),
];

module.exports = {
  createNoteValidators,
  noteRouteValidators,
  updateNoteValidators,
};
