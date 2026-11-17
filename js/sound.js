// Sound effects made with the Web Audio API (no sound files). Off by default.
let ctx = null;
let enabled = false;

export function setEnabled(on) {
  enabled = on;
}

function audio() {
  if (!enabled) return null;
  try {
    ctx = ctx || new (globalThis.AudioContext || globalThis.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, start, dur, type = 'sine', vol = 0.12, slideTo) {
  const a = audio();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  const t0 = a.currentTime + start;
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.linearRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

/** Soft engine hum while the van moves. */
export const engine = () => tone(70, 0, 0.16, 'sawtooth', 0.05, 90);
/** Delivery "ding". */
export const ding = () => {
  tone(880, 0, 0.18, 'sine', 0.14);
  tone(1320, 0.08, 0.3, 'sine', 0.1);
};
/** Short fanfare on 3 stars. */
export const fanfare = () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.28, 'triangle', 0.13));
/** Low buzz when an express parcel is late. */
export const fail = () => tone(220, 0, 0.35, 'square', 0.07, 120);
