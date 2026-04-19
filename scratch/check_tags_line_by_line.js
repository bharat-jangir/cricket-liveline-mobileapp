
import fs from 'fs';

const content = fs.readFileSync('src/screens/MatchDetailScreen.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
for (let i = 1400; i < 1850; i++) {
    const line = lines[i];
    if (!line) continue;
    
    // Simplistic but focused
    const opens = line.matchAll(/<(View|ScrollView|Card|ThemedText|TouchableOpacity|Modal|KeyboardAvoidingView|TextInput|Svg|G|Rect|Circle|Line|Polyline)/g);
    for (const match of opens) {
        const isSelfClosing = line.slice(match.index).match(/^<[A-Za-z.]+[^>]*\/>/);
        if (!isSelfClosing) {
            stack.push({ name: match[1], line: i + 1 });
        }
    }
    
    const closes = line.matchAll(/<\/([A-Za-z.]+)/g);
    for (const match of closes) {
        const last = stack.pop();
        if (!last || last.name !== match[1]) {
            console.log(`[LINE ${i+1}] Mismatch: found </${match[1]}> but expected ${last ? last.name : 'nothing'}`);
            if (last) stack.push(last);
        }
    }
    
    if (i + 1 === 1647) {
        console.log(`[LINE 1647] Stack at ScrollView close:`, stack.map(s => s.name));
    }
}
