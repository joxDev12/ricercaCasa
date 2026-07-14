async function listByGroupId(queryable, propertyGroupId) {
  const result = await queryable.query(
    `SELECT
      id,
      property_group_id AS "propertyGroupId",
      body,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
     FROM listing_notes
     WHERE property_group_id = $1
     ORDER BY created_at DESC`,
    [propertyGroupId]
  );

  return result.rows;
}

async function create(queryable, propertyGroupId, body) {
  const result = await queryable.query(
    `INSERT INTO listing_notes (property_group_id, body)
     VALUES ($1, $2)
     RETURNING
       id,
       property_group_id AS "propertyGroupId",
       body,
       created_at AS "createdAt",
       updated_at AS "updatedAt"`,
    [propertyGroupId, body]
  );

  return result.rows[0];
}

async function update(queryable, id, propertyGroupId, body) {
  const result = await queryable.query(
    `UPDATE listing_notes
     SET body = $3, updated_at = now()
     WHERE id = $1 AND property_group_id = $2
     RETURNING
       id,
       property_group_id AS "propertyGroupId",
       body,
       created_at AS "createdAt",
       updated_at AS "updatedAt"`,
    [id, propertyGroupId, body]
  );

  return result.rows[0] || null;
}

async function remove(queryable, id, propertyGroupId) {
  const result = await queryable.query(
    `DELETE FROM listing_notes
     WHERE id = $1 AND property_group_id = $2
     RETURNING id`,
    [id, propertyGroupId]
  );

  return result.rows[0] || null;
}

module.exports = {
  create,
  listByGroupId,
  remove,
  update,
};
