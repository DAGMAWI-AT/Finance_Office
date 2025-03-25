const express = require('express');
const router = express.Router();
const {
    createLetter,
    getAllLetters,
    getLetterById,
    updateLetter,
    deleteLetter,
    uploadMiddleware
} = require('../controller/letterController');  // Assuming your controller file is named letterController.js
const verifyToken = require("../middleware/authMiddleware");
// const letterController = require('../controller/letterController');

// POST: Create a letter
router.post("/letters", verifyToken, uploadMiddleware, createLetter);

// GET: Retrieve all letters
router.get('/letters', getAllLetters);

// GET: Retrieve a single letter by ID
router.get('/letters/:id', getLetterById);

// PUT: Update a letter by ID
router.put('/letters/:id', uploadMiddleware, updateLetter);

// DELETE: Delete a letter by ID
router.delete('/letters/:id', deleteLetter);

module.exports = router;
