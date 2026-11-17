// Puzzle data shape and small grid helpers. Pure.
//
// puzzle = {
//   size,                 // grid is size x size
//   tiles: string[],      // 'r' road, 't' traffic, 'b' building, 'p' park, 'w' water, 'g' bridge
//   depot: index,         // start tile (a road)
//   houses: [{ i, express, deadline }],  // delivery stops (drivable tiles)
//   capacity,             // parcels the van carries
//   best?, route?         // filled in by the generator (optimal fuel and route)
//   // Optional version 2 mechanics (absent on daily puzzles):
//   pickups?: [{ stall, customer, color }],  // visit the stall (food takes a van space), then the customer
//   oneway?: { [tileIndex]: 'up'|'right'|'down'|'left' },  // may only be entered moving that way
//   roadworks?: { [tileIndex]: n },          // blocked once fuel used reaches n
// }

export const isWalkable = (tile) => tile === 'r' || tile === 't' || tile === 'g';
export const tileCost = (puzzle, idx) => (puzzle.tiles[idx] === 't' ? 2 : 1);

/** Orthogonal neighbours (up, right, down, left) inside the grid. */
export function neighbors(size, idx) {
  const x = idx % size;
  const y = (idx / size) | 0;
  const out = [];
  if (y > 0) out.push(idx - size);
  if (x < size - 1) out.push(idx + 1);
  if (y < size - 1) out.push(idx + size);
  if (x > 0) out.push(idx - 1);
  return out;
}

export const DIRS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };

/** Direction of a one-tile move from -> to, or null if the tiles are not neighbours. */
export function dirBetween(size, from, to) {
  const d = to - from;
  if (d === -size) return 'up';
  if (d === size) return 'down';
  if (d === 1 && from % size < size - 1) return 'right';
  if (d === -1 && from % size > 0) return 'left';
  return null;
}

/** Index reached by moving one tile in a direction, or -1 outside the grid. */
export function stepIndex(size, idx, dir) {
  const [dx, dy] = DIRS[dir];
  const x = (idx % size) + dx;
  const y = ((idx / size) | 0) + dy;
  if (x < 0 || y < 0 || x >= size || y >= size) return -1;
  return y * size + x;
}

export function houseIndexAt(puzzle, idx) {
  return puzzle.houses.findIndex((h) => h.i === idx);
}

/**
 * Builds a puzzle from ASCII rows (used by tests and the tutorial).
 *  . road   t traffic   # building   p park   ~ water   = bridge
 *  D depot  H house     X express house (deadlines given in reading order)
 *  a b c = pickup stalls, A B C = their customers
 *  ^ > v < = one-way road     1-9 = roadworks (blocked once fuel used reaches the digit)
 */
export function fromAscii(rows, { capacity = 3, deadlines = [] } = {}) {
  const size = rows.length;
  const tiles = [];
  const houses = [];
  const stalls = {};
  const customers = {};
  const oneway = {};
  const roadworks = {};
  const ARROWS = { '^': 'up', '>': 'right', v: 'down', '<': 'left' };
  let depot = -1;
  let ex = 0;
  rows.forEach((row, y) => {
    const cells = row.replace(/ /g, '');
    if (cells.length !== size) throw new Error('ASCII puzzle must be square');
    [...cells].forEach((ch, x) => {
      const i = y * size + x;
      let tile = 'r';
      if (ch === 't') tile = 't';
      else if (ch === '#') tile = 'b';
      else if (ch === 'p') tile = 'p';
      else if (ch === '~') tile = 'w';
      else if (ch === '=') tile = 'g';
      else if (ch === 'D') depot = i;
      else if (ch === 'H') houses.push({ i, express: false, deadline: null });
      else if (ch === 'X') houses.push({ i, express: true, deadline: deadlines[ex++] });
      else if (ARROWS[ch]) oneway[i] = ARROWS[ch];
      else if (/[1-9]/.test(ch)) roadworks[i] = Number(ch);
      else if (/[abc]/.test(ch)) stalls[ch] = i;
      else if (/[ABC]/.test(ch)) customers[ch.toLowerCase()] = i;
      tiles.push(tile);
    });
  });
  const puzzle = { size, tiles, depot, houses, capacity };
  const ids = Object.keys(stalls).sort();
  if (ids.length) puzzle.pickups = ids.map((id, color) => ({ stall: stalls[id], customer: customers[id], color }));
  if (Object.keys(oneway).length) puzzle.oneway = oneway;
  if (Object.keys(roadworks).length) puzzle.roadworks = roadworks;
  return puzzle;
}
