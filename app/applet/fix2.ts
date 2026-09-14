import fs from 'fs';
let content = fs.readFileSync('src/pages/public/Courses.tsx', 'utf8');

const ensureStr = '(typeof $1 === "string" ? $1 : (Array.isArray($1) ? $1.join("\\n") : String($1 || "")))';

content = content.replace(/\((q\.text)\s*\|\|\s*""\)\.split/g, ensureStr + '.split');
content = content.replace(/\((q\.passageText)\s*\|\|\s*""\)\.split/g, ensureStr + '.split');
content = content.replace(/\((q\.correctAnswer)\s*\|\|\s*""\)\.split/g, ensureStr + '.split');

fs.writeFileSync('src/pages/public/Courses.tsx', content);
