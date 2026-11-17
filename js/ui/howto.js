// How to play: three short animated cards, then a "Try it" mini puzzle.
import { h } from './dom.js';
import { ico, starsEl } from './icons.js';
import { go } from '../app.js';
import { app } from '../app.js';
import { t } from '../i18n.js';
import { fromAscii } from '../puzzle.js';
import { tileSvg, vanArt } from './art.js';

function scene(rows, cls) {
  const p = fromAscii(rows, { capacity: 1 });
  let tiles = '';
  for (let i = 0; i < 4; i++) tiles += tileSvg(p, i, t);
  return h('div', {
    class: 'scene ' + cls,
    'aria-hidden': 'true',
    html:
      `<svg viewBox="0 0 400 100"><g>${tiles}</g>` +
      `<g class="mini-van"><g transform="translate(5 8) scale(.9)">${vanArt(app.data.settings.skin)}</g></g></svg>`,
  });
}

export function render(root) {
  let i = 0;
  const cards = [
    { title: t('howto.1.title'), text: t('howto.1.text'), art: () => scene(['D . t .', '# # # #', '# # # #', '# # # #'], 'sc-move') },
    { title: t('howto.2.title'), text: t('howto.2.text'), art: () => scene(['D . H .', '# # # #', '# # # #', '# # # #'], 'sc-deliver') },
    {
      title: t('howto.3.title'), text: t('howto.3.text'),
      art: () => h('div', { class: 'scene sc-target', 'aria-hidden': 'true' }, h('div', { class: 'big-num' }, '18 / 18'), starsEl(3, 3)),
    },
  ];
  const host = h('section', { class: 'card howto' });
  const dots = h('div', { class: 'dots' });

  function draw() {
    const c = cards[i];
    host.replaceChildren(
      h('div', { class: 'eyebrow' }, t('howto.step', { i: i + 1, n: cards.length })),
      c.art(),
      h('h2', null, c.title),
      h('p', null, c.text),
      dots,
      h('div', { class: 'btn-row' },
        i > 0 && h('button', { class: 'btn', onClick: () => { i -= 1; draw(); } }, ico('back'), t('howto.back')),
        i < cards.length - 1
          ? h('button', { class: 'btn primary', onClick: () => { i += 1; draw(); } }, t('howto.next'), ico('next'))
          : h('button', { class: 'btn primary', onClick: () => go('play/tutorial') }, ico('van'), t('howto.try'))),
      h('button', { class: 'link', onClick: () => go('home') }, t('howto.skip')));
    dots.replaceChildren(...cards.map((_, k) => h('i', { class: k === i ? 'on' : '' })));
  }
  draw();
  root.append(host);
}
