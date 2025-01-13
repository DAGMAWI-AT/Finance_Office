const express = require("express");
const { uploadStaffPhoto, registerStaff, getStaff,getStaffById } = require("../controller/staffController"); // Adjust path based on your structure

const router = express.Router();

// Register staff route with file upload
router.post("/register", uploadStaffPhoto.single("photo"), registerStaff);
router.get("/",getStaff)
router.get("/:id",getStaffById)


module.exports = router;
