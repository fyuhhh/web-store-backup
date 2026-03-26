import mysql from 'mysql2/promise';

async function testConnection(host) {
  console.log(`Testing connection to ${host}...`);
  const start = Date.now();
  try {
    const connection = await mysql.createConnection({
      host: host,
      user: 'root',
      password: '',
      database: 'web_store_db',
      connectTimeout: 5000
    });
    console.log(`Successfully connected to ${host} in ${Date.now() - start}ms`);
    await connection.end();
  } catch (err) {
    console.error(`Failed to connect to ${host} in ${Date.now() - start}ms:`, err.message);
  }
}

async function runTests() {
  await testConnection('localhost');
  await testConnection('127.0.0.1');
  await testConnection('192.168.10.10');
  process.exit(0);
}

runTests();
