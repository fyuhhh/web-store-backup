const fs = require('fs');
const path = require('path');

const files = [
    'c:/web-store/web-store-backup/frontend/app/divisi/rekap-full/page.tsx',
    'c:/web-store/web-store-backup/frontend/app/divisi/monitoring-stok/page.tsx'
];

const newImplementation = `  function computeStatusPRClosed(item: any, poItem: any) {
    if (!item) return "";
    const belumPOValue = item?.jumlah;
    const belumPO = (belumPOValue !== undefined && belumPOValue !== null && belumPOValue !== "") 
      ? Number(belumPOValue) 
      : -1;
    const belumBTBValue = poItem?.jumlahPO;
    const belumBTB = (belumBTBValue !== undefined && belumBTBValue !== null && belumBTBValue !== "") 
      ? Number(belumBTBValue) 
      : -1;
    if (belumPO === 0 && belumBTB === 0) return "CLOSED";
    return "";
  }`;

files.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Regex to find and replace the entire function definition
    const functionRegex = /function computeStatusPRClosed\([^{]*\) \{[\s\S]*?return[^;]*;?\s*\}/;
    
    if (functionRegex.test(content)) {
        content = content.replace(functionRegex, newImplementation);
        console.log(`Updated function in ${filePath}`);
    } else {
        console.log(`Function computeStatusPRClosed not found in ${filePath}`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Done.');
