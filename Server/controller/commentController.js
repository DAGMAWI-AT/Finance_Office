const express = require("express");
const multer = require("multer");
const path = require("path");
const {pool} = require("../config/db");
const fs = require("fs");
const { createCommentsTable, commentsTable } = require("../model/comment");
const {notificationTable, createNotificationsTable} = require("../model/notification");

const storageComment = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/comment"),
  filename: (req, file, cb) =>
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    ),
});
const uploadCommentFile = multer({ storage: storageComment });

// POST Comment
const postComment = async (req, res) => {
  try {

    await createCommentsTable();
    // await createNotificationsTable();
    const data = req.body;

    // Validate required fields
    if (!data.registration_id || !data.report_id || !data.author ||!data.author_id || !data.comment) {
      return res.status(400).json({
        success: false,
        message: "Registration ID, Report ID, Author, and Comment are required.",
      });
    }
    // Check if the report exists
   // Check if the report exists and belongs to the user
   const [report] = await pool.query(
    "SELECT * FROM user_reports WHERE id = ? AND registration_id = ?", 
    [data.report_id, data.registration_id]
  );

  if (report.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Report not found or does not belong to this user.",
    });
  }
    
    // Handle file upload
    // data.comment_file = null;
    if (req.file) {
      data.comment_file = req.file.filename;
    }
    data.updated_at = new Date(); // Automatically set updated time

    // Insert the comment

    // Create a notification
    await createNotificationsTable();
    const notificationMessage = `User ${data.registration_id} has submitted a new comment for report ${data.report_id}.`;
    const notificationData = {
      notification_message: notificationMessage,
      registration_id: data.registration_id,
      report_id: data.report_id,
      author: data.author,
      author_id: data.author_id,
    };

    const [result] = await pool.query(`INSERT INTO  ${commentsTable} SET ?`,[data]);
    await pool.query(`INSERT INTO ${notificationTable} SET ?`, [notificationData]);



    res.json({
      success: true,
      message: "Comment and notification added successfully.",
      result,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};
// Get all Comments
const getComments = async (req, res) => {
  try {
      const [comments] = await pool.query(`SELECT * FROM ${commentsTable}`);
      res.json(comments);
  } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
// GET Comments for a Report
const getCommentsForReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    // Fetch comments for the report
    const [comments] = await pool.query(
      "SELECT * FROM comments WHERE report_id = ?",
      [reportId]
    );

    res.json({ success: true, comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// Get comment by ID
const getCommentById = async (req, res) => {
  const id = req.params.id;
  try {
      const [comment] = await pool.query(`SELECT * FROM ${commentsTable} WHERE id = ?`, [id]);
      if (comment.length === 0) {
          return res.status(404).json({ success: false, message: "comment not found" });
      }
      res.json(comment[0]);
  } catch (error) {
      console.error("Error fetching comment by ID:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
// EDIT Comment
const editComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { comment } = req.body;

    // Validate required fields
    if (!comment) {
      return res
        .status(400)
        .json({ success: false, message: "Comment is required." });
    }

    // Update the comment
    const [result] = await pool.query(
      "UPDATE comments SET comment = ? WHERE id = ?",
      [comment, commentId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found." });
    }

    res.json({ success: true, message: "Comment updated successfully." });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// DELETE Comment
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    // Delete the comment
    const [result] = await pool.query("DELETE FROM comments WHERE id = ?", [
      commentId,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found." });
    }

    res.json({ success: true, message: "Comment deleted successfully." });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

module.exports = {
  postComment,
  getComments,
  getCommentsForReport,
  getCommentById,
  editComment,
  deleteComment,
  uploadCommentFile,
};