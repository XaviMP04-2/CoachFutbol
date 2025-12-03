const express = require("express");
const router = express.Router();
const Ejercicio = require("../models/Ejercicio");
const auth = require("../middleware/auth");

// @route   GET api/ejercicios
// @desc    Get all APPROVED exercises (Public)
// @access  Public
router.get("/", async (req, res) => {
  try {
    const ejercicios = await Ejercicio.find({ status: 'approved' }).sort({ createdAt: -1 });
    res.json(ejercicios);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error al obtener los ejercicios" });
  }
});

// @route   GET api/ejercicios/my-space
// @desc    Get logged in user's exercises (Private & Pending & Approved)
// @access  Private
router.get("/my-space", auth, async (req, res) => {
  try {
    const ejercicios = await Ejercicio.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(ejercicios);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error al obtener tus ejercicios" });
  }
});

// @route   GET api/ejercicios/:id
// @desc    Get exercise by ID
// @access  Public (but might need check if private and not owner)
router.get("/:id", async (req, res) => {
  try {
    const ejercicio = await Ejercicio.findById(req.params.id);
    if (!ejercicio) {
      return res.status(404).json({ error: "Ejercicio no encontrado" });
    }
    
    // Optional: Check visibility if private
    // For now, we allow viewing if you have the ID (link sharing), 
    // or we could restrict it. Let's keep it simple for now.
    
    res.json(ejercicio);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener el ejercicio" });
  }
});

// @route   POST api/ejercicios
// @desc    Create a new exercise
// @access  Private
router.post("/", auth, async (req, res) => {
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
    autor,
    isPublic // Frontend can send this flag
  } = req.body;

  if (!titulo || !tipo || !autor) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
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
      autor,
      userId: req.user.id, // Set from token
      status: isPublic ? 'pending' : 'private' // Default logic
    });

    const guardado = await nuevoEjercicio.save();
    res.status(201).json(guardado);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error al guardar el ejercicio" });
  }
});

// @route   PUT api/ejercicios/:id
// @desc    Update exercise
// @access  Private
router.put("/:id", auth, async (req, res) => {
  try {
    let ejercicio = await Ejercicio.findById(req.params.id);

    if (!ejercicio) return res.status(404).json({ msg: 'Ejercicio no encontrado' });

    // Make sure user owns exercise
    if (ejercicio.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'No autorizado' });
    }

    ejercicio = await Ejercicio.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(ejercicio);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/ejercicios/:id
// @desc    Delete exercise
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    let ejercicio = await Ejercicio.findById(req.params.id);

    if (!ejercicio) return res.status(404).json({ msg: 'Ejercicio no encontrado' });

    // Make sure user owns exercise
    if (ejercicio.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'No autorizado' });
    }

    await Ejercicio.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Ejercicio eliminado' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/ejercicios/admin/pending
// @desc    Get pending exercises
// @access  Private (Admin)
router.get("/admin/pending", auth, async (req, res) => {
  try {
    // In a real app, check if req.user.isAdmin
    const ejercicios = await Ejercicio.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(ejercicios);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/ejercicios/admin/approve/:id
// @desc    Approve exercise
// @access  Private (Admin)
router.put("/admin/approve/:id", auth, async (req, res) => {
  try {
    await Ejercicio.findByIdAndUpdate(req.params.id, { status: 'approved' });
    res.json({ msg: 'Ejercicio aprobado' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/ejercicios/:id/move
// @desc    Move exercise to folder
// @access  Private
router.put('/:id/move', auth, async (req, res) => {
  try {
    const { folderId } = req.body; // null for root, or ObjectId
    let exercise = await Ejercicio.findById(req.params.id);
    if (!exercise) return res.status(404).json({ msg: 'Exercise not found' });
    if (exercise.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    exercise.folderId = folderId;
    await exercise.save();
    res.json(exercise);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
