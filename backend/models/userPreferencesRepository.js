async function getSingleton(queryable) {
  const result = await queryable.query(
    `SELECT id,
            display_name AS "displayName",
            contact_email AS "contactEmail",
            locale,
            timezone,
            created_at AS "createdAt",
            updated_at AS "updatedAt"
     FROM user_preferences
     WHERE id = 1`
  );

  return result.rows[0] || null;
}

async function updateSingleton(queryable, input) {
  const result = await queryable.query(
    `UPDATE user_preferences
     SET display_name = $1,
         contact_email = $2,
         locale = $3,
         timezone = $4,
         updated_at = now()
     WHERE id = 1
     RETURNING id,
               display_name AS "displayName",
               contact_email AS "contactEmail",
               locale,
               timezone,
               created_at AS "createdAt",
               updated_at AS "updatedAt"`,
    [input.displayName, input.contactEmail, input.locale, input.timezone]
  );

  return result.rows[0] || null;
}

module.exports = { getSingleton, updateSingleton };
