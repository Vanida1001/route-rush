// Achievements: each is a pure check over the saved data. Names live in lang files (ach.<id>.*).
import { weekdayOfPuzzle } from './dates.js';
import { SKINS, unlockedSkinIds } from './skins.js';

const entries = (d) => Object.values(d.history);

function perfectWeek(d) {
  const threes = new Set(entries(d).filter((h) => h.stars === 3).map((h) => h.n));
  for (const n of threes) {
    let ok = true;
    for (let k = 1; k < 7 && ok; k++) ok = threes.has(n + k);
    if (ok) return true;
  }
  return false;
}

const CHECKS = {
  first_run: (d) => entries(d).length >= 1,
  three_stars: (d) => entries(d).some((h) => h.stars === 3),
  pure: (d) => entries(d).some((h) => h.stars === 3 && h.undos === 0),
  perfect_week: perfectWeek,
  express_expert: (d) =>
    entries(d).filter((h) => h.kind === 'daily' && weekdayOfPuzzle(h.n) === 0 && h.lateFails === 0).length >= 10,
  night_owl: (d) => entries(d).some((h) => h.hour >= 23),
  early_bird: (d) => entries(d).some((h) => h.hour < 7),
  streak_7: (d) => d.streak.best >= 7,
  streak_30: (d) => d.streak.best >= 30,
  rush_10: (d) => d.rush.best >= 10,
  rush_20: (d) => d.rush.best >= 20,
  time_traveller: (d) => entries(d).filter((h) => h.kind === 'archive').length >= 3,
  collector: (d) => unlockedSkinIds(d).length === SKINS.length,
};

export const ACHIEVEMENT_IDS = Object.keys(CHECKS);

export const earnedIds = (data) => ACHIEVEMENT_IDS.filter((id) => CHECKS[id](data));
