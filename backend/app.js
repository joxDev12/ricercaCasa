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

const app = express();

app.use(
  cors({
    origin: env.frontendOrigin,
  })
);
app.use(helmet());
app.use(express.json());
app.use("/api", apiRateLimiter);

app.get("/health", async (_req, res, next) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.use("/api/search", searchRoutes);
app.use("/api/providers", providersRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/duplicate-candidates", duplicateCandidatesRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = { app };
