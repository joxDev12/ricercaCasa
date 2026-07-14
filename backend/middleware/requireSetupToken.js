const { env } = require("../config/env");
const { AppError } = require("../utils/errors");

async function requireSetupToken(req, _res, next) {
  try {
    if (!env.setupToken) {
      return next(
        new AppError("Token setup non configurato", 503, "SETUP_TOKEN_NOT_CONFIGURED")
      );
    }

    const token = req.get("x-setup-token");

    if (token !== env.setupToken) {
      return next(new AppError("Token setup non valido", 403, "INVALID_SETUP_TOKEN"));
    }

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { requireSetupToken };
