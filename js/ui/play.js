// The puzzle screen: HUD, board, undo/restart. Used for daily, archive, career and the tutorial.
import { h, reducedMotion } from './dom.js';
import { createBoard } from './board.js';
import { PICK_COLORS } from './art.js';
import { ico } from './icons.js';
import { app, persist, today, todayNumber, go } from '../app.js';
import { t } from '../i18n.js';
import { tankFor, newState, step, undo, replay, parcelsLeft, expressStatus } from '../game.js';
import { stepIndex } from '../puzzle.js';
import { puzzleForNumber } from '../generator.js';
import { careerLevel } from '../levels.js';
import { tutorialPuzzle } from '../tutorial.js';
import { recordFinish } from '../progress.js';
import { weekdayOfPuzzle } from '../dates.js';
import { isLevelUnlocked, districtOf, levelInDistrict, isBoss, TOTAL_LEVELS } from '../career.js';
import * as sound from '../sound.js';

const WARN_AT = 3; // warn when an express parcel has this much fuel left or less
const KEYS = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
};

export function render(root, params) {
  const [mode, arg] = params;
  const d = app.data;
  let puzzle, key = null, n = 0;

  if (mode === 'daily') {
    n = todayNumber();
    puzzle = puzzleForNumber(n);
    key = 'daily:' + n;
  } else if (mode === 'archive') {
    n = Number(arg);
    if (!(n >= 1 && n < todayNumber() && n >= todayNumber() - 7)) return void go('home');
    puzzle = puzzleForNumber(n);
    key = 'archive:' + n;
  } else if (mode === 'career') {
    n = Number(arg);
    if (!(n >= 1 && n <= TOTAL_LEVELS) || !isLevelUnlocked(d, n)) return void go('career');
    puzzle = careerLevel(n);
    key = 'career:' + n;
  } else if (mode === 'tutorial') {
    puzzle = tutorialPuzzle();
  } else return void go('home');

  const saved = key ? d.progress[key] : null;
  let st = (saved && saved.path && replay(puzzle, saved.path)) || newState(puzzle);
  let undos = saved?.undos || 0;
  let fails = saved?.fails || 0;
  let finished = false;
  let paused = false; // true while the reload tip is open
  let timer = 0;

  // ----- layout -----
  const isCareer = mode === 'career';
  const dist = isCareer ? districtOf(n) : 0;
  const titleText =
    mode === 'daily' || mode === 'archive'
      ? t('play.title', { n, day: t('weekday.' + weekdayOfPuzzle(n)) })
      : isCareer ? t('play.career', { n: levelInDistrict(n), district: t('district.' + dist) }) : t('play.try');
  const tip = isCareer && (levelInDistrict(n) === 1 || isBoss(n))
    ? t(isBoss(n) && dist > 1 ? 'career.boss_hint' : 'career.hint.' + dist) : null;
  const tank = tankFor(puzzle);
  const fuelEl = h('b', { class: 'fuel-n' });
  const vanEl = h('span', { class: 'slots' });
  const leftEl = h('b');
  const vanCount = h('b', { class: 'van-count' });
  const chipsEl = h('div', { class: 'chips' });
  const alertEl = h('div', { class: 'alert', role: 'status', 'aria-live': 'polite' });
  const board = createBoard({ puzzle, skin: d.settings.skin, t, onTile: moveTo });
  const undoBtn = h('button', { class: 'btn', onClick: doUndo }, ico('undo'), t('play.undo'));
  const restartBtn = h('button', { class: 'btn', onClick: doRestart }, ico('restart'), t('play.restart'));

  root.append(
    h('div', { class: 'play-head' }, h('h2', null, titleText)),
    tip ? h('div', { class: 'tip' }, tip) : '',
    h('div', { class: 'hud' },
      h('div', { class: 'stat' }, h('span', { class: 'lbl' }, t('hud.fuel')), h('span', null, fuelEl, ' / ', h('span', { class: 'target' }, tank)), h('small', { class: 'sub' }, t('hud.target', { n: tank - puzzle.best }))),
      h('div', { class: 'stat' }, h('span', { class: 'lbl' }, t('hud.van')), h('span', { class: 'van-row' }, vanCount, vanEl)),
      h('div', { class: 'stat' }, h('span', { class: 'lbl' }, t('hud.left')), leftEl)),
    chipsEl, alertEl, board.el,
    h('div', { class: 'controls' }, undoBtn, restartBtn),
    h('p', { class: 'hint-text' }, t('play.hint')),
  );

  function renderHud(animateFuel) {
    fuelEl.textContent = Math.max(0, tank - st.fuel);
    if (animateFuel) {
      fuelEl.classList.remove('tick');
      void fuelEl.offsetWidth;
      fuelEl.classList.add('tick');
    }
    // Van slots: parcels, food being carried (coloured), empty space
    const food = st.pick.map((v, i) => (v === 1 ? i : -1)).filter((i) => i >= 0);
    vanEl.replaceChildren(...Array.from({ length: puzzle.capacity }, (_, i) => {
      if (i < st.load) return h('i', { class: 'pk full' });
      const f = food[i - st.load];
      return f !== undefined
        ? h('i', { class: 'pk food', style: `background:${PICK_COLORS[puzzle.pickups[f].color % 3]}` })
        : h('i', { class: 'pk' });
    }));
    vanEl.setAttribute('aria-label', t('hud.van_aria', { n: st.load + food.length }));
    vanCount.textContent = `${st.load + food.length}/${puzzle.capacity}`;
    leftEl.textContent = parcelsLeft(puzzle, st);

    const ex = expressStatus(puzzle, st);
    const pickChips = (puzzle.pickups || []).map((p, i) => {
      const v = st.pick[i];
      return h('span', { class: 'chip food' + (v === 2 ? ' done' : '') },
        h('i', { class: 'dot s' + (p.color % 3), style: `background:${PICK_COLORS[p.color % 3]}` }),
        v === 2 ? ico('check') : '', t(v === 0 ? 'hud.pick_stall' : v === 1 ? 'hud.pick_customer' : 'hud.pick_done'));
    });
    chipsEl.replaceChildren(
      ...ex.map((e) => {
        const warn = !e.done && e.left >= 0 && e.left <= WARN_AT;
        const late = !e.done && e.left < 0;
        return h('span', { class: 'chip' + (e.done ? ' done' : '') + (warn ? ' warn' : '') + (late ? ' late' : '') },
          ico(e.done ? 'check' : warn || late ? 'warn' : 'bolt'), t('board.by', { n: tank - e.deadline }),
          !e.done && !late && ' · ' + t('hud.fuel_left', { n: e.left }));
      }),
      ...pickChips);
    const worst = ex.filter((e) => !e.done && e.left >= 0 && e.left <= WARN_AT).sort((a, b) => a.left - b.left)[0];
    alertEl.className = 'alert' + (st.status === 'failed' || worst ? ' on' : '');
    alertEl.textContent = st.status === 'failed' ? t(st.failedHouse >= 0 ? 'play.failed' : 'play.nofuel') : worst ? t('play.warn', { n: worst.left }) : '';
    undoBtn.toggleAttribute('disabled', st.path.length <= 1);
    restartBtn.toggleAttribute('disabled', st.path.length <= 1);
  }

  function save() {
    if (!key) return;
    d.progress[key] = { path: st.path, undos, fails };
    persist();
  }

  function moveTo(idx) {
    if (finished || paused) return;
    const prev = st;
    const ns = idx >= 0 ? step(puzzle, st, idx) : null;
    if (!ns) return board.bump();
    st = ns;
    if ((mode === 'daily' || mode === 'archive') && prev.path.length === 1) d.started[n] = true;
    sound.engine();
    if (ns.events.length > prev.events.length) sound.ding();
    if (ns.status === 'failed') { fails += 1; sound.fail(); }
    board.update(st);
    renderHud(true);
    save();
    if (st.status === 'playing' && st.load === 0 && st.delivered !== (1 << puzzle.houses.length) - 1) maybeShowReloadTip();
    if (st.status === 'won') {
      finished = true;
      timer = setTimeout(finish, reducedMotion() ? 300 : 900);
    }
  }

  // The first time the van runs empty with parcels still to deliver, explain that it must go back to the depot.
  function maybeShowReloadTip() {
    if (d.settings.seenReloadTip) return;
    d.settings.seenReloadTip = true;
    persist();
    paused = true;
    const ok = h('button', { class: 'btn primary', onClick: () => { overlay.remove(); paused = false; } }, t('tip.ok'));
    const overlay = h('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true' },
      h('div', { class: 'card' }, h('h2', null, ico('parcel'), t('tip.reload_title')), h('p', null, t('tip.reload')), ok));
    root.append(overlay);
    ok.focus();
  }

  function doUndo() {
    if (finished || paused || st.path.length <= 1) return;
    st = undo(puzzle, st);
    undos += 1;
    board.update(st);
    renderHud();
    save();
  }

  function doRestart() {
    if (finished || paused || st.path.length <= 1) return;
    st = newState(puzzle);
    board.update(st);
    renderHud();
    save();
  }

  function finish() {
    if (mode === 'tutorial') {
      d.settings.seenHowTo = true;
      persist();
      root.append(h('div', { class: 'overlay' },
        h('div', { class: 'card' },
          h('h2', null, t('tutorial.done_title')),
          h('p', null, t('tutorial.done', { fuel: st.fuel, best: puzzle.best })),
          h('button', { class: 'btn primary', onClick: () => go('home') }, t('nav.home')))));
      return;
    }
    const result = recordFinish(d, { mode, n, puzzle, state: st, now: new Date(), today: today(), undos, fails });
    delete d.progress[key];
    persist();
    app.lastRun = { ...result, puzzle, arg: n };
    go(`results/${mode}/${n}`);
  }

  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'z' || e.key === 'Z' || e.key === 'Backspace') { e.preventDefault(); return doUndo(); }
    const dir = KEYS[e.key];
    if (!dir) return;
    e.preventDefault();
    moveTo(stepIndex(puzzle.size, st.pos, dir));
  }
  window.addEventListener('keydown', onKey);

  board.update(st);
  renderHud();
  return () => {
    window.removeEventListener('keydown', onKey);
    clearTimeout(timer);
  };
}
