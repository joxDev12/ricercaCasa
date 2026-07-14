function mapListingValues(sourceId, propertyGroupId, listing) {
  return [
    propertyGroupId,
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
    listing.normalizedAddress || null,
    listing.normalizedLocationKey || null,
    listing.dedupeFingerprint || null,
    JSON.stringify(listing.dedupeData || {}),
    JSON.stringify(listing.features || {}),
    JSON.stringify(listing.rawData || {}),
    listing.sourcePublishedAt,
    listing.sourceUpdatedAt,
  ];
}

async function findBySourceAndExternalId(queryable, sourceId, externalId) {
  const result = await queryable.query(
    `SELECT
      id,
      source_id AS "sourceId",
      property_group_id AS "propertyGroupId",
      external_id AS "externalId"
     FROM saved_listings
     WHERE source_id = $1 AND external_id = $2
     LIMIT 1`,
    [sourceId, externalId]
  );

  return result.rows[0] || null;
}

async function upsertListing(queryable, sourceId, propertyGroupId, listing) {
  const values = mapListingValues(sourceId, propertyGroupId, listing);

  const result = await queryable.query(
    `INSERT INTO saved_listings (
      property_group_id,
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
      normalized_address,
      normalized_location_key,
      dedupe_fingerprint,
      dedupe_data,
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
      $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
      $41, $42, $43::jsonb, $44::jsonb, $45::jsonb, $46, $47,
      now(), now(), now()
    )
    ON CONFLICT (source_id, external_id)
    DO UPDATE SET
      property_group_id = saved_listings.property_group_id,
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
      normalized_address = COALESCE(EXCLUDED.normalized_address, saved_listings.normalized_address),
      normalized_location_key = COALESCE(EXCLUDED.normalized_location_key, saved_listings.normalized_location_key),
      dedupe_fingerprint = COALESCE(EXCLUDED.dedupe_fingerprint, saved_listings.dedupe_fingerprint),
      dedupe_data = EXCLUDED.dedupe_data,
      features = EXCLUDED.features,
      raw_data = EXCLUDED.raw_data,
      source_published_at = COALESCE(EXCLUDED.source_published_at, saved_listings.source_published_at),
      source_updated_at = COALESCE(EXCLUDED.source_updated_at, saved_listings.source_updated_at),
      last_scraped_at = now(),
      updated_at = now()
    RETURNING
      id,
      property_group_id AS "propertyGroupId",
      source_id AS "sourceId",
      external_id AS "externalId",
      saved_at AS "savedAt",
      created_at AS "createdAt",
      updated_at AS "updatedAt"`,
    values
  );

  return result.rows[0];
}

function buildFavoriteFilters(filters, values, alias = "sl") {
  const where = [];

  if (filters.transactionType) {
    values.push(filters.transactionType);
    where.push(`${alias}.transaction_type = $${values.length}`);
  }

  if (filters.maxPrice) {
    values.push(filters.maxPrice);
    where.push(`${alias}.price IS NOT NULL AND ${alias}.price <= $${values.length}`);
  }

  if (filters.location) {
    values.push(`%${filters.location}%`);
    where.push(
      `(${alias}.location_label ILIKE $${values.length} OR ${alias}.municipality ILIKE $${values.length} OR ${alias}.province ILIKE $${values.length} OR ${alias}.address ILIKE $${values.length} OR ${alias}.district ILIKE $${values.length})`
    );
  }

  if (filters.provider) {
    values.push(filters.provider);
    where.push(`s.code = $${values.length}`);
  }

  if (filters.managementStatus) {
    values.push(filters.managementStatus);
    where.push(`pg.management_status = $${values.length}`);
  }

  if (filters.hasFutureAppointment) {
    where.push(
      `EXISTS (
        SELECT 1
        FROM listing_appointments la
        WHERE la.property_group_id = pg.id
          AND la.status = 'scheduled'
          AND la.scheduled_at >= now()
      )`
    );
  }

  return where;
}

async function listFavorites(queryable, filters) {
  const values = [];
  const where = buildFavoriteFilters(filters, values);
  const limit = filters.limit || 12;
  const page = filters.page || 1;
  const offset = (page - 1) * limit;

  values.push(limit);
  const limitIndex = values.length;
  values.push(offset);
  const offsetIndex = values.length;

  const orderByMap = {
    saved_at_desc: `rep.saved_at DESC`,
    price_asc: `rep.price ASC NULLS LAST`,
    price_desc: `rep.price DESC NULLS LAST`,
    appointment_asc: `next_appointment_at ASC NULLS LAST, rep.saved_at DESC`,
  };

  const orderBy = orderByMap[filters.sort] || orderByMap.saved_at_desc;
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const result = await queryable.query(
    `WITH filtered_groups AS (
      SELECT DISTINCT pg.id
      FROM property_groups pg
      JOIN saved_listings sl ON sl.property_group_id = pg.id
      JOIN sources s ON s.id = sl.source_id
      ${whereSql}
    ),
    representative AS (
      SELECT DISTINCT ON (sl.property_group_id)
        sl.id,
        sl.property_group_id,
        sl.source_id,
        sl.external_id,
        sl.source_url,
        sl.title,
        sl.transaction_type,
        sl.property_type,
        sl.price,
        sl.price_period,
        sl.currency,
        sl.surface_m2,
        sl.rooms,
        sl.floor,
        sl.location_label,
        sl.main_image_url,
        sl.advertiser_name,
        sl.advertiser_type,
        sl.saved_at,
        sl.updated_at
      FROM saved_listings sl
      JOIN filtered_groups fg ON fg.id = sl.property_group_id
      ORDER BY sl.property_group_id, sl.updated_at DESC, sl.id ASC
    )
    SELECT
      rep.id,
      rep.property_group_id AS "propertyGroupId",
      s.code AS provider,
      rep.external_id AS "externalId",
      rep.source_url AS "sourceUrl",
      rep.title,
      rep.transaction_type AS "transactionType",
      rep.property_type AS "propertyType",
      rep.price,
      rep.price_period AS "pricePeriod",
      rep.currency,
      rep.surface_m2 AS "surfaceM2",
      rep.rooms,
      rep.floor,
      rep.location_label AS "locationLabel",
      rep.main_image_url AS "mainImageUrl",
      rep.advertiser_name AS "advertiserName",
      rep.advertiser_type AS "advertiserType",
      rep.saved_at AS "savedAt",
      pg.management_status AS "managementStatus",
      (
        SELECT COUNT(*)
        FROM saved_listings sl_count
        WHERE sl_count.property_group_id = rep.property_group_id
      )::int AS "sourceCount",
      (
        SELECT COALESCE(json_agg(src.code ORDER BY src.code), '[]'::json)
        FROM saved_listings sl_src
        JOIN sources src ON src.id = sl_src.source_id
        WHERE sl_src.property_group_id = rep.property_group_id
      ) AS providers,
      (
        SELECT COUNT(*)
        FROM listing_notes ln
        WHERE ln.property_group_id = rep.property_group_id
      )::int AS "noteCount",
      (
        SELECT la.scheduled_at
        FROM listing_appointments la
        WHERE la.property_group_id = rep.property_group_id
          AND la.status = 'scheduled'
          AND la.scheduled_at >= now()
        ORDER BY la.scheduled_at ASC
        LIMIT 1
      ) AS "nextAppointmentAt"
    FROM representative rep
    JOIN property_groups pg ON pg.id = rep.property_group_id
    JOIN sources s ON s.id = rep.source_id
    ORDER BY ${orderBy}
    LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
    values
  );

  return result.rows;
}

async function countFavorites(queryable, filters) {
  const values = [];
  const where = buildFavoriteFilters(filters, values);
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const result = await queryable.query(
    `SELECT COUNT(*)::int AS total
     FROM (
       SELECT DISTINCT pg.id
       FROM property_groups pg
       JOIN saved_listings sl ON sl.property_group_id = pg.id
       JOIN sources s ON s.id = sl.source_id
       ${whereSql}
     ) grouped`,
    values
  );

  return result.rows[0]?.total || 0;
}

async function getFavoriteById(queryable, id) {
  const result = await queryable.query(
    `SELECT
      sl.id,
      sl.property_group_id AS "propertyGroupId",
      pg.management_status AS "managementStatus",
      s.code AS provider,
      sl.source_id AS "sourceId",
      sl.external_id AS "externalId",
      sl.source_url AS "sourceUrl",
      sl.transaction_type AS "transactionType",
      sl.property_type AS "propertyType",
      sl.title,
      sl.description,
      sl.price,
      sl.price_period AS "pricePeriod",
      sl.currency,
      sl.surface_m2 AS "surfaceM2",
      sl.rooms,
      sl.bedrooms,
      sl.bathrooms,
      sl.floor,
      sl.total_floors AS "totalFloors",
      sl.elevator,
      sl.furnished,
      sl.property_condition AS "propertyCondition",
      sl.heating,
      sl.energy_class AS "energyClass",
      sl.condominium_fees AS "condominiumFees",
      sl.availability,
      sl.advertiser_name AS "advertiserName",
      sl.advertiser_type AS "advertiserType",
      sl.location_label AS "locationLabel",
      sl.address,
      sl.street,
      sl.civic_number AS "civicNumber",
      sl.district,
      sl.municipality,
      sl.province,
      sl.region,
      sl.postal_code AS "postalCode",
      sl.latitude,
      sl.longitude,
      sl.location_precision AS "locationPrecision",
      sl.main_image_url AS "mainImageUrl",
      sl.normalized_address AS "normalizedAddress",
      sl.normalized_location_key AS "normalizedLocationKey",
      sl.dedupe_fingerprint AS "dedupeFingerprint",
      sl.dedupe_data AS "dedupeData",
      sl.features,
      sl.raw_data AS "rawData",
      sl.source_published_at AS "sourcePublishedAt",
      sl.source_updated_at AS "sourceUpdatedAt",
      sl.first_scraped_at AS "firstScrapedAt",
      sl.last_scraped_at AS "lastScrapedAt",
      sl.saved_at AS "savedAt",
      sl.created_at AS "createdAt",
      sl.updated_at AS "updatedAt"
     FROM saved_listings sl
     JOIN sources s ON s.id = sl.source_id
     JOIN property_groups pg ON pg.id = sl.property_group_id
     WHERE sl.id = $1
     LIMIT 1`,
    [id]
  );

  return result.rows[0] || null;
}

async function listByPropertyGroupId(queryable, propertyGroupId) {
  const result = await queryable.query(
    `SELECT
      sl.id,
      sl.property_group_id AS "propertyGroupId",
      s.code AS provider,
      s.name AS "providerName",
      sl.source_id AS "sourceId",
      sl.external_id AS "externalId",
      sl.source_url AS "sourceUrl",
      sl.transaction_type AS "transactionType",
      sl.property_type AS "propertyType",
      sl.title,
      sl.description,
      sl.price,
      sl.price_period AS "pricePeriod",
      sl.currency,
      sl.surface_m2 AS "surfaceM2",
      sl.rooms,
      sl.bedrooms,
      sl.bathrooms,
      sl.floor,
      sl.total_floors AS "totalFloors",
      sl.elevator,
      sl.furnished,
      sl.property_condition AS "propertyCondition",
      sl.heating,
      sl.energy_class AS "energyClass",
      sl.condominium_fees AS "condominiumFees",
      sl.availability,
      sl.advertiser_name AS "advertiserName",
      sl.advertiser_type AS "advertiserType",
      sl.location_label AS "locationLabel",
      sl.address,
      sl.street,
      sl.civic_number AS "civicNumber",
      sl.district,
      sl.municipality,
      sl.province,
      sl.region,
      sl.postal_code AS "postalCode",
      sl.latitude,
      sl.longitude,
      sl.location_precision AS "locationPrecision",
      sl.main_image_url AS "mainImageUrl",
      sl.normalized_address AS "normalizedAddress",
      sl.normalized_location_key AS "normalizedLocationKey",
      sl.dedupe_fingerprint AS "dedupeFingerprint",
      sl.dedupe_data AS "dedupeData",
      sl.features,
      sl.raw_data AS "rawData",
      sl.source_published_at AS "sourcePublishedAt",
      sl.source_updated_at AS "sourceUpdatedAt",
      sl.first_scraped_at AS "firstScrapedAt",
      sl.last_scraped_at AS "lastScrapedAt",
      sl.saved_at AS "savedAt",
      sl.created_at AS "createdAt",
      sl.updated_at AS "updatedAt"
     FROM saved_listings sl
     JOIN sources s ON s.id = sl.source_id
     WHERE sl.property_group_id = $1
     ORDER BY sl.updated_at DESC, sl.id ASC`,
    [propertyGroupId]
  );

  return result.rows;
}

async function findRepresentativeByGroupId(queryable, propertyGroupId, preferredListingId = null) {
  const params = [propertyGroupId];
  let preferredSql = "0";

  if (preferredListingId) {
    params.push(preferredListingId);
    preferredSql = `CASE WHEN sl.id = $2 THEN 0 ELSE 1 END`;
  }

  const result = await queryable.query(
    `SELECT
      sl.id,
      sl.property_group_id AS "propertyGroupId",
      s.code AS provider,
      s.name AS "providerName",
      sl.source_id AS "sourceId",
      sl.external_id AS "externalId",
      sl.source_url AS "sourceUrl",
      sl.transaction_type AS "transactionType",
      sl.property_type AS "propertyType",
      sl.title,
      sl.description,
      sl.price,
      sl.price_period AS "pricePeriod",
      sl.currency,
      sl.surface_m2 AS "surfaceM2",
      sl.rooms,
      sl.bedrooms,
      sl.bathrooms,
      sl.floor,
      sl.total_floors AS "totalFloors",
      sl.elevator,
      sl.furnished,
      sl.property_condition AS "propertyCondition",
      sl.heating,
      sl.energy_class AS "energyClass",
      sl.condominium_fees AS "condominiumFees",
      sl.availability,
      sl.advertiser_name AS "advertiserName",
      sl.advertiser_type AS "advertiserType",
      sl.location_label AS "locationLabel",
      sl.address,
      sl.street,
      sl.civic_number AS "civicNumber",
      sl.district,
      sl.municipality,
      sl.province,
      sl.region,
      sl.postal_code AS "postalCode",
      sl.latitude,
      sl.longitude,
      sl.location_precision AS "locationPrecision",
      sl.main_image_url AS "mainImageUrl",
      sl.normalized_address AS "normalizedAddress",
      sl.normalized_location_key AS "normalizedLocationKey",
      sl.dedupe_fingerprint AS "dedupeFingerprint",
      sl.dedupe_data AS "dedupeData",
      sl.features,
      sl.raw_data AS "rawData",
      sl.source_published_at AS "sourcePublishedAt",
      sl.source_updated_at AS "sourceUpdatedAt",
      sl.first_scraped_at AS "firstScrapedAt",
      sl.last_scraped_at AS "lastScrapedAt",
      sl.saved_at AS "savedAt",
      sl.created_at AS "createdAt",
      sl.updated_at AS "updatedAt"
     FROM saved_listings sl
     JOIN sources s ON s.id = sl.source_id
     WHERE sl.property_group_id = $1
     ORDER BY ${preferredSql}, sl.updated_at DESC, sl.id ASC
     LIMIT 1`,
    params
  );

  return result.rows[0] || null;
}

async function assignPropertyGroup(queryable, listingId, propertyGroupId) {
  const result = await queryable.query(
    `UPDATE saved_listings
     SET property_group_id = $2, updated_at = now()
     WHERE id = $1
     RETURNING id, property_group_id AS "propertyGroupId"`,
    [listingId, propertyGroupId]
  );

  return result.rows[0] || null;
}

async function moveGroupListings(queryable, fromGroupId, toGroupId) {
  const result = await queryable.query(
    `UPDATE saved_listings
     SET property_group_id = $2, updated_at = now()
     WHERE property_group_id = $1
     RETURNING id`,
    [fromGroupId, toGroupId]
  );

  return result.rows;
}

async function findDedupeCandidates(queryable, input) {
  const values = [input.sourceId, input.transactionType];
  const signals = [];

  if (input.dedupeFingerprint) {
    values.push(input.dedupeFingerprint);
    signals.push(`sl.dedupe_fingerprint = $${values.length}`);
  }

  if (input.normalizedLocationKey) {
    values.push(input.normalizedLocationKey);
    signals.push(`sl.normalized_location_key = $${values.length}`);
  }

  if (input.municipality) {
    values.push(input.municipality);
    signals.push(`sl.municipality ILIKE $${values.length}`);
  }

  if (signals.length === 0) {
    return [];
  }

  const result = await queryable.query(
    `SELECT
      sl.id,
      sl.property_group_id AS "propertyGroupId",
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
      sl.address,
      sl.street,
      sl.civic_number AS "civicNumber",
      sl.district,
      sl.municipality,
      sl.province,
      sl.region,
      sl.latitude,
      sl.longitude,
      sl.main_image_url AS "mainImageUrl",
      sl.normalized_address AS "normalizedAddress",
      sl.normalized_location_key AS "normalizedLocationKey",
      sl.dedupe_fingerprint AS "dedupeFingerprint",
      sl.dedupe_data AS "dedupeData"
     FROM saved_listings sl
     JOIN sources s ON s.id = sl.source_id
     WHERE sl.source_id <> $1
       AND sl.transaction_type = $2
       AND (${signals.join(" OR ")})
     ORDER BY sl.updated_at DESC, sl.id ASC
     LIMIT 100`,
    values
  );

  return result.rows;
}

async function listSavedSourceKeys(queryable) {
  const result = await queryable.query(
    `SELECT s.code AS provider, sl.external_id AS "externalId"
     FROM saved_listings sl
     JOIN sources s ON s.id = sl.source_id`
  );

  return result.rows;
}

async function deleteFavorite(queryable, id) {
  const result = await queryable.query(
    `DELETE FROM saved_listings
     WHERE id = $1
     RETURNING id, property_group_id AS "propertyGroupId"`,
    [id]
  );

  return result.rows[0] || null;
}

async function deleteByPropertyGroupId(queryable, propertyGroupId) {
  const result = await queryable.query(
    `DELETE FROM saved_listings
     WHERE property_group_id = $1
     RETURNING id`,
    [propertyGroupId]
  );

  return result.rows;
}

module.exports = {
  assignPropertyGroup,
  countFavorites,
  deleteByPropertyGroupId,
  deleteFavorite,
  findBySourceAndExternalId,
  findDedupeCandidates,
  findRepresentativeByGroupId,
  getFavoriteById,
  listByPropertyGroupId,
  listFavorites,
  listSavedSourceKeys,
  moveGroupListings,
  upsertListing,
};
