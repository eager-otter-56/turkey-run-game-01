// Gobble Run! 3D — the three.js view, runner edition. The camera
// rides behind Tom the turkey (Minion-Rush style): three lanes run
// away to the horizon, hazards and corn trails come at you in their
// lanes, and Farmer Hank looms in the frame behind you, closer
// whenever his gap shrinks. The simulation in world.js holds lanes
// and distances; this file only paints them — a low-poly turkey with
// a banded tail fan (the view from behind shows it off), a farmer
// built from boxes and spheres, a sunset farmyard and a kitchen
// corridor, all modelled from primitives. No model files, no network.
// Mapping: an item's x in the simulation is distance along the track,
// so z = -(x - TURKEY.x); a lane is x = lane * LANE_W; a simulation
// y becomes height (GROUND_Y - y).

import { GOAL_METRES, GROUND_Y, PIXELS_PER_METRE, TURKEY, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { stageAt } from './world.js';

const LANE_W = 170;
const Y = (screenY) => GROUND_Y - screenY;
const laneX = (lane) => lane * LANE_W;
const aheadZ = (simX) => -(simX - TURKEY.x);

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
  const tex = new THREE.CanvasTexture(cv);
  tex.encoding = THREE.sRGBEncoding;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, transparent: true, depthWrite: false,
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
  tex.repeat.set(12, 26);
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
  tex.repeat.set(12, 26);
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
  tex.repeat.set(16, 3);
  return tex;
}

// ------------------------------------------------------------------ actors
function buildTurkey() {
  const t = new THREE.Group();
  const body = ball(46, 0x8a5a2b, 0, 58, 0, 1.25, 0.85, 0.92);
  t.add(body);
  t.add(ball(30, 0x9c6b30, 26, 50, 0, 1, 0.8, 0.8)); // breast
  // tail fan — seven banded feathers fanned behind him; from the
  // runner camera this is the hero of the whole show
  const fan = new THREE.Group();
  fan.position.set(-44, 66, 0);
  for (let i = 0; i < 7; i++) {
    const a = -1.05 + i * 0.33;
    const len = 66 - Math.abs(i - 3) * 6;
    const feather = new THREE.Group();
    feather.add(box(5, len, 15, i % 2 ? 0x8a5a2b : 0x6e4520, 0, len / 2, 0));
    feather.add(box(6, 13, 15, 0x2e1c0d, 0, len - 6, 0));
    feather.add(box(6, 7, 15, 0xe8c07a, 0, len - 16, 0));
    feather.rotation.x = a; // fan spreads sideways, flat to the camera behind
    fan.add(feather);
  }
  fan.rotation.z = 0.45; // tips lean back over the tail
  t.add(fan);
  const wing = ball(25, 0x7c5226, -6, 58, 38, 1.05, 0.5, 0.35);
  t.add(wing);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(10, 13, 44, 10), mat(0x7ea6b8));
  neck.position.set(44, 96, 0); neck.rotation.z = -0.5; neck.castShadow = true;
  t.add(neck);
  t.add(ball(16, 0x8fb4c7, 60, 112, 0, 1.1, 0.9, 0.9));
  const beak = new THREE.Mesh(new THREE.ConeGeometry(8, 26, 10), mat(0xf2a541));
  beak.position.set(82, 110, 0); beak.rotation.z = -Math.PI / 2; beak.castShadow = true;
  t.add(beak);
  t.add(ball(7, 0xd63c2f, 66, 94, 0, 0.8, 1.5, 0.8)); // wattle
  t.add(ball(6.5, 0xffffff, 62, 116, 13));
  t.add(ball(3.4, 0x1c1410, 64, 116, 18));
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
  // speech signs are counter-rotated so they face the camera even
  // though the farmer himself faces down the track
  const shout = textSign(96, 27, 'COME BACK, DINNER!', '#a93226', '#fff8e7', 58);
  shout.position.set(0, 300, 0);
  shout.rotation.y = -Math.PI / 2;
  f.add(shout);
  const titleShout = textSign(102, 27, "THERE'S MY DINNER!", '#a93226', '#fff8e7', 56);
  titleShout.position.set(0, 300, 0);
  titleShout.rotation.y = -Math.PI / 2;
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
  g.add(box(58, 92, 6, 0xf7e8c9, 0, 46, 62));
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
  scene.fog = new THREE.Fog(0xf78d2c, 900, 2600);
  const camera = new THREE.PerspectiveCamera(55, VIEW_WIDTH / VIEW_HEIGHT, 10, 6000);

  scene.add(new THREE.HemisphereLight(0xffe9b0, 0x7e5226, 0.34));
  const sunLight = new THREE.DirectionalLight(0xfff2cc, 0.72);
  sunLight.position.set(300, 800, 500);
  sunLight.castShadow = true;
  sunLight.shadow.camera.left = -700; sunLight.shadow.camera.right = 700;
  sunLight.shadow.camera.top = 900; sunLight.shadow.camera.bottom = -400;
  sunLight.shadow.camera.far = 3000;
  sunLight.shadow.mapSize.set(1024, 1024);
  scene.add(sunLight);

  // sky at the end of the track + low sun
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(7600, 2100),
    new THREE.MeshBasicMaterial({
      map: gradientTexture([[0, '#e07b1f'], [0.55, '#f78d2c'], [1, '#ffc93c']]),
      fog: false,
    }),
  );
  sky.position.set(0, 520, -2650);
  scene.add(sky);
  const sunDisc = new THREE.Mesh(
    new THREE.CircleGeometry(90, 26),
    new THREE.MeshBasicMaterial({ color: 0xfff3b0, fog: false }),
  );
  sunDisc.position.set(330, 210, -2600);
  scene.add(sunDisc);
  const sunGlow = glowSprite(460);
  sunGlow.position.set(330, 210, -2550);
  scene.add(sunGlow);

  // the track: a long ground plane whose texture flows toward the camera
  const dirt = dirtTexture();
  const checker = checkerTexture();
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(3400, 4200),
    new THREE.MeshLambertMaterial({ map: dirt }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -1700);
  ground.receiveShadow = true;
  scene.add(ground);
  // lane divider lines
  for (const lx of [-255, -85, 85, 255]) {
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 4200),
      new THREE.MeshBasicMaterial({ color: 0xffe9b0, transparent: true, opacity: 0.38 }),
    );
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(lx, 0.6, -1700);
    scene.add(strip);
  }

  // farmyard set: fences, barns, hills, clouds, pumpkins along the sides
  const farm = new THREE.Group();
  scene.add(farm);
  const sidePosts = [];
  for (let i = 0; i < 34; i++) {
    for (const side of [1, -1]) {
      const post = box(9, 62, 9, 0x7c4a21, side * 305, 31, 0);
      farm.add(post); sidePosts.push(post);
    }
  }
  for (const side of [1, -1]) {
    const rail1 = box(8, 8, 4200, 0x7c4a21, side * 305, 44, -1700);
    const rail2 = box(8, 8, 4200, 0x7c4a21, side * 305, 18, -1700);
    rail1.castShadow = rail2.castShadow = false;
    farm.add(rail1, rail2);
  }
  const barns = [];
  for (let i = 0; i < 4; i++) {
    const barn = buildBarn();
    barn.position.x = (i % 2 ? 1 : -1) * 640;
    barn.rotation.y = (i % 2 ? -1 : 1) * 0.35;
    barns.push(barn); farm.add(barn);
  }
  const hills = [];
  for (let i = 0; i < 4; i++) {
    const hill = ball(430, 0xa86428, (i % 2 ? 1 : -1) * 1020, -95, 0, 1.9, 0.42, 0.6);
    hill.castShadow = false;
    hills.push(hill); farm.add(hill);
  }
  const clouds = [];
  for (let i = 0; i < 5; i++) {
    const cl = new THREE.Group();
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xfff3d6, transparent: true, opacity: 0.92 });
    const c1 = new THREE.Mesh(new THREE.SphereGeometry(74, 18, 12), cloudMat);
    c1.scale.set(1, 0.28, 0.5);
    const c2 = new THREE.Mesh(new THREE.SphereGeometry(52, 18, 12), cloudMat);
    c2.scale.set(1, 0.26, 0.5); c2.position.set(48, -4, 0);
    cl.add(c1, c2);
    cl.position.y = 435 + (i % 2) * 70;
    clouds.push(cl); farm.add(cl);
  }
  const pumpkins = [];
  for (let i = 0; i < 6; i++) {
    const pk = new THREE.Group();
    pk.add(ball(26, 0xe07b2a, 0, 18, 0, 1, 0.78, 1));
    pk.add(box(8, 12, 8, 0x4d7c0f, 0, 42, 0));
    pk.position.x = (i % 2 ? 1 : -1) * 352;
    pumpkins.push(pk); farm.add(pk);
  }

  // kitchen set: a tiled corridor — walls, beams, hanging pans,
  // menu boards on the left wall, windows glowing on the right
  const kitchen = new THREE.Group();
  scene.add(kitchen);
  const tile = tileTexture();
  for (const side of [1, -1]) {
    const wallM = new THREE.Mesh(
      new THREE.PlaneGeometry(4200, 560),
      new THREE.MeshLambertMaterial({ map: tile }),
    );
    wallM.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    wallM.position.set(side * 305, 280, -1700);
    kitchen.add(wallM);
  }
  const beams = [];
  for (let i = 0; i < 10; i++) {
    const beam = box(620, 18, 14, 0x4a2417, 0, 486, 0);
    beams.push(beam); kitchen.add(beam);
  }
  const pans = [];
  for (let i = 0; i < 6; i++) {
    const pan = buildPan();
    pan.position.x = laneX((i % 3) - 1);
    pans.push(pan); kitchen.add(pan);
  }
  const menuDraw = (g, cw, ch) => {
    g.fillStyle = '#3d2317'; g.fillRect(0, 0, cw, ch);
    g.strokeStyle = '#c98d4b'; g.lineWidth = 8; g.strokeRect(6, 6, cw - 12, ch - 12);
    g.textAlign = 'center';
    g.fillStyle = '#ffd94d'; g.font = 'bold 54px Georgia, serif';
    g.fillText("TONIGHT'S MENU", cw / 2, 62);
    g.fillStyle = '#f7e8c9'; g.font = 'bold 46px Georgia, serif';
    g.fillText('ROAST TURKEY — 6 PM', cw / 2, 128);
    g.fillStyle = '#e8a87c'; g.font = 'italic bold 36px Georgia, serif';
    g.fillText('(he has other plans)', cw / 2, 182);
  };
  const menus = [];
  for (let i = 0; i < 3; i++) {
    const menu = makeSign(292, 118, menuDraw);
    menu.rotation.y = Math.PI / 2; // on the left wall, facing inward
    menu.position.set(-298, 300, 0);
    menus.push(menu); kitchen.add(menu);
  }
  const windows = [];
  for (let i = 0; i < 3; i++) {
    const win = new THREE.Group();
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(210, 190),
      new THREE.MeshBasicMaterial({ map: gradientTexture([[0, '#ffe9a8'], [1, '#ffb066']]) }),
    );
    win.add(glow);
    win.add(box(226, 14, 10, 0x4a2417, 0, 95, 4));
    win.add(box(226, 14, 10, 0x4a2417, 0, -95, 4));
    win.add(box(12, 190, 8, 0x4a2417, 0, 0, 4));
    win.rotation.y = -Math.PI / 2; // on the right wall, facing inward
    win.position.set(298, 300, 0);
    windows.push(win); kitchen.add(win);
  }
  kitchen.visible = false;

  // finish line: the Wildwood fence across the track + trees behind
  const finish = new THREE.Group();
  for (let px = -300; px <= 300; px += 75) {
    finish.add(box(14, 108, 14, 0x9c6b30, px, 54, 0));
  }
  finish.add(box(660, 12, 12, 0x9c6b30, 0, 96, 0));
  for (let i = 0; i < 5; i++) {
    const tree = buildTree();
    tree.position.set(-260 + i * 130, 0, -170);
    finish.add(tree);
  }
  const wildSign = textSign(430, 64, '🌲 THE WILDWOOD 🌲', '#2e5d1e', null, 62);
  wildSign.position.set(0, 330, -40);
  finish.add(wildSign);
  finish.visible = false;
  scene.add(finish);

  const turkey = buildTurkey();
  turkey.group.rotation.y = Math.PI / 2; // face down the track, fan to camera
  scene.add(turkey.group);
  const farmer = buildFarmer();
  farmer.group.rotation.y = Math.PI / 2;
  scene.add(farmer.group);

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
    turkey.group.position.set(laneX(t.lane), feetY, 0);
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
    turkey.fan.rotation.z = 0.45 + Math.sin(t.runCycle) * 0.05;
    turkey.ring.visible = !!run.shield;
    turkey.ring.rotation.y = Math.sin(run.time * 2.2) * 0.35;
    turkey.group.visible = run.phase !== 'caught'
      && !(run.invincibleFor > 0 && Math.floor(run.time * 14) % 2 === 0 && run.phase === 'run');

    const f = run.farmer;
    const bob = Math.abs(Math.sin(run.time * 9.2)) * 7;
    farmer.group.visible = run.phase !== 'escaped';
    if (run.phase === 'title') {
      farmer.group.position.set(-198, bob, 150);
    } else if (run.phase === 'caught') {
      farmer.group.position.set(laneX(t.lane) - 30, 0, 70);
    } else {
      // the smaller his gap, the bigger he looms behind you
      farmer.group.position.set(laneX(t.lane) * 0.72 - 118, bob, 300 - f.gap * 0.55);
    }
    const fscale = run.phase === 'run' ? 0.95 + Math.max(0, 130 - f.gap) / 300 : 1;
    farmer.group.scale.set(fscale, fscale, fscale);
    farmer.legs.forEach((leg, i) => {
      leg.rotation.z = Math.sin(run.time * 9.2 + (i ? Math.PI : 0)) * 0.5;
    });
    const reach = 34 + Math.max(0, 150 - f.gap) * 0.5;
    farmer.arms.forEach((arm) => { arm.rotation.z = 1.5 - reach / 420; });
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
    groundTex.offset.y = (scroll * 26 / 4200) % 1;

    if (!inKitchen) {
      sidePosts.forEach((post, i) => {
        const pair = Math.floor(i / 2);
        post.position.z = -(((pair * 92 - scroll) % 3100 + 3100) % 3100) + 200;
      });
      barns.forEach((barn, i) => {
        barn.position.z = -(((i * 1050 - scroll * 0.92) % 4200 + 4200) % 4200) + 380;
      });
      hills.forEach((hill, i) => {
        hill.position.z = -(((i * 800 - scroll * 0.25) % 3200 + 3200) % 3200) - 200;
      });
      clouds.forEach((cl, i) => {
        cl.position.x = ((i * 430 - 900 + run.time * 6) % 1900 + 1900) % 1900 - 950;
        cl.position.z = -(((i * 700 - scroll * 0.1) % 3500 + 3500) % 3500) - 700;
      });
      pumpkins.forEach((pk, i) => {
        pk.position.z = -(((i * 700 - scroll) % 4200 + 4200) % 4200) - 60;
      });
    } else {
      beams.forEach((beam, i) => {
        beam.position.z = -(((i * 430 - scroll) % 4300 + 4300) % 4300) + 200;
      });
      pans.forEach((pan, i) => {
        pan.position.y = 486;
        pan.position.z = -(((i * 690 - scroll) % 4140 + 4140) % 4140) + 150;
      });
      menus.forEach((menu, i) => {
        menu.position.z = -(((i * 1500 - scroll) % 4500 + 4500) % 4500) + 100;
      });
      windows.forEach((win, i) => {
        win.position.z = -(((i * 1500 + 700 - scroll) % 4500 + 4500) % 4500) + 100;
      });
    }

    const metresLeft = GOAL_METRES - run.metres;
    finish.visible = !inKitchen && (metresLeft < 30 || run.phase === 'escaped');
    if (finish.visible) {
      finish.position.z = run.phase === 'escaped' ? -140 : -(metresLeft * PIXELS_PER_METRE);
      wildSign.visible = run.phase === 'run';
    }

    syncPool(pools.obstacles, run.obstacles, buildObstacle, (g, ob) => {
      g.position.set(laneX(ob.lane ?? 0), 0, aheadZ(ob.x));
      if (ob.kind === 'knife' && g.userData.swingG) {
        g.userData.swingG.rotation.z = Math.sin(run.time * 2.6 + ob.swing) * 0.5;
      }
      if (ob.kind === 'oven' && g.userData.flame) {
        const fl = 1 + Math.sin(run.time * 11 + ob.flame) * 0.16;
        g.userData.flame.scale.set(fl, fl, 1);
        g.userData.steam.forEach((puff, sIdx) => {
          const ph = ((run.time * 0.55 + ob.flame + sIdx * 0.33) % 1);
          puff.position.y = 168 + ph * 52;
          puff.position.x = -30 + sIdx * 30 + Math.sin(run.time * 2.4 + sIdx) * 7 * ph;
          puff.material.opacity = 0.5 * (1 - ph);
          const sc = 0.7 + ph * 0.9;
          puff.scale.set(sc, sc * 1.3, sc);
        });
      }
    });
    syncPool(pools.corns, run.corns.filter((c) => !c.taken), buildCorn, (g, c) => {
      const bobY = Math.sin(run.time * 3 + c.bob) * 5;
      g.position.set(laneX(c.lane ?? 0), Y(c.y) + bobY, aheadZ(c.x));
      const sc = c.golden ? 1.5 : 1.15;
      g.scale.set(sc, sc, sc);
      g.rotation.y = Math.sin(run.time * 2 + c.bob) * 0.3;
    });
    syncPool(pools.feathers, (run.feathers || []).filter((fd) => !fd.taken),
      buildFeatherPickup, (g, fd) => {
        g.position.set(laneX(fd.lane ?? 0), Y(fd.y) + Math.sin(run.time * 2.6 + fd.bob) * 6, aheadZ(fd.x));
        g.scale.set(1.4, 1.4, 1.4);
        g.rotation.y = run.time * 1.6 + fd.bob;
      });

    run.particles.forEach((p, i) => {
      const m = particlePool[i % particlePool.length];
      m.visible = true;
      m.position.set(
        laneX(run.turkey.lane) + (p.x - TURKEY.x) * 0.8,
        GROUND_Y - p.y,
        (TURKEY.x - p.x) * 0.9 + 12,
      );
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
      turkey.group.position.set(0, 108, -128); // perched on the finish fence
      turkey.group.visible = true;
    }
    if (run.phase === 'caught') {
      turkey.group.visible = true; // caught turkey stays in frame, squashed
      turkey.group.scale.y = 0.72;
    }

    // camera rides behind the turkey, leaning into his lane
    const tx = laneX(run.turkey.lane);
    camera.position.set(tx * 0.55, 322, 478);
    camera.lookAt(tx * 0.85, 55, -420);
    const targetFov = run.sprinting && run.phase === 'run' ? 60 : 55;
    if (Math.abs(camera.fov - targetFov) > 0.05) {
      camera.fov += (targetFov - camera.fov) * 0.08;
      camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);
  }

  return { draw };
}
