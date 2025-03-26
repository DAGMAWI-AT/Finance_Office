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
router.use("/cso_logo", express.static("public/cso_logo"));
router.use("/cso_tin", express.static("public/cso_tin"));
router.use("/cso_registration", express.static("public/cso_registration"));

const uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      // Handle Multer errors (like file size limit, etc.)
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
};

// Then use the middleware:
router.post("/register", uploadMiddleware, registerCso);
router.get("/get", getCso);
router.get("/:id", verifyToken, getCsoById);
router.get("/res/:user_id", getCsoByRegistrationId);
router.patch("/update/:id", upload, updateCso);
router.delete("/remove/:id", deleteCso);

module.exports = router;