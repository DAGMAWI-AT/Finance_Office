const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { pool } = require("../config/db");
const { createReportTable, reportTable } = require("../model/report");
const {notificationTable, createNotificationsTable} = require("../model/notification");

const app = express();
app.use(express.json());
app.use("/user_report", express.static(path.join(__dirname, "public/user_report")));

const storageReport = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "public/user_report";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
  },
});
const uploadfile = multer({ storage: storageReport });


// **Create a new report**
const postReports = async (req, res) => {
  try {
    await createReportTable(); // Ensure the report table exists

    const { registration_id, category_id, author } = req.body;

    // Validate required fields
    if (!registration_id) {
      return res.status(400).json({ success: false, message: "Registration ID is required." });
    }
    if (!category_id) {
      return res.status(400).json({ success: false, message: "Report category is required." });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Report file is required." });
    }
    const [categoryRows] = await pool.execute(
      `SELECT * FROM report_category WHERE id = ?`,
      [category_id]
    );
    // Check if the user exists
    if (categoryRows.length === 0) {
      return res.status(404).json({ success: false, message: "CATEGORY ID not found." });
    }
    const [userRows] = await pool.execute(
      `SELECT * FROM users WHERE registrationId = ?`,
      [registration_id]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: "Registration ID not found." });
    }

    const expireDate = categoryRows[0].expire_date
    const userId = userRows[0].id;
    const userName = userRows[0].name;
    // Prepare report data
    const reportData = {
      ...req.body, // Include other body data
      report_file: req.file.filename, // Add the uploaded file name
      user_id: userId,
      expire_date: expireDate, 
    };

    // Insert the report into the database
    const [reportResult] = await pool.query(
      `INSERT INTO ${reportTable} SET ?`,
      [reportData]
    );

    // Get the newly created report ID
    const reportId = reportResult.insertId;

    // Create the notification
    await createNotificationsTable(); 

    const notificationMessage = `User ${userName} (Registration ID: ${registration_id}) has submitted a new report.`;
    const notificationData = {
      notification_message: notificationMessage,
      registration_id: registration_id,
      report_id: reportId, 
      author: userName,
      author_id: registration_id,
    };

    // Insert the notification into the database
    await pool.query(
      `INSERT INTO ${notificationTable} SET ?`,
      [notificationData]
    );

    // Return success response
    res.json({
      success: true,
      message: "Report added successfully.",
      reportId: reportId, 
    });
  } catch (error) {
    console.error("Error adding report:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// **Get all reports**
const getUserReport = async (req, res) => {
  try {
    // const connection = await pool.getConnection();
    const [rows] = await pool.execute(`SELECT * FROM ${reportTable} ORDER BY created_at DESC`);
    // pool.release();
    res.json(rows);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// **Get reports by registration ID**
const getReportByRegistrationId = async (req, res) => {
  try {
    const { registrationId } = req.params;
    if (!registrationId) {
      return res.status(400).json({ success: false, message: "Registration ID is required" });
    }
    const [rows] = await pool.execute(`SELECT * FROM ${reportTable} WHERE registration_id = ?`, [registrationId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "No reports found for the given registration ID" });
    }

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// const getReportByRegistrationId = async (registrationId) => {
//   try {
//     // Assuming you're using a query like this
//     const reports = await pool.query('SELECT * FROM reports WHERE registration_id = ?', [registrationId]);
    
//     if (Array.isArray(reports) && reports.length > 0) {
//       // Continue with your iteration logic (e.g., .map, .forEach, etc.)
//     } else {
//       console.error('No reports found');
//       return []; // Return an empty array if no reports
//     }
//   } catch (error) {
//     console.error('Error fetching reports:', error);
//   }
// };

const getReportsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required." });
    }

    const [rows] = await pool.execute(
      `SELECT * FROM ${reportTable} WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    // connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "No reports found for this user." });
    }

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching reports by user:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};
// Get report by ID
const getReportById = async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id; // Extract user ID from authenticated request

  try {
    const [report] = await pool.query(
      `SELECT * FROM ${reportTable} WHERE id = ? AND user_id = ?`, 
      [id, userId] // Ensure user can only access their own reports
    );

    if (report.length === 0) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    res.json(report[0]);
  } catch (error) {
    console.error("Error fetching report by ID:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getUserReportById = async (req, res) => {
  const id = req.params.id;

  try {
    const [report] = await pool.query(
      `SELECT * FROM ${reportTable} WHERE id = ?`, 
      [id] // Ensure user can only access their own reports
    );

    if (report.length === 0) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    res.json(report[0]);
  } catch (error) {
    console.error("Error fetching report by ID:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
// const updateReport = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const data = { ...req.body };

//     // Handle file upload
//     if (req.file) {
//       // Save the new file to the user_report folder
//       data.report_file = req.file.filename;

//       // Delete the old file if it exists
//       const [oldReport] = await pool.execute(
//         `SELECT report_file FROM ${reportTable} WHERE id = ?`,
//         [id]
//       );
//       if (oldReport.length > 0 && oldReport[0].report_file) {
//         const oldFilePath = path.join(
//           __dirname,
//           "../public/user_report",
//           oldReport[0].report_file
//         );
//         if (fs.existsSync(oldFilePath)) {
//           fs.unlinkSync(oldFilePath); // Delete the old file
//         }
//       }
//     }

//     data.updated_at = new Date(); // Automatically set updated time

//     // Build query dynamically
//     const updateFields = Object.keys(data)
//       .map((key) => `${key} = ?`)
//       .join(", ");
//     const values = [...Object.values(data), id];

//     const [result] = await pool.execute(
//       `UPDATE ${reportTable} SET ${updateFields} WHERE id = ?`,
//       values
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ success: false, message: "Report not found" });
//     }

//     res.json({ success: true, message: "Report updated successfully." });
//   } catch (error) {
//     console.error("Error updating report:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };

// **Delete a report**


const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    // Handle file upload
    if (req.file) {
      data.report_file = req.file.filename;

      // Delete the old file if it exists
      const [oldReport] = await pool.execute(
        `SELECT report_file FROM ${reportTable} WHERE id = ?`,
        [id]
      );
      if (oldReport.length > 0 && oldReport[0].report_file) {
        const oldFilePath = path.join(
          __dirname,
          "../public/user_report",
          oldReport[0].report_file
        );
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    }

    data.updated_at = new Date(); // Automatically set updated time

    // Build query dynamically
    const updateFields = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(data), id];

    const [result] = await pool.execute(
      `UPDATE ${reportTable} SET ${updateFields} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    // **Create notification for report update**
    try {
      // Get the report's registration_id
      const [reportRows] = await pool.execute(
        `SELECT registration_id FROM ${reportTable} WHERE id = ?`,
        [id]
      );
      if (reportRows.length > 0) {
        const registration_id = reportRows[0].registration_id;

        // Fetch user details to get the name
        let userName = 'Unknown User';
        const [userRows] = await pool.execute(
          `SELECT name FROM users WHERE registrationId = ?`,
          [registration_id]
        );
        if (userRows.length > 0) {
          userName = userRows[0].name;
        }

        // Ensure notifications table exists
        await createNotificationsTable();

        // Create notification message
        const notificationMessage = `User ${userName} (Registration ID: ${registration_id}) has updated their report.`;
        const notificationData = {
          notification_message: notificationMessage,
          registration_id: registration_id,
          report_id: id,
          author: userName,
          author_id: registration_id,
        };

        // Insert the notification
        await pool.query(
          `INSERT INTO ${notificationTable} SET ?`,
          [notificationData]
        );
      }
    } catch (error) {
      console.error("Error creating notification for report update:", error);
      // Do not fail the request, just log the error
    }

    res.json({ success: true, message: "Report updated successfully." });
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    // const connection = await pool.getConnection();
    const [rows] = await pool.execute(`SELECT report_file FROM ${reportTable} WHERE id = ?`, [id]);

    if (rows.length === 0) {
      // connection.release();
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    // Delete the file
    const filePath = path.join(__dirname, "../public/user_report", rows[0].report_file);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // Delete the record from the database
    await pool.execute(`DELETE FROM ${reportTable} WHERE id = ?`, [id]);
    // pool.release();

    res.json({ success: true, message: "Report deleted successfully." });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  uploadfile,
  postReports,
  getUserReport,
  getReportByRegistrationId,
  updateReport,
  getReportsByUserId,
  getUserReportById,
  getReportById,
  deleteReport,
};
