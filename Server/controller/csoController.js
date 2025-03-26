const express = require("express");
const multer = require("multer");
const path = require("path");
const { pool } = require("../config/db");
const { createCsoTable, csoTable } = require("../model/cso");
const fs = require('fs'); 
const { validationResult } = require('express-validator'); // For input validation

const app = express();
app.use(express.json());

const uploadFolder = path.join(__dirname, "..", "public");

// Helper to ensure a folder exists
const ensureFolderExists = (folder) => {
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
};
const deleteOldFile = async (filePath, folderName) => {
  if (filePath) {
    const filename = path.basename(filePath);
    const oldFilePath = path.join(uploadFolder, folderName, filename);
    try {
      await fs.promises.access(oldFilePath);
      await fs.promises.unlink(oldFilePath);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error("Error deleting file:", err);
      }
    }
  }
};

const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}).fields([
  { name: "logo", maxCount: 1 },
  { name: "tin_certificate", maxCount: 1 },
  { name: "registration_certificate", maxCount: 1 },
]);

// const baseURL = "${process.env.REACT_APP_API_URL}/public/";

// This helper will write the file from memory to disk and return its URL.
const processFile = (req, fileField, folderName, reqBodyCsoName) => {
  if (req.files && req.files[fileField] && req.files[fileField][0]) {
    const destFolder = path.join(uploadFolder, folderName);
    ensureFolderExists(destFolder);
    const csoName = reqBodyCsoName ? reqBodyCsoName.replace(/\s+/g, "_") : "CSO";
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(req.files[fileField][0].originalname);
    const filename = `${csoName}_${timestamp}_${randomStr}${ext}`;
    const filePath = path.join(destFolder, filename);
    fs.writeFileSync(filePath, req.files[fileField][0].buffer);
    return folderName + "/" + filename;
  }
  return null;
};

const registerCso = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  let connection;
  try {
    await createCsoTable();

    let data = req.body;
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check for duplicate email or phone before saving files
    const [existingUser] = await connection.query(
      `SELECT * FROM ${csoTable} WHERE email = ? OR phone = ?`,
      [data.email, data.phone]
    );
    if (existingUser.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "An account already exists for the provided email or phone.",
      });
    }

    // Generate unique registrationId
    const [existingIds] = await connection.query(
      `SELECT registrationId FROM ${csoTable} ORDER BY registrationId ASC`
    );
    let nextId = 1;
    if (existingIds.length > 0) {
      for (let i = 0; i < existingIds.length; i++) {
        const currentId = parseInt(existingIds[i].registrationId.split("-")[1], 10);
        if (currentId !== i + 1) {
          nextId = i + 1;
          break;
        }
      }
      if (nextId === 1) {
        const lastId = parseInt(existingIds[existingIds.length - 1].registrationId.split("-")[1], 10);
        nextId = lastId + 1;
      }
    }
    data.registrationId = `CSO-${nextId.toString().padStart(4, "0")}`;
    data.status = "active";
    data.date = new Date();

    // Now that all validations have passed and duplicate check is ok, process file uploads:
    data.logo = processFile(req, "logo", "cso_logo", req.body.csoName);
    data.tin_certificate = processFile(req, "tin_certificate", "cso_tin", req.body.csoName);
    data.registration_certificate = processFile(req, "registration_certificate", "cso_registration", req.body.csoName);

    // Insert the data into the database
    const [result] = await connection.query(`INSERT INTO ${csoTable} SET ?`, [data]);
    await connection.commit();
    res.json({
      success: true,
      message: "CSO registered successfully.",
      result,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error registering CSO:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
};


const getCso = async (req, res) => {
  try {
    const [csos] = await pool.query(`SELECT * FROM cso`);
    res.json(csos);
  } catch (error) {
    console.error("Error fetching CSOs:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getCsoById = async (req, res) => {
  const id = req.params.id;
  try {
    const [cso] = await pool.query(`SELECT * FROM cso WHERE id = ?`, [id]);
    if (cso.length === 0) {
      return res.status(404).json({ success: false, message: "CSO not found" });
    }
    res.json(cso[0]);
  } catch (error) {
    console.error("Error fetching CSO by ID:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


const updateCso = async (req, res) => {
  // Run validations (if using express-validator middleware)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const id = req.params.id;
  let updateData = req.body;

  try {
    // Retrieve the existing CSO record
    const [existingCso] = await pool.query(
      `SELECT logo, tin_certificate, registration_certificate FROM ${csoTable} WHERE id = ?`,
      [id]
    );

    if (existingCso.length === 0) {
      return res.status(404).json({ success: false, message: "CSO not found" });
    }

    // Base uploads directory and base URL (assumed to be defined globally)
    // const uploadFolder = path.join(__dirname, "..", "public");
    // const baseURL = "${process.env.REACT_APP_API_URL}/public/";
    // Helper to ensure folder exists (defined earlier)
    // function ensureFolderExists(folder) { ... }

    // Helper function: delete the old file from a specific folder

    // Helper function: write a file from memory to disk and return its URL.
  

    // If a new logo file is provided, delete the old file and process the new one.
    if (req.files && req.files["logo"]) {
      await deleteOldFile(existingCso[0].logo, "cso_logo");
      updateData.logo = processFile(req, "logo", "cso_logo", req.body.csoName);
    }

    // If a new TIN certificate is provided, delete the old file and process the new one.
    if (req.files && req.files["tin_certificate"]) {
      await deleteOldFile(existingCso[0].tin_certificate, "cso_tin");
      updateData.tin_certificate = processFile(req, "tin_certificate", "cso_tin", req.body.csoName);
    }

    // If a new registration certificate is provided, delete the old file and process the new one.
    if (req.files && req.files["registration_certificate"]) {
      await deleteOldFile(existingCso[0].registration_certificate, "cso_registration");
      updateData.registration_certificate = processFile(req, "registration_certificate", "cso_registration", req.body.csoName);
    }

    // Set the update timestamp; remove 'date' if provided to avoid conflicts.
    updateData.updated_at = new Date();
    if (updateData.date) {
      delete updateData.date;
    }

    // Build a dynamic SQL update statement.
    const fields = Object.keys(updateData).map(field => `${field} = ?`).join(", ");
    const values = Object.values(updateData);

    // Update the record in the database.
    await pool.query(
      `UPDATE ${csoTable} SET ${fields} WHERE id = ?`,
      [...values, id]
    );

    res.json({
      success: true,
      message: "CSO record updated successfully.",
    });
  } catch (error) {
    console.error("Error updating CSO record:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

  

const deleteCso = async (req, res) => {
  const id = req.params.id;

  try {
    // First, fetch the existing CSO record to get file paths
    const [existingCso] = await pool.query(
      `SELECT logo, tin_certificate, registration_certificate FROM ${csoTable} WHERE id = ?`,
      [id]
    );

    if (existingCso.length === 0) {
      return res.status(404).json({
        success: false,
        message: "CSO record not found.",
      });
    }

    // Delete associated files from disk using the appropriate folder names
    await deleteOldFile(existingCso[0].logo, "cso_logo");
    await deleteOldFile(existingCso[0].tin_certificate, "cso_tin");
    await deleteOldFile(existingCso[0].registration_certificate, "cso_registration");

    // Now delete the record from the database
    const [result] = await pool.query(`DELETE FROM ${csoTable} WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "CSO record not found.",
      });
    }

    res.json({
      success: true,
      message: "CSO record and associated files deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting CSO record:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getCsoByRegistrationId = async (req, res) => {
  const { user_id } = req.params;
  try {
    const [cso] = await pool.query(
      `SELECT * FROM cso WHERE id = ?`,
      [user_id]
    );
    if (cso.length === 0) {
      return res.status(404).json({ success: false, message: "CSO not found" });
    }
    res.json(cso[0]);
  } catch (error) {
    console.error("Error fetching CSO by registration ID:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  upload,
  registerCso,
  getCso,
  getCsoById,
  updateCso,
  deleteCso,
  getCsoByRegistrationId,
};