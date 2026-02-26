const fs = require('fs');

const files = [
  'c:/web-store/web-store-backup/frontend/app/divisi/rekap-full/page.tsx',
  'c:/web-store/web-store-backup/frontend/app/divisi/monitoring-stok/page.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');

  content = content.replace(
    'if (belumPO === 0 && belumBTB === 0) return "CLOSED";\n    return "";',
    'if (belumPO === 0 && belumBTB === 0) return "CLOSED";\n    return belumPO + "-" + belumBTB;'
  );

  fs.writeFileSync(f, content, 'utf8');
  console.log('Saved debug return logic to', f);
});
