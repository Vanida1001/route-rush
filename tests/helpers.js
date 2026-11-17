import assert from 'node:assert/strict';

// Sanity check on a seeded RNG: values stay in [0, 1).
export function rngSelfCheck(rng) {
  for (let i = 0; i < 1000; i++) {
    const v = rng();
    assert.ok(v >= 0 && v < 1);
  }
}
