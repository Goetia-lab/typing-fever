# Typing Fever

Chill pixel-art visual novel typing game. Ketik kata secepat dan selama mungkin tanpa objektif atau hukuman — isi bar **FEVER**, lalu spam **Space** buat auto-complete kata.

**v1.1.0** · 2026-11-13 · [Changelog](docs/CHANGELOG.md)

## Screenshot

| Awal | Mengetik | Kata Selesai | Fever |
|---|---|---|---|
| ![Awal](docs/screenshots/01-awal.png) | ![Mengetik](docs/screenshots/02-mengetik.png) | ![Kata Selesai](docs/screenshots/03-kata-selesai.png) | ![Fever](docs/screenshots/04-fever.png) |

## Cara Main
- Buka `index.html` langsung di browser (tanpa build/install).
- Ketik kata yang muncul. Salah ketik tidak ada game over.
- Saat bar **FEVER** penuh, spam **Space** secepatnya.
- Pilih pool kata (8 tema + Acak, 541 kata unik, utamakan Bahasa Indonesia).
- Ditemani **KOKI**, kucing barista pixel yang merespons streak, fever, idle, dan waktu pagi/siang/senja/malam. Idle otomatis kedip, ada pose fever & zzz saat tidur.
- Suara synth WebAudio bisa dibisukan lewat tombol **SUARA** di atas.

## Fitur
- Fever mode, streak, best, day streak (waktu lokal), grafik WPM sesi.
- Efek visual: partikel, screen shake, flash, hujan fever.
- Efek suara: ketik, kata selesai, salah, streak, fever (WebAudio, tanpa aset).
- Sprite KOKI pixel-art premium: palette + ramp shading, cahaya arah, outline otomatis, 5 pose (idle, blink, happy, sleep, fever).
- Aksesibilitas: `aria-live` pada kata (diumumkan sekali per kata, bukan per ketukan), label input, focus visible.

## Tech
- HTML/CSS/JS vanilla, tanpa build, tanpa aset eksternal (font Google Fonts opsional). Sprite di-embed sebagai data di `sprites.js`.
- Sumber sprite: `art/koki.px.js` (pxl, pixel-art-as-code), diekstrak ke `sprites.js` via `node scripts/extract-sprites.mjs`.
- LocalStorage untuk best/streak/pool/suara.

## Changelog
### v1.1.0 — 2026-11-13
- **Sprite:** KOKI didesain ulang via pxl — palette + ramp shading, cahaya kiri-atas, outline, 5 pose (2 baru: blink & fever), auto-blink tiap ~4 detik.
- **Perbaikan:** WPM idle >4s diskip penuh, input ghost tak lagi menumpuk, DOM kata dibangun ulang hanya untuk kata baru (screen reader tidak spam).
### v1.0.1 — 2026-11-12
- **Suara:** SFX synth WebAudio (ketik, kata selesai, salah, streak, fever) + tombol **SUARA**/**BISU**.
- **Visual:** animasi kata baru masuk, focus visible, scene pagi.
- **Perbaikan:** day streak waktu lokal, WPM tidak menghitung idle, wrong-key reset.
- **Rapi:** CSS/JS dipisah ke `style.css`/`game.js`.
