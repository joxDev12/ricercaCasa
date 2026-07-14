const propertySearchService = require("../services/propertySearchService");

async function search(req, res, next) {
  try {
    const result = await propertySearchService.search(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function locations(req, res, next) {
  try {
    const data = await propertySearchService.suggestLocations(req.query.q, {
      label: req.query.contextLabel || null,
      path: req.query.contextPath || null,
    }, req.query.providers ? String(req.query.providers).split(",") : []);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

module.exports = { locations, search };
