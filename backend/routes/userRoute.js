// src/routes/userRoutes.js
const express = require("express");
const { login, createAccount, getUsers, getUsersId, logout } = require("../controller/userController");
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router = express.Router();

router.post("/login", login);
router.post("/logout", logout)
router.post("/createAccount",verifyToken, authorizeRoles("admin"), createAccount);
router.get("/users", verifyToken, authorizeRoles("admin"), getUsers);
router.get("/:id", verifyToken, authorizeRoles("admin"), getUsersId);

router.get("/", (req, res) => res.send("Hello Dagi!"));

module.exports = router;
