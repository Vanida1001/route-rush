// Solver: minimum fuel (and the route) for a puzzle. Pure.
//
// Dijkstra over states (van position, set of delivered parcels, parcels in the
// van, progress of each pickup). Costs are 1 or 2, so a bucket queue indexed by
// fuel is enough. Express deadlines, one-way streets and roadworks all depend
// only on "fuel used so far" in a way where less fuel is never worse, so the
// first time a state is reached with the least fuel is the one that counts.
// The rules mirror game.js exactly.
import { isWalkable, neighbors, dirBetween } from './puzzle.js';

/** @returns {{fuel:number, route:number[]} | null} route = tile indexes from the depot. */
export function solve(puzzle) {
  const { size, tiles, houses, capacity, depot } = puzzle;
  const pickups = puzzle.pickups || [];
  const N = size * size;
  const K = houses.length;
  const P = pickups.length;
  const M = 1 << K;
  const L = capacity + 1;
  const Q = 3 ** P;
  const full = M - 1;
  const allDone = Q - 1; // every pickup digit = 2

  const houseOf = new Int8Array(N).fill(-1);
  houses.forEach((h, k) => (houseOf[h.i] = k));
  const stallOf = new Int8Array(N).fill(-1);
  const custOf = new Int8Array(N).fill(-1);
  const pow3 = [];
  pickups.forEach((p, i) => {
    stallOf[p.stall] = i;
    custOf[p.customer] = i;
    pow3.push(3 ** i);
  });
  const digit = (pk, i) => ((pk / pow3[i]) | 0) % 3;
  const carriedOf = new Uint8Array(Q);
  for (let pk = 0; pk < Q; pk++) for (let i = 0; i < P; i++) if (digit(pk, i) === 1) carriedOf[pk]++;

  const cost = new Uint8Array(N);
  const adj = [];
  for (let i = 0; i < N; i++) {
    cost[i] = tiles[i] === 't' ? 2 : 1;
    adj.push(isWalkable(tiles[i]) ? neighbors(size, i).filter((q) => isWalkable(tiles[q])) : []);
  }
  const arrow = new Array(N).fill(null);
  for (const [i, d] of Object.entries(puzzle.oneway || {})) arrow[i] = d;
  const works = new Int32Array(N).fill(0x7fffffff);
  for (const [i, n] of Object.entries(puzzle.roadworks || {})) works[i] = n;
  const express = [];
  houses.forEach((h, k) => h.express && express.push([k, h.deadline]));

  const total = N * M * L * Q;
  const dist = new Int32Array(total).fill(0x7fffffff);
  const parent = new Int32Array(total).fill(-1);
  const startLoad = Math.min(capacity, K);
  const start = ((depot * M + 0) * L + startLoad) * Q + 0;
  dist[start] = 0;
  const buckets = [[start]];

  for (let f = 0; f < buckets.length; f++) {
    const bucket = buckets[f];
    if (!bucket) continue;
    for (let bi = 0; bi < bucket.length; bi++) {
      const s = bucket[bi];
      if (dist[s] !== f) continue;
      const pk = s % Q;
      let r = (s / Q) | 0;
      const load = r % L;
      r = (r / L) | 0;
      const mask = r % M;
      const pos = (r / M) | 0;
      if (mask === full && pk === allDone) return { fuel: f, route: reconstruct(s) };
      const carried = carriedOf[pk];

      for (const q of adj[pos]) {
        if (arrow[q] && dirBetween(size, pos, q) !== arrow[q]) continue;
        if (f >= works[q]) continue;
        const nf = f + cost[q];
        let nm = mask;
        let nl = load;
        let npk = pk;
        const k = houseOf[q];
        const sp = stallOf[q];
        const cu = custOf[q];
        if (k >= 0 && !((mask >> k) & 1) && load > 0) {
          nm |= 1 << k;
          nl -= 1;
        } else if (sp >= 0 && digit(pk, sp) === 0 && load + carried < capacity) {
          npk += pow3[sp];
        } else if (cu >= 0 && digit(pk, cu) === 1) {
          npk += pow3[cu];
        } else if (q === depot && load < capacity - carried) {
          nl = capacity - carried;
        }
        let ok = true;
        for (let e = 0; e < express.length; e++) {
          if (!((mask >> express[e][0]) & 1) && nf > express[e][1]) {
            ok = false;
            break;
          }
        }
        if (!ok) continue;
        const ns = ((q * M + nm) * L + nl) * Q + npk;
        if (dist[ns] > nf) {
          dist[ns] = nf;
          parent[ns] = s;
          (buckets[nf] || (buckets[nf] = [])).push(ns);
        }
      }
    }
  }
  return null;

  function reconstruct(goal) {
    const route = [];
    for (let s = goal; s !== -1; s = parent[s]) route.push((((s / Q) | 0) / L | 0) / M | 0);
    return route.reverse();
  }
}

/** Shortest fuel cost from one tile to every tile (Infinity if unreachable). Ignores v2 mechanics. */
export function distancesFrom(puzzle, src) {
  const { size, tiles } = puzzle;
  const N = size * size;
  const d = new Array(N).fill(Infinity);
  d[src] = 0;
  const done = new Array(N).fill(false);
  for (;;) {
    let u = -1;
    for (let i = 0; i < N; i++) if (!done[i] && d[i] < Infinity && (u < 0 || d[i] < d[u])) u = i;
    if (u < 0) break;
    done[u] = true;
    for (const q of neighbors(size, u)) {
      if (!isWalkable(tiles[q])) continue;
      const nd = d[u] + (tiles[q] === 't' ? 2 : 1);
      if (nd < d[q]) d[q] = nd;
    }
  }
  return d;
}

/**
 * The "obvious" strategy: always drive to the nearest undelivered house, and go
 * back to the depot whenever the van is empty. Used to reject puzzles that this
 * simple strategy already solves optimally. Only meaningful for puzzles without
 * the version 2 mechanics.
 * @returns {{fuel:number, late:boolean}}
 */
export function nearestFirst(puzzle) {
  const { houses, capacity, depot } = puzzle;
  const left = new Set(houses.map((_, k) => k));
  const dist = new Map();
  const from = (i) => {
    if (!dist.has(i)) dist.set(i, distancesFrom(puzzle, i));
    return dist.get(i);
  };
  let pos = depot;
  let load = capacity;
  let fuel = 0;
  let late = false;
  while (left.size) {
    if (load === 0) {
      fuel += from(pos)[depot];
      pos = depot;
      load = capacity;
      continue;
    }
    const d = from(pos);
    let best = -1;
    for (const k of left) {
      if (best < 0 || d[houses[k].i] < d[houses[best].i] || (d[houses[k].i] === d[houses[best].i] && k < best)) best = k;
    }
    fuel += d[houses[best].i];
    pos = houses[best].i;
    load -= 1;
    left.delete(best);
    if (houses[best].express && fuel > houses[best].deadline) late = true;
  }
  return { fuel, late };
}
