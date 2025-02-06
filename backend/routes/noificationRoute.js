// src/routes/notificationRoutes.js
const express = require("express");
const { getNotifications, patchNotificationsById, getNotificationsByReportId, getNotificationsByRegistrationId} = require("../controller/notificationController");

const router = express.Router();

router.get("/", getNotifications );
// router.patch("/:id", patchNotificationsById)
router.get("/:registrationId", getNotificationsByRegistrationId);
router.get("/:reportId", getNotificationsByReportId);




module.exports = router;
