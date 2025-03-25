// model/cso.js
const { pool } = require("../config/db");

// Create the cso table if it doesn't exist
async function createCsoTable() {
    try {
        const query = `
       CREATE TABLE IF NOT EXISTS cso (
              id INT AUTO_INCREMENT PRIMARY KEY,
              registrationId VARCHAR(255) NOT NULL UNIQUE,
              csoName VARCHAR(255) NOT NULL,
              repName VARCHAR(255) NOT NULL,
              email VARCHAR(255) NOT NULL UNIQUE,
              phone VARCHAR(255) NOT NULL UNIQUE,
              sector VARCHAR(255) NOT NULL,
              location VARCHAR(255) NOT NULL,
              office VARCHAR(255) NOT NULL,
              role ENUM('cso') NOT NULL DEFAULT 'cso',
              logo VARCHAR(255), -- Path to the logo file
              tin_certificate VARCHAR(255), -- Path to the TIN certificate file
              registration_certificate VARCHAR(255), -- Path to the registration certificate file
              status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
              date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
             ); `;
        await pool.query(query);
        // console.log("CSO table created or already exists.");
    } catch (error) {
        console.error("Error creating CSO table:", error);
        throw error;
    }
}

module.exports = { 
    createCsoTable, 
    csoTable: "cso" 
}; 