const express = require('express');
const router = express.Router();
const PizarraTemplate = require('../models/PizarraTemplate');
const auth = require('../middleware/auth');

// GET user's templates (without elements for list view)
router.get('/', auth, async (req, res) => {
  try {
    const templates = await PizarraTemplate.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select('name preview createdAt');
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener plantillas' });
  }
});

// GET single template with full elements
router.get('/:id', auth, async (req, res) => {
  try {
    const template = await PizarraTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ error: 'Plantilla no encontrada' });
    if (template.userId.toString() !== req.user.id) return res.status(401).json({ error: 'No autorizado' });
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

// POST create template
router.post('/', auth, async (req, res) => {
  try {
    const { name, elements, preview } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });

    const template = new PizarraTemplate({
      name: name.trim(),
      elements: elements || [],
      preview,
      userId: req.user.id
    });
    await template.save();
    res.status(201).json({ _id: template._id, name: template.name, preview: template.preview, createdAt: template.createdAt });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar plantilla' });
  }
});

// DELETE template
router.delete('/:id', auth, async (req, res) => {
  try {
    const template = await PizarraTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ error: 'Plantilla no encontrada' });
    if (template.userId.toString() !== req.user.id) return res.status(401).json({ error: 'No autorizado' });

    await PizarraTemplate.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Plantilla eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar plantilla' });
  }
});

module.exports = router;
