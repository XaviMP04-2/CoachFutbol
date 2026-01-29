/**
 * Script para migrar imágenes Base64 existentes a Cloudinary
 * 
 * Uso: node scripts/migrate-images-to-cloudinary.js
 * 
 * Este script:
 * 1. Busca ejercicios con imágenes Base64 (empiezan con "data:image")
 * 2. Las sube a Cloudinary
 * 3. Actualiza el ejercicio con la URL de Cloudinary
 * 
 * Es seguro ejecutar múltiples veces - solo procesa las que aún son Base64
 */

require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Ejercicio = require('../models/Ejercicio');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function migrateImages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Conectado a MongoDB');

    // Find exercises with Base64 images
    const ejercicios = await Ejercicio.find({
      archivoUrl: { $regex: /^data:image/ }
    });

    console.log(`\n📦 Encontrados ${ejercicios.length} ejercicios con imágenes Base64\n`);

    if (ejercicios.length === 0) {
      console.log('✨ ¡Todas las imágenes ya están en Cloudinary!');
      process.exit(0);
    }

    let migrated = 0;
    let failed = 0;

    for (const ejercicio of ejercicios) {
      try {
        console.log(`⏳ Migrando: "${ejercicio.titulo}" (${ejercicio._id})`);
        
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(ejercicio.archivoUrl, {
          folder: 'coachfutbol/ejercicios',
          resource_type: 'image',
          transformation: [
            { width: 1200, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ]
        });

        // Update exercise with Cloudinary URL
        await Ejercicio.findByIdAndUpdate(ejercicio._id, {
          archivoUrl: result.secure_url
        });

        console.log(`   ✅ Migrado → ${result.secure_url.substring(0, 60)}...`);
        migrated++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
        failed++;
      }
    }

    console.log('\n========================================');
    console.log(`✅ Migrados: ${migrated}`);
    console.log(`❌ Fallidos: ${failed}`);
    console.log('========================================\n');

    process.exit(0);

  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

migrateImages();
