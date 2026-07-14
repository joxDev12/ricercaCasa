const { Pool } = require("pg");
const { env } = require("./env");

const connectionConfig = env.databaseUrl
  ? { connectionString: env.databaseUrl }
  : {
      host: env.dbHost,
      port: env.dbPort,
      database: env.dbName,
      user: env.dbUser,
      password: env.dbPass,
    };

const pool = new Pool(connectionConfig);

async function closePool() {
  await pool.end();
}

module.exports = { pool, closePool };
