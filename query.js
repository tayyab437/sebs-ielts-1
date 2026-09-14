import mysql from 'mysql2/promise';
async function run() {
  const connection = await mysql.createConnection({
    host: 'srv1758.hstgr.io',
    port: 3306,
    user: 'u618781129_sebsAdmin',
    password: 'Sebsschool123',
    database: 'u618781129_Sebs_database',
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const [rows] = await connection.query('SHOW CREATE TABLE classroom_enrollments');
    console.log('SHOW CREATE TABLE classroom_enrollments:', rows);
  } catch (err) {
    console.log('Error showing create table:', err.message);
  }

  try {
    const [rows] = await connection.query('DESCRIBE classrooms');
    console.log('Classrooms table structure:', rows);
  } catch (err) {
    console.log('Error describing classrooms:', err.message);
  }
  process.exit(0);
}
run();
