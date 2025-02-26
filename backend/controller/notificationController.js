const { NotificationsCollection } = require("../model/notification");
const { ObjectId } = require("mongodb");

const getNotifications = async (req, res) => {
  try {
    const notifications = await NotificationsCollection.find().toArray();
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const patchNotificationsById = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await NotificationsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { read: true } }
    );
    res.json({
      success: true,
      message: "Notification marked as read.",
      result,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getNotificationsByRegistrationId = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const notifications = await NotificationsCollection.find({ registrationId }).toArray();
    res.json(notifications);
} catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
}
};

const getNotificationsByReportId = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await ReportsCollection.findOne({ _id: new ObjectId(reportId) });
    res.json(report);
} catch (error) {
    console.error("Error fetching report details:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
}
};

module.exports = {
  getNotifications,
  patchNotificationsById,
  getNotificationsByRegistrationId,
  getNotificationsByReportId,
};
