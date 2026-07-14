const { validationResult } = require("express-validator");
const { ValidationError } = require("../utils/errors");

function validate(req, _res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  return next(new ValidationError("Dati richiesta non validi", result.array()));
}

module.exports = { validate };
