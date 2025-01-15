// src/models/staff.js
const { client } = require("../configuration/db");  // Import the MongoDB client from app.js

const StaffCollection = client.db("finance_office").collection("staff");

module.exports = {
    StaffCollection,
};
