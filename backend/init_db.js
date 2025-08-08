// backend/init_db.js
const mysql = require('mysql2/promise');

(async () => {
  const connection = await mysql.createConnection({
    host: 'db', // ou 'devops-cyber-db' selon ton docker-compose
    user: 'devops',
    password: 'devops123',
    database: 'campagne'
  });

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS agents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      matricule VARCHAR(16) NOT NULL UNIQUE,
      nom VARCHAR(64) NOT NULL,
      service VARCHAR(32) NOT NULL,
      code_acces VARCHAR(32) NOT NULL
    );
  `);
  console.log('✅ Table agents créée');

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS activities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      agent_id INT,
      type_activite VARCHAR(100),
      details TEXT,
      date_heure DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );
  `);
  console.log('✅ Table activities créée');

  await connection.end();
})();