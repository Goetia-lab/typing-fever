# Changelog

All notable changes to Typing Fever are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.2.0] - 2026-11-13

Minor release: Cozy Barista & Flow Update.

### Added
- **Espresso Flow Rush** — Fever mode now keeps typing; typos are auto-forgiven,
  short words are prioritised, and rewards are doubled (x3 with Double Espresso).
  Legacy `space` spam still available via `CONFIG.fever_mode_type`.
- **Lookahead word queue** — next two words shown faintly under the active word
  (`#nextwords`, `aria-hidden`), tuned by `CONFIG.lookahead_count`.
- **Warm pentatonic audio engine** — `sfx('key')` uses a major-pentatonic ladder
  with a lowpass filter; three typing profiles: Retro Blip, Creamy Thock,
  Mesin Tik Klasik.
- **KOKI Companion 2.0** — Bond Level (1-10) from lifetime words, contextual
  dialogue per pool/performance, and level-up lore.
- **Kedai Kopi KOKI** — bean economy (`tf_beans`), shop modal with 7 items
  (sounds, drinks, themes, rain ambience), and daily quests (Daily Brew).
- **Procedural rain ambience** — Paul Kellet pink noise loop, lowpass 650 Hz,
  toggled by the HUJAN button after unlocking Rintik Hujan.
- **Struk Shift Kafe** — session receipt modal with stats, barista note, and
  PNG export (360x540 canvas).
- **Midnight Roast theme** — high-contrast `scene-midnight` background.

### Improved
- Modal focus trap: `#ghost` no longer steals focus or pops the mobile keyboard
  while the KAFE/STRUK drawer is open; Fever timer pauses during a modal.
- Daily state (`tf_daily_state`) resets automatically on a new local date.
- Closed modals are removed from the accessibility tree (`visibility: hidden`),
  so a screen reader no longer reads the shop/receipt while they are shut.
- `#word` keeps its character spans between keystrokes: `aria-live` now announces
  the active word once instead of on every typed letter.
- Fever words are drawn from the 3-5 character band (`CONFIG.fever_word_max_len`)
  and the queue is re-picked when Fever starts, so the first Fever word is short.
- Pool dialogue unlocks at Bond Lv.2, matching the PRD progression table.

### Fixed
- Removed redundant `clearTimeout`/`clearInterval` guards.
- `drawGraph` stray paren.
- Hidden `#ghost` input can no longer accumulate text: it is cleared on its
  `input` event (and it only exists to open the mobile keyboard).
- Gold "LENCANA EMAS" badge now appears on the Struk Shift (HTML and PNG) at
  Bond Lv.10, and KOKI tells their backstory when Bond reaches Lv.5.
- Word pool count corrected: 440 unique words (541 themed entries, 101 words
  appear in more than one themed pool; `acak` is the union of all 8).
- **HUJAN button** now toggles the rain ambience. It rendered after unlocking
  Rintik Hujan but had no click handler, so pressing it did nothing.

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
