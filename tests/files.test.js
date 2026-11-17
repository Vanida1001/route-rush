import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const walk = (dir) =>
  readdirSync(join(root, dir)).flatMap((f) => {
    const rel = `${dir}/${f}`;
    return statSync(join(root, rel)).isDirectory() ? walk(rel) : [rel];
  });

test('the service worker caches every app file (and nothing that is missing)', () => {
  const sw = readFileSync(join(root, 'sw.js'), 'utf8');
  const listed = [...sw.matchAll(/'([\w./-]+)'/g)].map((m) => m[1]).filter((p) => /\.(js|json|css|html|svg)$/.test(p));
  const files = [...walk('js'), ...walk('css'), ...walk('lang'), 'index.html', 'manifest.json', 'icon.svg'];
  for (const f of files) assert.ok(listed.includes(f), `sw.js does not cache ${f}`);
  for (const p of listed) assert.ok(existsSync(join(root, p)), `sw.js lists a missing file ${p}`);
});

test('the app code has no npm dependencies and pure modules do not touch the page', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.devDependencies, undefined);
  for (const f of ['rng', 'game', 'generator', 'solver', 'puzzle', 'config', 'dates', 'share', 'streak', 'skins', 'achievements', 'progress']) {
    const src = readFileSync(join(root, `js/${f}.js`), 'utf8');
    assert.ok(!/\b(document|window|localStorage|navigator)\b/.test(src.replace(/\/\/.*$/gm, '')), `${f}.js touches the page`);
  }
});

test('relative asset paths only (works under a GitHub Pages sub-path)', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  assert.ok(!/(src|href)="\//.test(html));
});
