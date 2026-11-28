// The battle screen. Draws a fight run by battle.js, in one of two ways:
//  - battle mode: pick two teams (any fighters, up to three a side), then play
//    the left one against the right, over and over. opts.onExit() leaves it.
//  - an encounter from the story: createBattleScreen(input, { encounter, onDone }).
//    encounter = { party: [fighter], phases: [{ foes: [fighter], maxRounds?,
//    intro?: [pages], ends?: { won|lost|draw|timeout: result } }], intro?: [pages],
//    guide?: bool, backdrop?: 'garden' | 'home' | 'bare' (Purple Scarf's flat) | 'jetty', words?: { result: page } }.
//    A phase that is won leads to the next one, with the party as it stands;
//    onDone(result, { party: [{ kind, hp, max }] }) is called at the end.
// Same shape as game.js: { update, draw, drawHelp, pointer }.
import { CONFIG } from './config.js';
import { R, P, canvas } from './palette.js';
import { drawText, textWidth, wrapText, markLines, drawMarked, CONTROLS, ICON_INK } from './font.js';
import { makeCat, makeCritter, CRITTER_PALS } from './sprites.js';
import { RANDOM_COATS, NAMED } from './strays.js';
import { TYPES, renderType } from './furniture.js';
import { fighterSprites, dogSprites, DOG_COATS, portrait, statusChip } from './battle-sprites.js';
import { sfx, setPlace } from './audio.js';
import { createBattle, FIGHTERS, STORY_FIGHTERS, MOVES, RULES, STATUS, hitChance, healAmount, aglOf, accuracyWord } from './battle.js';
import { COPY } from './battle-text.js';
import { isAlias } from './names.js';
import { createDialog, faceOf } from './dialog.js';

const VW = CONFIG.viewW;
const VH = CONFIG.viewH;
const PANEL_Y = VH - 52;
const LH = 11; // line spacing in the panel: every box's lines sit on the same rows
const ROW = (i) => PANEL_Y + 4 + i * LH;
const INK = '#0c0b11';
const BOX = '#1c1a22';
const EDGE = '#55515c';
const TEXT = '#ece6d8';
const DIM = '#8d8894';
const OFF = '#5c5863';
const GOLD = '#f2d37a';
const MOVE_INK = '#ff9166'; // the names of moves, in the text panel
// every move's name, as written and in capitals, longest first; and every condition's (Infected,
// Strengthened...), which are picked out the same way, in small letters too ("is distracted")
const MOVE_NAMES = new RegExp(
  '\\b(?:' +
    [...new Set([...Object.values(MOVES).map((m) => m.name).filter(Boolean), ...Object.values(COPY.conditions).flatMap((c) => (c.name ? [c.name, c.name.toLowerCase()] : []))])]
      .sort((a, b) => b.length - a.length)
      .flatMap((n) => [n, n.toUpperCase()])
      .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|') +
    ')\\b',
  'g'
);
// what the text panel picks out: moves, the buttons and menu items a hint names, and the icons in their colours
// (and the menu's own Attack, where a lesson names it beside Defend)
const PICKED = [[MOVE_NAMES, MOVE_INK], [new RegExp('\\b' + COPY.menu.attack + '\\b', 'g'), MOVE_INK], [CONTROLS, MOVE_INK], ...ICON_INK];
// ...and what a tip box over the fight picks out: the names of moves and of conditions, as they are written
const TIP_WORDS = [...new Set([...Object.values(MOVES).map((m) => m.name), ...Object.values(COPY.conditions).map((c) => c.name)].filter(Boolean))].sort((a, b) => b.length - a.length);
// the star for a special in a foe's thought bubble, and the crosshair beside the odds: the colours the lessons give them
const SPECIAL_INK = '#2e9e5b';
const ACC_INK = '#e6c34a';
const RED = '#e0453a';
const ZOOM = 2;
const PARTY_W = 96; // the party's box in the panel
const MENU_W = 92; // the menu's column beside it
const TARGET_W = 100; // ...a little wider while it lists targets ("Hit Grey Tabby")
const PACE = 3; // how long each beat of a turn stays up, as a multiple of its own length

// Where a side's cats stand (feet), by how many places the side has needed
// so far. The left side's places; the right side mirrors them. A place is
// kept for the whole fight: nobody shuffles up when a cat goes down.
// Each cat needs room above its head for a thought bubble (or the arrow that
// marks whose turn it is) and below its feet for a health bar and a row of
// conditions. Every row has one height, whatever the size of the cats in it,
// so health bars line up across the two sides; one cat alone stands level
// with the middle of three. The widest sprite is 44 across and a row of four
// conditions 48, so two columns 50 apart never touch: the middle cat of three
// stands out wide, the top and bottom ones share the inner column (the top
// one's conditions end above the tallest bottom cat's bubble).
const PLACES = {
  1: [[84, 96]],
  2: [[100, 70], [50, 128]],
  3: [[88, 56], [38, 96], [88, 135]],
};
// Who can be picked in Battle mode, in the order of the grid. No stray: it was nobody in particular. The
// three humans come last, and only ever on the foes' side (see foesOnly): this is not a game about
// hitting cats.
const ROSTER = ['shark', 'orca', 'thanos', 'scar', 'cheetos', 'socks', 'mama', 'bbc', 'flower', 'rat', 'snake', 'dog', 'green', 'club', 'scarf'];
// how big a fighter's picture may be in its tile, at twice its size
const FACE_W = 46;
const FACE_H = 30;

const pick = (a) => a[Math.floor(Math.random() * a.length)];

// ------------------------------------------------------------ backdrop
// indoors at night: the living room in silhouette, and a rug to fight on
function paintHome() {
  const [cv, g] = canvas(VW, VH);
  R(g, 0, 0, VW, VH, INK);
  const dither = (x, y, w, h, c, every = 2, phase = 0) => {
    g.fillStyle = c;
    for (let j = 0; j < h; j++) for (let i = (j + phase) % every; i < w; i += every) g.fillRect(x + i, y + j, 1, 1);
  };
  const wall = Math.round(PANEL_Y * 0.36);
  // the wall, a window with the night in it, and the skirting board
  R(g, 0, 0, VW, wall, '#1b1826');
  dither(0, 0, VW, wall, '#211d2e', 2, 0);
  R(g, 0, wall - 3, VW, 3, '#2b2738');
  const wx = Math.round(VW * 0.62);
  R(g, wx, 8, 58, wall - 20, '#3a3550');
  R(g, wx + 2, 10, 54, wall - 24, '#16203a');
  for (const [x, y] of [[8, 6], [21, 15], [37, 5], [45, 19], [30, 26], [13, 28]]) R(g, wx + 2 + x, 10 + y, 1, 1, '#c9cfe6');
  R(g, wx + 28, 10, 2, wall - 24, '#3a3550');
  // a sofa and a lamp against the wall
  const sx = Math.round(VW * 0.1);
  R(g, sx, wall - 30, 84, 28, '#262235');
  R(g, sx + 4, wall - 26, 76, 14, '#2f2a42');
  R(g, sx - 4, wall - 20, 8, 18, '#2f2a42');
  R(g, sx + 80, wall - 20, 8, 18, '#2f2a42');
  R(g, sx + 104, 14, 1, wall - 16, '#2f2a42');
  R(g, sx + 98, 8, 13, 8, '#5a5270');
  // floorboards
  for (let y = wall; y < VH; y += 9) {
    R(g, 0, y, VW, 9, (y / 9) & 1 ? '#231f2c' : '#27222f');
    R(g, 0, y, VW, 1, '#1c1924');
  }
  // the rug, lit from above
  const cx = VW >> 1;
  const cy = Math.round(PANEL_Y * 0.7);
  const rug = (rx, ry, c, every, phase) => {
    for (let j = -ry; j <= ry; j++) {
      const half = Math.round(rx * Math.sqrt(1 - (j * j) / (ry * ry)));
      if (every) dither(cx - half, cy + j, half * 2, 1, c, every, (phase + j + 400) % every);
      else R(g, cx - half, cy + j, half * 2, 1, c);
    }
  };
  rug(150, 50, '#3b3348', 2, 0);
  rug(144, 47, '#4b4058', 0);
  rug(138, 44, '#5a4b62', 2, 1);
  rug(130, 40, '#5a4b62', 0);
  rug(112, 33, '#6a5870', 2, 0);
  rug(96, 26, '#6a5870', 0);
  rug(70, 18, '#78657c', 2, 1);
  return cv;
}
// the jetty at night: the river, the moored boat with dogs along its rail, and planks to fight on
function paintJetty() {
  const [cv, g] = canvas(VW, VH);
  R(g, 0, 0, VW, VH, INK);
  const dither = (x, y, w, h, c, every = 2, phase = 0) => {
    g.fillStyle = c;
    for (let j = 0; j < h; j++) for (let i = (j + phase) % every; i < w; i += every) g.fillRect(x + i, y + j, 1, 1);
  };
  const blob = (cx, cy, rx, ry, c, every, phase) => {
    for (let j = -ry; j <= ry; j++) {
      const half = Math.round(rx * Math.sqrt(1 - (j * j) / (ry * ry)));
      if (every) dither(cx - half, cy + j, half * 2, 1, c, every, (phase + j + 400) % every);
      else R(g, cx - half, cy + j, half * 2, 1, c);
    }
  };
  const X = (v) => Math.round((v * VW) / 240);
  const Y = (v) => Math.round((v * PANEL_Y) / 108);
  const edge = Y(38); // where the planks begin
  // the river, and the far bank's lights on it
  R(g, 0, 0, VW, edge, '#141b2e');
  dither(0, 0, VW, edge, '#18213a', 2, 0);
  for (const [x, y, w] of [[10, 5, 9], [44, 9, 6], [70, 3, 12], [118, 7, 8], [150, 4, 5], [176, 10, 10], [214, 6, 7], [228, 12, 5], [28, 16, 7], [196, 18, 6]]) R(g, X(x), Y(y), X(w), 1, '#2a3757');
  // the boat: a long pale hull, a cabin, and a row of heads and ears along the near rail
  const bx = X(40);
  const bw = X(160);
  const by = Y(14);
  const hull = '#3d4257';
  const hullD = '#2c3145';
  R(g, bx + X(8), by + Y(8), bw - X(8), Y(12), hull);
  for (let i = 0; i < X(8); i++) R(g, bx + i, by + Y(8) + Math.round((X(8) - i) * 0.6), 1, Y(12) - Math.round((X(8) - i) * 0.9), hull); // the bow
  R(g, bx + X(8), by + Y(17), bw - X(8), 1, '#565c75');
  R(g, bx + X(4), by + Y(20), bw - X(4), 2, hullD);
  R(g, bx + X(70), by, X(34), Y(9), hullD); // the cabin
  R(g, bx + X(74), by + 2, X(26), Y(4), '#1c2236');
  R(g, bx + bw - X(6), by + Y(4), X(6), Y(8), hullD); // the engine
  const dog = (x, c) => {
    const y = by + Y(8) - 6;
    R(g, x, y + 2, 7, 6, c);
    R(g, x, y, 2, 3, c);
    R(g, x + 5, y, 2, 3, c);
    R(g, x + 2, y + 4, 1, 1, '#c9cfe6');
    R(g, x + 4, y + 4, 1, 1, '#c9cfe6');
  };
  [16, 30, 41, 55, 110, 122, 136, 147].forEach((x, i) => dog(bx + X(x), i % 3 === 1 ? '#161a28' : '#22273a'));
  // mooring posts, and the edge of the jetty
  for (const x of [30, 90, 150, 210]) {
    R(g, X(x), edge - Y(7), 3, Y(8), '#2e2a2c');
    R(g, X(x), edge - Y(7), 3, 1, '#4a4446');
  }
  R(g, 0, edge, VW, 2, '#18141a');
  // planks, running away from us
  for (let y = edge + 2, n = 0; y < VH; y += 8, n++) {
    R(g, 0, y, VW, 8, n & 1 ? '#262026' : '#2a242a');
    R(g, 0, y, VW, 1, '#1a161c');
    for (let x = (n * 37) % 61; x < VW; x += 61) R(g, x, y + 1, 1, 7, '#1a161c');
  }
  // lamplight on the wood
  const cx = VW >> 1;
  const cy = Y(76);
  blob(cx, cy, X(116), Y(30), '#342c30', 2, 0);
  blob(cx, cy, X(108), Y(27), '#43383a', 2, 1);
  blob(cx, cy, X(102), Y(25), '#514347', 0);
  blob(cx, cy, X(94), Y(22), '#5f4f52', 2, 0);
  blob(cx, cy, X(84), Y(19), '#5f4f52', 0);
  blob(cx, cy, X(66), Y(14), '#6d5b5d', 2, 1);
  // (the gaps between the boards show through the light)
  for (let y = edge + 2; y < VH; y += 8) dither(0, y, VW, 1, '#1a161c', 2, 0);
  return cv;
}
// Purple Scarf's flat: bare white tiles under a cold ceiling light, a black sofa on its platform, and not much else
function paintBare() {
  const [cv, g] = canvas(VW, VH);
  R(g, 0, 0, VW, VH, INK);
  const dither = (x, y, w, h, c, every = 2, phase = 0) => {
    g.fillStyle = c;
    for (let j = 0; j < h; j++) for (let i = (j + phase) % every; i < w; i += every) g.fillRect(x + i, y + j, 1, 1);
  };
  const wall = Math.round(PANEL_Y * 0.36);
  R(g, 0, 0, VW, wall, '#1d2028');
  dither(0, 0, VW, wall, '#22262f', 2, 0);
  R(g, 0, wall - 2, VW, 2, '#30343f');
  // tall windows with no curtains, and the night in them
  const wx = Math.round(VW * 0.06);
  for (let i = 0; i < 3; i++) {
    R(g, wx + i * 30, 4, 28, wall - 8, '#30343f');
    R(g, wx + i * 30 + 2, 6, 24, wall - 12, '#141b2e');
  }
  for (const [x, y] of [[8, 9], [20, 20], [41, 7], [52, 24], [70, 13], [77, 27]]) R(g, wx + x, 6 + y, 1, 1, '#c9cfe6');
  // the sofa, black, on a low platform
  const sx = Math.round(VW * 0.1);
  R(g, sx - 10, wall - 5, 106, 5, '#2a2623');
  R(g, sx, wall - 27, 84, 23, '#121318');
  R(g, sx + 4, wall - 23, 76, 10, '#1a1c23');
  R(g, sx - 3, wall - 19, 7, 15, '#1a1c23');
  R(g, sx + 80, wall - 19, 7, 15, '#1a1c23');
  // a long low console, and the TV on it
  const tx = Math.round(VW * 0.6);
  R(g, tx, wall - 9, 96, 8, '#2a2623');
  R(g, tx + 26, wall - 34, 44, 25, '#121318');
  R(g, tx + 28, wall - 32, 40, 21, '#1a1f2c');
  // big square tiles
  R(g, 0, wall, VW, VH - wall, '#262930');
  for (let y = wall; y < VH; y += 14) R(g, 0, y, VW, 1, '#1e2027');
  for (let x = 6; x < VW; x += 22) R(g, x, wall, 1, VH - wall, '#1e2027');
  // a pool of cold light from the ceiling
  const cx = VW >> 1;
  const cy = Math.round(PANEL_Y * 0.7);
  const pool = (rx, ry, c, every, phase) => {
    for (let j = -ry; j <= ry; j++) {
      const half = Math.round(rx * Math.sqrt(1 - (j * j) / (ry * ry)));
      if (every) dither(cx - half, cy + j, half * 2, 1, c, every, (phase + j + 400) % every);
      else R(g, cx - half, cy + j, half * 2, 1, c);
    }
  };
  pool(150, 50, '#343842', 2, 0);
  pool(144, 47, '#434854', 0);
  pool(138, 44, '#525866', 2, 1);
  pool(130, 40, '#525866', 0);
  pool(112, 33, '#626978', 2, 0);
  pool(96, 26, '#626978', 0);
  pool(70, 18, '#727a8a', 2, 1);
  // (the joins between the tiles show through the light)
  for (let y = wall; y < VH; y += 14) dither(0, y, VW, 1, '#1e2027', 2, 0);
  for (let x = 6; x < VW; x += 22) dither(x, wall, 1, VH - wall, '#1e2027', 1, 0);
  return cv;
}
// the garden at night, in silhouette, and a pool of lamplight to fight in
function paintBackdrop() {
  const [cv, g] = canvas(VW, VH);
  R(g, 0, 0, VW, VH, INK);
  const dither = (x, y, w, h, c, every = 2, phase = 0) => {
    g.fillStyle = c;
    for (let j = 0; j < h; j++) for (let i = (j + phase) % every; i < w; i += every) g.fillRect(x + i, y + j, 1, 1);
  };
  const blob = (cx, cy, rx, ry, c, every, phase) => {
    for (let j = -ry; j <= ry; j++) {
      const half = Math.round(rx * Math.sqrt(1 - (j * j) / (ry * ry)));
      if (every) dither(cx - half, cy + j, half * 2, 1, c, every, (phase + j + 400) % every);
      else R(g, cx - half, cy + j, half * 2, 1, c);
    }
  };
  // (laid out on a 240 x 108 field, stretched to whatever the screen is)
  const X = (v) => Math.round((v * VW) / 240);
  const Y = (v) => Math.round((v * PANEL_Y) / 108);
  // far silhouettes: trees, a lamppost, the BBQ shed
  const far = '#1d2130';
  const near = '#272c3f';
  for (const [x, y, r] of [[18, 22, 13], [36, 16, 16], [58, 24, 11], [150, 20, 14], [172, 14, 17], [226, 22, 13], [208, 18, 10]]) {
    blob(X(x), Y(y), X(r), Math.round(X(r) * 0.8), far, 2, x);
    R(g, X(x) - 1, Y(y) + Math.round(X(r) * 0.6), 2, Y(14), far);
  }
  for (const [x, y, r] of [[8, 30, 10], [236, 32, 11], [192, 28, 8]]) blob(X(x), Y(y), X(r), Math.round(X(r) * 0.8), near, 2, x + 1);
  // shed
  dither(X(96), Y(20), X(44), 3, near, 2, 0);
  dither(X(92), Y(20) + 3, X(52), 2, near, 2, 1);
  for (const x of [98, 116, 136]) R(g, X(x), Y(20) + 5, 1, Y(13), far);
  // lamppost with a small glow
  R(g, X(124), Y(6), 1, Y(30), near);
  R(g, X(124) - 2, Y(6) - 1, 5, 2, '#5a6079');
  blob(X(124), Y(6) + 1, 9, 6, '#2b3147', 2, 0);
  R(g, X(124) - 1, Y(6), 3, 1, '#c9cfe6');
  // the pool of light
  const cx = VW >> 1;
  const cy = Y(74);
  blob(cx, cy, X(118), Y(52), '#262b3d', 2, 0);
  blob(cx, cy, X(112), Y(49), '#3a4159', 2, 1);
  blob(cx, cy, X(108), Y(47), '#4a526c', 0);
  blob(cx, cy, X(104), Y(45), '#59627d', 2, 0);
  blob(cx, cy, X(98), Y(41), '#59627d', 0);
  blob(cx, cy, X(90), Y(36), '#66708c', 2, 1);
  blob(cx, cy, X(80), Y(30), '#66708c', 0);
  blob(cx, cy, X(62), Y(21), '#727c98', 2, 0);
  return cv;
}

// a sprite's shape in one flat colour, for the flash when something lands
const flats = new Map();
function flat(im, colour) {
  const k = colour;
  let m = flats.get(im);
  if (!m) flats.set(im, (m = {}));
  if (!m[k]) {
    const [cv, g] = canvas(im.width, im.height);
    g.drawImage(im, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = colour;
    g.fillRect(0, 0, im.width, im.height);
    m[k] = cv;
  }
  return m[k];
}

// small pictures for the panels, 7 x 7 like the condition chips: health,
// attack, agility, the odds of landing, yes and no
const ICONS = {
  hp: ['.##.##.', '#######', '#######', '#######', '.#####.', '..###..', '...#...'],
  atk: ['.....##', '....###', '...###.', '#.###..', '.###...', '.##....', '#..#...'],
  agl: ['.......', '....#..', '.#..##.', '#.#####', '.#..##.', '....#..', '.......'],
  acc: ['..###..', '.#...#.', '#..#..#', '#.###.#', '#..#..#', '.#...#.', '..###..'],
  yes: ['.......', '......#', '.....##', '#...##.', '##.##..', '.###...', '..#....'],
  no: ['#.....#', '##...##', '.##.##.', '..###..', '.##.##.', '##...##', '#.....#'],
};
export const STAT_COLOUR = { hp: '#e8645a', atk: '#f0a93a', agl: '#5fd0c0' };
// the biggest value of each stat in the roster: every stat bar is on that scale
export const STAT_MAX = Object.fromEntries(['hp', 'atk', 'agl'].map((k) => [k, Math.max(...Object.values(FIGHTERS).map((f) => f[k]))]));
export function icon(g, kind, x, y, colour) {
  ICONS[kind].forEach((row, j) => {
    for (let i = 0; i < 7; i++) if (row[i] === '#') R(g, x + i, y + j, 1, 1, colour);
  });
}

export function createBattleScreen(input, opts = {}) {
  const enc = opts.encounter || null;
  const backdrop = enc && enc.backdrop === 'home' ? paintHome() : enc && enc.backdrop === 'jetty' ? paintJetty() : enc && enc.backdrop === 'bare' ? paintBare() : paintBackdrop();
  // sprites for the fight; the picker shows the same ones, so sizes compare
  const SPRITES = fighterSprites();
  // the robot vacuum is a piece of furniture: one picture does for every pose
  {
    const im = renderType(TYPES.vacuum);
    const [flip, fg] = canvas(im.width, im.height);
    fg.translate(im.width, 0);
    fg.scale(-1, 1);
    fg.drawImage(im, 0, 0);
    SPRITES.robot = { stand: { left: im, right: flip, down: im }, sit: { left: im, right: flip, down: im }, walk: { left: [im, im], right: [flip, flip] } };
  }
  // The picker shows the same cats, at their real relative sizes where a tile
  // allows: the biggest are shrunk a step at a time until they fit inside it.
  const inked = (im) => {
    const d = im.getContext('2d').getImageData(0, 0, im.width, im.height).data;
    let x0 = im.width, x1 = -1, y0 = im.height, y1 = -1;
    for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) if (d[(y * im.width + x) * 4 + 3]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  };
  const FACES = {};
  for (const maxScale of [null, 1.25, 1.1875, 1.125, 1.0625, 1]) {
    const set = maxScale ? fighterSprites({ maxScale, overlap: 10 }) : SPRITES;
    for (const k of ROSTER) {
      if (FACES[k]) continue;
      let im = portrait(set[k], k);
      let box = inked(im);
      if (STORY_FIGHTERS[k] && STORY_FIGHTERS[k].human) {
        // (a person is far too tall for a tile: head and shoulders, at the size the cats are drawn)
        const h = Math.min(box.h, FACE_H >> 1);
        const [cv, cg] = canvas(im.width, h);
        cg.drawImage(im, 0, box.y, im.width, h, 0, 0, im.width, h);
        im = cv;
        box = inked(im);
      }
      if ((box.w * 2 <= FACE_W && box.h * 2 <= FACE_H) || maxScale === 1) FACES[k] = { im, box };
    }
  }
  // (a kind that comes in one size only, like the dog, and is still too big for a tile: its picture is
  // made a little smaller, so that it stands clear of the frame as the others do)
  for (const k of ROSTER) {
    const { im, box } = FACES[k];
    if (box.w * 2 <= FACE_W && box.h * 2 <= FACE_H) continue;
    const by = Math.floor(Math.min(FACE_W / 2 / box.w, FACE_H / 2 / box.h) * 16) / 16;
    const w = Math.max(1, Math.round(box.w * by));
    const h = Math.max(1, Math.round(box.h * by));
    const [cv, g] = canvas(w, h);
    g.imageSmoothingEnabled = false;
    g.drawImage(im, box.x, box.y, box.w, box.h, 0, 0, w, h);
    FACES[k] = { im: cv, box: { x: 0, y: 0, w, h } };
  }

  let mode = 'select'; // select | pages | menu | play | wait
  setPlace(enc ? 'battle' : 'battlePrep');
  let phaseI = 0; // which phase of an encounter is being fought
  // Fighters can talk, in the same box as outside a fight (name, face, words):
  // between the phases of an encounter, and before a phase begins.
  // A lesson before a fight: the box that says whose turn it is next is shown for the first of your cats,
  // and a list of [stat or '', words] is gone through above it, each stat lit as it is explained.
  let teach = null; // { list, i, then }
  function showTeach(list, then) {
    teach = { list, i: 0, then };
    mode = 'teach';
  }
  // A lesson over the menu: its words in a box of their own above the panel, with the menu they are about
  // on the screen under them. Until it is put away (the action button, or a tap) the buttons do nothing else.
  // An encounter's `lessons` are each shown once: `menu` the first time your menu comes up, `aim` the first
  // time a target is being chosen (the odds beside the crosshair are lit while it is up).
  let lesson = null; // { key, text }
  const taught = new Set();
  function teachOnce(key) {
    const text = enc && enc.lessons && enc.lessons[key];
    if (!text || taught.has(key)) return;
    taught.add(key);
    lesson = { key, text: say(text, {}) };
    sfx.learn();
  }
  const talkBox = createDialog(input);
  const faces = new Map();
  function showTalk(list, then) {
    const rest = list.slice();
    mode = 'talk';
    const next = () => {
      const l = rest.shift();
      if (!l) return then();
      // (a tip, in its own kind of box, as outside a fight: ['tip', words, the box's title])
      if (l[0] === 'tip') {
        sfx.learn();
        return void talkBox.open({ name: l[2] || '', text: say(l[1], {}), kind: 'tip', hi: TIP_WORDS, then: next });
      }
      const f = l[0] ? B.all.find((x) => x.kind === l[0]) : null;
      if (f && !faces.has(f)) faces.set(f, faceOf(view(f).sp.stand.down || view(f).sp.stand.left, 13));
      talkBox.open({ name: f ? label(f) : '', face: f ? faces.get(f) : null, text: say(l[1], {}), then: next });
    };
    next();
  }
  let B = null; // the fight (battle.js)
  let V = new Map(); // what is on screen for each fighter
  let who = null; // whose turn
  let menus = []; // the menu and the lists opened from it: [{ items, i, id }]
  let queue = [];
  let cur = null;
  let line = ''; // what the panel says while things happen
  let pages = [];
  let pageI = 0;
  let afterPages = null;
  let floats = [];
  let frame = 0;
  let wins = 0;
  let losses = 0;
  // the team picker
  const teams = [[], []];
  let step = 0; // 0: your side, 1: the other side
  let tile = 0;

  // ------------------------------------------------------------ words
  const PRO = { he: ['he', 'him', 'his', 'himself'], she: ['she', 'her', 'her', 'herself'], it: ['it', 'it', 'its', 'itself'] };
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
  // "The gray cat" starts a sentence, "the gray cat" sits inside one,
  // "Grey Tabby" stands alone
  const N = (f) => f.name;
  // (The Tabby and The Orange are names of a sort, and keep their capitals)
  const n = (f) => (f.name.startsWith('The ') && !isAlias(f.name) ? 'the ' + f.name.slice(4) : f.name);
  const label = (f) => f.label || f.name;
  const title = (s) => s.replace(/(^|[\s-])([a-z])/g, (m, a, b) => a + b.toUpperCase());

  // strays, rats and snakes get a look and a name of their own
  const ORDINAL = ['', 'second ', 'third ', 'fourth ', 'fifth ', 'sixth '];
  let coats = [];
  let count = {};
  function dress(f) {
    if (f.look === 'lookalike') {
      // one of Thanos's many children: his coat, on a smaller cat
      const i = (count.lookalike = (count.lookalike || 0) + 1) - 1;
      const def = NAMED.find((d) => d.id === 'thanos');
      f.name = 'The ' + ORDINAL[i % 6] + COPY.fighters.lookalike.label.toLowerCase();
      f.label = COPY.fighters.lookalike.label + (i ? ' ' + (i + 1) : '');
      return makeCat(def.pal, { coat: def.coat, scale: [0.9375, 0.9375] });
    }
    if (f.kind === 'mama' && f.look === 'solo') {
      // without Babycat in front of her
      const def = NAMED.find((d) => d.id === 'mama');
      return makeCat(def.pal, { coat: def.coat });
    }
    if (f.kind === 'stray') {
      if (!coats.length) coats = [...RANDOM_COATS].sort(() => Math.random() - 0.5);
      const c = RANDOM_COATS.find((o) => o.what === f.coat) || coats.pop();
      f.name = 'The ' + c.what;
      f.label = title(c.what);
      return makeCat(c.pal, { coat: c.coat });
    }
    if (f.kind === 'rat' && f.big) {
      f.name = COPY.fighters.bigRat.name;
      f.label = COPY.fighters.bigRat.label;
      return makeCritter('rat', CRITTER_PALS.rat[1], true);
    }
    if (f.kind === 'dog') {
      // every dog in a fight is a different dog: its own coat, and "the second dog"
      const i = (count.dog = (count.dog || 0) + 1) - 1;
      const coat = DOG_COATS[i % DOG_COATS.length];
      const again = Math.floor(i / DOG_COATS.length); // (a fourth dog is "the second tan dog")
      f.name = 'The ' + ORDINAL[again % 6] + coat + ' dog';
      f.label = title(coat + ' dog') + (again ? ' ' + (again + 1) : '');
      return dogSprites(i);
    }
    if (f.kind === 'rat' || f.kind === 'snake') {
      const i = (count[f.kind] = (count[f.kind] || 0) + 1) - 1;
      f.name = 'The ' + ORDINAL[i % 6] + f.kind;
      f.label = title(f.kind) + (i ? ' ' + (i + 1) : '');
      return makeCritter(f.kind, CRITTER_PALS[f.kind][i % 3]);
    }
    return SPRITES[f.kind];
  }

  // ---------------------------------------------------------- on screen
  let places = { party: 1, foes: 1 }; // how many places each side has needed so far
  function spot(f, sp) {
    places[f.side] = Math.max(places[f.side], f.slot + 1);
    const [x, y] = PLACES[places[f.side]][f.slot];
    return [f.side === 'party' ? x : VW - x, y];
  }
  function view(f) {
    let v = V.get(f);
    if (!v) {
      const sp = dress(f);
      const [x, y] = spot(f, sp);
      v = { sp, x, y, ink: inked(sp.stand.left).y, face: f.side === 'party' ? 'right' : 'left', side: f.side, hp: f.hp, lunge: 0, lx: 0, ly: 0, shake: 0, flash: 0, hop: 0, alpha: 0, out: false, ghost: false, def: false, prot: false, charge: false, st: {}, intent: f.intent };
      V.set(f, v);
    }
    return v;
  }
  const height = (v) => v.sp.stand.left.height * ZOOM;
  const width = (v) => v.sp.stand.left.width * ZOOM;

  // left and right: fighter kinds, or { kind, ...overrides } (see createBattle)
  const spec = (x) => (typeof x === 'string' ? { kind: x } : { ...x });
  function startBattle(left, right, rules = {}, intro) {
    coats = [];
    count = {};
    V = new Map();
    places = { party: left.length, foes: right.length };
    B = createBattle(left.map(spec), right.map(spec), Math.random, rules);
    B.maxRounds = rules.hideRounds ? 0 : rules.maxRounds || 0;
    setPlace('battle');
    for (const f of B.all) view(f).alpha = 1;
    queue = [];
    cur = null;
    floats = [];
    menus = [];
    line = '';
    who = null;
    const names = (list) => list.map(n).join(list.length > 2 ? ', ' : ' and ').replace(/, ([^,]*)$/, ' and $1');
    const first = intro || [cap(say(COPY.fight.intro, { left: names(B.party), right: names(B.foes) }))];
    showPages([...first, ...(!enc || (enc.guide && phaseI === 0) ? [COPY.fight.guide, COPY.fight.guideTab] : [])], () => {
      const go = () => (rules.talk ? showTalk(rules.talk, nextTurn) : nextTurn());
      rules.teach ? showTeach(rules.teach, go) : go();
    });
  }
  // an encounter from the story: its phases one after the other
  function startPhase(party) {
    const ph = enc.phases[phaseI];
    startBattle(party, ph.foes, { maxRounds: ph.maxRounds, hideRounds: ph.hideRounds, key: ph.key, talk: ph.before, teach: ph.teach }, phaseI === 0 ? enc.intro || ph.intro : ph.intro);
  }

  function showPages(list, then) {
    pages = list;
    pageI = 0;
    afterPages = then;
    mode = 'pages';
  }

  function sync() {
    for (const f of B.all) {
      const v = view(f);
      v.hp = f.hp;
      v.def = f.defending;
      v.prot = f.covering;
      v.charge = f.charging;
      v.ghost = f.vanished;
      v.st = { ...f.st };
      v.intent = f.intent;
      v.out = f.hp <= 0;
    }
  }

  // ------------------------------------------------------------ turns
  function nextTurn() {
    if (B.over) return finish();
    const t = B.begin();
    if (t.done) return play(t.events, nextTurn);
    sync();
    line = '';
    if (t.side === 'party') {
      // your side: with more than one cat still to act, you say who goes next
      // (asked every time on a side of more than one, even when only one is left to go: the others are
      // greyed in the party box, and the buttons do the same thing every turn. A cat fighting alone is not asked.)
      who = t.ready.length > 1 || B.party.length > 1 ? null : t.who;
      menus = [who ? rootMenu() : whoMenu(t.ready)];
      mode = 'menu';
      teachOnce('menu');
    } else {
      // a beat before an opponent moves, so the eye can find it
      who = t.who;
      mode = 'wait';
      line = say(COPY.menu.thinking, { name: who.name });
      queue = [{ dur: 24 }, { dur: 0, start: () => { const c = B.choose(who); play(B.act(who, c.id, c.target), nextTurn); } }];
      cur = null;
    }
  }

  // ------------------------------------------------------------- menu
  // Attack / Defend / Special. Attack opens the light attack and the cat's own
  // heavy one; Special opens its specials; a move that needs a target opens
  // the list of targets. Every list but the first ends in Back.
  const BACK = { label: COPY.menu.back, back: true };
  const doMove = (id, target) => () => play(B.act(who, id, target), nextTurn);
  const open = (m) => () => menus.push(m());
  function targetMenu(id) {
    const verb = MOVES[id].verb || COPY.menu.hit;
    teachOnce('aim');
    return { id, ask: MOVES[id].name, wide: true, items: [...B.targets(who, id).map((t) => ({ label: verb + ' ' + label(t), target: t, go: doMove(id, t) })), BACK], i: 0 };
  }
  // why: the reason it cannot be used just now (shown in red above what it does)
  function moveItem(id) {
    const m = MOVES[id];
    const why = B.blocked(who, id);
    return { label: m.name, off: !!why, why, hint: m.hint, acc: accuracyWord(m), go: m.self ? doMove(id, who) : open(() => targetMenu(id)) };
  }
  // Which of your cats acts next: chosen in the party box on the left, in the
  // order the names are listed there.
  function whoMenu(ready) {
    const list = ready.slice().sort((a, b) => B.party.indexOf(a) - B.party.indexOf(b));
    return { pick: true, items: list.map((f) => ({ label: label(f), target: f, go: () => { who = f; menus.push(rootMenu(true)); } })), i: 0 };
  }
  function rootMenu(canGoBack) {
    const ready = B.ready(who);
    const names = (ids) => ids.map((s) => MOVES[s].name).join(', ') + '.';
    const items = [];
    if (who.heavy) items.push({ label: COPY.menu.attack, hint: names(['attack', who.heavy]), go: open(() => ({ ask: COPY.menu.whichAttack, items: [moveItem('attack'), moveItem(who.heavy), BACK], i: 0 })) });
    else items.push({ ...moveItem('attack'), label: COPY.menu.attack });
    items.push(moveItem('defend'));
    if (who.specials.length)
      items.push({
        label: COPY.menu.special, off: !ready, hint: names(who.specials),
        why: ready ? null : who.st.spooked ? COPY.blocked.spooked : who.cd === 1 ? COPY.blocked.waitOne : say(COPY.blocked.wait, { n: who.cd }),
        go: open(() => ({ ask: COPY.menu.whichSpecial, items: [...who.specials.map(moveItem), BACK], i: 0 })),
      });
    if (canGoBack) items.push(BACK);
    return { items, i: 0 };
  }
  const menu = () => menus[menus.length - 1];
  function back() {
    if (menus.length > 1) {
      menus.pop();
      if (menu().pick) who = null;
      sfx.swap();
    }
  }
  function pickItem() {
    const it = menu().items[menu().i];
    if (it.back) return back();
    if (it.off) return sfx.bump();
    sfx.blip();
    it.go();
  }

  function finish() {
    sync();
    if (enc) {
      const ph = enc.phases[phaseI];
      const result = (ph.ends && ph.ends[B.over]) || B.over;
      const party = B.party.filter((f) => !f.minor);
      if (result === 'won' && phaseI + 1 < enc.phases.length) {
        // the next phase: the party carries on as it stands (after anything that is said in between)
        const again = party.map((f) => ({ ...enc.party.find((p) => p.kind === f.kind), start: { hp: f.hp } }));
        const go = () => {
          phaseI++;
          startPhase(again);
        };
        return ph.after ? showTalk(ph.after, go) : go();
      }
      (result === 'won' ? sfx.purr : sfx.rustle)();
      const words = (enc.words && enc.words[result]) || COPY.fight[result === 'won' ? 'wonMany' : result] || COPY.fight.lost;
      const up = B.alive(B.party);
      return showPages([say(words, { names: cap(up.map(n).join(' and ')) })], () => {
        mode = 'done';
        opts.onDone && opts.onDone(result, { party: party.map((f) => ({ kind: f.kind, hp: f.hp, max: f.max })) });
      });
    }
    const tally = () => '  ' + say(COPY.fight.tally, { w: wins, l: losses });
    if (B.over === 'won') {
      wins++;
      sfx.purr();
      const up = B.alive(B.party);
      showPages([say(up.length === 1 ? COPY.fight.wonOne : COPY.fight.wonMany, { names: cap(up.map(n).join(' and ')) }) + tally()], toSelect);
    } else if (B.over === 'lost') {
      losses++;
      showPages([COPY.fight.lost + tally()], toSelect);
    } else showPages([COPY.fight.draw + tally()], toSelect);
  }
  function toSelect() {
    mode = 'select';
    setPlace('battlePrep'); // the battle tune without its lead and snare
    teams[0].length = teams[1].length = 0;
    step = 0;
    tile = 0;
  }

  // ------------------------------------------------------- play-back
  function float(f, text, colour = TEXT) {
    const v = view(f);
    floats.push({ x: v.x, y: v.y - (height(v) >> 1) - 2, text, colour, t: 0 });
  }
  function lunge(f, target) {
    const v = view(f);
    const tv = view(target);
    v.lunge = 22;
    v.lx = (tv.x - v.x) * 0.72;
    v.ly = (tv.y - v.y) * 0.72;
  }
  // Fills in a line of copy (battle-text.js). {User} / {user} and {Target} /
  // {target} are names, at the start of a sentence or inside one; {he} {He}
  // {him} {his} {himself} are the user's pronouns and {t.he} and so on the
  // target's; anything else ({n}, {does}, ...) comes from the values given.
  const WORDS = ['he', 'him', 'his', 'himself'];
  function say(tpl, o = {}) {
    return tpl.replace(/\{([A-Za-z.]+)\}/g, (all, k) => {
      if (k === 'User' || k === 'user') return o.user ? (k === 'User' ? N(o.user) : n(o.user)) : all;
      if (k === 'Target' || k === 'target') return o.target ? (k === 'Target' ? N(o.target) : n(o.target)) : all;
      const mine = !k.startsWith('t.');
      const word = mine ? k : k.slice(2);
      const i = WORDS.indexOf(word.toLowerCase());
      const f = mine ? o.user : o.target;
      if (i >= 0 && f) return word[0] === 'h' ? PRO[f.pro][i] : cap(PRO[f.pro][i]);
      return k in o ? String(o[k]) : all;
    });
  }
  const T = COPY.narration;
  // A fighter that is not a cat may have words of its own (fighters.<kind> in battle-text.js):
  // L(key, f) is the narration line `key` as it reads when it is about fighter f.
  const own = (f) => (f && COPY.fighters[f.kind]) || {};
  const L = (key, f) => (own(f).narration || {})[key] || T[key];
  // what a move is said to do: the user's own light attack, or the target's own word for being on the end of it
  const does = (e) => (own(e.target).hitBy || {})[e.id] || (e.id === 'attack' && (e.who.attack || own(e.who).attack)) || e.move.text;
  function stepsFor(e) {
    const m = e.move;
    switch (e.t) {
      case 'move': {
        const f = e.who;
        const o = { user: f, target: e.target };
        const hop = (snd) => () => { view(f).hop = 14; snd(); };
        switch (m.fx) {
          case 'guard': return [{ text: say(L('guard', f), o), dur: 40, start: () => sfx.land() }];
          case 'cover': return [{ text: say(B.allies(f).length > 1 ? T.cover : T.coverAlone, o), dur: 46, start: () => sfx.land() }];
          case 'yoga': return [{ text: say(T.yoga, o), dur: 60, start: hop(sfx.purr) }];
          case 'enrage': return [{ text: say(T.enrage, o), dur: 40, start: () => { view(f).shake = 16; sfx.hiss(); } }];
          case 'snack': return [{ text: say(T.snack, o), dur: 44, start: hop(sfx.crunch) }];
          case 'charge': return [{ text: say(L('charge', f), o), dur: 60, start: () => { view(f).shake = 20; view(f).charge = m.windup || 1; sfx.startle(); } }];
          case 'heal': return [{ text: say(f === e.target ? T.groomSelf : T.groom, o), dur: 36, start: hop(sfx.purr) }];
          case 'revive': return [{ text: say(T.revive, o), dur: 40, start: hop(sfx.purr) }];
          case 'energy': return [{ text: say(T.energy, o), dur: 36, start: hop(sfx.chirp) }];
          case 'cure': return [{ text: say(T.cure, o), dur: 44, start: hop(sfx.purr) }];
          case 'summon': return [{ text: say(L('summon', f), o), dur: 40, start: hop(() => (f.kind === 'dog' ? sfx.bark() : sfx.meow(380))) }];
          case 'strip': return [{ text: say(T.attack, { ...o, does: does(e) }), dur: 40, start: () => { view(f).hop = 10; sfx.hiss(); } }];
          case 'stealth': return [{ text: say(T.stealth, o), dur: 40, start: hop(sfx.rustle) }];
          case 'zoom': return [{ text: say(T.zoom, o), dur: 40, start: () => { view(f).hop = 14; view(f).shake = 16; sfx.jump(); } }];
          case 'vanish': return [{ text: say(T.ghost, o), dur: 36, start: () => { view(f).hop = 14; sfx.hiss(); } }];
          default:
            return [{
              // (one that goes at everybody: Rampage, or a fighter's own line for the move, by its id)
              text: e.all ? say(e.target === f ? T.rampageNobody : (own(f).narration || {})[e.id] || T.rampage, o) : say(T.attack, { ...o, does: does(e) }),
              dur: m.power > 0 || m.fx === 'half' ? 24 : 40,
              start: () => {
                view(f).ghost = view(f).charge = false;
                if ((m.power > 0 || m.fx === 'half') && e.target !== f) lunge(f, e.target);
                else view(f).hop = 14;
                if (e.id === 'intimidate' || e.id === 'hiss') sfx.hiss();
                else if (e.id === 'bark') sfx.bark();
                else if (e.id === 'sing') sfx.meow(520);
                else if (e.all) sfx.crash();
                else sfx.jump();
              },
            }];
        }
      }
      case 'stance':
        return [{ dur: 0, start: () => { const v = view(e.who); v.def = true; v.prot = e.fx === 'cover'; } }];
      case 'heal':
        return [{ text: e.amount ? say(T.healed, { n: e.amount }) : L('healedNone', e.target), dur: 50, add: true, start: () => { view(e.target).hp += e.amount; if (e.amount) float(e.target, '+' + e.amount, '#8fdc8a'); } }];
      case 'revive':
        return [{ text: say(T.revived, { user: e.who, target: e.target }), dur: 60, add: true, start: () => { Object.assign(view(e.target), { out: false, hp: e.amount, hop: 14 }); float(e.target, '+' + e.amount, '#8fdc8a'); } }];
      case 'energy':
        return [{ text: say(T.energised, { user: e.who, target: e.target }), dur: 56, add: true, start: () => { view(e.target).hop = 14; float(e.target, COPY.floats.ready, GOLD); } }];
      case 'cured':
        return [{
          text: say(L(e.to ? 'curedOnto' : 'cured', e.who), { user: e.who, target: e.to }), dur: e.to ? 60 : 40, add: true,
          start: () => { for (const k of e.keys) { delete view(e.who).st[k]; if (e.to) view(e.to).st[k] = true; } float(e.who, COPY.floats.cured, '#8fdc8a'); },
        }];
      case 'secondwind':
        return [{ text: say(T.secondWind, { user: e.who }), dur: 80, start: () => { Object.assign(view(e.who), { out: false, hp: e.amount, hop: 14 }); float(e.who, '+' + e.amount, '#8fdc8a'); sfx.purr(); } }];
      case 'strong':
        return [{ text: say(T.strong, { user: e.who }), dur: 64, start: () => { const v = view(e.who); v.st.strong = true; v.hop = 14; float(e.who, COPY.floats.strong, STATUS.strong.colour); } }];
      case 'enrage':
        return [{ text: say(T.enrageCost, { user: e.who, n: e.cost }), dur: 70, add: true, start: () => { const v = view(e.who); v.hp -= e.cost; v.st.strong = true; float(e.who, '-' + e.cost, '#ff8f7a'); } }];
      case 'snack':
        return [{ text: say(e.targets.length > 1 ? T.snacking : L('snackingAlone', e.who), { user: e.who }), dur: 56, add: true, start: () => { for (const t of e.targets) { view(t).st.snacking = true; float(t, COPY.floats.snack, STATUS.snacking.colour); } } }];
      case 'nibble':
        return [{ text: say(L(e.amount ? 'nibble' : 'nibbleLast', e.who), { user: e.who, n: e.amount }), dur: 34, start: () => { const v = view(e.who); v.hp += e.amount; if (e.last) delete v.st.snacking; if (e.amount) float(e.who, '+' + e.amount, '#8fdc8a'); } }];
      case 'fizzle':
        return [{ text: say(L('fizzle', e.who), { user: e.who }), dur: 50, add: true, start: () => { view(e.who).charge = false; } }];
      case 'wind':
        // (a wind-up that takes more than one turn: the turns in the middle)
        return [{ text: say(L('wind', e.who) || L('charge', e.who), { user: e.who }), dur: 60, start: () => { view(e.who).shake = 20; view(e.who).charge = 1; sfx.startle(); } }];
      case 'join':
        return [{
          text: say(L('join', e.by), { user: e.who, target: e.by, newcomer: n(e.who).replace(/^the /, '') }), dur: 70,
          start: () => { Object.assign(view(e.who), { hop: 14, intent: e.who.intent }); sfx.rustle(); sfx.land(); },
        }];
      case 'stealth':
        return [{ text: say(T.stealthCost, { user: e.who, n: e.cost }), dur: 64, add: true, start: () => { const v = view(e.who); v.hp -= e.cost; v.st.swift = true; float(e.who, '-' + e.cost, '#ff8f7a'); } }];
      case 'zoom': {
        // (the whole side has them)
        const list = e.targets || [e.who];
        return [{ text: say(list.length > 1 ? T.zoomOnAll : T.zoomOn, { user: e.who }), dur: list.length > 1 ? 60 : 46, add: true, start: () => { for (const t of list) { view(t).st.swift = true; float(t, COPY.floats.swift, STATUS.swift.colour); } } }];
      }
      case 'crash':
        // the zoomies have run out: Slowed for a turn
        return [{ text: say(e.targets.length > 1 ? T.zoomOffAll : T.zoomOff, { user: e.targets[0] }), dur: 60, start: () => { for (const t of e.targets) { const v = view(t); delete v.st.swift; v.st.slowed = true; float(t, COPY.floats.slowed, STATUS.slowed.colour); } sfx.bump && sfx.bump(); } }];
      case 'vanish':
        return [{ text: say(T.vanished, { user: e.who, target: e.target }), dur: 50, add: true, start: () => { view(e.who).ghost = true; sfx.rustle(); } }];
      case 'appear':
        return [{ text: say(T.appear, { user: e.who }), dur: 40, start: () => { view(e.who).ghost = false; } }];
      case 'cover':
        return [{ text: say(T.coverTake, { user: e.who, target: e.target }), dur: 30, add: true, start: () => { view(e.who).hop = 12; } }];
      case 'hit':
        return [{
          text: (e.sure ? L('hitSure', e.target) + ' ' : '') + say(L(e.pierced ? 'hitPierced' : e.blocked ? 'hitBraced' : 'hit', e.target), { user: e.who, target: e.target, n: e.dmg }), dur: 46, add: true,
          start: () => {
            const v = view(e.target);
            v.hp = Math.max(0, v.hp - e.dmg);
            v.flash = 12;
            v.shake = 14;
            for (const k of e.lost) delete v.st[k];
            float(e.target, '-' + e.dmg, e.target.side === 'party' ? '#ff8f7a' : GOLD);
            (e.dmg >= 20 ? sfx.crash : sfx.bump)();
          },
        }];
      case 'miss': {
        // ("X misses!" is about the one who missed; the other three are about the one it was aimed at)
        const key = e.soft ? 'missSoft' : e.dodged ? 'missDodged' : 'miss';
        return [{
          text: say(L(key, key === 'miss' ? e.who : e.target), { user: e.who, target: e.target }), dur: 44, add: true,
          start: () => { view(e.target).hop = 10; float(e.target, e.dodged && !e.soft ? COPY.floats.dodge : COPY.floats.miss, DIM); sfx.swap(); },
        }];
      }
      case 'status':
        return [{
          text: say((own(e.target).conditions || {})[e.key] || STATUS[e.key].gain || '', { user: e.target }), dur: 70, add: true,
          start: () => { const v = view(e.target); v.st[e.key] = true; v.shake = 12; float(e.target, STATUS[e.key].name.toUpperCase(), STATUS[e.key].colour); if (e.key === 'spooked') sfx.startle(); },
        }];
      case 'unguard':
        return [{ text: say(T.unguard, { user: e.who }), dur: 40, add: true, start: () => { Object.assign(view(e.who), { def: false, prot: false }); } }];
      case 'strip': {
        // (what Snub took off: said by name, as the chips are)
        const names = e.keys.map((k) => (k === 'warm' ? COPY.narration.stripWarm : STATUS[k].name));
        const list = names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0];
        return [{
          text: say(e.keys.length ? T.strip : T.stripNone, { user: e.who, target: e.target }).replace('{list}', list), dur: 60, add: true,
          start: () => { const v = view(e.target); for (const k of e.keys) delete v.st[k]; v.shake = 10; },
        }];
      }
      case 'redock':
        return [{ text: say(L('redock', e.who), { user: e.who }), dur: 60, start: () => { const v = view(e.who); v.hp = e.who.max; v.hop = 10; float(e.who, '+' + e.amount, '#8fdc8a'); sfx.beep(); } }];
      case 'tick':
        return [{ text: say(L('tick', e.who), { user: e.who, n: e.dmg }), dur: 46, start: () => { const v = view(e.who); v.hp = Math.max(0, v.hp - e.dmg); v.shake = 8; float(e.who, '-' + e.dmg, STATUS.infected.colour); } }];
      case 'ko':
        return [{
          text: say(e.who.koText || L(e.who.minor ? 'koMinor' : 'ko', e.who), { user: e.who }), dur: 66, add: true,
          start: () => { Object.assign(view(e.who), { out: true, def: false, prot: false, charge: false, ghost: false, st: {} }); sfx.rustle(); },
        }];
      default:
        return [];
    }
  }
  function play(events, then) {
    mode = 'play';
    menus = [];
    for (const e of events) if (e.t === 'join') view(e.who); // a newcomer gets its look and name before it is announced
    queue = events.flatMap(stepsFor);
    queue.push({ dur: 0, start: () => { sync(); then(); } });
    cur = null;
  }

  // ------------------------------------------------------ team picker
  const tiles = () => [...ROSTER, 'done'];
  // (the humans are the story's own fighters, and not in the table of the ones a player can be)
  const kindOf = (kind) => FIGHTERS[kind] || STORY_FIGHTERS[kind];
  // (a kind marked `many`, the dogs, rats and snakes, can be picked more than once, and by both sides)
  const many = (kind) => !!(kindOf(kind) && kindOf(kind).many);
  // (a human can only be fought, never played)
  const foesOnly = (kind) => !!(kindOf(kind) && kindOf(kind).human);
  const taken = (kind) => !many(kind) && (teams[0].includes(kind) || teams[1].includes(kind));
  // done with this team: on to the foes, or to the fight (the Next / Fight! button, and the swap button as a shortcut to it)
  function advance() {
    if (!teams[step].length) return sfx.bump();
    sfx.blip();
    if (step === 0) step = 1;
    else startBattle(teams[0], teams[1]);
  }
  function pickTile() {
    const k = tiles()[tile];
    const team = teams[step];
    if (k === 'done') return advance();
    if (step === 0 && foesOnly(k)) return sfx.bump();
    // pressing a cat that is on this team takes it off again
    const at = team.indexOf(k);
    if (at >= 0 && (!many(k) || team.length >= RULES.maxSide)) {
      // (with the team full, choosing a dog again takes every dog off it)
      for (let i = team.length - 1; i >= 0; i--) if (team[i] === k && (many(k) || i === at)) team.splice(i, 1);
      return sfx.swap();
    }
    if (team.length >= RULES.maxSide || taken(k)) return sfx.bump();
    sfx.blip();
    team.push(k);
    // your team is full: straight on to picking the foes, with no stop at Next
    if (step === 0 && team.length >= RULES.maxSide) step = 1;
  }
  function unpick() {
    if (teams[step].length) teams[step].pop();
    else if (step === 1) step = 0;
    else return opts.onExit && opts.onExit(); // nothing left to undo: out of battle mode
    sfx.swap();
  }
  // The grid has room for more fighters than there are yet. The roster fills
  // it from the top left; the Next / Fight! button is the last cell. (A line
  // is left free between the grid and the panel, for a note.)
  // (The tiles are a little lower than they were, which leaves two lines between the grid and the panel:
  // what the buttons do, always, and under it the note about the tile the cursor is on.)
  const COLS = 6;
  const ROWS = 3;
  const TW = 50;
  const TH = 36;
  const DONE_CELL = COLS * ROWS - 1;
  const cellOf = (i) => (i < ROSTER.length ? i : DONE_CELL);
  const cellAt = (c) => [7 + (c % COLS) * 51, 20 + Math.floor(c / COLS) * (TH + 1)];
  const tileAt = (i) => cellAt(cellOf(i));
  // up or down a row: the nearest tile in the next row that has any
  function rowStep(i, dy) {
    const cell = cellOf(i);
    const all = tiles().map((k, j) => [cellOf(j), j]);
    for (let n = 1; n < ROWS; n++) {
      const row = (((Math.floor(cell / COLS) + dy * n) % ROWS) + ROWS) % ROWS;
      const there = all.filter(([c]) => Math.floor(c / COLS) === row);
      const near = (c) => Math.abs((c % COLS) - (cell % COLS));
      if (there.length) return there.sort((a, b) => near(a[0]) - near(b[0]))[0][1];
    }
    return i;
  }
  // your team's colour and the foes', bright and dim
  const SIDE = ['#f2d37a', '#ff9a8a'];
  const SIDE_DIM = ['#86743f', '#8a4d47'];

  // ------------------------------------------------------------ input
  const confirm = () => input.take('a');
  function update() {
    frame++;
    if (mode === 'done') return input.flush();
    if (mode === 'select') {
      const len = ROSTER.length + 1;
      if (input.take('left')) tile = (tile + len - 1) % len;
      if (input.take('right')) tile = (tile + 1) % len;
      const dy = (input.take('down') ? 1 : 0) - (input.take('up') ? 1 : 0);
      if (dy) tile = rowStep(tile, dy);
      if (input.take('b')) unpick();
      else if (input.take('swap')) advance();
      else if (confirm()) pickTile();
      input.flush();
      return;
    }
    for (const [f, v] of V) {
      if (v.lunge > 0) v.lunge--;
      if (v.shake > 0) v.shake--;
      if (v.flash > 0) v.flash--;
      if (v.hop > 0) v.hop--;
      const want = v.out ? (f.minor ? 0 : 0.3) : v.ghost ? 0.22 : 1;
      v.alpha += (want - v.alpha) * 0.1;
      // places only shift to make room for a newcomer
      if (!f.gone) {
        const [x, y] = spot(f, v.sp);
        v.x += (x - v.x) * 0.15;
        v.y += (y - v.y) * 0.15;
      }
    }
    floats = floats.filter((f) => ++f.t < 80);

    if (mode === 'talk') talkBox.update();
    else if (mode === 'teach') {
      if (confirm()) {
        sfx.blip();
        if (++teach.i >= teach.list.length) {
          const then = teach.then;
          teach = null;
          then();
        }
      }
    } else if (mode === 'pages') {
      if (confirm()) {
        sfx.blip();
        if (++pageI >= pages.length) afterPages();
      }
    } else if (mode === 'menu' && lesson) {
      if (confirm()) {
        sfx.blip();
        lesson = null;
      }
    } else if (mode === 'menu') {
      const m = menu();
      const len = m.items.length;
      if (input.take('up')) m.i = (m.i + len - 1) % len;
      if (input.take('down')) m.i = (m.i + 1) % len;
      // left and right step through the targets themselves
      const nt = m.items.filter((it) => it.target).length;
      if (nt) {
        const d = (input.take('right') ? 1 : 0) - (input.take('left') ? 1 : 0);
        if (d) m.i = m.items[m.i].target ? (m.i + d + nt) % nt : 0;
      }
      if (input.take('b')) back();
      else if (confirm()) pickItem();
    } else {
      // play back what happened, one beat at a time (action hurries it along)
      const hurry = confirm();
      for (let guard = 0; guard < 12; guard++) {
        if (!cur) {
          cur = queue.shift();
          if (!cur) break;
          cur.t = 0;
          if (cur.text) line = cur.add && line ? line + ' ' + cur.text : cur.text;
          const was = mode;
          const q = queue;
          if (cur.start) cur.start();
          if (mode !== was || queue !== q || !cur) break; // the step moved things on
        }
        const dur = cur.dur * PACE;
        if (hurry && dur > 8) cur.t = Math.max(cur.t, dur - 8);
        if (++cur.t >= dur) cur = null;
        else break;
      }
    }
    input.flush();
  }

  // a tap: pick a tile, a menu row or a cat, or move the text on. The first
  // tap moves the selector there; a tap on what is already selected chooses it.
  function pointer(x, y) {
    if (mode === 'talk') return void talkBox.pointer(x, y);
    if (mode === 'select') {
      const i = tiles().findIndex((k, j) => { const [tx, ty] = tileAt(j); return x >= tx && x < tx + TW && y >= ty && y < ty + TH; });
      if (i < 0) return;
      if (tile === i) pickTile();
      else tile = i;
      return;
    }
    if (mode !== 'menu' || lesson) {
      input.down('a');
      input.up('a');
      return;
    }
    const m = menu();
    const mx = PARTY_W + 5;
    const row = Math.floor((y - (ROW(0) - 1)) / LH);
    let i = x >= mx && x < mx + (m.wide ? TARGET_W : MENU_W) ? row : -1;
    // choosing who acts: the rows are the names in the party box
    if (m.pick) i = x >= 3 && x < 3 + PARTY_W ? m.items.findIndex((it) => it.target === B.party[row - 1]) : -1;
    if (i < 0 || i >= m.items.length)
      i = m.items.findIndex((it) => {
        if (!it.target) return false;
        const v = view(it.target);
        return Math.abs(x - v.x) <= width(v) / 2 + 4 && y <= v.y + 8 && y >= v.y - height(v) - 4;
      });
    if (i < 0 || i >= m.items.length) return;
    if (m.i === i) pickItem();
    else m.i = i;
  }

  // ------------------------------------------------------------- draw
  // A cat's conditions, a chip and a name to a row. If there are more than
  // fit, the last row is the rest as chips alone.
  function conditionRows(g, f, x, first, rows) {
    const keys = Object.keys(STATUS).filter((k) => f.st[k]);
    if (!keys.length) return drawText(g, COPY.menu.noConditions, x, ROW(first), OFF);
    const named = keys.length > rows ? rows - 1 : keys.length;
    keys.slice(0, named).forEach((k, i) => {
      g.drawImage(CHIPS[k], x, ROW(first + i) - 2);
      drawText(g, STATUS[k].name, x + 14, ROW(first + i), TEXT);
    });
    keys.slice(named).forEach((k, i) => g.drawImage(CHIPS[k], x + i * 12, ROW(first + named) - 2));
  }
  function box(g, x, y, w, h) {
    R(g, x, y, w, h, EDGE);
    R(g, x + 1, y + 1, w - 2, h - 2, BOX);
  }
  // A health bar. Bracing turns it to plate: steel blue with a thick pale
  // rim. A cat somebody is Protecting gets a thin blue rim, and one winding
  // up a Rampage a thick gold rim that flickers. A wind-up with more than one turn still to go
  // (the Golf Swing's first) has the same rim in a duller gold, and steady: it flickers only on
  // the turn before the blow lands.
  function bar(g, x, y, w, frac, armour) {
    if (armour === 'plate' || armour === 'charge' || armour === 'wind') R(g, x - 3, y - 3, w + 6, 9, INK), R(g, x - 2, y - 2, w + 4, 7, armour === 'plate' ? '#cfe0ff' : armour === 'wind' ? '#b98a2e' : (frame >> 2) & 1 ? '#ffffff' : GOLD);
    else if (armour === 'cover') R(g, x - 2, y - 2, w + 4, 7, '#6d9be8');
    R(g, x - 1, y - 1, w + 2, 5, INK);
    R(g, x, y, w, 3, armour === 'plate' ? '#27324a' : '#3a2a30');
    if (frac > 0) {
      const len = Math.max(1, Math.round(w * frac));
      R(g, x, y, len, 3, armour === 'plate' ? '#6d9be8' : RED);
      R(g, x, y, len, 1, armour === 'plate' ? '#a9c8ff' : '#ff7a66');
    }
  }
  const armourOf = (f) => {
    const v = view(f);
    if (v.def) return 'plate';
    if (v.charge) return v.charge > 1 ? 'wind' : 'charge';
    return B.all.some((o) => o !== f && o.side === f.side && view(o).prot && !view(o).out) ? 'cover' : null;
  };
  // a condition: a bright chip with its icon (see STATUS in battle.js)
  const CHIPS = Object.fromEntries(Object.entries(STATUS).map(([k, st]) => [k, statusChip(st, canvas)]));
  function shield(g, x, y) {
    R(g, x, y, 7, 5, '#9fc6ff');
    R(g, x + 1, y + 5, 5, 1, '#9fc6ff');
    R(g, x + 2, y + 6, 3, 1, '#9fc6ff');
    R(g, x + 3, y + 1, 1, 5, '#3f6fc4');
    R(g, x + 1, y + 2, 5, 1, '#3f6fc4');
  }
  // What a rival is about to do: a white thought bubble over its head with
  // claws (attack), a shield (defend) or a star (a special) inside. `beside`: the bubble stands to the
  // left of the head, not over it, and its trail runs down and to the right, to the head.
  function thought(g, x, y, kind, rim = INK, beside = false) {
    R(g, x + 1, y, 13, 12, rim);
    R(g, x, y + 1, 15, 10, rim);
    R(g, x + 2, y + 1, 11, 10, '#ffffff');
    R(g, x + 1, y + 2, 13, 8, '#ffffff');
    // the little bubbles trailing to the head: straight down, or down and across
    if (beside) {
      R(g, x + 12, y + 11, 4, 3, INK);
      R(g, x + 13, y + 11, 2, 2, '#ffffff');
      R(g, x + 16, y + 14, 2, 2, INK);
    } else {
      R(g, x + 5, y + 12, 4, 3, INK);
      R(g, x + 6, y + 12, 2, 2, '#ffffff');
      R(g, x + 6, y + 16, 2, 2, INK);
    }
    const ix = x + 4;
    const iy = y + 2;
    if (kind === 'defend') return shield(g, ix, iy + 1);
    if (kind === 'special') {
      const c = SPECIAL_INK;
      R(g, ix + 3, iy, 1, 7, c);
      R(g, ix, iy + 3, 7, 1, c);
      R(g, ix + 2, iy + 2, 3, 3, c);
      for (const [a, b] of [[1, 1], [5, 1], [1, 5], [5, 5]]) P(g, ix + a, iy + b, c);
      return;
    }
    for (const c of [0, 2, 4]) {
      R(g, ix + c + 2, iy, 1, 2, '#d8483c');
      R(g, ix + c + 1, iy + 2, 1, 2, '#d8483c');
      R(g, ix + c, iy + 4, 1, 3, '#d8483c');
    }
  }

  function drawFighter(g, f) {
    const v = view(f);
    if (v.alpha < 0.03) return;
    const active = who === f && (mode === 'menu' || mode === 'wait');
    const down = v.def || v.out;
    const im = down ? v.sp.sit[v.face] : v.lunge > 0 ? v.sp.walk[v.face][(frame >> 2) & 1] : v.sp.stand[v.face];
    const w = im.width * ZOOM;
    const h = im.height * ZOOM;
    // out and back along the line to the target
    const k = v.lunge > 0 ? Math.sin((Math.PI * (22 - v.lunge)) / 22) : 0;
    const hop = v.hop > 0 ? Math.round(Math.sin((Math.PI * v.hop) / 14) * 5) : 0;
    const bob = !down && (active || ((frame + f.slot * 23 + (f.side === 'foes' ? 11 : 0)) % 70 < 8)) ? 1 : 0;
    const sx = v.shake > 0 ? ((v.shake >> 1) & 1 ? 2 : -2) : v.charge && (frame >> 1) & 1 ? 1 : 0; // a charging cat trembles
    const x = Math.round(v.x + v.lx * k + sx);
    const y = Math.round(v.y + v.ly * k);
    g.globalAlpha = v.alpha * 0.35;
    R(g, x - (w >> 1) + 3, y - 3, w - 6, 4, '#10121c');
    g.globalAlpha = v.alpha;
    g.drawImage(v.flash > 0 && (v.flash >> 1) & 1 ? flat(im, '#ffffff') : im, x - (w >> 1), y - h - hop - bob, w, h);
    g.globalAlpha = 1;
  }
  function drawHud(g, f) {
    const v = view(f);
    if (v.out || v.alpha < 0.03) return;
    const active = who === f && (mode === 'menu' || mode === 'wait');
    // Under the feet: health, and under that what the cat is under, centred.
    // Over a rival's head: what it will do next.
    const bx = Math.round(v.x) - 14;
    const by = Math.round(v.y) + 3;
    const inward = f.side === 'party' ? 1 : -1;
    bar(g, bx, by, 28, v.hp / f.max, armourOf(f));
    const keys = Object.keys(STATUS).filter((key) => v.st[key]);
    keys.forEach((key, i) => g.drawImage(CHIPS[key], Math.round(v.x) - keys.length * 6 + i * 12, by + 7));
    if (RULES.showIntent && f.side === 'foes' && v.intent && !B.over) {
      // over the head; beside it where there is no room above, or where that is the bar and the
      // conditions of whoever stands above on the same side (room is kept there for three conditions,
      // so that the bubble does not jump about as they come and go)
      const top = Math.round(v.y) - height(v) + v.ink * ZOOM;
      // gold, and blinking, while it is this one's turn; and while the page that explains the bubbles is up
      const shown = mode === 'pages' && pages[pageI] === COPY.fight.guide;
      const rim = (active || shown) && (frame >> 4) & 1 ? GOLD : INK;
      const ax = Math.round(v.x) - 7;
      const ay = top - 18;
      const taken = B.all.some((o) => {
        const u = view(o);
        if (o === f || o.side !== f.side || u.out || u.alpha < 0.03) return false;
        const cx = Math.round(u.x);
        const cy = Math.round(u.y);
        return ax < cx + 20 && ax + 15 > cx - 20 && ay < cy + 24 && ay + 18 > cy;
      });
      if (top >= 19 && !taken) thought(g, ax, ay, v.intent, rim);
      // (beside: up and to the left of the head, so that the trail ends on it)
      else thought(g, Math.max(1, Math.round(v.x) - (width(v) >> 1) - 13), Math.max(1, top - 7), v.intent, rim, true);
    }
    if (active && f.side === 'party' && (frame >> 4) & 1) {
      // whose turn it is on your side: an arrow over its head, where a rival's thought bubble would be
      const px = Math.round(v.x);
      const py = Math.round(v.y) - height(v) + v.ink * ZOOM - 10;
      for (let i = 0; i < 5; i++) R(g, px - 5 + i, py + i - 1, 11 - i * 2, 3, INK);
      for (let i = 0; i < 5; i++) R(g, px - 4 + i, py + i, 9 - i * 2, 1, GOLD);
    }
  }

  function brackets(g, f) {
    const v = view(f);
    const w = width(v) + 6;
    const x0 = Math.round(v.x) - (w >> 1);
    const y0 = Math.max(1, Math.round(v.y) - height(v) - 2);
    const x1 = x0 + w - 1;
    const y1 = Math.round(v.y) + 1;
    const c = (frame >> 3) & 1 ? '#ffffff' : GOLD;
    for (const [x, y, dx, dy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) {
      R(g, Math.min(x, x + dx * 4), y, 5, 1, c);
      R(g, x, Math.min(y, y + dy * 4), 1, 5, c);
    }
  }

  // the text panel: the names of moves are picked out wherever they come up
  function lines(g, text, x, y, w, colour, max = 4) {
    markLines(text, w, PICKED).slice(-max).forEach((l, i) => drawMarked(g, l, x, y + i * LH, colour, MOVE_INK));
  }
  const centred = (g, s, cx, y, c) => drawText(g, s, Math.round(cx - textWidth(s) / 2), y, c);

  function drawSelect(g) {
    R(g, 0, 0, VW, VH, INK);
    // the two teams so far, along the top, each in its own colour
    [0, 1].forEach((t) => {
      const name = t === 0 ? COPY.picker.you : COPY.picker.them;
      const x0 = t === 0 ? 4 + textWidth(name) + 4 : VW - 4 - textWidth(name) - 4 - 3 * 20 + 2;
      drawText(g, name, t === 0 ? 4 : VW - 4 - textWidth(name), 5, step === t ? SIDE[t] : DIM);
      for (let i = 0; i < 3; i++) {
        R(g, x0 + i * 20, 2, 18, 14, step === t ? SIDE_DIM[t] : '#34313c');
        R(g, x0 + i * 20 + 1, 3, 16, 12, BOX);
        const im = teams[t][i] && FACES[teams[t][i]].im;
        if (im) {
          const w = Math.min(im.width, 16);
          const h = Math.min(im.height, 12);
          g.drawImage(im, (im.width - w) >> 1, Math.max(0, Math.min(im.height - h, 2)), w, h, x0 + i * 20 + 9 - (w >> 1), 3 + 12 - h, w, h);
        }
      }
    });
    centred(g, step === 0 ? COPY.picker.yours : COPY.picker.theirs, VW / 2, 5, SIDE[step]);
    // every cell of the grid, empty ones included
    for (let c = 0; c < COLS * ROWS; c++) {
      const [x, y] = cellAt(c);
      R(g, x, y, TW, TH, '#26242c');
      R(g, x + 1, y + 1, TW - 2, TH - 2, '#131118');
    }
    // the fighters: the cursor's frame is in the colour of the team being
    // picked, and a picked fighter's in the (dimmer) colour of its team
    tiles().forEach((k, i) => {
      if (k === 'done') return;
      const [x, y] = tileAt(i);
      const on = teams[0].includes(k) ? 0 : teams[1].includes(k) ? 1 : -1;
      R(g, x, y, TW, TH, i === tile ? SIDE[step] : on >= 0 ? SIDE_DIM[on] : EDGE);
      R(g, x + 1, y + 1, TW - 2, TH - 2, BOX);
    });
    tiles().forEach((k, i) => {
      const [x, y] = tileAt(i);
      if (k === 'done') {
        // a button, not a frame: filled in the team's colour once there is someone to send, grey until then
        const ready = teams[step].length > 0;
        const here = i === tile;
        R(g, x, y, TW, TH, here ? '#ffffff' : ready ? SIDE[step] : '#3d3a45');
        R(g, x + 1, y + 1, TW - 2, TH - 2, ready ? (here ? SIDE[step] : SIDE_DIM[step]) : '#2c2a33');
        // (and under its name, the button that does the same from anywhere on the grid)
        centred(g, step === 0 ? COPY.picker.next : COPY.picker.fight, x + (TW >> 1), y + (TH >> 1) - 9, ready ? (here ? INK : '#ffffff') : OFF);
        return centred(g, COPY.picker.doneKey, x + (TW >> 1), y + (TH >> 1) + 2, ready ? (here ? INK : '#ffffff') : OFF);
      }
      const { im, box } = FACES[k];
      g.globalAlpha = taken(k) || (step === 0 && foesOnly(k)) ? 0.3 : 1;
      g.drawImage(im, box.x, box.y, box.w, box.h, x + (TW >> 1) - box.w, y + TH - 2 - box.h * 2, box.w * 2, box.h * 2);
      g.globalAlpha = 1;
      // how many of them are on this team, for a kind that can be picked more than once
      const count = many(k) ? teams[step].filter((o) => o === k).length : 0;
      if (count) drawText(g, 'x' + count, x + TW - 5 - textWidth('x' + count), y + 3, SIDE[step]);
    });
    // who the cursor is on: name, stats and a note, then its moves
    box(g, 3, PANEL_Y, VW - 6, VH - PANEL_Y - 3);
    const k = tiles()[tile];
    const full = teams[step].length >= RULES.maxSide;
    // what the buttons do: always there, whatever the cursor is on
    centred(g, COPY.picker.keys, VW / 2, PANEL_Y - 21, DIM);
    if (k === 'done') {
      drawText(g, teams[step].length ? (step === 0 ? COPY.picker.doneNext : COPY.picker.doneFight) : COPY.picker.doneNone, 9, ROW(0), TEXT);
      if (opts.onExit) drawText(g, COPY.picker.leave, 9, ROW(2), DIM);
      return;
    }
    const f = kindOf(k);
    const mine = teams[step].includes(k);
    // left: the name and its three stats as bars, on one scale across the roster
    const barred = step === 0 && foesOnly(k);
    drawText(g, f.name.toUpperCase(), 9, ROW(0), (taken(k) && !mine) || barred ? OFF : SIDE[step]);
    for (const [i, key] of ['hp', 'atk', 'agl'].entries()) {
      const y = ROW(i + 1);
      icon(g, key, 9, y, STAT_COLOUR[key]);
      R(g, 20, y + 1, 42, 5, '#34313c');
      if (f[key]) R(g, 20, y + 1, Math.max(1, Math.min(42, Math.round((42 * f[key]) / STAT_MAX[key]))), 5, STAT_COLOUR[key]);
      const n = String(f[key]);
      drawText(g, n, 84 - textWidth(n), y, TEXT);
    }
    R(g, 89, PANEL_Y + 4, 1, VH - PANEL_Y - 11, '#34313c');
    // right: its heavy attack and its specials, a line each under a heading.
    // Why it cannot be picked (or that it is) goes on the line above the panel.
    const noteText = barred ? COPY.picker.foesOnly : mine && many(k) ? (full ? COPY.picker.manyFull : COPY.picker.manyOn) : mine ? COPY.picker.onTeam : taken(k) ? COPY.picker.otherTeam : full ? COPY.picker.full : '';
    if (noteText) centred(g, noteText, VW / 2, PANEL_Y - 10, mine ? DIM : '#ff9f6a');
    drawText(g, COPY.picker.move, 95, ROW(0), OFF);
    drawText(g, COPY.picker.description, 169, ROW(0), OFF);
    const ids = [...(f.heavy ? [f.heavy] : []), ...f.specials];
    ids.forEach((id, i) => {
      drawText(g, MOVES[id].name || '', 95, ROW(1 + i), id === f.heavy ? '#ffb18a' : TEXT);
      drawText(g, MOVES[id].brief || '', 169, ROW(1 + i), DIM);
    });
    if (!ids.length) drawText(g, COPY.picker.noMoves, 95, ROW(1), DIM);
  }

  function draw(g) {
    drawFight(g);
    if (mode === 'talk') talkBox.draw(g);
    if (mode === 'teach') {
      // the words, in a box of their own above the panel
      const text = teach.list[teach.i][1];
      const n = wrapText(text, VW - 60).length;
      box(g, 20, PANEL_Y - n * LH - 18, VW - 40, n * LH + 9);
      lines(g, text, 26, PANEL_Y - n * LH - 14, VW - 60, TEXT, 6);
      if ((frame >> 4) & 1) drawText(g, '>', VW - 30, PANEL_Y - 20, GOLD);
    }
    if (lesson && mode === 'menu') {
      const n = wrapText(lesson.text, VW - 60).length;
      box(g, 20, PANEL_Y - n * LH - 18, VW - 40, n * LH + 9);
      lines(g, lesson.text, 26, PANEL_Y - n * LH - 14, VW - 60, TEXT, 6);
      if ((frame >> 4) & 1) drawText(g, '>', VW - 30, PANEL_Y - 20, GOLD);
    }
  }
  function drawFight(g) {
    if (mode === 'select') return drawSelect(g);
    g.drawImage(backdrop, 0, 0);
    // back row first
    const order = B.all.filter((f) => V.has(f)).sort((a, b) => view(a).y - view(b).y);
    for (const f of order) drawFighter(g, f);
    for (const f of order) drawHud(g, f);
    const teaching = mode === 'teach';
    const sel = mode === 'menu' ? menu().items[menu().i] : teaching ? { target: B.party[0] } : null;
    if (sel && sel.target) brackets(g, sel.target);
    for (const f of floats) {
      const y = f.y - Math.min(14, f.t * 0.6);
      g.globalAlpha = f.t > 64 ? (80 - f.t) / 16 : 1;
      const w = textWidth(f.text);
      const x = Math.max(2, Math.min(VW - w - 2, Math.round(f.x - w / 2)));
      drawText(g, f.text, x + 1, Math.round(y) + 1, INK);
      drawText(g, f.text, x, Math.round(y), f.colour);
      g.globalAlpha = 1;
    }

    // ---- the panel (not while the fighters are talking: the dialog box has the bottom of the screen to itself)
    if (mode === 'talk') return;
    if (mode === 'pages' || mode === 'done') {
      box(g, 3, PANEL_Y, VW - 6, VH - PANEL_Y - 3);
      if (mode === 'done') return;
      lines(g, pages[pageI], 9, ROW(0), VW - 20, TEXT, 4);
      if ((frame >> 4) & 1) drawText(g, '>', VW - 12, VH - 14, GOLD);
      return;
    }
    // Your side. The top line says what is being asked (who, what, which
    // attack or special, or the name of the move a target is being chosen
    // for), or whose turn is playing out; then each cat's name and health.
    box(g, 3, PANEL_Y, PARTY_W, VH - PANEL_Y - 3);
    const picking = teaching || (mode === 'menu' && menu().pick);
    const asked = teaching ? COPY.menu.whoNext : mode === 'menu' ? (picking ? COPY.menu.whoNext : menu().ask || COPY.menu.whatNext) : B.turn === 'party' ? COPY.menu.yourTurn : B.turn === 'foes' ? COPY.menu.theirTurn : '';
    drawText(g, asked, 12, ROW(0), mode === 'menu' || teaching ? DIM : OFF);
    B.party.forEach((f, i) => {
      const v = view(f);
      const y = ROW(i + 1);
      // the cat the cursor is on, or whose move is being chosen, is lit: name and
      // health both. Cats that have already had their turn this round are dimmed.
      const on = (mode === 'menu' || teaching) && (who === f || (picking && sel.target === f));
      const c = v.out ? OFF : on ? GOLD : picking && !teaching && !menu().items.some((it) => it.target === f) ? DIM : TEXT;
      if (on) drawText(g, '>', 6, y, GOLD);
      drawText(g, label(f), 12, y, c);
      const hp = String(Math.max(0, Math.round(v.hp)));
      drawText(g, hp, PARTY_W - 2 - textWidth(hp), y, v.out || on ? c : v.hp <= f.max * 0.3 ? '#ff8f7a' : c);
    });
    // the menu and a short note, or what is happening
    const mx = PARTY_W + 5;
    box(g, mx, PANEL_Y, VW - mx - 3, VH - PANEL_Y - 3);
    if (mode !== 'menu' && !teaching) return lines(g, line, mx + 6, ROW(0), VW - mx - 14, TEXT, 4);
    const m = teaching ? { pick: true } : menu();
    const lit = teaching ? teach.list[teach.i][0] : '';
    const nx = mx + (m.wide ? TARGET_W : MENU_W) + 5;
    R(g, nx - 4, PANEL_Y + 4, 1, VH - PANEL_Y - 11, '#34313c');
    if (m.pick) {
      // Choosing who acts (in the party box): this cat's numbers as they stand
      // now, whether its special is ready, and what it is under.
      const t = sel.target;
      const x = mx + 6;
      const stat = (kind, text, row, colour = TEXT) => {
        // (the one a lesson is about has a bar of light behind it)
        if (lit === kind) R(g, x - 3, ROW(row) - 2, MENU_W - 2, LH, (frame >> 4) & 1 ? '#4a4353' : '#3a3542');
        icon(g, kind, x, ROW(row), STAT_COLOUR[kind]);
        drawText(g, text, x + 11, ROW(row), lit === kind ? GOLD : colour);
      };
      stat('hp', t.hp + '/' + t.max, 0);
      const mult = (t.st.strong ? RULES.strong : 1) * (t.st.weak ? RULES.weak : 1);
      stat('atk', String(Math.ceil(t.atk * mult)), 1, mult > 1 ? STATUS.strong.colour : mult < 1 ? STATUS.weak.colour : TEXT);
      const agl = Math.round(aglOf(t));
      stat('agl', String(agl), 2, agl > t.agl ? STATUS.swift.colour : agl < t.agl ? STATUS.slowed.colour : TEXT);
      if (t.specials.length) {
        const ok = B.ready(t);
        const w = textWidth(COPY.menu.special);
        drawText(g, COPY.menu.special, x, ROW(3), ok ? TEXT : DIM);
        icon(g, ok ? 'yes' : 'no', x + w + 4, ROW(3), ok ? '#8fdc8a' : '#ff8f7a');
        if (!ok && t.cd && !t.st.spooked) drawText(g, say(COPY.menu.specialIn, { n: t.cd }), x + w + 15, ROW(3), DIM);
      } else drawText(g, COPY.menu.noSpecials, x, ROW(3), OFF);
      conditionRows(g, t, nx, 0, 4);
      return;
    }
    m.items.forEach((it, i) => {
      const y = ROW(i);
      if (i === m.i) drawText(g, '>', mx + 4, y, GOLD);
      drawText(g, it.label, mx + 10, y, it.off ? OFF : i === m.i ? GOLD : it.back ? DIM : TEXT);
    });
    if (sel.target) {
      // Choosing a target: its health and the real odds of landing (after its
      // AGL), then what it is under.
      const t = sel.target;
      const mv = MOVES[m.id];
      // a protecting cat on that side will take whatever is aimed at this one
      const cover = t.side !== who.side ? B.allies(t).find((o) => o.covering && o !== t && !o.vanished) : null;
      const at = cover || t;
      const odds = (m2) => Math.round(hitChance(m2, at) * 100) + '%';
      const mend = mv.fx === 'heal' || mv.fx === 'revive';
      let fig = mend ? '+' + healAmount(mv, t) : mv.fx === 'energy' ? 'Wait ' + t.cd : odds(mv);
      // only the first hit of several rides on a Distracted target
      if (mv.hits) fig += at.st.distracted ? ', ' + odds({ accuracy: mv.accuracy }) + ' x' + (mv.hits - 1) : ' x' + mv.hits;
      const aimed = !mend && mv.fx !== 'energy';
      const right = VW - 8;
      const fw = textWidth(fig) + (aimed ? 10 : 0);
      let hp = t.hp + '/' + t.max;
      if (nx + 11 + textWidth(hp) + 5 + fw > right) hp = String(t.hp);
      icon(g, 'hp', nx, ROW(0), STAT_COLOUR.hp);
      drawText(g, hp, nx + 11, ROW(0), TEXT);
      // (the lesson about the odds is up: a bar of light behind them, as behind a stat in a lesson)
      if (aimed && lesson && lesson.key === 'aim') R(g, right - fw - 3, ROW(0) - 2, fw + 6, LH, (frame >> 4) & 1 ? '#4a4353' : '#3a3542');
      if (aimed) icon(g, 'acc', right - fw, ROW(0), ACC_INK);
      drawText(g, fig, right - textWidth(fig), ROW(0), mend ? '#8fdc8a' : TEXT);
      if (cover) drawText(g, say(COPY.menu.covers, { name: label(cover) }), nx, ROW(1), DIM);
      conditionRows(g, t, nx, cover ? 2 : 1, cover ? 2 : 3);
    } else {
      // A move: what it does, then how sure it is or, in red, why it cannot be
      // used just now.
      const w = VW - nx - 6;
      let row = 0;
      for (const l of sel.hint ? wrapText(sel.hint, w) : []) if (row < 3) drawText(g, l, nx, ROW(row++), DIM);
      if (sel.why) drawText(g, sel.why, nx, ROW(row), '#ff9f6a');
      else if (sel.acc) drawText(g, sel.acc, nx, ROW(row), TEXT);
    }
  }

  // What Esc (or the menu button) brings up during a fight: what the
  // three stats mean, every condition with its chip, and the health-bar rims.
  function drawHelp(g) {
    R(g, 0, 0, VW, VH, INK);
    box(g, 3, 3, VW - 6, VH - 6);
    drawText(g, COPY.guide.title, 10, 8, GOLD);
    const close = COPY.guide.close;
    drawText(g, close, VW - 10 - textWidth(close), 8, OFF);
    let y = 21;
    // the three stats, on one row: each with its picture, and what the letters stand for
    [['hp', COPY.guide.hp], ['atk', COPY.guide.atk], ['agl', COPY.guide.agl]].forEach(([key, text], i) => {
      const x = 10 + i * Math.floor((VW - 20) / 3);
      icon(g, key, x, y, STAT_COLOUR[key]);
      drawText(g, text, x + 12, y, TEXT);
    });
    y += LH + 3;
    drawText(g, COPY.guide.conditions, 10, y, GOLD);
    y += LH;
    for (const st of Object.values(STATUS)) {
      g.drawImage(statusChip(st, canvas), 10, y - 2);
      drawText(g, st.name, 25, y, st.colour);
      drawText(g, st.brief + '.', 100, y, DIM);
      y += LH;
    }
    y += 3;
    drawText(g, COPY.guide.bars, 10, y, GOLD);
    y += LH;
    for (const [armour, name, text] of [['plate', COPY.guide.bracing, COPY.guide.bracingText], ['cover', COPY.guide.protected, COPY.guide.protectedText], ['charge', COPY.guide.charging, COPY.guide.chargingText]]) {
      bar(g, 13, y + 2, 22, 0.7, armour);
      drawText(g, name, 44, y, TEXT);
      drawText(g, text, 100, y, DIM);
      y += LH + 1;
    }
  }

  if (enc) startPhase(enc.party);

  // the fight in hand is won, there and then (the P key, for whoever is testing: see app.js). False if
  // there is no fight to win just now (the picker, or one that is already over).
  function winNow() {
    if (!B || B.over || mode === 'select' || mode === 'done') return false;
    for (const f of B.all) if (f.side === 'foes') f.hp = 0;
    B.stop('won');
    menus = [];
    queue = [];
    cur = null;
    finish();
    return true;
  }

  return {
    update,
    draw,
    drawHelp,
    pointer,
    winNow,
    debug: {
      get battle() { return B; },
      get mode() { return mode; },
      get who() { return who; },
      get menu() { return mode === 'menu' ? menu().items.map((it, i) => (i === menu().i ? '>' : '') + it.label + (it.off ? '(off)' : '')) : null; },
      get line() { return mode === 'pages' ? pages[pageI] : line; },
      get lesson() { return lesson && mode === 'menu' ? lesson.text : null; },
      // what a fighter is saying, while they talk: { name, text }
      get talk() { return mode === 'talk' && talkBox.state ? { name: talkBox.state.name, text: talkBox.state.text } : null; },
      get wins() { return wins; },
      get losses() { return losses; },
      get picker() { return { step, tile: tiles()[tile], teams: teams.map((t) => t.slice()) }; },
      start: startBattle,
      // the words the screen would show for a list of the battle's events (for tests)
      wordsFor: (events) => events.flatMap(stepsFor).map((st) => st.text).filter(Boolean),
      // win or lose the fight in hand at once (for tests)
      end(result) {
        if (result === 'won' || result === 'lost') for (const f of B.all) if ((f.side === 'foes') === (result === 'won')) f.hp = 0;
        B.stop(result);
        menus = [];
        queue = [];
        cur = null;
        finish();
      },
    },
  };
}
