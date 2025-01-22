const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { 
  postReportCategory, 
  getReportCategory, 
  getReportCategoryById, 
  updateReportCategory 
} = require("../controller/reportCategoryController");


router.post("/category", verifyToken, authorizeRoles("admin"), postReportCategory);
router.get("/", verifyToken, getReportCategory);
router.get("/:id", verifyToken, getReportCategoryById);
router.put("/:id", verifyToken, authorizeRoles(["admin"]), updateReportCategory);

module.exports = router;
