const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { URL } = require("node:url");

const BODY_LIMIT_BYTES = 64 * 1024;

function readSecret(secretValue, secretFilePath) {
  if (!secretFilePath) {
    return secretValue || "";
  }

  return fs.readFileSync(secretFilePath, "utf8").trim();
}

function createConfig(env = process.env) {
  return {
    port: Number(env.PORT || 8081),
    publicDir: path.join(__dirname, "public"),
    backendInternalUrl: env.BACKEND_INTERNAL_URL || "http://backend:3000",
    releaseManifestPath:
      env.RELEASE_MANIFEST_PATH || "/state/manifests/latest.json",
    appPublicOrigin:
      env.APP_PUBLIC_ORIGIN || `http://127.0.0.1:${env.APP_PORT || "8080"}`,
    setupToken: readSecret(env.SETUP_TOKEN, env.SETUP_TOKEN_FILE),
    updaterVersion: env.UPDATER_VERSION || "1.0.0",
    platformVersion: env.PLATFORM_VERSION || "3.0.0",
  };
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function sendFile(res, filePath, contentType) {
  const file = fs.readFileSync(filePath);
  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": file.length,
  });
  res.end(file);
}

async function readRequestBody(req, limitBytes = BODY_LIMIT_BYTES) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    totalBytes += chunk.length;

    if (totalBytes > limitBytes) {
      const error = new Error("Request body too large");
      error.statusCode = 413;
      error.code = "REQUEST_BODY_TOO_LARGE";
      throw error;
    }

    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function fetchSetupStatus(config) {
  if (!config.setupToken) {
    return {
      appUrl: config.appPublicOrigin,
      completed: false,
      phase: "error",
      message: "Token setup non configurato",
      ready: false,
    };
  }

  try {
    const response = await fetch(`${config.backendInternalUrl}/api/setup/status`, {
      headers: {
        "x-setup-token": config.setupToken,
      },
    });

    if (response.status === 503) {
      return {
        appUrl: config.appPublicOrigin,
        completed: false,
        phase: "preparing",
        message: "Preparazione in corso",
        ready: false,
      };
    }

    const payload = await response.json();

    if (!response.ok) {
      return {
        appUrl: config.appPublicOrigin,
        completed: false,
        errorCode: payload.code || "SETUP_STATUS_ERROR",
        message: payload.error || "Stato setup non disponibile",
        phase: "error",
        ready: false,
      };
    }

    const completed = payload.data?.completed === true;

    return {
      appUrl: config.appPublicOrigin,
      completed,
      installation: payload.data?.installation || null,
      message: completed ? "Installazione completata" : "Pronto per configurazione",
      phase: completed ? "completed" : "ready",
      preferences: payload.data?.preferences || null,
      ready: !completed,
    };
  } catch (_error) {
    return {
      appUrl: config.appPublicOrigin,
      completed: false,
      phase: "preparing",
      message: "Preparazione in corso",
      ready: false,
    };
  }
}

async function proxySetupComplete(req, res, config) {
  if (!config.setupToken) {
    sendJson(res, 503, {
      error: "Token setup non configurato",
      code: "SETUP_TOKEN_NOT_CONFIGURED",
    });
    return;
  }

  const body = await readRequestBody(req);
  const response = await fetch(`${config.backendInternalUrl}/api/setup/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-setup-token": config.setupToken,
    },
    body,
  });
  const responseText = await response.text();

  res.writeHead(response.status, {
    "Content-Type": response.headers.get("content-type") || "application/json",
  });
  res.end(responseText);
}

function getUpdaterStatus(config) {
  return {
    appUrl: config.appPublicOrigin,
    hasSetupToken: Boolean(config.setupToken),
    platformVersion: config.platformVersion,
    updaterVersion: config.updaterVersion,
  };
}

function getLatestManifest(config) {
  if (!fs.existsSync(config.releaseManifestPath)) {
    return {
      error: {
        code: "RELEASE_MANIFEST_NOT_FOUND",
        message: "Manifest release assente",
      },
      statusCode: 404,
    };
  }

  try {
    return {
      data: JSON.parse(fs.readFileSync(config.releaseManifestPath, "utf8")),
      statusCode: 200,
    };
  } catch (_error) {
    return {
      error: {
        code: "RELEASE_MANIFEST_INVALID",
        message: "Manifest release non valido",
      },
      statusCode: 422,
    };
  }
}

function createServer(config = createConfig()) {
  return http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url, `http://${req.headers.host}`);

      if (req.method === "GET" && requestUrl.pathname === "/health") {
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("ok");
        return;
      }

      if (req.method === "GET" && requestUrl.pathname === "/updater/status") {
        sendJson(res, 200, { data: getUpdaterStatus(config) });
        return;
      }

      if (req.method === "GET" && requestUrl.pathname === "/updater/setup/status") {
        sendJson(res, 200, { data: await fetchSetupStatus(config) });
        return;
      }

      if (req.method === "POST" && requestUrl.pathname === "/updater/setup/complete") {
        await proxySetupComplete(req, res, config);
        return;
      }

      if (req.method === "GET" && requestUrl.pathname === "/updater/releases/latest") {
        const manifest = getLatestManifest(config);

        if (manifest.error) {
          sendJson(res, manifest.statusCode, manifest.error);
          return;
        }

        sendJson(res, 200, { data: manifest.data });
        return;
      }

      if (req.method === "GET" && requestUrl.pathname === "/") {
        sendFile(res, path.join(config.publicDir, "index.html"), "text/html; charset=utf-8");
        return;
      }

      sendJson(res, 404, { error: "Not found", code: "NOT_FOUND" });
    } catch (error) {
      sendJson(res, error.statusCode || 500, {
        error: error instanceof Error ? error.message : "Errore interno updater",
        code: error.code || "UPDATER_INTERNAL_ERROR",
      });
    }
  });
}

function startServer(config = createConfig()) {
  const server = createServer(config);

  server.listen(config.port, () => {
    console.log(`Updater attivo su porta ${config.port}`);
  });

  let shuttingDown = false;

  async function shutdown() {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    await new Promise((resolve) => {
      server.close(() => resolve());
    });
  }

  process.on("SIGTERM", () => {
    void shutdown();
  });

  process.on("SIGINT", () => {
    void shutdown();
  });

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  BODY_LIMIT_BYTES,
  createConfig,
  createServer,
  fetchSetupStatus,
  getLatestManifest,
  readRequestBody,
  startServer,
};
