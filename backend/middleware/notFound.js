const { NotFoundError } = require("../utils/errors");

function notFound(req, _res, next) {
  next(new NotFoundError(`Rotta non trovata: ${req.method} ${req.originalUrl}`));
}

module.exports = { notFound };
