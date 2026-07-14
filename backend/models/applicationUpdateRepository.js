async function findLatest(queryable) {
  const result = await queryable.query(
    `SELECT id,
            job_id AS "jobId",
            from_version AS "fromVersion",
            to_version AS "toVersion",
            updater_from_version AS "updaterFromVersion",
            updater_to_version AS "updaterToVersion",
            status,
            release_digest AS "releaseDigest",
            backup_created AS "backupCreated",
            rollback_performed AS "rollbackPerformed",
            failure_code AS "failureCode",
            failure_message AS "failureMessage",
            started_at AS "startedAt",
            completed_at AS "completedAt",
            created_at AS "createdAt"
     FROM application_updates
     ORDER BY started_at DESC
     LIMIT 1`
  );

  return result.rows[0] || null;
}

module.exports = { findLatest };
