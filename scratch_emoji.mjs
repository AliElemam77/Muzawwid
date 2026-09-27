import fs from 'fs';

const content = fs.readFileSync('src/lib/i18n.tsx', 'utf8');
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu;

let match;
const lines = content.split('\n');
lines.forEach((line, idx) => {
  const matches = line.match(emojiRegex);
  if (matches) {
    console.log(`Line ${idx + 1}: ${matches.join(' ')} | ${line.trim()}`);
  }
});
