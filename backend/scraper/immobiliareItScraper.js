const { env } = require("../config/env");
const {
  InvalidProviderResponseError,
  ListingNotFoundError,
  ProviderBlockedError,
} = require("../utils/errors");
const {
  fetchHtml,
  fetchReader,
  fetchTranslatedHtml,
} = require("./shared/httpClient");
const { flattenJsonLd, loadHtml, parseJsonLd } = require("./shared/parsing");
const {
  extractExternalIdFromUrl,
  normalizeImage,
  parseNumber,
  pickFirst,
  slugifyLocation,
} = require("./shared/normalizers");

function buildSearchUrl(criteria) {
  const transactionSegment =
    criteria.transactionType === "rent" ? "affitto-case" : "vendita-case";
  const locationSlug = criteria.locationPath || slugifyLocation(criteria.location);
  const url = new URL(
    `https://www.immobiliare.it/${transactionSegment}/${locationSlug}/`
  );

  if (criteria.maxPrice) {
    url.searchParams.set("prezzoMassimo", String(criteria.maxPrice));
  }

  if (criteria.page && criteria.page > 1) {
    url.searchParams.set("pag", String(criteria.page));
  }

  return url.toString();
}

function buildSearchUrls(criteria) {
  const primary = buildSearchUrl(criteria);
  const alternate = primary.includes("/in-via-")
    ? primary.replace("/in-via-", "/in-viale-")
    : primary.includes("/in-viale-")
      ? primary.replace("/in-viale-", "/in-via-")
      : null;

  return alternate ? [primary, alternate] : [primary];
}

function normalizeLocationSuggestions(items, query, context = {}) {
  const normalized = items.map((item) => {
    const parents = Array.isArray(item.parents) ? item.parents : [];
    const city = item.type === 2 ? item : parents.find((parent) => parent.type === 2);
    const path = city && item.type > 2
      ? `${slugifyLocation(city.keyurl)}/${slugifyLocation(item.keyurl)}`
      : slugifyLocation(item.keyurl || item.label);
    const labels = [item.label, city?.label]
      .filter(Boolean)
      .filter((value, index, values) => values.indexOf(value) === index);

    return {
      id: String(item.id),
      type: item.type,
      label: item.label,
      displayLabel: labels.join(", "),
      path,
      cityLabel: city?.label || null,
    };
  });

  const roadMatch = query.match(
    /\b(?:via|viale|piazza|piazzale|corso|largo|vicolo|lungomare|strada)\s+.+/i
  );
  const matchedPlace = normalized.find((item) =>
    query.toLowerCase().includes(item.label.toLowerCase())
  );
  const contextCityLabel =
    matchedPlace?.cityLabel || context.label?.split(",").at(-1)?.trim();
  const contextPath =
    matchedPlace?.path ||
    context.path ||
    (contextCityLabel ? slugifyLocation(contextCityLabel) : null);
  let roadLabel = roadMatch?.[0].trim();

  if (roadLabel && matchedPlace) {
    roadLabel = roadLabel
      .replace(new RegExp(`[,\\s]+${matchedPlace.label}$`, "i"), "")
      .trim();
  }

  const road = roadLabel && contextPath
    ? {
        id: `road:${contextPath}:${slugifyLocation(roadLabel)}`,
        type: 7,
        label: roadLabel,
        displayLabel: `${roadLabel}, ${contextCityLabel}`,
        path: `${contextPath.split("/")[0]}/in-${slugifyLocation(roadLabel)}`,
        cityLabel: contextCityLabel || null,
      }
    : null;

  return Array.from(
    new Map([road, ...normalized].filter(Boolean).map((item) => [item.path, item])).values()
  )
    .slice(0, 8)
    .map(({ cityLabel: _cityLabel, ...item }) => item);
}

async function suggestLocations(query, context = {}) {
  const url = new URL(
    "https://www.immobiliare.it/api-next/geography/autocomplete/"
  );
  url.searchParams.set("macrozones", "1");
  url.searchParams.set("microzones", "1");
  url.searchParams.set("min_level", "5");
  url.searchParams.set("query", query);
  url.searchParams.set("__lang", "it");

  let items;

  try {
    items = JSON.parse(await fetchHtml(url));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new InvalidProviderResponseError(
        "Suggerimenti localita provider non parsabili"
      );
    }
    throw error;
  }

  if (!Array.isArray(items)) {
    throw new InvalidProviderResponseError(
      "Suggerimenti localita provider non validi"
    );
  }

  return normalizeLocationSuggestions(items, query, context);
}

function normalizeSummaryFromJsonLd(item, fallback = {}) {
  const sourceUrl = pickFirst(
    item.url,
    item.mainEntityOfPage,
    fallback.sourceUrl
  );
  const externalId = pickFirst(
    extractExternalIdFromUrl(sourceUrl),
    item.productID,
    fallback.externalId
  );

  if (!sourceUrl || !externalId) {
    return null;
  }

  const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers || {};
  const image = Array.isArray(item.image) ? item.image[0] : item.image;
  const address = item.address || {};

  return {
    provider: "immobiliare_it",
    externalId,
    sourceUrl,
    title: pickFirst(item.name, fallback.title, "Annuncio Immobiliare.it"),
    transactionType: fallback.transactionType,
    price: parseNumber(pickFirst(offer.price, fallback.price)),
    pricePeriod: fallback.transactionType === "rent" ? "month" : "total",
    currency: "EUR",
    locationLabel: pickFirst(
      fallback.locationLabel,
      address.addressLocality,
      address.streetAddress
    ),
    propertyType: pickFirst(item["@type"], fallback.propertyType),
    surfaceM2: parseNumber(fallback.surfaceM2),
    rooms: parseNumber(fallback.rooms),
    floor: fallback.floor || null,
    shortDescription: pickFirst(item.description, fallback.shortDescription),
    mainImageUrl: pickFirst(image, fallback.mainImageUrl),
    advertiserName: fallback.advertiserName || null,
    advertiserType: fallback.advertiserType || null,
  };
}

function extractNextSearchResults($, criteria) {
  const raw = $("#__NEXT_DATA__").contents().text().trim();

  if (!raw) {
    return [];
  }

  let nextData;

  try {
    nextData = JSON.parse(raw);
  } catch (_error) {
    return [];
  }

  const queries = nextData?.props?.pageProps?.dehydratedState?.queries || [];
  const results = queries
    .map((query) => query?.state?.data?.results)
    .find(Array.isArray);

  if (!results) {
    return [];
  }

  return results.map((result) => {
    const listing = result.realEstate || {};
    const properties = Array.isArray(listing.properties)
      ? listing.properties
      : [];
    const property = properties.find((item) => item.isMain) || properties[0] || {};
    const location = property.location || {};
    const featureList = Array.isArray(property.featureList)
      ? property.featureList
      : [];
    const advertiser = Object.values(listing.advertiser || {}).find(
      (item) => item && typeof item === "object" && item.displayName
    );
    const photo =
      property.photo ||
      property.multimedia?.photos?.[0] ||
      {};
    const featureSummary = [
      property.ga4Condition,
      property.ga4Heating
        ? `Riscaldamento ${String(property.ga4Heating).toLowerCase()}`
        : null,
      ...(Array.isArray(property.ga4features) ? property.ga4features : []),
    ]
      .filter(Boolean)
      .join(", ");
    const externalId = String(listing.id || "");

    if (!externalId) {
      return null;
    }

    return {
      provider: "immobiliare_it",
      externalId,
      sourceUrl: `https://www.immobiliare.it/annunci/${externalId}/`,
      title: listing.title || result.seo?.anchor || `Annuncio ${externalId}`,
      transactionType: criteria.transactionType,
      price: parseNumber(pickFirst(listing.price?.value, property.price?.value)),
      pricePeriod: criteria.transactionType === "rent" ? "month" : "total",
      currency: "EUR",
      locationLabel:
        [location.address, location.microzone || location.macrozone, location.city]
          .filter(Boolean)
          .filter((value, index, values) => values.indexOf(value) === index)
          .join(", ") || criteria.location,
      propertyType: pickFirst(
        property.typologyGA4Translation,
        property.typology?.name,
        listing.typology?.name
      ),
      surfaceM2: parseNumber(property.surface),
      rooms: parseNumber(property.rooms),
      floor: pickFirst(
        featureList.find((feature) => feature.type === "floor")?.label,
        property.floor?.value
      ),
      shortDescription: property.caption || featureSummary || null,
      mainImageUrl: pickFirst(
        photo.urls?.medium,
        photo.urls?.large,
        photo.urls?.small
      ),
      advertiserName: advertiser?.displayName || null,
      advertiserType: advertiser?.label || advertiser?.type || null,
    };
  });
}

function extractSearchCards($, criteria) {
  const cards = [];

  $('a[href*="/annunci/"]').each((_, element) => {
    const externalId = extractExternalIdFromUrl($(element).attr("href"));

    if (!externalId) {
      return;
    }

    const sourceUrl = `https://www.immobiliare.it/annunci/${externalId}/`;
    const cardRoot = $(element).closest("article, li");
    const root = cardRoot.length ? cardRoot : $(element).closest("div");
    const title = root
      .find("h2, h3, [data-cy='listing-title'], [class*='Title_title']")
      .first()
      .text()
      .trim();
    const priceNode = root
      .find("[data-cy='price'], .in-listingCardPrice, [class*='price']")
      .first();
    const priceText =
      priceNode.children("span").first().text().trim() || priceNode.text().trim();
    const imageUrl =
      root.find('img[src*="pwm.im-cdn.it/image/"]').first().attr("src") ||
      root.find("img").first().attr("src") ||
      root.find("img").first().attr("data-src");
    const locationLabel = root
      .find("[data-cy='location'], [class*='location'], [class*='subtitle']")
      .first()
      .text()
      .trim();
    const description = root.find("p").first().text().trim();
    const featureLabels = root
      .find("[aria-label]")
      .map((_, item) => $(item).attr("aria-label"))
      .get();
    const rooms = featureLabels.find((label) => /\d+\s+locali?/i.test(label));
    const surface = featureLabels.find((label) => /[\d.,]+\s*m²/i.test(label));
    const floor = featureLabels.find((label) => /^piano\s+/i.test(label));

    cards.push({
      provider: "immobiliare_it",
      externalId,
      sourceUrl,
      title: title || `Annuncio ${externalId}`,
      transactionType: criteria.transactionType,
      price: parseNumber(priceText),
      pricePeriod: criteria.transactionType === "rent" ? "month" : "total",
      currency: "EUR",
      locationLabel: locationLabel || criteria.location,
      propertyType: inferPropertyType(title),
      surfaceM2: parseNumber(surface),
      rooms: parseNumber(rooms),
      floor: floor || null,
      shortDescription: description || null,
      mainImageUrl: imageUrl || null,
      advertiserName: null,
      advertiserType: null,
    });
  });

  return cards;
}

function uniqByExternalId(items) {
  return Array.from(
    new Map(items.filter(Boolean).map((item) => [item.externalId, item])).values()
  );
}

function applyMaxPrice(items, maxPrice) {
  if (!maxPrice) {
    return items;
  }

  return items.filter((item) => item.price == null || item.price <= maxPrice);
}

function inferPropertyType(title) {
  if (/^(monolocale|bilocale|trilocale|quadrilocale|appartamento)/i.test(title)) {
    return "Appartamento";
  }
  if (/^villa/i.test(title)) return "Villa";
  if (/^attico/i.test(title)) return "Attico";
  if (/^casa/i.test(title)) return "Casa";
  return null;
}

function inferRooms(title) {
  const rooms = {
    monolocale: 1,
    bilocale: 2,
    trilocale: 3,
    quadrilocale: 4,
    pentalocale: 5,
  };
  const match = title.match(
    /^(monolocale|bilocale|trilocale|quadrilocale|pentalocale)/i
  );

  return match ? rooms[match[1].toLowerCase()] : null;
}

function parseSearchMarkdown(markdown, criteria) {
  const listingPattern =
    /\[([^\]]+)\]\((https:\/\/www\.immobiliare\.it\/annunci\/(\d+)\/)(?:\s+"[^"]*")?\)/g;
  const items = [];
  let previousEnd = 0;
  let match;

  while ((match = listingPattern.exec(markdown)) !== null) {
    const chunk = markdown.slice(previousEnd, match.index);
    const prices = [...chunk.matchAll(/€\s*([\d.]+(?:,\d{1,2})?)(?:\/mese)?/g)];
    const images = [
      ...chunk.matchAll(
        /!\[[^\]]*\]\((https:\/\/pwm\.im-cdn\.it\/image\/[^)\s]+)\)/g
      ),
    ];
    const title = match[1].trim();

    items.push({
      provider: "immobiliare_it",
      externalId: match[3],
      sourceUrl: match[2],
      title,
      transactionType: criteria.transactionType,
      price: prices.length ? parseNumber(prices.at(-1)[1]) : null,
      pricePeriod: criteria.transactionType === "rent" ? "month" : "total",
      currency: "EUR",
      locationLabel: criteria.location,
      propertyType: inferPropertyType(title),
      surfaceM2: parseNumber(title.match(/([\d.,]+)\s*m²/i)?.[1]),
      rooms: inferRooms(title),
      floor:
        title.match(
          /(piano terra|primo piano|secondo piano|terzo piano|quarto piano|ultimo piano)/i
        )?.[1] || null,
      shortDescription: null,
      mainImageUrl: images[0]?.[1] || null,
      advertiserName: null,
      advertiserType: null,
    });

    previousEnd = listingPattern.lastIndex;
  }

  if (
    items.length === 0 &&
    /requiring CAPTCHA|captcha-delivery|Please enable JS/i.test(markdown)
  ) {
    throw new ProviderBlockedError(
      "Reader bloccato dalla challenge anti-bot di Immobiliare.it"
    );
  }

  const data = applyMaxPrice(uniqByExternalId(items), criteria.maxPrice);
  const totalMatch = markdown.match(/([\d.]+)\s+risultati per:/i);
  const nextPage = (criteria.page || 1) + 1;

  if (data.length === 0 && parseNumber(totalMatch?.[1]) > 0) {
    throw new InvalidProviderResponseError(
      "Reader dichiara risultati ma non espone annunci parsabili"
    );
  }

  return {
    data,
    meta: {
      page: criteria.page || 1,
      hasNextPage: new RegExp(`[?&](?:amp;)?pag=${nextPage}(?:[&#)]|$)`).test(
        markdown
      ),
      totalResults: totalMatch ? parseNumber(totalMatch[1]) : data.length,
    },
  };
}

function parseSearchHtml(html, criteria) {
  const $ = loadHtml(html);
  const jsonLd = flattenJsonLd(parseJsonLd($));
  const listItems = jsonLd
    .filter(
      (item) =>
        item &&
        (item["@type"] === "Residence" ||
          item["@type"] === "Product" ||
          item["@type"] === "Offer")
    )
    .map((item) =>
      normalizeSummaryFromJsonLd(item, {
        transactionType: criteria.transactionType,
      })
    );
  const data = applyMaxPrice(uniqByExternalId([
    ...listItems,
    ...extractSearchCards($, criteria),
    ...extractNextSearchResults($, criteria),
  ]), criteria.maxPrice);
  const totalMatch = $("body").text().match(/([\d.]+)\s+risultati/i);

  return {
    data,
    meta: {
      page: criteria.page || 1,
      hasNextPage:
        $('a[rel="next"]').length > 0 ||
        $("a")
          .toArray()
          .some(
            (element) =>
              $(element).text().trim() === String((criteria.page || 1) + 1)
          ),
      totalResults: totalMatch ? parseNumber(totalMatch[1]) : data.length || null,
    },
  };
}

async function search(criteria) {
  if (!env.allowProviderScraping) {
    throw new ProviderBlockedError();
  }

  const urls = buildSearchUrls(criteria);
  let lastError;

  for (const url of urls) {
    try {
      return await searchUrl(url, criteria);
    } catch (error) {
      lastError = error;

      if (!/404/.test(error.message) || url === urls.at(-1)) {
        throw error;
      }
    }
  }

  throw lastError;
}

async function searchUrl(url, criteria) {
  let html;

  try {
    html = await fetchHtml(url);
  } catch (error) {
    if (!(error instanceof ProviderBlockedError)) {
      throw error;
    }

    try {
      html = await fetchTranslatedHtml(url);
    } catch (translateError) {
      if (/404/.test(translateError.message)) {
        throw translateError;
      }
      return parseSearchMarkdown(await fetchReader(url), criteria);
    }
  }

  return parseSearchHtml(html, criteria);
}

function parseDetailsFromJsonLd(item, sourceUrl) {
  const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers || {};
  const address = item.address || {};
  const geo = item.geo || {};
  const images = (Array.isArray(item.image) ? item.image : [item.image])
    .filter(Boolean)
    .map((image, index) => normalizeImage(image, index))
    .filter(Boolean);

  return {
    provider: "immobiliare_it",
    externalId: extractExternalIdFromUrl(sourceUrl),
    sourceUrl,
    transactionType: null,
    propertyType: item["@type"] || null,
    title: item.name || "Annuncio Immobiliare.it",
    description: item.description || null,
    price: parseNumber(offer.price),
    pricePeriod: null,
    currency: "EUR",
    surfaceM2: null,
    rooms: null,
    bedrooms: null,
    bathrooms: null,
    floor: null,
    totalFloors: null,
    elevator: null,
    furnished: null,
    propertyCondition: null,
    heating: null,
    energyClass: null,
    condominiumFees: null,
    availability: null,
    advertiserName: null,
    advertiserType: null,
    locationLabel: pickFirst(
      address.streetAddress,
      address.addressLocality,
      address.addressRegion
    ),
    address: address.streetAddress || null,
    street: address.streetAddress || null,
    civicNumber: null,
    district: null,
    municipality: address.addressLocality || null,
    province: address.addressRegion || null,
    region: address.addressRegion || null,
    postalCode: address.postalCode || null,
    latitude: parseNumber(geo.latitude),
    longitude: parseNumber(geo.longitude),
    locationPrecision: geo.latitude && geo.longitude ? "approximate" : "unknown",
    mainImageUrl: images[0]?.imageUrl || null,
    images,
    features: {},
    rawData: item,
    sourcePublishedAt: null,
    sourceUpdatedAt: null,
  };
}

async function getDetails(sourceUrl) {
  if (!env.allowProviderScraping) {
    throw new ProviderBlockedError();
  }

  const html = await fetchHtml(sourceUrl);
  const $ = loadHtml(html);
  const jsonLd = flattenJsonLd(parseJsonLd($));
  const detailNode = jsonLd.find(
    (item) =>
      item &&
      (item["@type"] === "Residence" ||
        item["@type"] === "Product" ||
        item["@type"] === "SingleFamilyResidence")
  );

  if (!detailNode) {
    throw new InvalidProviderResponseError("Dettaglio provider non parsabile");
  }

  const details = parseDetailsFromJsonLd(detailNode, sourceUrl);

  if (!details.externalId) {
    throw new ListingNotFoundError();
  }

  return details;
}

module.exports = {
  buildSearchUrl,
  getDetails,
  normalizeLocationSuggestions,
  parseSearchHtml,
  parseSearchMarkdown,
  search,
  suggestLocations,
};
