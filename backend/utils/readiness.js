const fs = require("node:fs");
const path = require("path");

function getLocalMigrationNames(migrationsDir) {
  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^\d+.*\.(js|cjs|mjs|ts|sql)$/.test(entry.name))
    .map((entry) => path.parse(entry.name).name)
    .sort();
}

function areRequiredMigrationsApplied(localMigrationNames, appliedMigrationNames) {
  const local = new Set(localMigrationNames);
  const applied = new Set(appliedMigrationNames);
  return (
    localMigrationNames.every((migrationName) => applied.has(migrationName)) &&
    appliedMigrationNames.every((migrationName) => local.has(migrationName))
  );
}

async function getReadinessStatus({ pool, migrationsDir }) {
  const status = {
    ok: false,
    live: true,
    databaseReachable: false,
    schemaReady: false,
    migrationsApplied: false,
    setupCompatible: true,
  };

  await pool.query("SELECT 1");
  status.databaseReachable = true;

  const localMigrationNames = getLocalMigrationNames(migrationsDir);
  let appliedMigrationNames = [];

  try {
    const result = await pool.query("SELECT name FROM pgmigrations ORDER BY id ASC");
    appliedMigrationNames = result.rows.map((row) => row.name);
    status.schemaReady = true;
  } catch (error) {
    if (error && error.code === "42P01") {
      return status;
    }

    throw error;
  }

  status.migrationsApplied = areRequiredMigrationsApplied(
    localMigrationNames,
    appliedMigrationNames
  );
  status.ok =
    status.databaseReachable &&
    status.schemaReady &&
    status.migrationsApplied &&
    status.setupCompatible;

  return status;
}

module.exports = {
  areRequiredMigrationsApplied,
  getLocalMigrationNames,
  getReadinessStatus,
};
