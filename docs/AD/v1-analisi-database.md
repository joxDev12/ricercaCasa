# RicercaCasa — V1 Analisi Database

**Versione documento:** 1.0  
**Data:** 13 luglio 2026  
**Branch di riferimento:** `dev-jox`  
**DBMS:** PostgreSQL  
**Versionamento schema:** `node-pg-migrate`

---

## 1. Obiettivo

Il database della V1 deve conservare esclusivamente gli annunci che l'utente decide di salvare come preferiti.

I risultati temporanei restituiti dallo scraper non vengono persistiti automaticamente.

Lo schema deve:

- evitare duplicati;
- conservare i campi più importanti in colonne tipizzate;
- mantenere anche i dati aggiuntivi non ancora modellati;
- supportare immagini multiple;
- salvare la posizione con il massimo dettaglio disponibile;
- consentire aggiornamenti futuri dell'annuncio;
- essere gestito esclusivamente tramite migrazioni;
- non contenere logica DDL nei model o repository.

---

## 2. Problema della struttura attuale

Nel codice iniziale la funzione `init()` del model esegue direttamente:

```sql
CREATE TABLE IF NOT EXISTS annunci (...)
```

Questa soluzione deve essere rimossa perché:

- non registra la storia delle modifiche allo schema;
- rende difficile il rollback;
- mescola persistenza e amministrazione del database;
- produce ambienti potenzialmente diversi;
- non permette una revisione chiara delle modifiche;
- rende più complessi deploy e test.

Dopo la migrazione:

- i model/repository eseguono soltanto query CRUD;
- l'avvio del server non crea né altera tabelle;
- lo schema viene preparato prima dell'avvio applicativo tramite `node-pg-migrate`.

---

## 3. Principi di modellazione

### 3.1 Tipizzazione dei dati principali

I campi usati per ricerca, ordinamento e filtri devono essere colonne PostgreSQL dedicate.

Esempi:

- prezzo;
- comune;
- provincia;
- tipo operazione;
- superficie;
- numero locali;
- data salvataggio.

### 3.2 JSONB per dati variabili

Le caratteristiche non uniformi tra portali devono essere conservate anche in `JSONB`.

Esempi:

- dotazioni particolari;
- testi o badge specifici del provider;
- informazioni non ancora promosse a colonna;
- payload normalizzato completo.

Il JSONB non deve sostituire le colonne principali.

### 3.3 Identificativo esterno

Ogni annuncio deve essere identificato tramite:

- fonte;
- `external_id` del portale.

Vincolo univoco:

```text
(source_id, external_id)
```

L'URL non deve essere l'unica chiave perché potrebbe cambiare pur rappresentando lo stesso annuncio.

Se il provider non espone un ID diretto, lo scraper deve ricavare un ID stabile dall'URL canonico secondo una regola documentata.

### 3.4 Dati storici

La V1 non mantiene lo storico completo delle variazioni di prezzo.

Quando un annuncio già salvato viene nuovamente acquisito:

- i dati correnti vengono aggiornati;
- `last_scraped_at` viene aggiornato;
- `saved_at` resta invariato;
- `updated_at` cambia.

Lo storico prezzi sarà una possibile estensione successiva.

---

## 4. Modello logico V1

Entità principali:

1. `sources` — portali supportati;
2. `saved_listings` — annunci salvati;
3. `listing_images` — immagini degli annunci;
4. `scraping_runs` — metadati tecnici delle operazioni di scraping, senza contenere tutti i risultati.

```mermaid
erDiagram
    SOURCES ||--o{ SAVED_LISTINGS : provides
    SOURCES ||--o{ SCRAPING_RUNS : executes
    SAVED_LISTINGS ||--o{ LISTING_IMAGES : has

    SOURCES {
        bigint id PK
        varchar code UK
        varchar name
        text base_url
        boolean active
        timestamptz created_at
        timestamptz updated_at
    }

    SAVED_LISTINGS {
        bigint id PK
        bigint source_id FK
        varchar external_id
        text source_url
        varchar transaction_type
        varchar property_type
        varchar title
        text description
        numeric price
        varchar price_period
        char currency
        numeric surface_m2
        smallint rooms
        smallint bedrooms
        smallint bathrooms
        varchar floor
        smallint total_floors
        boolean elevator
        boolean furnished
        varchar property_condition
        varchar heating
        varchar energy_class
        numeric condominium_fees
        varchar availability
        varchar advertiser_name
        varchar advertiser_type
        varchar location_label
        text address
        varchar street
        varchar civic_number
        varchar district
        varchar municipality
        varchar province
        varchar region
        varchar postal_code
        numeric latitude
        numeric longitude
        varchar location_precision
        text main_image_url
        jsonb features
        jsonb raw_data
        timestamptz source_published_at
        timestamptz source_updated_at
        timestamptz first_scraped_at
        timestamptz last_scraped_at
        timestamptz saved_at
        timestamptz created_at
        timestamptz updated_at
    }

    LISTING_IMAGES {
        bigint id PK
        bigint listing_id FK
        text image_url
        text alt_text
        integer position
        boolean is_primary
        timestamptz created_at
    }

    SCRAPING_RUNS {
        bigint id PK
        bigint source_id FK
        varchar operation
        jsonb criteria
        varchar status
        integer results_count
        integer duration_ms
        varchar error_code
        text error_message
        timestamptz started_at
        timestamptz completed_at
    }
```

---

## 5. Tabella `sources`

Contiene il catalogo dei portali integrati.

| Campo | Tipo | Null | Regole |
|---|---|---:|---|
| `id` | `BIGSERIAL` | no | PK |
| `code` | `VARCHAR(50)` | no | UNIQUE |
| `name` | `VARCHAR(120)` | no | nome leggibile |
| `base_url` | `TEXT` | no | URL base provider |
| `active` | `BOOLEAN` | no | default `true` |
| `created_at` | `TIMESTAMPTZ` | no | default `now()` |
| `updated_at` | `TIMESTAMPTZ` | no | default `now()` |

Record iniziale:

```text
code: immobiliare_it
name: Immobiliare.it
base_url: https://www.immobiliare.it
active: true
```

### Motivazione

Usare una tabella dedicata evita di ripetere stringhe nei record e permette di disabilitare un provider senza cancellare i dati già salvati.

---

## 6. Tabella `saved_listings`

Rappresenta un annuncio salvato dall'utente.

### 6.1 Identità e fonte

| Campo | Tipo | Null | Regole |
|---|---|---:|---|
| `id` | `BIGSERIAL` | no | PK |
| `source_id` | `BIGINT` | no | FK → `sources.id`, `RESTRICT` |
| `external_id` | `VARCHAR(150)` | no | ID provider |
| `source_url` | `TEXT` | no | URL canonico |

Vincoli:

```sql
UNIQUE (source_id, external_id)
UNIQUE (source_id, source_url)
```

Il secondo vincolo protegge da anomalie del parser, ma la deduplicazione principale resta basata sull'ID esterno.

### 6.2 Informazioni principali

| Campo | Tipo | Null | Note |
|---|---|---:|---|
| `transaction_type` | `VARCHAR(20)` | no | `rent` oppure `sale` |
| `property_type` | `VARCHAR(100)` | sì | appartamento, casa, villa ecc. |
| `title` | `VARCHAR(500)` | no | titolo normalizzato |
| `description` | `TEXT` | sì | descrizione completa |
| `price` | `NUMERIC(14,2)` | sì | nessun float |
| `price_period` | `VARCHAR(20)` | sì | `month`, `week`, `day`, `total` |
| `currency` | `CHAR(3)` | no | default `EUR` |
| `surface_m2` | `NUMERIC(10,2)` | sì | superficie commerciale disponibile |
| `rooms` | `SMALLINT` | sì | numero locali |
| `bedrooms` | `SMALLINT` | sì | camere |
| `bathrooms` | `SMALLINT` | sì | bagni |

Check consigliati:

```sql
CHECK (transaction_type IN ('rent', 'sale'))
CHECK (price IS NULL OR price >= 0)
CHECK (surface_m2 IS NULL OR surface_m2 >= 0)
CHECK (rooms IS NULL OR rooms >= 0)
CHECK (bedrooms IS NULL OR bedrooms >= 0)
CHECK (bathrooms IS NULL OR bathrooms >= 0)
CHECK (price_period IS NULL OR price_period IN ('month', 'week', 'day', 'total'))
```

### 6.3 Caratteristiche immobiliari

| Campo | Tipo | Null | Note |
|---|---|---:|---|
| `floor` | `VARCHAR(50)` | sì | può contenere testo come `terra`, `rialzato` |
| `total_floors` | `SMALLINT` | sì | piani edificio |
| `elevator` | `BOOLEAN` | sì | tri-state: presente, assente, sconosciuto |
| `furnished` | `BOOLEAN` | sì | tri-state |
| `property_condition` | `VARCHAR(150)` | sì | nuovo, buono stato ecc. |
| `heating` | `VARCHAR(255)` | sì | descrizione normalizzata |
| `energy_class` | `VARCHAR(50)` | sì | classe o testo disponibile |
| `condominium_fees` | `NUMERIC(12,2)` | sì | spesa periodica quando disponibile |
| `availability` | `VARCHAR(150)` | sì | libero, occupato, data ecc. |

I booleani devono poter essere `NULL`, perché `false` significa assenza dichiarata mentre `NULL` significa informazione non disponibile.

### 6.4 Inserzionista

| Campo | Tipo | Null | Note |
|---|---|---:|---|
| `advertiser_name` | `VARCHAR(255)` | sì | nome pubblico |
| `advertiser_type` | `VARCHAR(80)` | sì | agenzia, privato, costruttore |

La V1 non deve salvare automaticamente email, numeri telefonici o altri dati personali non necessari. Se in futuro tali dati diventassero un requisito, servirà una valutazione privacy separata.

### 6.5 Localizzazione

| Campo | Tipo | Null | Note |
|---|---|---:|---|
| `location_label` | `VARCHAR(500)` | sì | testo completo mostrato dalla fonte |
| `address` | `TEXT` | sì | indirizzo formattato |
| `street` | `VARCHAR(255)` | sì | via/piazza |
| `civic_number` | `VARCHAR(30)` | sì | civico |
| `district` | `VARCHAR(150)` | sì | quartiere/frazione/zona |
| `municipality` | `VARCHAR(150)` | sì | comune |
| `province` | `VARCHAR(100)` | sì | nome o sigla |
| `region` | `VARCHAR(100)` | sì | regione |
| `postal_code` | `VARCHAR(20)` | sì | CAP |
| `latitude` | `NUMERIC(9,6)` | sì | WGS84 |
| `longitude` | `NUMERIC(9,6)` | sì | WGS84 |
| `location_precision` | `VARCHAR(30)` | sì | `exact`, `approximate`, `area`, `unknown` |

Check coordinate:

```sql
CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90)
CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
CHECK (
  location_precision IS NULL OR
  location_precision IN ('exact', 'approximate', 'area', 'unknown')
)
```

La precisione è importante perché alcuni portali mostrano soltanto una zona approssimativa. Il frontend non deve presentare una coordinata approssimativa come indirizzo esatto.

### 6.6 Immagine principale e dati flessibili

| Campo | Tipo | Null | Note |
|---|---|---:|---|
| `main_image_url` | `TEXT` | sì | duplicata per letture veloci della card |
| `features` | `JSONB` | no | default `{}` |
| `raw_data` | `JSONB` | no | default `{}` |

`features` contiene caratteristiche normalizzate aggiuntive.

Esempio:

```json
{
  "balcony": true,
  "terrace": false,
  "garage": "single",
  "garden": "private",
  "airConditioning": true
}
```

`raw_data` conserva il payload completo prodotto dall'adapter, non l'HTML della pagina.

Non devono essere salvati:

- cookie;
- token;
- header sensibili;
- HTML integrale;
- script della pagina;
- dati di tracking.

### 6.7 Date

| Campo | Tipo | Null | Note |
|---|---|---:|---|
| `source_published_at` | `TIMESTAMPTZ` | sì | data dichiarata dalla fonte |
| `source_updated_at` | `TIMESTAMPTZ` | sì | ultimo aggiornamento fonte |
| `first_scraped_at` | `TIMESTAMPTZ` | no | prima acquisizione |
| `last_scraped_at` | `TIMESTAMPTZ` | no | ultima acquisizione |
| `saved_at` | `TIMESTAMPTZ` | no | primo salvataggio preferito |
| `created_at` | `TIMESTAMPTZ` | no | creazione record locale |
| `updated_at` | `TIMESTAMPTZ` | no | ultimo aggiornamento locale |

Tutti i timestamp devono essere salvati con timezone.

---

## 7. Tabella `listing_images`

Contiene la galleria immagini dell'annuncio.

| Campo | Tipo | Null | Regole |
|---|---|---:|---|
| `id` | `BIGSERIAL` | no | PK |
| `listing_id` | `BIGINT` | no | FK → `saved_listings.id`, `ON DELETE CASCADE` |
| `image_url` | `TEXT` | no | URL originale |
| `alt_text` | `TEXT` | sì | testo disponibile/normalizzato |
| `position` | `INTEGER` | no | ordine, default `0` |
| `is_primary` | `BOOLEAN` | no | default `false` |
| `created_at` | `TIMESTAMPTZ` | no | default `now()` |

Vincoli:

```sql
UNIQUE (listing_id, image_url)
CHECK (position >= 0)
```

Indice:

```sql
CREATE INDEX listing_images_listing_position_idx
ON listing_images (listing_id, position);
```

### Strategia aggiornamento immagini

Durante un upsert completo:

1. aggiornare il record `saved_listings`;
2. eliminare le immagini precedenti del record;
3. inserire la nuova lista ordinata;
4. eseguire tutto nella stessa transazione.

Per la V1 questa strategia è più semplice e sicura di un diff immagine per immagine.

---

## 8. Tabella `scraping_runs`

Serve per tracciare l'esito tecnico delle operazioni senza salvare tutti i risultati di ricerca.

| Campo | Tipo | Null | Note |
|---|---|---:|---|
| `id` | `BIGSERIAL` | no | PK |
| `source_id` | `BIGINT` | no | FK → `sources.id`, `RESTRICT` |
| `operation` | `VARCHAR(30)` | no | `search` o `detail` |
| `criteria` | `JSONB` | no | criteri non sensibili |
| `status` | `VARCHAR(20)` | no | `running`, `success`, `failed`, `blocked` |
| `results_count` | `INTEGER` | sì | solo per ricerca |
| `duration_ms` | `INTEGER` | sì | durata |
| `error_code` | `VARCHAR(100)` | sì | codice applicativo |
| `error_message` | `TEXT` | sì | messaggio sanificato |
| `started_at` | `TIMESTAMPTZ` | no | default `now()` |
| `completed_at` | `TIMESTAMPTZ` | sì | fine operazione |

Check:

```sql
CHECK (operation IN ('search', 'detail'))
CHECK (status IN ('running', 'success', 'failed', 'blocked'))
CHECK (results_count IS NULL OR results_count >= 0)
CHECK (duration_ms IS NULL OR duration_ms >= 0)
```

`criteria` deve escludere URL arbitrari, cookie o dati personali.

Esempio:

```json
{
  "location": "Senigallia",
  "transactionType": "sale",
  "maxPrice": 250000,
  "page": 1
}
```

### Retention

I record tecnici possono essere eliminati periodicamente, ad esempio dopo 30 o 90 giorni. La retention non è obbligatoria nella prima implementazione, ma deve essere documentata prima della produzione.

---

## 9. Indici proposti

### `saved_listings`

```sql
CREATE UNIQUE INDEX saved_listings_source_external_id_uq
ON saved_listings (source_id, external_id);

CREATE UNIQUE INDEX saved_listings_source_url_uq
ON saved_listings (source_id, source_url);

CREATE INDEX saved_listings_saved_at_idx
ON saved_listings (saved_at DESC);

CREATE INDEX saved_listings_transaction_type_idx
ON saved_listings (transaction_type);

CREATE INDEX saved_listings_price_idx
ON saved_listings (price)
WHERE price IS NOT NULL;

CREATE INDEX saved_listings_municipality_idx
ON saved_listings (municipality)
WHERE municipality IS NOT NULL;

CREATE INDEX saved_listings_province_idx
ON saved_listings (province)
WHERE province IS NOT NULL;

CREATE INDEX saved_listings_location_search_idx
ON saved_listings
USING GIN (
  to_tsvector(
    'simple',
    coalesce(location_label, '') || ' ' ||
    coalesce(district, '') || ' ' ||
    coalesce(municipality, '') || ' ' ||
    coalesce(province, '') || ' ' ||
    coalesce(region, '')
  )
);
```

L'indice full-text è utile solo se il filtro locale sui preferiti viene implementato già nella V1. In alternativa può essere aggiunto in una migrazione successiva.

### JSONB

Non creare subito un indice GIN generico su `raw_data`: sarebbe costoso e non esiste ancora un caso d'uso definito.

Aggiungere indici JSONB soltanto quando una query reale li richiede.

---

## 10. Strategia di upsert

Il salvataggio deve essere atomico.

Pseudo-flusso:

```text
BEGIN
  1. verifica source
  2. INSERT saved_listing
     ON CONFLICT (source_id, external_id)
     DO UPDATE SET ...
  3. recupera listing_id
  4. DELETE immagini precedenti
  5. INSERT immagini correnti
COMMIT
```

In caso di errore:

```text
ROLLBACK
```

### Regole di aggiornamento

Campi da aggiornare:

- URL canonico;
- titolo;
- descrizione;
- prezzo;
- caratteristiche;
- posizione;
- immagini;
- `last_scraped_at`;
- `source_updated_at`;
- `updated_at`;
- `raw_data`.

Campi da preservare:

- `id`;
- `created_at`;
- `saved_at`;
- `first_scraped_at`.

Se il dettaglio corrente non contiene un dato precedentemente presente, il service deve distinguere tra:

- valore realmente rimosso;
- parser che non è riuscito a leggerlo;
- informazione temporaneamente assente.

Nella V1 la regola prudente è non sovrascrivere automaticamente con `NULL` i campi importanti già valorizzati, salvo che il parser segnali esplicitamente l'assenza.

---

## 11. Repository proposti

```text
backend/models/
├── sourceRepository.js
├── savedListingRepository.js
├── listingImageRepository.js
└── scrapingRunRepository.js
```

### `sourceRepository`

Responsabilità:

- trovare fonte per codice;
- verificare se è attiva.

### `savedListingRepository`

Responsabilità:

- upsert annuncio;
- elenco paginato;
- dettaglio per ID;
- eliminazione;
- verifica esistenza per fonte e ID esterno.

### `listingImageRepository`

Responsabilità:

- inserimento multiplo;
- sostituzione immagini all'interno di una transazione.

### `scrapingRunRepository`

Responsabilità:

- apertura run;
- chiusura con successo;
- chiusura con errore.

Nessun repository deve contenere:

- `CREATE TABLE`;
- `ALTER TABLE`;
- selettori HTML;
- status code HTTP;
- accesso al Context React.

---

## 12. Configurazione `node-pg-migrate`

### 12.1 Dipendenza

Installare `node-pg-migrate` nelle `devDependencies` del backend.

### 12.2 Variabile database

Scelta consigliata:

```env
DATABASE_URL=postgres://utente:password@localhost:5432/ricerca_casa
```

La stessa variabile deve poter essere usata:

- da `pg` nell'applicazione;
- da `node-pg-migrate`;
- nei test con un database separato.

Non deve essere committato alcun valore reale.

`.env.example` deve contenere solo placeholder.

### 12.3 Script npm proposti

```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "db:create-migration": "node-pg-migrate create -m migrations",
    "db:migrate": "node-pg-migrate up -m migrations",
    "db:rollback": "node-pg-migrate down -m migrations",
    "db:status": "node-pg-migrate status -m migrations"
  }
}
```

I comandi esatti devono essere verificati con la versione installata prima dell'implementazione, ma i nomi degli script applicativi devono restare stabili.

### 12.4 Tabella migrazioni

`node-pg-migrate` gestisce una propria tabella di tracking delle migrazioni applicate.

Questa tabella:

- non deve essere modificata manualmente;
- non deve essere usata dall'applicazione;
- permette di stabilire quali migrazioni sono state eseguite.

---

## 13. Piano migrazioni V1

### `001_create_sources`

- crea `sources`;
- crea vincolo univoco su `code`;
- aggiunge timestamp.

### `002_seed_immobiliare_source`

- inserisce `immobiliare_it`;
- rollback elimina il record soltanto se non referenziato.

In alternativa seed e tabella possono stare nella stessa migrazione iniziale. Separarli rende più chiaro il cambiamento.

### `003_create_saved_listings`

- crea tabella;
- crea foreign key;
- crea check principali;
- crea indici univoci;
- crea indici di filtro essenziali.

### `004_create_listing_images`

- crea tabella immagini;
- configura `ON DELETE CASCADE`;
- crea vincolo URL per annuncio;
- crea indice ordinamento.

### `005_create_scraping_runs`

- crea tabella tecnica;
- crea check;
- crea indice su `started_at` e `status`.

### `006_drop_legacy_annunci_if_safe`

Questa migrazione deve essere aggiunta solo dopo aver verificato se la tabella legacy contiene dati utili.

Strategia:

1. controllare presenza e contenuto della tabella `annunci`;
2. se vuota, eliminarla;
3. se contiene dati, creare una migrazione di trasformazione esplicita;
4. non eliminare dati automaticamente senza verifica.

In ambiente di sviluppo, se la tabella è sicuramente temporanea e vuota, può essere eliminata durante la transizione.

---

## 14. Regole per migrazioni future

- Una migrazione già condivisa non deve essere riscritta.
- Ogni modifica successiva crea un nuovo file.
- Ogni migrazione deve avere `up` e, quando possibile, `down`.
- Il rollback non deve fingere di essere sicuro quando comporta perdita dati.
- Le migrazioni devono essere piccole e con uno scopo chiaro.
- I seed indispensabili al funzionamento possono stare nelle migrazioni.
- Dati dimostrativi e fixture non devono stare nelle migrazioni di produzione.
- Prima del merge va provato un database vuoto con tutte le migrazioni.
- Va provato almeno un rollback dell'ultima migrazione.

---

## 15. Gestione transazioni

Il pool PostgreSQL deve consentire ai service di ottenere un client dedicato:

```js
const client = await pool.connect();

try {
  await client.query('BEGIN');
  // operazioni repository con lo stesso client
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

I repository devono accettare il client transazionale come dipendenza o parametro.

Non devono aprire connessioni separate durante la stessa operazione atomica.

---

## 16. Query funzionali principali

### Elenco preferiti

Filtri supportati:

- tipo operazione;
- prezzo massimo;
- testo località;
- ordinamento per data salvataggio;
- ordinamento per prezzo.

Paginazione:

- default `limit = 20`;
- massimo consigliato `limit = 100`;
- `page` oppure cursor pagination.

Per la V1 è accettabile paginazione `LIMIT/OFFSET` perché il volume locale previsto è ridotto.

### Dettaglio

Il dettaglio deve includere immagini ordinate.

Possibili strategie:

- query principale + seconda query immagini;
- aggregazione JSON con `json_agg`.

Per mantenere semplice il repository V1 è accettabile usare due query nella stessa chiamata service.

### Eliminazione

```sql
DELETE FROM saved_listings
WHERE id = $1
RETURNING id;
```

Le immagini vengono eliminate dal database tramite `ON DELETE CASCADE`.

---

## 17. Integrità e sicurezza dati

- tutte le query devono essere parametrizzate;
- nessun nome tabella deve derivare dall'input utente;
- il backend deve verificare il dominio dell'URL prima del salvataggio;
- gli URL devono essere normalizzati;
- `external_id` non deve essere considerato attendibile se fornito soltanto dal client;
- il dettaglio recuperato dal provider deve confermare l'identità dell'annuncio;
- i payload JSON devono avere una dimensione massima ragionevole;
- i campi testuali devono avere limiti applicativi;
- i segreti non devono entrare in `raw_data`;
- gli errori PostgreSQL non devono essere restituiti direttamente al frontend.

---

## 18. Backup e ambienti

Ambienti raccomandati:

- `ricerca_casa_dev`;
- `ricerca_casa_test`;
- database produzione separato.

Ogni ambiente deve usare credenziali differenti.

Prima di migrazioni distruttive in produzione:

1. backup verificato;
2. prova su staging o copia;
3. finestra di manutenzione se necessaria;
4. piano di rollback documentato.

---

## 19. Estensioni future previste

### Multiutente

Aggiungere:

- `users`;
- `favorites` come tabella ponte `user_id + listing_id`.

In quella fase `saved_listings` rappresenterà il catalogo locale condiviso e `favorites` l'associazione personale.

### Storico prezzi

Nuova tabella:

```text
listing_price_history
- id
- listing_id
- price
- observed_at
```

### Ricerche salvate

Nuove tabelle:

- `saved_searches`;
- `search_notifications`;
- `search_runs` più completo.

### Supporto geografico avanzato

Se saranno necessarie ricerche per raggio o poligono, valutare PostGIS invece di costruire query geografiche complesse su due colonne numeriche.

---

## 20. Criteri di accettazione database

L'analisi database V1 è realizzata correttamente quando:

1. un database vuoto può essere creato eseguendo tutte le migrazioni;
2. l'avvio del server non contiene DDL;
3. `sources` contiene il provider Immobiliare.it;
4. un annuncio può essere salvato con dati parziali senza violare vincoli impropri;
5. due salvataggi dello stesso annuncio non producono duplicati;
6. un salvataggio successivo aggiorna il record esistente;
7. `saved_at` non viene perso durante l'upsert;
8. immagini e annuncio vengono salvati nella stessa transazione;
9. un errore sulle immagini causa rollback completo;
10. cancellando un annuncio vengono eliminate le immagini collegate;
11. coordinate e prezzi rispettano i check;
12. campi comuni sono interrogabili senza leggere JSONB;
13. dati aggiuntivi restano disponibili in `features` e `raw_data`;
14. nessun HTML integrale o segreto viene persistito;
15. la tabella legacy viene rimossa soltanto dopo verifica dei dati;
16. tutte le modifiche restano sul branch `dev-jox` fino a decisione esplicita di merge.

---

## 21. Decisioni definitive della V1

- PostgreSQL resta il database applicativo.
- `node-pg-migrate` è l'unico meccanismo di modifica schema.
- I model diventano repository CRUD.
- Gli annunci di ricerca non salvati restano temporanei.
- Gli annunci salvati vengono deduplicati per fonte e ID esterno.
- Il dettaglio usa colonne tipizzate più JSONB.
- Le immagini sono normalizzate in una tabella separata.
- La posizione include sia testo sia coordinate e livello di precisione.
- Il salvataggio usa una transazione.
- La V1 è single-user, ma lo schema è predisposto per introdurre utenti e preferiti personali in seguito.
