(() => {
  const FEEDBACK_ENDPOINT = ""; // Se conectará después al Web App de Google Apps Script.
  const LISTENED_KEY = "relatos-binaurales-listened-v1";
  const DRAFT_KEY = "relatos-binaurales-feedback-draft-v1";
  const SESSION_KEY = "relatos-binaurales-session-v1";
  const LISTEN_THRESHOLD_SECONDS = 30;
  const ASPECTS = [
    "Historia",
    "Voces / actuaciones",
    "Ambientes",
    "Efectos sonoros",
    "Espacialización binaural",
    "Música",
    "Atmósfera"
  ];

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "feedback.css";
  document.head.appendChild(css);

  const parseStoredArray = (key) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };

  const validIds = new Set(relatos.map(r => r.id));
  const listened = new Set(parseStoredArray(LISTENED_KEY).filter(id => validIds.has(id)));
  const listenedSeconds = {};
  let listenTimer = null;

  const getRequestedIds = () => {
    const raw = new URLSearchParams(location.search).get("review") || "";
    return raw.split(",").map(v => v.trim()).filter(id => validIds.has(id));
  };

  const getSessionId = () => {
    const fromUrl = new URLSearchParams(location.search).get("s");
    if (fromUrl) {
      sessionStorage.setItem(SESSION_KEY, fromUrl);
      return fromUrl;
    }

    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2, 8).toUpperCase();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  };

  const sessionId = getSessionId();

  const feedbackButton = document.createElement("button");
  feedbackButton.className = "feedback-nav-button";
  feedbackButton.id = "feedbackNavButton";
  feedbackButton.type = "button";
  feedbackButton.innerHTML = `DEVOLUCIONES <span class="feedback-nav-button__count" id="feedbackCount">0</span>`;

  const topbarRight = document.querySelector(".topbar__right");
  if (topbarRight) topbarRight.prepend(feedbackButton);

  const feedbackView = document.createElement("section");
  feedbackView.className = "feedback-view";
  feedbackView.id = "feedbackView";
  feedbackView.hidden = true;
  site.appendChild(feedbackView);

  function updateCount() {
    const count = document.getElementById("feedbackCount");
    if (count) count.textContent = String(listened.size);
  }

  function saveListened() {
    localStorage.setItem(LISTENED_KEY, JSON.stringify([...listened]));
    updateCount();
  }

  function markListened(id) {
    if (!validIds.has(id)) return;
    listened.add(id);
    saveListened();
  }

  function beginListenTracking() {
    clearInterval(listenTimer);
    if (!currentStory || audio.paused) return;
    const id = currentStory.id;
    listenedSeconds[id] = listenedSeconds[id] || 0;

    listenTimer = setInterval(() => {
      if (audio.paused || !currentStory || currentStory.id !== id) return;
      listenedSeconds[id] += 1;
      if (listenedSeconds[id] >= LISTEN_THRESHOLD_SECONDS) {
        markListened(id);
        clearInterval(listenTimer);
      }
    }, 1000);
  }

  audio.addEventListener("play", beginListenTracking);
  audio.addEventListener("pause", () => clearInterval(listenTimer));
  audio.addEventListener("ended", () => {
    clearInterval(listenTimer);
    if (currentStory) markListened(currentStory.id);
  });

  function hideFeedback() {
    feedbackView.hidden = true;
  }

  homeButton.addEventListener("click", hideFeedback);
  backButton.addEventListener("click", hideFeedback);

  function storyById(id) {
    return relatos.find(r => r.id === id);
  }

  function getInitialSelection() {
    const requested = getRequestedIds();
    if (requested.length) return requested;
    return [...listened];
  }

  function transferUrl(ids) {
    const url = new URL(location.href);
    url.search = "";
    url.hash = "devoluciones";
    url.searchParams.set("review", ids.join(","));
    url.searchParams.set("s", sessionId);
    return url.toString();
  }

  function openFeedback(preselected = null) {
    stopAudio();
    storyView.hidden = true;
    galleryView.hidden = true;
    activeAuthor.hidden = true;
    activeAuthor.textContent = "";
    feedbackView.hidden = false;

    const selected = Array.isArray(preselected) ? preselected : getInitialSelection();
    renderFeedback(selected);
    history.replaceState(null, "", `${location.pathname}${location.search}#devoluciones`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  feedbackButton.addEventListener("click", () => openFeedback());

  function feedbackChoiceMarkup(r, selected) {
    return `
      <label class="feedback-story-choice ${selected ? "is-selected" : ""}">
        <img src="${r.portada}" alt="">
        <span>
          <strong>${escapeHTML(r.titulo)}</strong>
          <small>${escapeHTML(r.autor)}</small>
        </span>
        <input type="checkbox" data-feedback-story="${r.id}" ${selected ? "checked" : ""} aria-label="Seleccionar ${escapeHTML(r.titulo)}">
      </label>
    `;
  }

  function renderFeedback(selectedIds = []) {
    const selected = new Set(selectedIds.filter(id => validIds.has(id)));

    feedbackView.innerHTML = `
      <div class="feedback-heading">
        <p class="eyebrow">DEVOLUCIONES DE LA MUESTRA</p>
        <h2>¿Qué escuchaste?</h2>
        <p>Podés dejar una devolución de uno o varios relatos. Si venís desde la tablet, los relatos escuchados aparecen seleccionados automáticamente.</p>
      </div>

      <div class="feedback-section">
        <h3 class="feedback-section__title">Seleccioná los relatos que querés comentar</h3>
        <div class="feedback-story-selector">
          ${relatos.map(r => feedbackChoiceMarkup(r, selected.has(r.id))).join("")}
        </div>

        <div class="feedback-actions">
          <button class="feedback-button feedback-button--primary" id="writeFeedbackButton" type="button">ESCRIBIR DEVOLUCIONES</button>
          <button class="feedback-button" id="transferFeedbackButton" type="button">CONTINUAR EN MI CELULAR</button>
          <button class="feedback-button feedback-button--quiet" id="returnToGalleryButton" type="button">VOLVER A LOS RELATOS</button>
        </div>

        <div class="feedback-transfer" id="feedbackTransfer" hidden></div>
      </div>

      <div id="feedbackFormArea"></div>
    `;

    const selector = feedbackView.querySelector(".feedback-story-selector");
    selector.addEventListener("change", e => {
      const checkbox = e.target.closest("[data-feedback-story]");
      if (!checkbox) return;
      checkbox.closest(".feedback-story-choice").classList.toggle("is-selected", checkbox.checked);
    });

    document.getElementById("writeFeedbackButton").addEventListener("click", () => {
      const ids = getSelectedIdsFromView();
      if (!ids.length) {
        alert("Seleccioná al menos un relato.");
        return;
      }
      renderReviewForms(ids);
    });

    document.getElementById("transferFeedbackButton").addEventListener("click", showTransferPanel);
    document.getElementById("returnToGalleryButton").addEventListener("click", () => {
      hideFeedback();
      showGallery();
    });
  }

  function getSelectedIdsFromView() {
    return [...feedbackView.querySelectorAll("[data-feedback-story]:checked")].map(el => el.dataset.feedbackStory);
  }

  function showTransferPanel() {
    const ids = getSelectedIdsFromView();
    if (!ids.length) {
      alert("Seleccioná al menos un relato para llevar la devolución al celular.");
      return;
    }

    const panel = document.getElementById("feedbackTransfer");
    const url = transferUrl(ids);
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(url)}`;

    panel.innerHTML = `
      <img src="${qrSrc}" alt="QR para continuar la devolución en el celular">
      <div>
        <h3>Seguí desde tu celular</h3>
        <p>Escaneá este QR. Se abrirán directamente los relatos que seleccionaste para que puedas dejar las devoluciones ahora o más tarde.</p>
        <button class="feedback-button" id="copyFeedbackLink" type="button">COPIAR LINK</button>
        <p class="feedback-transfer__url">${escapeHTML(url)}</p>
      </div>
    `;
    panel.hidden = false;

    document.getElementById("copyFeedbackLink").addEventListener("click", async e => {
      try {
        await navigator.clipboard.writeText(url);
        e.currentTarget.textContent = "LINK COPIADO";
      } catch {
        prompt("Copiá este enlace:", url);
      }
    });
  }

  function aspectMarkup(storyId) {
    return ASPECTS.map(aspect => `
      <label class="feedback-chip">
        <input type="checkbox" name="aspect-${storyId}" value="${escapeHTML(aspect)}">
        <span>${escapeHTML(aspect)}</span>
      </label>
    `).join("");
  }

  function ratingMarkup(storyId) {
    return [1,2,3,4,5].map(value => `
      <label>
        <input type="radio" name="rating-${storyId}" value="${value}">
        <span>${value}</span>
      </label>
    `).join("");
  }

  function renderReviewForms(ids) {
    const area = document.getElementById("feedbackFormArea");
    const selectedStories = ids.map(storyById).filter(Boolean);

    area.innerHTML = `
      <div class="feedback-section">
        <h3 class="feedback-section__title">Tu devolución</h3>
        <form id="feedbackForm">
          <div class="feedback-review-list">
            ${selectedStories.map(r => `
              <article class="feedback-review-card" data-review-id="${r.id}">
                <div class="feedback-review-card__head">
                  <img src="${r.portada}" alt="">
                  <div>
                    <h3>${escapeHTML(r.titulo)}</h3>
                    <p>${escapeHTML(r.autor)}</p>
                  </div>
                </div>

                <div class="feedback-question">
                  <span class="feedback-question__label">¿Qué aspectos te gustaron especialmente?</span>
                  <div class="feedback-chip-group">${aspectMarkup(r.id)}</div>
                </div>

                <div class="feedback-question">
                  <span class="feedback-question__label">¿Qué tan inmersiva te resultó la experiencia?</span>
                  <div class="feedback-rating">${ratingMarkup(r.id)}</div>
                </div>

                <div class="feedback-question">
                  <label for="comment-${r.id}">Si querés, dejanos un comentario</label>
                  <textarea class="feedback-textarea" id="comment-${r.id}" name="comment-${r.id}" placeholder="Tu opinión sobre este relato…"></textarea>
                </div>
              </article>
            `).join("")}
          </div>

          <div class="feedback-review-card" style="margin-top:18px">
            <div class="feedback-question" style="margin-top:0">
              <label for="favoriteStory">De los que escuchaste, ¿cuál fue tu favorito?</label>
              <select class="feedback-select" id="favoriteStory" name="favoriteStory">
                <option value="">Prefiero no elegir uno</option>
                ${selectedStories.map(r => `<option value="${r.id}">${escapeHTML(r.titulo)}</option>`).join("")}
              </select>
            </div>

            <div class="feedback-question">
              <label for="generalComment">¿Querés agregar algo sobre la experiencia general?</label>
              <textarea class="feedback-textarea" id="generalComment" name="generalComment" placeholder="Comentario general opcional…"></textarea>
            </div>
          </div>

          <p class="feedback-mode-note" id="feedbackModeNote">
            ${FEEDBACK_ENDPOINT
              ? "Las respuestas se enviarán de forma anónima."
              : "MODO BORRADOR: por ahora esta versión guarda la prueba sólo en este dispositivo. Todavía no recopila respuestas en una planilla."}
          </p>

          <div class="feedback-actions">
            <button class="feedback-button feedback-button--primary" type="submit">${FEEDBACK_ENDPOINT ? "ENVIAR DEVOLUCIONES" : "GUARDAR PRUEBA"}</button>
            <button class="feedback-button" id="transferFromFormButton" type="button">LLEVAR AL CELULAR</button>
            <button class="feedback-button feedback-button--quiet" id="finishSessionButton" type="button">FINALIZAR SESIÓN DE ESCUCHA</button>
          </div>
        </form>
      </div>
    `;

    const form = document.getElementById("feedbackForm");
    restoreDraft(form, ids);
    form.addEventListener("input", () => saveDraft(form, ids));
    form.addEventListener("change", () => saveDraft(form, ids));
    form.addEventListener("submit", e => submitFeedback(e, ids));

    document.getElementById("transferFromFormButton").addEventListener("click", () => {
      const url = transferUrl(ids);
      const qr = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(url)}`;
      const win = window.open("", "_blank", "width=520,height=650");
      if (win) {
        win.document.write(`<title>Continuar devolución</title><body style="margin:0;background:#0a0d10;color:white;font-family:Arial;display:grid;place-items:center;min-height:100vh;text-align:center"><div><h2>Seguí desde tu celular</h2><img src="${qr}" width="320" height="320" style="background:white;padding:10px"><p>Escaneá el QR para abrir los relatos seleccionados.</p></div></body>`);
      }
    });

    document.getElementById("finishSessionButton").addEventListener("click", finishSession);
    area.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function collectPayload(form, ids) {
    const responses = ids.map(id => {
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
      sessionId,
      fecha: new Date().toISOString(),
      favorito: form.favoriteStory.value || "",
      comentarioGeneral: form.generalComment.value.trim(),
      respuestas: responses
    };
  }

  function saveDraft(form, ids) {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(collectPayload(form, ids)));
    } catch {}
  }

  function restoreDraft(form, ids) {
    let draft;
    try {
      draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    } catch {
      return;
    }
    if (!draft?.respuestas) return;

    for (const response of draft.respuestas) {
      if (!ids.includes(response.relatoId)) continue;
      for (const aspect of response.aspectos || []) {
        const input = [...form.querySelectorAll(`input[name="aspect-${response.relatoId}"]`)].find(el => el.value === aspect);
        if (input) input.checked = true;
      }
      if (response.inmersion) {
        const rating = form.querySelector(`input[name="rating-${response.relatoId}"][value="${response.inmersion}"]`);
        if (rating) rating.checked = true;
      }
      const comment = form.querySelector(`[name="comment-${response.relatoId}"]`);
      if (comment) comment.value = response.comentario || "";
    }

    if (draft.favorito && ids.includes(draft.favorito)) form.favoriteStory.value = draft.favorito;
    form.generalComment.value = draft.comentarioGeneral || "";
  }

  async function submitFeedback(event, ids) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = collectPayload(form, ids);

    if (!FEEDBACK_ENDPOINT) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      showSavedMessage(false);
      return;
    }

    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    submit.textContent = "ENVIANDO…";

    try {
      await fetch(FEEDBACK_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      localStorage.removeItem(DRAFT_KEY);
      showSavedMessage(true);
    } catch {
      submit.disabled = false;
      submit.textContent = "REINTENTAR ENVÍO";
      alert("No se pudo enviar la devolución. Probá nuevamente cuando tengas conexión.");
    }
  }

  function showSavedMessage(sent) {
    const area = document.getElementById("feedbackFormArea");
    area.innerHTML = `
      <div class="feedback-section feedback-success">
        <h3>${sent ? "Gracias por escuchar." : "Prueba guardada."}</h3>
        <p>${sent
          ? "Tu devolución quedó registrada."
          : "Esta es todavía la versión borrador: la devolución quedó guardada sólo en este dispositivo para poder probar la interfaz."}</p>
        <div class="feedback-actions">
          <button class="feedback-button feedback-button--primary" id="successBackButton" type="button">VOLVER A LOS RELATOS</button>
          <button class="feedback-button feedback-button--quiet" id="successFinishButton" type="button">FINALIZAR SESIÓN</button>
        </div>
      </div>
    `;

    document.getElementById("successBackButton").addEventListener("click", () => {
      hideFeedback();
      showGallery();
    });
    document.getElementById("successFinishButton").addEventListener("click", finishSession);
  }

  function finishSession() {
    if (!confirm("¿Finalizar esta sesión? Se borrará la lista de relatos escuchados en este dispositivo.")) return;
    listened.clear();
    localStorage.removeItem(LISTENED_KEY);
    localStorage.removeItem(DRAFT_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    updateCount();
    hideFeedback();
    showGallery();
  }

  updateCount();

  const requestedIds = getRequestedIds();
  if (location.hash === "#devoluciones" || requestedIds.length) {
    enterExperience();
    openFeedback(requestedIds);
  }
})();
