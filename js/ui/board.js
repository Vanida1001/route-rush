// The city grid as one inline SVG, plus the van. Input: taps, swipes (keys are handled by the screen).
import { tileSvg, vanArt } from './art.js';
import { canMove, roadworksClosed } from '../game.js';
import { neighbors, stepIndex } from '../puzzle.js';

const SWIPE_MIN = 18; // px

/**
 * @param {object} o
 * @param {object} o.puzzle
 * @param {string} o.skin
 * @param {(k:string, v?:object)=>string} o.t translate function
 * @param {(idx:number)=>void} [o.onTile] called with the target tile of a tap or swipe (-1 = off the grid)
 */
export function createBoard({ puzzle, skin, t, onTile }) {
  const S = puzzle.size * 100;
  let tiles = '';
  for (let i = 0; i < puzzle.size * puzzle.size; i++) tiles += tileSvg(puzzle, i, t);
  const wrap = document.createElement('div');
  wrap.className = 'board-wrap';
  wrap.innerHTML =
    `<svg class="board" viewBox="0 0 ${S} ${S}" role="img" aria-label="${t('board.label')}">` +
    `<g class="tiles">${tiles}</g><g class="hints"></g><polyline class="trail" points=""/>` +
    `<g class="van"><g class="flip"><g transform="translate(5 8) scale(.9)">${vanArt(skin)}</g></g></g></svg>`;
  const svg = wrap.querySelector('svg');
  const van = wrap.querySelector('.van');
  const flip = wrap.querySelector('.flip');
  const hints = wrap.querySelector('.hints');
  const trail = wrap.querySelector('.trail');
  const houseEls = puzzle.houses.map((_, k) => wrap.querySelector(`[data-house="${k}"]`));
  const stallEls = (puzzle.pickups || []).map((_, i) => wrap.querySelector(`[data-stall="${i}"]`));
  const custEls = (puzzle.pickups || []).map((_, i) => wrap.querySelector(`[data-cust="${i}"]`));
  const worksEls = [...wrap.querySelectorAll('[data-rw]')].map((el) => {
    const g = el.parentNode; // <g transform="translate(x y)">
    const m = /translate\((\d+) (\d+)\)/.exec(g.getAttribute('transform'));
    return { el, idx: (Number(m[2]) / 100) * puzzle.size + Number(m[1]) / 100 };
  });

  let last = null; // last state shown
  let pos = puzzle.depot;
  let facingLeft = false;

  const centre = (i) => [(i % puzzle.size) * 100 + 50, ((i / puzzle.size) | 0) * 100 + 50];

  function update(state) {
    const moved = last && last.pos !== state.pos;
    if (moved) {
      const dx = (state.pos % puzzle.size) - (last.pos % puzzle.size);
      if (dx !== 0) facingLeft = dx < 0;
    }
    flip.style.transform = facingLeft ? 'scaleX(-1)' : '';
    van.style.transform = `translate(${(state.pos % puzzle.size) * 100}px, ${((state.pos / puzzle.size) | 0) * 100}px)`;
    houseEls.forEach((el, k) => {
      const done = ((state.delivered >> k) & 1) === 1;
      const was = last ? ((last.delivered >> k) & 1) === 1 : done;
      el.classList.toggle('delivered', done);
      el.classList.toggle('pop', done && !was);
      el.classList.toggle('late', state.failedHouse === k);
    });
    (state.pick || []).forEach((v, i) => {
      stallEls[i].classList.toggle('taken', v >= 1);
      const was = last && last.pick ? last.pick[i] === 2 : v === 2;
      custEls[i].classList.toggle('delivered', v === 2);
      custEls[i].classList.toggle('pop', v === 2 && !was);
    });
    worksEls.forEach(({ el, idx }) => el.classList.toggle('closed', roadworksClosed(puzzle, idx, state.fuel)));
    svg.classList.toggle('failed', state.status === 'failed');
    pos = state.pos;
    // Dots on the tiles the van can drive to next
    hints.innerHTML = '';
    if (onTile && state.status === 'playing') {
      for (const q of neighbors(puzzle.size, state.pos)) {
        if (!canMove(puzzle, state, q)) continue;
        const [cx, cy] = centre(q);
        hints.insertAdjacentHTML('beforeend', `<circle class="hint" cx="${cx}" cy="${cy + 28}" r="6"/>`);
      }
    }
    last = state;
  }

  /** Draws a line through the given tile indexes (used for the best route). */
  function setTrail(route) {
    trail.setAttribute('points', route.map((i) => centre(i).join(',')).join(' '));
  }

  function bump() {
    van.classList.remove('bump');
    void van.getBoundingClientRect();
    van.classList.add('bump');
  }

  if (onTile) {
    let down = null;
    svg.addEventListener('pointerdown', (e) => {
      down = { x: e.clientX, y: e.clientY };
    });
    svg.addEventListener('pointerup', (e) => {
      if (!down) return;
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      down = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) >= SWIPE_MIN) {
        const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
        onTile(stepIndex(puzzle.size, pos, dir));
      } else {
        const r = svg.getBoundingClientRect();
        const x = Math.floor(((e.clientX - r.left) / r.width) * puzzle.size);
        const y = Math.floor(((e.clientY - r.top) / r.height) * puzzle.size);
        onTile(y * puzzle.size + x);
      }
    });
    svg.addEventListener('pointercancel', () => (down = null));
  }

  return { el: wrap, update, setTrail, bump };
}
