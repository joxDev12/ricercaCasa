const { pool } = require("../config/db");
const listingImageRepository = require("../models/listingImageRepository");
const savedListingRepository = require("../models/savedListingRepository");
const sourceRepository = require("../models/sourceRepository");
const {
  isMissingRelationError,
  NotFoundError,
  SchemaNotReadyError,
  UnsupportedProviderError,
} = require("../utils/errors");

function normalizeListFilters(filters) {
  return {
    page: filters.page || 1,
    limit: filters.limit || 12,
    transactionType: filters.transactionType || null,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : null,
    location: filters.location || null,
    sort: filters.sort || "saved_at_desc",
  };
}

function normalizeFavoriteInput(input) {
  return {
    externalId: input.externalId,
    sourceUrl: input.sourceUrl,
    transactionType: input.transactionType,
    propertyType: input.propertyType || null,
    title: input.title,
    description: input.shortDescription || null,
    price: input.price ?? null,
    pricePeriod: input.pricePeriod || null,
    currency: input.currency || "EUR",
    surfaceM2: input.surfaceM2 ?? null,
    rooms: input.rooms ?? null,
    floor: input.floor || null,
    locationLabel: input.locationLabel || null,
    mainImageUrl: input.mainImageUrl || null,
    advertiserName: input.advertiserName || null,
    advertiserType: input.advertiserType || null,
    images: input.mainImageUrl
      ? [
          {
            imageUrl: input.mainImageUrl,
            altText: input.title,
            position: 0,
            isPrimary: true,
          },
        ]
      : [],
    features: {},
    rawData: {},
  };
}

async function saveFavorite(input) {
  let source;

  try {
    source = await sourceRepository.findByCode(pool, input.provider);
  } catch (error) {
    if (isMissingRelationError(error)) {
      throw new SchemaNotReadyError();
    }
    throw error;
  }

  if (!source || !source.active) {
    throw new UnsupportedProviderError(input.provider);
  }

  let existing;

  try {
    existing = await savedListingRepository.findBySourceAndExternalId(
      pool,
      source.id,
      input.externalId
    );
  } catch (error) {
    if (isMissingRelationError(error)) {
      throw new SchemaNotReadyError();
    }
    throw error;
  }

  const details = normalizeFavoriteInput(input);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const listing = await savedListingRepository.upsertListing(
      client,
      source.id,
      details
    );

    await listingImageRepository.replaceForListing(
      client,
      listing.id,
      details.images
    );

    await client.query("COMMIT");

    const favorite = await savedListingRepository.getFavoriteById(pool, listing.id);

    return {
      status: existing ? "updated" : "created",
      favorite,
    };
  } catch (error) {
    await client.query("ROLLBACK");

    if (isMissingRelationError(error)) {
      throw new SchemaNotReadyError();
    }

    throw error;
  } finally {
    client.release();
  }
}

async function listFavorites(filters) {
  const normalized = normalizeListFilters(filters);
  let data = [];
  let total = 0;

  try {
    [data, total] = await Promise.all([
      savedListingRepository.listFavorites(pool, normalized),
      savedListingRepository.countFavorites(pool, normalized),
    ]);
  } catch (error) {
    if (!isMissingRelationError(error)) {
      throw error;
    }
  }

  return {
    data,
    meta: {
      page: normalized.page,
      limit: normalized.limit,
      total,
      hasNextPage: normalized.page * normalized.limit < total,
    },
  };
}

async function getFavoriteById(id) {
  let favorite;

  try {
    favorite = await savedListingRepository.getFavoriteById(pool, id);
  } catch (error) {
    if (isMissingRelationError(error)) {
      throw new SchemaNotReadyError();
    }
    throw error;
  }

  if (!favorite) {
    throw new NotFoundError("Preferito non trovato");
  }

  let images;

  try {
    images = await listingImageRepository.findByListingId(pool, id);
  } catch (error) {
    if (isMissingRelationError(error)) {
      throw new SchemaNotReadyError();
    }
    throw error;
  }

  return { ...favorite, images };
}

async function deleteFavorite(id) {
  let deleted;

  try {
    deleted = await savedListingRepository.deleteFavorite(pool, id);
  } catch (error) {
    if (isMissingRelationError(error)) {
      throw new SchemaNotReadyError();
    }
    throw error;
  }

  if (!deleted) {
    throw new NotFoundError("Preferito non trovato");
  }

  return deleted;
}

module.exports = {
  deleteFavorite,
  getFavoriteById,
  listFavorites,
  normalizeFavoriteInput,
  saveFavorite,
};
