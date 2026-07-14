const PROVIDER_CODES = ["immobiliare_it", "idealista_it", "casa_it"];

function isProviderCode(value) {
  return PROVIDER_CODES.includes(value);
}

module.exports = {
  PROVIDER_CODES,
  isProviderCode,
};
