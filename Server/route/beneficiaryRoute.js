const express = require('express');
const router = express.Router();
const beneficiaryController = require('../controller/beneficiaryController');
const { uploadFiles } = require('../utils/upload');
const app = express();
const path = require("path");

app.use("/idFiles", express.static(path.join(__dirname, "public/idFiles")));
app.use('/photoFiles', express.static(path.join(__dirname, 'public/photoFiles')));
// Create a new beneficiary with file uploads
router.post('/beneficiaries', uploadFiles, beneficiaryController.createBeneficiary);

// Other routes
router.get('/beneficiaries', beneficiaryController.getAllBeneficiaries);
router.get('/beneficiaries/:id', beneficiaryController.getBeneficiaryById);
router.put('/beneficiaries/:id', uploadFiles, beneficiaryController.updateBeneficiary);
router.delete('/beneficiaries/:id', beneficiaryController.deleteBeneficiary);

module.exports = router;