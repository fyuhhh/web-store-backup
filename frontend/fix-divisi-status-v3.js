const fs = require('fs');

const files = [
  'c:/web-store/web-store-backup/frontend/app/divisi/rekap-full/page.tsx',
  'c:/web-store/web-store-backup/frontend/app/divisi/monitoring-stok/page.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');

  // Inject mapping by finding `plan: pr.plan || "",`
  let count = 0;
  content = content.replace(/plan:\s*pr\.plan\s*\|\|\s*"",/g, (match) => {
    count++;
    
    // Check if we already injected it in a previous run to avoid duplicates
    const doubleCheck = 'statusPR_closed: computeStatusPRClosed(item';
    
    return 'statusPR_closed: computeStatusPRClosed(item, typeof poItem !== "undefined" ? poItem : null),\n                      ' + match;
  });

  // Deduplication if the script runs twice
  content = content.replace(/statusPR_closed: computeStatusPRClosed\(item, typeof poItem !== "undefined" \? poItem : null\),\n\s*statusPR_closed: computeStatusPRClosed\(item, typeof poItem !== "undefined" \? poItem : null\),/g, 
  'statusPR_closed: computeStatusPRClosed(item, typeof poItem !== "undefined" ? poItem : null),');

  fs.writeFileSync(f, content, 'utf8');
  console.log('Saved updates to', f, '| Injections:', count);
});
