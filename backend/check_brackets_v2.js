
const fs = require('fs');
const path = require('path');

// Try absolute path directly
const filePath = 'c:/web-store/web-store-backup/frontend/app/dashboard/rekap-full/page.tsx';
console.log("Checking file:", filePath);

try {
    if (!fs.existsSync(filePath)) {
        console.error("File does not exist!");
        process.exit(1);
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    let stack = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '{' || char === '(' || char === '[') {
                stack.push({ char, line: i + 1, col: j + 1 });
            } else if (char === '}' || char === ')' || char === ']') {
                if (stack.length === 0) {
                    console.log(`Error: Unexpected ${char} at line ${i + 1}:${j + 1}`);
                    //    return;
                }
                const last = stack.pop();
                if (!last) continue; // Ignore if stack empty

                if (
                    (char === '}' && last.char !== '{') ||
                    (char === ')' && last.char !== '(') ||
                    (char === ']' && last.char !== '[')
                ) {
                    console.log(`Error: Mismatched ${char} at line ${i + 1}:${j + 1}. Expected closing for ${last.char} from line ${last.line}:${last.col}`);
                    // return;
                }
            }
        }
    }

    if (stack.length > 0) {
        // Print last 5 unclosed
        console.log(`Unclosed items count: ${stack.length}`);
        const lastFew = stack.slice(-5);
        lastFew.forEach(item => {
            console.log(`Error: Unclosed ${item.char} at line ${item.line}:${item.col}`);
        });
    } else {
        console.log("Brackets are balanced.");
    }
} catch (err) {
    console.error("Error reading file:", err);
}
