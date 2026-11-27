// A tiny hand-drawn bitmap font (5x7 caps, 2 rows of descender) so the game
// needs no font files. Glyph rows are separated by "/".
import { canvas } from './palette.js';

const RAW = {
  A: '.###./#...#/#...#/#####/#...#/#...#/#...#',
  B: '####./#...#/#...#/####./#...#/#...#/####.',
  C: '.###./#...#/#..../#..../#..../#...#/.###.',
  D: '####./#...#/#...#/#...#/#...#/#...#/####.',
  E: '#####/#..../#..../####./#..../#..../#####',
  F: '#####/#..../#..../####./#..../#..../#....',
  G: '.###./#...#/#..../#.###/#...#/#...#/.###.',
  H: '#...#/#...#/#...#/#####/#...#/#...#/#...#',
  I: '###/.#./.#./.#./.#./.#./###',
  J: '..###/...#./...#./...#./...#./#..#./.##..',
  K: '#...#/#..#./#.#../##.../#.#../#..#./#...#',
  L: '#..../#..../#..../#..../#..../#..../#####',
  M: '#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#',
  N: '#...#/##..#/#.#.#/#..##/#...#/#...#/#...#',
  O: '.###./#...#/#...#/#...#/#...#/#...#/.###.',
  P: '####./#...#/#...#/####./#..../#..../#....',
  Q: '.###./#...#/#...#/#...#/#.#.#/#..#./.##.#',
  R: '####./#...#/#...#/####./#.#../#..#./#...#',
  S: '.####/#..../#..../.###./....#/....#/####.',
  T: '#####/..#../..#../..#../..#../..#../..#..',
  U: '#...#/#...#/#...#/#...#/#...#/#...#/.###.',
  V: '#...#/#...#/#...#/#...#/#...#/.#.#./..#..',
  W: '#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#',
  X: '#...#/#...#/.#.#./..#../.#.#./#...#/#...#',
  Y: '#...#/#...#/.#.#./..#../..#../..#../..#..',
  Z: '#####/....#/...#./..#../.#.../#..../#####',
  a: '...../...../.###./....#/.####/#...#/.####',
  b: '#..../#..../####./#...#/#...#/#...#/####.',
  c: '..../..../.###/#.../#.../#.../.###',
  d: '....#/....#/.####/#...#/#...#/#...#/.####',
  e: '...../...../.###./#...#/#####/#..../.###.',
  f: '..##/.#../###./.#../.#../.#../.#..',
  g: '...../...../.####/#...#/#...#/.####/....#/.###.',
  h: '#..../#..../####./#...#/#...#/#...#/#...#',
  i: '#/./#/#/#/#/#',
  j: '..#/.../..#/..#/..#/..#/..#/##.',
  k: '#.../#.../#..#/#.#./##../#.#./#..#',
  l: '#./#./#./#./#./#./.#',
  m: '...../...../##.#./#.#.#/#.#.#/#.#.#/#.#.#',
  n: '...../...../####./#...#/#...#/#...#/#...#',
  o: '...../...../.###./#...#/#...#/#...#/.###.',
  p: '...../...../####./#...#/#...#/####./#..../#....',
  q: '...../...../.####/#...#/#...#/.####/....#/....#',
  r: '..../..../#.##/##../#.../#.../#...',
  s: '..../..../.###/#.../.##./...#/###.',
  t: '.#../.#../###./.#../.#../.#../..##',
  u: '...../...../#...#/#...#/#...#/#...#/.####',
  v: '...../...../#...#/#...#/#...#/.#.#./..#..',
  w: '...../...../#...#/#...#/#.#.#/#.#.#/.#.#.',
  x: '...../...../#...#/.#.#./..#../.#.#./#...#',
  y: '...../...../#...#/#...#/#...#/.####/....#/.###.',
  z: '...../...../#####/...#./..#../.#.../#####',
  'ư': '....../.....#/#...##/#...#./#...#./#...#./.####.',
  'Ư': '#...#.#/#...###/#...#../#...#../#...#../#...#../.###...',
  0: '.###./#...#/#..##/#.#.#/##..#/#...#/.###.',
  1: '.#./##./.#./.#./.#./.#./###',
  2: '.###./#...#/....#/...#./..#../.#.../#####',
  3: '####./....#/....#/.###./....#/....#/####.',
  4: '...#./..##./.#.#./#..#./#####/...#./...#.',
  5: '#####/#..../####./....#/....#/#...#/.###.',
  6: '.###./#..../#..../####./#...#/#...#/.###.',
  7: '#####/....#/...#./..#../..#../..#../..#..',
  8: '.###./#...#/#...#/.###./#...#/#...#/.###.',
  9: '.###./#...#/#...#/.####/....#/....#/.###.',
  '.': '././././././#',
  ',': '../../../../../../.#/#.',
  '!': '#/#/#/#/#/./#',
  '?': '.###./#...#/....#/...#./..#../...../..#..',
  "'": '#/#',
  '"': '#.#/#.#',
  '-': '.../.../.../###',
  ':': './././#/././#',
  ';': '../../../.#/../../.#/#.',
  '(': '.#/#./#./#./#./#./.#',
  ')': '#./.#/.#/.#/.#/.#/#.',
  '/': '....#/...#./...#./..#../.#.../.#.../#....',
  '+': '.../.../.#./###/.#.',
  '=': '..../..../####/..../####',
  '*': '...../#.#.#/.###./#.#.#',
  '&': '.##../#..#./#.#../.#.../#.#.#/#..#./.##.#',
  '~': '...../...../.#..#/#.##.',
  '…': '...../...../...../...../...../...../#.#.#',
  '♥': '.##.##./#######/#######/.#####./..###../...#...',
  '♪': '..###/..#.#/..#../..#../###../###..',
  // the pad's four buttons and the menu button, for text about the controls
  '✕': '#.....#/.#...#./..#.#../...#.../..#.#../.#...#./#.....#',
  '◯': '..###../.#...#./#.....#/#.....#/#.....#/.#...#./..###..',
  '△': '...#.../...#.../..#.#../..#.#../.#...#./.#...#./#######',
  '▢': '#######/#.....#/#.....#/#.....#/#.....#/#.....#/#######',
  '☰': '......./#######/......./#######/......./#######/.......',
  // the battle screen's icons, so that text can show them: attack, agility, hit chance; and what a foe's
  // thought bubble holds: claws, a shield, a star. (HP is the heart above.) Their colours are in ICON_INK.
  '⚔': '.....##/....###/...###./#.###../.###.../.##..../#..#...',
  '➤': '......./....#../.#..##./#.#####/.#..##./....#../.......',
  '⌖': '..###../.#...#./#..#..#/#.###.#/#..#..#/.#...#./..###..',
  '⫽': '..#.#.#/..#.#.#/.#.#.#./.#.#.#./#.#.#../#.#.#../.......',
  '⛨': '#######/#.###.#/##.#.##/#.###.#/#######/.#####./..###..',
  '✦': '...#.../.#.#.#./..###../#######/..###../.#.#.#./...#...',
  '>': '#../##./###/##./#..',
  '^': '..#../.###./#####',
  '<': '..#/.##/###/.##/..#',
  '%': '##..#/##.#./...#./..#../.#.../.#.##/#..##',
  '#': '.#.#./#####/.#.#./.#.#./#####/.#.#.',
};

const GLYPHS = {};
for (const [ch, raw] of Object.entries(RAW)) {
  const rows = raw.split('/');
  const w = Math.max(...rows.map((r) => r.length));
  GLYPHS[ch] = { rows, w };
}
// vertical nudges for glyphs that are drawn short
const NUDGE = { '♥': 1, '♪': 0, '>': 1, '<': 1, '^': 2, '*': 1 };

export const LINE_H = 10;
const SPACE_W = 3;

// does the font have this character? (anything it lacks is drawn as "?")
export const hasGlyph = (ch) => ch === ' ' || !!GLYPHS[ch];

export function textWidth(str) {
  let w = 0;
  for (const ch of str) {
    if (ch === ' ') w += SPACE_W + 1;
    else w += (GLYPHS[ch] || GLYPHS['?']).w + 1;
  }
  return Math.max(0, w - 1);
}

const cache = new Map();
function glyphCanvas(ch, color) {
  const key = color + ch;
  let c = cache.get(key);
  if (c) return c;
  const gl = GLYPHS[ch] || GLYPHS['?'];
  const [cv, g] = canvas(gl.w, 9);
  g.fillStyle = color;
  gl.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === '#') g.fillRect(x, y, 1, 1);
  });
  cache.set(key, cv);
  return cv;
}

// Draws a single line; returns the x after the last glyph.
export function drawText(g, str, x, y, color = '#000', scale = 1) {
  let cx = x;
  for (const ch of str) {
    if (ch === ' ') {
      cx += (SPACE_W + 1) * scale;
      continue;
    }
    const gl = GLYPHS[ch] || GLYPHS['?'];
    const cv = glyphCanvas(ch, color);
    const ny = (NUDGE[ch] || 0) * scale;
    if (scale === 1) g.drawImage(cv, cx, y + ny);
    else g.drawImage(cv, cx, y + ny, cv.width * scale, cv.height * scale);
    cx += (gl.w + 1) * scale;
  }
  return cx;
}

// Greedy word wrap to a pixel width.
export function wrapText(str, maxW) {
  const out = [];
  for (const para of str.split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const test = line ? line + ' ' + word : word;
      if (textWidth(test) > maxW && line) {
        out.push(line);
        line = word;
      } else line = test;
    }
    out.push(line);
  }
  return out;
}

// Words picked out in a second colour. markLines wraps like wrapText and says,
// for each line, which stretches of it [from, to) match `re` (a global
// regular expression, tried on the whole text, so a name of two words that is
// broken over two lines is still found). drawMarked draws one such line, or
// its first `count` letters.
// `re` may also be a list of [regular expression, colour]: each match is then drawn in its own colour.
export function markLines(str, maxW, re) {
  let marks = [];
  for (const [rule, colour] of Array.isArray(re) ? re : re ? [[re]] : [])
    for (const m of str.matchAll(rule)) if (m[0]) marks.push([m.index, m.index + m[0].length, colour]);
  // in order, and no two over the same letters
  marks.sort((a, b) => a[0] - b[0]);
  marks = marks.filter((m, i) => !marks.slice(0, i).some((p) => p[1] > m[0]));
  let pos = 0;
  return wrapText(str, maxW).map((text) => {
    const from = pos;
    pos += text.length + 1; // the space or line break it was cut at
    return { text, marks: marks.filter(([a, b]) => b > from && a < from + text.length).map(([a, b, c]) => [Math.max(0, a - from), Math.min(text.length, b - from), c]) };
  });
}
export function drawMarked(g, line, x, y, colour, hiColour, count = Infinity) {
  let at = 0;
  const piece = (to, c) => {
    const end = Math.min(to, count);
    if (end > at) x = drawText(g, line.text.slice(at, end), x, y, c);
    at = Math.max(at, to);
  };
  for (const [a, b, c] of line.marks) {
    piece(a, colour);
    piece(b, c || hiColour);
  }
  piece(line.text.length, colour);
  return x;
}

// The controls and menu items that tutorials name: keys, the pad's symbols, and what is on the menus.
// Text that teaches picks these out (see dialog.js and the battle screen's text panel).
export const CONTROLS = /(?<![A-Za-z])(?:Space|Shift|Esc|Arrows|arrows|D-pad|Help|Z|C)(?![A-Za-z])|[✕◯△▢☰]/g;
// the icons, each in its own colour wherever it is written
export const ICON_INK = [[/♥/g, '#e8645a'], [/⚔/g, '#f0a93a'], [/➤/g, '#3fb8a8'], [/⌖/g, '#c9a227'], [/⫽/g, '#d8483c'], [/⛨/g, '#5f8fe0'], [/✦/g, '#2e9e5b']];
