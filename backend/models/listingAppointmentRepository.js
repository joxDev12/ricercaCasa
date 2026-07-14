async function listByGroupId(queryable, propertyGroupId) {
  const result = await queryable.query(
    `SELECT
      id,
      property_group_id AS "propertyGroupId",
      scheduled_at AS "scheduledAt",
      status,
      location_text AS "locationText",
      notes,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
     FROM listing_appointments
     WHERE property_group_id = $1
     ORDER BY
       CASE
         WHEN status = 'scheduled' AND scheduled_at >= now() THEN 0
         WHEN status = 'scheduled' THEN 1
         ELSE 2
       END,
       scheduled_at ASC,
       created_at DESC`,
    [propertyGroupId]
  );

  return result.rows;
}

async function create(queryable, propertyGroupId, input) {
  const result = await queryable.query(
    `INSERT INTO listing_appointments (
      property_group_id,
      scheduled_at,
      status,
      location_text,
      notes
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING
      id,
      property_group_id AS "propertyGroupId",
      scheduled_at AS "scheduledAt",
      status,
      location_text AS "locationText",
      notes,
      created_at AS "createdAt",
      updated_at AS "updatedAt"`,
    [
      propertyGroupId,
      input.scheduledAt,
      input.status || "scheduled",
      input.locationText || null,
      input.notes || null,
    ]
  );

  return result.rows[0];
}

async function update(queryable, id, propertyGroupId, input) {
  const result = await queryable.query(
    `UPDATE listing_appointments
     SET
      scheduled_at = $3,
      status = $4,
      location_text = $5,
      notes = $6,
      updated_at = now()
     WHERE id = $1 AND property_group_id = $2
     RETURNING
      id,
      property_group_id AS "propertyGroupId",
      scheduled_at AS "scheduledAt",
      status,
      location_text AS "locationText",
      notes,
      created_at AS "createdAt",
      updated_at AS "updatedAt"`,
    [
      id,
      propertyGroupId,
      input.scheduledAt,
      input.status,
      input.locationText || null,
      input.notes || null,
    ]
  );

  return result.rows[0] || null;
}

async function remove(queryable, id, propertyGroupId) {
  const result = await queryable.query(
    `DELETE FROM listing_appointments
     WHERE id = $1 AND property_group_id = $2
     RETURNING id`,
    [id, propertyGroupId]
  );

  return result.rows[0] || null;
}

async function findNextScheduled(queryable, propertyGroupId) {
  const result = await queryable.query(
    `SELECT
      id,
      property_group_id AS "propertyGroupId",
      scheduled_at AS "scheduledAt",
      status,
      location_text AS "locationText",
      notes,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
     FROM listing_appointments
     WHERE property_group_id = $1
       AND status = 'scheduled'
       AND scheduled_at >= now()
     ORDER BY scheduled_at ASC
     LIMIT 1`,
    [propertyGroupId]
  );

  return result.rows[0] || null;
}

module.exports = {
  create,
  findNextScheduled,
  listByGroupId,
  remove,
  update,
};
