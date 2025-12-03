const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const Usuario = require('./models/Usuario');
const Ejercicio = require('./models/Ejercicio');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // 1. Create Default Admin User if not exists
    let admin = await Usuario.findOne({ email: 'admin@coachfutbol.com' });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      admin = new Usuario({
        username: 'Admin',
        email: 'admin@coachfutbol.com',
        password: hashedPassword,
        isAdmin: true,
        isVerified: true
      });
      await admin.save();
      console.log('Admin user created');
    } else {
      console.log('Admin user already exists');
    }

    // 2. Update all exercises without userId or status
    const exercises = await Ejercicio.find({});
    console.log(`Found ${exercises.length} exercises`);

    let updatedCount = 0;
    for (const ex of exercises) {
      let needsUpdate = false;

      if (!ex.userId) {
        ex.userId = admin._id;
        needsUpdate = true;
      }
      if (!ex.status) {
        ex.status = 'approved';
        needsUpdate = true;
      }

      if (needsUpdate) {
        await ex.save();
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} exercises`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

migrate();
