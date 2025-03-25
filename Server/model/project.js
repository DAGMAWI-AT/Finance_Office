const { pool } = require("../config/db");

// Create MySQL table if it doesn't exist
async function createTable() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS projectandproposal (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        files TEXT, -- Store file paths as a comma-separated string
        expire_date TIMESTAMP NULL DEFAULT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await pool.query(createTableQuery);
    console.log("projectandproposal table created or already exists.");
  } catch (error) {
    console.error("Error creating projectandproposal table:", error);
    throw error;
  }
}

// Model functions

createTable(); // Ensure the table is created

module.exports = {createTable, ProjectAndProposal: "projectandproposal"};
