// Cover Snap render engine: draws a multi-panel GTA-style poster cover onto a
// 2D canvas. Everything is geometry relative to the canvas size, so the same
// state renders the live preview and every export size (1080x1080, 1080x1350,
// 1920x1080). No network, no fonts beyond the vendored Anton file.

export const LAYOUTS = {
  single: { panels: 1, label: 'Solo' },
  split: { panels: 2, label: 'Split' },
  triptych: { panels: 3, label: 'Triptych' },
  quad: { panels: 4, label: 'Quad' },
};

export const GRADES = {
  sunset: { label: 'Sunset' },
  neon: { label: 'Neon Night' },
  pastel: { label: 'Pastel Day' },
};

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080' },
};

// Polygons (as [x, y] point lists) for each panel of a layout, plus the
// bounding box the photo cover-fits into. Slanted cuts lean the same way,
// like the diagonal strips on a poster.
export function panelPolygons(layout, w, h) {
  const rect = (x, y, rw, rh) => ({
    poly: [[x, y], [x + rw, y], [x + rw, y + rh], [x, y + rh]],
    box: { x, y, w: rw, h: rh },
  });
  if (layout === 'single') return [rect(0, 0, w, h)];
  if (layout === 'split') {
    const s = w * 0.045;
    return [
      { poly: [[0, 0], [w / 2 + s, 0], [w / 2 - s, h], [0, h]], box: { x: 0, y: 0, w: w / 2 + s, h } },
      { poly: [[w / 2 + s, 0], [w, 0], [w, h], [w / 2 - s, h]], box: { x: w / 2 - s, y: 0, w: w / 2 + s, h } },
    ];
  }
  if (layout === 'triptych') {
    const s = w * 0.03;
    const a = w / 3;
    const b = (2 * w) / 3;
    return [
      { poly: [[0, 0], [a + s, 0], [a - s, h], [0, h]], box: { x: 0, y: 0, w: a + s, h } },
      { poly: [[a + s, 0], [b + s, 0], [b - s, h], [a - s, h]], box: { x: a - s, y: 0, w: b - a + 2 * s, h } },
      { poly: [[b + s, 0], [w, 0], [w, h], [b - s, h]], box: { x: b - s, y: 0, w: w - b + s, h } },
    ];
  }
  // quad: clean 2x2 grid with a thin dark gutter.
  const g = Math.max(6, Math.round(w * 0.008));
  const hw = (w - g) / 2;
  const hh = (h - g) / 2;
  return [
    rect(0, 0, hw, hh),
    rect(hw + g, 0, hw, hh),
    rect(0, hh + g, hw, hh),
    rect(hw + g, hh + g, hw, hh),
  ];
}

export function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Deterministic pseudo-random generator so the grain looks the same on
// every render of the same cover.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let noisePattern = null;
function getNoise(ctx) {
  if (noisePattern) return noisePattern;
  const tile = document.createElement('canvas');
  tile.width = 160;
  tile.height = 160;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(160, 160);
  const rand = mulberry32(20261119);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rand() * 255);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  tctx.putImageData(img, 0, 0);
  noisePattern = ctx.createPattern(tile, 'repeat');
  return noisePattern;
}

function tracePoly(ctx, poly) {
  ctx.beginPath();
  ctx.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
  ctx.closePath();
}

function drawPhotoInto(ctx, panel, photo) {
  const { box } = panel;
  ctx.save();
  tracePoly(ctx, panel.poly);
  ctx.clip();
  if (!photo || !photo.img) {
    const grad = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h);
    grad.addColorStop(0, '#3a1c5e');
    grad.addColorStop(1, '#12081f');
    ctx.fillStyle = grad;
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = Math.max(2, box.w * 0.004);
    for (let d = -box.h; d < box.w; d += Math.max(24, box.w * 0.08)) {
      ctx.beginPath();
      ctx.moveTo(box.x + d, box.y + box.h);
      ctx.lineTo(box.x + d + box.h, box.y);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `${Math.max(14, box.w * 0.055)}px Anton, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD PHOTO', box.x + box.w / 2, box.y + box.h / 2);
    ctx.restore();
    return;
  }
  const img = photo.img;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const zoom = photo.zoom || 1;
  const base = Math.max(box.w / iw, box.h / ih) * zoom;
  const pw = iw * base;
  const ph = ih * base;
  const cx = box.x + box.w / 2 + (photo.ox || 0) * box.w;
  const cy = box.y + box.h / 2 + (photo.oy || 0) * box.h;
  ctx.drawImage(img, cx - pw / 2, cy - ph / 2, pw, ph);
  ctx.restore();
}

function drawSun(ctx, w, h, grade) {
  const cx = w * 0.5;
  const cy = h * 0.15;
  const r = Math.min(w, h) * 0.125;
  const grad = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  if (grade === 'neon') {
    grad.addColorStop(0, '#ffe95e');
    grad.addColorStop(0.45, '#ff7a3d');
    grad.addColorStop(1, '#ff2e88');
  } else if (grade === 'pastel') {
    grad.addColorStop(0, '#fff3b0');
    grad.addColorStop(0.5, '#ffb3c6');
    grad.addColorStop(1, '#ff8fa3');
  } else {
    grad.addColorStop(0, '#ffd166');
    grad.addColorStop(0.5, '#ff7b54');
    grad.addColorStop(1, '#e63973');
  }
  ctx.save();
  ctx.globalAlpha = grade === 'pastel' ? 0.5 : 0.62;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  // Retro stripe cuts across the sun's lower half, widening downward.
  ctx.globalCompositeOperation = 'destination-out';
  let y = cy + r * 0.08;
  let gap = r * 0.045;
  while (y < cy + r) {
    ctx.fillRect(cx - r - 2, y, r * 2 + 4, gap);
    y += gap + r * 0.16;
    gap *= 1.45;
  }
  ctx.restore();
}

function drawGradeWash(ctx, w, h, grade) {
  let wash;
  if (grade === 'neon') {
    wash = ctx.createLinearGradient(0, 0, w, h);
    wash.addColorStop(0, 'rgba(0,229,255,0.14)');
    wash.addColorStop(0.5, 'rgba(120,40,220,0.10)');
    wash.addColorStop(1, 'rgba(255,0,128,0.20)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  } else if (grade === 'pastel') {
    wash = ctx.createLinearGradient(0, 0, 0, h);
    wash.addColorStop(0, 'rgba(255,214,224,0.12)');
    wash.addColorStop(1, 'rgba(140,200,255,0.12)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
  } else {
    wash = ctx.createLinearGradient(0, 0, 0, h);
    wash.addColorStop(0, 'rgba(255,140,60,0.10)');
    wash.addColorStop(0.55, 'rgba(255,60,120,0.14)');
    wash.addColorStop(1, 'rgba(90,20,140,0.20)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'soft-light';
    const warm = ctx.createLinearGradient(0, h * 0.4, 0, h);
    warm.addColorStop(0, 'rgba(255,120,40,0)');
    warm.addColorStop(1, 'rgba(255,80,40,0.55)');
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }
}

function drawHalftoneStrip(ctx, w, h, bandTop) {
  const spacing = Math.max(9, Math.round(w / 110));
  const stripH = h * 0.055;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  for (let row = 0; row * spacing < stripH; row++) {
    const y = bandTop - stripH + row * spacing;
    const t = row / Math.max(1, Math.floor(stripH / spacing));
    const r = 0.6 + t * spacing * 0.32;
    for (let col = 0; col * spacing < w + spacing; col++) {
      const x = col * spacing + (row % 2 ? spacing / 2 : 0);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawTitleBlock(ctx, w, h, title, subtitle) {
  const bandTop = h * 0.68;
  const band = ctx.createLinearGradient(0, bandTop - h * 0.06, 0, h);
  band.addColorStop(0, 'rgba(12,4,24,0)');
  band.addColorStop(0.35, 'rgba(12,4,24,0.72)');
  band.addColorStop(1, 'rgba(8,2,16,0.92)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandTop - h * 0.06, w, h - bandTop + h * 0.06);
  drawHalftoneStrip(ctx, w, h, bandTop);

  const text = (title || '').trim().toUpperCase() || 'COVER SNAP';
  let size = h * 0.15;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const fit = (s) => {
    ctx.font = `${s}px Anton, sans-serif`;
    return ctx.measureText(text).width;
  };
  while (size > 16 && fit(size) > w * 0.92) size -= 4;
  ctx.font = `${size}px Anton, sans-serif`;
  const ty = h - h * 0.1;
  // Layered offset lettering: magenta echo, dark drop, white face, dark keyline.
  ctx.fillStyle = '#ff2e88';
  ctx.fillText(text, w / 2 + size * 0.045, ty + size * 0.05);
  ctx.fillStyle = 'rgba(5,2,12,0.85)';
  ctx.fillText(text, w / 2 + size * 0.02, ty + size * 0.075);
  ctx.lineWidth = Math.max(2, size * 0.03);
  ctx.strokeStyle = 'rgba(5,2,12,0.9)';
  ctx.strokeText(text, w / 2, ty);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, w / 2, ty);

  const sub = (subtitle || '').trim().toUpperCase();
  if (sub) {
    const subSize = Math.max(13, h * 0.032);
    ctx.font = `${subSize}px Anton, sans-serif`;
    try {
      ctx.letterSpacing = `${Math.round(subSize * 0.42)}px`;
    } catch {
      // Older engines ignore letterSpacing; the subtitle still draws.
    }
    const sw = ctx.measureText(sub).width;
    const sy = h - h * 0.035;
    ctx.fillStyle = '#ffd166';
    ctx.fillText(sub, w / 2, sy);
    const ruleY = sy - subSize * 0.32;
    const ruleLen = Math.min(w * 0.12, (w - sw) / 2 - w * 0.04);
    if (ruleLen > 10) {
      ctx.strokeStyle = 'rgba(255,209,102,0.8)';
      ctx.lineWidth = Math.max(1.5, subSize * 0.08);
      ctx.beginPath();
      ctx.moveTo(w / 2 - sw / 2 - w * 0.02 - ruleLen, ruleY);
      ctx.lineTo(w / 2 - sw / 2 - w * 0.02, ruleY);
      ctx.moveTo(w / 2 + sw / 2 + w * 0.02, ruleY);
      ctx.lineTo(w / 2 + sw / 2 + w * 0.02 + ruleLen, ruleY);
      ctx.stroke();
    }
    try {
      ctx.letterSpacing = '0px';
    } catch {
      // ignore
    }
  }
}

function drawVignetteAndGrain(ctx, w, h) {
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(5,0,12,0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = getNoise(ctx);
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  // Thin poster keyline.
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = Math.max(2, w * 0.003);
  ctx.strokeRect(w * 0.015, h * 0.015, w * 0.97, h * 0.97);
}

// Draws the whole cover for `state` onto `canvas` at its own size.
// state: { layout, grade, title, subtitle, panels: [{img, zoom, ox, oy}] }
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#160a24';
  ctx.fillRect(0, 0, w, h);
  const panels = panelPolygons(state.layout, w, h);
  const gap = Math.max(3, Math.round(w * 0.006));
  panels.forEach((panel, i) => {
    drawPhotoInto(ctx, panel, state.panels[i]);
  });
  // Dark gutters between the slanted panels.
  if (panels.length > 1) {
    ctx.strokeStyle = 'rgba(8,2,16,0.9)';
    ctx.lineWidth = gap;
    ctx.lineJoin = 'round';
    panels.forEach((panel, i) => {
      if (i === 0) return;
      ctx.beginPath();
      ctx.moveTo(panel.poly[0][0], panel.poly[0][1]);
      ctx.lineTo(panel.poly[3][0], panel.poly[3][1]);
      ctx.stroke();
    });
  }
  drawSun(ctx, w, h, state.grade);
  drawGradeWash(ctx, w, h, state.grade);
  drawTitleBlock(ctx, w, h, state.title, state.subtitle);
  drawVignetteAndGrain(ctx, w, h);
}
