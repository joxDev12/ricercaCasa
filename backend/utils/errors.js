class AppError extends Error {
  constructor(message, statusCode = 500, code = "APP_ERROR", details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

class UnsupportedProviderError extends AppError {
  constructor(provider) {
    super(`Provider non supportato: ${provider}`, 422, "UNSUPPORTED_PROVIDER");
  }
}

class ProviderUnavailableError extends AppError {
  constructor(message = "Provider temporaneamente non disponibile") {
    super(message, 503, "PROVIDER_UNAVAILABLE");
  }
}

class ProviderBlockedError extends AppError {
  constructor(message = "Provider bloccato per ragioni di conformita") {
    super(message, 503, "PROVIDER_BLOCKED");
  }
}

class ListingNotFoundError extends AppError {
  constructor(message = "Annuncio non trovato") {
    super(message, 404, "LISTING_NOT_FOUND");
  }
}

class InvalidProviderResponseError extends AppError {
  constructor(message = "Risposta provider non valida") {
    super(message, 502, "INVALID_PROVIDER_RESPONSE");
  }
}

class ScrapingTimeoutError extends AppError {
  constructor(message = "Timeout provider") {
    super(message, 504, "SCRAPING_TIMEOUT");
  }
}

class NotFoundError extends AppError {
  constructor(message = "Risorsa non trovata") {
    super(message, 404, "NOT_FOUND");
  }
}

class SchemaNotReadyError extends AppError {
  constructor(message = "Schema database non pronto. Esegui le migrazioni.") {
    super(message, 503, "SCHEMA_NOT_READY");
  }
}

function isMissingRelationError(error) {
  return error && error.code === "42P01";
}

module.exports = {
  AppError,
  InvalidProviderResponseError,
  isMissingRelationError,
  ListingNotFoundError,
  NotFoundError,
  ProviderBlockedError,
  ProviderUnavailableError,
  SchemaNotReadyError,
  ScrapingTimeoutError,
  UnsupportedProviderError,
  ValidationError,
};
