// Gobble Run! 3D — the three.js view. The simulation in world.js is
// unchanged from the 2D edition: this file only paints its state in
// 3D — a low-poly turkey with a fanned tail, Farmer Hank built from
// boxes and spheres, the farmyard at sunset and the farmhouse kitchen,
// all modelled from primitives (no model files, no network).
// Screen coordinates from world.js map 1:1 onto world units:
// x is x, and a screen y becomes (GROUND_Y - y) so the dirt sits at 0.

import { GROUND_Y, KITCHEN_START_METRES, TURKEY, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { stageAt } from './world.js';

const Y = (screenY) => GROUND_Y - screenY;

function mat(color, opts = {}) {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

function box(w, h, d, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

function ball(r, color, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 22, 16), mat(color));
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  return m;
}

// A flat sign with text on it, drawn onto a canvas texture.
function makeSign(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = Math.round(512 * h / w);
  const g = cv.getContext('2d');
  draw(g, cv.width, cv.height);
  const tex = new THREE.CanvasTexture(cv);
  tex.encoding = THREE.sRGBEncoding;
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true }),
  );
  return m;
}

function textSign(w, h, label, fg, bg, fontPx = 64) {
  return makeSign(w, h, (g, cw, ch) => {
    if (bg) {
      g.fillStyle = bg;
      g.beginPath(); g.roundRect(6, 6, cw - 12, ch - 12, 26); g.fill();
    }
    g.fillStyle = fg;
    g.font = `bold ${fontPx}px Georgia, serif`;
    const wText = g.measureText(label).width;
    if (wText > cw - 36) { // shrink to fit the sign, never clip
      g.font = `bold ${Math.floor(fontPx * (cw - 36) / wText)}px Georgia, serif`;
    }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(label, cw / 2, ch / 2 + 2);
  });
}

function glowSprite(scale, color = '255, 217, 77') {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, `rgba(${color}, 0.85)`);
  grad.addColorStop(1, `rgba(${color}, 0)`);
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: (() => { const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; return t; })(), transparent: true, depthWrite: false,
  }));
  sp.scale.set(scale, scale, 1);
  return sp;
}

function gradientTexture(stops, w = 64, h = 512) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, h);
  for (const [at, col] of stops) grad.addColorStop(at, col);
  g.fillStyle = grad; g.fillRect(0, 0, w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

function dirtTexture() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const g = cv.getContext('2d');
  g.fillStyle = '#8a5a2b'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 500; i++) {
    g.fillStyle = Math.random() < 0.5 ? 'rgba(94,58,22,0.55)' : 'rgba(255,220,160,0.20)';
    g.fillRect(Math.random() * 256, Math.random() * 256, 5, 3);
  }
  g.fillStyle = 'rgba(60,36,12,0.4)';
  g.fillRect(20, 128, 60, 7);
  const tex = new THREE.CanvasTexture(cv);
  tex.encoding = THREE.sRGBEncoding;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 2);
  return tex;
}

function checkerTexture() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const g = cv.getContext('2d');
  g.fillStyle = '#8a5a34'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#754b29';
  g.fillRect(0, 0, 128, 128); g.fillRect(128, 128, 128, 128);
  for (let i = 0; i < 240; i++) {
    g.fillStyle = 'rgba(40,22,8,0.25)';
    g.fillRect(Math.random() * 256, Math.random() * 256, 4, 3);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.encoding = THREE.sRGBEncoding;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 2);
  return tex;
}

function tileTexture() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const g = cv.getContext('2d');
  g.fillStyle = '#8a4a38'; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(255,220,190,0.35)'; g.lineWidth = 5;
  g.strokeRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(cv);
  tex.encoding = THREE.sRGBEncoding;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 5);
  return tex;
}

// ------------------------------------------------------------------ actors
function buildTurkey() {
  const t = new THREE.Group();
  const body = ball(46, 0x8a5a2b, 0, 58, 0, 1.25, 0.85, 0.92);
  t.add(body);
  t.add(ball(30, 0x9c6b30, 26, 50, 0, 1, 0.8, 0.8)); // breast
  // tail fan — seven banded feathers fanned behind him
  const fan = new THREE.Group();
  fan.position.set(-44, 66, 0);
  for (let i = 0; i < 7; i++) {
    const a = -1.05 + i * 0.33;
    const len = 66 - Math.abs(i - 3) * 6;
    const feather = new THREE.Group();
    const shaft = box(15, len, 5, i % 2 ? 0x8a5a2b : 0x6e4520, 0, len / 2, 0);
    const tip = box(15, 13, 6, 0x2e1c0d, 0, len - 6, 0);
    const band = box(15, 7, 6, 0xe8c07a, 0, len - 16, 0);
    feather.add(shaft, tip, band);
    feather.rotation.z = a; // fan points up-back
    feather.position.y = 0;
    fan.add(feather);
  }
  fan.rotation.z = -0.45;
  t.add(fan);
  // wing on the camera side — flaps on the double jump
  const wing = ball(25, 0x7c5226, -6, 58, 38, 1.05, 0.5, 0.35);
  t.add(wing);
  // neck, head, beak, wattle
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(10, 13, 44, 10), mat(0x7ea6b8));
  neck.position.set(44, 96, 0); neck.rotation.z = -0.5; neck.castShadow = true;
  t.add(neck);
  t.add(ball(16, 0x8fb4c7, 60, 112, 0, 1.1, 0.9, 0.9));
  const beak = new THREE.Mesh(new THREE.ConeGeometry(8, 26, 10), mat(0xf2a541));
  beak.position.set(82, 110, 0); beak.rotation.z = -Math.PI / 2; beak.castShadow = true;
  t.add(beak);
  t.add(ball(7, 0xd63c2f, 66, 94, 0, 0.8, 1.5, 0.8)); // wattle
  t.add(ball(6.5, 0xffffff, 62, 116, 13)); // eye, camera side
  t.add(ball(3.4, 0x1c1410, 64, 116, 18));
  // legs
  const legs = [];
  for (const side of [1, -1]) {
    const leg = new THREE.Group();
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 38, 8), mat(0xe07b2a));
    shin.position.y = -19;
    leg.add(shin);
    leg.add(box(20, 5, 9, 0xe07b2a, 5, -38, 0));
    leg.position.set(-4 * side, 34, 10 * side);
    legs.push(leg);
    t.add(leg);
  }
  // the lucky feather's ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(96, 4, 10, 40),
    new THREE.MeshBasicMaterial({ color: 0xaee6ff, transparent: true, opacity: 0.75 }),
  );
  ring.position.set(0, 62, 0);
  t.add(ring);
  return { group: t, wing, legs, ring, fan };
}

function buildFarmer() {
  const f = new THREE.Group();
  const legs = [];
  for (const side of [1, -1]) {
    const leg = new THREE.Group();
    leg.add(box(17, 62, 19, 0x2a3f66, 0, -31, 0));
    leg.add(box(26, 10, 30, 0x3a2a18, 4, -64, 0));
    leg.position.set(0, 66, 13 * side);
    legs.push(leg);
    f.add(leg);
  }
  f.add(box(62, 80, 44, 0x2f4a7d, 2, 104, 0)); // overalls
  f.add(box(70, 38, 48, 0xa93226, 2, 162, 0)); // plaid shirt block
  const arms = [];
  for (const side of [1, -1]) {
    const arm = new THREE.Group();
    const limb = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.5, 74, 8), mat(0xe8b08a));
    limb.position.y = -37;
    arm.add(limb);
    arm.position.set(26, 168, 16 * side);
    arm.rotation.z = 1.45; // reaching forward toward the turkey
    arms.push(arm);
    f.add(arm);
  }
  f.add(ball(21, 0xe8b08a, 2, 196, 0));
  f.add(ball(13, 0x8a2f23, 10, 182, 0, 1, 0.75, 1)); // beard
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(33, 33, 6, 18), mat(0xe8c07a));
  brim.position.set(2, 212, 0); brim.castShadow = true;
  f.add(brim);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(18, 20, 24, 14), mat(0xe8c07a));
  top.position.set(2, 224, 0); top.castShadow = true;
  f.add(top);
  f.add(ball(3, 0x1c1410, 16, 198, 12));
  f.add(ball(3, 0x1c1410, 16, 198, -12));
  const shout = textSign(300, 66, 'COME BACK, DINNER!', '#a93226', '#fff8e7', 58);
  shout.position.set(96, 268, 0);
  f.add(shout);
  const titleShout = textSign(320, 66, "THERE'S MY DINNER!", '#a93226', '#fff8e7', 56);
  titleShout.position.set(110, 268, 0);
  titleShout.visible = false;
  f.add(titleShout);
  return { group: f, legs, arms, shout, titleShout };
}

// --------------------------------------------------------------- obstacles
function buildObstacle(ob) {
  const g = new THREE.Group();
  switch (ob.kind) {
    case 'haybale': {
      const bale = new THREE.Mesh(new THREE.CylinderGeometry(40, 40, 56, 20), mat(0xd9ae2e));
      bale.rotation.x = Math.PI / 2; bale.position.y = 38; bale.castShadow = true;
      g.add(bale);
      for (const dz of [-18, 14]) {
        const ringM = new THREE.Mesh(new THREE.TorusGeometry(40, 3.4, 8, 24), mat(0xa87f1c));
        ringM.position.set(0, 38, dz);
        g.add(ringM);
      }
      break;
    }
    case 'fence': {
      for (const px of [-44, 0, 44]) g.add(box(12, 92, 12, 0x9c6b30, px, 46, 0));
      g.add(box(112, 13, 10, 0x7c5226, 0, 72, 0));
      g.add(box(112, 13, 10, 0x7c5226, 0, 36, 0));
      break;
    }
    case 'haystack': {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(64, 122, 18), mat(0xdcb93e));
      cone.position.y = 61; cone.castShadow = true;
      g.add(cone);
      const sign = textSign(110, 40, 'HIDE!', '#7c4a21', null, 84);
      sign.position.set(0, 142, 30);
      g.add(sign);
      break;
    }
    case 'oven': {
      g.add(box(128, 140, 96, 0x38322b, 0, 70, 0));
      g.add(box(128, 26, 96, 0x494139, 0, 140, 0));
      for (const bx of [-38, 0, 38]) {
        const ringM = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, 6, 14), mat(0x2c2721));
        ringM.position.set(bx, 156, 0);
        g.add(ringM);
      }
      const door = new THREE.Mesh(
        new THREE.PlaneGeometry(88, 74),
        new THREE.MeshBasicMaterial({ color: 0xef621c }),
      );
      door.position.set(0, 62, 49);
      g.add(door);
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(24, 52, 10),
        new THREE.MeshBasicMaterial({ color: 0xffc93c }),
      );
      flame.position.set(0, 52, 52);
      g.add(flame);
      g.userData.flame = flame;
      const label = textSign(170, 42, 'OVEN — 220°', '#ffd94d', null, 72);
      label.position.set(0, 178, 30);
      g.add(label);
      // steam wisps that curl off the top
      g.userData.steam = [];
      for (let s = 0; s < 3; s++) {
        const puff = ball(9, 0xfff8e7, -30 + s * 30, 168, 0, 1, 1.3, 1);
        puff.material = new THREE.MeshBasicMaterial({ color: 0xfff6e0, transparent: true, opacity: 0.5 });
        puff.castShadow = false;
        g.userData.steam.push(puff);
        g.add(puff);
      }
      break;
    }
    case 'stool': {
      g.add(box(76, 14, 60, 0x8a5a2b, 0, 55, 0));
      g.add(box(10, 48, 10, 0x8a5a2b, -26, 24, -18));
      g.add(box(10, 48, 10, 0x8a5a2b, 26, 24, 18));
      g.add(box(10, 48, 10, 0x8a5a2b, -26, 24, 18));
      g.add(box(10, 48, 10, 0x8a5a2b, 26, 24, -18));
      break;
    }
    case 'knife': {
      // gallows post + rack bar; the blade group swings from the bar
      g.add(box(14, 306, 14, 0x7c5226, 62, 153, 0));
      g.add(box(150, 14, 16, 0x4a4238, 0, 300, 0));
      const swingG = new THREE.Group();
      swingG.position.set(0, 300, 0);
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 44, 8), mat(0x6b5a44));
      cord.position.y = -22;
      swingG.add(cord);
      swingG.add(box(16, 32, 12, 0x5d3c1a, 0, -58, 0)); // handle
      const blade = box(22, 96, 4, 0xd7dee6, 0, -122, 0);
      blade.material = mat(0xd7dee6, { emissive: 0x39424e });
      swingG.add(blade);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(11, 26, 4), mat(0xaeb9c4));
      tip.position.set(0, -182, 0); tip.rotation.x = Math.PI; tip.scale.z = 0.2;
      swingG.add(tip);
      g.add(swingG);
      g.userData.swingG = swingG;
      const sign = textSign(110, 44, 'DUCK!', '#ffd94d', 'rgba(43,26,18,0.85)', 76);
      sign.position.set(0, 348, 20);
      g.add(sign);
      break;
    }
    default: break;
  }
  return g;
}

function buildCorn(c) {
  const g = new THREE.Group();
  const cob = new THREE.Mesh(new THREE.CylinderGeometry(7, 10, 48, 10), mat(c.golden ? 0xffbe1e : 0xffd94d));
  cob.castShadow = true;
  g.add(cob);
  g.rotation.z = 0.3;
  g.add(ball(9, 0x5d8a2f, -9, -14, 0, 0.5, 1.6, 0.5));
  g.add(ball(9, 0x5d8a2f, 9, -14, 0, 0.5, 1.6, 0.5));
  if (c.golden) g.add(glowSprite(120));
  return g;
}

function buildFeatherPickup() {
  const g = new THREE.Group();
  g.add(glowSprite(96, '174, 230, 255'));
  const feather = ball(11, 0xfdfdf8, 0, 0, 0, 0.85, 2.2, 0.35);
  feather.rotation.z = 0.5;
  g.add(feather);
  g.add(ball(9, 0xffd94d, 10, 16, 0, 0.8, 1, 0.4));
  return g;
}

function buildBarn() {
  const g = new THREE.Group();
  g.add(box(190, 130, 120, 0xa93226, 0, 65, 0));
  // gables + sloped roof planes
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-95, 130); gableShape.lineTo(95, 130); gableShape.lineTo(0, 196); gableShape.closePath();
  for (const dz of [59, -59]) {
    const gable = new THREE.Mesh(new THREE.ShapeGeometry(gableShape), mat(0xa93226));
    gable.position.z = dz;
    g.add(gable);
  }
  for (const side of [1, -1]) {
    const slope = box(124, 8, 132, 0x7e2118, side * 48, 163, 0);
    slope.rotation.z = -side * 0.61;
    g.add(slope);
  }
  g.add(box(58, 92, 6, 0xf7e8c9, 0, 46, 62)); // door
  const brace1 = box(74, 7, 7, 0x7e2118, 0, 46, 64); brace1.rotation.z = 0.99;
  const brace2 = box(74, 7, 7, 0x7e2118, 0, 46, 64); brace2.rotation.z = -0.99;
  g.add(brace1, brace2);
  const sign = textSign(150, 34, 'TURKEY COOP', '#7e2118', '#f7e8c9', 56);
  sign.position.set(0, 108, 63);
  g.add(sign);
  return g;
}

function buildPan() {
  const g = new THREE.Group();
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 36, 6), mat(0x2f2a26));
  cord.position.y = -18;
  g.add(cord);
  const pan = new THREE.Mesh(new THREE.CylinderGeometry(34, 30, 14, 18), mat(0x4a4238));
  pan.position.y = -52;
  pan.castShadow = true;
  g.add(pan);
  return g;
}

function buildTree() {
  const g = new THREE.Group();
  g.add(box(14, 60, 14, 0x6b4223, 0, 30, 0));
  const cone = new THREE.Mesh(new THREE.ConeGeometry(70, 170, 12), mat(0x5d8a2f));
  cone.position.y = 140; cone.castShadow = true;
  g.add(cone);
  return g;
}

// -------------------------------------------------------------------- view
export function createView3D(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(VIEW_WIDTH, VIEW_HEIGHT);
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x7e5226);
  scene.fog = new THREE.Fog(0xf7a54d, 1500, 3400);
  const camera = new THREE.PerspectiveCamera(42, VIEW_WIDTH / VIEW_HEIGHT, 10, 5000);
  camera.position.set(600, 330, 1130);
  camera.lookAt(600, 112, 0);

  scene.add(new THREE.HemisphereLight(0xffe9b0, 0x7e5226, 0.34));
  const sunLight = new THREE.DirectionalLight(0xfff2cc, 0.72);
  sunLight.position.set(500, 700, 650);
  sunLight.castShadow = true;
  sunLight.shadow.camera.left = -800; sunLight.shadow.camera.right = 800;
  sunLight.shadow.camera.top = 800; sunLight.shadow.camera.bottom = -300;
  sunLight.shadow.mapSize.set(1024, 1024);
  scene.add(sunLight);

  // sky backdrop + sun disc
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(3600, 1300),
    new THREE.MeshBasicMaterial({
      map: gradientTexture([[0, '#e07b1f'], [0.55, '#f78d2c'], [1, '#ffc93c']]),
      fog: false,
    }),
  );
  sky.position.set(600, 420, -820);
  scene.add(sky);
  const sunDisc = new THREE.Mesh(
    new THREE.CircleGeometry(62, 26),
    new THREE.MeshBasicMaterial({ color: 0xfff3b0, fog: false }),
  );
  sunDisc.position.set(1085, Y(480), -800);
  scene.add(sunDisc);
  const sunGlow = glowSprite(320);
  sunGlow.position.set(1085, Y(480), -790);
  scene.add(sunGlow);

  // ground (texture swaps with the stage)
  const dirt = dirtTexture();
  const checker = checkerTexture();
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(3800, 1700),
    new THREE.MeshLambertMaterial({ map: dirt }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(600, 0, 180);
  ground.receiveShadow = true;
  scene.add(ground);

  // farmyard set
  const farm = new THREE.Group();
  scene.add(farm);
  const hills = [];
  for (let i = 0; i < 3; i++) {
    const hill = ball(330, 0xc47a33, 0, -16, -430, 1.6, 0.36, 0.5);
    hill.castShadow = false;
    hills.push(hill); farm.add(hill);
  }
  const clouds = [];
  for (let i = 0; i < 4; i++) {
    const cl = new THREE.Group();
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xfff3d6, transparent: true, opacity: 0.92 });
    const c1 = new THREE.Mesh(new THREE.SphereGeometry(74, 18, 12), cloudMat);
    c1.scale.set(1, 0.28, 0.5);
    const c2 = new THREE.Mesh(new THREE.SphereGeometry(52, 18, 12), cloudMat);
    c2.scale.set(1, 0.26, 0.5); c2.position.set(48, -4, 0);
    cl.add(c1, c2);
    cl.position.set(i * 390, Y(196 + (i % 2) * 54), -520);
    clouds.push(cl); farm.add(cl);
  }
  const barns = [buildBarn(), buildBarn()];
  barns[0].position.set(760, 0, -270);
  barns[1].position.set(2460, 0, -270);
  farm.add(barns[0], barns[1]);
  const fencePosts = [];
  for (let i = 0; i < 17; i++) {
    const post = box(9, 62, 9, 0x7c4a21, 0, 31, 0);
    farm.add(post); fencePosts.push(post);
  }
  const rails = [box(2600, 8, 6, 0x7c4a21, 600, 44, -58), box(2600, 8, 6, 0x7c4a21, 600, 18, -58)];
  farm.add(rails[0], rails[1]);
  for (const p of fencePosts) p.position.z = -58;
  for (const r of rails) r.castShadow = false;
  const pumpkins = [];
  for (let i = 0; i < 4; i++) {
    const pk = new THREE.Group();
    const bodyP = ball(26, 0xe07b2a, 0, 18, 0, 1, 0.78, 1);
    pk.add(bodyP);
    pk.add(box(8, 12, 8, 0x4d7c0f, 0, 42, 0));
    pk.position.z = 150;
    pumpkins.push(pk); farm.add(pk);
  }

  // kitchen set
  const kitchen = new THREE.Group();
  scene.add(kitchen);
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(3600, 1300),
    new THREE.MeshLambertMaterial({ map: tileTexture() }),
  );
  wall.position.set(600, 420, -520);
  kitchen.add(wall);
  const windowGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(210, 190),
    new THREE.MeshBasicMaterial({ map: gradientTexture([[0, '#ffe9a8'], [1, '#ffb066']]) }),
  );
  windowGlow.position.set(1055, Y(300), -505);
  kitchen.add(windowGlow);
  kitchen.add(box(226, 14, 10, 0x4a2417, 1055, Y(300) + 95, -500));
  kitchen.add(box(226, 14, 10, 0x4a2417, 1055, Y(300) - 95, -500));
  kitchen.add(box(14, 198, 10, 0x4a2417, 950, Y(300), -500));
  kitchen.add(box(14, 198, 10, 0x4a2417, 1160, Y(300), -500));
  kitchen.add(box(12, 190, 8, 0x4a2417, 1055, Y(300), -498));
  const pans = [];
  for (let i = 0; i < 4; i++) {
    const pan = buildPan();
    pan.position.set(i * 520 + 140, Y(150), -130);
    pans.push(pan); kitchen.add(pan);
  }
  const menu = makeSign(340, 138, (g, cw, ch) => {
    g.fillStyle = '#3d2317'; g.fillRect(0, 0, cw, ch);
    g.strokeStyle = '#c98d4b'; g.lineWidth = 8; g.strokeRect(6, 6, cw - 12, ch - 12);
    g.textAlign = 'center';
    g.fillStyle = '#ffd94d'; g.font = 'bold 54px Georgia, serif';
    g.fillText("TONIGHT'S MENU", cw / 2, 62);
    g.fillStyle = '#f7e8c9'; g.font = 'bold 46px Georgia, serif';
    g.fillText('ROAST TURKEY — 6 PM', cw / 2, 128);
    g.fillStyle = '#e8a87c'; g.font = 'italic bold 36px Georgia, serif';
    g.fillText('(he has other plans)', cw / 2, 182);
  });
  menu.position.set(115, Y(415), -470);
  kitchen.add(menu);
  kitchen.visible = false;

  // finish-line trees + fence (farmyard, near the goal)
  const finish = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const tree = buildTree();
    tree.position.set(120 + i * 66, 0, -140);
    finish.add(tree);
  }
  for (const px of [120, 300, 480, 660, 840, 1020]) {
    finish.add(box(14, 108, 14, 0x9c6b30, px, 54, -30));
  }
  finish.add(box(1060, 12, 12, 0x9c6b30, 570, 96, -30));
  const wildSign = textSign(430, 64, '🌲 THE WILDWOOD 🌲', '#2e5d1e', null, 62);
  wildSign.position.set(380, 330, -60);
  finish.add(wildSign);
  finish.visible = false;
  scene.add(finish);

  // caught tableau: table + cloche
  const clocheSet = new THREE.Group();
  clocheSet.add(box(560, 16, 220, 0x8a5a2b, 460, 8, 0));
  const cloche = new THREE.Mesh(
    new THREE.SphereGeometry(120, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(0xc7ccd4, { emissive: 0x222222 }),
  );
  cloche.position.set(460, 16, 0);
  clocheSet.add(cloche);
  clocheSet.add(ball(13, 0x9aa3ad, 460, 142, 0));
  clocheSet.visible = false;
  scene.add(clocheSet);

  const turkey = buildTurkey();
  scene.add(turkey.group);
  const farmer = buildFarmer();
  scene.add(farmer.group);

  // pooled dynamic items
  const pools = { obstacles: new Map(), corns: new Map(), feathers: new Map() };
  function syncPool(map, items, build, update) {
    const seen = new Set();
    for (const item of items) {
      seen.add(item);
      if (!map.has(item)) {
        const g = build(item);
        map.set(item, g);
        scene.add(g);
      }
      update(map.get(item), item);
    }
    for (const [item, g] of map) {
      if (!seen.has(item)) {
        scene.remove(g);
        map.delete(item);
      }
    }
  }

  // particle pool (feathers + dust from the simulation)
  const particlePool = [];
  for (let i = 0; i < 70; i++) {
    const p = box(11, 6, 2, 0xffffff, 0, -100, 0);
    p.castShadow = false;
    particlePool.push(p);
    scene.add(p);
  }

  function placeActors(run) {
    const t = run.turkey;
    const feetY = GROUND_Y - t.y;
    turkey.group.position.set(TURKEY.x, feetY, 0);
    const duck = t.ducking ? 0.6 : 1;
    turkey.group.scale.set(
      (1 + t.squash * 0.13) * (t.ducking ? 1.14 : 1),
      (1 - t.squash * 0.16) * duck,
      1,
    );
    const airborne = t.y < GROUND_Y - 2;
    const swing = airborne ? 0.7 : Math.sin(t.runCycle * 2.4) * 0.85;
    turkey.legs.forEach((leg, i) => {
      leg.visible = !t.ducking;
      leg.rotation.z = -swing * (i === 0 ? 1 : -1) * 0.8;
    });
    turkey.wing.rotation.x = t.jumpsUsed === 2 && airborne
      ? Math.sin(run.time * 34) * 0.8 : 0.15 + Math.sin(t.runCycle * 2.4) * 0.07;
    turkey.fan.rotation.z = -0.45 + Math.sin(t.runCycle) * 0.05;
    turkey.ring.visible = !!run.shield;
    turkey.ring.rotation.y = Math.sin(run.time * 2.2) * 0.35;
    turkey.group.visible = run.phase !== 'caught'
      && !(run.invincibleFor > 0 && Math.floor(run.time * 14) % 2 === 0 && run.phase === 'run');

    const f = run.farmer;
    const bob = Math.abs(Math.sin(run.time * 9.2)) * 7;
    let fx = TURKEY.x - f.gap - 92;
    if (run.phase === 'title') fx = 210;
    if (run.phase === 'caught') fx = 800;
    farmer.group.position.set(fx, bob, 0);
    farmer.legs.forEach((leg, i) => {
      leg.rotation.z = Math.sin(run.time * 9.2 + (i ? Math.PI : 0)) * 0.5;
    });
    const reach = 34 + Math.max(0, 150 - f.gap) * 0.5;
    farmer.arms.forEach((arm) => { arm.rotation.z = 1.5 - reach / 420; });
    farmer.group.visible = run.phase !== 'escaped';
    farmer.shout.visible = run.phase === 'run' && f.gap < 190;
    farmer.titleShout.visible = run.phase === 'title';
  }

  function draw(run, scroll) {
    const stage = stageAt(run.metres);
    const inKitchen = stage === 'kitchen' && run.phase !== 'escaped';
    farm.visible = !inKitchen;
    kitchen.visible = inKitchen;
    const groundTex = inKitchen ? checker : dirt;
    if (ground.material.map !== groundTex) {
      ground.material.map = groundTex;
      ground.material.needsUpdate = true;
    }
    groundTex.offset.x = (scroll * 0.9 / 256) % 1;

    if (!inKitchen) {
      hills.forEach((hill, i) => {
        hill.position.x = 300 + i * 640 - ((scroll * 0.25) % 640);
      });
      clouds.forEach((cl, i) => {
        cl.position.x = ((i * 390 - scroll * 0.12 + run.time * 4) % 1500) - 120;
      });
      barns[0].position.x = 760 - (scroll * 0.3 % 1700);
      barns[1].position.x = barns[0].position.x + 1700;
      fencePosts.forEach((post, i) => {
        post.position.x = i * 92 - ((scroll * 0.6) % 92) - 40;
      });
      pumpkins.forEach((pk, i) => {
        pk.position.x = i * 460 + 180 - (scroll % 460);
      });
    } else {
      pans.forEach((pan, i) => {
        pan.position.x = i * 520 + 140 - ((scroll * 0.85) % 520);
      });
    }

    finish.visible = !inKitchen && (run.metres > 976 || run.phase === 'escaped');
    if (finish.visible) {
      if (run.phase === 'escaped') {
        // the victory tableau: rail under the turkey, trees behind him
        finish.position.x = -100;
        wildSign.visible = false;
      } else {
        const fenceX = VIEW_WIDTH - (run.metres - 976) * 46 * 0.4;
        finish.position.x = fenceX - 120;
        wildSign.visible = true;
      }
    }
    clocheSet.visible = run.phase === 'caught';

    syncPool(pools.obstacles, run.obstacles, buildObstacle, (g, ob) => {
      g.position.set(ob.x, 0, 0);
      if (ob.kind === 'knife' && g.userData.swingG) {
        g.userData.swingG.rotation.z = Math.sin(run.time * 2.6 + ob.swing) * 0.5;
      }
      if (ob.kind === 'oven' && g.userData.flame) {
        const fl = 1 + Math.sin(run.time * 11 + ob.flame) * 0.16;
        g.userData.flame.scale.set(fl, fl, 1);
        g.userData.steam.forEach((puff, s) => {
          const ph = ((run.time * 0.55 + ob.flame + s * 0.33) % 1);
          puff.position.y = 168 + ph * 52;
          puff.position.x = -30 + s * 30 + Math.sin(run.time * 2.4 + s) * 7 * ph;
          puff.material.opacity = 0.5 * (1 - ph);
          const sc = 0.7 + ph * 0.9;
          puff.scale.set(sc, sc * 1.3, sc);
        });
      }
    });
    syncPool(pools.corns, run.corns.filter((c) => !c.taken), buildCorn, (g, c) => {
      const bobY = Math.sin(run.time * 3 + c.bob) * 5;
      g.position.set(c.x, Y(c.y) + bobY, 0);
      const s = c.golden ? 1.45 : 1;
      g.scale.set(s, s, s);
      g.rotation.y = Math.sin(run.time * 2 + c.bob) * 0.3;
    });
    syncPool(pools.feathers, (run.feathers || []).filter((fd) => !fd.taken),
      buildFeatherPickup, (g, fd) => {
        g.position.set(fd.x, Y(fd.y) + Math.sin(run.time * 2.6 + fd.bob) * 6, 0);
        g.rotation.y = run.time * 1.6 + fd.bob;
      });

    run.particles.forEach((p, i) => {
      const m = particlePool[i % particlePool.length];
      m.visible = true;
      m.position.set(p.x, Y(p.y), 6);
      m.material.color.set(p.colour);
      m.rotation.z = p.x * 0.05;
    });
    for (let i = run.particles.length; i < particlePool.length; i++) {
      particlePool[i].visible = false;
    }

    if (run.phase === 'title') {
      run.turkey.runCycle = run.time * 2; // run in place behind the title
    }
    placeActors(run);
    if (run.phase === 'escaped') {
      turkey.group.position.y = 108; // perched on the finish fence
      turkey.group.visible = true;
    }
    renderer.render(scene, camera);
  }

  return { draw };
}
