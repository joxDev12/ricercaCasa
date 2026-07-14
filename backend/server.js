const { env } = require("./config/env");
const { app } = require("./app");
const { closePool } = require("./config/db");

const server = app.listen(env.port, () => {
  console.log(`Backend attivo su porta ${env.port}`);
});

let isShuttingDown = false;

function forceExit() {
  process.exit(1);
}

async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  const timeout = setTimeout(forceExit, 10000);

  try {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
    await closePool();
    clearTimeout(timeout);
    process.exit(0);
  } catch (error) {
    console.error(`Shutdown fallito dopo ${signal}`, error);
    clearTimeout(timeout);
    forceExit();
  }
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
