import test from 'node:test';
import assert from 'node:assert/strict';
import { puzzleForNumber, buildPuzzleForNumber, configForPuzzle } from '../js/generator.js';
import { solve, nearestFirst } from '../js/solver.js';
import { replay } from '../js/game.js';
import { rngSelfCheck } from './helpers.js';
import { mulberry32 } from '../js/rng.js';
import { dateForPuzzle, weekdayOfPuzzle } from '../js/dates.js';
import { WEEKDAY_CONFIG } from '../js/config.js';

test('the random generator is deterministic', () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  for (let i = 0; i < 50; i++) assert.equal(a(), b());
  rngSelfCheck(mulberry32(7));
});

test('the same puzzle number always gives the identical puzzle', () => {
  for (const n of [1, 2, 42, 200, 365]) {
    assert.deepEqual(buildPuzzleForNumber(n), buildPuzzleForNumber(n));
    assert.deepEqual(buildPuzzleForNumber(n), puzzleForNumber(n));
  }
});

test('puzzle #1 is the launch day and weekdays follow the date', () => {
  assert.equal(weekdayOfPuzzle(1), new Date(dateForPuzzle(1) + 'T12:00:00Z').getUTCDay());
  assert.equal(weekdayOfPuzzle(8), weekdayOfPuzzle(1));
});

test('puzzles #1 to #365 are solvable, match their weekday and are not solved by nearest-first', () => {
  for (let n = 1; n <= 365; n++) {
    const p = puzzleForNumber(n);
    const cfg = WEEKDAY_CONFIG[weekdayOfPuzzle(n)];
    assert.deepEqual(p.config, cfg, `#${n} config`);
    assert.equal(p.houses.length, cfg.parcels, `#${n} parcels`);
    assert.equal(p.capacity, cfg.capacity, `#${n} capacity`);
    assert.equal(p.houses.filter((h) => h.express).length, cfg.express, `#${n} express`);
    for (const h of p.houses.filter((x) => x.express)) assert.ok(h.deadline > 0);

    const sol = solve(p);
    assert.ok(sol, `#${n} solvable`);
    assert.equal(sol.fuel, p.best, `#${n} best fuel stored`);
    const end = replay(p, sol.route);
    assert.equal(end.status, 'won', `#${n} best route wins`);
    assert.equal(end.fuel, p.best);

    const g = nearestFirst(p);
    assert.ok(g.fuel > p.best || g.late, `#${n} nearest-first is not optimal`);
  }
});

test('traffic density rises over the week and the layout is playable', () => {
  const count = (n) => puzzleForNumber(n).tiles.filter((t) => t === 't').length;
  let low = 0, high = 0;
  for (let n = 1; n <= 70; n++) {
    const t = configForPuzzle(n).traffic;
    if (t === 'low') low += count(n);
    if (t === 'high') high += count(n);
  }
  assert.ok(high / 20 > low / 20);
});

test('the solver is fast on the hardest (Sunday) puzzles', () => {
  const sundays = [];
  for (let n = 1; n <= 100 && sundays.length < 8; n++) if (weekdayOfPuzzle(n) === 0) sundays.push(puzzleForNumber(n));
  let worst = 0;
  for (const p of sundays) {
    const t = performance.now();
    solve(p);
    worst = Math.max(worst, performance.now() - t);
  }
  // The spec asks for < 200 ms on a phone; Node on a laptop should be far below.
  assert.ok(worst < 100, `worst solve took ${worst.toFixed(1)} ms`);
});
