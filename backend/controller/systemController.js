const path = require("node:path");
const systemService = require("../services/systemService");

const migrationsDir = path.join(__dirname, "..", "migrations");

async function info(_req, res, next) {
  try {
    const data = await systemService.getInfo(migrationsDir);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

async function health(_req, res, next) {
  try {
    const data = await systemService.getHealth(migrationsDir);
    res.status(data.ok ? 200 : 503).json({ data });
  } catch (error) {
    next(error);
  }
}

module.exports = { health, info };
