// controller/reportsCategory
const express = require("express");
const app = express();
const multer = require("multer");
const path = require("path");
const { UserReportsCollection } = require("../model/report"); 
const { NotificationsCollection } = require("../model/notification");
const fs = require("fs");

const { ObjectId } = require("mongodb");
app.use(express.json());
require("dotenv").config();
app.use(
  "/user_report",
  express.static(path.join(__dirname, "public/user_report"))
);

const storageReport = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/user_report"),
  filename: (req, file, cb) =>
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    ),
});
const uploadfile = multer({ storage: storageReport });

//  const postReports = async (req, res) => {
//     try {
//       if (req.file) {
//         const data = req.body;
//         data.pdfFile = req.file.filename;

//         const result = await UserReportsCollection.insertOne(data);

//         // Create a notification for admin
//         const notification = {
//           message: "A new report has been submitted.",
//           read: false,
//           timestamp: new Date(),
//         };
//         await NotificationsCollection.insertOne(notification);

//         res.json({
//           success: true,
//           message: "Report and notification added successfully.",
//           result,
//         });
//       } else {
//         res.status(400).json({ success: false, message: "No file provided" });
//       }
//     } catch (error) {
//       console.error("Error adding file:", error);
//       res
//         .status(500)
//         .json({ success: false, message: "Internal Server Error" });
//     }
//   };

const postReports = async (req, res) => {
  try {
    // Extract registrationId from the request body
    const { registrationId, ...data } = req.body;

    if (!registrationId) {
      return res
        .status(400)
        .json({ success: false, message: "Registration ID is required." });
    }

    if (req.file) {
      // Add the file name and registrationId to the data object
      data.pdfFile = req.file.filename;
      data.registrationId = registrationId;

      // Insert the report into the UserReportsCollection
      const result = await UserReportsCollection.insertOne(data);

      // Create a notification for the admin
      const notification = {
        message: `User ${registrationId} has submitted a new report.`,
        read: false,
        timestamp: new Date(),
      };
      await NotificationsCollection.insertOne(notification);

      // Respond with success
      res.json({
        success: true,
        message: "Report and notification added successfully.",
        result,
      });
    } else {
      res.status(400).json({ success: false, message: "No file provided." });
    }
  } catch (error) {
    console.error("Error adding report:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

const getUserReport = async (req, res) => {
  try {
    const data = await UserReportsCollection.find().toArray();
    res.json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getUserReportById = async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const result = await UserReportsCollection.findOne(filter);
  res.send(result);
};

const getReportByRegistrationId = async (req, res) => {
  const { registrationId } = req.params;

  try {
    // Validate if registrationId is provided
    if (!registrationId) {
      return res
        .status(400)
        .json({ success: false, message: "registrationId is required" });
    }

    // Fetch reports from the database (use .toArray() to convert cursor to an array)
    const result = await UserReportsCollection.find({
      registrationId,
    }).toArray();

    // Check if reports are found
    if (result.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No reports found for the given registrationId",
        });
    }
    // console.log(result)

    // Return the reports if found
    return res.status(200).json({ success: true, data: result,});
  } catch (error) {
    // Log only the error message (avoid circular structure)
    console.error("Error fetching reports:", error.message || error);

    // Check if the error is related to MongoDB
    if (error.name === "MongoNetworkError") {
      return res
        .status(500)
        .json({ success: false, message: "Database connection error" });
    }

    // Handle other unexpected errors
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// const downloadReport = async (req, res) => {
//   const fileName = req.params.pdfFile;
//   const filePath = path.join(__dirname, "public/user_report", pdfFile);

//   fs.access(filePath, fs.constants.F_OK, (err) => {
//     if (err) {
//       return res.status(404).json({ error: "File not found" });
//     }

//     res.download(filePath, fileName, (downloadErr) => {
//       if (downloadErr) {
//         console.error("Download error:", downloadErr);
//         res.status(500).json({ error: "Error downloading file" });
//       }
//     });
//   });
// };

module.exports = {
  uploadfile,
  getUserReport,
  postReports,
  getUserReportById,
  getReportByRegistrationId,
};
