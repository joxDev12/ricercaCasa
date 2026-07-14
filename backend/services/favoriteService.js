const { pool } = require("../config/db");
const listingImageRepository = require("../models/listingImageRepository");
const propertyGroupRepository = require("../models/propertyGroupRepository");
const savedListingRepository = require("../models/savedListingRepository");
const sourceRepository = require("../models/sourceRepository");
const { getScraper } = require("../scraper");
const { isProviderCode } = require("../scraper/shared/contracts");
const { parseCoordinate } = require("../scraper/shared/normalizers");
const {
  SchemaNotReadyError,
  UnsupportedProviderError,
  ValidationError,
} = require("../utils/errors");
const deduplicationService = require("./deduplicationService");
const listingEnrichmentService = require("./listingEnrichmentService");
const listingManagementService = require("./listingManagementService");

function normalizeListFilters(filters) {
  return {
    page: filters.page || 1,
    limit: filters.limit || 12,
    transactionType: filters.transactionType || null,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : null,
    location: filters.location || null,
    provider: filters.provider || null,
    managementStatus: filters.managementStatus || null,
    hasFutureAppointment:
      filters.hasFutureAppointment === true ||
      filters.hasFutureAppointment === "true",
    sort: filters.sort || "saved_at_desc",
  };
}

function normalizeFavoriteVariant(input) {
  return {
    provider: input.provider,
    externalId: String(input.externalId),
    sourceUrl: input.sourceUrl,
    transactionType: input.transactionType,
    propertyType: input.propertyType || null,
    title: input.title,
    description: input.shortDescription || input.description || null,
    price: input.price ?? null,
    pricePeriod: input.pricePeriod || null,
    currency: input.currency || "EUR",
    surfaceM2: input.surfaceM2 ?? null,
    rooms: input.rooms ?? null,
    bedrooms: input.bedrooms ?? null,
    bathrooms: input.bathrooms ?? null,
    floor: input.floor || null,
    totalFloors: input.totalFloors ?? null,
    elevator: input.elevator ?? null,
    furnished: input.furnished ?? null,
    propertyCondition: input.propertyCondition || null,
    heating: input.heating || null,
    energyClass: input.energyClass || null,
    condominiumFees: input.condominiumFees ?? null,
    availability: input.availability || null,
    locationLabel: input.locationLabel || null,
    address: input.address || null,
    street: input.street || null,
    civicNumber: input.civicNumber || null,
    district: input.district || null,
    municipality: input.municipality || null,
    province: input.province || null,
    region: input.region || null,
    postalCode: input.postalCode || null,
    latitude: parseCoordinate(input.latitude, 90),
    longitude: parseCoordinate(input.longitude, 180),
    locationPrecision: input.locationPrecision || null,
    mainImageUrl: input.mainImageUrl || null,
    advertiserName: input.advertiserName || null,
    advertiserType: input.advertiserType || null,
    images: Array.isArray(input.images) && input.images.length
      ? input.images
      : input.mainImageUrl
        ? [
            {
              imageUrl: input.mainImageUrl,
              altText: input.title,
              position: 0,
              isPrimary: true,
            },
          ]
        : [],
    features: input.features || {},
    rawData: input.rawData || {},
    sourcePublishedAt: input.sourcePublishedAt || null,
    sourceUpdatedAt: input.sourceUpdatedAt || null,
  };
}

function normalizeFavoriteInput(input) {
  return normalizeFavoriteVariant(input);
}

function resolveFavoriteVariants(input) {
  if (Array.isArray(input.variants) && input.variants.length) {
    return input.variants.map((variant) =>
      normalizeFavoriteVariant({
        ...input,
        ...variant,
        provider: variant.provider,
      })
    );
  }

  return [normalizeFavoriteVariant(input)];
}

async function resolveProviderSource(queryable, provider) {
  const source = await sourceRepository.findByCode(queryable, provider);

  if (!source || !source.active) {
    throw new UnsupportedProviderError(provider);
  }

  return source;
}

async function validateVariant(variant) {
  if (!isProviderCode(variant.provider)) {
    throw new UnsupportedProviderError(variant.provider);
  }

  const scraper = getScraper(variant.provider);

  if (!scraper.validateSourceUrl(variant.sourceUrl)) {
    throw new ValidationError(`URL non valido per provider ${variant.provider}`);
  }

  const extractedId = scraper.extractExternalId(variant.sourceUrl);

  if (!extractedId || extractedId !== String(variant.externalId)) {
    throw new ValidationError(`ID esterno non coerente per provider ${variant.provider}`);
  }
}

async function saveFavorite(input) {
  let variants = resolveFavoriteVariants(input);
  let primaryListingId = null;
  let status = "created";
  const client = await pool.connect();

  try {
    for (const variant of variants) {
      await validateVariant(variant);
    }

    variants = await Promise.all(
      variants.map((variant) => listingEnrichmentService.enrichListing(variant))
    );

    await client.query("BEGIN");

    const resolved = [];
    let propertyGroupId = null;

    for (const variant of variants) {
      const source = await resolveProviderSource(client, variant.provider);
      const existing = await savedListingRepository.findBySourceAndExternalId(
        client,
        source.id,
        variant.externalId
      );

      if (existing) {
        propertyGroupId = propertyGroupId || existing.propertyGroupId;
        status = "updated";
        resolved.push({
          source,
          existing,
          listing: deduplicationService.enrichListing(variant),
        });
        continue;
      }

      const dedupe = await deduplicationService.findGroupMatch(
        client,
        source.id,
        variant
      );

      if (dedupe.autoMatch) {
        propertyGroupId = propertyGroupId || dedupe.autoMatch.propertyGroupId;
      }

      resolved.push({
        source,
        existing: null,
        listing: dedupe.listing,
      });
    }

    if (!propertyGroupId) {
      const group = await propertyGroupRepository.create(client, {
        transactionType: resolved[0].listing.transactionType,
        managementStatus: "saved",
      });
      propertyGroupId = group.id;
    }

    for (const item of resolved) {
      const saved = await savedListingRepository.upsertListing(
        client,
        item.source.id,
        propertyGroupId,
        item.listing
      );

      await listingImageRepository.replaceForListing(
        client,
        saved.id,
        item.listing.images
      );
      await deduplicationService.syncDuplicateCandidates(
        client,
        saved,
        item.listing
      );

      primaryListingId = primaryListingId || saved.id;
    }

    await client.query("COMMIT");

    return {
      status,
      favorite: await listingManagementService.getFavoriteById(primaryListingId),
    };
  } catch (error) {
    await client.query("ROLLBACK");

    if (error?.code === "42P01") {
      throw new SchemaNotReadyError();
    }

    throw error;
  } finally {
    client.release();
  }
}

async function listFavorites(filters) {
  const normalized = normalizeListFilters(filters);
  const [data, total] = await Promise.all([
    savedListingRepository.listFavorites(pool, normalized),
    savedListingRepository.countFavorites(pool, normalized),
  ]);

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
  return listingManagementService.getFavoriteById(id);
}

async function listSavedSourceKeys() {
  return savedListingRepository.listSavedSourceKeys(pool);
}

async function deleteFavorite(id) {
  const listing = await savedListingRepository.getFavoriteById(pool, id);

  if (!listing) {
    throw new ValidationError("Preferito non trovato");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const deleted = await savedListingRepository.deleteFavorite(client, id);
    await propertyGroupRepository.deleteEmpty(client, listing.propertyGroupId);
    await client.query("COMMIT");
    return deleted;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function deleteProperty(id) {
  const listing = await savedListingRepository.getFavoriteById(pool, id);

  if (!listing) {
    throw new ValidationError("Immobile non trovato");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await savedListingRepository.deleteByPropertyGroupId(client, listing.propertyGroupId);
    await propertyGroupRepository.deleteEmpty(client, listing.propertyGroupId);
    await client.query("COMMIT");
    return { propertyGroupId: listing.propertyGroupId };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  deleteFavorite,
  deleteProperty,
  getFavoriteById,
  listFavorites,
  listSavedSourceKeys,
  normalizeFavoriteInput,
  saveFavorite,
};
