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
router.get("/", getReportCategory);
router.get("/cat", getReportsCategory);
router.get("/:id", getReportCategoryById);
router.put("/:id", verifyToken, authorizeRoles(["admin"]), updateReportCategory);
router.delete("/:id", verifyToken, authorizeRoles(["admin"]), deleteReportCategory);

module.exports = router;
