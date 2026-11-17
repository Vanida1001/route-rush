import test from 'node:test';
import assert from 'node:assert/strict';
import { careerLevel, buildCareerLevel, levelSpec, rushPuzzle } from '../js/levels.js';
import { solve } from '../js/solver.js';
import { replay } from '../js/game.js';
import { districtOf, levelInDistrict, isBoss, isLevelUnlocked, isDistrictUnlocked, isDistrictComplete, districtStars, careerSummary, nextLevel } from '../js/career.js';
import { defaultData } from '../js/storage.js';

const GRID = [5, 6, 6, 7, 7, 8];
const count = (p, f) => p.tiles.filter(f).length;
const has = {
  traffic: (p) => count(p, (t) => t === 't') > 0,
  bridges: (p) => count(p, (t) => t === 'g') > 0,
  express: (p) => p.houses.some((h) => h.express),
  pickups: (p) => (p.pickups || []).length > 0,
  oneway: (p) => Object.keys(p.oneway || {}).length > 0,
  roadworks: (p) => Object.keys(p.roadworks || {}).length > 0,
};
// Mechanics a district adds (cumulative list is used for boss levels).
const NEW = [[], ['traffic'], ['express', 'bridges'], ['pickups'], ['oneway'], ['roadworks']];

test('all 60 career levels are solvable and the stored best is the true minimum', () => {
  for (let n = 1; n <= 60; n++) {
    const p = careerLevel(n);
    assert.equal(p.size, GRID[districtOf(n) - 1], `level ${n} grid size`);
    const sol = solve(p);
    assert.ok(sol, `level ${n} solvable`);
    assert.equal(sol.fuel, p.best, `level ${n} best`);
    const end = replay(p, sol.route);
    assert.equal(end.status, 'won', `level ${n} best route wins`);
    assert.equal(end.fuel, p.best);
  }
});

test('every level uses its district mechanic; district 1 stays basic', () => {
  for (let n = 1; n <= 60; n++) {
    const d = districtOf(n);
    const p = careerLevel(n);
    for (const m of NEW[d - 1]) assert.ok(has[m](p), `level ${n} (district ${d}) should have ${m}`);
    if (d === 1) {
      for (const m of Object.keys(has)) assert.ok(!has[m](p), `level ${n} should be basic, found ${m}`);
    }
  }
});

test('boss levels (every 10th) mix every mechanic seen so far', () => {
  for (let d = 2; d <= 6; d++) {
    const n = d * 10;
    assert.ok(isBoss(n));
    const p = careerLevel(n);
    for (let k = 2; k <= d; k++) for (const m of NEW[k - 1]) assert.ok(has[m](p), `boss ${n} should have ${m}`);
  }
});

test('levels are identical on every load (rebuilt from scratch each time)', () => {
  for (let n = 1; n <= 60; n++) {
    assert.deepEqual(buildCareerLevel(n), buildCareerLevel(n), `level ${n}`);
    assert.deepEqual(buildCareerLevel(n), careerLevel(n), `level ${n} vs cache`);
  }
  assert.equal(levelSpec(35).size, 7);
  assert.equal(levelInDistrict(35), 5);
});

test('levels get harder inside a district', () => {
  assert.ok(levelSpec(10).parcels >= levelSpec(1).parcels);
  assert.ok(levelSpec(26).oneway > levelSpec(21).oneway - 1);
});

// ---------- progress rules ----------
test('finishing a level unlocks the next; 20 of 30 stars unlock the next district', () => {
  const d = defaultData();
  assert.ok(isLevelUnlocked(d, 1));
  assert.ok(!isLevelUnlocked(d, 2));
  d.career.levels[1] = { stars: 1, fuel: 9 };
  assert.ok(isLevelUnlocked(d, 2));
  assert.ok(!isDistrictUnlocked(d, 2));
  for (let n = 1; n <= 10; n++) d.career.levels[n] = { stars: 1, fuel: 9 };
  assert.ok(isDistrictComplete(d, 1));
  assert.ok(!isLevelUnlocked(d, 11), 'all 10 finished but only 10 stars');
  for (let n = 1; n <= 7; n++) d.career.levels[n] = { stars: 3, fuel: 9 };
  assert.equal(districtStars(d, 1), 21 + 3);
  assert.ok(isLevelUnlocked(d, 11));
  assert.ok(!isLevelUnlocked(d, 12));
  assert.equal(careerSummary(d).done, 10);
  assert.equal(nextLevel(d), 11);
});

// ---------- Rush Hour puzzles ----------
test('rush puzzles are 5x5, have 2-3 parcels, no express, are solvable and deterministic', () => {
  for (let i = 0; i < 60; i++) {
    const p = rushPuzzle(12345, i);
    assert.equal(p.size, 5);
    assert.ok(p.houses.length >= 2 && p.houses.length <= 3);
    assert.ok(!p.houses.some((h) => h.express));
    assert.equal(solve(p).fuel, p.best);
    assert.deepEqual(rushPuzzle(12345, i).tiles, p.tiles);
  }
});
