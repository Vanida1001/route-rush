// Generator for Career levels and Rush Hour puzzles. Pure.
//
// The daily generator (generator.js) is left untouched so daily puzzles never
// change. This one is more flexible: grid size, river with bridges, pickups,
// one-way streets, roadworks and express parcels. Each attempt is verified by the
// solver; if a check fails the next seed is tried, so a level is always solvable
// and identical on every load.
import { TRAFFIC_DENSITY } from './config.js';
import { mulberry32, hashSeed, randInt, shuffle } from './rng.js';
import { isWalkable } from './puzzle.js';
import { solve, nearestFirst } from './solver.js';
import { replay } from './game.js';
import { largestComponent } from './generator.js';
import { districtOf, levelInDistrict, isBoss } from './career.js';

const MAX_ATTEMPTS = 800;
const DIR_NAMES = ['up', 'right', 'down', 'left'];

/**
 * spec = { size, parcels, capacity, traffic (0..1 density), block (0..1), river,
 *          express, pickups, oneway, roadworks, greedy (reject if nearest-first is optimal) }
 */
function attempt(seed, spec) {
  const size = spec.size;
  const N = size * size;
  const rng = mulberry32(seed);
  const tiles = new Array(N);
  for (let i = 0; i < N; i++) {
    const r = rng();
    tiles[i] = r < (spec.block ?? 0.2) ? 'b' : r < (spec.block ?? 0.2) + 0.07 ? 'p' : 'r';
  }

  if (spec.river) {
    const vertical = rng() < 0.5;
    const riverAt = 2 + randInt(rng, size - 4);
    const at = (along, across) => (vertical ? along * size + across : across * size + along);
    for (let a = 0; a < size; a++) tiles[at(a, riverAt)] = 'w';
    const spots = shuffle(rng, [...Array(size).keys()]).slice(0, rng() < 0.6 ? 2 : 1);
    for (const a of spots) {
      tiles[at(a, riverAt)] = 'g';
      tiles[at(a, riverAt - 1)] = 'r';
      tiles[at(a, riverAt + 1)] = 'r';
    }
  }

  const comp = largestComponent(tiles, size);
  const need = spec.parcels + spec.pickups * 2 + 1 + (spec.oneway || 0) + (spec.roadworks || 0) + 4;
  if (comp.length < Math.max(need, Math.floor(N * 0.45))) return null;
  const inComp = new Set(comp);
  for (let i = 0; i < N; i++) {
    if (isWalkable(tiles[i]) && !inComp.has(i)) tiles[i] = tiles[i] === 'g' ? 'w' : rng() < 0.5 ? 'b' : 'p';
  }

  const free = shuffle(rng, comp.filter((i) => tiles[i] === 'r'));
  const depot = free.shift();
  const dist = (i, j) => Math.abs((i % size) - (j % size)) + Math.abs(((i / size) | 0) - ((j / size) | 0));
  const take = (count, minFromDepot) => {
    const out = [];
    for (let k = 0; k < free.length && out.length < count; k++) {
      if (dist(free[k], depot) >= minFromDepot) {
        out.push(free[k]);
        free.splice(k, 1);
        k--;
      }
    }
    return out.length === count ? out : null;
  };

  const houseTiles = take(spec.parcels, 2);
  if (!houseTiles) return null;
  const pickups = [];
  for (let c = 0; c < spec.pickups; c++) {
    const pair = take(2, 2);
    if (!pair || dist(pair[0], pair[1]) < 2) return null;
    pickups.push({ stall: pair[0], customer: pair[1], color: c });
  }
  const onewayTiles = take(spec.oneway || 0, 1);
  const worksTiles = take(spec.roadworks || 0, 1);
  if (!onewayTiles || !worksTiles) return null;

  const special = new Set([depot, ...houseTiles, ...pickups.flatMap((p) => [p.stall, p.customer]), ...onewayTiles, ...worksTiles]);
  let trafficCount = 0;
  for (const i of comp) {
    if (tiles[i] === 'r' && !special.has(i) && rng() < spec.traffic) {
      tiles[i] = 't';
      trafficCount++;
    }
  }
  if (spec.traffic > 0 && trafficCount === 0) return null; // the district's mechanic must be visible

  const puzzle = {
    size, tiles, depot, capacity: spec.capacity,
    houses: houseTiles.map((i) => ({ i, express: false, deadline: null })),
  };
  if (pickups.length) puzzle.pickups = pickups;
  if (onewayTiles.length) {
    puzzle.oneway = {};
    for (const i of onewayTiles) puzzle.oneway[i] = DIR_NAMES[randInt(rng, 4)];
  }

  // Roadworks close part-way through the best route, so they actually matter.
  if (worksTiles.length) {
    const base = solve(puzzle);
    if (!base) return null;
    puzzle.roadworks = {};
    for (const i of worksTiles) {
      puzzle.roadworks[i] = Math.max(2, Math.ceil(base.fuel * (0.35 + rng() * 0.5)));
    }
  }

  // Express deadlines from the best route so far, with a little slack.
  if (spec.express > 0) {
    const free0 = solve(puzzle);
    if (!free0) return null;
    const run = replay(puzzle, free0.route);
    const chosen = shuffle(rng, run.events.filter((e) => e.house !== undefined)).slice(0, spec.express);
    if (chosen.length < spec.express) return null;
    for (const e of chosen) {
      puzzle.houses[e.house].express = true;
      puzzle.houses[e.house].deadline = e.fuel + randInt(rng, 3);
    }
  }

  const sol = solve(puzzle);
  if (!sol || sol.fuel > 90 || sol.fuel < 4) return null;
  if (spec.greedy) {
    const g = nearestFirst(puzzle);
    if (!(g.fuel > sol.fuel || g.late)) return null;
  }
  puzzle.best = sol.fuel;
  puzzle.route = sol.route;
  return puzzle;
}

/** Builds a puzzle from a spec; tries successive seeds until every check passes. */
export function buildPuzzle(baseSeed, spec) {
  for (let a = 0; a < MAX_ATTEMPTS; a++) {
    const p = attempt(hashSeed(baseSeed, a), { pickups: 0, ...spec });
    if (p) return { ...p, attempts: a + 1 };
  }
  throw new Error('level generator failed for seed ' + baseSeed);
}

// ---------- Career ----------
export const DISTRICT_MECHANICS = ['basics', 'traffic', 'express', 'pickups', 'oneway', 'roadworks'];
const GRID = [5, 6, 6, 7, 7, 8];

/** The recipe for career level n (1..60). */
export function levelSpec(n) {
  const d = districtOf(n);
  const l = levelInDistrict(n);
  const boss = isBoss(n);
  const t = (l - 1) / 9;
  const lerp = (a, b) => Math.round(a + (b - a) * t);
  const spec = {
    size: GRID[d - 1], parcels: 3, capacity: 3, traffic: 0, block: 0.2, river: d >= 3,
    express: 0, pickups: 0, oneway: 0, roadworks: 0, greedy: false,
  };
  switch (d) {
    case 1: // basics: roads, blocks, depot, reloading
      Object.assign(spec, { parcels: l === 1 ? 2 : lerp(3, 4), capacity: 2, block: 0.22, greedy: l >= 5 });
      break;
    case 2: // traffic jams
      Object.assign(spec, { parcels: lerp(3, 5), capacity: l < 6 ? 2 : 3, traffic: 0.14 + 0.14 * t, greedy: l >= 4 });
      break;
    case 3: // express parcels and bridges
      Object.assign(spec, { parcels: lerp(4, 5), traffic: 0.14, express: l === 1 ? 1 : l >= 6 || boss ? 2 : 1, greedy: l >= 4 });
      break;
    case 4: // pickups
      Object.assign(spec, { parcels: lerp(3, 4), traffic: 0.12, pickups: l < 5 ? 1 : 2 });
      break;
    case 5: // one-way streets
      Object.assign(spec, { parcels: lerp(3, 5), traffic: 0.12, oneway: lerp(2, 5) });
      break;
    default: // roadworks
      Object.assign(spec, { parcels: lerp(4, 5), traffic: 0.12, roadworks: lerp(1, 3) });
  }
  if (boss && d >= 2) {
    // Boss levels mix every mechanic seen so far.
    spec.parcels = Math.min(6, spec.parcels + 1);
    spec.traffic = 0.18;
    if (d >= 3) spec.express = 2;
    if (d >= 4) spec.pickups = d >= 6 ? 2 : 1;
    if (d >= 5) spec.oneway = Math.max(spec.oneway, 4);
    if (d >= 6) spec.roadworks = 3;
  }
  if (boss && d === 1) spec.parcels = 4;
  return spec;
}

/** Builds career level n from scratch (no cache). */
export function buildCareerLevel(n) {
  return { ...buildPuzzle(hashSeed(0x43617265, n), levelSpec(n)), n, spec: levelSpec(n) };
}

const careerCache = new Map();

/** Career level n (1..60): same for every player, every load. */
export function careerLevel(n) {
  if (!careerCache.has(n)) {
    careerCache.set(n, buildCareerLevel(n));
  }
  return careerCache.get(n);
}

// ---------- Rush Hour ----------
/** A small 5x5 Rush Hour puzzle: 2-3 parcels, no express. Same seed, same puzzle. */
export function rushPuzzle(runSeed, index) {
  const seed = hashSeed(0x52757368, runSeed, index);
  const parcels = 2 + (seed % 2);
  return {
    ...buildPuzzle(seed, { size: 5, parcels, capacity: 2, traffic: 0.1, block: 0.18, river: false, express: 0 }),
    n: 0,
  };
}

export { TRAFFIC_DENSITY };
