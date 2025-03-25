const { pool } = require('../config/db');
const multer = require('multer');
const path = require('path');
const { createLettersTable } = require('../model/letter');

// Set up file storage using multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Specify the folder where files should be stored
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Save file with unique name
    }
});

const upload = multer({ storage });

// Middleware for handling file upload
exports.uploadMiddleware = upload.single('file');

// Create a new letter
exports.createLetter = async (req, res) => {
    try {
        await createLettersTable();
        // Extract fields from the request body
        const { title, content, type } = req.body;
        const filePath = req.file ? req.file.path : null; // Check if file is uploaded, get its path
        
        // Create a raw SQL query to insert the new letter
        const query = `
            INSERT INTO letters (title, content, type, attachment, createdBy)
            VALUES (?, ?, ?, ?, ?)
        `;

        const values = [title, content, type, filePath, req.user.id];

        // Execute the query to insert the new letter
        await pool.query(query, values);

        // Respond with success
        res.status(201).json({ message: 'Letter created successfully', title, content, type, filePath });
    } catch (error) {
        console.error('Error creating letter:', error);
        res.status(500).json({ error: 'Failed to create letter' });
    }
};

// Get all letters
exports.getAllLetters = async (req, res) => {
    try {
        const query = 'SELECT * FROM letters';
        const [letters] = await pool.query(query);  // Execute query and retrieve letters

        res.status(200).json(letters);  // Send letters as response
    } catch (error) {
        console.error('Error fetching letters:', error);
        res.status(500).json({ error: 'Failed to fetch letters' });
    }
};

// Get a single letter by ID
exports.getLetterById = async (req, res) => {
    const { id } = req.params;  // Extract letter ID from the URL parameters

    try {
        const query = 'SELECT * FROM letters WHERE id = ?';
        const [letter] = await pool.query(query, [id]);  // Query for the letter

        if (letter.length === 0) {
            return res.status(404).json({ error: 'Letter not found' });  // If no letter found
        }

        res.status(200).json(letter[0]);  // Send letter as response
    } catch (error) {
        console.error('Error fetching letter:', error);
        res.status(500).json({ error: 'Failed to fetch letter' });
    }
};
// Update a letter by ID
exports.updateLetter = async (req, res) => {
    const { id } = req.params;  // Extract letter ID from URL parameters
    const { title, content, type } = req.body;  // Extract updated fields from the request body
    const filePath = req.file ? req.file.path : null;  // Check if a new file was uploaded

    try {
        // Update query to modify the letter with the new data
        const query = `
            UPDATE letters
            SET title = ?, content = ?, type = ?, attachment = ?
            WHERE id = ?
        `;

        const values = [title, content, type, filePath || null, id];

        const [result] = await pool.query(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Letter not found' });
        }

        res.status(200).json({ message: 'Letter updated successfully' });
    } catch (error) {
        console.error('Error updating letter:', error);
        res.status(500).json({ error: 'Failed to update letter' });
    }
};

// Delete a letter by ID
exports.deleteLetter = async (req, res) => {
    const { id } = req.params;  // Extract letter ID from URL parameters

    try {
        // Query to delete the letter by ID
        const query = 'DELETE FROM letters WHERE id = ?';
        const [result] = await pool.query(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Letter not found' });
        }

        res.status(200).json({ message: 'Letter deleted successfully' });
    } catch (error) {
        console.error('Error deleting letter:', error);
        res.status(500).json({ error: 'Failed to delete letter' });
    }
};
