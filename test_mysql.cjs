const mysql = require('mysql2/promise');

async function test() {
  try {
    const connection = await mysql.createConnection({
      host: '153.92.15.49',
      port: 3306,
      user: 'u618781129_SebsAdmin',
      password: 'Sebsschool123',
      database: 'u618781129_Sebs_database',
      ssl: { rejectUnauthorized: false }
    });
    const [rows] = await connection.execute('SELECT 1');
    console.log("Success:", rows);
    await connection.end();
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
