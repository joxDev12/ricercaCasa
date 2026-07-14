async function listPending(queryable) {
  const result = await queryable.query(
    `SELECT id,
            feature_code AS "featureCode",
            schema_version AS "schemaVersion",
            required_from_version AS "requiredFromVersion",
            blocking,
            status,
            completed_at AS "completedAt",
            skipped_at AS "skippedAt",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
     FROM feature_setup_tasks
     WHERE status IN ('pending', 'in_progress', 'failed')
     ORDER BY blocking DESC, id ASC`
  );

  return result.rows;
}

module.exports = { listPending };
