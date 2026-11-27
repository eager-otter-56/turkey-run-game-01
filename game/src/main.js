// Gobble Run! — boot, game loop and screen states.
// States: title → run → caught / escaped (→ restart). Pause with P,
// mute with M. A ?shot= pose renders one frozen scene for screenshots.

import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { drawEndScreen, drawScene, drawTitleScreen } from './render.js';
import { posedRun } from './shots.js';
import { createRun, startRun, stepRun } from './world.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
if (!ctx) {
  document.getElementById('fallback').hidden = false;
  throw new Error('canvas unavailable');
}

const audio = createAudio();
const input = createInput(canvas);
const shotName = new URLSearchParams(location.search).get('shot');
const pose = shotName ? posedRun(shotName) : null;

let run = createRun();
let scroll = 0;
let paused = false;

if (pose) {
  run = pose.run;
  scroll = pose.scroll;
  if (run.phase === 'title') drawTitleScreen(ctx, run, true);
  else if (run.phase === 'caught' || run.phase === 'escaped') drawEndScreen(ctx, run);
  else drawScene(ctx, run, scroll);
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    const pressed = input.takePressed();
    const click = input.takeClick();
    if (pressed.includes('mute')) audio.toggleMute();
    if (pressed.includes('pause') && run.phase === 'run') paused = !paused;

    if (run.phase === 'title') {
      run.time += dt;
      if (pressed.includes('jump') || pressed.includes('confirm') || click) {
        audio.unlock();
        startRun(run);
      }
      drawTitleScreen(ctx, run, false);
    } else if (run.phase === 'run') {
      if (!paused) {
        const eventsBefore = run.events.length;
        stepRun(run, { held: input.held, pressed }, dt);
        scroll += run.speed * dt;
        for (let i = eventsBefore; i < run.events.length; i++) {
          const e = run.events[i];
          if (e === 'gobble') audio.gobble();
          else if (e === 'flap') audio.flap();
          else if (e === 'corn') audio.cornPop();
          else if (e === 'stumble') audio.stumble();
          else if (e === 'shout') audio.farmerShout();
          else if (e === 'caught') audio.caught();
          else if (e === 'escaped') audio.escaped();
        }
        run.events.length = 0;
      }
      ctx.save();
      if (run.shake > 0) {
        ctx.translate((Math.random() - 0.5) * run.shake * 12, (Math.random() - 0.5) * run.shake * 9);
      }
      drawScene(ctx, run, scroll);
      ctx.restore();
      if (paused) {
        ctx.fillStyle = 'rgba(43,26,18,0.55)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff8e7';
        ctx.font = "bold 54px Georgia, serif";
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED — P to resume', canvas.width / 2, canvas.height / 2);
      }
    } else { // caught or escaped
      run.time += dt;
      if (pressed.includes('restart') || pressed.includes('confirm') || click) {
        scroll = 0;
        startRun(run);
      }
      drawEndScreen(ctx, run);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
