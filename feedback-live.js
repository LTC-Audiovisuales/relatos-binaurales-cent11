(() => {
  const ENDPOINT = "https://script.google.com/macros/s/AKfycbzDKANE6sX_lb3fWSSOPxdzB10bAgJhtAB4w7zSnZWELLIXZpbBukbBv2spK2f3Ywrc/exec";
  const DRAFT_KEY = "relatos-binaurales-feedback-draft-v1";
  const SESSION_KEY = "relatos-binaurales-session-v1";

  function syncOpinionButton() {
    const button = document.getElementById("feedbackNavButton");
    if (!button) return;
    button.textContent = "DEJANOS TU OPINIÓN";
    button.setAttribute("aria-label", "Dejanos tu opinión sobre los relatos");
  }

  function syncLiveUI() {
    syncOpinionButton();

    const form = document.getElementById("feedbackForm");
    if (!form) return;

    const note = document.getElementById("feedbackModeNote");
    const liveText = "Las respuestas se enviarán de forma anónima y quedarán registradas para la muestra.";
    if (note && note.textContent !== liveText) note.textContent = liveText;

    const submit = form.querySelector('button[type="submit"]');
    if (submit && !submit.disabled && submit.textContent !== "ENVIAR DEVOLUCIONES") {
      submit.textContent = "ENVIAR DEVOLUCIONES";
    }
  }

  function getSessionId() {
    const urlSession = new URLSearchParams(location.search).get("s");
    if (urlSession) return urlSession;

    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2, 8).toUpperCase();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  function storyById(id) {
    return relatos.find(r => r.id === id);
  }

  function collectPayload(form) {
    const cards = [...form.querySelectorAll(".feedback-review-card[data-review-id]")];
    const responses = cards.map(card => {
      const id = card.dataset.reviewId;
      const story = storyById(id);
      const aspects = [...form.querySelectorAll(`input[name="aspect-${id}"]:checked`)].map(el => el.value);
      const rating = form.querySelector(`input[name="rating-${id}"]:checked`)?.value || "";
      const comment = form.querySelector(`[name="comment-${id}"]`)?.value.trim() || "";

      return {
        relatoId: id,
        titulo: story?.titulo || id,
        autor: story?.autor || "",
        aspectos: aspects,
        inmersion: rating ? Number(rating) : null,
        comentario: comment
      };
    });

    return {
      version: 1,
      sessionId: getSessionId(),
      fecha: new Date().toISOString(),
      favorito: form.querySelector("#favoriteStory")?.value || "",
      comentarioGeneral: form.querySelector("#generalComment")?.value.trim() || "",
      respuestas: responses
    };
  }

  function showSuccess() {
    const area = document.getElementById("feedbackFormArea");
    if (!area) return;

    area.innerHTML = `
      <div class="feedback-section feedback-success">
        <h3>Gracias por escuchar.</h3>
        <p>Tu devolución quedó registrada.</p>
        <div class="feedback-actions">
          <button class="feedback-button feedback-button--primary" id="liveSuccessBackButton" type="button">VOLVER A LOS RELATOS</button>
        </div>
      </div>
    `;

    document.getElementById("liveSuccessBackButton")?.addEventListener("click", () => {
      document.getElementById("homeButton")?.click();
    });

    area.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Actualiza la interfaz sólo cuando se crea el formulario, evitando el bucle de MutationObserver.
  document.addEventListener("click", event => {
    const button = event.target.closest("#writeFeedbackButton");
    if (!button) return;
    setTimeout(syncLiveUI, 0);
  });

  document.addEventListener("submit", async event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== "feedbackForm") return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const payload = collectPayload(form);
    if (!payload.respuestas.length) {
      alert("Seleccioná al menos un relato antes de enviar la devolución.");
      return;
    }

    const submit = form.querySelector('button[type="submit"]');
    if (submit) {
      submit.disabled = true;
      submit.textContent = "ENVIANDO…";
    }

    try {
      await fetch(ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });

      localStorage.removeItem(DRAFT_KEY);
      showSuccess();
    } catch (error) {
      console.error("No se pudo enviar la devolución", error);
      alert("No se pudo enviar la devolución. Revisá la conexión e intentá nuevamente.");
      if (submit) {
        submit.disabled = false;
        submit.textContent = "ENVIAR DEVOLUCIONES";
      }
    }
  }, true);

  syncLiveUI();
})();
