const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildSearchUrl,
  findSpecificLocationUrl,
  parseSearchHtml,
} = require("../scraper/idealistaItScraper");

const criteria = {
  location: "Mugnano, Perugia",
  locationPath: "perugia-perugia",
  transactionType: "rent",
  maxPrice: 500,
  page: 1,
};

const html = `
  <h1 id="h1-container"><span id="h1-container__text">2 case in affitto</span></h1>
  <li class="breadcrumb-dropdown-subitem-element-list">
    <a href="https://www-idealista-it.translate.goog/affitto-case/perugia/fontignano-mugnano/con-prezzo_500/?_x_tr_sl=it&amp;_x_tr_tl=en">
      Fontignano - Mugnano
    </a>
  </li>
  <article class="item" data-element-id="36248780">
    <picture class="item-multimedia"><img src="https://img4.idealista.it/blur/480_360_mq/example.jpg"></picture>
    <div class="item-info-container">
      <picture class="logo-branding"><a title="Agenzia Uno"></a></picture>
      <a class="item-link" title="Bilocale in via Roma, Mugnano, Perugia"></a>
      <span class="item-price">450<span>€/mese</span></span>
      <div class="item-detail-char">
        <span class="item-detail">2 locali</span>
        <span class="item-detail">65 m²</span>
        <span class="item-detail">1º piano con ascensore</span>
      </div>
      <div class="item-description"><p>Appartamento arredato con terrazzo.</p></div>
    </div>
  </article>
  <article class="item" data-element-id="36248781">
    <a class="item-link" title="Trilocale oltre budget"></a>
    <span class="item-price">650 €/mese</span>
  </article>
  <div class="pagination"><li class="next"><a href="lista-2.htm">Avanti</a></li></div>`;

test("builds filtered Idealista URLs", () => {
  assert.equal(
    buildSearchUrl(criteria),
    "https://www.idealista.it/affitto-case/perugia-perugia/con-prezzo_500/"
  );
});

test("builds paginated Idealista URLs", () => {
  assert.equal(
    buildSearchUrl({ ...criteria, page: 2 }),
    "https://www.idealista.it/affitto-case/perugia-perugia/con-prezzo_500/lista-2.htm"
  );
});

test("parses translated Idealista cards and enforces max price", () => {
  const result = parseSearchHtml(html, criteria);

  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].externalId, "36248780");
  assert.equal(result.data[0].price, 450);
  assert.equal(result.data[0].surfaceM2, 65);
  assert.equal(result.data[0].rooms, 2);
  assert.equal(result.data[0].advertiserName, "Agenzia Uno");
  assert.equal(result.meta.totalResults, 2);
  assert.equal(result.meta.hasNextPage, true);
});

test("finds specific zone URL in translated breadcrumbs", () => {
  assert.equal(
    findSpecificLocationUrl(html, criteria),
    "https://www.idealista.it/affitto-case/perugia/fontignano-mugnano/con-prezzo_500/"
  );
});

test("paginates specific Idealista zone URLs", () => {
  assert.equal(
    findSpecificLocationUrl(html, { ...criteria, page: 2 }),
    "https://www.idealista.it/affitto-case/perugia/fontignano-mugnano/con-prezzo_500/lista-2.htm"
  );
});

test("filters a zone from city results when Idealista zone page is missing", () => {
  const cityHtml = `
    <article class="item" data-element-id="1">
      <a class="item-link" title="Bilocale in Strada Prima, Cesano, Senigallia"></a>
      <span class="item-price">550 €/mese</span>
      <div class="item-description"><p>Appartamento arredato a Cesano.</p></div>
    </article>
    <article class="item" data-element-id="2">
      <a class="item-link" title="Bilocale in Via Roma, Centro, Senigallia"></a>
      <span class="item-price">500 €/mese</span>
    </article>`;
  const result = parseSearchHtml(cityHtml, {
    ...criteria,
    location: "Cesano, Senigallia",
    locationPath: "senigallia-ancona",
    maxPrice: 600,
  });

  assert.equal(result.data.length, 1);
  assert.match(result.data[0].title, /Cesano/);
});
