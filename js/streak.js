// Streak and streak-freeze logic. Pure; dates are 'YYYY-MM-DD' local days.
import { dayNumber } from './dates.js';

export const MAX_FREEZES = 2;
export const FREEZE_EVERY = 7;

export const newStreak = () => ({ current: 0, best: 0, lastDate: null, freezes: 0 });

/** Streak as the player should see it today (a lapsed streak shows 0). */
export function effectiveStreak(streak, today) {
  if (!streak.lastDate) return 0;
  const gap = dayNumber(today) - dayNumber(streak.lastDate);
  if (gap <= 1) return streak.current;
  const missed = gap - 1;
  return missed <= streak.freezes ? streak.current : 0;
}

/**
 * Records that today's daily puzzle was finished (first run only).
 * Missed days are covered by freezes, one freeze per missed day; if there are
 * not enough freezes the streak restarts at 1. Every 7th day of streak earns a freeze.
 */
export function applyDailyCompletion(streak, today) {
  const s = { ...streak };
  const out = { streak: s, usedFreezes: 0, earnedFreeze: false, changed: false };
  if (s.lastDate && dayNumber(today) <= dayNumber(s.lastDate)) return out; // already counted
  out.changed = true;
  if (!s.lastDate) {
    s.current = 1;
  } else {
    const missed = dayNumber(today) - dayNumber(s.lastDate) - 1;
    if (missed <= s.freezes) {
      s.freezes -= missed;
      out.usedFreezes = missed;
      s.current += 1;
    } else {
      s.current = 1;
    }
  }
  s.lastDate = today;
  s.best = Math.max(s.best, s.current);
  if (s.current % FREEZE_EVERY === 0 && s.freezes < MAX_FREEZES) {
    s.freezes += 1;
    out.earnedFreeze = true;
  }
  return out;
}
