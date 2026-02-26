const fs = require('fs');

const files = [
    'c:/web-store/web-store-backup/frontend/app/divisi/rekap-full/page.tsx',
    'c:/web-store/web-store-backup/frontend/app/divisi/monitoring-stok/page.tsx'
];

files.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Update computeStatusPRClosed function
    const newFunction = `  function computeStatusPRClosed(quantityBelumPO: any, quantityBelumBTB: any) {
    const q1 = (quantityBelumPO !== "" && quantityBelumPO !== null && quantityBelumPO !== undefined) ? Number(quantityBelumPO) : -1;
    const q2 = (quantityBelumBTB !== "" && quantityBelumBTB !== null && quantityBelumBTB !== undefined) ? Number(quantityBelumBTB) : -1;
    if (q1 === 0 && q2 === 0) return "CLOSED";
    return "";
  }`;

    content = content.replace(/function computeStatusPRClosed\([\s\S]*?\}\n\n/g, newFunction + "\n\n");

    // 2. Identify and fix Case 1 (No PO)
    // We look for if (poItems.length === 0) { ... quantityPO: item.jumlah ?? "", ... }
    const noPORegex = /(if\s*\(\s*poItems\.length\s*===\s*0\s*\)\s*\{[\s\S]*?rekapRows\.push\(\{[\s\S]*?quantityPO:\s*item\.jumlah\s*\?\?\s*"",[\s\S]*?sisaStokBTB:\s*"",[\s\S]*?)(statusPR_closed:\s*computeStatusPRClosed\(item,\s*null\))/g;
    content = content.replace(noPORegex, "$1statusPR_closed: computeStatusPRClosed(item.jumlah, -1)");

    // 3. Identify and fix Case 2 (PO, No BTB)
    // We look for if (btbItems.length === 0) { ... quantityPO: item\?\.jumlah \?\? "", ... sisaStokBTB: poItem\?\.jumlahPO \?\? "", ... }
    const poNoBTBRegex = /(if\s*\(\s*btbItems\.length\s*===\s*0\s*\)\s*\{[\s\S]*?rekapRows\.push\(\{[\s\S]*?)(quantityPO:\s*item\?\.jumlah\s*\?\?\s*"",)([\s\S]*?sisaStokBTB:\s*poItem\?\.jumlahPO\s*\?\?\s*"",[\s\S]*?)(statusPR_closed:\s*computeStatusPRClosed\(item,\s*poItem\))/g;
    content = content.replace(poNoBTBRegex, "$1quantityPO: 0,$3statusPR_closed: computeStatusPRClosed(0, poItem?.jumlahPO)");

    // 4. Identify and fix Case 3 (PO & BTB)
    // We look for btbItems.forEach ... rekapRows.push ... quantityPO missing or commented out ...
    const poBTBRegex = /(btbItems\.forEach\(\(btbItem:\s*any\)\s*=>\s*\{[\s\S]*?rekapRows\.push\(\{[\s\S]*?)(\/\/ quantityPO removed \(duplicate\))?([\s\S]*?sisaStokBTB:\s*poItem\?\.jumlahPO\s*\?\?\s*"",[\s\S]*?)(statusPR_closed:\s*computeStatusPRClosed\(item,\s*poItem\))/g;
    content = content.replace(poBTBRegex, "$1quantityPO: 0,$3sisaStokBTB: 0, statusPR_closed: computeStatusPRClosed(0, 0)");

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully updated ${filePath}`);
});

console.log('Final fix applied.');
