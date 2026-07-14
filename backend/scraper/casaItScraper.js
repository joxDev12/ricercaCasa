const { env } = require("../config/env");
const {
  InvalidProviderResponseError,
  ListingNotFoundError,
  ProviderBlockedError,
} = require("../utils/errors");
const { fetchReader } = require("./shared/requestClient");
const {
  parseCoordinate,
  parseNumber,
  pickTextMatches,
  slugifyLocation,
} = require("./shared/normalizers");

const detailsCache = new Map();

function extractExternalId(sourceUrl) {
  const match = String(sourceUrl).match(/immobili\/(\d+)/);
  return match ? match[1] : null;
}

function validateSourceUrl(sourceUrl) {
  return /^https:\/\/www\.casa\.it\/immobili\/\d+\/?$/i.test(String(sourceUrl));
}

function inferPropertyType(title) {
  if (/villa|villino|casa indipendente/i.test(title)) return "Villa";
  if (/attico/i.test(title)) return "Attico";
  if (/appartamento|bilocale|trilocale|quadrilocale|monolocale/i.test(title)) {
    return "Appartamento";
  }
  return null;
}

function extractCitySlug(criteria) {
  if (criteria.locationPath) {
    return String(criteria.locationPath).split("/")[0];
  }

  const parts = String(criteria.location || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return slugifyLocation(parts.at(-1) || criteria.location);
}

function buildSearchUrl(criteria) {
  const transactionSegment =
    criteria.transactionType === "rent" ? "affitto" : "vendita";
  const url = new URL(
    `https://www.casa.it/${transactionSegment}/residenziale/${extractCitySlug(criteria)}/`
  );

  if (criteria.page && criteria.page > 1) {
    url.searchParams.set("page", String(criteria.page));
  }

  return url.toString();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanText(value) {
  return String(value || "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function isGenericImageTitle(value) {
  return /^(?:vista|cucina|soggiorno|salone|camera|bagno|esterno|facciata|terrazzo|balcone|immagine)(?:\s+\d+)?$/i.test(
    cleanText(value)
  );
}

function parseFloor(chunk) {
  return chunk.match(/(piano terra|piano rialzato|ultimo piano|\d+[°º]\s*piano)/i)?.[1] || null;
}

function parseDescription(chunk) {
  return (
    chunk
      .split("\n")
      .map(cleanText)
      .filter(Boolean)
      .find(
        (line) =>
          !/^\d+\/\d+$/.test(line) &&
          !/^€/.test(line) &&
          !/m²|local\s*i|bagn\s*o|piano/i.test(line) &&
          !/^(salva|condividi|contatta)$/i.test(line) &&
          line.length > 35
      ) || null
  );
}

function parseSearchCards(markdown, criteria) {
  const imageLinkPattern =
    /\[!\[Image\s+\d+:\s*([^\]]*)\]\((https:\/\/images-[^)]+)\)\]\((https:\/\/www\.casa\.it\/immobili\/(\d+)\/?)\)/g;
  const matches = [...markdown.matchAll(imageLinkPattern)];

  return matches.map((match, index) => {
    const nextStart = matches[index + 1]?.index || markdown.length;
    const chunk = markdown.slice(match.index + match[0].length, nextStart);
    const sourceUrl = `https://www.casa.it/immobili/${match[4]}/`;
    const before = markdown.slice(Math.max(0, match.index - 600), match.index);
    const plainLinks = [
      ...before.matchAll(
        new RegExp(`\\[([^\\]]+)\\]\\(${escapeRegExp(sourceUrl)}(?:\\s+"[^"]*")?\\)`, "g")
      ),
    ];
    const plainTitle = cleanText(plainLinks.at(-1)?.[1]);
    const imageTitle = cleanText(match[1]);
    const title =
      plainTitle ||
      (!isGenericImageTitle(imageTitle) ? imageTitle : null) ||
      `Annuncio ${match[4]}`;

    return {
      provider: "casa_it",
      externalId: match[4],
      sourceUrl,
      title,
      transactionType: criteria.transactionType,
      price: parseNumber(chunk.match(/€\s*([\d.]+(?:,\d{1,2})?)/)?.[1]),
      pricePeriod: criteria.transactionType === "rent" ? "month" : "total",
      currency: "EUR",
      locationLabel: criteria.location,
      propertyType: inferPropertyType(title),
      surfaceM2: parseNumber(chunk.match(/([\d.]+(?:,\d+)?)\s*m²/i)?.[1]),
      rooms: parseNumber(chunk.match(/(\d+)\s*local\s*i/i)?.[1]),
      floor: parseFloor(chunk),
      shortDescription: parseDescription(chunk),
      mainImageUrl: match[2],
      advertiserName: null,
      advertiserType: null,
    };
  });
}

function readFeature(markdown, label) {
  const pattern = new RegExp(
    `^\\*[ \\t]+${escapeRegExp(label)}[ \\t]*\\r?\\n(?:[ \\t]*\\r?\\n)?[ \\t]*([^\\r\\n]+)`,
    "mi"
  );
  return cleanText(markdown.match(pattern)?.[1]) || null;
}

function parseBoolean(value) {
  if (!value) return null;
  if (/^(?:sì|si|yes)$/i.test(value)) return true;
  if (/^(?:no)$/i.test(value)) return false;
  return null;
}

function parsePrice(value) {
  const text = String(value || "");
  return parseNumber(
    text.match(/€\s*([\d.]+(?:,\d{1,2})?)/)?.[1] ||
      text.match(/([\d.]+(?:,\d{1,2})?)\s*€/i)?.[1]
  );
}

function parseDetailsMarkdown(markdown, sourceUrl) {
  const externalId = extractExternalId(sourceUrl);
  const title = cleanText(
    markdown.match(/^#\s+(.+)$/m)?.[1] || markdown.match(/^Title:\s*(.+)$/m)?.[1]
  );

  if (!externalId || !title) {
    throw new InvalidProviderResponseError("Dettaglio Casa.it non parsabile");
  }

  const summary = markdown.slice(markdown.indexOf(`# ${title}`), markdown.indexOf("Italiano"));
  const languageBlock = /Italiano(?:\s*\n+\s*(?:English|Español|Deutsch|Français|Português))*\s*\n+/i.exec(markdown);
  const descriptionBody = languageBlock
    ? markdown.slice(languageBlock.index + languageBlock[0].length)
    : "";
  const description = cleanText(descriptionBody.split(/\n\s*Leggi tutto/i)[0]);
  const positionSection = markdown.split(/##\s+Posizione e servizi/i)[1]?.split(/###\s+/)[0] || "";
  const address = cleanText(
    positionSection.match(/^([^\n]+,\s*[^\n]+\([A-Z]{2}\))\s*$/m)?.[1]
  );
  const addressLine = address.replace(/\s*\([A-Z]{2}\)$/, "");
  const addressParts = addressLine.split(",").map((part) => part.trim()).filter(Boolean);
  const streetAddress = addressParts[0] || null;
  const municipality = addressParts.at(-1) || title.match(/\ba\s+([^,]+)$/i)?.[1] || null;
  const streetMatch = streetAddress?.match(/^(.*?)(?:\s+(\d+[\w/-]*))?$/);
  const districtLines = positionSection
    .split("\n")
    .map(cleanText)
    .filter(Boolean);
  const addressIndex = districtLines.indexOf(address);
  const district = addressIndex >= 0 ? districtLines[addressIndex + 1] || null : null;
  const images = Array.from(
    new Map(
      [...markdown.matchAll(/!\[Image\s+\d+:\s*([^\]]*)\]\((https:\/\/images-[^)]+\/listing\/[^)]+)\)/g)].map(
        (match) => [match[2], { altText: cleanText(match[1]), imageUrl: match[2] }]
      )
    ).values()
  ).map((image, position) => ({ ...image, position, isPrimary: position === 0 }));
  const visibleFeatures = [
    readFeature(markdown, "Altre caratteristiche"),
    readFeature(markdown, "Aria condizionata") === "sì" ? "aria condizionata" : null,
  ].filter(Boolean);
  const advertiserSection = markdown.split(/Contatta l'agenzia/i)[1] || "";
  const advertiserName = advertiserSection
    .split("\n")
    .map(cleanText)
    .find((line) => line && !/^\*|premendo|invia|chiama|rif\./i.test(line));
  const transactionType = /\baffitto\b/i.test(title) ? "rent" : "sale";
  const propertyCondition = readFeature(markdown, "Condizioni immobile");
  const energyClass = readFeature(markdown, "Classe energetica")?.split(/\s+/)[0] || null;

  return {
    provider: "casa_it",
    externalId,
    sourceUrl,
    transactionType,
    propertyType: inferPropertyType(title),
    title,
    description: description || null,
    price: parsePrice(summary),
    pricePeriod: transactionType === "rent" ? "month" : "total",
    currency: "EUR",
    surfaceM2: parseNumber(readFeature(markdown, "Superficie")),
    rooms: parseNumber(readFeature(markdown, "Locali")),
    bedrooms: null,
    bathrooms: parseNumber(readFeature(markdown, "Bagni")),
    floor: readFeature(markdown, "Piano"),
    totalFloors: null,
    elevator: parseBoolean(readFeature(markdown, "Ascensore")),
    furnished: /arredat/i.test(readFeature(markdown, "Arredamento") || "") || null,
    propertyCondition,
    heating: readFeature(markdown, "Riscaldamento"),
    energyClass,
    condominiumFees: parseNumber(readFeature(markdown, "Spese condominiali")),
    availability: readFeature(markdown, "Disponibilità"),
    advertiserName: advertiserName || null,
    advertiserType: advertiserName ? "agency" : null,
    locationLabel: [streetAddress, district, municipality].filter(Boolean).join(", "),
    address: addressLine || null,
    street: streetMatch?.[1] || null,
    civicNumber: streetMatch?.[2] || null,
    district,
    municipality,
    province: address.match(/\(([A-Z]{2})\)$/)?.[1] || null,
    region: null,
    postalCode: null,
    latitude: parseCoordinate(markdown.match(/cbll=([\d.]+),([\d.]+)/)?.[1], 90),
    longitude: parseCoordinate(markdown.match(/cbll=([\d.]+),([\d.]+)/)?.[2], 180),
    locationPrecision: address ? "exact" : "unknown",
    mainImageUrl: images[0]?.imageUrl || null,
    images,
    features: { items: visibleFeatures },
    rawData: { source: "reader" },
    sourcePublishedAt: null,
    sourceUpdatedAt: null,
  };
}

async function getDetails(sourceUrl) {
  if (!env.allowProviderScraping) throw new ProviderBlockedError();
  if (!validateSourceUrl(sourceUrl)) throw new ListingNotFoundError();

  if (!detailsCache.has(sourceUrl)) {
    const request = fetchReader(sourceUrl)
      .then((markdown) => parseDetailsMarkdown(markdown, sourceUrl))
      .catch((error) => {
        detailsCache.delete(sourceUrl);
        throw error;
      });
    detailsCache.set(sourceUrl, request);
  }

  return detailsCache.get(sourceUrl);
}

async function mapConcurrent(items, worker, concurrency = 2) {
  const output = new Array(items.length);
  let cursor = 0;

  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      output[index] = await worker(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return output;
}

function applyCriteria(items, criteria) {
  const queryParts = String(criteria.location || "").split(",").map((part) => part.trim()).filter(Boolean);
  const specificTokens = queryParts.slice(0, -1).join(" ").split(/\s+/).filter((token) => token.length >= 3);
  const maxPrice = criteria.maxPrice ? Number(criteria.maxPrice) : null;

  return items.filter((item) => {
    if (maxPrice && item.price != null && item.price > maxPrice) return false;
    if (!specificTokens.length) return true;
    const haystack = [item.title, item.locationLabel, item.shortDescription].join(" ");
    return specificTokens.some((token) => pickTextMatches(haystack, token));
  });
}

async function search(criteria) {
  if (!env.allowProviderScraping) throw new ProviderBlockedError();

  const markdown = await fetchReader(buildSearchUrl(criteria));
  const summaries = parseSearchCards(markdown, criteria);

  if (!summaries.length && /Please enable JS and disable any ad blocker/i.test(markdown)) {
    throw new ProviderBlockedError("Casa.it sta bloccando richieste automatiche con challenge anti-bot");
  }

  const maxPrice = criteria.maxPrice ? Number(criteria.maxPrice) : null;
  const withinBudget = summaries.filter(
    (summary) => !maxPrice || summary.price == null || summary.price <= maxPrice
  );
  const enriched = await mapConcurrent(withinBudget, async (summary) => {
    try {
      const details = await getDetails(summary.sourceUrl);
      const merged = { ...summary };

      for (const [key, value] of Object.entries(details)) {
        if (value !== null && value !== undefined && value !== "") merged[key] = value;
      }

      merged.shortDescription = details.description || summary.shortDescription;
      merged.transactionType = criteria.transactionType;
      merged.pricePeriod = criteria.transactionType === "rent" ? "month" : "total";
      return merged;
    } catch (_error) {
      return summary;
    }
  });
  const data = applyCriteria(enriched, criteria);

  return {
    data,
    meta: {
      page: criteria.page || 1,
      hasNextPage: new RegExp(`[?&]page=${(criteria.page || 1) + 1}(?:[&#)]|$)`).test(markdown),
      totalResults: data.length || null,
    },
  };
}

async function suggestLocations() {
  return [];
}

module.exports = {
  buildSearchUrl,
  code: "casa_it",
  extractExternalId,
  getDetails,
  parseDetailsMarkdown,
  parseSearchCards,
  search,
  suggestLocations,
  validateSourceUrl,
};
