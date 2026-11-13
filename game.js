'use strict';

const WORDS = window.WORDS;

const wordEl = document.getElementById('word');
const wpmEl = document.getElementById('wpm');
const wordsEl = document.getElementById('words');
const streakEl = document.getElementById('streak');
const bestEl = document.getElementById('best');
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

bestEl.textContent = best;

(function dayPass() {
  const key = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const todayK = key(new Date());
  const yestK = key(new Date(Date.now() - 864e5));
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

function pickWord() {
  const list = WORDS[pool] || WORDS.umum;
  let w;
  do {
    w = list[(Math.random() * list.length) | 0];
  } while (list.length > 1 && w === word);
  return w;
}

function nextWord() {
  word = pickWord();
  idx = 0;
  wrongIdx = -1;
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
      nextWord();
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
  if (typeTimer) { clearInterval(typeTimer); typeTimer = null; }
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
  if (idleTimer) clearTimeout(idleTimer);
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
  bump(wpmEl, lastWpm);
  bump(wordsEl, totalWords);
  bump(streakEl, streak);
  bump(bestEl, best);
  sessionEl.textContent = 'sesi: ' + totalWords + ' kata · ' + Math.floor(activeMs / 60000) + ' mnt';
}

function completeWord(auto) {
  totalWords++;
  streak++;
  if (mode === 'normal') {
    fever = Math.min(tune.fever_max, fever + tune.fever_gain);
    feverFill.style.width = (fever / tune.fever_max * 100) + '%';
    floater('+1');
    sfx('word');
    if (streak % 10 === 0) { floater('STREAK x' + streak + '!', true); burst(14, true); say('mantap! streak ' + streak + '!', 'happy'); sfx('streak'); }
    if (fever >= tune.fever_max) startFever();
  } else {
    burst(5);
    comboEl.textContent = 'x' + (totalWords - feverStartWords);
    comboEl.classList.remove('bump');
    void comboEl.offsetWidth;
    comboEl.classList.add('bump');
  }
  updateStats();
  nextWord();
  renderWord();
}

function startFever() {
  mode = 'fever';
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
  say('FEVER!! sekejap lagi!', 'happy');
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
  comboEl.textContent = 'x0';
  rainTimer = setInterval(rain, 140);
  hint.innerHTML = 'FEVER MODE!!<br>spam SPACE secepatnya, kata auto kelar';
  feverTimer = setInterval(() => {
    feverLeft -= feverTotal * (100 / tune.fever_drain_ms);
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
  hint.innerHTML = 'ketik kata-nya &middot; salah nggak apa-apa<br>bar penuh = FEVER: spam SPACE, kata auto kelar';
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
function blip(freq, dur, type, vol, when) {
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
  o.connect(g); g.connect(ctx.destination);
  o.start(t); o.stop(t + dur + 0.02);
}
function sfx(name) {
  if (!soundOn) return;
  switch (name) {
    case 'key': blip(620 + Math.random() * 160, 0.045, 'square', 0.035); break;
    case 'word': blip(523, 0.07, 'square', 0.06); blip(784, 0.09, 'square', 0.05, 0.06); break;
    case 'wrong': blip(150, 0.12, 'sawtooth', 0.07); break;
    case 'streak': blip(880, 0.08, 'triangle', 0.06); blip(1174, 0.1, 'triangle', 0.05, 0.07); break;
    case 'fever': [523, 659, 784, 1046].forEach((f, i) => blip(f, 0.12, 'square', 0.07, i * 0.07)); break;
    case 'end': [784, 659, 523].forEach((f, i) => blip(f, 0.1, 'square', 0.05, i * 0.07)); break;
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
  if (soundOn) sfx('word');
});
updateSoundBtn();
let lastKeyAt = 0;
document.addEventListener('keydown', (e) => {
  if (e.key === ' ') e.preventDefault();
  bumpIdle();

  if (mode === 'fever') {
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
    sfx('key');
    if (idx === word.length) completeWord(false);
    else { popChar(idx - 1); refreshChars(); }
  } else {
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
function focusGhost() { ghost.focus({ preventScroll: true }); }
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
}, 1000);

const hourNow = new Date().getHours();
const scene = hourNow < 5 ? 'malam' : hourNow < 11 ? 'pagi' : hourNow < 15 ? 'siang' : hourNow < 19 ? 'senja' : 'malam';
document.body.classList.add('scene-' + scene);
buildPools();
nextWord();
renderWord();
say('selamat ' + scene + '! ketik kata-nya, pelan-pelan saja', 'idle');
bumpIdle();
