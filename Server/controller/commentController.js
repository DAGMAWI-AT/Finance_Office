const { pool } = require("../config/db");
const { createCommentsTable } = require("../model/comment");
const { createNotificationsTable } = require("../model/notification");

const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../public/comments');
const multer = require('multer');

const storage = multer.memoryStorage(); // Store in memory first

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Only document and image files are allowed!');
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Helper function to delete file
const deleteFile = (filename) => {
  if (filename) {
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

// CREATE - Add a new comment with optional file
const addComment = async (req, res) => {
  try {
    // Ensure tables exist
    await createCommentsTable();
    await createNotificationsTable();

    const { report_id, comment } = req.body;
    const author_id = req.user?.id;

    // Validate required fields
    if (!report_id || !comment) {
      return res.status(400).json({
        success: false,
        message: "Report ID and comment are required"
      });
    }

    // Validate user authentication
    if (!author_id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    // Get author information
    const [staffRows] = await pool.execute(
      `SELECT name FROM staff WHERE id = ?`,
      [author_id]
    );
    
    if (staffRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found"
      });
    }
    const author = staffRows[0].name;

    // Get report information
    const [reportRows] = await pool.execute(
      `SELECT user_id FROM applicationForm WHERE id = ?`,
      [report_id]
    );
    
    if (reportRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    // Get user information for notification
    const [userRows] = await pool.execute(
      `SELECT registrationId, ID FROM users WHERE id = ?`,
      [reportRows[0].user_id]
    );
    
    const registration_id = userRows.length > 0 
      ? userRows[0].registrationId 
      : "N/A";

    // Handle file upload
    let comment_file = null;
    if (req.file) {
      try {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(req.file.originalname);
        comment_file = uniqueSuffix + ext;
        const filePath = path.join(uploadDir, comment_file);
        
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, req.file.buffer);
      } catch (fileError) {
        console.error('File upload error:', fileError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload file"
        });
      }
    }

    // Start transaction
    await pool.query('START TRANSACTION');

    try {
      // Insert comment
      const [result] = await pool.query(
        `INSERT INTO comments 
        (report_id, registration_id, author_id, author, comment, comment_file) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [report_id, registration_id, author_id, author, comment, comment_file]
      );

      // Create notification
      if (userRows.length > 0) {
        await pool.query(
          `INSERT INTO notifications 
          (notification_message, registration_id, user_id, author_id, report_id, author) 
          VALUES (?, ?, ?, ?, ?, ?)`,
          [
            `New comment on your report #${report_id}: ${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}`,
            registration_id,
            userRows[0].ID, // user_id from users table
            author_id,
            report_id,
            author
          ]
        );
      }

      // Commit transaction
      await pool.query('COMMIT');

      // Get the newly created comment
      const [newComment] = await pool.query(
        'SELECT * FROM comments WHERE id = ?',
        [result.insertId]
      );

      res.status(201).json({
        success: true,
        message: "Comment added successfully",
        data: newComment[0]
      });

    } catch (error) {
      // Rollback transaction on error
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error adding comment:', error);
    
    let errorMessage = 'Server error';
    let statusCode = 500;

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      errorMessage = "Invalid report or user reference";
      statusCode = 400;
    } else if (error.sqlMessage) {
      errorMessage = error.sqlMessage;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
};

// UPDATE - Update a comment with optional file
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const author_id = req.user.id;

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required"
      });
    }

    // Get existing comment
    const [existingComment] = await pool.query(
      'SELECT * FROM comments WHERE id = ? AND author_id = ?',
      [id, author_id]
    );

    if (existingComment.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Comment not found or unauthorized"
      });
    }

    let comment_file = existingComment[0].comment_file;
    
    // Handle file update
    if (req.file) {
      // Delete old file if exists
      if (comment_file) {
        deleteFile(comment_file);
      }

      // Save new file
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(req.file.originalname);
      comment_file = uniqueSuffix + ext;
      const filePath = path.join(uploadDir, comment_file);
      fs.writeFileSync(filePath, req.file.buffer);
    }

    await pool.query(
      'UPDATE comments SET comment = ?, comment_file = ? WHERE id = ?',
      [comment, comment_file, id]
    );

    const [updatedComment] = await pool.query(
      'SELECT * FROM comments WHERE id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: updatedComment[0]
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
// READ - Get all comments for a report
const getCommentsByReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const [comments] = await pool.query(
      `SELECT * FROM comments 
      WHERE report_id = ? 
      ORDER BY commented_time DESC`,
      [reportId]
    );

    res.status(200).json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// READ - Get single comment by ID
const getCommentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [comment] = await pool.query(
      'SELECT * FROM comments WHERE id = ?',
      [id]
    );

    if (comment.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    res.status(200).json({
      success: true,
      data: comment[0]
    });
  } catch (error) {
    console.error('Error fetching comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// DELETE - Delete a comment and its associated file
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const author_id = req.user.id;

    // Get the comment first to check file
    const [existingComment] = await pool.query(
      'SELECT * FROM comments WHERE id = ? AND (author_id = ? OR ? = "admin")',
      [id, author_id, req.user.role]
    );

    if (existingComment.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Comment not found or unauthorized"
      });
    }

    // Delete associated file if exists
    if (existingComment[0].comment_file) {
      deleteFile(existingComment[0].comment_file);
    }

    await pool.query(
      'DELETE FROM comments WHERE id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully"
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// (Keep the other functions getCommentsByReport and getCommentById the same as before)

module.exports = {
  addComment,
  getCommentsByReport,
  getCommentById,
  updateComment,
  deleteComment,
  upload,
};