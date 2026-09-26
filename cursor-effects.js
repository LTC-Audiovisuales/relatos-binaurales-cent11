(() => {
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!finePointer || reducedMotion) return;

  const cursor = document.createElement('div');
  cursor.className = 'neon-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = `
    <svg viewBox="0 0 38 38" aria-hidden="true">
      <defs>
        <linearGradient id="cursorGlowGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ff53d8"/>
          <stop offset="0.55" stop-color="#956dff"/>
          <stop offset="1" stop-color="#5be7ff"/>
        </linearGradient>
      </defs>
      <path d="M5 4 L32 17 L20 21 L15 34 Z"
            fill="#070a10" fill-opacity=".9"
            stroke="url(#cursorGlowGradient)" stroke-width="2"
            stroke-linejoin="round"/>
      <path d="M5 4 L32 17 L20 21 L15 34 Z"
            fill="none" stroke="#fff" stroke-opacity=".42"
            stroke-width=".7" stroke-linejoin="round"/>
    </svg>`;

  const halo = document.createElement('div');
  halo.className = 'neon-cursor-halo';
  halo.setAttribute('aria-hidden', 'true');

  document.body.append(halo, cursor);
  document.body.classList.add('has-neon-cursor');

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let hx = x;
  let hy = y;
  let movingTimer = null;

  const interactiveSelector = [
    'button', 'a', '.card', '[role="button"]', 'input',
    '.feedback-story-choice', '.feedback-review-card'
  ].join(',');

  const setVisible = (visible) => {
    cursor.classList.toggle('is-visible', visible);
    halo.classList.toggle('is-visible', visible);
  };

  const setMoving = () => {
    cursor.classList.add('is-moving');
    halo.classList.add('is-moving');
    clearTimeout(movingTimer);
    movingTimer = setTimeout(() => {
      cursor.classList.remove('is-moving');
      halo.classList.remove('is-moving');
    }, 110);
  };

  document.addEventListener('pointermove', (event) => {
    x = event.clientX;
    y = event.clientY;
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    setVisible(true);
    setMoving();
  }, { passive: true });

  document.addEventListener('pointerover', (event) => {
    const hovering = Boolean(event.target.closest?.(interactiveSelector));
    cursor.classList.toggle('is-hovering', hovering);
    halo.classList.toggle('is-hovering', hovering);
  }, { passive: true });

  document.addEventListener('pointerout', (event) => {
    if (!event.relatedTarget) setVisible(false);
  }, { passive: true });

  document.addEventListener('pointerdown', (event) => {
    cursor.classList.add('is-clicking');

    const pulse = document.createElement('div');
    pulse.className = 'neon-click-pulse';
    pulse.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
    document.body.appendChild(pulse);
    setTimeout(() => pulse.remove(), 560);
  }, { passive: true });

  document.addEventListener('pointerup', () => {
    cursor.classList.remove('is-clicking');
  }, { passive: true });

  const animateHalo = () => {
    hx += (x - hx) * 0.16;
    hy += (y - hy) * 0.16;
    halo.style.transform = `translate3d(${hx}px, ${hy}px, 0)`;
    requestAnimationFrame(animateHalo);
  };
  animateHalo();
})();
