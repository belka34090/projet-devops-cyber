// backend/API_Node.js (CommonJS)
const express = require("express");
const mysql = require("mysql2/promise");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

const dbConfig = {
  host: process.env.DB_HOST || "db",
  user: process.env.DB_USER || "devops",
  password: process.env.DB_PASSWORD || "devops123",
  database: process.env.DB_NAME || "campagne",
  port: Number(process.env.DB_PORT || 3306),
};

//   Health & Readiness
app.get("/health", (_req, res) => res.status(200).send("OK"));
app.get("/ready", async (_req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    await conn.ping();
    await conn.end();
    res.status(200).send("READY");
  } catch (e) {
    res.status(503).json({ status: "NOT_READY", error: e.message });
  }
});

// --- tes routes existantes ---
app.get("/api/agents", async (req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute("SELECT * FROM agents");
    await conn.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/login", async (req, res) => {
  const { matricule, code } = req.body;
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(
      "SELECT * FROM agents WHERE matricule = ? AND code_acces = ?",
      [matricule, code]
    );
    await conn.end();
    if (rows.length > 0) res.json({ success: true, agent: rows[0] });
    else res.status(401).json({ success: false, message: "Accès refusé" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/activities", async (req, res) => {
  const { matricule, action, details } = req.body;
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(
      "SELECT id FROM agents WHERE matricule = ?",
      [matricule]
    );
    if (rows.length === 0) {
      await conn.end();
      return res.status(404).json({ success: false, message: "Agent inconnu" });
    }
    const agent_id = rows[0].id;
    await conn.execute(
      "INSERT INTO activities (agent_id, type_activite, details) VALUES (?, ?, ?)",
      [agent_id, action, details]
    );
    await conn.end();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/activities", async (_req, res) => {
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(`
      SELECT a.*, ag.nom, ag.service, ag.matricule
      FROM activities a
      JOIN agents ag ON a.agent_id = ag.id
      ORDER BY a.date_heure DESC
    `);
    await conn.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/activities/:matricule", async (req, res) => {
  const matricule = req.params.matricule;
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(
      `SELECT a.*, ag.nom, ag.service
       FROM activities a
       JOIN agents ag ON a.agent_id = ag.id
       WHERE ag.matricule = ?
       ORDER BY a.date_heure DESC`,
      [matricule]
    );
    await conn.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API Node.js listening on port ${PORT}`);
});