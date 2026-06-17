const mongoose = require('mongoose');
const crypto = require('crypto');

const sessionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  exercises: [{
    exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ejercicio' },
    duration: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    notes: { type: String, default: '' }
  }],
  shareToken: {
    type: String,
    default: () => crypto.randomBytes(16).toString('hex'),
    unique: true
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', sessionSchema);
