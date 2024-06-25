const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Cloudinary will automatically pick up CLOUDINARY_URL from process.env
cloudinary.config();

module.exports = cloudinary;
