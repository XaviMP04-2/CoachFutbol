const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const auth = require('../middleware/auth');

// GET user's sessions
router.get('/', auth, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener sesiones' });
  }
});

// GET public session by share token (no auth required)
router.get('/public/:token', async (req, res) => {
  try {
    const session = await Session.findOne({ shareToken: req.params.token })
      .populate('exercises.exerciseId');
    if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// GET session by ID (owner only, with populated exercises)
router.get('/:id', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('exercises.exerciseId');
    if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });
    if (session.userId.toString() !== req.user.id) return res.status(401).json({ error: 'No autorizado' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// POST create session
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });

    const session = new Session({ name: name.trim(), description, userId: req.user.id });
    await session.save();
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear sesión' });
  }
});

// PUT update session (name, description, full exercise list reorder)
router.put('/:id', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });
    if (session.userId.toString() !== req.user.id) return res.status(401).json({ error: 'No autorizado' });

    const { name, description, exercises } = req.body;
    if (name) session.name = name.trim();
    if (description !== undefined) session.description = description;
    if (exercises !== undefined) session.exercises = exercises;

    await session.save();
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar sesión' });
  }
});

// DELETE session
router.delete('/:id', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });
    if (session.userId.toString() !== req.user.id) return res.status(401).json({ error: 'No autorizado' });

    await Session.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Sesión eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar sesión' });
  }
});

// POST add exercise to session
router.post('/:id/exercises', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });
    if (session.userId.toString() !== req.user.id) return res.status(401).json({ error: 'No autorizado' });

    const { exerciseId, duration, notes } = req.body;
    if (!exerciseId) return res.status(400).json({ error: 'exerciseId requerido' });

    const alreadyIn = session.exercises.some(e => e.exerciseId.toString() === exerciseId);
    if (alreadyIn) return res.status(400).json({ error: 'El ejercicio ya está en la sesión' });

    session.exercises.push({ exerciseId, duration: duration || 0, order: session.exercises.length, notes: notes || '' });
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// DELETE remove exercise from session
router.delete('/:id/exercises/:exerciseId', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });
    if (session.userId.toString() !== req.user.id) return res.status(401).json({ error: 'No autorizado' });

    session.exercises = session.exercises.filter(e => e.exerciseId.toString() !== req.params.exerciseId);
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

module.exports = router;
