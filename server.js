// Import d'Express.js
const express = require("express");
const app = express();
const multer = require('multer');
const path = require('path');
// Définition du port
const port = 3001;

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

const mongoose = require("mongoose");

const mongoDBURI =
  "mongodb+srv://alexcode225:91EYbbNJxzDbYOPy@cluster0.jox7upi.mongodb.net/Taskify?retryWrites=true&w=majority"; // Remplace par ta chaîne de connexion MongoDB Atlas

mongoose.connect(mongoDBURI);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Erreur de connexion à MongoDB :"));
db.once("open", () => {
  console.log("Connecté à la base de données MongoDB");
});

// Schéma du modèle de tâches
const taskSchema = new mongoose.Schema({
    title: String,
    description: String,
    completed: Boolean,
    images: [String], // Utilise un tableau pour stocker plusieurs noms de fichiers
  });
  
// Modèle de tâches basé sur le schéma
const Task = mongoose.model('Task', taskSchema);

// Définir le stockage des images avec Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } }); // Limite la taille des fichiers à 5 Mo


// Middleware de log
app.use((req, res, next) => {
  console.log(`Requête reçue: ${req.method} ${req.url}`);
  next(); // Passe au prochain middleware ou à la route
});

// Route de base
app.get("/", (req, res) => {
  res.send("Bienvenue sur Taskify Backend !");
});

// Route pour récupérer toutes les tâches
app.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route pour créer une nouvelle tâche avec plusieurs images
app.post('/tasks', upload.array('images'), async (req, res) => {
  try {
    const images = req.files ? (Array.isArray(req.files) ? req.files : [req.files]) : [];

    const task = new Task({
      title: req.body.title,
      description: req.body.description,
      completed: req.body.completed === 'true' || req.body.completed === true || req.body.completed === 'on', // Ajout de cette condition
      images: images.map(file => `${req.protocol}://${req.get("host")}/uploads/${file.filename}`),
    });

    const newTask = await task.save();
    res.status(201).json(newTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route pour récupérer une tâche par son ID
app.get('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Tâche non trouvée" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Route pour mettre à jour une tâche
app.put('/tasks/:id', async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        description: req.body.description,
        completed: req.body.completed || false,
        images: req.files ? req.files.map(file => `${req.protocol}://${req.get("host")}/uploads/${file.filename}`) : [],
      },
      { new: true } // Retourne la version mise à jour de la tâche
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Tâche non trouvée" });
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route pour supprimer une tâche
app.delete('/tasks/:id', async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);

    if (!deletedTask) {
      return res.status(404).json({ message: "Tâche non trouvée" });
    }

    res.json({ message: "Tâche supprimée avec succès", deletedTask });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


  

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur en écoute sur le port ${port}`);
});
