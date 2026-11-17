// Van skins and how they unlock. Pure data + helpers (artwork lives in ui/art.js).

import { isDistrictComplete } from './career.js';

export const SKINS = [
  { id: 'classic', color: '#e8453c', unlock: null },
  { id: 'electric', color: '#19b5a5', unlock: { type: 'streak', n: 3 } },
  { id: 'bike', color: '#f2994a', unlock: { type: 'streak', n: 7 } },
  { id: 'icecream', color: '#f7a8c4', unlock: { type: 'streak', n: 14 } },
  { id: 'rocket', color: '#6c7ae0', unlock: { type: 'streak', n: 30 } },
  { id: 'taxi', color: '#ffd23f', unlock: { type: 'stars', n: 10 } },
  { id: 'golden', color: '#e0a800', unlock: { type: 'stars', n: 25 } },
  // One skin per finished career district
  { id: 'tiong', color: '#f3e3b8', unlock: { type: 'district', n: 1 } },
  { id: 'chinatown', color: '#c62828', unlock: { type: 'district', n: 2 } },
  { id: 'quay', color: '#2b7fb8', unlock: { type: 'district', n: 3 } },
  { id: 'india', color: '#ef7d1a', unlock: { type: 'district', n: 4 } },
  { id: 'marina', color: '#27406b', unlock: { type: 'district', n: 5 } },
  { id: 'jurong', color: '#5f8f6b', unlock: { type: 'district', n: 6 } },
];

export const countThreeStars = (data) =>
  Object.values(data.history).filter((h) => h.stars === 3).length;

export function isUnlocked(skin, data) {
  if (!skin.unlock) return true;
  if (skin.unlock.type === 'district') return isDistrictComplete(data, skin.unlock.n);
  if (skin.unlock.type === 'streak') return data.streak.best >= skin.unlock.n;
  return countThreeStars(data) >= skin.unlock.n;
}

export const unlockedSkinIds = (data) => SKINS.filter((s) => isUnlocked(s, data)).map((s) => s.id);
