// Starts the app: loads the language, applies settings and routes between screens.
import { app, persist, applySettings } from './app.js';
import { setLang, detectLang, t, getLang } from './i18n.js';
import { iconSvg } from './ui/icons.js';
import * as home from './ui/home.js';
import * as howto from './ui/howto.js';
import * as play from './ui/play.js';
import * as results from './ui/results.js';
import * as stats from './ui/stats.js';
import * as career from './ui/career.js';
import * as rush from './ui/rush.js';
import * as garage from './ui/garage.js';
import * as settings from './ui/settings.js';
import * as archive from './ui/archive.js';

const SCREENS = { home, howto, play, results, stats, career, rush, garage, settings, archive };
const root = document.getElementById('screen');
let cleanup = null;

function renderHeader() {
  document.getElementById('back').innerHTML = iconSvg('back');
  document.getElementById('back').firstChild.classList.add('ico');
  document.getElementById('back').setAttribute('aria-label', t('nav.home'));
  document.getElementById('title').setAttribute('aria-label', t('app.name'));
  document.querySelectorAll('#lang [data-l]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.l === getLang()));
  });
  document.getElementById('lang').setAttribute('aria-label', t('settings.language'));
  document.title = t('app.name') + ' – ' + t('app.tagline');
}

function route() {
  if (cleanup) cleanup();
  cleanup = null;
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const name = SCREENS[parts[0]] ? parts[0] : 'home';
  root.replaceChildren();
  root.className = 'screen screen-' + name;
  // Each mode has its own colour (Daily red, Career teal, Rush Hour yellow): see [data-mode] in the CSS.
  const m = name === 'play' || name === 'results' ? parts[1] : name;
  if (m === 'career' || m === 'rush') root.dataset.mode = m;
  else delete root.dataset.mode;
  document.getElementById('back').hidden = name === 'home';
  window.scrollTo(0, 0);
  cleanup = SCREENS[name].render(root, parts.slice(1)) || null;
}

async function boot() {
  const s = app.data.settings;
  await setLang(s.lang || detectLang());
  applySettings();
  renderHeader();
  app.refresh = route;

  document.getElementById('back').addEventListener('click', () => (location.hash = '#/home'));
  document.querySelectorAll('#lang [data-l]').forEach((b) =>
    b.addEventListener('click', async () => {
      if (b.dataset.l === getLang()) return;
      await setLang(b.dataset.l);
      app.data.settings.lang = b.dataset.l;
      persist();
      renderHeader();
      route();
    }));
  window.addEventListener('hashchange', route);

  // First visit: open How to play automatically.
  if (!s.seenHowTo) {
    s.seenHowTo = true;
    persist();
    location.hash = '#/howto';
  }
  route();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

boot();
