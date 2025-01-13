const multer = require("multer");
const path = require("path");
const { StaffCollection } = require("../model/cso"); // Adjust path based on your structure
const { ObjectId } = require("mongodb");

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


const registerCso = async (req, res) => {
    try {
        const data = req.body;
        data.registrationId = `CSO-${Date.now()}`;
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
}
const getCso = async(req,res)=>{
    try {
        const csos = await CSOCollection.find().toArray();
        res.json(csos);
      } catch (error) {
        console.error("Error fetching CSOs:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
}
const getCsoById = async(req,res)=>{
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const result = await CSOCollection.findOne(filter);
    res.send(result);
}
const updateCso= async (req, res) => {
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
}
module.exports = {
    uploadLogo,
    registerCso,
    getCso,
    getCsoById,
    updateCso
  };
  