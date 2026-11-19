// Cover Snap entry program (Node 22, standard library only). The app lives in
// this directory's app/ folder: plain static files a desktop browser opens
// offline (app/index.html plus its ES modules, the vendored Anton font and two
// sample photos; no library, no network request). This program hands it in:
// it copies app/ and screenshots/ from beside this file into the output
// directory and writes /output/dossier.json, the summary the judge reads,
// using the vendored make.fun library. The cover maker itself is the app:
// multi-panel layouts, drag-to-position photos, editable caption, sunset /
// neon / pastel grades, and one-click PNG export at 1080x1080, 1080x1350 or
// 1920x1080.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// (Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.)
// Serve the app to try it with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
if (!existsSync(join(here, 'app', 'index.html'))) {
  throw new Error('app/index.html is missing — nothing to hand in');
}
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's caps: only text_max_bytes changes the dossier's bytes. The
// rest refuse an entry the scorer would refuse anyway (more than 4
// screenshots, one over 256 KiB; app/ over 993 files or 48 MiB in all, or a
// path under app/ over 1000 bytes; app/ shares /output's own 1000-entry cap
// with screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
console.log(`Cover Snap entry written to ${out}`);

