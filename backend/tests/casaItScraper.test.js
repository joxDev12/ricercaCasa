const assert = require("node:assert/strict");
const test = require("node:test");
const {
  parseDetailsMarkdown,
  parseSearchCards,
} = require("../scraper/casaItScraper");

const criteria = {
  location: "Milano",
  transactionType: "rent",
  page: 1,
};

test("parses one Casa.it card when title and image share the same URL", () => {
  const markdown = `
[Bilocale in Affitto in Via Verro 33 a Milano](https://www.casa.it/immobili/53788641/)
[![Image 10: Cucina](https://images-1.casa.it/360x265/listing/example.jpg)](https://www.casa.it/immobili/53788641/)
1/20
€900
41 m² 2 local i 1 bagn o 2° piano
Bilocale luminoso completamente arredato con ascensore e portineria.
`;

  const result = parseSearchCards(markdown, criteria);

  assert.equal(result.length, 1);
  assert.equal(result[0].title, "Bilocale in Affitto in Via Verro 33 a Milano");
  assert.equal(result[0].price, 900);
  assert.equal(result[0].shortDescription.includes("!["), false);
});

test("parses rich Casa.it listing details", () => {
  const sourceUrl = "https://www.casa.it/immobili/53788641/";
  const markdown = `
Title: Bilocale in Affitto in Via Bernardino Verro 33 a Milano
# Bilocale in Affitto in Via Bernardino Verro 33 a Milano
Morivione
€900
41 m²
2 local i
1 bagn o
2° piano
D
![Image 3: Vista](https://images-1.casa.it/360x275/listing/example.jpg)
Italiano
English
Descrizione completa e corretta dell'immobile, arredata e luminosa.
Leggi tutto
Caratteristiche
*   Superficie

41 m²
*   Locali

2
*   Bagni

1
*   Piano

2°
*   Ascensore

sì
*   Arredamento

completamente arredato
*   Condizioni immobile

abitabile
*   Riscaldamento

centralizzato
*   Classe energetica

D D.M. 26/06/2015
*   Spese condominiali

€ 200 /mese
## Posizione e servizi
[StreetView](https://maps.google.com/maps?cbll=45.43982,9.190475)
Via Bernardino Verro 33, Milano (MI)
Ripamonti, Vigentino
### Vicino a:
Contatta l'agenzia
Cozy House
`;

  const result = parseDetailsMarkdown(markdown, sourceUrl);

  assert.equal(result.title, "Bilocale in Affitto in Via Bernardino Verro 33 a Milano");
  assert.equal(result.surfaceM2, 41);
  assert.equal(result.bathrooms, 1);
  assert.equal(result.elevator, true);
  assert.equal(result.furnished, true);
  assert.equal(result.condominiumFees, 200);
  assert.equal(result.advertiserName, "Cozy House");
  assert.equal(result.images.length, 1);
});
