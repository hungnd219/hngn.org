// The traffic on the road between the garden and the buildings: motorbikes,
// cars and box trucks, two lanes each way, thick at rush hour and thin in the
// small hours. They keep their distance from each other and wait at a
// crossing while a person (or one of the garden's own cats) is on it. They do
// not see Shark and Orca, or whoever is crossing with them. A vehicle that
// meets any one of the party knocks them all back the way they came, and
// stops for a moment itself.
//
// Positions are in garden pixels (tile x 16), without the game's GOX.
// api: { hour(), onZebra(c) -> is someone on the crossing that starts at column c?, honk(v) }
import { GX0, GX1, LANES, CROSSINGS, ROAD, vehicleSprite } from './garden.js';

const T = 16;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
// kind: [share of the traffic, length in pixels, slowest and fastest cruising speed in pixels a frame]
const KINDS = { bike: [0.55, 28, 2.3, 3.0], car: [0.35, 64, 1.9, 2.5], truck: [0.1, 96, 1.4, 1.8] };
const COLOURS = {
  car: [['#b64a3b', '#8f3a2f', '#d9705f'], ['#3f6fc4', '#2f559c', '#6f97dc'], ['#e9e4da', '#b9b3a8', '#ffffff'], ['#4a4652', '#2b2630', '#6e6a78'], ['#4f9442', '#3a6f31', '#7dbb6c'], ['#d8b23a', '#a8842a', '#efd27a']],
  truck: [['#c9c2b4', '#928c86', '#e6e0d2'], ['#d8b23a', '#a8842a', '#efd27a'], ['#5b7fa6', '#3f5f84', '#8fb0d2']],
  // rider's top, the bike, the helmet
  bike: [['#c0503f', '#3f6fc4', '#e9e4da'], ['#e9e4da', '#b64a3b', '#d8b23a'], ['#4f9442', '#4a4652', '#b64a3b'], ['#d8b23a', '#2b2630', '#3f6fc4'], ['#8a2b3f', '#928c86', '#2b2630'], ['#5b7fa6', '#d8b23a', '#e9e4da']],
};
// frames between vehicles in one lane, by hour: [from hour, shortest gap, longest gap]
const DENSITY = [[0, 800, 1700], [5, 420, 840], [7, 150, 300], [9, 240, 480], [16.5, 150, 300], [19, 320, 640], [22, 540, 1100]];
const QUEUE = 3; // the most vehicles that may stand waiting in one lane before no more are sent down it
const gapAt = (hr) => {
  let row = DENSITY[0];
  for (const d of DENSITY) if (hr >= d[0]) row = d;
  return rnd(row[1], row[2]);
};
const sprites = {};
function spriteFor(kind, colours, face) {
  const k = kind + colours.join() + face;
  return (sprites[k] = sprites[k] || vehicleSprite(kind, colours, face));
}

export function createTraffic(api) {
  const list = [];
  const next = LANES.map(() => rnd(20, 200)); // frames until each lane's next vehicle
  const WEST = GX0 * T;
  const EAST = GX1 * T;

  function spawn(lane) {
    let r = Math.random();
    const kind = Object.keys(KINDS).find((k) => (r -= KINDS[k][0]) < 0) || 'bike';
    const [, w, lo, hi] = KINDS[kind];
    const { y, dir } = LANES[lane];
    const x = dir < 0 ? EAST + 8 : WEST - w - 8;
    // not on top of the one that came before
    if (list.some((v) => v.lane === lane && Math.abs(v.x - x) < v.w + w + 24)) return false;
    const cruise = rnd(lo, hi);
    list.push({ kind, lane, y, dir, x, w, cruise, v: cruise, wait: 0, im: spriteFor(kind, pick(COLOURS[kind]), -dir) });
    return true;
  }
  // start with the road as busy as it would be at this hour
  function fill() {
    list.length = 0;
    if (api.quiet && api.quiet()) return;
    LANES.forEach((l, lane) => {
      for (let x = WEST + rnd(0, 300); x < EAST; x += gapAt(api.hour()) * 2.2) {
        if (!spawn(lane)) continue;
        list[list.length - 1].x = x;
      }
    });
  }

  function update() {
    const hr = api.hour();
    LANES.forEach((l, lane) => {
      if (--next[lane] > 0) return;
      // nothing new joins a lane that is already standing in a queue (or it would grow for as long as the hold-up lasts)
      const queued = list.filter((v) => v.lane === lane && v.v < 0.1).length;
      next[lane] = (api.quiet && api.quiet()) || queued >= QUEUE ? 60 : spawn(lane) ? gapAt(hr) : 30;
    });
    const busy = CROSSINGS.map((c) => api.onZebra(c));
    for (const v of list) {
      let want = v.cruise;
      if (v.wait > 0) {
        v.wait--;
        want = 0;
      }
      const nose = v.dir < 0 ? v.x : v.x + v.w;
      // the one in front, in this lane
      let room = Infinity;
      for (const o of list) {
        if (o === v || o.lane !== v.lane) continue;
        const gap = v.dir < 0 ? v.x - (o.x + o.w) : o.x - (v.x + v.w);
        if (gap > -8 && gap < room) room = gap;
      }
      // a crossing with somebody on it: wait at the line before it
      CROSSINGS.forEach((c, i) => {
        if (!busy[i]) return;
        const line = v.dir < 0 ? (c + 5) * T : (c - 1) * T;
        const gap = v.dir < 0 ? nose - line : line - nose;
        if (gap >= -2 && gap < room) room = gap;
      });
      // one the story is driving: it pulls up with its nose at stopAt, and waits there until that is cleared
      if (v.stopAt != null) {
        const gap = v.dir < 0 ? nose - v.stopAt : v.stopAt - nose;
        if (gap >= -2 && gap < room) room = gap;
      }
      // slow down in good time, stop a little short
      const stopIn = (v.v * v.v) / (2 * 0.12) + 6;
      if (room < 5) want = 0;
      else if (room < stopIn + 10) want = Math.min(want, Math.max(0, (room - 6) * 0.12));
      v.v += Math.max(-0.2, Math.min(0.06, want - v.v));
      if (v.v < 0.02) v.v = 0;
      v.x += v.v * v.dir;
    }
    for (let i = list.length - 1; i >= 0; i--) if (list[i].x > EAST + 40 || list[i].x + list[i].w < WEST - 40) list.splice(i, 1);
  }

  // a vehicle for the story: it comes in at the end of its lane and pulls up with its nose at stopAt (garden pixels)
  function add(kind, lane, stopAt, colours) {
    const [, w, lo] = KINDS[kind];
    const { y, dir } = LANES[lane];
    const v = { kind, lane, y, dir, x: dir < 0 ? EAST + 8 : WEST - w - 8, w, cruise: lo + 0.3, v: lo + 0.3, wait: 0, stopAt, im: spriteFor(kind, colours || COLOURS[kind][3], -dir) };
    list.push(v);
    return v;
  }
  // the rows a vehicle covers: its lane's two
  const covers = (v, px, row) => (row === v.y || row === v.y - 1) && px > v.x + 1 && px < v.x + v.w - 1;
  // is a moving vehicle on this spot (garden pixels, and a row)?
  const hitAt = (px, row) => list.find((v) => v.v > 0.4 && covers(v, px, row)) || null;
  // is a standing vehicle on this tile?
  const blocked = (tx, ty) => list.some((v) => v.v <= 0.4 && covers(v, tx * T + 8, ty));
  // it has hit something: it stays where it is for a while
  function stop(v, frames = 150) {
    v.v = 0;
    v.wait = frames;
  }
  return { list, update, fill, hitAt, blocked, stop, add, ROAD };
}
