// Gobble Run! 3D — the props: every hazard and set piece on the track —
// hay bales, fences, haystacks, the glowing oven, stools, the swinging
// carving knife, corn and feather pickups, the barn, hanging pans, pines.

import { ball, box, glowSprite, mat, textSign } from './models.js';

export function buildObstacle(ob) {
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

export function buildCorn(c) {
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

export function buildFeatherPickup() {
  const g = new THREE.Group();
  g.add(glowSprite(96, '174, 230, 255'));
  const feather = ball(11, 0xfdfdf8, 0, 0, 0, 0.85, 2.2, 0.35);
  feather.rotation.z = 0.5;
  g.add(feather);
  g.add(ball(9, 0xffd94d, 10, 16, 0, 0.8, 1, 0.4));
  return g;
}

export function buildBarn() {
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

export function buildPan() {
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

export function buildTree() {
  const g = new THREE.Group();
  g.add(box(14, 60, 14, 0x6b4223, 0, 30, 0));
  const cone = new THREE.Mesh(new THREE.ConeGeometry(70, 170, 12), mat(0x5d8a2f));
  cone.position.y = 140; cone.castShadow = true;
  g.add(cone);
  return g;
}
