const mysql = require('mysql2/promise');
async function test() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "srv1758.hstgr.io",
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || "u618781129_sebsAdmin",
    password: process.env.MYSQL_PASSWORD || "Sebsschool123",
    database: process.env.MYSQL_DATABASE || "u618781129_Sebs_database",
    ssl: { rejectUnauthorized: false }
  });
  
  const tables = ['courses', 'course_sections', 'course_pages', 'page_blocks'];
  for (const t of tables) {
    try {
      const [desc] = await connection.query(`DESCRIBE \`${t}\``);
      console.log(`Table ${t} structure:`, desc.map(c => ({ Field: c.Field, Type: c.Type })));
    } catch (err) {
      console.log(`Table ${t} error:`, err.message);
    }
  }
  
  await connection.end();
}
test();
