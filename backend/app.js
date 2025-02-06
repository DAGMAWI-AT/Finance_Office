//src/app.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const { secretKey } = require("./configuration/jwtConfig");
const userRoutes = require("./routes/userRoute");
const staffRoute = require("./routes/staffRoute");
const csoRoute = require("./routes/csoRoute");
const authRoute = require("./routes/authRoute");
const notificationRoute = require("./routes/noificationRoute");
const reportRoute = require("./routes/reportRoute");
const reportCategoryRoute = require("./routes/reportCategoryRoute")
const commentRoute = require("./routes/commentRoute");
const { connectDB } = require("./configuration/db");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 8000;
const app = express();
require("dotenv").config();
app.use(cookieParser());
app.use(express.json());
app.use(cors());

app.use("/staff", express.static(path.join(__dirname, "public/staff")));
app.use("/logos", express.static(path.join(__dirname, "public/logos")));

app.use(
  "/user_report",
  express.static(path.join(__dirname, "public/user_report"))
);
app.use(
    "/comment",
    express.static(path.join(__dirname, "public/comment"))
  );
// Middleware
// app.use(cors({
//   origin: "http://localhost:3000", // Your frontend URL
//   credentials: true, // Allow cookies to be sent and received
// }));
// app.use(cors({ origin: 'https://csosfinance1.netlify.app', credentials: true }));
// app.use(cors({ origin: 'http://localhost:8000', credentials: true }));


// Routes
app.use("/user", userRoutes);
app.use("/staffs", staffRoute);
app.use("/cso", csoRoute);
app.use("/api/auth", authRoute);
app.use("/notifications", notificationRoute);

//report route
app.use("/reports", reportRoute);
app.use("/reportCategory", reportCategoryRoute)

app.use("/comment", commentRoute)







// MongoDB Setup
async function run() {
  await connectDB(); // Make sure the DB is connected before starting the server
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

run();
