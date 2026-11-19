# Cover Snap — STATUS

## Apa yang dibangun

Cover Snap: pembuat cover-art ala poster GTA 6, aplikasi web statis offline
(`app/`, tanpa build step, tanpa network request saat jalan).

- **4 layout panel**: Solo, Split, Triptych, Quad — panel miring (split/triptych)
  dan grid 2x2 (quad), tiap panel bisa diisi foto yang sama atau berbeda.
- **Foto**: upload sendiri (file input per panel + drag-drop ke preview),
  drag geser untuk posisi, scroll/slider untuk zoom, tombol "One photo in
  all panels" dan "Re-centre panel". Dua foto sampel starter
  (boulevard.jpg, pier.jpg) tetap dipakai.
- **Caption**: judul besar + subjudul, bisa diedit; lettering display tebal
  (Anton, OFL, file di `app/fonts/`) dengan echo magenta, keyline gelap,
  dan rule emas.
- **Colour grade**: Sunset, Neon Night, Pastel Day — gradient wash, matahari
  retro bergaris, halftone dots, vignette, grain deterministik, keyline poster.
- **Export PNG** satu klik di 1080x1080, 1080x1350, 1920x1080, nama file
  `cover-snap-<WxH>.png`. Editor: live preview, panel picker, kontrol
  caption/grade — foto ke PNG dalam beberapa langkah.
- Desain orisinal: tanpa logo/wordmark/artwork/font Rockstar. Satu-satunya
  font adalah Anton (SIL OFL), lisensi dicantumkan di `app/fonts/OFL.txt`.

File sumber (ditulis segar di sesi ini): `app/index.html`, `app/style.css`,
`app/src/cover.js` (render engine), `app/src/main.js` (editor),
`app/src/shots.js` (scene screenshot). `main.ts` ditulis dalam 2 pesan
(write + revisi). README mengikuti template resmi (3 badge live make.fun +
footer referral `?ref=aa4mcy45`). `.makefun/owner.json` berisi wallet
`GpjYmQrta6MUx3Xbg3WiBRnXzfUpcPWJV4SnXWGQuzux`.

## Hasil uji lokal (headless Chromium, file:// + --allow-file-access-from-files)

- Font Anton ter-load; canvas menggambar; semua panel terisi sampel.
- Ganti layout ke Quad, ganti grade ke Neon, edit judul — semua jalan.
- Export via fungsi export app sendiri: square 2.352.859 byte,
  portrait 2.920.404 byte, wide 3.975.031 byte (PNG valid).
- Upload file ke panel A: label `boulevard.jpg`; drag preview menggeser
  foto (delta ox 0,303); slider zoom ke 1,5x.
- **0 console error, 0 page error, 0 network request** di semua run
  (editor, 4 scene screenshot, dan export).
- `main.ts` dijalankan 2x: `out/` byte-identik — dossier.json sha256
  `37d3cd0cd0d744e1f50b589b54a17121530d0660eb58152310390eece5725b26`.
- Kit check (`node cli/makefun.mjs check --kit <kit> --repo <repo> --worktree`):
  **4 passed, 0 failed, 17 skipped** (transcript checks jalan di server),
  5 "at submission" (repo_public, repo_owner, repo_created_after_open,
  commit_in_repo, duplicate_snapshot — dicek saat submit; repo belum di-push,
  owner.json sudah di-commit).

## Gate

- app/: 9 file, 323.737 byte (batas 993 file / 48 MiB).
- index.html: 2.973 byte (batas 1 MiB).
- dossier.json: 763.429 byte (batas 1,5 MiB).
- Screenshot (4 file, semua <= 256 KiB, sisi panjang <= 1280, sisi pendek >= 480):
  - `1-cover.jpg` 1280x720, 109.360 byte — cover hasil export app (1920x1080, triptych, sunset).
  - `2-editor.jpg` 1280x1280, 139.463 byte — editor, foto ter-load, layout split, sunset.
  - `3-cover.jpg` 1024x1280, 142.318 byte — cover hasil export app (1080x1350, triptych, neon).
  - `4-editor.jpg` 1280x1280, 154.612 byte — editor, layout quad, neon.
- Cover di screenshot 1 & 3 adalah PNG yang ditulis app sendiri
  (via `exportCoverPNG`), ditampilkan apa adanya sebagai `<img>` — bukan
  digambar manual / diedit / dikomposit.

## Commit & recording

- Commit SHA final: `2f39253` (commit build; HEAD final setelah commit STATUS ini — lihat laporan akhir builder)
- Branch: master, repo: https://github.com/rismzz/gta6-cover-art-01.git
- Recording id: 01a1f38e-7a18-77cf-b755-096ff09e3190
- Batas submit: max 5/hari, 10 total; entries close 2026-11-21T10:30Z.

## Blocker

Tidak ada. Satu catatan: kit check "at submission" (repo_public dkk.)
baru bisa lolos setelah repo di-push ke GitHub — itu urusan agen utama.

**SIAP SUBMIT — menunggu agen utama.**
