const http = require("node:http");

const port = Number(process.env.PORT || 8081);

const request = http.get(
  {
    host: "127.0.0.1",
    port,
    path: "/health",
    timeout: 5000,
  },
  (response) => {
    response.resume();
    process.exit(response.statusCode === 200 ? 0 : 1);
  }
);

request.on("timeout", () => {
  request.destroy(new Error("timeout"));
});

request.on("error", () => {
  process.exit(1);
});
