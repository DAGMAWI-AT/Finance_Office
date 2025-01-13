// src/models/userModel.js
const { client } = require("../configration/db");  // Import the MongoDB client from app.js

const UserCollection = client.db("finance_office").collection("users");

module.exports = {
  UserCollection,
};
