// Rush Hour timing rules. Pure: a run is a plain object, every function returns a new one.
//   run = { remainingMs, solved, skipped, over }

export const RUSH = {
  DURATION_MS: 180000, // 3 minutes
  BONUS_BEST_S: 10, // solved with the best possible fuel
  BONUS_PLUS1_S: 5, // solved with 1 fuel above the best
  SKIP_PENALTY_S: 15,
};

export const newRun = () => ({ remainingMs: RUSH.DURATION_MS, solved: 0, skipped: 0, over: false });

/** Bonus seconds for a solved puzzle. */
export function bonusSeconds(fuel, best) {
  if (fuel <= best) return RUSH.BONUS_BEST_S;
  if (fuel === best + 1) return RUSH.BONUS_PLUS1_S;
  return 0;
}

const settle = (run) => ({ ...run, remainingMs: Math.max(0, run.remainingMs), over: run.remainingMs <= 0 });

/** Time passes. The run is over when the timer reaches 0. */
export function tick(run, dtMs) {
  if (run.over) return run;
  return settle({ ...run, remainingMs: run.remainingMs - dtMs });
}

/** A puzzle was solved: +1 point and bonus time. */
export function solved(run, fuel, best) {
  if (run.over) return run;
  return settle({
    ...run,
    solved: run.solved + 1,
    remainingMs: run.remainingMs + bonusSeconds(fuel, best) * 1000,
  });
}

/** Skip costs 15 seconds (and can end the run if less than that is left). */
export function skip(run) {
  if (run.over) return run;
  return settle({ ...run, skipped: run.skipped + 1, remainingMs: run.remainingMs - RUSH.SKIP_PENALTY_S * 1000 });
}
