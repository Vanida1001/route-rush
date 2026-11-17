// Home: an animated mini-city (the same SVG art as the board) with today's Play button on top,
// then streak, countdown, the two other modes and links to every other screen.
import { h } from './dom.js';
import { tileSvg, vanArt } from './art.js';
import { iconSvg, ico, starsEl } from './icons.js';
import { app, go, today, todayNumber } from '../app.js';
import { t } from '../i18n.js';
import { effectiveStreak } from '../streak.js';
import { configForPuzzle } from '../generator.js';
import { weekdayOfPuzzle, msUntilNextMidnight, formatCountdown } from '../dates.js';
import { careerSummary, TOTAL_LEVELS } from '../career.js';

// A fixed 5 x 3 neighbourhood: HDB blocks and shophouses, a river with a bridge, parks, and a road for the van.
const CITY = {
  size: 5, houses: [], pickups: [], depot: -1,
  tiles: ['b', 'b', 'w', 'b', 'b', 'r', 'r', 'g', 'r', 'r', 'b', 'p', 'w', 'p', 'b'],
};

function cityScene(skin) {
  const tiles = CITY.tiles.map((_, i) => tileSvg(CITY, i, t)).join('');
  const cloud = (x, y, k) =>
    `<g class="city-cloud ${k}"><g transform="translate(${x} ${y})"><ellipse class="cloud" cx="0" cy="0" rx="26" ry="9"/><ellipse class="cloud" cx="14" cy="-7" rx="16" ry="9"/><ellipse class="cloud" cx="-12" cy="-5" rx="13" ry="8"/></g></g>`;
  return (
    '<svg class="city" viewBox="0 0 500 360" aria-hidden="true" focusable="false">' +
    '<circle class="sky-sun" cx="410" cy="34" r="20"/><circle class="sky-sun" cx="410" cy="34" r="30" opacity=".25"/>' +
    cloud(60, 34, 'c1') + cloud(260, 20, 'c2') +
    `<g transform="translate(0 60)">${tiles}` +
    // The van drives its loop along the road row: out of sight on the right, back in from the left.
    `<g transform="translate(0 100)"><g class="city-van"><g class="bobber"><svg viewBox="0 0 100 100" width="100" height="100">${vanArt(skin)}</svg></g></g></g>` +
    '</g></svg>'
  );
}

export function render(root) {
  const d = app.data;
  const n = todayNumber();
  const cfg = configForPuzzle(n);
  const entry = d.history[n];
  const inProgress = d.progress['daily:' + n]?.path?.length > 1;
  const streak = effectiveStreak(d.streak, today());
  const career = careerSummary(d);
  const countdown = h('b', { class: 'countdown' });

  const playBtn = entry
    ? h('button', { class: 'btn primary big hero-play', onClick: () => go('results/daily/' + n) }, t('home.done'), ' ', starsEl(entry.stars, entry.stars, 'sm mid'))
    : h('button', { class: 'btn primary big hero-play pulse', onClick: () => go('play/daily') }, inProgress ? t('home.continue') : t('home.play'));

  const nav = (icon, label, path) =>
    h('button', { class: 'btn nav', onClick: () => go(path) }, ico(icon), h('span', null, label));

  const flame = h('span', { class: 'flame', html: iconSvg('flame') });

  root.append(
    h('section', { class: 'card hero' },
      h('div', { class: 'hero-wrap' },
        h('div', { class: 'hero-stage' },
          h('div', { html: cityScene(d.settings.skin) }),
          h('div', { class: 'scene-chip' }, t('home.puzzle', { n }), ' · ', t('weekday.' + weekdayOfPuzzle(n)))),
        playBtn),
      h('div', { class: 'hero-body' },
        h('p', { class: 'diff' }, t('home.diff', {
          parcels: cfg.parcels, cap: cfg.capacity, express: cfg.express, traffic: t('traffic.' + cfg.traffic),
        })),
        h('div', { class: 'streak' },
          flame, h('b', null, streak), ' ', t('home.streak_days', { n: streak }),
          d.streak.freezes > 0 && h('span', { class: 'freeze', title: t('home.freezes_title') }, ico('snowflake'), '×', d.streak.freezes)),
        h('p', { class: 'next' }, t('results.next_in'), ' ', countdown))),
    h('button', { class: 'card mode-card career', onClick: () => go('career') },
      h('span', { class: 'plate' }, ico('map')),
      h('span', { class: 'grow' }, h('b', null, t('nav.career')), h('small', null, t('home.career_info', { done: career.done, total: TOTAL_LEVELS, stars: career.stars, max: career.maxStars }))),
      h('span', { class: 'go' }, '›')),
    h('button', { class: 'card mode-card rush', onClick: () => go('rush') },
      h('span', { class: 'plate' }, ico('timer')),
      h('span', { class: 'grow' }, h('b', null, t('nav.rush')), h('small', null, t('home.rush_info', { n: d.rush.best }))),
      h('span', { class: 'go' }, '›')),
    h('div', { class: 'nav-grid' },
      nav('help', t('nav.howto'), 'howto'),
      nav('stats', t('nav.stats'), 'stats'),
      nav('calendar', t('nav.archive'), 'archive'),
      nav('van', t('nav.garage'), 'garage'),
      nav('settings', t('nav.settings'), 'settings')),
  );

  const startDay = today();
  const tick = () => {
    countdown.textContent = formatCountdown(msUntilNextMidnight());
    if (today() !== startDay) app.refresh(); // a new puzzle has started
  };
  tick();
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}
