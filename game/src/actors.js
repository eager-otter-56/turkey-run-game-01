// Gobble Run! 3D — the actors: Tom the turkey (banded tail fan, wattle,
// flapping wing, shield ring) and Farmer Hank (overalls, straw hat,
// reaching arms, speech signs), each modelled from primitives.

import { ball, box, mat, textSign } from './models.js';

export function buildTurkey() {
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

export function buildFarmer() {
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
