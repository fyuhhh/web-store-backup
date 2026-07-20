import pool from './config/database.js';

async function checkData() {
  try {
    const poNumber = 'PO/E-WALK/WBL/26/I/00073';
    console.log(`Checking PO: ${poNumber}`);
    
    const [po] = await pool.query('SELECT * FROM po WHERE noPO = ?', [poNumber]);
    if (po.length === 0) {
      console.log('PO not found');
      return;
    }
    const id_PO = po[0].id_PO;
    console.log('PO Data:', JSON.stringify(po[0], null, 2));
    
    const [poItems] = await pool.query('SELECT * FROM po_item WHERE id_PO = ?', [id_PO]);
    console.log('PO Items:', JSON.stringify(poItems, null, 2));
    
    if (poItems.length > 0 && poItems[0].id_PR) {
      const [prItems] = await pool.query('SELECT * FROM pr_item WHERE id_PR = ?', [poItems[0].id_PR]);
      console.log('PR Items:', JSON.stringify(prItems, null, 2));
    }
    
    const [btbItems] = await pool.query(`
      SELECT bi.*, b.noBTB, b.tanggalBTB 
      FROM btb_item bi 
      JOIN btb b ON bi.id_BTB = b.id_BTB 
      WHERE bi.id_po_item IN (SELECT id_po_item FROM po_item WHERE id_PO = ?)
    `, [id_PO]);
    console.log('BTB Items:', JSON.stringify(btbItems, null, 2));
    
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

checkData();
