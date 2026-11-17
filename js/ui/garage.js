// Garage: van skins (choose unlocked ones) and achievements.
import { h } from './dom.js';
import { iconSvg, ico } from './icons.js';
import { vanPreview } from './art.js';
import { app, persist } from '../app.js';
import { t } from '../i18n.js';
import { SKINS, isUnlocked, countThreeStars } from '../skins.js';
import { ACHIEVEMENT_IDS } from '../achievements.js';

function hint(skin, d) {
  const u = skin.unlock;
  if (u.type === 'district') return t('garage.need_district', { name: t('district.' + u.n) });
  if (u.type === 'streak') return t('garage.need_streak', { n: u.n, have: Math.min(d.streak.best, u.n) });
  return t('garage.need_stars', { n: u.n, have: Math.min(countThreeStars(d), u.n) });
}

export function render(root) {
  const d = app.data;
  const grid = h('div', { class: 'skins' });
  const draw = () => {
    grid.replaceChildren(...SKINS.map((s) => {
      const ok = isUnlocked(s, d);
      const chosen = d.settings.skin === s.id;
      return h('button', {
        class: 'card skin' + (chosen ? ' chosen' : '') + (ok ? '' : ' locked'),
        disabled: !ok,
        'aria-pressed': ok ? String(chosen) : null,
        onClick: () => { d.settings.skin = s.id; persist(); draw(); },
      },
        h('span', { html: vanPreview(s.id) }),
        h('b', null, t('skin.' + s.id)),
        h('small', null, ok ? (chosen ? [ico('check'), t('garage.selected')] : t('garage.select')) : [ico('lock'), hint(s, d)]));
    }));
  };
  draw();

  root.append(
    h('h2', { class: 'screen-title' }, ico('van'), t('nav.garage')),
    grid,
    h('h3', null, t('garage.achievements')),
    h('ul', { class: 'ach' }, ...ACHIEVEMENT_IDS.map((id) => {
      const got = d.achievements[id];
      return h('li', { class: 'ach-item' + (got ? ' got' : '') },
        h('span', { class: 'medal', html: iconSvg(got ? 'medal' : 'lock') }),
        h('div', null, h('b', null, t(`ach.${id}.name`)), h('small', null, t(`ach.${id}.desc`)), got && h('small', { class: 'muted' }, ' · ' + got)));
    })),
  );
}
