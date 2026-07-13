const { getScraper } = require("../scraper");

async function search(criteria) {
  const scraper = getScraper(criteria.provider);

  return scraper.search({
    location: criteria.location,
    locationPath: criteria.locationPath || null,
    transactionType: criteria.transactionType,
    maxPrice: criteria.maxPrice || null,
    page: criteria.page || 1,
  });
}

async function suggestLocations(query, context) {
  return getScraper("immobiliare_it").suggestLocations(query, context);
}

module.exports = { search, suggestLocations };
