const annunciModel = require("../models/annunciModel");

async function index(_req, res) {
  try {
    const annunci = await annunciModel.getAll();
    res.json(annunci);
  } catch (error) {
    res.status(500).json({ error: "Errore lettura annunci" });
  }
}

module.exports = { index };
