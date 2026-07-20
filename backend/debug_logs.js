import pool from './config/database.js';

async function checkData() {
  try {
    const id_POItem = 1707;
    const [logs] = await pool.query(`
      SELECT * FROM activity_logs
      WHERE resource_id = ? AND action IN ('DELETE', 'UPDATE', 'CREATE')
      ORDER BY created_at DESC
      LIMIT 10
    `, [648]); // Check logs for btb 648
    console.log('Logs for BTB 648:', JSON.stringify(logs, null, 2));

    const [logsPO] = await pool.query(`
      SELECT * FROM activity_logs
      WHERE resource_id = ? AND resource_type = 'PO'
      ORDER BY created_at DESC
      LIMIT 10
    `, [707]);
    console.log('Logs for PO 707:', JSON.stringify(logsPO, null, 2));
    
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

checkData();
