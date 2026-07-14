const favoriteService = require("../services/favoriteService");

async function create(req, res, next) {
  try {
    const result = await favoriteService.saveFavorite(req.body);
    res.status(result.status === "created" ? 201 : 200).json(result);
  } catch (error) {
    next(error);
  }
}

async function index(req, res, next) {
  try {
    const result = await favoriteService.listFavorites(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function show(req, res, next) {
  try {
    const favorite = await favoriteService.getFavoriteById(req.params.id);
    res.json({ data: favorite });
  } catch (error) {
    next(error);
  }
}

async function keys(_req, res, next) {
  try {
    const data = await favoriteService.listSavedSourceKeys();
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const listingManagementService = require("../services/listingManagementService");
    const data = await listingManagementService.updateStatus(
      req.params.id,
      req.body.status
    );
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

async function destroy(req, res, next) {
  try {
    await favoriteService.deleteFavorite(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function destroyProperty(req, res, next) {
  try {
    await favoriteService.deleteProperty(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  destroy,
  destroyProperty,
  index,
  keys,
  show,
  updateStatus,
};
