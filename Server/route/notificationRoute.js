// routes/notificationRoutes.js
const express = require("express");
const {
  createNotificationController,
  getNotifications,
  getNotificationsById,
  getNotificationsByUserController,
  markNotificationAsReadController,
  deleteNotificationController,
} = require("../controller/notificationController");
const router = express.Router();

// Create a notification
// router.post("/notification", createNotificationController);

// Fetch notifications for a user
router.get("/notification/:registrationId", getNotificationsByUserController);
router.get("/:id", getNotificationsById)
router.get("/", getNotifications)
// Mark a notification as read
router.put("/read/:id", markNotificationAsReadController);

// Delete a notification
router.delete("/:id", deleteNotificationController);

module.exports = router;