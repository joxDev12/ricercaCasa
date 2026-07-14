const assert = require("node:assert/strict");
const test = require("node:test");
const http = require("node:http");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createConfig, createServer } = require("../server");

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, () => {
      resolve(server.address().port);
    });
  });
}

function close(server) {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}

function createBackendMockServer() {
  return http.createServer((req, res) => {
    if (req.url === "/api/setup/status") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          data: {
            completed: false,
            installation: {
              setupStatus: "pending",
            },
          },
        })
      );
      return;
    }

    res.writeHead(404);
    res.end();
  });
}

test("updater serves health and normalized status", async () => {
  const backendServer = createBackendMockServer();
  const backendPort = await listen(backendServer);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ricercacasa-updater-"));
  const manifestPath = path.join(tmpDir, "latest.json");
  fs.writeFileSync(manifestPath, JSON.stringify({ platformVersion: "3.0.0" }));

  const server = createServer(
    createConfig({
      APP_PUBLIC_ORIGIN: "http://127.0.0.1:9080",
      BACKEND_INTERNAL_URL: `http://127.0.0.1:${backendPort}`,
      PORT: "0",
      RELEASE_MANIFEST_PATH: manifestPath,
      SETUP_TOKEN: "test-token",
      UPDATER_VERSION: "1.0.0",
    })
  );

  const port = await listen(server);

  try {
    const healthResponse = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(healthResponse.status, 200);
    assert.equal(await healthResponse.text(), "ok");

    const statusResponse = await fetch(`http://127.0.0.1:${port}/updater/status`);
    assert.equal(statusResponse.status, 200);
    const statusPayload = await statusResponse.json();
    assert.equal(statusPayload.data.appUrl, "http://127.0.0.1:9080");

    const setupStatusResponse = await fetch(
      `http://127.0.0.1:${port}/updater/setup/status`
    );
    assert.equal(setupStatusResponse.status, 200);
    const setupStatusPayload = await setupStatusResponse.json();
    assert.equal(setupStatusPayload.data.phase, "ready");
    assert.equal(setupStatusPayload.data.ready, true);
  } finally {
    await close(server);
    await close(backendServer);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("updater distinguishes missing and invalid manifest", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ricercacasa-updater-"));
  const missingManifestPath = path.join(tmpDir, "missing.json");
  const invalidManifestPath = path.join(tmpDir, "invalid.json");
  fs.writeFileSync(invalidManifestPath, "{invalid");

  const server = createServer(
    createConfig({
      PORT: "0",
      RELEASE_MANIFEST_PATH: missingManifestPath,
      SETUP_TOKEN: "test-token",
    })
  );

  const port = await listen(server);

  try {
    const missingResponse = await fetch(
      `http://127.0.0.1:${port}/updater/releases/latest`
    );
    assert.equal(missingResponse.status, 404);
    const missingPayload = await missingResponse.json();
    assert.equal(missingPayload.code, "RELEASE_MANIFEST_NOT_FOUND");
  } finally {
    await close(server);
  }

  const invalidServer = createServer(
    createConfig({
      PORT: "0",
      RELEASE_MANIFEST_PATH: invalidManifestPath,
      SETUP_TOKEN: "test-token",
    })
  );

  const invalidPort = await listen(invalidServer);

  try {
    const invalidResponse = await fetch(
      `http://127.0.0.1:${invalidPort}/updater/releases/latest`
    );
    assert.equal(invalidResponse.status, 422);
    const invalidPayload = await invalidResponse.json();
    assert.equal(invalidPayload.code, "RELEASE_MANIFEST_INVALID");
  } finally {
    await close(invalidServer);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
