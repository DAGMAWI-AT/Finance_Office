const express = require("express");

const { uploadfile, updateReportStatus, postReports, getUserReport, getReportByRegistrationId, getUserReportById, getReportById, updateReport, deleteReport, getReportsByUserId, updateReportExpireDate, getStatusCounts, getStatusCountByUserId, getCategoryWithStatusCounts,  } = require("../controller/reportController");

const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router = express.Router();
const cors = require("cors");
const app = express();
const path = require("path");
const { getStatusReport,getCategoryWithStatusCountsByUserId } = require("../controller/dashboard");
app.use("/user_report", express.static(path.join(__dirname, "public/user_report")));
app.use("/user_report", express.static("public/user_report"));
const uploadMiddleware = (req, res, next) => {
  uploadfile.single("report_file")(req, res, (err) => {
    if (err) {
      // Handle Multer errors (e.g., file size limit, unsupported file type)
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ 
          success: false, 
          message: "The uploaded file exceeds the 20MB size limit."
        });
      }
      // Handle any other errors
      return res.status(400).json({ 
        success: false, 
        error: err.message 
      });
    }
    next(); // Proceed to the next middleware or controller
  });
};

router.post("/upload", uploadMiddleware, postReports);
router.get("/", getUserReport);
router.get("/:registrationId", getReportByRegistrationId);
router.get("/user/:userId", getReportsByUserId); 
router.get("/byId/:id", verifyToken, getReportById); // Apply verifyToken middleware
router.get("/view/byId/:id", getUserReportById)

router.put("/:id", uploadfile.single("report_file"), updateReport);
router.put("/status/:id", uploadfile.single("report_file"), updateReportStatus);
router.put("/expire_date/:id", uploadfile.single("report_file"), updateReportExpireDate);
router.get("/status-counts/:userId", getStatusCountByUserId )
router.get("/api/report-status", getStatusReport )
router.get("/bycategory/reports", getCategoryWithStatusCounts )
router.get("/bycategory/status/:userId", getCategoryWithStatusCountsByUserId )


router.delete("/:id", deleteReport);

module.exports = router;
