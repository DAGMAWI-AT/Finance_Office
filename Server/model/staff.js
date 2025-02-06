// model/staff.js
const { pool } = require("../config/db");

async function createStaffTable() {
    try {
        const query = `
        CREATE TABLE IF NOT EXISTS staff (
            id INT AUTO_INCREMENT PRIMARY KEY,
            registrationId VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone VARCHAR(20),
            position VARCHAR(255),
            role ENUM('admin', 'cso', 'viewer') DEFAULT 'admin',
            photo VARCHAR(255),
            status ENUM('active', 'inactive') DEFAULT 'active',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        await pool.query(query);
    } catch (error) {
        console.error("Error creating staff table:", error);
        throw error;
    }
}

module.exports = {
    createStaffTable,
    staffTable: "staff",
};
