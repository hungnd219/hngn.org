// Character pixel art, authored as character grids and coloured per palette.
import { canvas, C } from './palette.js';

// `coat(kind, x, y, ch)` may return a colour to use instead of the palette's
// (patches, socks, scars...); `kind` says which pose the grid is.
function sprite(rows, pal, coat, kind) {
  const w = rows[0].length;
  const [cv, g] = canvas(w, rows.length);
  rows.forEach((row, y) => {
    if (row.length !== w) console.warn('sprite row width mismatch', y, row);
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      const col = (coat && coat(kind, x, y, ch)) || pal[ch];
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(x, y, 1, 1);
    }
  });
  return cv;
}

function flip(src) {
  const [cv, g] = canvas(src.width, src.height);
  g.translate(src.width, 0);
  g.scale(-1, 1);
  g.drawImage(src, 0, 0);
  return cv;
}

// replace rows [from..] of a base grid
function withRows(base, from, rows) {
  const out = base.slice();
  rows.forEach((r, i) => (out[from + i] = r));
  return out;
}

// ---------------------------------------------------------------- cats
// k outline · b fur · d stripe · l light fur · w white/cream · e eye · n nose
// t tail tip · i inner ear
const CAT_DOWN = [
  '................',
  '...k.......k....',
  '..kik.....kik...',
  '..kbbkkkkkbbk...',
  '..kbdbbdbbdbk...',
  '..kbbbbbbbbbk...',
  '..kbekbbbkebk...',
  '..kbblwnwlbbk...',
  '...kbwwwwwbk....',
  '...kkwwwwwkk.k..',
  '...kbbwwwbbkktk.',
  '...kbbbwbbbkkbk.',
  '...kbkbbbkbkbk..',
  '...kbkkkkkbkk...',
  '...kkk...kkk....',
  '................',
];
const CAT_DOWN_1 = withRows(CAT_DOWN, 9, [
  '...kkwwwwwkk..k.',
  '...kbbwwwbbk.ktk',
  '...kbbbwbbbkkbk.',
  '...kbkbbbkbkbk..',
  '...kkkkkkkbkk...',
  '.........kkk....',
]);
const CAT_DOWN_2 = withRows(CAT_DOWN, 12, [
  '...kbkbbbkbkbk..',
  '...kbkkkkkkkk...',
  '...kkk..........',
]);

const CAT_UP = [
  '................',
  '...k.......k....',
  '..kbk.....kbk...',
  '..kbbkkkkkbbk...',
  '..kbbdbbbdbbk...',
  '..kbdbbdbbdbk...',
  '..kbbbbbbbbbk...',
  '..kbbdbbbdbbk...',
  '...kbbbbbbbk....',
  '...kbdbkbdbk....',
  '...kbbktkbbk....',
  '...kbdkbkdbk....',
  '...kbkkbkkbk....',
  '...kbk.k.kbk....',
  '...kkk...kkk....',
  '................',
];
const CAT_UP_1 = withRows(CAT_UP, 13, ['...kkk.k.kbk....', '.........kkk....']);
const CAT_UP_2 = withRows(CAT_UP, 13, ['...kbk.k.kkk....', '...kkk..........']);

const CAT_LEFT = [
  '................',
  '................',
  '................',
  '.k..k........kk.',
  '.kikbk......ktk.',
  '.kbbbbk.....kbk.',
  'kbekbbbk....kbk.',
  'knwbbbbkkkkkkbk.',
  '.kwwbbbdbdbdbbk.',
  '..kkbbbbbbbbbbk.',
  '...kbbbbbbbbbbk.',
  '...kbwwbbbbbbbk.',
  '...kbkkbkkkbkbk.',
  '...kbkkbk.kbkbk.',
  '...kkkkkk.kkkkk.',
  '................',
];
const CAT_LEFT_1 = withRows(CAT_LEFT, 12, [
  '..kbkkkkbkbkkbk.',
  '..kbk..kbkbkkbk.',
  '..kkk..kkkkkkkk.',
]);

const CAT_SIT_DOWN = [
  '................',
  '...k.......k....',
  '..kik.....kik...',
  '..kbbkkkkkbbk...',
  '..kbdbbdbbdbk...',
  '..kbbbbbbbbbk...',
  '..kbekbbbkebk...',
  '..kbblwnwlbbk...',
  '...kbwwwwwbk....',
  '..kbbbwwwbbbk...',
  '..kbdbwwwbdbk...',
  '..kbbbbwbbbbk...',
  '..kbdkbwbkdbkkk.',
  '..kbkbbkbbkbbbtk',
  '..kkkkkkkkkkkkk.',
  '................',
];
// eyes closed (blink / purr)
const CAT_SIT_DOWN_BLINK = withRows(CAT_SIT_DOWN, 6, ['..kbkkbbbkkbk...']);

const CAT_SIT_UP = [
  '................',
  '...k.......k....',
  '..kbk.....kbk...',
  '..kbbkkkkkbbk...',
  '..kbbdbbbdbbk...',
  '..kbdbbdbbdbk...',
  '..kbbbbbbbbbk...',
  '..kbbdbbbdbbk...',
  '...kbbbbbbbk....',
  '..kbbdbbbdbbk...',
  '..kbbbbdbbbbk...',
  '..kbdbbbbbdbk...',
  '..kbbbbbbbbbkkk.',
  '..kbbbbbbbbbbbtk',
  '..kkkkkkkkkkkkk.',
  '................',
];

const CAT_SIT_LEFT = [
  '................',
  '................',
  '..k..k..........',
  '..kikbk.........',
  '..kbbbbk........',
  '.kbekbbbk.......',
  '.knwbbbbk.......',
  '..kwwbbbdk......',
  '...kwbbbbbk.....',
  '...kwwbbdbbk....',
  '...kbwbbbbbk....',
  '...kbwbbdbbbk...',
  '...kbkbkbbbbkkk.',
  '...kbkbkbbbbbbtk',
  '...kkkkkkkkkkkk.',
  '................',
];

const CAT_SLEEP = [
  '................',
  '................',
  '................',
  '................',
  '...k.......k....',
  '..kik.....kik...',
  '..kbbkkkkkbbk...',
  '..kbdbbdbbdbk...',
  '..kbbbbbbbbbk...',
  '..kbkkbbbkkbk...',
  '.kkbblwnwlbbkk..',
  'kbbbbwwwwwbbbbk.',
  'kbdbbbwwwbbbdbkk',
  'kbbbbbbbbbbbbbtk',
  '.kkkkkkkkkkkkkk.',
  '................',
];

// a tail one pixel thicker, on the standing and walking grids
const thickTail = (row) => row.replace(/k([tb])k\.$/, 'k$1$1k').replace(/k([tb])k\.\.$/, 'k$1$1k.').replace(/\.kk\.$/, 'kkkk');
// Resize a sprite by dropping (or doubling) whole rows and columns, spread
// evenly but never through the eyes and nose. scale is [sx, sy].
const FACE = {
  down: { rows: [6, 7], cols: [4, 5, 7, 9, 10] },
  sit: { rows: [6, 7], cols: [4, 5, 7, 9, 10] },
  sleep: { rows: [9, 10], cols: [4, 5, 7, 9, 10] },
  left: { rows: [6, 7], cols: [0, 1, 2, 3] },
  sitLeft: { rows: [5, 6], cols: [1, 2, 3, 4] },
  // people: keep the eyes and the walking legs intact
  hdown: { rows: [6, 7, 19, 20, 21, 22], cols: [5, 10] },
  hup: { rows: [19, 20, 21, 22], cols: [] },
  hleft: { rows: [6, 7, 17, 18, 19, 20, 21, 22], cols: [3, 4, 5] },
};
function indexMap(n, target, keep) {
  let idx = [];
  for (let i = 0; i < n; i++) idx.push(i);
  const change = Math.abs(target - n);
  const picked = new Set();
  for (let k = 0; k < change; k++) {
    // aim for evenly spaced lines between 1 and n-2, then step off protected ones
    let want = Math.round(1 + ((k + 0.5) * (n - 2)) / change);
    let best = -1;
    for (let d = 0; d < n && best < 0; d++)
      for (const c of [want + d, want - d]) if (c >= 1 && c <= n - 2 && !keep.includes(c) && !picked.has(c)) { best = c; break; }
    if (best >= 0) picked.add(best);
  }
  if (target < n) idx = idx.filter((i) => !picked.has(i));
  else idx = idx.flatMap((i) => (picked.has(i) ? [i, i] : [i]));
  return idx;
}
function resize(src, scale, kind) {
  if (!scale) return src;
  const f = FACE[kind] || { rows: [], cols: [] };
  const cols = indexMap(src.width, Math.round(src.width * scale[0]), f.cols);
  const rows = indexMap(src.height, Math.round(src.height * scale[1]), f.rows);
  const [cv, g] = canvas(cols.length, rows.length);
  rows.forEach((sy, y) => cols.forEach((sx, x) => g.drawImage(src, sx, sy, 1, 1, x, y, 1, 1)));
  return cv;
}

// A tail with a right-angle kink in it (Shark's): a short stretch up from the
// body, then a black tip that juts out sideways, two pixels of it. Sitting or
// asleep, the tail lies along the ground and the tip turns up at the end.
const KINK = {
  left: (rows) => withRows(rows, 3, ['.k..k.......kkk.', '.kikbk.....kbttk', '.kbbbbk....kbkk.', 'kbekbbbk...kbk..', 'knwbbbbkkkkkbk..']),
  down: (rows) => withRows(rows, 9, ['...kkwwwwwkkkkk.', '...kbbwwwbbkbttk', '...kbbbwbbbkbkk.']),
  // (the other step: the tip dips)
  down1: (rows) => withRows(rows, 9, ['...kkwwwwwkkkk..', '...kbbwwwbbkbtk.', '...kbbbwbbbkbktk', '...kbkbbbkbkbkk.']),
  // (from behind, the tip lies across his back)
  up: (rows) => withRows(rows, 9, ['...kbdbkbbbk....', '...kbbkbttbk....', '...kbdkbkbbk....']),
  sit: (rows) => withRows(rows, 10, ['..kbdbwwwbdbk.k.', '..kbbbbwbbbbk.tk', '..kbdkbwbkdbkktk', '..kbkbbkbbkbbbbk']),
  sitUp: (rows) => withRows(rows, 10, ['..kbbbbdbbbbk.k.', '..kbdbbbbbdbk.tk', '..kbbbbbbbbbkktk', '..kbbbbbbbbbbbbk']),
  sitLeft: (rows) => withRows(rows, 10, ['...kbwbbbbbk..k.', '...kbwbbdbbbk.tk', '...kbkbkbbbbkktk', '...kbkbkbbbbbbbk']),
  sleep: (rows) => withRows(rows, 13, ['kbbbbbbbbbbbbttk']),
};
// A tail a pixel longer than most, with rings of cream (the colour of the bib)
// and orange towards its tip (Orca's).
const RINGS = {
  left: (rows) => withRows(rows, 2, ['.............k..', '.k..k.......kwk.', '.kikbk......kbk.', '.kbbbbk.....kwk.']),
  down: (rows) => withRows(rows, 8, ['...kbwwwwwbk.k..', '...kkwwwwwkkkwk.', '...kbbwwwbbkkbk.', '...kbbbwbbbkkwk.']),
  down1: (rows) => withRows(rows, 8, ['...kbwwwwwbk..k.', '...kkwwwwwkk.kwk', '...kbbwwwbbk.kbk', '...kbbbwbbbkkwk.']),
  up: (rows) => withRows(rows, 8, ['...kbbbkbbbk....', '...kbdkwkdbk....', '...kbbkbkbbk....', '...kbdkwkdbk....']),
  sit: (rows) => withRows(rows, 13, ['..kbkbbkbbkbwbwk']),
  sitUp: (rows) => withRows(rows, 13, ['..kbbbbbbbbbwbwk']),
  sitLeft: (rows) => withRows(rows, 13, ['...kbkbkbbbbwbwk']),
  sleep: (rows) => withRows(rows, 13, ['kbbbbbbbbbbbwbwk']),
};

// opts (for the strays downstairs): { coat, thickTail, scale }. A palette
// may also carry marks of its own: kink or rings (the tails above) and g, the
// colour of a clouded right eye. That eye is the one on our left when the
// cat faces us, and the one we see when it faces right.
export function makeCat(pal, opts = {}) {
  const s = (rows, kind) => resize(sprite(opts.thickTail && !kind.startsWith('s') ? rows.map(thickTail) : rows, pal, opts.coat, kind), opts.scale, kind);
  const tail = pal.kink ? KINK : pal.rings ? RINGS : null;
  const k = (rows, which) => (tail ? tail[which](rows) : rows);
  const front = (rows) => (pal.g ? rows.map((r) => r.replace('e', 'g')) : rows); // the first eye in a row is the cat's right
  const side = (rows) => (pal.g ? rows.map((r) => r.replace(/e/g, 'g')) : rows);
  const down = [s(front(k(CAT_DOWN_1, 'down1')), 'down'), s(front(k(CAT_DOWN_2, 'down')), 'down')];
  const up = [s(k(CAT_UP_1, 'up'), 'up'), s(k(CAT_UP_2, 'up'), 'up')];
  const lefts = [k(CAT_LEFT_1, 'left'), k(CAT_LEFT, 'left')];
  const left = lefts.map((rows) => s(rows, 'left'));
  const right = lefts.map((rows) => flip(s(side(rows), 'left')));
  const sitLeft = k(CAT_SIT_LEFT, 'sitLeft');
  const sleep = s(k(CAT_SLEEP, 'sleep'), 'sleep');
  return {
    walk: { down, up, left, right },
    stand: { down: s(front(k(CAT_DOWN, 'down')), 'down'), up: s(k(CAT_UP, 'up'), 'up'), left: left[1], right: right[1] },
    sit: { down: s(front(k(CAT_SIT_DOWN, 'sit')), 'sit'), up: s(k(CAT_SIT_UP, 'sitUp'), 'sitUp'), left: s(sitLeft, 'sitLeft'), right: flip(s(side(sitLeft), 'sitLeft')) },
    blink: s(k(CAT_SIT_DOWN_BLINK, 'sit'), 'sit'),
    sleep,
    sleepR: flip(sleep),
  };
}

// Coats for cats with a home to go to. A collar: a band round the neck, with a tag hanging from it
// when the cat faces us. (`kind` is which drawing it is, as for any coat.)
export const collar = (band, tag) => (kind, x, y, ch) => {
  if (ch === 'k') return null;
  if (kind === 'down' || kind === 'sit') return y === 8 ? band : y === 9 && x === 7 ? tag : null;
  if (kind === 'up' || kind === 'sitUp') return y === 8 ? band : null;
  if (kind === 'left') return (x === 5 && y === 8) || (x === 4 && y === 9) || (x === 5 && y === 9) ? band : null;
  if (kind === 'sitLeft') return y === 8 && x >= 4 && x <= 9 ? band : null;
  return null;
};
// spots: dark rosettes scattered over the fur (a Bengal); `share` is how much of the fur, in hundredths
export const spotted = (dark, seed = 1, share = 20) => (kind, x, y, ch) => {
  if (!'bdl'.includes(ch)) return null;
  const v = (((x * 73 + y * 151 + seed * 37) * 2654435761) >>> 0) % 100;
  return v < share ? dark : null;
};
// no bib: the pale fur stops at the muzzle and chin, and the chest below it is `fur`
export const noBib = (fur) => (kind, x, y, ch) => {
  if (ch !== 'w') return null;
  if (kind === 'down' || kind === 'sit') return y >= 9 ? fur : null;
  if (kind === 'left') return y >= 10 ? fur : null;
  if (kind === 'sitLeft') return y >= 8 ? fur : null;
  if (kind === 'sleep') return y >= 12 || (y === 11 && (x < 6 || x > 8)) ? fur : null;
  return null;
};
// a coat kept off the face, so that the eyes and nose stay readable
export const offFace = (coat) => (kind, x, y, ch) => {
  const face =
    kind === 'down' || kind === 'sit' ? y <= 8
    : kind === 'left' ? x <= 6 && y <= 9
    : kind === 'sitLeft' ? x <= 7 && y <= 8
    : kind === 'sleep' ? y <= 11 && x >= 2 && x <= 12
    : false;
  return face ? null : coat(kind, x, y, ch);
};
// one coat over another: the first that has something to say about a pixel wins
export const layered = (...coats) => (kind, x, y, ch) => {
  for (const c of coats) {
    const v = c(kind, x, y, ch);
    if (v) return v;
  }
  return null;
};

export const CAT_PALS = {
  // Shark: grey-brown tabby, white bib, a tail with a kink in it and the whole
  // of the kinked end black, and a right eye clouded grey by an old scar
  shark: {
    kink: true,
    g: '#93a3b8',
    k: C.k,
    b: '#8d8272',
    d: '#4e463f',
    l: '#b3a793',
    w: '#f7f1e3',
    e: '#c3cf63',
    n: '#d88c8c',
    t: '#2b2024',
    i: '#d8a39a',
  },
  // Orca: orange tabby, cream chin, and cream rings towards the tip of his tail
  orca: {
    rings: true,
    k: C.k,
    b: '#dc8f41',
    d: '#b0652b',
    l: '#f0b973',
    w: '#f8e3bf',
    e: '#f2c14a',
    n: '#e69a9a',
    t: '#b0652b',
    i: '#f0b9a8',
  },
};

// Flower, the Bengal who lives in Garnet: a warm brown coat, darker than a tabby's and heavily
// marbled with black, pale only round the muzzle and chin (no bib), green eyes, and a collar.
const FLOWER_PAL = { k: C.k, b: '#a2622c', d: '#3a2416', l: '#d6b488', w: '#ecd9b8', e: '#7fb04a', n: '#b5604e', t: '#2a1a12', i: '#e0a090' };
export const FLOWER = {
  pal: FLOWER_PAL,
  coat: layered(collar('#35c4cc', '#f2d37a'), noBib(FLOWER_PAL.b), offFace(spotted('#2e1c12', 4, 16))),
};

// -------------------------------------------------------------- humans
// k outline · s skin · h hair · c top · v top shade · p trousers · o shoes
const HUM_DOWN = [
  '................',
  '.....kkkkkk.....',
  '...kkhhhhhhkk...',
  '..khhhhhhhhhhk..',
  '..khhhhhhhhhhk..',
  '..khhsssssshhk..',
  '..khsksssskshk..',
  '..khsksssskshk..',
  '...kssssssssk...',
  '....kssssssk....',
  '....kkkkkkkk....',
  '...kcccccccck...',
  '..kcccccccccck..',
  '..kckcccccckck..',
  '..kskccccccksk..',
  '...kkcccccckk...',
  '....kppppppk....',
  '....kppppppk....',
  '....kppkkppk....',
  '....kppkkppk....',
  '....kppkkppk....',
  '....kookkook....',
  '....kkkkkkkk....',
  '................',
];
const HUM_UP = withRows(HUM_DOWN, 5, [
  '..khhhhhhhhhhk..',
  '..khhhhhhhhhhk..',
  '..khhhhhhhhhhk..',
  '...khhhhhhhhk...',
  '....kssssssk....',
]);
const HUM_LEFT = [
  '................',
  '.....kkkkkk.....',
  '...kkhhhhhhkk...',
  '..khhhhhhhhhhk..',
  '..khhhhhhhhhhk..',
  '..ksshhhhhhhhk..',
  '..kskshhhhhhhk..',
  '..kskssshhhhhk..',
  '..kssssshhhhk...',
  '...kssssskkk....',
  '....kkkkkk......',
  '....kcccccck....',
  '....kcccccck....',
  '....kccvvcck....',
  '....kccsscck....',
  '....kkcccckk....',
  '.....kppppk.....',
  '.....kppppk.....',
  '.....kppppk.....',
  '.....kppppk.....',
  '.....kppppk.....',
  '....koooook.....',
  '....kkkkkkk.....',
  '................',
];
const LEGS_1 = ['....kppkkppk....', '....kookkppk....', '....kkkkkook....', '........kkkk....'];
const LEGS_2 = ['....kppkkppk....', '....kppkkook....', '....kookkkkk....', '....kkkk........'];
const SIDE_LEGS = [
  '....kppppppk....',
  '...kpppkkpppk...',
  '...kppk..kppk...',
  '...kppk..kppk...',
  '..koook..kook...',
  '..kkkkk..kkkk...',
];

// long-hair variants
const LONG_DOWN = [
  [5, '..khhhsssshhhk..'],
  [8, '..khsssssssshk..'],
  [9, '..khksssssskhk..'],
  [10, '..khhkkkkkkhhk..'],
  [11, '..khcccccccchk..'],
];
const LONG_UP = [
  [8, '..khhhhhhhhhhk..'],
  [9, '..khhhhhhhhhhk..'],
  [10, '..khhhhhhhhhhk..'],
  [11, '..kchhhhhhhhck..'],
  [12, '..kcchhhhhhcck..'],
];
const LONG_LEFT = [
  [8, '..ksssshhhhhhk..'],
  [9, '...kssshhhhhhk..'],
  [10, '....kkkhhhhhk...'],
  [11, '....kccchhhhk...'],
  [12, '....kcccchhk....'],
];
function patch(base, patches) {
  const out = base.slice();
  for (const [i, r] of patches) out[i] = r;
  return out;
}

// opts (for the people downstairs): { coat, scale }, as for makeCat
export function makeHuman(pal, longHair, opts = {}) {
  const D = longHair ? patch(HUM_DOWN, LONG_DOWN) : HUM_DOWN;
  const U = longHair ? patch(HUM_UP, LONG_UP) : HUM_UP;
  const L = longHair ? patch(HUM_LEFT, LONG_LEFT) : HUM_LEFT;
  const mk = (kind) => (rows) => resize(sprite(rows, pal, opts.coat, kind), opts.scale, kind);
  const s = mk('hdown');
  const sU = mk('hup');
  const sL = mk('hleft');
  const down = [s(withRows(D, 19, LEGS_1)), s(withRows(D, 19, LEGS_2))];
  const up = [sU(withRows(U, 19, LEGS_1)), sU(withRows(U, 19, LEGS_2))];
  const standL = sL(L);
  const left = [sL(withRows(L, 17, SIDE_LEGS)), standL];
  return {
    walk: { down, up, left, right: left.map(flip) },
    stand: { down: s(D), up: sU(U), left: standL, right: flip(standL) },
    // eyes shut, for in bed
    sleep: s(withRows(D, 6, ['..khsssssssshk..', '..khkksssskkhk..'])),
  };
}

// So Stripes and Polka stand out from the crowd downstairs (who all wear plain
// tops): he wears stripes, she wears polka dots.
const onTop = (ch, y) => (ch === 'c' || ch === 'v') && y >= 11 && y <= 16;
export const HUMAN_COATS = {
  // cream and green in turn; the sleeve end (v) is the green of the stripes
  him: (kind, x, y, ch) => (!onTop(ch, y) ? null : ch === 'v' ? C.olive : y % 2 === 1 ? '#f1ece0' : null),
  her: (kind, x, y, ch) => (onTop(ch, y) && y % 2 === 1 && (x + (y % 4 === 1 ? 0 : 2)) % 4 === 0 ? '#ffffff' : null),
  // Cat Hater S: shorts (bare legs below them) and a centre parting, with a
  // curtain of hair hanging down each side of his face
  haterS: (kind, x, y, ch) => {
    const P = HUMAN_PALS.haterS;
    if (ch === 'p' && y >= 19) return P.s;
    if (kind === 'hdown') {
      // the parting: a line of scalp down the middle, opening onto the forehead
      if (ch === 'h' && ((y >= 2 && y <= 4 && (x === 7 || x === 8)) || (y === 4 && (x === 6 || x === 9)))) return P.s;
      // the curtains: hair hanging past the eyes to the jaw on both sides
      if (ch === 's' && (x === 3 || x === 12) && y === 8) return P.h;
      if (ch === 'k' && (x === 3 || x === 12) && y === 8) return P.h;
    }
    if (kind === 'hup' && ch === 'h' && (x === 7 || x === 8) && y >= 2 && y <= 5) return P.part;
    if (kind === 'hleft' && ch === 's' && x === 5 && y >= 5 && y <= 8) return P.h;
    return null;
  },
  // Cat Hater L: a yellow dress to the knee, bare legs below it, and a purple scarf wound round her
  // neck with one end hanging down the front
  haterL: (kind, x, y, ch) => {
    const P = HUMAN_PALS.haterL;
    if (ch === 'p') return y <= 18 ? P.c : P.s;
    if ((ch === 'c' || ch === 'v') && y >= 11 && y <= 12) return P.scarf;
    if (ch === 'c' && kind === 'hdown' && (x === 9 || x === 10) && y >= 13 && y <= 15) return y === 15 ? P.scarfD : P.scarf;
    if (ch === 'c' && kind === 'hleft' && x === 5 && y >= 13 && y <= 14) return P.scarf;
    return null;
  },
  // the vet: a white coat, open over green scrubs
  vet: (kind, x, y, ch) => (kind === 'hdown' && ch === 'c' && (x === 7 || x === 8) && y >= 11 && y <= 16 ? HUMAN_PALS.vet.scrub : null),
  // Golf Club (the man with the club): all in white, a black belt, and short black hair with a few
  // specks of gray in it, going back from his forehead
  club: (kind, x, y, ch) => {
    const P = HUMAN_PALS.club;
    if (ch === 'p' && y === 16) return kind === 'hdown' && (x === 7 || x === 8) ? P.buckle : P.belt;
    if (ch !== 'h') return null;
    // cut short: none over the ears or on the neck, and a high forehead
    const bare =
      kind === 'hdown' ? (y === 4 && x >= 5 && x <= 10) || (y === 5 && x > 3 && x < 12) || y >= 6
      : kind === 'hup' ? y === 8 || (y === 7 && (x === 3 || x === 12))
      : (y === 4 && x <= 4) || (y === 5 && x <= 6) || (y === 6 && x <= 8) || (y === 7 && x <= 9) || y === 8;
    if (bare) return P.s;
    const v = (x * 7 + y * 13) % 11;
    // (black, with a few specks of gray in it)
    return v === 0 ? P.fleck : v === 5 ? P.hD : null;
  },
  // Flower's owner: a dark gray dress to the knee with short sleeves, bare arms and legs
  owner: (kind, x, y, ch) => {
    const P = HUMAN_PALS.owner;
    if (ch === 'p') return y <= 18 ? (y === 18 ? P.v : P.c) : P.s;
    if (ch === 'c' && kind !== 'hleft' && y >= 13 && y <= 14 && (x === 3 || x === 12)) return P.s;
    if (ch === 'v' && kind === 'hleft') return P.s;
    if (ch === 'c' && kind === 'hdown' && y === 11 && x >= 7 && x <= 8) return P.s; // the neck of the dress
    return null;
  },
  // Garnet's guard: a navy cap with a badge and a black peak, a pale blue shirt with dark
  // shoulder straps and a badge on the chest, a black belt
  guard: (kind, x, y, ch) => {
    const P = HUMAN_PALS.guard;
    if (ch === 'p' && y === 16) return P.belt;
    if (kind === 'hdown') {
      if (ch === 'h' && y <= 4) return y === 3 && (x === 7 || x === 8) ? P.badge : P.cap;
      if (y === 5 && (ch === 'h' || ch === 's')) return P.peak;
      if (ch === 'c' && y === 11 && (x <= 5 || x >= 10)) return P.cap;
      if (ch === 'c' && y === 13 && x === 9) return P.badge;
    }
    if (kind === 'hup') {
      if (ch === 'h' && y <= 5) return y === 5 ? P.capD : P.cap;
      if (ch === 'c' && y === 11 && (x <= 5 || x >= 10)) return P.cap;
    }
    if (kind === 'hleft') {
      if (ch === 'h' && y <= 4) return P.cap;
      if (y === 5 && (ch === 's' || (ch === 'h' && x <= 6))) return P.peak;
      if (ch === 'h' && y === 5) return P.capD;
      if (ch === 'c' && y === 11) return P.cap;
    }
    return null;
  },
};

export const HUMAN_PALS = {
  // Stripes: green stripes, dark khakis. Polka: burgundy with white dots, mid-blue jeans.
  him: { k: C.k, s: '#e8b98f', h: '#3b3038', c: C.olive, v: C.oliveD, p: '#6a5f43', o: C.grayL },
  // bright green shirt, white shorts, a centre parting
  haterS: { k: C.k, s: '#e2ad84', h: '#2a2320', part: '#57483f', c: '#3fd24a', v: '#2aa637', p: '#f4f1ea', o: '#d9d4cc' },
  her: { k: C.k, s: '#f0c8a0', h: '#573626', c: '#8a2b3f', v: '#6a1f30', p: '#5578b5', o: C.pink },
  // a yellow dress, a purple scarf, grey-black hair
  haterL: { k: C.k, s: '#ecc7a4', h: '#2b2428', c: '#f2cf3a', v: '#d4ae22', p: '#f2cf3a', o: '#7a4fa3', scarf: '#8a4fb8', scarfD: '#6a3794' },
  vet: { k: C.k, s: '#d9a57e', h: '#30262a', c: '#f6f4ee', v: '#d8dbe0', p: '#3f9a8c', o: '#f6f4ee', scrub: '#3f9a8c' },
  // Golf Club: white from neck to ankle, black belt and shoes, graying hair. (g, m and r are the
  // club's shaft, head and grip, and w the streak it leaves in the air: see makeGolfClub.)
  club: { k: C.k, s: '#dba27a', h: '#1d1b21', fleck: '#8e909a', hD: '#121116', buckle: '#c9ccd3', c: '#fbfaf6', v: '#d5d8de', p: '#f1efe9', o: '#17131a', belt: '#17131a', g: '#9aa0ab', m: '#dfe3ea', r: '#17131a', w: '#ffffff' },
  // Flower's owner: a dark gray dress, black hair worn long, black shoes
  owner: { k: C.k, s: '#f0cdaa', h: '#231c22', c: '#555864', v: '#40434e', p: '#555864', o: '#17131a' },
  // Garnet's guard
  guard: { k: C.k, s: '#d9a57e', h: '#2a2320', c: '#a9c8ea', v: '#86a9d0', p: '#2f3a5c', o: '#17131a', cap: '#2f3a5c', capD: '#232b47', peak: '#17131a', badge: '#e8c04a', belt: '#17131a' },
};

// Golf Club with the club in his hand, in every pose. The drawings are the ordinary human's set
// in a wider frame, with the club stamped on: 24 x 24 standing and walking (the body 4 in from
// the left), 32 x 32 swinging (the body 8 in and 8 down). Whatever the size, the feet are in
// the middle of the bottom edge: draw a frame at (x + 8 - width / 2, y + 15 - height), where
// (x, y) is the top left corner of his tile. What comes back is what makeHuman gives, and:
//   swing.left / right / down / up   [the club raised, the club brought down]
//   fallen.left / right / down / up  on his backside, the club dropped beside him
//   sit                              the same pictures as stand (for code that asks for one)
const inFrame = (rows, ox, top, w) => [
  ...Array(top).fill('.'.repeat(w)),
  ...rows.map((r) => '.'.repeat(ox) + r + '.'.repeat(w - ox - r.length)),
];
// marks: [x, y, 'chars'], written over the grid from (x, y) rightwards (a space leaves a pixel be)
const stamp = (rows, marks) => {
  const out = rows.map((r) => r.split(''));
  for (const [x, y, str] of marks) [...str].forEach((ch, i) => ch !== ' ' && out[y] && x + i >= 0 && x + i < out[y].length && (out[y][x + i] = ch));
  return out.map((r) => r.join(''));
};
const mirrored = (marks, w) => marks.map(([x, y, str]) => [w - x - str.length, y, [...str].reverse().join('')]);
// the club carried low: facing us it is in the hand on our right, its head on the ground
const CLUB_DOWN = [
  [18, 11, 'k'], [17, 12, 'krk'], [17, 13, 'krk'], [16, 14, 'ssrk'], [17, 15, 'kgk'], [18, 16, 'kgk'], [18, 17, 'kgk'],
  [19, 18, 'kgk'], [19, 19, 'kgk'], [18, 20, 'kkkgk'], [17, 21, 'kmmmgk'], [17, 22, 'kkkkkk'],
];
// from the side it crosses in front of him, down to the ground ahead
const CLUB_LEFT = [
  [10, 15, 'gk'], [9, 16, 'gk'], [8, 17, 'gk'], [7, 18, 'gk'], [6, 19, 'gk'], [5, 20, 'gk'], [1, 21, 'kkkgk'], [0, 22, 'kmmmmk'], [0, 23, 'kkkkkk'],
];
// swinging, in the 32 x 32 frame
const SWING_LEFT_UP = [
  // the near arm, up and back past his head
  [15, 21, 'cc'], [15, 22, 'cc'], [17, 18, 'kcck'], [20, 17, 'cck'], [21, 16, 'ssk'], [22, 15, 'sk'], [22, 14, 'sk'],
  // the club, high over his shoulder
  [22, 13, 'gk'], [23, 12, 'gk'], [23, 11, 'gk'], [24, 10, 'gk'], [24, 9, 'gk'], [25, 8, 'gk'], [25, 7, 'gk'], [26, 6, 'gk'], [26, 5, 'gk'],
  [23, 4, 'kkkgk'], [22, 3, 'kmmmmk'], [22, 2, 'kkkkkk'],
];
const SWING_LEFT_DOWN = [
  // the arm straight out in front
  [15, 21, 'cc'], [15, 22, 'cc'], [6, 20, 'kkkkkk'], [5, 21, 'ksscccc'], [6, 22, 'kkkkkk'],
  // the club, down to the ground
  [4, 22, 'kg'], [4, 23, 'kgk'], [3, 24, 'kgk'], [3, 25, 'kgk'], [2, 26, 'kgk'], [2, 27, 'kgk'], [1, 28, 'kgk'], [0, 29, 'kkgk'], [0, 30, 'kmmmk'], [0, 31, 'kkkkk'],
  // the streak it left
  [12, 5, 'w'], [10, 6, 'ww'], [8, 7, 'ww'], [6, 9, 'w'], [5, 10, 'w'], [4, 12, 'w'], [3, 14, 'w'], [2, 17, 'w'], [2, 19, 'w'],
];
const SWING_DOWN_UP = [
  // the arm on our right, up beside his head
  [20, 21, 'k.'], [20, 22, '..'], [21, 19, 'ck'], [20, 18, 'kcck'], [21, 17, 'kck'], [21, 16, 'ksk'], [22, 15, 'sk'],
  // the club, straight up from it
  [22, 14, 'gk'], [22, 13, 'gk'], [23, 12, 'gk'], [23, 11, 'gk'], [23, 10, 'gk'], [24, 9, 'gk'], [24, 8, 'gk'], [24, 7, 'gk'], [25, 6, 'gk'], [25, 5, 'gk'],
  [22, 4, 'kkkgk'], [21, 3, 'kmmmmk'], [21, 2, 'kkkkkk'],
];
const SWING_DOWN_DOWN = [
  // both hands together in front of him, the club straight down between his feet
  [11, 22, 'c'], [20, 22, 'c'], [14, 22, 'kssk'], [14, 23, 'kssk'], [14, 24, 'kgk'], [14, 25, 'kgk'], [14, 26, 'kgk'], [14, 27, 'kgk'], [14, 28, 'kgk'],
  [13, 29, 'kkgkk'], [12, 30, 'kmmmmmk'], [12, 31, 'kkkkkkk'],
];
// on his backside (24 x 24): head and body as standing but lower, the legs out in front
const FALLEN_LEFT = [
  [1, 17, 'kk'], [0, 18, 'kook'], [0, 19, 'kookkkkk'], [0, 20, 'koopppppp'], [0, 21, 'koopppppp'], [0, 22, 'kkkkkkkkkkkkkkkk'], [9, 20, 'r'], [9, 21, 'r'],
  // the club on the ground behind him
  [16, 20, 'kkkkkkkk'], [16, 21, 'kggggmmk'], [16, 22, 'kkkkkkkk'],
];
const FALLEN_DOWN = [
  [8, 20, 'kppkkppk'], [7, 21, 'koookkoook'], [7, 22, 'kkkkkkkkkk'],
  [18, 19, 'kkkkk'], [17, 20, 'kgggmk'], [17, 21, 'kkkkkk'],
];
export function makeGolfClub(opts = {}) {
  const pal = opts.pal || HUMAN_PALS.club;
  const look = (ox, top) => (kind, x, y, ch) => HUMAN_COATS.club(kind, x - ox, y - top, ch);
  const mk = (kind, ox, top) => (rows) => sprite(rows, pal, look(ox, top), kind);
  // standing and walking
  const f24 = (rows) => inFrame(rows, 4, 0, 24);
  const d = mk('hdown', 4, 0);
  const u = mk('hup', 4, 0);
  const l = mk('hleft', 4, 0);
  const clubUp = mirrored(CLUB_DOWN, 24);
  const down = [LEGS_1, LEGS_2].map((legs) => d(stamp(f24(withRows(HUM_DOWN, 19, legs)), CLUB_DOWN)));
  const up = [LEGS_1, LEGS_2].map((legs) => u(stamp(f24(withRows(HUM_UP, 19, legs)), clubUp)));
  const standL = l(stamp(f24(HUM_LEFT), CLUB_LEFT));
  const left = [l(stamp(f24(withRows(HUM_LEFT, 17, SIDE_LEGS)), CLUB_LEFT)), standL];
  const stand = { down: d(stamp(f24(HUM_DOWN), CLUB_DOWN)), up: u(stamp(f24(HUM_UP), clubUp)), left: standL, right: flip(standL) };
  // swinging
  const f32 = (rows) => inFrame(rows, 8, 8, 32);
  const d32 = mk('hdown', 8, 8);
  const u32 = mk('hup', 8, 8);
  const l32 = mk('hleft', 8, 8);
  const swingL = [l32(stamp(f32(HUM_LEFT), SWING_LEFT_UP)), l32(stamp(f32(HUM_LEFT), SWING_LEFT_DOWN))];
  const swing = {
    left: swingL,
    right: swingL.map(flip),
    down: [d32(stamp(f32(HUM_DOWN), SWING_DOWN_UP)), d32(stamp(f32(HUM_DOWN), SWING_DOWN_DOWN))],
    up: [u32(stamp(f32(HUM_UP), mirrored(SWING_DOWN_UP, 32))), u32(stamp(f32(HUM_UP), [[11, 22, 'c'], [20, 22, 'c']]))],
  };
  // fallen
  const sat = (rows) => inFrame(rows.slice(0, 16), 4, 6, 24).concat('.'.repeat(24), '.'.repeat(24));
  const fallL = sprite(stamp(sat(HUM_LEFT), FALLEN_LEFT), pal, look(4, 6), 'hleft');
  const fallD = sprite(stamp(sat(HUM_DOWN), FALLEN_DOWN), pal, look(4, 6), 'hdown');
  return {
    walk: { down, up, left, right: left.map(flip) },
    stand,
    sit: stand,
    sleep: d(stamp(f24(withRows(HUM_DOWN, 6, ['..khsssssssshk..', '..khkksssskkhk..'])), CLUB_DOWN)),
    swing,
    fallen: { left: fallL, right: flip(fallL), down: fallD, up: fallD },
    skin: pal.s,
  };
}

// ------------------------------------------------------ garden critters
// Not cats: a rat and a snake, drawn facing left. Used by the battle screen.
// k outline · b body · d pattern · l belly · e eye · n nose · i ear · t tail · r tongue
const RAT = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '....kk..........',
  '...kiik..kkkk...',
  '..kkbbkkkbbbbk..',
  '.kbbbbbbbbbbbbk.',
  'knebbbbbbbbbbbkt',
  '.kkbbblllbbbbkt.',
  '...kbkkkkkbkk.t.',
  '...kkk....kkk.tt',
  '................',
];
const RAT_2 = withRows(RAT, 13, ['....kbkkkkbkk.t.', '....kkk..kkk..tt']);
const SNAKE = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '..kkkk..........',
  '.kbbbbk.........',
  'kbebbbk.........',
  'rkbbbbk...kkkk..',
  '.kkklbk..kbbbbk.',
  '...klbk.kbdkkbbk',
  '...klbdkbbk..kbk',
  '....klbbdk...kbk',
  '.....kkkk.....k.',
  '................',
  '................',
];
const SNAKE_2 = withRows(SNAKE, 8, ['.kbbbbk...kkkk..']);
export const CRITTER_PALS = {
  rat: [
    { k: C.k, b: '#8a7f78', l: '#c9c0b6', e: '#17121c', n: '#e69a9a', i: '#e6a9a9', t: '#d99a9a' },
    { k: C.k, b: '#6e5a48', l: '#b59f88', e: '#17121c', n: '#e69a9a', i: '#e6a9a9', t: '#d99a9a' },
    { k: C.k, b: '#e9e4da', l: '#ffffff', e: '#c0503f', n: '#e69a9a', i: '#f0b9b9', t: '#e6a9a9' },
  ],
  snake: [
    { k: C.k, b: '#5f9a4a', d: '#3f6f34', l: '#d9d07a', e: '#f2d37a', r: '#d8483c' },
    { k: C.k, b: '#a8804a', d: '#6e4f2c', l: '#e6d2a0', e: '#f2d37a', r: '#d8483c' },
    { k: C.k, b: '#4a4652', d: '#2b2630', l: '#a39aa8', e: '#f2d37a', r: '#d8483c' },
  ],
};
// the same shape of object as makeCat gives, as far as the battle screen needs
export function makeCritter(kind, pal, big) {
  const [r1, r2] = kind === 'rat' ? [RAT, RAT_2] : [SNAKE, SNAKE_2];
  // a rat is a good deal smaller than a cat (unless it is a big one)
  const size = (im) => (kind === 'rat' && !big ? resize(im, [0.75, 0.75], 'left') : im);
  const a = size(sprite(r1, pal, null, kind));
  const b = size(sprite(r2, pal, null, kind));
  const fa = flip(a);
  const fb = flip(b);
  return {
    stand: { left: a, right: fa, down: a, up: a },
    sit: { left: a, right: fa, down: a, up: a },
    walk: { left: [b, a], right: [fb, fa], down: [b, a], up: [b, a] },
  };
}

// Two sprite sets as one: the second stands in front of the first, to one
// side (Mamacat with Babycat). Only the poses the battle screen uses.
export function pairSprites(big, small, overlap = 5) {
  const join = (a, b, face) => {
    const w = a.width + b.width - overlap;
    const [cv, g] = canvas(w, Math.max(a.height, b.height));
    // the small one is always on the side the pair is facing
    const ax = face === 'left' ? w - a.width : 0;
    const bx = face === 'left' ? 0 : w - b.width;
    g.drawImage(a, ax, cv.height - a.height);
    g.drawImage(b, bx, cv.height - b.height);
    return cv;
  };
  const out = { stand: {}, sit: {}, walk: {} };
  for (const face of ['left', 'right']) {
    out.stand[face] = join(big.stand[face], small.stand[face], face);
    out.sit[face] = join(big.sit[face], small.sit[face], face);
    out.walk[face] = [0, 1].map((i) => join(big.walk[face][i], small.walk[face][i], face));
  }
  out.stand.down = join(big.sit.down, small.sit.down, 'right');
  out.sit.down = out.stand.down;
  return out;
}

// ----------------------------------------------------------------- dogs
// The stray dogs of Act 3: lean street dogs, about one and a half times a
// cat each way, with a long muzzle, a deep chest, long thin legs, tall ears
// and a thin tail carried up in a hook over the back. Every drawing is on a
// 24 x 24 grid with the feet on row 22, as a cat's are on row 14 of its 16:
// so a dog stands on its tile when it is drawn at (px - 4, py - 8),
// bottom-centred, overhanging four pixels each side and eight above.
// k outline · b coat · d dark fur (hackle, brow) · p patch (a saddle, one ear:
// the coat's colour unless the palette says otherwise) · l pale underside ·
// w muzzle, chest and paws · e eye · n nose · i inner ear · t tail tip ·
// r tongue · f teeth
const DOG_LEFT = [
  '........................',
  '........................',
  '........................',
  '........................',
  '.....k..k...............',
  '....kik.kpk......kkkk...',
  '....kik.kpk.....kttbbk..',
  '....kbbkbpk.....kkkkbk..',
  '....kbebbbdk.......kbk..',
  '.kkkbbbbbbddk......kbk..',
  'knwwwbbbbbbddk.....kbk..',
  'kwwwwkbbbbbbbdkkkkkkbbk.',
  '.kkkkkwbbbppppbbbbbbbbk.',
  '.....kwwbbpppppbbbbbbbk.',
  '.....kwwbbbpppbbbbbbbbk.',
  '......kwwbbbbbbbbbbbbbk.',
  '......kwwbbbbbbllkkbbbk.',
  '......kbbkbbkkkkk.kbbbk.',
  '......kbk.kbk....kbkkbk.',
  '......kbk.kbk....kbkkbk.',
  '......kbk.kbk.....kbkkbk',
  '......kwk.kwk.....kwkkwk',
  '......kkk.kkk.....kkkkkk',
  '........................',
];
// (the other step: legs reaching out fore and aft)
const DOG_LEFT_1 = withRows(DOG_LEFT, 18, [
  '.....kbk..kbk...kbk.kbk.',
  '....kbk...kbk..kbk..kbk.',
  '....kbk....kbk.kbk...kbk',
  '....kwk....kwk.kwk...kwk',
  '....kkk....kkk.kkk...kkk',
]);
// head thrown up: looking at something in a tree
const DOG_LOOK_LEFT = withRows(DOG_LEFT, 2, [
  '..kk....................',
  '.knwk...................',
  '.kwwbk..k...............',
  '..kwbbkkik.......kkkk...',
  '...kbebbik......kttbbk..',
  '....kbbbbbk.....kkkkbk..',
  '....kbbbbbdk.......kbk..',
  '.....kbbbbddk......kbk..',
  '.....kwbbbbddk.....kbk..',
  '.....kwwbbbbbdkkkkkkbbk.',
  '.....kwwbbppppbbbbbbbbk.',
]);
// mouth open, hackles up
const DOG_BARK_LEFT = withRows(DOG_LEFT, 10, [
  'knwwwbbbbbbddk.k.k.kbk..',
  '.kfrrkbbbbbbddkkkkkkbbk.',
  '.kwwwkwbbbppppbbbbbbbbk.',
  '..kkkkwwbbpppppbbbbbbbk.',
]);
// nose to the ground
const DOG_SNIFF_LEFT = [
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '.................kkkk...',
  '................kttbbk..',
  '................kkkkbk..',
  '...................kbk..',
  '...................kbk..',
  '..........kkkk.....kbk..',
  '.........kddddkkkkkkbbk.',
  '.......kkbddppppbbbbbbk.',
  '....k.kbbbbpppppbbbbbbk.',
  '...kikbbbbbbpppbbbbbbbk.',
  '...kikbbbbbbbbbbbbbbbbk.',
  '..kbbbbbbkbbbbbllkkbbbk.',
  '.kbbebbbkkbbkkkkk.kbbbk.',
  '.kbbbbbk.kbk.....kbkkbk.',
  'kbbbbwk..kbk.....kbkkbk.',
  'knwwwk...kbk......kbkkbk',
  '.kkkk....kwk......kwkkwk',
  '.........kkk......kkkkkk',
  '........................',
];
// backing off: a row lower on its legs, head down, ears flat along the neck,
// and the tail down behind its hind legs instead of up
const DOG_COWER_LEFT = [
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '.......kkk..............',
  '....kkkiikk.............',
  '....kbbbbbdk............',
  '.kkkbebbbbddkkkkkkkkk...',
  'knbbbbbbbbbddbbbbbbbbkk.',
  'kwwwwkbbbbppppbbbbbbbkbk',
  '.kkkkkwbbbpppppbbbbbbkbk',
  '.....kwwbbbpppbbbbbbbkbk',
  '......kwwbbbbbbbbbbbbkbk',
  '......kwwbbbbbbllkkbbkbk',
  '......kbbkbbkkkkkkbbkkbk',
  '......kbk.kbk...kbkkbkbk',
  '......kbk.kbk...kbkkbktk',
  '......kwk.kwk...kwkkwkkk',
  '......kkk.kkk...kkkkkk..',
  '........................',
];
const DOG_SIT_LEFT = [
  '........................',
  '........................',
  '........................',
  '........................',
  '.....k..k...............',
  '....kik.kpk.............',
  '....kik.kpk.............',
  '....kbbkbpk.............',
  '....kbebbbdk............',
  '.kkkbbbbbbddk...........',
  'knwwwbbbbbbddk..........',
  'kwwwwkbbbbbbbdk.........',
  '.kkkkkwbbbbbbbbk........',
  '.....kwwbbbbbbbbk.......',
  '.....kwwbbbppbbbbk......',
  '......kwwbbpppbbbk......',
  '......kwwbbbppbbbbk.....',
  '......kbwbbbbbbbbbk.....',
  '......kbkwbbbbbbbbbk....',
  '......kbkkbbkbbbbbbk.kk.',
  '......kbkkbkkbbbbbbkkttk',
  '......kwkkwkkwwwkbbbbbk.',
  '......kkkkkkkkkkkkkkkk..',
  '........................',
];
// From the front: tall ears, a narrow skull with the eyes high in it under
// dark brows, and a long muzzle below them with the nose at its end. (A cat's
// face is wide and flat, with the nose right under the eyes.) A deep chest,
// and daylight between long legs.
const DOG_DOWN = [
  '........................',
  '........................',
  '......k......k..........',
  '.....kik....kpk.........',
  '.....kik....kpk.........',
  '.....kbbkkkkbbk.........',
  '.....kbbbbbbbbk.........',
  '.....kdbbbbbbdk.........',
  '.....kbekbbkebk.........',
  '.....kbbwwwwbbk.........',
  '......kbwwwwbk..........',
  '......kwwnnwwk......kk..',
  '......kwwkkwwk.....kttk.',
  '......kkwwwwkk.....kbkk.',
  '.....kbbkkkkbbk...kbk...',
  '....kbbbwwwwbbbk.kbk....',
  '.....kbbbwwbbbk.kbk.....',
  '.....kbbbbbbbbkkbk......',
  '.....kbkbbbbkbkkk.......',
  '.....kbk.kk.kbk.........',
  '.....kbk....kbk.........',
  '.....kwk....kwk.........',
  '.....kkk....kkk.........',
  '........................',
];
const DOG_STEP_1 = ['.....kbk.kk.kbk.........', '.....kbk....kwk.........', '.....kwk....kkk.........', '.....kkk................'];
const DOG_STEP_2 = ['.....kbk.kk.kbk.........', '.....kwk....kbk.........', '.....kkk....kwk.........', '............kkk.........'];
const DOG_BARK_DOWN = withRows(DOG_DOWN, 11, ['......kwwnnwwk......kk..', '......kwfrrfwk.....kttk.', '......kkwrrwkk.....kbkk.', '.....kbbkrrkbbk...kbk...']);
const DOG_SIT_DOWN = withRows(DOG_DOWN, 11, [
  '......kwwnnwwk..........',
  '......kwwkkwwk..........',
  '......kkwwwwkk..........',
  '.....kbbkkkkbbk.........',
  '....kbbbwwwwbbbk........',
  '....kbbbwwwwbbbk........',
  '...kbbbbbwwbbbbbk.......',
  '...kbbbkbwwbkbbbk.......',
  '...kbbbkbbbbkbbbkkkk....',
  '...kbbkkbkkbkkbbbbbtk...',
  '...kwwkkwkkwkkwwkkkk....',
  '...kkkkkkkkkkkkkk.......',
]);
// From behind: the hackle down the neck, the saddle, and the tail's hook
// standing up on its left (the side it shows on from the front, too).
const DOG_UP = [
  '........................',
  '........................',
  '......k......k..........',
  '.....kpk....kbk.........',
  '.....kpk....kbk.........',
  '.....kbbkkkkbbk.........',
  '.....kbbbbbbbbk.........',
  '.....kbbbbbbbbk.........',
  '.....kbbbbbbbbk.........',
  '.....kbbbbbbbbk.........',
  '......kbddddbk..........',
  '.kk...kbddddbk..........',
  'kttk.kbbbddbbbk.........',
  'kkbk.kbbbbbbbbk.........',
  '.kbk.kbbppppbbk.........',
  '..kbkkbbppppbbk.........',
  '...kbkbbbbbbbbk.........',
  '....kkbbbbbbbbk.........',
  '.....kbkbbbbkbk.........',
  '.....kbk.kk.kbk.........',
  '.....kbk....kbk.........',
  '.....kwk....kwk.........',
  '.....kkk....kkk.........',
  '........................',
];
// (from behind, looking up: the head lifts a row, and the ears tip back and look shorter)
const DOG_LOOK_UP = withRows(DOG_UP, 2, [
  '.....kk.....kk..........',
  '.....kpk....kbk.........',
  '.....kbbkkkkbbk.........',
  '.....kbbbbbbbbk.........',
  '.....kbbbbbbbbk.........',
  '.....kbbbbbbbbk.........',
  '.....kbbbbbbbbk.........',
  '......kbbbbbbk..........',
  '......kbddddbk..........',
  '......kbddddbk..........',
]);

// Three coats, so that a pack reads as three dogs: a tan village dog with a
// darker back, a black one with tan points, and a white one with brown patches.
export const DOG_PALS = {
  tan: { k: C.k, b: '#c79a58', d: '#8f6635', p: '#b8884a', l: '#e3c891', w: '#e9d3a2', e: '#2b2024', n: '#2b2024', i: '#d9a08c', t: '#8f6635', r: '#d8667a', f: '#fbf7ee' },
  black: { k: C.k, b: '#453a42', d: '#2f262d', p: '#453a42', l: '#a8773f', w: '#c2915a', e: '#f2c14a', n: '#17121c', i: '#b98852', t: '#c2915a', r: '#d8667a', f: '#fbf7ee' },
  patched: { k: C.k, b: '#efe8d8', d: '#d9cfba', p: '#9a6436', l: '#fbf7ee', w: '#ffffff', e: '#2b2024', n: '#2b2024', i: '#e6b0a0', t: '#9a6436', r: '#d8667a', f: '#ffffff' },
};
// The same shape of object as makeCat gives, with a dog's own poses added:
// look (head up), bark, sniff and cower. opts: { coat } as for a cat.
export function makeDog(pal, opts = {}) {
  const s = (rows, kind) => sprite(rows, pal, opts.coat, kind);
  const both = (rows, kind) => {
    const im = s(rows, kind);
    return { left: im, right: flip(im) };
  };
  const stand = both(DOG_LEFT, 'dogLeft');
  const stride = both(DOG_LEFT_1, 'dogLeft');
  const look = both(DOG_LOOK_LEFT, 'dogLeft');
  const bark = both(DOG_BARK_LEFT, 'dogLeft');
  const steps = (rows, kind) => [s(withRows(rows, 19, DOG_STEP_1), kind), s(withRows(rows, 19, DOG_STEP_2), kind)];
  return {
    walk: { down: steps(DOG_DOWN, 'dogDown'), up: steps(DOG_UP, 'dogUp'), left: [stride.left, stand.left], right: [stride.right, stand.right] },
    stand: { down: s(DOG_DOWN, 'dogDown'), up: s(DOG_UP, 'dogUp'), ...stand },
    sit: { down: s(DOG_SIT_DOWN, 'dogSit'), up: s(DOG_UP, 'dogUp'), ...both(DOG_SIT_LEFT, 'dogSitLeft') },
    look: { ...look, up: s(DOG_LOOK_UP, 'dogUp'), down: s(DOG_DOWN, 'dogDown') },
    bark: { ...bark, down: s(DOG_BARK_DOWN, 'dogDown'), up: s(DOG_UP, 'dogUp') },
    sniff: both(DOG_SNIFF_LEFT, 'dogSniff'),
    cower: both(DOG_COWER_LEFT, 'dogCower'),
  };
}
