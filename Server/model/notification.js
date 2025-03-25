// model/notificationModel.js
const { pool } = require("../config/db");

// Create the notifications table if it doesn't exist
async function createNotificationsTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        notification_message TEXT NOT NULL,  -- Consistent naming
        registration_id VARCHAR(255) NOT NULL,
        user_id INT DEFAULT NULL,
        author_id VARCHAR(255) NOT NULL,
        report_id INT NOT NULL,
        author VARCHAR(255) NOT NULL,
        \`read\` BOOLEAN DEFAULT FALSE,  -- Use backticks for the reserved keyword
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_registration_id (registration_id),  -- Index for faster lookups
        INDEX idx_report_id (report_id),              -- Index for faster lookups
        FOREIGN KEY (registration_id) REFERENCES users(registrationId) ON DELETE CASCADE,
        FOREIGN KEY (report_id) REFERENCES applicationForm(id) ON DELETE CASCADE, 
        FOREIGN KEY (user_id) REFERENCES users(ID) ON DELETE CASCADE    

      )
    `;
    await pool.query(query);
    // console.log("Notifications table created or already exists.");
  } catch (error) {
    console.error("Error creating Notifications table:", error);
    throw error; // Rethrow the error to handle it at a higher level
  }
}




module.exports = {
  createNotificationsTable,
  notificationTable: "notifications", 
};