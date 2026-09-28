const enhancementStyles = document.createElement("link");
enhancementStyles.rel = "stylesheet";
enhancementStyles.href = "exhibition-enhancements.css?v=20260926k";
document.head.appendChild(enhancementStyles);
const collageStyles = document.createElement("link");
collageStyles.rel = "stylesheet";
collageStyles.href = "home-collage.css?v=20260927a";
document.head.appendChild(collageStyles);

const relatos = [
   {
    id: "te-encontre",
    titulo: "Te encontré",
    autor: "Sabina Aylen Diaz",
    año: "2026",
    portada: "assets/portadas/te-encontre.webp",
    audio: "assets/audio/te-encontre.mp3",
    duracion: "05:12",
    sinopsis: "Despertar en una jaula rodeada de horrores es solo el comienzo de la pesadilla de Sofía. Cuando su sádico captor ejecuta a la persona de la celda de al lado, ella sabe que su tiempo se agota. Sofía emprende una desesperada y aterradora huida por el bosque, solo para descubrir que despertar de su pesadilla es el verdadero infierno."
  },
  {
    id: "sos-zom",
    titulo: "S.O.S Zom…",
    autor: "Kassandra De Poli",
    portada: "assets/portadas/sos-zom.webp",
    audio: "assets/audio/sos-zom.mp3",
    duracion: "02:42",
    sinopsis: "Te encuentras solo en una cabaña en el bosque, pero un llamado de auxilio te hace salir de aquel lugar, ya que lo pudo haber realizado algún conocido tuyo. El único dilema aquí es… ¿Podrás llegar a tiempo? ¿Con vida? ¿En medio de un apocalipsis zombi?"
  },
  {
    id: "despegue-turbulento",
    titulo: "Despegue turbulento",
    autor: "Enrique Lorenzo Spitzer",
    portada: "assets/portadas/despegue-turbulento.webp",
    audio: "assets/audio/despegue-turbulento.mp3",
    duracion: "03:23",
    sinopsis: "La historia comienza en un avión a punto de despegar. El protagonista y su amigo viajan en primera clase cuando se acerca una azafata para ofrecerles comida. El amigo pide un café y explica que el protagonista no se siente bien.\n\nMientras el avión se prepara para despegar, el malestar aumenta y el protagonista percibe de manera distorsionada el instructivo de seguridad. Su amigo le ruega que aguante hasta el despegue, pero finalmente el protagonista vomita."
  },
  {
    id: "wachmann",
    titulo: "Wachmann",
    autor: "Lucía Guerra",
    portada: "assets/portadas/wachmann.webp",
    audio: "assets/audio/wachmann.mp3",
    duracion: "04:07",
    sinopsis: "Finalmente conseguiste un trabajo, sos el nuevo guardia de seguridad de un edificio que está siendo refaccionado. Es sencillo, solamente tenés que vigilar que no aparezcan intrusos por la noche, pero no estás solo: Anabel es tu compañera que va a hacer que las cosas transcurran en paz… ¿no?"
  },
  {
    id: "no-huyas",
    titulo: "No huyas",
    autor: "John Ugarte",
    portada: "assets/portadas/no-huyas.webp",
    audio: "assets/audio/no-huyas.mp3",
    duracion: "02:48",
    sinopsis: "¿Puedes intentar huir de tus recuerdos? Eres una persona que llega a casa, pone el agua a hervir y quieres ver tu película favorita, pero… ¿qué pasa? Alguien apaga el agua, se acerca y oyes una voz conocida. ¿Podrás recordar quién es y qué quiere?"
  }
];

const welcome = document.getElementById("welcome");
const enterButton = document.getElementById("enterButton");
const site = document.getElementById("site");
const galleryView = document.getElementById("galleryView");
const storyView = document.getElementById("storyView");
const gallery = document.getElementById("gallery");
const backButton = document.getElementById("backButton");
const homeButton = document.getElementById("homeButton");
const galleryHomeButton = document.getElementById("galleryHomeButton");
const ambientVideo = document.getElementById("ambientVideo");

const storyBg = document.getElementById("storyBg");
const storyCover = document.getElementById("storyCover");
const storyTitle = document.getElementById("storyTitle");
const storyAuthor = document.getElementById("storyAuthor");
const storySynopsis = document.getElementById("storySynopsis");

const audio = document.getElementById("audio");
const playButton = document.getElementById("playButton");
const playIcon = document.getElementById("playIcon");
const seek = document.getElementById("seek");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const playerStatus = document.getElementById("playerStatus");
const activeAuthor = document.getElementById("activeAuthor");

audio.volume = 1;
let currentStory = null;

function buildGallery() {
  const shuffled = [...relatos];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  gallery.innerHTML = shuffled.map((r, i) => `
    <article class="card" tabindex="0" role="button"
      aria-label="Abrir ${escapeHTML(r.titulo)}"
      data-id="${r.id}">
      <div class="card__image">
        <img src="${r.portada}" alt="Portada de ${escapeHTML(r.titulo)}" loading="lazy">
        <span class="card__number">${String(i + 1).padStart(2, "0")}</span>
        <span class="card__duration">${r.duracion}</span>
      </div>
      <div class="card__body">
        <p class="card__meta">Relato binaural</p>
        <h3>${escapeHTML(r.titulo)}</h3>
        <p class="card__author">${escapeHTML(r.autor)}</p>
        <p class="card__synopsis">${escapeHTML(r.sinopsis)}</p>
        <div class="card__action">
          <span>ABRIR EXPERIENCIA</span>
          <span>→</span>
        </div>
      </div>
    </article>
  `).join("");

  gallery.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => openStory(card.dataset.id));
    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openStory(card.dataset.id);
      }
    });
  });
}

function buildHomeCollage() {
  const title = welcome.querySelector(".welcome__title");
  if (!title) return;
  welcome.querySelector(".home-collage")?.remove();
  const covers = [...new Map(relatos.filter(r => r.portada).map(r => [r.portada, r])).values()].slice(0, 9);
  welcome.classList.toggle("has-collage", covers.length > 0);
  if (!covers.length) return;
  const collage = document.createElement("div");
  collage.className = "home-collage";
  collage.setAttribute("aria-hidden", "true");
  covers.forEach((story, index) => {
    const card = document.createElement("div");
    card.className = "home-collage__card";
    card.style.setProperty("--delay", `${-index * 2}s`);
    const img = document.createElement("img");
    img.src = story.portada;
    img.alt = "";
    img.decoding = "async";
    img.draggable = false;
    img.addEventListener("error", () => {
      card.remove();
      if (!collage.childElementCount) {
        collage.remove();
        welcome.classList.remove("has-collage");
      }
    }, { once: true });
    card.appendChild(img);
    collage.appendChild(card);
  });
  title.after(collage);
}

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function playAmbientVideo() {
  if (!ambientVideo) return;
  ambientVideo.play().catch(() => {});
}

function enterExperience() {
  buildGallery();
  document.body.classList.remove("is-welcome");
  welcome.classList.add("is-hidden");
  site.removeAttribute("aria-hidden");
  galleryView.hidden = false;
  storyView.hidden = true;
  playAmbientVideo();
  window.scrollTo({top: 0});
}

function showWelcome() {
  stopAudio();
  currentStory = null;
  activeAuthor.hidden = true;
  activeAuthor.textContent = "";
  storyView.hidden = true;
  galleryView.hidden = false;
  site.setAttribute("aria-hidden", "true");
  welcome.classList.remove("is-hidden");
  document.body.classList.add("is-welcome");
  history.replaceState(null, "", location.pathname + location.search);
  playAmbientVideo();
  window.scrollTo({ top: 0 });
}

function openStory(id) {
  const story = relatos.find(r => r.id === id);
  if (!story) return;

  stopAudio();
  currentStory = story;

  storyBg.style.backgroundImage = `url("${story.portada}")`;
  storyCover.src = story.portada;
  storyCover.alt = `Portada de ${story.titulo}`;
  storyTitle.textContent = story.titulo;
  storyAuthor.textContent = story.autor;
  storySynopsis.textContent = story.sinopsis;
  activeAuthor.textContent = story.autor;
  activeAuthor.hidden = false;

  audio.src = story.audio;
  audio.load();

  galleryView.hidden = true;
  storyView.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
  history.replaceState(null, "", `#${story.id}`);
}

function showGallery() {
  buildGallery();
  stopAudio();
  storyView.hidden = true;
  galleryView.hidden = false;
  currentStory = null;
  activeAuthor.hidden = true;
  activeAuthor.textContent = "";
  history.replaceState(null, "", location.pathname + location.search);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function togglePlay() {
  if (!currentStory) return;
  if (audio.paused) audio.play().catch(() => {});
  else audio.pause();
}

function stopAudio() {
  audio.pause();
  audio.currentTime = 0;
  updatePlayState(false);
  seek.value = 0;
  seek.style.setProperty("--progress", "0%");
  currentTimeEl.textContent = "00:00";
  playerStatus.textContent = "LISTO PARA ESCUCHAR";
}

function updatePlayState(isPlaying) {
  playButton.classList.toggle("is-playing", isPlaying);
  playButton.setAttribute("aria-pressed", String(isPlaying));
  playButton.setAttribute("aria-label", isPlaying ? "Pausar" : "Reproducir");
  playerStatus.textContent = isPlaying ? "REPRODUCIENDO" : "EN PAUSA";
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

audio.addEventListener("loadedmetadata", () => {
  durationEl.textContent = formatTime(audio.duration);
  playerStatus.textContent = "LISTO PARA ESCUCHAR";
});

audio.addEventListener("play", () => updatePlayState(true));
audio.addEventListener("pause", () => {
  if (audio.ended) return;
  updatePlayState(false);
});

audio.addEventListener("ended", () => {
  updatePlayState(false);
  playerStatus.textContent = "RELATO FINALIZADO";
  seek.value = 1000;
  seek.style.setProperty("--progress", "100%");
});

audio.addEventListener("timeupdate", () => {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
  const ratio = audio.currentTime / audio.duration;
  seek.value = Math.round(ratio * 1000);
  seek.style.setProperty("--progress", `${ratio * 100}%`);
  currentTimeEl.textContent = formatTime(audio.currentTime);
});

seek.addEventListener("input", () => {
  if (!Number.isFinite(audio.duration)) return;
  const ratio = Number(seek.value) / 1000;
  audio.currentTime = ratio * audio.duration;
  seek.style.setProperty("--progress", `${ratio * 100}%`);
});

enterButton.addEventListener("click", enterExperience);
backButton.addEventListener("click", showGallery);
homeButton.addEventListener("click", showWelcome);
galleryHomeButton?.addEventListener("click", showWelcome);
playButton.addEventListener("click", togglePlay);

document.addEventListener("keydown", e => {
  if (!storyView.hidden && e.code === "Space" && e.target.tagName !== "INPUT" && e.target.tagName !== "BUTTON") {
    e.preventDefault();
    togglePlay();
  }
  if (!storyView.hidden && e.key === "Escape") showGallery();
});

function getFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function canFullscreen() {
  const root = document.documentElement;
  return Boolean(root.requestFullscreen || root.webkitRequestFullscreen);
}

async function requestAppFullscreen() {
  const root = document.documentElement;
  try {
    if (getFullscreenElement()) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      return;
    }
    if (root.requestFullscreen) await root.requestFullscreen({ navigationUI: "hide" });
    else if (root.webkitRequestFullscreen) root.webkitRequestFullscreen();
  } catch (_) {}
}

function createFullscreenButton(extraClass = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `fullscreen-button ${extraClass}`.trim();
  button.innerHTML = '<span class="fullscreen-button__icon">⛶</span><span class="fullscreen-button__label">PANTALLA COMPLETA</span>';
  button.setAttribute("aria-label", "Activar pantalla completa");
  button.addEventListener("click", requestAppFullscreen);
  if (canFullscreen()) button.classList.add("is-supported");
  return button;
}

function updateFullscreenButtons() {
  const active = Boolean(getFullscreenElement());
  document.querySelectorAll(".fullscreen-button").forEach(button => {
    const label = button.querySelector(".fullscreen-button__label");
    if (label) label.textContent = active ? "SALIR DE PANTALLA COMPLETA" : "PANTALLA COMPLETA";
    button.setAttribute("aria-label", active ? "Salir de pantalla completa" : "Activar pantalla completa");
    button.style.display = active ? "none" : "";
  });
}

function installExhibitionUI() {
  const welcomeActionsAnchor = document.querySelector(".academic-credit--welcome");
  if (welcomeActionsAnchor && !document.querySelector(".fullscreen-button--welcome")) {
    const fullscreenWelcome = createFullscreenButton("fullscreen-button--welcome");
    welcomeActionsAnchor.parentNode.insertBefore(fullscreenWelcome, welcomeActionsAnchor);
  }

  const topbarRight = document.querySelector(".topbar__right");
  if (topbarRight && !document.querySelector(".fullscreen-button--topbar")) {
    const fullscreenTop = createFullscreenButton("fullscreen-button--topbar");
    topbarRight.prepend(fullscreenTop);
  }

  updateFullscreenButtons();
}

document.addEventListener("fullscreenchange", updateFullscreenButtons);
document.addEventListener("webkitfullscreenchange", updateFullscreenButtons);

buildHomeCollage();
installExhibitionUI();
playAmbientVideo();

const requested = location.hash.replace("#", "");
if (requested && relatos.some(r => r.id === requested)) {
  enterExperience();
  openStory(requested);
}

