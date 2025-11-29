const fs = require('fs');
const path = require('path');

const files = [
  { name: 'deckScoringRubric', file: 'deck-scoring.md' },
  { name: 'questionGenRubric', file: 'question-generation.md' },
  { name: 'feedbackRubric', file: 'written-feedback.md' },
  { name: 'startupPreseedRubric', file: 'startup-preseed.md' },
  { name: 'startupSeedRubric', file: 'startup-seed.md' },
  { name: 'startupSeriesARubric', file: 'startup-series-a.md' }
];

let output = '// Auto-generated rubric constants\n\n';

files.forEach(({ name, file }) => {
  const filePath = path.join(__dirname, 'rubrics', file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const escaped = content
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');
  output += `export const ${name} = \`${escaped}\`;\n\n`;
});

const outputPath = path.join(__dirname, 'rubrics.ts');
fs.writeFileSync(outputPath, output);
console.log('Created rubrics.ts with', files.length, 'rubrics');
