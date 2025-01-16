// src/routes/csoRoutes.js
const express = require("express");
const { getNotifications, patchNotificationsById} = require("../controller/notificationController");

const router = express.Router();

router.get("/", getNotifications );
router.patch("/:id", patchNotificationsById)



module.exports = router;
