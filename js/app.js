// Shared app state and helpers for the screens (the single place that touches storage).
import { load, save, defaultData } from './storage.js';
import { localDateString, puzzleNumberFor } from './dates.js';
import { setEnabled } from './sound.js';

export const app = {
  data: load(),
  lastRun: null, // result of the run that just finished (for the Results screen)
  refresh: () => {}, // re-renders the current screen (set by main.js)
};

export const persist = () => save(app.data);

/** Local calendar day; `?date=YYYY-MM-DD` overrides it for testing streaks and archives. */
export function today() {
  const o = new URLSearchParams(globalThis.location?.search || '').get('date');
  return o && /^\d{4}-\d{2}-\d{2}$/.test(o) ? o : localDateString();
}

export const todayNumber = () => puzzleNumberFor(today());

export const go = (path) => {
  location.hash = '#/' + path;
};

export function applySettings() {
  const s = app.data.settings;
  document.documentElement.classList.toggle('hc', s.contrast);
  setEnabled(s.sound);
}

export function resetProgress() {
  const keep = app.data.settings;
  app.data = defaultData();
  app.data.settings = { ...keep, skin: 'classic', seenHowTo: true };
  app.lastRun = null;
  persist();
}

let toastTimer = 0;
export function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}
