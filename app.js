const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour lire le JSON reçu par Meta
app.use(bodyParser.json());

// Import du webhook principal
const handleWebhook = require('./routes/webhook');

// Route GET pour tester le serveur localement
app.get('/', (req, res) => {
  res.send('Bot WhatsApp actif');
});

// ✅ Routes WhatsApp : vérification + réception de messages
app.all('/webhook', handleWebhook); // gère GET (vérif Meta) + POST (messages)

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
});
