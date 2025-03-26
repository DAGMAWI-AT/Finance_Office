const path = require('path');
const fs = require('fs');
const util = require('util');
const mkdirp = require('mkdirp');
const { pool } = require("../config/db");
const multer = require("multer");
const { reportTable, createReportTable } = require("../model/report");
const { notificationTable, createNotificationsTable } = require("../model/notification");

// Promisify file system methods
const renameAsync = util.promisify(fs.rename);
const unlinkAsync = util.promisify(fs.unlink);

// Base directory for all files
const BASE_DIR = path.join(__dirname, '../public/cso_files');

// Ensure base directory exists
mkdirp.sync(BASE_DIR);

// Helper function to get category details
const getCategoryDetails = async (categoryId) => {
  const [category] = await pool.query(
    `SELECT category_name FROM report_category WHERE id = ?`,
    [categoryId]
  );
  return category[0];
};

// Helper to create folder name directly from category name
const getCategoryFolder = (categoryName) => {
  // Replace invalid characters with underscores
  return categoryName.replace(/[^a-zA-Z0-9-_]/g, '_');
};

// Multer memory storage configuration
const storage = multer.memoryStorage(); 
const uploadfile = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 10MB limit
});


// Process file and save it to the correct folder
const processFile = async (file, folderName, report_name) => {
  try {
        if (!file) {
          throw new Error("File upload failed: No file found in request.");
        }
    const destFolder = path.join(BASE_DIR, folderName);
    mkdirp.sync(destFolder); // Ensure folder exists
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.originalname);
    const filename = `${report_name}_${timestamp}_${randomStr}${ext}`;
    const newFilePath = path.join(destFolder, filename);
    // Write the file to disk
    await fs.promises.writeFile(newFilePath, file.buffer);
    // return path.join(folderName, filename); // Return relative path
        return path.join(filename); // Return relative path

  } catch (error) {
    console.error("Error processing file:", error);
    return null; // Return null to indicate failure
  }
};

// Create report
const postReports = async (req, res) => {
  let connection;
  let reportFilePath = null; // Store the file path for cleanup in case of errors

  try {
    // Ensure report and notification tables exist
    await createReportTable();
    await createNotificationsTable();
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Report file is required or file size exceeds limit (20MB)."
      });
    }
    const { registration_id, category_id, user_id, report_name } = req.body;

    // Validate required fields
    if (!registration_id || !user_id) {
      return res.status(400).json({ success: false, message: "Registration ID and User ID are required." });
    }
    if (!category_id) {
      return res.status(400).json({ success: false, message: "Report category is required." });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Report file is required." });
    }

    // Validate category
    const [categoryRows] = await pool.execute(
      `SELECT * FROM report_category WHERE id = ?`,
      [category_id]
    );

    if (categoryRows.length === 0) {
      return res.status(404).json({ success: false, message: "CATEGORY ID not found." });
    }

    // Validate user
    const [userRows] = await pool.execute(
      `SELECT * FROM users WHERE registrationId = ? AND id = ?`,
      [registration_id, user_id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: "Registration ID or user ID not found." });
    }

    // Check if report already exists
    const [reportRows] = await pool.execute(
      `SELECT * FROM user_reports WHERE user_id = ? AND category_id = ? AND category_name = ? AND expire_date = ?`,
      [user_id, category_id, categoryRows[0].category_name, categoryRows[0].expire_date]
    );
    const [reportRow] = await pool.execute(
      `SELECT * FROM user_reports WHERE user_id = ? AND category_id = ?`,
      [user_id, category_id]
    );
    if (reportRow.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "This report has already been submitted. Please update the previous report or wait until the submission period expires." 
      });
    }
    if (reportRows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "This report has already been submitted. Please update the previous report or wait until the submission period expires." 
      });
    }

    // Handle file upload
    const folderName = getCategoryFolder(categoryRows[0].category_name);
    reportFilePath = await processFile(req.file, folderName, report_name);

    if (!reportFilePath) {
      return res.status(500).json({ success: false, message: "File upload failed. Please try again." });
    }

    const reportData = {
      ...req.body,
      report_file: reportFilePath, // Store relative path in the database
      expire_date: categoryRows[0].expire_date,
      category_name: categoryRows[0].category_name,
    };

    // Start database transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Insert report into database
    const [reportResult] = await connection.query(
      `INSERT INTO ${reportTable} SET ?`,
      [reportData]
    );

    const reportId = reportResult.insertId;

    // Insert notification
    const notificationMessage = `User ${userRows[0].name} (Registration ID: ${registration_id}) has submitted a new report.`;
    const notificationData = {
      notification_message: notificationMessage,
      registration_id: registration_id,
      report_id: reportId,
      author: userRows[0].name,
      author_id: registration_id,
      user_id: user_id,
    };

    await connection.query(
      `INSERT INTO ${notificationTable} SET ?`,
      [notificationData]
    );

    await connection.commit();
    connection.release();

    res.json({
      success: true,
      message: "Report added successfully.",
      reportId: reportId,
    });
  } catch (error) {
    // Rollback transaction in case of error
    if (connection) {
      await connection.rollback();
      connection.release();
    }

    // Remove the uploaded file if any validation or database operation fails
    if (reportFilePath) {
      await unlinkAsync(path.join(BASE_DIR, reportFilePath)).catch((unlinkError) => {
        console.error("Error deleting file:", unlinkError);
      });
    }

    console.error("Error adding report:", error.message);
    res.status(500).json({ success: false, message: error.message || "Internal Server Error." });
  }
};



// Get all reports
const getUserReport = async (req, res) => {
  try {
    const [rows] = await pool.execute(`SELECT * FROM ${reportTable} ORDER BY created_at DESC`);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get report by registration ID
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

// Get reports by user ID
const getReportsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required." });
    }

    const [rows] = await pool.execute(
      `SELECT * FROM user_reports WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );

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

  // Check if req.user is defined
  if (!req.user || !req.user.id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const userId = req.user.id; // Get userId from req.user

  try {
    const [reportExists] = await pool.execute(
      `SELECT * FROM ${reportTable} WHERE id = ?`,
      [id]
    );

    if (reportExists.length === 0) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    const [report] = await pool.execute(
      `SELECT * FROM ${reportTable} WHERE id = ? AND user_id = ?`,
      [id, userId]
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

// Get report by ID (admin access)
const getUserReportById = async (req, res) => {
  const id = req.params.id;

  try {
    const [report] = await pool.query(
      `SELECT * FROM ${reportTable} WHERE id = ?`,
      [id]
    );

    if (report.length === 0) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    res.json(report[0]);
  } catch (error) {
    console.error("Error fetching report by ID:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Update report status
const updateReportStatus = async (req, res) => {
  try {
    await createNotificationsTable();
    const { id } = req.params;
    const { status, registration_id, author_id } = req.body;

    if (!status || !registration_id || !author_id) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const updatedAt = new Date();
    const updateQuery = `
      UPDATE ${reportTable}
      SET status = ?, updated_at = ?
      WHERE id = ?
    `;
    const [result] = await pool.execute(updateQuery, [status, updatedAt, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Report not found." });
    }

    const [staffRows] = await pool.execute(
      "SELECT name FROM staff WHERE registrationId = ?",
      [author_id]
    );
    const adminName = (staffRows && staffRows.length > 0) ? staffRows[0].name : "Unknown Admin";

    const notificationMessage = `Report (ID: ${id}) status updated to "${status}" by ${adminName}.`;
    const notificationData = {
      notification_message: notificationMessage,
      registration_id: registration_id,
      report_id: id,
      author: adminName,
      author_id: author_id,
    };

    await pool.query(
      `INSERT INTO ${notificationTable} SET ?`,
      [notificationData]
    );

    res.json({ success: true, message: "Report status updated successfully." });
  } catch (error) {
    console.error("Error updating report status:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Update report expire date
const updateReportExpireDate = async (req, res) => {
  const { id } = req.params;
  const { expire_date, author_id, registration_id } = req.body;

  try {
    if (!expire_date || !author_id || !registration_id) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const [result] = await pool.execute(
      `UPDATE ${reportTable} SET expire_date = ? WHERE id = ? AND registration_id = ?`,
      [expire_date, id, registration_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Report not found or unauthorized access." });
    }

    res.json({ success: true, message: "Expire date updated successfully." });
  } catch (error) {
    console.error("Error updating expire date:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};
const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    // const { category_id, expire_date } = req.body;
    const { category_id, expire_date, report_name, description } = req.body;

    const [existingReport] = await pool.execute(
      `SELECT report_file, category_id FROM ${reportTable} WHERE id = ?`,
      [id]
    );

    if (!existingReport || existingReport.length === 0) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    const oldCategoryId = existingReport[0].category_id;
    const oldFileName = existingReport[0].report_file;
    if (req.file && oldFileName) {
      const [oldCategoryRows] = await pool.execute(
        `SELECT category_name FROM report_category WHERE id = ?`,
        [oldCategoryId]
      );

      if (!oldCategoryRows.length) {
        return res.status(400).json({ success: false, message: "Invalid old category" });
      }

      const oldCategoryName = getCategoryFolder(oldCategoryRows[0].category_name);
      const oldFilePath = path.join(BASE_DIR, oldCategoryName, oldFileName);

      // Delete the old file
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath); // Delete the file
        // console.log(`Deleted old file: ${oldFilePath}`);
      }
    }

    if (category_id && category_id !== oldCategoryId) {
      const [oldCategoryRows] = await pool.execute(
        `SELECT category_name FROM report_category WHERE id = ?`,
        [oldCategoryId]
      );

      const [newCategoryRows] = await pool.execute(
        `SELECT category_name FROM report_category WHERE id = ?`,
        [category_id]
      );

      if (!oldCategoryRows.length || !newCategoryRows.length) {
        return res.status(400).json({ success: false, message: "Invalid category" });
      }

      const oldCategoryName = getCategoryFolder(oldCategoryRows[0].category_name);
      const newCategoryName = getCategoryFolder(newCategoryRows[0].category_name);

      const oldPath = path.join(BASE_DIR, oldCategoryName, oldFileName);
      const newPath = path.join(BASE_DIR, newCategoryName, oldFileName);

      try {
        await mkdirp(path.dirname(newPath));
        if (fs.existsSync(oldPath)) {
          await renameAsync(oldPath, newPath);
        }
      } catch (err) {
        console.error("Error moving file:", err);
        return res.status(500).json({ success: false, message: "Error moving file." });
      }
    }

    const [categoryRows] = await pool.execute(
      `SELECT category_name, expire_date FROM report_category WHERE id = ?`,
      [category_id]
    );

    if (!categoryRows.length) {
      return res.status(400).json({ success: false, message: "Invalid category" });
    }

    const updatedData = {
      report_name: report_name || existingReport[0].report_name, 
      description: description || existingReport[0].description,
      category_id,
      category_name: categoryRows[0].category_name,
      expire_date: expire_date || categoryRows[0].expire_date,
      // report_file: req.file ? req.file.filename : existingReport[0].report_file,
      report_file: req.file ? await processFile(req.file, getCategoryFolder(categoryRows[0].category_name), report_name) : existingReport[0].report_file
     };

    


    await pool.execute(
      `UPDATE ${reportTable} 
       SET report_name = ?, description = ?, category_id = ?, category_name = ?, expire_date = ?, report_file = ? 
       WHERE id = ?`,
      [
        updatedData.report_name,
        updatedData.description,
        updatedData.category_id,
        updatedData.category_name,
        updatedData.expire_date,
        updatedData.report_file,
        id,
      ]
    );


    res.json({ success: true, message: "Report updated successfully." });
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });

  }
};

// Delete report
const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const [report] = await pool.execute(
      `SELECT report_file, category_id FROM ${reportTable} WHERE id = ?`,
      [id]
    );

    if (report.length === 0) {
      return res.status(404).json({ success: false, message: "Report not found." });
    }

    let filePath = "";
    if (report[0].report_file) {
      const [categoryRows] = await pool.execute(
        `SELECT category_name FROM report_category WHERE id = ?`,
        [report[0].category_id]
      );

      if (categoryRows.length > 0) {
        const categoryName = getCategoryFolder(categoryRows[0].category_name);
        filePath = path.join(BASE_DIR, categoryName, report[0].report_file);
      }
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await pool.execute(`DELETE FROM ${reportTable} WHERE id = ?`, [id]);

    res.json({ success: true, message: "Report deleted successfully." });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

const getStatusCountByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required." });
    }

    const [rows] = await pool.execute(
      `SELECT status, COUNT(*) AS count 
       FROM applicationForm 
       WHERE cso_id = ? 
       GROUP BY status`,
      [userId]
    );

    // Initialize counts with default values
    const counts = {
      approve: 0,
      pending: 0,
      reject: 0,
      new: 0,
      inprogress: 0,
      total: 0, // Add total reports count
    };

    // Populate counts from database results
    rows.forEach(item => {
      counts[item.status] = item.count;
      counts.total += item.count; // Count total reports
    });

    res.json(counts); // Send formatted response
  } catch (error) {
    console.error("Error fetching report status count:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// const getCategory = async (req, res) => {
//   try {
//     const [rows] = await pool.execute(
//       `SELECT category_name, COUNT(*) AS count 
//        FROM ${reportTable} 
//        GROUP BY category_name`
//     );

//     res.json({ success: true, reports: rows });
//   } catch (error) {
//     console.error("Error fetching categories:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error." });
//   }
// };
// const getCategoryWithStatusCounts = async (req, res) => {
//   try {
//     const [rows] = await pool.execute(
//       `SELECT rc.category_name, r.status, COUNT(*) AS count 
//        FROM ${reportTable} r
//        JOIN report_category rc ON r.category_id = rc.id
//        GROUP BY rc.category_name, r.status`
//     );

//     // Organize data in the required format
//     const groupedReports = rows.reduce((acc, row) => {
//       const { category_name, status, count } = row;

//       if (!acc[category_name]) {
//         acc[category_name] = { new: 0, approved: 0, reject: 0, pending: 0, inprogress: 0 };
//       }
//       acc[category_name][status] = count; // Assign count to the correct status

//       return acc;
//     }, {});

//     res.json({ success: true, reports: groupedReports });
//   } catch (error) {
//     console.error("Error fetching reports by category:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error." });
//   }
// };
const getCategoryWithStatusCounts = async (req, res) => {
  try {
    // Fetch status counts directly from user_reports, grouped by category_name
    const [rows] = await pool.execute(
      `SELECT form_name, status, COUNT(*) AS count 
       FROM applicationForm 
       GROUP BY form_name, status`
    );

    // Organize data in the required format
    const groupedReports = rows.reduce((acc, row) => {
      const { form_name, status, count } = row;

      if (!acc[form_name]) {
        acc[form_name] = { new: 0, approve: 0, reject: 0, pending: 0, inprogress: 0, total:0 };
      }
      acc[form_name][status] = count; // Assign count to the correct status
      acc[form_name].total += count; // Add count to total

      return acc;
    }, {});

    res.json({ success: true, reports: groupedReports });
  } catch (error) {
    console.error("Error fetching reports by category:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

module.exports = {
  uploadfile,
  postReports,
  getUserReport,
  getReportByRegistrationId,
  getReportsByUserId,
  getReportById,
  getUserReportById,
  updateReport,
  updateReportStatus,
  updateReportExpireDate,
  deleteReport,
  getStatusCountByUserId,
  getCategoryWithStatusCounts
};