async function createRun(queryable, input) {
  const result = await queryable.query(
    `INSERT INTO scraping_runs (
      source_id,
      operation,
      criteria,
      status
    ) VALUES ($1, $2, $3, 'running')
    RETURNING id, started_at`,
    [input.sourceId, input.operation, JSON.stringify(input.criteria || {})]
  );

  return result.rows[0];
}

async function completeRun(queryable, id, input) {
  await queryable.query(
    `UPDATE scraping_runs
     SET status = $2,
         results_count = $3,
         duration_ms = $4,
         completed_at = now()
     WHERE id = $1`,
    [id, input.status || "success", input.resultsCount ?? null, input.durationMs]
  );
}

async function failRun(queryable, id, input) {
  await queryable.query(
    `UPDATE scraping_runs
     SET status = $2,
         error_code = $3,
         error_message = $4,
         duration_ms = $5,
         completed_at = now()
     WHERE id = $1`,
    [id, input.status || "failed", input.errorCode, input.errorMessage, input.durationMs]
  );
}

module.exports = { completeRun, createRun, failRun };
