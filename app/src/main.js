// Cover Snap editor: wires the preview canvas, the panel slots, the caption
// and grade controls, and the PNG export. Photos are read on this machine
// only (file input or drag-drop); nothing is uploaded anywhere.
import { drawCover, panelPolygons, pointInPolygon, LAYOUTS, GRADES, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const slotsEl = document.getElementById('slots');

const state = {
  layout: 'triptych',
  grade: 'sunset',
  sizeKey: 'square',
  title: 'Sunset Heist',
  subtitle: 'Vice City — 2026',
  panels: [
    { img: null, zoom: 1, ox: 0, oy: 0 },
    { img: null, zoom: 1, ox: 0, oy: 0 },
    { img: null, zoom: 1, ox: 0, oy: 0 },
    { img: null, zoom: 1, ox: 0, oy: 0 },
  ],
};
let selected = 0;
let fontsReady = false;

function setStatus(text) {
  statusEl.textContent = text;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function applySize() {
  const size = SIZES[state.sizeKey];
  canvas.width = size.w;
  canvas.height = size.h;
  canvas.style.aspectRatio = `${size.w} / ${size.h}`;
}

function redraw() {
  drawCover(canvas, state);
}

function refreshSlots() {
  const count = LAYOUTS[state.layout].panels;
  slotsEl.querySelectorAll('.slot').forEach((el, i) => {
    el.classList.toggle('active', i === selected);
    el.classList.toggle('filled', Boolean(state.panels[i].img));
    el.classList.toggle('unused', i >= count);
    const label = el.querySelector('.slot-state');
    if (label) label.textContent = state.panels[i].label ?? 'empty';
    const zoom = el.querySelector('input[type=range]');
    if (zoom) zoom.value = String(Math.round((state.panels[i].zoom - 1) * 100));
  });
}

function buildSlots() {
  const names = ['A', 'B', 'C', 'D'];
  state.panels.forEach((panel, i) => {
    const el = document.createElement('div');
    el.className = 'slot';
    el.innerHTML = `
      <button type="button" class="slot-pick" title="Select panel ${names[i]}">Panel ${names[i]}</button>
      <span class="slot-state">empty</span>
      <label class="mini">Upload <input type="file" accept="image/*" hidden></label>
      <button type="button" class="mini sample" data-sample="boulevard">Boulevard</button>
      <button type="button" class="mini sample" data-sample="pier">Pier</button>
      <label class="zoom">Zoom <input type="range" min="0" max="150" value="0" step="1"></label>`;
    el.querySelector('.slot-pick').addEventListener('click', () => {
      selected = i;
      refreshSlots();
      setStatus(`Panel ${names[i]} selected — drag the photo on the preview to move it.`);
    });
    el.querySelector('input[type=file]').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) await assignFile(i, file);
      e.target.value = '';
    });
    el.querySelectorAll('.sample').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await assignSample(i, btn.dataset.sample);
      });
    });
    el.querySelector('input[type=range]').addEventListener('input', (e) => {
      state.panels[i].zoom = 1 + Number(e.target.value) / 100;
      redraw();
    });
    slotsEl.appendChild(el);
  });
  refreshSlots();
}

async function assignSample(i, name) {
  try {
    const img = await loadImage(`./samples/${name}.jpg`);
    state.panels[i] = { img, zoom: 1, ox: 0, oy: 0, label: name };
    selected = i;
    refreshSlots();
    redraw();
    setStatus(`Panel ${'ABCD'[i]} now shows the ${name} sample.`);
  } catch {
    setStatus(`Could not load the ${name} sample.`);
  }
}

async function assignFile(i, file) {
  try {
    const img = await loadImage(URL.createObjectURL(file));
    state.panels[i] = { img, zoom: 1, ox: 0, oy: 0, label: file.name.slice(0, 18) };
    selected = i;
    refreshSlots();
    redraw();
    setStatus(`Panel ${'ABCD'[i]} now shows ${file.name}.`);
  } catch {
    setStatus(`Could not read ${file.name} as an image.`);
  }
}

// Drag a photo inside its panel on the preview; wheel zooms the panel.
function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * canvas.width,
    y: ((e.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function hitPanel(x, y) {
  const polys = panelPolygons(state.layout, canvas.width, canvas.height);
  for (let i = polys.length - 1; i >= 0; i--) {
    if (pointInPolygon(x, y, polys[i].poly)) return i;
  }
  return -1;
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const i = hitPanel(p.x, p.y);
  if (i < 0) return;
  selected = i;
  refreshSlots();
  drag = { i, x: p.x, y: p.y, ox: state.panels[i].ox, oy: state.panels[i].oy };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const panel = state.panels[drag.i];
  const polys = panelPolygons(state.layout, canvas.width, canvas.height);
  const box = polys[drag.i].box;
  panel.ox = drag.ox + (p.x - drag.x) / box.w;
  panel.oy = drag.oy + (p.y - drag.y) / box.h;
  panel.ox = Math.max(-0.6, Math.min(0.6, panel.ox));
  panel.oy = Math.max(-0.6, Math.min(0.6, panel.oy));
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = canvasPoint(e);
  const i = hitPanel(p.x, p.y);
  if (i < 0) return;
  const panel = state.panels[i];
  panel.zoom = Math.max(1, Math.min(2.5, panel.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  selected = i;
  refreshSlots();
  redraw();
}, { passive: false });

// Drop a photo file straight onto the preview: it fills the selected panel.
canvas.addEventListener('dragover', (e) => e.preventDefault());
canvas.addEventListener('drop', async (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) await assignFile(selected, file);
});

// Layout, grade and size pickers.
document.querySelectorAll('[data-layout]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.layout = btn.dataset.layout;
    document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('on', b === btn));
    redraw();
    setStatus(`Layout: ${LAYOUTS[state.layout].label} — ${panelPolygons(state.layout, 1, 1).length} panel(s).`);
  });
});
document.querySelectorAll('[data-grade]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.grade = btn.dataset.grade;
    document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('on', b === btn));
    redraw();
    setStatus(`Colour grade: ${GRADES[state.grade].label}.`);
  });
});
document.querySelectorAll('[data-size]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.sizeKey = btn.dataset.size;
    document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('on', b === btn));
    applySize();
    redraw();
    setStatus(`Export size: ${SIZES[state.sizeKey].label}.`);
  });
});

titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });

document.getElementById('fill-all').addEventListener('click', () => {
  const src = state.panels[selected];
  if (!src.img) {
    setStatus('Load a photo into the selected panel first.');
    return;
  }
  state.panels = state.panels.map(() => ({ img: src.img, zoom: 1, ox: 0, oy: 0, label: src.label ?? 'photo' }));
  redraw();
  setStatus('One photo now fills every panel.');
});
document.getElementById('reset-pan').addEventListener('click', () => {
  state.panels[selected] = { ...state.panels[selected], zoom: 1, ox: 0, oy: 0 };
  refreshSlots();
  redraw();
  setStatus('Selected panel re-centred.');
});

// Export: render the current state at the chosen size and download the PNG
// the app itself wrote. Also exposed for the screenshot scenes.
export function exportCoverPNG(sizeKey) {
  const size = SIZES[sizeKey ?? state.sizeKey];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off, state);
  return new Promise((resolve) => off.toBlob(resolve, 'image/png'));
}

document.getElementById('export').addEventListener('click', async () => {
  const size = SIZES[state.sizeKey];
  const blob = await exportCoverPNG(state.sizeKey);
  if (!blob) {
    setStatus('Export failed — try again.');
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `cover-snap-${size.w}x${size.h}.png`;
  a.click();
  setStatus(`Saved cover-snap-${size.w}x${size.h}.png (${Math.round(blob.size / 1024)} KiB).`);
  setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
});

// Test/debug hooks: the app's own state, for the maker's checks.
window.__coverSnap = { state, exportCoverPNG, redraw };

buildSlots();
applySize();
redraw();

if (document.fonts?.load) {
  document.fonts.load('100px Anton').then(() => {
    fontsReady = true;
    redraw();
  }).catch(() => {});
  document.fonts.ready.then(() => { if (!fontsReady) redraw(); });
}

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), {
    state,
    loadImage,
    assignSample,
    applySize,
    redraw,
    exportCoverPNG,
    setStatus,
  });
} else {
  // First visit: preload the pier sample into every panel so the editor
  // already shows a finished-looking cover.
  Promise.all([loadImage('./samples/pier.jpg'), loadImage('./samples/boulevard.jpg')])
    .then(([pier, boulevard]) => {
      state.panels[0] = { img: pier, zoom: 1, ox: 0, oy: 0, label: 'pier' };
      state.panels[1] = { img: boulevard, zoom: 1, ox: 0, oy: 0, label: 'boulevard' };
      state.panels[2] = { img: pier, zoom: 1, ox: 0, oy: 0, label: 'pier' };
      state.panels[3] = { img: boulevard, zoom: 1, ox: 0, oy: 0, label: 'boulevard' };
      refreshSlots();
      redraw();
      setStatus('Samples loaded — pick a layout, drop in your own photo, export.');
    })
    .catch(() => setStatus('Samples did not load — upload a photo to begin.'));
}
