// logger.js
(function () {
  // � Récupère ou crée un ID unique pour cette session navigateur
  if (!localStorage.getItem("session_id")) {
    localStorage.setItem("session_id", Date.now() + "-" + Math.random().toString(36).substr(2, 9));
  }
  const SESSION_ID = localStorage.getItem("session_id");

  // � Récupère ou simule les infos agent
  let agent = JSON.parse(localStorage.getItem("agent") || "null");
  if (!agent || !agent.matricule || !agent.service) {
    agent = {
      matricule: "SIMU1234",
      nom: "Simulation Agent",
      service: "Simulation"
    };
    localStorage.setItem("agent", JSON.stringify(agent));
  }

  /**
   * � Fonction de log universelle
   * @param {string} eventType - Type d'évènement (login_success, quiz_submit, etc.)
   * @param {object} data - Données additionnelles (page, element, score, etc.)
   */
  window.logEvent = function (eventType, data = {}) {
    const payload = {
      matricule: agent.matricule,
      nom: agent.nom || null,
      service: agent.service || null,
      event_type: eventType,
      page: data.page || window.location.pathname,
      element: data.element || null,
      duration_ms: data.duration_ms || null,
      score: data.score || null,
      attempt: data.attempt || null,
      video_position_ms: data.video_position_ms || null,
      extra: data.extra || null,
      ip_address: null, // récupéré côté serveur si besoin
      user_agent: navigator.userAgent,
      session_id: SESSION_ID
    };

    fetch(window.location.origin + "/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(err => console.error("Erreur logEvent:", err));
  };

  // � Log automatique de la visite de page
  document.addEventListener("DOMContentLoaded", () => {
    logEvent("page_view", { page: window.location.pathname });
  });
})();

