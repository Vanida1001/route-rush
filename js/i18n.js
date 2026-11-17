// Loads lang/fr.json or lang/en.json and translates keys. Browser only.
import { format } from './share.js';

let dict = {};
let lang = 'en';

export const getLang = () => lang;

/** First visit: French if the browser language starts with "fr", otherwise English. */
export function detectLang() {
  return String(globalThis.navigator?.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export async function setLang(code) {
  const res = await fetch(new URL(`../lang/${code}.json`, import.meta.url));
  dict = await res.json();
  lang = code;
  document.documentElement.lang = code;
}

export function t(key, vars) {
  const s = dict[key];
  return s === undefined ? key : format(s, vars);
}
