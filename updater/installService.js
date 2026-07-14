const crypto = require("node:crypto");
const fs = require("node:fs");
const { validateManifest } = require("./manifestService");

const phases = ["preflight", "pulling_images", "starting_database", "running_migrations", "starting_backend", "waiting_backend", "starting_frontend", "waiting_frontend", "finalizing"];

function createInstallService({ config, store, docker }) {
  let active = null;

  function current() { return store.read(); }

async function execute(job) {
    try {
      if (!docker.info || !docker.composeVersion) {
        throw Object.assign(new Error("Docker client non configurato"), { code: "DOCKER_CLIENT_NOT_CONFIGURED" });
      }
      await docker.info({ onLine: (line) => store.appendLog(job.jobId, line) });
      await docker.composeVersion({ onLine: (line) => store.appendLog(job.jobId, line) });
      validateManifest(JSON.parse(fs.readFileSync(config.releaseManifestPath, "utf8")), config.allowedImageNamespace);
      for (const phase of phases) {
        job.phase = phase;
        job.updatedAt = new Date().toISOString();
        store.write(job);
        store.appendLog(job.jobId, phase);
        const runCompose = (args) => docker.compose(args, { onLine: (line) => store.appendLog(job.jobId, line) });
        if (phase === "pulling_images") await runCompose(["pull"]);
        if (phase === "starting_database") await runCompose(["up", "-d", "database"]);
        if (phase === "running_migrations") await runCompose(["up", "-d", "migrate"]);
        if (phase === "starting_backend") await runCompose(["up", "-d", "backend"]);
        if (phase === "starting_frontend") await runCompose(["up", "-d", "frontend"]);
      }
      job.status = "completed";
      job.completedAt = new Date().toISOString();
      job.updatedAt = job.completedAt;
      store.write(job);
    } catch (error) {
      job.status = "failed";
      job.error = { code: error.code || "INSTALL_FAILED", message: error.message };
      job.updatedAt = new Date().toISOString();
      store.write(job);
      store.appendLog(job.jobId, job.error.message);
    } finally {
      active = null;
    }
  }

  function start(kind = "install") {
    const existing = current();
    if (active || (existing && existing.status === "running")) {
      const error = new Error("Installazione già in corso");
      error.code = "JOB_ALREADY_RUNNING";
      error.statusCode = 409;
      throw error;
    }
    if (existing?.status === "completed") {
      const error = new Error("Installazione già completata");
      error.code = "INSTALL_ALREADY_COMPLETED";
      error.statusCode = 409;
      throw error;
    }
    const now = new Date().toISOString();
    const job = { jobId: crypto.randomUUID(), kind, fromVersion: null, toVersion: config.platformVersion, status: "running", phase: "preflight", startedAt: now, updatedAt: now, completedAt: null, error: null, rollback: null };
    active = job;
    store.write(job);
    void execute(job);
    return job;
  }

  return { current, start };
}

module.exports = { createInstallService, phases };
