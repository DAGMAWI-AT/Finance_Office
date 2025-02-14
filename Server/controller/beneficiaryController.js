const { pool } = require('../config/db');
const { createBeneficiaryTable } = require("../model/beneficiary");
const path = require('path');
const fs = require('fs')
// Create Beneficiary Table (if needed)
createBeneficiaryTable();

// Create a new beneficiary
exports.createBeneficiary = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      email,
      kebele,
      location,
      wereda,
      kfleketema,
      houseNo,
    } = req.body;

    // Extract file names only (not full path)
    const idFileName = req.files?.idFile ? req.files['idFile'][0].filename : null;
    const photoFileName = req.files?.photo ? req.files['photo'][0].filename : null;

    const query = `
      INSERT INTO beneficiaries 
      (fullName, phone, email, kebele, location, wereda, kfleketema, houseNo, idFile, photo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      fullName,
      phone,
      email,
      kebele,
      location,
      wereda,
      kfleketema,
      houseNo,
      idFileName,  // Store only the file name
      photoFileName // Store only the file name
    ]);

    res.status(201).json({ success: true, message: "Beneficiary created successfully", data: result });
  } catch (error) {
    console.error('Error creating beneficiary:', error);
    res.status(400).json({ success: false, message: "Failed to create beneficiary", error: error.message });
  }
};

// Get all beneficiaries
exports.getAllBeneficiaries = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM beneficiaries');
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching beneficiaries:', error);
    res.status(500).json({ success: false, message: "Failed to fetch beneficiaries", error: error.message });
  }
};

// Get a single beneficiary by ID
exports.getBeneficiaryById = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM beneficiaries WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    }
    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching beneficiary:', error);
    res.status(500).json({ success: false, message: "Failed to fetch beneficiary", error: error.message });
  }
};



exports.updateBeneficiary = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      email,
      kebele,
      location,
      wereda,
      kfleketema,
      houseNo
    } = req.body;

    // Check if the beneficiary exists
    const [existing] = await pool.execute('SELECT idFile, photo FROM beneficiaries WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    }

    let idFilePath = existing[0].idFile;
    let photoFilePath = existing[0].photo;

    // Utility function to delete old files
    const deleteOldFile = async (filePath, folderPath) => {
      if (filePath) {
        const oldFilePath = path.join(folderPath, filePath);
        try {
          await fs.promises.access(oldFilePath); // Check if the file exists
          await fs.promises.unlink(oldFilePath); // Delete the file
        } catch (err) {
          if (err.code !== 'ENOENT') { // Ignore file not found errors
            console.error(`Error deleting old file: ${oldFilePath}`, err);
          }
        }
      }
    };

    // Handle ID file update
    if (req.files?.idFile) {
      await deleteOldFile(idFilePath, path.join(__dirname, '..', 'public', 'idFiles'));
      idFilePath = req.files['idFile'][0].filename;
    }

    // Handle photo update
    if (req.files?.photo) {
      await deleteOldFile(photoFilePath, path.join(__dirname, '..', 'public', 'photoFiles'));
      photoFilePath = req.files['photo'][0].filename;
    }

    // Update the beneficiary in the database
    const query = `
      UPDATE beneficiaries
      SET 
        fullName = ?,
        phone = ?,
        email = ?,
        kebele = ?,
        location = ?,
        wereda = ?,
        kfleketema = ?,
        houseNo = ?,
        idFile = ?,
        photo = ?
      WHERE id = ?
    `;

    await pool.execute(query, [
      fullName,
      phone,
      email,
      kebele,
      location,
      wereda,
      kfleketema,
      houseNo,
      idFilePath,
      photoFilePath,
      req.params.id
    ]);

    res.status(200).json({ success: true, message: 'Beneficiary updated successfully' });
  } catch (error) {
    console.error('Error updating beneficiary:', error);
    res.status(400).json({ success: false, message: "Failed to update beneficiary", error: error.message });
  }
};


// Delete a beneficiary by ID
exports.deleteBeneficiary = async (req, res) => {
  try {
    // Check if beneficiary exists before deleting
    const [existing] = await pool.execute('SELECT * FROM beneficiaries WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    }

    await pool.execute('DELETE FROM beneficiaries WHERE id = ?', [req.params.id]);
    res.status(200).json({ success: true, message: 'Beneficiary deleted successfully' });
  } catch (error) {
    console.error('Error deleting beneficiary:', error);
    res.status(500).json({ success: false, message: "Failed to delete beneficiary", error: error.message });
  }
};
