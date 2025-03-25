const express = require("express");
const router = express.Router();
const {
    registerStaff,
    loginStaff,
    logoutStaff,
    getStaff,
    getStaffById,
    updateStaff,
    deleteStaff,
    verifyEmail,
    forgotPassword,
    me,
    updatePassword,
    uploadStaffPhoto,
    resetPassword,
} = require("../controller/staffController");
const verifyToken = require("../middleware/authMiddleware");

router.post("/register", uploadStaffPhoto.single("photo"), registerStaff);
router.post("/login", loginStaff);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.post("/logout", logoutStaff);

router.get("/staff", getStaff);
router.get("/staff/:id", getStaffById);
router.put("/update/:id", uploadStaffPhoto.single("photo"), updateStaff);
router.put("/updatePassword", verifyToken, updatePassword);

router.delete("/staff/:id", deleteStaff);
// Add this route to your Express app
router.get('/verify-email/:token', verifyEmail);
router.get("/me", me);


module.exports = router;
