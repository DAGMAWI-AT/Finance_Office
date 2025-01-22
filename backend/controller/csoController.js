const express = require("express");
const app = express();
const multer = require("multer");
const path = require("path");
const { CSOCollection } = require("../model/cso");
const { ObjectId } = require("mongodb");
app.use(express.json());



app.use("/logos", express.static(path.join(__dirname, "public/logos")));
app.use("/licenses", express.static(path.join(__dirname, "public/licenses")));

// Multer storage for logo
const storageLogo = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/logos"),
  filename: (req, file, cb) =>
    cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname)),
});

// Multer storage for licenses
const storageLicense = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/licenses"),
  filename: (req, file, cb) =>
    cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname)),
});

// Multer upload configuration
const upload = multer({
  storage: multer.diskStorage({}),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
});

const uploadFiles = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "licenses", maxCount: 10 },
]);

const registerCso = async (req, res) => {
  try {
    const data = req.body;
    data.registrationId = `CSO-${Date.now()}`;
    data.status = "active";
    data.date = new Date();

    if (req.files) {
      // Handle logo
      if (req.files.logo) {
        data.logo = req.files.logo[0].filename;
      }

      // Handle license files
      if (req.files.licenses) {
        data.licenses = req.files.licenses.map((file) => file.filename);
      }

      const { email, phone } = data;

      // Check if email or phone already exists
      const existingUserInformation = await CSOCollection.findOne({
        $or: [{ email }, { phone }],
      });

      if (existingUserInformation) {
        console.log("An account already exists for the provided email or phone.");
        return res.status(400).json({
          success: false,
          message: "An account already exists for the provided email or phone.",
        });
      }

      // Insert CSO data into the database
      const result = await CSOCollection.insertOne(data);

      res.json({
        success: true,
        message: "CSO registered successfully.",
        result,
      });
    } else {
      res.status(400).json({ success: false, message: "No files uploaded" });
    }
  } catch (error) {
    console.error("Error registering CSO:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



// app.use("/logos", express.static(path.join(__dirname, "public/logos")));

// const storageLogo = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, "public/logos"),
//   filename: (req, file, cb) =>
//     cb(
//       null,
//       // "logo_" + Date.now() + path.extname(file.originalname)
//       file.fieldname + "_" + Date.now() + path.extname(file.originalname)
//     ),
// });
const uploadLogo = multer({ storage: storageLogo });

// const registerCso = async (req, res) => {
//   try {
//     const data = req.body;
//     data.registrationId = `CSO-${Date.now()}`;
//     data.status = "active";
//     data.date = new Date();
//     if (req.file) {
//       data.logo = req.file.filename;
      
//       const { email, phone } = data;

//       // Check if email or phone already exists
//       const existingUserInformation = await CSOCollection.findOne({
//         $or: [{ email }, { phone }],
//       });

//       if (existingUserInformation) {
//         console.log("An account already exists for the provided email or phone.");
//         return res.status(400).json({
//           success: false,
//           message: "An account already exists for the provided email or phone.",
//         });
//       }

//       // console.log(data);
//       const result = await CSOCollection.insertOne(data);
//       res.json({
//         success: true,
//         message: "CSO registered successfully.",
//         result,
//       });
//     } else {
//       res.status(400).json({ success: false, message: "No file uploaded" });
//     }
//   } catch (error) {
//     console.error("Error registering CSO:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };
const getCso = async (req, res) => {
  try {
    const csos = await CSOCollection.find().toArray();
    res.json(csos);
  } catch (error) {
    console.error("Error fetching CSOs:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
const getCsoById = async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const result = await CSOCollection.findOne(filter);
  res.send(result);
};
// const getCsoById = async (req, res) => {
//   const id = req.params.id;
//   try {
//     const result = await CSOCollection.findOne({ _id: new ObjectId(id) });
//     if (result) {
//       res.json(result);
//     } else {
//       res.status(404).json({ success: false, message: "CSO not found" });
//     }
//   } catch (error) {
//     console.error("Error fetching CSO by id:", error);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };

const updateCso = async (req, res) => {
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
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getCsoByRegistrationId = async (req, res) => {
  const { registrationId } = req.params;

  try {
    if (!registrationId) {
      return res
        .status(400)
        .json({ success: false, message: "registrationId is required" });
    }

    const result = await CSOCollection.findOne({ registrationId });
    if (!result) {
      return res.status(404).json({ success: false, message: "CSO not found" });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Detailed error fetching CSO by registrationId:", error);
    if (error instanceof MongoError) {
      res.status(500).json({ success: false, message: "Database error" });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }
};

module.exports = {
  uploadLogo,
  registerCso,
  getCso,
  getCsoById,
  updateCso,
  getCsoByRegistrationId,
};
