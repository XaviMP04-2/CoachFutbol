const express = require('express');
const router = express.Router();
const Ejercicio = require('../models/Ejercicio');

router.post('/', async (req, res) => {
  const {
    titulo,
    descripcion,
    tipo,
    objetivos,
    edadRecomendada,
    dificultad,
    duracion,
    material,
    numeroJugadores,
    archivoUrl,
    autor
  } = req.body;

  if (!titulo || !tipo || !autor) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const nuevoEjercicio = new Ejercicio({
    titulo,
    descripcion,
    tipo,
    objetivos,
    edadRecomendada,
    dificultad,
    duracion,
    material,
    numeroJugadores,
    archivoUrl,
    autor
  });

  try {
    const guardado = await nuevoEjercicio.save();
    res.status(201).json(guardado);
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar el ejercicio' });
  }
});
// GET - Obtener todos los ejercicios
router.get('/', async (req, res) => {
  try {
    const ejercicios = await Ejercicio.find();
    res.json(ejercicios);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener los ejercicios' });
  }
});


// GET - Obtener un ejercicio por ID
router.get('/:id', async (req, res) => {
  try {
    const ejercicio = await Ejercicio.findById(req.params.id);
    if (!ejercicio) {
      return res.status(404).json({ error: 'Ejercicio no encontrado' });
    }
    res.json(ejercicio);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener el ejercicio' });
  }
});

module.exports = router;
