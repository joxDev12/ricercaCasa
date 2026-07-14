const { pool } = require("../config/db");
const sourceRepository = require("../models/sourceRepository");
const { getAllScrapers, getScraper } = require("../scraper");
const { aggregateSearchResults } = require("../scraper/shared/deduplication");
const { PROVIDER_CODES } = require("../scraper/shared/contracts");
const {
  ProviderUnavailableError,
  UnsupportedProviderError,
} = require("../utils/errors");

async function getActiveProvidersMap() {
  const providers = await sourceRepository.listActive(pool);
  return new Map(providers.map((provider) => [provider.code, provider]));
}

function normalizeRequestedProviders(criteria, activeProvidersMap) {
  const requested =
    criteria.providers?.length
      ? criteria.providers
      : criteria.provider
        ? [criteria.provider]
        : Array.from(activeProvidersMap.keys());
  const unique = Array.from(new Set(requested));

  if (unique.length === 0) {
    throw new UnsupportedProviderError("nessuno");
  }

  for (const provider of unique) {
    if (!PROVIDER_CODES.includes(provider)) {
      throw new UnsupportedProviderError(provider);
    }

    if (!activeProvidersMap.has(provider)) {
      throw new UnsupportedProviderError(provider);
    }
  }

  return unique;
}

async function buildCriteriaForProvider(criteria, provider) {
  const providerContext = criteria.providerContexts?.[provider] || {};
  let locationPath = providerContext.locationPath || criteria.locationPath || null;

  if (provider === "idealista_it" && !providerContext.locationPath) {
    try {
      const suggestions = await getScraper("immobiliare_it").suggestLocations(
        criteria.location,
        {}
      );
      const resolved = suggestions.find(
        (suggestion) => suggestion.providerPaths?.idealista_it
      );
      locationPath = resolved?.providerPaths.idealista_it || locationPath;
    } catch (_error) {
      // Keep generic path when autocomplete provider is unavailable.
    }
  }

  return {
    location: criteria.location,
    locationPath,
    transactionType: criteria.transactionType,
    maxPrice: criteria.maxPrice || null,
    page: criteria.pagination?.[provider] || criteria.page || 1,
  };
}

async function searchProvider(provider, criteria) {
  const scraper = getScraper(provider);
  const providerCriteria = await buildCriteriaForProvider(criteria, provider);
  const result = await scraper.search(providerCriteria);

  return {
    provider,
    data: result.data,
    meta: result.meta,
  };
}

async function search(criteria) {
  const activeProvidersMap = await getActiveProvidersMap();
  const providers = normalizeRequestedProviders(criteria, activeProvidersMap);
  const settled = await Promise.allSettled(
    providers.map(async (provider) => ({
      provider,
      ...(await searchProvider(provider, criteria)),
    }))
  );
  const successes = [];
  const failures = [];

  settled.forEach((entry, index) => {
    if (entry.status === "fulfilled") {
      successes.push(entry.value);
      return;
    }

    failures.push({
      provider: providers[index],
      error: entry.reason,
    });
  });

  if (successes.length === 0) {
    throw failures[0]?.error || new ProviderUnavailableError();
  }

  const aggregated = aggregateSearchResults(
    successes.flatMap((result) => result.data)
  );
  const providersMeta = Object.fromEntries(
    providers.map((provider) => {
      const success = successes.find((item) => item.provider === provider);
      const failure = failures.find((item) => item.provider === provider);

      if (success) {
        return [
          provider,
          {
            status: "success",
            count: success.data.length,
            page: success.meta.page,
            hasNextPage: success.data.length > 0 && success.meta.hasNextPage,
            totalResults: success.meta.totalResults,
          },
        ];
      }

      return [
        provider,
        {
          status: "failed",
          code: failure?.error?.code || "PROVIDER_UNAVAILABLE",
          message: failure?.error?.message || "Provider non disponibile",
        },
      ];
    })
  );
  const warnings = failures.map((failure) => failure.error.message);

  return {
    data: aggregated,
    meta: {
      page: criteria.page || 1,
      hasNextPage: successes.some(
        (item) => item.data.length > 0 && item.meta.hasNextPage
      ),
      totalResults: aggregated.length,
      providers: providersMeta,
      warnings,
    },
  };
}

async function suggestLocations(query, context, providers = []) {
  const activeProvidersMap = await getActiveProvidersMap();
  const requested = providers.length
    ? providers.filter((provider) => activeProvidersMap.has(provider))
    : [];
  const preferredProvider =
    requested.length === 1 && getAllScrapers()[requested[0]]?.suggestLocations
      ? requested[0]
      : "immobiliare_it";

  return getScraper(preferredProvider).suggestLocations(query, context);
}

module.exports = { search, suggestLocations };
