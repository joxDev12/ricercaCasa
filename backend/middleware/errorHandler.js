const { AppError } = require("../utils/errors");

function errorHandler(error, _req, res, _next) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      details: error.details,
    });
  }

  console.error(error);

  return res.status(500).json({
    error: "Errore interno server",
    code: "INTERNAL_SERVER_ERROR",
  });
}

module.exports = { errorHandler };
