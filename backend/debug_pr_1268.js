import pool from './config/database.js';

async function checkData() {
  try {
    const id_PRItem = 1268;
    const [prItems] = await pool.query('SELECT * FROM pr_item WHERE id_PRItem = ?', [id_PRItem]);
    console.log('PR Item:', JSON.stringify(prItems, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

checkData();
