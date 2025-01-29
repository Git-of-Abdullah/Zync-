const multer = require('multer');

// Configure the storage for file upload
const storage = multer.diskStorage({
  filename: function(req, file, cb) {
    cb(null, file.originalname);  // Use the original filename
  }
});

// Configure multer with limits and fileFilter
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },  // Max file size: 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4', 'video/avi', 'video/mov'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only images and videos are allowed.'));
    }
    cb(null, true);  // Proceed with the file upload if valid
  }
});

module.exports = upload;
