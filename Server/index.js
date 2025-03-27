const express = require('express');
const bodyParser = require('body-parser');
const userRoute = require('./route/userRoute'); 
const csoRoute = require("./route/csoRoute");
const staffRoute = require("./route/staffRoute");
const reportRout = require("./route/reportRoute")
const commentRoute = require("./route/commentRoute");
const beneficiaryRoute = require('./route/beneficiaryRoute');
const reportCategoryRoute = require("./route/reportCategoryRoute")
const notificationRoute = require("./route/notificationRoute");
const projectRoutes = require('./route/projectRoute');
const letterRoute = require('./route/letterRoute');  // Path to the routes file
const formRoute = require('./route/formRoute');  // Path to the routes file

const cookieParser = require("cookie-parser");

const { connectDB, pool, checkConnection } = require('./config/db');
const cors = require("cors");
const app = express();
const path = require("path");
app.use(cookieParser()); // <-- This is critical for req.cookies to be available

// app.use(cors({
//   origin: ["http://localhost:3000"], // Allow requests from this origin
//   credentials: true // Allow cookies to be sent
// }));
app.use(cors({ origin: 'https://csosfinance1.netlify.app', credentials: true }));


// Middleware
// app.use(cors());
app.use(bodyParser.json()); // Parse JSON request bodies
app.use("/comment", express.static("public/comments"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/cso_logo", express.static("public/cso_logo"));
app.use("/cso_tin", express.static("public/cso_tin"));
app.use("/cso_registration", express.static("public/cso_registration"));

app.use("/user_report", express.static(path.join(__dirname, "public/user_report")));
app.use("/user_report", express.static("public/user_report"));
app.use("/cso_files", express.static(path.join(__dirname, "public/cso_files")));


app.use("/idFiles", express.static(path.join(__dirname, "public/idFiles")));
app.use('/photoFiles', express.static(path.join(__dirname, 'public/photoFiles')));

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
app.use('/api/projects', projectRoutes);
app.use('/api/letter',letterRoute);  // Use the letter routes

app.use('/api', beneficiaryRoute);

app.use('/api/form', formRoute);

// app.get('/health', async (req, res) => {
//   try {
//     const dbHealthy = await checkConnection();
//     res.status(200).json({
//       status: 'UP',
//       database: dbHealthy ? 'CONNECTED' : 'DISCONNECTED',
//       timestamp: new Date().toISOString()
//     });
//   } catch (err) {
//     res.status(503).json({
//       status: 'DOWN',
//       database: 'ERROR',
//       error: err.message,
//       timestamp: new Date().toISOString()
//     });
//   }
// });

// const PORT = process.env.PORT || 5000;

// async function initializeApp() {
//   try {
//     // 1. First attempt database connection
//     console.log('Connecting to database...');
//     await connectDB();
    
//     // 2. Verify connection is actually working
//     console.log('Verifying database connection...');
//     const isConnected = await checkConnection();
//     if (!isConnected) {
//       throw new Error('Database connection verification failed');
//     }
    
//     // 3. Start server only if DB is connected
//     const server = app.listen(PORT, () => {
//       console.log(`Server running on http://localhost:${PORT}`);
//       console.log('Health check endpoint: http://localhost:${PORT}/health');
//     });

//     // 4. Handle server errors
//     server.on('error', (err) => {
//       console.error('Server error:', err);
//       process.exit(1);
//     });

//     // 5. Graceful shutdown
//     process.on('SIGTERM', () => {
//       console.log('SIGTERM received. Shutting down gracefully...');
//       server.close(() => {
//         pool.end().then(() => {
//           console.log('Database pool closed');
//           process.exit(0);
//         });
//       });
//     });

//     process.on('SIGINT', () => {
//       console.log('SIGINT received. Shutting down gracefully...');
//       server.close(() => {
//         pool.end().then(() => {
//           console.log('Database pool closed');
//           process.exit(0);
//         });
//       });
//     });

//   } catch (err) {
//     console.error('Application initialization failed:', err);
    
//     // Attempt to close the pool if it exists
//     if (pool) {
//       try {
//         await pool.end();
//       } catch (poolErr) {
//         console.error('Error closing connection pool:', poolErr);
//       }
//     }
    
//     process.exit(1); // Exit with failure code
//   }
// }


// initializeApp();




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
