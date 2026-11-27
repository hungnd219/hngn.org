// The people in the garden: adults, kids on foot and kids on bikes.
//
// Nobody here is a fixed character. A fresh crowd is made up every time
// Shark and Orca come downstairs (looks, clothes, and whether they like
// cats), sized to the time of day, and it only exists while they are down
// there. Adults drift between things to do (a stroll, a bench, the cafe, a
// jog, the barbecue...) with odds that change through the day, and go home
// through the Amber or Garnet doors; kids come out in the afternoon.
// Kind adults sometimes leave a little pile of kibble for the cats.
//
// Positions are garden tiles; entities live in world space (GOX to the east).
import {
  GX0, GX1, GH, PAVE_S, gardenBlocked, gardenPerch, groundAt, isBush, onCrossing, northShift, START, ENTRANCE, GARNET,
  BENCHES, CAFE_SETS, TABLES, SHED, SLIDE, BARS, NET,
} from './garden.js';
import { makeHuman } from './sprites.js';
import { C, R, P, canvas } from './palette.js';

const T = 16;
const rnd = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rnd(a.length)];
const lerp = (a, b, t) => a + (b - a) * t;
const chance = (p) => Math.random() < p;

// ------------------------------------------------------------------ looks
// four in five are East or South-East Asian
const SKIN_ASIAN = ['#f3d2b0', '#f0c8a0', '#e8b98f', '#dba77a', '#cf9a6c'];
const SKIN_OTHER = ['#f6d7c3', '#eec1a4', '#b97d4e', '#8f5a34', '#6e4226'];
const HAIR_DARK = ['#2b2024', '#3b3038', '#35262a', '#4a3324'];
const HAIR_OTHER = ['#6b4a2e', '#8a5a2e', '#d9b45a', '#a8502a', '#2b2024'];
const HAIR_GREY = ['#a5abb3', '#cbc5bb', '#928c86'];
const TOPS = [
  ['red', '#c0503f', '#8f3a2f'], ['blue', '#3f6fc4', '#2f559c'], ['green', '#4f9442', '#336b30'], ['yellow', '#e8c13a', '#b9962a'],
  ['white', '#f1ece0', '#cdc6b6'], ['black', '#37323c', '#2b2024'], ['pink', '#e08fa8', '#b56a82'], ['orange', '#dd7a3c', '#a8582a'],
  ['purple', '#8a5fc4', '#64439a'], ['teal', '#2f8f93', '#1f6468'], ['gray', '#928c86', '#6e6962'], ['brown', '#8a5a3a', '#64402a'],
];
const BOTTOMS = ['#3d4763', '#37323c', '#6a5a46', '#8a7a5a', '#4a5a3a', '#e8dcc4', '#2f559c', '#7c2f2c'];
const SHOES = ['#cbc5bb', '#37323c', '#f1ece0', '#c0503f', '#3f6fc4'];
const BIKE_COLOURS = [['red', '#c0503f'], ['blue', '#3f6fc4'], ['green', '#4f9442'], ['yellow', '#d8b23a'], ['pink', '#e08fa8']];

function makeLook(kid) {
  const asian = chance(0.8);
  const skin = pick(asian ? SKIN_ASIAN : SKIN_OTHER);
  const old = !kid && chance(0.18);
  const hair = old ? pick(HAIR_GREY) : pick(asian ? HAIR_DARK : HAIR_OTHER);
  const female = chance(0.5);
  const longHair = female ? chance(0.7) : chance(0.08);
  const cap = !longHair && chance(kid ? 0.3 : 0.16);
  const top = pick(TOPS);
  const short = chance(kid ? 0.7 : 0.35); // shorts or a skirt: bare legs below the knee
  const capCol = pick(TOPS.filter((t) => t !== top))[1];
  const pal = { k: C.k, s: skin, h: hair, c: top[1], v: top[2], p: pick(BOTTOMS), o: pick(SHOES) };
  const coat = (kind, x, y, ch) => {
    if (cap && ch === 'h' && y <= 4) return capCol;
    if (short && ch === 'p' && y >= 19) return skin;
    return null;
  };
  const noun = kid ? (female ? 'girl' : 'boy') : old ? (female ? 'old lady' : 'old man') : female ? 'woman' : 'man';
  const wear = cap && chance(0.5) ? 'in a cap' : 'in ' + (top[0] === 'orange' ? 'an ' : 'a ') + top[0] + ' top';
  return { pal, longHair, coat, noun, wear, scale: kid ? [0.8125, 0.75] : null };
}

// a bike seen from the side (facing right) and from the front
function bikeSprites(col) {
  const [side, c] = canvas(30, 16);
  const disc = (cx, cy, r, colour) => {
    for (let j = -r; j <= r; j++) {
      const half = Math.round(Math.sqrt(r * r - j * j + 0.6));
      R(c, cx - half, cy + j, half * 2 + 1, 1, colour);
    }
  };
  for (const wx of [6, 22]) {
    disc(wx, 10, 5, C.k);
    disc(wx, 10, 3, C.grayL);
    P(c, wx, 10, C.k);
  }
  const line = (x1, y1, x2, y2) => {
    const n = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    for (let i = 0; i <= n; i++) P(c, Math.round(x1 + ((x2 - x1) * i) / n), Math.round(y1 + ((y2 - y1) * i) / n), col);
  };
  line(6, 10, 12, 4);
  line(12, 4, 20, 4);
  line(20, 4, 22, 10);
  line(12, 4, 15, 10);
  line(15, 10, 6, 10);
  line(15, 10, 20, 4);
  R(c, 10, 2, 5, 2, C.k);
  R(c, 19, 1, 4, 2, C.k);
  R(c, 20, 2, 1, 3, C.k);
  const [flipped, f] = canvas(30, 16);
  f.translate(30, 0);
  f.scale(-1, 1);
  f.drawImage(side, 0, 0);
  const [front, d] = canvas(16, 16);
  R(d, 6, 4, 4, 12, C.k);
  R(d, 7, 5, 2, 10, C.grayL);
  R(d, 2, 2, 12, 2, C.k);
  R(d, 7, 1, 2, 5, col);
  return { right: side, left: flipped, front };
}

// ------------------------------------------------------------------ words
// {W} = "The woman in a red top", {w} = "the woman in a red top"
const LINES = {
  adultKind: [
    '{W} crouches down and scratches {c} behind the ears. "Hello, you."',
    '{W} lets {c} sniff a hand first, and only then scratches his ears. {c} approves.',
    '"Aren\'t you a handsome one?" {W} gives {c} a real chin rub.',
    '{W} strokes {c} from nose to tail, twice. {c} allows a third.',
    '{W} says something soft and silly to {c}. {c} lets it go on.',
  ],
  adultKindSeated: [
    '{W} leans down from the seat to stroke {c}\'s back.',
    '{W} pats a knee. {c} considers it, and settles for a head rub.',
    '{W} lowers a hand and wiggles the fingers. {c} headbutts them. Deal.',
  ],
  adultMean: [
    '{W} stamps a foot. "Shoo! Go on, get!" {c} and {o} scatter.',
    '"Ugh. Cats." {W} flaps an arm at {c}. Time to leave.',
    "{W} claps loudly, twice. {c} doesn't wait for a third.",
    '{W} hisses "Tsss!" at {c}. It\'s a bad impression of a cat, but the message lands.',
  ],
  kidKind: [
    '"KITTY!" {W} drops to the ground and pets {c} with the whole of one sticky hand.',
    "{W} pats {c} very gently on the head, exactly as somebody's mom once explained.",
    '"Can we keep this one?" {W} hugs {c}. {c} wriggles out of it after a few seconds.',
    "{W} shows {c} a leaf. It's a good leaf. {c} sniffs it politely.",
  ],
  kidMean: [
    '{W} stomps at {c} and roars like a dinosaur. {c} and {o} walk away, quickly.',
    '"Go away, cat!" {W} flaps both arms. {c} goes.',
    "{W} tries to grab {c}'s tail. {c} is gone before the hand gets there.",
  ],
  bikeKind: [
    'Ring ring! {W} brakes and reaches down to pat {c}.',
    '{W} stops the bike. "Hi, cat. Do you want a ride?" {c} doesn\'t, but thank you.',
    '{W} puts a foot down and lets {c} sniff the front wheel.',
  ],
  bikeMean: [
    '{W} rings the bell right in {c}\'s face. "MOVE!" {c} moves.',
    '"Out of the way, cat!" {W} swerves at {c}. {c} and {o} bolt.',
  ],
  drop: [
    '{W} tips a little pile of kibble onto the ground and backs away.',
    '{W} shakes some kibble out of a bag. "Here, kitties."',
    '{W} leaves a handful of kibble and pretends not to watch.',
  ],
  // somebody eating at one of the BBQ tables, with a cat close by (see tableDrops)
  meat: [
    "{W} drops a piece of grilled chicken under the table, and doesn't bend down for it.",
    '"Oops." A bit of sausage rolls off the plate of {w}, and onto the ground.',
    '{W} looks down at the cats, looks around, and lets a piece of fish fall off the plate.',
  ],
};

// how many of each should be about at a given hour: [hour, adults, kids on foot, kids on bikes]
const CROWD = [[0, 0, 0, 0], [6, 0, 0, 0], [6.5, 4, 0, 0], [8, 9, 0, 0], [12, 11, 0, 0], [15, 12, 0, 0], [16, 14, 4, 3], [17.5, 18, 6, 4], [19, 16, 5, 4], [20, 13, 0, 0], [22, 8, 0, 0], [23.4, 3, 0, 0], [24, 0, 0, 0]];
function crowdAt(hr) {
  for (let i = CROWD.length - 1; i >= 0; i--) if (hr >= CROWD[i][0]) {
    const a = CROWD[i];
    const b = CROWD[Math.min(CROWD.length - 1, i + 1)];
    const t = b[0] > a[0] ? (hr - a[0]) / (b[0] - a[0]) : 0;
    return [1, 2, 3].map((k) => Math.round(lerp(a[k], b[k], t)));
  }
  return [0, 0, 0];
}
// what an adult feels like doing, by time of day: weights for each activity
const HABITS = {
  morning: { jog: 5, stroll: 3, cafe: 4, bench: 2, river: 2, feed: 7, home: 2 },
  day: { cafe: 5, stroll: 3, bench: 4, river: 2, feed: 7, home: 3 },
  evening: { stroll: 4, bbq: 5, bench: 3, cafe: 4, jog: 2, river: 2, feed: 8, home: 2 },
  night: { cafe: 4, stroll: 2, bench: 3, bbq: 2, river: 1, feed: 5, home: 4 },
};
const slotOf = (hr) => (hr < 10 ? 'morning' : hr < 16 ? 'day' : hr < 20 ? 'evening' : 'night');

// api: { GOX, cats(), outside(), hour(), clock(), visible(px, py), say, fmt, bubble, spawn, sfx, act, catAt(tx, ty), strays(), bolt(tx, ty) }
export function createPeople(api) {
  // Once the story is over nobody in the garden has a hard word for a cat: the three who did are gone,
  // and everybody else saw what the cats did. (The game says when: the epilogue, and Sandbox after it.)
  const allKind = () => !!(api.allKind && api.allKind());
  const { GOX } = api;
  const key = (x, y) => (x + 64) * 64 + y;
  // where a person can walk: no bushes, and the road only on the crossings
  const walkable = (x, y) => !gardenBlocked(x, y) && !isBush(x, y) && (groundAt(x, y) !== 'road' || onCrossing(x));
  const reach = new Set();
  {
    const q = [START[0]];
    reach.add(key(...START[0]));
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = key(x + dx, y + dy);
        if (reach.has(k) || !walkable(x + dx, y + dy)) continue;
        reach.add(k);
        q.push([x + dx, y + dy]);
      }
    }
  }
  // Somewhere the story is keeping clear for a scene (see keepOut in game.js): nobody walks into it or sits
  // down in it, and whoever is in it when it is set walks straight out (or, where nobody can see, is gone).
  const zone = (x, y) => !!(api.keepOut && api.keepOut(x, y));
  const ok = (x, y) => reach.has(key(x, y)) && !zone(x, y);
  const list = [];
  const kibble = []; // { x, y, born } in garden tiles (plate: one of the story's plates, not a pile)
  const KIBBLE_MAX = 8; // piles (and plates, and dropped meat) lying in the garden at once
  const gx = (p) => p.tx - GOX;
  const at = (tx, ty) => list.find((p) => p.tx === tx && p.ty === ty) || null;
  const taken = (x, y, me) => !!api.catAt(GOX + x, y) || list.some((p) => p !== me && p.tx === GOX + x && p.ty === y);
  const DOORS = [
    { name: 'Amber', tiles: [[ENTRANCE.doorX, ENTRANCE.y - 1], [ENTRANCE.doorX + 1, ENTRANCE.y - 1]] },
    { name: 'Garnet', tiles: [[GARNET.doorX, GARNET.y - 1], [GARNET.doorX + 1, GARNET.y - 1]] },
  ];
  // seats: [x, y, which way the sitter faces]
  const SEATS = {
    bench: BENCHES.flatMap(([x, y]) => [0, 1, 2].map((i) => [x + i, y, 'down'])),
    cafe: CAFE_SETS.flatMap(([x, y]) => [[x - 1, y, 'right'], [x + 1, y, 'left']]),
    bbq: TABLES.flatMap(([x, y]) => [0, 1, 2].flatMap((j) => [[x, y + j, 'right'], [x + 2, y + j, 'left']])),
  };

  function place(p, x, y) {
    Object.assign(p, { tx: GOX + x, ty: y, fx: GOX + x, fy: y, px: (GOX + x) * T, py: y * T, z: 0, moving: false, path: [], then: null, ride: null, seated: false });
  }
  // `around`: treat tiles somebody is standing on as blocked (to get past them)
  function route(p, goal, max = 5000, around = false) {
    const sx = gx(p);
    const sy = p.ty;
    if (sx === goal[0] && sy === goal[1]) return [];
    const prev = new Map([[key(sx, sy), null]]);
    const q = [[sx, sy]];
    for (let i = 0; i < q.length && i < max; i++) {
      const [x, y] = q[i];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        const k = key(nx, ny);
        if (prev.has(k) || !ok(nx, ny)) continue;
        if (around && taken(nx, ny, p) && !(nx === goal[0] && ny === goal[1])) continue;
        prev.set(k, [x, y]);
        if (nx === goal[0] && ny === goal[1]) {
          const out = [[nx, ny]];
          for (let n = prev.get(k); n && prev.get(key(n[0], n[1])); n = prev.get(key(n[0], n[1]))) out.unshift(n);
          return out;
        }
        q.push([nx, ny]);
      }
    }
    return null;
  }
  function step(p, x, y, dur) {
    const ox = gx(p);
    const oy = p.ty;
    p.fx = p.tx;
    p.fy = p.ty;
    p.tx = GOX + x;
    p.ty = y;
    p.dir = x > ox ? 'right' : x < ox ? 'left' : y > oy ? 'down' : 'up';
    p.md = dur;
    p.mt = 0;
    p.moving = true;
    p.steps++;
  }
  function go(p, path, then, fast = false) {
    p.path = path || [];
    p.then = then || null;
    p.fast = fast;
    p.wait = 0;
    p.seated = false;
  }
  function rest(p, frames, face) {
    p.timer = frames;
    if (face) p.dir = face;
  }
  const speed = (p) => (p.type === 'biker' ? 5 : p.fast ? (p.type === 'adult' ? 7 : 6) : p.type === 'adult' ? 12 : 10);
  // walk somewhere, then do something
  function walkTo(p, target, then, fast) {
    if (!target || !ok(target[0], target[1])) return false;
    const r = route(p, target);
    if (!r) return false;
    go(p, r, then, fast);
    return true;
  }
  // sit down on one of a set of seats for a while
  function sitAt(p, seats, frames) {
    for (let tries = 0; tries < 10; tries++) {
      const [sx, sy, face] = pick(seats);
      if (taken(sx, sy, p) || zone(sx, sy)) continue;
      const side = [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dx, dy]) => [sx + dx, sy + dy]).filter(([x, y]) => ok(x, y) && !taken(x, y, p));
      let best = null;
      for (const s of side) {
        const r = route(p, s);
        if (r && (!best || r.length < best.length)) best = r;
      }
      if (!best) continue;
      go(p, [...best, [sx, sy]], () => {
        p.seated = true;
        rest(p, frames, face);
      });
      p.seat = [sx, sy];
      return true;
    }
    return false;
  }
  const spot = (x0, y0, x1, y1) => [x0 + rnd(x1 - x0 + 1), y0 + rnd(y1 - y0 + 1)];
  // (somewhere on the boardwalk's three rows; where a tile of hedge joins two sections of the garden-side
  // hedge, the third row is not boardwalk)
  const boardwalk = (x) => {
    const y = 14 + northShift(x) + rnd(3);
    return [x, groundAt(x, y) === 'board' ? y : y - 1];
  };

  // --- rides for kids: [px, py, z, frames, dir]
  const X = (x) => (GOX + x) * T;
  function ride(p, steps, end, face) {
    p.ride = { t: 0, steps, end, face, from: [p.px, p.py, p.z || 0] };
    p.front = 60;
    p.moving = false;
  }
  function advance(p) {
    const r = p.ride;
    let t = r.t++;
    let prev = r.from;
    for (const st of r.steps) {
      if (t < st[3]) {
        const k = t / st[3];
        p.px = lerp(prev[0], st[0], k);
        p.py = lerp(prev[1], st[1], k);
        p.z = lerp(prev[2], st[2], k);
        if (st[4]) p.dir = st[4];
        p.anim = st[0] !== prev[0] || st[1] !== prev[1] || st[2] !== prev[2];
        return;
      }
      t -= st[3];
      prev = st;
    }
    let [ex, ey] = r.end;
    if (taken(ex, ey, p)) {
      const alt = [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0]].map(([dx, dy]) => [ex + dx, ey + dy]).find(([x, y]) => ok(x, y) && !taken(x, y, p));
      if (alt) [ex, ey] = alt;
    }
    place(p, ex, ey);
    p.front = 0;
    p.anim = false;
    p.dir = r.face || 'down';
    rest(p, 40 + rnd(80));
  }

  // --- what adults do
  const adultActs = {
    stroll(p) {
      // three ideas for where to wander; usually the nearest wins
      const ideas = [0, 1, 2].map(() => pick([
        () => boardwalk(-8 + rnd(120)), () => spot(0, 20, 19, 33), () => spot(29, 19, 68, 33), () => spot(92, 22, 110, 27),
        () => spot(-8, PAVE_S, 128, PAVE_S + 2), () => spot(-12, 26, -1, 33), () => spot(112, 21, 127, 24), () => spot(73, 26, 90, 33),
      ])()).sort((a, b) => Math.abs(a[0] - gx(p)) + Math.abs(a[1] - p.ty) - Math.abs(b[0] - gx(p)) - Math.abs(b[1] - p.ty));
      const where = chance(0.75) ? ideas[0] : ideas[2];
      return walkTo(p, where, () => rest(p, 120 + rnd(360), pick(['down', 'left', 'right', 'up'])));
    },
    bench: (p) => sitAt(p, SEATS.bench, 700 + rnd(1400)),
    cafe: (p) => sitAt(p, SEATS.cafe, 900 + rnd(1800)),
    bbq(p) {
      // cook at the shed's counter, or sit down at one of the tables
      if (chance(0.4)) return walkTo(p, [SHED.x + 1 + rnd(SHED.w - 2), SHED.y + 2], () => rest(p, 500 + rnd(900), 'up'));
      return sitAt(p, SEATS.bbq, 800 + rnd(1500));
    },
    river(p) {
      const t = chance(0.3) ? [17 + rnd(14), 9] : [-8 + rnd(110), 14];
      if (t[1] === 14) t[1] += northShift(t[0]);
      return walkTo(p, t, () => rest(p, 400 + rnd(700), 'up'));
    },
    // a run along the boardwalk and back
    jog(p) {
      const a = -8 + rnd(60);
      const b = a + 40 + rnd(60);
      const ends = chance(0.5) ? [a, b] : [b, a];
      let laps = 1 + rnd(2);
      const leg = (i) => () => {
        if (i >= ends.length * laps) return rest(p, 100 + rnd(100));
        const x = Math.min(116, ends[i % 2]);
        if (!walkTo(p, [x, 15 + northShift(x)], leg(i + 1), true)) rest(p, 60);
      };
      leg(0)();
      return true;
    },
    // leave a little pile of kibble for the cats (kind people only)
    feed(p) {
      if (!p.friendly || kibble.length >= KIBBLE_MAX) return false;
      // somewhere near a cat if there is one about, otherwise by the BBQ shed
      const cats = [...api.strays().filter((n) => !n.hidden).map((n) => [n.tx - GOX, n.ty]), ...api.cats().map((c) => [c.tx - GOX, c.ty])];
      for (let tries = 0; tries < 14; tries++) {
        const c = cats.length && chance(0.8) ? pick(cats) : [SHED.x + rnd(SHED.w), SHED.y - 3];
        const x = c[0] + rnd(9) - 4;
        const y = c[1] + rnd(7) - 3;
        const g = groundAt(x, y);
        if (!ok(x, y) || g === 'road' || g === 'curb' || gardenPerch(x, y) || taken(x, y, p) || kibble.some((k) => k.x === x && k.y === y)) continue;
        const side = [[0, 1], [1, 0], [-1, 0], [0, -1]].map(([dx, dy]) => [x + dx, y + dy]).find(([a, b]) => ok(a, b) && !taken(a, b, p));
        if (!side) continue;
        return walkTo(p, side, () => {
          p.dir = x > side[0] ? 'right' : x < side[0] ? 'left' : y > side[1] ? 'down' : 'up';
          p.pause = 70; // crouching down
          p.then = () => {
            if (kibble.length < KIBBLE_MAX && !taken(x, y, p) && !kibble.some((k) => k.x === x && k.y === y)) {
              kibble.push({ x, y, born: api.clock() });
              if (api.visible(p.px, p.py)) {
                api.sfx.blip();
                api.say(fill(pick(LINES.drop), p));
              }
            }
            rest(p, 90);
          };
        });
      }
      return false;
    },
    home(p) {
      useDoor(p);
      const door = DOORS[p.door].tiles[rnd(2)];
      return walkTo(p, door, () => {
        p.leaving = 16;
      });
    },
  };
  // --- what kids on foot do
  const kidActs = {
    run: (p) => walkTo(p, spot(29, 19, 68, 33), () => rest(p, 40 + rnd(120)), true),
    sit: (p) => sitAt(p, SEATS.bench.filter(([x]) => x > 30), 300 + rnd(500)),
    slide(p) {
      return walkTo(p, [SLIDE.x - 1, SLIDE.y], () => {
        const endX = SLIDE.x + 7;
        if (taken(endX, SLIDE.y, p)) return rest(p, 60);
        const y = SLIDE.y * T;
        ride(p, [[X(SLIDE.x), y, 0, 10, 'right'], [X(SLIDE.x), y, 22, 20, 'up'], [X(SLIDE.x + 1) + 4, y, 24, 10, 'right'], [X(SLIDE.x + 5) + 8, y, 6, 20, 'right'], [X(endX), y, 0, 8, 'right']], [endX, SLIDE.y], 'right');
      }, true);
    },
    // hand over hand along the monkey bars
    bars(p) {
      const west = chance(0.5);
      const from = west ? BARS.x : BARS.x + BARS.w - 1;
      const to = west ? BARS.x + BARS.w - 1 : BARS.x;
      const d = west ? 1 : -1;
      return walkTo(p, [from - d, BARS.y], () => {
        if (taken(to + d, BARS.y, p)) return rest(p, 60);
        const y = BARS.y * T;
        const face = west ? 'right' : 'left';
        ride(p, [[X(from), y, 0, 8, face], [X(from), y, 8, 12, 'up'], [X(to), y, 8, 70, face], [X(to + d), y, 0, 10, face]], [to + d, BARS.y], face);
      }, true);
    },
    net(p) {
      const foot = [NET.mast[0][0] + rnd(2), NET.mast[0][1] + 1];
      return walkTo(p, foot, () => ride(p, [[NET.cx - 8 + GOX * T, NET.mast[0][1] * T, 4, 8, 'up'], [NET.cx - 8 + GOX * T, NET.mast[0][1] * T, 26, 30, 'up'], [NET.cx - 8 + GOX * T, NET.mast[0][1] * T, 26, 100 + rnd(100), 'down'], [NET.cx - 8 + GOX * T, NET.mast[0][1] * T, 4, 22, 'up'], [X(foot[0]), foot[1] * T, 0, 8, 'down']], foot, 'down'), true);
    },
  };
  // --- kids on bikes: laps of the yard beside the cafe
  const LOOPS = [
    [[1, 21], [18, 21], [18, 32], [1, 32]],
    [[3, 23], [13, 23], [13, 30], [3, 30]],
    [[2, 20], [9, 26], [17, 20], [17, 31], [9, 27], [2, 31]],
  ];
  function lap(p) {
    const loop = LOOPS[p.loop];
    p.leg = (p.leg + p.way + loop.length) % loop.length;
    if (!walkTo(p, loop[p.leg], () => (chance(0.12) ? rest(p, 60 + rnd(120)) : lap(p)))) rest(p, 40);
  }

  function next(p) {
    const hr = api.hour();
    if (p.leaving) return;
    if (p.type !== 'adult') {
      if (hr >= p.leaveAt || hr < 6) return adultActs.home(p) || rest(p, 60);
      if (p.type === 'biker') return lap(p);
      const acts = Object.keys(kidActs);
      for (let i = 0; i < 4; i++) if (kidActs[pick(acts)](p)) return;
      return rest(p, 80);
    }
    const [wantAdults] = crowdAt(hr);
    const adults = list.filter((q) => q.type === 'adult').length;
    const habits = { ...HABITS[slotOf(hr)] };
    // more of them head home when the garden is fuller than the hour calls for
    habits.home *= adults > wantAdults ? 1 + (adults - wantAdults) * 1.5 : adults < wantAdults ? 0.3 : 1;
    if (hr >= 23.4 || hr < 6) return adultActs.home(p) || rest(p, 60);
    if (!p.friendly) delete habits.feed;
    const names = Object.keys(habits);
    const total = names.reduce((a, n) => a + habits[n], 0);
    for (let tries = 0; tries < 4; tries++) {
      let r = Math.random() * total;
      const a = names.find((n) => (r -= habits[n]) < 0) || names[0];
      if (adultActs[a](p)) return;
    }
    rest(p, 100 + rnd(200));
  }

  // --- making people
  function make(type) {
    const kid = type !== 'adult';
    const look = makeLook(kid);
    const hr = api.hour();
    const p = {
      kind: 'person', type, look, sp: makeHuman(look.pal, look.longHair, { coat: look.coat, scale: look.scale }),
      who: look.noun + ' ' + (type === 'biker' ? 'on a ' : look.wear), friendly: allKind() || chance(0.65),
      tx: 0, ty: 0, fx: 0, fy: 0, px: 0, py: 0, z: 0, dir: 'down', moving: false, mt: 0, md: 14, steps: 0,
      path: [], then: null, timer: 30 + rnd(120), wait: 0, pause: 0, ride: null, seated: false, fast: false, anim: false, front: 0,
      door: rnd(2), leaving: 0, arriving: 0, li: 0,
      // kids are out for an hour or three, and all home by eight
      leaveAt: Math.min(20, Math.max(hr, 15) + 1 + Math.random() * 3),
    };
    if (type === 'biker') {
      const b = pick(BIKE_COLOURS);
      p.bike = bikeSprites(b[1]);
      p.who += b[0] + ' bike';
      p.loop = rnd(LOOPS.length);
      p.leg = rnd(LOOPS[p.loop].length);
      p.way = chance(0.5) ? 1 : -1;
    }
    p.tall = p.sp.stand.down.height;
    return p;
  }
  // a building whose doors the story is keeping clear is not come out of or gone home by: the other one's are used
  const shut = (d) => DOORS[d].tiles.some(([x, y]) => zone(x, y));
  function useDoor(p) {
    if (shut(p.door) && !shut(1 - p.door)) p.door = 1 - p.door;
  }
  function add(type, atDoor) {
    const p = make(type);
    if (atDoor) {
      useDoor(p);
      if (shut(p.door)) return null;
      const d = DOORS[p.door].tiles.find(([x, y]) => !taken(x, y, p));
      if (!d) return null;
      place(p, d[0], d[1]);
      p.dir = 'up';
      p.arriving = 16;
    } else {
      // already out and about: start them somewhere sensible, away from the lobby
      for (let tries = 0; tries < 40; tries++) {
        const t = type === 'biker' ? LOOPS[p.loop][rnd(LOOPS[p.loop].length)] : type === 'kid' ? spot(29, 19, 68, 33)
          : pick([() => boardwalk(-8 + rnd(120)), () => spot(0, 20, 19, 33), () => spot(29, 19, 68, 33), () => spot(92, 22, 110, 27), () => spot(40, PAVE_S, 128, PAVE_S + 2), () => spot(-12, 26, -1, 33)])();
        if (!ok(t[0], t[1]) || taken(t[0], t[1], p) || Math.abs(t[0] - START[0][0]) + Math.abs(t[1] - START[0][1]) < 14) continue;
        place(p, t[0], t[1]);
        break;
      }
      if (!p.tx) return null;
    }
    list.push(p);
    return p;
  }
  // how many should be about now: half as many while there are dogs in the garden
  // (and nobody at all on the night the story empties the garden)
  const crowdNow = () => crowdAt(api.hour()).map((n) => (api.quiet && api.quiet() ? 0 : api.dogs && api.dogs() ? Math.ceil(n / 2) : n));
  function newVisit() {
    list.length = 0;
    kibble.length = 0;
    const [a, k, b] = crowdNow();
    for (let i = 0; i < a; i++) add('adult', false);
    for (let i = 0; i < k; i++) add('kid', false);
    for (let i = 0; i < b; i++) add('biker', false);
    // most of them are in the middle of something: let them get on with it
    for (const p of list) if (p.type === 'adult' && chance(0.6)) seatNow(p);
  }
  // put someone straight into a seat (used when the garden is first filled)
  function seatNow(p) {
    const hr = api.hour();
    const seats = hr >= 16 && chance(0.4) ? SEATS.bbq : chance(0.5) ? SEATS.cafe : SEATS.bench;
    for (let i = 0; i < 8; i++) {
      const [x, y, face] = pick(seats);
      if (taken(x, y, p) || zone(x, y) || Math.abs(x - START[0][0]) + Math.abs(y - START[0][1]) < 12) continue;
      place(p, x, y);
      p.seated = true;
      p.seat = [x, y];
      rest(p, 300 + rnd(1200), face);
      return;
    }
  }
  function clear() {
    list.length = 0;
    kibble.length = 0;
  }
  const fill = (text, p) => text.replaceAll('{W}', 'The ' + p.who).replaceAll('{w}', 'the ' + p.who);

  // Somebody eating at a BBQ table, with one of the pair close by, may let a bit of meat fall: once a
  // sitting, kind people only. It lies like kibble, and the pair eat it even after they're adopted.
  const BBQ_SEATS = new Set(SEATS.bbq.map(([x, y]) => x + ',' + y));
  function tableDrops() {
    for (const p of list) {
      if (!p.seated || !p.friendly || !p.seat || !BBQ_SEATS.has(p.seat.join()) || p.dropped === p.seat.join()) continue;
      const cat = api.cats().find((c) => Math.abs(c.tx - p.tx) + Math.abs(c.ty - p.ty) <= 2);
      if (!cat || !chance(0.25) || kibble.length >= KIBBLE_MAX) continue;
      p.dropped = p.seat.join();
      const spots = [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1]].map(([dx, dy]) => [gx(p) + dx, p.ty + dy]);
      const s = spots.find(([x, y]) => ok(x, y) && !gardenPerch(x, y) && !taken(x, y, p) && !kibble.some((k) => k.x === x && k.y === y));
      if (!s) continue;
      kibble.push({ x: s[0], y: s[1], born: api.clock(), meat: true });
      if (api.visible(p.px, p.py)) {
        api.sfx.blip();
        api.say(fill(pick(LINES.meat), p));
      }
    }
  }

  // Out of a place the story is keeping clear. hard: this instant, seen or not (the screen is black).
  function clearZones(hard) {
    if (!api.keepOut) return;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      if (p.leaving > 0 || p.arriving > 0) continue;
      const here = zone(gx(p), p.ty) || (p.moving && zone(p.fx - GOX, p.fy));
      if (!here) {
        // (on the way into it: think again)
        if (p.path.some(([x, y]) => zone(x, y))) go(p, [], null);
        continue;
      }
      if (hard || !api.visible(p.px, p.py)) {
        list.splice(i, 1);
        continue;
      }
      if (p.fleeing || p.ride) continue;
      // the nearest tile outside it, by the way a person walks (through the zone itself, this once)
      const prev = new Map([[key(gx(p), p.ty), null]]);
      const q = [[gx(p), p.ty]];
      let end = null;
      for (let j = 0; j < q.length && j < 3000 && !end; j++) {
        const [x, y] = q[j];
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const k = key(x + dx, y + dy);
          if (prev.has(k) || !reach.has(k)) continue;
          prev.set(k, [x, y]);
          if (!zone(x + dx, y + dy) && !taken(x + dx, y + dy, p)) { end = [x + dx, y + dy]; break; }
          q.push([x + dx, y + dy]);
        }
      }
      if (!end) { list.splice(i, 1); continue; }
      const path = [end];
      for (let n = prev.get(key(end[0], end[1])); n && prev.get(key(n[0], n[1])); n = prev.get(key(n[0], n[1]))) path.unshift(n);
      p.fleeing = true;
      go(p, path, () => { p.fleeing = false; rest(p, 200 + rnd(300)); }, true);
    }
  }

  function update(frame) {
    if (frame % 20 === 0) clearZones(false);
    // top the crowd up through the doors as the day goes on
    if (frame % 240 === 0) {
      const want = crowdNow();
      ['adult', 'kid', 'biker'].forEach((type, i) => {
        if (list.filter((p) => p.type === type).length < want[i] && chance(0.7)) add(type, true);
      });
    }
    if (frame % 30 === 0) tableDrops();
    // kibble nobody has eaten goes after twelve hours
    for (let i = kibble.length - 1; i >= 0; i--) if (!kibble[i].keep && api.clock() - kibble[i].born > 720) kibble.splice(i, 1);
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      if (p.arriving > 0) {
        p.arriving--;
        continue;
      }
      if (p.leaving > 0) {
        if (--p.leaving === 0) list.splice(i, 1);
        continue;
      }
      if (p.ride) {
        advance(p);
        continue;
      }
      if (p.moving) {
        p.mt++;
        const t = Math.min(1, p.mt / p.md);
        p.px = lerp(p.fx, p.tx, t) * T;
        p.py = lerp(p.fy, p.ty, t) * T;
        if (p.mt >= p.md) p.moving = false;
        continue;
      }
      if (p.pause > 0) {
        p.pause--;
        continue;
      }
      if (p.path.length) {
        const [x, y] = p.path[0];
        if (taken(x, y, p)) {
          // two people walking straight at each other simply pass
          const other = list.find((q) => q !== p && q.tx === GOX + x && q.ty === y);
          if (other && !other.moving && !other.pause && !other.ride && other.path.length && other.path[0][0] === gx(p) && other.path[0][1] === p.ty) {
            const ox = gx(p);
            const oy = p.ty;
            p.path.shift();
            other.path.shift();
            step(p, x, y, speed(p));
            step(other, ox, oy, speed(other));
            p.wait = other.wait = 0;
            continue;
          }
          // otherwise: a bike rings its bell; everyone waits a moment, then goes round
          if (p.wait === 0 && p.type === 'biker' && api.visible(p.px, p.py)) {
            api.bubble(p, 'Ring!', 40);
            api.sfx.beep();
          }
          p.wait++;
          if (p.wait === 30 || p.wait === 90) {
            const goal = p.path[p.path.length - 1];
            const then = p.then;
            const r = route(p, goal, 5000, true);
            if (r && r.length) {
              go(p, r, then, p.fast);
              p.wait = 31;
            }
          } else if (p.wait > 170) {
            p.path = [];
            p.then = null;
            rest(p, 30 + rnd(60));
          }
          continue;
        }
        p.wait = 0;
        p.path.shift();
        step(p, x, y, speed(p));
        continue;
      }
      if (p.then) {
        const f = p.then;
        p.then = null;
        f();
        continue;
      }
      if (--p.timer <= 0) next(p);
    }
  }

  // Shark or Orca has walked into somebody
  function interact(cat, tx, ty) {
    const p = at(tx, ty);
    if (!p || p.ride) return false;
    if (allKind()) p.friendly = true; // (somebody who was already about when the story ended)
    p.pause = 150;
    if (!p.seated) p.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[cat.dir];
    const set = p.type === 'biker' ? (p.friendly ? 'bikeKind' : 'bikeMean') : p.type === 'kid' ? (p.friendly ? 'kidKind' : 'kidMean') : p.friendly ? (p.seated ? 'adultKindSeated' : 'adultKind') : 'adultMean';
    const lines = LINES[set];
    api.say(api.fmt(fill(lines[p.li++ % lines.length], p), cat));
    if (p.friendly) {
      api.bubble(p, '♥', 80);
      api.sfx.purr();
      api.act(cat, 'purr', 80);
    } else {
      api.bubble(p, p.type === 'adult' ? 'Shoo!' : '!', 70);
      api.sfx.startle();
      for (const c of api.cats()) api.bubble(c, '!', 50);
      api.bolt(tx, ty);
    }
    return true;
  }

  // which pictures to draw: parts of [image, sx, sy, sw, sh, dx, dy], with
  // (dx, dy) measured from the top-left of the tile the person is on
  function parts(p, frame) {
    const sp = p.sp;
    const body = p.anim ? sp.walk[p.dir][(frame >> 3) & 1] : p.moving ? sp.walk[p.dir][(Math.floor((p.mt * 2) / p.md) + p.steps) % 2] : sp.stand[p.dir];
    const h = body.height;
    const w = body.width;
    if (p.type === 'biker') {
      // the bike, with the rider's top half above the saddle
      const side = p.dir === 'left' || p.dir === 'right';
      const bike = side ? p.bike[p.dir] : p.bike.front;
      const top = Math.round(h * 0.62);
      return [[bike, 0, 0, bike.width, bike.height, side ? -7 : 0, 0], [sp.stand[p.dir], 0, 0, w, top, 8 - (w >> 1), 8 - top]];
    }
    if (p.seated) {
      const top = Math.round(h * 0.7);
      return [[sp.stand[p.dir], 0, 0, w, top, 8 - (w >> 1), 10 - top]];
    }
    return [[body, 0, 0, w, h, 8 - (w >> 1), 15 - h]];
  }

  const kibbleAt = (x, y) => kibble.find((k) => k.x === x && k.y === y) || null;
  const eat = (k) => {
    const i = kibble.indexOf(k);
    if (i >= 0) kibble.splice(i, 1);
  };

  return { list, kibble, at, update, interact, newVisit, clear, clearZones, parts, kibbleAt, eat, add, crowdAt, adultActs, kidActs, place };
}
