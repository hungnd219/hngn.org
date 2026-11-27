// The screen the game opens on, BETWEEN HOUSES, and the scene behind its title menu. Amber on the
// left and Garnet on the right, the dusk sky between them, the sun going down over the river and the
// far bank, and Shark and Orca on a stone ledge in front of it all, high up, looking out over the garden. The title is the display face of
// src/display-type.js (its `title` cut).
//
// Everything but the words is drawn on a grid of 2 x 2 screen pixels, the size the cats' own pixels
// are drawn at, so the sky's steps, the sun's rim and the buildings have the same grain as the cats.
// The words (the title, and the prompt in the game's own font) stay at the screen's own pixels, as
// all text does in the game.
//
// What moves, each on its own clock, all of it slow:
//   the cats    each has a little script of its own, chosen as it goes: look out at the view, turn
//               around to face us (and blink), look at the other one, walk a few steps along the ledge
//               and sit again, lie down for a while. They never walk through each other.
//   windows     every second or two one goes on or off (the share lit stays between a third and
//               three fifths), and now and then one flickers blue for a while: a TV.
//   a bird      crosses the sky every 15 to 25 seconds, behind the towers, flapping and gliding.
//   the rest    stars twinkle, the sun's glints move on the river, the prompt blinks.
//
// Two modes. 'press': all of the above, and the prompt. 'menu' (the title menu is up, its box in the
// gap between the towers): the scene dims, all but the title; the prompt goes; the cats trot to the
// two places beside the box and stay there, still sitting, turning, blinking and lying down, but
// walking no more.
//
// createTitle({ prompt }) gives { step(), draw(g), menu(on, box), bird(), nudge(), state() }: step()
// moves the screen on by one frame (60 a second), draw(g) paints it onto a 320 x 208 canvas, menu()
// switches the mode (box: { x, w }, the menu box's left edge and width); bird() and nudge() start a
// bird, or the next move of both cats, at once (for looking at it).

import { R } from './palette.js';
import { drawText, textWidth } from './font.js';
import { makeCat, CAT_PALS } from './sprites.js';
import { word, grow, paint, extrude, edge } from './display-type.js';

export const VW = 320, VH = 208;
const LEDGE = 178; // the top of the ledge in the foreground, in front of the towers: the cats sit on it
const FEET = 182; // where a cat's feet are, a little way into the ledge's top
const HORIZON = 126; // the far bank's foot, where the river starts

// ---- the colours: the dusk sky from the top down, and what is set against it
const SKY = ['#1b1830', '#221d3c', '#2c2650', '#3b2f5e', '#523867', '#704266', '#94505f', '#b9614f', '#d97d48', '#eda159'];
const COL = {
  star: '#efe2c8', starDim: '#8a84a8',
  sun: '#f7e3a0', sunRim: '#f2c06a',
  bank: '#3a2b4c', bankLit: '#f2c06a',
  river: '#3d3a66', riverLine: '#4a4578', glint: '#f2c06a', glintHi: '#f7e3a0',
  tree: '#1c2a2a', treeDark: '#152320',
  ledgeTop: '#4a4058', ledgeLip: '#5e5270', ledgeFace: '#2a2234', ledgeJoint: '#211a2a', ledgeShadow: '#16121f',
  treeBack: '#22332e', lamp: '#f7dc8a', post: '#3a3848',
  bird: '#241f3a',
  amber: { body: '#1f1a2b', edge: '#2c2540', trim: '#3a3050', dark: '#2a2438', lit: ['#f2c14a', '#f0a93a', '#f7dc8a'] },
  garnet: { body: '#241821', edge: '#3a222c', trim: '#4a2a36', dark: '#33222c', lit: ['#f4b6a0', '#e8847a', '#f7d0b8'] },
  tv: ['#9fb4e8', '#c7d4f2', '#7f96d8'],
  prompt: '#efe2c8', ink: '#17121c',
};

// a number from 0 to 1 that is always the same for the same n (for what does not move)
const fixed = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
// a block on the 2 x 2 grid (x, y, w, h in screen pixels, all even)
const B = R;
// a disc of 2 x 2 cells: colour(d) gives the colour of a cell at distance d from the centre, or null
function disc(g, cx, cy, r, colour) {
  for (let y = cy - r - 2; y <= cy + r + 2; y += 2) for (let x = cx - r - 2; x <= cx + r + 2; x += 2) {
    const d = Math.hypot(x + 1 - cx, y + 1 - cy);
    if (d > r) continue;
    const c = colour(d);
    if (c) B(g, x, y, 2, 2, c);
  }
}
const even = (v) => Math.round(v / 2) * 2;

// ---- the towers: their outlines, and their windows (each window is one that can go on and off)
function towerWindows(kind, x0, x1, top, seed) {
  const list = [];
  for (let y = top + 8; y + 8 <= LEDGE; y += 14) for (let x = x0; x + 8 <= x1; x += 12) {
    list.push({ kind, x, y, lit: fixed(seed + x * 7 + y * 13) < 0.45, colour: COL[kind].lit[Math.floor(fixed(seed + x + y * 3) * 3)], tv: 0 });
  }
  return list;
}
const AMBER = { x: 0, w: 66, top: 36 };
const GARNET = { x: 254, w: 66, top: 46 };

function drawTowers(g, wins) {
  // Amber: a plain block, a room on the roof with an aerial
  const a = COL.amber;
  B(g, 0, AMBER.top, 66, LEDGE - AMBER.top, a.body); B(g, 64, AMBER.top, 2, LEDGE - AMBER.top, a.edge);
  B(g, 0, AMBER.top, 66, 2, a.trim);
  B(g, 8, 24, 22, 12, a.body); B(g, 8, 24, 22, 2, a.trim); B(g, 18, 12, 2, 12, a.trim); B(g, 16, 12, 6, 2, a.trim);
  // Garnet: lower, a water tank on legs
  const n = COL.garnet;
  B(g, 254, GARNET.top, 66, LEDGE - GARNET.top, n.body); B(g, 254, GARNET.top, 2, LEDGE - GARNET.top, n.edge);
  B(g, 254, GARNET.top, 66, 2, n.trim);
  B(g, 290, 30, 18, 10, n.trim); B(g, 290, 30, 18, 2, n.edge); B(g, 292, 40, 2, 6, n.trim); B(g, 304, 40, 2, 6, n.trim);
  // the windows
  for (const w of wins) {
    const t = COL[w.kind];
    const c = w.tv ? COL.tv[w.tvShade] : w.lit ? w.colour : t.dark;
    B(g, w.x, w.y, 8, 8, c);
    if (w.lit || w.tv) B(g, w.x, w.y + 6, 8, 2, 'rgba(0,0,0,0.18)');
  }
}

// ---- the fixed part of the picture, painted once, in three layers: behind (sky, sun, far bank,
// river); the garden's trees, in front of the river's glints and the bird; and the ledge, in front
// of the towers
function backdrop(g) {
  const h = 12;
  SKY.forEach((c, i) => {
    B(g, 0, i * h, VW, h, c);
    if (i) for (let x = 0; x < VW; x += 4) B(g, x + ((i % 2) * 2), i * h, 2, 2, SKY[i - 1]);
    if (i < SKY.length - 1) for (let x = 0; x < VW; x += 8) B(g, x + 4, i * h + h - 2, 2, 2, SKY[i + 1]);
  });
  B(g, 0, SKY.length * h, VW, VH - SKY.length * h, SKY[SKY.length - 1]);
  // the sun, low, its rim a step darker
  disc(g, 160, HORIZON - 6, 22, (d) => (d > 18 ? COL.sunRim : COL.sun));
  // the far bank: low blocks, a few lit windows
  for (let i = 0; i < 26; i++) {
    const x = i * 14 - 6, top = HORIZON - 20 + even(fixed(i + 40) * 14);
    B(g, x, top, 12, HORIZON - top, COL.bank);
    for (let y = top + 4; y < HORIZON - 4; y += 6) for (let wx = x + 2; wx < x + 10; wx += 4) if (fixed(wx * 3 + y) > 0.72) B(g, wx, y, 2, 2, COL.bankLit);
  }
  // the river
  B(g, 0, HORIZON, VW, LEDGE - HORIZON, COL.river); // (down behind the trees, so no sky shows between them)
  for (const y of [HORIZON + 4, HORIZON + 10]) B(g, 0, y, VW, 2, COL.riverLine);
}
function garden(g) {
  // the garden from above: a back row of tree tops on the far side, the near row, a few lamps lit
  for (let i = 0; i < 26; i++) disc(g, i * 13 + even(fixed(i + 30) * 6), 146 + even(fixed(i + 50) * 4), 5 + even(fixed(i + 70) * 3), () => COL.treeBack);
  B(g, 0, 148, VW, 6, COL.treeBack);
  for (const x of [46, 118, 196, 270]) { B(g, x, 150, 2, 8, COL.post); B(g, x, 148, 2, 2, COL.lamp); }
  for (let i = 0; i < 24; i++) disc(g, 6 + i * 14 + even(fixed(i + 60) * 6), 162 + even(fixed(i + 90) * 4), 8 + even(fixed(i + 120) * 4), () => (i % 2 ? COL.tree : COL.treeDark));
  B(g, 0, 166, VW, LEDGE - 166, COL.treeDark);
}
function ledge(g) {
  // a stone ledge across the whole front: its top, a lighter lip, the face below it with its joints
  B(g, 0, LEDGE - 2, VW, 2, COL.ledgeShadow);
  B(g, 0, LEDGE, VW, 8, COL.ledgeTop); B(g, 0, LEDGE, VW, 2, COL.ledgeLip);
  B(g, 0, LEDGE + 8, VW, 2, COL.ledgeLip); B(g, 0, LEDGE + 10, VW, VH - LEDGE - 10, COL.ledgeFace);
  B(g, 0, LEDGE + 10, VW, 2, COL.ledgeShadow);
  for (let x = 22; x < VW; x += 48) { B(g, x, LEDGE, 2, 8, COL.ledgeShadow); B(g, x + 24, LEDGE + 12, 2, VH - LEDGE - 12, COL.ledgeJoint); }
}

// ---- the title, painted once
function titleWords(g) {
  const fill = (x, y, W) => {
    const t = y / (W.h - 1);
    return t < 0.12 ? '#fff6e6' : t < 0.3 ? '#f7f1e3' : t < 0.46 ? '#e9d3e6' : t < 0.52 ? '#704266' : t < 0.68 ? '#f7d48a' : t < 0.84 ? '#f2b05a' : '#e58f4a';
  };
  const one = (str, y) => {
    const W = word(str, 'title');
    const x = Math.round(160 - W.w / 2);
    extrude(g, grow(W, 1), x, y, 3, 1, 1, (k) => (k === 3 ? '#151227' : '#3b2f5e'));
    paint(g, grow(W, 1), x, y, '#151227');
    paint(g, W, x, y, fill);
    paint(g, W, x, y, (px, py) => (edge(W, px, py) && py < W.h / 2 ? '#ffffff' : null));
    return W.h;
  };
  const h = one('BETWEEN', 20);
  one('HOUSES', 20 + h + 6);
}

// ---- the moving parts
export function createTitle({ seed = Date.now(), prompt = 'PRESS X TO START' } = {}) {
  // a random stream of our own, so a seed gives the same screen every time
  let s = seed >>> 0 || 1;
  const rnd = () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  const between = (a, b) => a + rnd() * (b - a);
  const sec = (v) => Math.round(v * 60);

  const still = document.createElement('canvas');
  still.width = VW; still.height = VH;
  const sg = still.getContext('2d');
  backdrop(sg);
  const front = document.createElement('canvas');
  front.width = VW; front.height = VH;
  garden(front.getContext('2d'));
  const sill = document.createElement('canvas');
  sill.width = VW; sill.height = VH;
  ledge(sill.getContext('2d'));
  const words = document.createElement('canvas');
  words.width = VW; words.height = VH;
  titleWords(words.getContext('2d'));

  const wins = [...towerWindows('amber', 6, 64, AMBER.top, 3), ...towerWindows('garnet', 260, 320, GARNET.top, 8)];
  const stars = Array.from({ length: 30 }, (_, i) => ({ x: 70 + even(fixed(i + 7) * 180), y: even(fixed(i + 507) * 80), bright: fixed(i + 907) > 0.6 }));
  const glints = Array.from({ length: 8 }, () => ({ x: 0, y: 0, w: 0 }));
  const moveGlints = () => glints.forEach((gl, i) => { gl.y = HORIZON + 2 + 2 * (i % 6); gl.w = even(between(4, 14 - (i % 6) * 2)); gl.x = even(160 - gl.w / 2 + between(-14, 14)); });
  moveGlints();

  // the cats: a pose, a place on the wall, and what they are doing now
  const sprites = { shark: makeCat(CAT_PALS.shark), orca: makeCat(CAT_PALS.orca) };
  const cats = [
    { name: 'shark', x: 128, pose: 'up', act: null, left: sec(between(2, 4)), blink: 0, frame: 0, lazy: 0.08 },
    { name: 'orca', x: 162, pose: 'up', act: null, left: sec(between(3, 6)), blink: 0, frame: 0, lazy: 0.13 },
  ];
  const MIN = 6, MAX = VW - 38, GAP = 30; // (the whole ledge: in front of the towers too)
  function choose(c, o) {
    // waking up comes first
    if (c.pose === 'sleep' || c.pose === 'sleepR') return { pose: 'up', for: between(3, 5) };
    const r = rnd();
    if (r < c.lazy) return { pose: o.x < c.x ? 'sleep' : 'sleepR', for: between(6, 11) };
    if (r < 0.32 && mode === 'press') {
      // a few steps along the ledge, never past the other one
      const lo = c.x < o.x ? MIN : o.x + GAP, hi = c.x < o.x ? o.x - GAP : MAX;
      if (hi - lo > 12) {
        let to = even(between(lo, hi));
        if (Math.abs(to - c.x) < 10) to = even(c.x < (lo + hi) / 2 ? hi : lo);
        return { walk: to };
      }
    }
    if (r < 0.52) return { pose: 'down', for: between(3, 5) };
    if (r < 0.66) return { pose: o.x < c.x ? 'left' : 'right', for: between(2, 4) };
    return { pose: 'up', for: between(5, 10) };
  }
  function stepCat(c, o) {
    if (c.blink) c.blink--;
    if (c.pose === 'down' && !c.blink && rnd() < 1 / 150) c.blink = 9;
    if (c.goTo != null) {
      // to the side of the menu box, at a trot; waiting if the other one is still in the way
      const dir = Math.sign(c.goTo - c.x);
      if (!dir) { c.goTo = null; c.pose = c.x < VW / 2 ? 'right' : 'left'; c.left = sec(between(1, 2)); return; }
      c.pose = dir < 0 ? 'walkL' : 'walkR';
      c.frame += 2;
      if (Math.abs(o.x - (c.x + dir)) < GAP - 6 && Math.sign(o.x - c.x) === dir) return;
      c.x += dir;
      return;
    }
    if (c.act && c.act.walk != null) {
      const dir = Math.sign(c.act.walk - c.x);
      // stop short of the other cat if it has walked into the way
      const blocked = Math.abs(o.x - (c.x + dir)) < GAP - 2 && Math.sign(o.x - c.x) === dir;
      if (c.act.turn > 0) { c.act.turn--; return; }
      if (c.x === c.act.walk || blocked) { c.pose = dir < 0 ? 'left' : 'right'; c.act = null; c.left = sec(0.6); return; }
      c.pose = dir < 0 ? 'walkL' : 'walkR';
      if (++c.frame % 3 === 0) c.x += dir; // a slow walk: 20 pixels a second
      return;
    }
    if (--c.left > 0) return;
    const next = choose(c, o);
    if (next.walk != null) {
      c.act = { walk: next.walk, turn: sec(0.4) };
      c.pose = next.walk < c.x ? 'left' : 'right';
    } else {
      c.act = null;
      c.pose = next.pose;
      c.left = sec(next.for);
    }
  }
  function catSprite(c) {
    const sp = sprites[c.name];
    switch (c.pose) {
      case 'up': return sp.sit.up;
      case 'down': return c.blink ? sp.blink : sp.sit.down;
      case 'left': return sp.sit.left;
      case 'right': return sp.sit.right;
      case 'walkL': return sp.walk.left[(c.frame >> 4) & 1];
      case 'walkR': return sp.walk.right[(c.frame >> 4) & 1];
      case 'sleep': return sp.sleep;
      default: return sp.sleepR;
    }
  }

  // the windows: one goes on or off every second or two; now and then a TV
  let nextWindow = sec(between(0.6, 1.8)), nextTV = sec(between(6, 12));
  function stepWindows() {
    if (--nextWindow <= 0) {
      nextWindow = sec(between(0.7, 2.4));
      const share = wins.filter((w) => w.lit).length / wins.length;
      const want = share > 0.6 ? false : share < 0.33 ? true : rnd() < 0.5;
      const pool = wins.filter((w) => w.lit !== want && !w.tv);
      if (pool.length) pool[Math.floor(rnd() * pool.length)].lit = want;
    }
    if (--nextTV <= 0) {
      nextTV = sec(between(14, 26));
      const pool = wins.filter((w) => !w.tv);
      const w = pool[Math.floor(rnd() * pool.length)];
      w.tv = sec(between(4, 8)); w.tvShade = 0; w.tvNext = 0;
    }
    for (const w of wins) {
      if (!w.tv) continue;
      if (--w.tvNext <= 0) { w.tvShade = Math.floor(rnd() * 3); w.tvNext = Math.round(between(5, 18)); }
      if (--w.tv <= 0) { w.tv = 0; w.lit = rnd() < 0.5; }
    }
  }

  // the bird: crosses behind the towers, flapping, and now and then gliding
  let bird = null, nextBird = sec(between(3, 5));
  const startBird = () => {
    const dir = rnd() < 0.5 ? 1 : -1;
    bird = { dir, x: dir > 0 ? -12 : VW + 2, y: even(between(84, 98)), age: 0, glide: 0 };
  };
  function stepBird() {
    if (!bird) { if (--nextBird <= 0) startBird(); return; }
    bird.age++;
    bird.x += bird.dir * 0.7;
    if (bird.glide > 0) bird.glide--; else if (rnd() < 1 / 160) bird.glide = sec(between(0.6, 1.2));
    if (bird.x < -14 || bird.x > VW + 4) { bird = null; nextBird = sec(between(15, 25)); }
  }
  const BIRD = [
    ['X...X', '.X.X.', '..X..'], // wings up
    ['.....', 'XX.XX', '..X..'], // wings level
    ['.....', '..X..', 'XX.XX'], // wings down
  ];
  function drawBird(g) {
    if (!bird) return;
    const flap = bird.glide ? 1 : [0, 1, 2, 1][(bird.age >> 3) & 3];
    const y = even(bird.y + Math.sin(bird.age / 40) * 3);
    const x = even(bird.x);
    BIRD[flap].forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') B(g, x + i * 2, y + j * 2, 2, 2, COL.bird); }));
  }

  let t = 0, mode = 'press', dim = 0;
  return {
    step() {
      t++;
      dim = mode === 'menu' ? Math.min(1, dim + 1 / 12) : Math.max(0, dim - 1 / 12);
      stepCat(cats[0], cats[1]);
      stepCat(cats[1], cats[0]);
      stepWindows();
      stepBird();
      if (t % 30 === 0) moveGlints();
      if (t % 20 === 0) { const st = stars[Math.floor(rnd() * stars.length)]; st.bright = !st.bright; }
    },
    draw(g) {
      g.drawImage(still, 0, 0);
      for (const st of stars) if (st.y < 84) B(g, st.x, st.y, 2, 2, st.bright ? COL.star : COL.starDim);
      for (const gl of glints) B(g, gl.x, gl.y, gl.w, 2, gl.w > 8 ? COL.glintHi : COL.glint);
      drawBird(g);
      g.drawImage(front, 0, 0);
      drawTowers(g, wins);
      g.drawImage(sill, 0, 0);
      for (const c of [...cats].sort((a, b) => (a.pose.startsWith('sleep') ? -1 : 0) - (b.pose.startsWith('sleep') ? -1 : 0))) {
        const sp = catSprite(c);
        g.drawImage(sp, c.x, FEET - sp.height * 2, sp.width * 2, sp.height * 2);
      }
      // under the title menu, the scene dims, all but the title
      if (dim) { g.fillStyle = 'rgba(17,14,25,' + (0.58 * dim).toFixed(3) + ')'; g.fillRect(0, 0, VW, VH); }
      g.drawImage(words, 0, 0);
      // the prompt, blinking: on for a second, off for a third of one
      if (mode === 'press' && !dim && t % 80 < 60) {
        const str = prompt, x = Math.round(160 - textWidth(str) / 2);
        drawText(g, str, x + 1, 196, COL.ink);
        drawText(g, str, x, 195, COL.prompt);
      }
    },
    bird() { if (!bird) startBird(); },
    // the title menu up or down. Up: the cats go to either side of its box (the one further left to the
    // left), and walk no more until it is down again
    menu(on, box) {
      mode = on ? 'menu' : 'press';
      for (const c of cats) { c.act = null; c.goTo = null; if (c.pose.startsWith('walk') || c.pose.startsWith('sleep')) c.pose = 'up'; c.left = sec(between(1, 2)); }
      if (!on || !box) return;
      const [a, b] = [...cats].sort((p, q) => p.x - q.x);
      a.goTo = Math.max(MIN, box.x - 34);
      b.goTo = Math.min(VW - 32, box.x + box.w + 2);
    },
    // (for checks: where the bird and the cats are)
    state: () => ({ mode, dim, bird: bird && { x: bird.x, y: bird.y }, cats: cats.map((c) => ({ name: c.name, x: c.x, pose: c.pose, going: c.goTo != null })) }),
    nudge() { for (const c of cats) { c.left = 0; if (c.act && c.act.walk != null) c.act.walk = c.x; } },
  };
}
