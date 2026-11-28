// Gobble Run! 3D — the actors: Tom the turkey (eleven-feather banded
// tail fan, snood and wattle, two flapping wings, toed feet) and Farmer
// Hank (plaid shirt, overall straps and buttons, beard, and a carving
// fork in his reaching hand), each modelled from primitives at a
// resolution that holds up when the runner camera sits close behind.

import { ball, box, mat, plaidTexture, textSign } from './models.js';

export function buildTurkey() {
  const t = new THREE.Group();
  const body = ball(46, 0x8a5a2b, 0, 58, 0, 1.25, 0.85, 0.92);
  t.add(body);
  t.add(ball(33, 0x77511f, -16, 52, 0, 1.05, 0.9, 0.95)); // rump feather mass
  t.add(ball(30, 0x9c6b30, 26, 50, 0, 1, 0.8, 0.8)); // breast
  t.add(ball(17, 0x9c6b30, 2, 84, 22, 1.1, 0.55, 0.6)); // shoulder feather tufts
  t.add(ball(17, 0x9c6b30, 2, 84, -22, 1.1, 0.55, 0.6));
  // tail fan — eleven banded feathers fanned behind him; from the
  // runner camera this is the hero of the whole show
  const fan = new THREE.Group();
  fan.position.set(-44, 66, 0);
  for (let i = 0; i < 11; i++) {
    const a = -1.15 + i * 0.225;
    const len = 70 - Math.abs(i - 5) * 4.5;
    const feather = new THREE.Group();
    feather.add(box(5, len, 13, i % 2 ? 0x8a5a2b : 0x6e4520, 0, len / 2, 0));
    feather.add(box(6, 14, 13, 0x2e1c0d, 0, len - 7, 0));
    feather.add(box(6, 8, 13, 0xe8c07a, 0, len - 18, 0));
    feather.rotation.x = a; // fan spreads sideways, flat to the camera behind
    fan.add(feather);
  }
  fan.rotation.z = 0.45; // tips lean back over the tail
  t.add(fan);
  const wing = ball(25, 0x7c5226, -6, 58, 38, 1.05, 0.5, 0.35);
  t.add(wing);
  const wingL = ball(25, 0x7c5226, -6, 58, -38, 1.05, 0.5, 0.35);
  t.add(wingL);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(10, 13, 44, 14), mat(0x7ea6b8));
  neck.position.set(44, 96, 0); neck.rotation.z = -0.5; neck.castShadow = true;
  t.add(neck);
  t.add(ball(16, 0x8fb4c7, 60, 112, 0, 1.1, 0.9, 0.9));
  for (let c = 0; c < 3; c++) { // crest feathers on top of his head
    const crest = new THREE.Mesh(new THREE.ConeGeometry(3.6, 15, 8), mat(0x8fb4c7));
    crest.position.set(52 + c * 6, 126, -5 + c * 5);
    crest.rotation.z = -0.35 + c * 0.18;
    t.add(crest);
  }
  const beak = new THREE.Mesh(new THREE.ConeGeometry(8, 26, 16), mat(0xf2a541));
  beak.position.set(82, 110, 0); beak.rotation.z = -Math.PI / 2; beak.castShadow = true;
  t.add(beak);
  t.add(ball(5, 0xd63c2f, 76, 116, 0, 0.75, 1.7, 0.75)); // snood over the beak
  t.add(ball(7, 0xd63c2f, 66, 94, 0, 0.8, 1.5, 0.8)); // wattle
  for (const side of [1, -1]) { // an eye on each side of the head
    t.add(ball(6.5, 0xffffff, 62, 116, 13 * side));
    t.add(ball(3.4, 0x1c1410, 64, 116, 18 * side));
  }
  const legs = [];
  for (const side of [1, -1]) {
    const leg = new THREE.Group();
    leg.add(ball(11, 0x8a5a2b, 0, -2, 0, 1, 0.8, 0.8)); // thigh
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 38, 10), mat(0xe07b2a));
    shin.position.y = -19;
    leg.add(shin);
    leg.add(box(20, 5, 9, 0xe07b2a, 5, -38, 0));
    for (const toe of [-1, 0, 1]) { // three toes a foot
      const toeM = box(11, 4, 5, 0xe07b2a, 15, -39, toe * 6);
      toeM.rotation.y = toe * 0.35;
      leg.add(toeM);
    }
    leg.position.set(-4 * side, 34, 10 * side);
    legs.push(leg);
    t.add(leg);
  }
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(96, 4, 12, 48),
    new THREE.MeshBasicMaterial({ color: 0xaee6ff, transparent: true, opacity: 0.75 }),
  );
  ring.position.set(0, 62, 0);
  t.add(ring);
  return { group: t, wing, wingL, legs, ring, fan };
}

export function buildFarmer() {
  const f = new THREE.Group();
  const legs = [];
  for (const side of [1, -1]) {
    const leg = new THREE.Group();
    leg.add(box(17, 62, 19, 0x2a3f66, 0, -31, 0));
    leg.add(box(26, 10, 30, 0x3a2a18, 4, -64, 0));
    leg.add(box(10, 12, 30, 0x2c1e10, 14, -60, 0)); // boot toe cap
    leg.position.set(0, 66, 13 * side);
    legs.push(leg);
    f.add(leg);
  }
  f.add(box(62, 80, 44, 0x2f4a7d, 2, 104, 0)); // overalls
  for (const side of [1, -1]) { // overall straps over the shoulders
    f.add(box(11, 42, 6, 0x2f4a7d, 16, 152, 13 * side));
    f.add(ball(3.6, 0xf2c14e, 21, 134, 13 * side)); // brass button
  }
  const shirt = new THREE.Mesh(
    new THREE.BoxGeometry(70, 38, 48),
    new THREE.MeshLambertMaterial({ map: plaidTexture() }),
  );
  shirt.position.set(2, 162, 0);
  shirt.castShadow = true;
  f.add(shirt); // plaid shirt block
  const arms = [];
  for (const side of [1, -1]) {
    const arm = new THREE.Group();
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 7.5, 30, 12),
      new THREE.MeshLambertMaterial({ map: plaidTexture() }));
    sleeve.position.y = -15;
    arm.add(sleeve);
    const limb = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.5, 48, 12), mat(0xe8b08a));
    limb.position.y = -52;
    arm.add(limb);
    arm.add(ball(9, 0xe8b08a, 0, -78, 0, 0.9, 1.1, 0.9)); // hand
    if (side === 1) { // the carving fork, prongs toward the turkey
      const fork = new THREE.Group();
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 34, 10), mat(0x5d3c1a));
      handle.position.y = -14;
      fork.add(handle);
      fork.add(box(5, 16, 14, 0xd7dee6, 0, -36, 0));
      for (const pz of [-4.5, 4.5]) fork.add(box(3.4, 17, 3.4, 0xd7dee6, 0, -50, pz));
      fork.position.set(2, -80, 0);
      fork.rotation.z = 0.25;
      arm.add(fork);
    }
    arm.position.set(26, 168, 16 * side);
    arm.rotation.z = 1.45; // reaching forward toward the turkey
    arms.push(arm);
    f.add(arm);
  }
  f.add(ball(21, 0xe8b08a, 2, 196, 0));
  f.add(ball(6, 0xe0a37e, 21, 194, 0, 0.9, 0.8, 0.9)); // nose
  for (const side of [1, -1]) f.add(ball(5, 0xe8b08a, 2, 198, 20 * side, 0.6, 0.9, 0.6)); // ears
  f.add(ball(13, 0x8a2f23, 10, 182, 0, 1, 0.75, 1)); // beard
  f.add(ball(9, 0x7e2118, 14, 176, 9, 0.9, 0.8, 0.9)); // beard tufts
  f.add(ball(9, 0x7e2118, 14, 176, -9, 0.9, 0.8, 0.9));
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(33, 33, 6, 26), mat(0xe8c07a));
  brim.position.set(2, 212, 0); brim.castShadow = true;
  f.add(brim);
  f.add(box(68, 5, 10, 0xb03a2e, 2, 208, 0)); // hat band
  const top = new THREE.Mesh(new THREE.CylinderGeometry(18, 20, 24, 20), mat(0xe8c07a));
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
