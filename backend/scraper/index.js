const immobiliareItScraper = require("./immobiliareItScraper");
const { UnsupportedProviderError } = require("../utils/errors");

const scrapers = {
  immobiliare_it: immobiliareItScraper,
};

function getScraper(provider) {
  const scraper = scrapers[provider];

  if (!scraper) {
    throw new UnsupportedProviderError(provider);
  }

  return scraper;
}

module.exports = { getScraper };
