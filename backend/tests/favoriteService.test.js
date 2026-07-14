const assert = require("node:assert/strict");
const test = require("node:test");
const {
  normalizeFavoriteInput,
  saveFavorite,
} = require("../services/favoriteService");

test("normalizes a search result for persistence", () => {
  const result = normalizeFavoriteInput({
    externalId: "129175770",
    sourceUrl: "https://www.immobiliare.it/annunci/129175770/",
    transactionType: "sale",
    title: "Trilocale a Senigallia",
    price: 240000,
    pricePeriod: "total",
    currency: "EUR",
    locationLabel: "Senigallia",
    latitude: 43719754,
    longitude: 92346,
    mainImageUrl: "https://pwm.im-cdn.it/image/1926675006/xxs-c.jpg",
  });

  assert.equal(result.description, null);
  assert.equal(result.price, 240000);
  assert.equal(result.images.length, 1);
  assert.equal(result.images[0].isPrimary, true);
  assert.equal(result.latitude, null);
  assert.equal(result.longitude, null);
});

test("rejects multiple listings from the same provider in one favorite", async () => {
  await assert.rejects(
    saveFavorite({
      variants: [
        { provider: "immobiliare_it", externalId: "1" },
        { provider: "immobiliare_it", externalId: "2" },
      ],
    }),
    /stesso provider/
  );
});
