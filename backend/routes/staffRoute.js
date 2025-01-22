const express = require("express");
const {
  uploadStaffPhoto,
  registerStaff,
  getStaff,
  getStaffById,
  getStaffByRegistrationId
} = require("../controller/staffController");
const router = express.Router();
const app = express();
const path = require("path");
const cors = require("cors");
app.use(cors());

app.use("/staff", express.static(path.join(__dirname, "public/staff")));

router.post("/register", uploadStaffPhoto.single("photo"), registerStaff);
router.get("/", getStaff);
router.get("/:id", getStaffById);
router.get("/byid/:registrationId", getStaffByRegistrationId);


module.exports = router;
