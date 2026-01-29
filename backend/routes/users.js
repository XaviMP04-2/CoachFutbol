const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');
const Ejercicio = require('../models/Ejercicio');
const auth = require('../middleware/auth');

// @route   GET api/users/:username
// @desc    Get public profile of user
// @access  Public
router.get('/:username', async (req, res) => {
  try {
    const user = await Usuario.findOne({ username: req.params.username })
      .select('username bio followers following createdAt');
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Count exercises
    const exerciseCount = await Ejercicio.countDocuments({ 
      autor: req.params.username,
      status: 'approved'
    });

    res.json({
      username: user.username,
      bio: user.bio || '',
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      exerciseCount,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/:username/exercises
// @desc    Get public exercises by author
// @access  Public
router.get('/:username/exercises', async (req, res) => {
  try {
    const exercises = await Ejercicio.find({ 
      autor: req.params.username,
      status: 'approved'
    }).sort({ createdAt: -1 });
    
    res.json(exercises);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/users/:username/follow
// @desc    Follow or unfollow a user
// @access  Private
router.post('/:username/follow', auth, async (req, res) => {
  try {
    const targetUser = await Usuario.findOne({ username: req.params.username });
    const currentUser = await Usuario.findById(req.user.id);

    if (!targetUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Can't follow yourself
    if (targetUser._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({ error: 'No puedes seguirte a ti mismo' });
    }

    const isFollowing = currentUser.following.includes(targetUser._id);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(
        id => id.toString() !== targetUser._id.toString()
      );
      targetUser.followers = targetUser.followers.filter(
        id => id.toString() !== currentUser._id.toString()
      );
    } else {
      // Follow
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(currentUser._id);
    }

    await currentUser.save();
    await targetUser.save();

    res.json({
      isFollowing: !isFollowing,
      followersCount: targetUser.followers.length
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/:username/followers
// @desc    Get followers list
// @access  Public
router.get('/:username/followers', async (req, res) => {
  try {
    const user = await Usuario.findOne({ username: req.params.username })
      .populate('followers', 'username');
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user.followers || []);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/:username/following
// @desc    Get following list
// @access  Public
router.get('/:username/following', async (req, res) => {
  try {
    const user = await Usuario.findOne({ username: req.params.username })
      .populate('following', 'username');
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user.following || []);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/:username/is-following
// @desc    Check if current user follows target user
// @access  Private
router.get('/:username/is-following', auth, async (req, res) => {
  try {
    const currentUser = await Usuario.findById(req.user.id);
    const targetUser = await Usuario.findOne({ username: req.params.username });

    if (!targetUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isFollowing = currentUser.following.includes(targetUser._id);
    res.json({ isFollowing });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
