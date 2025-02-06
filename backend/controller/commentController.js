//controller/commentController.js
const express = require("express");
const app = express();
const multer = require("multer");
const path = require("path");
const { commentCollection } = require("../model/comment");
const { NotificationsCollection } = require("../model/notification");
const fs = require("fs");
const { ObjectId } = require("mongodb");

app.use(express.json());
require("dotenv").config();
app.use(
  "/comment",
  express.static(path.join(__dirname, "public/comment"))
);

const storageComment = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/comment"),
  filename: (req, file, cb) =>
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    ),
});
const uploadCommentFile = multer({ storage: storageComment });

const postComment = async (req, res) => {
    try {
      const { registrationId, reportId, ...data } = req.body;
  
      // Validate required fields
      if (!registrationId || !reportId) {
        return res
          .status(400)
          .json({ success: false, message: "Registration ID and Report ID are required." });
      }
  
      // Validate if reportId is a valid ObjectId
      if (!ObjectId.isValid(reportId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid Report ID format." });
      }
  
      // Optionally: Check if the report exists in the database
    //   const reportExists = await commentCollection.findOne({ _id: new ObjectId(reportId) });
    //   if (!reportExists) {
    //     return res.status(404).json({ success: false, message: "Report not found." });
    //   }
  
      // Handle file upload
      if (req.file) {
        data.commentFile = req.file.filename;
      }
  
      // Add additional fields to the comment
      data.registrationId = registrationId;
      data.reportId = new ObjectId(reportId);
      ; // Associate the comment with the report
      data.commentedTime = new Date();
  
      // Insert the comment into the collection
      const result = await commentCollection.insertOne(data);
  
      // Create a notification for the admin
      const notification = {
        message: `User ${registrationId} has submitted a new comment for report ${reportId}.`,
        registrationId: registrationId,
        reportId: new ObjectId(reportId),
        author : data.author ,
        read: false,
        timestamp: new Date(),
      };
      await NotificationsCollection.insertOne(notification);
  
      // Respond with success
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
  

module.exports = {
  postComment,
  uploadCommentFile,
};
