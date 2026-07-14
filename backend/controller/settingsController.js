const settingsService = require("../services/settingsService");

async function showProfile(_req, res, next) {
  try {
    const data = await settingsService.getProfile();
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const data = await settingsService.updateProfile(req.body);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

async function listFeatures(_req, res, next) {
  try {
    const data = await settingsService.listFeatures();
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

async function showFeature(req, res, next) {
  try {
    const data = await settingsService.getFeature(req.params.code);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

async function putFeature(req, res, next) {
  try {
    const data = await settingsService.putFeature(req.params.code, req.body);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listFeatures,
  putFeature,
  showFeature,
  showProfile,
  updateProfile,
};
