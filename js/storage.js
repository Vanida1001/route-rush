// Saving and loading under one localStorage key. Every access is wrapped in
// try/catch; broken or missing data starts fresh. If localStorage is unavailable
// (private mode, blocked), the game keeps working in memory only.
import { newStreak } from './streak.js';

export const STORAGE_KEY = 'routeRush.v1';

export function defaultData() {
  return {
    v: 1,
    settings: { lang: null, sound: false, contrast: false, skin: 'classic', seenHowTo: false, seenReloadTip: false },
    progress: {}, // in-progress runs: { '<mode>:<id>': { path, undos, fails } }
    history: {}, // first finished run per puzzle number
    started: {}, // puzzle numbers the player has started (for win rate)
    streak: newStreak(),
    unlocks: [],
    achievements: {}, // id -> date earned
    stats: { practiceDone: 0 }, // kept for old saves (Practice mode was removed in version 2)
    career: { levels: {} }, // '<level 1..60>': { stars, fuel }
    rush: { best: 0 }, // best Rush Hour score
  };
}

const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);

/** Merges untrusted saved data over the defaults, dropping anything of the wrong type. */
export function sanitize(raw) {
  const d = defaultData();
  if (!isObj(raw) || raw.v !== 1) return d;
  if (isObj(raw.settings)) {
    const s = raw.settings;
    if (s.lang === 'fr' || s.lang === 'en') d.settings.lang = s.lang;
    d.settings.sound = s.sound === true;
    d.settings.contrast = s.contrast === true;
    if (typeof s.skin === 'string') d.settings.skin = s.skin;
    d.settings.seenHowTo = s.seenHowTo === true;
    d.settings.seenReloadTip = s.seenReloadTip === true;
  }
  for (const k of ['progress', 'history', 'started', 'achievements']) if (isObj(raw[k])) d[k] = raw[k];
  if (isObj(raw.streak)) {
    const s = raw.streak;
    d.streak = {
      current: Number.isFinite(s.current) ? s.current : 0,
      best: Number.isFinite(s.best) ? s.best : 0,
      lastDate: typeof s.lastDate === 'string' ? s.lastDate : null,
      freezes: Number.isFinite(s.freezes) ? s.freezes : 0,
    };
  }
  if (Array.isArray(raw.unlocks)) d.unlocks = raw.unlocks.filter((x) => typeof x === 'string');
  if (isObj(raw.career) && isObj(raw.career.levels)) {
    for (const [n, l] of Object.entries(raw.career.levels)) {
      if (isObj(l) && Number.isFinite(l.stars) && l.stars >= 1 && l.stars <= 3 && Number.isFinite(l.fuel)) d.career.levels[n] = { stars: l.stars, fuel: l.fuel };
    }
  }
  if (isObj(raw.rush) && Number.isFinite(raw.rush.best) && raw.rush.best > 0) d.rush.best = Math.floor(raw.rush.best);
  if (isObj(raw.stats) && Number.isFinite(raw.stats.practiceDone)) d.stats.practiceDone = raw.stats.practiceDone;
  return d;
}

export function load(storage = globalThis.localStorage) {
  try {
    const txt = storage.getItem(STORAGE_KEY);
    return sanitize(txt ? JSON.parse(txt) : null);
  } catch {
    return defaultData();
  }
}

export function save(data, storage = globalThis.localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
