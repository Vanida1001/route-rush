// Date helpers. All dates are local calendar days as 'YYYY-MM-DD' strings.
// Day arithmetic goes through UTC so daylight-saving changes never matter.
import { LAUNCH_DATE } from './config.js';

const pad = (n) => String(n).padStart(2, '0');

export function dayNumber(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

export function fromDayNumber(n) {
  const dt = new Date(n * 86400000);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** Local calendar date of a Date object. */
export function localDateString(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 0 = Sunday ... 6 = Saturday. */
export function weekdayOf(dateStr) {
  return new Date(dayNumber(dateStr) * 86400000).getUTCDay();
}

export function puzzleNumberFor(dateStr, launch = LAUNCH_DATE) {
  return Math.max(1, dayNumber(dateStr) - dayNumber(launch) + 1);
}

export function dateForPuzzle(n, launch = LAUNCH_DATE) {
  return fromDayNumber(dayNumber(launch) + n - 1);
}

export function weekdayOfPuzzle(n, launch = LAUNCH_DATE) {
  return weekdayOf(dateForPuzzle(n, launch));
}

export function msUntilNextMidnight(now = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next - now;
}

export function formatCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
