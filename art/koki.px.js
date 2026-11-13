// KOKI the barista cat - premium pixel sprites for Typing Fever
// light from top-left; base 30x30 + 1px outline = 32x32 final
pal({
  k: "#241823", // outline
  l: "#ffb870", // orange light
  o: "#ef9445", // orange mid
  O: "#c56a2e", // orange dark
  c: "#f7e9cf", // cream light
  C: "#dcc49a", // cream shade
  w: "#fff8f0", // eye white
  g: "#58b368", // iris
  G: "#2e7d4f", // iris dark
  p: "#e8838f", // pink
  P: "#c4536b", // pink dark
  b: "#8a5a3a", // apron
  B: "#6a4028", // apron dark
  d: "#402418", // coffee
  s: "#cfc3e8", // steam / zzz
  y: "#ffd75e", // accent gold
});
ramps("kOol", "kBCb", "kGPg", "kPCp");

// --- shared parts ---

function ears(c) {
  c.poly([5, 0, 10, 7, 2, 7], "o");
  c.poly([24, 0, 27, 7, 19, 7], "o");
  c.poly([5, 3, 7, 5, 4, 5], "p");
  c.poly([24, 3, 25, 5, 22, 5], "p");
}

function head(c) {
  c.ellipse(15, 10, 13, 8, "o");
  // directional light: top-left, diagonal terminator
  c.light((x, y) => x < 15 && y < 11 && (x - 2) * 1.4 + (y - 2) * 1.0 < 14, 1);
  c.shade((x, y) => x > 15 && y > 10 && (27 - x) + (17 - y) < 8, 1, 0.6);
  // forehead tabby M
  c.vline(11, 4, 2, "O"); c.vline(14, 3, 3, "O"); c.vline(17, 4, 2, "O");
  c.px(12, 4, "O"); c.px(16, 4, "O");
}

function muzzle(c, mouth) {
  c.ellipse(15, 14, 5, 3, "c");
  c.shade([10, 15, 10, 3], 1);
  c.rect(14, 12, 2, 2, "p");
  c.px(14, 13, "P");
  if (mouth === 'smile') { c.px(14, 16, "k"); c.px(15, 16, "k"); c.px(13, 15, "k"); c.px(16, 15, "k"); }
  else if (mouth === 'open') { c.rect(13, 14, 4, 3, "k"); c.rect(14, 15, 2, 2, "P"); }
  else if (mouth === 'flat') { c.hline(13, 16, 4, "k"); }
  // whisker dots
  c.px(4, 12, "P"); c.px(3, 14, "P"); c.px(25, 12, "P"); c.px(26, 14, "P");
}

function eyes(c, kind) {
  if (kind === 'open') {
    c.circ(7, 10, 2, "w"); c.ring(7, 10, 2, "k");
    c.circ(7, 10, 1, "g"); c.px(7, 11, "G");
    c.px(6, 9, "w");
    c.circ(22, 10, 2, "w"); c.ring(22, 10, 2, "k");
    c.circ(22, 10, 1, "g"); c.px(22, 11, "G");
    c.px(21, 9, "w");
  } else if (kind === 'closed') { // ^^ happy
    c.px(5, 10, "k"); c.px(6, 9, "k"); c.px(7, 9, "k"); c.px(8, 9, "k"); c.px(9, 10, "k");
    c.px(20, 10, "k"); c.px(21, 9, "k"); c.px(22, 9, "k"); c.px(23, 9, "k"); c.px(24, 10, "k");
  } else if (kind === 'shut') { // sleeping / blinking, gentle line
    c.hline(5, 10, 5, "k");
    c.hline(20, 10, 5, "k");
  } else if (kind === 'sparkle') { // fever: wide + gold glints
    c.circ(7, 10, 2, "w"); c.ring(7, 10, 2, "k");
    c.circ(7, 10, 1, "g"); c.px(7, 11, "G");
    c.px(8, 9, "y"); c.px(6, 9, "w");
    c.circ(22, 10, 2, "w"); c.ring(22, 10, 2, "k");
    c.circ(22, 10, 1, "g"); c.px(22, 11, "G");
    c.px(23, 9, "y"); c.px(21, 9, "w");
  }
}

function body(c) {
  // torso
  c.ellipse(15, 24, 9, 5, "o");
  c.shade([15, 26, 10, 4], 1, 0.7);
  // chest cream flows from the muzzle
  c.ellipse(15, 20, 4, 2, "c");
  // apron
  c.rect(8, 21, 14, 7, "b");
  c.px(8, 21, "_"); c.px(21, 21, "_"); c.px(8, 27, "_"); c.px(21, 27, "_");
  c.hline(8, 21, 14, "B");
  c.shade([8, 25, 14, 3], 1, 0.8);
  // apron stitch line
  c.hline(8, 26, 14, "B");
  // steam over the chest
  c.px(14, 20, "s"); c.px(16, 19, "s");
  // cup held between paws
  c.box(12, 21, 6, 5, "B");
  c.rect(13, 22, 4, 1, "d");
  c.rect(13, 23, 4, 2, "w");
  c.shade([13, 24, 4, 1], 1);
  // paws gripping the cup
  c.ellipse(9, 25, 2, 2, "o");
  c.ellipse(21, 25, 2, 2, "o");
  c.px(9, 24, "l"); c.px(21, 24, "l");
  // front feet
  c.ellipse(8, 28, 2, 1, "o"); c.ellipse(22, 28, 2, 1, "o");
  // tail curling up the right side, shaded so it reads separate
  c.line(23, 28, 28, 23, "O", 2);
  c.px(28, 22, "l"); c.px(27, 23, "l");
}

// --- poses (each built fresh from shared parts; no stamping/patching) ---

sprite("koki_idle", { w: 30, h: 30, outline: "k" }, (c) => {
  ears(c); head(c); muzzle(c, 'smile'); eyes(c, 'open'); body(c);
});

sprite("koki_blink", { w: 30, h: 30, outline: "k" }, (c) => {
  ears(c); head(c); muzzle(c, 'smile'); eyes(c, 'shut'); body(c);
});

sprite("koki_happy", { w: 30, h: 30, outline: "k" }, (c) => {
  ears(c); head(c); muzzle(c, 'smile'); eyes(c, 'closed'); body(c);
});

sprite("koki_sleep", { w: 30, h: 30, outline: "k" }, (c) => {
  ears(c); head(c); muzzle(c, 'flat'); eyes(c, 'shut'); body(c);
  // zzz drifting from the head
  c.px(11, 6, "s"); c.px(12, 5, "s"); c.px(13, 4, "s");
  c.px(12, 3, "s"); c.px(13, 2, "s");
});

sprite("koki_fever", { w: 30, h: 30, outline: "k" }, (c) => {
  ears(c); head(c); muzzle(c, 'open'); eyes(c, 'sparkle'); body(c);
  // cheeks flushed + sparkles
  c.px(4, 12, "p"); c.px(25, 12, "p");
  c.px(2, 3, "y"); c.px(28, 5, "y"); c.px(27, 15, "y"); c.px(3, 16, "y");
});
