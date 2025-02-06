// const db = require('../config/db');

// // Define the table name for reuse
// const tableName = 'users';

// // Utility function for executing queries
// const query = (sql, params, callback) => {
//   db.query(sql, params, callback);
// };

// // Ensure table exists
// const ensureTableExists = (callback) => {
//   const createTableSQL = `
//     CREATE TABLE IF NOT EXISTS ${tableName} (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       name VARCHAR(100) NOT NULL,
//       email VARCHAR(100) UNIQUE NOT NULL,
//       password VARCHAR(255) NOT NULL,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//     );
//   `;
  
//   query(createTableSQL, [], (err, result) => {
//     callback(err, result);
//   });
// };

// // User Model: Add a new user with auto table creation
// const createUser = (userData, callback) => {
//   // Ensure table exists before adding user
//   ensureTableExists((err) => {
//     if (err) return callback(err);

//     const sql = `INSERT INTO ${tableName} (name, email, password) VALUES (?, ?, ?)`;
//     query(sql, [userData.name, userData.email, userData.password], (err, result) => {
//       callback(err, result);
//     });
//   });
// };

// module.exports = {
//   tableName,
//   query,
//   createUser,
// };

const { pool } = require("../config/db");

// Create the users table if it doesn't exist
async function createUserTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        registrationId VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        userId VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255),
        role ENUM('admin', 'staff', 'cso') NOT NULL DEFAULT 'cso',
        status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        password VARCHAR(255) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await pool.query(query);
    console.log("Users table created or already exists.");
  } catch (error) {
    console.error("Error creating users table:", error);
    throw error;
  }
}

// Export the table reference (for consistency with MongoDB style)
module.exports = {
  createUserTable,
  usersTable: "users", // Reference to the table name
};