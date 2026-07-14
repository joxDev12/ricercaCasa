const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { Client } = require("pg");

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

function getMigrationsDir() {
  return path.join(__dirname, "..", "migrations");
}

function listMigrationFiles(migrationsDir = getMigrationsDir()) {
  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^\d+.*\.(js|cjs|mjs|ts|sql)$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

async function getMigrationStatus(
  env = process.env,
  {
    clientFactory = (connectionString) => new Client({ connectionString }),
    migrationsDir = getMigrationsDir(),
  } = {}
) {
  const databaseUrl = buildDatabaseUrl(env);
  const expectedMigrations = listMigrationFiles(migrationsDir);
  const client = clientFactory(databaseUrl);

  await client.connect();

  try {
    let appliedMigrations = [];

    try {
      const result = await client.query(
        "SELECT name FROM pgmigrations ORDER BY run_on ASC, id ASC"
      );
      appliedMigrations = result.rows.map((row) => row.name).filter(Boolean);
    } catch (error) {
      if (error?.code !== "42P01") {
        throw error;
      }
    }

    const appliedSet = new Set(appliedMigrations);
    const expectedSet = new Set(expectedMigrations);

    return {
      applied: expectedMigrations.filter((name) => appliedSet.has(name)),
      pending: expectedMigrations.filter((name) => !appliedSet.has(name)),
      unknown: appliedMigrations.filter((name) => !expectedSet.has(name)),
    };
  } finally {
    await client.end();
  }
}

function logMigrationStatus(status) {
  console.log(`Applied migrations: ${status.applied.length}`);
  console.log(`Pending migrations: ${status.pending.length}`);

  if (status.pending.length > 0) {
    console.log(status.pending.join("\n"));
  }

  if (status.unknown.length > 0) {
    console.log(`Unknown migrations in database: ${status.unknown.length}`);
    console.log(status.unknown.join("\n"));
  }
}

async function runMigrations(action, env = process.env) {
  const command = getMigrationCommand(action);

  if (command === "status") {
    const status = await getMigrationStatus(env);
    logMigrationStatus(status);

    if (status.pending.length > 0 || status.unknown.length > 0) {
      process.exitCode = 1;
    }

    return status;
  }

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
    [nodePgMigrateBin, command, "-m", getMigrationsDir()],
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
  void (async () => {
    try {
      await runMigrations(process.argv[2] || "up");
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : "Migration runner failed"
      );
      process.exit(1);
    }
  })();
}

module.exports = {
  buildDatabaseUrl,
  getDatabasePassword,
  getMigrationCommand,
  getMigrationStatus,
  listMigrationFiles,
  readSecretFile,
  runMigrations,
};
