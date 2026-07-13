# RicercaCasa — V2 Analisi Funzionale

**Versione documento:** 2.0  
**Data:** 14 luglio 2026  
**Branch di riferimento:** `dev-jox`  
**Stato:** proposta funzionale per implementazione V2

---

## 1. Obiettivo della V2

La V2 estende RicercaCasa da applicazione basata su un solo portale a strumento locale capace di:

1. cercare annunci su più portali immobiliari;
2. normalizzare risultati con strutture differenti;
3. riconoscere in modo prudente annunci riferiti allo stesso immobile;
4. salvare più fonti senza creare copie gestionali separate dello stesso immobile;
5. trasformare la pagina di dettaglio locale in una pagina di lavoro;
6. aggiungere note personali;
7. registrare appuntamenti e relativo stato;
8. mantenere codice backend e frontend separato per responsabilità.

Provider previsti nella V2:

- `immobiliare_it` — Immobiliare.it;
- `idealista_it` — Idealista;
- `casa_it` — Casa.it.

L'applicazione resta:

- single-user;
- eseguita in locale;
- senza autenticazione;
- basata su Node.js, Express, PostgreSQL, React e TypeScript;
- versionata tramite `node-pg-migrate`.

---

## 2. Base V1 verificata

La V2 parte dal codice effettivamente presente nel branch `dev-jox`.

La V1 dispone già di:

- backend Express separato tra `app.js` e `server.js`;
- configurazione ambiente centralizzata;
- PostgreSQL tramite `pg`;
- migrazioni `node-pg-migrate`;
- tabelle `sources`, `saved_listings`, `listing_images` e `scraping_runs`;
- registry degli scraper;
- adapter `immobiliareItScraper`;
- ricerca per zona, operazione e prezzo massimo;
- autocomplete geografico;
- fallback tecnici controllati per il recupero delle pagine;
- normalizzazione in `ListingSummary`;
- salvataggio dello snapshot selezionato;
- deduplicazione per singola fonte tramite `(source_id, external_id)`;
- elenco, dettaglio ed eliminazione dei preferiti;
- frontend React + TypeScript organizzato per feature;
- `SearchContext` e `FavoritesContext` separati;
- routing per ricerca, preferiti e dettaglio locale;
- interfaccia Tailwind coerente con il mockup Home V1;
- test iniziali del parser e della normalizzazione del salvataggio.

### 2.1 Limiti V1 da superare

- I tipi frontend accettano soltanto `immobiliare_it`.
- I validator backend accettano soltanto Immobiliare.it.
- L'autocomplete è fissato direttamente a Immobiliare.it.
- `httpClient.js` contiene dettagli specifici di Immobiliare.it.
- Il registry contiene un solo adapter.
- La deduplicazione non collega annunci presenti su portali diversi.
- Il dettaglio locale è principalmente consultivo.
- Non esistono note, stato gestionale o appuntamenti.
- Un aggiornamento dei dati acquisiti non deve mai sovrascrivere dati personali inseriti dall'utente.

---

## 3. Ambito della V2

### 3.1 Incluso

- integrazione di Idealista;
- integrazione di Casa.it;
- selezione di uno o più provider;
- ricerca aggregata multi-provider;
- gestione di successi parziali quando un provider non risponde;
- normalizzazione comune dei risultati;
- deduplicazione esatta all'interno della singola fonte;
- rilevamento prudente di duplicati tra fonti differenti;
- raggruppamento delle fonti riferite allo stesso immobile;
- indicazione delle fonti collegate;
- stato gestionale dell'immobile salvato;
- note personali multiple;
- appuntamenti multipli;
- modifica e cancellazione di note e appuntamenti;
- pagina dettaglio locale riprogettata;
- API e migrazioni necessarie;
- test unitari e di integrazione per le nuove funzioni.

### 3.2 Escluso

- autenticazione;
- utenti multipli;
- sincronizzazione cloud;
- notifiche email, push o calendario esterno;
- invio automatico di messaggi alle agenzie;
- scraping pianificato continuo;
- storico completo del prezzo;
- download locale delle immagini;
- mappe interattive avanzate;
- valutazioni automatiche di convenienza economica;
- mutui, calcolatori o strumenti finanziari;
- risoluzione automatica di CAPTCHA;
- accesso a contenuti autenticati o privati;
- uso di cookie, token o credenziali sottratte a sessioni del browser.

---

## 4. Principi architetturali

### 4.1 Separazione delle responsabilità

Il flusso resta:

```text
route -> validator -> controller -> service -> scraper/repository
```

Regole:

- le route definiscono soltanto percorso e middleware;
- i controller traducono HTTP in casi d'uso;
- i service applicano regole di business;
- gli adapter conoscono il singolo portale;
- i repository eseguono query parametrizzate;
- le migrazioni sono l'unico punto in cui è ammesso DDL;
- i componenti React non eseguono direttamente chiamate HTTP;
- Context, hook, service API e componenti presentazionali restano separati.

### 4.2 Dati esterni e dati personali

I dati devono essere divisi in due categorie.

**Dati acquisiti dai portali:**

- titolo;
- prezzo;
- descrizione;
- posizione;
- caratteristiche;
- immagini;
- inserzionista;
- URL e ID della fonte.

**Dati gestiti localmente dall'utente:**

- stato gestionale;
- note;
- appuntamenti;
- decisioni sui possibili duplicati.

Un nuovo scraping può aggiornare i dati esterni ma non può modificare o cancellare i dati personali.

### 4.3 Immobile logico e annuncio sorgente

Nella V2 bisogna distinguere:

- **immobile logico:** la casa o l'appartamento reale seguito dall'utente;
- **annuncio sorgente:** la pubblicazione dello stesso immobile su un determinato portale.

Uno stesso immobile logico può avere più annunci sorgente.

Note, appuntamenti e stato gestionale appartengono all'immobile logico e sono condivisi tra tutte le fonti collegate.

---

## 5. Provider e adapter

### 5.1 Registry

Il registry deve diventare:

```js
const scrapers = {
  immobiliare_it: immobiliareItScraper,
  idealista_it: idealistaItScraper,
  casa_it: casaItScraper,
};
```

Nessun controller o componente frontend deve importare direttamente un adapter specifico.

### 5.2 Contratto comune

Ogni adapter deve esporre un contratto equivalente:

```ts
interface ScraperAdapter {
  code: ProviderCode
  search(criteria: ProviderSearchCriteria): Promise<ProviderSearchResult>
  suggestLocations(
    query: string,
    context?: ProviderLocationContext,
  ): Promise<LocationSuggestion[]>
  getDetails?(sourceUrl: string): Promise<ListingDetails>
  validateSourceUrl(sourceUrl: string): boolean
  extractExternalId(sourceUrl: string): string | null
}
```

`getDetails` può essere opzionale finché il salvataggio continua a usare lo snapshot normalizzato della ricerca.

### 5.3 Moduli previsti

```text
backend/scraper/
├── index.js
├── immobiliareItScraper.js
├── idealistaItScraper.js
├── casaItScraper.js
├── providers/
│   ├── immobiliareIt.config.js
│   ├── idealistaIt.config.js
│   └── casaIt.config.js
└── shared/
    ├── requestClient.js
    ├── parsing.js
    ├── normalizers.js
    ├── deduplication.js
    └── contracts.js
```

Il client HTTP condiviso deve gestire soltanto:

- timeout;
- abort;
- header configurabili;
- mapping degli errori;
- retry limitati quando appropriato;
- dimensione massima della risposta.

URL di fallback, host, parser e strategie specifiche devono stare nel modulo del provider.

### 5.4 Modalità di acquisizione

Ogni provider può usare una sequenza di strategie tecniche diversa, isolata nel proprio adapter.

Requisiti:

- le strategie devono essere configurabili;
- il fallimento di una strategia deve produrre un errore riconoscibile;
- non devono essere esposti HTML, cookie o token alla logica di business;
- non devono essere automatizzati login o CAPTCHA;
- le richieste devono restare limitate e compatibili con l'uso locale dichiarato;
- un provider bloccato non deve trasformarsi in una risposta vuota falsa.

---

## 6. Ricerca multi-provider

### RF2-001 — Selezione provider

L'utente può scegliere:

- tutti i provider attivi;
- uno o più provider specifici.

La prima implementazione deve mostrare un controllo semplice con tre opzioni selezionabili.

Default consigliato:

- tutti i provider attivi.

Almeno un provider deve essere selezionato.

### RF2-002 — Criteri comuni

I criteri restano:

- zona;
- affitto o compravendita;
- prezzo massimo opzionale;
- pagina/caricamento progressivo.

Il payload generico non deve contenere obbligatoriamente uno slug specifico di Immobiliare.it.

Esempio:

```json
{
  "providers": ["immobiliare_it", "idealista_it", "casa_it"],
  "location": "Senigallia",
  "transactionType": "sale",
  "maxPrice": 280000,
  "pagination": {
    "immobiliare_it": 1,
    "idealista_it": 1,
    "casa_it": 1
  },
  "providerContexts": {
    "immobiliare_it": {
      "locationPath": "senigallia"
    }
  }
}
```

### RF2-003 — Autocomplete

L'autocomplete deve diventare provider-aware.

Possibili comportamenti:

1. usare il provider selezionato quando ne è selezionato uno solo;
2. usare un provider geografico principale quando ne sono selezionati più di uno;
3. conservare una label canonica e token specifici per provider quando disponibili.

Il testo scelto dall'utente resta la fonte primaria per gli adapter che non possiedono un token geografico già risolto.

### RF2-004 — Orchestrazione

Il service di ricerca deve:

1. validare i provider richiesti;
2. caricare soltanto provider attivi;
3. invocare gli adapter con concorrenza limitata;
4. raccogliere risultati ed errori separatamente;
5. normalizzare i risultati;
6. eliminare duplicati esatti interni al provider;
7. calcolare possibili corrispondenze cross-provider;
8. restituire dati aggregati e stato di ogni provider.

### RF2-005 — Successo parziale

Se almeno un provider restituisce risultati validi, l'API risponde `200` anche se un altro provider fallisce.

La risposta include warning non bloccanti:

```json
{
  "data": [],
  "meta": {
    "providers": {
      "immobiliare_it": { "status": "success", "count": 12 },
      "idealista_it": { "status": "failed", "code": "PROVIDER_BLOCKED" },
      "casa_it": { "status": "success", "count": 8 }
    },
    "warnings": [
      "Idealista non disponibile in questa ricerca"
    ]
  }
}
```

Se tutti i provider falliscono, l'API restituisce un errore applicativo.

### RF2-006 — Indicazione della fonte

Ogni risultato deve mostrare chiaramente:

- nome del portale;
- URL originale;
- eventuali altre fonti considerate equivalenti.

La fonte non deve essere nascosta dalla deduplicazione.

---

## 7. Deduplicazione

### 7.1 Livelli

La V2 usa tre livelli.

#### Livello 1 — Duplicato esatto nella stessa fonte

Chiave:

```text
(source_id, external_id)
```

Comportamento:

- aggiornamento del record esistente;
- nessun nuovo immobile logico;
- nessuna nuova nota o appuntamento.

#### Livello 2 — URL alternativo della stessa fonte

Lo stesso `external_id` con URL differente deve essere considerato lo stesso annuncio.

L'URL canonico viene aggiornato.

#### Livello 3 — Possibile duplicato tra fonti

Immobiliare.it, Idealista e Casa.it possono pubblicare lo stesso immobile con ID, titolo, prezzo e immagini differenti.

La corrispondenza deve essere calcolata con più segnali.

### 7.2 Segnali di confronto

Segnali forti:

- indirizzo normalizzato completo;
- stesso civico;
- coordinate molto vicine;
- stessa agenzia con riferimento immobile coincidente, quando disponibile.

Segnali medi:

- stesso comune e quartiere;
- superficie entro una tolleranza limitata;
- stesso numero di locali;
- stessa tipologia;
- piano compatibile;
- titolo semanticamente simile.

Segnali deboli:

- prezzo simile;
- descrizione simile;
- immagine principale simile.

Il prezzo da solo non identifica un immobile.

### 7.3 Normalizzazione

Prima del confronto devono essere normalizzati:

- maiuscole/minuscole;
- accenti;
- punteggiatura;
- abbreviazioni stradali comuni;
- spazi ripetuti;
- unità di misura;
- numeri civici;
- comuni e province;
- tipologie immobiliari.

### 7.4 Punteggio

Il service produce un punteggio tra `0` e `1` e una lista di motivazioni.

Regole iniziali suggerite:

- `>= 0.85`: collegamento automatico ammesso soltanto in presenza di almeno un segnale forte;
- `0.65 - 0.8499`: possibile duplicato da confermare;
- `< 0.65`: immobili distinti.

Non è ammesso un collegamento automatico basato solo su titolo, prezzo o superficie.

### 7.5 Gestione dei falsi positivi

L'utente deve poter marcare un candidato come:

- `Conferma duplicato`;
- `Non è lo stesso immobile`.

Una decisione `rejected` viene conservata e impedisce che la stessa coppia venga proposta continuamente.

### RF2-007 — Risultati aggregati

Durante la ricerca, i probabili duplicati possono essere mostrati come una singola card logica con:

- fonte principale;
- indicazione `Disponibile su N portali`;
- elenco dei link alle fonti;
- dati normalizzati scelti con regole deterministiche.

In caso di dubbio, i risultati restano separati e ricevono il badge `Possibile duplicato`.

### RF2-008 — Salvataggio

Salvando una card aggregata:

1. viene creato o recuperato l'immobile logico;
2. ogni fonte inclusa viene salvata come annuncio sorgente separato;
3. tutti gli annunci sorgente vengono collegati allo stesso immobile logico;
4. immagini e snapshot restano associati alla relativa fonte;
5. note, stato e appuntamenti restano unici per l'immobile.

---

## 8. Gestione del dettaglio locale

### RF2-009 — Pagina dettaglio

La route esistente può restare:

```text
/favorites/:id
```

L'ID identifica un annuncio sorgente; il backend risolve il relativo immobile logico e restituisce:

- dati principali;
- immagini;
- caratteristiche;
- tutte le fonti collegate;
- stato gestionale;
- note;
- appuntamenti;
- possibili duplicati ancora da risolvere.

### RF2-010 — Stato gestionale

Ogni immobile logico deve avere uno stato.

Valori V2:

- `saved` — salvato;
- `to_contact` — da contattare;
- `contacted` — contattato;
- `appointment_scheduled` — visita programmata;
- `visited` — visitato;
- `discarded` — scartato.

Regole:

- lo stato è modificabile dalla pagina dettaglio;
- lo stato non dipende dal provider;
- la creazione di un appuntamento futuro può proporre, ma non imporre, `appointment_scheduled`;
- cancellare un appuntamento non deve cancellare le note;
- una nuova scrape non modifica lo stato.

### RF2-011 — Note

L'utente deve poter:

- aggiungere una nota;
- vedere le note dalla più recente;
- modificare una nota;
- eliminare una nota con conferma.

Regole:

- testo obbligatorio;
- trim automatico;
- lunghezza massima applicativa consigliata: 10.000 caratteri;
- timestamp di creazione e modifica;
- nessun supporto Markdown richiesto nella V2;
- nessun salvataggio automatico mentre si digita.

### RF2-012 — Appuntamenti

L'utente deve poter:

- programmare una visita;
- indicare data e ora;
- aggiungere luogo o indicazione opzionale;
- aggiungere una nota opzionale;
- modificare l'appuntamento;
- marcarlo come completato;
- cancellarlo o marcarlo come annullato.

Stati appuntamento:

- `scheduled`;
- `completed`;
- `cancelled`.

Regole:

- `scheduled_at` obbligatorio;
- le date sono salvate con timezone;
- l'interfaccia mostra data e ora nel fuso locale;
- gli appuntamenti futuri vengono mostrati prima;
- gli appuntamenti passati restano consultabili;
- nessuna sincronizzazione esterna nella V2.

### RF2-013 — Fonti collegate

La pagina dettaglio deve mostrare una sezione compatta con:

- nome del portale;
- prezzo acquisito da quella fonte;
- data ultimo aggiornamento;
- pulsante `Apri fonte`;
- indicazione della fonte usata come rappresentativa.

### RF2-014 — Possibili duplicati

Quando esiste un candidato non risolto, la pagina mostra:

- titolo e fonte del candidato;
- punteggio o indicazione qualitativa;
- principali motivi della somiglianza;
- `Conferma duplicato`;
- `Non è lo stesso immobile`.

Il punteggio tecnico completo non deve dominare l'interfaccia: può essere mostrato come `Somiglianza alta`, `media` o `bassa`.

---

## 9. API REST V2

### 9.1 Provider

#### GET `/api/providers`

Restituisce i provider attivi:

```json
{
  "data": [
    { "code": "immobiliare_it", "name": "Immobiliare.it" },
    { "code": "idealista_it", "name": "Idealista" },
    { "code": "casa_it", "name": "Casa.it" }
  ]
}
```

### 9.2 Ricerca

#### POST `/api/search`

Accetta `providers` come array.

Per compatibilità temporanea, il backend può accettare anche il vecchio campo `provider` e convertirlo in array.

La risposta include:

- gruppi di risultati;
- varianti per fonte;
- metadati per provider;
- warning parziali;
- paginazione per provider.

### 9.3 Dettaglio locale

#### GET `/api/favorites/:id`

La risposta V2 include:

```json
{
  "data": {
    "id": 42,
    "propertyGroupId": 12,
    "title": "Trilocale con terrazzo",
    "managementStatus": "appointment_scheduled",
    "sources": [],
    "images": [],
    "notes": [],
    "appointments": [],
    "duplicateCandidates": []
  }
}
```

### 9.4 Stato

#### PATCH `/api/favorites/:id/status`

Request:

```json
{
  "status": "contacted"
}
```

### 9.5 Note

- `POST /api/favorites/:id/notes`
- `PATCH /api/favorites/:id/notes/:noteId`
- `DELETE /api/favorites/:id/notes/:noteId`

### 9.6 Appuntamenti

- `POST /api/favorites/:id/appointments`
- `PATCH /api/favorites/:id/appointments/:appointmentId`
- `DELETE /api/favorites/:id/appointments/:appointmentId`

La cancellazione può essere fisica soltanto dopo conferma. Per conservare lo storico è preferibile usare `cancelled` quando l'appuntamento è realmente annullato.

### 9.7 Candidati duplicati

#### PATCH `/api/duplicate-candidates/:id`

Request:

```json
{
  "decision": "confirmed"
}
```

Valori:

- `confirmed`;
- `rejected`.

---

## 10. Architettura backend V2

```text
backend/
├── controller/
│   ├── providersController.js
│   ├── searchController.js
│   ├── favoritesController.js
│   ├── notesController.js
│   ├── appointmentsController.js
│   └── duplicateCandidatesController.js
├── models/
│   ├── sourceRepository.js
│   ├── propertyGroupRepository.js
│   ├── savedListingRepository.js
│   ├── listingImageRepository.js
│   ├── listingNoteRepository.js
│   ├── listingAppointmentRepository.js
│   ├── duplicateCandidateRepository.js
│   └── scrapingRunRepository.js
├── routes/
│   ├── providersRoutes.js
│   ├── searchRoutes.js
│   ├── favoritesRoutes.js
│   ├── notesRoutes.js
│   ├── appointmentsRoutes.js
│   └── duplicateCandidatesRoutes.js
├── scraper/
│   ├── index.js
│   ├── immobiliareItScraper.js
│   ├── idealistaItScraper.js
│   ├── casaItScraper.js
│   └── shared/
├── services/
│   ├── providerService.js
│   ├── propertySearchService.js
│   ├── listingAggregationService.js
│   ├── deduplicationService.js
│   ├── favoriteService.js
│   ├── listingManagementService.js
│   └── duplicateCandidateService.js
└── validators/
    ├── providerValidators.js
    ├── searchValidators.js
    ├── favoriteValidators.js
    ├── noteValidators.js
    ├── appointmentValidators.js
    └── duplicateCandidateValidators.js
```

### 10.1 `listingAggregationService`

Responsabilità:

- combinare risultati dei provider;
- mantenere tutte le fonti;
- scegliere una variante rappresentativa;
- produrre gruppi temporanei per il frontend;
- non eseguire query SQL direttamente.

### 10.2 `deduplicationService`

Responsabilità:

- normalizzare campi utili al confronto;
- generare fingerprint;
- recuperare candidati tramite repository;
- calcolare punteggio e motivazioni;
- proporre collegamento automatico o candidato manuale;
- applicare decisioni di conferma e rifiuto.

### 10.3 `listingManagementService`

Responsabilità:

- aggiornare stato;
- gestire note;
- gestire appuntamenti;
- verificare che nota o appuntamento appartengano all'immobile richiesto;
- mantenere separate le modifiche personali dagli aggiornamenti del provider.

---

## 11. Architettura frontend V2

### 11.1 Tipi provider

I tipi non devono più usare il literal singolo:

```ts
export type ProviderCode =
  | 'immobiliare_it'
  | 'idealista_it'
  | 'casa_it'
```

`SearchCriteria` contiene `providers: ProviderCode[]`.

### 11.2 Nuove feature

```text
ricercaCasa/src/features/
├── providers/
│   ├── components/ProviderSelector.tsx
│   ├── hooks/useProviders.ts
│   ├── services/providersApi.ts
│   └── types/provider.types.ts
├── search/
├── favorites/
├── listing-management/
│   ├── components/
│   │   ├── ManagementPanel.tsx
│   │   ├── ManagementStatusSelect.tsx
│   │   ├── NotesSection.tsx
│   │   ├── NoteForm.tsx
│   │   ├── NoteList.tsx
│   │   ├── AppointmentsSection.tsx
│   │   ├── AppointmentForm.tsx
│   │   ├── AppointmentList.tsx
│   │   └── SourceVariants.tsx
│   ├── hooks/
│   │   ├── useListingManagement.ts
│   │   ├── useListingNotes.ts
│   │   └── useListingAppointments.ts
│   ├── services/
│   │   └── listingManagementApi.ts
│   └── types/
│       └── listingManagement.types.ts
└── duplicates/
    ├── components/DuplicateCandidateCard.tsx
    ├── hooks/useDuplicateCandidates.ts
    ├── services/duplicateCandidatesApi.ts
    └── types/duplicate.types.ts
```

### 11.3 Context

Non deve essere creato un Context per ogni feature.

Regole:

- `SearchContext` resta per ricerca condivisa;
- `FavoritesContext` resta per gli ID salvati;
- provider attivi possono essere caricati tramite hook e cache locale;
- note, appuntamenti e stato della pagina dettaglio restano page-local tramite hook;
- un eventuale `ProvidersContext` è ammesso solo se i provider servono in più pagine.

### 11.4 Scomposizione dettaglio

`FavoriteDetails` non deve diventare monolitico.

Struttura suggerita:

```text
FavoriteDetailsPage
├── ListingDetailHeader
├── ListingGallery
├── ListingFacts
├── ListingDescription
├── SourceVariants
├── ManagementPanel
│   ├── ManagementStatusSelect
│   ├── NotesSection
│   └── AppointmentsSection
└── DuplicateCandidatesSection
```

La pagina orchestra caricamento e composizione. I componenti ricevono dati e callback tramite props.

---

## 12. UI della pagina dettaglio

### 12.1 Gerarchia

La pagina deve mantenere lo stile Home V1:

- sfondo chiaro con leggero gradiente;
- header bianco;
- blu come colore primario;
- testo slate;
- card bianche con bordi leggeri;
- raggi ampi;
- ombre morbide;
- spaziatura generosa;
- nessun pannello decorativo privo di funzione.

### 12.2 Layout desktop

1. pulsante `Torna ai preferiti`;
2. blocco principale con galleria a sinistra;
3. riepilogo annuncio a destra;
4. descrizione e caratteristiche;
5. pannello gestione con stato, note e appuntamenti;
6. fonti collegate;
7. eventuali candidati duplicati.

### 12.3 Layout mobile

Ordine:

1. riepilogo;
2. galleria;
3. stato;
4. appuntamento prossimo;
5. note;
6. dettagli tecnici;
7. fonti collegate.

I form non devono richiedere scroll orizzontale.

### 12.4 Stati UI

- caricamento dettaglio;
- errore caricamento;
- nessuna immagine;
- nessuna nota;
- nessun appuntamento;
- salvataggio nota in corso;
- aggiornamento stato in corso;
- appuntamento salvato;
- errore di validazione;
- possibile duplicato;
- provider originale non più raggiungibile.

---

## 13. Validazione e sicurezza

### 13.1 Provider

- provider in allowlist;
- dominio URL verificato in base al provider;
- ID esterno validato dal relativo adapter;
- nessun URL arbitrario passato al client HTTP;
- nessun hostname ricavato liberamente dal body.

### 13.2 Note

- body JSON limitato;
- testo obbligatorio e con lunghezza massima;
- output renderizzato come testo, non HTML;
- nessun `dangerouslySetInnerHTML`.

### 13.3 Appuntamenti

- timestamp ISO valido;
- stato in enum applicativo;
- luogo e note con limiti di lunghezza;
- verifica di appartenenza dell'appuntamento all'immobile logico.

### 13.4 Deduplicazione

- decisioni conferma/rifiuto eseguite in transazione;
- impossibile confrontare un record con sé stesso;
- coppia salvata in ordine deterministico;
- impossibile collegare immobili con operazioni incompatibili senza decisione esplicita;
- nessuna cancellazione automatica di annunci sorgente durante il merge.

---

## 14. Logging

Per ogni ricerca multi-provider registrare:

- provider richiesti;
- provider completati;
- provider falliti;
- durata per provider;
- risultati grezzi per provider;
- risultati dopo deduplicazione;
- numero gruppi temporanei;
- warning.

Per la gestione locale registrare soltanto eventi tecnici essenziali:

- creazione/modifica/eliminazione nota;
- creazione/modifica/cancellazione appuntamento;
- cambio stato;
- conferma o rifiuto duplicato.

Non registrare il testo completo delle note nei log applicativi.

---

## 15. Test richiesti

### 15.1 Adapter

Per ciascun provider:

- costruzione URL;
- parsing risultato HTML/dati strutturati;
- normalizzazione;
- ID esterno;
- URL canonico;
- prezzo;
- posizione;
- gestione pagina vuota reale;
- risposta bloccata;
- timeout;
- fixture indipendenti dal sito live.

### 15.2 Orchestrazione

- tre provider con successo;
- un provider fallito e due riusciti;
- tutti falliti;
- paginazione indipendente;
- provider non attivo;
- provider duplicato nell'array input.

### 15.3 Deduplicazione

- stesso provider e stesso ID;
- stesso immobile con URL differenti;
- stesso indirizzo e caratteristiche compatibili;
- stesso prezzo ma immobile diverso;
- stesso stabile ma appartamenti diversi;
- candidato automatico;
- candidato manuale;
- rifiuto persistente;
- merge transazionale;
- nessuna perdita delle fonti.

### 15.4 Note e appuntamenti

- CRUD note;
- trim e limite testo;
- nota non appartenente all'immobile;
- CRUD appuntamento;
- cambio stato appuntamento;
- timezone;
- ordinamento futuri/passati;
- dati gestionali preservati durante upsert dello scraper.

### 15.5 Frontend

- selettore provider;
- warning di successo parziale;
- card con più fonti;
- pagina dettaglio scomposta;
- salvataggio stato;
- note create/modificate/eliminate;
- appuntamento creato/modificato/completato/annullato;
- candidato duplicato confermato o rifiutato;
- responsive e navigazione tastiera.

---

## 16. Piano di implementazione

### Fase 1 — Fondazione multi-provider

- introdurre `ProviderCode` condiviso;
- aggiungere endpoint provider;
- rendere validator e registry multi-provider;
- separare request client condiviso e strategie provider;
- rendere autocomplete provider-aware.

### Fase 2 — Idealista

- adapter;
- normalizzazione;
- fixture;
- test;
- errori e timeout.

### Fase 3 — Casa.it

- adapter;
- normalizzazione;
- fixture;
- test;
- errori e timeout.

### Fase 4 — Ricerca aggregata

- orchestratore con concorrenza limitata;
- successi parziali;
- metadati per provider;
- paginazione;
- UI selezione fonti;
- badge provider.

### Fase 5 — Modello immobile logico

- migrazioni additive;
- backfill dei preferiti V1;
- repository gruppi;
- collegamento fonti;
- deduplicazione e candidati;
- transazioni di merge.

### Fase 6 — Gestione dettaglio

- stato gestionale;
- note;
- appuntamenti;
- API;
- validator;
- test backend.

### Fase 7 — Frontend dettaglio

- scomporre `FavoriteDetails`;
- creare feature `listing-management`;
- creare feature `duplicates`;
- implementare mockup Dettaglio V1;
- completare mobile e accessibilità.

### Fase 8 — Hardening

- test integrati;
- build TypeScript;
- lint;
- migrazione database vuoto;
- migrazione database V1 con dati;
- rollback ultima migrazione;
- verifica che `main` non sia stato modificato.

---

## 17. Criteri di accettazione V2

La V2 è accettata quando:

1. l'utente può cercare su Immobiliare.it, Idealista e Casa.it;
2. può scegliere uno o più provider;
3. il fallimento di un provider non annulla risultati validi degli altri;
4. ogni risultato conserva chiaramente la propria fonte;
5. duplicati esatti della stessa fonte non vengono creati;
6. possibili duplicati cross-provider vengono rilevati con più segnali;
7. collegamenti automatici richiedono almeno un segnale forte;
8. i casi dubbi richiedono decisione dell'utente;
9. più annunci sorgente possono appartenere allo stesso immobile logico;
10. note e appuntamenti sono condivisi tra fonti dello stesso immobile;
11. un aggiornamento del provider non modifica i dati personali;
12. lo stato gestionale è modificabile;
13. note e appuntamenti supportano le operazioni previste;
14. la pagina dettaglio mantiene lo stile Home V1;
15. `FavoriteDetails` non diventa un componente monolitico;
16. tutte le modifiche schema sono nuove migrazioni;
17. le migrazioni V1 non vengono riscritte;
18. il database V1 può essere aggiornato senza perdere preferiti;
19. i validator verificano provider e domini;
20. i test non dipendono esclusivamente dai siti live;
21. nessuna modifica viene applicata a `main`.

---

## 18. Decisioni definitive V2

- I tre portali sono adapter indipendenti.
- La ricerca multi-provider tollera errori parziali.
- La logica condivisa non contiene selettori o URL specifici dei provider.
- L'annuncio sorgente e l'immobile logico sono entità differenti.
- La deduplicazione cross-provider è prudente e spiegabile.
- Nessun annuncio sorgente viene eliminato durante un raggruppamento.
- Note, appuntamenti e stato appartengono all'immobile logico.
- La pagina dettaglio è il centro gestionale della V2.
- Il Context non viene usato per stato strettamente locale alla pagina.
- Le migrazioni V2 sono additive e preservano i dati V1.
- Il mockup di riferimento è `docs/Mockups/v2/Dettaglio_v1.svg`.
