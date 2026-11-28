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
import { ball, box, checkerTexture, dirtTexture, gradientTexture, glowSprite, makeSign, textSign, tileTexture } from './models.js';
import { buildFarmer, buildTurkey } from './actors.js';
import { buildBarn, buildCorn, buildFeatherPickup, buildObstacle, buildPan, buildTree } from './props.js';

const LANE_W = 170;
const Y = (screenY) => GROUND_Y - screenY;
const laneX = (lane) => lane * LANE_W;
const aheadZ = (simX) => -(simX - TURKEY.x);

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
    const flap = t.jumpsUsed === 2 && airborne
      ? Math.sin(run.time * 34) * 0.8 : 0.15 + Math.sin(t.runCycle * 2.4) * 0.07;
    turkey.wing.rotation.x = flap;
    if (turkey.wingL) turkey.wingL.rotation.x = -flap;
    turkey.fan.rotation.z = 0.45 + Math.sin(t.runCycle) * 0.05;
    turkey.ring.visible = !!run.shield;
    turkey.ring.rotation.y = Math.sin(run.time * 2.2) * 0.35;
    turkey.group.visible = run.phase !== 'caught'
      && !(run.invincibleFor > 0 && Math.floor(run.time * 14) % 2 === 0 && run.phase === 'run');

    const f = run.farmer;
    const bob = Math.abs(Math.sin(run.time * 9.2)) * 7;
    farmer.group.visible = run.phase !== 'escaped';
    if (run.phase === 'title') {
      farmer.group.position.set(-172, bob, 118);
    } else if (run.phase === 'caught') {
      farmer.group.position.set(laneX(t.lane) - 30, 0, 70);
    } else {
      // the smaller his gap, the bigger he looms behind you
      farmer.group.position.set(laneX(t.lane) * 0.72 - 118, bob, 300 - f.gap * 0.55);
    }
    const fscale = run.phase === 'run' ? 0.95 + Math.max(0, 130 - f.gap) / 300
      : run.phase === 'title' ? 1.12 : 1;
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
    camera.position.set(tx * 0.55, 292, 438);
    camera.lookAt(tx * 0.85, 58, -420);
    const targetFov = run.sprinting && run.phase === 'run' ? 60 : 55;
    if (Math.abs(camera.fov - targetFov) > 0.05) {
      camera.fov += (targetFov - camera.fov) * 0.08;
      camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);
  }

  return { draw };
}
