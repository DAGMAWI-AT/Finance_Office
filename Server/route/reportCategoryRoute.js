const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { 
  postReportCategory,
  getReportsCategory, 
  getReportCategory, 
  getReportCategoryById, 
  updateReportCategory, 
  deleteReportCategory 
} = require("../controller/reportCategoryController");

router.post("/upload", postReportCategory);
router.get("/category", getReportCategory);
router.get("/cat", getReportsCategory);
router.get("/:id", getReportCategoryById);
router.put("/:id", updateReportCategory);
router.delete("/:id", deleteReportCategory);

module.exports = router;
