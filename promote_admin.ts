import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: Number(process.env.MYSQLPORT)
});

async function promote() {
  try {
    const [result]: any = await pool.query(
      "UPDATE User SET role = 'ADMIN' WHERE email = 'rafidrohan022@gmail.com'"
    );
    console.log('Promotion Result:', result.affectedRows, 'row(s) updated');
    
    const [user]: any = await pool.query(
      "SELECT user_id, role FROM User WHERE email = 'rafidrohan022@gmail.com'"
    );
    console.log('Current User Info:', user[0]);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

promote();
