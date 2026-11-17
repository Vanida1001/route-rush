// Recording finished runs and computing stats. Pure: mutates the data object it is given.
import { starsFor } from './share.js';
import { applyDailyCompletion, effectiveStreak } from './streak.js';
import { unlockedSkinIds, countThreeStars } from './skins.js';
import { earnedIds } from './achievements.js';
import { districtOf, isDistrictUnlocked, careerSummary, TOTAL_LEVELS, DISTRICTS } from './career.js';

const snapshot = (data) => ({
  skins: new Set(unlockedSkinIds(data)),
  ach: new Set(Object.keys(data.achievements)),
  districts: Array.from({ length: DISTRICTS }, (_, i) => isDistrictUnlocked(data, i + 1)),
});

/** Stores new unlocks/achievements and reports what is new compared with `before`. */
function settle(data, before, today, result) {
  const skinsAfter = unlockedSkinIds(data);
  data.unlocks = skinsAfter;
  result.newSkins = skinsAfter.filter((id) => !before.skins.has(id));
  for (const id of earnedIds(data)) if (!before.ach.has(id)) data.achievements[id] = today;
  result.newAchievements = Object.keys(data.achievements).filter((id) => !before.ach.has(id));
  const open = Array.from({ length: DISTRICTS }, (_, i) => isDistrictUnlocked(data, i + 1));
  result.newDistrict = open.findIndex((v, i) => v && !before.districts[i]) + 1 || 0;
}

/**
 * Records a finished run.
 *  - daily/archive: only the FIRST finished run of a puzzle counts for history and stats;
 *    only a first daily run (of today's puzzle) touches the streak.
 *  - career: the best result per level is kept (so replaying for 3 stars works); the
 *    streak is never touched.
 * Returns what the Results screen needs.
 */
export function recordFinish(data, { mode, n, puzzle, state, now, today, undos = 0, fails = 0 }) {
  const stars = starsFor(state.fuel, puzzle.best);
  const before = snapshot(data);
  const streakBefore = effectiveStreak(data.streak, today);

  const result = {
    mode, n, fuel: state.fuel, best: puzzle.best, stars,
    events: state.events.map((e) => e.t),
    counted: false, usedFreeze: false, earnedFreeze: false,
    newSkins: [], newAchievements: [], newDistrict: 0, streak: streakBefore,
  };

  if (mode === 'career') {
    const prev = data.career.levels[n];
    result.counted = !prev;
    if (!prev || stars > prev.stars || (stars === prev.stars && state.fuel < prev.fuel)) {
      data.career.levels[n] = { stars, fuel: state.fuel };
    }
  } else if (!data.history[n]) {
    data.history[n] = {
      n, fuel: state.fuel, best: puzzle.best, stars, kind: mode, date: today,
      hour: now.getHours(), events: result.events, undos, lateFails: fails,
    };
    result.counted = true;
    if (mode === 'daily') {
      const r = applyDailyCompletion(data.streak, today);
      data.streak = r.streak;
      result.usedFreeze = r.usedFreezes > 0;
      result.earnedFreeze = r.earnedFreeze;
    }
  }

  settle(data, before, today, result);
  result.streak = effectiveStreak(data.streak, today);
  return result;
}

/** Records the end of a Rush Hour run. Returns { solved, best, isNewBest, newAchievements }. */
export function recordRush(data, solved, today) {
  const before = snapshot(data);
  const isNewBest = solved > data.rush.best;
  if (isNewBest) data.rush.best = solved;
  const result = { solved, best: data.rush.best, isNewBest, newSkins: [], newAchievements: [], newDistrict: 0 };
  settle(data, before, today, result);
  return result;
}

export function computeStats(data, today) {
  const hist = Object.values(data.history);
  const dist = { 1: 0, 2: 0, 3: 0 };
  hist.forEach((h) => (dist[h.stars] = (dist[h.stars] || 0) + 1));
  const played = hist.length;
  const started = Math.max(Object.keys(data.started).length, played);
  const career = careerSummary(data);
  return {
    played,
    winRate: started ? Math.round((played / started) * 100) : 0,
    streak: effectiveStreak(data.streak, today),
    bestStreak: data.streak.best,
    threeStarDays: countThreeStars(data),
    dist,
    careerStars: career.stars,
    careerMaxStars: career.maxStars,
    careerDone: career.done,
    careerTotal: TOTAL_LEVELS,
    rushBest: data.rush.best,
  };
}

export { districtOf };
