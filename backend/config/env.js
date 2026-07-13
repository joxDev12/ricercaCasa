const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

function getNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: getNumber(process.env.PORT, 3000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  databaseUrl: process.env.DATABASE_URL || "",
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: getNumber(process.env.DB_PORT, 5432),
  dbName: process.env.DB_NAME || "",
  dbUser: process.env.DB_USER || "",
  dbPass: process.env.DB_PASS || "",
  scrapeTimeoutMs: getNumber(process.env.SCRAPE_TIMEOUT_MS, 10000),
  allowProviderScraping: process.env.ALLOW_PROVIDER_SCRAPING !== "false",
};

module.exports = { env };
