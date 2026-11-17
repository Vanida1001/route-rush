// Rush Hour: a 3-minute race to solve as many small puzzles as possible.
import { h, reducedMotion } from './dom.js';
import { iconSvg, ico, gift } from './icons.js';
import { createBoard } from './board.js';
import { app, persist, today, go, toast } from '../app.js';
import { t } from '../i18n.js';
import { tankFor, newState, step, undo } from '../game.js';
import { stepIndex } from '../puzzle.js';
import { rushPuzzle } from '../levels.js';
import { RUSH, newRun, tick, solved as onSolved, skip as onSkip, bonusSeconds } from '../rush.js';
import { recordRush } from '../progress.js';
import { shareText, confetti } from './results.js';
import * as sound from '../sound.js';

const KEYS = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
};
const fmt = (ms) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function render(root) {
  const d = app.data;
  let cleanup = () => {};

  function intro() {
    cleanup();
    cleanup = () => {};
    root.replaceChildren(
      h('h2', { class: 'screen-title' }, ico('timer'), t('nav.rush')),
      h('section', { class: 'card hero' },
        h('p', null, t('rush.intro')),
        h('ul', { class: 'rules' },
          h('li', null, t('rush.rule_bonus', { a: RUSH.BONUS_BEST_S, b: RUSH.BONUS_PLUS1_S })),
          h('li', null, t('rush.rule_skip', { n: RUSH.SKIP_PENALTY_S })),
          h('li', null, t('rush.rule_end'))),
        h('p', { class: 'streak' }, ico('trophy'), t('rush.best', { n: d.rush.best })),
        h('button', { class: 'btn primary big', onClick: start }, t('rush.start'))),
    );
  }

  function start() {
    const seed = Math.floor(Math.random() * 2 ** 31);
    let index = 0;
    let run = newRun();
    let puzzle = rushPuzzle(seed, index);
    let next = null; // the following puzzle, generated in the background
    let st = newState(puzzle);
    let board;
    let last = performance.now();
    let locked = false; // true briefly after a solve
    let timerId = 0;
    let bgId = 0;

    const timeEl = h('b', { class: 'rush-time' });
    const scoreEl = h('b');
    const fuelEl = h('b', { class: 'fuel-n' });
    const bonusEl = h('div', { class: 'bonus' });
    const alertEl = h('div', { class: 'alert', role: 'status', 'aria-live': 'polite' });
    const boardHost = h('div');
    const undoBtn = h('button', { class: 'btn', onClick: doUndo }, ico('undo'), t('play.undo'));
    const restartBtn = h('button', { class: 'btn', onClick: doRestart }, ico('restart'), t('play.restart'));
    const skipBtn = h('button', { class: 'btn', onClick: doSkip }, ico('skip'), t('rush.skip', { n: RUSH.SKIP_PENALTY_S }));

    root.replaceChildren(
      h('div', { class: 'hud rush' },
        h('div', { class: 'stat' }, h('span', { class: 'lbl' }, t('rush.time')), timeEl),
        h('div', { class: 'stat' }, h('span', { class: 'lbl' }, t('rush.solved')), scoreEl),
        h('div', { class: 'stat' }, h('span', { class: 'lbl' }, t('hud.fuel_short')), fuelEl)),
      bonusEl, alertEl, boardHost,
      h('div', { class: 'controls' }, undoBtn, restartBtn, skipBtn),
      h('p', { class: 'hint-text' }, t('play.hint')),
    );

    function prefetch() {
      // Generate the next puzzle while the player is busy with this one, so there is never a wait.
      bgId = setTimeout(() => { next = rushPuzzle(seed, index + 1); }, 0);
    }

    function show() {
      board = createBoard({ puzzle, skin: d.settings.skin, t, onTile: moveTo });
      boardHost.replaceChildren(board.el);
      st = newState(puzzle);
      board.update(st);
      render_();
      prefetch();
    }

    function render_() {
      timeEl.textContent = fmt(run.remainingMs);
      timeEl.parentNode.classList.toggle('low', run.remainingMs <= 15000);
      scoreEl.textContent = run.solved;
      fuelEl.textContent = Math.max(0, tankFor(puzzle) - st.fuel);
      alertEl.className = 'alert' + (st.status === 'failed' ? ' on' : '');
      alertEl.textContent = st.status === 'failed' ? t('play.nofuel') : '';
    }

    function flash(text) {
      bonusEl.textContent = text;
      bonusEl.classList.remove('show');
      void bonusEl.offsetWidth;
      bonusEl.classList.add('show');
    }

    function advance() {
      index += 1;
      puzzle = next || rushPuzzle(seed, index);
      next = null;
      locked = false;
      show();
    }

    function moveTo(idx) {
      if (run.over || locked) return;
      const ns = idx >= 0 ? step(puzzle, st, idx) : null;
      if (!ns) return board.bump();
      const prevEvents = st.events.length;
      st = ns;
      sound.engine();
      if (ns.events.length > prevEvents) sound.ding();
      board.update(st);
      if (st.status === 'won') {
        const bonus = bonusSeconds(st.fuel, puzzle.best);
        run = onSolved(run, st.fuel, puzzle.best);
        flash(bonus ? t('rush.bonus', { n: bonus }) : t('rush.no_bonus'));
        locked = true;
        render_();
        setTimeout(() => !run.over && advance(), reducedMotion() ? 150 : 450);
      } else {
        if (st.status === 'failed') sound.fail();
        render_();
      }
    }

    function doUndo() {
      if (run.over || locked || st.path.length <= 1) return;
      st = undo(puzzle, st);
      board.update(st);
      render_();
    }

    function doRestart() {
      if (run.over || locked || st.path.length <= 1) return;
      st = newState(puzzle);
      board.update(st);
      render_();
    }

    function doSkip() {
      if (run.over || locked) return;
      run = onSkip(run);
      flash(t('rush.penalty', { n: RUSH.SKIP_PENALTY_S }));
      if (run.over) return finish();
      advance();
    }

    function loop() {
      const now = performance.now();
      run = tick(run, now - last);
      last = now;
      if (run.over) return finish();
      timeEl.textContent = fmt(run.remainingMs);
      timeEl.parentNode.classList.toggle('low', run.remainingMs <= 15000);
    }

    function onKey(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'z' || e.key === 'Z' || e.key === 'Backspace') { e.preventDefault(); return doUndo(); }
      const dir = KEYS[e.key];
      if (!dir) return;
      e.preventDefault();
      moveTo(stepIndex(puzzle.size, st.pos, dir));
    }

    function stop() {
      clearInterval(timerId);
      clearTimeout(bgId);
      window.removeEventListener('keydown', onKey);
    }

    function finish() {
      stop();
      locked = true;
      const res = recordRush(d, run.solved, today());
      persist();
      gameOver(res);
    }

    window.addEventListener('keydown', onKey);
    timerId = setInterval(loop, 100);
    cleanup = stop;
    show();
  }

  function gameOver(res) {
    cleanup = () => {};
    const text = t('share.rush', { n: res.solved });
    const unlocks = res.newAchievements.map((id, k) => h('li', { class: 'unlock' }, gift(iconSvg('medal'), k), t('results.new_ach', { name: t('ach.' + id + '.name') })));
    root.replaceChildren(
      h('div', { class: 'confetti', 'aria-hidden': 'true' }),
      h('section', { class: 'card results' },
        h('div', { class: 'eyebrow' }, t('rush.over')),
        h('h2', null, res.isNewBest && res.solved > 0 ? t('rush.new_best') : t('rush.time_up')),
        h('div', { class: 'big-num' }, res.solved),
        h('p', { class: 'fuel-line' }, t('rush.deliveries', { n: res.solved })),
        h('p', { class: 'muted' }, t('rush.best', { n: res.best })),
        unlocks.length > 0 && h('div', { class: 'unlocks' }, h('h3', null, t('results.unlocked')), h('ul', null, unlocks)),
        h('div', { class: 'btn-col' },
          h('button', { class: 'btn primary', onClick: start }, t('rush.again')),
          h('button', { class: 'btn', onClick: async () => {
            const r = await shareText(text);
            if (r === 'copied') toast(t('results.copied'));
            else if (r === 'failed') toast(t('results.copy_failed'));
          } }, ico('share'), t('results.share'))),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn', onClick: () => go('stats') }, ico('stats'), t('nav.stats')),
          h('button', { class: 'btn', onClick: () => go('home') }, ico('home'), t('nav.home')))),
    );
    if (res.isNewBest && res.solved > 0) {
      sound.fanfare();
      if (!reducedMotion()) confetti(root.querySelector('.confetti'));
    }
  }

  intro();
  return () => cleanup();
}
