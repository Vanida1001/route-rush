// Career map: six Singapore districts on a simple map, with stars per level.
import { h } from './dom.js';
import { iconSvg, ico, starsEl } from './icons.js';
import { vanArt } from './art.js';
import { app, go } from '../app.js';
import { t } from '../i18n.js';
import {
  DISTRICTS, LEVELS_PER_DISTRICT, STARS_TO_UNLOCK, firstLevelOf, districtStars, districtLevelsDone,
  isDistrictUnlocked, isLevelUnlocked, nextLevel, districtOf, careerSummary,
} from '../career.js';

// Stops along the winding road (viewBox 360 x 230), in district order 1..6
const NODES = [[48, 186], [150, 172], [268, 176], [298, 104], [190, 90], [82, 52]];
// Extra bends so the road winds between the stops
const ROAD = [[20, 196], [48, 186], [98, 200], [150, 172], [210, 160], [268, 176], [322, 150], [298, 104], [250, 70], [190, 90], [136, 112], [96, 84], [82, 52], [110, 26]];
const NAMES_ORDER = [1, 2, 3, 4, 5, 6];

/** Smooth path through points (Catmull-Rom converted to cubic curves). */
function smooth(pts) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

const tree = (x, y, k = '') => `<circle class="cm-tree ${k}" cx="${x}" cy="${y}" r="7"/><circle class="cm-tree t2" cx="${x + 5}" cy="${y + 3}" r="5"/>`;
const hdb = (x, y) => `<rect class="cm-hdb" x="${x}" y="${y}" width="15" height="24" rx="2"/><path class="cm-win" d="M${x + 3} ${y + 5}h3M${x + 9} ${y + 5}h3M${x + 3} ${y + 11}h3M${x + 9} ${y + 11}h3M${x + 3} ${y + 17}h3M${x + 9} ${y + 17}h3" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
const shop = (x, y) => `<rect class="cm-hdb" x="${x}" y="${y + 4}" width="20" height="12" rx="2"/><path class="cm-roof" d="M${x - 2} ${y + 5}l12-8 12 8z"/>`;

const DECOR =
  hdb(96, 130) + hdb(114, 134) + shop(214, 120) + hdb(256, 114) + shop(26, 134) + hdb(150, 52) + hdb(232, 38) + shop(300, 40) + hdb(312, 188) +
  tree(70, 160) + tree(120, 196, 't2') + tree(210, 200) + tree(330, 130) + tree(250, 124) + tree(136, 80) + tree(44, 96) + tree(30, 60, 't2') +
  tree(176, 40) + tree(280, 58) + tree(330, 76, 't2') + tree(96, 22) + tree(190, 130);

function mapSvg(selected, onPick) {
  const d = app.data;
  const road = smooth(ROAD);
  const here = districtOf(nextLevel(d));
  const nodes = NAMES_ORDER.map((n) => {
    const [x, y] = NODES[n - 1];
    const open = isDistrictUnlocked(d, n);
    const stars = districtStars(d, n);
    const cls = 'node' + (open ? '' : ' locked') + (n === selected ? ' sel' : '');
    const face = open
      ? `<text x="${x}" y="${y + 7}" text-anchor="middle" class="nnum">${n}</text>`
      : `<svg x="${x - 10}" y="${y - 11}" width="20" height="22" viewBox="0 0 48 48">${iconSvg('lock').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>`;
    return `<g class="${cls}" data-d="${n}" tabindex="${open ? 0 : -1}" role="button" aria-label="${t('district.' + n)}${open ? '' : ' (' + t('career.locked') + ')'}">` +
      `<circle class="shadow" cx="${x}" cy="${y + 4}" r="21"/><circle class="ring" cx="${x}" cy="${y}" r="26"/><circle class="stop" cx="${x}" cy="${y}" r="21"/>${face}` +
      `<text x="${x}" y="${y + 40}" text-anchor="middle" class="nlbl">${open ? stars + '/30' : ''}</text></g>`;
  }).join('');
  const [vx, vy] = NODES[here - 1];
  const el = h('div', {
    class: 'career-map',
    html:
      '<svg viewBox="0 0 360 230" role="group">' +
      '<rect class="sea" width="360" height="230"/>' +
      '<path class="wavelet" d="M10 20q6-6 12 0t12 0M300 214q6-6 12 0t12 0M6 120q5-5 10 0t10 0M334 40q5-5 10 0t10 0"/>' +
      '<path class="sand" d="M12 112Q8 46 62 30L240 12Q344 8 350 78L352 160Q350 222 270 220L70 224Q10 224 12 112z"/>' +
      '<path class="land" d="M22 112Q20 54 68 40L238 22Q334 18 340 82L342 158Q340 210 268 210L72 214Q22 214 22 112z"/>' +
      '<ellipse class="cm-pond" cx="228" cy="196" rx="22" ry="9"/>' +
      DECOR +
      `<path class="cm-edge" d="${road}"/><path class="cm-road" d="${road}"/><path class="cm-lane" d="${road}"/>` +
      nodes +
      `<svg class="map-van" x="${vx - 22}" y="${vy - 58}" width="44" height="44" viewBox="0 0 100 100">${vanArt(app.data.settings.skin)}</svg>` +
      '</svg>',
  });
  el.querySelectorAll('.node').forEach((g) => {
    const n = Number(g.dataset.d);
    const pick = () => isDistrictUnlocked(d, n) && onPick(n);
    g.addEventListener('click', pick);
    g.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && pick());
  });
  return el;
}

export function render(root) {
  const d = app.data;
  let selected = app.careerDistrict || districtOf(nextLevel(d));
  const host = h('div');

  function draw() {
    app.careerDistrict = selected;
    const first = firstLevelOf(selected);
    const stars = districtStars(d, selected);
    const sum = careerSummary(d);
    const nextOpen = selected < DISTRICTS ? isDistrictUnlocked(d, selected + 1) : true;
    host.replaceChildren(
      h('p', { class: 'muted' }, t('career.summary', { done: sum.done, total: DISTRICTS * LEVELS_PER_DISTRICT, stars: sum.stars, max: sum.maxStars })),
      mapSvg(selected, (n) => { selected = n; draw(); }),
      h('section', { class: 'card' },
        h('div', { class: 'eyebrow' }, t('career.district_n', { n: selected }), ' · ', t('career.mech.' + selected)),
        h('h2', null, t('district.' + selected)),
        h('p', { class: 'muted small' }, t('career.mech_desc.' + selected)),
        h('p', { class: 'small' }, ico('star'), ' ', t('career.district_stars', { n: stars, max: 30 }),
          selected < DISTRICTS && h('span', { class: 'muted' }, ' · ', nextOpen ? t('career.next_open') : t('career.next_need', { n: STARS_TO_UNLOCK, have: Math.min(stars, STARS_TO_UNLOCK) })),
          districtLevelsDone(d, selected) === LEVELS_PER_DISTRICT && h('span', { class: 'muted' }, ' · ', t('career.skin_earned'))),
        h('div', { class: 'levels' }, ...Array.from({ length: LEVELS_PER_DISTRICT }, (_, i) => {
          const n = first + i;
          const open = isLevelUnlocked(d, n);
          const rec = d.career.levels[n];
          return h('button', {
            class: 'lvl' + (i === LEVELS_PER_DISTRICT - 1 ? ' boss' : '') + (rec ? ' done' : ''),
            disabled: !open,
            'aria-label': t('career.level_aria', { n: i + 1, stars: rec ? rec.stars : 0 }),
            onClick: () => go('play/career/' + n),
          },
            h('b', null, open ? (i === LEVELS_PER_DISTRICT - 1 ? ico('crown') : i + 1) : ico('lock')),
            h('small', null, rec ? starsEl(rec.stars, rec.stars, 'sm') : ''));
        })),
      ),
    );
  }
  draw();

  root.append(h('h2', { class: 'screen-title' }, ico('map'), t('nav.career')), host);
}
