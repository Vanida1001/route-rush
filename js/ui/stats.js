// Stats: played, win rate, streaks, three-star days and a star distribution chart.
import { h } from './dom.js';
import { ico, starsEl } from './icons.js';
import { app, today } from '../app.js';
import { t } from '../i18n.js';
import { computeStats } from '../progress.js';

export function render(root) {
  const s = computeStats(app.data, today());
  const max = Math.max(1, s.dist[1], s.dist[2], s.dist[3]);
  const cell = (n, label) => h('div', { class: 'num-cell' }, h('b', null, n), h('span', null, label));
  const bar = (stars) =>
    h('div', { class: 'bar-row' },
      h('span', { class: 'bar-lbl' }, starsEl(stars, stars, 'sm')),
      h('div', { class: 'bar-track' }, h('div', { class: 'bar s' + stars, style: `width:${(s.dist[stars] / max) * 100}%` })),
      h('b', { class: 'bar-n' }, s.dist[stars]));

  root.append(
    h('h2', { class: 'screen-title' }, ico('stats'), t('nav.stats')),
    h('section', { class: 'card' },
      h('div', { class: 'num-grid' },
        cell(s.played, t('stats.played')),
        cell(s.winRate + '%', t('stats.win_rate')),
        cell(s.streak, t('stats.streak')),
        cell(s.bestStreak, t('stats.best_streak')),
        cell(s.threeStarDays, t('stats.three_star'))),
      h('p', { class: 'muted small' }, t('stats.win_rate_note'))),
    h('section', { class: 'card' },
      h('h3', null, t('nav.career'), ' · ', t('nav.rush')),
      h('div', { class: 'num-grid' },
        cell(`${s.careerDone}/${s.careerTotal}`, t('stats.career_levels')),
        cell(`${s.careerStars}/${s.careerMaxStars}`, t('stats.career_stars')),
        cell(s.rushBest, t('stats.rush_best')))),
    h('section', { class: 'card' },
      h('h3', null, t('stats.distribution')),
      s.played === 0 ? h('p', { class: 'muted' }, t('stats.empty')) : h('div', { class: 'bars', role: 'img', 'aria-label': t('stats.distribution') }, bar(3), bar(2), bar(1))),
  );
}
