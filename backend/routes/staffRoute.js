const express = require("express");
const { uploadStaffPhoto, registerStaff, getStaff } = require("../controller/staffController"); // Adjust path based on your structure

const router = express.Router();

// Register staff route with file upload
router.post("/register", uploadStaffPhoto.single("photo"), registerStaff);
router.get("/staff",getStaff)

module.exports = router;
