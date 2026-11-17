// Career mode progress rules. Pure: works on the saved `data.career` object.
//   data.career = { levels: { '<n>': { stars, fuel } } }   (n = 1..60)

export const DISTRICTS = 6;
export const LEVELS_PER_DISTRICT = 10;
export const TOTAL_LEVELS = DISTRICTS * LEVELS_PER_DISTRICT;
export const STARS_TO_UNLOCK = 20; // of the 30 stars in a district

export const districtOf = (n) => Math.ceil(n / LEVELS_PER_DISTRICT);
export const levelInDistrict = (n) => ((n - 1) % LEVELS_PER_DISTRICT) + 1;
export const isBoss = (n) => levelInDistrict(n) === LEVELS_PER_DISTRICT;
export const firstLevelOf = (d) => (d - 1) * LEVELS_PER_DISTRICT + 1;

export function districtStars(data, d) {
  let sum = 0;
  for (let n = firstLevelOf(d); n < firstLevelOf(d) + LEVELS_PER_DISTRICT; n++) sum += data.career.levels[n]?.stars || 0;
  return sum;
}

export const districtLevelsDone = (data, d) => {
  let c = 0;
  for (let n = firstLevelOf(d); n < firstLevelOf(d) + LEVELS_PER_DISTRICT; n++) if (data.career.levels[n]) c++;
  return c;
};

/** All 10 levels finished: this earns the district's van skin. */
export const isDistrictComplete = (data, d) => districtLevelsDone(data, d) === LEVELS_PER_DISTRICT;

/** District 1 is open; each next one needs 20 stars in the previous district. */
export const isDistrictUnlocked = (data, d) => d === 1 || districtStars(data, d - 1) >= STARS_TO_UNLOCK;

/** First level of an open district, then each level once the one before it is finished. */
export function isLevelUnlocked(data, n) {
  if (n < 1 || n > TOTAL_LEVELS) return false;
  const d = districtOf(n);
  if (!isDistrictUnlocked(data, d)) return false;
  return levelInDistrict(n) === 1 || !!data.career.levels[n - 1];
}

export const careerSummary = (data) => ({
  done: Object.keys(data.career.levels).length,
  stars: Object.values(data.career.levels).reduce((s, l) => s + l.stars, 0),
  maxStars: TOTAL_LEVELS * 3,
});

/** The level a player should play next (first unlocked level without stars, else the last level). */
export function nextLevel(data) {
  for (let n = 1; n <= TOTAL_LEVELS; n++) if (isLevelUnlocked(data, n) && !data.career.levels[n]) return n;
  return TOTAL_LEVELS;
}
