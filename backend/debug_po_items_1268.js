import pool from './config/database.js';

async function checkData() {
  try {
    const [poItems] = await pool.query('SELECT * FROM po_item WHERE id_PRItem = 1268');
    console.log('PO Items for PR 1268:', JSON.stringify(poItems, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

checkData();
