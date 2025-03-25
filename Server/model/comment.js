const { pool } = require("../config/db");

async function createCommentsTable() {
  try {
    const query = `CREATE TABLE IF NOT EXISTS comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                report_id INT NOT NULL,
                registration_id VARCHAR(255) NOT NULL,
                author_id VARCHAR(255) NOT NULL,
                author VARCHAR(255) NOT NULL,
                comment TEXT NOT NULL,
                comment_file VARCHAR(255),
                commented_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
                FOREIGN KEY (report_id) REFERENCES applicationForm(id) ON DELETE CASCADE
                )`;
                await pool.query(query);
    // console.log("Comments table created or already exists.");
  } catch (error) {
    console.error("Error creating Comments table:", error);
    throw error;
  }
}

module.exports = {
  createCommentsTable,
  commentsTable: "comments",
};
