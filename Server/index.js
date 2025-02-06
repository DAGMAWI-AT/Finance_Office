const express = require('express');
const bodyParser = require('body-parser');
const userRoute = require('./route/userRoute'); 
const csoRoute = require("./route/csoRoute");
const staffRoute = require("./route/staffRoute");
const reportRout = require("./route/reportRoute")
const commentRoute = require("./route/commentRoute");
const reportCategoryRoute = require("./route/reportCategoryRoute")
const notificationRoute = require("./route/notificationRoute");
const { pool, connectDB } = require('./config/db'); 
const cors = require("cors");
const app = express();
const path = require("path");
// Middleware
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(cors());
app.use("/comment", express.static("public/comment"));

app.use("/uploads", express.static("public/cso_files"));
app.use("/user_report", express.static(path.join(__dirname, "public/user_report")));
app.use("/user_report", express.static("public/user_report"));
app.use("/uploads", express.static("public/cso_files"));
app.use("/staff", express.static(path.join(__dirname, "public/staff")));
app.use("/staff", express.static("public/staff"));

// User Routes
app.use('/api/users', userRoute);
app.use("/api/cso", csoRoute);
app.use("/api/staff", staffRoute);
app.use("/api/report", reportRout);
app.use("/api/reportCategory", reportCategoryRoute);
app.use("/api/comments", commentRoute);
app.use("/api/notifications", notificationRoute);



const PORT = process.env.PORT || 5000;
async function initializeApp() {
await connectDB();
try{
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}catch{
  console.log("connection field") 
}
}

initializeApp();