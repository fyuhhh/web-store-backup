const fs = require('fs');
const path = require('path');

const targetFile = 'c:/web-store/web-store-backup/frontend/app/dashboard/rekap-full/page.tsx';
const patchFile = 'c:/web-store/web-store-backup/temp_rekap_patch.js';

const targetContent = fs.readFileSync(targetFile, 'utf8');
const patchContent = fs.readFileSync(patchFile, 'utf8');

const startMarker = 'prData.forEach((pr: any) => {';
const endMarker = '// Helper to parse PR number';

const startIndex = targetContent.indexOf(startMarker);
const endIndex = targetContent.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find markers');
    console.error('Start found:', startIndex !== -1);
    console.error('End found:', endIndex !== -1);
    process.exit(1);
}

// Check if there is some whitespace before startMarker to preserve indentation? 
// The patch content usually has its own indentation.
// We replace everything from startIndex up to (but not including) endIndex.
// Wait, we need to keep the empty line before the helper if it exists, or typically endIndex points to the start of the comment.
// We should replace up to the line *before* the comment probably, or just replace strictly between markers.

const newContent = targetContent.substring(0, startIndex) + patchContent + '\n\n        ' + targetContent.substring(endIndex);

fs.writeFileSync(targetFile, newContent, 'utf8');
console.log('Patch applied successfully');
