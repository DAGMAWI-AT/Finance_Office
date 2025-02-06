
// src/routes/CommentRoutes.js
const express = require("express");
const {uploadCommentFile, postComment } = require("../controller/commentController");
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router = express.Router();
const app = express();
const path = require("path");
const cors = require("cors");
app.use(cors());


app.use(
    "/comment",
    express.static(path.join(__dirname, "public/comment"))
  );
router.post("/comment", uploadCommentFile.single("commentFile"), postComment);


module.exports = router;
