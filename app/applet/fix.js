const fs = require('fs');
let content = fs.readFileSync('src/pages/public/Courses.tsx', 'utf8');

// For q.text
content = content.replace(/\(q\.text \|\| ""\)\.split/g, '(typeof q.text === "string" ? q.text : (Array.isArray(q.text) ? q.text.join("\\n") : String(q.text || ""))).split');

// For q.passageText
content = content.replace(/\(q\.passageText \|\| ""\)\.split/g, '(typeof q.passageText === "string" ? q.passageText : (Array.isArray(q.passageText) ? q.passageText.join("\\n") : String(q.passageText || ""))).split');

// For q.correctAnswer
content = content.replace(/\(q\.correctAnswer \|\| ""\)\.split/g, '(typeof q.correctAnswer === "string" ? q.correctAnswer : (Array.isArray(q.correctAnswer) ? q.correctAnswer.join("\\n") : String(q.correctAnswer || ""))).split');

fs.writeFileSync('src/pages/public/Courses.tsx', content);
