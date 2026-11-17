// Puzzle generator: builds a puzzle from a seed and a difficulty config. Pure.
//
// Each attempt lays out a city (river with bridges, buildings, parks, roads),
// places the depot and houses on the largest connected road area, adds traffic
// and express deadlines, then checks the result with the solver. If a check
// fails the generator simply tries the next seed.
import { SIZE, TRAFFIC_DENSITY, WEEKDAY_CONFIG } from './config.js';
import { mulberry32, hashSeed, randInt, shuffle } from './rng.js';
import { isWalkable, neighbors } from './puzzle.js';
import { solve, nearestFirst } from './solver.js';
import { replay } from './game.js';
import { weekdayOfPuzzle } from './dates.js';

const MAX_ATTEMPTS = 400;

function layout(rng, size) {
  const N = size * size;
  const tiles = new Array(N);
  const vertical = rng() < 0.5;
  const riverAt = 2 + randInt(rng, size - 4); // river column/row, not on the edge
  const at = (along, across) => (vertical ? along * size + across : across * size + along);

  for (let i = 0; i < N; i++) {
    const r = rng();
    tiles[i] = r < 0.22 ? 'b' : r < 0.3 ? 'p' : 'r';
  }
  for (let a = 0; a < size; a++) tiles[at(a, riverAt)] = 'w';

  // One or two bridges, with road on both banks so they connect.
  const spots = shuffle(rng, [...Array(size).keys()]).slice(0, rng() < 0.6 ? 2 : 1);
  for (const a of spots) {
    tiles[at(a, riverAt)] = 'g';
    tiles[at(a, riverAt - 1)] = 'r';
    tiles[at(a, riverAt + 1)] = 'r';
  }
  return tiles;
}

/** Largest connected set of drivable tiles. */
export function largestComponent(tiles, size) {
  const seen = new Set();
  let best = [];
  for (let i = 0; i < tiles.length; i++) {
    if (!isWalkable(tiles[i]) || seen.has(i)) continue;
    const comp = [i];
    seen.add(i);
    for (let h = 0; h < comp.length; h++) {
      for (const q of neighbors(size, comp[h])) {
        if (isWalkable(tiles[q]) && !seen.has(q)) {
          seen.add(q);
          comp.push(q);
        }
      }
    }
    if (comp.length > best.length) best = comp;
  }
  return best;
}

function attempt(seed, config) {
  const size = SIZE;
  const rng = mulberry32(seed);
  const tiles = layout(rng, size);
  const comp = largestComponent(tiles, size);
  if (comp.length < 24) return null;
  const inComp = new Set(comp);

  // Tiles outside the main road network become scenery so every road matters.
  for (let i = 0; i < tiles.length; i++) {
    if (isWalkable(tiles[i]) && !inComp.has(i)) tiles[i] = tiles[i] === 'g' ? 'w' : rng() < 0.5 ? 'b' : 'p';
  }

  const candidates = shuffle(rng, comp.filter((i) => tiles[i] === 'r'));
  const depot = candidates[0];
  const dx = (i) => Math.abs((i % size) - (depot % size)) + Math.abs(((i / size) | 0) - ((depot / size) | 0));
  const picks = candidates.slice(1).filter((i) => dx(i) >= 2).slice(0, config.parcels);
  if (picks.length < config.parcels) return null;

  const houseSet = new Set(picks);
  const density = TRAFFIC_DENSITY[config.traffic];
  for (const i of comp) {
    if (tiles[i] === 'r' && i !== depot && !houseSet.has(i) && rng() < density) tiles[i] = 't';
  }

  const houses = picks.map((i) => ({ i, express: false, deadline: null }));
  const puzzle = { size, tiles, depot, houses, capacity: config.capacity };

  // Express deadlines: take the optimal route without deadlines, then allow a
  // little slack over the fuel at which it reaches each chosen house.
  if (config.express > 0) {
    const free = solve(puzzle);
    if (!free) return null;
    const run = replay(puzzle, free.route);
    const chosen = shuffle(rng, run.events.filter((e) => e.house !== undefined)).slice(0, config.express);
    for (const e of chosen) {
      houses[e.house].express = true;
      houses[e.house].deadline = e.fuel + randInt(rng, 3);
    }
  }

  const sol = solve(puzzle);
  if (!sol) return null;
  if (sol.fuel < houses.length * 2 || sol.fuel > 70) return null;

  // The nearest-house-first route must be worse than the optimum (or miss a deadline).
  const greedy = nearestFirst(puzzle);
  if (!(greedy.fuel > sol.fuel || greedy.late)) return null;

  puzzle.best = sol.fuel;
  puzzle.route = sol.route;
  return puzzle;
}

/** Generates a puzzle for a seed + config; tries successive seeds until all checks pass. */
export function generatePuzzle(baseSeed, config) {
  for (let a = 0; a < MAX_ATTEMPTS; a++) {
    const p = attempt(hashSeed(baseSeed, a), config);
    if (p) return { ...p, config, attempts: a + 1 };
  }
  throw new Error('generator failed for seed ' + baseSeed);
}

export function configForPuzzle(n) {
  return WEEKDAY_CONFIG[weekdayOfPuzzle(n)];
}

const cache = new Map();

/** Builds the daily puzzle #n from scratch (no cache). */
export function buildPuzzleForNumber(n) {
  return { ...generatePuzzle(hashSeed(0x52756c, n), configForPuzzle(n)), n };
}

/** The daily puzzle (#n). Always identical for the same n. */
export function puzzleForNumber(n) {
  if (!cache.has(n)) cache.set(n, buildPuzzleForNumber(n));
  return cache.get(n);
}

