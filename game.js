'use strict';

const WORDS = window.WORDS;

const wordEl = document.getElementById('word');
const nextWordsEl = document.getElementById('nextwords');
const wpmEl = document.getElementById('wpm');
const wordsEl = document.getElementById('words');
const streakEl = document.getElementById('streak');
const bestEl = document.getElementById('best');
const beansEl = document.getElementById('beans');
const feverFill = document.getElementById('feverfill');
const banner = document.getElementById('banner');
const hint = document.getElementById('hint');
const ghost = document.getElementById('ghost');
const comboEl = document.getElementById('combo');
const dayEl = document.getElementById('day');
const sessionEl = document.getElementById('session');
const graphEl = document.getElementById('wpmGraph');
const gtx = graphEl.getContext('2d');
const catEl = document.getElementById('cat');
const cctx = catEl.getContext('2d');
const vnText = document.getElementById('vntext');
const flashEl = document.getElementById('flash');
const bigEl = document.getElementById('bigfever');
// --- storage helper (localStorage bisa throw di mode private / file://) ---
const store = {
  get(k, fb) { try { const v = localStorage.getItem(k); return v === null ? fb : v; } catch (e) { return fb; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
};

let word = '';
let idx = 0;
let wrongIdx = -1;
let charsTyped = 0;
let totalWords = 0;
let streak = 0;
let best = +(store.get('tf_best', 0));
let samples = [];
let lastWpm = 0;
let dayStreak = 1;
let fever = 0;
let mode = 'normal';
let feverLeft = 0;
let feverTotal = 100;
let startTime = null;
let activeMs = 0;
let lastTick = null;
let feverTimer = null;
let rainTimer = null;
let feverStartWords = 0;

// --- v1.2.0 State ---
let wordQueue = [];
let beans = +(store.get('tf_beans', 0) || 0);
let totalWordsAllTime = +(store.get('tf_total_words', 0) || 0);
let totalFeversAllTime = +(store.get('tf_total_fevers', 0) || 0);
let unlocks = (() => {
  try {
    const u = JSON.parse(store.get('tf_unlocks', '["blip"]'));
    return Array.isArray(u) && u.length ? u : ['blip'];
  } catch (e) { return ['blip']; }
})();
let equippedSound = store.get('tf_equipped_sound', 'blip');
if (!['blip', 'thock', 'typewriter'].includes(equippedSound)) equippedSound = 'blip';
let equippedDrink = store.get('tf_equipped_drink', 'none');
if (!['none', 'matcha', 'espresso'].includes(equippedDrink)) equippedDrink = 'none';
let equippedTheme = store.get('tf_equipped_theme', 'auto');
if (!['auto', 'midnight'].includes(equippedTheme)) equippedTheme = 'auto';
let rainOn = store.get('tf_rain_on', '0') === '1';
let activeModal = null;

let sessionFever = 0;
let sessionBeans = 0;
let sessionPeakWpm = 0;
let sessionStartWords = 0;

function todayKey() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

let dailyState = (() => {
  try {
    const d = JSON.parse(store.get('tf_daily_state', '{}'));
    if (d && typeof d === 'object' && d.date) return d;
  } catch (e) {}
  return null;
})();

(function dayPass() {
  const todayK = todayKey();
  const yestK = (() => {
    const d = new Date(Date.now() - 864e5);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  })();
  const lastDay = store.get('tf_last_day', '');
  dayStreak = +(store.get('tf_day_streak', 0));
  if (lastDay !== todayK) {
    dayStreak = (lastDay === yestK) ? dayStreak + 1 : 1;
    store.set('tf_day_streak', dayStreak);
    store.set('tf_last_day', todayK);
  }
  dayEl.textContent = dayStreak;
})();

let pool = store.get('tf_pool', 'umum');
if (!WORDS[pool]) pool = 'umum';
const POOL_LABELS = { umum: 'Umum', kafe: 'Kafe', hujan: 'Hujan', alam: 'Alam', kota: 'Kota', malam: 'Malam', tekno: 'Tekno', rumah: 'Rumah', acak: 'Acak' };

function bondLevel() {
  return Math.min(10, 1 + Math.floor(Math.sqrt(totalWordsAllTime / 35)));
}
const BOND_TITLES = {
  1: 'Pelanggan Baru', 2: 'Tamu Kenalan', 3: 'Teman Ngopi', 4: 'Teman Ngopi',
  5: 'Barista Magang', 6: 'Barista Magang', 7: 'Sahabat Kedai', 8: 'Sahabat Kedai',
  9: 'Sahabat Kedai', 10: 'Keluarga KOKI'
};

let lastBondLevel = (() => {
  const v = +(store.get('tf_bond_level', 0));
  return v > 0 ? v : bondLevel();
})();

function pickWord(excludeList) {
  let list = (WORDS[pool] || WORDS.umum);
  if (mode === 'fever' && tune.fever_mode_type === 'flow') {
    const maxLen = tune.fever_word_max_len;
    let filtered = list.filter(w => w.length >= 3 && w.length <= maxLen);
    if (filtered.length < 5) filtered = list.filter(w => w.length >= 3 && w.length <= maxLen + 2);
    if (filtered.length > 0) list = filtered;
  }
  const excl = excludeList || [];
  let w;
  let attempts = 0;
  do {
    w = list[(Math.random() * list.length) | 0];
    attempts++;
  } while (list.length > 1 && (excl.includes(w)) && attempts < 20);
  return w;
}

function nextWord() {
  if (wordQueue.length === 0) {
    wordQueue = [pickWord([]), pickWord([]), pickWord([])];
  }
  word = wordQueue[0];
  idx = 0;
  wrongIdx = -1;
  if (tune.lookahead_count > 0 && wordQueue.length > 1) {
    nextWordsEl.innerHTML = wordQueue.slice(1, 1 + tune.lookahead_count)
      .map(w => '<span>' + w + '</span>').join('');
  } else {
    nextWordsEl.innerHTML = '';
  }
}

function resetQueue() {
  wordQueue = [];
  nextWord();
}

function buildPools() {
  const poolsEl = document.getElementById('pools');
  poolsEl.innerHTML = '';
  for (const key of Object.keys(WORDS)) {
    const b = document.createElement('button');
    b.textContent = POOL_LABELS[key] || key;
    b.className = 'poolbtn' + (key === pool ? ' active' : '');
    b.addEventListener('click', () => {
      pool = key;
      store.set('tf_pool', key);
      buildPools();
      resetQueue();
      renderWord();
    });
    poolsEl.appendChild(b);
  }
}

// --- sprite KOKI: data dari sprites.js (sumber art/koki.px.js) ---
const POSE_CACHE = {};
function poseCanvas(pose) {
  if (!POSE_CACHE[pose]) {
    const cv = document.createElement('canvas');
    cv.width = 32; cv.height = 32;
    const cx = cv.getContext('2d');
    KOKI_MAPS[pose].forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const key = row[x];
        if (key === '.') continue;
        cx.fillStyle = KOKI_PAL[key];
        cx.fillRect(x, y, 1, 1);
      }
    });
    POSE_CACHE[pose] = cv;
  }
  return POSE_CACHE[pose];
}
let catPose = 'idle';
function drawCat(pose) {
  catPose = pose;
  cctx.clearRect(0, 0, 32, 32);
  cctx.drawImage(poseCanvas(pose), 0, 0);
}
// blink otomatis saat idle
setInterval(() => {
  if (catPose !== 'idle') return;
  drawCat('blink');
  setTimeout(() => { if (catPose === 'blink') drawCat('idle'); }, 130);
}, 4200);

let typeTimer = null;
function say(text, pose) {
  clearInterval(typeTimer);
  if (pose) drawCat(pose);
  vnText.textContent = '';
  let i = 0;
  typeTimer = setInterval(() => {
    i++;
    vnText.textContent = text.slice(0, i);
    if (i >= text.length) { clearInterval(typeTimer); typeTimer = null; }
  }, 24);
}

let idleTimer = null;
function bumpIdle() {
  clearTimeout(idleTimer);
  if (mode !== 'fever') drawCat('idle');
  idleTimer = setTimeout(() => { if (mode !== 'fever') say('ngantuk...?', 'sleep'); }, 15000);
}

let chSpans = [];
function renderWord() {
  wordEl.innerHTML = '';
  chSpans = [];
  const frag = document.createDocumentFragment();
  word.split('').forEach((ch) => {
    const s = document.createElement('span');
    s.textContent = ch;
    s.className = 'ch';
    frag.appendChild(s);
    chSpans.push(s);
  });
  wordEl.appendChild(frag);
  // animasi masuk per karakter
  chSpans.forEach((s, i) => { s.style.animationDelay = (i * 14) + 'ms'; });
  wordEl.classList.remove('enter', 'autopop');
  void wordEl.offsetWidth;
  wordEl.classList.add('enter', 'autopop');
  refreshChars();
}

// update kelas saja — DOM tak dibangun ulang, SR tak mengumumkan ulang kata
function refreshChars() {
  chSpans.forEach((s, i) => {
    const cls = 'ch'
      + (i < idx ? ' done' : '')
      + (i === wrongIdx ? ' wrong' : '')
      + (i === idx && mode === 'normal' ? ' cur' : '');
    if (s.className !== cls) s.className = cls;
  });
}

function popChar(i) {
  const s = chSpans[i];
  if (!s) return;
  s.classList.remove('pop');
  void s.offsetWidth;
  s.classList.add('pop');
  setTimeout(() => s.classList.remove('pop'), 240);
}

function fxCenter() {
  const rect = wordEl.getBoundingClientRect();
  const stageRect = document.getElementById('fx').getBoundingClientRect();
  return { x: rect.left - stageRect.left + rect.width / 2, y: rect.top - stageRect.top + rect.height / 2 };
}

function burst(n, big) {
  const fx = document.getElementById('fx');
  const colors = ['#ffd75e', '#ff9d5c', '#8be08b', '#ff5b8b'];
  const { x, y } = fxCenter();
  for (let i = 0; i < n; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    const ang = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * (big ? 90 : 50);
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.background = colors[(Math.random() * colors.length) | 0];
    p.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
    p.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
    p.addEventListener('animationend', () => p.remove());
    fx.appendChild(p);
  }
}

function rain() {
  const fx = document.getElementById('fx');
  const p = document.createElement('span');
  p.className = 'particle rain';
  p.style.left = (5 + Math.random() * 90) + '%';
  p.style.top = '0';
  p.style.background = ['#ffd75e', '#ff9d5c', '#8be08b', '#ff5b8b'][(Math.random() * 4) | 0];
  p.addEventListener('animationend', () => p.remove());
  fx.appendChild(p);
}

function floater(text, big) {
  const fx = document.getElementById('fx');
  const { x, y } = fxCenter();
  const f = document.createElement('span');
  f.className = 'floater' + (big ? ' big' : '');
  f.textContent = text;
  f.style.left = (x - (big ? 60 : 12)) + 'px';
  f.style.top = (y - 6) + 'px';
  f.addEventListener('animationend', () => f.remove());
  fx.appendChild(f);
}

function bump(el, val) {
  const v = String(val);
  if (el.textContent === v) return;
  el.textContent = v;
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
  setTimeout(() => el.classList.remove('bump'), 260);
}

function updateStats() {
  if (streak > best) {
    best = streak;
    store.set('tf_best', best);
  }
  const now = Date.now();
  if (lastTick && startTime && mode === 'normal') {
    // idle >4s tidak masuk hitungan WPM (chunk-nya diskip, bukan sekadar dijeda)
    if (now - (lastKeyAt || 0) >= 4000) lastTick = now;
    else activeMs += now - lastTick;
  }
  lastTick = now;
  const mins = activeMs ? Math.max(activeMs / 60000, 1 / 60) : 1 / 60;
  lastWpm = Math.round((charsTyped / 5) / mins);
  if (lastWpm > sessionPeakWpm) sessionPeakWpm = lastWpm;
  bump(wpmEl, lastWpm);
  bump(wordsEl, totalWords);
  bump(streakEl, streak);
  bump(bestEl, best);
  sessionEl.textContent = 'sesi: ' + totalWords + ' kata · ' + Math.floor(activeMs / 60000) + ' mnt';
}

function updateBeansUI() {
  bump(beansEl, beans);
}

function completeWord(auto) {
  totalWords++;
  totalWordsAllTime++;
  store.set('tf_total_words', totalWordsAllTime);
  streak++;

  let earned = 0;
  if (mode === 'normal') {
    earned = 1;
    if (bondLevel() >= 3 && streak % 10 === 0) earned += 1;
    fever = Math.min(tune.fever_max, fever + tune.fever_gain + (equippedDrink === 'espresso' ? 1 : 0));
    feverFill.style.width = (fever / tune.fever_max * 100) + '%';
    floater('+1');
    sfx('word');
    if (streak % 10 === 0) { floater('STREAK x' + streak + '!', true); burst(14, true); say('mantap! streak ' + streak + '!', 'happy'); sfx('streak'); }
    if (fever >= tune.fever_max) startFever();
  } else {
    earned = (equippedDrink === 'espresso' ? 3 : 2);
    burst(8, false);
    comboEl.textContent = 'x' + (totalWords - feverStartWords);
    comboEl.classList.remove('bump');
    void comboEl.offsetWidth;
    comboEl.classList.add('bump');
  }

  if (earned > 0) {
    beans += earned;
    sessionBeans += earned;
    store.set('tf_beans', beans);
    updateBeansUI();
    floater('+' + earned + ' biji', false);
  }

  updateDailyProgress('words', 1);
  updateDailyProgress('pool', 1);
  if (mode === 'normal' && equippedDrink === 'matcha') burst(4, false);

  updateStats();
  const blNow = bondLevel();
  if (blNow > lastBondLevel) {
    lastBondLevel = blNow;
    store.set('tf_bond_level', blNow);
    if (blNow >= 5 && store.get('tf_lore_shown', '0') !== '1') {
      store.set('tf_lore_shown', '1');
      say('cerita lama ya? dulu aku kucing jalanan di gang sebelah kedai... sekarang ketukanmu yang bikin aku punya rumah.', 'happy');
    }
  }
  if (wordQueue.length > 0) wordQueue.shift();
  wordQueue.push(pickWord(wordQueue.slice(0, 2)));
  nextWord();
  renderWord();
  if (mode === 'normal') checkKokiDialog();
}

function startFever() {
  mode = 'fever';
  totalFeversAllTime++;
  store.set('tf_total_fevers', totalFeversAllTime);
  sessionFever++;
  updateDailyProgress('fever', 1);
  const bonusMs = (bondLevel() >= 7 ? 1500 : 0);
  const baseMs = tune.fever_drain_ms;
  feverTotal = tune.fever_max;
  feverLeft = feverTotal;
  document.body.classList.add('fever');
  drawCat('fever');
  banner.classList.remove('hidden');
  banner.classList.remove('in');
  void banner.offsetWidth;
  banner.classList.add('in');
  const stage = document.getElementById('stage');
  stage.classList.remove('feverin');
  void stage.offsetWidth;
  stage.classList.add('feverin');
  setTimeout(() => stage.classList.remove('feverin'), 400);
  burst(16, true);
  say('FEVER FLOW!! sekejap lagi!', 'happy');
  sfx('fever');
  flashEl.classList.remove('go');
  void flashEl.offsetWidth;
  flashEl.classList.add('go');
  bigEl.classList.remove('go');
  void bigEl.offsetWidth;
  bigEl.classList.add('go');
  const wrap = document.querySelector('.wrap');
  wrap.classList.remove('shake');
  void wrap.offsetWidth;
  wrap.classList.add('shake');
  setTimeout(() => wrap.classList.remove('shake'), 500);
  feverStartWords = totalWords;
  // antrean berikutnya dipaksa memakai kata pendek khusus Fever
  for (let i = 1; i < wordQueue.length; i++) wordQueue[i] = pickWord(wordQueue);
  comboEl.textContent = 'x0';
  rainTimer = setInterval(rain, 140);
  hint.innerHTML = 'FEVER FLOW!!<br>ketik secepatnya · salah ketik diabaikan!';
  feverTimer = setInterval(() => {
    if (activeModal) return;
    const drain = feverTotal * (100 / (baseMs + bonusMs));
    feverLeft -= drain;
    feverFill.style.width = Math.max(feverLeft / feverTotal * 100, 0) + '%';
    if (feverLeft <= 0) endFever();
  }, 100);
}

function endFever() {
  clearInterval(feverTimer);
  feverTimer = null;
  clearInterval(rainTimer);
  rainTimer = null;
  mode = 'normal';
  fever = 0;
  feverFill.style.width = '0%';
  floater('+' + (totalWords - feverStartWords) + ' kata!', true);
  document.body.classList.remove('fever');
  drawCat('idle');
  say('asik... lanjutkan', 'idle');
  sfx('end');
  banner.classList.add('out');
  setTimeout(() => {
    banner.classList.add('hidden');
    banner.classList.remove('out', 'in');
  }, 260);
  hint.innerHTML = 'ketik kata-nya &middot; salah nggak apa-apa<br>bar penuh = FEVER FLOW: ketik secepatnya!';
}

// --- audio: WebAudio synth, tanpa aset ---
let audioCtx = null;
let soundOn = store.get('tf_sound', '1') !== '0';
function ac() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function blip(freq, dur, type, vol, when, filterFreq) {
  if (!soundOn) return;
  const ctx = ac(); if (!ctx) return;
  const t = ctx.currentTime + (when || 0);
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type || 'square';
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol || 0.06, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = o;
  if (filterFreq) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filterFreq;
    o.connect(f);
    node = f;
  }
  node.connect(g); g.connect(ctx.destination);
  o.start(t); o.stop(t + dur + 0.02);
}
function pentatonicFreq(i, base) {
  const P = [0, 2, 4, 7, 9];
  const semitone = P[i % 5] + 12 * Math.floor(i / 5);
  const capped = Math.min(semitone, 12);
  return base * Math.pow(2, capped / 12);
}
function noiseBurst(dur, filterFreq, vol, filterType) {
  if (!soundOn) return;
  const ctx = ac(); if (!ctx) return;
  const bufferSize = ctx.sampleRate * dur;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = filterType || 'lowpass';
  filter.frequency.value = filterFreq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  source.connect(filter); filter.connect(g); g.connect(ctx.destination);
  source.start();
  source.stop(ctx.currentTime + dur);
}
function sfx(name, letterIdx) {
  if (!soundOn) return;
  switch (name) {
    case 'key': {
      const i = (letterIdx !== undefined) ? letterIdx : 0;
      if (equippedSound === 'thock') {
        blip(pentatonicFreq(i, 190), 0.065, 'sine', 0.05, 0, 420);
        blip(pentatonicFreq(i, 95), 0.065, 'triangle', 0.03, 0, 420);
      } else if (equippedSound === 'typewriter') {
        noiseBurst(0.018, 1800, 0.04, 'bandpass');
        blip(pentatonicFreq(i, 220), 0.03, 'square', 0.02, 0, 1800);
      } else {
        blip(pentatonicFreq(i, 330), 0.055, 'triangle', 0.045, 0, 1400);
      }
      break;
    }
    case 'word':
      if (equippedSound === 'typewriter') {
        blip(1760, 0.32, 'sine', 0.05);
        blip(880, 0.2, 'sine', 0.03, 0.02);
      } else if (equippedSound === 'thock') {
        blip(261, 0.08, 'sine', 0.06);
        blip(392, 0.1, 'sine', 0.04, 0.06);
      } else {
        blip(523, 0.07, 'triangle', 0.06);
        blip(784, 0.09, 'triangle', 0.05, 0.06);
      }
      break;
    case 'wrong': blip(150, 0.12, 'sawtooth', 0.05); break;
    case 'streak': blip(880, 0.08, 'triangle', 0.06); blip(1174, 0.1, 'triangle', 0.05, 0.07); break;
    case 'fever': [523, 659, 784, 1046].forEach((f, i) => blip(f, 0.12, 'triangle', 0.06, i * 0.07)); break;
    case 'end': [784, 659, 523].forEach((f, i) => blip(f, 0.1, 'triangle', 0.04, i * 0.07)); break;
  }
}

let rainNode = null;
function setRain(on) {
  rainOn = on;
  store.set('tf_rain_on', on ? '1' : '0');
  const btn = document.getElementById('btnRain');
  if (btn) {
    btn.style.display = unlocks.includes('rain_amb') ? '' : 'none';
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.toggle('active', on);
  }
  if (on && soundOn) {
    const ctx = ac(); if (!ctx) return;
    if (!rainNode) {
      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.0990460;
        b1 = 0.96300 * b1 + white * 0.2965164;
        b2 = 0.57000 * b2 + white * 1.0526913;
        data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.06;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer; source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 650;
      const g = ctx.createGain();
      g.gain.value = 0.025;
      source.connect(filter); filter.connect(g); g.connect(ctx.destination);
      source.start();
      rainNode = { source, gain: g };
    }
    rainNode.gain.gain.value = 0.025;
  } else if (rainNode) {
    rainNode.gain.gain.value = 0;
  }
}

function updateSoundBtn() {
  const b = document.getElementById('sound');
  b.textContent = soundOn ? 'SUARA' : 'BISU';
  b.classList.toggle('off', !soundOn);
  b.setAttribute('aria-pressed', String(soundOn));
}
document.getElementById('sound').addEventListener('click', () => {
  soundOn = !soundOn;
  store.set('tf_sound', soundOn ? '1' : '0');
  updateSoundBtn();
  if (soundOn) { sfx('word'); if (rainOn) setRain(true); }
  else if (rainNode) rainNode.gain.gain.value = 0;
});
document.getElementById('btnRain').addEventListener('click', () => setRain(!rainOn));
updateSoundBtn();
let lastKeyAt = 0;

const DIALOGUES = {
  kafe: 'aroma biji sangrai baru memang paling pas buat nemenin jari lari.',
  hujan: 'rintik di kaca jendela bikin suasana kedai makin tenang, ya?',
  malam: 'jam segini kedai sepi... cuma suara ketikanmu yang kedengaran.',
  tekno: 'kode dan kopi itu dua hal yang nggak bisa dipisahkan.',
  alam: 'kadang kita butuh napas pelan seperti angin di pucuk pinus.',
  kota: 'di luar boleh macet, di dalam sini ritmenya kamu yang atur.',
  rumah: 'semoga layar kecil ini terasa hangat seperti pulang ke rumah.'
};
let recentDialogues = [];
let wordsSinceDialog = 0;
let justRecovered = false;
let avgWpm = 0;

function checkKokiDialog() {
  wordsSinceDialog++;
  if (wordsSinceDialog < tune.koki_talk_interval) return;
  wordsSinceDialog = 0;
  let line = null;
  const perfHot = samples.length > 3 && lastWpm > (samples.reduce((a,b)=>a+b,0)/samples.length) * 1.2;
  if (justRecovered && !recentDialogues.includes('typo_recover')) {
    line = 'santai saja, salah satu huruf nggak bikin kopinya tumpah kok.';
    recentDialogues.push('typo_recover');
    justRecovered = false;
  } else if (perfHot && !recentDialogues.includes('perf_hot')) {
    line = 'wah, ritmemu makin panas! jangan lupa kedip ya.';
    recentDialogues.push('perf_hot');
  } else if (bondLevel() >= 2 && pool !== 'acak' && DIALOGUES[pool] && !recentDialogues.includes(DIALOGUES[pool])) {
    line = DIALOGUES[pool];
  } else if (bondLevel() >= 2 && !recentDialogues.includes('bond_generic')) {
    line = 'makin rajin ngopi di sini ya? aku senang.';
    recentDialogues.push('bond_generic');
  } else {
    const fallbacks = Object.values(DIALOGUES);
    line = fallbacks[(Math.random() * fallbacks.length) | 0];
  }
  if (line && !recentDialogues.includes(line)) recentDialogues.push(line);
  if (recentDialogues.length > 10) recentDialogues.shift();
  if (line) say(line, 'idle');
}

// --- Modal & Shop ---
const CAFE_ITEMS = [
  { id: 'blip', name: 'Retro Blip', desc: 'Profil suara pentatonik standar', price: 0, cat: 'sound', type: 'sound' },
  { id: 'thock', name: 'Creamy Thock', desc: 'Suara switch mekanik empuk dan warm', price: 80, cat: 'sound', type: 'sound' },
  { id: 'rain_amb', name: 'Rintik Hujan', desc: 'Suara latar hujan prosedural (toggle HUJAN)', price: 100, cat: 'ambience', type: 'rain' },
  { id: 'matcha', name: 'Matcha Latte', desc: 'Palet Fever hijau-emas lembut', price: 120, cat: 'drink', type: 'drink', val: 'matcha' },
  { id: 'typewriter', name: 'Mesin Tik Klasik', desc: 'Ketikan mekanik + bel akhir kata', price: 150, cat: 'sound', type: 'sound' },
  { id: 'espresso', name: 'Double Espresso', desc: 'Fever gain +1 & reward biji x2/x3', price: 180, cat: 'drink', type: 'drink', val: 'espresso' },
  { id: 'midnight', name: 'Midnight Roast', desc: 'Tema warna pekat kontras tinggi', price: 250, cat: 'theme', type: 'theme', val: 'midnight' },
];

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  activeModal = id;
  el.classList.add('open');
  if (id === 'modalKafe') renderShop();
  if (id === 'modalStruk') renderReceipt();
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('open');
  if (activeModal === id) activeModal = null;
  focusGhost();
}

document.getElementById('btnKafe').addEventListener('click', () => openModal('modalKafe'));
document.getElementById('btnCloseKafe').addEventListener('click', () => closeModal('modalKafe'));
const btnStruk = document.getElementById('btnStruk');
btnStruk.addEventListener('click', () => { if (!btnStruk.disabled) openModal('modalStruk'); });
document.getElementById('btnCloseStruk').addEventListener('click', () => closeModal('modalStruk'));
document.getElementById('btnSavePng').addEventListener('click', saveReceiptPng);

document.getElementById('modalKafe').addEventListener('click', (e) => { if (e.target.id === 'modalKafe') closeModal('modalKafe'); });
document.getElementById('modalStruk').addEventListener('click', (e) => { if (e.target.id === 'modalStruk') closeModal('modalStruk'); });

function renderShop() {
  document.getElementById('shopBeans').textContent = beans;
  const bl = bondLevel();
  document.getElementById('bondInfo').innerHTML = 'BOND: Lv. ' + bl + ' <span>(' + (BOND_TITLES[bl] || '') + ')</span>';
  const itemsEl = document.getElementById('shopItems');
  itemsEl.innerHTML = '';
  for (const item of CAFE_ITEMS) {
    const owned = unlocks.includes(item.id);
    const equipped =
      (item.type === 'sound' && equippedSound === item.id) ||
      (item.type === 'drink' && equippedDrink === item.val) ||
      (item.type === 'theme' && equippedTheme === item.val);
    const card = document.createElement('div');
    card.className = 'item-card';
    const info = document.createElement('div');
    info.className = 'item-info';
    info.innerHTML = '<div class="item-name">' + item.name + '</div><div class="item-desc">' + item.desc + '</div>';
    const actions = document.createElement('div');
    actions.className = 'item-actions';
    const price = document.createElement('div');
    price.className = 'item-price';
    price.textContent = item.price === 0 ? 'GRATIS' : item.price + ' biji';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'item-btn';
    if (equipped) {
      btn.textContent = 'DIPAKAI';
      btn.classList.add('equipped');
      btn.disabled = true;
    } else if (owned) {
      btn.textContent = 'PAKAI';
      btn.addEventListener('click', () => equipItem(item));
    } else {
      btn.textContent = 'BELI';
      btn.classList.add('buy');
      if (beans < item.price) btn.disabled = true;
      btn.addEventListener('click', () => buyItem(item));
    }
    actions.appendChild(price);
    actions.appendChild(btn);
    card.appendChild(info);
    card.appendChild(actions);
    itemsEl.appendChild(card);
  }
  renderDailyQuests();
}

function buyItem(item) {
  if (unlocks.includes(item.id) || beans < item.price) return;
  beans -= item.price;
  sessionBeans -= item.price;
  unlocks.push(item.id);
  store.set('tf_beans', beans);
  store.set('tf_unlocks', JSON.stringify(unlocks));
  updateBeansUI();
  equipItem(item);
  sfx('word');
}
function equipItem(item) {
  if (!unlocks.includes(item.id)) return;
  if (item.type === 'sound') {
    equippedSound = item.id;
    store.set('tf_equipped_sound', equippedSound);
  } else if (item.type === 'drink') {
    equippedDrink = item.val;
    store.set('tf_equipped_drink', equippedDrink);
    document.body.classList.toggle('drink-matcha', equippedDrink === 'matcha');
  } else if (item.type === 'theme') {
    equippedTheme = item.val;
    store.set('tf_equipped_theme', equippedTheme);
    applyTheme();
  } else if (item.type === 'rain') {
    setRain(true);
  }
  renderShop();
}

function applyTheme() {
  document.body.classList.remove('scene-pagi', 'scene-siang', 'scene-senja', 'scene-malam', 'scene-midnight');
  const hour = new Date().getHours();
  const auto = hour < 5 ? 'malam' : hour < 11 ? 'pagi' : hour < 15 ? 'siang' : hour < 19 ? 'senja' : 'malam';
  const scene = (equippedTheme === 'midnight') ? 'midnight' : auto;
  document.body.classList.add('scene-' + scene);
}

// --- Daily Quests ---
function getDailyQuests() {
  const todayK = todayKey();
  if (!dailyState || dailyState.date !== todayK) {
    const poolKeys = Object.keys(WORDS).filter(k => k !== 'acak');
    const seed = todayK.split('-').reduce((acc, p) => acc + (+p || 0), 0);
    const dailyPool = poolKeys[seed % poolKeys.length];
    dailyState = {
      date: todayK,
      words: 0,
      poolWords: 0,
      fevers: 0,
      claimed: [],
      dailyPool: dailyPool
    };
    store.set('tf_daily_state', JSON.stringify(dailyState));
  }
  return [
    { id: 'words40', desc: 'Pemanasan Barista: ketik 40 kata hari ini', target: 40, reward: 25, progress: dailyState.words },
    { id: 'pool20', desc: 'Eksplorasi Rasa: selesaikan 20 kata di pool ' + (POOL_LABELS[dailyState.dailyPool] || dailyState.dailyPool), target: 20, reward: 30, progress: dailyState.poolWords },
    { id: 'fever2', desc: 'Aliran Panas: masuk mode FEVER 2 kali', target: 2, reward: 35, progress: dailyState.fevers }
  ];
}
function updateDailyProgress(type, n) {
  if (!dailyState || dailyState.date !== todayKey()) getDailyQuests();
  if (type === 'words') dailyState.words = (dailyState.words || 0) + n;
  if (type === 'pool' && pool === dailyState.dailyPool) dailyState.poolWords = (dailyState.poolWords || 0) + n;
  if (type === 'fever') dailyState.fevers = (dailyState.fevers || 0) + n;
  store.set('tf_daily_state', JSON.stringify(dailyState));
  if (activeModal === 'modalKafe') renderDailyQuests();
}
function renderDailyQuests() {
  const el = document.getElementById('dailyQuests');
  if (!el) return;
  el.innerHTML = '';
  const quests = getDailyQuests();
  for (const q of quests) {
    const done = q.progress >= q.target;
    const claimed = (dailyState.claimed || []).includes(q.id);
    const item = document.createElement('div');
    item.className = 'quest-item';
    const desc = document.createElement('div');
    desc.className = 'quest-desc';
    desc.innerHTML = q.desc + '<span class="quest-prog">' + Math.min(q.progress, q.target) + ' / ' + q.target + '</span>';
    const reward = document.createElement('div');
    reward.className = 'quest-reward';
    reward.textContent = '+' + q.reward + ' biji';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quest-btn';
    if (claimed) {
      btn.textContent = 'SELESAI';
      btn.classList.add('claimed');
      btn.disabled = true;
    } else if (done) {
      btn.textContent = 'KLAIM';
      btn.addEventListener('click', () => {
        if (!dailyState.claimed) dailyState.claimed = [];
        dailyState.claimed.push(q.id);
        beans += q.reward;
        sessionBeans += q.reward;
        store.set('tf_beans', beans);
        store.set('tf_daily_state', JSON.stringify(dailyState));
        updateBeansUI();
        sfx('streak');
        renderDailyQuests();
      });
    } else {
      btn.textContent = 'PROSES';
      btn.disabled = true;
    }
    item.appendChild(desc);
    item.appendChild(reward);
    item.appendChild(btn);
    el.appendChild(item);
  }
}

// --- Receipt ---
function renderReceipt() {
  const now = new Date();
  const h = now.getHours();
  const shift = h < 5 ? 'MALAM' : h < 11 ? 'PAGI' : h < 15 ? 'SIANG' : h < 19 ? 'SENJA' : 'MALAM';
  const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  document.getElementById('receiptShift').innerHTML = 'SHIFT ' + shift + ' &middot; ' + dateStr.toUpperCase();
  const avgWpm = samples.length ? Math.round(samples.reduce((a, b) => a + b, 0) / samples.length) : lastWpm;
  const peak = Math.max(sessionPeakWpm, ...samples, 0);
  const durMin = Math.floor(activeMs / 60000);
  const durSec = Math.floor((activeMs % 60000) / 1000);
  const rows = [
    ['DURASI AKTIF', durMin + ' mnt ' + durSec + ' dtk'],
    ['TOTAL KATA', totalWords],
    ['RATA-RATA WPM', avgWpm],
    ['PEAK WPM', peak],
    ['STREAK TERTINGGI', best],
    ['TOTAL FEVER', sessionFever],
    ['BIJI DIDAPAT', '+' + sessionBeans],
    ['BOND LEVEL', 'Lv. ' + bondLevel() + ' (' + (BOND_TITLES[bondLevel()] || '') + ')']
  ];
  if (bondLevel() >= 10) rows.push(['★ LENCANA EMAS ★', 'Keluarga KOKI', 'badge']);
  document.getElementById('receiptStats').innerHTML = rows
    .map(r => '<div class="receipt-row' + (r[2] ? ' ' + r[2] : '') + '"><span>' + r[0] + '</span><span>' + r[1] + '</span></div>').join('');
  let note = 'Shift yang tenang dan produktif.';
  if (totalWords >= 50) note = 'Luar biasa! Biji kopi mu menumpuk, kedai makin ramai.';
  else if (totalWords >= 20) note = 'Aliran yang bagus. Terus pertahankan ritme santaimu.';
  else if (sessionFever > 0) note = 'Fever pertama selalu special. Coba lagi besok!';
  else note = 'Setiap ketukan kecil berarti. Kopi belum tumpah kok.';
  document.getElementById('receiptNote').textContent = note;
}
function saveReceiptPng() {
  const canvas = document.getElementById('receiptCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#f7e9cf';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#7a6652';
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.setLineDash([]);
  ctx.fillStyle = '#241823';
  ctx.textAlign = 'center';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('KEDAI KOPI KOKI', W / 2, 40);
  ctx.font = '10px monospace';
  ctx.fillText('STRUK SHIFT KAFE', W / 2, 58);
  const now = new Date();
  const h = now.getHours();
  const shift = h < 5 ? 'MALAM' : h < 11 ? 'PAGI' : h < 15 ? 'SIANG' : h < 19 ? 'SENJA' : 'MALAM';
  ctx.fillText('SHIFT ' + shift + ' - ' + now.toLocaleDateString('id-ID'), W / 2, 74);
  ctx.textAlign = 'left';
  ctx.font = '11px monospace';
  const avgWpm = samples.length ? Math.round(samples.reduce((a, b) => a + b, 0) / samples.length) : lastWpm;
  const peak = Math.max(sessionPeakWpm, ...samples, 0);
  const durMin = Math.floor(activeMs / 60000);
  const rows = [
    ['Durasi Aktif', durMin + ' mnt'],
    ['Total Kata', String(totalWords)],
    ['Rata-rata WPM', String(avgWpm)],
    ['Peak WPM', String(peak)],
    ['Streak Tertinggi', String(best)],
    ['Total Fever', String(sessionFever)],
    ['Biji Didapat', '+' + sessionBeans]
  ];
  let y = 110;
  for (const r of rows) {
    ctx.fillText(r[0], 24, y);
    ctx.textAlign = 'right';
    ctx.fillText(r[1], W - 24, y);
    ctx.textAlign = 'left';
    y += 22;
  }
  y += 10;
  ctx.font = 'italic 10px monospace';
  ctx.fillText('Catatan Barista KOKI:', 24, y);
  y += 16;
  const note = document.getElementById('receiptNote').textContent;
  const words = note.split(' ');
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).length > 40) {
      ctx.fillText(line, 24, y);
      y += 14;
      line = w;
    } else {
      line = line ? line + ' ' + w : w;
    }
  }
  if (line) ctx.fillText(line, 24, y);
  y += 24;
  ctx.drawImage(catEl, 24, y, 48, 48);
  ctx.textAlign = 'right';
  ctx.fillText('Lv. ' + bondLevel() + ' ' + (BOND_TITLES[bondLevel()] || ''), W - 24, y + 30);
  ctx.textAlign = 'left';
  if (bondLevel() >= 10) {
    ctx.fillStyle = '#b8860b';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('★ LENCANA EMAS KELUARGA KOKI ★', W / 2, y + 62);
    ctx.fillStyle = '#241823';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
  }
  const blob = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = blob;
  a.download = 'struk-koki-' + todayKey() + '.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// --- Input ---
document.addEventListener('keydown', (e) => {
  if (activeModal) {
    if (e.key === 'Escape') closeModal(activeModal);
    return;
  }
  if (e.key === 'Escape' && totalWords - sessionStartWords >= 10) {
    openModal('modalStruk');
    return;
  }
  if (e.key === ' ') e.preventDefault();
  bumpIdle();

  if (mode === 'fever' && tune.fever_mode_type === 'space') {
    if (e.key === ' ') completeWord(true);
    return;
  }

  if (e.key.length !== 1) return;
  if (!startTime) { startTime = Date.now(); lastTick = startTime; }
  lastKeyAt = Date.now();

  if (e.key.toLowerCase() === word[idx].toLowerCase()) {
    wrongIdx = -1;
    idx++;
    charsTyped++;
    sfx('key', idx - 1);
    if (idx === word.length) completeWord(false);
    else { popChar(idx - 1); refreshChars(); }
  } else {
    if (mode === 'fever') return;
    justRecovered = true;
    streak = 0;
    sfx('wrong');
    wrongIdx = idx;
    const stage = document.getElementById('stage');
    stage.classList.remove('wrongflash');
    void stage.offsetWidth;
    stage.classList.add('wrongflash');
    updateStats();
    refreshChars();
    setTimeout(() => { wrongIdx = -1; refreshChars(); }, tune.wrong_flash_ms);
  }
});

// mobile: focus hidden input biar keyboard kebuka
function focusGhost() { if (!activeModal) ghost.focus({ preventScroll: true }); }
document.addEventListener('pointerdown', focusGhost);
window.addEventListener('load', focusGhost);
// isi ghost dibuang — game baca dari keydown document, input cuma pembuka keyboard
ghost.addEventListener('input', () => { if (ghost.value) ghost.value = ''; });
function drawGraph() {
  const w = graphEl.width, h = graphEl.height;
  gtx.clearRect(0, 0, w, h);
  gtx.fillStyle = '#2e2444';
  for (let y = 0; y < h; y += 6) gtx.fillRect(0, y, w, 1);
  if (samples.length < 2) return;
  const max = Math.max(40, ...samples);
  const step = w / (samples.length - 1);
  gtx.fillStyle = 'rgba(255,215,94,.15)';
  gtx.beginPath();
  gtx.moveTo(0, h);
  samples.forEach((s, i) => gtx.lineTo(i * step, h - (s / max) * (h - 4)));
  gtx.lineTo((samples.length - 1) * step, h);
  gtx.fill();
  gtx.strokeStyle = '#ffd75e';
  gtx.lineWidth = 1;
  gtx.beginPath();
  samples.forEach((s, i) => {
    const x = i * step, y = h - (s / max) * (h - 4);
    i ? gtx.lineTo(x, y) : gtx.moveTo(x, y);
  });
  gtx.stroke();
  const lx = (samples.length - 1) * step;
  const ly = h - (samples[samples.length - 1] / max) * (h - 4);
  gtx.fillStyle = '#8be08b';
  gtx.fillRect(lx - 1, ly - 1, 3, 3);
}

setInterval(() => {
  if (startTime && mode === 'normal' && lastWpm > 0) {
    samples.push(lastWpm);
    if (samples.length > 90) samples.shift();
    drawGraph();
  }
  updateStats();
  if (totalWords - sessionStartWords >= 10 && btnStruk.disabled) {
    btnStruk.disabled = false;
    btnStruk.title = 'Buka Struk Shift';
  }
}, 1000);

getDailyQuests();
applyTheme();
buildPools();
resetQueue();
renderWord();
document.getElementById('btnRain').style.display = unlocks.includes('rain_amb') ? '' : 'none';
if (unlocks.includes('rain_amb') && rainOn) setRain(true);
if (equippedDrink === 'matcha') document.body.classList.add('drink-matcha');
say('selamat ' + (document.body.className.match(/scene-(\w+)/)?.[1] || 'datang') + '! ketik kata-nya, pelan-pelan saja', 'idle');
bumpIdle();
