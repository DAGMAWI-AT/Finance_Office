
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
const { login, createAccount, getUsers, getUsersId, updateUser, deleteUser, logout, loginLimite } = require("../controller/userController");
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.post("/createAccount",  createAccount);
router.get("/users", verifyToken, authorizeRoles("admin"), getUsers);
router.get("/:id", verifyToken, authorizeRoles("admin"), getUsersId);

router.get("/", (req, res) => res.send("Hello Dagi!"));

module.exports = router;