//route/csoRoute
const express = require("express");
const {
  uploadLogo,
  uploadLicense,
  registerCso,
  getCso,
  getCsoById,
  updateCso,
  deleteCso,
  getCsoByRegistrationId,
  upload,
} = require("../controller/csoController");
const verifyToken = require("../middleware/authMiddleware");
const router = express.Router();

// Serve static files
router.use("/logos", express.static("public/logos"));
router.use("/licenses", express.static("public/licenses"));
router.use("/uploads", express.static("public/cso_files"));


// Routes
// router.post("/register", uploadLogo.single("logo"), registerCso);
router.post("/register", upload, registerCso);
router.get("/get", getCso);
router.get("/:id", getCsoById);
router.get("/res/:registrationId", getCsoByRegistrationId);
router.patch("/update/:id", upload, updateCso);
router.delete("/remove/:id", deleteCso);

module.exports = router;