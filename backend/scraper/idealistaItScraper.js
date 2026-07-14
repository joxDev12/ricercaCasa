const { env } = require("../config/env");
const {
  InvalidProviderResponseError,
  ProviderBlockedError,
} = require("../utils/errors");
const { fetchHtml, fetchTranslatedHtml } = require("./shared/requestClient");
const { loadHtml } = require("./shared/parsing");
const {
  parseNumber,
  pickTextMatches,
  slugifyLocation,
} = require("./shared/normalizers");

function extractExternalId(sourceUrl) {
  const match = String(sourceUrl).match(/immobile\/(\d+)/);
  return match ? match[1] : null;
}

function validateSourceUrl(sourceUrl) {
  return /^https:\/\/www\.idealista\.it\/immobile\/\d+\/?$/i.test(
    String(sourceUrl)
  );
}

function inferPropertyType(title) {
  if (/villa|villetta|casa indipendente/i.test(title)) return "Villa";
  if (/attico/i.test(title)) return "Attico";
  if (/appartamento|monolocale|bilocale|trilocale|quadrilocale/i.test(title)) {
    return "Appartamento";
  }
  return null;
}

function getLocationPath(criteria) {
  if (criteria.locationPath) {
    const path = String(criteria.locationPath).replace(/^\/+|\/+$/g, "");

    if (!path.includes("/")) {
      return path;
    }

    const city = path.split("/")[0];
    return `${city}-${city}`;
  }

  const parts = String(criteria.location || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const city = slugifyLocation(parts.at(-1) || criteria.location);

  return `${city}-${city}`;
}

function buildSearchUrl(criteria) {
  const transactionSegment =
    criteria.transactionType === "rent" ? "affitto-case" : "vendita-case";
  const segments = [transactionSegment, getLocationPath(criteria)];

  if (criteria.maxPrice) {
    segments.push(`con-prezzo_${Number(criteria.maxPrice)}`);
  }

  const url = new URL(`https://www.idealista.it/${segments.join("/")}/`);

  if (criteria.page && criteria.page > 1) {
    url.pathname = `${url.pathname}lista-${criteria.page}.htm`;
  }

  return url.toString();
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function parseSearchHtml(html, criteria) {
  const $ = loadHtml(html);

  if (/"statusCode":"404"/.test(html)) {
    throw new InvalidProviderResponseError("Localita Idealista non trovata");
  }

  const data = [];

  $("article.item[data-element-id]").each((_, element) => {
    const root = $(element);
    const externalId = String(root.attr("data-element-id") || "");
    const title = normalizeText(
      root.find("a.item-link").first().attr("title") ||
        root.find("a.item-link").first().text()
    );

    if (!externalId || !title) {
      return;
    }

    const details = root
      .find(".item-detail-char .item-detail")
      .map((_, item) => normalizeText($(item).text()))
      .get();
    const rooms = details.find((value) => /\blocal[ei]\b/i.test(value));
    const surface = details.find((value) => /m²/i.test(value));
    const floor = details.find(
      (value) => /piano|terra|seminterrato/i.test(value) && !/\bora\b/i.test(value)
    );
    const advertiserName = normalizeText(
      root.find(".logo-branding a[title]").first().attr("title")
    );
    const imageUrl = root.find(".item-multimedia img").first().attr("src") || null;

    data.push({
      provider: "idealista_it",
      externalId,
      sourceUrl: `https://www.idealista.it/immobile/${externalId}/`,
      title,
      transactionType: criteria.transactionType,
      price: parseNumber(root.find(".item-price").first().text()),
      pricePeriod: criteria.transactionType === "rent" ? "month" : "total",
      currency: "EUR",
      locationLabel: criteria.location,
      propertyType: inferPropertyType(title),
      surfaceM2: parseNumber(surface),
      rooms: parseNumber(rooms),
      floor: floor || null,
      shortDescription:
        normalizeText(root.find(".item-description p").first().text()) || null,
      mainImageUrl: imageUrl,
      advertiserName: advertiserName || null,
      advertiserType: advertiserName ? "agenzia" : null,
    });
  });

  const maxPrice = criteria.maxPrice ? Number(criteria.maxPrice) : null;
  const locationParts = String(criteria.location || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, -1);
  const filtered = data.filter((item) => {
    if (maxPrice && item.price != null && item.price > maxPrice) {
      return false;
    }

    if (!locationParts.length) {
      return true;
    }

    const searchable = [item.title, item.shortDescription].join(" ");
    return locationParts.some((part) => pickTextMatches(searchable, part));
  });
  const totalText = normalizeText($("#h1-container__text").text());
  const totalResults = parseNumber(totalText.match(/[\d.]+/)?.[0]);

  if (!filtered.length && /captcha-delivery|Please enable JS/i.test(html)) {
    throw new ProviderBlockedError(
      "Idealista sta bloccando richieste automatiche con challenge anti-bot"
    );
  }

  return {
    data: filtered,
    meta: {
      page: criteria.page || 1,
      hasNextPage: $(".pagination .next a").length > 0,
      totalResults: totalResults ?? filtered.length,
    },
  };
}

function findSpecificLocationUrl(html, criteria) {
  const parts = String(criteria.location || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  const query = parts.slice(0, -1).join(" ");
  const $ = loadHtml(html);
  let matchedHref = null;

  $(".breadcrumb-dropdown-subitem-element-list a").each((_, element) => {
    if (!matchedHref && pickTextMatches($(element).text(), query)) {
      matchedHref = $(element).attr("href");
    }
  });

  if (!matchedHref) {
    return null;
  }

  const translated = new URL(matchedHref, "https://www.idealista.it");
  const canonical = new URL(translated.pathname, "https://www.idealista.it");

  if (criteria.page && criteria.page > 1) {
    canonical.pathname = `${canonical.pathname}lista-${criteria.page}.htm`;
  }

  return canonical.toString();
}

async function fetchSearchHtml(url) {
  try {
    return await fetchHtml(url);
  } catch (error) {
    if (!(error instanceof ProviderBlockedError)) {
      throw error;
    }

    return fetchTranslatedHtml(url);
  }
}

async function search(criteria) {
  if (!env.allowProviderScraping) {
    throw new ProviderBlockedError();
  }

  const url = buildSearchUrl(criteria);
  let html = await fetchSearchHtml(url);
  const specificLocationUrl = findSpecificLocationUrl(html, criteria);

  if (specificLocationUrl && specificLocationUrl !== url) {
    try {
      html = await fetchSearchHtml(specificLocationUrl);
    } catch (error) {
      if (!/404/.test(error.message)) {
        throw error;
      }
      // Idealista sometimes advertises dead zone links; city results are filtered below.
    }
  }

  return parseSearchHtml(html, criteria);
}

async function suggestLocations() {
  return [];
}

module.exports = {
  buildSearchUrl,
  code: "idealista_it",
  extractExternalId,
  findSpecificLocationUrl,
  parseSearchHtml,
  search,
  suggestLocations,
  validateSourceUrl,
};
