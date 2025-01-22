// src/routes/csoRoutes.js
const express = require("express");
const {uploadfile, postReports, getUserReport, getUserReportById, getReportByRegistrationId, downloadReport } = require("../controller/ReportsController");
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router = express.Router();
const app = express();
const path = require("path");
const cors = require("cors");
app.use(cors());

app.use(
  "/user_report",
  express.static(path.join(__dirname, "public/user_report"))
);
router.post("/upload_reports", uploadfile.single("pdfFile"), postReports);
router.get("/",getUserReport);
router.get("/:id", getUserReportById);
router.get("/report/:registrationId", getReportByRegistrationId);
// app.get("/download/:filename", downloadReport);

// router.patch("/update/:id", updateCso);



module.exports = router;
