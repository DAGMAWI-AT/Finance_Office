const { client } = require("../configuration/db");  // Import the MongoDB client from app.js

const UserReportsCollection = client
      .db("finance_office")
      .collection("user_report");
module.exports = {
    UserReportsCollection,
};
