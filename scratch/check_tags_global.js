
import fs from 'fs';

const content = fs.readFileSync('src/screens/MatchDetailScreen.tsx', 'utf8');
const lines = content.split('\n');

let depth = 0;
let stack = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Find all tags
    const matches = line.matchAll(/<([a-zA-Z.]+)|<\/([a-zA-Z.]+)/g);
    for (const match of matches) {
        if (match[1]) {
            // Opening tag
            const name = match[1];
            // Check if self-closing
            const isSelfClosing = line.slice(match.index).match(/^<[A-Za-z.]+[^>]*\/>/);
            if (!isSelfClosing) {
                stack.push({ name, line: i + 1 });
            }
        } else if (match[2]) {
            // Closing tag
            const name = match[2];
            const last = stack.pop();
            if (!last || last.name !== name) {
                console.log(`Mismatch at line ${i+1}: found </${name}> but expected ${last ? last.name : 'nothing'}`);
            }
        }
    }
}

console.log("Remaining stack:", stack);
