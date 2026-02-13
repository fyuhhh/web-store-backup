
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/app/dashboard/rekap-full/page.tsx');
try {
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
                    //    return; // Keep going to find more? No, stop.
                }
                const last = stack.pop();
                if (!last) {
                    console.log(`Error: Unexpected ${char} at line ${i + 1}:${j + 1}`);
                    return;
                }
                if (
                    (char === '}' && last.char !== '{') ||
                    (char === ')' && last.char !== '(') ||
                    (char === ']' && last.char !== '[')
                ) {
                    console.log(`Error: Mismatched ${char} at line ${i + 1}:${j + 1}. Expected closing for ${last.char} from line ${last.line}:${last.col}`);
                    return;
                }
            }
        }
    }

    if (stack.length > 0) {
        const last = stack[stack.length - 1];
        console.log(`Error: Unclosed ${last.char} at line ${last.line}:${last.col}`);
    } else {
        console.log("Brackets are balanced.");
    }
} catch (err) {
    console.error("Error reading file:", err);
}
