const rateLimit = require("express-rate-limit");

const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Troppe richieste, riprova tra poco",
    code: "RATE_LIMITED",
  },
});

module.exports = { apiRateLimiter };
