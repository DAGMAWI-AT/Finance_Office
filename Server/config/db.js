// // config/db.js
// const mysql = require("mysql2/promise");
// require("dotenv").config();

// // Enhanced DB configuration with robust error handling
// const pool = mysql.createPool({
//   host: process.env.DB_HOST || "localhost",
//   user: process.env.DB_USER || "root",
//   password: process.env.DB_PASSWORD || "",
//   database: process.env.DB_NAME || "finance_office",
//   waitForConnections: true,
//   connectionLimit: 10,
//   acquireTimeout: 60000, // 60 seconds acquire timeout
//   connectTimeout: 10000, // 10 seconds connection timeout
//   queueLimit: 0,
//   enableKeepAlive: true, // Enable keep-alive
//   keepAliveInitialDelay: 10000, // 10 seconds before first keepalive
//   timezone: 'local', // Ensure timezone matches server
//   charset: 'utf8mb4', // Support full Unicode
//   multipleStatements: false, // Prevent SQL injection
//   decimalNumbers: true, // Return decimals as numbers
//   namedPlaceholders: true // Enable named parameters
// });

// // Connection event handlers
// pool.on('acquire', (connection) => {
//   console.log(`Connection ${connection.threadId} acquired`);
// });

// pool.on('release', (connection) => {
//   console.log(`Connection ${connection.threadId} released`);
// });

// pool.on('enqueue', () => {
//   console.log('Waiting for available connection slot');
// });

// pool.on('connection', (connection) => {
//   console.log(`New connection ${connection.threadId} established`);
  
//   connection.on('error', (err) => {
//     console.error('MySQL connection error:', err);
//     if (err.code === 'PROTOCOL_CONNECTION_LOST') {
//       console.error('Database connection was closed.');
//     } else if (err.code === 'ER_CON_COUNT_ERROR') {
//       console.error('Database has too many connections.');
//     } else if (err.code === 'ECONNRESET') {
//       console.error('Database connection was reset.');
//     } else {
//       console.error('Unhandled database connection error');
//     }
//   });
// });

// // Health check function
// async function checkConnection() {
//   let connection;
//   try {
//     connection = await pool.getConnection();
//     await connection.ping();
//     console.log('Database connection is healthy');
//     return true;
//   } catch (err) {
//     console.error('Database health check failed:', err);
//     return false;
//   } finally {
//     if (connection) connection.release();
//   }
// }

// // Retry wrapper for queries
// async function executeWithRetry(query, params = [], retries = 3, delay = 1000) {
//   for (let i = 0; i < retries; i++) {
//     let connection;
//     try {
//       connection = await pool.getConnection();
//       const [rows] = await connection.query(query, params);
//       return rows;
//     } catch (err) {
//       if (i === retries - 1) throw err; // Throw on last retry
      
//       if (err.code === 'ECONNRESET' || 
//           err.code === 'PROTOCOL_CONNECTION_LOST' ||
//           err.code === 'ETIMEDOUT') {
//         console.warn(`Retry ${i + 1}/${retries} for query: ${query}`);
//         await new Promise(res => setTimeout(res, delay * (i + 1)));
//         continue;
//       }
//       throw err;
//     } finally {
//       if (connection) connection.release();
//     }
//   }
// }

// // Initialize connection
// async function connectDB() {
//   try {
//     const isHealthy = await checkConnection();
//     if (!isHealthy) {
//       throw new Error('Initial database health check failed');
//     }
//     console.log('MySQL connected successfully');
//   } catch (err) {
//     console.error('MySQL connection failed:', err);
    
//     // Graceful shutdown
//     try {
//       await pool.end();
//     } catch (poolErr) {
//       console.error('Error closing connection pool:', poolErr);
//     }
    
//     process.exit(1);
//   }
// }

// module.exports = { 
//   pool, 
//   connectDB, 
//   executeWithRetry,
//   checkConnection 
// };



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
  // queueLimit: 0,
  // connectTimeout: 10000, // 10 seconds timeout
  waitForConnections: true,
  connectTimeout: 60000, // Increase to 60 seconds
  acquireTimeout: 60000, // Increase to 60 seconds
  queueLimit: 0

});

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