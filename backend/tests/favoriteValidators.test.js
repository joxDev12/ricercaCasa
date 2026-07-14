const assert = require("node:assert/strict");
const test = require("node:test");
const { validationResult } = require("express-validator");
const { saveFavoriteValidators } = require("../validators/favoriteValidators");

test("accepts an aggregated Idealista listing", async () => {
  const listing = {
    provider: "idealista_it",
    externalId: "36248780",
    sourceUrl: "https://www.idealista.it/immobile/36248780/",
    transactionType: "rent",
    title: "Bilocale in Viale della Repubblica",
    price: 680,
    pricePeriod: "month",
    currency: "EUR",
    locationLabel: "Milano",
    propertyType: "Appartamento",
    surfaceM2: 57,
    rooms: 2,
    floor: "3º piano con ascensore",
    shortDescription: "Bilocale arredato",
    mainImageUrl: "https://img4.idealista.it/example.jpg",
    advertiserName: "Agenzia",
    advertiserType: "agenzia",
  };
  const request = { body: { ...listing, variants: [listing] } };

  await Promise.all(saveFavoriteValidators.map((validator) => validator.run(request)));

  assert.deepEqual(validationResult(request).array(), []);
});
