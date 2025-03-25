// config/db.js
const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "finance_office",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000, // 10 seconds timeout

});
// const pool = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });
// if0_37792639_fainance_office	use_name if0_37792639  user_host_name sql309.infinityfree.com	
async function connectDB() {
  try {
    // const connection = await pool.getConnection();
    console.log("MySQL connected successfully");
    // connection.release(); // Release the connection back to the pool
  } catch (err) {
    console.error("MySQL connection failed:", err);
    process.exit(1);
  }
}

module.exports = { pool, connectDB };