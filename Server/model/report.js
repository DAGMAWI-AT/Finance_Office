const { pool } = require("../config/db");

async function createReportTable() {
    try {
        const query = `CREATE TABLE IF NOT EXISTS user_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        registration_id VARCHAR(255) NOT NULL,
        category_id INT NOT NULL,  -- New column for category
        category_name VARCHAR(255) NOT NULL,
        report_name VARCHAR(255) NOT NULL,
        description TEXT,
        report_file VARCHAR(255) NOT NULL,
        expire_date TIMESTAMP NULL DEFAULT NULL,
        update_permission ENUM('close', 'open') NOT NULL DEFAULT 'open',
        status ENUM('approve', 'pending', 'reject', 'new', 'inprogress') NOT NULL DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (category_id) REFERENCES report_category(id) ON DELETE SET NULL ON UPDATE CASCADE
        )`;
        await pool.query(query);
        // console.log("user_reports table created or already exists.");
    } catch (error) {
        console.error("Error creating user_reports table:", error);
        throw error;
    }
}

module.exports = { 
    createReportTable, 
    reportTable: "user_reports" 
};
