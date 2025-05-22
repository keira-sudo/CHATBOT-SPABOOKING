const axios = require('axios');

const token = process.env.WHATSAPP_TOKEN;
const phone_number_id = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const sessions = {}; // mémoire simple par numéro

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const body = req.body;

    // 🔍 Log complet du webhook entrant
    console.log('📩 Webhook reçu :', JSON.stringify(body, null, 2));

    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    // 🚫 Si pas de message (ex. : statut de livraison), on ignore
    if (!message) {
      console.log('ℹ️ Aucun message utilisateur détecté.');
      res.sendStatus(200);
      return;
    }

    const from = message?.from;
    const msg_body = message?.text?.body?.trim();

    if (msg_body && from) {
      // 🔄 Initialiser la session utilisateur si nécessaire
      if (!sessions[from]) {
        sessions[from] = { step: 1 };
      }

      let reply = "❌ Réponse non comprise. Réponds par 1 ou 2.";

      // 👣 Étape 1
      if (sessions[from].step === 1) {
        reply = `👋 Bonjour ! Merci d'avoir contacté SpaBooking,\nÊtes-vous :\n1. Un client particulier\n2. Un propriétaire d'institut de beauté\n`;
        sessions[from].step = 2;
      }

      // 👣 Étape 2
      else if (sessions[from].step === 2) {
        if (msg_body === '1') {
          reply = "🧖 Merci ! Nous proposons des soins adaptés. Souhaitez-vous recevoir nos offres ?";
          sessions[from].step = 3;
        } else if (msg_body === '2') {
          reply = "🏢 Parfait ! Nous accompagnons les professionnels. Souhaitez-vous être contacté par un conseiller ?";
          sessions[from].step = 3;
        }
      }

      // 👣 Étape 3
      else if (sessions[from].step === 3) {
        reply = "✅ Merci pour votre réponse ! Un membre de notre équipe vous contactera bientôt. 😊";
        sessions[from].step = 1; // reset si nécessaire
      }

      // ✉️ Envoi de la réponse
      try {
        await axios.post(
          `https://graph.facebook.com/v20.0/${phone_number_id}/messages`,
          {
            messaging_product: 'whatsapp',
            to: from,
            text: { body: reply }
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('✅ Réponse envoyée à', from, ':', reply);
      } catch (error) {
        console.error('❌ Erreur lors de l’envoi :', error?.response?.data || error.message);
      }
    }

    res.sendStatus(200);
    return;
  }

  // 🔐 Vérification du webhook Meta
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
    return;
  }

  // 🧭 Pour autres requêtes (tests manuels)
  res.send('✅ Webhook actif');
};
