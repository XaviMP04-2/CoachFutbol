const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Folder = require('../models/Folder');
const Ejercicio = require('../models/Ejercicio');

// @route   POST api/folders
// @desc    Create a new folder
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const newFolder = new Folder({
      name,
      userId: req.user.id
    });
    const folder = await newFolder.save();
    res.json(folder);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/folders
// @desc    Get all folders for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const folders = await Folder.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(folders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/folders/:id
// @desc    Delete folder (and move exercises to root?)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ msg: 'Folder not found' });
    if (folder.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Optional: Move exercises out of folder or delete them? 
    // For now, just unset the folderId
    await Ejercicio.updateMany({ folderId: req.params.id }, { $set: { folderId: null } });

    await folder.deleteOne();
    res.json({ msg: 'Folder removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
