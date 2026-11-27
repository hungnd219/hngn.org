// A display face for the title, BETWEEN HOUSES: not the game's body font made bigger, but capitals
// drawn at their full size, stem by stem, and then slanted a pixel at a time (a pixel italic: each
// row moves one pixel right for every `slant` rows it is above the baseline). Only the nine letters
// the title needs are drawn: B E T W N H O U S.
//
// One builder, five cuts of it, so that the five title candidates do not share one look:
//   arcade  heavy, square, the outer corners cut off at 45 degrees
//   slab    thick stems, thin bars, slab serifs: a storybook italic
//   racer   wide and low, leaning hard, for speed stripes
//   neon    a thin line with rounded corners, for a sign in glass tubes
//   bubble  fat and soft, for a deep 3D drop
//   title   the arcade cut a size smaller: the one the title screen uses (src/title-screen.js)
// A word comes back as a mask (rows of 0 and 1), and the effects below turn a mask into pixels:
// fill by row, outline, extrusion, glow, slits, a highlight on the upper left edges.

export const CUTS = {
  arcade: { w: 22, h: 30, stem: 6, bar: 5, cut: 6, serif: 0, slant: 3, track: 3 },
  // the arcade cut a size smaller, for the title screen: the two words sit in the sky between the towers
  title: { w: 18, h: 24, stem: 5, bar: 4, cut: 5, serif: 0, slant: 3, track: 3 },
  slab: { w: 20, h: 28, stem: 6, bar: 3, cut: 0, serif: 3, slant: 4, track: 2 },
  racer: { w: 30, h: 22, stem: 6, bar: 5, cut: 5, serif: 0, slant: 2, track: 3 },
  neon: { w: 18, h: 26, stem: 2, bar: 2, cut: 4, serif: 0, slant: 3, track: 5 },
  bubble: { w: 24, h: 28, stem: 7, bar: 6, cut: 7, serif: 0, slant: 4, track: 2 },
};

function glyph(ch, p) {
  const { w, h, stem: S, bar: B, cut: c, serif: f } = p;
  const W = w + 2 * f;
  const m = Array.from({ length: h }, () => new Array(W).fill(0));
  const rect = (x, y, rw, rh, v = 1) => {
    for (let j = Math.max(0, y); j < Math.min(h, y + rh); j++) for (let i = Math.max(0, x + f); i < Math.min(W, x + f + rw); i++) m[j][i] = v;
  };
  // clear a staircase off one corner of a box: 'tl', 'tr', 'bl' or 'br'
  const cutBox = (bx, by, bw, bh, corner, n = c) => {
    for (let j = 0; j < n; j++) for (let i = 0; i < n - j; i++) {
      const x = corner[1] === 'l' ? bx + i : bx + bw - 1 - i;
      const y = corner[0] === 't' ? by + j : by + bh - 1 - j;
      if (y >= 0 && y < h && x + f >= 0 && x + f < W) m[y][x + f] = 0;
    }
  };
  // a stem with slab serifs at the ends named
  const stem = (x, y, sh, ends = 'tb') => {
    rect(x, y, S, sh);
    if (!f) return;
    if (ends.includes('t')) rect(x - f, y, S + 2 * f, B);
    if (ends.includes('b')) rect(x - f, y + sh - B, S + 2 * f, B);
  };
  const mid = Math.round((h - B) / 2);
  switch (ch) {
    case 'B': {
      const top = mid + B;
      stem(0, 0, h, f ? 'tb' : '');
      rect(0, 0, w - 2, B); rect(0, mid, w - 1, B); rect(0, h - B, w, B);
      rect(w - 2 - S, 0, S, top); rect(w - S, mid, S, h - mid);
      cutBox(0, 0, w - 2, top, 'tr'); cutBox(0, mid, w, h - mid, 'br');
      if (c) { cutBox(0, 0, w, h, 'tl', Math.ceil(c / 2)); cutBox(0, 0, w, h, 'bl', Math.ceil(c / 2)); }
      break;
    }
    case 'E':
      stem(0, 0, h, ''); rect(0, 0, w, B); rect(0, mid, w - 3, B); rect(0, h - B, w, B);
      if (f) { rect(w - B, 0, B, B + f + 1); rect(w - B, h - B - f - 1, B, B + f + 1); }
      if (c) { cutBox(0, 0, w, h, 'tl'); cutBox(0, 0, w, h, 'bl'); }
      break;
    case 'T': {
      const x = Math.round((w - S) / 2);
      rect(0, 0, w, B); stem(x, 0, h, 'b');
      if (f) { rect(0, 0, B, B + f + 1); rect(w - B, 0, B, B + f + 1); }
      if (c) { cutBox(0, 0, w, B, 'tl', Math.min(c, B)); cutBox(0, 0, w, B, 'tr', Math.min(c, B)); }
      break;
    }
    case 'W': {
      // (in the heavy cuts the middle stem is thinner and starts lower, or the counters close up)
      const y = Math.round(h * (S >= 6 ? 0.45 : 0.38));
      const ms = S >= 6 ? S - 2 : S;
      stem(0, 0, h, 't'); stem(w - S, 0, h, 't');
      rect(Math.round((w - ms) / 2), y, ms, h - y); rect(0, h - B, w, B);
      if (c) { cutBox(0, 0, w, h, 'bl'); cutBox(0, 0, w, h, 'br'); }
      break;
    }
    case 'N':
      stem(0, 0, h, 'b'); stem(w - S, 0, h, 't');
      for (let y = 0; y < h; y++) rect(Math.round((y * (w - S)) / (h - 1)), y, S, 1);
      break;
    case 'H':
      stem(0, 0, h); stem(w - S, 0, h); rect(0, mid, w, B);
      break;
    case 'O':
      rect(0, 0, w, B); rect(0, h - B, w, B); rect(0, 0, S, h); rect(w - S, 0, S, h);
      for (const k of ['tl', 'tr', 'bl', 'br']) cutBox(0, 0, w, h, k, c || 2);
      break;
    case 'U':
      stem(0, 0, h - B, 't'); stem(w - S, 0, h - B, 't'); rect(0, 0, S, h); rect(w - S, 0, S, h); rect(0, h - B, w, B);
      cutBox(0, 0, w, h, 'bl', c || 2); cutBox(0, 0, w, h, 'br', c || 2);
      break;
    case 'S':
      rect(0, 0, w, B); rect(0, 0, S, mid + B); rect(0, mid, w, B); rect(w - S, mid, S, h - mid); rect(0, h - B, w, B);
      if (f) { rect(w - B, 0, B, B + f + 1); rect(0, h - B - f - 1, B, B + f + 1); }
      cutBox(0, 0, w, h, 'tl', c || 2); cutBox(0, 0, w, h, 'br', c || 2);
      if (c) { cutBox(0, 0, w, h, 'tr', Math.ceil(c / 2)); cutBox(0, 0, w, h, 'bl', Math.ceil(c / 2)); }
      break;
    default:
      throw new Error('no letter ' + ch);
  }
  // the italic: every row moves right by how far it is above the baseline
  const lean = Math.floor((h - 1) / p.slant);
  return m.map((row, y) => {
    const s = Math.floor((h - 1 - y) / p.slant);
    return [...new Array(s).fill(0), ...row, ...new Array(lean - s).fill(0)];
  });
}

// a word, as a mask { w, h, m }: the letters side by side, `track` pixels apart (before the lean)
export function word(str, cut) {
  const p = typeof cut === 'string' ? CUTS[cut] : cut;
  const gs = [...str].map((ch) => glyph(ch, p));
  const lean = Math.floor((p.h - 1) / p.slant);
  const step = p.w + 2 * p.serif + p.track;
  const w = step * gs.length - p.track + lean;
  const m = Array.from({ length: p.h }, () => new Array(w).fill(0));
  gs.forEach((g, k) => g.forEach((row, y) => row.forEach((v, x) => { if (v) m[y][k * step + x] = 1; })));
  return { w, h: p.h, m };
}

// ---- effects. Each takes the canvas, the mask and where its top left goes.
const P = (g, x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };
const at = (W, x, y) => y >= 0 && y < W.h && x >= 0 && x < W.w && W.m[y][x];
// a mask grown by r pixels (square, or round: no corners)
export function grow(W, r, round = false) {
  const m = Array.from({ length: W.h + 2 * r }, (_, y) => new Array(W.w + 2 * r).fill(0).map((_, x) => {
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      if (round && i * i + j * j > r * r + r) continue;
      if (at(W, x - r + i, y - r + j)) return 1;
    }
    return 0;
  }));
  return { w: W.w + 2 * r, h: W.h + 2 * r, m, off: (W.off || 0) + r };
}
// paint a mask: colour is a colour, or a function (x, y, W) -> colour or null
export function paint(g, W, x0, y0, colour) {
  const o = W.off || 0;
  for (let y = 0; y < W.h; y++) for (let x = 0; x < W.w; x++) {
    if (!W.m[y][x]) continue;
    const c = typeof colour === 'function' ? colour(x - o, y - o, W) : colour;
    if (c) P(g, x0 + x - o, y0 + y - o, c);
  }
}
// a solid drop behind it: `depth` steps of (dx, dy), each step's colour from shade(k)
export function extrude(g, W, x0, y0, depth, dx, dy, shade) {
  for (let k = depth; k >= 1; k--) paint(g, W, x0 + k * dx, y0 + k * dy, shade(k));
}
// the pixels of a mask with nothing to their upper left (or upper right): an edge to light
export const edge = (W, x, y, dx = -1, dy = -1) => at(W, x, y) && !at(W, x + dx, y + dy);
