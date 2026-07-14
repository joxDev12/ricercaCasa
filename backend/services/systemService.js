const { pool } = require("../config/db");
const { env } = require("../config/env");
const appInstallationRepository = require("../models/appInstallationRepository");
const applicationUpdateRepository = require("../models/applicationUpdateRepository");
const { getReadinessStatus } = require("../utils/readiness");

async function getInfo(migrationsDir) {
  const [installation, latestUpdate, postgresVersionResult, readiness] = await Promise.all([
    appInstallationRepository.getSingleton(pool),
    applicationUpdateRepository.findLatest(pool),
    pool.query("SHOW server_version"),
    getReadinessStatus({ pool, migrationsDir }),
  ]);

  return {
    installation,
    platformVersion: env.platformVersion,
    updaterVersion: env.updaterVersion,
    postgresVersion: postgresVersionResult.rows[0]?.server_version || null,
    lastUpdate: latestUpdate,
    health: readiness,
  };
}

async function getHealth(migrationsDir) {
  return getReadinessStatus({ pool, migrationsDir });
}

module.exports = { getHealth, getInfo };
