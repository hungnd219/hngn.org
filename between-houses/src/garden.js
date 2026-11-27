// The riverside garden across the street, drawn as an 8-bit map.
// The game uses it as the downstairs area; design/garden/render.html shows
// the whole map on its own.
//
// 128 x 49 tiles of 16px. Everything conforms to the tile grid: ground is
// drawn tile by tile, and every object (tree, bush, bench, slide...) has a
// footprint of whole tiles, like the furniture in the apartment.
//
// One tile is 8 pixels of the reference photo, so a cell of the first photo
// grid (32px) is 4 x 4 tiles. Columns read A..DX and rows 1..49 on the
// labelled image; the code below uses 0-based [x, y].
//
// North to south: river (jetty and a moored boat), riverside hedge,
// boardwalk, the garden (cafe yard, covered walkway, playground, lawn, BBQ
// area, east lawn), a low hedge, the kerb and the road with the crosswalk to
// the apartment building, then the building's pavement and lobby entrance.
import { C, R, P, canvas } from './palette.js';
import { drawText } from './font.js';
import { STACK_H, drawBarrier, drawBoatDogs, drawCage, drawCart } from './act3-art.js';

// The map runs from column GX0 (west of the original garden, so the columns
// there are negative) to GX1. Nothing invisible stops the cats near the ends:
// rows of trees, parked vehicles, cones, bicycles and a fence do (see below).
export const GX0 = -26;
export const GX1 = 142;
export const GW = GX1 - GX0;
const WB = -19; // the west tree line stands on this column and the next
const EB = 130; // the east tree line and fence stand on this column and the next
// The rows south of the road, counted from its south kerb: the kerb, a hedge
// (open at the crossings), three rows of pavement, two rows of planting.
export const KERB_S = 48;
export const PAVE_S = KERB_S + 2; // the first row of open pavement
export const PLANT_S = KERB_S + 5; // the first row of planting in front of the buildings
export const GH = PLANT_S + 2;
const T = 16;

// colours that only the garden uses
const G = {
  river: '#5c9fd6',
  riverD: '#4a88c2',
  riverL: '#8fc4ec',
  pave: '#cfcbc3',
  paveD: '#b3aea5',
  paveL: '#dedad2',
  bank: '#a8a294',
  bankD: '#7f7a6f',
  // clipped hedges are walls; bushes (lighter) can be walked into
  hedge: '#2c5f31',
  hedgeD: '#1e4425',
  hedgeL: '#3d7a3a',
  bush: '#3f7a3a',
  bushD: '#2c5a2b',
  bushL: '#5c9a46',
  board: '#c9a173',
  boardD: '#a98257',
  boardL: '#dbb689',
  yard: '#dcd8cf',
  yardD: '#c8c3b9',
  walk: '#e6dfcd',
  walkD: '#cfc6b0',
  grass: '#84b257',
  grassD: '#6d9a44',
  grassL: '#9cc56a',
  paver: '#d6c19e',
  paverD: '#bba582',
  gravel: '#ddd2b8',
  gravelD: '#c4b896',
  curb: '#c2beb5',
  curbD: '#8f8a82',
  road: '#4e4e56',
  roadD: '#45454c',
  roadL: '#5a5a62',
  line: '#e9e6dc',
  tree: '#357546',
  treeD: '#22513a',
  treeL: '#58a05a',
  palm: '#4f9442',
  palmD: '#336b30',
  palmL: '#82b85a',
  hexBlue: '#adb9c1',
  hexPink: '#d6bdbd',
  hexGreen: '#bdc9b4',
  hexCream: '#e8dec6',
  hexGrout: '#c9bfa8',
  rubberEdge: '#a39a86',
  yellow: '#f0c534',
  yellowD: '#c99a1f',
  roof: '#8d4c3b',
  roofD: '#6b3529',
  roofL: '#a6604b',
};

// a stable "random" number per tile/pixel, so the map draws the same every time
const hash = (x, y, s = 0) => {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const key = (x, y) => x + ',' + y;

// ------------------------------------------------------------- layout
// The north edge slants on the east side (photo Y4 to AF5): every 7 tiles
// east of x=96 the river, hedge and boardwalk step one row further south.
export const northShift = (x) => (x < 96 ? 0 : Math.floor((x - 96) / 7));
// The river wall and its railing are not drawn in steps, though: east of x=96 they run in one slant,
// a pixel down for every seven along, which is the same fall. wallTop(px): the pixel row the wall's
// top is on, at a pixel column. (Only the picture: what can be walked on is still by whole tiles.)
const wallTop = (px) => 11 * T + (px < 96 * T ? 0 : Math.floor((px - 96 * T) / 7));
// The hedge along the garden side of the boardwalk steps down too, a row at a time, and its
// sections would only touch at their corners: one more tile of hedge at each step joins them up.
// (Not at the first step, which is the opening from the BBQ pavers.)
const hedgeJoin = (x, y) => x > 103 && (x - 96) % 7 === 0 && y === 16 + northShift(x);

// The playground's east edge wanders: first lawn column on rows 18..34.
const PLAY_EDGE = [72, 72, 71, 71, 70, 70, 71, 72, 73, 73, 72, 71, 71, 72, 73, 72, 72];
const playEdge = (y) => PLAY_EDGE[Math.max(0, Math.min(16, y - 18))];

// The lawn path links the playground (rows 32-33) with the BBQ tiles
// (rows 22-23): it climbs about one row every two columns, with a little
// wobble, and is 2 tiles deep.
const LAWN_WOBBLE = { 75: 1, 80: -1, 85: 1, 88: -1 };
const lawnPathTop = (x) => 31 - Math.round(((x - 72) * 10) / 19) + (LAWN_WOBBLE[x] || 0);
// The east path leaves the BBQ tiles and drifts south-east; 2 tiles wide.
const EAST_WOBBLE = [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0];
const eastPathTop = (x) => 25 + Math.floor(((x - 112) * 4) / 15) + (EAST_WOBBLE[x - 112] || 0);

const PATH = new Set();
for (let x = 72; x <= 91; x++) for (let d = 0; d < 2; d++) PATH.add(key(x, lawnPathTop(x) + d));
for (let x = 112; x < GX1; x++) for (let d = 0; d < 2; d++) PATH.add(key(x, eastPathTop(x) + d));

// Trees: [kind, x, y, size] with a footprint of size x size tiles
export const TREES = [
  // along the river
  ['palm', 30, 11, 3],
  ['palm', 61, 11, 3],
  ['palm', 98, 11, 3],
  // playground: round the edges, clear of the routes through it
  ['tree', 28, 19, 3],
  ['tree', 28, 31, 3],
  ['tree', 40, 30, 3],
  ['tree', 42, 19, 2],
  ['tree', 47, 31, 2],
  ['tree', 55, 32, 2],
  ['tree', 62, 19, 3],
  ['tree', 65, 30, 3], // by the east end of the monkey bars, with open ground under it (CHEETOS_TREE)
  // out in the middle, where bushes used to be: trees to climb
  ['tree', 36, 26, 3],
  ['tree', 52, 20, 3],
  ['tree', 54, 26, 3],
  ['tree', 42, 25, 3],
  // the cafe's yard, beside the way in from Amber's crossing (its trunk is clear of the columns the
  // crossing's stripes are in but one: nobody walking up from the road bumps into it and goes up it)
  ['tree', 18, 27, 3],
  // on the seam between the playground and the lawn
  ['tree', 70, 21, 3],
  ['tree', 72, 27, 2],
  ['palm', 74, 32, 3],
  // lawn
  ['palm', 76, 19, 3],
  ['palm', 85, 29, 3],
  ['tree', 82, 31, 3], // the only tree to climb between the playground and the east lawn
  // east edge: the lawn north of the path is kept clear for the BBQ tables;
  // south of it is a dense mix of trees, palms and bushes
  ['tree', 112, 29, 3],
  ['palm', 116, 29, 3],
  ['tree', 121, 29, 2],
  ['tree', 115, 32, 2],
  ['tree', 119, 31, 3],
  ['palm', 123, 31, 3],
  ['tree', 126, 31, 2],
];
// A tree's entry is the block its crown covers; the trunk stands on one tile
// in the bottom row of that block, and only the trunk is in the way.
// Tree lines that close off the two ends. `shortTree` and `palm` take the
// tile the trunk stands on. A zigzag of trunks on two neighbouring columns
// cannot be squeezed through.
const shortTree = (x, y) => TREES.push(['tree', x, y - 1, 2]);
const palmAt = (x, y) => TREES.push(['palm', x - 1, y - 2, 3]);
// (a fifth entry lifts a tree's place in the drawing order by that many pixels)
// west: short trees on column G (odd rows), palms on column F (even rows);
// the palms are drawn over the short trees
// (behind the cafe two of the short trees are the cafe's big wheeled trash cans instead: they close the
// line just as the trunks do)
export const BINS = [[WB - 1, 24], [WB - 1, 26]];
for (let y = 18; y <= 34; y++) {
  if (BINS.some(([, by]) => by === y)) continue;
  if (y % 2 === 0) shortTree(WB - 1, y);
  else TREES.push(['palm', WB - 3, y - 2, 3, T + 2]);
}
// east: the same zigzag either side of the fence across the footpath (rows 29-30)
for (let y = 22; y <= 34; y++) {
  if (y === 29 || y === 30) continue;
  if (y % 2 === 0) shortTree(EB, y);
  else if (y >= 23) palmAt(EB + 1, y);
}
// ...and a loose grove behind it on plain grass, about as thick north of the
// footpath as south of it, and clear of the path itself
for (let x = EB + 3; x < GX1; x++)
  for (let y = 23; y <= 34; y++) {
    if (y < 20 + northShift(x)) continue;
    const top = eastPathTop(x);
    const south = y > top;
    const palm = (x + y) % 3 === 0;
    if (y >= top - 1 && y <= top + (palm ? 3 : 1)) continue;
    // sparse to the north (there is a lot of room), closer together in the
    // narrow strip to the south
    if (south ? (x + y) % 2 : (x * 2 + y * 3) % 7 !== 0) continue;
    palm ? palmAt(x, y) : shortTree(x, y);
  }
// Trees in the planting in front of the building. A pair closes off each end
// behind the bicycles; the rest are dotted along at even spacing so the pairs
// look like part of the planting.
const PLANT_WEST = -4; // column of the west pair
const PLANT_EAST = 130; // ...and the east pair
for (const x of [PLANT_WEST, PLANT_EAST]) {
  shortTree(x, PLANT_S);
  shortTree(x, PLANT_S + 1);
}
for (let x = PLANT_WEST - 6; x > GX0; x -= 6) ((x / 6) & 1 ? palmAt : shortTree)(x, PLANT_S + 1);
for (let x = PLANT_WEST + 6; x <= 9; x += 6) ((x / 6) & 1 ? palmAt : shortTree)(x, PLANT_S + 1);
// (the trees either side of each air-con unit are nudged so the unit sits
// exactly half way between them)
const NUDGE = { 28: 29, 34: null, 118: 119, 124: null };
for (let x = PLANT_EAST - 6; x >= 26; x -= 6) {
  if (x >= 103 && x <= 116) continue; // the Garnet building stands here
  const at = x in NUDGE ? NUDGE[x] : x;
  if (at !== null) ((x / 6) & 1 ? palmAt : shortTree)(at, PLANT_S + 1);
}
for (let x = PLANT_EAST + 6; x < GX1; x += 6) ((x / 6) & 1 ? palmAt : shortTree)(x, PLANT_S + 1);
const trunkOf = ([, x, y, n]) => (n === 3 ? [x + 1, y + 2] : [x, y + 1]);
const TREE_TILES = new Set();
const TRUNKS = new Set();
for (const t of TREES) {
  const [, x, y, n] = t;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) TREE_TILES.add(key(x + i, y + j));
  TRUNKS.add(key(...trunkOf(t)));
}

// Bushes are whole tiles; neighbouring bush tiles join into bigger shapes.
// Each shape is a list of rows: [y, first x, last x].
const BUSH = new Set();
const addRows = (rows) => {
  for (const [y, a, b] of rows) for (let x = a; x <= b; x++) BUSH.add(key(x, y));
};
// West bush of the BBQ area: an irregular mass that runs on from the lawn's
// greenery, no further east than column CV (x 99) or south than row 22 (y 21).
addRows([
  [18, 87, 90], [18, 93, 94], [18, 96, 97], // (notches for two lampposts)
  [19, 83, 98],
  [20, 84, 99],
  [21, 84, 86], [21, 94, 97],
]);
// East bush (Shark and Orca's old home): a boomerang with its corner to the
// north-east and its ends near DA21 (x 104, y 20) and DH25 (x 111, y 24).
addRows([
  [19, 105, 111],
  [20, 104, 111],
  [21, 108, 111],
  [22, 110, 111],
  [23, 110, 111],
  [24, 110, 111],
]);
// Shrubs round the playground's edges only: nobody plants a bush in the
// middle of a playground, or in a cafe's yard. (Out in the middle it is trees
// that give cover: see TREES.) Each shrub is at least three tiles wide, so
// three cats in a line can hide in it: see design/garden/routes.mjs.
addRows([
  // along the north hedge
  [18, 29, 32], [18, 37, 39], [19, 37, 39], [18, 48, 50], [18, 59, 61],
  // along the south hedge (the pair nap in the one at x 50)
  [34, 31, 34], [33, 43, 45], [34, 43, 46], [34, 50, 52], [34, 56, 58], [34, 62, 64], [33, 71, 73], [34, 70, 73],
  // by the covered walkway, on the west side
  [29, 28, 30], [30, 28, 30],
]);
// on the open lawn south of the path (the one on row 34 is under a tree)
addRows([[32, 77, 79], [33, 77, 79], [34, 80, 84]]);
// At the lawn's east edge, and east of the BBQ shed. Nothing is planted
// along the pavers' south edge or east of x 86 on row 34: the opening is
// played there (the bag, the car's driver, the white cat walking in from
// the lawn). Nor where Mission select puts the pair down.
addRows([[24, 89, 91], [25, 89, 91], [27, 109, 111], [28, 109, 111]]);
// between the BBQ tables, and in the far corner under the riverside hedge
// (COLLAR_SPOT is in this last one)
addRows([[24, 116, 118], [25, 116, 118], [22, 125, 128], [23, 125, 129], [24, 126, 127]]);
// shrubs on the east lawn: clumps either side of the path, with ways through
addRows([
  [30, 122, 125], [30, 119, 120], [32, 116, 118], [33, 112, 114], [33, 116, 117],
  [34, 112, 113], [34, 116, 118], [34, 121, 123], [34, 125, 127], [33, 127, 127], [29, 115, 115],
]);
// greenery in front of the apartment building, either side of the entrance:
// two full rows of bushes
for (let x = GX0; x < GX1; x++) {
  if ((x >= 13 && x <= 22) || (x >= 105 && x <= 114)) continue;
  BUSH.add(key(x, PLANT_S));
  BUSH.add(key(x, PLANT_S + 1));
}
// the thicket north of the lawn path: irregular clumps with gaps to slip
// through (two overlapping coarse patterns, so no straight edges)
function thicket(x, y) {
  const a = hash((x + (y >> 1)) >> 1, y >> 1, 5);
  const b = hash((x + 1) >> 1, (y + (x >> 2) + 1) >> 1, 6);
  return (a + b) / 2 < 0.58 || (a < 0.35 && hash(x, y, 7) < 0.8);
}
for (let x = 71; x <= 91; x++)
  for (let y = 18; y <= lawnPathTop(Math.max(72, x)) - 2; y++)
    if (x >= playEdge(y) + 1 && thicket(x, y)) BUSH.add(key(x, y));
// nothing grows on a tree's tiles or on a path
for (const k of TREE_TILES) if (Number(k.split(',')[1]) < PAVE_S) BUSH.delete(k);
for (const k of PATH) BUSH.delete(k);

// bushes between the trees at the east end, in loose clumps, leaving some
// open grass (and the footpath) showing
for (let x = EB - 2; x < GX1; x++)
  for (let y = 20 + northShift(x); y <= 34; y++) {
    const id = key(x, y);
    if (groundAt(x, y) !== 'lawn' || TRUNKS.has(id)) continue;
    const top = eastPathTop(x);
    if (y === top - 1 || y === top + 2) continue;
    if (x === EB - 1 && y >= top - 2 && y <= top + 3) continue; // keep the way up to the fence open
    if ((hash(x >> 1, y >> 1, 31) + hash((x + 1) >> 1, (y + 1) >> 1, 32)) / 2 < 0.47) BUSH.add(id);
  }
// a bush only grows where a cat could stand: never on top of a hedge
for (const k of [...BUSH]) {
  const [x, y] = k.split(',').map(Number);
  if (groundAt(x, y) === 'hedge') BUSH.delete(k);
}

// the covered walkway's roof (8 x 18 tiles)
export const COVER = { x: 20, y: 17, w: 8, h: 18 };
// A site barrier can be put across the north end of the covered walkway
// (setBarrier, further down). While it is up its tiles are a wall, and the
// boardwalk and the boat can only be reached from the east end of the garden.
export const BARRIER = { x: COVER.x, y: COVER.y, w: COVER.w };
let barrierUp = false;
export const barrierAt = (x, y) => barrierUp && y === BARRIER.y && x >= BARRIER.x && x < BARRIER.x + BARRIER.w;
// zebra crossings: 4 tiles wide, at columns Q-T and DE-DH
export const CROSSINGS = [16, 108];
export const onCrossing = (x) => CROSSINGS.some((c) => x >= c && x < c + 4);
// The road: eleven rows. Two lanes run west on its north side and two run
// east on its south side, two rows a lane, either side of a three-row median
// where a party of three can stand in a line. Nobody gets past its two ends
// (see roadEnd).
export const ROAD = { top: 37, bottom: KERB_S - 1, median: [41, 43], west: -10, east: 131 };
// lanes: the row a vehicle's wheels are on (it covers that row and the one above), and which way it goes
export const LANES = [{ y: 38, dir: -1 }, { y: 40, dir: -1 }, { y: 45, dir: 1 }, { y: 47, dir: 1 }];
export const isRoad = (y) => y >= ROAD.top && y <= ROAD.bottom;
// the stretch of road past either end of the garden: no going there
export const roadEnd = (x, y) => isRoad(y) && (x <= ROAD.west || x >= ROAD.east);
// the median is planted with shrubs between its two yellow lines, open only at the crosswalks: a cat
// (or anybody) gets across the road at a crosswalk, or not at all
export const onMedian = (x, y) => y >= ROAD.median[0] && y <= ROAD.median[1] && !onCrossing(x);

// which kind of ground a tile is
export function groundAt(x, y) {
  if (x < GX0 || y < 0 || x >= GX1 || y >= GH) return 'none';
  const s = northShift(x);
  if (y <= 10 + s) return 'river';
  if (y === 11 + s) return x >= 22 && x <= 23 ? 'board' : 'bank';
  if (y <= 13 + s) return x >= 22 && x <= 23 ? 'board' : 'hedge';
  if (hedgeJoin(x, y)) return 'hedge';
  if (y <= 16 + s) return 'board';
  if (y === 35) return onCrossing(x) ? (x <= 19 ? 'yard' : 'paver') : 'hedge';
  if (y === 36) return 'curb';
  // a hedge along the south kerb too, open at the crosswalk
  if (y === KERB_S + 1) return onCrossing(x) ? 'pave' : 'hedge';
  if (y > KERB_S) return 'pave';
  if (y === KERB_S) return 'curb';
  if (y >= 37) return 'road';
  // the garden itself: the cafe's terrace and the yard are one paved space,
  // with a hedge between the cafe and the boardwalk
  // (the hedge runs all the way to the covered walkway: from the plaza the
  // walkway is the only way up to the boardwalk and the boat)
  if (x <= 19 && y === 17) return 'hedge';
  if (x <= 19) return 'yard';
  if (x <= 27) return 'walk';
  // a hedge along the boardwalk, with one opening, from the BBQ tiles (the
  // covered walkway is the other way down)
  if (y === 17 + s) return x >= 98 && x <= 102 ? 'paver' : 'hedge';
  if (PATH.has(key(x, y))) return 'gravel';
  if (x < playEdge(y)) return 'play';
  if (x <= 91) return 'lawn';
  if (x <= 111) return 'paver';
  return 'lawn';
}

// The named parts of the garden, west to east, for the location box. The
// boardwalk, the road and the pavement have no name of their own.
export function areaAt(x, y) {
  if (y < 17 + northShift(x) || y > 34) return '';
  if (x <= 19) return 'Cafe';
  if (x < playEdge(y)) return 'Playground';
  if (x <= 91) return 'Lawn';
  return 'BBQ';
}

// For later: what a cat can walk on. Bush tiles are walkable hiding places;
// trees block only their middle (the trunk). The jetty and boat are walkable.
export const WALKABLE_GROUND = ['board', 'yard', 'walk', 'play', 'lawn', 'paver', 'gravel', 'curb', 'pave', 'road'];

// The apartment building's entrance on the south pavement: the way back
// upstairs. The cats arrive on START, just outside the doors.
export const ENTRANCE = { x: 14, y: PLANT_S - 1, w: 8, h: 3, doorX: 17, doorW: 2, name: 'AMBER', wall: '#e0aa52', wallD: '#c98f3c', roof: ['#8a4a1c', '#b06a2a', '#5e3112'] };
// the building next door, by the east crossing: not home, so the doors stay shut
export const GARNET = { x: 106, y: PLANT_S - 1, w: 8, h: 3, doorX: 109, doorW: 2, name: 'GARNET', wall: '#b4505c', wallD: '#963c49', roof: ['#5a1f2b', '#7c2c3a', '#3c131c'] };
// an outdoor air-conditioning unit in the planting (6 x 1): the cats can climb onto it
export const AC_UNITS = [{ x: 32, y: PLANT_S + 1, w: 6 }, { x: 122, y: PLANT_S + 1, w: 6 }]; // one to the east of each building (Garnet's is near the far end of the pavement)
export const START = [[17, KERB_S + 1], [18, KERB_S + 1]];
// the lobby doors: walking in under the canopy takes the cats back upstairs
export const isMat = (x, y) => y === ENTRANCE.y + 1 && x >= ENTRANCE.doorX && x < ENTRANCE.doorX + ENTRANCE.doorW;

// ---- places the story uses in Act 3 (tiles: [x, y], or a list of them)
// Cheetos's tree, by the east end of the monkey bars: its trunk (the tile a
// cat walks into to climb it) and the open tile south of the trunk, where a
// dog stands to look up. No bush within a tile of that one.
export const CHEETOS_TREE = [66, 32];
export const UNDER_TREE = [66, 33];
// where BBC's collar lies: in the bushes in the garden's far north-east
// corner, under the riverside hedge
export const COLLAR_SPOT = [127, 22];
// the delivery: where the box is put down, on the pavement just east of
// Garnet's doors, and where a cat stands on either side of it before jumping in
export const BOX_SPOT = [GARNET.x + GARNET.w - 1, GARNET.y - 1];
export const BOX_SIDES = [[BOX_SPOT[0] - 1, BOX_SPOT[1]], [BOX_SPOT[0] + 1, BOX_SPOT[1]]];
// The jetty (x 17..30, rows JETTY_N to 10: four planks deep; the gangway comes
// up onto it at x 22 and 23). The boat lies off its north side with a strip of
// open water between, and a plank across it (JETTY_PLANK: the column it comes
// down onto the jetty in). The three humans stand in a row towards the east
// end and the cats stop near the head of the gangway, two clear tiles between
// them (the leader's tile first). The one who falls in goes off the north
// edge, into the water between the jetty and the boat (JETTY_FALL is the last
// plank he stands on, JETTY_SPLASH the water).
// Empty dog cages, two tiles wide each: one on the jetty and two on the boardwalk, there from the
// start. [x, y] of the left tile. What the story does with them in Act 3 (setCages) is CAGE_SETS:
//   empty    as from the start
//   held     the dogs have been called back (the walk home from Garnet): a dog in each of the three,
//            and more cages of them along the jetty, waiting for the boat, which is away
//   loading  the last night: most are stacked across the covered walkway (the barrier, with a dog
//            still in two: STACK_DOGS); at the west end of the jetty, where nobody stands or walks
//            in the ending, one more with a dog in it, and beside it the empty cart they are
//            wheeled along on (`cart`: it stands on two tiles as a cage does)
//   none     after the end, gone with the boat
// Each is { x, y, dog?: a coat of DOG_PALS, cart?: true }.
export const CAGES = [[17, 8], [12, 14], [34, 16]];
export const CAGE_SETS = {
  empty: CAGES.map(([x, y]) => ({ x, y })),
  held: [
    { x: 17, y: 8, dog: 'tan' }, { x: 20, y: 8, dog: 'patched' }, { x: 25, y: 8, dog: 'black' }, { x: 28, y: 8, dog: 'tan' },
    { x: 17, y: 10, dog: 'patched' }, { x: 12, y: 14, dog: 'tan' }, { x: 34, y: 16, dog: 'patched' },
  ],
  loading: [{ x: 17, y: 8, dog: 'tan' }, { x: 17, y: 10, cart: true }],
  none: [],
};
export const STACK_DOGS = { bottom: { 0: 'patched' }, top: { 1: 'tan' } };
// (the sock Socks lost on the jetty lies beside the cage there)
export const JETTY_SOCK = [19, 8];
export const JETTY_N = 7;
export const JETTY_PLANK = 29;
export const JETTY_STAND = [[27, 9], [28, 8], [28, 10]];
export const JETTY_FACE = [[24, 9], [23, 10], [23, 8]];
export const JETTY_FALL = [25, JETTY_N];
export const JETTY_SPLASH = [25, JETTY_N - 1];
// Friends round Mamacat's box (the air-con unit east of Amber's doors): eight
// places, spread out. Nobody is in the middle row of the pavement, which is
// left clear to walk along, and nobody is in the planting right behind the
// box, where the box would hide them. [x, y] or [x, y, pixels off the ground].
export const FRIEND_SPOTS = [
  [29, PAVE_S + 2], [27, PAVE_S + 2], // Cheetos, Socks: on the pavement, in the row next to the planting
  [33, PLANT_S + 1, 10], [34, PLANT_S + 1, 10], // Mamacat and Babycat: up on the box itself (the third number: pixels off the ground)
  [39, PAVE_S + 2], [40, PAVE_S + 2], [38, PLANT_S + 1], [41, PAVE_S + 2], // Scar and the kittens: east of the box, one of them right beside it (not in the gap of the planting, which is the way through)
];
// the line-up: six tiles in a row along Amber's doorstep, west to east
export const LINE_SPOTS = [0, 1, 2, 3, 4, 5].map((i) => [ENTRANCE.doorX - 2 + i, ENTRANCE.y - 1]);

// ---- things standing in the garden (all in tiles)
export const SLIDE = { x: 31, y: 24, w: 7 }; // ladder and platform on x..x+2, chute to the east
export const BARS = { x: 58, y: 31, w: 7 }; // monkey bars: a ladder at each end
const T0 = 16;
export const NET = { cx: 48 * T0, cy: 24 * T0 + 8, rx: 46, ry: 20, h: 52, mast: [[47, 24], [48, 24]] };
export const SHED = { x: 93, y: 29, w: 14, h: 4 };
export const SHED_POSTS = [];
for (const y of [SHED.y, SHED.y + SHED.h]) for (const dx of [0, 4, 9, 13]) SHED_POSTS.push([SHED.x + dx, y]);
// kitchen counters along the back of the shed, between its posts: [x, y, w, sink columns]
export const COUNTERS = [
  [SHED.x + 1, SHED.y + 1, 3, [SHED.x + 2]],
  [SHED.x + 5, SHED.y + 1, 4, [SHED.x + 6, SHED.x + 7]],
  [SHED.x + 10, SHED.y + 1, 3, []],
];
// the riverside cafe (solid) and its terrace: [table x, y] with a chair either side
export const CAFE = { x: -16, y: 21, w: 10, h: 10 };
export const CAFE_SETS = [[-3, 21], [-2, 24], [-3, 27], [-2, 30]];
// the fence across the footpath in the east tree line: [x, y, rows]
export const FENCES = [[EB, 29, 2]];
// Things parked so that nobody gets past the ends of the boardwalk and the
// pavement. (The road is not closed off by anything that can be seen: the
// traffic runs through, and cats simply do not go that way. See roadEnd.)
export const CONES = [[-9, 36], [-14, KERB_S], [131, 36], [137, KERB_S]];
// bicycles on their stands (2 x 1): [x, y, colour, facing]
export const BIKES = [
  [-15, 14, '#c0503f', 'left'], [-14, 15, '#3f6fc4', 'right'], [-13, 16, '#4f9442', 'right'],
  [-8, PAVE_S, '#4f9442', 'right'], [-7, PAVE_S + 1, '#c0503f', 'left'], [-6, PAVE_S + 2, '#3f6fc4', 'left'],
  [117, 17, '#3f6fc4', 'right'], [118, 18, '#c0503f', 'left'], [119, 19, '#d8b23a', 'right'],
  [133, PAVE_S, '#c0503f', 'left'], [132, PAVE_S + 1, '#4f9442', 'right'], [131, PAVE_S + 2, '#3f6fc4', 'right'],
];
// benches with a backrest (3 x 1): the cafe's row stands one tile clear of the hedge behind it
export const BENCHES = [[1, 19], [6, 19], [11, 19], [16, 19], [46, 19], [56, 19]];
// BBQ tables (3 x 3): a plank bench, the table and another bench, side by side and running north-south
export const TABLES = [[114, 21], [120, 22]];
export const COVER_PILLARS = [];
for (let y = 18; y <= 34; y += 4) for (const x of [20, 27]) COVER_PILLARS.push([x, y]);
// Lampposts, two tiles tall: inside the north hedge, inside the south hedge,
// and along the building's pavement in the same columns as the south row.
const SOUTH_LAMPS = [-15, -5, 5, 15, 40, 49, 59, 69, 79, 89, 99, 119, 129];
// (no lamp right outside Amber's doors: cats stand there in a line, at the end, and one must be able to walk up to each)
const PAVEMENT_LAMPS = [-25, ...SOUTH_LAMPS.filter((x) => x !== 15), 139]; // the pavement carries on past both boundaries
export const LAMPS = [
  [-15, 18], [-5, 18], [5, 18], [15, 18], [34, 18], [44, 18], [54, 18], [64, 18], [76, 18], [86, 18], [95, 18], [104, 19], [114, 20], [123, 21],
  ...SOUTH_LAMPS.map((x) => [x, 34]),
  ...PAVEMENT_LAMPS.map((x) => [x, PAVE_S]),
];

// Tiles that are simply in the way.
const SOLID = new Set();
const block = (x, y, w = 1, h = 1) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) SOLID.add(key(x + i, y + j));
};
block(SLIDE.x, SLIDE.y, SLIDE.w, 1);
for (const [x, y] of NET.mast) block(x, y);
block(BARS.x, BARS.y);
block(BARS.x + BARS.w - 1, BARS.y);
block(CAFE.x, CAFE.y, CAFE.w, CAFE.h);
for (const [x, y] of CONES) block(x, y);
for (const [x, y] of BIKES) block(x, y, 2, 1);
for (const [x, y, rows] of FENCES) block(x, y, 1, rows);
block(ENTRANCE.x, ENTRANCE.y, ENTRANCE.w, ENTRANCE.h);
block(ENTRANCE.x - 1, ENTRANCE.y + 1, 1, 2); // planters
block(ENTRANCE.x + ENTRANCE.w, ENTRANCE.y + 1, 1, 2);
block(GARNET.x, GARNET.y, GARNET.w, GARNET.h);
block(GARNET.x - 1, GARNET.y + 1, 1, 2);
block(GARNET.x + GARNET.w, GARNET.y + 1, 1, 2);
// the way in through the lobby doors
for (let i = 0; i < ENTRANCE.doorW; i++) for (const j of [0, 1]) SOLID.delete(key(ENTRANCE.doorX + i, ENTRANCE.y + j));
for (const [x, y] of [...COVER_PILLARS, ...SHED_POSTS, ...LAMPS, ...BINS]) block(x, y);

// Tiles a cat can hop up onto (like the furniture upstairs): h is the height.
const PERCH = new Map();
const perch = (x, y, w, kind, h) => {
  for (let i = 0; i < w; i++) PERCH.set(key(x + i, y), { kind, h, id: kind + x + ',' + y });
};
for (const [x, y] of BENCHES) perch(x, y, 3, 'bench', 7);
for (const [x, y] of TABLES) {
  for (let j = 0; j < 3; j++) {
    perch(x, y + j, 1, 'picnic', 5);
    perch(x + 1, y + j, 1, 'table', 10);
    perch(x + 2, y + j, 1, 'picnic', 5);
  }
}
for (const [x, y] of CAFE_SETS) {
  perch(x - 1, y, 1, 'chair', 6);
  perch(x, y, 1, 'cafetable', 10);
  perch(x + 1, y, 1, 'chair', 6);
}
for (const u of AC_UNITS) {
  perch(u.x, u.y, u.w, 'ac', 13);
  for (let i = 0; i < u.w; i++) BUSH.delete(key(u.x + i, u.y));
}
// Things that do something when a cat walks into them.
const THINGS = new Map();
for (const [x, y, w, sinks] of COUNTERS) {
  perch(x, y, w, 'counter', 10);
  for (const sx of sinks) {
    PERCH.delete(key(sx, y));
    THINGS.set(key(sx, y), { kind: 'sink', x: sx, y });
  }
}
for (let i = 0; i < 3; i++) THINGS.set(key(SLIDE.x + i, SLIDE.y), { kind: 'slide' });
for (let i = 0; i < GARNET.w; i++) THINGS.set(key(GARNET.x + i, GARNET.y), { kind: 'garnet' });
THINGS.set(key(BARS.x, BARS.y), { kind: 'bars', from: BARS.x, to: BARS.x + BARS.w - 1, dir: 1 });
THINGS.set(key(BARS.x + BARS.w - 1, BARS.y), { kind: 'bars', from: BARS.x + BARS.w - 1, to: BARS.x, dir: -1 });
for (const [x, y] of NET.mast) THINGS.set(key(x, y), { kind: 'net' });
// Up a big tree there is room for three. Each place to sit is [pixels east of
// the trunk's tile, pixels up]: the first is where a cat has always sat, the
// second is on the bough to its left and a little lower, and the third (for a
// friend who is with the pair) on the bough to its right, lower again. Every
// tree that can be climbed carries the same list as `seats`.
export const TREE_SEATS = [[0, 30], [-13, 23], [13, 19]];
for (const t of TREES) if (t[0] === 'tree' && t[3] === 3) THINGS.set(key(...trunkOf(t)), { kind: 'tree', x: trunkOf(t)[0], y: trunkOf(t)[1], seats: TREE_SEATS });
// trunks of the trees that can be climbed
export const BIG_TREES = TREES.filter((t) => t[0] === 'tree' && t[3] === 3).map(trunkOf);
export const gardenPerch = (x, y) => PERCH.get(key(x, y)) || null;
// (the barrier, while it is up, is a thing to walk into: { kind: 'barrier' })
const BARRIER_THING = { kind: 'barrier' };
export const gardenThing = (x, y) => THINGS.get(key(x, y)) || (barrierAt(x, y) ? BARRIER_THING : cageAt(x, y) ? { kind: 'cage', dog: cageAt(x, y).dog || null, cart: !!cageAt(x, y).cart } : null);

// Can a cat stand on this tile? Bushes are fine (hiding places), trees block
// only their trunk, and the road can only be crossed on the zebra crossing.
// (which of CAGE_SETS is out: the story says, with setCages)
let cageSet = 'empty';
export const cagesNow = () => CAGE_SETS[cageSet];
export const cageAt = (x, y) => cagesNow().find((c) => c.y === y && (c.x === x || c.x + 1 === x)) || null;
export function gardenBlocked(x, y) {
  const k = groundAt(x, y);
  if (k === 'river') return !(y >= JETTY_N && y <= 10 && x >= 17 && x <= 30); // the jetty
  if (!WALKABLE_GROUND.includes(k)) return true;
  if (roadEnd(x, y) || onMedian(x, y) || barrierAt(x, y) || cageAt(x, y)) return true;
  const id = key(x, y);
  if (SOLID.has(id) || TRUNKS.has(id) || PERCH.has(id) || THINGS.has(id)) return true;
  return false;
}
export const isBush = (x, y) => BUSH.has(key(x, y));

// ------------------------------------------------------------- helpers
function disc(g, cx, cy, rx, ry, c) {
  g.fillStyle = c;
  for (let j = -ry; j <= ry; j++) {
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry + 0.5))));
    g.fillRect(Math.round(cx - half), Math.round(cy + j), half * 2, 1);
  }
}

// ------------------------------------------------------------- ground
function drawGround(g, x, y, kind) {
  const px = x * T;
  const py = y * T;
  switch (kind) {
    case 'river': {
      R(g, px, py, T, T, G.river);
      for (let i = 0; i < 2; i++) {
        if (hash(x, y, i) < 0.55) {
          const rx = px + Math.floor(hash(x, y, i + 5) * 10);
          const ry = py + 3 + i * 7;
          R(g, rx, ry, 5, 1, G.riverL);
          R(g, rx + 1, ry + 1, 3, 1, G.riverD);
        }
      }
      break;
    }
    case 'bank': {
      R(g, px, py, T, T, G.bank);
      R(g, px, py, T, 2, G.bankD);
      R(g, px, py + 13, T, 3, '#bdb8ab');
      if (x % 4 === 0) R(g, px + 7, py + 5, 1, 6, G.bankD);
      break;
    }
    case 'hedge': {
      R(g, px, py, T, T, G.hedge);
      for (let i = 0; i < 9; i++) {
        const hx = px + Math.floor(hash(x, y, i) * 15);
        const hy = py + Math.floor(hash(x, y, i + 20) * 15);
        R(g, hx, hy, 2, 2, hash(x, y, i + 40) < 0.5 ? G.hedgeD : G.hedgeL);
      }
      // a clipped hedge is a low wall: lit along the top, dark down its south face
      if (groundAt(x, y - 1) !== 'hedge') R(g, px, py, T, 1, G.hedgeL);
      if (groundAt(x, y + 1) !== 'hedge') {
        R(g, px, py + 10, T, 5, '#173a1f');
        for (let i = 0; i < T; i += 3) P(g, px + i + (y & 1), py + 11 + ((i + x) % 3), G.hedgeD);
        R(g, px, py + 15, T, 1, C.k);
      }
      break;
    }
    case 'board': {
      R(g, px, py, T, T, G.board);
      for (let j = 0; j < 4; j++) {
        R(g, px, py + j * 4 + 3, T, 1, G.boardD);
        R(g, px, py + j * 4, T, 1, G.boardL);
        if ((x + j * 3 + y) % 4 === 0) R(g, px + 5, py + j * 4, 1, 3, G.boardD);
      }
      break;
    }
    case 'yard': {
      R(g, px, py, T, T, G.yard);
      if (x % 3 === 0) R(g, px, py, 1, T, G.yardD);
      if (y % 3 === 0) R(g, px, py, T, 1, G.yardD);
      if (hash(x, y) < 0.15) P(g, px + 4 + Math.floor(hash(x, y, 3) * 8), py + 6, G.yardD);
      break;
    }
    case 'walk': {
      R(g, px, py, T, T, G.walk);
      R(g, px, py, T, 1, G.walkD);
      R(g, px, py, 1, T, G.walkD);
      R(g, px + 8, py + 8, 8, 1, G.walkD);
      R(g, px + 8, py + 8, 1, 8, G.walkD);
      break;
    }
    case 'lawn': {
      R(g, px, py, T, T, G.grass);
      for (let i = 0; i < 6; i++) {
        const gx = px + Math.floor(hash(x, y, i) * 15);
        const gy = py + Math.floor(hash(x, y, i + 9) * 14);
        const c = hash(x, y, i + 30) < 0.5 ? G.grassD : G.grassL;
        P(g, gx, gy, c);
        P(g, gx, gy + 1, c);
      }
      break;
    }
    case 'paver': {
      R(g, px, py, T, T, G.paver);
      R(g, px, py, T, 1, G.paverD);
      R(g, px, py + 8, T, 1, G.paverD);
      R(g, px + (y % 2) * 8, py, 1, 8, G.paverD);
      R(g, px + (y % 2) * 8 + 8, py + 8, 1, 8, G.paverD);
      break;
    }
    case 'gravel': {
      R(g, px, py, T, T, G.gravel);
      for (let i = 0; i < 7; i++) P(g, px + Math.floor(hash(x, y, i) * 16), py + Math.floor(hash(x, y, i + 7) * 16), G.gravelD);
      // where the path meets grass, tufts creep over the edge so it isn't ruler-straight
      const grassy = (nx, ny) => groundAt(nx, ny) === 'lawn';
      for (let i = 0; i < T; i++) {
        const tuft = (n) => 1 + Math.floor(hash(x * 16 + i, y, n) * 3.2);
        if (grassy(x, y - 1)) R(g, px + i, py, 1, tuft(1), hash(x * 16 + i, y, 11) < 0.3 ? G.grassD : G.grass);
        if (grassy(x, y + 1)) {
          const d = tuft(2);
          R(g, px + i, py + T - d, 1, d, hash(x * 16 + i, y, 12) < 0.3 ? G.grassD : G.grass);
        }
        if (grassy(x - 1, y)) R(g, px, py + i, tuft(3), 1, hash(x, y * 16 + i, 13) < 0.3 ? G.grassD : G.grass);
        if (grassy(x + 1, y)) {
          const d = tuft(4);
          R(g, px + T - d, py + i, d, 1, hash(x, y * 16 + i, 14) < 0.3 ? G.grassD : G.grass);
        }
      }
      break;
    }
    case 'curb': {
      R(g, px, py, T, T, G.curb);
      if (y > 42) {
        // the south kerb faces the road on its north side
        R(g, px, py, T, 3, G.curbD);
        R(g, px, py + 15, T, 1, '#d6d2c9');
        if (x % 2 === 0) R(g, px, py + 3, 1, 12, '#b0aca3');
        break;
      }
      R(g, px, py, T, 1, '#d6d2c9');
      R(g, px, py + 13, T, 3, G.curbD);
      if (x % 2 === 0) R(g, px, py + 1, 1, 12, '#b0aca3');
      break;
    }
    case 'pave': {
      // concrete slabs, one per tile, in a brick-bond
      R(g, px, py, T, T, G.pave);
      R(g, px, py, T, 1, G.paveL);
      R(g, px, py + T - 1, T, 1, G.paveD);
      R(g, px + (y % 2 ? 8 : 0), py, 1, T, G.paveD);
      for (let i = 0; i < 3; i++) {
        P(g, px + Math.floor(hash(x, y, i) * 16), py + 1 + Math.floor(hash(x, y, i + 4) * 14), hash(x, y, i + 8) < 0.5 ? G.paveD : G.paveL);
      }
      break;
    }
    case 'road': {
      R(g, px, py, T, T, G.road);
      for (let i = 0; i < 4; i++) {
        P(g, px + Math.floor(hash(x, y, i) * 16), py + Math.floor(hash(x, y, i + 4) * 16), hash(x, y, i + 8) < 0.5 ? G.roadD : G.roadL);
      }
      break;
    }
    case 'play':
      break; // drawn afterwards (the hexagon rubber floor)
  }
}

// The playground's rubber floor: hexagons, each split into three coloured
// diamonds ("tumbling blocks"). The pattern is squashed slightly so it
// repeats every 2 tiles across and 3 tiles down, with hexagon centres on
// tile corners.
function drawHexFloor(g) {
  const S3 = Math.sqrt(3);
  const Rr = 16; // 3 * Rr = 48px = 3 tiles down
  const kx = (Rr * S3) / 32; // squash so one hexagon is exactly 2 tiles wide
  const sets = [
    [G.hexBlue, G.hexCream, G.hexGreen],
    [G.hexPink, G.hexCream, G.hexBlue],
    [G.hexGreen, G.hexPink, G.hexCream],
    [G.hexCream, G.hexBlue, G.hexPink],
  ];
  const idAt = (px, py) => {
    const X = px * kx;
    const qf = ((S3 / 3) * X - py / 3) / Rr;
    const rf = ((2 / 3) * py) / Rr;
    let q = Math.round(qf);
    let r = Math.round(rf);
    const s = Math.round(-qf - rf);
    const dq = Math.abs(q - qf);
    const dr = Math.abs(r - rf);
    const ds = Math.abs(s + qf + rf);
    if (dq > dr && dq > ds) q = -r - s;
    else if (dr > ds) r = -q - s;
    const cx = Rr * S3 * (q + r / 2);
    const cy = Rr * 1.5 * r;
    const ang = (Math.atan2(py - cy, X - cx) * 180) / Math.PI;
    const sector = ang >= -150 && ang < -30 ? 0 : ang >= -30 && ang < 90 ? 1 : 2;
    return { q, r, sector, key: q * 1000 + r * 3 + sector };
  };
  for (let y = 18; y <= 34; y++)
    for (let x = 28; x < playEdge(y); x++) {
      if (groundAt(x, y) !== 'play') continue;
      for (let j = 0; j < T; j += 2)
        for (let i = 0; i < T; i += 2) {
          const px = x * T + i;
          const py = y * T + j;
          const a = idAt(px + 1, py + 1);
          const edge = a.key !== idAt(px + 3, py + 1).key || a.key !== idAt(px + 1, py + 3).key;
          const set = sets[(((a.q + a.r * 2) % 4) + 4) % 4];
          g.fillStyle = edge ? G.hexGrout : set[a.sector];
          g.fillRect(px, py, 2, 2);
        }
      // a rubber kerb wherever the floor ends
      const px = x * T;
      const py = y * T;
      const open = (nx, ny) => !['play', 'hedge'].includes(groundAt(nx, ny));
      if (open(x - 1, y)) R(g, px, py, 2, T, G.rubberEdge);
      if (open(x + 1, y)) R(g, px + T - 2, py, 2, T, G.rubberEdge);
      if (open(x, y + 1)) R(g, px, py + T - 2, T, 2, G.rubberEdge);
      if (groundAt(x, y - 1) === 'hedge') R(g, px, py, T, 2, G.rubberEdge);
    }
}

// ------------------------------------------------------------- plants
// One tile of bush. Neighbouring bush tiles merge; open sides get a dark,
// nibbled outline and rounded corners.
function bushTile(g, x, y) {
  const px = x * T;
  const py = y * T;
  const L = !BUSH.has(key(x - 1, y));
  const Rt = !BUSH.has(key(x + 1, y));
  const U = !BUSH.has(key(x, y - 1));
  const D = !BUSH.has(key(x, y + 1));
  if (D) R(g, px + 1, py + T, T - 2, 2, 'rgba(20,30,15,0.25)');
  for (let j = 0; j < T; j++)
    for (let i = 0; i < T; i++) {
      let d = 99;
      if (L) d = Math.min(d, i);
      if (Rt) d = Math.min(d, 15 - i);
      if (U) d = Math.min(d, j);
      if (D) d = Math.min(d, 15 - j);
      if (L && U) d = Math.min(d, i + j - 4);
      if (Rt && U) d = Math.min(d, 15 - i + j - 4);
      if (L && D) d = Math.min(d, i + 15 - j - 4);
      if (Rt && D) d = Math.min(d, 15 - i + 15 - j - 4);
      if (d < 0) continue;
      const h = hash(px + i, py + j, 9);
      if (d === 0 && h < 0.3) continue; // leafy, uneven outline
      let c = G.bush;
      if (d <= 1) c = G.bushD;
      else if (h < 0.1) c = G.bushD;
      else if (h < 0.24) c = G.bushL;
      // light catches the top-left of each clump
      if (d >= 2 && d <= 4 && (U || L) && (i + j) % 3 === 0) c = G.bushL;
      P(g, px + i, py + j, c);
    }
}

// Everything that stands up is drawn the way the apartment's furniture is:
// seen from the south and a little above, so it shows its top and its south
// side, and rises over the tiles to the north of where it stands.

// a small broadleaf tree: (bx, by) is where the trunk meets the ground
function drawTree(g, bx, by, n, seed) {
  if (n === 3) return drawBigTree(g, bx, by, seed);
  const r = 14;
  const ry = r - 3;
  const th = 8; // trunk showing below the crown
  const tw = 2;
  const cy = by - th - ry + 3;
  R(g, bx - tw - 1, by - th - 5, tw * 2 + 2, th + 6, C.k);
  R(g, bx - tw, by - th - 5, tw * 2, th + 5, C.walnut);
  R(g, bx - tw, by - th - 5, 1, th + 5, C.wood);
  R(g, bx + tw - 1, by - th - 5, 1, th + 5, '#4a3324');
  R(g, bx - tw - 2, by - 1, tw * 2 + 4, 1, C.k); // roots
  disc(g, bx, cy, r + 1, ry + 1, C.k);
  disc(g, bx, cy, r, ry, G.treeD);
  disc(g, bx, cy - 2, r - 1, ry - 2, G.tree);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + seed;
    const kx = Math.round(bx + Math.cos(a) * r * 0.5);
    const ky = Math.round(cy - 1 + Math.sin(a) * ry * 0.45);
    disc(g, kx, ky + 2, r * 0.36, ry * 0.32, G.treeD);
    disc(g, kx, ky, r * 0.36, ry * 0.32, G.tree);
    disc(g, kx - 1, ky - 1, r * 0.22, ry * 0.18, G.treeL);
  }
  disc(g, bx - 2, cy - ry * 0.45, r * 0.34, ry * 0.26, G.treeL);
  for (let i = 0; i < 2 * T; i++) {
    const a = hash(seed, i, 1) * Math.PI * 2;
    const d = Math.sqrt(hash(seed, i, 2)) * (r - 3);
    P(g, Math.round(bx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d * 0.8), hash(seed, i, 3) < 0.5 ? G.treeD : G.treeL);
  }
}

// A big tree: the crown is a loose heap of leaf clumps, so its outline is
// lumpy, and between some clumps there are small ragged chinks of daylight
// (enough to glimpse a cat behind it).
const CLUMPS = [
  // x, y, rx, ry — back (top) of the crown first
  [1, -13, 10, 7], [-11, -8, 9, 7], [12, -9, 9, 6],
  [-17, 1, 7, 6], [18, 0, 6, 6], [0, -3, 10, 7],
  [-9, 6, 10, 7], [10, 6, 10, 7], [0, 10, 8, 5],
];
const CHINKS = [
  // each a few small rectangles: [x, y, w, h]
  [[-6, -7, 3, 2], [-5, -5, 4, 1], [-4, -4, 2, 2]],
  [[7, -3, 2, 3], [8, -2, 3, 2], [9, 0, 2, 2]],
  [[-13, 1, 2, 2], [-12, 2, 3, 2], [-10, 4, 2, 1]],
  [[0, 3, 4, 1], [1, 4, 2, 2], [-1, 2, 2, 1]],
];
function drawBigTree(g, bx, by, seed) {
  const th = 11;
  const tw = 3;
  const cy = by - th - 15;
  const jit = (i, s) => Math.round(hash(seed, i, s) * 3) - 1;
  // trunk, forking into two boughs under the crown
  R(g, bx - tw - 1, by - th - 6, tw * 2 + 2, th + 7, C.k);
  R(g, bx - tw, by - th - 6, tw * 2, th + 6, C.walnut);
  R(g, bx - tw, by - th - 6, 1, th + 6, C.wood);
  R(g, bx + tw - 1, by - th - 6, 1, th + 6, '#4a3324');
  R(g, bx - tw - 2, by - 1, tw * 2 + 4, 1, C.k);
  for (const [x, y] of [[-8, -2], [8, -1], [0, -6]]) {
    rope(g, bx, cy + 12, bx + x, cy + y, C.walnut);
    rope(g, bx + 1, cy + 12, bx + x + 1, cy + y, '#4a3324');
  }
  const S = 64;
  const [cv, c] = canvas(S, S);
  const o = S / 2;
  const cl = CLUMPS.map(([x, y, rx, ry], i) => [o + x + jit(i, 11), o + y + jit(i, 12), rx + (hash(seed, i, 13) < 0.4 ? 1 : 0), ry]);
  for (const [x, y, rx, ry] of cl) disc(c, x, y, rx + 1, ry + 1, C.k);
  cl.forEach(([x, y, rx, ry], i) => {
    disc(c, x, y, rx, ry, G.treeD);
    disc(c, x, y - 2, rx - 1, ry - 2, G.tree);
    disc(c, x - 2, y - 3, rx * 0.5, ry * 0.4, G.treeL);
    // leaf speckle
    for (let k = 0; k < 9; k++) {
      const a = hash(seed + i, k, 1) * Math.PI * 2;
      const d = Math.sqrt(hash(seed + i, k, 2)) * (rx - 2);
      P(c, Math.round(x + Math.cos(a) * d), Math.round(y - 1 + Math.sin(a) * d * 0.6), hash(seed + i, k, 3) < 0.5 ? G.treeD : G.treeL);
    }
  });
  // chinks: shaded round the edge, then cut right through
  const chinks = CHINKS.map((rects, i) => rects.map(([x, y, w, h]) => [o + x + jit(i, 21), o + y + jit(i, 22), w, h]));
  for (const rects of chinks) for (const [x, y, w, h] of rects) R(c, x - 1, y - 1, w + 2, h + 2, G.treeD);
  for (const rects of chinks) for (const [x, y, w, h] of rects) c.clearRect(x, y, w, h);
  g.drawImage(cv, bx - o, cy - o);
}

// a palm: a tall ringed trunk with a crown of drooping fronds
function drawPalm(g, bx, by, seed) {
  const h = 30;
  const lean = (seed % 3) - 1;
  const tx = (t) => bx + Math.round((lean * t * t) / (h * h) * 3);
  for (let t = 0; t <= h; t++) {
    const x = tx(t);
    const w = t < 4 ? 3 : 2;
    R(g, x - w, by - t, w * 2, 1, C.k);
    R(g, x - w + 1, by - t, w * 2 - 2, 1, t % 4 === 0 ? '#5a4a2c' : '#8a7446');
    P(g, x - w + 1, by - t, '#a08a58');
  }
  const cx = tx(h);
  const cy = by - h - 1;
  // fronds all round, with a few short ones hanging down the front
  const fronds = [-2.95, -2.55, -2.15, -1.75, -1.35, -0.95, -0.55, -0.2, 0.2, 0.6, 2.55, 2.95, 1.05, 1.6, 2.1];
  for (const pass of [0, 1]) {
    fronds.forEach((a, i) => {
      const len = i >= 12 ? 12 + (i % 2) * 2 : 19 + (i % 2) * 3;
      for (let t = 1; t <= len; t++) {
        const fx = Math.round(cx + Math.cos(a) * t);
        const fy = Math.round(cy + Math.sin(a) * t * 0.55 + (t * t * 0.55) / len);
        const wid = t < len * 0.8 ? 1 : 0;
        if (!pass) R(g, fx - wid - 1, fy - wid - 1, wid * 2 + 3, wid * 2 + 3, G.palmD);
        else if (t < len) {
          R(g, fx - wid, fy - wid, wid * 2 + 1, wid * 2 + 1, t % 4 < 2 ? G.palm : G.palmL);
          // leaflets
          if (t > 3 && t % 3 === 0) P(g, fx, fy + wid + 1, G.palm);
          if (t > 3 && t % 3 === 1) P(g, fx, fy - wid - 1, G.palmL);
        }
      }
    });
  }
  disc(g, cx, cy, 3, 3, '#6b5a35');
  disc(g, cx, cy - 1, 2, 1, G.palmL);
}

// a big wheeled trash can, the cafe's: a dark green body, a lid hinged at the back, two wheels
function drawBin(g, x, y) {
  const px = x * T + 2;
  const py = y * T - 6;
  R(g, px + 1, py + 4, 13, 17, '#14100f'); // outline
  R(g, px + 2, py + 5, 11, 15, '#2f5a3c');
  R(g, px + 2, py + 5, 11, 2, '#3f7550'); // lid
  R(g, px + 2, py + 7, 11, 1, '#1d3a27');
  R(g, px + 4, py + 10, 1, 8, '#264b32'); // ribs
  R(g, px + 10, py + 10, 1, 8, '#264b32');
  R(g, px + 6, py + 9, 3, 1, '#d8d4c8'); // a label
  R(g, px + 1, py + 19, 3, 3, '#14100f'); // wheels
  R(g, px + 11, py + 19, 3, 3, '#14100f');
  R(g, px + 2, py + 20, 1, 1, '#6b6b70');
  R(g, px + 12, py + 20, 1, 1, '#6b6b70');
}

// a lamppost, two tiles tall
function drawLamp(g, bx, by) {
  R(g, bx - 3, by - 3, 6, 3, C.k);
  R(g, bx - 2, by - 3, 4, 2, C.charcoal);
  R(g, bx - 1, by - 26, 3, 24, C.k);
  P(g, bx, by - 25, C.steel);
  R(g, bx, by - 24, 1, 21, C.charcoal);
  // lantern
  R(g, bx - 4, by - 33, 9, 8, C.k);
  R(g, bx - 3, by - 31, 7, 5, '#f4e3a6');
  R(g, bx - 3, by - 31, 7, 1, C.white);
  R(g, bx, by - 31, 1, 5, C.charcoal);
  R(g, bx - 2, by - 34, 5, 1, C.k);
}
export const LAMP_HEAD = { dx: -3, dy: -31, w: 7, h: 5 };

// a pillar holding up a roof: h pixels tall
function drawPillar(g, bx, by, h, body, lit) {
  R(g, bx - 3, by - h, 6, h + 1, C.k);
  R(g, bx - 2, by - h, 4, h, body);
  R(g, bx - 2, by - h, 1, h, lit);
  R(g, bx - 4, by - 2, 8, 3, C.k);
  R(g, bx - 3, by - 1, 6, 1, body);
}

// ------------------------------------------------------------- objects
// All positions below are in tiles, and every object fills whole tiles.

// the jetty (14 x 4), and the plank over to the speedboat moored off it
function drawJetty(g) {
  // the plank from the boat's side down onto the jetty, over the water between
  if (!boatGone) {
    const px = JETTY_PLANK * T + 2;
    const top = (BOAT_Y + 2) * T + 8;
    const h = JETTY_N * T - top + 2;
    R(g, px - 1, top, 14, h, C.k);
    R(g, px, top, 12, h, G.board);
    R(g, px, top, 1, h, G.boardL);
    R(g, px + 11, top, 1, h, G.boardD);
    for (let y = top + 3; y < top + h; y += 5) R(g, px, y, 12, 1, G.boardD);
  }
  for (let x = 17; x <= 30; x++)
    for (let y = JETTY_N; y <= 10; y++) {
      const px = x * T;
      const py = y * T;
      R(g, px, py, T, T, G.board);
      for (let i = 0; i < 4; i++) {
        R(g, px + i * 4 + 3, py, 1, T, G.boardD);
        R(g, px + i * 4, py, 1, T, G.boardL);
      }
    }
  R(g, 17 * T, JETTY_N * T, 14 * T, 1, G.boardD);
  R(g, 17 * T, 11 * T - 2, 14 * T, 2, G.boardD);
  // mooring posts along the far edge, standing up out of the water
  for (const x of [17, 20, 24, 27, 30]) {
    const px = x * T + 6;
    const py = JETTY_N * T + 3;
    R(g, px - 1, py - 13, 6, 14, C.k);
    R(g, px, py - 12, 4, 12, C.walnut);
    R(g, px, py - 12, 1, 12, C.wood);
    R(g, px, py - 12, 4, 2, C.woodL);
    R(g, px - 1, py + 1, 7, 2, 'rgba(20,20,20,0.2)');
  }
  // cleats on the near edge
  for (const x of [19, 26, 29]) {
    R(g, x * T + 4, 11 * T - 6, 8, 3, C.k);
    R(g, x * T + 5, 11 * T - 6, 6, 1, C.steelL);
  }
}

// The moored boat, bow to the west, seen from above and a little to the
// south like everything else: the deck on top, and below it the near side of
// the hull down to the waterline.
const BOAT_Y = 2; // the row its picture starts on (the deck's centre line is 22 pixels below that)
let boatGone = false; // (after the end it has been towed away: no boat, and no plank)
function drawBoat(g) {
  if (boatGone) return;
  const x0 = 18 * T;
  const y0 = BOAT_Y * T;
  const len = 14 * T;
  const cy = y0 + 22; // centre line of the deck
  const half = (i) => {
    const bow = Math.min(1, i / 78);
    const stern = Math.min(1, (len - i) / 5);
    return Math.max(1, Math.round(19 * (1 - (1 - bow) * (1 - bow)) * (0.86 + 0.14 * stern)));
  };
  const side = (i) => Math.round(Math.min(15, 5 + i * 0.22)); // freeboard, lower at the bow
  // reflection on the water
  for (let i = 4; i < len; i++) R(g, x0 + i + 2, cy + half(i) + side(i), 1, 3, 'rgba(20,40,70,0.28)');
  for (let i = 0; i < len; i++) {
    const w = half(i);
    const hh = side(i);
    const x = x0 + i;
    const top = cy - w;
    const bot = cy + w;
    // near side of the hull: white, a navy stripe, red below the waterline
    R(g, x, bot, 1, hh, C.white);
    R(g, x, bot + 3, 1, 2, C.navy);
    if (hh > 9) R(g, x, bot + 7, 1, 1, C.grayL);
    R(g, x, bot + hh - 3, 1, 3, C.red);
    P(g, x, bot + hh, C.k);
    // deck: gunwale, then the inside of the far wall, then the floor
    R(g, x, top, 1, w * 2, C.k);
    if (w > 2) R(g, x, top + 1, 1, w * 2 - 2, C.white);
    if (w > 5) {
      R(g, x, top + 3, 1, w * 2 - 6, '#e4dccb');
      R(g, x, top + 3, 1, Math.min(5, w - 3), C.grayL);
      P(g, x, top + 3, C.k);
      P(g, x, bot - 3, C.k);
    }
  }
  // outlines at the bow tip and the stern
  R(g, x0 + len - 1, cy - half(len - 1), 1, half(len - 1) * 2 + side(len - 1) + 1, C.k);
  R(g, x0, cy - 1, 1, 2 + side(0), C.k);
  // foredeck (covered bow)
  for (let i = 10; i < 62; i++) {
    const w = half(i) - 2;
    if (w > 1) R(g, x0 + i, cy - w, 1, w * 2, i === 61 ? C.k : '#f7f1e3');
  }
  R(g, x0 + 30, cy - 1, 26, 1, C.grayL);
  // a box seen from the south-east: lid on top, front face below it
  const box = (bx, by, w, d, h, lid, face) => {
    R(g, bx - 1, by - h - 1, w + 2, d + h + 2, C.k);
    R(g, bx, by - h, w, d, lid);
    R(g, bx, by - h + d, w, h, face);
  };
  // bench seats with red cushions (backrest at the far side)
  box(x0 + 66, cy - 14, 24, 5, 6, C.red, '#8f3a2f');
  box(x0 + 66, cy + 4, 24, 7, 4, C.red, '#8f3a2f');
  R(g, x0 + 67, cy - 19, 22, 1, '#d9705f');
  box(x0 + 150, cy - 14, 44, 5, 6, C.red, '#8f3a2f');
  box(x0 + 150, cy + 4, 44, 7, 4, C.red, '#8f3a2f');
  R(g, x0 + 151, cy - 19, 42, 1, '#d9705f');
  // console with a windscreen
  box(x0 + 108, cy - 2, 26, 8, 10, C.steelL, C.steel);
  R(g, x0 + 105, cy - 17, 3, 14, C.k);
  R(g, x0 + 106, cy - 16, 1, 12, '#bfe3ee');
  R(g, x0 + 105, cy - 17, 26, 1, C.k);
  R(g, x0 + 122, cy - 10, 5, 4, C.k); // wheel
  R(g, x0 + 123, cy - 9, 3, 2, C.charcoal);
  // mooring cleat and line to the jetty
  R(g, x0 + 40, cy + half(40) - 2, 4, 2, C.k);
  for (let j = 0; cy + half(40) + j < JETTY_N * T - 6; j++) P(g, x0 + 44 + (j >> 2), cy + half(40) + j, C.tan);
  // outboard motor, standing proud of the stern
  R(g, x0 + len - 5, cy - 13, 10, 20, C.k);
  R(g, x0 + len - 4, cy - 12, 8, 8, C.charcoal);
  R(g, x0 + len - 4, cy - 4, 8, 10, '#3a3a40');
  R(g, x0 + len - 3, cy - 11, 6, 1, C.steel);
}

// The river wall where the north edge slants (east of x=96): painted over the stepped tiles, a pixel
// column at a time. Above it is river, where the tiles had wall; the wall itself is a tile deep, as
// everywhere; and the hedge behind it begins where the wall ends, with its lit top edge.
function slantWall(g) {
  for (let x = 96; x < GX1; x++) {
    const tileTop = (11 + northShift(x)) * T;
    for (let px = x * T; px < (x + 1) * T; px++) {
      const top = wallTop(px);
      if (top > tileTop) R(g, px, tileTop, 1, top - tileTop, G.river);
      R(g, px, top, 1, T, G.bank);
      R(g, px, top, 1, 2, G.bankD);
      R(g, px, top + 13, 1, 3, '#bdb8ab');
      if (x % 4 === 0 && px === x * T + 7) R(g, px, top + 5, 1, 6, G.bankD);
      P(g, px, top + T, G.hedgeL);
    }
    // (ripples on the strip of water that was wall)
    for (let i = 0; i < 2; i++) {
      if (hash(x, 11, i + 70) >= 0.55) continue;
      const rx = x * T + Math.floor(hash(x, 11, i + 75) * 10);
      const ry = tileTop + 2 + i * 6;
      if (ry + 3 < wallTop(rx)) {
        R(g, rx, ry, 5, 1, G.riverL);
        R(g, rx + 1, ry + 1, 3, 1, G.riverD);
      }
    }
  }
}

// a flag on a pole, standing on the embankment
function flag(g, x, y, col) {
  const px = x * T + 7;
  const py = y * T + 12;
  R(g, px - 1, py - 25, 3, 26, C.k);
  R(g, px, py - 24, 1, 24, C.steelL);
  R(g, px + 2, py - 24, 8, 6, C.k);
  R(g, px + 2, py - 23, 7, 4, col);
  R(g, px - 2, py, 5, 2, C.k);
}

// a pixel line
function rope(g, x1, y1, x2, y2, col) {
  const n = Math.max(1, Math.abs(Math.round(x2 - x1)), Math.abs(Math.round(y2 - y1)));
  for (let i = 0; i <= n; i++) P(g, Math.round(x1 + ((x2 - x1) * i) / n), Math.round(y1 + ((y2 - y1) * i) / n), col);
}

// Slide (7 x 1), seen side-on: ladder at the west end, a platform with a
// guard rail, then the chute running down to the east.
function drawSlide(g) {
  const x0 = SLIDE.x * T;
  const gy = (SLIDE.y + 1) * T - 2; // the ground line
  const top = gy - 27; // platform deck
  // far legs
  R(g, x0 + 20, top - 3, 2, 27, C.steel);
  R(g, x0 + 38, top - 3, 2, 27, C.steel);
  // ladder
  for (const lx of [x0 + 3, x0 + 11]) {
    R(g, lx - 1, top - 2, 4, 30, C.k);
    R(g, lx, top - 1, 2, 28, C.steelL);
  }
  for (let y = gy - 4; y > top; y -= 5) {
    R(g, x0 + 5, y, 6, 2, C.k);
    R(g, x0 + 5, y, 6, 1, C.steel);
  }
  // near legs
  for (const lx of [x0 + 16, x0 + 34]) {
    R(g, lx - 1, top, 4, 28, C.k);
    R(g, lx, top, 2, 27, C.steelL);
  }
  R(g, x0 + 18, top + 13, 16, 1, C.steel); // brace
  // platform deck and its guard rail
  R(g, x0 + 14, top - 1, 26, 5, C.k);
  R(g, x0 + 15, top, 24, 3, C.grayL);
  R(g, x0 + 15, top, 24, 1, C.white);
  R(g, x0 + 14, top - 14, 26, 13, C.k);
  R(g, x0 + 15, top - 13, 24, 11, G.yellow);
  R(g, x0 + 15, top - 13, 24, 2, '#f7dc7a');
  R(g, x0 + 15, top - 4, 24, 2, G.yellowD);
  for (const hx of [x0 + 21, x0 + 30]) R(g, hx, top - 9, 4, 4, G.yellowD);
  // chute
  const cx0 = x0 + 39;
  const cx1 = x0 + SLIDE.w * T - 10;
  for (let x = cx0; x <= cx1; x++) {
    const t = (x - cx0) / (cx1 - cx0);
    const y = Math.round(top - 2 + (gy - 7 - (top - 2)) * (t * t * (3 - 2 * t)));
    R(g, x, y - 7, 1, 17, C.k);
    R(g, x, y - 6, 1, 4, '#f7dc7a');
    R(g, x, y - 2, 1, 8, G.yellow);
    R(g, x, y + 6, 1, 3, G.yellowD);
  }
  // the run-out at the bottom
  R(g, cx1, gy - 14, 9, 14, C.k);
  R(g, cx1, gy - 13, 8, 4, '#f7dc7a');
  R(g, cx1, gy - 9, 8, 6, G.yellow);
  R(g, cx1, gy - 3, 8, 2, G.yellowD);
  R(g, cx1 + 4, gy - 3, 3, 3, C.k);
  R(g, cx1 + 5, gy - 3, 1, 2, C.steelL);
  // a prop under the middle of the chute
  const mx = Math.round((cx0 + cx1) / 2);
  R(g, mx - 1, gy - 12, 4, 13, C.k);
  R(g, mx, gy - 12, 2, 12, C.steelL);
}

// Rope climbing net (6 x 3 on the ground): a mast with ropes fanning down to
// a ring. Only the mast is in the way; the cats can walk in under the ropes.
function drawNet(g) {
  const { cx, cy, rx, ry, h } = NET;
  const ax = cx;
  const ay = cy - h;
  const n = 12;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.26;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, Math.sin(a)]);
  }
  const hoop = (f, col, back) => {
    const steps = Math.round(90 * f) + 12;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      if (Math.sin(a) < 0 !== back) continue;
      P(g, Math.round(ax + Math.cos(a) * rx * f), Math.round(ay + (cy - ay) * f + Math.sin(a) * ry * f), col);
    }
  };
  // far side of the net
  for (const f of [0.34, 0.67, 1]) hoop(f, '#2a3770', true);
  for (const [x, y, sn] of pts) if (sn < 0) rope(g, ax, ay, x, y, '#2a3770');
  // mast
  R(g, cx - 2, ay - 2, 5, h + 4, C.k);
  R(g, cx - 1, ay - 1, 3, h + 2, C.steelL);
  R(g, cx - 1, ay - 1, 1, h + 2, C.white);
  // near side
  for (const [x, y, sn] of pts) if (sn >= 0) rope(g, ax, ay, x, y, '#3c4f96');
  for (const f of [0.34, 0.67, 1]) hoop(f, '#4a60b0', false);
  for (const [x, y] of pts) {
    R(g, Math.round(x) - 2, Math.round(y) - 2, 4, 4, C.k);
    R(g, Math.round(x) - 1, Math.round(y) - 1, 2, 2, C.red);
  }
  R(g, cx - 3, ay - 4, 7, 5, C.k);
  R(g, cx - 2, ay - 3, 5, 3, C.red);
}

// Monkey bars (7 x 1), seen side-on: a ladder at each end and the bars
// overhead between them. The cats can walk underneath.
function drawMonkeyBars(g) {
  const x0 = BARS.x * T + 6;
  const x1 = (BARS.x + BARS.w - 1) * T + 8;
  const gy = (BARS.y + 1) * T - 2;
  const top = gy - 27;
  const back = 5; // how far up the screen the far rail sits
  // far posts and rail
  for (const x of [x0, x1]) R(g, x + 1, top - back, 2, 27, '#8f3a2f');
  R(g, x0, top - back - 1, x1 - x0 + 4, 3, C.k);
  R(g, x0 + 1, top - back, x1 - x0 + 2, 1, '#8f3a2f');
  // rungs between the two rails
  for (let x = x0 + 8; x < x1 - 2; x += 8) {
    rope(g, x + 2, top - back + 1, x, top, C.k);
    rope(g, x + 3, top - back + 1, x + 1, top, C.steelL);
  }
  // near posts, with ladder rungs across to the far ones
  for (const x of [x0, x1]) {
    for (let y = gy - 5; y > top + 3; y -= 6) R(g, x + 1, y - 2, 3, 1, C.steel);
    R(g, x - 1, top - 1, 4, 29, C.k);
    R(g, x, top, 2, 27, C.red);
    P(g, x, top, '#d9705f');
  }
  // near rail
  R(g, x0 - 1, top - 1, x1 - x0 + 4, 4, C.k);
  R(g, x0, top, x1 - x0 + 2, 2, C.red);
  R(g, x0, top, x1 - x0 + 2, 1, '#d9705f');
}

// bench: w x 1 tiles
function bench(g, tx, ty, w = 3) {
  // seen from the south: the backrest stands up behind the seat (it overhangs
  // the tile above), then the seat, its front edge and the legs
  const px = tx * T;
  const py = ty * T;
  const W = w * T;
  R(g, px + 3, py + 13, W - 4, 3, 'rgba(20,20,20,0.2)');
  // backrest: two rails between end posts
  R(g, px + 1, py - 7, W - 2, 11, C.k);
  R(g, px + 2, py - 6, W - 4, 4, C.wood);
  R(g, px + 2, py - 6, W - 4, 1, C.woodL);
  R(g, px + 2, py - 1, W - 4, 4, C.wood);
  R(g, px + 2, py - 1, W - 4, 1, C.woodL);
  R(g, px + 2, py - 6, 2, 9, C.woodD);
  R(g, px + W - 4, py - 6, 2, 9, C.woodD);
  R(g, px + (W >> 1) - 1, py - 6, 2, 9, C.woodD);
  // seat (lighter, it faces the sky) with slat lines
  R(g, px + 1, py + 3, W - 2, 10, C.k);
  R(g, px + 2, py + 4, W - 4, 6, C.woodL);
  R(g, px + 2, py + 6, W - 4, 1, C.wood);
  R(g, px + 2, py + 8, W - 4, 1, C.wood);
  // front edge and legs
  R(g, px + 2, py + 10, W - 4, 2, C.woodD);
  R(g, px + 3, py + 12, 3, 3, C.k);
  R(g, px + W - 6, py + 12, 3, 3, C.k);
}

// The covered BBQ shed: a 14 x 4 roof on posts. The roof is drawn SHED_RISE
// pixels up the screen (it is overhead), so the front posts show beneath it.
export const SHED_RISE = 10;
function drawShedRoof(g) {
  const x0 = SHED.x * T;
  const x1 = (SHED.x + SHED.w) * T;
  const y0 = SHED.y * T - SHED_RISE;
  const y1 = (SHED.y + SHED.h) * T - SHED_RISE;
  R(g, x0 - 2, y0, x1 - x0 + 4, y1 - y0, C.k);
  R(g, x0, y0 + 2, x1 - x0, y1 - y0 - 10, G.roof);
  for (let y = y0 + 7; y < y1 - 10; y += 8) R(g, x0, y, x1 - x0, 1, G.roofD);
  for (let x = x0 + T; x < x1; x += T) R(g, x - 1, y0 + 2, 1, y1 - y0 - 12, 'rgba(0,0,0,0.14)');
  // ridge along the middle
  R(g, x0 + T, y0 + 2 * T - 6, x1 - x0 - 2 * T, 3, G.roofL);
  // eave / front face
  R(g, x0, y1 - 8, x1 - x0, 6, G.roofD);
  R(g, x0, y1 - 8, x1 - x0, 1, G.roofL);
  R(g, (SHED.x + 6) * T, y1 - 7, 2 * T, 4, C.cream);
}

// road arrow (2 tiles long), with the middle of its shaft on the pixel row cy: the middle of its lane
function arrow(g, tx, cy, dir) {
  const px = tx * T;
  const py = cy - 1;
  R(g, px + 3, py, 2 * T - 6, 2, G.line);
  const tip = dir < 0 ? px + 2 : px + 2 * T - 3;
  for (let i = 0; i < 5; i++) R(g, tip - dir * i, py - i, 1, i * 2 + 2, G.line);
}

// a kitchen counter (w x 1) with a worktop and cupboard doors; sinks have a tap
function drawCounter(g, tx, ty, w, sinks) {
  const px = tx * T;
  const py = ty * T;
  const W = w * T;
  R(g, px + 2, py + 14, W - 2, 2, 'rgba(20,20,20,0.2)');
  R(g, px, py - 7, W, 22, C.k);
  // worktop
  R(g, px + 1, py - 6, W - 2, 10, C.grayL);
  R(g, px + 1, py - 6, W - 2, 1, C.white);
  R(g, px + 1, py + 3, W - 2, 1, C.gray);
  // cupboard fronts
  R(g, px + 1, py + 5, W - 2, 9, C.wood);
  for (let i = 0; i < w; i++) {
    R(g, px + i * T + 2, py + 6, T - 4, 7, C.woodL);
    R(g, px + i * T + 2, py + 12, T - 4, 1, C.woodD);
    R(g, px + i * T + T - 5, py + 8, 1, 3, C.k);
    if (i) R(g, px + i * T, py + 5, 1, 9, C.woodD);
  }
  for (const sx of sinks) {
    const x = sx * T;
    R(g, x + 2, py - 5, 12, 8, C.k);
    R(g, x + 3, py - 4, 10, 6, C.steel);
    R(g, x + 3, py - 4, 10, 1, C.charcoal);
    R(g, x + 4, py + 1, 8, 1, C.steelL);
    P(g, x + 8, py - 1, C.k); // plughole
    // tap
    R(g, x + 6, py - 12, 4, 7, C.k);
    R(g, x + 7, py - 11, 2, 6, C.steelL);
    R(g, x + 7, py - 12, 5, 3, C.k);
    R(g, x + 8, py - 11, 3, 1, C.steelL);
  }
}

// The cafe: two blue pitched roofs either side of a flat grey one (as in
// real life), a striped awning, and its front wall facing south.
const CAFE_RISE = 14;
const CAFE_WALL = 42; // height of the front wall in pixels
const cafeGeo = () => {
  const px = CAFE.x * T;
  const W = CAFE.w * T;
  const bottom = (CAFE.y + CAFE.h) * T;
  const wallTop = bottom - CAFE_WALL;
  const dx = px + (W >> 1) - 11;
  const wins = [px + 9, px + 39, px + W - 67, px + W - 37].map((x) => [x, wallTop + 14, 28, 16]);
  return { px, W, bottom, wallTop, dx, wins, top: CAFE.y * T - CAFE_RISE };
};
function drawCafe(g) {
  const { px, W, bottom, wallTop, dx, wins, top } = cafeGeo();
  R(g, px + 2, bottom - 2, W, 3, 'rgba(20,20,20,0.2)');
  // roofs
  R(g, px - 3, top, W + 6, wallTop - top + 2, C.k);
  const third = Math.round(W / 3);
  const H = wallTop - top - 2;
  const ridge = top + 2 + Math.round(H * 0.36);
  const pitched = (x, w) => {
    R(g, x, top + 2, w, ridge - top - 2, '#2f559c'); // far slope
    R(g, x, ridge, w, H - (ridge - top - 2), '#3f6fc4'); // near slope
    for (let i = 5; i < w; i += 8) {
      R(g, x + i, top + 2, 1, ridge - top - 2, '#27488a');
      R(g, x + i, ridge, 1, H - (ridge - top - 2), '#2f559c');
    }
    R(g, x, ridge - 1, w, 2, '#8fb0e8');
    R(g, x, wallTop - 5, w, 5, '#27488a'); // eave
    R(g, x, wallTop - 5, w, 1, '#6f97dc');
  };
  pitched(px - 1, third + 1);
  pitched(px + W - third, third + 1);
  // the flat roof between them, with a parapet and air-con units
  const fx = px + third;
  const fw = W - 2 * third;
  R(g, fx, top + 2, fw, H, C.grayL);
  R(g, fx, top + 2, fw, 3, C.white);
  R(g, fx, top + 2, 2, H, C.gray);
  R(g, fx + fw - 2, top + 2, 2, H, C.gray);
  for (let y = top + 16; y < wallTop - 34; y += 12) R(g, fx + 4, y, fw - 8, 1, '#bdb7ad');
  for (const [ax, ay] of [[fx + 7, top + 12], [fx + 30, top + 26], [fx + 9, top + 48]]) {
    R(g, ax + 2, ay + 13, 14, 3, 'rgba(20,20,20,0.2)');
    R(g, ax, ay, 16, 15, C.k);
    R(g, ax + 1, ay + 1, 14, 8, C.steelL);
    R(g, ax + 1, ay + 9, 14, 5, C.steel);
    disc(g, ax + 8, ay + 5, 4, 3, C.charcoal);
    disc(g, ax + 8, ay + 5, 2, 1, C.steel);
  }
  R(g, fx, wallTop - 5, fw, 5, C.gray);
  // the sign stands on the front edge of the flat roof
  R(g, fx + 6, wallTop - 22, fw - 12, 15, C.k);
  R(g, fx + 7, wallTop - 21, fw - 14, 13, C.cream);
  drawText(g, 'CAFE', fx + (fw >> 1) - 11, wallTop - 18, C.burgundy || C.k);
  // front wall
  R(g, px, wallTop, W, CAFE_WALL, C.k);
  R(g, px + 1, wallTop + 1, W - 2, CAFE_WALL - 2, '#efe6d2');
  R(g, px + 1, bottom - 8, W - 2, 7, '#cdbfa3');
  for (let i = 0; i < W - 2; i += 10) {
    R(g, px + 1 + i, wallTop + 1, 5, 9, '#3f6fc4');
    R(g, px + 6 + i, wallTop + 1, 5, 9, C.white);
  }
  for (let i = 0; i < W - 2; i += 5) R(g, px + 1 + i, wallTop + 10, 4, 2, i % 10 ? C.white : '#3f6fc4'); // scalloped edge
  R(g, px + 1, wallTop + 12, W - 2, 1, 'rgba(0,0,0,0.25)');
  // door
  R(g, dx, wallTop + 13, 22, 29, C.k);
  R(g, dx + 1, wallTop + 14, 20, 27, C.wood);
  R(g, dx + 3, wallTop + 16, 16, 12, '#bfe3ee');
  R(g, dx + 10, wallTop + 14, 2, 27, C.k);
  P(g, dx + 8, wallTop + 31, C.yellow);
  P(g, dx + 13, wallTop + 31, C.yellow);
  // windows with flower boxes
  for (const [wx, wy, ww, wh] of wins) {
    R(g, wx - 1, wy - 1, ww + 2, wh + 2, C.k);
    R(g, wx, wy, ww, wh, '#bfe3ee');
    R(g, wx + 1, wy + 1, 3, wh - 2, C.white);
    R(g, wx + (ww >> 1), wy, 1, wh, C.k);
    R(g, wx, wy + (wh >> 1), ww, 1, C.k);
    R(g, wx - 2, wy + wh + 1, ww + 4, 4, C.k);
    R(g, wx - 1, wy + wh + 2, ww + 2, 2, C.wood);
    for (let i = 1; i < ww; i += 3) P(g, wx + i, wy + wh, [C.red, C.pink, C.yellow][(i + wx) % 3]);
    for (let i = 2; i < ww; i += 3) P(g, wx + i, wy + wh + 1, G.bush);
  }
}
// the cafe's windows lit from inside: a is 0..1
export function drawCafeGlow(g, ox, oy, a) {
  if (a <= 0) return;
  const { px, W, bottom, dx, wins, wallTop } = cafeGeo();
  g.fillStyle = 'rgba(255, 206, 110, ' + (0.13 * a).toFixed(3) + ')';
  for (const k of [1, 0.7, 0.45]) {
    const rx = Math.round(W * 0.56 * k);
    const ry = Math.round(26 * k);
    for (let j = -ry; j <= ry; j++) {
      const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry + 0.5))));
      g.fillRect(px + W / 2 - half + ox, bottom + 6 + j + oy, half * 2, 1);
    }
  }
  g.fillStyle = 'rgba(255, 226, 140, ' + (0.72 * a).toFixed(3) + ')';
  for (const [wx, wy, ww, wh] of wins) {
    g.fillRect(wx + ox, wy + oy, (ww >> 1), (wh >> 1));
    g.fillRect(wx + (ww >> 1) + 1 + ox, wy + oy, ww - (ww >> 1) - 1, (wh >> 1));
    g.fillRect(wx + ox, wy + (wh >> 1) + 1 + oy, (ww >> 1), wh - (wh >> 1) - 1);
    g.fillRect(wx + (ww >> 1) + 1 + ox, wy + (wh >> 1) + 1 + oy, ww - (ww >> 1) - 1, wh - (wh >> 1) - 1);
  }
  g.fillRect(dx + 3 + ox, wallTop + 16 + oy, 7, 12);
  g.fillRect(dx + 12 + ox, wallTop + 16 + oy, 7, 12);
}
export const cafeLight = () => {
  const { px, W, bottom } = cafeGeo();
  return [px + W / 2, bottom - 4, Math.round(W * 0.62), 46];
};

// a round cafe table with a chair either side (3 x 1)
function drawCafeSet(g, tx, ty) {
  const px = tx * T;
  const py = ty * T;
  for (const [cx, back] of [[px - T, 0], [px + T, 1]]) {
    R(g, cx + 4, py + 13, 9, 2, 'rgba(20,20,20,0.2)');
    R(g, cx + (back ? 11 : 2), py - 4, 4, 14, C.k); // back of the chair
    R(g, cx + (back ? 12 : 3), py - 3, 2, 12, '#3f6fc4');
    R(g, cx + 3, py + 4, 11, 6, C.k);
    R(g, cx + 4, py + 5, 9, 3, '#6f97dc');
    R(g, cx + 4, py + 8, 9, 1, '#2f559c');
    R(g, cx + 4, py + 10, 2, 4, C.k);
    R(g, cx + 11, py + 10, 2, 4, C.k);
  }
  R(g, px + 3, py + 13, 11, 2, 'rgba(20,20,20,0.22)');
  R(g, px + 7, py + 4, 3, 10, C.k);
  R(g, px + 5, py + 13, 7, 2, C.k);
  disc(g, px + 8, py + 1, 8, 5, C.k);
  disc(g, px + 8, py, 7, 4, C.white);
  disc(g, px + 8, py + 1, 6, 2, C.cream);
}

// Parked vehicles, seen from the south side and a little above. Each is
// drawn from a silhouette, pixel by pixel, so the corners can be rounded.
function paintShape(g, x0, y0, w, h, inside, colour, face) {
  const [cv, c] = canvas(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!inside(x, y)) continue;
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      c.fillStyle = edge ? C.k : colour(x, y);
      c.fillRect(x, y, 1, 1);
    }
  if (face < 0) {
    g.save();
    g.translate(x0 + w, y0);
    g.scale(-1, 1);
    g.drawImage(cv, 0, 0);
    g.restore();
  } else g.drawImage(cv, x0, y0);
}
const wheel = (wx, wy, r) => (x, y) => (x - wx) * (x - wx) + (y - wy) * (y - wy) <= r * r;
// a car (4 x 2 tiles), nose to the left unless face is -1
function drawCar(g, tx, ty, [body, dark, light], face = 1) {
  const W = 64;
  const H = 32;
  disc(g, tx * T + 32, ty * T + 29, 29, 3, 'rgba(10,10,15,0.3)');
  const wheels = [wheel(14, 24, 5.6), wheel(49, 24, 5.6)];
  const cabinL = (y) => 19 + (13 - y) * 0.75; // raked windscreen
  const cabinR = (y) => 49 - (13 - y) * 0.45;
  const cabin = (x, y) => y >= 3 && y < 13 && x >= cabinL(y) && x <= cabinR(y) && !(y === 3 && (x < cabinL(y) + 2 || x > cabinR(y) - 2));
  const shell = (x, y) => {
    if (y < 12 || y > 25 || x < 1 || x > 62) return false;
    // bonnet slopes down to the nose, boot is squarer; all corners rounded
    const topL = 12 + Math.max(0, (16 - x) * 0.22);
    if (y < topL) return false;
    const r = 4;
    for (const [cx, cy] of [[1 + r, 25 - r], [62 - r, 25 - r], [62 - r, 12 + r]]) {
      const ox = cx < 32 ? cx - x : x - cx;
      const oy = cy > 18 ? y - cy : cy - y;
      if (ox > 0 && oy > 0 && ox * ox + oy * oy > r * r) return false;
    }
    return !(x < 5 && y < 17 && (5 - x) + (17 - y) > 5);
  };
  const inside = (x, y) => cabin(x, y) || shell(x, y) || wheels.some((w) => w(x, y));
  paintShape(g, tx * T, ty * T, W, H, inside, (x, y) => {
    for (const [wx, wy] of [[14, 24], [49, 24]]) {
      const d = (x - wx) * (x - wx) + (y - wy) * (y - wy);
      if (d <= 5.6 * 5.6) return d <= 4 ? C.grayL : d <= 10 ? C.gray : C.charcoal;
      if (d <= 60 && y <= 25) return dark; // wheel arch
    }
    if (cabin(x, y) && y < 13) {
      if (y < 6) return light; // roof
      if (x < cabinL(y) + 2 || x > cabinR(y) - 2 || (x >= 33 && x <= 34)) return body;
      return y < 8 && x < 30 ? '#d5eef5' : '#9fc6d8';
    }
    if (x <= 3 && y >= 17 && y <= 19) return '#f4e3a6'; // headlight
    if (x >= 60 && y >= 15 && y <= 18) return '#d9705f'; // tail light
    if (y >= 23) return dark;
    if (y <= 14) return light;
    if (x === 34 && y > 13) return dark; // door seam
    if (y === 17 && ((x >= 28 && x <= 30) || (x >= 38 && x <= 40))) return dark; // handles
    return body;
  }, face);
}
// a box truck (6 x 3 tiles)
function drawTruck(g, tx, ty, [body, dark, light], face = 1) {
  const W = 96;
  const H = 48;
  disc(g, tx * T + 48, ty * T + 45, 44, 3, 'rgba(10,10,15,0.3)');
  const ws = [[13, 39], [50, 39], [80, 39]];
  const cabL = (y) => 2 + Math.max(0, (22 - y) * 0.6); // raked windscreen
  const cab = (x, y) => y >= 12 && y <= 40 && x >= cabL(y) && x <= 26 && !(y < 14 && x < cabL(y) + 2) && !(y > 38 && x < 4);
  const box = (x, y) => x >= 26 && x <= 94 && y >= 2 && y <= 38 && !((x > 92 || x < 28) && y < 4) && !(x > 93 && y > 36);
  const chassis = (x, y) => x >= 20 && x <= 92 && y > 38 && y <= 41;
  const inside = (x, y) => cab(x, y) || box(x, y) || chassis(x, y) || ws.some(([wx, wy]) => wheel(wx, wy, 6.4)(x, y));
  paintShape(g, tx * T, ty * T, W, H, inside, (x, y) => {
    for (const [wx, wy] of ws) {
      const d = (x - wx) * (x - wx) + (y - wy) * (y - wy);
      if (d <= 6.4 * 6.4) return d <= 5 ? C.grayL : d <= 14 ? C.gray : C.charcoal;
      if (d <= 75 && y <= 40) return dark;
    }
    if (chassis(x, y)) return C.charcoal;
    if (box(x, y)) {
      if (y <= 9) return C.white; // roof of the box
      if (y >= 35) return dark;
      if ((x - 30) % 11 === 0) return dark; // ribs
      if (y >= 18 && y <= 21 && x > 34 && x < 88) return body; // stripe
      return light;
    }
    if (y <= 15) return light; // cab roof
    if (y <= 25 && x >= cabL(y) + 2 && x <= 23) return x >= 14 && x <= 15 ? body : y < 19 && x < 12 ? '#d5eef5' : '#9fc6d8';
    if (y >= 36) return dark; // bumper
    if (x <= cabL(y) + 2 && y >= 29 && y <= 32) return '#f4e3a6';
    if (x === 15 && y > 25) return dark;
    return body;
  }, face);
}
// a motorbike and its rider (28 x 26 pixels), nose to the left unless face is -1
function drawMotorbike(g, x0, y0, [shirt, bike, helmet], face = 1) {
  const [cv, c] = canvas(28, 26);
  disc(c, 14, 24, 12, 2, 'rgba(10,10,15,0.3)');
  for (const wx of [6, 21]) {
    disc(c, wx, 20, 4, 4, C.k);
    disc(c, wx, 20, 3, 3, C.charcoal);
    disc(c, wx, 20, 1, 1, C.grayL);
  }
  // frame, engine and exhaust
  R(c, 6, 14, 17, 5, C.k);
  R(c, 7, 15, 15, 2, bike);
  R(c, 10, 17, 7, 3, C.k);
  R(c, 11, 17, 5, 2, C.gray);
  R(c, 17, 19, 7, 2, C.k);
  R(c, 18, 19, 5, 1, C.grayL);
  // fork, handlebar and headlight
  R(c, 4, 10, 3, 9, C.k);
  R(c, 5, 11, 1, 7, C.gray);
  R(c, 3, 9, 6, 3, C.k);
  R(c, 2, 12, 2, 2, C.k);
  P(c, 2, 12, '#f4e3a6');
  // seat and tail light
  R(c, 13, 12, 11, 3, C.k);
  R(c, 14, 13, 9, 1, C.charcoal);
  P(c, 23, 13, '#d9705f');
  // rider: leg, body, arm reaching for the bars, helmet
  R(c, 10, 11, 7, 6, C.k);
  R(c, 11, 12, 5, 4, '#3d4763');
  R(c, 9, 16, 4, 3, C.k);
  R(c, 10, 16, 2, 2, '#3d4763');
  R(c, 12, 4, 8, 9, C.k);
  R(c, 13, 5, 6, 7, shirt);
  R(c, 7, 7, 7, 4, C.k);
  R(c, 8, 8, 6, 2, shirt);
  P(c, 7, 9, '#e8b98f');
  disc(c, 15, 3, 4, 3, C.k);
  disc(c, 15, 3, 3, 2, helmet);
  R(c, 11, 3, 3, 2, C.k);
  P(c, 12, 3, '#9fc6d8');
  if (face < 0) {
    g.save();
    g.translate(x0 + 28, y0);
    g.scale(-1, 1);
    g.drawImage(cv, 0, 0);
    g.restore();
  } else g.drawImage(cv, x0, y0);
}
// Pictures for the traffic: kind is 'bike' (28 x 26), 'car' (64 x 32) or
// 'truck' (96 x 48); face 1 has its nose to the left.
export function vehicleSprite(kind, colours, face) {
  const [w, h] = kind === 'bike' ? [28, 26] : kind === 'car' ? [64, 32] : [96, 48];
  const [cv, g] = canvas(w, h);
  (kind === 'bike' ? drawMotorbike : kind === 'car' ? drawCar : drawTruck)(g, 0, 0, colours, face);
  return cv;
}
function drawCone(g, tx, ty) {
  const px = tx * T;
  const py = ty * T;
  R(g, px + 3, py + 12, 11, 3, C.k);
  R(g, px + 4, py + 12, 9, 2, C.orange);
  for (let j = 0; j < 10; j++) {
    const w = 2 + Math.floor(j / 2);
    R(g, px + 8 - (w >> 1) - 1, py + 2 + j, w + 2, 1, C.k);
    R(g, px + 8 - (w >> 1), py + 2 + j, w, 1, j === 4 || j === 5 ? C.white : C.orange);
  }
}
// A bicycle (2 x 1): on its stand facing left or right, or lying on its side.
function drawBike(g, tx, ty, col, pose) {
  const [cv, c] = canvas(30, 16);
  if (pose === 'down') {
    // flat on the ground: the wheels are seen as ovals
    R(c, 3, 13, 24, 2, 'rgba(20,20,20,0.18)');
    for (const wx of [8, 22]) {
      disc(c, wx, 9, 6, 3, C.k);
      disc(c, wx, 9, 4, 2, C.grayL);
    }
    rope(c, 8, 9, 13, 6, col);
    rope(c, 13, 6, 20, 5, col);
    rope(c, 20, 5, 22, 9, col);
    rope(c, 13, 6, 15, 10, col);
    rope(c, 15, 10, 8, 9, col);
    R(c, 11, 4, 4, 2, C.k);
    R(c, 19, 2, 2, 4, C.k);
    R(c, 17, 2, 6, 1, C.k);
  } else {
    R(c, 2, 14, 26, 2, 'rgba(20,20,20,0.2)');
    for (const wx of [6, 22]) {
      disc(c, wx, 9, 6, 6, C.k);
      disc(c, wx, 9, 4, 4, C.grayL);
      disc(c, wx, 9, 1, 1, C.k);
    }
    rope(c, 6, 9, 12, 3, col);
    rope(c, 12, 3, 20, 3, col);
    rope(c, 20, 3, 22, 9, col);
    rope(c, 12, 3, 15, 9, col);
    rope(c, 15, 9, 6, 9, col);
    rope(c, 15, 9, 20, 3, col);
    R(c, 10, 1, 5, 2, C.k); // saddle
    R(c, 19, 0, 4, 2, C.k); // handlebars
    R(c, 20, 1, 1, 3, C.k);
    R(c, 14, 9, 1, 6, C.k); // stand
  }
  const x = tx * T + 1;
  const y = ty * T;
  if (pose === 'left') {
    g.save();
    g.translate(x + 30, y);
    g.scale(-1, 1);
    g.drawImage(cv, 0, 0);
    g.restore();
  } else g.drawImage(cv, x, y);
}
// a plain post-and-rail fence running north-south (1 x rows)
function drawFence(g, tx, ty, rows) {
  const px = tx * T;
  const py = ty * T;
  const H = rows * T;
  R(g, px + 5, py + H - 2, 9, 2, 'rgba(20,20,20,0.2)');
  for (const rx of [px + 5, px + 9]) {
    R(g, rx - 1, py - 2, 3, H - 2, C.k);
    R(g, rx, py - 2, 1, H - 2, C.woodL);
  }
  for (let j = 0; j <= rows; j++) {
    const y = py + j * T - (j === rows ? 3 : 0);
    R(g, px + 3, y - 10, 10, 13, C.k);
    R(g, px + 4, y - 9, 8, 11, C.wood);
    R(g, px + 4, y - 9, 8, 2, C.woodL);
    R(g, px + 10, y - 7, 2, 9, C.woodD);
  }
}

// an outdoor air-conditioning unit (6 x 1): a row of fans on top, louvres down the front
function drawAC(g, u) {
  const px = u.x * T;
  const py = u.y * T;
  const W = u.w * T;
  R(g, px + 2, py + 14, W - 2, 2, 'rgba(20,20,20,0.25)');
  R(g, px, py - 12, W, 27, C.k);
  R(g, px + 1, py - 11, W - 2, 12, C.grayL); // top
  R(g, px + 1, py - 11, W - 2, 1, C.white);
  for (let fx = px + 16; fx < px + W; fx += 32) {
    disc(g, fx, py - 5, 11, 5, C.k);
    disc(g, fx, py - 5, 10, 4, C.steel);
    disc(g, fx, py - 5, 7, 3, C.charcoal);
    R(g, fx - 8, py - 5, 17, 1, C.steelL);
    R(g, fx, py - 8, 1, 7, C.steelL);
    disc(g, fx, py - 5, 2, 1, C.steelL);
  }
  R(g, px + 1, py + 1, W - 2, 13, C.gray); // front
  for (let y = py + 3; y < py + 13; y += 2) R(g, px + 3, y, W - 6, 1, C.charcoal);
  for (let x = px + 32; x < px + W; x += 32) R(g, x - 1, py + 1, 2, 13, C.grayL);
  R(g, px + W - 9, py + 3, 5, 3, C.k);
  P(g, px + W - 7, py + 4, '#7fd08a');
}

// a plank bench without a back, and a BBQ table: each 1 x 3, running north-south
function drawPlankBench(g, tx, ty) {
  const px = tx * T;
  const py = ty * T;
  const H = 3 * T;
  R(g, px + 5, py + H - 3, 9, 2, 'rgba(20,20,20,0.2)');
  for (const y of [py + 12, py + H - 6]) R(g, px + 3, y, 3, 4, C.k); // legs
  R(g, px + 3, py + 2, 10, H - 8, C.k);
  R(g, px + 4, py + 3, 8, H - 13, C.woodL);
  R(g, px + 8, py + 3, 1, H - 13, C.wood);
  for (let y = py + 14; y < py + H - 12; y += 14) R(g, px + 4, y, 8, 1, C.wood);
  R(g, px + 4, py + H - 10, 8, 3, C.woodD);
}
function drawTable(g, tx, ty) {
  const px = tx * T;
  const py = ty * T;
  const H = 3 * T;
  R(g, px + 3, py + H - 3, 12, 3, 'rgba(20,20,20,0.2)');
  for (const x of [px + 2, px + 11]) {
    R(g, x, py + H - 9, 3, 8, C.k);
    R(g, x + 1, py + H - 9, 1, 7, C.woodD);
  }
  R(g, px, py - 5, T, H - 3, C.k);
  R(g, px + 1, py - 4, T - 2, H - 9, C.woodL);
  for (const x of [px + 5, px + 10]) R(g, x, py - 4, 1, H - 9, C.wood);
  for (let y = py + 10; y < py + H - 16; y += 15) R(g, px + 1, y, T - 2, 1, C.wood);
  R(g, px + 1, py + H - 13, T - 2, 4, C.woodD);
}

// The covered walkway's roof. It is see-through and drawn COVER_RISE pixels
// up the screen, so the pillars along its south end show beneath it.
export const COVER_RISE = 14;
export function drawCover(g) {
  const { x, y, w, h } = COVER;
  const px = x * T;
  const py = y * T - COVER_RISE;
  g.fillStyle = 'rgba(96, 78, 62, 0.42)';
  g.fillRect(px, py, w * T, h * T);
  // roof slats, one per tile row, and a beam down each edge
  for (let j = 0; j < h; j++) {
    R(g, px, py + j * T + 7, w * T, 2, 'rgba(60, 46, 36, 0.38)');
    R(g, px, py + j * T + 9, w * T, 1, 'rgba(255, 240, 215, 0.22)');
  }
  R(g, px, py, 3, h * T, 'rgba(60, 46, 36, 0.5)');
  R(g, px + w * T - 3, py, 3, h * T, 'rgba(60, 46, 36, 0.5)');
  R(g, px, py, w * T, 2, 'rgba(60, 46, 36, 0.5)');
  // the front edge has some thickness
  R(g, px, py + h * T - 5, w * T, 5, 'rgba(52, 40, 32, 0.8)');
  R(g, px, py + h * T - 5, w * T, 1, 'rgba(255, 240, 215, 0.3)');
}

// the apartment building's lobby entrance (8 x 3 tiles); the cats walk in under the canopy
function drawEntrance(g, canopy = false, E = ENTRANCE) {
  const { x, y, w, h, doorX, doorW } = E;
  const px = x * T, py = y * T, pw = w * T, ph = h * T;
  // the canopy across the top tile is drawn over the cats as they walk in
  if (canopy) {
    g.clearRect(px - 4, py, pw + 8, 12);
    R(g, px - 4, py, pw + 8, 12, C.k);
    R(g, px - 3, py + 1, pw + 6, 10, E.roof[0]);
    R(g, px - 3, py + 1, pw + 6, 2, E.roof[1]);
    R(g, px - 3, py + 9, pw + 6, 2, E.roof[2]);
    // the building's name
    const tw = E.name.length * 6;
    drawText(g, E.name, px + ((pw - tw) >> 1) + 1, py + 3, C.cream);
    return;
  }
  // facade
  R(g, px, py, pw, ph, C.k);
  R(g, px + 1, py + 1, pw - 2, ph - 2, E.wall);
  for (let j = 0; j < ph - 2; j += 8) R(g, px + 1, py + 1 + j, pw - 2, 1, E.wallD);
  // glass side panels and the double doors
  const glass = (gx, gw) => {
    R(g, gx, py + 14, gw, ph - 15, C.k);
    R(g, gx + 1, py + 15, gw - 2, ph - 17, '#9fd0e0');
    R(g, gx + 2, py + 16, 2, ph - 20, '#d5eef5');
    R(g, gx + 1, py + ph - 8, gw - 2, 6, '#7fb4c8');
  };
  glass(px + 6, 2 * T - 4);
  glass(px + pw - 2 * T - 2, 2 * T - 4);
  const dx = doorX * T;
  R(g, dx - 2, py + 12, doorW * T + 4, ph - 12, C.k);
  R(g, dx - 1, py + 13, doorW * T + 2, ph - 14, '#f2d37a'); // warm lobby light
  glass(dx, T);
  glass(dx + T, T);
  R(g, dx + T - 4, py + 30, 2, 5, C.k); // handles
  R(g, dx + T + 2, py + 30, 2, 5, C.k);
  // planters either side of the canopy
  for (const tx of [x - 1, x + w]) {
    R(g, tx * T + 2, (y + 2) * T + 4, 12, 11, C.k);
    R(g, tx * T + 3, (y + 2) * T + 5, 10, 9, '#8a6a4f');
    R(g, tx * T + 1, (y + 1) * T + 8, 14, 14, G.hedgeD);
    R(g, tx * T + 2, (y + 1) * T + 9, 12, 11, G.hedge);
    R(g, tx * T + 4, (y + 1) * T + 10, 5, 3, G.hedgeL);
  }
}

// ------------------------------------------------------------- the map
// The map is a painted ground (`base`) plus `sprites` for everything that
// stands up. Each sprite is { cv, x, y, sortY }: draw them in order of sortY
// together with the cats (a cat's sortY is the bottom of its tile), so cats
// pass in front of and behind things. Roofs have a huge sortY: always on top.
function paintBase(g) {
  for (let y = 0; y < GH; y++) for (let x = GX0; x < GX1; x++) drawGround(g, x, y, groundAt(x, y));
  drawHexFloor(g);

  // bushes, one tile at a time
  for (const k of BUSH) {
    const [x, y] = k.split(',').map(Number);
    bushTile(g, x, y);
  }
  // the riverside: a railing along the embankment (open at the gangway), flags, boat, jetty
  slantWall(g);
  for (let x = GX0; x < GX1; x++) {
    if (x === 22 || x === 23) continue;
    // (the rails a pixel column at a time, so that they follow the wall where it slants)
    for (let px = x * T; px < (x + 1) * T; px++) {
      const py = wallTop(px);
      P(g, px, py + 2, C.k);
      P(g, px, py + 3, C.steelL);
      P(g, px, py + 7, C.steel);
    }
    if (((x % 2) + 2) % 2 === 0 || x === 24) {
      const py = wallTop(x * T + 1);
      R(g, x * T, py + 1, 3, 11, C.k);
      R(g, x * T + 1, py + 2, 1, 9, C.steelL);
    }
  }
  flag(g, 5, 11, C.red);
  flag(g, 44, 11, G.yellow);
  flag(g, 77, 11, C.red);
  flag(g, 109, wallTop(109 * T + 7) / T, G.yellow);
  drawBoat(g);
  drawJetty(g);

  // contact shadows: a soft patch on the ground at the foot of standing things
  const shade = (cx, cy, rx, ry, a = 0.22) => disc(g, cx, cy, rx, ry, 'rgba(20,30,15,' + a + ')');
  for (const t of TREES) {
    const [tx, ty] = trunkOf(t);
    shade(tx * T + 9, ty * T + 14, t[0] === 'palm' ? 9 : t[3] === 3 ? 17 : 11, t[0] === 'palm' ? 3 : 4);
  }
  for (const [x, y] of LAMPS) shade(x * T + 9, y * T + 14, 5, 2);
  for (const [x, y] of BINS) shade(x * T + 9, y * T + 15, 8, 2);
  for (const [x, y] of [...COVER_PILLARS, ...SHED_POSTS]) shade(x * T + 9, y * T + 14, 5, 2);
  shade(NET.cx, NET.cy + 2, NET.rx, NET.ry, 0.1);
  R(g, SLIDE.x * T + 2, (SLIDE.y + 1) * T - 3, SLIDE.w * T - 2, 3, 'rgba(20,30,15,0.2)');
  for (const x of [BARS.x, BARS.x + BARS.w - 1]) shade(x * T + 9, (BARS.y + 1) * T - 2, 6, 2);

  // the road: a dashed line between the two lanes each way (1 tile on, 1
  // off), a double line down each edge of the median, arrows, a stop line
  // before each crosswalk and the crosswalk itself
  const nearCrossing = (x) => CROSSINGS.some((c) => x >= c - 2 && x <= c + 5);
  for (let x = GX0; x < GX1; x += 2)
    if (!nearCrossing(x)) for (const y of [39, ROAD.bottom - 1]) R(g, x * T, y * T - 1, T, 2, G.line);
  for (let x = GX0; x < GX1; x++)
    if (!onCrossing(x)) {
      R(g, x * T, ROAD.median[0] * T + 2, T, 2, '#d8c36a');
      R(g, x * T, (ROAD.median[1] + 1) * T - 4, T, 2, '#d8c36a');
    }
  // the planted strip between the yellow lines: a low curb, soil, and a row of round shrubs, with a
  // rounded nose of curb where it stops at either side of a crosswalk
  {
    const top = ROAD.median[0] * T + 5, bot = (ROAD.median[1] + 1) * T - 6;
    for (let x = GX0; x < GX1; x++) {
      if (onCrossing(x)) continue;
      const px = x * T, west = onCrossing(x - 1), east = onCrossing(x + 1);
      const l = px + (west ? 3 : 0), w = T - (west ? 3 : 0) - (east ? 3 : 0);
      R(g, l, top, w, bot - top, G.curb);
      R(g, l, bot - 2, w, 2, G.curbD);
      R(g, l + (west ? 2 : 0), top + 2, w - (west ? 2 : 0) - (east ? 2 : 0), bot - top - 5, '#5a4630');
      for (let i = 0; i < 3; i++) P(g, l + 2 + Math.floor(hash(x, 41, i) * (w - 4)), bot - 5 - (i & 1), '#6e5a3c');
    }
    // shrubs: two to a tile, a little uneven, each a dark round with a lit top
    for (let x = GX0; x < GX1; x++) {
      if (onCrossing(x)) continue;
      for (let k = 0; k < 2; k++) {
        if ((k === 0 && onCrossing(x - 1)) || (k === 1 && onCrossing(x + 1))) continue;
        const cx = x * T + 4 + k * 8 + Math.floor(hash(x, 43, k) * 3) - 1;
        const cy = top + 17 + Math.floor(hash(x, 44, k) * 3) - 1;
        const r = 7 + (hash(x, 45, k) < 0.5 ? 1 : 0);
        disc(g, cx, cy + 4, r, 4, 'rgba(10,20,10,0.35)');
        disc(g, cx, cy, r, r - 1, G.bushD);
        disc(g, cx, cy - 1, r - 1, r - 2, G.bush);
        disc(g, cx - 1, cy - 4, r - 3, r - 4, G.bushL);
        for (let i = 0; i < 3; i++) P(g, cx - r + 2 + Math.floor(hash(x, 46 + k, i) * (2 * r - 4)), cy - 2 + Math.floor(hash(x, 48 + k, i) * 5), G.bushD);
      }
    }
  }
  // the two north lanes run west and the two south lanes east
  // (each arrow in the middle of its lane: a lane is the two rows a vehicle covers, LANES[i].y and the one above)
  for (const l of LANES) for (const x of l.dir > 0 ? [34, 74, 124] : [0, 50, 96]) arrow(g, x, l.y * T, l.dir);
  for (const c of CROSSINGS) {
    for (let y = ROAD.top; y <= ROAD.bottom; y++) {
      R(g, c * T + 2, y * T + 1, 4 * T - 4, 5, G.line);
      R(g, c * T + 2, y * T + 9, 4 * T - 4, 5, G.line);
    }
    // where the traffic waits: east of the crossing for the lanes going west, west of it for the others
    R(g, (c + 5) * T, ROAD.top * T + 2, 2, 4 * T - 4, G.line);
    R(g, (c - 1) * T - 2, (ROAD.median[1] + 1) * T + 2, 2, 4 * T - 4, G.line);
  }
  drawEntrance(g);
  drawEntrance(g, false, GARNET);
  drawEntrance(g, true, GARNET);

  // what closes off the ends of the boardwalk and pavement
  for (const [x, y] of CONES) drawCone(g, x, y);
  for (const [x, y, col, pose] of BIKES) drawBike(g, x, y, col, pose);
}

const ON_TOP = 1e9;

// one sprite: paint(g) draws in map pixels; only the box [x, y, w, h] is kept
function sprite(x, y, w, h, sortY, paint, alpha = 1) {
  const [cv, g] = canvas(w, h);
  g.translate(-x, -y);
  paint(g);
  if (alpha >= 1) return { cv, x, y, sortY };
  const [cv2, g2] = canvas(w, h);
  g2.globalAlpha = alpha;
  g2.drawImage(cv, 0, 0);
  return { cv: cv2, x, y, sortY };
}

function makeSprites() {
  const out = [];
  const add = (...box) => out.push(sprite(...box));
  for (const t of TREES) {
    const [kind, , , n] = t;
    const [tx, ty] = trunkOf(t);
    const bx = tx * T + 8;
    const by = ty * T + 14;
    const seed = t[1] * 13 + t[2];
    // (the boxes are wide enough for the whole crown: a big tree's outer clumps and a palm's fronds, with
    // their outline and jitter, reach further than 24 pixels from the trunk, and a box that cut them
    // left a straight edge down the side of the tree)
    if (kind === 'palm') add(bx - 34, by - 46, 68, 48, (ty + 1) * T + (t[4] || 0), (g) => drawPalm(g, bx, by, seed));
    else add(bx - 30, by - (n === 3 ? 52 : 36), 60, n === 3 ? 54 : 38, (ty + 1) * T, (g) => drawTree(g, bx, by, n, seed));
  }
  for (const [x, y] of LAMPS) add(x * T, y * T - 22, T, 38, (y + 1) * T, (g) => drawLamp(g, x * T + 8, y * T + 15));
  for (const [x, y] of BINS) add(x * T, y * T - 8, T + 2, 26, (y + 1) * T, (g) => drawBin(g, x, y));
  add(CAFE.x * T - 3, CAFE.y * T - CAFE_RISE, CAFE.w * T + 8, CAFE.h * T + CAFE_RISE + 2, (CAFE.y + CAFE.h) * T, drawCafe);
  for (const [x, y, rows] of FENCES) add(x * T, y * T - 12, T, rows * T + 12, (y + rows) * T, (g) => drawFence(g, x, y, rows));
  for (const [x, y] of CAFE_SETS) add((x - 1) * T, y * T - 6, 3 * T, T + 6, (y + 1) * T, (g) => drawCafeSet(g, x, y));
  for (const [x, y] of BENCHES) add(x * T, y * T - 8, 3 * T, 24, (y + 1) * T, (g) => bench(g, x, y, 3));
  add(SLIDE.x * T, SLIDE.y * T - 30, SLIDE.w * T, 47, (SLIDE.y + 1) * T, drawSlide);
  add(BARS.x * T, BARS.y * T - 22, BARS.w * T, 38, (BARS.y + 1) * T + 1, drawMonkeyBars);
  add(NET.cx - NET.rx - 4, NET.cy - NET.h - 6, NET.rx * 2 + 8, NET.h + NET.ry + 10, NET.cy + NET.ry + 2, drawNet);
  for (const [x, y, w, sinks] of COUNTERS) add(x * T, y * T - 13, w * T, 30, (y + 1) * T, (g) => drawCounter(g, x, y, w, sinks));
  for (const [x, y] of TABLES) {
    // one strip per tile row, so a cat on the table sorts correctly against it
    for (let j = 0; j < 3; j++) {
      const up = j ? 0 : 6;
      const paint = (g) => {
        drawPlankBench(g, x, y);
        drawPlankBench(g, x + 2, y);
        drawTable(g, x + 1, y);
      };
      add(x * T, (y + j) * T - up, 3 * T, T + up, (y + j + 1) * T, paint);
    }
  }
  for (const u of AC_UNITS) add(u.x * T, u.y * T - 12, u.w * T, 28, (u.y + 1) * T, (g) => drawAC(g, u));
  // pillars, then the roofs they hold up
  for (const [x, y] of COVER_PILLARS)
    add(x * T, y * T - 12, T, 28, (y + 1) * T, (g) => drawPillar(g, x * T + 8, y * T + 14, COVER_RISE + 10, C.steelL, C.white));
  for (const [x, y] of SHED_POSTS)
    add(x * T, y * T - 12, T, 28, (y + 1) * T, (g) => drawPillar(g, x * T + 8, y * T + 14, SHED_RISE + 14, C.wood, C.woodL));
  add(COVER.x * T, COVER.y * T - COVER_RISE, COVER.w * T, COVER.h * T, ON_TOP, drawCover);
  // the shed's roof is a little see-through, so cats sheltering under it show
  add(SHED.x * T - 2, SHED.y * T - SHED_RISE, SHED.w * T + 4, SHED.h * T, ON_TOP, drawShedRoof, 0.68);
  add(ENTRANCE.x * T - 4, ENTRANCE.y * T, ENTRANCE.w * T + 8, 12, ON_TOP, (g) => drawEntrance(g, true));
  // the glass doors again, over the cats: mostly opaque, so they show faintly behind the glass
  add(ENTRANCE.doorX * T - 2, ENTRANCE.y * T + 12, ENTRANCE.doorW * T + 4, ENTRANCE.h * T - 12, ON_TOP + 1, (g) => drawEntrance(g), 0.72);
  return out.sort((a, b) => a.sortY - b.sortY);
}

// ---- what the story puts up and takes down (Act 3)
// The barrier across the north end of the covered walkway (drawBarrier), and
// the dogs aboard the moored boat (drawBoatDogs): both drawn in act3-art.js.
// The garden on the screen is the last one built: putting the barrier up or
// the dogs aboard changes its sprites there and then, and a garden built
// later comes with them already in place.
let live = null;
let dogsAboard = false;
const extras = {};
function withExtras(garden) {
  const list = garden.sprites.filter((s) => !s.extra);
  if (barrierUp) {
    const top = (BARRIER.y + 1) * T - STACK_H;
    extras.barrier = extras.barrier || { ...sprite(BARRIER.x * T - 2, top, BARRIER.w * T + 4, STACK_H + 2, (BARRIER.y + 1) * T, (g) => drawBarrier(g, BARRIER.x * T, BARRIER.y * T, BARRIER.w, STACK_DOGS)), extra: true };
    list.push(extras.barrier);
  }
  // (a cage's picture is two tiles wide and stands 8 above its tile; one on a cart stands higher, and its handle sticks out)
  extras.cages = extras.cages || {};
  extras.cages[cageSet] = extras.cages[cageSet] || cagesNow().map(({ x, y, dog, cart }) => ({ ...sprite(x * T - 2, y * T - 20, 2 * T + 8, T + 20, (y + 1) * T, (g) => (cart ? drawCart : drawCage)(g, x * T, y * T, dog)), extra: true }));
  list.push(...extras.cages[cageSet]);
  if (dogsAboard) {
    // (nobody walks north of the jetty, so it only has to sort below the jetty's rows.) They move:
    // the game calls tick(frame) on a sprite that has one before drawing it.
    if (!extras.dogs) {
      const [cv, g] = canvas(15 * T, 4 * T);
      const paint = (frame) => {
        g.clearRect(0, 0, cv.width, cv.height);
        drawBoatDogs(g, T, T, frame);
      };
      paint(0);
      let last = 0;
      extras.dogs = { cv, x: 17 * T, y: (BOAT_Y - 1) * T, sortY: JETTY_N * T, extra: true, tick(frame) { const t = Math.floor(frame / 10); if (t !== last) { last = t; paint(frame); } } };
    }
    list.push(extras.dogs);
  }
  list.sort((a, b) => a.sortY - b.sortY);
  garden.sprites.splice(0, garden.sprites.length, ...list);
  return garden;
}
// Put the barrier up (or take it down). Up, its eight tiles (BARRIER) are a
// wall: gardenBlocked and barrierAt say so, and gardenThing gives
// { kind: 'barrier' } for them. Nothing is checked for standing there.
export function setBarrier(on) {
  barrierUp = !!on;
  if (live) withExtras(live);
}
// Which cages are out, and what is in them (one of CAGE_SETS).
export function setCages(set) {
  const next = CAGE_SETS[set] ? set : 'empty';
  if (next === cageSet) return;
  cageSet = next;
  if (live) withExtras(live);
}
// Show the boat with dogs aboard (or without).
export function setBoatDogs(on) {
  dogsAboard = !!on;
  if (live) withExtras(live);
}
export const boatDogsAboard = () => dogsAboard;
// The boat itself, and its plank: there (as it always was), or gone. It is painted into the ground, so
// the ground is painted again when this changes.
export function setBoatGone(on) {
  if (boatGone === !!on) return;
  boatGone = !!on;
  if (live) {
    paintBase(live.base.getContext('2d'));
    withExtras(live);
  }
}
export const boatIsGone = () => boatGone;

function build() {
  // (the canvas starts at column GX0: draw it at GX0 * T)
  const [base, bg] = canvas(GW * T, GH * T);
  bg.translate(-GX0 * T, 0);
  paintBase(bg);
  return withExtras({ base, sprites: makeSprites(), lamps: LAMPS });
}
export function buildGarden() {
  live = build();
  return live;
}

// the whole map as one picture
export function drawGarden() {
  const { base, sprites } = build();
  const g = base.getContext('2d');
  for (const s of sprites) g.drawImage(s.cv, s.x, s.y); // (the base's context is already shifted by GX0)
  return base;
}

// The lobby at night: lit glass and a pool of light on the pavement.
// (ox, oy) is where the map's top-left corner is on screen; a is 0..1.
export function drawLobbyGlow(g, ox, oy, a, E = ENTRANCE) {
  if (a <= 0) return;
  const { x, y, w, h, doorX, doorW } = E;
  const px = x * T + ox;
  const py = y * T + oy;
  const pw = w * T;
  const ph = h * T;
  g.fillStyle = 'rgba(255, 206, 110, ' + (0.16 * a).toFixed(3) + ')';
  for (const k of [1, 0.7, 0.45]) {
    const rx = Math.round(46 * k);
    const ry = Math.round(20 * k);
    for (let j = -ry; j <= ry; j++) {
      const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry + 0.5))));
      g.fillRect(px + pw / 2 - half, py - 6 + j, half * 2, 1);
    }
  }
  g.fillStyle = 'rgba(255, 224, 140, ' + (0.6 * a).toFixed(3) + ')';
  g.fillRect(px + 7, py + 15, 2 * T - 6, ph - 17);
  g.fillRect(px + pw - 2 * T - 1, py + 15, 2 * T - 6, ph - 17);
  g.fillStyle = 'rgba(255, 236, 170, ' + (0.75 * a).toFixed(3) + ')';
  g.fillRect(doorX * T + ox + 1, py + 15, doorW * T - 2, ph - 17);
}
