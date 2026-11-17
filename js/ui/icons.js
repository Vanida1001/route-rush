// Simple custom SVG icons in the same flat, chunky style as the city art (replace emoji in the UI).
// Colourful icons use fixed colours; single-colour ones use currentColor so they follow the theme.
import { vanArt } from './art.js';

const S = 'stroke="#1d2b36" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"'; // dark outline
const C = 'fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"'; // line icon

const ICONS = {
  star: `<path d="M24 4l5.9 12 13.1 1.9-9.5 9.2 2.3 13L24 33.9 12.2 40l2.3-13L5 17.9 18.1 16z" fill="#ffc928" ${S}/>`,
  'star-off': '<path d="M24 4l5.9 12 13.1 1.9-9.5 9.2 2.3 13L24 33.9 12.2 40l2.3-13L5 17.9 18.1 16z" fill="rgba(120,135,145,.25)" stroke="rgba(120,135,145,.6)" stroke-width="3" stroke-linejoin="round"/>',
  flame: `<path d="M24 4c2 8 12 12 12 24a12 12 0 0 1-24 0c0-5 3-8 5-11 1 3 3 4 4 4-2-6-1-12 3-17z" fill="#ff7a1a" ${S}/><path d="M24 22c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 2 3 2-1-3-1-5 0-7z" fill="#ffd84d"/>`,
  bolt: `<path d="M28 3L10 27h11l-3 18 20-27H26z" fill="#ffd84d" ${S}/>`,
  warn: `<path d="M24 5L45 41H3z" fill="#ffb02e" ${S}/><path d="M24 17v13M24 35v1" stroke="#1d2b36" stroke-width="4.5" stroke-linecap="round"/>`,
  check: `<circle cx="24" cy="24" r="19" fill="#2e9e4f" ${S}/><path d="M14 25l7 7 14-15" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
  lock: `<path d="M15 21v-6a9 9 0 0 1 18 0v6" fill="none" stroke="#1d2b36" stroke-width="5" stroke-linecap="round"/><rect x="8" y="21" width="32" height="23" rx="6" fill="#9aa5ab" ${S}/><circle cx="24" cy="32" r="3.5" fill="#1d2b36"/>`,
  undo: `<path d="M16 14L8 22l8 8M10 22h20a10 10 0 0 1 0 20h-6" ${C}/>`,
  restart: `<path d="M38 24a14 14 0 1 1-4.5-10.3M36 6v9h-9" ${C}/>`,
  skip: `<path d="M9 10l16 14L9 38zM27 10l16 14-16 14z" fill="currentColor" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>`,
  back: `<path d="M30 8L14 24l16 16" ${C}/>`,
  home: `<path d="M6 24L24 7l18 17M12 21v20h24V21" ${C}/>`,
  stats: '<rect x="6" y="24" width="9" height="18" rx="3" fill="#2f7de1"/><rect x="19.5" y="10" width="9" height="32" rx="3" fill="#e8453c"/><rect x="33" y="18" width="9" height="24" rx="3" fill="#2e9e4f"/>',
  calendar: `<rect x="5" y="9" width="38" height="34" rx="7" fill="#fff" ${S}/><path d="M5 20h38V16a7 7 0 0 0-7-7H12a7 7 0 0 0-7 7z" fill="#e8453c" ${S}/><path d="M15 5v8M33 5v8" stroke="#1d2b36" stroke-width="4" stroke-linecap="round"/><circle cx="16" cy="30" r="2.5" fill="#1d2b36"/><circle cx="24" cy="30" r="2.5" fill="#1d2b36"/><circle cx="32" cy="30" r="2.5" fill="#1d2b36"/>`,
  settings: `<path d="M24 4l4 5 6-2 2 6 6 2-2 6 4 5-5 4 1 6-6 1-3 6-5-4-5 4-3-6-6-1 1-6-5-4 4-5-2-6 6-2 2-6 6 2z" fill="#9aa5ab" ${S}/><circle cx="24" cy="24" r="7" fill="#fff" ${S}/>`,
  help: `<circle cx="24" cy="24" r="20" fill="#6c7ae0" ${S}/><path d="M17 19a7 7 0 1 1 10 6c-2 1-3 2-3 5" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="24" cy="38" r="3" fill="#fff"/>`,
  map: `<path d="M5 12l12-5 14 5 12-5v29l-12 5-14-5-12 5z" fill="#f0e6c8" ${S}/><path d="M17 7v29M31 12v29" stroke="#1d2b36" stroke-width="3"/><path d="M22 20l6 6M28 20l-6 6" stroke="#e8453c" stroke-width="4" stroke-linecap="round"/>`,
  timer: `<circle cx="24" cy="27" r="17" fill="#ffd84d" ${S}/><path d="M24 27V16M24 27l7 4" stroke="#1d2b36" stroke-width="4" stroke-linecap="round"/><rect x="19" y="3" width="10" height="6" rx="2" fill="#1d2b36"/>`,
  trophy: `<path d="M13 6h22v14a11 11 0 0 1-22 0z" fill="#ffc928" ${S}/><path d="M13 10H6c0 8 3 12 8 12M35 10h7c0 8-3 12-8 12" fill="none" stroke="#1d2b36" stroke-width="3.5" stroke-linecap="round"/><path d="M24 31v7M15 43h18" stroke="#1d2b36" stroke-width="5" stroke-linecap="round"/>`,
  medal: `<path d="M13 3l8 14M35 3l-8 14" stroke="#e8453c" stroke-width="7" stroke-linecap="round"/><circle cx="24" cy="30" r="13" fill="#ffc928" ${S}/><path d="M24 22l2.5 5 5.5.8-4 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4-3.9 5.5-.8z" fill="#fff6c8"/>`,
  crown: `<path d="M6 34L4 14l10 8 10-14 10 14 10-8-2 20z" fill="#ffc928" ${S}/><rect x="6" y="34" width="36" height="7" rx="3" fill="#e0a800" ${S}/>`,
  share: `<path d="M24 31V6M14 15l10-10 10 10M10 27v12a4 4 0 0 0 4 4h20a4 4 0 0 0 4-4V27" ${C}/>`,
  snowflake: '<path d="M24 4v40M7 14l34 20M7 34l34-20" stroke="#4bb3e8" stroke-width="5" stroke-linecap="round"/><circle cx="24" cy="24" r="5" fill="#fff" stroke="#4bb3e8" stroke-width="3"/>',
  parcel: `<rect x="6" y="12" width="36" height="30" rx="5" fill="#d9a066" ${S}/><path d="M24 12v30M6 25h36" stroke="#8a5a44" stroke-width="4"/><path d="M24 12c-6-9-14-3-8 0M24 12c6-9 14-3 8 0" fill="none" stroke="#1d2b36" stroke-width="3" stroke-linecap="round"/>`,
  next: `<path d="M18 8l16 16-16 16" ${C}/>`,
  van: `<rect x="3" y="14" width="29" height="21" rx="5" fill="#2f9e92" ${S}/><path d="M32 20h8q5 0 7 6l1 9H32z" fill="#2f9e92" ${S}/><path d="M36 23h4q3 0 4 3h-8z" fill="#d8efff"/><circle cx="14" cy="37" r="6" fill="#2b2f36" ${S}/><circle cx="38" cy="37" r="6" fill="#2b2f36" ${S}/><circle cx="14" cy="37" r="2" fill="#cfd5dc"/><circle cx="38" cy="37" r="2" fill="#cfd5dc"/><rect x="7" y="22" width="21" height="4" rx="2" fill="#fff"/>`,
  gift: `<rect x="6" y="20" width="36" height="24" rx="5" fill="#e8453c" ${S}/><path d="M24 20v24" stroke="#ffd84d" stroke-width="7"/>`,
  'gift-lid': `<rect x="3" y="11" width="42" height="11" rx="4" fill="#ff6a5f" ${S}/><path d="M24 11v11" stroke="#ffd84d" stroke-width="7"/><path d="M24 11c-6-9-14-3-8 0M24 11c6-9 14-3 8 0" fill="none" stroke="#ffd84d" stroke-width="4" stroke-linecap="round"/>`,
};

/** Icon markup (an <svg> string). Names: see ICONS. */
export function iconSvg(name, cls = '') {
  return `<svg class="ico-svg ${cls}" viewBox="0 0 48 48" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`;
}

/** Icon as a DOM element (a <span class="ico"> wrapping the svg). */
export function ico(name, cls = '') {
  const el = document.createElement('span');
  el.className = 'ico ' + cls;
  el.innerHTML = iconSvg(name);
  return el;
}

/** A row of star icons: `n` earned out of `total` (empty slots greyed). Stars "stamp in" one by one via CSS. */
export function starsEl(n, total = 3, cls = '') {
  const el = document.createElement('span');
  el.className = 'star-row ' + cls;
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', `${n}/${total}`);
  el.innerHTML = Array.from({ length: total }, (_, i) =>
    `<span class="st ${i < n ? 'on' : 'off'}" style="--i:${i}">${iconSvg(i < n ? 'star' : 'star-off')}</span>`).join('');
  return el;
}

/** The player's van as a small preview (used for the victory bounce and the logo). */
export const vanIcon = (skin = 'classic') =>
  `<svg viewBox="0 0 100 100" class="van-preview" aria-hidden="true">${vanArt(skin)}</svg>`;

/** Gift-box reveal for an unlock: the lid pops off and the prize (`innerHtml`, an svg string) jumps out. `k` staggers several gifts. */
export function gift(innerHtml, k = 0) {
  const el = document.createElement('span');
  el.className = 'gift';
  el.style.setProperty('--k', k);
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<span class="gift-item">${innerHtml}</span><span class="gift-box">${iconSvg('gift')}</span><span class="gift-lid">${iconSvg('gift-lid')}</span>`;
  return el;
}
