const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const auth = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if username already exists
    let existingUser = await Usuario.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ msg: 'El nombre de usuario ya está en uso' });
    }

    // Check if email already exists
    existingUser = await Usuario.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'El correo electrónico ya está registrado' });
    }

    const user = new Usuario({
      username,
      email,
      password
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Mock Email Verification for now (auto-verify or generate token)
    // In production, use nodemailer to send this token
    const verificationToken = jwt.sign(
        { email }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1d' }
    );
    user.verificationToken = verificationToken;

    await user.save();

    // Return token for immediate login or message to check email
    // For this MVP, we'll return the token to simulate auto-login or easy verification
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({ token, msg: 'Registro exitoso' });
      }
    );
  } catch (err) {
    console.error(err.message);
    // Handle MongoDB duplicate key errors
    if (err.code === 11000) {
      if (err.keyPattern?.username) {
        return res.status(400).json({ msg: 'El nombre de usuario ya está en uso' });
      }
      if (err.keyPattern?.email) {
        return res.status(400).json({ msg: 'El correo electrónico ya está registrado' });
      }
    }
    res.status(500).json({ msg: 'Error del servidor. Inténtalo de nuevo.' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await Usuario.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/user
// @desc    Get logged in user
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const user = await Usuario.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/favorites/:exerciseId
// @desc    Toggle favorite (add/remove)
// @access  Private
router.post('/favorites/:exerciseId', auth, async (req, res) => {
  try {
    const user = await Usuario.findById(req.user.id);
    const exerciseId = req.params.exerciseId;
    
    const index = user.favorites.indexOf(exerciseId);
    
    if (index === -1) {
      // Add to favorites
      user.favorites.push(exerciseId);
      await user.save();
      res.json({ isFavorite: true, favorites: user.favorites });
    } else {
      // Remove from favorites
      user.favorites.splice(index, 1);
      await user.save();
      res.json({ isFavorite: false, favorites: user.favorites });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/auth/favorites
// @desc    Get user's favorite exercises (populated)
// @access  Private
router.get('/favorites', auth, async (req, res) => {
  try {
    const user = await Usuario.findById(req.user.id).populate('favorites');
    res.json(user.favorites || []);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/auth/favorites/ids
// @desc    Get user's favorite exercise IDs only
// @access  Private
router.get('/favorites/ids', auth, async (req, res) => {
  try {
    const user = await Usuario.findById(req.user.id).select('favorites');
    res.json(user.favorites || []);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

