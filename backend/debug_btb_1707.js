import pool from './config/database.js';

async function checkData() {
  try {
    const id_POItem = 1707;
    const [btbItems] = await pool.query(`
      SELECT bi.*, b.no_btb, b.tanggal_btb, b.status 
      FROM btb_item bi 
      JOIN btb b ON bi.id_btb = b.id_btb 
      WHERE bi.id_POItem = ?
    `, [id_POItem]);
    console.log('BTB Items:', JSON.stringify(btbItems, null, 2));
    
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

checkData();
