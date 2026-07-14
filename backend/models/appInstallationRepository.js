async function getSingleton(queryable) {
  const result = await queryable.query(
    `SELECT id,
            installation_uuid AS "installationUuid",
            setup_status AS "setupStatus",
            installed_version AS "installedVersion",
            last_successful_version AS "lastSuccessfulVersion",
            setup_completed_at AS "setupCompletedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
     FROM app_installation
     WHERE id = 1`
  );

  return result.rows[0] || null;
}

async function completeSetup(queryable, installedVersion = null) {
  const result = await queryable.query(
    `UPDATE app_installation
     SET setup_status = 'completed',
         installed_version = COALESCE($1, installed_version),
         last_successful_version = COALESCE($1, last_successful_version),
         setup_completed_at = now(),
         updated_at = now()
     WHERE id = 1
     RETURNING id,
               installation_uuid AS "installationUuid",
               setup_status AS "setupStatus",
               installed_version AS "installedVersion",
               last_successful_version AS "lastSuccessfulVersion",
               setup_completed_at AS "setupCompletedAt",
               created_at AS "createdAt",
               updated_at AS "updatedAt"`,
    [installedVersion]
  );

  return result.rows[0] || null;
}

module.exports = { completeSetup, getSingleton };
