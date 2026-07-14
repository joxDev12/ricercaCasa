# RicercaCasa

RicercaCasa è un'applicazione web **single-user, local-first e self-hosted** per cercare annunci immobiliari su più portali italiani, confrontare fonti differenti e organizzare localmente gli immobili di interesse.

L'applicazione non vuole sostituire i portali immobiliari. Fornisce un unico ambiente personale per:

- cercare immobili in affitto o vendita;
- interrogare più provider;
- ridurre i risultati duplicati;
- salvare gli annunci nel proprio database;
- collegare più annunci allo stesso immobile;
- aggiungere note e appuntamenti;
- gestire lo stato della ricerca;
- conservare i dati utili anche quando la pagina originale cambia o viene rimossa.

> Gli scraper dipendono dalla struttura e dalla disponibilità dei portali esterni. Possono richiedere manutenzione quando un provider cambia HTML, URL, protezioni o modalità di accesso.

---

## Stato del progetto

| Versione | Stato | Obiettivo principale |
|---|---|---|
| **V1** | Completata | Fondazione full stack, Immobiliare.it, preferiti, PostgreSQL e migrazioni |
| **V2** | Sviluppo avanzato | Idealista, Casa.it, ricerca multi-provider, deduplicazione, note e appuntamenti |
| **V3** | Pianificata | Docker Compose, installer guidato, impostazioni e aggiornamenti dalla dashboard |
| **V4** | Futura | Valutazione integrazione WikiCasa e Subito.it |

La V3 è dedicata alla distribuzione e all'affidabilità. **WikiCasa e Subito.it non fanno parte della V3.**

---

## Anteprime

### Home

![Mockup della home di RicercaCasa](docs/Mockups/v1/Home_v1.png)

### Pagina dettaglio

![Mockup della pagina dettaglio di RicercaCasa](docs/Mockups/v2/Dettaglio_v1.svg)

---

## Funzionalità disponibili nella V2

### Ricerca multi-provider

Provider integrati:

- Immobiliare.it;
- Idealista;
- Casa.it.

Criteri principali:

- zona;
- affitto o vendita;
- prezzo massimo;
- provider da interrogare;
- paginazione quando supportata.

Le ricerche dei provider sono indipendenti. Se una fonte fallisce ma le altre rispondono, il backend restituisce i risultati disponibili insieme a un avviso non bloccante.

### Normalizzazione e deduplicazione

Ogni scraper converte i dati del proprio portale in un modello comune.

La deduplicazione distingue:

1. duplicati esatti della stessa fonte;
2. annunci provenienti da portali diversi che potrebbero riferirsi allo stesso immobile.

I confronti utilizzano segnali come:

- comune e zona;
- indirizzo e numero civico;
- superficie;
- locali;
- tipologia;
- piano;
- prezzo;
- titolo e descrizione;
- inserzionista;
- immagini normalizzate.

Ogni gruppo logico può contenere al massimo un annuncio per provider. Le fonti originali restano comunque separate e consultabili.

### Salvataggio locale

Gli annunci vengono salvati soltanto quando l'utente seleziona **Salva**.

Il database conserva, quando disponibili:

- titolo e descrizione;
- prezzo e tipo di operazione;
- superficie, locali e piano;
- posizione;
- inserzionista;
- immagini;
- URL e identificativo della fonte;
- dati normalizzati usati nella deduplicazione;
- date di acquisizione e aggiornamento.

### Gestione dell'immobile

Ogni immobile logico può avere:

- più fonti collegate;
- stato gestionale;
- note personali;
- appuntamenti;
- candidati duplicati da confermare o rifiutare.

Gli stati previsti comprendono:

- salvato;
- da contattare;
- contattato;
- appuntamento programmato;
- visitato;
- scartato.

I dati personali non vengono sovrascritti da un nuovo scraping.

---

# V3 — Distribuzione self-hosted semplificata

La V3 renderà RicercaCasa installabile da utenti non tecnici tramite Docker.

## Architettura prevista

```text
frontend
backend
database PostgreSQL
updater + wizard
```

Frontend e backend appartengono alla stessa release applicativa. L'updater possiede invece una versione indipendente, perché può essere aggiornato prima del resto della piattaforma.

Esempio:

```text
RicercaCasa 3.1.0
├── frontend 3.1.0
├── backend 3.1.0
├── updater 1.2.0
└── PostgreSQL 17
```

## Installazione guidata

L'utente non dovrà:

- installare Node.js;
- installare PostgreSQL;
- creare manualmente database e utente;
- scegliere una password PostgreSQL;
- modificare file Compose tecnici.

L'installer genererà automaticamente i secret e aprirà un wizard locale.

Il wizard V3 richiederà soltanto impostazioni comprensibili:

- nome visualizzato;
- email di contatto;
- lingua;
- fuso orario;
- conferma delle condizioni d'uso locale degli scraper.

## Pagina impostazioni

Dopo l'installazione l'utente potrà modificare:

- nome;
- email;
- lingua;
- fuso orario;
- configurazioni delle funzionalità future.

La pagina mostrerà anche:

- versione installata;
- versione updater;
- stato servizi;
- ultimo aggiornamento;
- disponibilità di nuove versioni.

Le credenziali del database non verranno mostrate perché vengono gestite automaticamente.

## Aggiornamenti dalla dashboard

Quando è disponibile una nuova release, la dashboard mostrerà:

- versione attuale;
- versione disponibile;
- note di rilascio;
- eventuale migrazione database;
- eventuale nuova configurazione richiesta;
- pulsante **Aggiorna**.

L'updater coordinerà:

1. verifica del release manifest;
2. controllo compatibilità e spazio disponibile;
3. aggiornamento di sé stesso, quando richiesto;
4. ripresa automatica del job dopo il proprio riavvio;
5. download del frontend e backend della stessa release;
6. backup PostgreSQL;
7. migrazioni;
8. riavvio backend e frontend;
9. healthcheck;
10. rollback applicativo in caso di errore.

Il backend non avrà accesso al Docker socket. Il controllo dei container resterà confinato nell'updater.

## Wizard dopo gli aggiornamenti

Una futura feature può dichiarare una configurazione necessaria.

Esempio futuro:

```text
RicercaCasa aggiornata
Nuova funzione: invio email
[Configura ora]
```

L'updater presenta il wizard, mentre il backend:

- definisce i campi;
- valida i valori;
- salva le impostazioni;
- abilita la feature.

I task possono essere:

- bloccanti, se la piattaforma non può funzionare correttamente senza configurazione;
- non bloccanti, se la feature può restare spenta finché non viene configurata.

---

## Setup locale V3 da Docker

Stato attuale repository:

- backend con health `live` e `ready`;
- tabelle V3 per installazione, preferenze, feature e storico update;
- pagina `Impostazioni` nel frontend;
- updater locale minimale con wizard iniziale;
- `Dockerfile` per backend, frontend, updater;
- `compose.yaml` e `install.sh` per prova locale;
- workflow CI con test, build, migrazioni e build immagini.

### Prerequisiti

- Docker Engine oppure Docker Desktop;
- Docker Compose v2.

### Avvio stack locale

Dal repository:

```bash
chmod +x deployment/install.sh
./deployment/install.sh
```

URL locali:

- dashboard: `http://127.0.0.1:8080/`
- wizard/updater: `http://127.0.0.1:8081/`

L'installer locale:

- genera `deployment/secrets/postgres_password`;
- genera `deployment/secrets/app_secret`;
- genera `deployment/secrets/setup_token`;
- crea `deployment/release.env` se assente;
- builda immagini locali e avvia stack.

### Wizard iniziale

Wizard vive in updater e inoltra richieste a backend interno con token bootstrap.

Campi attuali:

- nome visualizzato;
- email contatto;
- lingua;
- fuso orario;
- consenso uso locale scraper;
- conferma finale setup.

Dopo completamento:

- backend marca `app_installation.setup_status = completed`;
- API bootstrap non completano più setup seconda volta;
- dashboard `Impostazioni` mostra stato installazione e versioni.

### Simulare disponibilita update

Updater minimale legge manifest locale da:

```text
deployment/state/manifests/latest.json
```

Per prova rapida:

```bash
mkdir -p deployment/state/manifests
cp deployment/manifest.example.json deployment/state/manifests/latest.json
```

Endpoint utile:

```text
GET http://127.0.0.1:8081/updater/releases/latest
```

Questa base serve per prossima fase: provare esperienza utente di update e iterare wizard/update flow dopo primo deploy.

### Comandi utili

```bash
docker compose -f deployment/compose.yaml --env-file deployment/release.env ps
docker compose -f deployment/compose.yaml --env-file deployment/release.env logs -f updater
docker compose -f deployment/compose.yaml --env-file deployment/release.env logs -f backend
docker compose -f deployment/compose.yaml --env-file deployment/release.env down
```

### Stato updater attuale

Updater presente oggi copre:

- pagina wizard iniziale;
- proxy bootstrap verso backend con `x-setup-token`;
- endpoint stato locale;
- lettura manifest locale per simulazioni update.

Non copre ancora:

- pull digest remoto;
- backup automatico PostgreSQL;
- state machine completa update;
- self-update updater;
- rollback coordinato.
- non bloccanti, se soltanto la nuova funzione deve restare disabilitata.

---

## Stack tecnologico

### Backend

- Node.js;
- Express 5;
- JavaScript CommonJS;
- PostgreSQL;
- `pg`;
- `node-pg-migrate`;
- Cheerio;
- `express-validator`;
- Helmet;
- rate limiting;
- test runner nativo Node.js.

### Frontend

- React 19;
- TypeScript;
- Vite;
- React Router;
- Tailwind CSS;
- Context API;
- custom hook;
- Fetch API.

### Distribuzione V3

- Docker;
- Docker Compose v2;
- GitHub Actions;
- GitHub Container Registry;
- immagini versionate tramite SemVer e digest;
- release manifest;
- backup PostgreSQL;
- healthcheck e rollback.

---

## Struttura attuale del repository

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
│   ├── Mockups/
│   └── V3/
├── ricercaCasa/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

Struttura prevista durante la V3:

```text
├── updater/
├── deployment/
└── .github/workflows/
```

---

# Installazione attuale per sviluppo

Fino al completamento della V3, l'avvio resta manuale.

## Requisiti

- Git;
- Node.js LTS recente;
- npm;
- PostgreSQL.

## Clone

```bash
git clone https://github.com/joxDev12/ricercaCasa.git
cd ricercaCasa
```

## Backend

```bash
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

Su PowerShell:

```powershell
Copy-Item .env.example .env
```

Configurazione di sviluppo indicativa:

```env
FRONTEND_ORIGIN=http://localhost:5173
PORT=3000
SCRAPE_TIMEOUT_MS=10000
ALLOW_PROVIDER_SCRAPING=true
DATABASE_URL=postgres://utente:password@localhost:5432/ricerca_casa
NODE_ENV=development
```

Health endpoint attuale:

```text
http://localhost:3000/health
```

## Frontend

Da un secondo terminale:

```bash
cd ricercaCasa
npm install
cp .env.example .env
npm run dev
```

Aprire:

```text
http://localhost:5173
```

Durante lo sviluppo `VITE_API_BASE_URL` può rimanere vuoto perché Vite inoltra `/api` e `/health` al backend locale.

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
npm run lint
npm run build
npm run preview
```

---

## Documentazione tecnica

### Analisi funzionali

- [Analisi Funzionale V1](docs/AF/v1-analisi-funzionale.md)
- [Analisi Funzionale V2](docs/AF/v2-analisi-funzionale.md)
- [Analisi Funzionale V3](docs/AF/v3-analisi-funzionale.md)

### Analisi database

- [Analisi Database V1](docs/AD/v1-analisi-database.md)
- [Analisi Database V2](docs/AD/v2-analisi-database.md)
- [Analisi Database V3](docs/AD/v3-analisi-database.md)

### Piano tecnico V3

- [Checklist bugfix e pre-deploy](docs/V3/v3-checklist-pre-deploy.md)
- [Architettura Wizard, Updater, Docker Compose e GitHub Actions](docs/V3/v3-architettura-wizard-updater-docker.md)

---

## Principi del progetto

- route, controller, service e repository restano separati;
- gli scraper non contengono logica Express o SQL;
- i repository non contengono DDL;
- lo schema cambia soltanto tramite migrazioni;
- i dati personali non vengono sovrascritti dallo scraping;
- i match cross-provider restano prudenti e verificabili;
- frontend e backend vengono aggiornati come un'unica release;
- il backend non controlla Docker;
- i secret restano fuori dal repository e dalle API;
- database e backend non vengono esposti sull'host nell'installazione V3 predefinita;
- nessuna release stabile viene pubblicata senza test, backup verificato e healthcheck.

---

## Limitazioni attuali

- applicazione single-user;
- nessuna autenticazione per accesso remoto;
- utilizzo principalmente locale;
- nessuna email o notifica push;
- nessuna ricerca pianificata automatica;
- scraper dipendenti dai portali esterni;
- Docker e updater non ancora implementati;
- WikiCasa e Subito.it rinviati alla V4.

---

## Roadmap immediata V3

1. chiusura bugfix pre-deploy;
2. pipeline CI;
3. impostazioni e wizard backend/frontend;
4. Dockerfile production;
5. Compose a quattro container;
6. updater base;
7. backup e rollback;
8. self-update updater;
9. wizard post-update;
10. installer Linux e Windows;
11. pubblicazione GHCR;
12. release candidate V3.
