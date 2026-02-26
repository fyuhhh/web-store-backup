const fs = require('fs');

const files = [
  'c:/web-store/web-store-backup/frontend/app/divisi/rekap-full/page.tsx',
  'c:/web-store/web-store-backup/frontend/app/divisi/monitoring-stok/page.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');

  // If statusPR_closed mapping doesn't exist, inject it right above plan: pr.plan || "",
  if (!content.includes('statusPR_closed: computeStatusPRClosed(')) {
    content = content.replace(/plan:\s*pr\.plan\s*\|\|\s*"",/g, (match) => {
      return 'statusPR_closed: computeStatusPRClosed(item, typeof poItem !== "undefined" ? poItem : null),\n                      ' + match;
    });
    fs.writeFileSync(f, content, 'utf8');
    console.log('Injected statusPR_closed into', f);
  } else {
    console.log('statusPR_closed already exists in', f);
  }
});
