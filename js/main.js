import { Game } from './game.js';
import { resumeAudio } from './audio.js';

const canvas = document.getElementById('game');
const contact = document.getElementById('contact');
const contactArt = document.getElementById('contact-art');
const game = new Game(canvas);

const CONTACT_LINES = [
  'Glad to have your',
  'attention.',
  'Please reach me at:',
  'mikolaj.sojka@gmail.com',
];
let contactDrawnFor = 0;

function paintContact() {
  const cssW = contact.clientWidth;
  const cssH = contact.clientHeight;
  if (!cssW || !cssH) return;
  const w = Math.max(1, Math.round(cssW));
  const h = Math.max(1, Math.round(cssH));
  const scale = 2;
  const src = document.createElement('canvas');
  src.width = w * scale;
  src.height = h * scale;
  const sctx = src.getContext('2d');
  sctx.textAlign = 'center';
  sctx.textBaseline = 'middle';

  let size = Math.floor((h * scale) / (CONTACT_LINES.length + 1.2));
  const fit = () => {
    sctx.font = `bold ${size}px "Courier New", ui-monospace, monospace`;
  };
  fit();
  const longest = CONTACT_LINES[CONTACT_LINES.length - 1];
  while (size > 16 && sctx.measureText(longest).width > src.width - 12) {
    size -= 2;
    fit();
  }

  const step = src.height / (CONTACT_LINES.length + 1);
  CONTACT_LINES.forEach((line, i) => {
    const x = Math.round(src.width / 2);
    const y = Math.round(step * (i + 1));
    sctx.fillStyle = '#b09058';
    sctx.fillText(line, x + scale, y + scale);
    sctx.fillStyle = '#3d2418';
    sctx.fillText(line, x, y);
  });

  const emailW = sctx.measureText(longest).width;
  const underlineY = Math.round(step * CONTACT_LINES.length + size * 0.55);
  sctx.fillStyle = '#3d2418';
  sctx.fillRect(Math.round((src.width - emailW) / 2), underlineY, Math.round(emailW), scale);

  contactArt.width = w;
  contactArt.height = h;
  const ctx = contactArt.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(src, 0, 0, w, h);
}

function syncContact() {
  const show = game.state === 'GAME_OVER';
  contact.classList.toggle('visible', show);
  if (!show) {
    contactDrawnFor = 0;
    return;
  }
  const w = contact.clientWidth;
  if (w && w !== contactDrawnFor) {
    contactDrawnFor = w;
    paintContact();
  }
}

let last = performance.now();

function loop(now) {
  const dt = Math.min(now - last, 50);
  last = now;
  game.update(dt);
  game.render();
  syncContact();
  requestAnimationFrame(loop);
}

function onAction(e) {
  if (e.type === 'keydown' && e.code === 'KeyP') {
    e.preventDefault();
    game.togglePause();
    return;
  }
  if (e.type === 'keydown' && e.code !== 'Space' && e.code !== 'ArrowUp') return;
  e.preventDefault();
  resumeAudio();
  game.flap();
}

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  resumeAudio();
  game.flap();
});

window.addEventListener('keydown', onAction);

window.addEventListener('resize', () => {
  contactDrawnFor = 0;
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && (game.state === 'PLAYING' || game.state === 'READY')) {
    game.paused = true;
  }
});

requestAnimationFrame(loop);
