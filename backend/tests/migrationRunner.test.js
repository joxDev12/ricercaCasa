const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  buildDatabaseUrl,
  getDatabasePassword,
  getMigrationStatus,
} = require("../scripts/run-migrations");

test("buildDatabaseUrl returns DATABASE_URL when provided", () => {
  assert.equal(
    buildDatabaseUrl({
      DATABASE_URL: "postgres://user:pass@db:5432/ricercacasa",
    }),
    "postgres://user:pass@db:5432/ricercacasa"
  );
});

test("buildDatabaseUrl builds URL from DB_* and DB_PASS", () => {
  assert.equal(
    buildDatabaseUrl({
      DB_HOST: "database",
      DB_PORT: "5432",
      DB_NAME: "ricercacasa",
      DB_USER: "ricercacasa",
      DB_PASS: "s3cr3t",
    }),
    "postgres://ricercacasa:s3cr3t@database:5432/ricercacasa"
  );
});

test("buildDatabaseUrl reads password from DB_PASS_FILE", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ricercacasa-migrate-"));
  const secretFile = path.join(tmpDir, "db-pass");
  fs.writeFileSync(secretFile, "file-secret\n");

  try {
    assert.equal(
      buildDatabaseUrl({
        DB_HOST: "database",
        DB_PORT: "5432",
        DB_NAME: "ricercacasa",
        DB_USER: "ricercacasa",
        DB_PASS_FILE: secretFile,
      }),
      "postgres://ricercacasa:file-secret@database:5432/ricercacasa"
    );
    assert.equal(getDatabasePassword({ DB_PASS_FILE: secretFile }), "file-secret");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("buildDatabaseUrl throws clear error when params are incomplete", () => {
  assert.throws(
    () =>
      buildDatabaseUrl({
        DB_HOST: "database",
        DB_USER: "ricercacasa",
      }),
    /Missing DB connection variables: DB_NAME/
  );

  assert.throws(
    () =>
      buildDatabaseUrl({
        DB_HOST: "database",
        DB_NAME: "ricercacasa",
        DB_USER: "ricercacasa",
      }),
    /Missing database password/
  );
});

test("getMigrationStatus reports applied and pending migrations", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ricercacasa-status-"));
  const migrationA = "001_first.js";
  const migrationB = "002_second.js";
  fs.writeFileSync(path.join(tmpDir, migrationA), "exports.up = () => {};\n");
  fs.writeFileSync(path.join(tmpDir, migrationB), "exports.up = () => {};\n");

  const calls = [];
  const fakeClient = {
    async connect() {
      calls.push("connect");
    },
    async query(sql) {
      calls.push(sql);
      return {
        rows: [{ name: migrationA }],
      };
    },
    async end() {
      calls.push("end");
    },
  };

  try {
    const status = await getMigrationStatus(
      {
        DATABASE_URL: "postgres://user:pass@db:5432/ricercacasa",
      },
      {
        clientFactory(connectionString) {
          assert.equal(connectionString, "postgres://user:pass@db:5432/ricercacasa");
          return fakeClient;
        },
        migrationsDir: tmpDir,
      }
    );

    assert.deepEqual(status, {
      applied: [migrationA],
      pending: [migrationB],
      unknown: [],
    });
    assert.deepEqual(calls, [
      "connect",
      "SELECT name FROM pgmigrations ORDER BY run_on ASC, id ASC",
      "end",
    ]);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("getMigrationStatus treats missing pgmigrations table as all pending", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ricercacasa-status-"));
  const migrationA = "001_first.js";
  fs.writeFileSync(path.join(tmpDir, migrationA), "exports.up = () => {};\n");

  const fakeClient = {
    async connect() {},
    async query() {
      const error = new Error('relation "pgmigrations" does not exist');
      error.code = "42P01";
      throw error;
    },
    async end() {},
  };

  try {
    const status = await getMigrationStatus(
      {
        DATABASE_URL: "postgres://user:pass@db:5432/ricercacasa",
      },
      {
        clientFactory() {
          return fakeClient;
        },
        migrationsDir: tmpDir,
      }
    );

    assert.deepEqual(status, {
      applied: [],
      pending: [migrationA],
      unknown: [],
    });
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
