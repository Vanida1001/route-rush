# Route Rush — App Spec

Nov 16, 2026

## Overview

Route Rush is a daily delivery puzzle: everyone gets the same small city each day and tries to deliver every parcel using as little fuel as possible.

- **Pitch:** Wordle meets delivery logistics. One puzzle a day, 2–5 minutes, a score you can share.
- **Goal:** fun enough that players come back every day, and polished enough to show on my portfolio.
- **Target player:** students and casual puzzle fans, ages 13+, on phone or laptop.
- **Platform:** a web app in the browser, mobile-first, hosted free on GitHub Pages. No account and no install.
- **Languages:** French and English, switchable at any time.

## Core gameplay

The player drives a delivery van from the depot, tile by tile, dropping off every parcel and spending as little fuel as possible.

**The city (7 × 7 grid)**

| Tile | What it does |
| --- | --- |
| Road | Van can drive on it. Costs 1 fuel. |
| Traffic jam | Van can drive on it. Costs 2 fuel. |
| Building / park / water | Blocked. |
| Bridge | A road tile across water. Costs 1 fuel. |
| Depot (warehouse) | Start tile. Van reloads here. |
| House with parcel | A delivery stop. Driving onto it delivers the parcel. |
| Express house (lightning icon) | Must be delivered before a fuel deadline shown on the house, e.g. "by 10". |

**Rules**

1. The van starts at the depot, loaded to capacity (3 parcels on most days).
2. The player moves one tile at a time: tap or click a neighbouring tile, swipe, or use the arrow keys. No diagonal moves.
3. Driving onto a house delivers its parcel automatically if the van has one left.
4. When the van is empty, it must drive back to the depot to reload to full.
5. An express parcel delivered after its deadline makes the run fail. The game warns the player when a deadline is close.
6. The puzzle is solved when every parcel is delivered. The van does not need to return to the depot at the end.
7. **Undo** goes back one move, and **Restart** resets the run. Both are unlimited before the first finish.

**Always on screen:** fuel used, the target (the best possible fuel), parcels in the van, parcels left, and any express deadlines.

## Daily puzzle and scoring

Each calendar day has one puzzle, the same for every player, generated from the date. The game also knows the best possible score, so a perfect run is always reachable.

**Generation**

- Puzzle number = days since launch day (#1, #2, …). The puzzle is generated from a seeded random generator using that number, so nothing has to be stored on a server.
- A new puzzle starts at local midnight on the player's device.
- The generator places roads, blocks, traffic, the depot and the houses, then checks the puzzle with a solver:
  - it must be solvable;
  - the best route must not be obvious (for example, the nearest-house-first route must cost more than the optimum);
  - if a check fails, the generator tries the next seed.
- The solver finds the minimum fuel with a search over (van position, parcels delivered, parcels in the van). It respects express deadlines.

**Difficulty by weekday**

| Day | Parcels | Van capacity | Express | Traffic |
| --- | --- | --- | --- | --- |
| Monday | 4 | 4 | 0 | low |
| Tuesday | 4 | 3 | 0 | low |
| Wednesday | 5 | 3 | 1 | medium |
| Thursday | 5 | 3 | 1 | medium |
| Friday | 6 | 3 | 1 | medium |
| Saturday | 6 | 2 | 2 | high |
| Sunday | 6 | 3 | 2 | high |

**Score**

- Score = fuel used. Lower is better.
- 3 stars: equal to the optimum. 2 stars: up to 15% above it. 1 star: any finished run.
- Only the **first** finished run counts for stats, streak and sharing. After that the player can replay for fun, and can tap **Show best route** to watch the optimal route animate.

**Share text** (copied to the clipboard, or the phone's share sheet):

```
Route Rush #42 ⭐⭐⭐
Fuel 18 / best 18
🚚📦📦⚡📦🏠📦
🔥 Streak 12
```

The emoji line shows the order of deliveries (📦 parcel, ⚡ express, 🏠 back to the depot), never the route itself, so it doesn't spoil the puzzle.

## Retention features

Players come back for the streak, the new puzzle, and the next unlock. Every feature below works offline and saves on the device.

| Feature | How it works |
| --- | --- |
| Daily streak | +1 for each day the daily puzzle is finished. Missing a day resets it to 0. |
| Streak freeze | Earned once per 7-day streak (max 2 saved). It automatically protects the streak for one missed day. |
| Countdown | The home and results screens show the time left until the next puzzle. |
| Stats | Played, win rate, current and best streak, number of 3-star days, and a star distribution bar chart. |
| Practice mode | Unlocks after the first daily puzzle. Unlimited random puzzles at a chosen difficulty. Doesn't affect the streak. |
| Garage (van skins) | Unlocks at streak 3, 7, 14 and 30, and at 10 and 25 three-star days. Examples: red classic, electric van, cargo bike, ice-cream truck, rocket van. |
| Achievements | About 10 badges, e.g. "Perfect week" (7 three-star days in a row), "Express expert" (no late express parcels in 10 Sunday puzzles), "Night owl" (solved after 23:00). |
| Archive | Puzzles from the last 7 days can be replayed. They give stars but no streak. |

No push notifications, ads or sign-in in version 1.

## Screens and flow

The main loop is Home → Daily puzzle → Results → Share. Every other screen is one tap from Home, and the first visit opens How to play automatically.

```
Home ──► Daily puzzle ──► Results ──► Share score
 ▲                           │
 └──── back home: countdown ─┘
 │
 ├──► How to play
 ├──► Stats
 ├──► Practice
 ├──► Garage
 └──► Settings
```

| Screen | What's on it |
| --- | --- |
| Home | Puzzle number and weekday difficulty, big **Play** button (or **Done ⭐⭐⭐** once finished), streak flame, countdown, buttons to the other screens. |
| How to play | 3 short animated cards: move the van, deliver and reload, beat the target. A "Try it" mini puzzle at the end. |
| Daily puzzle | The grid, a top bar (fuel used / target, parcels in the van, parcels left), express deadlines, Undo and Restart. |
| Results | Stars, fuel against the best score, new unlocks, Share, Show best route, countdown, link to Stats. |
| Stats | The numbers and star chart from Retention features. |
| Practice | Choose Easy / Medium / Hard, play random puzzles, "New puzzle" button. |
| Garage | Van skins: unlocked ones can be chosen, locked ones show how to earn them. Achievements below. |
| Settings | Language FR/EN, sound, high contrast, reset progress (with a confirmation step). |

## Visual style, sound and languages

A bright, flat, top-down city inspired by Singapore, made with SVG and CSS, so no image files are needed.

- **Look:** chunky rounded tiles with soft colours. Buildings drawn as HDB blocks and shophouses, plus a river with bridges and green parks. Dark mode follows the device setting.
- **Colours:** roads warm grey, parks green, water teal, traffic tiles orange with small cars, express houses yellow with a lightning icon. The van's colour comes from the chosen skin.
- **Motion:** the van glides between tiles (about 150 ms), parcels pop when delivered, the fuel counter ticks, and confetti falls on 3 stars. Animations follow the device's reduced-motion setting.
- **Sound:** soft engine hum while moving, a delivery "ding", a short fanfare on 3 stars. Made with the Web Audio API, no sound files. Off by default, with a toggle.
- **Accessibility:** large tap targets (at least 44 px), every move possible by keyboard, express and traffic marked by icons as well as colour, a high-contrast option.
- **Languages:** all text in `fr.json` and `en.json`. The first visit picks the browser language (French if it starts with "fr", otherwise English), and a FR/EN switch is always in the header. The share text follows the chosen language.

## Technical requirements

Plain HTML, CSS and JavaScript (ES modules) with no build step and no backend, so the folder can be pushed straight to GitHub Pages.

- **Stack:** no framework and no npm dependencies for the app itself. The grid is drawn as an inline SVG.
- **Saving:** `localStorage` under one key, `routeRush.v1`, holding settings, today's progress (so a reload resumes the run), history by puzzle number, streak, freezes, unlocks and achievements. Wrap reads and writes in try/catch, and start fresh if the data is missing or broken.
- **Determinism:** a seeded random generator (e.g. mulberry32). The same puzzle number must always produce the same puzzle in every browser.
- **Performance:** the solver must finish in under 200 ms on a phone for the hardest Sunday puzzle.
- **Offline:** a small service worker caches the app after the first visit.
- **Code style:** game rules, generator and solver are pure functions with no access to the page, so they can be tested on their own. Comments in English.

**Suggested files**

```
index.html
manifest.json
sw.js
css/style.css
js/main.js         – starts the app, routing between screens
js/rng.js          – seeded random generator
js/game.js         – rules: moves, fuel, deliveries, win/fail
js/generator.js    – builds the daily puzzle from a puzzle number
js/solver.js       – finds the minimum fuel and the best route
js/storage.js      – save and load progress
js/i18n.js         – loads fr.json / en.json
js/ui/*.js         – one file per screen
lang/fr.json
lang/en.json
tests/*.test.js    – run with `node --test`
```

**Tests that must pass**

- The same puzzle number always gives the identical puzzle.
- Puzzles #1 to #365 are all solvable, follow their weekday's difficulty, and are not solved by the nearest-house-first route.
- The solver gives the true minimum on 5 small hand-made puzzles with known answers.
- Game rules: blocked tiles, traffic cost, reloading, a late express parcel fails the run, and undo restores the exact previous state.
- Streak logic: a missed day, a used freeze, and a change of month or year.

## Build phases and checklist

Build in six phases and play-test after each one, so problems show up early.

1. **Playable core:** grid, van, moves, fuel, deliveries, reloading, undo and restart, on one hand-made puzzle.
2. **Daily puzzles:** seeded generator, solver, weekday difficulty, express parcels, and the tests above.
3. **Results:** stars, comparison with the best score, Show best route, share text, countdown.
4. **Coming back:** streak, freezes, stats, practice mode, archive.
5. **Polish:** animations, sound, garage, achievements, FR/EN, dark mode, accessibility.
6. **Launch:** service worker, manifest, deploy to GitHub Pages, link from the portfolio.

**Acceptance checklist**

- [ ] A first-time player understands the game from How to play in under 1 minute
- [ ] Today's puzzle is identical on my phone and my laptop
- [ ] A 3-star score is always reachable, and Show best route proves it
- [ ] Reloading mid-run resumes exactly where I was
- [ ] Streak, freezes and stats are right after skipping a day
- [ ] The share text pastes cleanly into WhatsApp and Instagram
- [ ] Everything works in French and in English
- [ ] Plays smoothly on a phone in portrait, and works offline
- [ ] `node --test` passes

**Open questions**

- Launch date (this sets puzzle #1)
- Keep the name "Route Rush", or choose another?
- Is Sunday hard enough, or too hard? Decide after testing a week of puzzles.

## Version 2: Career and Rush Hour

Two new modes give players something to do after the daily puzzle: Career mode for long-term progress, Rush Hour for quick replayable fun. The daily puzzle, streak and sharing stay exactly as they are.

### Career mode

60 levels across 6 Singapore districts. Each district adds one new mechanic, so the game keeps feeling new and teaches its rules step by step.

| # | District | New mechanic | Grid |
| --- | --- | --- | --- |
| 1 | Tiong Bahru | Basics: roads, blocks, depot, reloading | 5 × 5 |
| 2 | Chinatown | Traffic jams | 6 × 6 |
| 3 | Clarke Quay | Express parcels and bridges | 6 × 6 |
| 4 | Little India | Pickups | 7 × 7 |
| 5 | Marina Bay | One-way streets | 7 × 7 |
| 6 | Jurong | Roadworks | 8 × 8 |

- 10 levels per district. Level 1 introduces the new mechanic with a short hint. Level 10 is a "boss" level mixing every mechanic seen so far.
- Levels are built by the generator with a fixed seed per level and checked by the solver, so they are the same for every player.
- Stars work as in the daily puzzle. Finishing a level unlocks the next one. Earning 20 of the 30 stars in a district unlocks the next district, so players sometimes replay levels for 3 stars.
- Completing a district unlocks a van skin.
- A **map screen** shows the districts on a simple Singapore-style map, with stars per level.
- Career levels don't affect the daily streak.

**New mechanics**

| Mechanic | Rule |
| --- | --- |
| Pickup | A hawker stall with a coloured food icon, and a customer house with the same colour. The van must visit the stall first (the food takes one space in the van), then the customer. No depot visit needed. |
| One-way street | A road tile with an arrow. The van can only drive onto it moving in the arrow's direction. |
| Roadworks | A road tile with a cone and a number, e.g. "8". Once fuel used reaches 8, it becomes blocked. |

The solver must handle all three, so 3 stars stays always reachable.

### Rush Hour mode

A 3-minute race to solve as many small puzzles as possible. Available from the start.

- Puzzles are 5 × 5, with 2–3 parcels and no express. Each new one appears straight after the last.
- Each solved puzzle = +1 point, plus bonus time: **+10 s** for the best possible fuel, **+5 s** for 1 fuel above it.
- **Skip** costs 15 seconds.
- The run ends when the timer reaches 0. Score = puzzles solved. The best score is saved and shown on Home.
- Share text: "Route Rush – Rush Hour: 14 deliveries 🚚⏱️".
- New achievements: "Rush 10" and "Rush 20" (puzzles in one run).
- The next puzzle is generated in the background, so there is never a wait.

### Changes to the existing app

- **Home** shows three mode cards: Daily (streak and countdown, at the top), Career (levels done out of 60 and total stars), Rush Hour (best score).
- **Practice mode** is removed, because Career and Rush Hour replace it.
- **Stats** add career stars and the Rush Hour best score.
- **Saving:** career progress and the Rush Hour best are added to `routeRush.v1`. Existing saved progress must keep working.

### Extra tests

- All 60 career levels are solvable, use their district's mechanic, and are identical on every load.
- Rules for pickups, one-way streets and roadworks, including the solver on small hand-made puzzles.
- Rush Hour timing: bonus seconds, skip penalty, game over at 0.
- Old saved data from version 1 loads without losing the streak.

### Prompt for Claude Code (version 2)

Use this once the first version is built:

```
Read the "Version 2: Career and Rush Hour" section of SPEC.md and add it to the existing app.
Keep the daily puzzle, streaks and saved progress working exactly as before.
Build Career mode first, then Rush Hour. Test as you go: run node --test and fix anything
failing before moving on, and add the extra tests from the spec.
When everything is done:
- tell me how to try the new modes,
- list any choices you made where the spec was unclear,
- point out anything you couldn't verify yourself.
```

## Prompt for Claude Code

Paste this prompt into Claude Code, opened in this folder:

```
Read SPEC.md and build the complete app in one go, following the build phases in order.
Test as you go: after each phase, run node --test and fix anything failing before moving on.
When everything is done:
- tell me how to open the app locally to play it,
- list any choices you made where the spec was unclear,
- point out anything from the acceptance checklist you couldn't verify yourself.
Follow the technical requirements exactly: plain HTML/CSS/JS modules, no build step,
no npm dependencies for the app, deployable to GitHub Pages.
```
