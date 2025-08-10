// html/matricule.js

const API_URL = "/api";

// Exemple : enregistrer une activité pour un agent
function enregistrerActivite(matricule, action, details) {
  fetch(`${API_URL}/activities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      matricule,
      action,
      details
    })
  })
  .then(res => res.json())
  .then(data => {
    // Optionnel : affichage retour
    if (data.success) {
      console.log("Activité enregistrée !");
    } else {
      console.warn("Erreur API :", data.message || data.error);
    }
  })
  .catch(err => console.error("Erreur réseau :", err));
}

// Exemple : récupérer l’historique d’un agent
function recupererHistorique(matricule, callback) {
  fetch(`${API_URL}/activities/${matricule}`)
    .then(res => res.json())
    .then(callback)
    .catch(err => console.error("Erreur API historique :", err));
}