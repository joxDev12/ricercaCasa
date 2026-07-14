const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const port = Number(process.env.PORT || 8081);
const publicDir = path.join(__dirname, "public");
const backendInternalUrl = process.env.BACKEND_INTERNAL_URL || "http://backend:3000";
const releaseManifestPath =
  process.env.RELEASE_MANIFEST_PATH || "/state/manifests/latest.json";

function readSecret(secretValue, secretFilePath) {
  if (secretFilePath) {
    return fs.readFileSync(secretFilePath, "utf8").trim();
  }

  return secretValue || "";
}

const setupToken = readSecret(
  process.env.SETUP_TOKEN,
  process.env.SETUP_TOKEN_FILE
);

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

async function readRequestBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function proxySetupRequest(req, res, targetPath) {
  if (!setupToken) {
    sendJson(res, 503, {
      error: "Setup token non configurato",
      code: "SETUP_TOKEN_NOT_CONFIGURED",
    });
    return;
  }

  const body =
    req.method === "POST" || req.method === "PUT" || req.method === "PATCH"
      ? await readRequestBody(req)
      : undefined;

  const response = await fetch(`${backendInternalUrl}${targetPath}`, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      "x-setup-token": setupToken,
    },
    body,
  });

  const responseText = await response.text();
  res.writeHead(response.status, {
    "Content-Type": response.headers.get("content-type") || "application/json",
  });
  res.end(responseText);
}

function getWizardStatus() {
  return {
    updaterVersion: process.env.UPDATER_VERSION || "1.0.0",
    platformVersion: process.env.PLATFORM_VERSION || "3.0.0",
    backendInternalUrl,
    hasSetupToken: Boolean(setupToken),
  };
}

function getLatestManifest() {
  try {
    const content = fs.readFileSync(releaseManifestPath, "utf8");
    return JSON.parse(content);
  } catch (_error) {
    return null;
  }
}

const server = require("node:http").createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && requestUrl.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("ok");
      return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/updater/status") {
      sendJson(res, 200, { data: getWizardStatus() });
      return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/updater/releases/latest") {
      sendJson(res, 200, { data: getLatestManifest() });
      return;
    }

    if (
      (req.method === "GET" || req.method === "POST") &&
      requestUrl.pathname.startsWith("/updater/setup/")
    ) {
      const proxiedPath = requestUrl.pathname.replace("/updater", "");
      await proxySetupRequest(req, res, proxiedPath);
      return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/") {
      sendFile(res, path.join(publicDir, "index.html"), "text/html; charset=utf-8");
      return;
    }

    sendJson(res, 404, { error: "Not found", code: "NOT_FOUND" });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Errore interno updater",
      code: "UPDATER_INTERNAL_ERROR",
    });
  }
});

server.listen(port, () => {
  console.log(`Updater attivo su porta ${port}`);
});
