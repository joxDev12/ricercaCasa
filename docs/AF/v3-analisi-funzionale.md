# RicercaCasa — V3 Analisi Funzionale

**Versione documento:** 3.0  
**Data:** 14 luglio 2026  
**Branch di riferimento:** `main`  
**Stato:** specifica funzionale per implementazione V3

---

## 1. Obiettivo della V3

La V3 trasforma RicercaCasa da progetto avviato manualmente in una piattaforma **self-hosted installabile e aggiornabile da utenti non tecnici**.

La V3 non aggiunge nuovi portali immobiliari. WikiCasa e Subito.it vengono rinviati alla V4.

Gli obiettivi principali sono:

1. distribuire RicercaCasa tramite Docker Compose;
2. mantenere separati frontend, backend, database e updater;
3. pubblicare le immagini tramite GitHub Actions e GitHub Container Registry;
4. offrire un'installazione guidata senza chiedere credenziali PostgreSQL;
5. offrire una pagina impostazioni modificabile dopo l'installazione;
6. notificare la disponibilità di nuove versioni;
7. aggiornare frontend e backend come un'unica release applicativa;
8. aggiornare prima l'updater quando una release richiede una sua versione più recente;
9. eseguire backup, migrazioni, healthcheck e rollback controllati;
10. mostrare wizard aggiuntivi quando una nuova funzionalità richiede configurazione.

---

## 2. Principi della V3

### 2.1 Release unica della piattaforma

Frontend e backend condividono la stessa versione applicativa.

Esempio:

```text
RicercaCasa 3.1.0
├── frontend 3.1.0
├── backend 3.1.0
├── updater 1.2.0
└── PostgreSQL 17.x
```

Non è ammesso attivare intenzionalmente una combinazione come frontend `3.1.0` e backend `3.0.0`.

L'updater possiede un proprio ciclo di versionamento perché può essere aggiornato prima del resto della piattaforma.

### 2.2 Quattro container

La V3 utilizza esattamente questi servizi:

1. `frontend`;
2. `backend`;
3. `database`;
4. `updater`.

Il database utilizza l'immagine ufficiale PostgreSQL. Gli altri tre servizi utilizzano immagini pubblicate dal progetto.

### 2.3 Installazione locale e single-user

La V3 resta:

- single-user;
- local-first;
- self-hosted;
- senza registrazione cloud obbligatoria;
- senza telemetria obbligatoria;
- accessibile per impostazione predefinita soltanto da `127.0.0.1`.

L'esposizione in LAN o su Internet non fa parte dell'installazione predefinita e richiederà una guida separata con autenticazione e TLS.

### 2.4 Nessuna configurazione tecnica del database

L'utente non deve scegliere:

- nome database;
- utente PostgreSQL;
- password PostgreSQL;
- host interno;
- porta interna;
- stringa `DATABASE_URL`.

L'installer genera automaticamente credenziali casuali, crea i file secret e avvia PostgreSQL con valori sicuri.

### 2.5 Separazione tra aggiornamenti e logica applicativa

Il backend non deve ricevere accesso al Docker socket.

Soltanto l'updater può coordinare:

- pull delle immagini;
- ricreazione dei container;
- aggiornamento di sé stesso;
- esecuzione delle migrazioni;
- backup e rollback.

Il backend espone soltanto API applicative per configurazione, stato del setup e impostazioni.

---

## 3. Ambito

### 3.1 Incluso nella V3

- Dockerfile production per frontend, backend e updater;
- `compose.yaml` production con quattro servizi;
- volumi persistenti;
- rete interna Docker;
- generazione automatica dei secret;
- installer iniziale per sistemi supportati;
- wizard di prima configurazione;
- pagina impostazioni;
- controllo versione disponibile;
- visualizzazione note di rilascio;
- aggiornamento guidato dalla dashboard;
- aggiornamento coordinato frontend/backend;
- self-update dell'updater;
- release manifest versionato;
- backup PostgreSQL prima delle migrazioni;
- migrazioni controllate;
- healthcheck di tutti i servizi;
- registrazione dello storico aggiornamenti;
- rollback applicativo quando tecnicamente sicuro;
- wizard post-update per nuove configurazioni;
- pipeline CI;
- pipeline di build e pubblicazione su GHCR;
- documentazione installazione, aggiornamento, backup e ripristino.

### 3.2 Escluso dalla V3

- WikiCasa;
- Subito.it;
- multiutenza;
- login remoto;
- SaaS gestito dal progetto;
- Kubernetes;
- aggiornamento automatico senza conferma dell'utente;
- SMTP completo e invio email tramite Nodemailer;
- prenotazione automatica degli appuntamenti;
- esposizione Internet automatica;
- dominio e certificati TLS automatici;
- aggiornamenti differenziali delle immagini;
- cluster PostgreSQL;
- alta disponibilità senza interruzioni.

La V3 può salvare il nome e l'email di contatto dell'utente in preparazione delle future funzioni email, ma non invia ancora messaggi.

---

## 4. Attori

### 4.1 Utente locale

Può:

- installare RicercaCasa;
- completare il wizard;
- usare la piattaforma;
- modificare le impostazioni;
- controllare gli aggiornamenti;
- leggere le note di rilascio;
- avviare un aggiornamento;
- vedere l'avanzamento;
- riprovare o consultare un errore.

### 4.2 Amministratore della release

È il maintainer del repository e può:

- creare tag e GitHub Release;
- pubblicare immagini;
- pubblicare il release manifest;
- dichiarare versioni compatibili;
- dichiarare migrazioni e task di configurazione;
- ritirare una release difettosa dal canale stabile.

### 4.3 Updater

È un attore tecnico che:

- verifica le release;
- confronta le versioni;
- esegue preflight;
- crea backup;
- aggiorna sé stesso;
- aggiorna frontend e backend;
- verifica la salute dei servizi;
- registra l'esito;
- prepara i wizard post-update.

---

## 5. Flusso di prima installazione

### RF3-001 — Avvio dell'installer

L'utente esegue un unico installer adatto al proprio sistema operativo.

L'installer deve:

1. verificare la presenza di Docker Engine o Docker Desktop;
2. verificare Docker Compose v2;
3. creare la directory locale di RicercaCasa;
4. generare secret casuali;
5. scaricare il bootstrap Compose ufficiale;
6. avviare database e updater;
7. lasciare all'updater il completamento dello stack;
8. mostrare o aprire l'indirizzo del wizard.

L'utente non deve clonare il repository né installare Node.js, npm o PostgreSQL.

### RF3-002 — Generazione automatica dei secret

Devono essere generati almeno:

- password PostgreSQL;
- secret applicativo interno;
- token monouso di bootstrap/setup.

I secret non devono essere stampati nei log normali né inclusi nel repository.

### RF3-003 — Migrazione iniziale

L'updater deve:

1. attendere che PostgreSQL sia pronto;
2. eseguire le migrazioni tramite l'immagine backend della release;
3. verificare lo stato dello schema;
4. avviare backend e frontend;
5. verificare gli healthcheck;
6. rendere disponibile il wizard.

### RF3-004 — Wizard iniziale

Il wizard viene servito dall'updater, ma la validazione e il salvataggio delle impostazioni applicative passano dal backend.

Campi V3:

- nome visualizzato;
- email di contatto, facoltativa ma consigliata;
- lingua, con default `it-IT`;
- fuso orario, rilevato dal browser e modificabile;
- consenso esplicito all'uso locale degli scraper e avviso sulla loro fragilità;
- conferma finale.

Il wizard non mostra le credenziali del database.

### RF3-005 — Completamento setup

Al termine:

- lo stato installazione diventa `completed`;
- il token di bootstrap viene invalidato;
- l'utente viene indirizzato alla dashboard principale;
- le API di prima configurazione non devono più accettare richieste di bootstrap.

---

## 6. Pagina impostazioni

### RF3-010 — Accesso

La dashboard contiene una pagina `Impostazioni`.

### RF3-011 — Impostazioni generali

L'utente può vedere e modificare:

- nome visualizzato;
- email di contatto;
- lingua;
- fuso orario.

### RF3-012 — Informazioni sistema

La pagina mostra in sola lettura:

- versione RicercaCasa installata;
- versione updater;
- versione PostgreSQL;
- data ultima verifica aggiornamenti;
- data ultimo aggiornamento riuscito;
- stato dei quattro servizi;
- presenza dell'ultimo backup pre-update.

Non mostra password o stringhe di connessione.

### RF3-013 — Configurazioni per funzionalità

Ogni futura funzionalità configurabile appare in una sezione separata.

Esempi futuri:

- invio email;
- mittente predefinito;
- integrazione calendario;
- notifiche.

Ogni sezione deve dichiarare:

- stato `non configurata`, `configurata`, `da aggiornare` oppure `disabilitata`;
- versione dello schema di configurazione;
- campi richiesti;
- test di verifica quando disponibile.

### RF3-014 — Segreti futuri

Password SMTP, token e API key non devono essere restituiti in chiaro dalla API e non devono essere salvati nel JSON generico delle configurazioni.

---

## 7. Controllo aggiornamenti

### RF3-020 — Verifica manuale e periodica

L'updater può verificare periodicamente il canale stabile e l'utente può forzare la verifica dalla dashboard.

La verifica non installa automaticamente nulla.

### RF3-021 — Release manifest

Ogni release pubblica un manifest contenente almeno:

```json
{
  "platformVersion": "3.1.0",
  "channel": "stable",
  "minimumUpdaterVersion": "1.2.0",
  "composeSchemaVersion": 1,
  "images": {
    "frontend": {
      "name": "ghcr.io/joxdev12/ricercacasa-frontend",
      "tag": "3.1.0",
      "digest": "sha256:..."
    },
    "backend": {
      "name": "ghcr.io/joxdev12/ricercacasa-backend",
      "tag": "3.1.0",
      "digest": "sha256:..."
    },
    "updater": {
      "name": "ghcr.io/joxdev12/ricercacasa-updater",
      "tag": "1.2.0",
      "digest": "sha256:..."
    }
  },
  "database": {
    "migrationRequired": true,
    "minimumPostgresMajor": 17,
    "maximumPostgresMajor": 17
  },
  "configurationTasks": [],
  "releaseNotesUrl": "..."
}
```

Le immagini attivate devono essere quelle dichiarate dal manifest, preferibilmente tramite digest.

### RF3-022 — Notifica dashboard

Quando è disponibile una nuova versione, la dashboard mostra:

- versione installata;
- versione disponibile;
- data release;
- note principali;
- eventuale necessità di aggiornare l'updater;
- eventuale necessità di migrazione;
- eventuali nuove configurazioni richieste;
- pulsante `Aggiorna`.

---

## 8. Aggiornamento coordinato

### RF3-030 — Preflight

Prima di modificare lo stack, l'updater verifica:

- Docker raggiungibile;
- spazio disco sufficiente;
- manifest valido;
- immagini disponibili;
- compatibilità PostgreSQL;
- accesso al volume dati;
- nessun altro aggiornamento in corso;
- stato corrente registrabile;
- disponibilità del comando di backup.

### RF3-031 — Aggiornamento dell'updater

Se `minimumUpdaterVersion` è superiore alla versione installata:

1. l'updater salva il job nel proprio volume persistente;
2. scarica la propria nuova immagine;
3. chiede al Docker Engine di ricreare soltanto `updater`;
4. il vecchio processo termina;
5. il nuovo updater legge il job persistito;
6. riprende l'operazione dal passo successivo.

Il backend resta attivo durante questo passaggio, ma non coordina Docker.

### RF3-032 — Backup

Prima di migrazioni distruttive o non banali, l'updater crea un dump PostgreSQL.

Il backup deve avere:

- timestamp;
- versione di partenza;
- versione di destinazione;
- checksum;
- esito verificato;
- politica di conservazione configurabile in futuro.

### RF3-033 — Pull atomico della release logica

L'updater scarica frontend e backend della stessa `platformVersion` prima di fermare i container correnti.

Se anche una sola immagine non è disponibile o non corrisponde al digest, l'aggiornamento non parte.

### RF3-034 — Migrazioni

Le migrazioni vengono eseguite come comando one-shot usando la nuova immagine backend.

Il nuovo backend non viene reso disponibile prima del completamento delle migrazioni richieste.

### RF3-035 — Sostituzione dei servizi

Dopo pull, backup e migrazioni:

1. viene ricreato il backend;
2. viene atteso il suo readiness check;
3. viene ricreato il frontend;
4. viene verificato il percorso applicativo principale;
5. viene registrata la nuova versione riuscita.

### RF3-036 — Stato visibile

Durante l'aggiornamento il browser comunica direttamente con l'updater e visualizza:

- fase corrente;
- fasi completate;
- messaggi sintetici;
- eventuale errore;
- azione consigliata.

Il refresh della pagina non deve perdere lo stato.

### RF3-037 — Rollback

Se il nuovo backend o frontend non supera gli healthcheck:

- l'updater ripristina le immagini precedenti;
- ripristina il precedente file di stato release;
- riavvia i servizi precedenti;
- registra il fallimento.

Il rollback del database è ammesso soltanto quando la migrazione dichiara esplicitamente una strategia sicura. In caso contrario deve essere proposto il ripristino dal backup.

### RF3-038 — Nessun aggiornamento parziale silenzioso

Non deve mai essere mostrato `aggiornamento completato` se:

- frontend e backend non appartengono alla stessa release;
- una migrazione richiesta è fallita;
- un healthcheck obbligatorio è fallito;
- il manifest applicato non coincide con quello registrato.

---

## 9. Wizard dopo un aggiornamento

### RF3-040 — Task di configurazione dichiarativi

Una release può dichiarare zero o più `configurationTasks`.

Esempio futuro:

```json
{
  "code": "email_delivery",
  "schemaVersion": 1,
  "requiredFromVersion": "4.1.0",
  "blocking": false,
  "title": "Configura l'invio email"
}
```

### RF3-041 — Task bloccanti e non bloccanti

- `blocking: true`: la piattaforma resta in modalità configurazione finché il task non è completato;
- `blocking: false`: la piattaforma è utilizzabile, ma la feature resta disabilitata.

### RF3-042 — Responsabilità

L'updater:

- rileva i task;
- presenta il wizard;
- mostra lo stato.

Il backend:

- espone lo schema dei campi;
- valida i dati;
- salva la configurazione;
- abilita la feature;
- impedisce configurazioni incompatibili.

### RF3-043 — Ripetibilità

Un task già completato con la stessa `schemaVersion` non viene riproposto.

Se la configurazione cambia struttura, viene pubblicata una nuova `schemaVersion`.

### RF3-044 — Modifica successiva

Le configurazioni completate restano modificabili dalla pagina Impostazioni.

---

## 10. API funzionali V3

Endpoint applicativi indicativi:

```text
GET    /api/setup/status
POST   /api/setup/complete
GET    /api/settings
PATCH  /api/settings/profile
GET    /api/settings/features
GET    /api/settings/features/:code
PUT    /api/settings/features/:code
GET    /api/system/info
GET    /api/system/health
```

Endpoint updater indicativi:

```text
GET    /updater/status
GET    /updater/releases/latest
POST   /updater/check
POST   /updater/update
GET    /updater/jobs/:id
POST   /updater/jobs/:id/retry
GET    /updater/backups
```

Le operazioni mutative dell'updater devono essere protette e disponibili soltanto in ambiente locale autorizzato.

---

## 11. Requisiti di sicurezza

### RF3-050 — Binding locale

Per default:

- frontend pubblicato su `127.0.0.1:8080`;
- updater pubblicato su `127.0.0.1:8081`;
- backend non pubblicato sull'host;
- PostgreSQL non pubblicato sull'host.

### RF3-051 — Docker socket

Il Docker socket è montato soltanto nell'updater.

L'updater non deve accettare:

- comandi shell arbitrari;
- nomi immagine forniti dal browser;
- file Compose arbitrari;
- percorsi host arbitrari.

Può eseguire soltanto operazioni previste dal proprio codice e limitate al progetto Compose `ricercacasa`.

### RF3-052 — Provenienza release

Il manifest deve provenire dal canale ufficiale e le immagini devono corrispondere ai digest dichiarati.

Le GitHub Actions di release devono usare permessi minimi e action fissate a commit SHA.

### RF3-053 — Segreti

I segreti:

- non vengono inclusi nelle immagini;
- non vengono committati;
- non vengono restituiti in API;
- non vengono salvati in `feature_configurations.configuration`;
- vengono letti da file secret o da un archivio locale dedicato.

### RF3-054 — Setup monouso

Il token iniziale viene invalidato dopo il completamento del wizard.

---

## 12. Requisiti non funzionali

### RNF3-001 — Usabilità

Un utente che conosce soltanto Docker Desktop deve poter installare la piattaforma senza creare manualmente database o file `.env` tecnici.

### RNF3-002 — Persistenza

La ricreazione di frontend, backend e updater non deve cancellare:

- database;
- impostazioni;
- backup;
- stato del job di aggiornamento.

### RNF3-003 — Osservabilità

Ogni fase updater produce log strutturati con:

- job ID;
- fase;
- versione origine;
- versione destinazione;
- timestamp;
- esito;
- codice errore non sensibile.

### RNF3-004 — Compatibilità

La prima matrice supportata deve essere dichiarata esplicitamente, ad esempio:

- Linux x86_64 con Docker Engine e Compose v2;
- Windows 11 x86_64 con Docker Desktop e container Linux.

Altre piattaforme non devono essere dichiarate supportate finché non testate.

### RNF3-005 — Interruzione controllata

La V3 non promette zero downtime. L'obiettivo è una breve manutenzione controllata e comprensibile.

### RNF3-006 — Idempotenza

Ripetere installazione, migrazioni o ripresa del job non deve produrre duplicati o corrompere lo stato.

---

## 13. Criteri di accettazione V3

La V3 può essere considerata completata quando:

1. un computer pulito con Docker può installare RicercaCasa tramite procedura documentata;
2. l'utente non inserisce credenziali PostgreSQL;
3. il wizard salva nome, email, lingua e fuso orario;
4. le impostazioni sono modificabili dalla dashboard;
5. il database sopravvive alla ricreazione dei container;
6. GitHub Actions esegue test, build e pubblicazione delle immagini;
7. frontend e backend vengono pubblicati con la stessa versione;
8. l'updater rileva una nuova release;
9. una release che richiede un updater nuovo aggiorna prima l'updater;
10. il job riprende dopo il self-update;
11. viene creato e verificato un backup prima della migrazione;
12. frontend e backend vengono aggiornati insieme;
13. un healthcheck fallito impedisce la conferma dell'aggiornamento;
14. un rollback applicativo riporta alla release precedente;
15. un task di configurazione post-update viene mostrato una sola volta per schema version;
16. backend e database non sono esposti sull'host;
17. Subito.it e WikiCasa non sono presenti nella V3.

---

## 14. Ordine consigliato di implementazione

1. correzioni pre-deploy V2;
2. CI di test;
3. modello database V3;
4. API setup e impostazioni;
5. pagina impostazioni frontend;
6. Dockerfile backend;
7. Dockerfile frontend;
8. prototipo updater senza self-update;
9. Compose production;
10. installer e generazione secret;
11. wizard iniziale;
12. release manifest;
13. pubblicazione GHCR;
14. update coordinato frontend/backend;
15. backup e rollback;
16. self-update updater;
17. wizard post-update;
18. test end-to-end su installazione pulita e upgrade V2 → V3;
19. release candidate;
20. V3 stabile.
