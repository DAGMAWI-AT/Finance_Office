const express = require("express");
const router = express.Router();
const {
  addComment,
  getCommentsByReport,
  getCommentById,
  updateComment,
  deleteComment,
  upload
} = require("../controller/commentController");
const verifyToken = require("../middleware/authMiddleware");
// const upload = require("../config/multer"); // Your multer configuration

// POST - Create a new comment with file
router.post("/", verifyToken, upload.single('comment_file'), addComment);

// PUT - Update a comment with optional file
router.put("/:id", verifyToken, upload.single('comment_file'), updateComment);

// (Keep other routes the same)
router.get("/report/:reportId", verifyToken, getCommentsByReport);
router.get("/:id", verifyToken, getCommentById);
router.delete("/:id", verifyToken, deleteComment);

module.exports = router;