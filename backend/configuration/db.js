// src/config/db.js
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

// MongoDB URI
const uri = "mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}";
  //"mongodb+srv://finance:finance_offices@cluster0.ixomm.mongodb.net/?retryWrites=true&w=majority";

// Create MongoClient instance
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1); // Exit the process if the connection fails
  }
}

// Export the client and connect function
module.exports = { client, connectDB };
