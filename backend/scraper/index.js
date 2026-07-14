const immobiliareItScraper = require("./immobiliareItScraper");
const idealistaItScraper = require("./idealistaItScraper");
const casaItScraper = require("./casaItScraper");
const { UnsupportedProviderError } = require("../utils/errors");

const scrapers = {
  immobiliare_it: immobiliareItScraper,
  idealista_it: idealistaItScraper,
  casa_it: casaItScraper,
};

function getScraper(provider) {
  const scraper = scrapers[provider];

  if (!scraper) {
    throw new UnsupportedProviderError(provider);
  }

  return scraper;
}

function getAllScrapers() {
  return scrapers;
}

module.exports = { getAllScrapers, getScraper };
