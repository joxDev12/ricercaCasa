const { spawn } = require("node:child_process");

function run(command, args, { cwd, env, onLine } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    const collect = (chunk) => {
      const text = chunk.toString();
      output += text;
      text.split(/\r?\n/).filter(Boolean).forEach((line) => onLine?.(line));
    };
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve(output) : reject(Object.assign(new Error(`Docker command failed (${code}): ${output.trim().split(/\r?\n/).slice(-3).join(" | ")}`), { code: "DOCKER_COMMAND_FAILED", exitCode: code })));
  });
}

function createDockerClient(config) {
  const composeArgs = (args) => ["compose", "-p", config.composeProjectName, "--env-file", config.releaseEnvPath, "-f", config.composeFilePath, ...args];
  const composeOptions = (options = {}) => ({ ...options, env: { ...process.env, RICERCACASA_HOME: config.installationDir, BACKEND_PORT: config.backendPort, RICERCACASA_CONTROL_NETWORK: process.env.RICERCACASA_CONTROL_NETWORK || "ricercacasa-control", ALLOWED_IMAGE_NAMESPACE: config.allowedImageNamespace || process.env.ALLOWED_IMAGE_NAMESPACE || "ghcr.io/joxdev12" } });
  return {
    info(options = {}) { return run("docker", ["info"], options); },
    composeVersion(options = {}) { return run("docker", ["compose", "version"], options); },
    compose(args, options = {}) { return run("docker", composeArgs(args), composeOptions(options)); },
  };
}

module.exports = { createDockerClient, run };
