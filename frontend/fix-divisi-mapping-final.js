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

    // 1. Fix the No PO case (inside if (poItems.length === 0))
    // This case follows the line: const poItems = poItemData.filter...
    // And before the else block
    
    // We can use a more specific regex or just find and replace the incorrect line
    // The incorrect line is currently: statusPR_closed: computeStatusPRClosed(item, typeof poItem !== "undefined" ? poItem : null),
    
    const lines = content.split('\n');
    let insideNoPO = false;
    let newLines = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        if (line.includes('const poItems = poItemData.filter')) {
            insideNoPO = true; // Potentially starting a block
        }
        
        if (insideNoPO && line.includes('if (poItems.length === 0)')) {
            // We are definitely inside the No PO block now
        }

        if (line.includes('} else {')) {
            insideNoPO = false; // Exiting No PO block
        }

        if (line.includes('statusPR_closed: computeStatusPRClosed(item,')) {
            if (insideNoPO) {
                // Replace with null since poItem is not in scope
                line = line.replace(/statusPR_closed: computeStatusPRClosed\(item, [^)]*\)/, 'statusPR_closed: computeStatusPRClosed(item, null)');
            } else {
                // In PO/BTB loops, poItem IS in scope
                line = line.replace(/statusPR_closed: computeStatusPRClosed\(item, [^)]*\)/, 'statusPR_closed: computeStatusPRClosed(item, poItem)');
            }
        }
        
        newLines.push(line);
    }

    content = newLines.join('\n');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed mappings in ${filePath}`);
});
console.log('Done.');
