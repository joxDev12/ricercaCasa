const { pool } = require("../config/db");
const featureConfigurationRepository = require("../models/featureConfigurationRepository");
const userPreferencesRepository = require("../models/userPreferencesRepository");
const { NotFoundError, ValidationError } = require("../utils/errors");

function normalizeContactEmail(contactEmail) {
  if (!contactEmail) {
    return null;
  }

  const trimmed = contactEmail.trim();
  const atIndex = trimmed.lastIndexOf("@");

  if (atIndex === -1) {
    return trimmed;
  }

  const localPart = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1).toLowerCase();
  return `${localPart}@${domain}`;
}

function normalizeProfileInput(input) {
  return {
    displayName: input.displayName ? input.displayName.trim() : null,
    contactEmail: normalizeContactEmail(input.contactEmail),
    locale: input.locale.trim(),
    timezone: input.timezone.trim(),
  };
}

function assertSafeConfigurationKeys(value, parentPath = "") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const currentPath = parentPath ? `${parentPath}.${key}` : key;
    const normalizedKey = key.toLowerCase();

    // ponytail: heuristic secret filter; replace with per-feature schemas when real features land.
    if (
      normalizedKey.includes("password") ||
      normalizedKey.includes("secret") ||
      normalizedKey.includes("token") ||
      normalizedKey === "apikey" ||
      normalizedKey === "api_key"
    ) {
      throw new ValidationError(
        `Configurazione non valida: chiave sensibile non ammessa (${currentPath})`
      );
    }

    assertSafeConfigurationKeys(nestedValue, currentPath);
  }
}

async function getProfile() {
  return userPreferencesRepository.getSingleton(pool);
}

async function updateProfile(input) {
  return userPreferencesRepository.updateSingleton(pool, normalizeProfileInput(input));
}

async function listFeatures() {
  return featureConfigurationRepository.listAll(pool);
}

async function getFeature(featureCode) {
  const feature = await featureConfigurationRepository.findLatestByCode(pool, featureCode);

  if (!feature) {
    throw new NotFoundError("Configurazione feature non trovata");
  }

  return feature;
}

async function putFeature(featureCode, input) {
  assertSafeConfigurationKeys(input.configuration);

  return featureConfigurationRepository.upsert(pool, {
    featureCode,
    schemaVersion: input.schemaVersion,
    status: input.status,
    configuration: input.configuration,
  });
}

module.exports = {
  assertSafeConfigurationKeys,
  getFeature,
  getProfile,
  listFeatures,
  normalizeProfileInput,
  putFeature,
  updateProfile,
};
