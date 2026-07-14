const assert = require("node:assert/strict");
const test = require("node:test");
const { validateManifest } = require("../manifestService");

function manifest() {
  const digest = "a".repeat(64);
  return {
    schemaVersion: 1,
    platformVersion: "3.0.0",
    updaterVersion: "1.0.0",
    minimumUpdaterVersion: "1.0.0",
    images: {
      backend: { reference: `ghcr.io/joxdev12/ricercacasa-backend@sha256:${digest}`, version: "3.0.0" },
      frontend: { reference: `ghcr.io/joxdev12/ricercacasa-frontend@sha256:${digest}`, version: "3.0.0" },
      updater: { reference: `ghcr.io/joxdev12/ricercacasa-updater@sha256:${digest}`, version: "1.0.0" },
    },
    assets: {
      compose: { name: "compose.yaml", sha256: digest },
      releaseEnv: { name: "release.env.example", sha256: digest },
    },
    database: { migrationMode: "forward-only", backupRequired: false },
  };
}

test("manifest validator accepts pinned GHCR images", () => {
  assert.doesNotThrow(() => validateManifest(manifest()));
});

test("manifest validator rejects unauthorized image reference", () => {
  const value = manifest();
  value.images.backend.reference = "docker.io/example/backend:latest";
  assert.throws(() => validateManifest(value), /immagine backend non valida/);
});
