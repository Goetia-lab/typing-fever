# Changelog

All notable changes to Typing Fever are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.1.0] - 2026-11-13

Sprite overhaul + correctness fixes.

### Added
- **KOKI pixel-art overhaul** — redesigned via `pxl` (pixel-art-as-code):
  proper palette with shading ramps, directional light, auto outline.
  Source of truth: `art/koki.px.js`; game data regenerated into
  `sprites.js` by `scripts/extract-sprites.mjs`.
- **Two new poses** — `blink` (auto-blinks every ~4 s while idle) and
  `fever` (gold-glint eyes, open cheering mouth, sparkles; shown while
  FEVER mode is active).
- Sprite detail: tabby forehead stripes, whisker dots, barista apron with
  stitch line, held coffee cup with steam, shaded curling tail.

### Fixed
- WPM idle handling: activity gaps longer than 4 s are now skipped
  entirely (previously they still accumulated while not typing).
- Hidden `#ghost` input no longer accumulates text on desktop
  (cleared on its `input` event; it only exists to open the mobile keyboard).
- Word DOM is rebuilt only for a new word; keystrokes now update character
  classes only, so screen readers announce a word once instead of on every
  keypress.

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
