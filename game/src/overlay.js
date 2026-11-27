// Gobble Run! 3D — the 2D overlay: HUD, score floaters and the
// title / end screens, drawn on a transparent canvas stacked over
// the WebGL view so the text stays crisp while the world is 3D.

import { GOAL_METRES, KITCHEN_START_METRES, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { stageAt } from './world.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, colour, align = 'center', weight = 'bold') {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px Georgia, 'Times New Roman', serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

export function drawHudOverlay(ctx, run) {
  ctx.fillStyle = 'rgba(43, 26, 18, 0.78)';
  roundRect(ctx, 18, 16, VIEW_WIDTH - 36, 64, 12); ctx.fill();
  text(ctx, `SCORE ${Math.floor(run.score)}`, 44, 48, 27, '#ffd94d', 'left');
  text(ctx, `🌽 × ${run.cornEaten}`, 356, 48, 25, '#f7e8c9', 'left');
  if (run.shield) { // the lucky feather rides along until it eats a hit
    ctx.fillStyle = 'rgba(90, 150, 190, 0.85)';
    roundRect(ctx, 478, 30, 118, 36, 10); ctx.fill();
    text(ctx, '🪶 SHIELD', 537, 49, 19, '#eaf7ff');
  }
  for (let i = 0; i < 3; i++) {
    const x = 620 + i * 46;
    ctx.font = '30px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = i < run.lives ? 1 : 0.22;
    ctx.fillText('🦃', x, 49);
    ctx.globalAlpha = 1;
  }
  text(ctx, `${Math.min(GOAL_METRES, Math.floor(run.metres))} m / ${GOAL_METRES} m`, 1240, 40, 24, '#f7e8c9', 'right');
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, 856, 58, 384, 10, 5); ctx.fill();
  ctx.fillStyle = '#7ec850';
  roundRect(ctx, 856, 58, 384 * Math.min(1, run.metres / GOAL_METRES), 10, 5); ctx.fill();
  const stage = stageAt(run.metres);
  ctx.fillStyle = 'rgba(43,26,18,0.72)';
  roundRect(ctx, 18, 88, 252, 36, 10); ctx.fill();
  text(ctx, stage === 'kitchen' ? '🍳 THE KITCHEN!' : '🚜 FARMYARD', 36, 107, 21,
    stage === 'kitchen' ? '#ff9d5c' : '#ffe9b0', 'left');
  ctx.fillStyle = 'rgba(43,26,18,0.6)';
  roundRect(ctx, 856, 90, 384, 16, 8); ctx.fill();
  ctx.fillStyle = '#ffd94d';
  roundRect(ctx, 858, 92, 380 * (run.stamina / 100), 12, 6); ctx.fill();
  text(ctx, 'SPRINT', 1240, 124, 15, '#f7e8c9', 'right');
  const danger = 1 - Math.min(1, run.farmer.gap / 430);
  ctx.fillStyle = 'rgba(43,26,18,0.6)';
  roundRect(ctx, 18, VIEW_HEIGHT - 40, 300, 18, 9); ctx.fill();
  ctx.fillStyle = danger > 0.72 ? '#e63c2f' : danger > 0.45 ? '#f28c28' : '#7ec850';
  roundRect(ctx, 20, VIEW_HEIGHT - 38, 296 * danger, 14, 7); ctx.fill();
  text(ctx, 'FARMER →', 330, VIEW_HEIGHT - 31, 17, '#fff3d6', 'left');
  if (run.bannerFor > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, run.bannerFor);
    ctx.fillStyle = '#a93226';
    roundRect(ctx, VIEW_WIDTH / 2 - 330, 128, 660, 56, 14); ctx.fill();
    text(ctx, run.banner, VIEW_WIDTH / 2, 157, 27, '#fff8e7');
    ctx.restore();
  }
  if (run.metres > KITCHEN_START_METRES - 12 && run.metres < KITCHEN_START_METRES + 8) {
    text(ctx, '— THROUGH THE KITCHEN! —', VIEW_WIDTH / 2, 220, 40, '#ffd94d');
  }
}

export function drawFloatersOverlay(ctx, run) {
  for (const fl of run.floaters) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, fl.life * 1.8);
    ctx.font = 'bold 21px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(43,26,18,0.8)';
    ctx.strokeText(fl.label, fl.x, fl.y);
    ctx.fillStyle = fl.colour;
    ctx.fillText(fl.label, fl.x, fl.y);
    ctx.restore();
  }
}

export function drawTitleOverlay(ctx) {
  ctx.fillStyle = 'rgba(43, 26, 18, 0.45)';
  ctx.fillRect(0, 96, VIEW_WIDTH, 252);
  text(ctx, 'GOBBLE RUN!', VIEW_WIDTH / 2, 168, 96, '#ffd94d');
  text(ctx, '— ESCAPE THE FEAST —', VIEW_WIDTH / 2, 238, 34, '#fff8e7');
  text(ctx, 'Thanksgiving is at 6. Dinner is YOU. Run, turkey, run!', VIEW_WIDTH / 2, 292, 26, '#ffe9b0');
  ctx.fillStyle = '#a93226';
  roundRect(ctx, 660, 556, 470, 74, 16); ctx.fill();
  ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 4;
  roundRect(ctx, 660, 556, 470, 74, 16); ctx.stroke();
  text(ctx, '▶  CLICK or press SPACE to RUN!', 895, 594, 27, '#fff8e7');
  ctx.fillStyle = 'rgba(255, 248, 231, 0.82)';
  roundRect(ctx, 90, 652, 1100, 76, 12); ctx.fill();
  text(ctx, 'SPACE / ↑ jump (twice = flap!) · ↓ duck the knives · → sprint · reach the Wildwood fence at 1,000 m',
    VIEW_WIDTH / 2, 678, 21, '#3d2317');
  text(ctx, 'Dodge the oven & the knife · grab corn (golden = +100!) · a lucky feather eats one hit for you · dodges pay +5',
    VIEW_WIDTH / 2, 710, 21, '#3d2317');
}

export function drawEndOverlay(ctx, run) {
  const escaped = run.phase === 'escaped';
  ctx.fillStyle = escaped ? 'rgba(30, 60, 20, 0.22)' : 'rgba(60, 16, 10, 0.45)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  if (escaped) {
    text(ctx, '🦃 ESCAPED! 🦃', VIEW_WIDTH / 2, 190, 88, '#b6ff7a');
    text(ctx, 'Over the fence and into the Wildwood — no roast for Hank tonight!', VIEW_WIDTH / 2, 268, 28, '#fff8e7');
  } else {
    text(ctx, 'CAUGHT!', VIEW_WIDTH / 2 - 130, 190, 92, '#ff8a75');
    text(ctx, 'Farmer Hank got his dinner after all…', VIEW_WIDTH / 2 - 130, 266, 28, '#fff8e7');
  }
  text(ctx, `FINAL SCORE  ${Math.floor(run.score)}`, VIEW_WIDTH / 2, 330, 40, '#ffd94d');
  text(ctx, `Distance ${Math.min(GOAL_METRES, Math.floor(run.metres))} m · Corn 🌽 × ${run.cornEaten} · Lives left ${run.lives}`,
    VIEW_WIDTH / 2, 382, 25, '#f7e8c9');
  ctx.fillStyle = '#a93226';
  roundRect(ctx, VIEW_WIDTH / 2 - 200, 486, 400, 72, 16); ctx.fill();
  ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 4;
  roundRect(ctx, VIEW_WIDTH / 2 - 200, 486, 400, 72, 16); ctx.stroke();
  text(ctx, '↻  RUN AGAIN — click or press R', VIEW_WIDTH / 2, 523, 26, '#fff8e7');
  text(ctx, escaped
    ? 'Tip: a perfect run banks +100 per life left. Can you keep all three?'
    : 'Tip: duck the knives, jump the oven, and hide in haystacks to shake him off.',
    VIEW_WIDTH / 2, 610, 21, '#ffe9b0');
}
