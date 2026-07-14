# RicercaCasa V3 — Checklist bugfix e pre-deploy

**Data verifica iniziale:** 14 luglio 2026  
**Branch analizzato:** `main`  
**Obiettivo:** rendere la V2 una base affidabile per container, CI e aggiornamenti V3

---

## 1. Esito sintetico

La base V2 è organizzata correttamente per responsabilità e può essere containerizzata senza riscrittura completa.

Il deploy pubblico non deve però iniziare prima di aver chiuso i punti P0 di questo documento.

Classificazione:

- **P0 — bloccante:** impedisce una release V3 affidabile;
- **P1 — necessario:** richiesto prima della V3 stabile;
- **P2 — miglioramento:** può entrare nella V3.x successiva.

---

## 2. P0 — Correzioni bloccanti

### P0-001 — Correggere le dipendenze runtime backend

Stato rilevato:

- `cheerio` è presente in `devDependencies`;
- gli scraper lo utilizzano a runtime;
- un'immagine production costruita con `npm ci --omit=dev` rischia di non includerlo.

Azione:

- spostare `cheerio` in `dependencies`;
- spostare `nodemon` in `devDependencies`;
- verificare se `bcrypt`, `jsonwebtoken` e `JWT_TOKEN` siano realmente usati;
- rimuovere dipendenze/configurazioni inutilizzate oppure documentarne lo scopo.

Accettazione:

```bash
cd backend
rm -rf node_modules
npm ci --omit=dev
NODE_ENV=production npm start
```

Il backend deve avviarsi e gli scraper devono poter importare tutte le dipendenze runtime.

---

### P0-002 — Introdurre CI prima della pubblicazione immagini

Stato rilevato:

- non è stato trovato un workflow standard `.github/workflows/ci.yml`;
- test e build sono oggi comandi manuali.

Azione:

Creare una pipeline CI su pull request e push verso `main` che esegua:

```text
backend
├── npm ci
├── npm test
└── verifica migrazioni su PostgreSQL pulito

frontend
├── npm ci
├── npm run lint
└── npm run build
```

Aggiungere un job di integrazione con PostgreSQL service container.

Accettazione:

- nessuna immagine viene pubblicata se CI fallisce;
- branch protection richiede i check principali;
- installazione dipendenze usa lockfile e `npm ci`.

---

### P0-003 — Testare tutte le migrazioni da zero

Azione:

- creare database vuoto;
- applicare tutte le migrazioni in ordine;
- avviare il backend;
- eseguire test smoke;
- verificare `npm run db:status`.

Accettazione:

```text
nessuna migrazione pending
nessun DDL nei model/repository
health readiness positivo
```

---

### P0-004 — Testare upgrade reale V2 → V3

Preparare una fixture database contenente:

- fonti;
- preferiti;
- gruppi immobiliari;
- più fonti per lo stesso immobile;
- note;
- appuntamenti;
- candidati duplicati.

Eseguire:

1. backup;
2. migrazioni V3;
3. avvio nuovo backend;
4. verifica dati;
5. verifica pagina dettaglio;
6. verifica impostazioni V3.

Accettazione:

- nessun dato V2 perso;
- nessuna relazione orfana;
- nessuna migrazione manuale richiesta all'utente.

---

### P0-005 — Separare liveness e readiness

Stato rilevato:

- `/health` esegue `SELECT 1`;
- quindi verifica contemporaneamente processo e database.

Azione:

Introdurre:

```text
GET /health/live
GET /health/ready
```

`live` verifica soltanto che il processo risponda.

`ready` verifica almeno:

- database raggiungibile;
- schema pronto;
- migrazioni richieste applicate;
- setup compatibile con la modalità corrente.

Accettazione:

- Docker non riavvia il backend soltanto perché PostgreSQL impiega qualche secondo;
- frontend viene attivato soltanto quando backend è ready.

---

### P0-006 — Shutdown controllato del backend

Stato rilevato:

- `server.js` avvia il listener;
- non chiude esplicitamente HTTP server e pool PostgreSQL su `SIGTERM`.

Azione:

- conservare il valore restituito da `app.listen`;
- gestire `SIGTERM` e `SIGINT`;
- smettere di accettare nuove connessioni;
- chiudere il server HTTP;
- eseguire `pool.end()`;
- terminare con timeout massimo controllato.

Accettazione:

Durante `docker compose up -d` o rollback non devono comparire terminazioni brusche evitabili o query lasciate a metà.

---

### P0-007 — Configurazione production compatibile con secret file

Stato rilevato:

- il backend legge password e URL dalle variabili ambiente;
- `.env.example` richiede valori tecnici;
- la V3 non deve chiedere credenziali database all'utente.

Azione:

Supportare il pattern:

```text
DB_PASS_FILE=/run/secrets/postgres_password
APP_SECRET_FILE=/run/secrets/app_secret
SETUP_TOKEN_FILE=/run/secrets/setup_token
```

La configurazione deve:

1. preferire il file secret quando configurato;
2. rifiutare file illeggibili;
3. non stampare il contenuto;
4. continuare a supportare `.env` in sviluppo.

Accettazione:

L'immagine production funziona senza password inserita direttamente nel Compose.

---

### P0-008 — Rendere il frontend production same-origin

Stato rilevato:

- in sviluppo Vite inoltra `/api` e `/health` a `localhost:3000`;
- la build production deve funzionare dietro il server statico del container frontend.

Azione:

- usare URL relativi `/api`;
- configurare Nginx o server equivalente per proxy interno verso `backend:3000`;
- aggiungere fallback SPA verso `index.html`;
- non incorporare URL specifici dell'host nella build.

Accettazione:

```text
http://127.0.0.1:8080/
http://127.0.0.1:8080/api/...
```

funzionano senza esporre il backend sull'host.

---

### P0-009 — Backup e ripristino verificati

Azione:

Implementare e testare:

- `pg_dump --format=custom`;
- checksum SHA-256;
- `pg_restore --list`;
- metadati versione;
- ripristino su database vuoto.

Accettazione:

Non è sufficiente che il file dump venga creato: deve essere ripristinato con successo in un test automatico o release candidate.

---

### P0-010 — Release manifest e versioni esatte

Azione:

- introdurre SemVer reale per la piattaforma;
- frontend e backend devono condividere la stessa versione;
- non usare `latest` come versione installata;
- dichiarare tag e digest nel manifest;
- validare il manifest prima dell'aggiornamento.

Accettazione:

Una release non può mescolare immagini appartenenti a versioni diverse.

---

### P0-011 — Proteggere l'updater

Azione:

- montare Docker socket soltanto nell'updater;
- bind updater e frontend su `127.0.0.1`;
- non esporre backend/database;
- non accettare comandi arbitrari;
- limitare operazioni al progetto Compose `ricercacasa`;
- usare allowlist di immagini ufficiali;
- verificare digest.

Accettazione:

Dal browser non è possibile specificare:

- comando shell;
- immagine diversa;
- percorso host;
- nome container arbitrario;
- file Compose esterno.

---

### P0-012 — Test end-to-end del self-update

Scenari obbligatori:

1. updater vecchio, piattaforma vecchia, nuova release compatibile;
2. updater vecchio, nuova release richiede updater nuovo;
3. riavvio updater durante il job;
4. immagine backend non disponibile;
5. migrazione fallita;
6. backend nuovo non ready;
7. frontend nuovo non healthy;
8. rollback applicativo;
9. spazio disco insufficiente;
10. database non disponibile.

Accettazione:

Il job riprende senza perdere stato e non dichiara successo in modo falso.

---

## 3. P1 — Necessario prima della V3 stabile

### P1-001 — Versioni e metadata package

- aggiornare `backend/package.json` da versione generica;
- aggiornare il package frontend da `0.0.0`;
- dichiarare `engines.node`;
- aggiungere descrizione, licenza e repository;
- sincronizzare versione durante la pipeline release.

### P1-002 — Dockerfile multi-stage e utenti non root

Per backend e updater:

- build/install separato da runtime;
- `npm ci`;
- immagine runtime minima;
- utente non root;
- init process o gestione segnali corretta;
- nessun tool di sviluppo.

Per frontend:

- build Node separata;
- runtime statico separato;
- configurazione proxy e SPA fallback.

### P1-003 — `.dockerignore`

Creare `.dockerignore` dedicati per evitare di copiare:

- `.git`;
- `node_modules`;
- `.env`;
- log;
- coverage;
- documentazione non necessaria;
- backup;
- runtime state;
- secret.

### P1-004 — Aggiornare `.gitignore`

Aggiungere almeno:

```text
runtime/
secrets/
backups/
updater-data/
*.dump
*.backup
release-state.env
```

Conservare eventuali file `.example` senza valori reali.

### P1-005 — Logging production

- log strutturati;
- livello configurabile;
- niente secret;
- request ID;
- job ID updater;
- rotazione log updater;
- messaggi comprensibili nella dashboard.

### P1-006 — Errori applicativi stabili

Definire codici come:

```text
UPDATE_ALREADY_RUNNING
RELEASE_MANIFEST_INVALID
IMAGE_DIGEST_MISMATCH
INSUFFICIENT_DISK_SPACE
DATABASE_BACKUP_FAILED
DATABASE_MIGRATION_FAILED
BACKEND_NOT_READY
FRONTEND_NOT_HEALTHY
ROLLBACK_FAILED
SETUP_REQUIRED
FEATURE_CONFIGURATION_REQUIRED
```

### P1-007 — Test frontend

Il frontend dispone di lint e build, ma la V3 necessita almeno di test per:

- redirect al wizard;
- pagina impostazioni;
- banner update;
- avanzamento aggiornamento;
- gestione disconnessione/reconnect updater;
- task post-update.

### P1-008 — Limiti payload

Configurare `express.json({ limit: ... })` con limite esplicito.

I payload configurazione non devono accettare oggetti arbitrariamente grandi.

### P1-009 — CORS e proxy

Con frontend same-origin:

- preferire API non esposte direttamente;
- configurare CORS soltanto per sviluppo o origini previste;
- verificare `trust proxy` prima di abilitarlo;
- testare rate limiter dietro il proxy frontend.

### P1-010 — Stato schema

Aggiungere un controllo affidabile delle migrazioni pending usato dal readiness check e dall'updater.

### P1-011 — Compatibilità piattaforme

Dichiarare e testare una matrice minima:

- Linux x86_64;
- Windows 11 + Docker Desktop;
- Docker Compose v2 minimo;
- PostgreSQL major supportato;
- spazio disco minimo.

Non dichiarare macOS/ARM supportati senza test.

### P1-012 — Documentazione recovery

Scrivere procedure per:

- updater non raggiungibile;
- frontend non raggiungibile;
- reset del solo updater;
- ripristino backup;
- rollback manuale immagini;
- recupero log;
- aggiornamento bloccato.

---

## 4. P2 — Miglioramenti successivi

- SBOM per ogni immagine;
- scansione vulnerabilità container;
- artifact attestation;
- firma del release manifest;
- verifica attestazioni lato updater;
- retention automatica backup;
- canale `beta` separato da `stable`;
- export diagnostico senza secret;
- test multi-arch;
- metriche locali facoltative;
- autenticazione per accesso LAN;
- socket proxy dedicato, che richiederebbe un quinto container o servizio host.

---

## 5. Gate CI proposti

### Gate A — Qualità codice

```text
backend tests          PASS
frontend lint          PASS
frontend build         PASS
```

### Gate B — Database

```text
migrations from zero   PASS
migration status       CLEAN
V2 to V3 upgrade       PASS
backup restore         PASS
```

### Gate C — Container

```text
backend image build    PASS
frontend image build   PASS
updater image build    PASS
compose config         PASS
container health       PASS
```

### Gate D — Sicurezza minima

```text
no committed secrets   PASS
images non-root        PASS
backend not exposed    PASS
database not exposed   PASS
digest generated       PASS
```

### Gate E — Update

```text
fresh install          PASS
platform update        PASS
updater self-update    PASS
rollback               PASS
post-update wizard     PASS
```

Nessuna GitHub Release stabile deve essere pubblicata se un gate obbligatorio fallisce.

---

## 6. Ordine operativo consigliato

### Fase 1 — Stabilizzazione V2

1. correggere dipendenze;
2. aggiungere shutdown;
3. separare healthcheck;
4. aggiungere CI;
5. verificare migrazioni correnti;
6. correggere eventuali test falliti.

### Fase 2 — Fondazione V3

1. migrazioni impostazioni/setup;
2. API setup;
3. pagina impostazioni;
4. secret file;
5. Dockerfile production;
6. Compose locale.

### Fase 3 — Distribuzione

1. build immagini;
2. GHCR;
3. release manifest;
4. installer;
5. fresh-install test.

### Fase 4 — Aggiornamenti

1. updater base;
2. backup;
3. update frontend/backend;
4. healthcheck;
5. rollback;
6. self-update;
7. task post-update.

### Fase 5 — Release

1. release candidate;
2. installazione su macchina pulita;
3. upgrade da snapshot V2;
4. recovery drill;
5. V3 stabile.

---

## 7. Definition of Done pre-deploy

Il progetto è pronto per iniziare la pubblicazione V3 quando:

- tutti i P0 sono chiusi;
- CI è obbligatoria;
- tutte le migrazioni partono da zero;
- il backup è stato ripristinato realmente;
- i tre Dockerfile production funzionano;
- Compose espone soltanto frontend e updater su loopback;
- il database persiste dopo `docker compose down` senza `-v`;
- frontend/backend hanno versione coerente;
- un update fallito torna alla release precedente;
- un updater nuovo riprende il job salvato;
- nessun segreto è presente nel repository o nei log.
