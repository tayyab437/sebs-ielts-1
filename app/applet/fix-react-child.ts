const fs = require('fs');
let content = fs.readFileSync('src/pages/public/Courses.tsx', 'utf8');

content = content.replace(/{q\.text}/g, '{typeof q.text === "string" ? q.text : (q.text?.name || (Array.isArray(q.text) ? q.text.join("\\n") : JSON.stringify(q.text)))}');

fs.writeFileSync('src/pages/public/Courses.tsx', content);

let adminContent = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');
adminContent = adminContent.replace(/{q\.text}/g, '{typeof q.text === "string" ? q.text : (q.text?.name || (Array.isArray(q.text) ? q.text.join("\\n") : JSON.stringify(q.text)))}');
fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', adminContent);
