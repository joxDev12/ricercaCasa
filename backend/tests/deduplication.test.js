const assert = require("node:assert/strict");
const test = require("node:test");
const { aggregateSearchResults } = require("../scraper/shared/deduplication");

test("groups the same listing published by Immobiliare.it and Casa.it", () => {
  const shared = {
    transactionType: "rent",
    price: 390,
    surfaceM2: 20,
    rooms: 1,
    propertyType: "Appartamento",
    advertiserName: "Agenzia Artecasa Immobiliare",
  };
  const results = aggregateSearchResults([
    {
      ...shared,
      provider: "immobiliare_it",
      externalId: "129204970",
      title: "Monolocale via Francesco Podesti, Saline, Senigallia",
      locationLabel: "Via Francesco Podesti, Saline, Senigallia",
      shortDescription: "A pochi passi dal centro e dal mare",
    },
    {
      ...shared,
      provider: "casa_it",
      externalId: "54394631",
      title: "Monolocale in Affitto in Via Francesco Podesti a Senigallia",
      locationLabel: "Via Francesco Podesti, Lungomare di Levante, Senigallia",
      shortDescription:
        "Zona rotonda mare, monolocale al quinto piano a due passi dal centro mare e centro storico",
    },
  ]);

  assert.equal(results.length, 1);
  assert.equal(results[0].sourceCount, 2);
  assert.deepEqual(results[0].providers, ["immobiliare_it", "casa_it"]);
});

test("keeps different listings separate when only price and size match", () => {
  const results = aggregateSearchResults([
    {
      provider: "immobiliare_it",
      externalId: "1",
      transactionType: "rent",
      title: "Bilocale via Roma, Senigallia",
      locationLabel: "Via Roma, Senigallia",
      shortDescription: "Centro storico con balcone",
      price: 700,
      surfaceM2: 50,
      rooms: 2,
    },
    {
      provider: "casa_it",
      externalId: "2",
      transactionType: "rent",
      title: "Bilocale via Verdi, Senigallia",
      locationLabel: "Via Verdi, Senigallia",
      shortDescription: "Zona mare con giardino",
      price: 700,
      surfaceM2: 50,
      rooms: 2,
    },
  ]);

  assert.equal(results.length, 2);
});

test("never groups different listings from the same provider", () => {
  const shared = {
    provider: "immobiliare_it",
    transactionType: "rent",
    title: "Appartamento via Pienza 54, Centro, Potenza",
    locationLabel: "Via Pienza 54, Centro, Potenza",
    shortDescription: "Appartamento con balcone in strada privata",
    price: 800,
    surfaceM2: 90,
    rooms: 4,
    mainImageUrl: "https://pwm.im-cdn.it/image/same.jpg",
  };
  const results = aggregateSearchResults([
    { ...shared, externalId: "1" },
    { ...shared, externalId: "2", price: 850 },
  ]);

  assert.equal(results.length, 2);
});

test("never groups rent and sale listings", () => {
  const listing = {
    title: "Bilocale via Roma, Senigallia",
    locationLabel: "Via Roma, Senigallia",
    shortDescription: "Stesso appartamento arredato con balcone",
    price: 700,
    surfaceM2: 50,
    rooms: 2,
  };
  const results = aggregateSearchResults([
    { ...listing, provider: "immobiliare_it", externalId: "1", transactionType: "rent" },
    { ...listing, provider: "casa_it", externalId: "2", transactionType: "sale" },
  ]);

  assert.equal(results.length, 2);
});

test("groups the same listing when titles differ but details and descriptions agree", () => {
  const shared = {
    transactionType: "rent",
    price: 350,
    surfaceM2: 25,
    rooms: 1,
    advertiserName: "Innova Immobiliare",
  };
  const results = aggregateSearchResults([
    {
      ...shared,
      provider: "immobiliare_it",
      externalId: "1",
      title: "Loft piazza XXI Aprile 19, Isola delle Femmine",
      locationLabel: "Piazza XXI Aprile, Isola delle Femmine",
      shortDescription: "Monolocale arredato a 200m dal mare - Isola delle Femmine",
    },
    {
      ...shared,
      provider: "idealista_it",
      externalId: "2",
      title: "Monolocale in Piazza 21 Aprile, 19, Isola delle Femmine",
      locationLabel: "Isola delle Femmine",
      shortDescription:
        "A Isola delle Femmine, a soli 200 metri dal mare, Innova Immobiliare propone in locazione",
    },
  ]);

  assert.equal(results.length, 1);
  assert.equal(results[0].sourceCount, 2);
});

test("uses canonical image URLs as a strong duplicate signal", () => {
  const shared = {
    transactionType: "rent",
    locationLabel: "Isola delle Femmine",
    price: 350,
    surfaceM2: 25,
    rooms: 1,
  };
  const results = aggregateSearchResults([
    {
      ...shared,
      provider: "casa_it",
      externalId: "1",
      title: "Loft vicino al mare",
      mainImageUrl: "https://images.example/360x265/listing/home.jpg?cache=1",
    },
    {
      ...shared,
      provider: "idealista_it",
      externalId: "2",
      title: "Monolocale arredato",
      mainImageUrl: "https://images.example/800x600/listing/home.jpg",
    },
  ]);

  assert.equal(results.length, 1);
});
