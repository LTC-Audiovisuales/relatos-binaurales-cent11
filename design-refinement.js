(() => {
  const css=document.createElement('link');css.rel='stylesheet';css.href='design-refinement.css?v=20260928-mobile';document.head.append(css);
  const top=document.createElement('button');top.id='backToTop';top.type='button';top.textContent='↑';top.setAttribute('aria-label','Volver arriba');top.title='Volver arriba';top.hidden=true;document.body.append(top);
  const home=document.getElementById('welcome');
  home.append(home.querySelector('.academic-credit--welcome'));
  const scroller=()=>document.body.classList.contains('is-welcome')?home:document.scrollingElement;
  const sync=()=>{top.hidden=scroller().scrollTop<180;};
  document.addEventListener('scroll',sync,true);window.addEventListener('resize',sync);
  new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
  top.addEventListener('click',()=>{scroller().scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});const target=document.body.classList.contains('is-welcome')?document.getElementById('enterButton'):document.getElementById('homeButton');target.focus({preventScroll:true});});
  const audio=document.getElementById('audio'),seek=document.getElementById('seek'),status=document.getElementById('playerStatus');
  status.setAttribute('role','status');
  audio.addEventListener('timeupdate',()=>seek.setAttribute('aria-valuetext',`${formatTime(audio.currentTime)} de ${formatTime(audio.duration)}`));
  audio.addEventListener('error',()=>{status.textContent='NO SE PUDO CARGAR EL AUDIO';});
})();
/* A stored preference controls visual attenuation only; audio is never interrupted. */
(() => {
  const audio = document.getElementById('audio');
  const toggle = document.createElement('button');
  toggle.id = 'listenModeToggle';
  toggle.type = 'button';
  toggle.textContent = 'Modo escucha';
  toggle.title = 'Atenuar la interfaz durante la reproducción';
  toggle.setAttribute('aria-label', 'Atenuar la interfaz durante la reproducción');
  let enabled = true;
  try { enabled = localStorage.getItem('relatos-listening-mode') !== 'off'; } catch (_) {}
  document.querySelector('#player .player__main').append(toggle);
  const sync = () => {
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.textContent = enabled ? 'Modo escucha · activado' : 'Modo escucha · desactivado';
    document.body.classList.toggle('is-listening', enabled && !audio.paused && !audio.ended && !audio.error && !document.getElementById('storyView').hidden);
  };
  toggle.addEventListener('click', () => {
    enabled = !enabled;
    try { localStorage.setItem('relatos-listening-mode', enabled ? 'on' : 'off'); } catch (_) {}
    sync();
  });
  for (const event of ['play', 'pause', 'ended', 'error', 'emptied']) audio.addEventListener(event, sync);
  new MutationObserver(sync).observe(document.getElementById('storyView'), {attributes:true,attributeFilter:['hidden']});
  sync();
})();
/* Passive touch feedback: does not intercept scrolling, controls or audio. */
document.addEventListener('pointerdown', event => {
  if(event.pointerType !== 'touch' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const glow=document.createElement('span');
  glow.className='touch-glow';glow.setAttribute('aria-hidden','true');
  glow.style.left=event.clientX+'px';glow.style.top=event.clientY+'px';
  document.body.append(glow);
  setTimeout(()=>glow.remove(),700);
}, {passive:true});
