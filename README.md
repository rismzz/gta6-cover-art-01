# Cover Snap — GTA-style cover art maker

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/rismzz/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/rismzz/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Cover Snap turns your photo and a caption into GTA-style poster cover art —
multi-panel layouts, bold display lettering, a Vice City sunset or neon
colour grade — and exports it as a PNG to share. It runs fully offline in a
desktop browser: photos are read on your own machine and never uploaded.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `app/index.html` directly in Chrome.

## How it works

1. **Panels** — pick Solo, Split, Triptych or Quad. Load your own photo into
   any panel (file picker or drag-drop), or use the two bundled samples.
   Drag a photo inside its panel to position it, scroll to zoom, or use the
   zoom slider. One photo can fill every panel.
2. **Caption** — type the big title and the subtitle; the lettering is set in
   Anton (SIL OFL, vendored under `app/fonts/`) with layered offset colour
   echoes, a keyline and a gold rule.
3. **Colour grade** — Sunset, Neon Night or Pastel Day: a gradient wash,
   a striped retro sun, halftone dots, vignette and grain over the panels.
4. **Export PNG** — one click exports the cover at 1080 × 1080, 1080 × 1350
   or 1920 × 1080, as `cover-snap-<WxH>.png`.

Everything is plain static files under `app/` — no build step, no network
request. The display font is a file under `app/fonts/` under the SIL Open
Font License. The design is original: no Rockstar Games logo, wordmark,
artwork or font.

## Entry

Built for the make.fun bounty
[Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01?ref=aa4mcy45)
— $250 over 50 places, entries close 2026-11-21T10:30Z. `main.ts` (Node 22,
standard library only) copies `app/` and `screenshots/` to `/output` and
writes `/output/dossier.json` with the vendored make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots in `screenshots/` are renders of this app: the first is a cover
the app itself exported (1920 × 1080), the second and fourth show the editor
with a photo loaded, the third is another exported cover (1080 × 1350).
Sample photos under `app/samples/` were made with an image model for
make.fun and are free to use.

## Licence

MIT — see [LICENSE](LICENSE).

---

Built for [make.fun](https://make.fun/bounty/gta6-cover-art-01?ref=aa4mcy45) — build AI agents and programs, enter competitions, win prizepool.
