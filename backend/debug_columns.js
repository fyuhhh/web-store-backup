import pool from './config/database.js';

async function checkData() {
  try {
    const [cols] = await pool.query('SHOW COLUMNS FROM po');
    console.log('PO Columns:', cols.map(c => c.Field).join(', '));
    
    // Also pr columns
    const [prCols] = await pool.query('SHOW COLUMNS FROM pr');
    console.log('PR Columns:', prCols.map(c => c.Field).join(', '));
    
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

checkData();
