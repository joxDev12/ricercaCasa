function orderPair(firstId, secondId) {
  return firstId < secondId ? [firstId, secondId] : [secondId, firstId];
}

async function upsert(queryable, input) {
  const [listingAId, listingBId] = orderPair(input.listingAId, input.listingBId);
  const resolvedAt =
    input.status === "confirmed" ||
    input.status === "rejected" ||
    input.status === "auto_confirmed"
      ? "now()"
      : "NULL";

  const result = await queryable.query(
    `INSERT INTO duplicate_candidates (
      listing_a_id,
      listing_b_id,
      score,
      status,
      reasons,
      algorithm_version,
      resolved_at
    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, ${resolvedAt})
    ON CONFLICT (listing_a_id, listing_b_id)
    DO UPDATE SET
      score = EXCLUDED.score,
      status = EXCLUDED.status,
      reasons = EXCLUDED.reasons,
      algorithm_version = EXCLUDED.algorithm_version,
      resolved_at = CASE
        WHEN EXCLUDED.status IN ('confirmed', 'rejected', 'auto_confirmed') THEN now()
        ELSE duplicate_candidates.resolved_at
      END,
      updated_at = now()
    RETURNING
      id,
      listing_a_id AS "listingAId",
      listing_b_id AS "listingBId",
      score,
      status,
      reasons,
      algorithm_version AS "algorithmVersion",
      created_at AS "createdAt",
      resolved_at AS "resolvedAt",
      updated_at AS "updatedAt"`,
    [
      listingAId,
      listingBId,
      input.score,
      input.status || "pending",
      JSON.stringify(input.reasons || []),
      input.algorithmVersion || 1,
    ]
  );

  return result.rows[0];
}

async function listPendingByGroupId(queryable, propertyGroupId) {
  const result = await queryable.query(
    `SELECT
      dc.id,
      dc.listing_a_id AS "listingAId",
      dc.listing_b_id AS "listingBId",
      dc.score,
      dc.status,
      dc.reasons,
      dc.algorithm_version AS "algorithmVersion",
      dc.created_at AS "createdAt",
      dc.resolved_at AS "resolvedAt",
      dc.updated_at AS "updatedAt",
      sla.property_group_id AS "listingAGroupId",
      slb.property_group_id AS "listingBGroupId",
      sa.code AS "listingAProvider",
      sb.code AS "listingBProvider",
      sla.title AS "listingATitle",
      slb.title AS "listingBTitle"
     FROM duplicate_candidates dc
     JOIN saved_listings sla ON sla.id = dc.listing_a_id
     JOIN saved_listings slb ON slb.id = dc.listing_b_id
     JOIN sources sa ON sa.id = sla.source_id
     JOIN sources sb ON sb.id = slb.source_id
     WHERE dc.status = 'pending'
       AND (sla.property_group_id = $1 OR slb.property_group_id = $1)
     ORDER BY dc.score DESC, dc.created_at DESC`,
    [propertyGroupId]
  );

  return result.rows;
}

async function findById(queryable, id) {
  const result = await queryable.query(
    `SELECT
      id,
      listing_a_id AS "listingAId",
      listing_b_id AS "listingBId",
      score,
      status,
      reasons,
      algorithm_version AS "algorithmVersion",
      created_at AS "createdAt",
      resolved_at AS "resolvedAt",
      updated_at AS "updatedAt"
     FROM duplicate_candidates
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  return result.rows[0] || null;
}

async function updateStatus(queryable, id, status) {
  const result = await queryable.query(
    `UPDATE duplicate_candidates
     SET
      status = $2,
      resolved_at = CASE
        WHEN $2 IN ('confirmed', 'rejected', 'auto_confirmed') THEN now()
        ELSE resolved_at
      END,
      updated_at = now()
     WHERE id = $1
     RETURNING
      id,
      listing_a_id AS "listingAId",
      listing_b_id AS "listingBId",
      score,
      status,
      reasons,
      algorithm_version AS "algorithmVersion",
      created_at AS "createdAt",
      resolved_at AS "resolvedAt",
      updated_at AS "updatedAt"`,
    [id, status]
  );

  return result.rows[0] || null;
}

module.exports = {
  findById,
  listPendingByGroupId,
  upsert,
  updateStatus,
};
