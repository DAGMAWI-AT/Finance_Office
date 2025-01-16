// src/routes/csoRoutes.js
const express = require("express");
const { postReports, getUserReport, getUserReportById, uploadfile, getReportByRegistrationId } = require("../controller/ReportsController");

const router = express.Router();

router.post("/upload_reports", uploadfile.single("file"), postReports);
router.get("/",getUserReport);
router.get("/:id", getUserReportById);
router.get("/report/:registrationId", getReportByRegistrationId);

// router.patch("/update/:id", updateCso);



module.exports = router;
