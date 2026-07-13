const cheerio = require("cheerio");
const { InvalidProviderResponseError } = require("../../utils/errors");

function loadHtml(html) {
  if (!html || typeof html !== "string") {
    throw new InvalidProviderResponseError("HTML provider vuoto");
  }

  return cheerio.load(html);
}

function parseJsonLd($) {
  const items = [];

  $('script[type="application/ld+json"]').each((_, element) => {
    const raw = $(element).contents().text().trim();
    if (!raw) {
      return;
    }

    try {
      items.push(JSON.parse(raw));
    } catch (_error) {
      return;
    }
  });

  return items;
}

function flattenJsonLd(items) {
  const flat = [];

  for (const item of items) {
    if (Array.isArray(item)) {
      flat.push(...flattenJsonLd(item));
      continue;
    }

    if (item && Array.isArray(item["@graph"])) {
      flat.push(...flattenJsonLd(item["@graph"]));
      continue;
    }

    flat.push(item);
  }

  return flat;
}

module.exports = { flattenJsonLd, loadHtml, parseJsonLd };
