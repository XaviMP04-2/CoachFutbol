const express = require('express');
const router = express.Router();
const Objective = require('../models/Objective');
const auth = require('../middleware/auth'); // Assuming you have auth middleware

// @route   GET api/objectives
// @desc    Get all objectives
// @access  Public (or Private depending on needs, usually Public for selection)
router.get('/', async (req, res) => {
  try {
    const objectives = await Objective.find().sort({ name: 1 });
    res.json(objectives);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/objectives
// @desc    Create a new objective
// @access  Private (Admin only ideally, but for now just auth)
router.post('/', auth, async (req, res) => {
  const { name, category } = req.body;

  try {
    let objective = await Objective.findOne({ name });

    if (objective) {
      return res.status(400).json({ msg: 'Objective already exists' });
    }

    objective = new Objective({
      name,
      category
    });

    await objective.save();
    res.json(objective);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
