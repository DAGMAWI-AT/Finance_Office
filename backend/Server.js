const express = require("express");
const app = express();
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 8000;
// Middleware
app.use(cors());
app.use(express.json());
app.use(
  "/user_report",
  express.static(path.join(__dirname, "public/user_report"))
);
app.use("/logos", express.static(path.join(__dirname, "public/logos")));
app.use("/staff", express.static(path.join(__dirname, "public/staff")));


// File Upload Directory
// const uploadDir = path.join(__dirname, "public/user_report");
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }
// app.use("/user_report", express.static(uploadDir));

// MongoDB Setup
const uri =
  "mongodb+srv://finance:finance_offices@cluster0.ixomm.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Multer Configuration
const storageReport = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/user_report"),
  filename: (req, file, cb) =>
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    ),
});
const upload = multer({ storage: storageReport });
const storageLogo = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/logos"),
  filename: (req, file, cb) =>
    cb(
      null,
      // "logo_" + Date.now() + path.extname(file.originalname)
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    ),
});
const uploadLogo = multer({ storage: storageLogo });
const storageStaffPhoto = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/staff"),
  filename: (req, file, cb) =>
    cb(
      null,
      // "logo_" + Date.now() + path.extname(file.originalname)
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    ),
});
const uploadStaffPhoto = multer({ storage: storageStaffPhoto });
// Routes
app.get("/", (req, res) => res.send("Hello Dagi!"));

async function run() {
  try {
    await client.connect();

    const UserReportsCollection = client
      .db("finance_office")
      .collection("user_report");

    const NotificationsCollection = client
      .db("finance_office")
      .collection("notifications");

    const CSOCollection = client.db("finance_office").collection("cso");
    const StaffCollection = client.db("finance_office").collection("staff");
    app.post("/registerStaff", uploadStaffPhoto.single("photo"), async (req, res) => {
      try {
        const data = req.body;
        data.csoId = `Staff-${Date.now()}`;
        data.status = "active";
        if (req.file) {
          data.photo = req.file.filename;
    
          console.log(data);
          const result = await StaffCollection.insertOne(data);
          res.json({
            success: true,
            message: "Staff registered successfully.",
            result,
          });
        } else {
          res.status(400).json({ success: false, message: "No file uploaded" });
        }
      } catch (error) {
        console.error("Error registering Staff:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
      }
    });
    

    app.post("/userReports", upload.single("pdfFile"), async (req, res) => {
      try {
        if (req.file) {
          const data = req.body;
          data.pdfFile = req.file.filename;

          const result = await UserReportsCollection.insertOne(data);

          // Create a notification for admin
          const notification = {
            message: "A new report has been submitted.",
            read: false,
            timestamp: new Date(),
          };
          await NotificationsCollection.insertOne(notification);

          res.json({
            success: true,
            message: "Report and notification added successfully.",
            result,
          });
        } else {
          res.status(400).json({ success: false, message: "No file provided" });
        }
      } catch (error) {
        console.error("Error adding file:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });
    app.get("/notifications", async (req, res) => {
      try {
        const notifications = await NotificationsCollection.find().toArray();
        res.json(notifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    app.patch("/notifications/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await NotificationsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { read: true } }
        );
        res.json({
          success: true,
          message: "Notification marked as read.",
          result,
        });
      } catch (error) {
        console.error("Error marking notification as read:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });
    app.get("/getUserReport", async (req, res) => {
      try {
        const data = await UserReportsCollection.find().toArray();
        res.json(data);
      } catch (error) {
        console.error("Error fetching data:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });
    app.get("/getUserReport/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await UserReportsCollection.findOne(filter);
      res.send(result);
    });

    // Route: Register CSO

    app.post("/registerCSO", uploadLogo.single("logo"), async (req, res) => {
      try {
        const data = req.body;
        data.csoId = `CSO-${Date.now()}`;
        data.status = "active";
        data.date = new Date();
        if (req.file) {
          data.logo = req.file.filename;

          console.log(data);
          const result = await CSOCollection.insertOne(data);
          res.json({
            success: true,
            message: "CSO registered successfully.",
            result,
          });
        } else {
          res.status(400).json({ success: false, message: "No file uploaded" });
        }
      } catch (error) {
        console.error("Error registering CSO:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    // Route: Get All CSOs
    app.get("/csos", async (req, res) => {
      try {
        const csos = await CSOCollection.find().toArray();
        res.json(csos);
      } catch (error) {
        console.error("Error fetching CSOs:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    // Route: Update CSO Status
    app.patch("/updateCSOStatus/:id", async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;
      try {
        const result = await CSOCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } }
        );
        res.json({
          success: true,
          message: "CSO status updated successfully.",
          result,
        });
      } catch (error) {
        console.error("Error updating CSO status:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    // Update CSO status
    app.patch("/updateCSOStatus/:id", async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;
      try {
        const result = await CSOCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } }
        );
        res.json({
          success: true,
          message: "CSO status updated successfully.",
          result,
        });
      } catch (error) {
        console.error("Error updating CSO status:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });
    console.log("Connected to MongoDB!");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
  }
}
run().catch(console.error);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
