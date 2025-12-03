const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5501;

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/ejercicios', require('./routes/ejercicios'));
app.use('/api/folders', require('./routes/folders'));

const path = require("path");
// Serve static files if needed, or just API for now
// app.use(express.static(path.join(__dirname, "frontend")));

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Conectado a MongoDB");
    app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
  })
  .catch((err) => console.error("Error conectando a MongoDB:", err));
