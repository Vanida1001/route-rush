import test from 'node:test';
import assert from 'node:assert/strict';
import { applyDailyCompletion, effectiveStreak, newStreak } from '../js/streak.js';
import { starsFor, buildShareText, emojiLine, format } from '../js/share.js';
import { dayNumber, fromDayNumber, puzzleNumberFor, dateForPuzzle, formatCountdown } from '../js/dates.js';
import { sanitize, defaultData, load, save } from '../js/storage.js';
import { recordFinish, computeStats } from '../js/progress.js';
import { puzzleForNumber } from '../js/generator.js';
import { replay } from '../js/game.js';
import { unlockedSkinIds } from '../js/skins.js';
import { earnedIds } from '../js/achievements.js';

// ---------- streaks ----------
const complete = (s, day) => applyDailyCompletion(s, day);

test('streak: consecutive days add up and the same day is not counted twice', () => {
  let s = newStreak();
  s = complete(s, '2026-11-16').streak;
  s = complete(s, '2026-11-17').streak;
  assert.equal(s.current, 2);
  const again = complete(s, '2026-11-17');
  assert.equal(again.changed, false);
  assert.equal(again.streak.current, 2);
});

test('streak: a missed day without a freeze resets it', () => {
  let s = { current: 5, best: 5, lastDate: '2026-11-16', freezes: 0 };
  assert.equal(effectiveStreak(s, '2026-11-17'), 5, 'still alive the next day');
  assert.equal(effectiveStreak(s, '2026-11-18'), 0, 'lapsed after a missed day');
  s = complete(s, '2026-11-18').streak;
  assert.equal(s.current, 1);
  assert.equal(s.best, 5, 'best streak is kept');
});

test('streak: a freeze protects one missed day, two missed days need two freezes', () => {
  const s = { current: 7, best: 7, lastDate: '2026-11-16', freezes: 1 };
  assert.equal(effectiveStreak(s, '2026-11-18'), 7);
  const r = complete(s, '2026-11-18');
  assert.equal(r.usedFreezes, 1);
  assert.equal(r.streak.current, 8);
  assert.equal(r.streak.freezes, 0);

  assert.equal(effectiveStreak(s, '2026-11-19'), 0, 'two missed days with one freeze');
  assert.equal(complete(s, '2026-11-19').streak.current, 1);
  const two = { ...s, freezes: 2 };
  const r2 = complete(two, '2026-11-19');
  assert.equal(r2.streak.current, 8);
  assert.equal(r2.streak.freezes, 0);
});

test('streak: every 7th day earns a freeze, capped at 2', () => {
  let s = { current: 6, best: 6, lastDate: '2026-11-16', freezes: 0 };
  let r = complete(s, '2026-11-17');
  assert.equal(r.streak.current, 7);
  assert.equal(r.streak.freezes, 1);
  assert.equal(r.earnedFreeze, true);
  s = { current: 13, best: 13, lastDate: '2026-11-16', freezes: 2 };
  r = complete(s, '2026-11-17');
  assert.equal(r.streak.freezes, 2, 'cap of 2');
  assert.equal(r.earnedFreeze, false);
});

test('streak: month and year changes, leap day', () => {
  let s = { current: 3, best: 3, lastDate: '2026-11-30', freezes: 0 };
  assert.equal(complete(s, '2026-12-01').streak.current, 4, 'month change');
  s = { current: 9, best: 9, lastDate: '2026-12-31', freezes: 0 };
  assert.equal(complete(s, '2027-01-01').streak.current, 10, 'year change');
  s = { current: 2, best: 2, lastDate: '2028-02-28', freezes: 0 };
  assert.equal(complete(s, '2028-02-29').streak.current, 3, 'leap day');
  assert.equal(complete(s, '2028-03-01').streak.current, 1, 'skipping the leap day');
  assert.equal(dayNumber('2028-03-01') - dayNumber('2028-02-28'), 2);
  s = { current: 4, best: 4, lastDate: '2026-12-30', freezes: 1 };
  assert.equal(complete(s, '2027-01-01').streak.current, 5, 'freeze across new year');
});

// ---------- dates ----------
test('date helpers round-trip and number puzzles from the launch day', () => {
  assert.equal(fromDayNumber(dayNumber('2026-03-29')), '2026-03-29'); // DST day in Europe
  assert.equal(puzzleNumberFor(dateForPuzzle(1)), 1);
  assert.equal(puzzleNumberFor(dateForPuzzle(42)), 42);
  assert.equal(puzzleNumberFor('2000-01-01'), 1, 'before launch clamps to #1');
  assert.equal(formatCountdown(3661000), '01:01:01');
});

// ---------- stars and share text ----------
test('stars: optimum = 3, up to 15% above = 2, otherwise 1', () => {
  assert.equal(starsFor(18, 18), 3);
  assert.equal(starsFor(20, 18), 2);
  assert.equal(starsFor(20.7, 18), 2);
  assert.equal(starsFor(21, 18), 1);
});

const en = { 'share.title': 'Route Rush #{n}', 'share.fuel': 'Fuel {fuel} / best {best}', 'share.streak': '🔥 Streak {n}' };
const tt = (k, v) => format(en[k], v);

test('share text matches the spec format and never reveals the route', () => {
  const text = buildShareText(tt, {
    n: 42, stars: 3, fuel: 18, best: 18,
    events: ['parcel', 'parcel', 'express', 'parcel', 'depot', 'parcel'], streak: 12,
  });
  assert.equal(text, 'Route Rush #42 ⭐⭐⭐\nFuel 18 / best 18\n🚚📦📦⚡📦🏠📦\n🔥 Streak 12');
  assert.equal(emojiLine([{ t: 'parcel' }, { t: 'depot' }]), '🚚📦🏠');
  assert.ok(!buildShareText(tt, { n: 1, stars: 1, fuel: 5, best: 4, events: [], streak: 0 }).includes('Streak'));
});

// ---------- storage ----------
test('storage: broken or missing data starts fresh, bad fields are dropped', () => {
  assert.deepEqual(sanitize(null), defaultData());
  assert.deepEqual(sanitize('junk'), defaultData());
  assert.deepEqual(sanitize({ v: 2 }), defaultData());
  const d = sanitize({ v: 1, settings: { lang: 'xx', sound: 'yes', skin: 5 }, streak: { current: 'a', best: 3 }, history: [] });
  assert.equal(d.settings.lang, null);
  assert.equal(d.settings.sound, false);
  assert.equal(d.settings.skin, 'classic');
  assert.equal(d.streak.current, 0);
  assert.equal(d.streak.best, 3);
  assert.deepEqual(d.history, {});
  const throwing = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.deepEqual(load(throwing), defaultData());
  assert.equal(save(defaultData(), throwing), false);
  const mem = new Map();
  const fake = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  assert.equal(load({ getItem: () => '{not json' }).v, 1);
  const data = defaultData();
  data.settings.lang = 'fr';
  save(data, fake);
  assert.equal(load(fake).settings.lang, 'fr');
});

// ---------- recording finished runs ----------
const solved = (p) => replay(p, p.route);
const at = (h) => ({ getHours: () => h });

test('only the first finished run counts; replays never touch the streak', () => {
  const data = defaultData();
  const p = puzzleForNumber(3);
  const run = { mode: 'daily', n: 3, puzzle: p, state: solved(p), now: at(23), today: '2026-11-18' };
  const r1 = recordFinish(data, run);
  assert.equal(r1.counted, true);
  assert.equal(r1.stars, 3);
  assert.equal(data.streak.current, 1);
  assert.ok(data.achievements.first_run && data.achievements.night_owl && data.achievements.pure);

  const r2 = recordFinish(data, run);
  assert.equal(r2.counted, false);
  assert.equal(data.streak.current, 1);
  assert.equal(Object.keys(data.history).length, 1);

  const arch = recordFinish(data, { ...run, mode: 'archive', n: 2, puzzle: puzzleForNumber(2), state: solved(puzzleForNumber(2)) });
  assert.equal(arch.counted, true);
  assert.equal(data.streak.current, 1, 'archive gives stars but no streak');


  const stats = computeStats(data, '2026-11-18');
  assert.equal(stats.played, 2);
  assert.equal(stats.dist[3], 2);
  assert.equal(stats.threeStarDays, 2);
  assert.equal(stats.streak, 1);
});

test('skins unlock from streaks and three-star days', () => {
  const data = defaultData();
  assert.deepEqual(unlockedSkinIds(data), ['classic']);
  data.streak.best = 7;
  assert.deepEqual(unlockedSkinIds(data), ['classic', 'electric', 'bike']);
  for (let n = 1; n <= 10; n++) data.history[n] = { n, stars: 3 };
  assert.ok(unlockedSkinIds(data).includes('taxi'));
  assert.ok(!unlockedSkinIds(data).includes('golden'));
});

test('perfect week needs 7 three-star puzzles in a row', () => {
  const data = defaultData();
  for (let n = 1; n <= 6; n++) data.history[n] = { n, stars: 3, kind: 'daily' };
  assert.ok(!earnedIds(data).includes('perfect_week'));
  data.history[7] = { n: 7, stars: 3, kind: 'daily' };
  assert.ok(earnedIds(data).includes('perfect_week'));
});
