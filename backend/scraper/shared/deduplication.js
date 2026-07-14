const crypto = require("crypto");
const { slugifyLocation } = require("./normalizers");

function normalizeText(value) {
  if (!value) {
    return null;
  }

  const normalized = String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(via|viale|piazza|piazzale|corso|largo|vicolo|strada)\b/g, "$1")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || null;
}

const STREET_PATTERN = /\b(?:via|viale|piazza|piazzale|corso|largo|vicolo|strada|lungomare)\b/i;
const STOP_WORDS = new Set([
  "affitto",
  "vendita",
  "immobile",
  "appartamento",
  "casa",
  "monolocale",
  "bilocale",
  "trilocale",
  "quadrilocale",
  "della",
  "delle",
  "degli",
  "nella",
  "nelle",
  "sono",
  "questo",
  "questa",
]);

function inferMunicipality(listing) {
  if (listing.municipality) return normalizeText(listing.municipality);
  const parts = String(listing.locationLabel || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return normalizeText(parts.at(-1));
}

function inferStreet(listing) {
  const explicit = listing.street || listing.address;
  if (explicit) return normalizeText(explicit);

  const locationPart = String(listing.locationLabel || "").split(",")[0].trim();
  if (STREET_PATTERN.test(locationPart)) return normalizeText(locationPart);

  const titlePart = String(listing.title || "").split(",")[0];
  const match = titlePart.match(
    /\b(?:via|viale|piazza|piazzale|corso|largo|vicolo|strada|lungomare)\b.+$/i
  );
  return normalizeText(match?.[0]);
}

function tokenize(value) {
  return (normalizeText(value) || "")
    .split(" ")
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function tokenSimilarity(left, right) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  if (!leftSet.size || !rightSet.size) return 0;
  const matches = [...leftSet].filter((token) => rightSet.has(token)).length;
  return matches / Math.min(leftSet.size, rightSet.size);
}

function normalizeLocationKey(listing) {
  const parts = [
    listing.region,
    listing.province,
    inferMunicipality(listing),
    listing.district,
    inferStreet(listing),
  ]
    .map(normalizeText)
    .filter(Boolean)
    .map(slugifyLocation);

  return parts.length ? parts.join("|") : null;
}

function normalizeAddress(listing) {
  const parts = [
    inferStreet(listing),
    listing.civicNumber,
    inferMunicipality(listing),
    listing.province,
  ]
    .map(normalizeText)
    .filter(Boolean);

  return parts.length ? parts.join(" ") : null;
}

function numberBucket(value, size) {
  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.round(Number(value) / size) * size;
}

function buildDedupeData(listing) {
  const municipality = inferMunicipality(listing);
  const street = inferStreet(listing);

  return {
    version: 2,
    municipality,
    district: normalizeText(listing.district),
    street,
    civicNumber: normalizeText(listing.civicNumber),
    normalizedAddress: normalizeAddress(listing),
    normalizedLocationKey: normalizeLocationKey(listing),
    surfaceM2: Number.isFinite(Number(listing.surfaceM2))
      ? Number(listing.surfaceM2)
      : null,
    rooms: Number.isFinite(Number(listing.rooms)) ? Number(listing.rooms) : null,
    floor: normalizeText(listing.floor),
    propertyType: normalizeText(listing.propertyType),
    price: Number.isFinite(Number(listing.price)) ? Number(listing.price) : null,
    latitude: Number.isFinite(Number(listing.latitude))
      ? Number(listing.latitude)
      : null,
    longitude: Number.isFinite(Number(listing.longitude))
      ? Number(listing.longitude)
      : null,
    titleTokens: (normalizeText(listing.title) || "").split(" ").filter(Boolean),
    comparableTitleTokens: tokenize(listing.title),
    descriptionTokens: tokenize(listing.description || listing.shortDescription),
    advertiser: normalizeText(listing.advertiserName),
  };
}

function buildDedupeFingerprint(listing) {
  const data = buildDedupeData(listing);
  const payload = {
    transactionType: listing.transactionType,
    municipality: data.municipality,
    street: data.street,
    civicNumber: data.civicNumber,
    surfaceBucket: numberBucket(data.surfaceM2, 5),
    rooms: data.rooms,
  };

  if (!payload.municipality || (!payload.street && !payload.rooms && !payload.surfaceBucket)) {
    return null;
  }

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

function compareListings(first, second) {
  if (
    first.transactionType &&
    second.transactionType &&
    first.transactionType !== second.transactionType
  ) {
    return { score: 0, strongSignal: false, reasons: [] };
  }

  const left = first.dedupeData || buildDedupeData(first);
  const right = second.dedupeData || buildDedupeData(second);
  let score = 0;
  let strongSignal = false;
  const reasons = [];
  const sameMunicipality =
    left.municipality && right.municipality && left.municipality === right.municipality;
  const sameStreet = left.street && right.street && left.street === right.street;
  const sameCivicNumber =
    left.civicNumber && right.civicNumber && left.civicNumber === right.civicNumber;
  const titleSimilarity = tokenSimilarity(
    left.comparableTitleTokens || left.titleTokens,
    right.comparableTitleTokens || right.titleTokens
  );
  const descriptionSimilarity = tokenSimilarity(
    left.descriptionTokens || [],
    right.descriptionTokens || []
  );
  let coreMatches = 0;

  if (sameStreet && sameMunicipality) {
    const weight = sameCivicNumber ? 0.65 : 0.45;
    score += weight;
    reasons.push({ signal: "same_normalized_address", weight });
  }

  if (
    left.normalizedLocationKey &&
    right.normalizedLocationKey &&
    left.normalizedLocationKey === right.normalizedLocationKey
  ) {
    score += 0.2;
    reasons.push({ signal: "same_location_key", weight: 0.2 });
  }

  if (
    Number.isFinite(left.surfaceM2) &&
    Number.isFinite(right.surfaceM2) &&
    Math.abs(left.surfaceM2 - right.surfaceM2) <= Math.max(5, left.surfaceM2 * 0.05)
  ) {
    score += 0.1;
    coreMatches += 1;
    reasons.push({ signal: "surface_within_tolerance", weight: 0.1 });
  }

  if (left.rooms && right.rooms && left.rooms === right.rooms) {
    score += 0.05;
    coreMatches += 1;
    reasons.push({ signal: "same_rooms", weight: 0.05 });
  }

  if (
    left.propertyType &&
    right.propertyType &&
    left.propertyType === right.propertyType
  ) {
    score += 0.05;
    coreMatches += 1;
    reasons.push({ signal: "same_property_type", weight: 0.05 });
  }

  if (
    Number.isFinite(left.price) &&
    Number.isFinite(right.price) &&
    Math.abs(left.price - right.price) <= Math.max(100, left.price * 0.12)
  ) {
    score += 0.1;
    coreMatches += 1;
    reasons.push({ signal: "similar_price", weight: 0.1 });
  }

  if (titleSimilarity >= 0.6) {
    score += 0.15;
    reasons.push({ signal: "similar_title", weight: 0.15 });
  }

  if (descriptionSimilarity >= 0.2) {
    score += 0.15;
    reasons.push({ signal: "similar_description", weight: 0.15 });
  }

  const sameAdvertiser =
    left.advertiser && right.advertiser && left.advertiser === right.advertiser;
  if (sameAdvertiser) {
    score += 0.05;
    reasons.push({ signal: "same_advertiser", weight: 0.05 });
  }

  strongSignal = Boolean(
    sameStreet &&
      sameMunicipality &&
      coreMatches >= 2 &&
      (sameCivicNumber || descriptionSimilarity >= 0.2 || sameAdvertiser)
  ) || Boolean(titleSimilarity >= 0.75 && descriptionSimilarity >= 0.5 && coreMatches >= 3);

  return {
    score: Math.min(1, Number(score.toFixed(4))),
    strongSignal,
    reasons,
  };
}

function aggregateSearchResults(items) {
  const groups = [];

  for (const item of items) {
    const current = {
      ...item,
      dedupeData: item.dedupeData || buildDedupeData(item),
      dedupeFingerprint: item.dedupeFingerprint || buildDedupeFingerprint(item),
    };

    const match = groups.find((group) => {
      const compared = compareListings(group.representative, current);
      return compared.strongSignal && compared.score >= 0.85;
    });

    if (!match) {
      groups.push({
        id: `${current.provider}:${current.externalId}`,
        representative: current,
        variants: [current],
        possibleDuplicate: false,
      });
      continue;
    }

    match.variants.push(current);
  }

  return groups.map((group) => ({
    ...group.representative,
    variants: group.variants.map(({ dedupeData: _d1, dedupeFingerprint: _d2, ...variant }) => variant),
    sourceCount: group.variants.length,
    providers: group.variants.map((variant) => variant.provider),
    possibleDuplicate: group.possibleDuplicate,
  }));
}

module.exports = {
  aggregateSearchResults,
  buildDedupeData,
  buildDedupeFingerprint,
  compareListings,
  normalizeAddress,
  normalizeLocationKey,
  normalizeText,
};
