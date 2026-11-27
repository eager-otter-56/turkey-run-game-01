// Gobble Run! 3D — boot, game loop and screen states.
// The simulation (world.js) is the same one the 2D edition ran;
// render3d.js paints it with three.js and overlay.js draws the HUD
// and screens on a stacked 2D canvas. States: title → run →
// caught / escaped (→ restart). Pause with P, mute with M.
// A ?shot= pose renders one frozen scene for screenshots.

import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { drawEndOverlay, drawFloatersOverlay, drawHudOverlay, drawTitleOverlay } from './overlay.js';
import { createView3D } from './render3d.js';
import { posedRun } from './shots.js';
import { createRun, startRun, stepRun } from './world.js';

const canvas = document.getElementById('game-canvas');
const overlay = document.getElementById('hud-canvas');
const octx = overlay.getContext('2d');
if (!window.THREE || !octx) {
  document.getElementById('fallback').hidden = false;
  throw new Error('WebGL or overlay canvas unavailable');
}
const view = createView3D(canvas);

const audio = createAudio();
const input = createInput(canvas);
const shotName = new URLSearchParams(location.search).get('shot');
const pose = shotName ? posedRun(shotName) : null;

let run = createRun();
let scroll = 0;
let paused = false;

function paint() {
  view.draw(run, scroll);
  octx.clearRect(0, 0, overlay.width, overlay.height);
  if (run.phase === 'title') drawTitleOverlay(octx);
  else if (run.phase === 'caught' || run.phase === 'escaped') drawEndOverlay(octx, run);
  else {
    drawHudOverlay(octx, run);
    drawFloatersOverlay(octx, run);
  }
}

if (pose) {
  run = pose.run;
  scroll = pose.scroll;
  paint();
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
      scroll += 30 * dt;
      if (pressed.includes('jump') || pressed.includes('confirm') || click) {
        audio.unlock();
        startRun(run);
      }
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
    } else { // caught or escaped
      run.time += dt;
      if (pressed.includes('restart') || pressed.includes('confirm') || click) {
        scroll = 0;
        startRun(run);
      }
    }
    paint();
    if (paused) {
      octx.fillStyle = 'rgba(43,26,18,0.55)';
      octx.fillRect(0, 0, overlay.width, overlay.height);
      octx.fillStyle = '#fff8e7';
      octx.font = 'bold 54px Georgia, serif';
      octx.textAlign = 'center';
      octx.fillText('PAUSED — P to resume', overlay.width / 2, overlay.height / 2);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
