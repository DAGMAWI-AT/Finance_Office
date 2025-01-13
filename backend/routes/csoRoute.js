// src/routes/csoRoutes.js
const express = require("express");
const { uploadLogo, registerCso, getCso, getCsoById, updateCso } = require("../controller/csoController");

const router = express.Router();

router.post("/register", uploadLogo.single("logo"), registerCso);
router.get("/",getCso);
router.get("/:id", getCsoById);
router.patch("/update/:id", updateCso);



module.exports = router;
