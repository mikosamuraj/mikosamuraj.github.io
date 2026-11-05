let ctx = null;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return ctx;
}

export function resumeAudio() {
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
}

function beep(freq, duration, type = 'square', volume = 0.08, freqEnd = null) {
  const c = getCtx();
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + duration);
  }
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export function playFlap() {
  beep(380, 0.08, 'square', 0.06, 520);
}

export function playScore() {
  beep(880, 0.06, 'square', 0.07);
  setTimeout(() => beep(1100, 0.08, 'square', 0.07), 60);
}

export function playHit() {
  beep(120, 0.15, 'sawtooth', 0.1, 60);
}

export function playDie() {
  beep(200, 0.2, 'triangle', 0.08, 80);
  setTimeout(() => beep(100, 0.25, 'triangle', 0.06, 50), 100);
}
