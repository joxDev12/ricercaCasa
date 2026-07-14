const path = require("node:path");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const { pool } = require("./config/db");
const { env } = require("./config/env");
const { errorHandler } = require("./middleware/errorHandler");
const { notFound } = require("./middleware/notFound");
const { apiRateLimiter } = require("./middleware/rateLimiter");
const favoritesRoutes = require("./routes/favoritesRoutes");
const duplicateCandidatesRoutes = require("./routes/duplicateCandidatesRoutes");
const providersRoutes = require("./routes/providersRoutes");
const searchRoutes = require("./routes/searchRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const setupRoutes = require("./routes/setupRoutes");
const systemRoutes = require("./routes/systemRoutes");
const { getReadinessStatus } = require("./utils/readiness");

const app = express();
const migrationsDir = path.join(__dirname, "migrations");

app.use(
  cors({
    origin: env.frontendOrigin,
  })
);
app.use(helmet());
app.use(express.json());
app.use("/api", apiRateLimiter);

app.get("/health/live", (_req, res) => {
  res.json({ ok: true });
});

app.get("/health/ready", async (_req, res, next) => {
  try {
    const status = await getReadinessStatus({ pool, migrationsDir });
    res.status(status.ok ? 200 : 503).json(status);
  } catch (error) {
    next(error);
  }
});

app.get("/health", async (_req, res, next) => {
  try {
    const status = await getReadinessStatus({ pool, migrationsDir });
    res.status(status.ok ? 200 : 503).json(status);
  } catch (error) {
    next(error);
  }
});

app.use("/api/search", searchRoutes);
app.use("/api/providers", providersRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/duplicate-candidates", duplicateCandidatesRoutes);
app.use("/api/setup", setupRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/system", systemRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = { app };
