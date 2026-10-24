import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  Procedural texture atelier for the Hall of Supreme Harmony         */
/* ------------------------------------------------------------------ */

function seededRandom(seed = 1) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasOf(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext('2d') };
}

function textureOf(canvas, {
  anisotropy = 1,
  repeat = null,
  srgb = true,
  clamp = false,
} = {}) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = anisotropy;
  if (clamp) {
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
  } else {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
  }
  if (repeat) texture.repeat.set(repeat[0], repeat[1]);
  texture.needsUpdate = true;
  return texture;
}

function marbleCanvas(seed = 3) {
  const { canvas, ctx } = canvasOf(768, 768);
  const random = seededRandom(seed);
  const gradient = ctx.createLinearGradient(0, 0, 768, 768);
  gradient.addColorStop(0, '#eeeae0');
  gradient.addColorStop(0.48, '#ddd8cc');
  gradient.addColorStop(1, '#f2eee5');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 768, 768);

  // Soft mottling
  for (let i = 0; i < 900; i += 1) {
    const x = random() * 768;
    const y = random() * 768;
    const radius = 4 + random() * 74;
    const shade = random() > 0.56 ? 255 : 132;
    const alpha = 0.008 + random() * 0.022;
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    g.addColorStop(0, `rgba(${shade},${shade - 3},${shade - 8},${alpha})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  // Faint, wind-blown veins
  for (let i = 0; i < 15; i += 1) {
    ctx.beginPath();
    let x = -80 + random() * 920;
    let y = random() * 768;
    ctx.moveTo(x, y);
    for (let j = 0; j < 5; j += 1) {
      const nx = x + 70 + random() * 150;
      const ny = y + (random() - 0.5) * 110;
      ctx.quadraticCurveTo(x + (nx - x) * 0.38, y + (random() - 0.5) * 130, nx, ny);
      x = nx;
      y = ny;
    }
    ctx.strokeStyle = random() > 0.4
      ? `rgba(128,126,120,${0.045 + random() * 0.06})`
      : `rgba(255,255,255,${0.16 + random() * 0.12})`;
    ctx.lineWidth = 0.5 + random() * 2.2;
    ctx.stroke();
  }

  // Quiet joints, like massive stone slabs
  ctx.strokeStyle = 'rgba(110,105,95,0.17)';
  ctx.lineWidth = 2;
  for (let p = 192; p < 768; p += 192) {
    ctx.beginPath();
    ctx.moveTo(0, p + (random() - 0.5) * 2);
    ctx.lineTo(768, p + (random() - 0.5) * 2);
    ctx.stroke();
  }
  for (let p = 256; p < 768; p += 256) {
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, 768);
    ctx.stroke();
  }
  return canvas;
}

function pavingCanvas(seed = 17) {
  const { canvas, ctx } = canvasOf(1024, 1024);
  const random = seededRandom(seed);
  ctx.fillStyle = '#77766f';
  ctx.fillRect(0, 0, 1024, 1024);

  const rowH = 64;
  const colW = 128;
  for (let row = 0; row < 16; row += 1) {
    const offset = row % 2 === 0 ? 0 : -colW / 2;
    for (let col = -1; col < 9; col += 1) {
      const x = col * colW + offset;
      const y = row * rowH;
      const tone = 111 + Math.floor(random() * 35);
      ctx.fillStyle = `rgb(${tone},${tone - 1},${tone - 5})`;
      ctx.fillRect(x + 2, y + 2, colW - 4, rowH - 4);
      ctx.fillStyle = `rgba(255,250,235,${0.026 + random() * 0.035})`;
      ctx.fillRect(x + 4, y + 4, colW - 8, 2);
      ctx.fillStyle = `rgba(30,27,22,${0.04 + random() * 0.08})`;
      ctx.fillRect(x + 2, y + rowH - 5, colW - 4, 3);
    }
  }

  for (let i = 0; i < 8000; i += 1) {
    const x = random() * 1024;
    const y = random() * 1024;
    const dark = random() > 0.46;
    ctx.fillStyle = dark
      ? `rgba(25,24,20,${random() * 0.09})`
      : `rgba(225,220,206,${random() * 0.07})`;
    ctx.fillRect(x, y, 1 + random() * 3, 1 + random() * 2);
  }
  return canvas;
}

function roofCanvas(seed = 29) {
  const { canvas, ctx } = canvasOf(768, 768);
  const random = seededRandom(seed);

  ctx.fillStyle = '#bc7f0c';
  ctx.fillRect(0, 0, 768, 768);

  // Glazed barrel-tile columns. Gold at the crown of each rounded tile.
  const tileW = 48;
  for (let x = 0; x < 768; x += tileW) {
    const grad = ctx.createLinearGradient(x, 0, x + tileW, 0);
    grad.addColorStop(0.00, '#633806');
    grad.addColorStop(0.10, '#945c06');
    grad.addColorStop(0.34, '#d99a16');
    grad.addColorStop(0.48, '#ffdc61');
    grad.addColorStop(0.58, '#eeb52d');
    grad.addColorStop(0.78, '#a66a08');
    grad.addColorStop(0.92, '#734606');
    grad.addColorStop(1.00, '#5f3703');
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, tileW, 768);

    ctx.fillStyle = 'rgba(255,236,171,0.42)';
    ctx.fillRect(x + tileW * 0.44, 0, 2.4, 768);
    ctx.fillStyle = 'rgba(44,24,2,0.38)';
    ctx.fillRect(x + 1, 0, 2.3, 768);
  }

  // Overlapping courses of glazed tiles
  for (let y = 0; y < 768; y += 32) {
    ctx.save();
    ctx.strokeStyle = 'rgba(67,37,3,0.54)';
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 768; x += 24) {
      ctx.lineTo(x, y + Math.sin(x / 48) * 2.2);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,235,154,0.34)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, y + 5);
    for (let x = 0; x <= 768; x += 24) {
      ctx.lineTo(x, y + 5 + Math.sin(x / 48) * 2.2);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Weather staining
  for (let i = 0; i < 380; i += 1) {
    const x = random() * 768;
    const y = random() * 768;
    const r = 2 + random() * 22;
    ctx.fillStyle = random() > 0.45
      ? `rgba(69,48,14,${random() * 0.055})`
      : `rgba(255,213,98,${random() * 0.045})`;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.25 + random() * 0.8), random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

function beamCanvas(seed = 41) {
  const { canvas, ctx } = canvasOf(1024, 192);
  const random = seededRandom(seed);

  const grad = ctx.createLinearGradient(0, 0, 0, 192);
  grad.addColorStop(0, '#193b38');
  grad.addColorStop(0.46, '#235751');
  grad.addColorStop(1, '#102f2c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 192);

  ctx.strokeStyle = '#b98c3f';
  ctx.lineWidth = 5;
  ctx.strokeRect(7, 7, 1010, 178);
  ctx.strokeStyle = 'rgba(240,204,122,0.5)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(15, 15, 994, 162);

  // Imperial blue-green painted scrollwork
  for (let x = 34; x < 1000; x += 124) {
    ctx.save();
    ctx.translate(x, 96);
    ctx.strokeStyle = '#c79c4c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 48);
    ctx.bezierCurveTo(-52, 34, -54, -38, -12, -48);
    ctx.bezierCurveTo(32, -58, 58, -10, 24, 22);
    ctx.bezierCurveTo(-2, 45, -30, 12, -4, -2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(229,204,137,0.52)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.bezierCurveTo(-40, 24, -40, -28, -8, -37);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = 'rgba(199,156,76,0.8)';
    ctx.beginPath();
    ctx.arc(x + 62, 96, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(199,156,76,0.42)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 62, 96, 12, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let i = 0; i < 160; i += 1) {
    ctx.fillStyle = `rgba(255,240,194,${random() * 0.025})`;
    ctx.fillRect(random() * 1024, random() * 192, 2, 2);
  }
  return canvas;
}

function doorCanvas(seed = 53) {
  const { canvas, ctx } = canvasOf(512, 1408);
  const random = seededRandom(seed);

  const red = ctx.createLinearGradient(0, 0, 512, 0);
  red.addColorStop(0, '#73170f');
  red.addColorStop(0.18, '#982216');
  red.addColorStop(0.52, '#a92b1c');
  red.addColorStop(0.82, '#812016');
  red.addColorStop(1, '#66140d');
  ctx.fillStyle = red;
  ctx.fillRect(0, 0, 512, 1408);

  for (let i = 0; i < 90; i += 1) {
    ctx.strokeStyle = `rgba(${random() > 0.5 ? '255,175,120' : '45,7,3'},${random() * 0.045})`;
    ctx.lineWidth = 0.5 + random() * 2;
    ctx.beginPath();
    const x = random() * 512;
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + 5, 470, x - 4, 920, x + 2, 1408);
    ctx.stroke();
  }

  // The upper lattice -- a deep green counterpoint to the vermilion
  const latticeTop = 44;
  const latticeBottom = 476;
  ctx.fillStyle = '#0c2926';
  ctx.fillRect(26, latticeTop, 460, latticeBottom - latticeTop);
  const gold = ctx.createLinearGradient(0, latticeTop, 0, latticeBottom);
  gold.addColorStop(0, '#f3d181');
  gold.addColorStop(0.35, '#c99a43');
  gold.addColorStop(0.72, '#f2cd75');
  gold.addColorStop(1, '#9a6b26');
  ctx.strokeStyle = gold;
  ctx.lineWidth = 7;
  ctx.strokeRect(35, latticeTop + 8, 442, latticeBottom - latticeTop - 16);

  ctx.save();
  ctx.beginPath();
  ctx.rect(42, latticeTop + 14, 428, latticeBottom - latticeTop - 30);
  ctx.clip();
  ctx.lineWidth = 4.2;
  ctx.strokeStyle = 'rgba(212,166,82,0.85)';
  for (let x = -420; x < 620; x += 42) {
    ctx.beginPath();
    ctx.moveTo(x, latticeTop);
    ctx.lineTo(x + 360, latticeBottom);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 360, latticeTop);
    ctx.lineTo(x, latticeBottom);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(244,208,125,0.75)';
  ctx.lineWidth = 3;
  for (let y = latticeTop + 32; y < latticeBottom; y += 44) {
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(472, y);
    ctx.stroke();
  }
  ctx.restore();

  // Gold borders and horizontal rails
  ctx.strokeStyle = '#bc8b37';
  ctx.lineWidth = 7;
  ctx.strokeRect(14, 14, 484, 1380);
  ctx.fillStyle = '#caa14c';
  ctx.fillRect(18, 489, 476, 13);
  ctx.fillStyle = 'rgba(255,226,156,0.42)';
  ctx.fillRect(18, 489, 476, 3);
  ctx.fillStyle = '#9b6b22';
  ctx.fillRect(18, 502, 476, 5);

  // Nine rows of gilded door nails -- the imperial number
  const rows = 9;
  const cols = 5;
  const startY = 588;
  const gapY = 78;
  const gapX = 80;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = 96 + col * gapX + (row % 2) * 0;
      const y = startY + row * gapY;
      const glow = ctx.createRadialGradient(x - 6, y - 8, 1, x, y, 22);
      glow.addColorStop(0, '#ffe6a0');
      glow.addColorStop(0.23, '#e2b755');
      glow.addColorStop(0.65, '#9d6c22');
      glow.addColorStop(1, 'rgba(71,42,9,0.3)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,232,165,0.5)';
      ctx.beginPath();
      ctx.arc(x - 4, y - 5, 3.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // A pair of ring handles, cast in bronze
  ctx.strokeStyle = '#d3a94c';
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.arc(256, 1158, 42, 0.10 * Math.PI, 0.90 * Math.PI);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,231,160,0.48)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(256, 1158, 40, 0.15 * Math.PI, 0.84 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = '#bb8a32';
  ctx.beginPath();
  ctx.arc(256, 1098, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,231,161,0.58)';
  ctx.beginPath();
  ctx.arc(250, 1091, 7, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

function latticeCanvas(seed = 67) {
  const { canvas, ctx } = canvasOf(512, 640);
  ctx.fillStyle = '#0c2523';
  ctx.fillRect(0, 0, 512, 640);

  const gold = ctx.createLinearGradient(0, 0, 512, 640);
  gold.addColorStop(0, '#c2984b');
  gold.addColorStop(0.45, '#f0ce7f');
  gold.addColorStop(1, '#9e702d');

  ctx.strokeStyle = gold;
  ctx.lineWidth = 18;
  ctx.strokeRect(11, 11, 490, 618);
  ctx.strokeStyle = 'rgba(249,221,149,0.55)';
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, 456, 584);

  ctx.save();
  ctx.beginPath();
  ctx.rect(34, 34, 444, 572);
  ctx.clip();
  ctx.strokeStyle = 'rgba(211,171,91,0.9)';
  ctx.lineWidth = 5;
  for (let x = -580; x < 800; x += 65) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 580, 640);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 580, 0);
    ctx.lineTo(x, 640);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(245,210,128,0.64)';
  ctx.lineWidth = 2.4;
  for (let y = 72; y < 640; y += 82) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  for (let x = 72; x < 512; x += 92) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 640);
    ctx.stroke();
  }
  ctx.restore();

  // A small central gilt medallion
  ctx.fillStyle = 'rgba(178,133,60,0.24)';
  ctx.beginPath();
  ctx.arc(256, 320, 105, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(240,206,126,0.9)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(256, 320, 90, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(256, 320, 62, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(205,159,78,0.75)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(a) * 63, 320 + Math.sin(a) * 63);
    ctx.lineTo(256 + Math.cos(a) * 89, 320 + Math.sin(a) * 89);
    ctx.stroke();
  }
  return canvas;
}

function plaqueCanvas() {
  const { canvas, ctx } = canvasOf(1280, 400);
  const random = seededRandom(12);
  const grad = ctx.createLinearGradient(0, 0, 0, 400);
  grad.addColorStop(0, '#112e39');
  grad.addColorStop(0.5, '#0c232d');
  grad.addColorStop(1, '#091b23');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 400);

  // Ornate imperial border
  const gold = ctx.createLinearGradient(0, 0, 1280, 400);
  gold.addColorStop(0, '#8e641e');
  gold.addColorStop(0.25, '#e3bd68');
  gold.addColorStop(0.52, '#b1822f');
  gold.addColorStop(0.76, '#f3d27c');
  gold.addColorStop(1, '#8a5d1a');
  ctx.strokeStyle = gold;
  ctx.lineWidth = 24;
  ctx.strokeRect(12, 12, 1256, 376);
  ctx.strokeStyle = 'rgba(255,219,138,0.55)';
  ctx.lineWidth = 3;
  ctx.strokeRect(33, 33, 1214, 334);
  ctx.strokeStyle = 'rgba(198,152,64,0.7)';
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, 1184, 304);

  for (let x = 72; x < 1210; x += 68) {
    for (const y of [36, 364]) {
      ctx.fillStyle = 'rgba(211,166,78,0.8)';
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(211,166,78,0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Cloud scrolls in the corners
  ctx.strokeStyle = 'rgba(205,165,82,0.28)';
  ctx.lineWidth = 3;
  for (const [cx, cy, flip] of [[180, 200, 1], [1100, 200, -1]]) {
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(cx + flip * i * 26, cy - 32 + i * 27, 18 + i * 3, 0.25, Math.PI * 1.75);
      ctx.stroke();
    }
  }

  // Gold characters, with an engraved shadow
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '600 178px "Songti SC", "STSong", "Noto Serif CJK SC", serif';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 7;
  const textGrad = ctx.createLinearGradient(0, 90, 0, 310);
  textGrad.addColorStop(0, '#ffe8a1');
  textGrad.addColorStop(0.42, '#d7aa4d');
  textGrad.addColorStop(0.7, '#f4d47e');
  textGrad.addColorStop(1, '#a57424');
  ctx.fillStyle = textGrad;
  ctx.fillText('太  和  殿', 640, 210);
  ctx.shadowColor = 'transparent';

  // Fine aged specks
  for (let i = 0; i < 100; i += 1) {
    ctx.fillStyle = `rgba(255,228,165,${random() * 0.05})`;
    ctx.fillRect(random() * 1280, random() * 400, 2, 2);
  }
  return canvas;
}

function carvedStoneCanvas(seed = 79) {
  const { canvas, ctx } = canvasOf(512, 1024);
  const random = seededRandom(seed);

  const grad = ctx.createLinearGradient(0, 0, 512, 1024);
  grad.addColorStop(0, '#d7d1c4');
  grad.addColorStop(0.45, '#c8c2b5');
  grad.addColorStop(1, '#ded8cc');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 1024);

  ctx.strokeStyle = 'rgba(116,111,102,0.28)';
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, 496, 1008);
  ctx.strokeStyle = 'rgba(255,252,241,0.52)';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(16, 16, 480, 992);

  // A lightly suggested cloud-dragon relief, kept monochrome and quiet
  ctx.save();
  ctx.translate(256, 520);
  ctx.strokeStyle = 'rgba(110,103,91,0.36)';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-108, 240);
  ctx.bezierCurveTo(-190, 170, -80, 60, -18, 124);
  ctx.bezierCurveTo(40, 185, -78, 278, 4, 328);
  ctx.bezierCurveTo(80, 372, 152, 284, 126, 216);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-140, 42);
  ctx.bezierCurveTo(-110, -80, 40, -60, 38, 54);
  ctx.bezierCurveTo(34, 150, 158, 100, 164, -16);
  ctx.bezierCurveTo(170, -130, 6, -198, -62, -112);
  ctx.stroke();

  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(105,98,86,0.28)';
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    const y = -340 + i * 128;
    ctx.arc(-150 + (i % 2) * 90, y, 44 + i * 5, 0.2, Math.PI * 1.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(170 - (i % 2) * 70, y + 46, 30 + i * 4, 0.4, Math.PI * 1.8);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = 'rgba(248,244,233,0.16)';
  for (let i = 0; i < 240; i += 1) {
    ctx.beginPath();
    ctx.arc(random() * 512, random() * 1024, 0.5 + random() * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  return canvas;
}

function cloudCanvas(seed = 89) {
  const { canvas, ctx } = canvasOf(1024, 512);
  const random = seededRandom(seed);
  ctx.clearRect(0, 0, 1024, 512);

  // Soft cloud puffs, pre-rendered on a small tile to keep their edges feathered.
  const puff = document.createElement('canvas');
  puff.width = 256;
  puff.height = 256;
  const puffCtx = puff.getContext('2d');
  const puffGradient = puffCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
  puffGradient.addColorStop(0, 'rgba(255,250,240,0.42)');
  puffGradient.addColorStop(0.32, 'rgba(255,246,232,0.27)');
  puffGradient.addColorStop(0.66, 'rgba(255,243,226,0.09)');
  puffGradient.addColorStop(1, 'rgba(255,242,225,0)');
  puffCtx.fillStyle = puffGradient;
  puffCtx.fillRect(0, 0, 256, 256);

  // A broad, soft bank with a few taller shoulders.
  for (let i = 0; i < 44; i += 1) {
    const x = 220 + random() * 590;
    const centerBias = 1 - Math.abs(x - 512) / 512;
    const y = 310 + (random() - 0.5) * 72 - centerBias * 24;
    const rx = 52 + random() * 150;
    const ry = 16 + random() * 52;
    ctx.globalAlpha = 0.55 + random() * 0.4;
    ctx.drawImage(puff, x - rx, y - ry, rx * 2, ry * 2);
  }
  for (let i = 0; i < 12; i += 1) {
    const x = 350 + random() * 340;
    const y = 265 + random() * 40;
    const rx = 50 + random() * 90;
    const ry = 22 + random() * 38;
    ctx.globalAlpha = 0.42 + random() * 0.24;
    ctx.drawImage(puff, x - rx, y - ry, rx * 2, ry * 2);
  }
  ctx.globalAlpha = 1;

  // Fine, almost transparent fibres pull the edges apart.
  ctx.strokeStyle = 'rgba(255,248,238,0.035)';
  ctx.lineWidth = 14;
  for (let i = 0; i < 20; i += 1) {
    const x = 200 + random() * 630;
    const y = 310 + (random() - 0.5) * 100;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 100, y - 32, x + 260, y + 12, x + 380, y - 12);
    ctx.stroke();
  }
  return canvas;
}

function plasterCanvas(seed = 97) {
  const { canvas, ctx } = canvasOf(512, 512);
  const random = seededRandom(seed);
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#b8422d');
  grad.addColorStop(0.5, '#a63423');
  grad.addColorStop(1, '#8f291b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4500; i += 1) {
    const light = random() > 0.5;
    ctx.fillStyle = light
      ? `rgba(255,190,152,${random() * 0.035})`
      : `rgba(69,8,4,${random() * 0.045})`;
    ctx.fillRect(random() * 512, random() * 512, 1 + random() * 2, 1 + random() * 2);
  }
  return canvas;
}

export function createTextures(renderer) {
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return {
    marble: textureOf(marbleCanvas(), { anisotropy, repeat: [2, 2] }),
    marblePlain: textureOf(marbleCanvas(8), { anisotropy, repeat: [1, 1] }),
    paving: textureOf(pavingCanvas(), { anisotropy, repeat: [18, 18] }),
    carving: textureOf(carvedStoneCanvas(), { anisotropy, clamp: true }),
    roof: textureOf(roofCanvas(), { anisotropy, repeat: [1, 1] }),
    beam: textureOf(beamCanvas(), { anisotropy, repeat: [2, 1] }),
    door: textureOf(doorCanvas(), { anisotropy, clamp: true }),
    lattice: textureOf(latticeCanvas(), { anisotropy, clamp: true }),
    plaque: textureOf(plaqueCanvas(), { anisotropy, clamp: true }),
    cloud: textureOf(cloudCanvas(), { anisotropy, clamp: true }),
    plaster: textureOf(plasterCanvas(), { anisotropy, repeat: [4, 3] }),
  };
}
