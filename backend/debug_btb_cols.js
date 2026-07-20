import pool from './config/database.js';

async function checkData() {
  try {
    const [btbCols] = await pool.query('SHOW COLUMNS FROM btb');
    console.log('BTB Columns:', btbCols.map(c => c.Field).join(', '));
    
    const [btbiCols] = await pool.query('SHOW COLUMNS FROM btb_item');
    console.log('BTB Item Columns:', btbiCols.map(c => c.Field).join(', '));
    
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

checkData();
