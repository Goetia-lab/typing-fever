// PROTOTYPE - NOT FOR PRODUCTION
// Typing Fever · tuning values
// 2026-11-12
'use strict';

window.CONFIG = {
  fever_gain: { value: 5, min: 1, max: 20, step: 1 }, // bar points per completed word
  fever_max: { value: 100, min: 10, max: 200, step: 10 }, // bar points that trigger FEVER
  fever_drain_ms: { value: 10000, min: 2000, max: 30000, step: 500 }, // FEVER duration
  wrong_flash_ms: { value: 150, min: 0, max: 500, step: 25 }, // wrong-key flash time
  // Tambahan v1.2.0 (PRD Cozy Barista & Flow Update)
  fever_mode_type: { value: 'flow', options: ['flow', 'space'] },
  fever_word_max_len: { value: 5, min: 3, max: 10, step: 1 },
  lookahead_count: { value: 2, min: 0, max: 3, step: 1 },
  koki_talk_interval: { value: 18, min: 5, max: 50, step: 1 },
};

window.tune = window.tune || new Proxy(window.CONFIG, {
  get(target, key) {
    const entry = target[key];
    return entry && typeof entry === 'object' && 'value' in entry ? entry.value : entry;
  },
});
