const { env } = require("../config/env");
const setupService = require("../services/setupService");

async function status(_req, res, next) {
  try {
    const data = await setupService.getStatus();
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

async function complete(req, res, next) {
  try {
    const data = await setupService.completeSetup(req.body, env.platformVersion);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

module.exports = { complete, status };
