const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the directory exists
const ensureDirectoryExistence = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Custom storage engine to dynamically set the destination folder
const dynamicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let destinationFolder = path.join(__dirname, "..", "public"); // Default folder

    if (file.fieldname === 'idFile') {
      destinationFolder = path.join(destinationFolder, "idFiles"); // Save ID files in 'public/idFiles'
    } else if (file.fieldname === 'photo') {
      destinationFolder = path.join(destinationFolder, "photoFiles"); // Save photo files in 'public/photoFiles'
    }

    ensureDirectoryExistence(destinationFolder); // Ensure folder exists
    cb(null, destinationFolder);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
  },
});

// File filter for ID files
const idFileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|pdf/; // Allowed file types
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images (JPEG, JPG, PNG) and PDFs are allowed for ID files!'));
  }
};

// File filter for photo files
const photoFileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png/; // Only images allowed for photos
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images (JPEG, JPG, PNG) are allowed for photos!'));
  }
};

// Combined middleware for handling both files in one route
const uploadFiles = multer({
  storage: dynamicStorage, // Use the custom storage engine
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'idFile') {
      idFileFilter(req, file, cb);
    } else if (file.fieldname === 'photo') {
      photoFileFilter(req, file, cb);
    } else {
      cb(new Error('Invalid file field!'));
    }
  },
}).fields([
  { name: 'idFile', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
]);

module.exports = { uploadFiles };
