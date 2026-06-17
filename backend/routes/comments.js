const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

// GET all comments for an exercise
router.get('/:exerciseId', async (req, res) => {
  try {
    const comments = await Comment.find({ exerciseId: req.params.exerciseId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
});

// POST a new comment
router.post('/:exerciseId', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'El comentario no puede estar vacío' });

    const comment = new Comment({
      exerciseId: req.params.exerciseId,
      userId: req.user.id,
      username: req.user.username,
      text: text.trim()
    });
    await comment.save();
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar comentario' });
  }
});

// DELETE a comment (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comentario no encontrado' });
    if (comment.userId.toString() !== req.user.id) return res.status(401).json({ error: 'No autorizado' });

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Comentario eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar comentario' });
  }
});

module.exports = router;
