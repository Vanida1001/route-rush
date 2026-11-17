import test from 'node:test';
import assert from 'node:assert/strict';
import { fromAscii } from '../js/puzzle.js';
import { newState, step, undo, replay, parcelsLeft } from '../js/game.js';

// 4x4 helper map: depot top-left, water in the middle of row 1.
const map = () =>
  fromAscii(['D t H .', '. ~ . .', '# # # #', '# # # #'], { capacity: 1 });

test('blocked tiles cannot be entered, and moves must be adjacent', () => {
  const p = map();
  let s = newState(p);
  s = step(p, s, 4); // down to (1,0)
  assert.ok(s);
  assert.equal(step(p, s, 5), null, 'water is blocked');
  assert.equal(step(p, newState(p), 8), null, 'not adjacent');
  assert.equal(step(p, newState(p), 99), null, 'outside the grid');
  const walled = fromAscii(['D #', '# H'], { capacity: 1 });
  assert.equal(step(walled, newState(walled), 1), null, 'building is blocked');
});

test('road costs 1 fuel and traffic costs 2', () => {
  const p = map();
  let s = step(p, newState(p), 4);
  assert.equal(s.fuel, 1);
  s = replay(p, [0, 1]);
  assert.equal(s.fuel, 2, 'traffic jam');
});

test('delivering, running empty and reloading at the depot', () => {
  const p = fromAscii(['D H H', '# # #', '# # #'], { capacity: 1 });
  let s = newState(p);
  assert.equal(s.load, 1);
  s = step(p, s, 1);
  assert.equal(s.load, 0);
  assert.equal(parcelsLeft(p, s), 1);
  s = step(p, s, 2); // empty: no delivery
  assert.equal(parcelsLeft(p, s), 1);
  assert.equal(s.status, 'playing');
  s = step(p, s, 1);
  s = step(p, s, 0);
  assert.equal(s.load, 1, 'reloaded to full');
  assert.deepEqual(s.events.map((e) => e.t), ['parcel', 'depot']);
  s = step(p, s, 1);
  s = step(p, s, 2);
  assert.equal(s.status, 'won');
  assert.equal(s.fuel, 6);
  assert.equal(step(p, s, 1), null, 'no moves after the win');
});

test('a late express parcel fails the run, an on-time one does not', () => {
  const p = fromAscii(['D . . X', '# # # #', '# # # #', '# # # #'], { capacity: 1, deadlines: [3] });
  let s = replay(p, [0, 1, 2, 3]);
  assert.equal(s.status, 'won');
  const late = fromAscii(['D . . X', '# # # #', '# # # #', '# # # #'], { capacity: 1, deadlines: [2] });
  s = replay(late, [0, 1, 2, 3]);
  assert.equal(s.status, 'failed', 'delivered after the deadline');
  assert.equal(s.failedHouse, 0);
  assert.equal(s.delivered, 1);
  const gone = fromAscii(['D . . X', '# # # #', '# # # #', '# # # #'], { capacity: 1, deadlines: [1] });
  s = replay(gone, [0, 1, 2]);
  assert.equal(s.status, 'failed', 'deadline passed before reaching the house');
  assert.equal(replay(gone, [0, 1, 2, 3]), null, 'cannot keep driving after failing');
});

test('undo restores the exact previous state', () => {
  const p = map();
  const s0 = newState(p);
  const s1 = step(p, s0, 1);
  const s2 = step(p, s1, 2); // delivers the parcel
  assert.equal(s2.status, 'won');
  assert.deepEqual(undo(p, s2), s1);
  assert.deepEqual(undo(p, s1), s0);
  assert.deepEqual(undo(p, s0), s0, 'undo at the start does nothing');
});

test('undo works after a failed run', () => {
  const p = fromAscii(['D . . X', '# # # #', '# # # #', '# # # #'], { capacity: 1, deadlines: [0] });
  const s1 = step(p, newState(p), 1);
  assert.equal(s1.status, 'failed');
  const back = undo(p, s1);
  assert.equal(back.status, 'playing');
  assert.equal(back.fuel, 0);
});

test('replay rejects broken paths', () => {
  const p = map();
  assert.equal(replay(p, [0, 5]), null);
  assert.equal(replay(p, [3, 2]), null);
  assert.equal(replay(p, 'nope'), null);
});
