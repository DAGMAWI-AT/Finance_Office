const { pool } = require("../config/db");
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

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
            role ENUM('admin', 'sup_admin') DEFAULT 'admin',
            photo VARCHAR(255),
            password VARCHAR(255) NOT NULL,
            status ENUM('active', 'inactive') DEFAULT 'active',
            email_verified BOOLEAN DEFAULT false,
            reset_token VARCHAR(255),
            reset_token_expiry TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        await pool.query(query);
    } catch (error) {
        console.errosr("Error creating staff table:", error);
        throw error;
    }
}

module.exports = {
    createStaffTable,
    staffTable: "staff",
};
