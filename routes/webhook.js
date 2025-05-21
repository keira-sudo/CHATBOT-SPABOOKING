const axios = require('axios');

const token = process.env.WHATSAPP_TOKEN;
const phone_number_id = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const sessions = {}; // mémoire simple par numéro

module.exports = async (req, res) => {
  // Réception de messages WhatsApp
  if (req.method === 'POST') {
    const body = req.body;
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const from = message?.from;
    const msg_body = message?.text?.body?.trim();

    if (msg_body && from) {
      // Crée une session utilisateur si elle n'existe pas
      if (!sessions[from]) {
        sessions[from] = { step: 1 };
      }

      let reply = "❌ Réponse non comprise. Réponds par 1 ou 2.";

      // Étape 1 : première question
      if (sessions[from].step === 1) {
        reply = `👋 Bonjour ! Merci d'avoir contacté SpaBooking,\nÊtes-vous :\n1. Un client particulier\n2. Un propriétaire d'institut de beauté ?`;
        sessions[from].step = 2;
      }

      // Étape 2 : choix de profil
      else if (sessions[from].step === 2) {
        if (msg_body === '1') {
          reply = "🧖 Merci ! Nous proposons des soins adaptés. Souhaitez-vous recevoir nos offres ?";
          sessions[from].step = 3;
        } else if (msg_body === '2') {
          reply = "🏢 Parfait ! Nous accompagnons les professionnels. Souhaitez-vous être contacté par un conseiller ?";
          sessions[from].step = 3;
        }
      }

      // (Exemple) Étape 3 : réponse suivante (ajoute d'autres suites si besoin)
      else if (sessions[from].step === 3) {
        reply = "Merci pour votre réponse ! Un membre de notre équipe vous contactera bientôt. 😊";
        sessions[from].step = 1; // reset si nécessaire
      }

      // Envoie la réponse via l'API WhatsApp
      try {
        await axios.post(`https://graph.facebook.com/v20.0/${phone_number_id}/messages`, {
          messaging_product: 'whatsapp',
          to: from,
          text: { body: reply }
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Réponse envoyée à', from);
      } catch (error) {
        console.error('❌ Erreur d’envoi :', error?.response?.data || error.message);
      }
    }

    res.sendStatus(200);
  }

  // Vérification du webhook par Meta (GET)
  else if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Vérification webhook réussie');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }

  // Fallback si autre méthode
  else {
    res.send('✅ Webhook en ligne');
  }
};
