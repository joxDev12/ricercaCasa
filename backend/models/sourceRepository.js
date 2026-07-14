async function findByCode(queryable, code) {
  const result = await queryable.query(
    `SELECT id, code, name, base_url, active
     FROM sources
     WHERE code = $1
     LIMIT 1`,
    [code]
  );

  return result.rows[0] || null;
}

async function listActive(queryable) {
  const result = await queryable.query(
    `SELECT id, code, name, base_url, active
     FROM sources
     WHERE active = true
     ORDER BY id ASC`
  );

  return result.rows;
}

module.exports = { findByCode, listActive };
