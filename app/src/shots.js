// Fixed scenes for screenshots. `?shot=editor` shows the editor with a sample
// photo loaded; `?shot=cover` shows the PNG the app itself exported, as an
// <img> of the exported file scaled to the viewport — never edited or drawn
// by hand. Query keys: photo, layout, grade, size, title, subtitle.
// window.__shotReady is set once the scene is painted.
export async function runShot(shot, query, api) {
  const { state, loadImage, assignSample, applySize, redraw, exportCoverPNG } = api;
  const photo = query.get('photo') ?? 'pier';
  const layout = query.get('layout');
  if (layout && ['single', 'split', 'triptych', 'quad'].includes(layout)) {
    state.layout = layout;
    document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('on', b.dataset.layout === layout));
  }
  const grade = query.get('grade');
  if (grade && ['sunset', 'neon', 'pastel'].includes(grade)) {
    state.grade = grade;
    document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('on', b.dataset.grade === grade));
  }
  const title = query.get('title');
  if (title !== null) {
    state.title = title;
    document.getElementById('title').value = title;
  }
  const subtitle = query.get('subtitle');
  if (subtitle !== null) {
    state.subtitle = subtitle;
    document.getElementById('subtitle').value = subtitle;
  }
  const sizeKey = query.get('size');
  if (sizeKey && ['square', 'portrait', 'wide'].includes(sizeKey)) {
    state.sizeKey = sizeKey;
    document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('on', b.dataset.size === sizeKey));
  }

  // Load the sample into the panels the layout uses: pier first, then
  // boulevard, alternating, so multi-panel shots show different photos.
  const samples = [photo, photo === 'pier' ? 'boulevard' : 'pier'];
  const count = state.layout === 'single' ? 1 : state.layout === 'split' ? 2 : state.layout === 'triptych' ? 3 : 4;
  for (let i = 0; i < count; i++) {
    await assignSample(i, samples[i % 2]);
  }
  // Give the panels a little life: slight zoom and offset on some.
  if (count > 1) {
    state.panels[1].zoom = 1.25;
    state.panels[1].oy = -0.06;
  }
  if (count > 2) {
    state.panels[2].zoom = 1.15;
    state.panels[2].ox = 0.05;
  }

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    try {
      await document.fonts?.load('100px Anton');
    } catch {
      // Anton may already be ready; the cover still draws.
    }
    applySize();
    redraw();
    const blob = await exportCoverPNG(state.sizeKey);
    const url = URL.createObjectURL(blob);
    const img = document.createElement('img');
    img.id = 'exported-cover';
    img.alt = 'Cover exported by Cover Snap';
    img.src = url;
    document.getElementById('stage').appendChild(img);
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
    return;
  }

  // editor scene: keep the normal editor visible with the photo loaded.
  applySize();
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
