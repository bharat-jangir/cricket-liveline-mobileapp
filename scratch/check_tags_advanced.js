
import fs from 'fs';

const content = fs.readFileSync('src/screens/MatchDetailScreen.tsx', 'utf8');

// Simple tag stack tracker
const tags = [];
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matches = line.matchAll(/<(View|ScrollView|Card|ThemedText|TouchableOpacity|Ionicons|AnimatedBall|TeamSquadButton|RefreshControl|Modal|KeyboardAvoidingView|TextInput|G|Rect|Circle|Line|Polyline|Svg|Animated\.View|BottomSheet|BottomSheetView|Image|RefreshControl|BallMarker|InningTeamStats|ActiveWicketStats)/g);
    
    for (const match of matches) {
        if (line[match.index + match[0].length] === ' ' || line[match.index + match[0].length] === '>') {
             // It's an opening tag
             const isSelfClosing = line.slice(match.index).match(/^<[A-Za-z.]+[^>]*\/>/);
             if (!isSelfClosing) {
                 tags.push({ name: match[1], line: i + 1 });
             }
        }
    }
    
    const closeMatches = line.matchAll(/<\/([A-Za-z.]+)/g);
    for (const match of closeMatches) {
        const last = tags.pop();
        if (!last || last.name !== match[1]) {
            console.log(`Mismatch at line ${i + 1}: found </${match[1]}> but expected ${last ? last.name : 'nothing'}`);
            if (last) tags.push(last);
        }
    }
}

console.log("Remaining tags:", tags);
