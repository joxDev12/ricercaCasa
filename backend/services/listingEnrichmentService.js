const { getScraper } = require("../scraper");

function hasValue(value) {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function hasProviderDetails(listing) {
  if (listing.rawData?.source) return true;
  return [listing.description, listing.bathrooms, listing.energyClass, listing.heating]
    .filter(hasValue).length >= 3;
}

function mergeDetails(listing, details) {
  const merged = { ...listing };

  for (const [key, value] of Object.entries(details || {})) {
    if (hasValue(value)) merged[key] = value;
  }

  if (hasValue(details?.description)) {
    merged.shortDescription = details.description;
  }

  return merged;
}

async function enrichListing(listing) {
  const scraper = getScraper(listing.provider);

  if (!scraper.getDetails || hasProviderDetails(listing)) return listing;

  try {
    return mergeDetails(listing, await scraper.getDetails(listing.sourceUrl));
  } catch (_error) {
    return listing;
  }
}

module.exports = { enrichListing, hasProviderDetails, mergeDetails };
