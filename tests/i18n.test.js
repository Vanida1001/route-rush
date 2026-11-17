import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ACHIEVEMENT_IDS } from '../js/achievements.js';
import { SKINS } from '../js/skins.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lang = (c) => JSON.parse(readFileSync(join(root, 'lang', c + '.json'), 'utf8'));
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));

test('fr.json and en.json have exactly the same keys and placeholders', () => {
  const en = lang('en'), fr = lang('fr');
  assert.deepEqual(Object.keys(fr).sort(), Object.keys(en).sort());
  const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  for (const k of Object.keys(en)) assert.equal(ph(fr[k]), ph(en[k]), `placeholders of ${k}`);
});

test('every translation key used in the code exists', () => {
  const en = lang('en');
  const used = new Set();
  for (const f of walk(join(root, 'js')).filter((p) => p.endsWith('.js'))) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/\bt\(\s*'([^']+)'\s*[,)]/g)) used.add(m[1]);
    for (const m of src.matchAll(/\bt\(\s*`([^`$]+)`/g)) used.add(m[1]);
  }
  for (const k of used) assert.ok(k in en, `missing key: ${k}`);
  // Dynamic keys
  for (const d of [0, 1, 2, 3, 4, 5, 6]) assert.ok(`weekday.${d}` in en);
  for (let d = 1; d <= 6; d++) for (const k of [`district.${d}`, `career.hint.${d}`, `career.mech.${d}`, `career.mech_desc.${d}`]) assert.ok(k in en, k);
  for (const l of ['low', 'medium', 'high']) assert.ok(`traffic.${l}` in en);
  for (const s of SKINS) assert.ok(`skin.${s.id}` in en);
  for (const a of ACHIEVEMENT_IDS) assert.ok(`ach.${a}.name` in en && `ach.${a}.desc` in en);
});
