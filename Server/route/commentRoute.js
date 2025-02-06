const express = require("express");
const {
  postComment,
  getComments,
  getCommentsForReport,
  getCommentById,
  editComment,
  deleteComment,
  uploadCommentFile,
} = require("../controller/commentController");
const router = express.Router();
router.use("/comment", express.static("public/comment"));

// POST Comment
router.post("/", uploadCommentFile.single("comment_file"), postComment);

// GET Comments for a Report
router.get("/", getComments)
router.get("/comment/:reportId", getCommentsForReport);
router.get("/:id", getCommentById);
// EDIT Comment
router.put("/:commentId", editComment);

// DELETE Comment
router.delete("/:commentId", deleteComment);

module.exports = router;