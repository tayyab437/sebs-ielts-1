const fs = require('fs');
const content = fs.readFileSync('src/components/course-designer/BlockEditor.tsx', 'utf8');
const lines = content.split('\n');

// Find imports
console.log(lines.slice(0, 15).join('\n'));
