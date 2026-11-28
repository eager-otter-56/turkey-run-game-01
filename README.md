[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/eager-otter-56/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/eager-otter-56/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

# Gobble Run! — Escape the Feast

An original, fully offline turkey escape game built for the make.fun bounty
**turkey-run-game-01**
(https://make.fun/bounty/turkey-run-game-01).

**Now a 3D lane runner!** The camera rides behind Tom, Minion-Rush style:
three lanes run away to the horizon, hazards and corn trails come at you in
their lanes, and Farmer Hank looms in the frame behind you, bigger whenever
his gap shrinks. Rendered with three.js (vendored under `game/vendor/`): a
low-poly turkey whose banded tail fan fills the view from behind, a sunset
farmyard and a tiled kitchen corridor, all modelled from primitives in
code — no model files. The HUD and screens are drawn on a stacked 2D
overlay canvas so the text stays crisp.

Thanksgiving is at 6 and dinner is YOU. You are Tom the turkey, sprinting
1,000 m from Farmer Hank's farmyard to the Wildwood fence. Hank chases you
the whole way — stumble and he lunges closer; let him grab you three times
and it's roast turkey. Past 600 m the run cuts through the farmhouse
kitchen: glowing ovens, swinging carving knives and a menu board with your
name on it.

## How it plays

- **Switch lanes** to dodge — or to chase the corn trails, which run
  down a single lane (half arc high for jumpers, half run low).
- **Jump** hay bales, fences, stools and the oven — press jump again in
  mid-air to **flap** over the wide ones. Watch for **the wall**: two
  lanes blocked at once, one left open.
- **Duck** under the swinging carving knives.
- **Sprint** (Shift) on a stamina meter to open up the gap.
- **Corn** is worth 25 points and shoves Hank back a step; **golden corn**
  pays +100 and shoves him hard. A **lucky feather** pickup grants a shield
  that eats one hit for you.
- **Haystacks** hide you: while you're inside one, Hank loses your scent
  and the gap reopens fast.
- Reach **1,000 m** to leap the fence and escape: +500, plus +100 for
  every life you kept.

## Controls

- **← → / A D** — switch lanes · **Space / ↑ / W** — jump, again in mid-air to flap
- **↓ / S** — duck · **Shift** — sprint · **P** pause · **M** mute
- **Click / tap** — start and restart (tap the left/right third to switch lanes) · **R** — run again

## Layout

- `main.ts` — the hand-in program (Node 22, standard library only): copies
  `game/` and `screenshots/` to the output directory and writes
  `dossier.json` with `vendor/makefun-game.ts`.
- `game/` — the playable game, plain static files, no build step and no
  network requests. Serve it with `node serve.ts` and open
  http://localhost:8080, or any static file server.
  - `game/src/config.js` — every tuning number in one place
  - `game/src/world.js` — the simulation: 3-lane runner — turkey, farmer AI, hazards, corn, scoring
  - `game/src/render3d.js` — the three.js view: behind-the-turkey runner camera, low-poly turkey, farmer, farmyard and kitchen corridor modelled from primitives
  - `game/src/overlay.js` — the 2D overlay canvas: HUD, score floaters, title and end screens
  - `game/vendor/three.min.js` — three.js r128 (MIT), vendored so the game never touches the network
  - `game/src/input.js` — keyboard and mouse, with an edge-press queue
  - `game/src/audio.js` — procedural WebAudio gobbles, flaps and thuds (no audio files)
  - `game/src/shots.js` — the posed `?shot=` scenes the screenshots were taken from
  - `game/src/main.js` — boot, game loop and screen states
- `screenshots/` — real renders of the game in headless Chrome
  (`?shot=title|chase|kitchen|escaped`), never edited or composited.
