// Stars and share text. Pure: the translate function is passed in.
import { STAR_TOLERANCE } from './config.js';

/** 3 stars = optimum, 2 stars = up to 15% above it, 1 star = any finished run. */
export function starsFor(fuel, best) {
  if (fuel <= best) return 3;
  if (fuel <= best * STAR_TOLERANCE) return 2;
  return 1;
}

export const starString = (stars) => '⭐'.repeat(stars);

const EMOJI = { parcel: '📦', express: '⚡', depot: '🏠' };

/** Order of deliveries only (never the route). Events may be objects or type strings. */
export function emojiLine(events) {
  return '🚚' + events.map((e) => EMOJI[typeof e === 'string' ? e : e.t] || '').join('');
}

/** Replaces {name} placeholders. */
export function format(str, vars = {}) {
  return String(str).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

export function buildShareText(t, { n, stars, fuel, best, events, streak }) {
  const lines = [
    `${t('share.title', { n })} ${starString(stars)}`,
    t('share.fuel', { fuel, best }),
    emojiLine(events),
  ];
  if (streak > 0) lines.push(t('share.streak', { n: streak }));
  return lines.join('\n');
}
