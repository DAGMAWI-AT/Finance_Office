const multer = require("multer");
const path = require("path");
const { StaffCollection } = require("../model/staff"); // Adjust path based on your structure
const { ObjectId } = require("mongodb");

// Configure multer for file storage
const storageStaffPhoto = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/staff"), // Directory where photo will be stored
  filename: (req, file, cb) =>
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname) // File name with timestamp
    ),
});
const uploadStaffPhoto = multer({ storage: storageStaffPhoto });

// Staff Registration Function
const registerStaff = async (req, res) => {
  try {
    const data = req.body;

    // Generate a registration ID
    data.registrationId = `Staff-${Date.now()}`;
    data.status = "active"; // Default status is active

    // If a photo is uploaded, add its filename to the data
    if (req.file) {
      data.photo = req.file.filename; // Save filename of the uploaded photo
    }

    // Insert the staff data into the MongoDB collection
    const result = await StaffCollection.insertOne(data);

    // Respond with success
    res.json({
      success: true,
      message: "Staff registered successfully.",
      result,
    });
  } catch (error) {
    console.error("Error registering Staff:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

//get staff
const getStaff = async (req, res) => {
  try {
    const staff = await StaffCollection.find().toArray();
    res.json(staff);
  } catch (error) {
    console.error("Error fetching staffs:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

//get single staff data
const getStaffById = async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const result = await StaffCollection.findOne(filter);
  res.send(result);
};
// Export the function and multer middleware
module.exports = {
  uploadStaffPhoto,
  registerStaff,
  getStaff,
  getStaffById,
};
