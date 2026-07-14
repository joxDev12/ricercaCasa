const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { createInstallService } = require("../installService");
const { createJobStore } = require("../jobStore");

test("install service persists phases and runs allowlisted compose actions", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ricercacasa-install-"));
  const digest = "a".repeat(64);
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({
    schemaVersion: 1, platformVersion: "3.0.0", updaterVersion: "1.0.0", minimumUpdaterVersion: "1.0.0",
    images: {
      backend: { reference: `ghcr.io/joxdev12/ricercacasa-backend@sha256:${digest}`, version: "3.0.0" },
      frontend: { reference: `ghcr.io/joxdev12/ricercacasa-frontend@sha256:${digest}`, version: "3.0.0" },
      updater: { reference: `ghcr.io/joxdev12/ricercacasa-updater@sha256:${digest}`, version: "1.0.0" },
    },
    assets: { compose: { name: "compose.yaml", sha256: digest }, releaseEnv: { name: "release.env.example", sha256: digest } },
    database: { migrationMode: "forward-only", backupRequired: false },
  }));
  const commands = [];
  const service = createInstallService({
    config: { installationDir: dir, releaseManifestPath: path.join(dir, "manifest.json"), platformVersion: "3.0.0" },
    store: createJobStore(dir),
    docker: { info: async () => {}, composeVersion: async () => {}, compose: async (args) => commands.push(args) },
  });
  try {
    const job = service.start();
    for (let i = 0; i < 50 && service.current()?.status === "running"; i += 1) await new Promise((resolve) => setTimeout(resolve, 5));
    assert.equal(service.current().status, "completed");
    assert.deepEqual(commands, [["pull"], ["up", "-d", "database"], ["run", "--rm", "migrate"], ["up", "-d", "backend"], ["up", "-d", "frontend"]]);
    assert.equal(service.current().jobId, job.jobId);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
