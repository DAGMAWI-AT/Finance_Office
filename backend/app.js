// src/app.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const { secretKey } = require("./configration/jwtConfig");
const userRoutes = require("./routes/userRoute");
const staffRoute = require("./routes/staffRoute");
const csoRoute = require("./routes/csoRoute");

const { connectDB } = require("./configration/db"); // Import the connectDB function

const port = process.env.PORT || 8000;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => res.send("Hello Dagi!"));

// Routes
app.use("/user", userRoutes);
app.use("/staff", staffRoute)
app.use("/cso", csoRoute)


// MongoDB Setup
async function run() {
  await connectDB(); // Make sure the DB is connected before starting the server
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

run();
