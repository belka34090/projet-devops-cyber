const express = require("express");
const mysql = require("mysql2/promise");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");

const app = express();
app.set("trust proxy", 1);

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || "supersecretkey",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 3600000
  }
}));

const PORT = process.env.PORT || 5000;

const dbConfig = {
  host: process.env.DB_HOST || process.env.MYSQL_HOST || "db",
  user: process.env.DB_USER || process.env.MYSQL_USER || "admin",
  password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || "ChangeMeToo!",
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE || "devops_cyber",
  port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
};

async function withConn(fn) {
  const conn = await mysql.createConnection(dbConfig);
  try {
    return await fn(conn);
  } finally {
    await conn.end();
  }
}

const sseClients = new Set();
function sseBroadcast(activityRow) {
  const data = `data: ${JSON.stringify(activityRow)}\n\n`;
  for (const res of sseClients) {
    try { res.write(data); } catch { }
  }
}

function eventToActivityRow(ev, agentService = null) {
  let type_activite = ev.event_type;
  let details = "";

  switch (ev.event_type) {
    case "login_success": details = "Connexion réussie"; break;
    case "login_failed": details = "Connexion échouée"; break;
    case "ui_click": details = `Click ${ev.element || ""}`.trim(); break;
    case "quiz_start": details = `Quiz start (${ev.page || ""})`; break;
    case "quiz_submit": details = `Score: ${ev.score ?? ""}${ev.score != null ? "/?" : ""} Durée(ms): ${ev.duration_ms ?? ""} Tentative: ${ev.attempt ?? ""}`; break;
    case "quiz_retry": details = `Retry tentative ${ev.attempt ?? ""}`; break;
    case "video_progress": details = `Video pos(ms): ${ev.video_position_ms ?? ""} +${ev.duration_ms ?? ""}ms`; break;
  }

  if (!details && ev.extra) details = JSON.stringify(ev.extra);

  return {
    matricule: ev.matricule || "",
    nom: "",
    service: agentService || "",
    type_activite,
    date_heure: ev.created_at,
    details
  };
}

app.get("/health", (_req, res) => res.status(200).send("OK"));
app.get("/api/health", (_req, res) => res.status(200).send("OK"));
app.get("/ready", async (_req, res) => {
  try {
    await withConn(conn => conn.ping());
    res.status(200).send("READY");
  } catch (e) {
    res.status(503).json({ status: "NOT_READY", error: e.message });
  }
});
app.get("/api/ready", async (_req, res) => {
  try {
    await withConn(conn => conn.ping());
    res.status(200).send("READY");
  } catch (e) {
    res.status(503).json({ status: "NOT_READY", error: e.message });
  }
});

app.get("/api/agents", async (_req, res) => {
  try {
    const rows = await withConn(async conn => {
      const [r] = await conn.execute("SELECT id, matricule, service FROM agents");
      return r;
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

async function logEvent(ev) {
  await withConn(async conn => {
    await conn.execute(
      `INSERT INTO activity_events
      (matricule, event_type, page, element, duration_ms, score, attempt, video_position_ms, extra)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ev.matricule,
        ev.event_type,
        ev.page || null,
        ev.element || null,
        ev.duration_ms ?? null,
        ev.score ?? null,
        ev.attempt ?? null,
        ev.video_position_ms ?? null,
        ev.extra ? JSON.stringify(ev.extra) : null
      ]
    );
  });

  const agent = await withConn(async conn => {
    const [r] = await conn.execute("SELECT service FROM agents WHERE matricule = ?", [ev.matricule]);        
    return r[0] || null;
  });

  const activityRow = eventToActivityRow(
    { ...ev, created_at: new Date().toISOString() },
    agent ? agent.service : null
  );
  sseBroadcast(activityRow);
}

app.post("/api/login", async (req, res) => {
  const { matricule, code } = req.body;
  try {
    const agent = await withConn(async conn => {
      const [rows] = await conn.execute(
        "SELECT id, matricule, service FROM agents WHERE matricule = ? AND code_acces = ?",
        [matricule, code]
      );
      return rows[0];
    });

    if (agent) {
      req.session.agent = agent;
      await logEvent({ matricule, event_type: "login_success", page: "/login" });
      res.json({ success: true, agent });
    } else {
      await logEvent({ matricule: matricule || "UNKNOWN", event_type: "login_failed", page: "/login" });     
      res.status(401).json({ success: false, message: "Accès refusé" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/me", (req, res) => {
  if (req.session.agent) res.json({ loggedIn: true, agent: req.session.agent });
  else res.status(401).json({ loggedIn: false });
});

app.post("/api/logout", async (req, res) => {
  const matricule = req.session?.agent?.matricule || "UNKNOWN";
  await logEvent({ matricule, event_type: "logout", page: "/logout" });
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});


// ✅ ROUTE AJOUTÉE POUR ACCEPTER fetch('/api/activities')
app.post("/api/activities", async (req, res) => {
  try {
    const {
      matricule,
      event_type,
      page,
      element,
      duration_ms,
      score,
      attempt,
      video_position_ms,
      extra
    } = req.body;

    if (!matricule || !event_type) {
      return res.status(400).json({ success: false, error: "matricule et event_type requis" });
    }

    await logEvent({
      matricule,
      event_type,
      page,
      element,
      duration_ms,
      score,
      attempt,
      video_position_ms,
      extra
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


app.post("/api/events", async (req, res) => {
  try {
    const { matricule, event_type, page, element, duration_ms, score, attempt, video_position_ms, extra } = req.body;
    if (!matricule || !event_type) return res.status(400).json({ success: false, error: "matricule et event_type requis" });
    await logEvent({ matricule, event_type, page, element, duration_ms, score, attempt, video_position_ms, extra });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/ui/click", async (req, res) => {
  const { matricule, page, element, extra } = req.body;
  if (!matricule || !element) return res.status(400).json({ success: false, error: "matricule et element requis" });
  await logEvent({ matricule, event_type: "ui_click", page, element, extra });
  res.json({ success: true });
});

app.post("/api/quiz/start", async (req, res) => {
  const { matricule, page = "/quiz", extra } = req.body;
  if (!matricule) return res.status(400).json({ success: false, error: "matricule requis" });
  await logEvent({ matricule, event_type: "quiz_start", page, extra });
  res.json({ success: true });
});

app.post("/api/quiz/submit", async (req, res) => {
  const { matricule, page = "/quiz", duration_ms, score, attempt, extra } = req.body;
  if (!matricule) return res.status(400).json({ success: false, error: "matricule requis" });
  await logEvent({ matricule, event_type: "quiz_submit", page, duration_ms, score, attempt, extra });        
  res.json({ success: true });
});

app.post("/api/quiz/retry", async (req, res) => {
  const { matricule, page = "/quiz", attempt, extra } = req.body;
  if (!matricule) return res.status(400).json({ success: false, error: "matricule requis" });
  await logEvent({ matricule, event_type: "quiz_retry", page, attempt, extra });
  res.json({ success: true });
});

app.post("/api/video/progress", async (req, res) => {
  const { matricule, page, video_position_ms, duration_ms, extra } = req.body;
  if (!matricule) return res.status(400).json({ success: false, error: "matricule requis" });
  await logEvent({ matricule, event_type: "video_progress", page, video_position_ms, duration_ms, extra });  
  res.json({ success: true });
});

app.get("/api/activities", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 500), 5000);
    const rows = await withConn(async conn => {
      const [ev] = await conn.execute(
        "SELECT e.*, a.service FROM activity_events e LEFT JOIN agents a ON a.matricule = e.matricule ORDER BY e.created_at DESC LIMIT ?",
        [limit]
      );
      return ev.map(r => eventToActivityRow({
        matricule: r.matricule,
        event_type: r.event_type,
        page: r.page,
        element: r.element,
        duration_ms: r.duration_ms,
        score: r.score,
        attempt: r.attempt,
        video_position_ms: r.video_position_ms,
        extra: r.extra ? JSON.parse(r.extra) : null,
        created_at: r.created_at
      }, r.service));
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/activities/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  res.write("retry: 3000\n\n");
  sseClients.add(res);
  req.on("close", () => { sseClients.delete(res); });
});

app.get("/api/events", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 200), 2000);
    const ev = await withConn(async conn => {
      const [r] = await conn.execute("SELECT * FROM activity_events ORDER BY created_at DESC LIMIT ?", [limit]);
      return r;
    });
    res.json(ev);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API Node.js listening on port ${PORT}`);
});

