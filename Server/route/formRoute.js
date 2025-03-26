const express = require('express');
const router = express.Router();
const formController = require('../controller/formController');
const verifyToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
// const multer = require('multer');

// Use memory storage instead of disk storage
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Use memory storage
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory
  limits: {
    fileSize: 20 * 1024 * 1024, // Limit file size to 5MB
  },
});
// router.post('/create', verifyToken, authorizeRoles('admin'), formController.adminCreateForm);
router.post('/create', verifyToken, formController.adminCreateForm);
router.get('/', verifyToken, formController.getAllForms);

router.get('/all/Form', verifyToken, formController.getAllFormsForAdmin);

router.get('/:id', verifyToken, formController.getFormById);
router.put('/edit/:id', verifyToken, formController.updateForm);
router.delete('/:id', verifyToken, formController.deleteForm);



/// application
router.get('/form/application', verifyToken, formController.getUserSubmission);
router.get('/all/submission', verifyToken, formController.getAllSubmission);

router.get('/application/submitted', verifyToken, formController.getAllApplicationForms);
router.get('/application/:id', verifyToken, formController.getApplicationFormById);
router.put('/application/:id/status', verifyToken, formController.updateApplicationStatus);
router.delete('/application/:id', verifyToken, formController.deleteApplicationForm);
router.put('/application', verifyToken, upload.single('application_file'), formController.submitApplicationForm);

router.put('/applications/:id/update_permission', verifyToken, formController.updateApplicationUpdatePermission);
router.get('/cso/application/:userId', verifyToken, formController.getApplicationFormsByUserId);

module.exports = router;