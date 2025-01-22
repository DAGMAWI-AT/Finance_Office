const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// router.get(
//   "/admin",
//   verifyToken,
//   authorizeRoles("admin", "reportViewer"),
//   (req, res) => {
//     // res.json({ message:"wellcome admin"})
//     router.post("/createAccount", verifyToken, authorizeRoles("admin"), createAccount);
//     router.get("/users", getUsers);
//     router.get("/:id", getUsersId);
//   }
// );

router.get("/cso", verifyToken, authorizeRoles("cso"), (req, res) => {
  res.json({ message: "wellcome cso" });
});
router.get("/admin", verifyToken, authorizeRoles("admin"), (req, res) => {
  res.json({ message: "wellcome admin" });
});

module.exports = router;
