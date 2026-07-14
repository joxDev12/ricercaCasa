const providerService = require("../services/providerService");

async function index(_req, res, next) {
  try {
    const data = await providerService.listActiveProviders();
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

module.exports = { index };
