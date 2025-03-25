// controller/notificationController.js
const { pool } = require("../config/db");
const {
  notificationTable,
  createNotificationsTable,
} = require("../model/notification");

const createNotificationController = async (req, res) => {
  try {
    await createNotificationsTable();
    const data = req.body;
    if (
      !data.message ||
      !data.registration_id ||
      !data.report_id ||
      !data.author
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Message, Registration ID, Report ID, and Author are required.",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO ${notificationTable} SET ?`,
      [data]
    );

    res.json({
      success: true,
      message: "Notification created successfully.",
      result,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

const getNotifications = async (req, res) => {
  try {
    await createNotificationsTable();
    const [notification] = await pool.execute(
      `SELECT * FROM notifications`
    );
    res.json(notification);
  } catch (error) {
    console.error("Error fetching notification:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getNotificationsByUserController = async (req, res) => {
  try {
    await createNotificationsTable();
    const { registrationId } = req.params;
    const [notifications] = await pool.query(
      `SELECT * FROM notifications WHERE registration_id = ? ORDER BY timestamp DESC`,
      [registrationId]
    );

    if (notifications.length === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "No notifications found for this user.",
        });
    }

    res.json(notifications);
  } catch (error) {
    console.log("Error fetching notifications:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Internal Server Error. Unable to fetch notifications.",
      });
  }
};

// Get comment by ID
const getNotificationsById = async (req, res) => {
  const id = req.params.id;
  try {
    const [notification] = await pool.query(
      `SELECT * FROM notifications WHERE id = ?`,
      [id]
    );
    if (notification.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "notification not found" });
    }
    res.json(notification[0]);
  } catch (error) {
    console.error("Error fetching notification by ID:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
// Mark a notification as read
const markNotificationAsReadController = async (req, res) => {
  try {
    const { id } = req.params;

    // Mark the notification as read
    const [result] = await pool.query(
      `UPDATE notifications SET \`read\` = TRUE WHERE id = ?`, // Use backticks
      [id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found." });
    }

    res.json({ success: true, message: "Notification marked as read." });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

// Delete a notification
const deleteNotificationController = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete the notification
    const [result] = await pool.query(
      `DELETE FROM notifications WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found." });
    }

    res.json({ success: true, message: "Notification deleted successfully." });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

module.exports = {
  createNotificationController,
  getNotifications,
  getNotificationsById,
  getNotificationsByUserController,
  markNotificationAsReadController,
  deleteNotificationController,
};
