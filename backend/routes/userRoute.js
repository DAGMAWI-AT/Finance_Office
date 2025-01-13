// src/routes/userRoutes.js
const express = require("express");
const { login, createAccount, getUsers, getUsersId } = require("../controller/userController");

const router = express.Router();

router.post("/login", login);
router.post("/createAccount", createAccount);
router.get("/users", getUsers);
router.get("/:id", getUsersId);

router.get("/", (req, res) => res.send("Hello Dagi!"));

module.exports = router;
