async function create(queryable, input) {
  const result = await queryable.query(
    `INSERT INTO property_groups (
      transaction_type,
      management_status
    ) VALUES ($1, $2)
    RETURNING id, transaction_type AS "transactionType", management_status AS "managementStatus", created_at AS "createdAt", updated_at AS "updatedAt"`,
    [input.transactionType, input.managementStatus || "saved"]
  );

  return result.rows[0];
}

async function getById(queryable, id) {
  const result = await queryable.query(
    `SELECT
      id,
      transaction_type AS "transactionType",
      management_status AS "managementStatus",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
     FROM property_groups
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  return result.rows[0] || null;
}

async function findByListingId(queryable, listingId) {
  const result = await queryable.query(
    `SELECT
      pg.id,
      pg.transaction_type AS "transactionType",
      pg.management_status AS "managementStatus",
      pg.created_at AS "createdAt",
      pg.updated_at AS "updatedAt"
     FROM property_groups pg
     JOIN saved_listings sl ON sl.property_group_id = pg.id
     WHERE sl.id = $1
     LIMIT 1`,
    [listingId]
  );

  return result.rows[0] || null;
}

async function updateStatus(queryable, id, status) {
  const result = await queryable.query(
    `UPDATE property_groups
     SET management_status = $2, updated_at = now()
     WHERE id = $1
     RETURNING id, transaction_type AS "transactionType", management_status AS "managementStatus", created_at AS "createdAt", updated_at AS "updatedAt"`,
    [id, status]
  );

  return result.rows[0] || null;
}

async function deleteEmpty(queryable, id) {
  const result = await queryable.query(
    `DELETE FROM property_groups pg
     WHERE pg.id = $1
       AND NOT EXISTS (
         SELECT 1
         FROM saved_listings sl
         WHERE sl.property_group_id = pg.id
       )
     RETURNING id`,
    [id]
  );

  return result.rows[0] || null;
}

module.exports = {
  create,
  deleteEmpty,
  findByListingId,
  getById,
  updateStatus,
};
