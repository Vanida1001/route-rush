import test from 'node:test';
import assert from 'node:assert/strict';
import { fromAscii } from '../js/puzzle.js';
import { solve } from '../js/solver.js';
import { replay } from '../js/game.js';

const rows5 = (first) => [first, '# # # # #', '# # # # #', '# # # # #', '# # # # #'];

// Five hand-made puzzles with answers worked out by hand.
const CASES = [
  {
    name: 'two houses, capacity 2, take the loop through the right column',
    puzzle: fromAscii(['D H .', '. # .', '. . H'], { capacity: 2 }),
    best: 4,
  },
  {
    name: 'capacity 1 forces a trip back to the depot',
    puzzle: fromAscii(['D H H', '# # #', '# # #'], { capacity: 1 }),
    best: 4,
  },
  {
    name: 'a longer road beats three traffic jams',
    puzzle: fromAscii(['D t t t H', '. . . . .', '# # # # #', '# # # # #', '# # # # #'], { capacity: 1 }),
    best: 6,
  },
  {
    name: 'express deadline changes the best order',
    puzzle: fromAscii(rows5('X . . D H'), { capacity: 2, deadlines: [3] }),
    best: 7, // far house first (3) then the near one (4); near-first would give 5
  },
  {
    name: 'water is blocked, the bridge is the only way, with a reload',
    puzzle: fromAscii(['D H ~ H', '. . = .', '# # # #', '# # # #'], { capacity: 1 }),
    best: 7,
  },
];

for (const c of CASES) {
  test(`solver minimum: ${c.name}`, () => {
    const r = solve(c.puzzle);
    assert.ok(r, 'solvable');
    assert.equal(r.fuel, c.best);
    // The returned route must be a legal run that really costs that much and wins.
    const end = replay(c.puzzle, r.route);
    assert.ok(end, 'route is legal');
    assert.equal(end.status, 'won');
    assert.equal(end.fuel, c.best);
  });
}

test('without the deadline the near-first order is optimal (control)', () => {
  const p = fromAscii(rows5('H . . D H'), { capacity: 2 });
  assert.equal(solve(p).fuel, 5);
});

test('an impossible deadline is reported as unsolvable', () => {
  const p = fromAscii(rows5('X . . D H'), { capacity: 2, deadlines: [2] });
  assert.equal(solve(p), null);
});
