# Changelog

All notable changes to Typing Fever are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.1] - 2026-11-12

Patch release: audio, visual polish, and correctness fixes.

### Added
- **WebAudio SFX** — type, word complete, wrong, streak, and fever sounds,
  synthesized in code (no audio assets).
- **SUARA / BISU** mute toggle in the top bar; preference persisted to
  `localStorage` (`tf_sound`).

### Improved
- Extracted inline CSS/JS into `style.css` and `game.js` (smaller `index.html`,
  easier maintenance).
- New-word enter animation now plays (`#word.enter .ch`).
- `focus-visible` outlines for pool and sound buttons.
- Added `scene-pagi` background; day/night scenes now cover the full day.
- README corrected (541 unique words, 8 themes + Acak) and expanded.

### Fixed
- Day streak uses local time (no more UTC `toISOString` date skips).
- WPM no longer counts idle time (active-ms guard).
- Wrong-key highlight resets correctly on the next correct key.

## [1.0.0] - 2026-11-12

Initial release.
