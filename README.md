# RicercaCasa

**RicercaCasa** è un'applicazione web **local-first, single-user e self-hosted** per cercare annunci immobiliari su più portali, confrontare fonti differenti e organizzare in un unico posto gli immobili di interesse.

La piattaforma gira interamente tramite Docker sul computer dell'utente. Dati, preferiti, note e configurazioni restano nel database locale.

> **Release corrente:** `v3.0.0`  
> **Stato:** prima release pubblica installabile tramite updater guidato

---

## Perché RicercaCasa

Cercare casa significa spesso ripetere le stesse ricerche su portali diversi, aprire molti annunci duplicati e perdere informazioni quando una pagina viene modificata o rimossa.

RicercaCasa offre un ambiente personale per:

- interrogare più provider da una sola interfaccia;
- normalizzare risultati con strutture differenti;
- ridurre annunci duplicati;
- salvare localmente gli immobili interessanti;
- collegare più annunci allo stesso immobile;
- aggiungere note e appuntamenti;
- gestire lo stato della ricerca;
- conservare dati utili anche quando la fonte originale cambia.

## Funzionalità principali

### Ricerca multi-provider

Provider attualmente integrati:

- Immobiliare.it;
- Idealista;
- Casa.it.

Ogni provider viene interrogato in modo indipendente. Se una fonte non risponde, gli altri risultati possono comunque essere mostrati con un avviso non bloccante.

### Normalizzazione e deduplicazione

Gli scraper convertono i dati dei portali in un modello comune. Il sistema confronta elementi come:

- posizione e indirizzo;
- prezzo;
- superficie e numero di locali;
- tipologia e piano;
- descrizione;
- inserzionista;
- immagini normalizzate.

Le fonti originali restano separate e consultabili anche quando vengono associate allo stesso immobile logico.

### Gestione personale degli immobili

Ogni immobile salvato può contenere:

- più fonti collegate;
- stato della ricerca;
- note personali;
- appuntamenti;
- candidati duplicati da verificare.

Stati disponibili:

```text
salvato
→ da contattare
→ contattato
→ appuntamento programmato
→ visitato
→ scartato
```

I dati personali non vengono sovrascritti da una nuova acquisizione.

---

## Installazione rapida

### Requisiti

- Docker Engine oppure Docker Desktop;
- Docker Compose v2;
- Linux, macOS o Windows con ambiente Docker compatibile.

### Installa la release pubblica

```bash
curl -fsSL https://github.com/joxDev12/ricercaCasa/releases/download/v3.0.0/install.sh | sh
```

L'installer:

1. crea `~/.ricercacasa`;
2. scarica e verifica gli asset della release;
3. genera automaticamente i secret con permessi `600`;
4. avvia soltanto l'updater;
5. lascia all'updater la gestione della prima installazione.

Apri quindi:

```text
Updater e configurazione: http://127.0.0.1:8081
Applicazione:             http://127.0.0.1:8080
```

Dalla schermata updater vengono avviati automaticamente:

- PostgreSQL;
- migrazioni database;
- backend;
- frontend;
- controlli di readiness;
- wizard iniziale.

Non è necessario installare Node.js, PostgreSQL o dipendenze del progetto sul sistema host.

---

## Architettura

```text
Browser
   │
   ├── http://127.0.0.1:8080
   │        Frontend React
   │              │
   │        Backend Express
   │              │
   │         PostgreSQL 17
   │
   └── http://127.0.0.1:8081
            Updater / Wizard
                  │
             Docker Engine
```

Componenti principali:

| Componente | Responsabilità |
|---|---|
| Frontend | Interfaccia, ricerca, preferiti, note, appuntamenti e impostazioni |
| Backend | API, scraping, normalizzazione, deduplicazione e logica applicativa |
| PostgreSQL | Persistenza locale dei dati |
| Updater | Bootstrap, installazione, migrazioni, healthcheck e gestione release |

Frontend e backend condividono la versione della piattaforma. L'updater mantiene una versione indipendente per poter evolvere separatamente dal resto dello stack.

## Distribuzione e affidabilità

La release pubblica usa:

- immagini Docker pubblicate su GitHub Container Registry;
- tag di versione SemVer;
- riferimenti immagine tramite digest SHA256 nel manifest;
- checksum SHA256 degli asset scaricati;
- Compose pubblico senza istruzioni `build:`;
- migrazioni eseguite come servizio one-shot;
- healthcheck e readiness prima di dichiarare completata l'installazione;
- CI con test backend, frontend, updater e smoke test Docker;
- smoke test finale eseguito sugli asset reali della release.

Il backend non accede al Docker socket. Il controllo Docker è confinato nell'updater, che espone soltanto operazioni applicative predefinite.

> L'accesso al Docker socket concede privilegi elevati sull'host. RicercaCasa limita questa capacità al container updater e non espone comandi shell arbitrari dalla dashboard.

---

## Stack tecnologico

### Frontend

- React 19;
- TypeScript;
- Vite;
- React Router;
- Tailwind CSS;
- Fetch API.

### Backend

- Node.js;
- Express 5;
- PostgreSQL;
- `pg`;
- `node-pg-migrate`;
- Cheerio;
- `express-validator`;
- Helmet;
- rate limiting;
- test runner nativo Node.js.

### Infrastruttura

- Docker;
- Docker Compose v2;
- PostgreSQL 17;
- GitHub Actions;
- GitHub Container Registry;
- release manifest e checksum SHA256.

---

## Stato del progetto

| Area | Stato |
|---|---|
| Ricerca multi-provider | Disponibile |
| Normalizzazione e deduplicazione | Disponibile |
| Salvataggio locale | Disponibile |
| Note e appuntamenti | Disponibile |
| Impostazioni e wizard iniziale | Disponibile |
| Installazione updater-first | Disponibile in `v3.0.0` |
| Immagini GHCR e release pubblica | Disponibile |
| Aggiornamento automatico tra versioni | In sviluppo |
| Backup automatico prima degli update | Pianificato |
| Rollback coordinato | Pianificato |
| Monitor compatibilità provider | Pianificato |

## Prossimi passi

### 1. Motore di aggiornamento `3.0.0 → 3.0.1`

Il prossimo obiettivo è rendere operativo l'aggiornamento dalla dashboard con una state machine persistente:

```text
verifica manifest
→ controllo compatibilità
→ backup PostgreSQL
→ download immagini
→ migrazioni
→ riavvio coordinato
→ healthcheck
→ completamento o rollback
```

Il job dovrà poter riprendere anche dopo il riavvio dell'updater.

### 2. Backup e rollback

Prima delle release che modificano il database verranno introdotti:

- backup PostgreSQL automatico;
- storico degli aggiornamenti;
- ripristino delle immagini precedenti;
- messaggi di errore e log consultabili dalla dashboard.

### 3. Monitor compatibilità provider

I provider esterni possono cambiare HTML, endpoint o protezioni senza preavviso. È prevista una funzione che distingua tra:

```text
operativo
in stato degradato
temporaneamente non raggiungibile
incompatibile con la versione installata
disabilitato fino a un aggiornamento
```

Questo eviterà risultati vuoti o dati errati senza spiegazioni.

### 4. Evoluzione della ricerca

Interventi futuri:

- miglioramento della qualità di deduplicazione;
- gestione più avanzata delle immagini;
- filtri aggiuntivi;
- valutazione di nuovi provider;
- notifiche opzionali e automazioni locali.

---

## Sviluppo locale

Clona il repository:

```bash
git clone https://github.com/joxDev12/ricercaCasa.git
cd ricercaCasa
```

La struttura principale è:

```text
ricercaCasa/
├── backend/          API, scraper, servizi e migrazioni
├── ricercaCasa/      frontend React e TypeScript
├── updater/          installer, wizard e orchestrazione Docker
├── deployment/       Compose, manifest, installer e smoke test
├── docs/             documentazione tecnica e mockup
└── .github/workflows CI e pipeline release
```

Test principali:

```bash
cd backend && npm test
cd ../ricercaCasa && npm run lint && npm run build
cd .. && node --test updater/tests/*.test.js
```

La pipeline CI verifica anche migrazioni, build delle immagini e installazione updater-first in un ambiente Docker pulito.

---

## Anteprime

### Home

![Mockup della home di RicercaCasa](docs/Mockups/v1/Home_v1.png)

### Dettaglio immobile

![Mockup della pagina dettaglio di RicercaCasa](docs/Mockups/v2/Dettaglio_v1.svg)

---

## Nota sui provider

RicercaCasa non è affiliato ai portali immobiliari interrogati e non intende sostituirli.

Gli scraper dipendono dalla struttura e dalla disponibilità dei siti esterni. Un provider può richiedere manutenzione quando cambia HTML, URL, API interne, protezioni anti-bot o modalità di accesso. L'utilizzo deve rispettare termini di servizio, limiti tecnici e normativa applicabile.

## Release

La prima release pubblica è disponibile nella sezione **Releases** del repository:

```text
v3.0.0 — updater-first public release
```

Asset pubblicati:

- `install.sh`;
- `bootstrap-compose.yaml`;
- `compose.yaml`;
- `release.env.example`;
- `manifest.json`;
- `manifest.schema.json`;
- `checksums.txt`.
