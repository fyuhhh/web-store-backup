const fs = require('fs');
const files = [
  'c:/web-store/web-store-backup/frontend/app/divisi/rekap-full/page.tsx',
  'c:/web-store/web-store-backup/frontend/app/divisi/monitoring-stok/page.tsx'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  const replaced = content.replace(/uppercase(["\s]+rowSpan=)/g, 'uppercase align-top$1');
  if (replaced !== content) {
    fs.writeFileSync(f, replaced, 'utf8');
    console.log(`Updated ${f}`);
  } else {
    console.log(`No match found in ${f}`);
  }
});
