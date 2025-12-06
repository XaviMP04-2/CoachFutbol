const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' }); // Adjust path as needed
const Objective = require('../models/Objective');

const objectives = [
  // TÉCNICOS
  { name: 'Pase', category: 'Técnico' },
  { name: 'Control', category: 'Técnico' },
  { name: 'Conducción', category: 'Técnico' },
  { name: 'Regate', category: 'Técnico' },
  { name: 'Tiro', category: 'Técnico' },
  { name: 'Cabeceo', category: 'Técnico' },
  { name: 'Entrada', category: 'Técnico' },
  { name: 'Despeje', category: 'Técnico' },
  
  // TÁCTICOS
  { name: 'Posesión', category: 'Táctico' },
  { name: 'Presión', category: 'Táctico' },
  { name: 'Cobertura', category: 'Táctico' },
  { name: 'Desmarque', category: 'Táctico' },
  { name: 'Repliegue', category: 'Táctico' },
  { name: 'Contraataque', category: 'Táctico' },
  { name: 'Basculación', category: 'Táctico' },
  
  // FÍSICOS
  { name: 'Resistencia', category: 'Físico' },
  { name: 'Velocidad', category: 'Físico' },
  { name: 'Fuerza', category: 'Físico' },
  { name: 'Agilidad', category: 'Físico' },
  { name: 'Coordinación', category: 'Físico' },
  
  // PSICOLÓGICOS
  { name: 'Concentración', category: 'Psicológico' },
  { name: 'Motivación', category: 'Psicológico' },
  { name: 'Comunicación', category: 'Psicológico' }
];

const seedObjectives = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    for (const obj of objectives) {
      const exists = await Objective.findOne({ name: obj.name });
      if (!exists) {
        await Objective.create(obj);
        console.log(`Created objective: ${obj.name}`);
      } else {
        console.log(`Objective already exists: ${obj.name}`);
      }
    }

    console.log('Seeding completed');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedObjectives();
