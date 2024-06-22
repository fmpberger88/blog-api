const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the uploads directory exists
const uploadDir = './uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set storage engine
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, 'image-' + Date.now() + path.extname(file.originalname));
    }
});

// Initialize upload variable
const upload = multer({
    storage: storage,
    limits: { fileSize: 2000000 }, // Limit file size to 2MB
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).single('image'); // Single file upload with the name 'image'

// Check file type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images only!');
    }
}

module.exports = upload;
