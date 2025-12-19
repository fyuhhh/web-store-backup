import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'web_store_db',
  waitForConnections: true,
  connectionLimit: 50,
  queueLimit: 0,
});

export default pool;
