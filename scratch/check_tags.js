
import fs from 'fs';

const content = fs.readFileSync('src/screens/MatchDetailScreen.tsx', 'utf8');

// Focus on the LiveTab return block
// Assuming it's between "return (" and ");" in LiveTab
const liveTabMatch = content.match(/const LiveTab = \(\) => \{[\s\S]*?return \(([\s\S]*?)\);/);

if (!liveTabMatch) {
    console.log("Could not find LiveTab return block");
    process.exit(1);
}

const block = liveTabMatch[1];
const openViews = (block.match(/<View/g) || []).length;
const closeViews = (block.match(/<\/View>/g) || []).length;

console.log(`Open Views: ${openViews}`);
console.log(`Close Views: ${closeViews}`);

const openScrollView = (block.match(/<ScrollView/g) || []).length;
const closeScrollView = (block.match(/<\/ScrollView>/g) || []).length;

console.log(`Open ScrollView: ${openScrollView}`);
console.log(`Close ScrollView: ${closeScrollView}`);

const openThemedText = (block.match(/<ThemedText/g) || []).length;
const closeThemedText = (block.match(/<\/ThemedText>/g) || []).length;

console.log(`Open ThemedText: ${openThemedText}`);
console.log(`Close ThemedText: ${closeThemedText}`);
