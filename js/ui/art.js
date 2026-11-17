// SVG artwork for tiles and vans, drawn as strings. Each tile is a 100 x 100 box.
// Colours come from CSS classes so dark mode and high contrast just work.
import { SKINS } from '../skins.js';
import { tankFor } from '../game.js';

const BASE = (cls) => `<rect class="tile ${cls}" x="3" y="3" width="94" height="94" rx="14"/>`;

function road() {
  return BASE('road') + '<path class="lane" d="M28 50h14M58 50h14"/>';
}

function traffic() {
  return (
    BASE('traffic') +
    '<g class="car c1"><rect x="14" y="30" width="30" height="16" rx="6"/><rect class="glass" x="24" y="33" width="10" height="8" rx="2"/></g>' +
    '<g class="car c2"><rect x="52" y="56" width="30" height="16" rx="6"/><rect class="glass" x="62" y="59" width="10" height="8" rx="2"/></g>' +
    '<circle class="badge" cx="80" cy="20" r="13"/><text class="badge-t" x="80" y="26" text-anchor="middle">×2</text>'
  );
}

function building(idx) {
  if (idx % 2 === 0) {
    // HDB block: tall slab with a grid of windows
    let w = '';
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) w += `<rect class="win" x="${30 + c * 14}" y="${20 + r * 13}" width="8" height="8" rx="2"/>`;
    return BASE('bld') + '<rect class="hdb" x="22" y="10" width="56" height="80" rx="6"/>' + w;
  }
  const c = (idx * 7) % 3; // shophouse colour variant
  return (
    BASE('bld') +
    // Shophouse: flat facade with a cornice and awning (clearly not a delivery house)
    `<rect class="shop s${c}" x="16" y="18" width="68" height="72" rx="4"/><rect class="roof" x="12" y="12" width="76" height="12" rx="3"/>` +
    '<rect class="win" x="24" y="32" width="12" height="14" rx="3"/><rect class="win" x="64" y="32" width="12" height="14" rx="3"/>' +
    '<path class="awning" d="M20 52h60l-4 12H24z"/><rect class="door" x="42" y="66" width="16" height="24" rx="3"/>'
  );
}

const park = () =>
  BASE('park') +
  '<circle class="tree" cx="34" cy="38" r="17"/><circle class="tree t2" cx="66" cy="60" r="19"/><circle class="tree" cx="30" cy="72" r="11"/>';

const water = () => BASE('water') + '<path class="wave" d="M14 36q9-9 18 0t18 0t18 0t18 0M14 66q9-9 18 0t18 0t18 0t18 0"/>';

function bridge(puzzle, idx) {
  const { size, tiles } = puzzle;
  const x = idx % size, y = (idx / size) | 0;
  const at = (dx, dy) => (x + dx < 0 || y + dy < 0 || x + dx >= size || y + dy >= size ? null : tiles[(y + dy) * size + x + dx]);
  const horizontal = at(0, -1) === 'w' || at(0, 1) === 'w';
  return (
    BASE('water') +
    (horizontal
      ? '<rect class="road" x="0" y="22" width="100" height="56"/><path class="rail" d="M0 22h100M0 78h100"/><path class="lane" d="M28 50h14M58 50h14"/>'
      : '<rect class="road" x="22" y="0" width="56" height="100"/><path class="rail" d="M22 0v100M78 0v100"/><path class="lane" d="M50 28v14M50 58v14"/>')
  );
}

const depot = () =>
  BASE('road') +
  '<path class="whroof" d="M10 46 L50 16 L90 46Z"/><rect class="whbody" x="16" y="44" width="68" height="44" rx="3"/>' +
  '<rect class="whdoor" x="32" y="54" width="36" height="34"/><path class="whline" d="M32 63h36M32 72h36M32 81h36"/>';

function house(k, h, t, tank) {
  const ex = h.express;
  return (
    `<g class="house${ex ? ' express' : ''}" data-house="${k}">` +
    BASE(ex ? 'exp' : 'hs') +
    '<path class="hroof" d="M14 42 L50 12 L86 42Z"/><rect class="hbody" x="22" y="40" width="56" height="32" rx="4"/>' +
    '<g class="parcel"><rect class="pbox" x="40" y="48" width="20" height="16" rx="3"/><path class="ptape" d="M50 48v16M40 56h20"/></g>' +
    '<g class="check"><circle class="ckbg" cx="50" cy="56" r="11"/><path class="ckmark" d="M44 56l5 5 9-10"/></g>' +
    (ex
      ? '<path class="bolt" d="M20 6 L8 30 H18 L13 48 L32 22 H21 Z"/>' +
        `<g class="pill"><rect x="10" y="74" width="80" height="21" rx="10"/><text x="50" y="90" text-anchor="middle" textLength="64" lengthAdjust="spacingAndGlyphs">${t('board.by', { n: tank - h.deadline })}</text></g>`
      : '') +
    '</g>'
  );
}

// ---------- version 2 mechanics ----------
export const PICK_COLORS = ['#e8453c', '#2f7de1', '#2e9e4f'];

/** Food icon: colour AND shape (circle, square, triangle) so it never relies on colour alone. */
export function foodGlyph(color, cx, cy, r = 11) {
  const fill = PICK_COLORS[color % 3];
  const common = `fill="${fill}" stroke="#fff" stroke-width="3" stroke-linejoin="round"`;
  if (color % 3 === 0) return `<circle cx="${cx}" cy="${cy}" r="${r}" ${common}/>`;
  if (color % 3 === 1) return `<rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" rx="3" ${common}/>`;
  return `<path d="M${cx} ${cy - r - 1}L${cx + r + 1} ${cy + r}H${cx - r - 1}Z" ${common}/>`;
}

function stall(i, p) {
  return (
    `<g class="stall" data-stall="${i}">` + BASE('road') +
    '<rect class="stallbody" x="18" y="44" width="64" height="38" rx="4"/>' +
    '<path class="stawn" d="M10 46 L20 16 H80 L90 46Z"/><path class="stripe" d="M33 16l-4 30M50 16v30M67 16l4 30"/>' +
    foodGlyph(p.color, 50, 64) + '</g>'
  );
}

function customer(i, p) {
  return (
    `<g class="house cust" data-cust="${i}">` + BASE('hs') +
    '<path class="hroof" d="M14 42 L50 12 L86 42Z"/><rect class="hbody" x="22" y="40" width="56" height="32" rx="4"/>' +
    `<g class="parcel">${foodGlyph(p.color, 50, 57, 9)}</g>` +
    '<g class="check"><circle class="ckbg" cx="50" cy="56" r="11"/><path class="ckmark" d="M44 56l5 5 9-10"/></g>' +
    `<path class="flag" d="M78 34V8l16 8-16 8" fill="${PICK_COLORS[p.color % 3]}" stroke="#fff" stroke-width="2"/><path d="M78 34V8" stroke="#1d2b36" stroke-width="3"/>` +
    '</g>'
  );
}

const ARROW_ANGLE = { right: 0, down: 90, left: 180, up: 270 };
const arrow = (dir) =>
  `<g transform="rotate(${ARROW_ANGLE[dir]} 50 50) translate(10 10) scale(.8)"><path class="arrow" d="M14 38h38V18l32 32-32 32V62H14z"/></g>`;

function works(n, level) {
  return (
    `<g class="works" data-rw="${n}">` + BASE('road') +
    '<path class="cone" d="M50 14 L74 70 H26Z"/><path class="conestripe" d="M42 36h16M36 52h28"/><rect class="conebase" x="20" y="68" width="60" height="10" rx="3"/>' +
    `<circle class="badge" cx="80" cy="20" r="14"/><text class="badge-t" x="80" y="26" text-anchor="middle">${level}</text>` +
    '<path class="xmark" d="M22 22L78 78M78 22L22 78"/></g>'
  );
}

/** One tile (and house/depot on top) as an SVG group at its grid position. */
export function tileSvg(puzzle, idx, t) {
  const x = (idx % puzzle.size) * 100;
  const y = ((idx / puzzle.size) | 0) * 100;
  const hi = puzzle.houses.findIndex((hh) => hh.i === idx);
  let inner;
  if (hi >= 0) inner = house(hi, puzzle.houses[hi], t, tankFor(puzzle));
  else if ((puzzle.pickups || []).some((p) => p.stall === idx)) {
    const i = puzzle.pickups.findIndex((p) => p.stall === idx);
    inner = stall(i, puzzle.pickups[i]);
  } else if ((puzzle.pickups || []).some((p) => p.customer === idx)) {
    const i = puzzle.pickups.findIndex((p) => p.customer === idx);
    inner = customer(i, puzzle.pickups[i]);
  } else if (idx === puzzle.depot) inner = depot();
  else if (puzzle.roadworks && puzzle.roadworks[idx] !== undefined) inner = works(puzzle.roadworks[idx], tankFor(puzzle) - puzzle.roadworks[idx]);
  else {
    switch (puzzle.tiles[idx]) {
      case 't': inner = traffic(); break;
      case 'b': inner = building(idx); break;
      case 'p': inner = park(); break;
      case 'w': inner = water(); break;
      case 'g': inner = bridge(puzzle, idx); break;
      default: inner = road();
    }
    if (puzzle.oneway && puzzle.oneway[idx]) inner += arrow(puzzle.oneway[idx]);
  }
  return `<g transform="translate(${x} ${y})">${inner}</g>`;
}

// ---------- vans ----------
const wheel = (cx, cy, r = 9) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#2b2f36"/><circle cx="${cx}" cy="${cy}" r="${(r * 0.4).toFixed(1)}" fill="#cfd5dc"/>`;

const body = (c) =>
  `<rect x="10" y="34" width="56" height="34" rx="7" fill="${c}"/><path d="M66 44h12q8 0 11 8l3 16H66z" fill="${c}"/>` +
  '<path d="M71 48h7q5 0 7 5H71z" fill="#d8efff"/><rect x="10" y="62" width="82" height="6" rx="3" fill="rgba(0,0,0,.2)"/>' +
  wheel(28, 70) + wheel(76, 70);

const ART = {
  classic: (c) => body(c) + '<rect x="14" y="46" width="48" height="6" rx="3" fill="#fff" opacity=".85"/>',
  electric: (c) => body(c) + '<path d="M40 38l-9 14h8l-3 12 12-16h-8z" fill="#fff"/><rect x="50" y="26" width="10" height="8" rx="2" fill="#1d2b36"/>',
  taxi: (c) =>
    body(c) + '<rect x="28" y="24" width="22" height="10" rx="3" fill="#1d2b36"/>' +
    '<path d="M14 50h8v6h-8zM30 50h8v6h-8zM46 50h8v6h-8z" fill="#1d2b36"/>',
  golden: (c) => body(c) + '<path d="M30 40l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#fff6c8"/>',
  icecream: (c) =>
    body(c) + '<path d="M28 18h16l-8 18z" fill="#d9a066"/><circle cx="36" cy="14" r="10" fill="#fff"/><circle cx="36" cy="5" r="4.5" fill="#e8453c"/>',
  rocket: (c) =>
    '<path d="M8 52q0-20 20-20h38q22 0 28 20-6 18-28 18H28Q8 70 8 52z" fill="' + c + '"/>' +
    '<circle cx="66" cy="50" r="9" fill="#d8efff"/><path d="M18 34l-10-16 24 6z" fill="#e8453c"/><path d="M10 52l-10-7v14z" fill="#ffb347"/>' +
    wheel(30, 72, 8) + wheel(76, 72, 8),
  tiong: (c) => body(c) + '<path d="M14 34h46l-4-9H18z" fill="#e8453c"/><path d="M28 34l-2-9M42 34l-1-9" stroke="#fff" stroke-width="3"/>',
  chinatown: (c) => body(c) + '<path d="M36 22v-8" stroke="#333" stroke-width="3"/><ellipse cx="36" cy="30" rx="9" ry="8" fill="#ffd23f"/><path d="M36 38v6" stroke="#ffd23f" stroke-width="3"/>',
  quay: (c) => body(c) + '<path d="M24 34l16-22v22z" fill="#fff"/><path d="M44 34l10-14v14z" fill="#ffd23f"/>',
  india: (c) => body(c) + '<circle cx="20" cy="50" r="5" fill="#ffd23f"/><circle cx="34" cy="50" r="5" fill="#e8453c"/><circle cx="48" cy="50" r="5" fill="#ffd23f"/><circle cx="62" cy="50" r="5" fill="#e8453c"/>',
  marina: (c) => body(c) + '<path d="M18 34l10-18 10 18zM40 34l8-14 8 14z" fill="#fff"/>',
  jurong: (c) => body(c) + '<rect x="20" y="20" width="9" height="14" fill="#555"/><rect x="36" y="25" width="9" height="9" fill="#555"/><path d="M24 14q-4-4 0-8" stroke="#bbb" stroke-width="3" fill="none"/>',
  bike: (c) =>
    `<rect x="6" y="36" width="32" height="24" rx="4" fill="${c}"/>` + wheel(26, 74, 13) + wheel(78, 74, 13) +
    '<path d="M26 74L48 52H68L78 74M48 52L42 40" stroke="#333" stroke-width="4" fill="none" stroke-linecap="round"/>' +
    '<circle cx="64" cy="30" r="7" fill="#f1c27d"/><path d="M64 38l-4 14" stroke="#333" stroke-width="5" stroke-linecap="round"/>',
};

/** Van artwork (facing right) for a skin id, as SVG markup inside a 100 x 100 box. */
export function vanArt(skinId) {
  const skin = SKINS.find((s) => s.id === skinId) || SKINS[0];
  return (ART[skin.id] || ART.classic)(skin.color);
}

export const vanPreview = (skinId) =>
  `<svg viewBox="0 0 100 100" class="van-preview" aria-hidden="true">${vanArt(skinId)}</svg>`;
