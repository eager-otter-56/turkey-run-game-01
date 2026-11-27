// Gobble Run! — all drawing. Canvas 2D, autumn palette, everything
// painted from code (no image files): the turkey with his tail fan and
// wattle, Farmer Hank in overalls, the farmyard at sunset and the
// farmhouse kitchen the run cuts through.

import {
  AUTUMN, GOAL_METRES, GROUND_Y, KITCHEN_START_METRES, TURKEY, VIEW_HEIGHT, VIEW_WIDTH,
} from './config.js';
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

// ---------------------------------------------------------------- sky & land
export function drawFarmyard(ctx, scroll, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, '#ffcf6e');
  sky.addColorStop(0.55, AUTUMN.skyTop);
  sky.addColorStop(1, '#ff8a5c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_WIDTH, GROUND_Y);
  // low sun
  ctx.fillStyle = '#fff3b0';
  ctx.beginPath(); ctx.arc(1085, 168, 62, 0, 6.29); ctx.fill();
  ctx.fillStyle = 'rgba(255, 214, 120, 0.5)';
  ctx.beginPath(); ctx.arc(1085, 168, 92, 0, 6.29); ctx.fill();
  // clouds drifting slow
  ctx.fillStyle = 'rgba(255, 240, 214, 0.85)';
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 390 - scroll * 0.12 + time * 4) % 1500) - 120;
    const cy = 84 + (i % 2) * 62;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 74, 20, 0, 0, 6.29);
    ctx.ellipse(cx + 44, cy + 6, 52, 15, 0, 0, 6.29);
    ctx.fill();
  }
  // rolling hills
  ctx.fillStyle = '#d98e4a';
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= VIEW_WIDTH; x += 40) {
    ctx.lineTo(x, GROUND_Y - 120 - Math.sin((x + scroll * 0.25) * 0.004) * 46);
  }
  ctx.lineTo(VIEW_WIDTH, GROUND_Y); ctx.closePath(); ctx.fill();
  // the big red barn, parallax
  const barnX = 760 - (scroll * 0.3 % 1700);
  drawBarn(ctx, barnX, GROUND_Y - 118);
  drawBarn(ctx, barnX + 1700, GROUND_Y - 118);
  // fence line
  ctx.strokeStyle = '#7c4a21';
  ctx.lineWidth = 7;
  const fenceOff = -(scroll * 0.6 % 92);
  for (let x = fenceOff; x < VIEW_WIDTH + 92; x += 92) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y - 64); ctx.lineTo(x, GROUND_Y - 8);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y - 52); ctx.lineTo(VIEW_WIDTH, GROUND_Y - 52);
  ctx.moveTo(0, GROUND_Y - 24); ctx.lineTo(VIEW_WIDTH, GROUND_Y - 24);
  ctx.stroke();
  drawGround(ctx, scroll, '#a06a35', '#7e5226');
  // pumpkin patch in the foreground dirt
  const pkOff = -(scroll % 460);
  for (let x = pkOff; x < VIEW_WIDTH + 200; x += 460) drawPumpkin(ctx, x + 180, GROUND_Y + 96, 26);
}

export function drawKitchen(ctx, scroll, time) {
  ctx.fillStyle = AUTUMN.kitchenWall;
  ctx.fillRect(0, 0, VIEW_WIDTH, GROUND_Y);
  // tiles
  ctx.strokeStyle = 'rgba(255, 220, 190, 0.16)';
  ctx.lineWidth = 2;
  const tileOff = -(scroll * 0.85 % 84);
  for (let x = tileOff; x < VIEW_WIDTH; x += 84) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GROUND_Y); ctx.stroke();
  }
  for (let y = 42; y < GROUND_Y; y += 84) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEW_WIDTH, y); ctx.stroke();
  }
  // window with the sunset the turkey is running toward
  ctx.fillStyle = '#ffd98a';
  roundRect(ctx, 950, 74, 210, 190, 10); ctx.fill();
  ctx.strokeStyle = '#4a2417'; ctx.lineWidth = 10;
  roundRect(ctx, 950, 74, 210, 190, 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1055, 74); ctx.lineTo(1055, 264); ctx.stroke();
  // hanging pans & a "THANKSGIVING MENU" board — what he is escaping
  const panOff = -(scroll * 0.85 % 520);
  for (let x = panOff; x < VIEW_WIDTH + 300; x += 520) drawPan(ctx, x + 140, 104);
  ctx.fillStyle = '#3d2317';
  roundRect(ctx, 52, 282, 292, 118, 8); ctx.fill();
  ctx.strokeStyle = '#c98d4b'; ctx.lineWidth = 4;
  roundRect(ctx, 52, 282, 292, 118, 8); ctx.stroke();
  text(ctx, "TONIGHT'S MENU", 198, 312, 24, '#ffd94d');
  text(ctx, 'ROAST TURKEY — 6 PM', 198, 344, 20, '#f7e8c9');
  text(ctx, '(he has other plans)', 198, 374, 16, '#e8a87c', 'center', 'italic bold');
  drawGround(ctx, scroll, '#8a5a34', '#6b4223');
  // chequered floor edge
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let x = -(scroll % 64); x < VIEW_WIDTH; x += 128) ctx.fillRect(x, GROUND_Y + 66, 64, 12);
}

function drawGround(ctx, scroll, top, bottom) {
  const g = ctx.createLinearGradient(0, GROUND_Y, 0, VIEW_HEIGHT);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, GROUND_Y, VIEW_WIDTH, VIEW_HEIGHT - GROUND_Y);
  ctx.fillStyle = 'rgba(255, 230, 170, 0.35)';
  ctx.fillRect(0, GROUND_Y, VIEW_WIDTH, 5);
  ctx.strokeStyle = 'rgba(60, 36, 12, 0.35)';
  ctx.lineWidth = 3;
  const dashOff = -(scroll % 56);
  for (let x = dashOff; x < VIEW_WIDTH; x += 56) {
    ctx.beginPath(); ctx.moveTo(x, GROUND_Y + 42); ctx.lineTo(x + 26, GROUND_Y + 42); ctx.stroke();
  }
}

function drawBarn(ctx, x, baseY) {
  ctx.fillStyle = '#a93226';
  ctx.fillRect(x, baseY - 130, 190, 130);
  ctx.fillStyle = '#7e2118';
  ctx.beginPath();
  ctx.moveTo(x - 14, baseY - 130); ctx.lineTo(x + 95, baseY - 196); ctx.lineTo(x + 204, baseY - 130);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f7e8c9';
  ctx.fillRect(x + 66, baseY - 92, 58, 92);
  ctx.strokeStyle = '#7e2118'; ctx.lineWidth = 5;
  ctx.strokeRect(x + 66, baseY - 92, 58, 92);
  ctx.beginPath();
  ctx.moveTo(x + 66, baseY - 92); ctx.lineTo(x + 124, baseY); ctx.moveTo(x + 124, baseY - 92); ctx.lineTo(x + 66, baseY);
  ctx.stroke();
  // cream sign on the barn wall, readable at a glance
  ctx.fillStyle = '#f7e8c9';
  roundRect(ctx, x + 18, baseY - 122, 154, 24, 5); ctx.fill();
  text(ctx, 'TURKEY COOP', x + 95, baseY - 109, 16, '#7e2118');
}

function drawPumpkin(ctx, x, y, r) {
  ctx.fillStyle = '#e07b2a';
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.78, 0, 0, 6.29); ctx.fill();
  ctx.strokeStyle = 'rgba(140, 70, 10, 0.6)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(x, y, r * 0.55, r * 0.74, 0, 0, 6.29); ctx.stroke();
  ctx.fillStyle = '#4d7c0f';
  ctx.fillRect(x - 4, y - r * 0.95, 8, 12);
}

function drawPan(ctx, x, y) {
  ctx.strokeStyle = '#2f2a26'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 34); ctx.stroke();
  ctx.fillStyle = '#4a4238';
  ctx.beginPath(); ctx.ellipse(x, y + 62, 34, 28, 0, 0, 6.29); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath(); ctx.ellipse(x - 10, y + 52, 12, 8, -0.5, 0, 6.29); ctx.fill();
}

// ------------------------------------------------------------------- actors
export function drawTurkey(ctx, run) {
  const t = run.turkey;
  const x = TURKEY.x;
  const blink = run.invincibleFor > 0 && Math.floor(run.time * 14) % 2 === 0;
  ctx.save();
  ctx.translate(x, t.y);
  const duckFactor = t.ducking ? 0.6 : 1; // ducking folds him visibly flat
  const squashY = (1 - t.squash * 0.16) * duckFactor;
  const squashX = (1 + t.squash * 0.13) * (t.ducking ? 1.14 : 1);
  ctx.scale(squashX, squashY);
  if (blink) ctx.globalAlpha = 0.35;
  const airborne = t.y < GROUND_Y - 2;
  const legSwing = airborne ? 0.7 : Math.sin(t.runCycle * 2.4) * 0.85;
  // legs — orange, running hard (tucked away while ducking)
  ctx.strokeStyle = '#e07b2a'; ctx.lineWidth = 8; ctx.lineCap = 'round';
  if (!t.ducking) {
    for (const side of [1, -1]) {
      const swing = legSwing * side;
      ctx.beginPath();
      ctx.moveTo(-6 * side, -34);
      ctx.lineTo(-6 * side + Math.sin(swing) * 26, -16);
      ctx.lineTo(-6 * side + Math.sin(swing) * 30 + 8, -2);
      ctx.stroke();
    }
  }
  // tail fan — the unmistakable turkey silhouette, behind the body
  const fanTilt = -0.5 + Math.sin(t.runCycle) * 0.05;
  ctx.save();
  ctx.translate(-38, -62); ctx.rotate(fanTilt);
  for (let i = 0; i < 7; i++) {
    const a = -1.15 + i * 0.34;
    const len = 62 - Math.abs(i - 3) * 5;
    ctx.save(); ctx.rotate(a);
    ctx.fillStyle = i % 2 ? '#8a5a2b' : '#6e4520';
    roundRect(ctx, -9, -len, 18, len, 8); ctx.fill();
    ctx.fillStyle = '#2e1c0d';
    roundRect(ctx, -9, -len, 18, 13, 6); ctx.fill();
    ctx.fillStyle = '#e8c07a';
    roundRect(ctx, -9, -len + 13, 18, 7, 3); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  // body
  const bodyGrad = ctx.createLinearGradient(0, -100, 0, -20);
  bodyGrad.addColorStop(0, '#9c6b30');
  bodyGrad.addColorStop(1, '#6e4520');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath(); ctx.ellipse(0, -58, 52, 38, -0.12, 0, 6.29); ctx.fill();
  // wing — flaps on the double jump
  const wingA = t.jumpsUsed === 2 && t.y < GROUND_Y - 4
    ? Math.sin(run.time * 34) * 0.7 - 0.4 : 0.25 + Math.sin(t.runCycle * 2.4) * 0.08;
  ctx.save();
  ctx.translate(-4, -66); ctx.rotate(wingA);
  ctx.fillStyle = '#7c5226';
  ctx.beginPath(); ctx.ellipse(6, 6, 34, 17, 0.5, 0, 6.29); ctx.fill();
  ctx.strokeStyle = '#5d3c1a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-16, 14); ctx.lineTo(26, -4); ctx.stroke();
  ctx.restore();
  // neck & head, leaning into the run
  ctx.strokeStyle = '#7ea6b8'; ctx.lineWidth = 15; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(34, -78); ctx.quadraticCurveTo(52, -96, 58, -104); ctx.stroke();
  ctx.fillStyle = '#8fb4c7';
  ctx.beginPath(); ctx.ellipse(62, -108, 17, 14, 0.25, 0, 6.29); ctx.fill();
  // wattle — red, flapping with panic
  ctx.fillStyle = '#d63c2f';
  ctx.beginPath();
  ctx.ellipse(66 + Math.sin(run.time * 9) * 2, -92, 6, 12 + Math.sin(run.time * 9) * 2, 0.3, 0, 6.29);
  ctx.fill();
  // beak
  ctx.fillStyle = '#f2a541';
  ctx.beginPath();
  ctx.moveTo(76, -112); ctx.lineTo(98, -106); ctx.lineTo(76, -100); ctx.closePath(); ctx.fill();
  // wide determined eye
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(64, -112, 6.5, 0, 6.29); ctx.fill();
  ctx.fillStyle = '#1c1410';
  ctx.beginPath(); ctx.arc(66.5, -112, 3.4, 0, 6.29); ctx.fill();
  if (t.hidden) { // only eyes peek out of the hay
    ctx.fillStyle = '#ffd94d';
    text(ctx, 'shh…', 30, -150, 22, '#7c4a21');
  }
  ctx.restore();
}

export function drawFarmer(ctx, run) {
  const f = run.farmer;
  const x = TURKEY.x - f.gap - 92;
  const bob = Math.abs(Math.sin(run.time * 9.2)) * 7;
  ctx.save();
  ctx.translate(x, GROUND_Y - bob);
  const legSwing = Math.sin(run.time * 9.2) * 24;
  // legs in boots
  ctx.strokeStyle = '#31456e'; ctx.lineWidth = 13; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-8, -64); ctx.lineTo(-8 + legSwing, -6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(12, -64); ctx.lineTo(12 - legSwing, -6); ctx.stroke();
  ctx.fillStyle = '#3a2a18';
  ctx.fillRect(-16 + legSwing, -12, 24, 10);
  ctx.fillRect(4 - legSwing, -12, 24, 10);
  // overalls + plaid shirt
  ctx.fillStyle = '#3d5a99';
  roundRect(ctx, -30, -138, 62, 80, 8); ctx.fill();
  ctx.fillStyle = '#b03a2e';
  roundRect(ctx, -34, -168, 70, 38, 8); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-34, -152); ctx.lineTo(36, -152); ctx.moveTo(-10, -168); ctx.lineTo(-10, -130); ctx.stroke();
  // reaching arm — closer means longer stretch
  const reach = 34 + Math.max(0, (150 - f.gap)) * 0.5;
  ctx.strokeStyle = '#e8b08a'; ctx.lineWidth = 11;
  ctx.beginPath(); ctx.moveTo(28, -156); ctx.quadraticCurveTo(52, -140, 40 + reach, -118 + Math.sin(run.time * 9.2) * 5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(28, -138); ctx.quadraticCurveTo(50, -122, 34 + reach * 0.8, -96); ctx.stroke();
  // head + straw hat
  ctx.fillStyle = '#e8b08a';
  ctx.beginPath(); ctx.arc(2, -186, 21, 0, 6.29); ctx.fill();
  ctx.fillStyle = '#8a2f23'; // beard
  ctx.beginPath(); ctx.ellipse(8, -172, 13, 10, 0, 0, 6.29); ctx.fill();
  ctx.fillStyle = '#e8c07a';
  ctx.fillRect(-30, -206, 64, 9);
  roundRect(ctx, -16, -228, 36, 24, 5); ctx.fill();
  // angry eyes under the brim
  ctx.fillStyle = '#1c1410';
  ctx.beginPath(); ctx.arc(8, -190, 3, 0, 6.29); ctx.arc(20, -190, 3, 0, 6.29); ctx.fill();
  ctx.restore();
  if (f.gap < 190) { // the shout that warns you he is close
    ctx.save();
    ctx.translate(x + 76, GROUND_Y - 268 - bob);
    ctx.fillStyle = '#fff8e7';
    roundRect(ctx, -92, -26, 184, 40, 12); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-8, 12); ctx.lineTo(4, 30); ctx.lineTo(16, 12); ctx.closePath(); ctx.fill();
    text(ctx, 'COME BACK, DINNER!', 0, -6, 15, '#a93226');
    ctx.restore();
  }
}

// --------------------------------------------------------------- obstacles
export function drawObstacle(ctx, ob, run) {
  const x = ob.x;
  switch (ob.kind) {
    case 'haybale': {
      ctx.fillStyle = '#e8c84a';
      ctx.beginPath(); ctx.arc(x, GROUND_Y - 38, 40, 0, 6.29); ctx.fill();
      ctx.strokeStyle = '#c39a26'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(x, GROUND_Y - 38, 27, 0, 6.29); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, GROUND_Y - 38, 13, 0, 6.29); ctx.stroke();
      break;
    }
    case 'fence': {
      ctx.fillStyle = '#9c6b30';
      for (const px of [-44, 0, 44]) ctx.fillRect(x + px - 6, GROUND_Y - 92, 12, 92);
      ctx.fillStyle = '#7c5226';
      ctx.fillRect(x - 56, GROUND_Y - 78, 112, 13);
      ctx.fillRect(x - 56, GROUND_Y - 42, 112, 13);
      break;
    }
    case 'haystack': {
      ctx.fillStyle = '#dcb93e';
      ctx.beginPath();
      ctx.moveTo(x - 60, GROUND_Y);
      ctx.quadraticCurveTo(x - 52, GROUND_Y - 108, x, GROUND_Y - 118);
      ctx.quadraticCurveTo(x + 52, GROUND_Y - 108, x + 60, GROUND_Y);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#b8932a'; ctx.lineWidth = 3;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * 14, GROUND_Y - 16);
        ctx.lineTo(x + i * 10, GROUND_Y - 88 + Math.abs(i) * 9);
        ctx.stroke();
      }
      text(ctx, 'HIDE!', x, GROUND_Y - 132, 19, '#7c4a21');
      break;
    }
    case 'oven': {
      const flicker = Math.sin(run.time * 11 + ob.flame) * 4;
      ctx.fillStyle = '#4a4238';
      roundRect(ctx, x - 64, GROUND_Y - 140, 128, 140, 10); ctx.fill();
      ctx.fillStyle = '#5d5347';
      ctx.fillRect(x - 64, GROUND_Y - 140, 128, 26);
      for (const bx of [-38, 0, 38]) { // hob rings
        ctx.fillStyle = '#2c2721';
        ctx.beginPath(); ctx.arc(x + bx, GROUND_Y - 127, 11, 0, 6.29); ctx.fill();
      }
      // glowing door with flames — do NOT become the roast
      ctx.fillStyle = '#ff7b2e';
      roundRect(ctx, x - 44, GROUND_Y - 100, 88, 74, 8); ctx.fill();
      ctx.fillStyle = '#ffc93c';
      ctx.beginPath();
      ctx.moveTo(x - 26, GROUND_Y - 28);
      ctx.quadraticCurveTo(x - 30 + flicker, GROUND_Y - 66, x - 8, GROUND_Y - 78);
      ctx.quadraticCurveTo(x + 2, GROUND_Y - 52, x + 12, GROUND_Y - 84 + flicker);
      ctx.quadraticCurveTo(x + 30, GROUND_Y - 58, x + 24, GROUND_Y - 28);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#2c2721'; ctx.lineWidth = 5;
      roundRect(ctx, x - 44, GROUND_Y - 100, 88, 74, 8); ctx.stroke();
      text(ctx, 'OVEN — 220°', x, GROUND_Y - 156, 19, '#ffd94d');
      break;
    }
    case 'stool': {
      ctx.fillStyle = '#8a5a2b';
      roundRect(ctx, x - 38, GROUND_Y - 62, 76, 14, 6); ctx.fill();
      ctx.fillRect(x - 30, GROUND_Y - 48, 10, 48);
      ctx.fillRect(x + 20, GROUND_Y - 48, 10, 48);
      break;
    }
    case 'knife': {
      // a carving knife swinging from the rack above — duck!
      const swing = Math.sin(run.time * 2.6 + ob.swing) * 0.5;
      // wooden gallows post holds the rack in the farmyard; in the
      // kitchen the same bar reads as the wall rack.
      ctx.fillStyle = '#7c5226';
      ctx.fillRect(x + 62, GROUND_Y - 306, 12, 306);
      ctx.save();
      ctx.translate(x, GROUND_Y - 300);
      ctx.fillStyle = '#4a4238';
      ctx.fillRect(-70, -8, 140, 14);
      ctx.rotate(swing);
      ctx.strokeStyle = '#6b5a44'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 44); ctx.stroke();
      ctx.fillStyle = '#5d3c1a'; // handle
      roundRect(ctx, -8, 40, 16, 30, 6); ctx.fill();
      const blade = ctx.createLinearGradient(0, 70, 0, 168);
      blade.addColorStop(0, '#e8edf2'); blade.addColorStop(1, '#aeb9c4');
      ctx.fillStyle = blade;
      ctx.beginPath();
      ctx.moveTo(-11, 70); ctx.lineTo(11, 70); ctx.lineTo(11, 138);
      ctx.quadraticCurveTo(11, 164, -4, 170);
      ctx.quadraticCurveTo(-11, 150, -11, 128);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.fillStyle = 'rgba(43,26,18,0.75)';
      roundRect(ctx, x - 46, GROUND_Y - 348, 92, 34, 9); ctx.fill();
      text(ctx, 'DUCK!', x, GROUND_Y - 330, 20, '#ffd94d');
      ctx.restore();
      break;
    }
    default: break;
  }
}

export function drawCorn(ctx, c, time) {
  const y = c.y + Math.sin(time * 3 + c.bob) * 5;
  ctx.save();
  ctx.translate(c.x, y);
  if (c.golden) { // the golden corn glows and runs larger
    const pulse = 1 + Math.sin(time * 6 + c.bob) * 0.1;
    ctx.scale(1.45 * pulse, 1.45 * pulse);
    ctx.fillStyle = 'rgba(255, 217, 77, 0.35)';
    ctx.beginPath(); ctx.arc(0, 0, 34, 0, 6.29); ctx.fill();
  }
  ctx.rotate(Math.sin(time * 2 + c.bob) * 0.16);
  ctx.fillStyle = c.golden ? '#ffbe1e' : '#ffd94d';
  ctx.beginPath(); ctx.ellipse(0, 0, 13, 24, 0, 0, 6.29); ctx.fill();
  ctx.strokeStyle = '#d9a514'; ctx.lineWidth = 2;
  for (let r = -14; r <= 14; r += 9) {
    ctx.beginPath(); ctx.moveTo(-12, r); ctx.lineTo(12, r); ctx.stroke();
  }
  ctx.fillStyle = '#5d8a2f';
  ctx.beginPath(); ctx.ellipse(-12, 16, 6, 14, 0.7, 0, 6.29); ctx.fill();
  ctx.beginPath(); ctx.ellipse(12, 16, 6, 14, -0.7, 0, 6.29); ctx.fill();
  ctx.restore();
}

export function drawParticles(ctx, run) {
  for (const p of run.particles) {
    ctx.globalAlpha = Math.max(0, p.life * 1.6);
    ctx.fillStyle = p.colour;
    ctx.beginPath(); ctx.ellipse(p.x, p.y, 7, 4, p.x * 0.05, 0, 6.29); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------- HUD
export function drawHud(ctx, run) {
  // top bar
  ctx.fillStyle = 'rgba(43, 26, 18, 0.78)';
  roundRect(ctx, 18, 16, VIEW_WIDTH - 36, 64, 12); ctx.fill();
  text(ctx, `SCORE ${Math.floor(run.score)}`, 44, 48, 27, '#ffd94d', 'left');
  text(ctx, `🌽 × ${run.cornEaten}`, 356, 48, 25, '#f7e8c9', 'left');
  // lives as turkey hearts
  for (let i = 0; i < 3; i++) {
    const x = 620 + i * 46;
    ctx.font = '30px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = i < run.lives ? 1 : 0.22;
    ctx.fillText('🦃', x, 49);
    ctx.globalAlpha = 1;
  }
  text(ctx, `${Math.min(GOAL_METRES, Math.floor(run.metres))} m / ${GOAL_METRES} m`, 1240, 40, 24, '#f7e8c9', 'right');
  // progress to the Wildwood fence
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, 856, 58, 384, 10, 5); ctx.fill();
  ctx.fillStyle = '#7ec850';
  roundRect(ctx, 856, 58, 384 * Math.min(1, run.metres / GOAL_METRES), 10, 5); ctx.fill();
  // stage tag + stamina
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
  // danger meter: how close is Hank?
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
}

// ------------------------------------------------------------------- screens
export function drawTitleScreen(ctx, run, pose) {
  drawFarmyard(ctx, pose ? 640 : run.time * 30, run.time);
  ctx.fillStyle = 'rgba(43, 26, 18, 0.45)';
  ctx.fillRect(0, 96, VIEW_WIDTH, 252);
  text(ctx, 'GOBBLE RUN!', VIEW_WIDTH / 2, 168, 96, '#ffd94d');
  text(ctx, '— ESCAPE THE FEAST —', VIEW_WIDTH / 2, 238, 34, '#fff8e7');
  text(ctx, 'Thanksgiving is at 6. Dinner is YOU. Run, turkey, run!', VIEW_WIDTH / 2, 292, 26, '#ffe9b0');
  // Hank looming at the coop door, turkey already running
  drawFarmerPose(ctx, 210, GROUND_Y);
  drawTurkey(ctx, { ...run, turkey: { ...run.turkey, y: GROUND_Y, runCycle: run.time * 2 }, time: run.time });
  ctx.fillStyle = '#a93226';
  roundRect(ctx, 660, 556, 470, 74, 16); ctx.fill();
  ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 4;
  roundRect(ctx, 660, 556, 470, 74, 16); ctx.stroke();
  text(ctx, '▶  CLICK or press SPACE to RUN!', 895, 594, 27, '#fff8e7');
  text(ctx, 'SPACE / ↑ jump (twice = flap!) · ↓ duck the knives · → sprint · reach the Wildwood fence at 1,000 m',
    VIEW_WIDTH / 2, 678, 21, '#3d2317');
  text(ctx, 'Dodge the oven & the carving knife · grab corn (golden = +100!) · hide in haystacks · clean dodges pay +5',
    VIEW_WIDTH / 2, 710, 21, '#3d2317');
}

function drawFarmerPose(ctx, x, baseY) {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.fillStyle = '#3d5a99';
  roundRect(ctx, -32, -140, 66, 84, 8); ctx.fill();
  ctx.fillStyle = '#b03a2e';
  roundRect(ctx, -36, -170, 74, 40, 8); ctx.fill();
  ctx.strokeStyle = '#e8b08a'; ctx.lineWidth = 12; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(30, -150); ctx.lineTo(86, -108); ctx.stroke(); // pointing at YOU
  ctx.beginPath(); ctx.moveTo(-30, -150); ctx.lineTo(-58, -96); ctx.stroke();
  ctx.fillStyle = '#e8b08a';
  ctx.beginPath(); ctx.arc(2, -188, 22, 0, 6.29); ctx.fill();
  ctx.fillStyle = '#8a2f23';
  ctx.beginPath(); ctx.ellipse(9, -173, 14, 11, 0, 0, 6.29); ctx.fill();
  ctx.fillStyle = '#e8c07a';
  ctx.fillRect(-32, -209, 68, 10);
  roundRect(ctx, -17, -232, 38, 26, 5); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, x + 62, baseY - 316, 218, 44, 12); ctx.fill();
  text(ctx, "THERE'S MY DINNER!", x + 171, baseY - 294, 19, '#a93226');
}

export function drawEndScreen(ctx, run) {
  const escaped = run.phase === 'escaped';
  if (escaped) drawFarmyard(ctx, 4200, run.time); else drawKitchen(ctx, 2900, run.time);
  ctx.fillStyle = escaped ? 'rgba(30, 60, 20, 0.26)' : 'rgba(60, 16, 10, 0.55)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  if (escaped) {
    // over the fence, free in the Wildwood
    ctx.fillStyle = '#9c6b30';
    for (const px of [120, 300, 480, 660, 840, 1020]) ctx.fillRect(px, GROUND_Y - 60, 14, 60);
    ctx.fillRect(90, GROUND_Y - 52, 1060, 12);
    drawTurkey(ctx, { ...run, turkey: { ...run.turkey, y: GROUND_Y - 108, jumpsUsed: 2 }, time: run.time });
    text(ctx, '🦃 ESCAPED! 🦃', VIEW_WIDTH / 2, 190, 88, '#b6ff7a');
    text(ctx, 'Over the fence and into the Wildwood — no roast for Hank tonight!', VIEW_WIDTH / 2, 268, 28, '#fff8e7');
  } else {
    drawFarmerPose(ctx, 880, GROUND_Y);
    // caught turkey under a cloche on the kitchen table
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(180, GROUND_Y - 6, 560, 16);
    ctx.fillStyle = '#c7ccd4';
    ctx.beginPath(); ctx.arc(460, GROUND_Y - 8, 120, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#9aa3ad';
    ctx.fillRect(330, GROUND_Y - 14, 260, 10);
    ctx.beginPath(); ctx.arc(460, GROUND_Y - 132, 13, 0, 6.29); ctx.fill();
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
  if (!escaped) text(ctx, 'Tip: duck the knives, jump the oven, and hide in haystacks to shake him off.', VIEW_WIDTH / 2, 610, 21, '#ffe9b0');
  else text(ctx, 'Tip: a perfect run banks +100 per life left. Can you keep all three?', VIEW_WIDTH / 2, 610, 21, '#ffe9b0');
}

export function drawFloaters(ctx, run) {
  for (const fl of run.floaters) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, fl.life * 1.8);
    ctx.font = "bold 21px Georgia, serif";
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

export function drawSpeedLines(ctx, run) {
  if (!run.sprinting || run.phase !== 'run') return;
  ctx.strokeStyle = 'rgba(255, 248, 231, 0.5)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const y = 240 + i * 78 + Math.sin(run.time * 31 + i * 2.1) * 9;
    const len = 60 + ((i * 53) % 70);
    ctx.beginPath();
    ctx.moveTo(TURKEY.x - 130 - i * 26, y);
    ctx.lineTo(TURKEY.x - 130 - i * 26 - len, y);
    ctx.stroke();
  }
}

export function drawScene(ctx, run, scroll) {
  const stage = stageAt(run.metres);
  if (stage === 'kitchen') drawKitchen(ctx, scroll, run.time);
  else drawFarmyard(ctx, scroll, run.time);
  // the Wildwood fence appears at the finish
  if (run.metres > GOAL_METRES - 24) {
    const fenceX = VIEW_WIDTH - (run.metres - (GOAL_METRES - 24)) * 46 * 0.4;
    ctx.fillStyle = '#5d8a2f';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(fenceX + 120 + i * 66, GROUND_Y - 210 - (i % 2) * 36, 74, 96, 0, 0, 6.29);
      ctx.fill();
    }
    text(ctx, '🌲 THE WILDWOOD 🌲', fenceX + 260, GROUND_Y - 330, 30, '#2e5d1e');
  }
  for (const ob of run.obstacles) drawObstacle(ctx, ob, run);
  for (const c of run.corns) if (!c.taken) drawCorn(ctx, c, run.time);
  drawSpeedLines(ctx, run);
  drawFarmer(ctx, run);
  drawTurkey(ctx, run);
  drawParticles(ctx, run);
  drawFloaters(ctx, run);
  drawHud(ctx, run);
  if (run.metres > KITCHEN_START_METRES - 12 && run.metres < KITCHEN_START_METRES + 8) {
    text(ctx, '— THROUGH THE KITCHEN! —', VIEW_WIDTH / 2, 220, 40, '#ffd94d');
  }
}
