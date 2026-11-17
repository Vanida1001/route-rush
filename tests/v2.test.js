import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitize, defaultData, load, save } from '../js/storage.js';
import { recordFinish, recordRush, computeStats } from '../js/progress.js';
import { careerLevel } from '../js/levels.js';
import { replay } from '../js/game.js';
import { effectiveStreak } from '../js/streak.js';
import { unlockedSkinIds } from '../js/skins.js';
import { earnedIds } from '../js/achievements.js';
import { RUSH, newRun, bonusSeconds, tick, solved, skip } from '../js/rush.js';

// ---------- old saved data ----------
test('data saved by version 1 loads without losing anything, and gets the new fields', () => {
  const v1 = {
    v: 1,
    settings: { lang: 'fr', sound: true, contrast: false, skin: 'taxi', seenHowTo: true },
    progress: { 'daily:7': { path: [37, 30], undos: 1, fails: 0 } },
    history: { 3: { n: 3, fuel: 12, best: 12, stars: 3, kind: 'daily', date: '2026-11-18', hour: 9, events: ['parcel'], undos: 0, lateFails: 0 } },
    started: { 3: true },
    streak: { current: 12, best: 20, lastDate: '2026-11-18', freezes: 2 },
    unlocks: ['classic'],
    achievements: { first_run: '2026-11-18', practice_10: '2026-11-19' },
    stats: { practiceDone: 11 },
  };
  const mem = new Map([['routeRush.v1', JSON.stringify(v1)]]);
  const d = load({ getItem: (k) => mem.get(k) ?? null });
  assert.deepEqual(d.streak, v1.streak, 'streak intact');
  assert.equal(effectiveStreak(d.streak, '2026-11-19'), 12);
  assert.deepEqual(d.history, v1.history);
  assert.deepEqual(d.progress, v1.progress, 'in-progress daily run intact');
  assert.equal(d.settings.lang, 'fr');
  assert.equal(d.settings.skin, 'taxi');
  assert.deepEqual(d.career, { levels: {} });
  assert.deepEqual(d.rush, { best: 0 });
  assert.equal(d.achievements.practice_10, '2026-11-19', 'old achievements are kept');
  // and it saves/loads again unchanged
  const out = new Map();
  save(d, { setItem: (k, v) => out.set(k, v) });
  assert.deepEqual(sanitize(JSON.parse(out.get('routeRush.v1'))), d);
});

test('new saved fields are validated', () => {
  const d = sanitize({ v: 1, career: { levels: { 1: { stars: 3, fuel: 9 }, 2: { stars: 9, fuel: 1 }, 3: 'x' } }, rush: { best: -4 } });
  assert.deepEqual(Object.keys(d.career.levels), ['1']);
  assert.equal(d.rush.best, 0);
  assert.equal(sanitize({ v: 1, rush: { best: 14.7 } }).rush.best, 14);
});

// ---------- career progress ----------
const solvedState = (p) => replay(p, p.route);
const at = { getHours: () => 12 };

test('career: stars are kept as the best result, the streak and history are untouched', () => {
  const data = defaultData();
  data.streak = { current: 5, best: 5, lastDate: '2026-11-18', freezes: 1 };
  const before = JSON.stringify(data.streak);
  const p = careerLevel(1);
  const r1 = recordFinish(data, { mode: 'career', n: 1, puzzle: p, state: solvedState(p), now: at, today: '2026-11-18' });
  assert.equal(r1.counted, true);
  assert.equal(data.career.levels[1].stars, 3);
  assert.deepEqual(Object.keys(data.history), [], 'career does not touch daily history');
  assert.equal(JSON.stringify(data.streak), before, 'career never affects the streak');
  const r2 = recordFinish(data, { mode: 'career', n: 1, puzzle: p, state: solvedState(p), now: at, today: '2026-11-18' });
  assert.equal(r2.counted, false);
  assert.equal(computeStats(data, '2026-11-18').careerStars, 3);
});

test('career: finishing a whole district earns its van skin and 20 stars open the next district', () => {
  const data = defaultData();
  for (let n = 1; n <= 9; n++) data.career.levels[n] = { stars: 2, fuel: 10 };
  const p = careerLevel(10);
  const res = recordFinish(data, { mode: 'career', n: 10, puzzle: p, state: solvedState(p), now: at, today: '2026-11-18' });
  assert.ok(res.newSkins.includes('tiong'));
  assert.ok(unlockedSkinIds(data).includes('tiong'));
  assert.equal(res.newDistrict, 2, '2*9+3 = 21 stars opens district 2');
});

// ---------- Rush Hour ----------
test('rush: bonus seconds are 10 for the best fuel, 5 for one above, 0 otherwise', () => {
  assert.equal(bonusSeconds(8, 8), 10);
  assert.equal(bonusSeconds(7, 8), 10);
  assert.equal(bonusSeconds(9, 8), 5);
  assert.equal(bonusSeconds(10, 8), 0);
});

test('rush: solving adds a point and bonus time', () => {
  let run = newRun();
  assert.equal(run.remainingMs, 180000);
  run = tick(run, 60000);
  run = solved(run, 8, 8);
  assert.equal(run.solved, 1);
  assert.equal(run.remainingMs, 130000);
  run = solved(run, 9, 8);
  assert.equal(run.remainingMs, 135000);
  run = solved(run, 12, 8);
  assert.equal(run.solved, 3);
  assert.equal(run.remainingMs, 135000);
});

test('rush: skip costs 15 seconds and scores nothing', () => {
  let run = skip(newRun());
  assert.equal(run.remainingMs, 165000);
  assert.equal(run.solved, 0);
  assert.equal(run.over, false);
});

test('rush: game over when the timer reaches 0, then nothing changes', () => {
  let run = tick(newRun(), 179999);
  assert.equal(run.over, false);
  run = tick(run, 1);
  assert.equal(run.over, true);
  assert.equal(run.remainingMs, 0);
  assert.equal(solved(run, 5, 5).solved, 0);
  const over = tick(run, 5000);
  assert.equal(over.remainingMs, 0);
  // skipping with less than 15 s left ends the run
  const low = tick(newRun(), RUSH.DURATION_MS - 10000);
  assert.equal(skip(low).over, true);
  // a solve with a bonus can rescue a run that is about to end
  assert.equal(solved(tick(newRun(), 179000), 5, 5).over, false);
});

test('rush: best score is saved, and Rush 10 / Rush 20 achievements unlock', () => {
  const data = defaultData();
  let r = recordRush(data, 7, '2026-11-18');
  assert.equal(r.isNewBest, true);
  assert.equal(data.rush.best, 7);
  r = recordRush(data, 5, '2026-11-18');
  assert.equal(r.isNewBest, false);
  assert.equal(data.rush.best, 7);
  r = recordRush(data, 10, '2026-11-18');
  assert.deepEqual(r.newAchievements, ['rush_10']);
  r = recordRush(data, 21, '2026-11-18');
  assert.deepEqual(r.newAchievements, ['rush_20']);
  assert.ok(earnedIds(data).includes('rush_20'));
  assert.equal(computeStats(data, '2026-11-18').rushBest, 21);
});
