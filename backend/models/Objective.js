const mongoose = require('mongoose');

const objectiveSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  category: { 
    type: String,
    enum: ['Técnico', 'Táctico', 'Físico', 'Psicológico', 'Otro'],
    default: 'Otro'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Objective', objectiveSchema);
