// src/config/db.js
const { MongoClient, ServerApiVersion } = require("mongodb");

// MongoDB URI
const uri ="mongodb://${{procces.env.MONGO_INITDB_ROOT_USERNAME}}:${{procces.env.MONGO_INITDB_ROOT_PASSWORD}}@${{procces.env.RAILWAY_TCP_PROXY_DOMAIN}}:${{procces.env.RAILWAY_TCP_PROXY_PORT}}";
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
