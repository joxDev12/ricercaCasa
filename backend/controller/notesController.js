const listingManagementService = require("../services/listingManagementService");

async function create(req, res, next) {
  try {
    const note = await listingManagementService.createNote(
      req.params.id,
      req.body.body
    );
    res.status(201).json({ data: note });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const note = await listingManagementService.updateNote(
      req.params.id,
      req.params.noteId,
      req.body.body
    );
    res.json({ data: note });
  } catch (error) {
    next(error);
  }
}

async function destroy(req, res, next) {
  try {
    await listingManagementService.deleteNote(req.params.id, req.params.noteId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = { create, destroy, update };
