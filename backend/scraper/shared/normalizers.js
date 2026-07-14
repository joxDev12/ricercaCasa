function slugifyLocation(location) {
  return location
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseNumber(value) {
  if (value == null) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const normalized = String(value)
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCoordinate(value, maxAbsoluteValue) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) && Math.abs(parsed) <= maxAbsoluteValue
    ? parsed
    : null;
}

function extractExternalIdFromUrl(sourceUrl) {
  const match = String(sourceUrl).match(/annunci\/(\d+)/);
  return match ? match[1] : null;
}

function pickFirst(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return null;
}

function normalizeImage(url, position = 0) {
  if (!url) {
    return null;
  }

  return {
    imageUrl: url,
    altText: null,
    position,
    isPrimary: position === 0,
  };
}

function pickTextMatches(value, query) {
  const haystack = slugifyLocation(String(value || ""));
  const needle = slugifyLocation(String(query || ""));

  return Boolean(haystack && needle && haystack.includes(needle));
}

module.exports = {
  extractExternalIdFromUrl,
  normalizeImage,
  parseCoordinate,
  parseNumber,
  pickTextMatches,
  pickFirst,
  slugifyLocation,
};
