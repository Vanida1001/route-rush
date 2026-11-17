import test from 'node:test';
import assert from 'node:assert/strict';
import { fromAscii } from '../js/puzzle.js';
import { solve } from '../js/solver.js';
import { newState, step, replay, undo, canMove, parcelsLeft } from '../js/game.js';

const pad = (rows) => [...rows, ...Array(4 - rows.length).fill('# # # #')];

// ---------- game rules ----------
test('pickup: the stall must come before the customer, and food takes a van space', () => {
  const p = fromAscii(pad(['D a H .', '# # # .', '# # # A']), { capacity: 1 });
  let s = newState(p);
  assert.equal(s.load, 1);
  s = step(p, s, 1); // stall while the van is full: nothing happens
  assert.deepEqual(s.pick, [0]);
  s = step(p, s, 2); // deliver the parcel
  assert.equal(s.load, 0);
  s = step(p, s, 1); // now there is room
  assert.deepEqual(s.pick, [1]);
  assert.equal(parcelsLeft(p, s), 1, 'the food still has to be delivered');
  s = replay(p, [0, 1, 2, 1, 2, 3, 7, 11]);
  assert.equal(s.status, 'won');
  assert.deepEqual(s.pick, [2]);
});

test('pickup: reaching the customer first does nothing', () => {
  const p = fromAscii(pad(['D A . a']), { capacity: 1 });
  let s = replay(p, [0, 1]);
  assert.deepEqual(s.pick, [0]);
  assert.equal(s.status, 'playing');
});

test('pickup: undo restores the exact previous state', () => {
  const p = fromAscii(pad(['D a . A']), { capacity: 1 });
  const s1 = step(p, newState(p), 1);
  const s2 = step(p, s1, 2);
  assert.deepEqual(undo(p, s2), s1);
  assert.deepEqual(undo(p, s1), newState(p));
});

test('one-way street: only enterable moving in the arrow direction', () => {
  const p = fromAscii(pad(['D < . H', '. . . .']), { capacity: 1 });
  assert.equal(canMove(p, newState(p), 1), false, 'entering a left arrow while moving right');
  const s = replay(p, [0, 4, 5, 6]);
  assert.ok(s);
  assert.equal(step(p, s, 2) !== null, true);
  const east = replay(p, [0, 4, 5, 6, 7, 3]);
  assert.equal(east.status, 'won');
  // Entering from the right IS allowed
  const back = replay(p, [0, 4, 5, 6, 2, 1]);
  assert.ok(back, 'moving left onto the left arrow is legal');
});

test('roadworks: blocked once fuel used reaches the number', () => {
  const p = fromAscii(pad(['D . 2 H', '. . . .']), { capacity: 1 });
  assert.ok(replay(p, [0, 1, 2, 3]), 'open at fuel 1');
  assert.equal(replay(p, [0, 4, 5, 1, 2]), null, 'closed at fuel 3');
  const q = fromAscii(pad(['D . 1 H', '. . . .']), { capacity: 1 });
  assert.equal(replay(q, [0, 1, 2]), null, 'closed at fuel 1');
});

// ---------- solver on hand-made puzzles ----------
const CASES = [
  { name: 'pickup then customer', puzzle: fromAscii(pad(['D a . .', '# # # .', '# # # A']), { capacity: 1 }), best: 5 },
  { name: 'pickup needs room: deliver the parcel first', puzzle: fromAscii(pad(['D a H .', '# # # .', '# # # A']), { capacity: 1 }), best: 7 },
  { name: 'customer is nearer than the stall', puzzle: fromAscii(pad(['D A . a']), { capacity: 1 }), best: 5 },
  { name: 'one-way street forces a detour', puzzle: fromAscii(pad(['D < . H', '. . . .']), { capacity: 1 }), best: 5 },
  { name: 'one-way street in the right direction costs nothing', puzzle: fromAscii(pad(['D > . H', '. . . .']), { capacity: 1 }), best: 3 },
  { name: 'roadworks still open', puzzle: fromAscii(pad(['D . 2 H', '. . . .']), { capacity: 1 }), best: 3 },
  { name: 'roadworks closed: detour', puzzle: fromAscii(pad(['D . 1 H', '. . . .']), { capacity: 1 }), best: 5 },
  {
    name: 'two pickups share the van',
    puzzle: fromAscii(['D a b .', '# # # .', '# # # B', '# # # A'], { capacity: 2 }),
    best: 6, // a, b (2), then down the right column: (0,3) (1,3) B A
  },
];

for (const c of CASES) {
  test(`solver (v2 mechanics): ${c.name}`, () => {
    const r = solve(c.puzzle);
    assert.ok(r, 'solvable');
    assert.equal(r.fuel, c.best);
    const end = replay(c.puzzle, r.route);
    assert.ok(end, 'route is legal');
    assert.equal(end.status, 'won');
    assert.equal(end.fuel, c.best);
  });
}

test('an unreachable customer is reported as unsolvable', () => {
  const p = fromAscii(pad(['D a # A']), { capacity: 1 });
  assert.equal(solve(p), null);
});
