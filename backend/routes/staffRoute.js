const express = require("express");
const {
  uploadStaffPhoto,
  registerStaff,
  getStaff,
  getStaffById,
} = require("../controller/staffController");

const router = express.Router();

router.post("/register", uploadStaffPhoto.single("photo"), registerStaff);
router.get("/", getStaff);
router.get("/:id", getStaffById);

module.exports = router;
