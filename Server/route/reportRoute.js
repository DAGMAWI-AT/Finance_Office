const express = require("express");

const { uploadfile, postReports, getUserReport, getReportByRegistrationId, getUserReportById, getReportById, updateReport, deleteReport, getReportsByUserId } = require("../controller/reportController");
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router = express.Router();
const cors = require("cors");
const app = express();
const path = require("path");
app.use("/user_report", express.static(path.join(__dirname, "public/user_report")));
app.use("/user_report", express.static("public/user_report"));

router.post("/upload", uploadfile.single("report_file"), postReports);
router.get("/", getUserReport);
router.get("/:registrationId", getReportByRegistrationId);
router.get("/user/:userId", getReportsByUserId); 
router.get("/byId/:id", verifyToken, getReportById)
router.get("/view/byId/:id", getUserReportById)

router.put("/:id", uploadfile.single("report_file"), updateReport);
router.delete("/:id", deleteReport);

module.exports = router;
