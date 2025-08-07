// backend/init_db.js
const mysql = require('mysql2/promise');

(async () => {
  const connection = await mysql.createConnection({
    host: 'db',
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
  await connection.end();
})();
