const express = require("express");
const app = express();

const {
  uploadStaffPhoto,
  registerStaff,
  getStaff,
  getStaffById,
  getStaffByRegistrationId,
  updateStaffByRegistrationId,
  updateStaff,
  updateStaffById,
  deleteStaff,
} = require("../controller/staffController");
const verifyToken = require("../middleware/authMiddleware");
const path = require("path");
app.use("/staff", express.static(path.join(__dirname, "public/staff")));
app.use("/staff", express.static("public/staff"));


const cors = require("cors");
app.use(cors());
const router = express.Router();

router.post("/register", uploadStaffPhoto.single("photo"), registerStaff);
router.get("/", getStaff);
router.get("/:id", getStaffById);
router.get("/byId/:registrationId", getStaffByRegistrationId);
router.patch("/update/:id", updateStaff);
// router.put("/update/:registrationId", updateStaffByRegistrationId);

router.delete("/:id", uploadStaffPhoto.single("photo"), deleteStaff);

module.exports = router;
