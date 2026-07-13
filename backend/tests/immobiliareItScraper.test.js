const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildSearchUrl,
  normalizeLocationSuggestions,
  parseSearchHtml,
  parseSearchMarkdown,
} = require("../scraper/immobiliareItScraper");

const criteria = {
  location: "Senigallia",
  transactionType: "rent",
  page: 1,
};

test("parses Reader search results", () => {
  const markdown = `
16 risultati per:
* ![Image](https://pwm.im-cdn.it/image/1968702844/xxs-c.jpg)
€ 1.000/mese [Trilocale 80 m², Senigallia](https://www.immobiliare.it/annunci/130911664/ "Trilocale 80 m², Senigallia")
`;

  const result = parseSearchMarkdown(markdown, criteria);

  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].externalId, "130911664");
  assert.equal(result.data[0].price, 1000);
  assert.equal(result.data[0].surfaceM2, 80);
  assert.equal(result.data[0].rooms, 3);
  assert.equal(result.meta.totalResults, 16);
});

test("rejects an empty Reader CAPTCHA response", () => {
  assert.throws(
    () =>
      parseSearchMarkdown(
        "Warning: This page maybe requiring CAPTCHA. Markdown Content:",
        criteria
      ),
    { code: "PROVIDER_BLOCKED" }
  );
});

test("parses translated sale cards", () => {
  const html = `
    <div>247 risultati</div>
    <ul data-cy="listing-search-results">
      <li id="129175770">
        <img src="https://pwm.im-cdn.it/image/1926675006/xxs-c.jpg">
        <div class="Price_price__kHY5L"><span>€ 240.000</span></div>
        <a class="Title_title__kPgMu"
           href="https://www-immobiliare-it.translate.goog/annunci/129175770/">
          Trilocale viale Giordano Bruno, Senigallia
        </a>
        <div aria-label="3 locali"></div>
        <div aria-label="75 m²"></div>
        <div aria-label="Piano 2"></div>
      </li>
    </ul>`;

  const result = parseSearchHtml(html, {
    ...criteria,
    transactionType: "sale",
  });

  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].sourceUrl, "https://www.immobiliare.it/annunci/129175770/");
  assert.equal(result.data[0].price, 240000);
  assert.equal(result.data[0].surfaceM2, 75);
  assert.equal(result.data[0].rooms, 3);
  assert.equal(result.meta.totalResults, 247);
});

test("parses rich Next.js results and enforces max price", () => {
  const nextData = {
    props: {
      pageProps: {
        dehydratedState: {
          queries: [
            {
              state: {
                data: {
                  results: [
                    {
                      realEstate: {
                        id: 129204970,
                        title: "Monolocale via Francesco Podesti, Senigallia",
                        price: { value: 390 },
                        typology: { name: "Monolocale" },
                        advertiser: {
                          agency: {
                            displayName: "Agenzia Artecasa",
                            label: "agenzia",
                          },
                        },
                        properties: [
                          {
                            surface: "20 m²",
                            rooms: "1",
                            ga4Condition: "Buono / Abitabile",
                            ga4Heating: "Autonomo",
                            ga4features: ["arredato"],
                            typologyGA4Translation: "Appartamento",
                            location: {
                              address: "Via Francesco Podesti",
                              macrozone: "Saline",
                              city: "Senigallia",
                            },
                            featureList: [
                              { type: "floor", label: "Piano 5" },
                            ],
                            photo: {
                              urls: {
                                medium:
                                  "https://pwm.im-cdn.it/image/1927362724/m-c.jpg",
                              },
                            },
                          },
                        ],
                      },
                    },
                    {
                      realEstate: {
                        id: 130000000,
                        title: "Annuncio oltre budget",
                        price: { value: 620 },
                        properties: [{}],
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      },
    },
  };
  const html = `
    <div>2 risultati</div>
    <article>
      <a href="https://www.immobiliare.it/annunci/129204970/">
        <h2>Riepilogo HTML incompleto</h2>
      </a>
    </article>
    <script id="__NEXT_DATA__" type="application/json">
      ${JSON.stringify(nextData)}
    </script>`;

  const result = parseSearchHtml(html, { ...criteria, maxPrice: 600 });

  assert.equal(result.data.length, 1);
  assert.deepEqual(result.data[0], {
    provider: "immobiliare_it",
    externalId: "129204970",
    sourceUrl: "https://www.immobiliare.it/annunci/129204970/",
    title: "Monolocale via Francesco Podesti, Senigallia",
    transactionType: "rent",
    price: 390,
    pricePeriod: "month",
    currency: "EUR",
    locationLabel: "Via Francesco Podesti, Saline, Senigallia",
    propertyType: "Appartamento",
    surfaceM2: 20,
    rooms: 1,
    floor: "Piano 5",
    shortDescription:
      "Buono / Abitabile, Riscaldamento autonomo, arredato",
    mainImageUrl: "https://pwm.im-cdn.it/image/1927362724/m-c.jpg",
    advertiserName: "Agenzia Artecasa",
    advertiserType: "agenzia",
  });
});

test("normalizes city, neighborhood and road suggestions", () => {
  const items = [
    {
      id: "297",
      type: 6,
      label: "Vomero",
      keyurl: "vomero",
      parents: [{ id: "5685", type: 2, label: "Napoli", keyurl: "Napoli" }],
    },
  ];

  const suggestions = normalizeLocationSuggestions(
    items,
    "Viale Raffaello Vomero"
  );

  assert.equal(suggestions[0].displayLabel, "Viale Raffaello, Napoli");
  assert.equal(suggestions[0].path, "napoli/in-viale-raffaello");
  assert.equal(suggestions[1].displayLabel, "Vomero, Napoli");
  assert.equal(suggestions[1].path, "napoli/vomero");
  assert.equal(
    normalizeLocationSuggestions([], "Via Raffaello", { label: "Napoli" })[0]
      .path,
    "napoli/in-via-raffaello"
  );
  assert.match(
    buildSearchUrl({
      location: suggestions[0].displayLabel,
      locationPath: suggestions[0].path,
      transactionType: "rent",
      page: 1,
    }),
    /affitto-case\/napoli\/in-viale-raffaello\/$/
  );
});
