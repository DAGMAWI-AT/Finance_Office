const { pool } = require("../config/db");

// Create the users table if it doesn't exist
async function createUserTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        registrationId VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        userId INT NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        role ENUM('cso') NOT NULL DEFAULT 'cso',
        status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
        password VARCHAR(255) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES cso(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (registrationId) REFERENCES cso(registrationId) ON DELETE CASCADE ON UPDATE CASCADE
      )
    `;
    await pool.query(query);
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
