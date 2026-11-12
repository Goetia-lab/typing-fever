# Typing Fever

Chill pixel-art visual novel typing game. Ketik kata secepat dan selama mungkin tanpa objektif atau hukuman — isi bar **FEVER**, lalu spam **Space** buat auto-complete kata.

**v1.0.1** · 2026-11-12 · [Changelog](docs/CHANGELOG.md)

## Cara Main
- Buka `index.html` langsung di browser (tanpa build/install).
- Ketik kata yang muncul. Salah ketik tidak ada game over.
- Saat bar **FEVER** penuh, spam **Space** secepatnya.
- Pilih pool kata (8 tema + Acak, 541 kata unik, utamakan Bahasa Indonesia).
- Ditemani **KOKI**, kucing barista pixel yang merespons streak, fever, idle, dan waktu pagi/siang/senja/malam.
- Suara synth WebAudio bisa dibisukan lewat tombol **SUARA** di atas.

## Fitur
- Fever mode, streak, best, day streak (waktu lokal), grafik WPM sesi.
- Efek visual: partikel, screen shake, flash, hujan fever.
- Efek suara: ketik, kata selesai, salah, streak, fever (WebAudio, tanpa aset).
- Aksesibilitas: `aria-live` pada kata, label input, focus visible.

## Tech
- HTML/CSS/JS vanilla, tanpa build, tanpa aset eksternal (font Google Fonts opsional).
- LocalStorage untuk best/streak/pool/suara.

## Changelog
### v1.0.1 — 2026-11-12
- **Suara:** SFX synth WebAudio (ketik, kata selesai, salah, streak, fever) + tombol **SUARA**/**BISU**.
- **Visual:** animasi kata baru masuk, focus visible, scene pagi.
- **Perbaikan:** day streak waktu lokal, WPM tidak menghitung idle, wrong-key reset.
- **Rapi:** CSS/JS dipisah ke `style.css`/`game.js`.
