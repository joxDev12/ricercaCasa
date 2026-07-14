const { env } = require("./config/env");
const { app } = require("./app");

app.listen(env.port, () => {
  console.log(`Backend attivo su porta ${env.port}`);
});
