const http = require("node:http");

const healthMode = process.argv[2] === "live" ? "live" : "ready";
const port = Number(process.env.PORT || 3000);

const request = http.get(
  {
    host: "127.0.0.1",
    port,
    path: `/health/${healthMode}`,
    timeout: 5000,
  },
  (response) => {
    if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
      response.resume();
      process.exit(0);
      return;
    }

    response.resume();
    process.exit(1);
  }
);

request.on("timeout", () => {
  request.destroy(new Error("Healthcheck timeout"));
});

request.on("error", () => {
  process.exit(1);
});
