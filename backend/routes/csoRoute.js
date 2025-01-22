// src/routes/csoRoutes.js
const express = require("express");
const { uploadLogo, registerCso, getCso, getCsoById, updateCso, getCsoByRegistrationId } = require("../controller/csoController");
const app = express();
const path = require("path");
const cors = require("cors");
app.use(cors());
const router = express.Router();
app.use("/logos", express.static(path.join(__dirname, "public/logos")));

router.post("/register", uploadLogo.single("logo"), registerCso);
router.get("/get",getCso);
router.get("/:id", getCsoById);
router.patch("/update/:id", updateCso);
router.get("/res/:registrationId", getCsoByRegistrationId);



module.exports = router;
