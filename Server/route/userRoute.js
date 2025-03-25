
// // route/userRoute.js

// const express = require('express');
// const userController = require('../controller/userController');

// const router = express.Router();

// // Route to get all users
// router.get('/', userController.getUsers);

// // Route to add a new user
// router.post('/', userController.addUser);

// module.exports = router;

const express = require("express");
const {me,login, createAccount, getUsers, getUsersId, updateUser, deleteUser, logout, updatePassword, loginLimite, forgotPassword, resetPassword } = require("../controller/userController");
const {getReportDashboard,  } = require("../controller/dashboard");

const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.post("/createAccount",  createAccount);
router.get("/me", me);

router.get("/users", verifyToken, authorizeRoles("admin","sup_admin"), getUsers);
router.get("/res/dashboard", getReportDashboard);
router.get("/:id", verifyToken, authorizeRoles("admin"), getUsersId);
router.put('/update-password', verifyToken, updatePassword);
router.put('/update/:id', verifyToken, updateUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.delete("/remove/:id", deleteUser);


router.get("/", (req, res) => res.send("Hello Dagi!"));

module.exports = router;