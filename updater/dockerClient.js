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
    child.on("close", (code) => code === 0 ? resolve(output) : reject(Object.assign(new Error(`Docker command failed (${code})`), { code: "DOCKER_COMMAND_FAILED", exitCode: code })));
  });
}

function createDockerClient(config) {
  const composeArgs = (args) => ["compose", "--env-file", config.releaseEnvPath, "-f", config.composeFilePath, ...args];
  return {
    compose(args, options = {}) { return run("docker", composeArgs(args), options); },
  };
}

module.exports = { createDockerClient, run };
