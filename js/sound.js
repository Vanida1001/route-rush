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

/** A short band of filtered noise (engine puff, tyre scuff, click texture). */
function noise(start, dur, freq, vol = 0.06, q = 1) {
  const a = audio();
  if (!a) return;
  const len = Math.max(1, Math.floor(a.sampleRate * dur));
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  const f = a.createBiquadFilter();
  const g = a.createGain();
  const t0 = a.currentTime + start;
  src.buffer = buf;
  f.type = 'bandpass';
  f.frequency.value = freq;
  f.Q.value = q;
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(a.destination);
  src.start(t0);
}

/** One little "putt-putt" engine chirp per tile, with a touch of tyre scuff; pitch varies a bit so steps don't sound identical. */
export const engine = () => {
  const p = 0.94 + Math.random() * 0.12;
  tone(95 * p, 0, 0.11, 'square', 0.035, 135 * p);
  tone(190 * p, 0.04, 0.09, 'triangle', 0.05, 250 * p);
  noise(0, 0.1, 900, 0.05, 0.8);
};
/** Soft pop when any button is pressed. */
export const click = () => {
  tone(700, 0, 0.06, 'triangle', 0.09, 420);
  noise(0, 0.025, 2500, 0.04, 1.5);
};
/** Delivery "ding". */
export const ding = () => {
  tone(880, 0, 0.18, 'sine', 0.14);
  tone(1320, 0.08, 0.3, 'sine', 0.1);
};
/** Short fanfare on 3 stars. */
export const fanfare = () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.28, 'triangle', 0.13));
/** Low buzz when an express parcel is late. */
export const fail = () => tone(220, 0, 0.35, 'square', 0.07, 120);
