const { pool } = require("../config/db");

async function createReportCategoryTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS report_category (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_name VARCHAR(255) NOT NULL,
        expire_date TIMESTAMP NULL DEFAULT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;
    await pool.query(query);
    console.log("report_category table created or already exists.");
  } catch (error) {
    console.error("Error creating report_category table:", error);
    throw error;
  }
}

module.exports = { 
  createReportCategoryTable, 
  reportCategoryTable: "report_category" 
};
