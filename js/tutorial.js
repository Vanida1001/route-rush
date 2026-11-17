// Hand-made "Try it" puzzle for How to play: two parcels, van holds one, so the
// player learns to deliver, drive back to the depot and reload. Pure.
import { fromAscii } from './puzzle.js';
import { solve } from './solver.js';

const ROWS = [
  '# # # H # # #',
  '# . . . . . #',
  'p . # t # . p',
  '. . . D . . .',
  'p . # t # . p',
  '# . . . . . #',
  '# # # H # # #',
];

export function tutorialPuzzle() {
  const p = fromAscii(ROWS, { capacity: 1 });
  const sol = solve(p);
  return { ...p, best: sol.fuel, route: sol.route, n: 0, config: { parcels: 2, capacity: 1, express: 0, traffic: 'low' } };
}
