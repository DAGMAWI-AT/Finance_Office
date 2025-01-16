const { client } = require("../configuration/db"); // Import the MongoDB client from app.js

const NotificationsCollection = client
  .db("finance_office")
  .collection("notifications");
module.exports = {
    NotificationsCollection,
};
