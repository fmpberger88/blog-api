const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../cloudinaryConfig');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'blog_uploads',
        allowedFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp'],
        format: async (req, file) => 'webp', // supports promises as well
        public_id: (req, file) => file.originalname.split('.')[0], // Use file name as public ID
        transformation: [
            { width: 600, height: 500, crop: "fill", gravity: "center" }, // Resize and crop
            { quality: "auto" }, // Adjust quality automatically
        ]
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Limit file size to 2MB
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
});

// Check file type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(file.originalname.toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Error: Images only!');
    }
}

module.exports = upload;
