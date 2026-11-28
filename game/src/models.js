// Gobble Run! 3D — the modelling toolbox: every mesh, sign and texture
// in the game is built from three.js primitives and canvas textures in
// code. No model files, no image files, no network.

export function mat(color, opts = {}) {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

export function box(w, h, d, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

export function ball(r, color, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 34, 24), mat(color));
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  return m;
}

export function makeSign(w, h, draw) {
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

export function textSign(w, h, label, fg, bg, fontPx = 64) {
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

export function glowSprite(scale, color = '255, 217, 77') {
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

export function gradientTexture(stops, w = 64, h = 512) {
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

export function plaidTexture() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  g.fillStyle = '#a93226'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = 'rgba(70,16,12,0.55)';
  g.fillRect(0, 0, 26, 128); g.fillRect(64, 0, 26, 128);
  g.fillRect(0, 0, 128, 26); g.fillRect(0, 64, 128, 26);
  g.fillStyle = 'rgba(247,232,201,0.5)';
  g.fillRect(40, 0, 5, 128); g.fillRect(104, 0, 5, 128);
  g.fillRect(0, 40, 128, 5); g.fillRect(0, 104, 128, 5);
  const tex = new THREE.CanvasTexture(cv);
  tex.encoding = THREE.sRGBEncoding;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

export function dirtTexture() {
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

export function checkerTexture() {
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

export function tileTexture() {
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
