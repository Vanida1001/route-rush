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

/** Soft, round "brum" per tile: smooth low tones with a gentle rise, no noise, so it never sounds like static. */
export const engine = () => {
  const p = 0.96 + Math.random() * 0.08;
  tone(110 * p, 0, 0.16, 'sine', 0.10, 150 * p);
  tone(220 * p, 0.01, 0.13, 'triangle', 0.035, 290 * p);
};
/** Soft pop when any button is pressed. */
export const click = () => tone(640, 0, 0.07, 'sine', 0.10, 420);
/** Delivery "ding". */
export const ding = () => {
  tone(880, 0, 0.18, 'sine', 0.14);
  tone(1320, 0.08, 0.3, 'sine', 0.1);
};
/** Short fanfare on 3 stars. */
export const fanfare = () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.28, 'triangle', 0.13));
/** Low buzz when an express parcel is late. */
export const fail = () => tone(220, 0, 0.35, 'square', 0.07, 120);
