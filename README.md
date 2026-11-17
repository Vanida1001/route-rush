# Route Rush

A daily delivery puzzle. Plain HTML/CSS/JS modules, no build step, no dependencies. See `SPEC.md`.

## Play locally

ES modules and `fetch` need `http://`, so opening `index.html` by double-click will not work.

```bash
node serve.mjs
```

Then open http://localhost:8080/ (any static server works too, e.g. `python -m http.server`).

Handy for testing: `?date=YYYY-MM-DD` overrides today's date (try skipping a day to check streaks and freezes), e.g. `http://localhost:8080/?date=2026-11-20`.

## Tests

```bash
node --test
```

## Deploy to GitHub Pages

Push this folder to a repo, then Settings -> Pages -> deploy from the branch root. All paths are relative, so it works under `https://<user>.github.io/<repo>/`.

Before launch: set `LAUNCH_DATE` in `js/config.js` (puzzle #1). After changing any file, bump `CACHE` in `sw.js` so returning players refresh their offline copy.

## Version 2

Career (6 districts, 60 levels) and Rush Hour are on the Home screen. To test Career quickly, open the browser console and unlock levels by editing `routeRush.v1` -> `career.levels` (`{"1":{"stars":3,"fuel":10}, ...}`).

## Visual refresh

See `VISUAL-REFRESH.md`. Icons live in `js/ui/icons.js`; the rounded font (Fredoka, SIL OFL) is self-hosted in `fonts/` and cached by the service worker. Bump `CACHE` in `sw.js` after changing any file.
