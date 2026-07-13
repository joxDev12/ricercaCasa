const { env } = require("../../config/env");
const {
  ProviderBlockedError,
  ProviderUnavailableError,
  ScrapingTimeoutError,
} = require("../../utils/errors");

async function fetchHtml(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), env.scrapeTimeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        "accept-language": "it-IT,it;q=0.9,en;q=0.8",
        "user-agent": "RicercaCasaBot/1.0 (+local development)",
      },
      signal: controller.signal,
    });

    const html = await response.text();

    if (
      response.status === 403 &&
      /captcha-delivery|Please enable JS and disable any ad blocker/i.test(html)
    ) {
      throw new ProviderBlockedError(
        "Immobiliare.it sta bloccando richieste automatiche con challenge anti-bot"
      );
    }

    if (!response.ok) {
      throw new ProviderUnavailableError(
        `Provider ha risposto ${response.status}`
      );
    }

    return html;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ScrapingTimeoutError();
    }

    if (
      error instanceof ProviderUnavailableError ||
      error instanceof ProviderBlockedError
    ) {
      throw error;
    }

    throw new ProviderUnavailableError(error.message);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchReader(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    Math.max(env.scrapeTimeoutMs, 30000)
  );

  try {
    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: { accept: "text/plain" },
      signal: controller.signal,
    });
    const markdown = await response.text();

    if (!response.ok) {
      throw new ProviderUnavailableError(
        `Reader provider ha risposto ${response.status}`
      );
    }

    return markdown;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ScrapingTimeoutError("Timeout reader provider");
    }

    if (error instanceof ProviderUnavailableError) {
      throw error;
    }

    throw new ProviderUnavailableError(error.message);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchTranslatedHtml(url) {
  const source = new URL(url);
  const translated = new URL(
    `https://www-immobiliare-it.translate.goog${source.pathname}`
  );

  source.searchParams.forEach((value, key) => {
    translated.searchParams.set(key, value);
  });
  translated.searchParams.set("_x_tr_sl", "it");
  translated.searchParams.set("_x_tr_tl", "en");
  translated.searchParams.set("_x_tr_hl", "en");

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    Math.max(env.scrapeTimeoutMs, 30000)
  );

  try {
    const response = await fetch(translated, {
      headers: {
        "accept-language": "it-IT,it;q=0.9,en;q=0.8",
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/138.0.0.0 Safari/537.36",
      },
      signal: controller.signal,
    });
    const html = await response.text();

    if (!response.ok) {
      throw new ProviderUnavailableError(
        `Translate provider ha risposto ${response.status}`
      );
    }

    return html;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ScrapingTimeoutError("Timeout translate provider");
    }

    if (error instanceof ProviderUnavailableError) {
      throw error;
    }

    throw new ProviderUnavailableError(error.message);
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = { fetchHtml, fetchReader, fetchTranslatedHtml };
