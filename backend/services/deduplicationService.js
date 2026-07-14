const duplicateCandidateRepository = require("../models/duplicateCandidateRepository");
const savedListingRepository = require("../models/savedListingRepository");
const {
  buildDedupeData,
  buildDedupeFingerprint,
  compareListings,
  normalizeAddress,
  normalizeLocationKey,
} = require("../scraper/shared/deduplication");

function enrichListing(listing) {
  const dedupeData = buildDedupeData(listing);

  return {
    ...listing,
    normalizedAddress: normalizeAddress(listing),
    normalizedLocationKey: normalizeLocationKey(listing),
    dedupeFingerprint: buildDedupeFingerprint(listing),
    dedupeData,
  };
}

async function findGroupMatch(queryable, sourceId, listing) {
  const candidateListing = enrichListing(listing);
  const candidates = await savedListingRepository.findDedupeCandidates(queryable, {
    sourceId,
    transactionType: candidateListing.transactionType,
    dedupeFingerprint: candidateListing.dedupeFingerprint,
    normalizedLocationKey: candidateListing.normalizedLocationKey,
    municipality: candidateListing.municipality || candidateListing.locationLabel || null,
  });
  let autoMatch = null;
  const pending = [];

  for (const candidate of candidates) {
    const compared = compareListings(candidateListing, candidate);

    if (compared.strongSignal && compared.score >= 0.85) {
      autoMatch = {
        propertyGroupId: candidate.propertyGroupId,
        listingId: candidate.id,
        score: compared.score,
        reasons: compared.reasons,
      };
      break;
    }

    if (compared.score >= 0.65) {
      pending.push({
        listingId: candidate.id,
        propertyGroupId: candidate.propertyGroupId,
        score: compared.score,
        reasons: compared.reasons,
      });
    }
  }

  return {
    listing: candidateListing,
    autoMatch,
    pending,
  };
}

async function syncDuplicateCandidates(queryable, savedListing, enrichedListing) {
  const candidates = await savedListingRepository.findDedupeCandidates(queryable, {
    sourceId: savedListing.sourceId,
    transactionType: enrichedListing.transactionType,
    dedupeFingerprint: enrichedListing.dedupeFingerprint,
    normalizedLocationKey: enrichedListing.normalizedLocationKey,
    municipality: enrichedListing.municipality || enrichedListing.locationLabel || null,
  });

  for (const candidate of candidates) {
    if (candidate.id === savedListing.id) {
      continue;
    }

    const compared = compareListings(enrichedListing, candidate);

    if (compared.score < 0.65) {
      continue;
    }

    await duplicateCandidateRepository.upsert(queryable, {
      listingAId: savedListing.id,
      listingBId: candidate.id,
      score: compared.score,
      status:
        compared.strongSignal && compared.score >= 0.85
          ? "auto_confirmed"
          : "pending",
      reasons: compared.reasons,
      algorithmVersion: 1,
    });
  }
}

module.exports = {
  enrichListing,
  findGroupMatch,
  syncDuplicateCandidates,
};
