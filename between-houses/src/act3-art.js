// Things drawn for Act 3: the delivery box, the barrier at the end of the covered walkway, the
// dogs on the boat, the durians and Thanos's kittens. Pictures only: nothing here knows about
// the story. (The people of Act 3 are in sprites.js: Golf Club, Flower's owner, Garnet's guard.)
//
// This file must not import garden.js or strays.js (garden.js may import this one).
import { C, R, P, canvas } from './palette.js';
import { makeCat, makeDog, DOG_PALS, CAT_PALS } from './sprites.js';

const K = C.k;
const once = (make) => {
  let made;
  return (...a) => (a.length ? make(...a) : (made = made || make()));
};

// ------------------------------------------------------------ the delivery box
// A cardboard box of cat food, left on the pavement. Three pictures, all 20 x 20 with the box
// standing on the bottom edge, so that one can be swapped for another without a jump:
//   'closed'  taped shut, a cat's face on the label
//   'open'    the flaps up, dark inside
//   'cats'    open, and two pairs of ears over the rim: a gray-brown pair and an orange pair
// Stand it on a tile as the game stands a cat: (x + 8 - 10, y + 14 - 20).
const CARD = { top: '#dcb680', topL: '#ecd09c', face: '#c2955c', faceD: '#a57a45', in: '#4a3426', inD: '#33231a', tape: '#f1e6cc', flap: '#cfa56c', flapD: '#b0864f' };
function boxBody(g, open) {
  // the front face, with its label: a cat's head, and an arrow for which way is up
  R(g, 0, 9, 20, 11, K);
  R(g, 1, 10, 18, 9, CARD.face);
  R(g, 1, 18, 18, 1, CARD.faceD);
  R(g, 3, 11, 9, 7, C.white);
  R(g, 5, 13, 5, 4, C.orange);
  P(g, 5, 12, C.orange);
  P(g, 9, 12, C.orange);
  P(g, 6, 14, K);
  P(g, 8, 14, K);
  P(g, 7, 15, C.white);
  // (and a bowl of it)
  R(g, 13, 14, 5, 1, C.walnut);
  R(g, 14, 15, 3, 2, C.walnut);
  R(g, 14, 13, 3, 1, C.gold);
  if (!open) {
    // the lid: two flaps meeting, a strip of tape along the join and down the front
    R(g, 0, 3, 20, 7, K);
    R(g, 1, 4, 18, 5, CARD.top);
    R(g, 1, 4, 18, 1, CARD.topL);
    R(g, 1, 6, 18, 1, CARD.tape);
    R(g, 8, 4, 4, 5, CARD.tape);
    R(g, 8, 10, 4, 2, CARD.tape);
    return;
  }
  // open: the far flap standing up, the side flaps out, the near flap folded down the front
  R(g, 1, 0, 18, 5, K);
  R(g, 2, 1, 16, 3, CARD.flap);
  R(g, 2, 1, 16, 1, CARD.topL);
  R(g, 0, 4, 20, 6, K);
  R(g, 1, 5, 18, 4, CARD.in);
  R(g, 1, 5, 18, 1, CARD.inD);
  R(g, 0, 5, 2, 3, CARD.flapD);
  R(g, 18, 5, 2, 3, CARD.flapD);
  R(g, 1, 10, 18, 2, CARD.flap);
  R(g, 1, 12, 18, 1, K);
}
// two ears and the top of a head, seen over the rim (x is the left ear's column)
function ears(g, x, pal) {
  P(g, x, 4, K);
  P(g, x + 4, 4, K);
  R(g, x - 1, 5, 3, 1, K);
  R(g, x + 3, 5, 3, 1, K);
  P(g, x, 5, pal.b);
  P(g, x + 4, 5, pal.b);
  R(g, x - 1, 6, 7, 3, K);
  R(g, x, 6, 5, 3, pal.b);
  P(g, x, 6, pal.i);
  P(g, x + 4, 6, pal.i);
  P(g, x + 2, 6, pal.d);
  P(g, x + 1, 7, pal.d);
  P(g, x + 3, 7, pal.d);
  // eyes in the dark
  P(g, x + 1, 8, pal.g || pal.e);
  P(g, x + 3, 8, pal.e);
}
export function deliveryBox(kind = 'closed') {
  const [cv, g] = canvas(20, 20);
  boxBody(g, kind !== 'closed');
  if (kind === 'cats') {
    ears(g, 3, CAT_PALS.shark);
    ears(g, 12, CAT_PALS.orca);
  }
  return cv;
}

// The same box in somebody's arms: 12 x 10, the size the game's `holds` picture is drawn at
// (an extra's `holds`: see how game.js draws one). 'closed', or 'cats' (ears over the top).
export function heldBox(kind = 'closed') {
  const [cv, g] = canvas(12, 10);
  R(g, 0, 2, 12, 8, K);
  R(g, 1, 3, 10, 2, CARD.top);
  R(g, 1, 3, 10, 1, CARD.topL);
  R(g, 1, 5, 10, 4, CARD.face);
  R(g, 1, 8, 10, 1, CARD.faceD);
  R(g, 2, 6, 4, 2, C.white);
  P(g, 3, 6, C.orange);
  P(g, 4, 7, C.orange);
  if (kind === 'cats') {
    R(g, 1, 3, 10, 2, CARD.in);
    for (const [x, pal] of [[2, CAT_PALS.shark], [7, CAT_PALS.orca]]) {
      P(g, x, 1, K);
      P(g, x + 2, 1, K);
      R(g, x - 1, 2, 5, 1, K);
      P(g, x, 2, pal.b);
      P(g, x + 2, 2, pal.b);
      R(g, x, 3, 3, 1, pal.b);
      P(g, x, 4, pal.g || pal.e);
      P(g, x + 2, 4, pal.e);
    }
  } else {
    R(g, 5, 3, 2, 3, CARD.tape);
  }
  return cv;
}

// ---------------------------------------------------------------- the barrier
// A site barrier: sheets of ribbed steel on posts, red and white along the top and the bottom,
// concrete feet, and nothing to get a claw into. One panel is 16 wide and 40 high (two and a
// half tiles: a human is 24), and panels stand side by side with no gap.
//   barrierPanel('plain' | 'sign')   one panel ('sign' has a no-entry disc on it)
//   drawBarrier(g, x, y, tiles = 8)  (now a stack of wire cages; the panels are kept for the sheet): (x, y) is the top left corner of the first
//                                    tile it stands on; the panels reach 24 above the tile
export const BARRIER_H = 40;
const makePanel = (kind) => {
  const [cv, g] = canvas(16, BARRIER_H);
  // the sheet
  R(g, 0, 0, 16, 37, K);
  for (let x = 1; x < 16; x++) R(g, x, 1, 1, 35, x % 4 === 1 ? '#7d838d' : x % 4 === 3 ? '#c3c8cf' : '#a5abb3');
  R(g, 1, 9, 15, 1, '#7d838d');
  R(g, 1, 29, 15, 1, '#7d838d');
  // red and white, top and bottom
  const band = (y0, h) => {
    for (let y = y0; y < y0 + h; y++) for (let x = 1; x < 16; x++) P(g, x, y, ((x + y) >> 2) & 1 ? '#c8392f' : '#f7f3ea');
    R(g, 1, y0 + h, 15, 1, K);
    R(g, 1, y0 - 1, 15, 1, K);
  };
  band(2, 6);
  band(30, 5);
  // the post, and a spike of it above the sheet
  R(g, 0, 0, 2, 37, K);
  R(g, 0, 2, 1, 34, '#5b616b');
  // a concrete foot
  R(g, 0, 36, 16, 4, K);
  R(g, 1, 37, 6, 2, C.grayL);
  R(g, 9, 37, 6, 2, C.grayL);
  R(g, 1, 38, 6, 1, C.gray);
  R(g, 9, 38, 6, 1, C.gray);
  R(g, 7, 37, 2, 2, '#3a3438');
  if (kind === 'sign') {
    // no entry: a red disc with a white bar
    R(g, 5, 14, 7, 11, K);
    R(g, 3, 16, 11, 7, K);
    R(g, 4, 15, 9, 9, K);
    R(g, 5, 15, 7, 9, '#c8392f');
    R(g, 4, 16, 9, 7, '#c8392f');
    R(g, 5, 19, 7, 1, '#f7f3ea');
  }
  return cv;
};
const panels = {};
export function barrierPanel(kind = 'plain') {
  return (panels[kind] = panels[kind] || makePanel(kind));
}
// What shuts the covered walkway on the last night: big wire cages, stacked two high right across
// it, with a dog still in one or two of them (the first lot, on their way back onto the boat).
// (x, y) is the top left corner of the first tile they stand on; the stack reaches 24 above the
// tile. Each cage is two tiles wide. `dog` is a coat of DOG_PALS for a cage with a dog in it.
// A dog lying down behind the wire, head on its paws: (x, floor) is the left end of the cage's tray.
function cagedDog(g, x, floor, pal, flip) {
  const B = (dx, up, w, h, c) => R(g, flip ? x + 26 - dx - w : x + dx, floor - up, w, h, c);
  // the tail, the body, the head, and the paws it rests on
  B(0, 7, 3, 5, K);
  B(1, 6, 2, 3, pal.t);
  B(2, 9, 16, 9, K);
  B(3, 8, 14, 7, pal.b);
  B(3, 8, 6, 3, pal.p);
  B(3, 2, 14, 1, pal.d);
  B(15, 13, 11, 12, K);
  B(16, 12, 9, 10, pal.b);
  B(16, 12, 3, 5, pal.d); // an ear, flat
  B(21, 7, 4, 5, pal.w);
  B(24, 7, 1, 2, pal.n);
  B(20, 9, 2, 2, pal.e);
  B(13, 2, 7, 2, K);
  B(14, 2, 5, 1, pal.w);
}
// One cage: its top face (CAGE_TOP rows of wire seen from above, with a carrying handle), and below it the
// front. (x, y) is the top left corner of the whole picture, h its whole height (CAGE_H).
const CAGE_TOP = 6;
const CAGE_H = 24;
function cage(g, x, y, w, h, dog) {
  const fy = y + CAGE_TOP; // where the front begins
  const fh = h - CAGE_TOP;
  // the top: the frame, the wire across it (the dark of the inside shows through), a handle
  R(g, x, y, w, CAGE_TOP + 1, K);
  R(g, x + 1, y + 1, w - 2, CAGE_TOP - 1, '#454a55');
  for (let i = 3; i < w - 2; i += 3) R(g, x + i, y + 1, 1, CAGE_TOP - 1, '#8b919b');
  R(g, x + 1, y + 3, w - 2, 1, '#8b919b');
  R(g, x + 1, y + 1, w - 2, 1, '#e4e7eb');
  R(g, x + 1, y + 1, 1, CAGE_TOP - 1, '#d5d9df');
  R(g, x + w - 2, y + 1, 1, CAGE_TOP - 1, '#9aa0aa');
  if (w >= 28) {
    R(g, x + (w >> 1) - 5, y + 2, 10, 3, K);
    R(g, x + (w >> 1) - 4, y + 3, 8, 1, '#c3c8cf');
  }
  // the front: the frame, and the dark inside
  R(g, x, fy, w, fh, K);
  R(g, x + 1, fy + 1, w - 2, fh - 2, '#2b2f38');
  const held = dog && w >= 28;
  if (held) cagedDog(g, x + 3, fy + fh - 4, DOG_PALS[dog] || DOG_PALS.tan, dog === 'patched');
  // wire: uprights, and two rails (thinner to the eye in front of a dog, so that it can be seen)
  g.globalAlpha = held ? 0.38 : 1;
  for (let i = 3; i < w - 2; i += 3) R(g, x + i, fy + 1, 1, fh - 5, '#aeb4bd');
  R(g, x + 1, fy + 5, w - 2, 1, '#8b919b');
  R(g, x + 1, fy + fh - 9, w - 2, 1, '#8b919b');
  g.globalAlpha = 1;
  // the corner posts, the rim under the top, and the tray along the bottom
  R(g, x + 1, fy + 1, 1, fh - 2, '#d5d9df');
  R(g, x + w - 2, fy + 1, 1, fh - 2, '#6f747d');
  R(g, x + 1, fy + 1, w - 2, 1, '#b9bec6');
  R(g, x + 1, fy + fh - 4, w - 2, 3, '#5a5f69');
  R(g, x + 1, fy + fh - 4, w - 2, 1, '#7d838d');
  // the door: a heavier frame in the middle, with a latch
  R(g, x + (w >> 1) - 5, fy + 3, 1, fh - 8, '#e4e7eb');
  R(g, x + (w >> 1) + 5, fy + 3, 1, fh - 8, '#e4e7eb');
  R(g, x + (w >> 1) + 4, fy + (fh >> 1) - 1, 3, 2, '#f2c14a');
}
export function drawCage(g, x, y, dog) {
  cage(g, x, y + 16 - CAGE_H, 32, CAGE_H, dog);
}
// A flat cart, empty, for wheeling the cages along the dock: seen as everything on the map is, from the
// front and a little from above, so that its deck shows. Two tiles wide; (x, y) is the top left corner
// of the left tile it stands on. The push handle stands up at its right-hand end.
export function drawCart(g, x, y) {
  const foot = y + 16;
  // the shadow under it, and the wheels (the far pair just showing under the deck)
  R(g, x + 1, foot - 2, 32, 2, 'rgba(20,20,20,0.25)');
  for (const wx of [x + 3, x + 24]) {
    R(g, wx, foot - 6, 6, 6, K);
    R(g, wx + 1, foot - 5, 4, 4, '#4a4f58');
    R(g, wx + 2, foot - 4, 2, 2, '#aeb4bd');
  }
  // the deck: its top (planks, running front to back), and the front edge below it
  R(g, x - 1, foot - 19, 34, 15, K);
  R(g, x, foot - 18, 32, 9, '#b48a52');
  R(g, x, foot - 18, 32, 1, '#d2ab72');
  for (let i = 8; i < 32; i += 8) R(g, x + i, foot - 18, 1, 9, '#8a6a3e');
  R(g, x, foot - 9, 32, 4, '#7a5a34');
  R(g, x, foot - 9, 32, 1, '#5e4426');
  // a steel rim along the front, and a strap left lying on the deck
  R(g, x, foot - 6, 32, 1, '#9aa0aa');
  R(g, x + 5, foot - 15, 9, 1, '#c8392f');
  R(g, x + 13, foot - 15, 1, 4, '#c8392f');
  R(g, x + 10, foot - 12, 4, 1, '#c8392f');
  // the handle: a loop of steel tube at the right-hand end, its far post shorter to the eye than its near one
  R(g, x + 25, foot - 31, 10, 3, K);
  R(g, x + 26, foot - 30, 8, 1, '#e4e7eb');
  R(g, x + 25, foot - 29, 3, 11, K);
  R(g, x + 26, foot - 29, 1, 10, '#aeb4bd');
  R(g, x + 32, foot - 29, 3, 21, K);
  R(g, x + 33, foot - 29, 1, 20, '#d5d9df');
}
// The stack across the walkway: how high its picture stands above the foot of the tile it is on.
export const STACK_H = 2 * CAGE_H - CAGE_TOP + 2;
// (dogs: which cages of the stack have a dog in them, { bottom: { 0: 'patched' }, top: { 1: 'tan' } })
export function drawBarrier(g, x, y, tiles = 8, dogs = {}) {
  const w = tiles * 16;
  const foot = y + 16;
  const low = dogs.bottom || {};
  const high = dogs.top || {};
  // the bottom row, side by side; then a second row on top of it, set half a cage along (its front
  // hides the tops of the ones below, but for half a cage at either end)
  for (let i = 0; i * 32 < w; i++) cage(g, x + i * 32, foot - CAGE_H, Math.min(32, w - i * 32), CAGE_H, low[i]);
  const up = foot - 2 * CAGE_H + CAGE_TOP;
  for (let i = 0; 16 + (i + 1) * 32 <= w; i++) cage(g, x + 16 + i * 32, up, 32, CAGE_H, high[i]);
  // a tag tied to one door
  R(g, x + 16 + 32 + 20, up + CAGE_TOP + 10, 4, 5, '#f7f3ea');
  R(g, x + 16 + 32 + 20, up + CAGE_TOP + 10, 4, 1, K);
}

// ------------------------------------------------------- the dogs on the boat
// A boatload of stray dogs, moored and about to be let off: drawn over the boat that garden.js
// draws (drawBoat). (x, y) is the top left corner of that drawing, which is the corner of tile
// (18, 5): the bow tip is at x, the deck's centre line at y + 22, the deck 224 long and up to
// 19 either side of the line. So in garden pixels: drawBoatDogs(g, 18 * 16, 5 * 16, frame).
// `frame` is the game's frame counter: some bark, some look about, some shuffle.
const dogs = once(() => ({ tan: makeDog(DOG_PALS.tan), black: makeDog(DOG_PALS.black), patched: makeDog(DOG_PALS.patched) }));
const boatHalf = (i) => {
  const bow = Math.min(1, i / 78);
  const stern = Math.min(1, (224 - i) / 5);
  return Math.max(1, Math.round(19 * (1 - (1 - bow) * (1 - bow)) * (0.86 + 0.14 * stern)));
};
// [how far aft of the bow tip, where across the deck, coat, what it is doing, facing, a number to put it out of step]
// across the deck: 'far' (the far bench and the floor by it), 'mid' (the middle), 'rail' (at the near rail)
const BOAT_DOGS = [
  [26, 'rail', 'tan', 'look', 'left', 0], // one at the bow, looking out
  [45, 'mid', 'black', 'sit', 'down', 3],
  [60, 'rail', 'patched', 'bark', 'down', 1],
  [74, 'far', 'tan', 'stand', 'right', 0],
  [80, 'rail', 'black', 'stand', 'down', 2],
  [97, 'mid', 'patched', 'look', 'left', 4],
  [103, 'rail', 'tan', 'bark', 'left', 2],
  [123, 'rail', 'black', 'sit', 'down', 0],
  [139, 'mid', 'tan', 'bark', 'right', 5],
  [143, 'rail', 'patched', 'stand', 'down', 3],
  [160, 'far', 'black', 'look', 'right', 1],
  [164, 'rail', 'tan', 'bark', 'down', 4],
  [179, 'far', 'patched', 'sit', 'down', 2],
  [185, 'rail', 'black', 'stand', 'left', 5],
  [197, 'mid', 'tan', 'look', 'left', 3],
  [206, 'rail', 'patched', 'bark', 'down', 0],
];
export function drawBoatDogs(g, x, y, frame = 0) {
  const sp = dogs();
  const cy = y + 22;
  const tick = Math.floor(frame / 10);
  const list = BOAT_DOGS.map(([i, across, coat, act, face, off]) => {
    const feet = across === 'far' ? cy - 9 : across === 'mid' ? cy + 3 : cy + boatHalf(i) - 4;
    const t = (tick + off * 5) % 12;
    const d = sp[coat];
    let im = d.stand[face];
    let hop = 0;
    if (act === 'sit') im = d.sit[face];
    else if (act === 'look') im = t < 7 ? d.look[face] : d.stand[face];
    else if (act === 'bark') {
      // two barks, a hop with each, and a breath
      const open = t === 0 || t === 1 || t === 4 || t === 5;
      im = open ? d.bark[face] : d.stand[face];
      hop = t === 0 || t === 4 ? 1 : 0;
    } else if (face === 'down' && t >= 8) im = d.walk.down[t & 1]; // shuffling on the spot
    return { im, x: x + i - (im.width >> 1), y: feet - 22 - hop, feet };
  });
  list.sort((a, b) => a.feet - b.feet);
  for (const d of list) g.drawImage(d.im, d.x, d.y);
}

// ------------------------------------------------------------------ durians
// One durian, in the air (11 x 11, two pictures: show them in turn and it spins).
const DURIAN = { a: '#9a9a3a', b: '#c2bd52', c: '#6f7028', s: '#7a5a34' };
function durianAt(g, x, y, turned) {
  // spikes all round, then the fruit
  for (const [dx, dy] of [[2, 0], [5, 0], [8, 0], [0, 2], [10, 2], [0, 5], [10, 5], [0, 8], [10, 8], [2, 10], [5, 10], [8, 10]]) P(g, x + dx, y + dy, K);
  R(g, x + 2, y + 1, 7, 9, K);
  R(g, x + 1, y + 2, 9, 7, K);
  R(g, x + 3, y + 2, 5, 7, DURIAN.a);
  R(g, x + 2, y + 3, 7, 5, DURIAN.a);
  for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) {
    const px = x + 2 + i;
    const py = y + 2 + j;
    if ((i === 0 || i === 6) && (j === 0 || j === 6)) continue;
    if ((i + j * 2 + (turned ? 1 : 0)) % 3 === 0) P(g, px, py, (i + j) % 2 ? DURIAN.c : DURIAN.b);
  }
  // the stalk
  P(g, x + (turned ? 8 : 5), y + (turned ? 2 : 1), DURIAN.s);
}
export const durian = once(() =>
  [false, true].map((turned) => {
    const [cv, g] = canvas(11, 11);
    durianAt(g, 0, 0, turned);
    return cv;
  }),
);

// A bag of durians in somebody's hand: 12 x 12, for an extra's `holds` (it hangs a little
// lower than a box is held: the game draws `holds` from the chest down). A red carrier bag
// with two of them in it, spikes through the plastic.
export const durianBag = once(() => {
  const [cv, g] = canvas(12, 12);
  // handles
  R(g, 4, 0, 1, 3, '#b2372e');
  R(g, 7, 0, 1, 3, '#b2372e');
  R(g, 5, 0, 2, 1, '#b2372e');
  // the bag
  R(g, 1, 3, 10, 9, K);
  R(g, 0, 5, 12, 6, K);
  R(g, 2, 4, 8, 7, '#d8584a');
  R(g, 1, 6, 10, 4, '#d8584a');
  R(g, 2, 4, 8, 1, '#ec8273');
  // the fruit showing through
  R(g, 2, 6, 4, 4, DURIAN.a);
  R(g, 6, 5, 4, 5, DURIAN.a);
  for (const [px, py] of [[2, 6], [4, 7], [3, 9], [7, 5], [9, 7], [6, 8], [8, 9]]) P(g, px, py, DURIAN.b);
  for (const [px, py] of [[3, 7], [5, 9], [8, 6], [7, 8], [9, 9]]) P(g, px, py, DURIAN.c);
  // spikes through the sides
  for (const [px, py] of [[0, 6], [0, 9], [11, 6], [11, 9], [3, 11], [8, 11]]) P(g, px, py, DURIAN.c);
  return cv;
});

// The same bag as something lying about, the size of the things a cat can carry: a row grid
// and a palette as in pickups.js (give it to renderPickup), and the two pictures already made.
export const DURIAN_BAG_PICKUP = {
  pal: { k: K, a: '#d8584a', b: '#ec8273', c: DURIAN.a, d: DURIAN.b, e: DURIAN.c },
  rows: ['...kk....', '..kaak.e.', '.kkbbkkk.', 'ecadcadke', 'kacecdcak', 'kaccacdak', '.kkkkkkk.'],
};
export const durianBagPickup = once(() => {
  const def = DURIAN_BAG_PICKUP;
  const [cv, g] = canvas(9, def.rows.length);
  def.rows.forEach((row, y) => [...row].forEach((ch, x) => ch !== '.' && P(g, x, y, def.pal[ch])));
  const [mv, mg] = canvas(6, 5);
  mg.drawImage(cv, 0, 0, 9, def.rows.length, 0, 0, 6, 5);
  return { ground: cv, mouth: mv };
});

// ---------------------------------------------------------- Thanos's kittens
// Three of them, in his colours (white, with orange in patches; his amber eyes), each smaller
// than Babycat (who is 0.7 of a cat): 0.6, 0.55 and 0.6. Every one is what makeCat gives.
//   0  his own markings: the cap round the eyes, the tail, a patch on the flank
//   1  an orange tail and one orange ear, the rest white
//   2  an orange saddle over the back, a white face
const KIT_PAL = { k: K, b: '#f6f2e8', d: '#e2dccd', l: '#ffffff', w: '#ffffff', e: '#d8a23a', n: '#e69a9a', t: '#b8702f', i: '#f0b9a8' };
const KIT_ORANGE = { b: '#e09448', d: '#b8702f', l: '#efb06c' };
const KIT_PATCH = [
  (kind, x, y) => {
    if (kind === 'down' || kind === 'sit') return (y <= 6 && (x < 6 || x > 8)) || x >= 12 || (x <= 5 && y >= 10 && y <= 11);
    if (kind === 'up' || kind === 'sitUp') return y <= 4 || x >= 12 || (y >= 6 && y <= 10 && x >= 5 && x <= 9);
    if (kind === 'left') return (y <= 5 && x <= 6) || (y === 6 && x >= 4 && x <= 6) || x >= 12 || (x >= 7 && x <= 11 && y >= 8 && y <= 10);
    if (kind === 'sitLeft') return (y <= 4 && x <= 6) || (y === 5 && x >= 4 && x <= 7) || x >= 12 || (x >= 7 && x <= 10 && y >= 9 && y <= 11);
    return (y <= 9 && (x < 6 || x > 8)) || (x >= 11 && y >= 12);
  },
  (kind, x, y) => {
    if (kind === 'down' || kind === 'sit') return (y <= 5 && x > 8) || x >= 12;
    if (kind === 'up' || kind === 'sitUp') return (y <= 4 && x < 7) || x >= 12;
    if (kind === 'left') return (y <= 4 && x >= 4 && x <= 6) || x >= 12;
    if (kind === 'sitLeft') return (y <= 4 && x >= 4 && x <= 6) || x >= 12;
    return x >= 11 && y >= 12;
  },
  (kind, x, y) => {
    if (kind === 'down' || kind === 'sit') return (y <= 4 && (x < 5 || x > 9)) || (y >= 9 && (x <= 5 || x >= 9)) || x >= 12;
    if (kind === 'up' || kind === 'sitUp') return (y >= 6 && x >= 4 && x <= 10) || x >= 12;
    if (kind === 'left') return (x >= 6 && y >= 6 && y <= 10) || x >= 12;
    if (kind === 'sitLeft') return (x >= 6 && y >= 7 && y <= 11) || x >= 12;
    return x >= 5 && y >= 9;
  },
];
const KIT_SCALE = [0.6, 0.55, 0.6];
export const makeKittens = once(() =>
  KIT_PATCH.map((where, n) =>
    makeCat(KIT_PAL, {
      coat: (kind, x, y, ch) => ('bdl'.includes(ch) && where(kind, x, y) ? KIT_ORANGE[ch] : null),
      scale: [KIT_SCALE[n], KIT_SCALE[n]],
    }),
  ),
);
