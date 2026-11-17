// Archive: replay the last 7 days' puzzles. They give stars but never streak.
import { h } from './dom.js';
import { app, go, todayNumber } from '../app.js';
import { t } from '../i18n.js';
import { starString } from '../share.js';
import { configForPuzzle } from '../generator.js';
import { dateForPuzzle, weekdayOfPuzzle } from '../dates.js';

export function render(root) {
  const now = todayNumber();
  const rows = [];
  for (let n = now - 1; n >= Math.max(1, now - 7); n--) {
    const e = app.data.history[n];
    const c = configForPuzzle(n);
    rows.push(
      h('button', { class: 'card row', onClick: () => go(e ? 'results/archive/' + n : 'play/archive/' + n) },
        h('div', null,
          h('b', null, t('home.puzzle', { n })),
          h('small', { class: 'muted' }, ' ', t('weekday.' + weekdayOfPuzzle(n)), ' · ', dateForPuzzle(n))),
        h('div', { class: 'row-right' },
          e ? h('span', { class: 'stars-sm' }, starString(e.stars)) : h('span', { class: 'muted' }, t('archive.play')),
          h('small', { class: 'muted' }, t('home.diff_short', { parcels: c.parcels, express: c.express })))),
    );
  }
  root.append(
    h('h2', { class: 'screen-title' }, t('nav.archive')),
    h('p', { class: 'muted' }, t('archive.intro')),
    ...(rows.length ? rows : [h('p', { class: 'card muted' }, t('archive.empty'))]),
  );
}
