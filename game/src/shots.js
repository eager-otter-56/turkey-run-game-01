// Gobble Run! — posed scenes for the maker's screenshots.
// Opening the game with ?shot=title|chase|kitchen|escaped freezes a
// hand-arranged moment of real gameplay state, so the screenshots are
// honest renders of the game's own code (never edited or composited).
// Lanes: -1 left, 0 centre, 1 right — the runner camera sits behind
// the turkey, so "ahead" in a pose is a larger x in the simulation.

import { GROUND_Y } from './config.js';
import { createRun } from './world.js';

export function posedRun(name) {
  const run = createRun();
  run.time = 2.4;
  if (name === 'title') {
    run.phase = 'title';
    return { run, scroll: 640 };
  }
  if (name === 'chase') {
    run.phase = 'run';
    run.metres = 238;
    run.score = 238 + 6 * 25;
    run.cornEaten = 6;
    run.stamina = 72;
    run.farmer.gap = 148; // Hank right on his tail, looming behind
    run.sprinting = true; // wider FOV sells the pace
    run.turkey.y = GROUND_Y - 128; // mid-leap over the hay bale
    run.turkey.jumpsUsed = 1;
    run.feathers = [
      { x: 1080, lane: 1, y: GROUND_Y - 46, taken: false, bob: 2 },
    ];
    run.obstacles = [
      { kind: 'haybale', x: 520, lane: 0, passed: false },
      { kind: 'knife', x: 950, lane: -1, swing: 1.2, passed: false },
      { kind: 'fence', x: 1250, lane: 1, passed: false },
    ];
    run.corns = [
      { x: 720, lane: 1, y: GROUND_Y - 215, taken: false, bob: 1 },
      { x: 800, lane: 1, y: GROUND_Y - 235, taken: false, bob: 2, golden: true },
      { x: 880, lane: 1, y: GROUND_Y - 215, taken: false, bob: 3 },
    ];
    run.floaters = [
      { x: 680, y: 250, life: 0.9, label: 'DODGED +5', colour: '#b6ff7a' },
    ];
    return { run, scroll: 238 * 46 };
  }
  if (name === 'kitchen') {
    run.phase = 'run';
    run.metres = 742;
    run.score = 742 + 11 * 25;
    run.cornEaten = 11;
    run.lives = 2;
    run.stamina = 54;
    run.shield = true; // the lucky feather is riding with him (ring + HUD pill)
    run.farmer.gap = 236;
    run.turkey.lane = 1;
    run.turkey.laneTarget = 1;
    run.turkey.y = GROUND_Y;
    run.turkey.ducking = true; // ducking under the swinging knife in his lane
    run.obstacles = [
      { kind: 'knife', x: 500, lane: 1, swing: 0.4, passed: false },
      { kind: 'oven', x: 920, lane: -1, flame: 2.1, passed: false },
      { kind: 'stool', x: 1200, lane: 0, passed: false },
    ];
    run.corns = [
      { x: 1010, lane: 1, y: GROUND_Y - 120, taken: false, bob: 0.5 },
      { x: 1084, lane: 1, y: GROUND_Y - 120, taken: false, bob: 1.5 },
    ];
    run.banner = 'SINGED! Too close to the oven!';
    run.bannerFor = 1.2;
    return { run, scroll: 742 * 46 };
  }
  if (name === 'escaped') {
    run.phase = 'escaped';
    run.metres = 1000;
    run.score = 1000 + 14 * 25 + 500 + 200;
    run.cornEaten = 14;
    run.lives = 2;
    return { run, scroll: 4200 };
  }
  if (name === 'caught') {
    run.phase = 'caught';
    run.metres = 512;
    run.score = 512 + 8 * 25;
    run.cornEaten = 8;
    run.lives = 0;
    return { run, scroll: 2900 };
  }
  return null;
}
