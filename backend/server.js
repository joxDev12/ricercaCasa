const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const cors = require("cors");
const express = require("express");
const { pool } = require("./config/db");
const annunciRoutes = require("./routes/annunciRoutes");
const { init } = require("./models/annunciModel");

const app = express();
const port = Number(process.env.PORT) || 3000;
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: frontendOrigin }));
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: "DB non raggiungibile" });
  }
});

app.use("/api/annunci", annunciRoutes);

async function startServer() {
  try {
    await init();
    app.listen(port, () => {
      console.log(`Server attivo su porta ${port}`);
    });
  } catch (error) {
    console.error("Avvio fallito:", error);
    process.exit(1);
  }
}

startServer();
