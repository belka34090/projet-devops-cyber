// backend/API_Node.js

import express from "express";
import mysql from "mysql2/promise";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const dbConfig = {
  host: "db",
  user: "devops",
  password: "devops123",
  database: "campagne",
};

// Authentifier un agent
app.post("/api/login", async (req, res) => {
  const { matricule, code } = req.body;
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(
      "SELECT * FROM agents WHERE matricule = ? AND code_acces = ?",
      [matricule, code]
    );
    await conn.end();
    if (rows.length > 0) {
      res.json({ success: true, agent: rows[0] });
    } else {
      res.status(401).json({ success: false, message: "Accès refusé" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Enregistrer une activité
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
      "INSERT INTO activities (agent_id, action, details) VALUES (?, ?, ?)",
      [agent_id, action, details]
    );
    await conn.end();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Récupérer toutes les activités d’un agent
app.get("/api/activities/:matricule", async (req, res) => {
  const matricule = req.params.matricule;
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(
      `SELECT a.*, ag.nom, ag.service
       FROM activities a
       JOIN agents ag ON a.agent_id = ag.id
       WHERE ag.matricule = ?
       ORDER BY a.date DESC
       `,
      [matricule]
    );
    await conn.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(5000, () => {
  console.log("API Node.js listening on port 5000");
});