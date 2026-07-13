const { pool } = require("../config/db");

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS annunci (
      id SERIAL PRIMARY KEY,
      titolo VARCHAR(255) NOT NULL,
      descrizione TEXT,
      prezzo NUMERIC(10, 2),
      citta VARCHAR(120),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAll() {
  const result = await pool.query(
    "SELECT * FROM annunci ORDER BY created_at DESC, id DESC"
  );
  return result.rows;
}

module.exports = { init, getAll };
