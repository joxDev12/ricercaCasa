# RicercaCasa — V1 Analisi Funzionale

**Versione documento:** 1.0  
**Data:** 13 luglio 2026  
**Branch di riferimento:** `dev-jox`  
**Stato:** proposta funzionale approvabile

---

## 1. Obiettivo del progetto

RicercaCasa deve consentire all'utente di cercare annunci immobiliari pubblicati su portali esterni, visualizzarli in un'interfaccia chiara e salvare nel database gli annunci ritenuti interessanti.

La V1 integra un solo portale:

- `immobiliare.it`

L'architettura deve però essere predisposta per aggiungere in futuro altri portali senza modificare la logica di business già esistente.

La V1 deve offrire:

1. ricerca per zona;
2. scelta tra affitto e compravendita;
3. filtro per prezzo massimo;
4. visualizzazione dei risultati tramite card;
5. apertura del collegamento originale;
6. salvataggio di un annuncio tra i preferiti;
7. recupero e persistenza dei dettagli completi disponibili al momento del salvataggio;
8. consultazione e rimozione degli annunci salvati;
9. database versionato con `node-pg-migrate`;
10. frontend React + TypeScript organizzato per feature, componenti, Context e custom hook.

---

## 2. Stato iniziale del repository

Al momento del presente documento il progetto contiene:

- un backend Express in JavaScript CommonJS;
- una connessione PostgreSQL con `pg`;
- un endpoint `GET /health`;
- un endpoint iniziale `GET /api/annunci`;
- la creazione della tabella `annunci` eseguita direttamente dal model;
- un frontend React + TypeScript basato ancora in gran parte sul template Vite;
- il componente `App` renderizzato due volte in `main.tsx`.

La V1 deve quindi includere anche una pulizia della base attuale.

---

## 3. Vincoli e principi architetturali

### 3.1 Vincoli richiesti

- Lo scraper deve essere scritto in JavaScript, non in Python.
- La logica di scraping deve essere separata dalla logica di business.
- Gli scraper devono risiedere in `backend/scraper`.
- Ogni portale deve avere un proprio modulo scraper.
- Il database non deve essere creato o modificato dai model.
- Ogni modifica allo schema deve essere eseguita tramite migrazione.
- Il frontend deve usare TypeScript.
- I componenti React devono avere responsabilità limitate.
- Le chiamate HTTP, lo stato globale, la presentazione e la logica delle feature devono essere separate.

### 3.2 Principi

- **Single responsibility:** ogni file deve avere una responsabilità principale.
- **Dependency direction:** controller → service → repository/scraper.
- **Scraper isolato:** lo scraper non deve conoscere Express, il database o React.
- **Dati normalizzati:** il resto dell'applicazione non deve dipendere dalla struttura HTML di Immobiliare.it.
- **Estendibilità:** aggiungere un nuovo sito deve richiedere un nuovo adapter, non la riscrittura della ricerca.
- **Persistenza esplicita:** i risultati di ricerca non vengono salvati automaticamente.
- **Progressive enrichment:** i dettagli completi vengono recuperati quando servono.
- **Fail safely:** eventuali errori del portale esterno non devono interrompere il backend.

---

## 4. Conformità e limiti dello scraping

Lo scraping deve riguardare esclusivamente pagine pubblicamente accessibili e non deve:

- aggirare CAPTCHA, autenticazioni o sistemi anti-bot;
- simulare utenti per eludere blocchi;
- usare proxy rotanti o tecniche di evasione;
- eseguire richieste aggressive;
- raccogliere dati personali non necessari;
- ripubblicare immagini o contenuti come se fossero propri.

Al 13 luglio 2026 il file `robots.txt` di Immobiliare.it indica restrizioni per alcuni percorsi di ricerca, inclusi `/search-list`, `/search-map` e `/ricerca-mappa/`. Prima di implementare lo scraper definitivo deve quindi essere completata una verifica dei termini d'uso e dei percorsi tecnicamente e contrattualmente utilizzabili.

La V1 deve prevedere un **gate di conformità**: se il portale non consente l'accesso automatizzato al flusso necessario, l'integrazione non deve tentare di aggirare il limite. In quel caso dovrà essere valutata un'API autorizzata, una fonte alternativa o un'importazione manuale tramite URL.

Riferimenti:

- `https://www.immobiliare.it/robots.txt`
- `https://salsita.github.io/node-pg-migrate/`

---

## 5. Attori

### 5.1 Utente

Può:

- compilare i criteri di ricerca;
- avviare una ricerca;
- vedere i risultati;
- aprire l'annuncio originale;
- salvare un annuncio;
- consultare gli annunci salvati;
- rimuovere un annuncio salvato.

### 5.2 Portale immobiliare esterno

Fornisce le pagine pubbliche da cui il relativo adapter ricava:

- risultati sintetici;
- dettagli completi;
- immagini;
- informazioni sulla posizione;
- caratteristiche dell'immobile.

### 5.3 Backend RicercaCasa

Coordina:

- validazione dei criteri;
- scelta dello scraper;
- normalizzazione dei dati;
- recupero del dettaglio;
- salvataggio e deduplicazione;
- risposta API.

---

## 6. Ambito della V1

### 6.1 Incluso

- un solo provider: Immobiliare.it;
- ricerca per testo libero della zona;
- tipo operazione `rent` oppure `sale`;
- prezzo massimo;
- paginazione iniziale controllata dal backend;
- risultati ordinati secondo l'ordine restituito dal portale;
- card responsive;
- salvataggio preferiti;
- elenco preferiti;
- dettaglio preferito;
- eliminazione preferito;
- gestione loading, empty state ed errori;
- migrazioni PostgreSQL;
- log tecnici essenziali;
- test unitari sulle funzioni di mapping e normalizzazione;
- test API essenziali.

### 6.2 Escluso dalla V1

- autenticazione e utenti multipli;
- notifiche email o push;
- ricerca pianificata automatica;
- storico delle variazioni di prezzo;
- confronto tra portali;
- mappe interattive complete;
- contatto diretto con agenzie o proprietari;
- scraping massivo o continuo;
- salvataggio automatico di tutti i risultati;
- sistemi di proxy o aggiramento anti-bot.

---

## 7. Requisiti funzionali

### RF-001 — Inserimento zona

L'utente deve poter inserire una zona tramite campo testuale.

Esempi:

- `Ancona`
- `Senigallia`
- `Roma, Trastevere`
- `Milano, Porta Romana`

Regole:

- campo obbligatorio;
- minimo 2 caratteri;
- spazi iniziali e finali rimossi;
- testo normalizzato prima della chiamata API;
- eventuali suggerimenti/autocomplete sono opzionali nella V1.

### RF-002 — Tipo di operazione

L'utente deve scegliere una sola opzione:

- `rent`: affitto;
- `sale`: compravendita.

Il valore deve essere obbligatorio e validato sia nel frontend sia nel backend.

### RF-003 — Prezzo massimo

L'utente può indicare un prezzo massimo.

Regole:

- valore opzionale;
- numero positivo;
- valuta EUR;
- per affitto rappresenta il canone massimo mensile quando il portale lo esprime come canone;
- per vendita rappresenta il prezzo totale massimo;
- il backend non deve fidarsi della sola validazione frontend.

### RF-004 — Avvio ricerca

Alla conferma del form il frontend invia i criteri al backend.

Il backend deve:

1. validare i dati;
2. individuare il provider richiesto;
3. invocare lo scraper tramite un contratto comune;
4. normalizzare i risultati;
5. restituire un array di `ListingSummary`;
6. non salvare automaticamente i risultati.

### RF-005 — Risultati di ricerca

Ogni card deve mostrare almeno, quando disponibili:

- immagine principale;
- titolo;
- prezzo;
- eventuale periodicità del prezzo;
- zona/località;
- tipologia immobile;
- superficie;
- numero locali;
- piano;
- breve descrizione;
- nome o tipo inserzionista;
- fonte;
- pulsante `Apri annuncio`;
- pulsante `Salva`.

Un'informazione assente non deve causare errori di rendering.

### RF-006 — Paginazione

La risposta deve includere metadati di paginazione quando disponibili:

```ts
interface SearchMeta {
  page: number
  hasNextPage: boolean
  totalResults?: number
}
```

La V1 può usare un pulsante `Carica altri` anziché una paginazione numerica completa.

### RF-007 — Salvataggio di un annuncio

Quando l'utente preme `Salva`:

1. il frontend invia l'identificativo del provider e l'URL canonico dell'annuncio;
2. il backend verifica che la fonte sia supportata;
3. il backend richiede allo scraper il dettaglio completo dell'annuncio;
4. lo scraper restituisce un oggetto normalizzato;
5. il service valida e prepara i dati;
6. il repository esegue l'upsert del record;
7. immagini e dati correlati vengono salvati nella stessa transazione;
8. il backend restituisce il record persistito;
9. la card passa allo stato `Salvato`.

Questa scelta evita di aprire tutte le pagine di dettaglio durante ogni ricerca e riduce il numero di richieste al portale.

### RF-008 — Deduplicazione

Lo stesso annuncio non deve essere duplicato.

La chiave primaria funzionale è:

- provider;
- identificativo esterno dell'annuncio.

Se l'annuncio è già presente, il salvataggio deve aggiornare i dati recuperabili e restituire lo stato `alreadySaved` oppure `updated`.

### RF-009 — Elenco preferiti

Il frontend deve offrire una vista dedicata agli annunci salvati.

Ogni elemento deve permettere:

- visualizzazione riepilogo;
- apertura dettaglio locale;
- apertura pagina originale;
- eliminazione.

### RF-010 — Dettaglio preferito

La pagina o il pannello di dettaglio deve mostrare tutti i campi persistiti disponibili, tra cui:

- titolo e descrizione completa;
- prezzo e operazione;
- caratteristiche;
- galleria immagini;
- localizzazione;
- coordinate, quando pubblicamente disponibili;
- dati dell'inserzionista non sensibili;
- URL originale;
- data di scraping e data di salvataggio.

### RF-011 — Eliminazione preferito

L'utente può rimuovere un annuncio salvato.

L'eliminazione deve:

- richiedere conferma nell'interfaccia;
- cancellare anche immagini e dati figli tramite vincoli database;
- aggiornare immediatamente lo stato frontend.

### RF-012 — Stati applicativi

Il frontend deve gestire esplicitamente:

- stato iniziale;
- caricamento;
- risultati disponibili;
- nessun risultato;
- errore di validazione;
- errore temporaneo del provider;
- provider non disponibile;
- annuncio già salvato;
- salvataggio in corso;
- salvataggio completato;
- eliminazione in corso.

---

## 8. Contratto dati dello scraper

La logica di business non deve ricevere HTML o selettori CSS. Ogni scraper deve implementare un contratto equivalente al seguente:

```js
/**
 * @typedef {Object} SearchCriteria
 * @property {string} location
 * @property {'rent'|'sale'} transactionType
 * @property {number|null} maxPrice
 * @property {number} page
 */

/**
 * @typedef {Object} ScraperAdapter
 * @property {(criteria: SearchCriteria) => Promise<SearchResult>}
 * @property {(sourceUrl: string) => Promise<ListingDetails>}
 */
```

Metodi richiesti:

- `search(criteria)`: recupera risultati sintetici;
- `getDetails(sourceUrl)`: recupera il dettaglio completo di un annuncio.

Ogni adapter deve restituire lo stesso formato normalizzato indipendentemente dal portale.

### 8.1 ListingSummary

```ts
interface ListingSummary {
  provider: 'immobiliare_it'
  externalId: string
  sourceUrl: string
  title: string
  transactionType: 'rent' | 'sale'
  price: number | null
  pricePeriod: 'month' | 'week' | 'day' | 'total' | null
  currency: 'EUR'
  locationLabel: string | null
  propertyType: string | null
  surfaceM2: number | null
  rooms: number | null
  floor: string | null
  shortDescription: string | null
  mainImageUrl: string | null
  advertiserName: string | null
  advertiserType: string | null
}
```

### 8.2 ListingDetails

`ListingDetails` estende il riepilogo e comprende, quando disponibili:

- descrizione completa;
- indirizzo e componenti geografiche;
- latitudine e longitudine;
- precisione della posizione;
- camere e bagni;
- superficie;
- piano e numero piani;
- ascensore;
- stato dell'immobile;
- arredamento;
- riscaldamento;
- classe energetica;
- spese condominiali;
- disponibilità;
- elenco immagini ordinato;
- caratteristiche ulteriori;
- data di pubblicazione/aggiornamento della fonte;
- payload grezzo normalizzato in JSON per dati non ancora modellati.

---

## 9. Architettura backend proposta

```text
backend/
├── config/
│   ├── db.js
│   └── env.js
├── controller/
│   ├── searchController.js
│   └── favoritesController.js
├── middleware/
│   ├── errorHandler.js
│   ├── notFound.js
│   └── rateLimiter.js
├── migrations/
├── models/
│   ├── savedListingRepository.js
│   └── listingImageRepository.js
├── routes/
│   ├── searchRoutes.js
│   └── favoritesRoutes.js
├── scraper/
│   ├── index.js
│   ├── immobiliareItScraper.js
│   └── shared/
│       ├── httpClient.js
│       ├── parsing.js
│       └── normalizers.js
├── services/
│   ├── propertySearchService.js
│   └── favoriteService.js
├── validators/
│   ├── searchValidators.js
│   └── favoriteValidators.js
├── app.js
└── server.js
```

### 9.1 Responsabilità dei layer

#### Routes

- dichiarano metodo e percorso;
- applicano middleware e validator;
- non contengono logica di business.

#### Controller

- traducono HTTP in chiamate ai service;
- scelgono status code e response body;
- non eseguono query SQL;
- non analizzano HTML.

#### Service

- coordinano il caso d'uso;
- scelgono lo scraper tramite registry;
- applicano regole di business;
- gestiscono deduplicazione e transazioni tramite repository.

#### Scraper

- costruisce richieste consentite al provider;
- legge HTML o dati strutturati pubblicamente presenti;
- estrae valori;
- normalizza il risultato;
- non usa il database;
- non conosce Express.

#### Repository/model

- esegue query SQL;
- non crea tabelle;
- non contiene selettori o logica HTML;
- non decide regole HTTP.

### 9.2 Registry degli scraper

Il service non deve importare direttamente l'implementazione specifica in più punti.

Esempio concettuale:

```js
const scrapers = {
  immobiliare_it: immobiliareItScraper,
};

function getScraper(provider) {
  const scraper = scrapers[provider];
  if (!scraper) throw new UnsupportedProviderError(provider);
  return scraper;
}
```

---

## 10. Strategia tecnica dello scraper

### 10.1 Prima scelta

Usare richieste HTTP controllate e parsing HTML con una libreria dedicata, se le pagine pubbliche forniscono già il contenuto necessario.

Possibile stack:

- `fetch`/`undici` per HTTP;
- `cheerio` per parsing HTML;
- timeout tramite `AbortController`;
- user agent trasparente e configurato;
- limiti di concorrenza.

### 10.2 Browser headless

Usare Playwright solo se il contenuto pubblico necessario viene generato lato client e se tale accesso rispetta i termini del provider.

Playwright non deve essere usato per aggirare blocchi o CAPTCHA.

### 10.3 Resilienza

- selettori centralizzati nel modulo del provider;
- parser separati per lista e dettaglio;
- fallback su dati strutturati JSON-LD quando disponibili;
- timeout per richiesta;
- massimo numero di retry limitato;
- nessun retry su errori 4xx non temporanei;
- concorrenza ridotta;
- cache breve opzionale dei risultati di ricerca;
- test parser basati su fixture HTML versionate e prive di dati personali.

### 10.4 Errori specifici

Lo scraper deve esporre errori applicativi riconoscibili:

- `ProviderUnavailableError`;
- `ProviderBlockedError`;
- `ListingNotFoundError`;
- `InvalidProviderResponseError`;
- `ScrapingTimeoutError`.

Il controller deve convertirli in risposte HTTP stabili senza mostrare stack trace al client.

---

## 11. API REST proposta

### POST `/api/search`

Avvia una ricerca.

Request:

```json
{
  "provider": "immobiliare_it",
  "location": "Senigallia",
  "transactionType": "sale",
  "maxPrice": 250000,
  "page": 1
}
```

Response `200`:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "hasNextPage": false,
    "totalResults": null
  }
}
```

Errori principali:

- `400` criteri non validi;
- `422` provider supportato ma richiesta non traducibile;
- `429` troppe richieste;
- `502` risposta del provider non valida;
- `503` provider temporaneamente indisponibile;
- `504` timeout provider.

### POST `/api/favorites`

Recupera il dettaglio e salva l'annuncio.

Request:

```json
{
  "provider": "immobiliare_it",
  "externalId": "123456789",
  "sourceUrl": "https://www.immobiliare.it/annunci/123456789/"
}
```

Response:

- `201` creato;
- `200` già presente e aggiornato.

### GET `/api/favorites`

Restituisce gli annunci salvati con paginazione locale.

Parametri suggeriti:

- `page`;
- `limit`;
- `transactionType`;
- `maxPrice`;
- `location`;
- `sort`.

### GET `/api/favorites/:id`

Restituisce il dettaglio completo locale.

### DELETE `/api/favorites/:id`

Elimina il preferito e i record figli.

### GET `/health`

Mantiene il controllo di disponibilità API e database.

---

## 12. Architettura frontend proposta

Il frontend attuale può restare nella directory `ricercaCasa`, ma la struttura deve essere riorganizzata.

```text
ricercaCasa/src/
├── app/
│   ├── App.tsx
│   ├── AppProviders.tsx
│   └── router.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── MainLayout.tsx
│   │   └── PageContainer.tsx
│   ├── feedback/
│   │   ├── EmptyState.tsx
│   │   ├── ErrorMessage.tsx
│   │   └── LoadingGrid.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       └── Modal.tsx
├── context/
│   ├── SearchContext.tsx
│   └── FavoritesContext.tsx
├── features/
│   ├── search/
│   │   ├── components/
│   │   │   ├── SearchForm.tsx
│   │   │   ├── SearchFilters.tsx
│   │   │   ├── SearchResults.tsx
│   │   │   └── SearchResultCard.tsx
│   │   ├── hooks/
│   │   │   ├── usePropertySearch.ts
│   │   │   └── useSearchForm.ts
│   │   ├── services/
│   │   │   └── searchApi.ts
│   │   └── types/
│   │       └── search.types.ts
│   └── favorites/
│       ├── components/
│       │   ├── FavoriteCard.tsx
│       │   ├── FavoritesGrid.tsx
│       │   └── FavoriteDetails.tsx
│       ├── hooks/
│       │   └── useFavorites.ts
│       ├── services/
│       │   └── favoritesApi.ts
│       └── types/
│           └── favorite.types.ts
├── hooks/
│   └── useAsyncAction.ts
├── lib/
│   ├── apiClient.ts
│   ├── currency.ts
│   └── formatters.ts
├── pages/
│   ├── SearchPage.tsx
│   ├── FavoritesPage.tsx
│   └── NotFoundPage.tsx
├── styles/
│   ├── globals.css
│   └── tokens.css
└── main.tsx
```

### 12.1 Uso dei Context

I Context devono essere piccoli e separati.

#### SearchContext

Contiene solo stato condiviso della ricerca:

- criteri correnti;
- risultati;
- metadati;
- stato caricamento;
- errore corrente.

#### FavoritesContext

Contiene:

- ID esterni già salvati;
- stato delle operazioni di salvataggio;
- funzioni di refresh essenziali.

Non deve contenere il markup delle card o la logica HTTP completa: tali responsabilità restano nei custom hook e nei service API.

### 12.2 Custom hook

#### `usePropertySearch`

- chiama `searchApi`;
- aggiorna il SearchContext;
- espone `search`, `loadMore`, `reset`.

#### `useSearchForm`

- gestisce valori del form;
- applica validazione client;
- prepara il payload.

#### `useFavorites`

- carica i preferiti;
- salva un annuncio;
- elimina un annuncio;
- espone loading/error per singola operazione.

### 12.3 Componenti presentazionali

`SearchResultCard` deve ricevere dati e callback tramite props. Non deve:

- chiamare direttamente `fetch`;
- conoscere gli endpoint;
- modificare il Context direttamente;
- contenere la logica di parsing dei dati.

---

## 13. UI e UX

### 13.1 Pagina ricerca

Struttura suggerita:

1. header compatto;
2. hero con titolo e testo breve;
3. pannello filtri evidente;
4. riepilogo criteri applicati;
5. griglia responsive di risultati;
6. caricamento progressivo;
7. pulsante `Carica altri`;
8. accesso chiaro alla sezione preferiti.

### 13.2 Card

La card deve avere gerarchia visiva chiara:

- immagine con rapporto fisso;
- badge `Affitto` o `Vendita`;
- prezzo dominante;
- titolo massimo due righe;
- località;
- attributi sintetici con icone accessibili;
- azione primaria `Salva`;
- azione secondaria `Apri annuncio`.

### 13.3 Accessibilità

- label collegate ai campi;
- navigazione da tastiera;
- focus visibile;
- testi alternativi alle immagini;
- pulsanti con testo o `aria-label` esplicito;
- contrasto sufficiente;
- messaggi di errore associati ai campi;
- niente informazione affidata soltanto al colore.

### 13.4 Responsive

- una colonna su mobile;
- due colonne su tablet;
- tre o quattro colonne su desktop in base alla larghezza;
- filtri utilizzabili senza scroll orizzontale.

---

## 14. Sicurezza e robustezza

Il backend deve includere:

- `helmet`;
- CORS configurato da variabile ambiente;
- rate limit distinto per ricerca e normali API locali;
- limite dimensione JSON;
- validazione input;
- URL allowlist per i provider supportati;
- rifiuto di URL arbitrari per prevenire SSRF;
- timeout sulle richieste esterne;
- nessun dettaglio interno negli errori client;
- log senza segreti;
- query parametrizzate;
- transazioni per i salvataggi composti.

Il server non deve accettare dal frontend un payload completo dell'annuncio come fonte autorevole. Per il salvataggio deve recuperare e verificare i dati tramite il provider adapter.

---

## 15. Logging e osservabilità

Per ogni ricerca registrare almeno:

- provider;
- tipo operazione;
- zona normalizzata;
- durata;
- numero risultati;
- esito;
- codice errore applicativo.

Non registrare:

- password;
- token;
- cookie del provider;
- HTML completo;
- dati personali non necessari.

I log applicativi non devono essere usati come sostituto della tabella di audit o delle migrazioni.

---

## 16. Test richiesti

### Backend

- unit test dei normalizzatori;
- unit test del mapping `HTML/structured data → ListingSummary`;
- unit test del mapping `detail → ListingDetails`;
- test service con scraper mock;
- test repository su database di test;
- test API per validazione, ricerca e salvataggio;
- test deduplicazione;
- test rollback transazione.

### Frontend

- test del form;
- test degli stati loading/error/empty;
- test card con campi mancanti;
- test salvataggio;
- test preferito già presente;
- test eliminazione con conferma.

Gli scraper non devono dipendere esclusivamente da test live contro il sito esterno. Servono fixture controllate per evitare test fragili e richieste inutili.

---

## 17. Piano di implementazione V1

### Fase 0 — Verifica provider

- verificare termini, robots e percorsi consentiti;
- confermare la fattibilità tecnica senza bypass;
- creare una fixture di esempio;
- definire i campi effettivamente disponibili.

### Fase 1 — Fondazione database

- installare `node-pg-migrate`;
- aggiungere script npm;
- creare directory migrations;
- rimuovere `CREATE TABLE` dal model;
- applicare le migrazioni iniziali;
- creare repository puliti.

### Fase 2 — Fondazione backend

- separare `app.js` e `server.js`;
- aggiungere error handler;
- aggiungere validator;
- creare contract e registry degli scraper;
- creare service di ricerca e preferiti.

### Fase 3 — Scraper Immobiliare.it

- implementare ricerca sintetica;
- implementare dettaglio;
- normalizzare dati;
- gestire immagini e posizione;
- aggiungere fixture e test;
- applicare limiti di frequenza e timeout.

### Fase 4 — API

- `POST /api/search`;
- `POST /api/favorites`;
- `GET /api/favorites`;
- `GET /api/favorites/:id`;
- `DELETE /api/favorites/:id`.

### Fase 5 — Frontend

- rimuovere template Vite e doppio render di `App`;
- creare routing e layout;
- creare Context separati;
- creare hook e service API;
- creare form ricerca;
- creare griglia e card;
- creare vista preferiti;
- creare dettaglio;
- completare responsive e accessibilità.

### Fase 6 — Hardening

- test integrati;
- gestione errori provider;
- rate limiting;
- logging;
- documentazione avvio locale;
- verifica build frontend e backend.

---

## 18. Criteri di accettazione V1

La V1 è accettata quando:

1. l'utente può cercare indicando zona, operazione e prezzo massimo;
2. i risultati vengono mostrati senza essere salvati automaticamente;
3. ogni risultato possiede un'azione di salvataggio;
4. il salvataggio recupera il dettaglio disponibile e persiste i dati;
5. lo stesso annuncio non viene duplicato;
6. i preferiti sono consultabili ed eliminabili;
7. la posizione viene salvata con il massimo dettaglio pubblicamente disponibile;
8. immagini e caratteristiche aggiuntive vengono conservate;
9. nessun model contiene DDL;
10. lo schema viene creato tramite `node-pg-migrate`;
11. lo scraper non contiene logica Express o database;
12. controller e componenti React non diventano contenitori monolitici;
13. TypeScript non presenta errori in build;
14. backend e frontend gestiscono loading, vuoto ed errori;
15. lo scraper rispetta i limiti definiti nella sezione conformità;
16. `main` non viene modificato durante lo sviluppo della feature.

---

## 19. Decisioni principali della V1

- I risultati della ricerca restano temporanei nel frontend.
- Il dettaglio completo viene recuperato al salvataggio.
- Un adapter rappresenta ciascun portale.
- I service lavorano su modelli normalizzati, non su HTML.
- I campi comuni sono tipizzati nel database.
- I campi non ancora modellati vengono conservati in JSONB.
- I Context frontend sono separati per responsabilità.
- Il database viene modificato solo tramite migrazioni.
- L'implementazione non deve aggirare restrizioni tecniche o contrattuali del provider.
