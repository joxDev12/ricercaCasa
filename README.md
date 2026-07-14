# RicercaCasa

RicercaCasa è un'applicazione web **single-user e local-first** per cercare annunci immobiliari su più portali italiani, confrontare le diverse fonti e salvare nel proprio database gli immobili di interesse.

L'obiettivo non è creare un nuovo portale pubblico, ma fornire uno strumento personale e ordinato per:

- cercare immobili in affitto o in vendita;
- filtrare per zona e prezzo massimo;
- interrogare più portali con una sola ricerca;
- ridurre i risultati duplicati;
- salvare gli annunci interessanti;
- aggiungere note personali;
- gestire appuntamenti e stato della ricerca;
- conservare localmente i dati utili anche quando l'annuncio originale cambia o viene rimosso.

> Il progetto è pensato principalmente per uso locale e personale. I portali esterni possono modificare struttura, protezioni e disponibilità delle pagine: gli scraper potrebbero quindi richiedere manutenzione nel tempo.

---

## Stato del progetto

| Versione | Stato | Contenuto principale |
|---|---|---|
| **V1** | Completata | Ricerca su Immobiliare.it, salvataggio preferiti, PostgreSQL, migrazioni, frontend React |
| **V2** | Sviluppo avanzato | Idealista e Casa.it, ricerca multi-provider, deduplicazione, note, appuntamenti e gestione dell'immobile |
| **V3** | Pianificata | WikiCasa, Subito.it e distribuzione Docker semplificata |

---

## Anteprime

### Home

![Mockup della home di RicercaCasa](docs/Mockups/v1/Home_v1.png)

### Pagina dettaglio

![Mockup della pagina dettaglio di RicercaCasa](docs/Mockups/v2/Dettaglio_v1.svg)

---

## Funzionalità disponibili

### Ricerca immobiliare

L'utente può impostare:

- zona geografica;
- affitto oppure compravendita;
- prezzo massimo;
- uno o più portali da interrogare;
- paginazione dei risultati, quando supportata dal provider.

I provider attualmente integrati sono:

- **Immobiliare.it**;
- **Idealista**;
- **Casa.it**.

La ricerca viene eseguita dal backend. Ogni scraper converte i dati del proprio portale in un formato comune, evitando che il frontend dipenda dall'HTML specifico dei singoli siti.

### Gestione degli errori dei provider

Le ricerche sui diversi portali vengono eseguite in modo indipendente.

Se un provider non risponde ma gli altri funzionano, RicercaCasa restituisce comunque i risultati disponibili e mostra un avviso per la fonte non raggiungibile.

### Salvataggio locale

I risultati delle ricerche sono temporanei e non vengono salvati automaticamente.

Quando l'utente seleziona **Salva**, l'annuncio viene memorizzato nel database PostgreSQL insieme ai dati disponibili, ad esempio:

- titolo;
- prezzo;
- tipo di operazione;
- superficie;
- locali;
- piano;
- descrizione;
- posizione;
- inserzionista;
- immagine principale e galleria;
- URL e identificativo del portale;
- caratteristiche aggiuntive;
- date di acquisizione e aggiornamento.

### Deduplicazione

Lo stesso immobile può essere pubblicato contemporaneamente su più portali e con testi leggermente diversi.

RicercaCasa gestisce due livelli di deduplicazione:

1. **deduplicazione interna al provider**, basata sulla fonte e sull'identificativo esterno;
2. **deduplicazione cross-provider**, basata su segnali normalizzati come:
   - comune e zona;
   - indirizzo e numero civico;
   - superficie con tolleranza;
   - numero di locali;
   - tipologia dell'immobile;
   - piano;
   - prezzo simile;
   - somiglianza di titolo e descrizione;
   - inserzionista.

Gli annunci riconosciuti come lo stesso immobile possono essere collegati a un unico **gruppo logico**, mantenendo comunque tutte le fonti originali.

I casi incerti vengono conservati come possibili duplicati e possono essere confermati o rifiutati manualmente.

### Pagina dettaglio locale

La pagina dettaglio di un immobile salvato permette di visualizzare:

- dati principali;
- descrizione completa;
- caratteristiche tecniche;
- immagini;
- posizione;
- fonti collegate;
- stato gestionale;
- note personali;
- appuntamenti.

### Stato gestionale

Ogni immobile può attraversare stati come:

- salvato;
- da contattare;
- contattato;
- appuntamento programmato;
- visitato;
- scartato.

### Note

È possibile creare, modificare ed eliminare note personali collegate all'immobile logico.

Le note non appartengono al singolo annuncio sorgente: restano quindi disponibili anche quando lo stesso immobile è collegato a più portali.

### Appuntamenti

Per ogni immobile è possibile registrare appuntamenti con:

- data e ora;
- luogo;
- eventuale contatto;
- stato;
- note aggiuntive.

---

## Evoluzione del progetto

## V1 — Fondazione dell'applicazione

La V1 ha trasformato il repository iniziale in un'applicazione completa con backend, database e frontend separati.

### Backend V1

Sono stati introdotti:

- Express con struttura a layer;
- controller separati dalla logica di business;
- service dedicati ai casi d'uso;
- repository dedicati alle query PostgreSQL;
- validator con `express-validator`;
- gestione centralizzata degli errori;
- CORS;
- Helmet;
- rate limiting;
- scraper JavaScript isolato in `backend/scraper`;
- primo adapter per Immobiliare.it;
- normalizzatori e parser condivisi;
- test con il test runner nativo di Node.js.

La direzione delle dipendenze principali è:

```text
route -> controller -> service -> repository / scraper
```

Lo scraper non conosce Express, React o il database.

### Database V1

La creazione delle tabelle è stata rimossa dai model.

Tutte le modifiche allo schema vengono gestite con **node-pg-migrate**.

Le entità iniziali sono:

- `sources`;
- `saved_listings`;
- `listing_images`;
- `scraping_runs`.

Sono stati inoltre introdotti:

- vincoli di integrità;
- chiavi esterne;
- indici;
- transazioni per il salvataggio composto;
- cancellazione automatica delle immagini tramite `ON DELETE CASCADE`;
- upsert degli annunci già presenti.

### Frontend V1

Il template iniziale di Vite è stato sostituito da una struttura React + TypeScript organizzata per responsabilità:

- routing con React Router;
- componenti UI riutilizzabili;
- componenti di layout;
- componenti di feedback;
- feature separate per ricerca e preferiti;
- Context piccoli e distinti;
- custom hook;
- service API;
- tipi TypeScript;
- Tailwind CSS;
- gestione di loading, errore e stato vuoto;
- persistenza temporanea della ricerca in `sessionStorage`.

---

## V2 — Multi-provider e gestione immobiliare

La V2 estende l'applicazione senza riscrivere la fondazione V1.

### Nuovi provider

Sono stati aggiunti adapter separati per:

- Idealista;
- Casa.it.

Il registry degli scraper permette al backend di selezionare il provider corretto senza introdurre condizioni sparse nell'applicazione.

### Ricerca multi-provider

La V2 permette di interrogare più provider in parallelo.

Il backend:

1. verifica quali fonti sono attive nel database;
2. prepara i criteri specifici per ogni portale;
3. esegue le ricerche;
4. raccoglie successi ed errori separatamente;
5. normalizza i dati;
6. aggrega i possibili duplicati;
7. restituisce risultati e metadati per provider.

### Nuovo modello dei duplicati

La V2 separa:

- l'**annuncio sorgente**, rappresentato da `saved_listings`;
- l'**immobile logico**, rappresentato da `property_groups`.

Questo consente di collegare più annunci provenienti da portali differenti allo stesso immobile reale.

Sono state introdotte anche informazioni di deduplicazione come:

- indirizzo normalizzato;
- chiave geografica normalizzata;
- fingerprint;
- payload dei segnali usati nel confronto;
- punteggio di similarità;
- motivazioni del match;
- versione dell'algoritmo;
- decisione manuale sul candidato duplicato.

### Gestione personale dell'immobile

La V2 aggiunge:

- stato gestionale del gruppo;
- note CRUD;
- appuntamenti CRUD;
- fonti multiple nella pagina dettaglio;
- eliminazione del singolo annuncio sorgente oppure dell'intero immobile logico;
- candidati duplicati confermabili o rifiutabili.

I dati personali, come note e appuntamenti, sono separati dai dati acquisiti dai portali. Una nuova operazione di scraping non può quindi sovrascriverli.

---

## V3 — Roadmap

La V3 è pianificata e comprenderà due aree principali.

### Nuovi provider

Verranno aggiunti adapter dedicati per:

- **WikiCasa**;
- **Subito.it**.

I nuovi scraper dovranno rispettare lo stesso contratto comune già utilizzato dagli altri provider e produrre gli stessi modelli normalizzati.

La deduplicazione dovrà continuare a funzionare indipendentemente dal numero di fonti integrate.

### Distribuzione Docker

La V3 semplificherà l'installazione locale tramite Docker.

La soluzione prevista non inserirà database, backend e frontend nello stesso container. Verrà utilizzato **Docker Compose** con servizi separati:

```text
PostgreSQL container
        |
Backend Node.js container
        |
Frontend container
```

L'utente potrà avviare l'intera piattaforma con un solo comando:

```bash
docker compose up -d
```

La configurazione prevista comprenderà:

- immagine del backend;
- immagine del frontend;
- immagine ufficiale PostgreSQL;
- volume persistente per il database;
- rete interna tra i servizi;
- healthcheck;
- applicazione automatica o controllata delle migrazioni;
- file `.env.example` dedicato a Docker;
- configurazione pronta per l'uso locale.

Questo renderà RicercaCasa utilizzabile anche da chi non vuole installare manualmente Node.js, dipendenze npm e PostgreSQL.

---

## Stack tecnologico

### Backend

- Node.js;
- JavaScript CommonJS;
- Express 5;
- PostgreSQL;
- `pg`;
- `node-pg-migrate`;
- Cheerio;
- `express-validator`;
- Helmet;
- `express-rate-limit`;
- test runner nativo di Node.js.

### Frontend

- React 19;
- TypeScript;
- Vite;
- React Router;
- Tailwind CSS;
- Context API;
- custom hook;
- Fetch API.

---

## Struttura del repository

```text
ricercaCasa/
├── backend/
│   ├── config/
│   ├── controller/
│   ├── middleware/
│   ├── migrations/
│   ├── models/
│   ├── routes/
│   ├── scraper/
│   │   ├── immobiliareItScraper.js
│   │   ├── idealistaItScraper.js
│   │   ├── casaItScraper.js
│   │   └── shared/
│   ├── services/
│   ├── tests/
│   ├── utils/
│   ├── validators/
│   ├── app.js
│   ├── server.js
│   └── package.json
├── docs/
│   ├── AD/
│   ├── AF/
│   └── Mockups/
├── ricercaCasa/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── context/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── styles/
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

La cartella frontend si chiama attualmente `ricercaCasa`, quindi dopo il clone il percorso completo sarà:

```text
ricercaCasa/ricercaCasa
```

---

# Installazione locale

## Requisiti

Prima di iniziare servono:

- Git;
- una versione recente LTS di Node.js;
- npm;
- PostgreSQL;
- un database locale sul quale l'utente abbia permesso di creare tabelle e indici.

Verifica gli strumenti:

```bash
git --version
node --version
npm --version
psql --version
```

---

## 1. Clonare il repository

```bash
git clone https://github.com/joxDev12/ricercaCasa.git
cd ricercaCasa
```

---

## 2. Creare il database PostgreSQL

Accedi a PostgreSQL con un utente amministratore:

```bash
psql -U postgres
```

Crea utente e database:

```sql
CREATE USER ricercacasa_user WITH PASSWORD 'scegli_una_password_sicura';
CREATE DATABASE ricerca_casa OWNER ricercacasa_user;
```

Esci da `psql`:

```sql
\q
```

Puoi usare nomi differenti, purché vengano riportati correttamente nel file `.env` del backend.

---

## 3. Configurare il backend

Entra nella cartella backend:

```bash
cd backend
```

Installa le dipendenze:

```bash
npm install
```

Copia il file di esempio:

```bash
cp .env.example .env
```

Su PowerShell:

```powershell
Copy-Item .env.example .env
```

Configurazione consigliata di `backend/.env`:

```env
FRONTEND_ORIGIN=http://localhost:5173
PORT=3000
SCRAPE_TIMEOUT_MS=10000
ALLOW_PROVIDER_SCRAPING=true

DATABASE_URL=postgres://ricercacasa_user:scegli_una_password_sicura@localhost:5432/ricerca_casa

NODE_ENV=development
```

È possibile usare `DATABASE_URL` oppure i campi separati:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ricerca_casa
DB_USER=ricercacasa_user
DB_PASS=scegli_una_password_sicura
```

Quando `DATABASE_URL` è valorizzato, il backend usa quella connessione.

Non inserire credenziali reali in `.env.example` e non committare il file `.env`.

---

## 4. Applicare le migrazioni

Sempre dalla cartella `backend`:

```bash
npm run db:migrate
```

Controlla lo stato delle migrazioni:

```bash
npm run db:status
```

Per annullare l'ultima migrazione, quando il rollback è previsto e sicuro:

```bash
npm run db:rollback
```

Le migrazioni V2 sono additive. Non modificare manualmente le vecchie migrazioni già applicate.

---

## 5. Avviare il backend

Modalità sviluppo:

```bash
npm run dev
```

Avvio normale:

```bash
npm start
```

Per verificare il server:

```text
http://localhost:3000/health
```

La risposta prevista è:

```json
{
  "ok": true
}
```

Lascia il backend in esecuzione e apri un secondo terminale.

---

## 6. Configurare il frontend

Dal percorso principale del repository:

```bash
cd ricercaCasa
```

Se il terminale si trova ancora in `backend`:

```bash
cd ../ricercaCasa
```

Installa le dipendenze:

```bash
npm install
```

Copia il file ambiente:

```bash
cp .env.example .env
```

Su PowerShell:

```powershell
Copy-Item .env.example .env
```

Durante lo sviluppo locale `VITE_API_BASE_URL` può rimanere vuoto:

```env
VITE_API_BASE_URL=
```

Vite inoltra automaticamente le richieste `/api` e `/health` al backend in esecuzione su `http://localhost:3000`.

In una configurazione senza proxy può essere impostato:

```env
VITE_API_BASE_URL=http://localhost:3000
```

---

## 7. Avviare il frontend

```bash
npm run dev
```

Apri nel browser:

```text
http://localhost:5173
```

A questo punto devono essere attivi:

- PostgreSQL;
- backend sulla porta `3000`;
- frontend sulla porta `5173`.

---

## Comandi utili

### Backend

```bash
npm run dev
npm start
npm test
npm run db:migrate
npm run db:rollback
npm run db:status
npm run db:create-migration -- nome_migrazione
```

### Frontend

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

---

## Eseguire i test

Backend:

```bash
cd backend
npm test
```

Frontend — controllo statico e build:

```bash
cd ricercaCasa
npm run lint
npm run build
```

---

## Problemi comuni

### `SCHEMA_NOT_READY`

Il database non contiene tutte le tabelle richieste.

Esegui:

```bash
cd backend
npm run db:migrate
```

### Il frontend non raggiunge il backend

Controlla che:

- il backend sia in esecuzione sulla porta `3000`;
- il frontend sia avviato con Vite sulla porta `5173`;
- `FRONTEND_ORIGIN` sia `http://localhost:5173`;
- il proxy in `vite.config.ts` non sia stato rimosso;
- `VITE_API_BASE_URL` sia coerente con la modalità di avvio.

### Errore di connessione PostgreSQL

Controlla:

- che PostgreSQL sia avviato;
- nome del database;
- utente;
- password;
- porta;
- contenuto di `DATABASE_URL`;
- permessi dell'utente sul database.

### Un provider non restituisce risultati

I portali esterni possono:

- cambiare HTML o dati strutturati;
- applicare rate limit;
- restituire challenge anti-bot;
- bloccare temporaneamente richieste;
- cambiare URL e paginazione.

Controlla i log del backend e verifica se gli altri provider continuano a restituire risultati.

Non aumentare indiscriminatamente frequenza, concorrenza o numero di retry.

### Risultati duplicati

La deduplicazione è volutamente prudente.

Due annunci incerti non vengono uniti automaticamente soltanto perché hanno prezzo o titolo simile. Controlla la sezione dei candidati duplicati e applica una decisione manuale quando necessario.

---

## Documentazione tecnica

Le analisi complete sono disponibili in:

- [Analisi Funzionale V1](docs/AF/v1-analisi-funzionale.md)
- [Analisi Database V1](docs/AD/v1-analisi-database.md)
- [Analisi Funzionale V2](docs/AF/v2-analisi-funzionale.md)
- [Analisi Database V2](docs/AD/v2-analisi-database.md)

---

## Principi del progetto

- un file deve avere una responsabilità principale;
- gli scraper non devono contenere logica Express o SQL;
- i controller non devono contenere query o parsing HTML;
- i repository non devono contenere DDL;
- le modifiche allo schema devono passare dalle migrazioni;
- i componenti React devono restare piccoli e componibili;
- le chiamate API devono restare nei service dedicati;
- lo stato condiviso deve essere limitato e motivato;
- i dati personali non devono essere sovrascritti dallo scraping;
- i match cross-provider devono essere prudenti e verificabili;
- i segreti devono restare fuori dal repository.

---

## Limitazioni attuali

- applicazione single-user;
- nessuna autenticazione;
- utilizzo principalmente locale;
- nessuna notifica email o push;
- nessuna ricerca pianificata automatica;
- scraper dipendenti dalla struttura dei portali esterni;
- installazione manuale di PostgreSQL, backend e frontend fino alla V3;
- Docker non ancora disponibile;
- WikiCasa e Subito.it non ancora integrati.

---

## Contributi e sviluppo

Prima di aggiungere un nuovo provider:

1. creare un adapter separato in `backend/scraper`;
2. implementare il contratto comune;
3. validare dominio e URL canonici;
4. restituire dati normalizzati;
5. aggiungere fixture e test;
6. registrare la fonte tramite una nuova migrazione;
7. verificare la deduplicazione cross-provider;
8. non modificare migrazioni già condivise.

Per modifiche importanti è consigliato lavorare su un branch dedicato e aprire una pull request verso `main`.
