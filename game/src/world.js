// Gobble Run! — the world: turkey, farmer, obstacles, corn and scoring.
// Pure simulation (no drawing here): main.js feeds it input and time,
// render.js paints whatever state it holds.

import {
  FARMER, GOAL_METRES, GROUND_Y, KITCHEN_START_METRES, PIXELS_PER_METRE,
  START_LIVES, TURKEY, WORLD, CORN_SCORE, METRE_SCORE,
} from './config.js';

let seed = 20261127;
export function rand() { // deterministic LCG so posed scenes are stable
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
export function reseed(value) { seed = value >>> 0; }

export function stageAt(metres) {
  return metres >= KITCHEN_START_METRES ? 'kitchen' : 'farmyard';
}

export function createRun() {
  return {
    phase: 'title', // title | run | caught | escaped | paused
    time: 0,
    metres: 0,
    score: 0,
    cornEaten: 0,
    lives: START_LIVES,
    invincibleFor: 0,
    shake: 0,
    banner: '',
    bannerFor: 0,
    turkey: {
      y: GROUND_Y, vy: 0, jumpsUsed: 0, ducking: false,
      runCycle: 0, squash: 0, hidden: false,
    },
    farmer: { gap: FARMER.startGap, grabFor: 0, shoutFor: 0 },
    stamina: WORLD.staminaMax,
    speed: WORLD.baseSpeed,
    obstacles: [],
    corns: [],
    particles: [],
    floaters: [], // little score popups: "+25", "DODGED +5", "GOLDEN! +100"
    dustIn: 0,
    sprinting: false,
    nextSpawnIn: 340,
    events: [], // sound cues for main.js: gobble, flap, corn, stumble...
  };
}

function spawnPattern(run) {
  const stage = stageAt(run.metres);
  const roll = rand();
  const baseX = 1420;
  const push = (kind, x, extra = {}) =>
    run.obstacles.push({ kind, x, passed: false, ...extra });
  if (stage === 'farmyard') {
    if (roll < 0.30) push('haybale', baseX);
    else if (roll < 0.52) push('fence', baseX);
    else if (roll < 0.70) { push('haybale', baseX); push('haybale', baseX + 265); }
    else if (roll < 0.86) push('knife', baseX, { swing: rand() * 6.28 });
    else push('haystack', baseX); // hide inside to shake the farmer
  } else {
    if (roll < 0.30) push('oven', baseX, { flame: rand() * 6.28 });
    else if (roll < 0.55) push('knife', baseX, { swing: rand() * 6.28 });
    else if (roll < 0.72) { push('stool', baseX); push('stool', baseX + 265); }
    else if (roll < 0.88) push('oven', baseX, { flame: rand() * 6.28 });
    else push('knife', baseX, { swing: rand() * 6.28 });
  }
  // Corn trails arc over the hazards — a reason to jump bravely.
  // About one trail in eight hides a golden corn: +100 and a big
  // shove that knocks Hank back down the lane.
  if (rand() < 0.72) {
    const n = 3 + Math.floor(rand() * 3);
    const goldenAt = rand() < 0.13 ? Math.floor(rand() * n) : -1;
    for (let i = 0; i < n; i++) {
      run.corns.push({
        x: baseX - 60 + i * 74,
        y: GROUND_Y - 120 - Math.sin((i / Math.max(1, n - 1)) * Math.PI) * 90,
        taken: false, bob: rand() * 6.28, golden: i === goldenAt,
      });
    }
  }
  const tightness = Math.min(1, run.metres / GOAL_METRES);
  run.nextSpawnIn = 720 + rand() * 430 - tightness * 180;
}

function turkeyBox(run) {
  const t = run.turkey;
  // Standing box reaches the top of his head; ducking folds him right down.
  const h = t.ducking ? TURKEY.duckHeight : 124;
  return { x: TURKEY.x - 44, y: t.y - h, w: 96, h };
}

function obstacleBox(ob) {
  switch (ob.kind) {
    case 'haybale': return { x: ob.x - 36, y: GROUND_Y - 68, w: 72, h: 68 };
    case 'fence': return { x: ob.x - 46, y: GROUND_Y - 84, w: 92, h: 84 };
    case 'haystack': return { x: ob.x - 58, y: GROUND_Y - 118, w: 116, h: 118 };
    case 'oven': return { x: ob.x - 56, y: GROUND_Y - 130, w: 112, h: 130 };
    case 'stool': return { x: ob.x - 32, y: GROUND_Y - 56, w: 64, h: 56 };
    case 'knife': return { x: ob.x - 16, y: GROUND_Y - 292, w: 32, h: 164 }; // blade sweeps down to GROUND_Y-128: standing hits, ducking clears
    default: return { x: ob.x, y: GROUND_Y, w: 1, h: 1 };
  }
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function startRun(run) {
  const fresh = createRun();
  Object.assign(run, fresh, { phase: 'run' });
  run.events.push('gobble');
}

export function stepRun(run, input, dt) {
  if (run.phase !== 'run') return;
  run.time += dt;
  const t = run.turkey;
  const f = run.farmer;

  // --- speed & distance -------------------------------------------------
  const sprinting = input.held.sprint && run.stamina > 1 && !input.held.left;
  const easing = input.held.left ? 0.82 : 1;
  run.stamina = Math.max(0, Math.min(WORLD.staminaMax,
    run.stamina + (sprinting ? -WORLD.staminaDrain : WORLD.staminaRegen) * dt));
  const targetSpeed = Math.min(WORLD.maxSpeed,
    WORLD.baseSpeed + run.metres * WORLD.speedGainPerMetre) * easing
    + (sprinting ? WORLD.sprintBoost : 0);
  run.speed += (targetSpeed - run.speed) * Math.min(1, dt * 3);
  const dx = run.speed * dt;
  run.metres += dx / PIXELS_PER_METRE;
  run.score += dx / PIXELS_PER_METRE * METRE_SCORE;

  // --- turkey body ------------------------------------------------------
  t.ducking = input.held.duck && t.y >= GROUND_Y;
  if (input.pressed.includes('jump')) {
    if (t.y >= GROUND_Y) {
      t.vy = TURKEY.jumpVelocity; t.jumpsUsed = 1; run.events.push('flap');
    } else if (t.jumpsUsed < 2) {
      t.vy = TURKEY.flapVelocity; t.jumpsUsed = 2; run.events.push('flap');
      burstFeathers(run, 5);
    }
  }
  t.vy += TURKEY.gravity * dt * (input.held.jump && t.vy < 0 ? 0.85 : 1);
  t.y += t.vy * dt;
  if (t.y >= GROUND_Y) {
    if (t.vy > 500) t.squash = 1;
    t.y = GROUND_Y; t.vy = 0; t.jumpsUsed = 0;
  }
  t.squash = Math.max(0, t.squash - dt * 6);
  t.runCycle += dt * (6 + run.speed / 60);
  run.invincibleFor = Math.max(0, run.invincibleFor - dt);
  run.shake = Math.max(0, run.shake - dt * 3);
  run.bannerFor = Math.max(0, run.bannerFor - dt);

  // --- scroll the world ---------------------------------------------------
  for (const ob of run.obstacles) ob.x -= dx;
  for (const c of run.corns) c.x -= dx;
  run.obstacles = run.obstacles.filter((ob) => ob.x > -220);
  run.corns = run.corns.filter((c) => c.x > -80 && !c.taken);
  run.nextSpawnIn -= dx;
  if (run.nextSpawnIn <= 0 && run.metres < GOAL_METRES - 30) spawnPattern(run);

  // --- hiding in a haystack ----------------------------------------------
  t.hidden = false;
  const box = turkeyBox(run);
  for (const ob of run.obstacles) {
    if (ob.kind === 'haystack' && overlaps(box, obstacleBox(ob))) t.hidden = true;
  }

  // --- corn ---------------------------------------------------------------
  for (const c of run.corns) {
    if (!c.taken && Math.abs(c.x - TURKEY.x) < 74 && Math.abs(c.y - (t.y - 52)) < 86) {
      c.taken = true;
      run.cornEaten += 1;
      if (c.golden) {
        run.score += 100;
        f.gap += 95;
        addFloater(run, 'GOLDEN CORN! +100', '#ffd94d');
        run.events.push('corn');
        burstFeathers(run, 9, '#ffd94d');
      } else {
        run.score += CORN_SCORE;
        f.gap += FARMER.cornPushBack;
        run.events.push('corn');
        burstFeathers(run, 3, '#ffd94d');
      }
    }
  }

  // --- clean dodges pay a little and say so --------------------------------
  for (const ob of run.obstacles) {
    if (ob.counted || ob.passed) continue;
    if (ob.x < TURKEY.x - 70) {
      ob.counted = true;
      if (ob.kind !== 'haystack') {
        run.score += 5;
        addFloater(run, 'DODGED +5', '#b6ff7a');
      }
    }
  }

  // --- dust at his heels -----------------------------------------------------
  run.sprinting = sprinting;
  run.dustIn -= dt;
  if (t.y >= GROUND_Y && run.dustIn <= 0) {
    run.dustIn = 0.09;
    run.particles.push({
      x: TURKEY.x - 44, y: GROUND_Y - 4, vx: -90 - rand() * 90,
      vy: -26 - rand() * 42, life: 0.34, colour: '#c9a06a',
    });
  }
  for (const fl of run.floaters) { fl.y -= 44 * dt; fl.life -= dt; }
  run.floaters = run.floaters.filter((fl) => fl.life > 0);

  // --- hazards --------------------------------------------------------------
  if (run.invincibleFor <= 0) {
    for (const ob of run.obstacles) {
      if (ob.kind === 'haystack' || ob.passed) continue;
      if (overlaps(box, obstacleBox(ob))) {
        ob.passed = true;
        run.lives -= 1;
        run.invincibleFor = 1.4;
        run.shake = 1;
        f.gap -= FARMER.stumbleClose;
        run.events.push('stumble');
        showBanner(run, ob.kind === 'knife' ? 'SLICED! Mind the carving knife!'
          : ob.kind === 'oven' ? 'SINGED! Too close to the oven!'
          : 'WHAM! You stumbled!');
        burstFeathers(run, 10);
        if (run.lives <= 0) return catchTurkey(run);
        break;
      }
    }
  }

  // --- the farmer -----------------------------------------------------------
  const chaseShare = FARMER.baseChase
    + (FARMER.lateChase - FARMER.baseChase) * Math.min(1, run.metres / GOAL_METRES);
  f.gap += (run.speed * (1 - chaseShare)) * dt * -1; // he eats the gap at his share
  f.gap += FARMER.recoverPerSecond * dt * (t.hidden ? 4.2 : 1); // hiding breaks his search
  if (sprinting) f.gap += 26 * dt;
  if (input.held.left) f.gap -= 30 * dt;
  f.gap = Math.max(0, Math.min(430, f.gap));
  f.shoutFor = Math.max(0, f.shoutFor - dt);
  if (f.gap < 130 && f.shoutFor <= 0) { f.shoutFor = 2.6; run.events.push('shout'); }
  if (f.gap <= FARMER.caughtGap) return catchTurkey(run);

  // --- particles --------------------------------------------------------------
  for (const p of run.particles) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.life -= dt;
  }
  run.particles = run.particles.filter((p) => p.life > 0);

  // --- the fence ----------------------------------------------------------------
  if (run.metres >= GOAL_METRES) {
    run.phase = 'escaped';
    run.score += 500 + run.lives * 100;
    run.events.push('escaped');
  }
}

function showBanner(run, text) {
  run.banner = text;
  run.bannerFor = 1.6;
}

function addFloater(run, label, colour) {
  run.floaters.push({ x: TURKEY.x + 26, y: run.turkey.y - 148, life: 0.95, label, colour });
}

function burstFeathers(run, count, colour = '#ffffff') {
  for (let i = 0; i < count; i++) {
    run.particles.push({
      x: TURKEY.x - 20 + rand() * 50, y: run.turkey.y - 60 + rand() * 40,
      vx: -120 - rand() * 180, vy: -80 - rand() * 160,
      life: 0.5 + rand() * 0.5, colour,
    });
  }
}

function catchTurkey(run) {
  run.phase = 'caught';
  run.events.push('caught');
}
