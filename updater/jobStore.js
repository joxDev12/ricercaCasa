const fs = require("node:fs");
const path = require("node:path");

function createJobStore(installationDir) {
  const stateDir = path.join(installationDir, "state");
  const statePath = path.join(stateDir, "installation.json");
  const logDir = path.join(stateDir, "logs");

  function read() {
    try { return JSON.parse(fs.readFileSync(statePath, "utf8")); } catch { return null; }
  }

  function write(state) {
    fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
    fs.mkdirSync(logDir, { recursive: true, mode: 0o700 });
    const temp = `${statePath}.tmp`;
    fs.writeFileSync(temp, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
    fs.renameSync(temp, statePath);
    return state;
  }

  function appendLog(jobId, line) {
    fs.appendFileSync(path.join(logDir, `${jobId}.log`), `${new Date().toISOString()} ${line}\n`, { mode: 0o600 });
  }

  return { read, write, appendLog };
}

module.exports = { createJobStore };
