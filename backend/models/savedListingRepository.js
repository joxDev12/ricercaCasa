function mapListingValues(sourceId, listing) {
  return [
    sourceId,
    listing.externalId,
    listing.sourceUrl,
    listing.transactionType,
    listing.propertyType,
    listing.title,
    listing.description,
    listing.price,
    listing.pricePeriod,
    listing.currency || "EUR",
    listing.surfaceM2,
    listing.rooms,
    listing.bedrooms,
    listing.bathrooms,
    listing.floor,
    listing.totalFloors,
    listing.elevator,
    listing.furnished,
    listing.propertyCondition,
    listing.heating,
    listing.energyClass,
    listing.condominiumFees,
    listing.availability,
    listing.advertiserName,
    listing.advertiserType,
    listing.locationLabel,
    listing.address,
    listing.street,
    listing.civicNumber,
    listing.district,
    listing.municipality,
    listing.province,
    listing.region,
    listing.postalCode,
    listing.latitude,
    listing.longitude,
    listing.locationPrecision,
    listing.mainImageUrl,
    JSON.stringify(listing.features || {}),
    JSON.stringify(listing.rawData || {}),
    listing.sourcePublishedAt,
    listing.sourceUpdatedAt,
  ];
}

async function findBySourceAndExternalId(queryable, sourceId, externalId) {
  const result = await queryable.query(
    `SELECT id, external_id
     FROM saved_listings
     WHERE source_id = $1 AND external_id = $2
     LIMIT 1`,
    [sourceId, externalId]
  );

  return result.rows[0] || null;
}

async function upsertListing(queryable, sourceId, listing) {
  const values = mapListingValues(sourceId, listing);

  const result = await queryable.query(
    `INSERT INTO saved_listings (
      source_id,
      external_id,
      source_url,
      transaction_type,
      property_type,
      title,
      description,
      price,
      price_period,
      currency,
      surface_m2,
      rooms,
      bedrooms,
      bathrooms,
      floor,
      total_floors,
      elevator,
      furnished,
      property_condition,
      heating,
      energy_class,
      condominium_fees,
      availability,
      advertiser_name,
      advertiser_type,
      location_label,
      address,
      street,
      civic_number,
      district,
      municipality,
      province,
      region,
      postal_code,
      latitude,
      longitude,
      location_precision,
      main_image_url,
      features,
      raw_data,
      source_published_at,
      source_updated_at,
      first_scraped_at,
      last_scraped_at,
      saved_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
      $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
      $31, $32, $33, $34, $35, $36, $37, $38, $39::jsonb, $40::jsonb,
      $41, $42, now(), now(), now()
    )
    ON CONFLICT (source_id, external_id)
    DO UPDATE SET
      source_url = EXCLUDED.source_url,
      transaction_type = EXCLUDED.transaction_type,
      property_type = COALESCE(EXCLUDED.property_type, saved_listings.property_type),
      title = EXCLUDED.title,
      description = COALESCE(EXCLUDED.description, saved_listings.description),
      price = COALESCE(EXCLUDED.price, saved_listings.price),
      price_period = COALESCE(EXCLUDED.price_period, saved_listings.price_period),
      currency = EXCLUDED.currency,
      surface_m2 = COALESCE(EXCLUDED.surface_m2, saved_listings.surface_m2),
      rooms = COALESCE(EXCLUDED.rooms, saved_listings.rooms),
      bedrooms = COALESCE(EXCLUDED.bedrooms, saved_listings.bedrooms),
      bathrooms = COALESCE(EXCLUDED.bathrooms, saved_listings.bathrooms),
      floor = COALESCE(EXCLUDED.floor, saved_listings.floor),
      total_floors = COALESCE(EXCLUDED.total_floors, saved_listings.total_floors),
      elevator = COALESCE(EXCLUDED.elevator, saved_listings.elevator),
      furnished = COALESCE(EXCLUDED.furnished, saved_listings.furnished),
      property_condition = COALESCE(EXCLUDED.property_condition, saved_listings.property_condition),
      heating = COALESCE(EXCLUDED.heating, saved_listings.heating),
      energy_class = COALESCE(EXCLUDED.energy_class, saved_listings.energy_class),
      condominium_fees = COALESCE(EXCLUDED.condominium_fees, saved_listings.condominium_fees),
      availability = COALESCE(EXCLUDED.availability, saved_listings.availability),
      advertiser_name = COALESCE(EXCLUDED.advertiser_name, saved_listings.advertiser_name),
      advertiser_type = COALESCE(EXCLUDED.advertiser_type, saved_listings.advertiser_type),
      location_label = COALESCE(EXCLUDED.location_label, saved_listings.location_label),
      address = COALESCE(EXCLUDED.address, saved_listings.address),
      street = COALESCE(EXCLUDED.street, saved_listings.street),
      civic_number = COALESCE(EXCLUDED.civic_number, saved_listings.civic_number),
      district = COALESCE(EXCLUDED.district, saved_listings.district),
      municipality = COALESCE(EXCLUDED.municipality, saved_listings.municipality),
      province = COALESCE(EXCLUDED.province, saved_listings.province),
      region = COALESCE(EXCLUDED.region, saved_listings.region),
      postal_code = COALESCE(EXCLUDED.postal_code, saved_listings.postal_code),
      latitude = COALESCE(EXCLUDED.latitude, saved_listings.latitude),
      longitude = COALESCE(EXCLUDED.longitude, saved_listings.longitude),
      location_precision = COALESCE(EXCLUDED.location_precision, saved_listings.location_precision),
      main_image_url = COALESCE(EXCLUDED.main_image_url, saved_listings.main_image_url),
      features = EXCLUDED.features,
      raw_data = EXCLUDED.raw_data,
      source_published_at = COALESCE(EXCLUDED.source_published_at, saved_listings.source_published_at),
      source_updated_at = COALESCE(EXCLUDED.source_updated_at, saved_listings.source_updated_at),
      last_scraped_at = now(),
      updated_at = now()
    RETURNING id, source_id, external_id, saved_at, created_at, updated_at`,
    values
  );

  return result.rows[0];
}

async function listFavorites(queryable, filters) {
  const where = [];
  const values = [];

  if (filters.transactionType) {
    values.push(filters.transactionType);
    where.push(`sl.transaction_type = $${values.length}`);
  }

  if (filters.maxPrice) {
    values.push(filters.maxPrice);
    where.push(`sl.price IS NOT NULL AND sl.price <= $${values.length}`);
  }

  if (filters.location) {
    values.push(`%${filters.location}%`);
    where.push(
      `(sl.location_label ILIKE $${values.length} OR sl.municipality ILIKE $${values.length} OR sl.province ILIKE $${values.length})`
    );
  }

  const limit = filters.limit || 12;
  const page = filters.page || 1;
  const offset = (page - 1) * limit;

  values.push(limit);
  const limitIndex = values.length;
  values.push(offset);
  const offsetIndex = values.length;

  const orderByMap = {
    saved_at_desc: "sl.saved_at DESC",
    price_asc: "sl.price ASC NULLS LAST",
    price_desc: "sl.price DESC NULLS LAST",
  };

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const orderBy = orderByMap[filters.sort] || orderByMap.saved_at_desc;

  const result = await queryable.query(
    `SELECT
      sl.id,
      s.code AS provider,
      sl.external_id AS "externalId",
      sl.source_url AS "sourceUrl",
      sl.title,
      sl.transaction_type AS "transactionType",
      sl.property_type AS "propertyType",
      sl.price,
      sl.price_period AS "pricePeriod",
      sl.currency,
      sl.surface_m2 AS "surfaceM2",
      sl.rooms,
      sl.floor,
      sl.location_label AS "locationLabel",
      sl.main_image_url AS "mainImageUrl",
      sl.advertiser_name AS "advertiserName",
      sl.advertiser_type AS "advertiserType",
      sl.saved_at AS "savedAt"
     FROM saved_listings sl
     JOIN sources s ON s.id = sl.source_id
     ${whereSql}
     ORDER BY ${orderBy}
     LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
    values
  );

  return result.rows;
}

async function countFavorites(queryable, filters) {
  const where = [];
  const values = [];

  if (filters.transactionType) {
    values.push(filters.transactionType);
    where.push(`transaction_type = $${values.length}`);
  }

  if (filters.maxPrice) {
    values.push(filters.maxPrice);
    where.push(`price IS NOT NULL AND price <= $${values.length}`);
  }

  if (filters.location) {
    values.push(`%${filters.location}%`);
    where.push(
      `(location_label ILIKE $${values.length} OR municipality ILIKE $${values.length} OR province ILIKE $${values.length})`
    );
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const result = await queryable.query(
    `SELECT COUNT(*)::int AS total
     FROM saved_listings
     ${whereSql}`,
    values
  );

  return result.rows[0]?.total || 0;
}

async function getFavoriteById(queryable, id) {
  const result = await queryable.query(
    `SELECT
      sl.id,
      s.code AS provider
      ,sl.external_id AS "externalId"
      ,sl.source_url AS "sourceUrl"
      ,sl.transaction_type AS "transactionType"
      ,sl.property_type AS "propertyType"
      ,sl.title
      ,sl.description
      ,sl.price
      ,sl.price_period AS "pricePeriod"
      ,sl.currency
      ,sl.surface_m2 AS "surfaceM2"
      ,sl.rooms
      ,sl.bedrooms
      ,sl.bathrooms
      ,sl.floor
      ,sl.total_floors AS "totalFloors"
      ,sl.elevator
      ,sl.furnished
      ,sl.property_condition AS "propertyCondition"
      ,sl.heating
      ,sl.energy_class AS "energyClass"
      ,sl.condominium_fees AS "condominiumFees"
      ,sl.availability
      ,sl.advertiser_name AS "advertiserName"
      ,sl.advertiser_type AS "advertiserType"
      ,sl.location_label AS "locationLabel"
      ,sl.address
      ,sl.street
      ,sl.civic_number AS "civicNumber"
      ,sl.district
      ,sl.municipality
      ,sl.province
      ,sl.region
      ,sl.postal_code AS "postalCode"
      ,sl.latitude
      ,sl.longitude
      ,sl.location_precision AS "locationPrecision"
      ,sl.main_image_url AS "mainImageUrl"
      ,sl.features
      ,sl.raw_data AS "rawData"
      ,sl.source_published_at AS "sourcePublishedAt"
      ,sl.source_updated_at AS "sourceUpdatedAt"
      ,sl.first_scraped_at AS "firstScrapedAt"
      ,sl.last_scraped_at AS "lastScrapedAt"
      ,sl.saved_at AS "savedAt"
      ,sl.created_at
      ,sl.updated_at
     FROM saved_listings sl
     JOIN sources s ON s.id = sl.source_id
     WHERE sl.id = $1
     LIMIT 1`,
    [id]
  );

  return result.rows[0] || null;
}

async function deleteFavorite(queryable, id) {
  const result = await queryable.query(
    `DELETE FROM saved_listings
     WHERE id = $1
     RETURNING id`,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  countFavorites,
  deleteFavorite,
  findBySourceAndExternalId,
  getFavoriteById,
  listFavorites,
  upsertListing,
};
