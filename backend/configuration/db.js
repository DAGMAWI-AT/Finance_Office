// src/config/db.js
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

// MongoDB URI
const uri = "mongodb://${{proccess.env.MONGO_INITDB_ROOT_USERNAME}}:${{proccess.env.MONGO_INITDB_ROOT_PASSWORD}}@${{proccess.env.MONGO_PUBLIC_URL}}:${{proccess.env.RAILWAY_TCP_PROXY_PORT}}";
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
