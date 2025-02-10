const express = require("express");
const multer = require("multer");
const path = require("path");
const {pool} = require("../config/db"); 
const {createStaffTable, staffTable} = require("../model/staff");
const app = express();
app.use(express.json());
app.use("/staff", express.static(path.join(__dirname, "public/staff")));
const fs = require('fs');

// Multer setup for file uploads
const storageStaffPhoto = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/staff"),
  filename: (req, file, cb) =>
    cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname)),
});
const uploadStaffPhoto = multer({ storage: storageStaffPhoto });

//  **Register Staff**
const registerStaff = async (req, res) => {
  try {

    await createStaffTable();
    const data = req.body;
    const { name, email, phone } = data;

    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    // Check if email or phone already exists
    const [existingUser] = await pool.query(
        `SELECT * FROM ${staffTable} WHERE email = ? OR phone = ?`,
        [email, phone]
    );

    if (existingUser.length > 0) {
        return res.status(400).json({
            success: false,
            message: "An account already exists for the provided email or phone.",
        });
    }

    // data.updated_at = new Date();

    if (req.file) {
      data.photo = req.file.filename;
    }

    data.registrationId = `Staff-${Date.now()}`;

    const [result] = await pool.query(`INSERT INTO ${staffTable} SET ?`, [data]);

    res.json({ success: true, message: "Staff registered successfully.", result });
  } catch (error) {
    console.error("Error registering staff:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


//  **Get All Staff**
const getStaff = async (req, res) => {
  try {
    const [staff] = await pool.query("SELECT * FROM staff");
    res.json(staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

//  **Get Staff by ID**
const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    const [staff] = await pool.query("SELECT * FROM staff WHERE id = ?", [id]);

    if (staff.length === 0) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    res.json(staff[0]);
  } catch (error) {
    console.error("Error fetching staff by ID:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

//  **Get Staff by Registration ID**
const getStaffByRegistrationId = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const [staff] = await pool.query("SELECT * FROM staff WHERE registrationId = ?", [registrationId]);

    if (staff.length === 0) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    res.json(staff[0]);
  } catch (error) {
    console.error("Error fetching staff by Registration ID:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
//update
const updateStaff = async (req, res) => {
  const id = req.params.id;
  const updateData = req.body; // Contains all fields to update

  try {
      // Check if there is any data to update
      if (Object.keys(updateData).length === 0) {
          return res.status(400).json({
              success: false,
              message: "No data provided for update.",
          });
      }
      const [staff] = await pool.query("SELECT * FROM staff WHERE id = ?", [id]);
  
      if (staff.length === 0) {
        return res.status(404).json({ success: false, message: "Staff not found" });
      }
      updateData.updated_at = new Date();
      
      if (req.file) {
        // Save the new file to the user_report folder
        updateData.photo = req.file.filename;
  
        // Delete the old file if it exists
        const [oldStaffPhoto] = await pool.execute(
          `SELECT photo FROM ${staffTable} WHERE id = ?`,
          [id]
        );
        if (oldStaffPhoto.length > 0 && oldStaffPhoto[0].photo) {
          const oldFilePath = path.join(
            __dirname,
            "../public/staff",
            oldStaffPhoto[0].photo
          );
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath); // Delete the old file
          }
        }
      }// Automatically set updated time
      // Construct dynamic query
      if (updateData.created_at) {
        delete updateData.created_at; // Prevent modifying `created_at`
    }
      const fields = Object.keys(updateData).map(field => `${field} = ?`).join(", ");
      const values = Object.values(updateData);
      // Update query
      const [result] = await pool.query(
          `UPDATE ${staffTable} SET ${fields} WHERE id = ?`,
          [...values, id]
      );

  
      res.json({
          success: true,
          message: "staff record updated successfully.",
          result,
      });
  } catch (error) {
      console.error("Error updating staff record:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
//update by registration id

const updateStaffByRegistrationId = async (req, res) => {
  const registrationId = req.params.registrationId;
  const updateData = req.body;

  try {
    // Format timestamps correctly for MySQL
  //   updateData.updated_at = new Date();

  //   if (updateData.created_at) {
  //     delete updateData.created_at; // Prevent modifying `created_at`
  // }
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No data provided for update.",
      });
    }

    // Check if staff exists
    const [staff] = await pool.query("SELECT * FROM staff WHERE registrationId = ?", [registrationId]);
    if (staff.length === 0) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    // Construct dynamic query
    const fields = Object.keys(updateData).map(field => `${field} = ?`).join(", ");
    const values = Object.values(updateData);
    
    // Update query
    const [result] = await pool.query(
      `UPDATE staff SET ${fields} WHERE registrationId = ?`,
      [...values, registrationId]
    );

    res.json({
      success: true,
      message: "Staff record updated successfully.",
      result,
    });
  } catch (error) {
    console.error("Error updating staff record:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const updateStaffById = async (req, res) => {
  const id = req.params.id;
  const updateData = req.body; // Contains all fields to update

  try {
      // Check if there is any data to update
      if (Object.keys(updateData).length === 0) {
          return res.status(400).json({
              success: false,
              message: "No data provided for update.",
          });
      }

      updateData.updated_at = new Date(); // Automatically set updated time
      if (updateData.created_at) {
        delete updateData.created_at; // Prevent modifying `created_at`
    }
      // Construct dynamic query
      const fields = Object.keys(updateData).map(field => `${field} = ?`).join(", ");
      const values = Object.values(updateData);

      // Update query
      const [result] = await pool.query(
          `UPDATE ${staffTable} SET ${fields} WHERE id = ?`,
          [...values, id]
      );

      res.json({
          success: true,
          message: "staff record updated successfully.",
          result,
      });
  } catch (error) {
      console.error("Error updating staff record:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
//  **Delete Staff**
const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM staff WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    res.json({ success: true, message: "Staff deleted successfully." });
  } catch (error) {
    console.error("Error deleting staff:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  uploadStaffPhoto,
  registerStaff,
  getStaff,
  getStaffById,
  updateStaffById,
  getStaffByRegistrationId,
  updateStaffByRegistrationId,
  updateStaff,
  deleteStaff,
};
