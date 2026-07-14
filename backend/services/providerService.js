const { pool } = require("../config/db");
const sourceRepository = require("../models/sourceRepository");

async function listActiveProviders() {
  const providers = await sourceRepository.listActive(pool);

  return providers.map((provider) => ({
    code: provider.code,
    name: provider.name,
    baseUrl: provider.base_url,
  }));
}

module.exports = { listActiveProviders };
