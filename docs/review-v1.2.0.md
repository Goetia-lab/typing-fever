# Review v1.2.0 — Cozy Barista & Flow Update

Applied CC Game Studio skill rubrics to the shipped v1.2.0 build:
`balance-check`, `team-audio` (audio-director), `ux-review` +
`accessibility-specialist`, `smoke-check`.

Build under review: `v1.2.0` rebased onto `v1.1.0` (KOKI sprite overhaul),
i.e. the union of both branches — sprite/renderer/boot from v1.1.0, all PRD
v1.2.0 features on top. See **Post-merge addendum** (§5) for the re-run and
the one defect it found.

## 1. Balance Check: Bean Economy & Bond Progression

### Data Sources Analyzed
- `config.js` — tuning knobs (PRD §5.1 registry equivalent)
- `game.js` — faucets, sinks, bond formula, fever rules
- `words.js` — 9 pools, 440 unique words
- `full_prd_patch_v1_2_typing_fever_cozy_barista_flow_update.md` — design targets
  (used as the GDD; `design/registry/entities.yaml` is **ABSENT**, so the PRD is
  the sole target source)

### Health Summary: HEALTHY

Every tunable that the PRD states a value for matches the implementation exactly.
No outlier is outside its stated target. Two findings are below the outlier
threshold and are listed in *Values That Need Attention*.

### Outliers Detected
| Item/Value | Expected Range | Actual | Issue |
|-----------|---------------|--------|-------|
| `fever_gain` | 5 | 5 | — |
| `fever_max` | 100 | 100 | — |
| `fever_drain_ms` | 10000 | 10000 | — |
| `fever_word_max_len` | 5 | 5 | — |
| `lookahead_count` | 2 | 2 | — |
| `koki_talk_interval` | 18 | 18 | — |
| Bond formula | `min(10, 1+floor(sqrt(tw/35)))` | identical (`game.js:112`) | — |
| Bond thresholds | 35 / 140 / 560 / 1260 / 2835 | 35 / 140 / 560 / 1260 / 2835 | — |
| Shop prices | 0/80/100/120/150/180/250 | identical (`game.js:674-681`) | — |
| Daily quest rewards | 25/30/35 | identical (`game.js:813-815`) | — |
| Normal word reward | +1 | +1 | — |
| Lv3 streak bonus | +1 per streak 10 | +1 per streak 10 | — |
| Lv7 fever bonus | +1.5 s | +1500 ms | — |
| Lv2 pool dialogue | unlocks at Lv2 | `bondLevel() >= 2` | — |
| Lv5 lore | unlocks at Lv5 | `blNow >= 5` | — |
| Lv10 gold badge | HTML + PNG | both render | — |
| Fever reward | +2 (+3 espresso) | identical | — |
| Fever word band | 3–5, fallback 3–7, then whole pool | `game.js:127-133` | — |

### Degenerate Strategies Found
1. **Legacy `space` mode bean farming** (non-default). With
   `CONFIG.fever_mode_type.value = 'space'`, `completeWord(true)` fires on every
   Space keypress without any typing (`game.js:1000-1003`): ~5–10 words/s → the
   full 880-bean shop in ~90 s. **Sanctioned by PRD §4.1.3** ("perilaku lama
   spam Space tetap berfungsi") and off by default; recorded as a known cheat
   path, not a defect.
2. **OS-clock quest re-roll.** `tf_daily_state` is keyed on the local date, so
   moving the system clock back re-rolls the three daily quests. Inherent to the
   serverless design PRD §4.7 mandates; no server-side fix exists for this
   product.

No unintended strategy is faster than typing in the default `flow` mode.

### Progression Analysis
Bond curve from `1 + floor(sqrt(totalWords/35))`, cap 10 — smooth quadratic,
no dead zone, no power spike:

| Level | Words | Title | Unlock | At 100 wpm | At 250 wpm |
|---|---|---|---|---|---|
| 1 | 0 | Pelanggan Baru | — | 0:00 | 0:00 |
| 2 | 35 | Tamu Kenalan | pool dialogue | 0:21 | 0:08 |
| 3 | 140 | Teman Ngopi | +1 bean per streak 10 | 1:24 | 0:34 |
| 4 | 315 | — | — | 3:09 | 1:16 |
| 5 | 560 | Barista Magang | KOKI lore | 5:36 | 2:14 |
| 6 | 875 | — | — | 8:45 | 3:30 |
| 7 | 1260 | Sahabat Kedai | +1.5 s Fever | 12:36 | 5:02 |
| 8 | 1715 | — | — | 17:09 | 6:52 |
| 9 | 2240 | — | — | 22:24 | 8:58 |
| 10 | 2835 | Keluarga KOKI | gold badge | 28:21 | 11:21 |

Lv10 lands in 1 session for a fast typist and ~3 sessions for a 100 wpm player,
against PRD §2.1's 7–12 min session target. Healthy retention curve for a
cosmetic track.

### Recommendations
| Priority | Issue | Suggested Fix | Impact |
|----------|-------|--------------|--------|
| — | none blocking | — | — |

### Values That Need Attention
- **Shop total 880 beans vs. faucet rate — no stated range, not judged.** The PRD
  sets no target for "time to unlock everything". Measured: 880 beans costs
  ~2.1 min at 250 wpm, ~5.8 min at 100 wpm, ~10.5 min at 60 wpm (faucet =
  1 bean/word + fever 2/word + 90/day quests). Consistent with the zero-pressure
  guardrail (PRD §2.2.1), but a designer should confirm the intended session
  count. Add a target to the PRD before treating this as a metric.
- **PRD §2.1 session-length target (7–12 min) — NOT ASSESSED — NO DATA.** Needs
  session analytics; static data cannot measure session duration.
- **`thock` attack ramp is 5 ms, PRD §4.3 table states 4 ms.** `blip()` hardcodes
  `t + 0.005`. 1 ms is below perceptual threshold; change to `t + 0.004` if exact
  parity is wanted.

---

## 2. Audio Review: Warm Pentatonic Engine

Rubric: audio-director (palette, event architecture, mix strategy, adaptive
audio) + accessibility-specialist (visual indicators for important sounds).

### Verdict: PASS — one cosmetic deviation

### Specification parity
| PRD §4.3 item | Target | Actual | Verdict |
|---|---|---|---|
| Node chain | Oscillator/Noise → BiquadFilter(lowpass) → Gain envelope → destination | `blip()` `game.js:493-514` | ✓ |
| Pentatonic ladder | `f_base · 2^((P[i mod 5] + 12⌊i/5⌋)/12)`, cap +1 octave | `pentatonicFreq()` `game.js:515-519` | ✓ exact |
| `blip` | triangle, LP 1400, 330 Hz, 55 ms, gain 0.045 | identical | ✓ |
| `thock` | sine + triangle sub-octave, LP 420, 190 Hz, 65 ms | sine 190 Hz 0.05 + triangle 95 Hz 0.03, LP 420, 65 ms | ✓ |
| `typewriter` | noise burst 18 ms bandpass 1800 + bell 1760 Hz / 320 ms | `noiseBurst(0.018, 1800, 0.04, 'bandpass')` + `blip(1760, 0.32, 'sine', 0.05)` | ✓ |
| Rain | 3 s loop, Paul Kellet pink noise, LP 650, gain 0.025 | `game.js:576-613`, canonical Kellet coefficients | ✓ |
| HUJAN toggle | appears after unlocking Rintik Hujan, click toggles | `unlocks.includes('rain_amb')`; handler `game.js:628` | ✓ (handler added in the post-merge pass — see §5) |

### Mix strategy
Peak simultaneous gain per event: `thock` key 0.08, `word` 0.10, `wrong` 0.05,
`fever` 0.06 (four notes sequential, not stacked). Rain sits at 0.025 continuous —
≈10 dB under the loudest transient, so typing stays legible over ambience. No
clipping headroom risk; no compressor needed at these levels.

### Adaptive audio
Pentatonic ladder ascends with the letter index inside a word (`sfx('key', idx-1)`,
`game.js:1013`), capped at +1 octave so long words do not shriek. Fever shifts the
palette to a four-note rising figure; `endFever` answers with a falling one.

### Accessibility
- Mute (`SUARA`/`BISU`) persists to `tf_sound`; `blip`/`noiseBurst`/`sfx` all
  early-return when muted, and rain gain is forced to 0.
- `AudioContext` is created lazily inside a user-gesture path, satisfying
  autoplay policy.
- Every gameplay-critical sound has a visual twin: fever bar + banner + combo,
  `.wrongflash`, floaters, streak burst, rain particles. Meets the
  accessibility-specialist "no sound with no visual cue" rule.
- Rain toggle exposes `aria-pressed`; sound toggle exposes `aria-pressed`.
- **Gap:** no mono-audio option (accessibility-specialist §line 80). All audio is
  synthesized in mono-compatible oscillator/noise with no panning, so there is no
  channel-specific information loss. Low risk; note only.

---

## 3. UX & Accessibility Review

Rubric: `ux-review` verdict levels + `accessibility-specialist` checklist.

### Verdict: APPROVED

| Check | Result |
|---|---|
| Closed modals removed from the accessibility tree | `visibility: hidden` + `opacity: 0` when closed; `visible` when open |
| Focus trap respected | `#ghost` never steals focus or raises the mobile keyboard while a modal is open; typing keys ignored except `Escape` |
| Screen reader announcements | `#word` rebuilds its spans only on word change → `aria-live` announces the active word once per word, not per keystroke |
| Lookahead not announced | `#nextwords` is `aria-hidden="true"` |
| Modal semantics | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` on both modals |
| Focus visible | `:focus-visible` outlines on pool and sound buttons |
| Motion | No new animation; fever/shake effects are pre-existing and short (400–500 ms) |
| Colour | Midnight theme is a high-contrast variant, not a palette-only signal |

---

## 4. Smoke Check

Rubric: `smoke-check` — critical-path gate before hand-off.

### Verdict: PASS

Executed through Chrome DevTools Protocol against `file:///C:/Users/acer/tmp/typing-fever/index.html`
in a dedicated debug profile (`--remote-debugging-port=9222`). No uncaught
exceptions in any scenario. Re-run on the merged build (§5); all rows below were
reproduced after the rebase.

| Path | Evidence |
|---|---|
| Load `file://` | `readyState complete`, no errors (QA-05) |
| Type a word | `totalWords +1`, `beans +1`, `streak +1`; spans not rebuilt per keystroke |
| Wrong key | streak reset, `.wrongflash`; silent and forgiven in fever (QA-01) |
| Fever trigger | `body.fever`, banner, hint text, `beansEarnedInFever ×2`, wrong keys ignored |
| Fever word band | 20/20 first words in pool `tekno` are 4–5 chars |
| Modal open/close | visibility + focus trap; typing ignored while open |
| Shop purchase | buy disabled at 75 and 79 beans, enabled at 80, deducts to 0, equips (QA-03) |
| Daily quests | 3 rows, claim guard, `+25/+30/+35` |
| Day rollover | streak +1, `tf_daily_state` reset; same-day reload preserves progress (QA-06) |
| Receipt | 8 rows, gold badge row at Lv10, PNG 360×540 with 671 gold pixels |
| Rain toggle | visible only after `rain_amb` unlock, gain 0.025; click flips `aria-pressed` and `.active` (handler added post-merge — §5) |
| `fever_mode_type = 'space'` | Space ignored in `flow`; Space completes the word in `space` |
| Bond Lv5 | lore line shown once, `tf_lore_shown` persisted |
| Ghost input | `input` listener empties `#ghost` on every keystroke (`game.js:1037`) |
| KOKI sprite | `#cat` 32×32 has 695 opaque px / 13 colours; auto-blink observed (`catPose` = `blink` within a 4.2 s cadence) |
| WPM idle | `activeMs` frozen across 18 s of no typing (idle gaps > 4 s skipped) |

Not exercised: real-audio output (headless CDP has no audible device) — levels
verified by reading the graph, not by ear.

---

## 5. Post-merge addendum

`v1.2.0` (15b0c6d) was rebased onto `v1.1.0` (2746e5e). The merge keeps v1.1.0's
sprite/renderer/boot work and v1.2.0's PRD features; `game.js` had six conflicts,
`README.md` two, `docs/CHANGELOG.md` one. Resolution: v1.1.0 wins for
`poseCanvas`/`drawCat`/`renderWord`/`refreshChars`/`popChar`/`chSpans`,
`lastKeyAt`, the `#ghost` input listener and the `sprites.js` pipeline; v1.2.0 wins
for every PRD feature. The dead `render()`/`px()` path is gone (`typeof` is
`undefined`), and `resetQueue()` was re-added for the pool switch and boot.

### Defect found by the re-run
| # | Defect | Fix |
|---|--------|-----|
| 1 | `#btnRain` (HUJAN) had **no click handler** — the button rendered after unlocking Rintik Hujan but did nothing. Pre-existing in v1.2.0; the first smoke pass only checked that the button appeared. | `game.js:628` — `addEventListener('click', () => setRain(!rainOn))`. Verified: `aria-pressed` and `.active` flip on click. |

### Re-verification on the merged build
Every §4 row was re-executed, plus the v1.1.0 integration surface: cold `file://`
start with all four scripts (`words`, `config`, `sprites`, `game`), typing three
words, fever flow (auto-forgive, ×2 reward, 3–5 char words), span stability,
modal visibility/focus guard, QA-03 bean gate at 79/80, QA-06 rollover and
same-day preserve, Lv10 gold badge (HTML `rgb(184,134,11)` + 671 gold PNG px),
Lv5 lore, `space` mode, rain toggle, WPM idle freeze, ghost input clearing, and
the KOKI sprite + auto-blink. All pass.
