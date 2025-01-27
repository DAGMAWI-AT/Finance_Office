require('dotenv').config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URL;
console.log("MongoDB URI:", uri);

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect()
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("Failed to connect to MongoDB:", err));

// Export the client and connect function
module.exports = { client, connectDB };


// Export the client and connect function
module.exports = { client, connectDB };
