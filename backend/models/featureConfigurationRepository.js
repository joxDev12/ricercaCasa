async function listAll(queryable) {
  const result = await queryable.query(
    `SELECT id,
            feature_code AS "featureCode",
            schema_version AS "schemaVersion",
            status,
            configuration,
            configured_at AS "configuredAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
     FROM feature_configurations
     ORDER BY feature_code ASC, schema_version DESC`
  );

  return result.rows;
}

async function findLatestByCode(queryable, featureCode) {
  const result = await queryable.query(
    `SELECT id,
            feature_code AS "featureCode",
            schema_version AS "schemaVersion",
            status,
            configuration,
            configured_at AS "configuredAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
     FROM feature_configurations
     WHERE feature_code = $1
     ORDER BY schema_version DESC
     LIMIT 1`,
    [featureCode]
  );

  return result.rows[0] || null;
}

async function upsert(queryable, input) {
  const result = await queryable.query(
    `INSERT INTO feature_configurations (
       feature_code,
       schema_version,
       status,
       configuration,
       configured_at,
       created_at,
       updated_at
     )
     VALUES ($1, $2, $3, $4::jsonb, now(), now(), now())
     ON CONFLICT (feature_code, schema_version)
     DO UPDATE
       SET status = EXCLUDED.status,
           configuration = EXCLUDED.configuration,
           configured_at = now(),
           updated_at = now()
     RETURNING id,
               feature_code AS "featureCode",
               schema_version AS "schemaVersion",
               status,
               configuration,
               configured_at AS "configuredAt",
               created_at AS "createdAt",
               updated_at AS "updatedAt"`,
    [
      input.featureCode,
      input.schemaVersion,
      input.status,
      JSON.stringify(input.configuration),
    ]
  );

  return result.rows[0] || null;
}

module.exports = { findLatestByCode, listAll, upsert };
