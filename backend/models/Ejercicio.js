const mongoose = require('mongoose');

const ejercicioSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String },
  tipo: { type: String, required: true },
  objetivos: [String],  // ["Velocidad", "Pase"]
  edadRecomendada: { type: String },
  dificultad: { type: String },
  duracion: { type: String },
  material: [String],  // ["Conos", "Balones"]
  numeroJugadores: { type: Number },
  archivoUrl: { type: String }, // imagen base64
  autor: { type: String, required: true }
});

module.exports = mongoose.model('Ejercicio', ejercicioSchema);
