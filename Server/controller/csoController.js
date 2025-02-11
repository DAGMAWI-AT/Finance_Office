const express = require("express");
const multer = require("multer");
const path = require("path");
const { pool } = require("../config/db");
const { createCsoTable, csoTable } = require("../model/cso");
const fs = require('fs'); 

const app = express();
app.use(express.json());

const uploadFolder = path.join(__dirname, "..", "public", "cso_files");
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${Math.random().toString(36).substring(2, 15)}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
}).fields([
  { name: 'logo', maxCount: 1 },
  { name: 'tin_certificate', maxCount: 1 },
  { name: 'registration_certificate', maxCount: 1 },
]);

const baseURL = "http://localhost:5000/uploads/";

const registerCso = async (req, res) => {
  let connection;
  try {
    await createCsoTable();
    
    let data = req.body;
    connection = await pool.getConnection();
    await connection.beginTransaction();

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

    if (req.files) {
      data.logo = req.files["logo"] ? baseURL + req.files["logo"][0].filename : null;
      data.tin_certificate = req.files["tin_certificate"] ? baseURL + req.files["tin_certificate"][0].filename : null;
      data.registration_certificate = req.files["registration_certificate"] ? baseURL + req.files["registration_certificate"][0].filename : null;
    }

    data.status = "active";
    data.date = new Date();

    const { email, phone } = data;
    const [existingUser] = await pool.query(
      `SELECT * FROM ${csoTable} WHERE email = ? OR phone = ?`,
      [email, phone]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: "An account already exists for the provided email or phone.",
      });
    }

    const [result] = await pool.query(`INSERT INTO ${csoTable} SET ?`, [data]);

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
    const [csos] = await pool.query(`SELECT * FROM ${csoTable}`);
    res.json(csos);
  } catch (error) {
    console.error("Error fetching CSOs:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getCsoById = async (req, res) => {
  const id = req.params.id;
  try {
    const [cso] = await pool.query(`SELECT * FROM ${csoTable} WHERE id = ?`, [id]);
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
    const id = req.params.id;
    let updateData = req.body;
  
    try {
      const [existingCso] = await pool.query(`SELECT logo, tin_certificate, registration_certificate FROM ${csoTable} WHERE id = ?`, [id]);
  
      if (existingCso.length === 0) {
        return res.status(404).json({ success: false, message: "CSO not found" });
      }
      const uploadsDir = path.join(__dirname, "..", "public", "cso_files");


      const deleteOldFile = async (filePath) => {
        if (filePath) {
          // Extract the filename from the database path
          const filename = path.basename(filePath);
          const oldFilePath = path.join(uploadsDir, filename);
  
          try {
            // Check if the file exists before deleting
            await fs.promises.access(oldFilePath);
            await fs.promises.unlink(oldFilePath);
          } catch (err) {
            if (err.code !== 'ENOENT') { // If it's not a 'file not found' error, log it
              console.error("Error deleting old logo file:", err);
            }
          }
        }
      };
      if (req.files && req.files["logo"]) {
        await deleteOldFile(existingCso[0].logo);
        updateData.logo = baseURL + req.files["logo"][0].filename;
      }
      if (req.files && req.files["tin_certificate"]) {
        await deleteOldFile(existingCso[0].tin_certificate); 
        updateData.tin_certificate = baseURL + req.files["tin_certificate"][0].filename; 
      }
  
      if (req.files && req.files["registration_certificate"]) {
        await deleteOldFile(existingCso[0].registration_certificate); 
        updateData.registration_certificate = baseURL + req.files["registration_certificate"][0].filename;
      }
      updateData.updated_at = new Date();
      if (updateData.date) {
        delete updateData.date; 
        }
      // Build the query for the fields that need to be updated
      const fields = Object.keys(updateData).map(field => `${field} = ?`).join(", ");
      const values = Object.values(updateData);
  
      // Update the CSO record in the database
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
    const [result] = await pool.query(
      `DELETE FROM ${csoTable} WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "CSO record not found.",
      });
    }

    res.json({
      success: true,
      message: "CSO record deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting CSO record:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getCsoByRegistrationId = async (req, res) => {
  const { registrationId } = req.params;
  try {
    const [cso] = await pool.query(
      `SELECT * FROM ${csoTable} WHERE registrationId = ?`,
      [registrationId]
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