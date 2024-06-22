const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../cloudinaryConfig');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'blog_uploads',
        allowedFormats: ['jpeg', 'jpg', 'png', 'gif'],
    },
});

const upload = multer({ storage: storage });

module.exports = upload;
