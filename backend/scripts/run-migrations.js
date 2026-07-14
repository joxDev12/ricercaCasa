const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function readSecretFile(secretFilePath, envName) {
  if (!secretFilePath) {
    return "";
  }

  try {
    return fs.readFileSync(secretFilePath, "utf8").trim();
  } catch (error) {
    throw new Error(`${envName} points to unreadable file: ${secretFilePath}`, {
      cause: error,
    });
  }
}

function getDatabasePassword(env) {
  return readSecretFile(env.DB_PASS_FILE, "DB_PASS_FILE") || env.DB_PASS || "";
}

function buildDatabaseUrl(env) {
  if (env.DATABASE_URL) {
    return env.DATABASE_URL;
  }

  const required = ["DB_HOST", "DB_NAME", "DB_USER"];
  const missing = required.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(
      `DATABASE_URL not set. Missing DB connection variables: ${missing.join(", ")}`
    );
  }

  const password = getDatabasePassword(env);

  if (!password) {
    throw new Error(
      "DATABASE_URL not set. Missing database password: provide DB_PASS_FILE or DB_PASS."
    );
  }

  const port = env.DB_PORT || "5432";
  const url = new URL(`postgres://${env.DB_HOST}:${port}/${env.DB_NAME}`);
  url.username = env.DB_USER;
  url.password = password;
  return url.toString();
}

function getMigrationCommand(action) {
  if (action === "up" || action === "down" || action === "status") {
    return action;
  }

  throw new Error(`Unsupported migration action: ${action}`);
}

function runMigrations(action, env = process.env) {
  const command = getMigrationCommand(action);
  const databaseUrl = buildDatabaseUrl(env);
  const nodePgMigrateBin = path.join(
    __dirname,
    "..",
    "node_modules",
    "node-pg-migrate",
    "bin",
    "node-pg-migrate.js"
  );

  const result = spawnSync(
    process.execPath,
    [nodePgMigrateBin, command, "-m", path.join(__dirname, "..", "migrations")],
    {
      env: {
        ...env,
        DATABASE_URL: databaseUrl,
      },
      stdio: "inherit",
    }
  );

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }
}

if (require.main === module) {
  try {
    runMigrations(process.argv[2] || "up");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Migration runner failed"
    );
    process.exit(1);
  }
}

module.exports = {
  buildDatabaseUrl,
  getDatabasePassword,
  getMigrationCommand,
  readSecretFile,
  runMigrations,
};
