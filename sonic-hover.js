(() => {
  const homeButton = document.getElementById('homeButton');
  const galleryHomeButton = document.getElementById('galleryHomeButton');
  const audio = document.getElementById('audio');
  const playerStatus = document.getElementById('playerStatus');

  // La marca superior funciona siempre como Home.
  if (homeButton && galleryHomeButton) {
    homeButton.setAttribute('aria-label', 'Volver al inicio');
    const mark = homeButton.querySelector('.brand__mark');
    if (mark) mark.textContent = '⌂';

    homeButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      galleryHomeButton.click();
    }, true);
  }

  // Estado del reproductor: comunica una acción, no un mensaje decorativo.
  if (audio && playerStatus) {
    const setReady = () => {
      if (audio.currentTime <= 0.05 || audio.ended) playerStatus.textContent = 'REPRODUCIR RELATO';
    };

    audio.addEventListener('loadedmetadata', setReady);
    audio.addEventListener('play', () => {
      playerStatus.textContent = 'REPRODUCIENDO';
    });
    audio.addEventListener('pause', () => {
      if (!audio.ended) {
        playerStatus.textContent = audio.currentTime > 0.05 ? 'PAUSADO' : 'REPRODUCIR RELATO';
      }
    });
    audio.addEventListener('ended', () => {
      playerStatus.textContent = 'VOLVER A ESCUCHAR';
    });
  }

  // Efecto sonoro/ripple sólo para dispositivos con mouse.
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!finePointer.matches) return;

  const buttonSelector = [
    '.enter-button',
    '.feedback-nav-button',
    '.fullscreen-button',
    '.gallery-home-button',
    '.back-button',
    '.feedback-submit-button',
    '.feedback-back-button',
    '.feedback-finish-button'
  ].join(',');

  function decorate(root = document) {
    root.querySelectorAll(buttonSelector).forEach(el => el.classList.add('sonic-hover'));
    root.querySelectorAll('.card').forEach(el => el.classList.add('sonic-card'));
  }

  function setPointerVars(el, event) {
    const r = el.getBoundingClientRect();
    const x = ((event.clientX - r.left) / r.width) * 100;
    const y = ((event.clientY - r.top) / r.height) * 100;
    el.style.setProperty('--sx', `${Math.max(0, Math.min(100, x))}%`);
    el.style.setProperty('--sy', `${Math.max(0, Math.min(100, y))}%`);
  }

  document.addEventListener('pointermove', event => {
    const el = event.target.closest('.sonic-hover, .sonic-card');
    if (!el) return;
    setPointerVars(el, event);
  }, { passive: true });

  document.addEventListener('pointerdown', event => {
    const el = event.target.closest('.sonic-hover');
    if (!el) return;
    setPointerVars(el, event);
    el.classList.remove('is-sonic-click');
    void el.offsetWidth;
    el.classList.add('is-sonic-click');
    window.setTimeout(() => el.classList.remove('is-sonic-click'), 480);
  });

  decorate();

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        if (node.matches(buttonSelector)) node.classList.add('sonic-hover');
        if (node.matches('.card')) node.classList.add('sonic-card');
        decorate(node);
      });
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
