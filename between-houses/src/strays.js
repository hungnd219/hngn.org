// The other cats in the garden.
//
// Named cats are always the same individuals: each has a coat, a size, a home
// base, a range it will not leave and a list of things it likes doing (what
// it says is the story's: see interact). They carry on with their day whether or not Shark and Orca
// are downstairs. A few anonymous strays are made up afresh on every visit.
//
// All positions here are garden tiles (x may be negative, see garden.js); the
// entities themselves live in the game's world space, GOX tiles to the east.
import {
  GX0, GX1, GH, KERB_S, PAVE_S, gardenBlocked, gardenPerch, isBush, SLIDE, BARS, NET, BENCHES, TABLES, AC_UNITS, SHED, COUNTERS,
  BIG_TREES, START, ENTRANCE, northShift, isRoad, onCrossing,
} from './garden.js';
import { makeCat, CAT_PALS } from './sprites.js';
import { C } from './palette.js';
import { A3 as AFTER_WORDS } from './act3-after-text.js';

const T = 16;
const rnd = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rnd(a.length)];
const lerp = (a, b, t) => a + (b - a) * t;
const FUR = 'bdl';
// a steady pseudo-random number per pixel, for mottled coats
const speck = (x, y, s) => (((x * 73 + y * 151 + s * 37) * 2654435761) >>> 0) % 100;

// ------------------------------------------------------------------ coats
// white cats with orange patches: `where(kind, x, y)` says which bits are orange
const patched = (orange, where, extra) => (kind, x, y, ch) => {
  const e = extra && extra(kind, x, y, ch);
  if (e) return e;
  if (FUR.includes(ch) && where(kind, x, y)) return orange[ch];
  return null;
};
// the pink scar on her neck
const scarMark = (kind, x, y, ch) => {
  if (ch === 'k') return null;
  const at = { down: [[6, 9], [7, 9]], sit: [[6, 9], [7, 9]], left: [[4, 9], [5, 9]], sitLeft: [[4, 8], [5, 9]], sleep: [[6, 11], [7, 11]] }[kind];
  return at && at.some(([a, b]) => a === x && b === y) ? '#e58fa0' : null;
};
// Thanos: white, with an orange cap that comes down round the eyes either
// side of a white blaze, an orange tail and patches on his back and flank
const THANOS_ORANGE = { b: '#e09448', d: '#b8702f', l: '#efb06c' };
const thanosPatch = (kind, x, y) => {
  if (kind === 'down' || kind === 'sit') return (y <= 6 && (x < 6 || x > 8)) || x >= 12 || (x <= 5 && y >= 10 && y <= 11);
  if (kind === 'up' || kind === 'sitUp') return y <= 4 || x >= 12 || (y >= 6 && y <= 10 && x >= 5 && x <= 9);
  if (kind === 'left') return (y <= 5 && x <= 6) || (y === 6 && x >= 4 && x <= 6) || x >= 12 || (x >= 7 && x <= 11 && y >= 8 && y <= 10);
  if (kind === 'sitLeft') return (y <= 4 && x <= 6) || (y === 5 && x >= 4 && x <= 7) || x >= 12 || (x >= 7 && x <= 10 && y >= 9 && y <= 11);
  return (y <= 9 && (x < 6 || x > 8)) || (x >= 11 && y >= 12);
};
// tortoiseshell: taupe, mottled with dark brown and a little ginger
const tortie = (seed) => (kind, x, y, ch) => {
  if (!FUR.includes(ch)) return null;
  const v = speck(x, y, seed);
  return v < 28 ? '#4f3f35' : v < 50 ? '#c08a52' : null;
};
// calico: white, with blotches of ginger and of black
const calico = (kind, x, y, ch) => {
  if (!FUR.includes(ch)) return null;
  const v = speck(x >> 1, (y + (kind === 'left' || kind === 'sitLeft' ? 1 : 0)) >> 1, 5);
  return v < 24 ? '#d98a45' : v < 44 ? '#3d3842' : null;
};
// white socks and a bigger bib on a tabby; `tall` socks come further up the leg
const socks = (white, tall) => (kind, x, y, ch) => {
  if (ch !== 'b') return null;
  if (kind === 'sit') {
    if (y === 13 && (x === 5 || x === 6 || x === 8 || x === 9)) return white;
    if (tall && y === 12 && (x === 6 || x === 8)) return white;
    return y === 9 && (x === 5 || x === 9) ? white : null;
  }
  if (kind === 'sitLeft') return (y === 13 || (tall && y === 12)) && (x === 4 || x === 6) ? white : null;
  if (kind === 'sleep' || kind === 'sitUp') return null;
  if (y >= 13) return white;
  if (tall && y === 12 && (kind === 'left' || x === 4 || x === 10)) return white;
  if (kind === 'down') return (y === 10 && x >= 5 && x <= 9) || (y === 11 && x >= 6 && x <= 8) ? white : null;
  return null;
};
const both = (...fns) => (kind, x, y, ch) => {
  for (const f of fns) {
    const c = f(kind, x, y, ch);
    if (c) return c;
  }
  return null;
};

const PAL = {
  // Orca's pattern in a darker, dirtier orange, with a white tail tip
  scar: { k: C.k, b: '#b96a30', d: '#8a4a22', l: '#d08c4e', w: '#f3ecde', e: '#c9a84a', n: '#e69a9a', t: '#f6f1e6', i: '#e0a8a0' },
  thanos: { k: C.k, b: '#f6f2e8', d: '#e2dccd', l: '#ffffff', w: '#ffffff', e: '#d8a23a', n: '#e69a9a', t: '#b8702f', i: '#f0b9a8' },
  mama: { k: C.k, b: '#9a8672', d: '#6b594a', l: '#b39d86', w: '#c9b79e', e: '#d8c060', n: '#c98a8a', t: '#4f3f35', i: '#c9a39a' },
  cheetos: { k: C.k, b: '#f2bd82', d: '#f2bd82', l: '#f2bd82', w: '#f2bd82', e: '#7a9a3a', n: '#e69a9a', t: '#f2bd82', i: '#f0b9a8' },
  // pale orange (close to Cheetos, but faintly striped), pinker ears
  socks: { k: C.k, b: '#f2bd82', d: '#e0a468', l: '#f9d6a8', w: '#fdf6e8', e: '#f2c14a', n: '#e69a9a', t: '#e0a468', i: '#f29aa6' },
  black: { k: C.k, b: '#3d3842', d: '#2f2a33', l: '#4d4753', w: '#3d3842', e: '#d8c44a', n: '#8a6a72', t: '#2f2a33', i: '#6a5560' },
  white: { k: C.k, b: '#f4f0e6', d: '#e2dccd', l: '#ffffff', w: '#ffffff', e: '#7fb6d8', n: '#e69a9a', t: '#e2dccd', i: '#f0b9a8' },
  grey: { k: C.k, b: '#9c9ca6', d: '#6e6e7a', l: '#babac4', w: '#e6e6ec', e: '#c3cf63', n: '#c98a8a', t: '#6e6e7a', i: '#c9a3a8' },
  brown: { k: C.k, b: '#7a5a3e', d: '#4f382a', l: '#96724f', w: '#d9c4a4', e: '#d8c060', n: '#c98a8a', t: '#4f382a', i: '#c9a39a' },
};

// ----------------------------------------------------------------- places
const rect = (x0, y0, x1, y1) => (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
const tilesIn = (x0, y0, x1, y1) => {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
};
const tableTiles = TABLES.flatMap(([x, y]) => tilesIn(x, y, x + 2, y + 2));
const benchTiles = BENCHES.filter(([x]) => x > 30).flatMap(([x, y]) => tilesIn(x, y, x + 2, y));
const underShed = tilesIn(SHED.x + 1, SHED.y + 2, SHED.x + SHED.w - 2, SHED.y + 3);

// ------------------------------------------------------------- named cats
// range: where the cat may go. home: where it settles. presence: chance of
// being around [by day, after dark]. acts: [what, weight] it picks from.
// These are a cat's ways while the story is being told. `after` is what changes once it is over
// (the epilogue, and Sandbox): the story has moved some of them (applyAfter, below). The story's
// own scenes put a cat wherever they need it, whatever its range.
//   Scar      the BBQ pavers and her shed, and not a step onto the grass ("I belong to this shed").
//             After: also over Garnet's crossing to the humming box by Garnet, where she keeps house
//             with the kittens.
//   Thanos    the east of the garden, north of the road ("I keep this side of the road"). After: the
//             building side too, to look in at both boxes.
//   Mamacat   the building side of the road, with Babycat at her heels. The same after.
//   Cheetos   the yard and the playground. The same after.
//   Socks     from the middle of the playground east, north of the road, and never the boardwalk
//             (the river is too loud). After: the boardwalk, and over the road to the sidewalk and
//             Mamacat's box ("The road belongs to me now").
const GARNET_BOX = AC_UNITS[1];
const scarGround = rect(92, 21, 111, 34); // (the pavers round the shed)
const socksNorth = (x, y) => x >= 52 && x <= 123 && y <= 35;
const socksBushes = tilesIn(72, 18, 91, 21).filter(([x, y]) => isBush(x, y));
export const NAMED = [
  {
    id: 'scar', name: 'Scar', pal: PAL.scar, coat: both(scarMark, socks('#f3ecde', true)), scale: [0.875, 1],
    range: scarGround, home: underShed, perches: [...tableTiles, ...COUNTERS.flatMap(([x, y, w]) => tilesIn(x, y, x + w - 1, y))],
    presence: [0.3, 0.92],
    acts: [['home', 4], ['perch', 4], ['roam', 3], ['meow', 1]],
    bubbles: { self: '♥', selfFor: { shark: '♥♥' }, them: '♥' }, mood: 'friend',
    after: {
      // (her old ground, and from Garnet's crossing east along the pavement to the box)
      range: (x, y) => scarGround(x, y) || (x >= 104 && y >= 35),
      home: [1, 2, 3].map((i) => [GARNET_BOX.x + i, PAVE_S + 2]),
      presence: [0.97, 0.97], // (she has kittens to mind: she is about by day and by night)
      perches: [...tableTiles, ...COUNTERS.flatMap(([x, y, w]) => tilesIn(x, y, x + w - 1, y)), ...[0, 1, 2, 3, 4].map((i) => [GARNET_BOX.x + i, GARNET_BOX.y])],
    },
  },
  {
    id: 'thanos', name: 'Thanos', pal: PAL.thanos, coat: patched(THANOS_ORANGE, thanosPatch), scale: [1.375, 1.375], thickTail: true,
    // east of column CS (so never the playground), north of the road
    range: (x, y) => x >= 71 && y <= 36, home: tilesIn(112, 29, 127, 34), perches: tableTiles,
    presence: [0.92, 0.6],
    acts: [['home', 3], ['roam', 5], ['perch', 1], ['meow', 1]],
    bubbles: { self: 'Hsss!', them: '!' }, mood: 'foe',
    after: {
      // ...and the whole building side of the road, by Garnet's crossing: he looks in at both boxes
      range: (x, y) => y > KERB_S || x >= 71,
      home: [...tilesIn(112, 29, 127, 34), [AC_UNITS[0].x + 2, PAVE_S + 1], [AC_UNITS[0].x + 3, PAVE_S + 1], [GARNET_BOX.x + 4, PAVE_S + 1], [GARNET_BOX.x + 5, PAVE_S + 1]],
    },
  },
  {
    id: 'mama', name: 'Mamacat', pal: PAL.mama, coat: tortie(3),
    // the building side of the road only
    range: (x, y) => y >= PAVE_S, home: tilesIn(AC_UNITS[0].x, AC_UNITS[0].y, AC_UNITS[0].x + AC_UNITS[0].w - 2, AC_UNITS[0].y), perches: tilesIn(AC_UNITS[0].x, AC_UNITS[0].y, AC_UNITS[0].x + AC_UNITS[0].w - 2, AC_UNITS[0].y),
    presence: [0.92, 0.25], twoStep: true,
    acts: [['perch', 6], ['roam', 3], ['rest', 1]],
    bubbles: { self: '...', them: '?' }, mood: 'neutral',
  },
  {
    id: 'baby', name: 'Babycat', pal: PAL.mama, coat: tortie(3), scale: [0.7, 0.7], follows: 'mama',
    range: (x, y) => y >= PAVE_S, home: [], perches: [], presence: [1, 1], acts: [],
    bubbles: { self: '!', them: '♥' }, mood: 'neutral',
  },
  {
    id: 'cheetos', name: 'Cheetos', pal: PAL.cheetos, scale: [0.8, 0.8], walk: 6, run: 4, sprint: 0.8,
    // AA to CS (the yard and the playground), north of the road
    range: rect(0, 14, 70, 34), home: benchTiles, perches: benchTiles,
    presence: [0.8, 0.6],
    acts: [['perch', 3], ['slide', 3], ['net', 2], ['bars', 2], ['zoom', 4], ['roam', 2]],
    bubbles: { self: '?', them: '?' }, mood: 'stranger',
  },
  {
    id: 'socks', name: 'Socks', pal: PAL.socks, coat: socks('#fdf6e8', true),
    // columns CA (half way across the playground) to ET, north of the road and south of the
    // boardwalk; home is the bushes north of the lawn (CU-DN)
    range: (x, y) => socksNorth(x, y) && y >= 17, home: socksBushes, perches: benchTiles,
    presence: [0.55, 0.88],
    acts: [['tree', 8], ['roam', 4], ['home', 2], ['meow', 1]],
    bubbles: { self: '♥', selfFor: { orca: '♥♥' }, them: '♥' }, mood: 'friend',
    after: {
      // ...the boardwalk as well, and over the road (by either crossing) to the sidewalk: she has a
      // second place to settle, beside Mamacat's box
      range: (x, y) => socksNorth(x, y) || y >= 36,
      home: [...socksBushes, [AC_UNITS[0].x - 2, PAVE_S + 1], [AC_UNITS[0].x - 1, PAVE_S + 1]],
      acts: [['tree', 8], ['boardwalk', 5], ['roam', 3], ['home', 3], ['meow', 1]],
    },
  },
];
// The named cats as they are once the story is over (on), or while it is told (off): each one's `after`
// laid over its ways, or taken off again. The story says when (the jetty part of Act 3: afterHomes).
const BEFORE = new Map();
export function applyAfter(on) {
  for (const d of NAMED) {
    if (!d.after) continue;
    if (!BEFORE.has(d)) BEFORE.set(d, Object.fromEntries(Object.keys(d.after).map((k) => [k, d[k]])));
    Object.assign(d, on ? d.after : BEFORE.get(d));
  }
}
// anonymous strays: a coat and a way of behaving, picked at random each visit
// (None of them is a tabby or an orange cat: those two are Shark and Orca, whom the story calls
// The Tabby and The Orange until they are named. So: plain coats, a tuxedo and a calico.)
export const RANDOM_COATS = [
  { what: 'black cat', pal: PAL.black },
  { what: 'white cat', pal: PAL.white },
  { what: 'gray cat', pal: { ...PAL.grey, d: PAL.grey.b } },
  { what: 'brown cat', pal: { ...PAL.brown, d: PAL.brown.b } },
  { what: 'tuxedo cat', pal: { ...PAL.black, w: '#f4f0e6' }, coat: socks('#f4f0e6') },
  { what: 'calico cat', pal: PAL.white, coat: calico },
];
const RANDOM_LINES = [
  "The {n} sniffs {c} carefully, nose to nose, and decides he's all right.",
  'The {n} flattens its ears, thinks better of it, and looks away.',
  'The {n} blinks slowly at {c}. {c} blinks back. That settles it.',
  "The {n} flops over and shows {c} its belly. {c} knows better than to touch it.",
  'The {n} backs off a step. {c} smells like a house now.',
  "The {n} and {c} agree, without a word, that this is a good spot and there's room for two.",
];

// ----------------------------------------------------------------- engine
// api: { GOX, cats(), outside(), hour(), visible(px, py), say, fmt, bubble, spawn, sfx, act, rustle,
//        blocked(tx, ty), kibble(), eatKibble(k, cat) }
export function createStrays(api) {
  const { GOX } = api;
  const key = (x, y) => (x + 64) * 64 + y;
  const doorTile = (x, y) => x >= ENTRANCE.doorX && x < ENTRANCE.doorX + ENTRANCE.doorW && y >= ENTRANCE.y;
  // everywhere a cat could get to from the lobby (this keeps strays inside the barriers)
  const reach = new Set();
  {
    const q = [START[0]];
    reach.add(key(...START[0]));
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = key(x + dx, y + dy);
        if (reach.has(k) || gardenBlocked(x + dx, y + dy)) continue;
        reach.add(k);
        q.push([x + dx, y + dy]);
      }
    }
  }
  const list = [];
  const byId = {};
  const gx = (n) => n.tx - GOX;

  function sprites(def) {
    return makeCat(def.pal, { coat: def.coat, scale: def.scale, thickTail: def.thickTail });
  }
  function add(def, named) {
    const n = {
      kind: 'stray', def, name: def.name, named, sp: sprites(def),
      tx: 0, ty: 0, fx: 0, fy: 0, px: 0, py: 0, z: 0, z0: 0, z1: 0, hop: 0, dir: 'down',
      moving: false, mt: 0, md: 10, pose: 'sit', path: [], then: null, timer: 60 + rnd(200), sleepy: false, rested: 0,
      hidden: true, want: true, pause: 0, wait: 0, ride: null, trips: 0, maxTrips: 2 + rnd(3), li: 0, front: 0, gwalk: false, run: false,
    };
    list.push(n);
    byId[def.id] = n;
    return n;
  }
  for (const def of NAMED) add(def, true);
  for (const n of list) if (n.def.follows) n.leaderCat = byId[n.def.follows];

  const dark = () => api.hour() >= 18.5 || api.hour() < 6;
  const at = (tx, ty) => list.find((n) => !n.hidden && n.tx === tx && n.ty === ty) || null;
  const playerAt = (tx, ty) => api.outside() && api.cats().some((c) => c.tx === tx && c.ty === ty);
  const taken = (x, y, me) => playerAt(GOX + x, y) || (api.blocked && api.blocked(GOX + x, y)) || list.some((n) => n !== me && !n.hidden && n.tx === GOX + x && n.ty === y);
  // may this cat stand on this tile? (perches only when it is heading for one)
  // (a cat that is tagging along with Shark and Orca goes wherever they go)
  const tagging = (n) => !!n.following || !!(n.leaderCat && n.leaderCat.following);
  // (and nobody strolls along the road: it is crossed at a crossing or not at all)
  // Somewhere the story is keeping clear for a scene (see keepOut in game.js; it may let named cats of its
  // own choosing in): no cat of the garden's walks into it, and one who is in it when it is set walks out.
  const zone = (n, x, y) => !!(api.keepOut && api.keepOut(x, y, n.named ? n.def.id : null));
  const ok = (n, x, y) => reach.has(key(x, y)) && (tagging(n) || (n.def.range(x, y) && (!isRoad(y) || onCrossing(x)))) && !doorTile(x, y) && (tagging(n) || n.fleeing || !zone(n, x, y));
  const perchOk = (n, x, y) => !!gardenPerch(x, y) && n.def.range(x, y) && !zone(n, x, y);
  const height = (x, y) => {
    const p = gardenPerch(x, y);
    return p ? p.h : 0;
  };

  function place(n, x, y) {
    Object.assign(n, { tx: GOX + x, ty: y, fx: GOX + x, fy: y, px: (GOX + x) * T, py: y * T, z: height(x, y), moving: false, path: [], then: null, ride: null, front: 0, gwalk: false });
  }

  // shortest way from where the cat is to a tile (or the nearest tile that passes `goal`)
  function route(n, goal, max = 2600) {
    const sx = gx(n);
    const sy = n.ty;
    const isGoal = typeof goal === 'function' ? goal : (x, y) => x === goal[0] && y === goal[1];
    if (isGoal(sx, sy)) return [];
    const prev = new Map([[key(sx, sy), null]]);
    const q = [[sx, sy]];
    for (let i = 0; i < q.length && i < max; i++) {
      const [x, y] = q[i];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        const k = key(nx, ny);
        if (prev.has(k) || !ok(n, nx, ny)) continue;
        prev.set(k, [x, y]);
        if (isGoal(nx, ny)) {
          const out = [[nx, ny]];
          for (let p = prev.get(k); p && prev.get(key(p[0], p[1])); p = prev.get(key(p[0], p[1]))) out.unshift(p);
          return out;
        }
        q.push([nx, ny]);
      }
    }
    return null;
  }

  function step(n, x, y, dur) {
    const ox = gx(n);
    const oy = n.ty;
    n.fx = n.tx;
    n.fy = n.ty;
    n.tx = GOX + x;
    n.ty = y;
    n.dir = x > ox ? 'right' : x < ox ? 'left' : y > oy ? 'down' : 'up';
    n.z0 = height(ox, oy);
    n.z1 = height(x, y);
    n.hop = n.z0 !== n.z1 ? 5 + Math.abs(n.z1 - n.z0) * 0.4 : 0;
    n.md = n.hop ? Math.max(dur, 13) : dur;
    n.mt = 0;
    n.moving = true;
    n.pose = 'stand';
    if (api.outside() && (isBush(x, y) || isBush(ox, oy)) && api.visible(n.px, n.py)) api.rustle(n.tx, n.ty, n.fx, n.fy);
    // a kitten keeps to its mother's heels
    const kid = list.find((k) => k.leaderCat === n && !k.hidden);
    if (kid && !kid.moving && !kid.pause && (gx(kid) !== ox || kid.ty !== oy) && Math.abs(gx(kid) - ox) + Math.abs(kid.ty - oy) <= 2 && !taken(ox, oy, kid)) step(kid, ox, oy, n.md);
  }

  const speed = (n) => (n.run ? n.def.run || 6 : n.def.walk || 10);
  function go(n, path, then, run = false) {
    n.path = path || [];
    n.then = then || null;
    n.run = run;
    n.wait = 0;
  }
  function rest(n, frames, sleepy) {
    n.timer = frames;
    n.sleepy = sleepy;
    n.rested = 0;
    n.pose = 'sit';
    if (!n.z) n.dir = pick(['down', 'down', 'left', 'right']);
  }

  // --- rides: [px, py, z, frames, dir, pose]
  const X = (x) => (GOX + x) * T;
  function ride(n, steps, end, face) {
    n.ride = { t: 0, steps, end, face, from: [n.px, n.py, n.z || 0] };
    n.front = 60;
    n.moving = false;
  }
  function advance(n) {
    const r = n.ride;
    let t = r.t++;
    let prev = r.from;
    for (const st of r.steps) {
      if (t < st[3]) {
        const k = t / st[3];
        n.px = lerp(prev[0], st[0], k);
        n.py = lerp(prev[1], st[1], k);
        n.z = lerp(prev[2], st[2], k);
        if (st[4]) n.dir = st[4];
        n.pose = st[5] || 'stand';
        n.gwalk = !st[5] && (st[0] !== prev[0] || st[1] !== prev[1] || st[2] !== prev[2]);
        return;
      }
      t -= st[3];
      prev = st;
    }
    // down again: land on the end tile, or next to it if someone has sat there
    let [ex, ey] = r.end;
    if (taken(ex, ey, n)) {
      const alt = [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0]].map(([dx, dy]) => [ex + dx, ey + dy]).find(([x, y]) => ok(n, x, y) && !taken(x, y, n));
      if (alt) [ex, ey] = alt;
    }
    place(n, ex, ey);
    n.dir = r.face || 'down';
    rest(n, 50 + rnd(120), false);
  }
  const rides = {
    slide(n) {
      const y = SLIDE.y * T;
      const endX = SLIDE.x + 7 + rnd(2);
      if (taken(endX, SLIDE.y, n)) return false;
      ride(n, [
        [X(SLIDE.x), y, 0, 8, 'right'], [X(SLIDE.x), y, 24, 14, 'up'], [X(SLIDE.x + 1) + 4, y, 27, 7, 'right'],
        [X(SLIDE.x + 5) + 8, y, 8, 16, 'right', 'sit'], [X(endX), y, 0, 8, 'right', 'sit'],
      ], [endX, SLIDE.y], 'right');
      return true;
    },
    bars(n, from, to) {
      const y = BARS.y * T;
      const d = to > from ? 1 : -1;
      const face = d > 0 ? 'right' : 'left';
      ride(n, [[X(from), y, 0, 7, face], [X(from), y, 26, 12, 'up'], [X(to), y, 26, 36, face], [X(to + d), y, 0, 10, face]], [to + d, BARS.y], face);
      return true;
    },
    climb(n, px, py, top, back) {
      ride(n, [[px, py, 4, 8, 'up'], [px, py, top, 22, 'up'], [px, py, top, 130 + rnd(160), 'down', 'sit'], [px, py, 4, 18, 'up'], [X(back[0]), back[1] * T, 0, 8, 'down']], back, 'down');
      return true;
    },
  };

  // --- what to do next
  const sample = (n, tiles, tries = 12) => {
    for (let i = 0; i < tries; i++) {
      const t = pick(tiles);
      if (t && !taken(t[0], t[1], n)) return t;
    }
    return null;
  };
  // walk to a tile next to a perch, then hop up onto it
  function toPerch(n, tiles, frames) {
    const p = sample(n, tiles.filter(([x, y]) => perchOk(n, x, y)));
    if (!p) return false;
    const sides = [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dx, dy]) => [p[0] + dx, p[1] + dy]).filter(([x, y]) => ok(n, x, y));
    // already up there, or up on the same thing: shuffle along
    if (gardenPerch(gx(n), n.ty) && Math.abs(gx(n) - p[0]) + Math.abs(n.ty - p[1]) <= 1) {
      go(n, gx(n) === p[0] && n.ty === p[1] ? [] : [p], () => rest(n, frames, true));
      return true;
    }
    let best = null;
    for (const s of sides) {
      const r = route(n, s);
      if (r && (!best || r.length < best.length)) best = r;
    }
    if (!best) return false;
    const more = [p];
    // (a mother moves one along, leaving the first spot for her kitten)
    if (n.def.twoStep) {
      const next = [[1, 0], [-1, 0]].map(([dx]) => [p[0] + dx, p[1]]).find(([x, y]) => perchOk(n, x, y) && !taken(x, y, n));
      if (next) more.push(next);
    }
    go(n, [...best, ...more], () => rest(n, frames, true));
    return true;
  }
  function roamTo(n, target, run, then) {
    if (!target || !ok(n, target[0], target[1]) || taken(target[0], target[1], n)) return false;
    const r = route(n, target);
    if (!r) return false;
    go(n, r, then || (() => rest(n, 150 + rnd(420), Math.random() < 0.25)), run);
    return true;
  }
  const near = (n, r) => [gx(n) + rnd(2 * r + 1) - r, n.ty + rnd(2 * r + 1) - r];
  const actions = {
    rest: (n) => (rest(n, 300 + rnd(500), true), true),
    meow(n) {
      if (api.outside() && api.visible(n.px, n.py)) {
        api.bubble(n, pick(['Meow!', 'Mrow?', 'Mew!']), 50);
        api.sfx.meow(520 + rnd(260));
      }
      rest(n, 80, false);
      return true;
    },
    home(n) {
      n.trips = 0;
      const h = sample(n, n.def.home);
      if (!h) return false;
      const frames = 500 + rnd(900);
      if (gardenPerch(h[0], h[1])) return toPerch(n, n.def.home, frames);
      return roamTo(n, h, false, () => rest(n, frames, true));
    },
    perch: (n) => toPerch(n, n.def.perches, 500 + rnd(900)),
    roam(n) {
      for (let i = 0; i < 8; i++) if (roamTo(n, near(n, 14), Math.random() < (n.def.sprint || 0.15))) return true;
      return false;
    },
    // three quick dashes with no stopping in between
    zoom(n) {
      let left = 3;
      const dash = () => {
        if (--left < 0) return rest(n, 90 + rnd(120), false);
        for (let i = 0; i < 8; i++) if (roamTo(n, near(n, 10), true, dash)) return;
        rest(n, 60, false);
      };
      dash();
      return true;
    },
    // a few steps away, fast (after a game of tag)
    bolt: (n) => {
      for (let i = 0; i < 8; i++) if (roamTo(n, near(n, 4), true, () => rest(n, 120, false))) return true;
      return false;
    },
    slide: (n) => roamTo(n, [SLIDE.x - 1, SLIDE.y], Math.random() < 0.6, () => rides.slide(n) || rest(n, 60, false)),
    bars(n) {
      const west = Math.random() < 0.5;
      const from = west ? BARS.x : BARS.x + BARS.w - 1;
      const to = west ? BARS.x + BARS.w - 1 : BARS.x;
      return roamTo(n, [from + (west ? -1 : 1), BARS.y], Math.random() < 0.6, () => (taken(to + (west ? 1 : -1), BARS.y, n) ? rest(n, 60, false) : rides.bars(n, from, to)));
    },
    net(n) {
      const foot = [NET.mast[0][0], NET.mast[0][1] + 1];
      return roamTo(n, foot, Math.random() < 0.6, () => rides.climb(n, NET.cx - 8 + GOX * T, NET.mast[0][1] * T, 42, foot));
    },
    tree(n) {
      const trees = BIG_TREES.filter(([x, y]) => n.def.range(x, y)).sort((a, b) => Math.abs(a[0] - gx(n)) + Math.abs(a[1] - n.ty) - Math.abs(b[0] - gx(n)) - Math.abs(b[1] - n.ty));
      // usually a nearby one, now and then one across the garden
      const t = Math.random() < 0.7 ? trees[rnd(Math.min(3, trees.length))] : pick(trees);
      if (!t) return false;
      const foot = [[0, 1], [1, 0], [-1, 0], [0, -1]].map(([dx, dy]) => [t[0] + dx, t[1] + dy]).find(([x, y]) => ok(n, x, y) && !taken(x, y, n));
      return !!foot && roamTo(n, foot, false, () => rides.climb(n, X(t[0]), t[1] * T, 30, foot));
    },
    // a stroll along the riverside boardwalk
    boardwalk(n) {
      const x = 52 + rnd(62);
      return roamTo(n, [x, 15 + northShift(x)], false, () => {
        const x2 = Math.max(52, Math.min(113, x + (Math.random() < 0.5 ? -1 : 1) * (12 + rnd(20))));
        if (!roamTo(n, [x2, 15 + northShift(x2)], false)) rest(n, 200, false);
      });
    },
  };
  function next(n) {
    if (n.leaderCat) return rest(n, 120, true);
    const acts = n.def.acts;
    // after a few outings it is time to go home
    if (n.trips >= n.maxTrips && n.def.home.length) {
      n.maxTrips = 2 + rnd(3);
      if (actions.home(n)) return;
    }
    const total = acts.reduce((a, [, w]) => a + w, 0);
    for (let tries = 0; tries < 4; tries++) {
      let r = Math.random() * total;
      const a = acts.find(([, w]) => (r -= w) < 0) || acts[0];
      if (actions[a[0]](n)) {
        if (a[0] !== 'home' && a[0] !== 'rest' && a[0] !== 'meow') n.trips++;
        return;
      }
    }
    rest(n, 200 + rnd(200), true);
  }

  // --- kibble: a cat that passes within a few tiles of some goes and eats it. In the lean days (Act 1,
  // before the adoption: api.lean) a nameless stray smells food that was put down in the last hour of
  // game time from much further off, and comes for it.
  const FRESH = 60; // game minutes
  function sniff(n) {
    if (!api.kibble || n.leaderCat || n.eating || n.ride) return;
    const lean = !n.named && api.lean && api.lean();
    const reach = (k) => (lean && api.clock && api.clock() - k.born <= FRESH && api.clock() >= k.born ? 14 : 4);
    const k = api.kibble().find((k) => Math.abs(k.x - gx(n)) + Math.abs(k.y - n.ty) <= reach(k) && ok(n, k.x, k.y));
    if (!k) return;
    const r = route(n, [k.x, k.y], lean ? 1500 : 500);
    if (!r) return;
    n.eating = k;
    go(n, r, () => {
      n.eating = null;
      if (api.kibble().includes(k)) {
        api.eatKibble(k, n);
        n.pause = 110;
        n.pose = 'stand';
      }
      rest(n, 80, false);
    }, true);
  }

  // --- appearing and disappearing
  function settle(n) {
    const spots = n.def.home.filter(([x, y]) => (ok(n, x, y) || perchOk(n, x, y)) && !taken(x, y, n));
    const h = spots.length ? pick(spots) : null;
    if (!h) return false;
    place(n, h[0], h[1]);
    rest(n, 200 + rnd(600), true);
    n.trips = 0;
    n.maxTrips = 2 + rnd(3);
    return true;
  }
  function roll() {
    const d = dark() ? 1 : 0;
    for (const n of list) if (n.named && !n.leaderCat) n.want = Math.random() < n.def.presence[d];
    for (const n of list) if (n.leaderCat) n.want = n.leaderCat.want;
  }
  let slot = -1;
  function presence() {
    const s = Math.floor(api.hour() / 6);
    if (s !== slot) {
      slot = s;
      roll();
    }
    for (const n of list) {
      if (tagging(n)) continue; // out with Shark and Orca: it stays
      // the story may want a cat about, or keep one out of sight for now
      let forced = n.named && api.present ? api.present(n.def.id) : undefined;
      if (forced === undefined && n.leaderCat && api.present) forced = api.present(n.leaderCat.def.id);
      if (forced !== undefined) n.want = forced;
      if (!n.named || n.want !== n.hidden) continue; // already as wanted
      if (api.outside() && !n.hidden && api.visible(n.px, n.py)) continue; // not while being watched
      if (n.want) {
        if (n.leaderCat) {
          const m = n.leaderCat;
          if (m.hidden) continue;
          const spot = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [gx(m) + dx, m.ty + dy]).find(([x, y]) => (ok(n, x, y) || perchOk(n, x, y)) && !taken(x, y, n));
          if (!spot) continue;
          place(n, spot[0], spot[1]);
          rest(n, 100, true);
        } else if (!settle(n)) continue;
        if (api.outside() && api.visible(n.px, n.py)) {
          n.hidden = true; // wait until nobody is looking at that spot
          continue;
        }
        n.hidden = false;
      } else if (!n.ride) n.hidden = true;
    }
  }

  // Beaten in a fight over food: off at a run, well away from (fx, fy) (garden tiles), and nothing more
  // to do with that food.
  function runOff(n, fx, fy) {
    n.path = [];
    n.then = null;
    n.eating = null;
    const r = route(n, (x, y) => Math.abs(x - fx) + Math.abs(y - fy) >= 8 && !taken(x, y, n), 2000);
    if (!r || !r.length) return rest(n, 60, false);
    n.fleeing = true;
    go(n, r, () => { n.fleeing = false; rest(n, 200 + rnd(200), false); }, true);
  }

  // frozen: a scene is playing, so nobody decides anything; steps under way finish
  // Out of a place the story is keeping clear. hard: this instant, seen or not (the screen is black).
  function clearZones(hard) {
    if (!api.keepOut) return;
    for (const n of list) {
      if (n.hidden || tagging(n) || n.ride || n.fleeing) continue;
      if (!zone(n, gx(n), n.ty)) {
        if (n.path.some(([x, y]) => zone(n, x, y))) { n.path = []; n.then = null; rest(n, 30, false); }
        continue;
      }
      n.fleeing = true; // (ok lets him through the zone itself, this once)
      const r = route(n, (x, y) => !zone(n, x, y) && !taken(x, y, n), 3000);
      if (!r || !r.length) {
        n.fleeing = false;
        if (hard || !api.visible(n.px, n.py)) n.hidden = true;
        continue;
      }
      if (hard || !api.outside() || !api.visible(n.px, n.py)) {
        const [x, y] = r[r.length - 1];
        place(n, x, y);
        n.fleeing = false;
        rest(n, 100, true);
      } else go(n, r, () => { n.fleeing = false; rest(n, 150 + rnd(300), false); }, true);
    }
  }

  function update(frame, frozen) {
    if (!frozen && frame % 20 === 10) clearZones(false);
    if (!frozen && frame % 30 === 0) presence();
    for (const n of list) {
      if (n.hidden) continue;
      if (frozen && !n.moving) continue;
      if (n.ride) {
        advance(n);
        continue;
      }
      if (n.moving) {
        n.mt++;
        const t = Math.min(1, n.mt / n.md);
        n.px = lerp(n.fx, n.tx, t) * T;
        n.py = lerp(n.fy, n.ty, t) * T;
        n.z = lerp(n.z0, n.z1, t) + Math.sin(Math.PI * t) * n.hop;
        if (n.mt >= n.md) {
          n.moving = false;
          n.z = n.z1;
          if (!tagging(n)) sniff(n);
        }
        continue;
      }
      // tagging along: keep to the heels of the cat ahead
      if (n.following) {
        const m = n.following;
        const d = Math.abs(m.tx - n.tx) + Math.abs(m.ty - n.ty);
        if (d > 1) {
          if (frame % 4 === 0) {
            const r = route(n, (x, y) => Math.abs(GOX + x - m.tx) + Math.abs(y - m.ty) === 1, 1500);
            if (r && r.length && !taken(r[0][0], r[0][1], n)) {
              n.run = d > 3;
              step(n, r[0][0], r[0][1], d > 3 ? 5 : 8);
            } else if (d > 12 && !api.visible(n.px, n.py)) {
              // left far behind and out of sight: catch up
              const spot = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [m.tx - GOX + dx, m.ty + dy]).find(([x, y]) => ok(n, x, y) && !taken(x, y, n));
              if (spot) place(n, spot[0], spot[1]);
            }
          }
        } else if (!m.moving) {
          if (++n.rested > 90) n.pose = 'sit';
        } else n.rested = 0;
        continue;
      }
      if (n.pause > 0) {
        n.pause--;
        continue;
      }
      // a kitten: catch up with mum, and copy her when she settles
      const m = n.leaderCat;
      if (m && !m.hidden) {
        const d = Math.abs(m.tx - n.tx) + Math.abs(m.ty - n.ty);
        if (d > 1) {
          if (frame % 12 === 0) {
            const r = route(n, (x, y) => Math.abs(GOX + x - m.tx) + Math.abs(y - m.ty) === 1, 900);
            if (r && r.length && !taken(r[0][0], r[0][1], n)) {
              n.run = d > 3;
              step(n, r[0][0], r[0][1], d > 3 ? 5 : 8);
            }
          }
        } else if (!m.moving && !m.path.length) n.pose = m.pose === 'stand' ? 'sit' : m.pose;
        continue;
      }
      if (n.path.length) {
        const [x, y] = n.path[0];
        if (taken(x, y, n)) {
          // someone is in the way: wait a moment, then think of something else
          n.pose = 'sit';
          if (++n.wait > 70) {
            n.path = [];
            n.then = null;
            n.eating = null;
            rest(n, 40 + rnd(60), false);
          }
          continue;
        }
        n.wait = 0;
        n.path.shift();
        step(n, x, y, speed(n));
        continue;
      }
      if (n.then) {
        const f = n.then;
        n.then = null;
        f();
        continue;
      }
      n.rested++;
      if (n.sleepy && n.rested > 110) n.pose = 'sleep';
      else if (n.rested % 60 === 30 && !n.z) sniff(n);
      if (n.pose === 'sleep' && n.rested % 100 === 0 && api.outside() && api.visible(n.px, n.py)) api.spawn('glyph', n.px + 10, n.py - 2 - n.z, { vy: -0.25, vx: 0.12, life: 60, ch: 'z', color: C.white });
      if (--n.timer <= 0) next(n);
    }
  }

  // --- tagging along with Shark and Orca
  function follow(n, cat) {
    n.following = cat;
    n.path = [];
    n.then = null;
    n.eating = null;
    n.pause = 0;
    n.rested = 0;
    n.hidden = false;
    n.pose = 'stand';
  }
  function unfollow(n) {
    n.following = null;
    n.trips = n.maxTrips; // straight home
    rest(n, 40, false);
  }
  // one step to a tile (the pair's line moving on), whatever its usual range
  // through: a scene is moving it, and whoever is standing in the way does not stop it
  function trail(n, tx, ty, dur, through) {
    if (n.moving || n.ride || (!through && taken(tx - GOX, ty, n))) return false;
    if (Math.abs(n.tx - tx) + Math.abs(n.ty - ty) !== 1) return false;
    n.rested = 0;
    step(n, tx - GOX, ty, dur);
    return true;
  }

  // Shark or Orca has walked into one of them. `quiet`: do everything but say
  // the line, and hand it back instead (the dialog box will show it).
  function interact(cat, tx, ty, quiet) {
    const n = at(tx, ty);
    if (!n) return false;
    const d = n.def;
    n.pause = 170;
    if (n.pose === 'sleep' || !n.z) n.pose = 'sit';
    if (!n.ride && !n.z) n.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[cat.dir];
    // (the story has its own lines for the cats it knows; outside it, a named cat says what it says after
    // the end, which is true of it in any game with no story in it)
    const lines = (api.lines && api.lines(n)) || d.lines || AFTER_WORDS.lines[d.id];
    const i = n.li++ % lines.length;
    const other = api.cats().find((c) => c !== cat);
    let line = lines[i];
    if (!n.named) line = line.replaceAll('{n}', d.what);
    line = api.fmt(line, cat);
    if (!quiet) api.say(line);
    api.bubble(n, (d.bubbles.selfFor && d.bubbles.selfFor[cat.cfg.id]) || d.bubbles.self, 90);
    api.bubble(cat, d.bubbles.them, 80);
    if (d.mood === 'friend') {
      api.sfx.purr();
      api.act(cat, 'purr', 70);
    } else if (d.mood === 'foe') {
      api.sfx.hiss();
      api.act(cat, 'look', 50);
      if (other) api.bubble(other, '!', 60);
    } else {
      api.sfx.meow(560 + rnd(200));
      api.act(cat, 'look', 45);
    }
    return quiet ? line : true;
  }

  // a fresh handful of anonymous strays each time the cats come downstairs
  function newVisit() {
    for (let i = list.length - 1; i >= 0; i--) if (!list[i].named) list.splice(i, 1);
    const tiles = [...reach].map((k) => [Math.floor(k / 64) - 64, k % 64]).filter(([x, y]) => y >= 14 && y <= 34 && x > 22 && !isBush(x, y) === (Math.random() < 0.6));
    // (few of them come out while there are dogs about; more in the lean days of Act 1)
    const count = api.quiet && api.quiet() ? 0 : api.dogs && api.dogs() ? rnd(2) : api.lean && api.lean() ? 4 + rnd(2) : 2 + rnd(2);
    const coats = [...RANDOM_COATS].sort(() => Math.random() - 0.5);
    for (let i = 0; i < count && tiles.length; i++) {
      const c = coats[i % coats.length];
      const size = pick([null, null, [0.875, 0.875], [0.875, 1]]);
      const def = {
        id: 'stray' + i, name: 'The ' + c.what, what: c.what, pal: c.pal, coat: c.coat, scale: size,
        range: (x, y) => y >= 14 && y <= 35, home: [], perches: benchTiles, presence: [1, 1],
        acts: [['roam', 5], ['rest', 3], ['perch', 1], ['meow', 1]],
        bubbles: pick([{ self: '?', them: '?' }, { self: '...', them: '?' }, { self: '!', them: '...' }, { self: '♥', them: '?' }]),
        mood: 'neutral', lines: [...RANDOM_LINES].sort(() => Math.random() - 0.5).slice(0, 3),
      };
      const n = add(def, false);
      for (let t = 0; t < 30; t++) {
        const [x, y] = pick(tiles);
        if (taken(x, y, n) || Math.abs(x - START[0][0]) + Math.abs(y - START[0][1]) < 16) continue;
        place(n, x, y);
        n.hidden = false;
        rest(n, 100 + rnd(400), Math.random() < 0.4);
        break;
      }
      if (n.hidden) list.pop();
    }
    // nobody sits where Shark and Orca walk out
    for (const n of list) {
      if (n.hidden || Math.abs(gx(n) - START[0][0]) + Math.abs(n.ty - START[0][1]) > 2) continue;
      const spot = [[4, 1], [-4, 1], [5, 2], [-5, 2]].map(([dx, dy]) => [START[0][0] + dx, START[0][1] + dy]).find(([x, y]) => ok(n, x, y) && !taken(x, y, n));
      if (spot) place(n, spot[0], spot[1]);
    }
  }

  // which picture to draw
  function sprite(n, frame) {
    const sp = n.sp;
    if (n.moving) return sp.walk[n.dir][Math.floor((n.mt * 2) / n.md) % 2];
    if (n.gwalk) return sp.walk[n.dir][(frame >> 2) & 1];
    if (n.pose === 'sleep') return n.dir === 'right' ? sp.sleepR : sp.sleep;
    if (n.pose === 'sit') return sp.sit[n.dir];
    return sp.stand[n.dir];
  }

  return { list, byId, at, update, interact, newVisit, clearZones, sprite, roll, settle, place, actions, follow, unfollow, trail, tagging, ride, runOff };
}
