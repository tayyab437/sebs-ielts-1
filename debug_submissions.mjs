
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  const mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST || "srv1758.hstgr.io",
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || "u618781129_sebsAdmin",
    password: process.env.MYSQL_PASSWORD || "Sebsschool123",
    database: process.env.MYSQL_DATABASE || "u618781129_Sebs_database",
    ssl: { rejectUnauthorized: false },
  });

  try {
    const [rows] = await mysqlPool.query("SELECT * FROM student_submissions LIMIT 5");
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await mysqlPool.end();
  }
}

run();
