(() => {
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
