// Game rules: moves, fuel, deliveries, reloading, win/fail. Pure functions.
//
// A run's state is always derived from its path (list of tile indexes starting
// at the depot), so undo is simply "replay the path without its last tile" and
// saving progress only needs the path.
//
// state = { pos, delivered (bitmask over puzzle.houses), load, fuel, path,
//           pick: per pickup 0 = waiting, 1 = food in the van, 2 = delivered,
//           events: [{ t: 'parcel'|'express'|'depot'|'pickup'|'food', fuel, house? }],
//           status: 'playing'|'won'|'failed', failedHouse }
import { isWalkable, neighbors, tileCost, dirBetween } from './puzzle.js';

/** Tank size: 50% more than the best route needs (unlimited for hand-made test puzzles). */
export const tankFor = (puzzle) => (puzzle.best ? Math.ceil(puzzle.best * 1.5) : Infinity);

export function newState(puzzle) {
  return {
    pos: puzzle.depot,
    delivered: 0,
    // Daily puzzles always have at least `capacity` parcels, so this is `capacity` there.
    load: Math.min(puzzle.capacity, puzzle.houses.length),
    fuel: 0,
    path: [puzzle.depot],
    pick: (puzzle.pickups || []).map(() => 0),
    events: [],
    status: 'playing',
    failedHouse: -1,
  };
}

/** Roadworks tile n is blocked once the fuel used has reached n. */
export const roadworksClosed = (puzzle, idx, fuelUsed) =>
  puzzle.roadworks !== undefined && puzzle.roadworks[idx] !== undefined && fuelUsed >= puzzle.roadworks[idx];

export function canMove(puzzle, state, idx) {
  if (state.status !== 'playing') return false;
  if (!neighbors(puzzle.size, state.pos).includes(idx) || !isWalkable(puzzle.tiles[idx])) return false;
  const arrow = puzzle.oneway && puzzle.oneway[idx];
  if (arrow && dirBetween(puzzle.size, state.pos, idx) !== arrow) return false;
  return !roadworksClosed(puzzle, idx, state.fuel);
}

/** Moves the van onto a neighbouring tile. Returns a new state, or null if illegal. */
export function step(puzzle, state, idx) {
  if (!canMove(puzzle, state, idx)) return null;
  const fuel = state.fuel + tileCost(puzzle, idx);
  let delivered = state.delivered;
  let load = state.load;
  const pick = state.pick.slice();
  const events = state.events.slice();
  const carried = pick.filter((v) => v === 1).length;

  const hi = puzzle.houses.findIndex((h) => h.i === idx);
  const stall = (puzzle.pickups || []).findIndex((p) => p.stall === idx);
  const cust = (puzzle.pickups || []).findIndex((p) => p.customer === idx);
  if (hi >= 0 && !((delivered >> hi) & 1) && load > 0) {
    delivered |= 1 << hi;
    load -= 1;
    events.push({ t: puzzle.houses[hi].express ? 'express' : 'parcel', fuel, house: hi });
  } else if (stall >= 0 && pick[stall] === 0 && load + carried < puzzle.capacity) {
    pick[stall] = 1; // the food takes one space in the van
    events.push({ t: 'pickup', fuel });
  } else if (cust >= 0 && pick[cust] === 1) {
    pick[cust] = 2;
    events.push({ t: 'food', fuel });
  } else if (idx === puzzle.depot && load < puzzle.capacity - carried) {
    load = puzzle.capacity - carried;
    events.push({ t: 'depot', fuel });
  }

  // An express parcel not delivered before this move is late once fuel passes its
  // deadline (delivering exactly at the deadline is fine).
  let failedHouse = -1;
  puzzle.houses.forEach((h, k) => {
    if (failedHouse < 0 && h.express && !((state.delivered >> k) & 1) && fuel > h.deadline) {
      failedHouse = k;
    }
  });

  const total = puzzle.houses.length;
  let status = 'playing';
  if (failedHouse >= 0 || fuel > tankFor(puzzle)) status = 'failed'; // late express parcel or empty tank
  else if (delivered === (1 << total) - 1 && pick.every((v) => v === 2)) status = 'won';

  return { pos: idx, delivered, load, fuel, path: [...state.path, idx], pick, events, status, failedHouse };
}

/** Rebuilds a state from a path. Returns null if the path is not legal. */
export function replay(puzzle, path) {
  if (!Array.isArray(path) || path[0] !== puzzle.depot) return null;
  let s = newState(puzzle);
  for (let i = 1; i < path.length; i++) {
    s = step(puzzle, s, path[i]);
    if (!s) return null;
  }
  return s;
}

/** Goes back one move. Restores the exact previous state. */
export function undo(puzzle, state) {
  if (state.path.length <= 1) return state;
  return replay(puzzle, state.path.slice(0, -1));
}

export const restart = newState;

/** Deliveries still to make: houses plus pickup customers. */
export const parcelsLeft = (puzzle, state) =>
  puzzle.houses.reduce((n, _, k) => n + (((state.delivered >> k) & 1) ? 0 : 1), 0) +
  state.pick.filter((v) => v !== 2).length;

/** Fuel left before each undelivered express parcel is late. */
export function expressStatus(puzzle, state) {
  const out = [];
  puzzle.houses.forEach((h, k) => {
    if (!h.express) return;
    const done = ((state.delivered >> k) & 1) === 1;
    out.push({ house: k, deadline: h.deadline, done, left: h.deadline - state.fuel });
  });
  return out;
}
