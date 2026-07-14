const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  buildDatabaseUrl,
  getDatabasePassword,
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
