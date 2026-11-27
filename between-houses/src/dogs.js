// The dogs in the garden (Act 3).
//
// They walk their beats by day and by night: round the lawns, along the
// boardwalk, up and down the building-side pavement. Each has a ring on the
// ground around it: a cat that is not hidden and comes inside it is noticed
// ("!", a bark), and the dog comes for the pair, a little slower than a cat
// that runs. A cat in a bush or up a tree is hidden: a dog that had noticed
// it comes to the spot and waits a while, then gives up. A dog that reaches
// the leader starts a fight (with any other dog close by that has noticed
// them, three at the most). Beaten, they back off for the rest of the day or
// the night; if the cats lose, they bolt for the nearest bush, badly hurt
// (see afterFight in game.js). No dog is ever hurt.
//
// All positions here are garden tiles (x may be negative, see garden.js); the
// entities themselves live in the game's world space, GOX tiles to the east.
import { GX0, GX1, GH, PAVE_S, PLANT_S, KERB_S, ROAD, START, ENTRANCE, GARNET, AC_UNITS, gardenBlocked, gardenPerch, isBush, onCrossing } from './garden.js';
import { makeDog, DOG_PALS } from './sprites.js';

const T = 16;
const rnd = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rnd(a.length)];
const lerp = (a, b, t) => a + (b - a) * t;
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// ---------------------------------------------------------------- numbers
export const DOGS = {
  ring: 56, // how far a dog notices a cat: pixels (three and a half tiles)
  walk: 16, // frames a tile on its beat (a cat walks at 11)
  chase: 8, // ...and when it is after somebody (a cat runs at 6)
  wait: [480, 600], // frames it waits at a hiding place before it gives up (8 to 10 seconds)
  pack: 6, // other dogs this near (tiles) that have noticed the cats join a fight
  most: 3, // dogs in one fight
  lose: 10, // tiles away at which a dog that is after the cats loses them
  pounce: 30, // frames between a dog noticing the pair and its catching them, if they are still in the open
  grace: 180, // frames after a fight in which no dog notices anything
  count: { garden: [6, 10], pave: [1, 2] }, // how many: [by day, after dark]
};

// what the game says about them (the story's own tip is the story's job)
export const DOG_WORDS = {
  seen: ["WOOF! A dog has seen {c}. It's coming this way!", 'A dog has spotted {c} and {o}. Here it comes!'],
  bush: ['The dog sniffs at the bush. {c} and {o} keep very still.', 'The dog knows they went in here somewhere. Sniff, sniff. Nobody breathes.'],
  tree: ["The dog stands under the tree and looks up. It can't climb.", "The dog looks up into the branches. {c} looks down. Dogs can't climb."],
  edge: ["The dog stops short and barks. It won't come any closer."],
  gaveUp: ['The dog gives up and wanders off.', 'The dog loses interest and trots away.'],
  lost: '{c} and {o} bolt for the nearest bush. The dogs lose them, but not before they take a beating.',
  lostNoBush: '{c} and {o} run for it. The dogs lose them, but not before they take a beating.',
};

// -------------------------------------------------------------- the ground
// the garden side: from the boardwalk down to the kerb of the road (the kerb itself too: a cat walking
// along the edge of the road is in plain sight, and a dog may come round the hedge for it)
const GARDEN_N = 14;
const GARDEN_S = ROAD.top - 3; // the last row of the garden proper, above the hedge
const gardenSide = (x, y) => y >= GARDEN_N && y < ROAD.top;
// the building side: the kerb, and the pavement between the road's hedge and the planting
const paveSide = (x, y) => y >= KERB_S && y < PLANT_S;
// The safe corner: Amber's doors and Mamacat's box, and the pavement between them. And Garnet's doors,
// with a good stretch of pavement on the side the dogs come from: one standing right by the two
// house cats on the step looked wrong.
const BOX = AC_UNITS[0];
const safe = (x, y) =>
  y >= KERB_S &&
  ((x >= ENTRANCE.doorX - 4 && x <= BOX.x + BOX.w + 9) || (x >= GARNET.doorX - 13 && x <= GARNET.doorX + GARNET.doorW + 5));
// the east end of the garden, from the lawn's big bushes to the wall: the BBQ shed and the way from it
// to Garnet's crossing (kept clear of dogs for the rest of the night once the pack there is beaten)
const eastEnd = (x, y) => x >= 84 && y < ROAD.top;
// where a cat can be seen, and where a dog that is after one may run
const sees = (x, y) => (gardenSide(x, y) || paveSide(x, y)) && !safe(x, y);
// where a dog walks its beat: not right where the crossings come out on the garden side
const landing = (x, y) => y >= GARDEN_S - 2 && [-2, -1, 0, 1, 2].some((d) => onCrossing(x + d));
const beatOk = (x, y) => sees(x, y) && !landing(x, y);
const sideOf = (x, y) => (paveSide(x, y) ? 'pave' : 'garden');

// Beats: the corners a dog walks between, over and over. loop: round and round; otherwise there and back.
// (A corner that is not free ground is moved to the nearest that is, so the map may change under these.)
const BEATS = {
  garden: [
    // (by day the first six are walked; after dark, all ten)
    { pts: [[28, 20], [60, 20], [60, 33], [28, 33]], loop: true }, // round the playground
    { pts: [[64, 22], [64, 33], [100, 33], [100, 28]], loop: true }, // the lawn, below the big bushes
    { pts: [[1, 20], [22, 20], [22, 29], [1, 29]], loop: true }, // the plaza by Amber's crossing (not right up to where it comes out)
    { pts: [[114, 19], [128, 19], [128, 33], [116, 33]], loop: true }, // the far east end
    { pts: [[48, 15], [112, 15]] }, // the boardwalk, east
    { pts: [[89, 27], [109, 27], [101, 33], [89, 33]], loop: true }, // round the BBQ shed
    { pts: [[-19, 19], [-5, 19], [-5, 32], [-19, 32]], loop: true }, // round the cafe
    { pts: [[-10, 15], [40, 15]] }, // the boardwalk, west
    { pts: [[-20, 20], [50, 20]] }, // along the benches, from the cafe to the playground
    { pts: [[24, 34], [104, 34]] }, // the path along the hedge by the road
  ],
  pave: [
    { pts: [[54, 51], [92, 51]] }, // (well short of Mamacat's box, where the cats keep together, and of Garnet's doors)
    { pts: [[92, 50], [44, 52]] },
  ],
};
const COATS = ['tan', 'black', 'patched'];

export function createDogs(api) {
  const GOX = api.GOX;
  const key = (x, y) => x + ',' + y;
  // every tile that can be walked to from the lobby door
  const reach = new Set();
  {
    const q = [START[0]];
    reach.add(key(...START[0]));
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of N4) {
        const k = key(x + dx, y + dy);
        if (reach.has(k) || x + dx < GX0 || x + dx > GX1 || y + dy < 0 || y + dy >= GH || gardenBlocked(x + dx, y + dy)) continue;
        reach.add(k);
        q.push([x + dx, y + dy]);
      }
    }
  }
  // ground a dog can stand on: never a bush (it only sniffs at those), never up on anything
  const ground = (x, y) => reach.has(key(x, y)) && !isBush(x, y) && !gardenPerch(x, y);

  const list = [];
  const sprites = {};
  const sheet = (coat) => sprites[coat] || (sprites[coat] = makeDog(DOG_PALS[coat] || DOG_PALS.tan));
  const gx = (d) => d.tx - GOX;
  const at = (tx, ty) => list.find((d) => d.tx === tx && d.ty === ty) || null;
  const catAt = (tx, ty) => api.cats().some((c) => c.tx === tx && c.ty === ty);
  const taken = (x, y, me) => catAt(GOX + x, y) || (api.blocked && api.blocked(GOX + x, y)) || list.some((d) => d !== me && d.tx === GOX + x && d.ty === y);
  const dark = () => api.hour() >= 18.5 || api.hour() < 6;
  const seenOnScreen = (d) => api.outside() && api.visible(d.px, d.py);

  // --- the rule for when they are out
  let mode = 'auto'; // 'auto': the story's rule. 'on' / 'off': told so (by a scene, or a test)
  let frozen = false;
  let fighting = false; // a fight has been asked for, and is not over yet
  let grace = 0;
  let saidAt = -9999;
  let wasDark = null;
  const beaten = { garden: 0, pave: 0 }; // seen off since the day (or the night) began
  // The story may keep the east end clear (see calmEast): no beat goes through it, nobody is put there,
  // and the pack that was beaten there is not made up for elsewhere.
  let calm = false;
  const CALM_FEWER = 3;
  const walkOk = (x, y) => beatOk(x, y) && !(calm && eastEnd(x, y));
  const out = () => {
    const s = api.story();
    if (s.flags.dogsGone) return false; // (the story has sent them away: only the story brings them back)
    if (mode !== 'auto') return mode === 'on';
    return s.mode === 'story' && s.act >= 3;
  };
  // (for the others in the garden: are there dogs about?)
  const about = () => out() || list.length > 0;

  // --- where the pair are, and whether they are hidden
  const hiding = () => {
    const t = api.treed();
    if (t) return { kind: 'tree', x: t[0], y: t[1] };
    const L = api.leader();
    const x = L.tx - GOX;
    return isBush(x, L.ty) ? { kind: 'bush', x, y: L.ty } : null;
  };
  // can this dog see the leader from where it stands?
  const inRing = (d, L, extra = 0) => {
    const dx = d.px - L.px;
    const dy = d.py - L.py;
    const r = DOGS.ring + extra;
    return dx * dx + dy * dy <= r * r;
  };
  const sight = (d) => {
    const L = api.leader();
    return !hiding() && sees(L.tx - GOX, L.ty) && inRing(d, L);
  };
  const tiles = (d, L) => Math.abs(d.tx - L.tx) + Math.abs(d.ty - L.ty);

  // --- making and placing
  const snap = (x, y, ok, me) => {
    for (let r = 0; r <= 5; r++)
      for (let oy = -r; oy <= r; oy++)
        for (let ox = -r; ox <= r; ox++) {
          if (Math.max(Math.abs(ox), Math.abs(oy)) !== r) continue;
          if (ground(x + ox, y + oy) && ok(x + ox, y + oy) && !taken(x + ox, y + oy, me)) return [x + ox, y + oy];
        }
    return null;
  };
  function place(d, x, y) {
    Object.assign(d, { tx: GOX + x, ty: y, fx: GOX + x, fy: y, px: (GOX + x) * T, py: y * T, moving: false, path: [] });
  }
  function add(x, y, opts = {}) {
    const coat = opts.coat || COATS[list.length % COATS.length];
    const d = {
      kind: 'dog', coat, sp: sheet(coat), side: opts.side || sideOf(x, y), put: !!opts.put, still: !!opts.still,
      beat: opts.beat || null, bi: 0, bd: 1,
      tx: 0, ty: 0, fx: 0, fy: 0, px: 0, py: 0, z: 4, dir: opts.dir || 'down', hd: opts.dir === 'right' ? 'right' : 'left',
      moving: false, mt: 0, md: DOGS.walk, pose: 'stand', path: [], state: 'roam', pause: 20 + rnd(60), timer: 0, blind: 0, stuck: 0, spot: null,
    };
    place(d, x, y);
    list.push(d);
    return d;
  }
  const remove = (d) => {
    const i = list.indexOf(d);
    if (i >= 0) list.splice(i, 1);
  };

  // --- getting about
  // The way from where the dog is towards (x, y): to that tile if it can be reached, and otherwise to the
  // nearest tile to it that can. ok: the ground it may use. Returns [] when it is as near as it can get.
  function route(d, x, y, ok, max = 1400) {
    const sx = gx(d);
    const sy = d.ty;
    const far = (a, b) => Math.abs(a - x) + Math.abs(b - y);
    const prev = new Map([[key(sx, sy), null]]);
    const q = [[sx, sy, 0]];
    let best = [sx, sy];
    let bestD = far(sx, sy) * 1000;
    for (let i = 0; i < q.length && i < max; i++) {
      const [cx, cy, n] = q[i];
      const score = far(cx, cy) * 1000 + n;
      if (score < bestD) {
        bestD = score;
        best = [cx, cy];
        if (cx === x && cy === y) break;
      }
      for (const [dx, dy] of N4) {
        const nx = cx + dx;
        const ny = cy + dy;
        const k = key(nx, ny);
        if (prev.has(k) || !ground(nx, ny) || !ok(nx, ny) || taken(nx, ny, d)) continue;
        prev.set(k, [cx, cy]);
        q.push([nx, ny, n + 1]);
      }
    }
    const path = [];
    for (let p = best; p && prev.get(key(p[0], p[1])); p = prev.get(key(p[0], p[1]))) path.unshift(p);
    return path;
  }
  function step(d, x, y, dur) {
    d.fx = d.tx;
    d.fy = d.ty;
    d.dir = x > gx(d) ? 'right' : x < gx(d) ? 'left' : y > d.ty ? 'down' : 'up';
    if (d.dir === 'left' || d.dir === 'right') d.hd = d.dir;
    d.tx = GOX + x;
    d.ty = y;
    d.md = dur;
    d.mt = 0;
    d.moving = true;
    d.pose = 'stand';
  }
  // turn to look at a tile
  function face(d, x, y) {
    const dx = x - gx(d);
    const dy = y - d.ty;
    d.dir = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    if (dx) d.hd = dx > 0 ? 'right' : 'left';
  }
  const say = (lines, frame, gap = 420) => {
    if (frame - saidAt < gap) return;
    saidAt = frame;
    api.say(api.fmt(typeof lines === 'string' ? lines : pick(lines), api.leader()));
  };

  // --- what a dog does
  function notice(d, frame) {
    const L = api.leader();
    d.state = 'chase';
    d.path = [];
    d.spot = null;
    d.far = 0;
    d.pose = 'bark';
    d.pause = DOGS.pounce; // (half a second: time to dive into a bush that is right there, and no more)
    face(d, L.tx - GOX, L.ty);
    api.bubble(d, '!', 50);
    if (seenOnScreen(d)) {
      api.sfx.bark();
      say(DOG_WORDS.seen, frame);
    }
  }
  function giveUp(d, frame, quiet) {
    d.state = 'roam';
    d.path = [];
    d.spot = null;
    d.pose = 'stand';
    d.pause = 30;
    d.blind = 90;
    if (!quiet && seenOnScreen(d)) say(DOG_WORDS.gaveUp, frame, 200);
    // off the way it came, away from where the cats went
    if (d.beat) {
      const L = api.leader();
      let far = -1;
      d.beat.pts.forEach(([x, y], i) => {
        const v = Math.abs(x - (L.tx - GOX)) + Math.abs(y - L.ty);
        if (v > far) {
          far = v;
          d.bi = i;
        }
      });
      d.bi = (d.bi - d.bd + d.beat.pts.length) % d.beat.pts.length; // (patrol() moves on to it)
    }
  }
  // next corner of its beat
  function patrol(d) {
    if (d.still || !d.beat) {
      d.pause = 60 + rnd(120);
      d.pose = pick(['stand', 'stand', 'look', 'sit']);
      return;
    }
    const pts = d.beat.pts;
    for (let tries = 0; tries < pts.length; tries++) {
      if (d.beat.loop) d.bi = (d.bi + d.bd + pts.length) % pts.length;
      else {
        if (d.bi + d.bd < 0 || d.bi + d.bd >= pts.length) d.bd = -d.bd;
        d.bi += d.bd;
      }
      const to = snap(pts[d.bi][0], pts[d.bi][1], walkOk, d);
      if (!to) continue;
      const path = route(d, to[0], to[1], walkOk, 5000);
      if (path.length) {
        d.path = path;
        return;
      }
    }
    d.pause = 90;
    d.pose = 'sit';
  }
  // at a corner: a look round, a sniff, a sit; or straight on
  function linger(d) {
    const r = Math.random();
    if (r < 0.35) {
      d.pose = 'look';
      d.pause = 40 + rnd(60);
      d.dir = pick(['left', 'right', 'up']);
      if (d.dir !== 'up') d.hd = d.dir;
    } else if (r < 0.6) {
      d.pose = 'sniff';
      d.pause = 60 + rnd(60);
    } else if (r < 0.75) {
      d.pose = 'sit';
      d.pause = 120 + rnd(200);
      d.dir = pick(['down', 'left', 'right']);
      if (d.dir !== 'down') d.hd = d.dir;
    } else d.pause = 8;
  }

  function roam(d, frame) {
    if (!d.blind && !grace && sight(d)) return notice(d, frame);
    if (d.pause > 0) {
      d.pause--;
      return;
    }
    if (d.nose) {
      d.nose = false;
      d.pose = 'sniff';
      d.pause = 40 + rnd(40);
      return;
    }
    if (d.path.length) {
      const [x, y] = d.path[0];
      if (!taken(x, y, d)) {
        d.path.shift();
        d.stuck = 0;
        step(d, x, y, DOGS.walk);
        if (!d.path.length) d.arrived = true;
        else if (Math.random() < 0.03) d.nose = true; // (something on the ground here)
      } else if (++d.stuck > 50) {
        d.stuck = 0;
        d.path = [];
      }
      return;
    }
    if (d.arrived) {
      d.arrived = false;
      linger(d);
      return;
    }
    patrol(d);
  }

  function chase(d, frame) {
    if (d.pause > 0) {
      d.pause--;
      if (d.pose === 'bark' && d.pause === 0) d.pose = 'stand';
      return;
    }
    const L = api.leader();
    const lx = L.tx - GOX;
    const h = hiding();
    const open = !h && sees(lx, L.ty);
    if (tiles(d, L) > DOGS.lose) return giveUp(d, frame);
    // Noticed, and still in the open when its bark is over: it has them. (There is no outrunning a dog.
    // The only way out is to be in a bush or up a tree before it gets going.)
    if (open) {
      face(d, lx, L.ty);
      if (api.free()) fight(d, frame);
      return;
    }
    // where it is making for: the leader; or the bush, the tree, the edge of the ground it keeps to
    const [gxT, gyT] = h ? [h.x, h.y] : [lx, L.ty];
    const path = route(d, gxT, gyT, sees);
    if (path.length) {
      d.far = 0;
      const [x, y] = path[0];
      // (the last step would be onto the spot itself: it stops beside it)
      if (x === gxT && y === gyT) path.length = 0;
      else return step(d, x, y, DOGS.chase);
    }
    if (open) {
      // in the open, and no way to them just now (somebody is in the way): wait for one
      if (++d.far > 240) giveUp(d, frame);
      return;
    }
    // as near as it can get: it waits
    d.state = 'wait';
    d.spot = h ? { ...h } : { kind: 'edge', x: lx, y: L.ty };
    d.timer = DOGS.wait[0] + rnd(DOGS.wait[1] - DOGS.wait[0]);
    d.wt = 0;
    face(d, gxT, gyT);
    if (seenOnScreen(d)) say(DOG_WORDS[d.spot.kind], frame, 0);
  }

  function wait(d, frame) {
    const L = api.leader();
    const h = hiding();
    // out they come, under its nose
    if (!h && sees(L.tx - GOX, L.ty) && inRing(d, L, 24)) {
      d.state = 'chase';
      d.pose = 'bark';
      d.pause = 20;
      d.far = 0;
      face(d, L.tx - GOX, L.ty);
      api.bubble(d, '!', 40);
      if (seenOnScreen(d)) api.sfx.bark();
      return;
    }
    if (--d.timer <= 0) return giveUp(d, frame);
    const s = d.spot;
    const t = d.wt++;
    face(d, s.x, s.y);
    if (s.kind === 'tree') {
      // looking up, with a bark now and then
      d.pose = t % 150 > 120 ? 'bark' : 'look';
      if (gx(d) === s.x) d.dir = 'up';
      if (t % 150 === 121 && seenOnScreen(d)) api.sfx.bark();
    } else if (s.kind === 'bush') {
      d.pose = t % 120 < 80 ? 'sniff' : 'look';
    } else {
      d.pose = t % 90 < 30 ? 'bark' : 'stand';
      if (t % 180 === 1 && seenOnScreen(d)) api.sfx.bark();
    }
  }

  function fight(d, frame) {
    const L = api.leader();
    const pack = list
      .filter((o) => o !== d && (o.state === 'chase' || o.state === 'wait') && Math.abs(o.tx - L.tx) + Math.abs(o.ty - L.ty) <= DOGS.pack)
      .sort((a, b) => tiles(a, L) - tiles(b, L));
    const them = [d, ...pack].slice(0, DOGS.most);
    for (const o of them) {
      o.moving = false;
      place(o, gx(o), o.ty);
      o.pose = 'bark';
      face(o, L.tx - GOX, L.ty);
    }
    fighting = true;
    api.fight(them.length, (result) => {
      fighting = false;
      grace = DOGS.grace;
      if (result === 'won') {
        // they back off, and stay away until the day (or the night) is over
        for (const o of them) {
          o.state = 'cowed';
          o.pose = 'cower';
          o.timer = 70;
          o.path = [];
          if (!o.put) beaten[o.side]++;
        }
        return;
      }
      // lost: the cats run for a bush, and every dog that was after them loses them
      for (const o of list) {
        if (o.state !== 'chase' && o.state !== 'wait') continue;
        giveUp(o, frame, true);
        o.blind = 600;
      }
      api.lost();
    });
  }

  // called off (by the story): it trots away, and is gone once nobody is looking
  function callOff(d) {
    if (d.state === 'cowed') return;
    if (!seenOnScreen(d)) return remove(d);
    Object.assign(d, { state: 'cowed', pose: 'stand', timer: 0, path: [], spot: null });
  }
  // beaten: a moment with its tail down, then away, and gone once nobody is looking
  function cowed(d) {
    if (d.timer > 0) {
      d.timer--;
      return;
    }
    if (!seenOnScreen(d)) return remove(d);
    if (d.path.length) {
      const [x, y] = d.path[0];
      if (!taken(x, y, d)) {
        d.path.shift();
        step(d, x, y, DOGS.chase);
      } else d.path = [];
      return;
    }
    // somewhere well away from the cats
    const L = api.leader();
    const lx = L.tx - GOX;
    for (let tries = 0; tries < 6; tries++) {
      const a = Math.random() * Math.PI * 2;
      const to = snap(Math.round(gx(d) + Math.cos(a) * 16), Math.round(d.ty + Math.sin(a) * 10), sees, d);
      if (!to || Math.abs(to[0] - lx) + Math.abs(to[1] - L.ty) < Math.abs(gx(d) - lx) + Math.abs(d.ty - L.ty) + 4) continue;
      const path = route(d, to[0], to[1], sees, 3000);
      if (path.length) {
        d.path = path;
        return;
      }
    }
    if (++d.stuck > 300) remove(d);
  }

  // --- how many there are
  function spawn(side) {
    const beats = BEATS[side];
    const used = (b) => list.filter((d) => d.beat === b).length;
    const order = beats.map((b, i) => [used(b), i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const L = api.leader();
    for (const [, i] of order) {
      const b = beats[i];
      for (let tries = 0; tries < 6; tries++) {
        const j = rnd(b.pts.length);
        const k = (j + 1) % b.pts.length;
        const t = Math.random();
        const to = snap(Math.round(lerp(b.pts[j][0], b.pts[k][0], t)), Math.round(lerp(b.pts[j][1], b.pts[k][1], t)), walkOk, null);
        if (!to) continue;
        // never where the player is looking, nor on top of the pair
        if (api.outside() && (api.visible((GOX + to[0]) * T, to[1] * T) || Math.abs(GOX + to[0] - L.tx) + Math.abs(to[1] - L.ty) < 9)) continue;
        const d = add(to[0], to[1], { side, beat: b });
        d.bi = j;
        d.bd = Math.random() < 0.5 ? 1 : -1;
        return d;
      }
    }
    return null;
  }
  function populate(all) {
    const dk = dark();
    if (dk !== wasDark) {
      wasDark = dk;
      beaten.garden = beaten.pave = 0;
    }
    const on = out();
    for (const side of ['garden', 'pave']) {
      const want = on ? Math.max(0, DOGS.count[side][dk ? 1 : 0] - beaten[side] - (calm && side === 'garden' ? CALM_FEWER : 0)) : 0;
      const mine = list.filter((d) => d.side === side && !d.put && d.state !== 'cowed');
      let have = mine.length;
      while (have < want) {
        if (!spawn(side)) break;
        have++;
        if (!all) break;
      }
      // called off: every one of them goes, the ones in sight at a trot
      if (!on) for (const d of mine) callOff(d);
      // too many (day has come): the ones nobody is watching go
      else
        for (const d of mine) {
          if (have <= want) break;
          if (seenOnScreen(d) || d.state === 'chase' || d.state === 'wait') continue;
          remove(d);
          have--;
        }
    }
  }

  // --- the pair's company gets into the bush behind the leader
  // The follower, and a friend who is along, each take a free bush tile within two of the leader. (The
  // friend would otherwise keep closing up on the follower: while the leader is in a bush it is given the
  // tile it is on to keep to instead, and its place in the line back when he comes out.)
  const stayAt = (tx, ty) => ({ stay: true, tx, ty, moving: false });
  function huddle(frame) {
    const L = api.leader();
    const [F, g] = api.company();
    const lx = L.tx - GOX;
    const hid = isBush(lx, L.ty);
    if (g && g.following && g.following.stay && !hid) api.heel(g, F || L);
    if (frame % 4 || !hid || L.moving || !api.free()) return;
    for (const m of [F, g]) {
      if (!m || m.moving || m.ride) continue;
      const mx = m.tx - GOX;
      const friend = m === g;
      if (isBush(mx, m.ty)) {
        // (a friend keeps still in the bush only while the pair are right beside it: when they move
        // on through a big bush it closes up behind them again, as it does in the open)
        const close = Math.abs(mx - lx) + Math.abs(m.ty - L.ty) <= 2;
        const staying = !!(m.following && m.following.stay);
        if (friend && close && !staying) api.heel(m, stayAt(m.tx, m.ty));
        else if (friend && !close && staying) api.heel(m, F || L);
        continue;
      }
      const good = (x, y) => isBush(x, y) && !taken(x, y, null) && Math.abs(x - lx) + Math.abs(y - L.ty) <= 2;
      // the nearest such tile, by a way that is clear: a few steps at the most
      const prev = new Map([[key(mx, m.ty), null]]);
      const q = [[mx, m.ty, 0]];
      let to = null;
      for (let i = 0; i < q.length && !to; i++) {
        const [cx, cy, n] = q[i];
        if (n >= 5) continue;
        for (const [dx, dy] of N4) {
          const x = cx + dx;
          const y = cy + dy;
          if (prev.has(key(x, y)) || gardenBlocked(x, y) || taken(x, y, null)) continue;
          prev.set(key(x, y), [cx, cy]);
          if (good(x, y)) {
            to = [x, y];
            break;
          }
          q.push([x, y, n + 1]);
        }
      }
      if (!to) continue;
      let first = to;
      for (let p = prev.get(key(to[0], to[1])); p && prev.get(key(p[0], p[1])); p = prev.get(key(p[0], p[1]))) first = p;
      if (friend) api.heel(m, stayAt(GOX + first[0], first[1]));
      api.shift(m, GOX + first[0], first[1]);
    }
  }

  // frozen: a scene is playing, so nobody decides anything; steps under way finish
  function update(frame, still) {
    const hold = still || frozen || fighting;
    if (!api.outside()) {
      // the pair have gone indoors: whoever was after them has lost them
      for (const d of list) if (d.state === 'chase' || d.state === 'wait') giveUp(d, frame, true);
      return;
    }
    if (!hold) {
      if (grace > 0) grace--;
      if (frame % 30 === 0) populate(true);
      if (about()) huddle(frame);
    }
    for (const d of [...list]) {
      if (d.moving) {
        d.mt++;
        const t = Math.min(1, d.mt / d.md);
        d.px = lerp(d.fx, d.tx, t) * T;
        d.py = lerp(d.fy, d.ty, t) * T;
        if (d.mt >= d.md) d.moving = false;
        continue;
      }
      if (hold) continue;
      if (d.blind > 0) d.blind--;
      if (d.state === 'chase') chase(d, frame);
      else if (d.state === 'wait') wait(d, frame);
      else if (d.state === 'cowed') cowed(d);
      else roam(d, frame);
    }
  }

  // --- drawing
  // the ring: a circle of dashes on the ground, as far as the dog notices
  // How far a dog notices: not a line on the ground but a faint pool of light round it, as a lamp
  // throws one, only fainter and blue; red from the moment it has noticed the pair. Whole pixels,
  // in three steps towards the middle.
  const disc = (g, x, y, r) => {
    for (let j = -r; j <= r; j++) {
      const half = Math.round(Math.sqrt(r * r - j * j));
      g.fillRect(x - half, y + j, half * 2 + 1, 1);
    }
  };
  // ...and its rim: the band between two radii, so that where the light ends can be told at a glance
  // (a band of the same light, a few pixels wide: still no line)
  const band = (g, x, y, r0, r1) => {
    for (let j = -r1; j <= r1; j++) {
      const outer = Math.round(Math.sqrt(r1 * r1 - j * j));
      const inner = Math.abs(j) < r0 ? Math.round(Math.sqrt(r0 * r0 - j * j)) : -1;
      if (inner < 0) g.fillRect(x - outer, y + j, outer * 2 + 1, 1);
      else {
        g.fillRect(x - outer, y + j, outer - inner, 1);
        g.fillRect(x + inner + 1, y + j, outer - inner, 1);
      }
    }
  };
  // Drawn twice: on the ground, under everybody; and, once it is getting dark, again over the dark
  // (night: how dark it is, 0 to 1), so that the pools can still be read after sunset.
  function drawRings(g, cx, cy, frame, night = 0) {
    for (const d of list) {
      if (d.state === 'cowed' || d.noRing) continue;
      const x = Math.round(d.px) + 8 - cx;
      const y = Math.round(d.py) + 8 - cy;
      const r = DOGS.ring;
      if (x < -r - 2 || y < -r - 2 || x > g.canvas.width + r + 2 || y > g.canvas.height + r + 2) continue;
      const hot = d.state === 'chase' || d.state === 'wait';
      // (it breathes a little, each dog out of step with the next)
      const breath = 0.85 + 0.15 * Math.sin((frame + list.indexOf(d) * 37) / 22);
      // (by day it has grass in full sun to show against, so it is laid on thicker than after dark)
      const a = (night ? 0.09 * night : 0.15) * (hot ? 1.4 : 1) * breath;
      g.fillStyle = hot ? '#ff5a4a' : night ? '#a8dcff' : '#4fb4ff';
      for (const k of [1, 0.74, 0.46]) {
        g.globalAlpha = a;
        disc(g, x, y, Math.round(r * k));
      }
      g.globalAlpha = a * (night ? 1.3 : 1.6);
      band(g, x, y, r - 5, r);
      g.globalAlpha = 1;
    }
  }
  function sprite(d, frame) {
    const sp = d.sp;
    if (d.moving) return sp.walk[d.dir][Math.floor((d.mt * 2) / d.md) % 2];
    if (d.pose === 'bark') return (frame >> 3) & 1 ? sp.bark[d.dir] : sp.stand[d.dir];
    // (these two are drawn from the side only)
    if (d.pose === 'sniff' || d.pose === 'cower') return sp[d.pose][d.dir === 'left' || d.dir === 'right' ? d.dir : d.hd || 'left'];
    return (sp[d.pose] || sp.stand)[d.dir] || sp.stand[d.dir];
  }
  function draw(g, d, cx, cy, frame) {
    const x = Math.round(d.px) - cx;
    const y = Math.round(d.py) - cy;
    g.fillStyle = 'rgba(30,20,20,0.22)';
    g.fillRect(x - 1, y + 12, 18, 3);
    g.drawImage(sprite(d, frame), x - 4, y - 8);
  }

  // --- for the story
  // A dog that a scene places and poses, and that is no part of the roaming: an extra like any other
  // (walk and face it by its id), with `pose` one of stand, sit, look, bark, sniff, cower.
  function actor(id, coat = 'tan') {
    return api.addExtra(id, 'Dog', sheet(coat), { low: true, dog: true, pose: 'stand', fast: 9 });
  }

  return {
    list,
    at,
    update,
    drawRings,
    draw,
    sprite,
    actor,
    get out() { return out(); },
    get about() { return about(); },
    // dogs from now on, whatever the story says (and all of them at once, out of sight)
    on() {
      mode = 'on';
      populate(true);
    },
    // none from now on: the ones out of sight go at once, the ones in sight trot away and notice nothing
    off() {
      mode = 'off';
      for (const d of [...list]) if (!d.put) callOff(d); // (not the ones the story has put somewhere by hand)
    },
    // back to the story's own rule (Act 3 on, and not while flags.dogsGone)
    auto() {
      mode = 'auto';
    },
    // every dog gone this instant, and none until told otherwise (on() or auto())
    clear() {
      mode = 'off';
      list.length = 0;
    },
    // nobody moves or notices anything while this is on
    freeze(v) {
      frozen = !!v;
    },
    // The east end kept clear of dogs (the story: the night the pack at the shed is beaten), or not.
    // The ones there now go: out of sight at once, in sight at a trot.
    calmEast(v) {
      if (calm === !!v) return;
      calm = !!v;
      if (calm) for (const d of [...list]) if (!d.put && eastEnd(gx(d), d.ty)) callOff(d);
    },
    // the roaming dogs within r tiles of a garden tile
    near: (x, y, r) => list.filter((d) => d.state !== 'cowed' && Math.max(Math.abs(gx(d) - x), Math.abs(d.ty - y)) <= r),
    // one roaming dog, put on a garden tile by hand. opts: { coat, still (it stays put), beat: [[x, y], ...], loop, dir }
    put(x, y, opts = {}) {
      const to = snap(x, y, () => true, null);
      if (!to) return null;
      return add(to[0], to[1], { ...opts, put: true, beat: opts.beat ? { pts: opts.beat, loop: !!opts.loop } : null, still: !!opts.still || !opts.beat });
    },
    debug: {
      DOGS, BEATS, sees, beatOk, walkOk, safe, eastEnd, hiding,
      get calm() { return calm; },
      get mode() { return mode; },
      get beaten() { return beaten; },
      get grace() { return grace; },
      set grace(v) { grace = v; },
      state: () => list.map((d) => ({ x: gx(d), y: d.ty, state: d.state, pose: d.pose, side: d.side, coat: d.coat, timer: d.timer })),
    },
  };
}
