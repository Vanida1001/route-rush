// Results screen: stars, fuel vs best, unlocks, share, best-route replay, countdown.
// Used for daily, archive and career runs.
import { h, reducedMotion } from './dom.js';
import { createBoard } from './board.js';
import { vanPreview } from './art.js';
import { app, go, toast, today } from '../app.js';
import { t } from '../i18n.js';
import { buildShareText } from '../share.js';
import { iconSvg, ico, starsEl, gift } from './icons.js';
import { effectiveStreak } from '../streak.js';
import { puzzleForNumber } from '../generator.js';
import { careerLevel } from '../levels.js';
import { replay, newState } from '../game.js';
import { msUntilNextMidnight, formatCountdown } from '../dates.js';
import { districtOf, levelInDistrict, isLevelUnlocked, TOTAL_LEVELS } from '../career.js';
import * as sound from '../sound.js';

/** Shares text with the phone's share sheet, or copies it. Returns 'shared' | 'copied' | 'cancel' | 'failed'. */
export async function shareText(text) {
  if (navigator.share && matchMedia('(pointer: coarse)').matches) {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancel';
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    const ta = h('textarea', { style: 'position:fixed;opacity:0' }, text);
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand?.('copy');
    ta.remove();
    return ok ? 'copied' : 'failed';
  }
}

export function confetti(host) {
  const colors = ['#e8453c', '#ffd23f', '#19b5a5', '#6c7ae0', '#f7a8c4', '#6fcf6f'];
  for (let i = 0; i < 44; i++) {
    host.append(h('i', {
      style: `left:${Math.random() * 100}%;background:${colors[i % colors.length]};animation-delay:${Math.random() * 0.9}s;animation-duration:${2.2 + Math.random() * 1.6}s`,
    }));
  }
}

export function render(root, params) {
  const [mode, arg] = params;
  const d = app.data;
  const isCareer = mode === 'career';
  let run = app.lastRun && app.lastRun.mode === mode && String(app.lastRun.arg) === String(arg) ? app.lastRun : null;
  if (!run && isCareer) {
    const rec = d.career.levels[arg];
    if (rec) {
      const puzzle = careerLevel(Number(arg));
      run = { mode, n: Number(arg), fuel: rec.fuel, best: puzzle.best, stars: rec.stars, events: [], counted: true, newSkins: [], newAchievements: [], newDistrict: 0, puzzle, arg };
    }
  } else if (!run && (mode === 'daily' || mode === 'archive')) {
    const e = d.history[arg];
    if (e) {
      run = {
        mode, n: Number(arg), fuel: e.fuel, best: e.best, stars: e.stars, events: e.events, counted: true,
        newSkins: [], newAchievements: [], newDistrict: 0, puzzle: puzzleForNumber(Number(arg)), arg,
      };
    }
  }
  if (!run) return void go('home');

  const { puzzle } = run;
  const entry = mode === 'daily' || mode === 'archive' ? d.history[run.n] : null;
  const streakNow = effectiveStreak(d.streak, today());
  const title = run.stars === 3 ? t('results.perfect') : run.stars === 2 ? t('results.great') : t('results.done');
  const over = run.fuel - run.best;
  const countdown = h('b', { class: 'countdown' });
  const routeArea = h('div', { class: 'route-area' });
  let timers = [];
  const clearTimers = () => { timers.forEach(clearInterval); timers = []; };

  async function onShare() {
    const text = buildShareText(t, {
      n: run.n, stars: entry.stars, fuel: entry.fuel, best: entry.best, events: entry.events,
      streak: entry.kind === 'daily' ? streakNow : 0,
    });
    const r = await shareText(text);
    if (r === 'copied') toast(t('results.copied'));
    else if (r === 'failed') toast(t('results.copy_failed'));
  }

  function showRoute() {
    clearTimers();
    routeArea.replaceChildren();
    const board = createBoard({ puzzle, skin: d.settings.skin, t });
    const label = h('p', { class: 'route-label' }, t('results.route_playing'));
    routeArea.append(board.el, label);
    board.update(newState(puzzle));
    let k = 0;
    const route = puzzle.route;
    const tm = setInterval(() => {
      k += 1;
      board.update(replay(puzzle, route.slice(0, k + 1)));
      board.setTrail(route.slice(0, k + 1));
      if (k >= route.length - 1) {
        clearInterval(tm);
        label.textContent = t('results.route_done', { best: puzzle.best });
      }
    }, reducedMotion() ? 120 : 320);
    timers.push(tm);
    routeArea.scrollIntoView?.({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
  }

  // Each unlock arrives in a gift box: the lid pops off and the prize jumps out.
  let giftN = 0;
  const unlocks = [
    ...run.newSkins.map((id) => h('li', { class: 'unlock' }, gift(vanPreview(id), giftN++), t('results.new_skin', { name: t('skin.' + id) }))),
    ...run.newAchievements.map((id) => h('li', { class: 'unlock' }, gift(iconSvg('medal'), giftN++), t('results.new_ach', { name: t('ach.' + id + '.name') }))),
    run.newDistrict > 0 && h('li', { class: 'unlock' }, gift(iconSvg('map'), giftN++), t('results.new_district', { name: t('district.' + run.newDistrict) })),
  ].filter(Boolean);

  const replayPath = `play/${mode}/${run.n}`;
  const nextN = isCareer && run.n < TOTAL_LEVELS && isLevelUnlocked(d, run.n + 1) ? run.n + 1 : 0;
  const note = !run.counted && !isCareer ? t('results.replay_note') : null;

  root.append(
    h('div', { class: 'confetti', 'aria-hidden': 'true' }),
    h('section', { class: 'card results' },
      h('div', { class: 'eyebrow' }, isCareer
        ? t('play.career', { n: levelInDistrict(run.n), district: t('district.' + districtOf(run.n)) })
        : t('results.eyebrow', { n: run.n })),
      h('div', { class: 'victory', html: vanPreview(d.settings.skin), 'aria-hidden': 'true' }),
      h('h2', null, title),
      h('div', { role: 'img', 'aria-label': t('results.stars_aria', { n: run.stars }) }, starsEl(run.stars, 3)),
      h('p', { class: 'fuel-line' }, t('share.fuel', { fuel: run.fuel, best: run.best })),
      h('p', { class: 'muted' }, over <= 0 ? t('results.optimal') : t('results.over', { n: over })),
      note && h('p', { class: 'note' }, note),
      run.counted && mode === 'daily' && h('p', { class: 'streak-line' }, h('span', { class: 'flame', html: iconSvg('flame') }), t('home.streak', { n: run.streak }),
        run.usedFreeze && h('span', { class: 'muted' }, ' · ', t('results.freeze_used')),
        run.earnedFreeze && h('span', { class: 'muted' }, ' · ', t('results.freeze_earned'))),
      isCareer && d.career.levels[run.n] && d.career.levels[run.n].stars > run.stars &&
        h('p', { class: 'note' }, t('results.career_best', { n: d.career.levels[run.n].stars })),
      unlocks.length > 0 && h('div', { class: 'unlocks' }, h('h3', null, t('results.unlocked')), h('ul', null, unlocks)),
      h('div', { class: 'btn-col' },
        nextN > 0 && h('button', { class: 'btn primary', onClick: () => go('play/career/' + nextN) }, t('results.next_level'), ' ', ico('next')),
        entry && h('button', { class: 'btn primary', onClick: onShare }, ico('share'), t('results.share')),
        h('button', { class: 'btn', onClick: showRoute }, ico('map'), t('results.show_route')),
        h('button', { class: 'btn', onClick: () => { delete d.progress[`${mode}:${run.n}`]; go(replayPath); } }, ico('restart'), t('results.replay')),
        isCareer && h('button', { class: 'btn', onClick: () => go('career') }, ico('map'), t('results.back_map'))),
      routeArea,
      !isCareer && h('p', { class: 'next' }, t('results.next_in'), ' ', countdown),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn', onClick: () => go('stats') }, ico('stats'), t('nav.stats')),
        h('button', { class: 'btn', onClick: () => go('home') }, ico('home'), t('nav.home')))),
  );

  if (run.stars === 3 && !reducedMotion()) confetti(root.querySelector('.confetti'));
  if (run.stars === 3 && run.counted) sound.fanfare();

  const tick = () => { countdown.textContent = formatCountdown(msUntilNextMidnight()); };
  tick();
  timers.push(setInterval(tick, 1000));
  return clearTimers;
}
