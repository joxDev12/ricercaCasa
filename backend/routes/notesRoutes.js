const express = require("express");
const notesController = require("../controller/notesController");
const { validate } = require("../middleware/validate");
const {
  createNoteValidators,
  noteRouteValidators,
  updateNoteValidators,
} = require("../validators/noteValidators");

const router = express.Router({ mergeParams: true });

router.post("/", createNoteValidators, validate, notesController.create);
router.patch("/:noteId", updateNoteValidators, validate, notesController.update);
router.delete("/:noteId", noteRouteValidators, validate, notesController.destroy);

module.exports = router;
