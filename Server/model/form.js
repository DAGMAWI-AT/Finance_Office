const { pool } = require('../config/db');

async function createFormTable() {
    try {
        const query = `CREATE TABLE IF NOT EXISTS forms (
            id INT AUTO_INCREMENT PRIMARY KEY,
            form_name VARCHAR(255) NOT NULL,
            expires_at TIMESTAMP NULL DEFAULT NULL,
            createdBy VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`;
        await pool.query(query);
    } catch (error) {
        console.error("Error creating form table:", error);
        throw error;
    }
}

async function createApplicationFormTable() {
    try {
        const query = `CREATE TABLE IF NOT EXISTS applicationForm (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT DEFAULT NULL,
            cso_id INT NOT NULL,
            form_id INT DEFAULT NULL,
            form_name VARCHAR(255) NOT NULL,
            report_name VARCHAR(255) NOT NULL,
            description TEXT,
            application_file VARCHAR(255) NOT NULL,
            expires_at TIMESTAMP NULL DEFAULT NULL,
            update_permission ENUM('close', 'open') NOT NULL DEFAULT 'close',
            status ENUM('approve', 'pending', 'reject', 'new', 'inprogress') NOT NULL DEFAULT 'new',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE SET NULL ON UPDATE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,  -- Added missing comma
            FOREIGN KEY (cso_id) REFERENCES cso(id) ON DELETE CASCADE ON UPDATE CASCADE   -- Corrected syntax
)`;
        await pool.query(query);
    } catch (error) {
        console.error("Error creating application form table:", error);
        throw error;
    }
}


module.exports = { 
    createApplicationFormTable,
    createFormTable, 
}; 