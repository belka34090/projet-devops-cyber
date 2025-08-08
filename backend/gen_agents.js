// backend/gen_agents.js
import mysql from "mysql2/promise";

const services = ["finance", "technique", "rh", "service"];
const password = "cyber2025";

const connection = await mysql.createConnection({
  host: "db",
  user: "devops",
  password: "devops123",
  database: "campagne",
});

for (let i = 1; i <= 100; i++) {
  const matricule = `M${i.toString().padStart(3, "0")}`;
  const nom = `Agent${i}`;
  const service = services[Math.floor(Math.random() * services.length)];
  await connection.execute(
    "INSERT INTO agents (matricule, nom, service, code_acces) VALUES (?, ?, ?, ?)",
    [matricule, nom, service, password]
  );
}
console.log("100 agents créés !");
await connection.end();