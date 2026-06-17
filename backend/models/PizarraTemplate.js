const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  elements: { type: Array, default: [] },
  preview: { type: String }, // base64 thumbnail
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PizarraTemplate', templateSchema);
