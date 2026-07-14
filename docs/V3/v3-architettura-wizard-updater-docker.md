# RicercaCasa V3 — Architettura Wizard, Updater, Docker Compose e GitHub Actions

**Data:** 14 luglio 2026  
**Stato:** direttive tecniche di implementazione

---

## 1. Risultato finale atteso

L'utente finale deve poter:

1. installare Docker Desktop oppure Docker Engine;
2. eseguire un unico installer RicercaCasa;
3. aprire il wizard nel browser;
4. inserire soltanto dati comprensibili, come nome ed email;
5. usare la piattaforma;
6. ricevere una notifica di aggiornamento;
7. premere `Aggiorna` dalla dashboard;
8. seguire l'avanzamento;
9. completare eventuali nuove configurazioni richieste.

L'utente non deve:

- creare PostgreSQL manualmente;
- scegliere utente/password database;
- modificare `compose.yaml`;
- conoscere GHCR;
- lanciare `docker pull` per ogni servizio;
- coordinare frontend e backend;
- eseguire migrazioni manualmente.

---

## 2. Architettura a quattro container

```text
Browser
  |
  | http://127.0.0.1:8080
  v
frontend
  |  proxy /api
  v
backend ----------------------> database

Browser
  |
  | http://127.0.0.1:8081
  v
updater ----------------------> Docker Engine
  |                               tramite socket
  |
  +---------------------------> backend API interna
```

### 2.1 `frontend`

Responsabilità:

- servire la build React;
- gestire fallback SPA;
- inoltrare `/api` a `backend:3000`;
- mostrare banner aggiornamenti;
- aprire la pagina updater quando necessario.

Non contiene:

- credenziali database;
- Docker socket;
- logica di migrazione;
- secret runtime.

### 2.2 `backend`

Responsabilità:

- API immobiliari;
- setup e impostazioni;
- validazione configurazioni;
- accesso PostgreSQL;
- stato applicativo;
- readiness/liveness;
- schema dei wizard feature.

Non contiene:

- Docker socket;
- comandi `docker compose`;
- credenziali hardcoded;
- logica per sostituire container.

### 2.3 `database`

Responsabilità:

- persistenza PostgreSQL;
- schema versionato;
- dati immobiliari;
- impostazioni applicative;
- storico sintetico update.

Non viene esposto sull'host.

### 2.4 `updater`

Responsabilità:

- UI wizard iniziale e aggiornamenti;
- verifica release;
- release manifest;
- generazione/gestione job;
- backup;
- migrazioni one-shot;
- pull immagini;
- self-update;
- update frontend/backend;
- healthcheck;
- rollback;
- wizard post-update.

È l'unico container con accesso al Docker socket.

---

## 3. Struttura repository proposta

```text
ricercaCasa/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── container-pr.yml
│       └── release.yml
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── ...
├── ricercaCasa/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── .dockerignore
│   └── ...
├── updater/
│   ├── src/
│   │   ├── api/
│   │   ├── docker/
│   │   ├── jobs/
│   │   ├── releases/
│   │   ├── backup/
│   │   ├── wizard/
│   │   └── security/
│   ├── public/
│   ├── tests/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
├── deployment/
│   ├── compose.yaml
│   ├── release.env.example
│   ├── manifest.schema.json
│   ├── install.sh
│   ├── install.ps1
│   └── recovery/
├── docs/
│   ├── AF/
│   ├── AD/
│   └── V3/
└── README.md
```

---

## 4. Versionamento

### 4.1 Versione piattaforma

Frontend e backend condividono:

```text
PLATFORM_VERSION=3.0.0
```

Immagini:

```text
ghcr.io/joxdev12/ricercacasa-frontend:3.0.0
ghcr.io/joxdev12/ricercacasa-backend:3.0.0
```

### 4.2 Versione updater

L'updater usa una versione autonoma:

```text
UPDATER_VERSION=1.0.0
```

Immagine:

```text
ghcr.io/joxdev12/ricercacasa-updater:1.0.0
```

### 4.3 Tag

Pubblicare:

- tag SemVer completo;
- eventuale tag major/minor per sviluppo interno;
- mai dipendere da `latest` nell'installazione.

Esempio:

```text
3.1.2
3.1
3
```

Il manifest stabile deve puntare a versione completa e digest.

### 4.4 Compatibilità

Il manifest dichiara:

- versione piattaforma;
- updater minimo;
- schema Compose;
- major PostgreSQL supportato;
- migrazioni richieste;
- task wizard;
- immagini e digest.

---

## 5. Docker Compose production

Il seguente file è una direttiva architetturale. I nomi, comandi e healthcheck devono essere adattati al codice implementato e verificati in CI.

```yaml
name: ricercacasa

services:
  database:
    image: postgres:17
    restart: unless-stopped
    environment:
      POSTGRES_DB: ricercacasa
      POSTGRES_USER: ricercacasa
      POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
    secrets:
      - postgres_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ricercacasa -d ricercacasa"]
      interval: 5s
      timeout: 5s
      retries: 20
      start_period: 10s

  backend:
    image: ${BACKEND_IMAGE}@${BACKEND_DIGEST}
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: database
      DB_PORT: 5432
      DB_NAME: ricercacasa
      DB_USER: ricercacasa
      DB_PASS_FILE: /run/secrets/postgres_password
      APP_SECRET_FILE: /run/secrets/app_secret
      SETUP_TOKEN_FILE: /run/secrets/setup_token
      ALLOW_PROVIDER_SCRAPING: "true"
    secrets:
      - postgres_password
      - app_secret
      - setup_token
    depends_on:
      database:
        condition: service_healthy
    networks:
      - internal
    healthcheck:
      test: ["CMD", "node", "./scripts/healthcheck.js", "ready"]
      interval: 10s
      timeout: 5s
      retries: 12
      start_period: 20s
    stop_grace_period: 30s

  frontend:
    image: ${FRONTEND_IMAGE}@${FRONTEND_DIGEST}
    restart: unless-stopped
    ports:
      - "127.0.0.1:${APP_PORT:-8080}:8080"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - internal
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://127.0.0.1:8080/health"]
      interval: 10s
      timeout: 5s
      retries: 10

  updater:
    image: ${UPDATER_IMAGE}@${UPDATER_DIGEST}
    restart: unless-stopped
    ports:
      - "127.0.0.1:${UPDATER_PORT:-8081}:8081"
    environment:
      UPDATER_VERSION: ${UPDATER_VERSION}
      PLATFORM_VERSION: ${PLATFORM_VERSION}
      COMPOSE_PROJECT_NAME: ricercacasa
      COMPOSE_FILE_PATH: /state/compose.yaml
      RELEASE_ENV_PATH: /state/release.env
      RELEASE_CHANNEL: stable
      BACKEND_INTERNAL_URL: http://backend:3000
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - updater_data:/state
      - backups:/backups
    secrets:
      - setup_token
    networks:
      - internal
    healthcheck:
      test: ["CMD", "node", "./scripts/healthcheck.js"]
      interval: 10s
      timeout: 5s
      retries: 10

networks:
  internal:
    driver: bridge

volumes:
  postgres_data:
  updater_data:
  backups:

secrets:
  postgres_password:
    file: ./secrets/postgres_password
  app_secret:
    file: ./secrets/app_secret
  setup_token:
    file: ./secrets/setup_token
```

### 5.1 Regole Compose

- `database` e `backend` non hanno `ports`;
- frontend e updater usano loopback;
- versioni e digest provengono da `release.env` gestito;
- i dati usano named volumes;
- `docker compose down` non deve usare `-v` durante aggiornamenti normali;
- il project name è fisso;
- i container non usano `privileged: true`;
- backend e frontend non montano file dell'host;
- soltanto updater monta il socket.

### 5.2 File di stato release

Esempio `release.env`:

```env
PLATFORM_VERSION=3.0.0
UPDATER_VERSION=1.0.0

FRONTEND_IMAGE=ghcr.io/joxdev12/ricercacasa-frontend
FRONTEND_DIGEST=sha256:...

BACKEND_IMAGE=ghcr.io/joxdev12/ricercacasa-backend
BACKEND_DIGEST=sha256:...

UPDATER_IMAGE=ghcr.io/joxdev12/ricercacasa-updater
UPDATER_DIGEST=sha256:...
```

L'updater deve scrivere il nuovo file in modo atomico:

1. creare file temporaneo;
2. eseguire fsync quando disponibile;
3. rinominare sul file finale;
4. conservare una copia della release precedente.

---

## 6. Dockerfile backend

### 6.1 Requisiti

- immagine Node LTS esplicita;
- `npm ci`;
- dipendenze runtime corrette;
- utente non root;
- `NODE_ENV=production`;
- nessun `.env` nell'immagine;
- supporto segnali;
- script healthcheck;
- comando migrazione disponibile;
- label OCI.

### 6.2 Struttura indicativa

```dockerfile
FROM node:<LTS>-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:<LTS>-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .
USER node
EXPOSE 3000
CMD ["node", "server.js"]
```

Prima di usare Alpine verificare la compatibilità di tutte le dipendenze native. Se `bcrypt` è realmente necessario, testare esplicitamente build e runtime oppure scegliere una base Debian slim.

### 6.3 Migrazioni

L'immagine backend deve permettere:

```bash
npm run db:migrate
npm run db:status
```

Se `node-pg-migrate` resta in `devDependencies`, non sarà disponibile nell'immagine runtime `--omit=dev`. Possibili soluzioni:

1. spostarlo tra le dipendenze runtime;
2. creare uno stage/target migration dedicato;
3. produrre un'immagine backend che includa soltanto il tool necessario.

La soluzione scelta deve essere documentata e testata.

---

## 7. Dockerfile frontend

### 7.1 Requisiti

- build React in stage Node;
- runtime statico separato;
- proxy `/api` verso backend;
- fallback SPA;
- health endpoint statico;
- utente non root se supportato;
- nessun URL host hardcoded.

### 7.2 Proxy indicativo

```nginx
server {
  listen 8080;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  location = /health {
    access_log off;
    return 200 'ok';
  }

  location /api/ {
    proxy_pass http://backend:3000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

Il backend deve configurare `trust proxy` soltanto dopo aver definito esattamente la topologia e i proxy fidati.

---

## 8. Updater

### 8.1 Tecnologia

È consigliato usare Node.js per coerenza con il progetto, mantenendo un package separato.

Moduli suggeriti:

```text
updater/src/
├── server.js
├── config.js
├── api/
│   ├── statusRoutes.js
│   ├── updateRoutes.js
│   └── wizardRoutes.js
├── docker/
│   ├── dockerClient.js
│   ├── composeRunner.js
│   └── projectPolicy.js
├── jobs/
│   ├── jobStore.js
│   ├── updateStateMachine.js
│   └── jobRecovery.js
├── releases/
│   ├── manifestClient.js
│   ├── manifestValidator.js
│   ├── semverPolicy.js
│   └── digestVerifier.js
├── backup/
│   ├── postgresBackup.js
│   └── backupVerifier.js
├── wizard/
│   ├── setupProxy.js
│   ├── taskResolver.js
│   └── schemaRenderer.js
└── security/
    ├── localAccess.js
    ├── csrf.js
    └── commandPolicy.js
```

### 8.2 State machine

Stati minimi:

```text
idle
checking
preflight
updating_updater
resuming
pulling_images
creating_backup
running_migrations
restarting_backend
checking_backend
restarting_frontend
checking_frontend
waiting_configuration
completed
rolling_back
failed
```

Transizioni devono essere esplicite e testate.

### 8.3 Persistenza job

Esempio:

```json
{
  "jobId": "upd_20260714_001",
  "status": "updating_updater",
  "fromPlatformVersion": "3.0.0",
  "toPlatformVersion": "3.1.0",
  "fromUpdaterVersion": "1.0.0",
  "toUpdaterVersion": "1.1.0",
  "manifestPath": "/state/manifests/3.1.0.json",
  "previousReleaseEnv": "/state/releases/3.0.0.env",
  "targetReleaseEnv": "/state/releases/3.1.0.env",
  "backupId": null,
  "createdAt": "...",
  "updatedAt": "...",
  "lastError": null
}
```

Scrittura atomica obbligatoria.

### 8.4 Self-update

Procedura:

1. persist job;
2. pull nuova immagine updater per digest;
3. preparare `release.env` che cambia soltanto updater;
4. eseguire Compose per ricreare `updater` senza toccare gli altri servizi;
5. terminare il vecchio processo;
6. nuovo updater parte;
7. legge job incompleto;
8. verifica che la propria versione corrisponda;
9. prosegue con piattaforma.

Il backend rimane attivo, ma non deve ricevere il socket.

### 8.5 Docker API

Preferire una libreria Docker Engine API o invocazioni Compose rigidamente costruite.

Non concatenare input browser in stringhe shell.

Esempio vietato:

```js
exec(`docker compose pull ${req.body.service}`)
```

Esempio concettuale ammesso:

```js
const allowedOperation = operations.updatePlatform
await allowedOperation.run(validatedManifest)
```

### 8.6 Aggiornamento servizi

Sequenza consigliata:

```text
pull backend target
pull frontend target
verify digests
backup database
run migrations target
write target release env
recreate backend
wait readiness
recreate frontend
wait health
run smoke test
record success
```

### 8.7 Rollback

Conservare:

- precedente `release.env`;
- digest precedenti;
- backup database;
- manifest precedente;
- log job.

Rollback applicativo:

```text
restore previous release env
recreate backend previous
wait readiness
recreate frontend previous
wait health
record rolled_back
```

Rollback database soltanto con policy esplicita.

---

## 9. Wizard iniziale

### 9.1 Perché viene servito dall'updater

Durante installazione e aggiornamenti il frontend/backend possono non essere ancora disponibili o possono essere riavviati.

L'updater resta il punto stabile per:

- avanzamento;
- errori;
- setup;
- recovery.

### 9.2 Flusso UI

```text
Benvenuto
  -> controllo sistema
  -> preparazione database
  -> avvio applicazione
  -> dati utente
  -> preferenze
  -> riepilogo
  -> completato
```

### 9.3 Campi iniziali

```text
Nome visualizzato         richiesto
Email di contatto         facoltativa/consigliata
Lingua                    default it-IT
Fuso orario               auto-rilevato
Conferma uso locale       richiesta
```

### 9.4 Comunicazione backend

Browser → updater → backend interno.

Il browser non deve conoscere token o indirizzo interno backend.

L'updater usa il token di setup montato come secret e lo inoltra soltanto alle API di bootstrap previste.

### 9.5 Completamento

Dopo successo:

- backend invalida il bootstrap;
- updater elimina o ruota il token iniziale secondo la strategia scelta;
- UI mostra collegamento alla dashboard;
- lo stato resta consultabile.

---

## 10. Wizard delle nuove feature

### 10.1 Definizione lato backend

Ogni feature espone una definizione sicura:

```json
{
  "code": "email_delivery",
  "schemaVersion": 1,
  "title": "Invio email",
  "description": "Configura il mittente usato per contattare le agenzie.",
  "blocking": false,
  "fields": [
    {
      "name": "fromName",
      "type": "text",
      "required": true,
      "maxLength": 120
    },
    {
      "name": "fromEmail",
      "type": "email",
      "required": true
    }
  ]
}
```

Non deve contenere password già salvate.

### 10.2 Rendering

L'updater può renderizzare campi semplici da schema dichiarativo.

Le feature complesse possono fornire una pagina specifica, ma devono mantenere:

- codice feature;
- schema version;
- validazione backend;
- stato task;
- possibilità di modifica da Impostazioni.

### 10.3 Feature flag

Una feature non configurata deve restare disabilitata.

Il codice non deve fallire globalmente perché manca la configurazione di una funzione opzionale.

---

## 11. Installer

### 11.1 `install.sh`

Responsabilità:

- verificare comandi `docker` e `docker compose`;
- controllare versione minima;
- creare directory installazione;
- creare `secrets/` con permessi restrittivi;
- generare valori casuali;
- scaricare bootstrap Compose e manifest;
- avviare updater/database;
- mostrare URL wizard.

### 11.2 `install.ps1`

Stesso comportamento per Windows 11 e Docker Desktop.

Non assumere presenza di `openssl`. Usare primitive PowerShell/.NET sicure per generare byte casuali.

### 11.3 Idempotenza

Se la directory esiste:

- non sovrascrivere secret;
- rilevare installazione esistente;
- proporre apertura dashboard/updater;
- non creare un secondo database;
- non usare automaticamente `down -v`.

### 11.4 Disinstallazione

La disinstallazione deve distinguere:

- rimozione container mantenendo dati;
- rimozione completa con cancellazione dati.

La cancellazione completa richiede conferma esplicita e backup consigliato.

---

## 12. GitHub Actions

### 12.1 Workflow `ci.yml`

Trigger:

```yaml
on:
  pull_request:
  push:
    branches: [main]
```

Job:

1. backend test;
2. frontend lint/build;
3. migrazioni PostgreSQL pulite;
4. upgrade fixture V2 → V3;
5. updater test;
6. Compose validation.

Usare:

- action ufficiali o affidabili;
- permessi minimi;
- action fissate a commit SHA;
- cache solo quando non compromette riproducibilità.

### 12.2 Workflow `container-pr.yml`

Su pull request:

- costruire le tre immagini senza push pubblico;
- eseguire smoke test;
- avviare Compose con tag temporanei locali;
- verificare healthcheck;
- verificare che backend/database non abbiano porte host;
- distruggere lo stack senza cancellare involontariamente fixture necessarie.

### 12.3 Workflow `release.yml`

Trigger consigliato:

```yaml
on:
  release:
    types: [published]
```

Passi:

1. checkout commit taggato;
2. validazione SemVer;
3. verifica tag uguale a package/release metadata;
4. esecuzione completa CI;
5. login `ghcr.io` con `GITHUB_TOKEN`;
6. build frontend;
7. build backend;
8. build updater se previsto dalla release;
9. push immagini con tag esatti;
10. acquisizione digest;
11. generazione SBOM/attestation quando attivato;
12. generazione release manifest;
13. validazione manifest contro schema;
14. allegato manifest alla GitHub Release;
15. aggiornamento del puntatore `stable` soltanto dopo tutti i gate.

Permessi minimi indicativi:

```yaml
permissions:
  contents: read
  packages: write
  attestations: write
  id-token: write
```

Rimuovere permessi non necessari se attestazioni non ancora implementate.

### 12.4 Immagini

Nomi consigliati:

```text
ghcr.io/joxdev12/ricercacasa-frontend
ghcr.io/joxdev12/ricercacasa-backend
ghcr.io/joxdev12/ricercacasa-updater
```

Aggiungere label OCI:

```text
org.opencontainers.image.source
org.opencontainers.image.revision
org.opencontainers.image.version
org.opencontainers.image.licenses
org.opencontainers.image.description
```

### 12.5 Manifest stabile

Non sovrascrivere un manifest della stessa versione.

Pubblicare:

```text
releases/3.0.0/manifest.json
channels/stable.json
```

`channels/stable.json` può contenere un riferimento al manifest immutabile della release.

L'updater non deve fidarsi di un tag Docker mobile per stabilire la versione.

---

## 13. Release manifest completo

Esempio:

```json
{
  "schemaVersion": 1,
  "platformVersion": "3.1.0",
  "releasedAt": "2026-08-01T10:00:00Z",
  "channel": "stable",
  "minimumUpdaterVersion": "1.1.0",
  "composeSchemaVersion": 1,
  "minimumDockerComposeVersion": "2.30.0",
  "images": {
    "frontend": {
      "repository": "ghcr.io/joxdev12/ricercacasa-frontend",
      "tag": "3.1.0",
      "digest": "sha256:..."
    },
    "backend": {
      "repository": "ghcr.io/joxdev12/ricercacasa-backend",
      "tag": "3.1.0",
      "digest": "sha256:..."
    },
    "updater": {
      "repository": "ghcr.io/joxdev12/ricercacasa-updater",
      "tag": "1.1.0",
      "digest": "sha256:..."
    }
  },
  "database": {
    "postgresMajor": 17,
    "migrationRequired": true,
    "migrationCommand": ["npm", "run", "db:migrate"],
    "backupRequired": true,
    "automaticSchemaRollbackAllowed": false
  },
  "configurationTasks": [
    {
      "code": "example_feature",
      "schemaVersion": 1,
      "blocking": false
    }
  ],
  "releaseNotes": {
    "title": "RicercaCasa 3.1.0",
    "url": "..."
  }
}
```

Il comando migration non deve essere eseguito direttamente da input remoto senza allowlist. Può essere una dichiarazione informativa tradotta dall'updater in una operazione interna predefinita.

---

## 14. Flusso dashboard aggiornamento

### 14.1 Banner

```text
Nuova versione disponibile: 3.1.0
Miglioramenti e correzioni disponibili.
[Dettagli] [Aggiorna]
```

### 14.2 Conferma

Mostrare:

- versione attuale/destinazione;
- spazio stimato;
- backup richiesto;
- breve interruzione prevista;
- eventuali configurazioni successive.

### 14.3 Avanzamento

```text
✓ Verifica sistema
✓ Download updater 1.1.0
✓ Updater aggiornato
✓ Download RicercaCasa 3.1.0
✓ Backup database
✓ Migrazioni
✓ Backend pronto
● Riavvio frontend
○ Controllo finale
```

### 14.4 Reconnect

La pagina deve:

- conservare `jobId`;
- ritentare la connessione;
- distinguere riavvio previsto da errore;
- recuperare stato dopo refresh;
- non chiedere di rilanciare l'update durante il self-update.

### 14.5 Successo

```text
Aggiornamento completato
Versione installata: 3.1.0
[Configura nuova funzione] oppure [Torna alla dashboard]
```

### 14.6 Fallimento

Mostrare:

- fase fallita;
- codice errore;
- stato rollback;
- link ai log sanitizzati;
- azione sicura disponibile.

Non mostrare stack trace completo all'utente normale.

---

## 15. Test end-to-end

### 15.1 Installazione pulita

- host senza repository;
- Docker presente;
- installer;
- secret automatici;
- wizard;
- ricerca e salvataggio immobile;
- riavvio host;
- dati ancora presenti.

### 15.2 Aggiornamento semplice

- frontend/backend `3.0.0`;
- updater compatibile;
- update `3.0.1`;
- nessuna migrazione;
- healthcheck e successo.

### 15.3 Aggiornamento con migrazione

- backup verificato;
- migrazione;
- dati preservati;
- versione aggiornata.

### 15.4 Aggiornamento updater

- updater `1.0.0`;
- manifest richiede `1.1.0`;
- self-update;
- ripresa job;
- update piattaforma.

### 15.5 Wizard post-update

- release introduce task non bloccante;
- feature disabilitata;
- wizard mostrato;
- configurazione salvata;
- task non riproposto.

### 15.6 Recovery

- bloccare immagine target;
- simulare DB non ready;
- interrompere updater;
- riavviare Docker;
- verificare ripresa;
- verificare rollback.

---

## 16. Ordine di sviluppo concreto

### Sprint V3.1 — Pre-deploy

- chiudere P0 dipendenze;
- CI;
- health live/ready;
- graceful shutdown;
- test migrazioni.

### Sprint V3.2 — Impostazioni

- migrazioni V3;
- API setup;
- API settings;
- pagina impostazioni;
- test.

### Sprint V3.3 — Container

- Dockerfile backend;
- Dockerfile frontend;
- proxy same-origin;
- Compose iniziale;
- secret automatici.

### Sprint V3.4 — Updater base

- web UI;
- job store;
- manifest validation;
- check release;
- update frontend/backend senza self-update.

### Sprint V3.5 — Sicurezza e recovery

- backup;
- health checks;
- rollback;
- allowlist Docker;
- test recovery.

### Sprint V3.6 — Self-update e wizard dinamici

- self-update updater;
- resume;
- task configuration;
- pagina avanzamento robusta.

### Sprint V3.7 — Distribuzione

- install script Linux;
- install script Windows;
- GHCR;
- GitHub Release;
- manifest stable;
- release candidate.

---

## 17. Decisioni da non cambiare senza nuova analisi

- quattro container, non una singola immagine monolitica;
- frontend e backend stessa release;
- updater versionato separatamente;
- updater può aggiornare sé stesso e riprendere il job;
- backend non possiede Docker socket;
- database e backend non esposti sull'host;
- credenziali PostgreSQL generate automaticamente;
- wizard servito dall'updater, validazione dati dal backend;
- configurazioni future versionate;
- segreti fuori dal JSONB;
- immagini attivate tramite versioni esatte/digest;
- Subito.it e WikiCasa rinviati alla V4.
