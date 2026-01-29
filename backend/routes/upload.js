const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const auth = require('../middleware/auth');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// @route   POST api/upload
// @desc    Upload image to Cloudinary
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { image } = req.body; // Base64 image data

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Upload to Cloudinary with optimizations
    const result = await cloudinary.uploader.upload(image, {
      folder: 'coachfutbol/ejercicios',
      resource_type: 'image',
      transformation: [
        { width: 1200, crop: 'limit' }, // Max width 1200px
        { quality: 'auto:good' }, // Auto quality
        { fetch_format: 'auto' } // Auto format (WebP for supported browsers)
      ]
    });

    res.json({
      url: result.secure_url,
      public_id: result.public_id
    });

  } catch (err) {
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ error: 'Error uploading image' });
  }
});

// @route   DELETE api/upload/:public_id
// @desc    Delete image from Cloudinary
// @access  Private
router.delete('/:public_id', auth, async (req, res) => {
  try {
    const fullPublicId = `coachfutbol/ejercicios/${req.params.public_id}`;
    await cloudinary.uploader.destroy(fullPublicId);
    res.json({ msg: 'Image deleted' });
  } catch (err) {
    console.error('Cloudinary delete error:', err);
    res.status(500).json({ error: 'Error deleting image' });
  }
});

module.exports = router;
