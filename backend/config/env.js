const fs = require("node:fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

function getNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

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

function getSecretValue(valueEnvName, fileEnvName) {
  const fileValue = readSecretFile(process.env[fileEnvName], fileEnvName);
  return fileValue || process.env[valueEnvName] || "";
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: getNumber(process.env.PORT, 3000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  platformVersion: process.env.PLATFORM_VERSION || "3.0.0",
  updaterVersion: process.env.UPDATER_VERSION || "0.0.0",
  databaseUrl: process.env.DATABASE_URL || "",
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: getNumber(process.env.DB_PORT, 5432),
  dbName: process.env.DB_NAME || "",
  dbUser: process.env.DB_USER || "",
  dbPass: getSecretValue("DB_PASS", "DB_PASS_FILE"),
  dbPassFile: process.env.DB_PASS_FILE || "",
  appSecret: getSecretValue("APP_SECRET", "APP_SECRET_FILE"),
  appSecretFile: process.env.APP_SECRET_FILE || "",
  setupToken: getSecretValue("SETUP_TOKEN", "SETUP_TOKEN_FILE"),
  setupTokenFile: process.env.SETUP_TOKEN_FILE || "",
  scrapeTimeoutMs: getNumber(process.env.SCRAPE_TIMEOUT_MS, 10000),
  allowProviderScraping: process.env.ALLOW_PROVIDER_SCRAPING !== "false",
};

module.exports = { env };
