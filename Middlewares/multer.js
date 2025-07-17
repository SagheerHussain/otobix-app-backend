const multer = require('multer');
const cloudinary = require('../Utils/claudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Otobix/Users',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    public_id: (req, file) => `${Date.now()}-${file.originalname}`
  },
});

const parser = multer({ storage: storage });

module.exports = parser;