// Garnet, seen across the gap from Amber's balcony: one still picture, slid
// in beside the world while the two house cats over there are talking (the
// balcony night of Act 2: see balconyScene in home.js, and `pan` in the scene
// runner of game.js).
//
// It is drawn the way the flat is, from above and with the flat's own tiles,
// the other way round: Garnet's rail is on the west, facing Amber. Two flats
// that share a wall, each with its balcony. BBC lives in the upper one and
// Flower in the lower. The front of the tower is stepped, so the two rails
// are not in a line: Flower's flat is set back a tile from BBC's. Only the
// first few tiles of each flat are in the picture, enough to say that these
// are balconies with homes behind them. The rest of it is the gap between the
// two towers, with the garden and its lamps far below.
//
// state: 'cats' (each on the rail of its own balcony, looking across),
//        'down' (off the rail, on their way indoors), { cats: 'in' } (walking in through their
//        doors and out of the picture: the object remembers when they set off) or 'gone'.
// who:   the sprites to stand in it: { bbc, flower, shark, orca }
//
// Act 3 uses the same picture by day, with Shark and Orca on Flower's balcony
// (the box they came up in was put down by her door), and the balcony under
// hers, the one with the scarf, is where they jump down to: out of the bottom
// of the picture. For that, state is an object the scene changes as it goes:
//   { day: true, cats: 'home' (BBC and Flower each standing on their own balcony),
//     shark, orca: 'door' | { walk: frame } | 'balcony' | 'rail' | { jump: frame } | 'down' | nothing }
import { C, R, P, canvas } from './palette.js';
import { CONFIG } from './config.js';
import { T, SKIES, isOpen, isWall, drawFloor, drawCap, drawFace, drawGlassDoor, drawRailing, drawRug } from './tiles.js';
import { TYPES, renderType } from './furniture.js';

const VW = CONFIG.viewW;
const VH = CONFIG.viewH;
const OY = -6; // the plan starts a little above the top of the screen (under the scene's black bar)

// The plan, the way Amber's is drawn (rooms on the west, rail on the east): it is turned round
// when it is painted. w floor, s Purple Scarf's tile, G glass doors, b balcony (and the open door),
// R rail, # wall, F the face of the building going down a floor.
// BBC's balcony and Flower's are in a line, one above the other on the screen (they are next door to
// each other). Purple Scarf's is a floor further down: there is a strip of the building's face
// between, and hers stands out two tiles further, so that it can be jumped down onto. It is drawn as
// her flat has it (SCARF_PLAN in map.js): two tiles deep, a wall behind this end of it, a rail along
// its north end, and her scarf over the west rail in its second row.
const PLAN = [
  '########',
  'wwwwGbbR',
  'wwwwbbbR',
  'wwwwGbbR',
  '########',
  'wwwwGbbR',
  'wwwwbbbR',
  'wwwwGbbR',
  '########',
  'FFFFFFFF',
  'ssssss#bbR',
  'ssssss#bbR',
  'ssssss#bbR',
];
const HERS = 10; // the first row of Purple Scarf's balcony
// where the glass of a row's rail ends up on the screen (the building begins there, and the gap ends)
const railX = (row) => VW - PLAN[row].length * T + T - 4;
const GAP_W = Math.max(...PLAN.map((_, y) => railX(y))); // as far right as the gap ever goes
// what stands in the two flats: [type, column, row] in the plan
const THINGS = [
  // BBC's
  ['armchair', 1, 1], ['cattree', 3, 1], ['plant', 3, 3], ['planter', 6, 1],
  // Flower's (and her toys are all over the floor: see TOYS)
  // (no plant by her door: Shark and Orca come out that way in Act 3)
  ['planter', 6, 5],
];
const RUGS = [[1, 2, 2, 3, 'living'], [0, 6, 2, 7, 'guest']];
// Flower's toys, left where she dropped them: [what, x, y] in pixels of the plan (before it is turned round)
const TOYS = [['ball', 20, 88], ['mouse', 38, 100], ['ring', 12, 112], ['ball2', 50, 118], ['wand', 26, 124], ['mouse2', 56, 90], ['bell', 44, 108]];
// the two of them: the row of the plan each sits level with, on the rail; and the row of its open door
const SEATS = { bbc: 1.75, flower: 5.75 };
const DOORS = { bbc: 2, flower: 6 };
// where the light falls: [x, y, radius] on the screen (a lamp indoors, and what comes out through the
// glass onto the balcony), for each of the two flats
const POOLS = ['bbc', 'flower'].flatMap((id) => {
  const x = railX(DOORS[id]);
  const y = OY + DOORS[id] * T;
  return [[x + 26, y + 4, 34], [x + 84, y, 38]];
});

// the building and the gap, painted once for the night and once for the day: { base, dark } (dark: the
// night laid over it, with the pools of light cut out)
const pics = {};

const at = (x, y) => (y < 0 || y >= PLAN.length || x < 0 || x >= PLAN[y].length ? ' ' : PLAN[y][x]);

function paint(day) {
  const sky = day ? SKIES.day : SKIES.night;
  // the two flats, as the flat itself is painted (see buildWorld in game.js)
  const [pv, pg] = canvas(VW, VH + T);
  const isFace = (x, y) => isWall(at(x, y)) && isOpen(at(x, y + 1));
  for (let y = 0; y < PLAN.length; y++) {
    for (let x = 0; x < PLAN[y].length; x++) {
      const ch = PLAN[y][x];
      if (ch === 'w' || ch === 'b' || ch === 's') drawFloor(pg, ch, x, y);
      else if (ch === 'G') drawGlassDoor(pg, x, y, sky);
      else if (ch === 'R') drawRailing(pg, x, y, sky);
      else if (ch === 'F') {
        // the outside of the building, a whole floor of it: lighter where the day (or a lamp) catches the top
        R(pg, x * T, y * T, T, T, day ? '#a39ca8' : '#34313f');
        R(pg, x * T, y * T, T, 2, day ? '#c4bec8' : '#454152');
        R(pg, x * T, y * T + T - 5, T, 5, day ? '#847d8a' : '#262330');
        if (x % 2 === 0) R(pg, x * T, y * T + 2, 1, T - 7, day ? '#948d9a' : '#2c2937');
      }
      else if (isFace(x, y)) {
        const below = at(x, y + 1);
        drawFace(pg, x, y, below === 'R' || below === 'b' ? 'b' : 'w', true);
      } else drawCap(pg, x, y, { u: isWall(at(x, y - 1)), d: isWall(at(x, y + 1)), l: isWall(at(x - 1, y)), r: isWall(at(x + 1, y)) });
    }
  }
  for (const r of RUGS) drawRug(pg, ...r);
  for (const [type, x, y] of THINGS.slice().sort((a, b) => a[2] - b[2])) pg.drawImage(renderType(TYPES[type]), x * T, y * T - TYPES[type].up);
  for (const [what, x, y] of TOYS) {
    const k = '#2b2024';
    if (what === 'ball' || what === 'ball2') {
      R(pg, x, y + 1, 5, 3, k); R(pg, x + 1, y, 3, 5, k);
      R(pg, x + 1, y + 1, 3, 3, what === 'ball' ? '#e0564a' : '#5fb7d6'); P(pg, x + 1, y + 1, '#ffffff');
    } else if (what === 'mouse' || what === 'mouse2') {
      R(pg, x, y, 7, 4, k); R(pg, x + 1, y + 1, 5, 2, what === 'mouse' ? '#9aa0ab' : '#c9a36a');
      P(pg, x + 5, y, what === 'mouse' ? '#f0a7b5' : '#8a5a2b'); R(pg, x - 3, y + 2, 3, 1, k);
    } else if (what === 'ring') {
      R(pg, x, y, 6, 6, k); R(pg, x + 1, y + 1, 4, 4, '#f2c14a'); R(pg, x + 2, y + 2, 2, 2, k);
    } else if (what === 'bell') {
      R(pg, x, y, 4, 4, k); R(pg, x + 1, y + 1, 2, 2, '#f2d37a');
    } else {
      // a wand: a stick, and feathers at the end of it
      for (let i = 0; i < 9; i++) P(pg, x + i, y - (i >> 1), '#8a5a2b');
      R(pg, x + 8, y - 7, 4, 4, k); R(pg, x + 9, y - 6, 2, 2, '#d98fa4'); P(pg, x + 11, y - 8, '#9a5fd0');
    }
  }

  // turned round, onto the picture
  const [cv, g] = canvas(VW, VH);
  R(g, 0, 0, VW, VH, C.void);
  g.save();
  g.translate(VW, OY);
  g.scale(-1, 1);
  g.drawImage(pv, 0, 0);
  g.restore();
  // the gap, up to each row's rail: so the stepped front shows against it
  const [gv, gg] = canvas(VW, VH);
  paintGap(gg, day);
  for (let y = 0; y < PLAN.length; y++) {
    const w = railX(y);
    const top = Math.max(0, OY + y * T);
    const h = OY + (y + 1) * T - top;
    if (h <= 0 || top >= VH) continue;
    g.drawImage(gv, 0, top, w, h, 0, top, w, h);
    // Garnet's own wall, going down out of sight: the edges of the balcony slabs
    R(g, w - 4, top, 4, h, day ? '#8d8792' : '#2a2838');
    R(g, w - 4, top, 1, h, day ? '#b3adb8' : '#3b384c');
    // (where the front steps back, the side of the flat that stands forward)
    const up = y > 0 ? railX(y - 1) : w;
    const down = y + 1 < PLAN.length ? railX(y + 1) : w;
    if (up > w) R(g, w - 3, top, up - w + 3, 1, day ? '#b3adb8' : '#3b384c');
    if (down > w) R(g, w - 3, top + h - 1, down - w + 3, 1, day ? '#6f6a75' : '#1d1b29');
  }
  // the rail along the north end of her balcony, where it stands out past the floors above
  {
    const x0 = railX(HERS);
    const x1 = railX(HERS - 1);
    const y = OY + HERS * T - 4;
    R(g, x0, y, x1 - x0, 4, sky.glass);
    R(g, x0, y, x1 - x0, 1, C.steel);
    R(g, x0, y + 3, x1 - x0, 1, C.steelL);
    R(g, x0 + ((x1 - x0) >> 1), y, 1, 4, C.steel);
    R(g, x0, y, 4, 4, C.steel);
  }

  // the night laid over the building (the gap is painted as dark as it is): less of it on glass, and
  // hardly any where a lamp is on
  const [dv, dg] = canvas(VW, VH);
  for (let y = 0; y < PLAN.length; y++) {
    const x = railX(y);
    dg.globalCompositeOperation = 'source-over';
    dg.fillStyle = 'rgba(14,18,48,0.62)';
    dg.fillRect(x, OY + y * T, VW - x, T);
    dg.globalCompositeOperation = 'destination-out';
    dg.fillStyle = 'rgba(0,0,0,0.45)';
    dg.fillRect(x, OY + y * T, 4, T);
    dg.fillRect(x + 4 + 2 * T + 6, OY + y * T, 4, T);
  }
  for (const [x, y, r] of POOLS)
    for (const k of [1, 0.72, 0.46]) {
      dg.fillStyle = 'rgba(0,0,0,0.34)';
      blob(dg, x, y, r * k, Math.round(r * k * 0.75));
    }
  dg.globalCompositeOperation = 'source-over';
  return { base: cv, dark: day ? null : dv };
}
// an ellipse of whole pixels, as the flat's pools of lamplight are
function blob(g, x, y, rx, ry) {
  for (let j = -ry; j <= ry; j++) {
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry + 0.5))));
    g.fillRect(Math.round(x - half), Math.round(y + j), half * 2, 1);
  }
}

// The gap between the towers: the garden a long way down, at night, in the colours it is seen in
// (nothing down there is lit but its lamps).
const LAMPS = [[52, 50], [20, 62], [86, 54], [58, 92], [30, 116], [92, 122], [56, 146], [10, 14], [98, 8], [140, 40], [168, 66], [126, 96], [176, 112], [146, 150], [190, 20]];
function paintGap(g, day) {
  const w = GAP_W;
  // (by day: paving, lawns, the heads of trees and the paths between, all a little pale with the height)
  const ink = day ? { ground: '#b7b3a6', lawn: '#7fae6a', tree: '#4f8a52', leaf: '#6fa46a', path: '#d6d0bf' } : { ground: '#151a3a', lawn: '#16263a', tree: '#101b2e', leaf: '#1c2e3e', path: '#252c50' };
  R(g, 0, 0, w, VH, ink.ground);
  // lawns, with their corners rounded off, and the dark heads of trees
  const lawns = [[6, 22, 42, 30], [60, 12, 38, 26], [14, 68, 34, 44], [62, 66, 46, 46], [4, 128, 46, 34], [64, 128, 44, 30], [122, 10, 40, 34], [172, 26, 40, 26], [124, 70, 36, 40], [170, 72, 44, 34], [122, 128, 42, 32], [174, 126, 40, 36]];
  for (const [x, y, lw, lh] of lawns) {
    R(g, x + 4, y, lw - 8, lh, ink.lawn);
    R(g, x + 2, y + 1, lw - 4, lh - 2, ink.lawn);
    R(g, x, y + 4, lw, lh - 8, ink.lawn);
  }
  const trees = [[12, 28], [36, 40], [70, 18], [88, 26], [22, 78], [36, 100], [70, 74], [96, 100], [10, 136], [34, 150], [76, 134], [98, 146], [82, 92], [130, 20], [150, 32], [180, 34], [196, 44], [132, 80], [148, 98], [178, 82], [198, 94], [128, 138], [152, 146], [184, 134], [200, 150]];
  for (const [x, y] of trees) {
    R(g, x + 1, y, 4, 5, ink.tree);
    R(g, x, y + 1, 6, 3, ink.tree);
    P(g, x + 2, y + 1, ink.leaf);
  }
  // the paths, pale between the lawns
  for (let x = 0; x < w; x++) R(g, x, 58 + Math.round(Math.sin(x / 17) * 3), 1, 2, ink.path);
  for (let y = 0; y < VH; y++) R(g, 54 + Math.round(Math.sin(y / 21) * 4), y, 2, 1, ink.path);
  for (let y = 0; y < VH; y++) R(g, 114 + Math.round(Math.sin(y / 19 + 1) * 3), y, 2, 1, ink.path);
  for (let y = 0; y < VH; y++) R(g, 166 + Math.round(Math.sin(y / 23 + 3) * 3), y, 2, 1, ink.path);
  for (let x = 0; x < w; x++) R(g, x, 120 + Math.round(Math.sin(x / 13 + 2) * 2), 1, 2, ink.path);
}
// the garden's lamps: small, warm, and the only things that can be seen clearly from up here
function drawLamps(g, frame) {
  LAMPS.forEach(([x, y], i) => {
    // (not one that the building stands in front of)
    const row = Math.floor((y - OY) / T);
    if (row >= 0 && row < PLAN.length && x + 4 >= railX(row) - 4) return;
    const dim = (frame + i * 37) % 240 < 4 ? 0.6 : 1;
    g.fillStyle = 'rgba(242,211,122,' + (0.1 * dim).toFixed(3) + ')';
    g.fillRect(x - 3, y - 2, 7, 5);
    g.fillRect(x - 2, y - 3, 5, 7);
    g.fillStyle = 'rgba(242,211,122,' + (0.28 * dim).toFixed(3) + ')';
    g.fillRect(x - 1, y - 1, 3, 3);
    P(g, x, y, dim < 1 ? '#d9b866' : '#fff0b8');
  });
}

// A purple scarf on the rail of the third balcony (the flat below Flower's, the one that stands
// forward): thrown over the rail, the short end on the balcony side and the long end hanging
// outside, stirring in the night air. Whose it is comes out in Act 3.
const SCARF = { b: '#9a5fd0', l: '#c08ee8', d: '#5e3a8c' };
function drawScarf(g, frame) {
  const x = railX(HERS);
  const y = OY + (HERS + 1) * T + 5;
  const edge = '#1a1530';
  // the long end, outside: its lower half sways
  const sway = [0, -1, -1, 0, 1, 1][Math.floor(frame / 20) % 6];
  for (let j = 0; j < 15; j++) {
    const dx = j < 6 ? 0 : sway;
    R(g, x - 6 + dx, y + 3 + j, 5, 1, edge);
    R(g, x - 5 + dx, y + 3 + j, 3, 1, j % 5 === 4 ? SCARF.d : SCARF.b);
    if (j % 5 !== 4) P(g, x - 5 + dx, y + 3 + j, SCARF.l);
  }
  // (its fringe)
  R(g, x - 6 + sway, y + 18, 5, 1, edge);
  P(g, x - 5 + sway, y + 18, SCARF.b);
  P(g, x - 3 + sway, y + 18, SCARF.b);
  // the short end, lying on the balcony side
  R(g, x + 3, y + 3, 5, 6, edge);
  R(g, x + 4, y + 4, 3, 4, SCARF.b);
  P(g, x + 4, y + 7, SCARF.d);
  P(g, x + 6, y + 7, SCARF.d);
  // over the rail
  R(g, x - 6, y - 1, 14, 6, edge);
  R(g, x - 5, y, 12, 4, SCARF.b);
  R(g, x - 4, y, 10, 1, SCARF.l);
  R(g, x - 5, y + 3, 12, 1, SCARF.d);
  R(g, x - 5, y + 3, 3, 1, SCARF.b);
}

// a sprite with its feet on (x, y): x is its middle
function stand(g, im, x, y) {
  g.drawImage(im, Math.round(x - im.width / 2), Math.round(y - im.height));
}

export function drawGarnet(g, frame, state, who) {
  const o = typeof state === 'string' ? { cats: state } : state || {};
  const key = o.day ? 'day' : 'night';
  const pic = pics[key] || (pics[key] = paint(!!o.day));
  const smooth = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = false;
  g.drawImage(pic.base, 0, 0);
  if (!o.day) drawLamps(g, frame);
  const seen = o.cats === 'gone' || !o.cats ? [] : ['bbc', 'flower'].filter((id) => who[id]);
  // (on the rail: a little shadow on the balcony floor behind)
  if (o.cats === 'cats') {
    g.fillStyle = 'rgba(43,32,36,0.3)';
    for (const id of seen) g.fillRect(railX(DOORS[id]) + 8, OY + SEATS[id] * T + T - 2, 10, 3);
  }
  if (pic.dark) {
    g.drawImage(pic.dark, 0, 0);
    // a little warmth in the middle of each pool of light
    g.fillStyle = 'rgba(255,196,110,0.1)';
    for (const [x, y, r] of POOLS) blob(g, x, y, r * 0.5, Math.round(r * 0.5 * 0.75));
  }
  drawScarf(g, frame);
  // the two of them, in the light from their own doors: each on the rail of its own balcony, looking
  // across at Amber; or off the rail and making for the open door; or (Act 3, by day) at home on it
  for (const id of seen) {
    const x = railX(DOORS[id]);
    if (o.cats === 'down') stand(g, who[id].stand.right, x + 4 + T + 6, OY + DOORS[id] * T + T - 1);
    else if (o.cats === 'in') {
      // in through the open door and across the room, until the edge of the picture has them
      // (Flower first; BBC a moment behind her)
      if (o.from == null) o.from = frame;
      const t = Math.max(0, frame - o.from - (id === 'bbc' ? 14 : 0));
      const wx = x + 4 + T + 6 + t * 0.9;
      if (wx < VW + 12) stand(g, t ? who[id].walk.right[(frame >> 3) & 1] : who[id].stand.right, wx, OY + DOORS[id] * T + T - 1);
    }
    else if (o.cats === 'home') stand(g, id === 'bbc' ? who[id].sit.down : who[id].sit.left, x + 4 + (id === 'bbc' ? 8 : T + 8), OY + DOORS[id] * T + T - 2);
    else stand(g, who[id].sit.left, x + 8, OY + SEATS[id] * T + T - 4);
  }
  // Shark and Orca, on Flower's balcony: coming out of her door; beside her; at the south end of it,
  // over Purple Scarf's; and jumping down onto hers, a floor below and further out.
  //   'door' (just inside her door) | { walk: frame } (out onto the balcony from there) | 'balcony' |
  //   'rail' | { jump: frame } | 'down' (on her balcony)
  const fx = railX(DOORS.flower);
  const hx = railX(HERS);
  const feet = (row) => OY + row * T + T - 2;
  const SPOT = {
    shark: { door: [fx + 4 + 2 * T + 10, feet(6)], balcony: [fx + 4 + T + 8, feet(7)], rail: [fx + 4 + T + 6, feet(7) + 1], down: [hx + 4 + T + 8, feet(HERS) + 2] },
    orca: { door: [fx + 4 + 2 * T + 24, feet(6)], balcony: [fx + 4 + 8, feet(6)], rail: [fx + 4 + 7, feet(7) + 1], down: [hx + 4 + T + 8, feet(HERS + 1) + 2] },
  };
  for (const id of ['shark', 'orca']) {
    const at = o[id];
    const sp = who[id];
    if (!at || !sp) continue;
    const S = SPOT[id];
    if (at === 'door') stand(g, sp.stand.left, ...S.door);
    else if (at === 'balcony') stand(g, id === 'shark' ? sp.sit.up : sp.sit.right, ...S.balcony);
    else if (at === 'rail') stand(g, sp.stand.down, ...S.rail);
    else if (at === 'down') stand(g, sp.sit.down, ...S.down);
    else if (at.walk != null) {
      // out of her door and across the balcony, low and fast
      const k = Math.min(1, Math.max(0, frame - at.walk) / 34);
      const x = S.door[0] + (S.balcony[0] - S.door[0]) * k;
      const y = S.door[1] + (S.balcony[1] - S.door[1]) * k;
      stand(g, k < 1 ? sp.walk.left[(frame >> 2) & 1] : sp.sit.left, x, y);
    } else if (at.jump != null) {
      // up a little, out over the edge, and down a floor
      const k = Math.min(1, Math.max(0, frame - at.jump) / 30);
      const x = S.rail[0] + (S.down[0] - S.rail[0]) * k;
      const y = S.rail[1] + (S.down[1] - S.rail[1]) * k - Math.sin(Math.PI * Math.min(1, k * 1.15)) * 14;
      stand(g, k < 1 ? sp.walk.down[(frame >> 2) & 1] : sp.sit.down, x, y);
    }
  }
  g.imageSmoothingEnabled = smooth;
}
