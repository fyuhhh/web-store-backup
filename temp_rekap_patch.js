async function testFetch() {
  const prRes = await fetch('http://localhost:5000/api/pr-items/detailed');
  const prDataRaw = await prRes.json();
  console.log('prDataRaw length: ', prDataRaw.length);
  const prData = Array.isArray(prDataRaw) ? prDataRaw : prDataRaw.data;
  
  if (!Array.isArray(prData)) {
    console.log('Keys in prDataRaw:', Object.keys(prDataRaw));
    return;
  }

  const poRes = await fetch('http://localhost:5000/api/po_rekap_dashboard');
  const poDataRaw = await poRes.json();
  const poData = Array.isArray(poDataRaw) ? poDataRaw : poDataRaw.data;
  
  const btbRes = await fetch('http://localhost:5000/api/btb_rekap_dashboard');
  const btbDataRaw = await btbRes.json();
  const btbData = Array.isArray(btbDataRaw) ? btbDataRaw : btbDataRaw.data;

  // Find PR 43
  const targetPR = prData.find(pr => pr.noPR === 'PR/PRQ/26/II/00043');
  if (!targetPR) return console.log('PR not found');

  console.log(`Found PR: ${targetPR.noPR}`);
  
  targetPR.items.forEach((item) => {
    const poItems = poData.filter(po => String(po.id_PRItem) === String(item.id_PRItem));
    
    if (poItems.length > 0) {
      poItems.forEach(poItem => {
        const btbItems = btbData.filter(btb => String(btb.id_POItem) === String(poItem.id_POItem));
        
        console.log(`\n  Item: ${item.namaBarang}`);
        console.log(`    POItems: ${poItems.length}. ID: ${poItem.id_POItem}, PO: ${poItem.noPO}, QtyAwal: ${poItem.quantityAwalPO}`);
        console.log(`    BTBItems for this POItem: ${btbItems.length}`);
        
        btbItems.forEach(btb => {
          console.log(`      BTB: ${btb.no_btb} (id_btb_item: ${btb.id_btb_item}, id_btb: ${btb.id_btb}, targetPO: ${btb.targetPencapaianPO || ''})`);
        });
      });
    } else {
      console.log(`  Item: ${item.namaBarang} (No POs)`);
    }
  });

}

testFetch().catch(console.error);
