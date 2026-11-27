// The apartment, traced from the floor plan (1 tile is roughly 40 cm).
//
// Coordinates here are 0-based [x, y]. The reference image
// docs/apartment-grid.png labels the same tiles spreadsheet-style:
// column A = x 0 … BA = x 52, row 1 = y 0 … row 22 = y 21 (so "AP5" is [41, 4]).
//
// Tile legend
//   ' ' outside   # wall   D front door   G glass wall   R balcony railing
//   w wood   t cream kitchen tile   g master-bath floor   p guest-bath tile
//   h hallway/storage beige   f foyer (darker beige)   l laundry   b balcony
//
// A second flat shares the map: Purple Scarf's, over in Garnet (see SCARF_PLAN
// below), standing by itself as this one does. It lies well to the east
// of this one, the two are not joined anywhere, and the view never leaves the
// flat the cats are in (FLATS), so neither is ever seen from the other.
//   s stark pale tile   c beige bathroom tile   (m, a low laminate platform, is not used any more)
export const MAP_W = 136;
export const MAP_H = 31;

// The flats, each with the tiles the view keeps to: [x0, y0, x1, y1]. (The gap between them is wider
// than anything in the game reaches: nobody in one flat is "near" somebody in the other.)
export const FLATS = { home: [0, 0, 52, 21], scarf: [100, 9, 135, 30] };
export const flatAt = (x) => (x >= FLATS.scarf[0] ? 'scarf' : 'home');
const SX = FLATS.scarf[0];

// Purple Scarf's flat, in Garnet: the same kind of flat as Hưng and Trang's
// with nothing done to it, and about two thirds the size: two bedrooms, two
// bathrooms. Its balcony is on the west, facing Amber, and is the one under
// Flower's (garnet.js has the picture of that side of the building): the
// pair come down onto it from hers, and it is too far to jump back up.
//
//  column:  1111111111222222222233333 3
//  0123456789012345678901234567890123 45
const SCARF_PLAN = [
  ...Array(9).fill('                                    '), //  0 to 8: nothing (the map's rows start at the top of the other flat)
  '   #################################', //  9  (her north wall is two tiles thick)
  'AAA#################################', // 10  (open air past the north end of her balcony: a rail along it)
  'Rbb#sssssssssssss#ssssssssss#cccccc#', // 11  balcony | kitchen | bedroom | bathroom
  'Rbb#sssssssssssss#ssssssssss#cccccc#', // 12
  'Rbb#sssssssssssss#ssssssssssscccccc#', // 13  (the bathroom's door, in the wall between)
  'Rbb#sssssssssssss#ssssssssss#cccccc#', // 14
  'Rbb#sssssssssssss#ssssssssss#cccccc#', // 15
  'RbbGsssssssssssss#ssssssssss#cccccc#', // 16  the living room: glass
  'RbbGsssssssssssss#ssssssssss#cccccc#', // 17
  'RbbGsssssssssssss#ssssssssss#cccccc#', // 18
  'RbbGsssssssssssss###s###############', // 19  (the bedroom's door)
  'Rbbbsssssssssssssssssssssssssss#    ', // 20  her balcony door, open; the hall
  'Rbbbsssssssssssssssssssssssssss#    ', // 21
  '###########s##sssss###c####s####    ', // 22
  '   #sssssssss#sssss#ccccc#sssss#    ', // 23  second bedroom | foyer | shower room | laundry
  '   #sssssssss#sssss#ccccc#sssss#    ', // 24
  '   #sssssssss#sssss#ccccc#sssss#    ', // 25
  '   #sssssssss#sssss#ccccc#sssss#    ', // 26
  '   #sssssssss#sssss#ccccc#sssss#    ', // 27
  '   #sssssssss#sssss#ccccc#sssss#    ', // 28
  '   #sssssssss#sssss#ccccc#sssss#    ', // 29
  '   ############DD###############    ', // 30  her front door, onto Garnet's corridor
];
// a tile of that plan, as a tile of the whole map
const at = (x, y) => [SX + x, y];

// The tiles the story will want (all of them tiles of the whole map).
export const SCARF = {
  // where the pair come down, at the north end of her balcony, from Flower's above (the leader first)
  arrive: [at(2, 11), at(2, 12)],
  balconyDoor: [at(3, 20), at(3, 21)], // open: the tiles in the line of the glass
  inside: at(4, 20), // the first tile indoors
  // the three clues: the tile each is on, and a tile to stand on in front of it
  clues: {
    clueCoat: { at: at(19, 11), stand: at(19, 12), room: 'Bedroom' },
    clueMap: { at: at(14, 29), stand: at(14, 28), room: 'Foyer' },
    clueSacks: { at: at(6, 23), stand: at(6, 24), room: 'Second Bedroom' },
  },
  // her front door (two tiles wide, in the south wall), the tiles just inside it, where she
  // stands when she has come in, and where two cats on their way out would stop short of it
  door: [at(15, 30), at(16, 30)],
  doorStep: [at(15, 29), at(16, 29)],
  enter: at(15, 29),
  pause: [at(15, 27), at(16, 27)],
};

export function buildTiles() {
  const t = [];
  for (let y = 0; y < MAP_H; y++) t.push(new Array(MAP_W).fill(' '));
  const fill = (x0, y0, x1, y1, ch) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) t[y][x] = ch;
  };
  const set = (x, y, ch) => (t[y][x] = ch);

  // wall masses
  fill(33, 0, 52, 21, '#'); // living / kitchen / laundry / balcony block
  fill(6, 3, 33, 21, '#'); // bedrooms, office, closet, hall
  fill(0, 6, 6, 21, '#'); // master bath

  // master bath
  fill(1, 8, 5, 20, 'g');
  set(6, 18, 'g'); // door to the closet

  // office (top) + walk-in closet (below), one open space
  fill(7, 5, 14, 20, 'w');

  // master bedroom + its little vestibule
  fill(16, 5, 23, 12, 'w');
  fill(16, 13, 17, 15, 'w');
  fill(15, 14, 15, 15, 'w'); // opening into the closet
  set(18, 15, 'w'); // master suite door

  // guest bedroom
  fill(25, 5, 32, 12, 'w');
  set(26, 13, 'w'); // door

  // hallway
  fill(19, 14, 33, 15, 'h');

  // guest bathroom
  fill(16, 17, 21, 20, 'p');
  set(19, 16, 'p'); // door

  // storage
  fill(23, 17, 26, 20, 'h');
  set(25, 16, 'h'); // door

  // living + dining
  fill(34, 2, 49, 12, 'w');
  // kitchen
  fill(34, 13, 43, 19, 't');
  fill(36, 20, 43, 20, 't');

  // foyer
  fill(28, 16, 28, 20, 'h');
  fill(29, 16, 34, 20, 'f');
  fill(35, 17, 35, 20, 'f');
  set(29, 21, 'D');
  set(30, 21, 'D');

  // laundry (litter corner on the left, laundry proper on the right)
  fill(45, 14, 51, 20, 'l');
  fill(47, 13, 47, 20, '#'); // dividing wall…
  set(47, 16, 'l'); // …with a door through it
  set(44, 16, 'l'); // door from the kitchen

  // balcony
  fill(51, 2, 51, 12, 'b');
  fill(50, 2, 50, 12, 'G');
  set(50, 6, 'b');
  set(50, 7, 'b');
  fill(52, 2, 52, 12, 'R');

  // Purple Scarf's flat, and the balconies beside it
  SCARF_PLAN.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) t[y][SX + x] = row[x];
  });
  return t;
}

// first match wins
export const ROOMS = [
  ['Master Bath', 0, 8, 6, 20],
  ['Office', 7, 5, 14, 9],
  ['Walk-in Closet', 7, 10, 15, 20],
  ['Master Bedroom', 16, 5, 23, 15],
  ['Guest Bedroom', 25, 5, 32, 13],
  ['Bathroom', 16, 16, 21, 20],
  ['Storage', 23, 16, 26, 20],
  ['Hallway', 18, 14, 33, 15],
  ['Foyer', 28, 16, 35, 20],
  ['Laundry', 44, 14, 51, 20],
  ['Balcony', 50, 2, 51, 12],
  ['Dining Room', 43, 2, 49, 12],
  ['Living Room', 34, 2, 42, 12],
  ['Kitchen', 34, 13, 43, 20],
  // Garnet
  ["Purple Scarf's Balcony", SX + 0, 11, SX + 3, 21],
  ['Kitchen', SX + 4, 11, SX + 16, 15],
  ['Living Room', SX + 4, 16, SX + 16, 21],
  ['Bedroom', SX + 18, 11, SX + 27, 19],
  ['Bathroom', SX + 28, 11, SX + 34, 18],
  ['Hall', SX + 17, 20, SX + 30, 21],
  ['Second Bedroom', SX + 4, 22, SX + 12, 29],
  ['Foyer', SX + 14, 22, SX + 18, 29],
  ['Shower Room', SX + 20, 22, SX + 24, 29],
  ['Laundry', SX + 26, 22, SX + 30, 29],
];

export function roomAt(x, y) {
  for (const [name, x0, y0, x1, y1] of ROOMS) if (x >= x0 && x <= x1 && y >= y0 && y <= y1) return name;
  return '';
}

// [type, x, y] — x,y is the top-left tile of the footprint
export const OBJECTS = [
  // living room
  ['tvwall', 34, 2],
  ['trashcan', 34, 11],
  ['armchair', 36, 2],
  ['sidetable', 39, 2],
  ['surflamp', 40, 2],
  ['fountain', 42, 2],
  ['feeder', 43, 2],
  ['purifier', 44, 2],
  ['bowls', 46, 2],
  ['cattree', 49, 2],
  ['coffeetable', 38, 6],
  ['sofa', 41, 4],
  ['wands', 42, 10],
  ['post', 49, 12],
  // the cat tunnel: on the open floor south of the dining table, inside the
  // loop the robot vacuum's grand tour makes, with two clear tiles at each mouth
  ['tunnel', 44, 11],
  // dining
  ['diningtable', 45, 5],
  ['chairW', 44, 6],
  ['chairW', 44, 7],
  ['chairW', 44, 8],
  ['chairE', 47, 6],
  ['chairE', 47, 7],
  ['chairE', 47, 8],
  // kitchen
  ['island', 38, 13],
  ['fridge', 37, 20],
  ['counter', 38, 20],
  ['ricecounter', 39, 20],
  ['hob', 40, 20],
  ['counter', 41, 20],
  ['tallunit', 42, 20],
  ['partition', 36, 18],
  // foyer
  ['bench', 35, 19],
  ['shoecab', 28, 17],
  ['vacuum', 29, 17],
  // master bedroom
  ['bedMaster', 20, 7],
  ['nightstandM', 23, 6],
  ['nightstandM', 23, 11],
  ['dresser', 16, 7],
  // guest bedroom
  ['wardrobeGuest', 25, 5],
  ['bedGuest', 29, 7],
  ['nightstand', 32, 6],
  ['nightstand', 32, 10],
  ['deskGuest', 32, 11],
  ['chairW', 31, 12],
  // office
  ['deskRun', 7, 5],
  ['deskSideL', 7, 6],
  ['deskSideR', 14, 6],
  ['ochairL', 8, 6],
  ['ochairR', 13, 6],
  ['plant', 14, 9],
  // walk-in closet
  ['wardrobeS', 7, 10],
  ['wardrobeV', 7, 11],
  ['wicIsland', 10, 13],
  ['wardrobeV3', 14, 17],
  ['wardrobeB', 7, 20],
  // master bath
  ['tub', 1, 8],
  ['glassH', 1, 12],
  ['vanityM', 1, 13],
  ['glassH', 1, 18],
  ['toiletE', 1, 19],
  // guest bathroom
  ['toilet', 16, 20],
  ['vanityS', 17, 20],
  ['glassV', 19, 19],
  // storage
  ['shelf', 23, 17],
  ['boxes', 26, 19],
  ['cardbox', 24, 20],
  // laundry
  ['catcab', 45, 14],
  ['litter', 46, 14],
  ['acunit', 45, 18],
  ['tallcab', 48, 14],
  ['washer', 49, 14],
  ['clothes', 50, 14],
  ['usink', 48, 19],
  // balcony
  ['planter', 51, 2],

  // ---- Garnet: Purple Scarf's flat
  ...[
    // her balcony
    // (the sacks at the south end, by the dead plant: the north end is where the pair come down)
    ['psSacks', 1, 19], ['psPot', 1, 21],
    // kitchen
    ['psFridge', 4, 11], ['psKitchen', 5, 11],
    ['psIsland', 7, 13], ['psBar', 13, 13], ['psChairW', 12, 13], ['psChairE', 14, 14],
    // living room
    ['psSofa', 4, 16], ['psTable', 8, 17], ['psConsole', 16, 16],
    // (what she has added herself: a lamp, plastic flowers, last week's dinners, and clothes where they fell)
    ['psLamp', 6, 16], ['psCups', 9, 18], ['psClothes', 6, 19], ['psFlowers', 4, 15],
    // bedroom
    ['clueCoat', 18, 11], ['psBed', 24, 15], ['psClothes', 23, 14], ['psClothes', 19, 14], ['psFlowers', 27, 11],
    // bathroom (no window)
    ['psTub', 30, 11], ['psVanity', 34, 15], ['psToilet', 29, 17],
    // second bedroom, used as a store
    ['clueSacks', 5, 23], ['psBoxes', 9, 23], ['psMattress', 4, 26], ['psFlyers', 12, 25],
    // foyer
    ['clueMap', 14, 29], ['psShoes', 18, 28], ['psFlyers', 18, 23],
    // shower room (no window)
    ['psToilet', 20, 23], ['psVanity', 24, 23], ['psScreen', 20, 27],
    // laundry
    ['psWasher', 26, 23], ['psRack', 28, 23], ['psMop', 30, 29], ['psClothes', 30, 26],
  ].map(([type, x, y]) => [type, SX + x, y]),
];

// knockable things: [item, x, y]
export const ITEM_SPOTS = [
  ['mug', 38, 7],
  ['vase', 45, 6],
  ['oranges', 46, 8],
  ['herb', 39, 13],
  ['driedvase', 11, 13],
  ['sculpture', 35, 3],
  ['candle', 35, 4], // (beside the sculpture: the two tiles in front of the screen are kept clear for two cats)
  ['frame', 35, 7],
];

export const DECOR = {
  // [x0, x1, row, options]
  windows: [
    [35, 42, 1, {}],
    [44, 49, 1, {}],
    [9, 12, 4, { blinds: true }],
    [18, 21, 4, {}],
    [27, 30, 4, {}],
    [2, 3, 7, { offset: 8 }], // master bath, half a tile in
    [SX + 22, SX + 25, 10, { roller: 4 }], // her bedroom: a roller blind, part of the way down
  ],
  // windows in north-south walls: [x, firstRow, lastRow]
  sideWindows: [[52, 16, 17], [SX + 3, 25, 26]],
  // [x, row, 'full' | 'left' | 'right'] — cats can climb all of these
  curtains: [
    // living room, partly drawn
    [35, 1, 'full'], [36, 1, 'full'], [37, 1, 'left'],
    [40, 1, 'right'], [41, 1, 'full'], [42, 1, 'full'],
    [44, 1, 'full'], [45, 1, 'left'],
    [48, 1, 'right'], [49, 1, 'full'],
    // master bedroom
    [16, 4, 'full'], [17, 4, 'full'], [22, 4, 'full'], [23, 4, 'full'],
    // guest bedroom
    [25, 4, 'full'], [26, 4, 'full'], [31, 4, 'full'], [32, 4, 'full'],
  ],
  art: [
    [14, 4, 'fern'],
    [21, 13, 'fern'],
    [29, 13, 'abstract'],
    [31, 13, 'flower'],
  ],
  rugs: [
    [37, 4, 40, 9, 'living'],
    [18, 6, 22, 11, 'master'],
    [27, 6, 31, 10, 'guest'],
    [4, 13, 5, 13, 'bath'],
    // (Purple Scarf's flat has none)
  ],
  drains: [[21, 20], [SX + 21, 29]],
  // [x, y, wall side the arm comes from, colour key]
  showerHeads: [
    [1, 10, 'W', 'copper'],
    [20, 20, 'S', 'steel'],
    [SX + 20, 28, 'W', 'steel'],
  ],
  // [x, firstRow, lastRow]
  headboards: [[23, 5, 12]],
  frontDoor: [29, 21],
  // Purple Scarf's front door: [x, row, the look of it]
  doors: [[SX + 15, 30, 'plain']],
  // her scarf, left over her balcony rail: the rail's tile
  scarf: [SX + 0, 12],
  // open doors: [x, y, sits in a vertical wall?, the look of it (hers are white laminate)]
  thresholds: [
    [SX + 28, 13, true, 'plain'],
    [SX + 20, 19, false, 'plain'],
    [SX + 11, 22, false, 'plain'],
    [SX + 22, 22, false, 'plain'],
    [SX + 27, 22, false, 'plain'],
    [6, 18, true],
    [18, 15, true],
    [44, 16, true],
    [47, 16, true],
    [26, 13, false],
    [19, 16, false],
    [25, 16, false],
  ],
  // wall cells drawn as plain structural wall (no wall face), e.g. above doors
  caps: [[6, 17], [44, 15], [47, 15], [18, 14], [15, 13], [SX + 28, 12]],
};

// Places the humans drift between. `seat` is an optional chair/sofa tile.
export const WAYPOINTS = [
  { id: 'desk1', stand: [8, 7], seat: [8, 6], face: 'left', act: 'work', who: 0 },
  { id: 'desk2', stand: [13, 7], seat: [13, 6], face: 'right', act: 'work', who: 1 },
  { id: 'sofa1', stand: [40, 5], seat: [41, 5], face: 'left', act: 'tv' },
  { id: 'sofa2', stand: [40, 8], seat: [41, 8], face: 'left', act: 'tv' },
  { id: 'stove', stand: [40, 19], face: 'down', act: 'cook' },
  { id: 'sink', stand: [42, 15], face: 'up', act: 'dishes' },
  { id: 'fridge', stand: [37, 19], face: 'down', act: 'snack' },
  { id: 'coffee', stand: [43, 12], face: 'down', act: 'coffee' },
  { id: 'dine1', stand: [43, 7], seat: [44, 7], face: 'right', act: 'eat' },
  { id: 'dine2', stand: [48, 7], seat: [47, 7], face: 'left', act: 'eat' },
  { id: 'balcony', stand: [51, 10], face: 'right', act: 'view' },
  // in bed: the "seat" is the pillow
  { id: 'bed1', stand: [19, 7], seat: [23, 7], face: 'down', act: 'sleep', who: 0 },
  { id: 'bed2', stand: [19, 9], seat: [23, 9], face: 'down', act: 'sleep', who: 1 },
  { id: 'wc1', stand: [2, 19], seat: [1, 19], face: 'right', act: 'toilet' },
  { id: 'wc2', stand: [16, 19], seat: [16, 20], face: 'up', act: 'toilet' },
  { id: 'closet', stand: [9, 11], face: 'up', act: 'outfit' },
  { id: 'laundry', stand: [49, 15], face: 'up', act: 'laundry' },
  { id: 'plant', stand: [13, 9], face: 'right', act: 'water' },
];

export const START = {
  cats: [
    [38, 10],
    [37, 10],
  ],
  humans: ['bed1', 'bed2'],
  // each human's own bathroom at bedtime
  wc: ['wc1', 'wc2'],
};

// How likely each activity is in each part of the day (relative weights).
// Sleep is not in here: bedtime is handled separately (see game.js).
export const SCHEDULE = {
  // meals: someone cooks, then both eat together at the dining table (one
  // meal per morning / afternoon / evening, so "cook" drops out once it's done)
  morning: { coffee: 5, toilet: 3, outfit: 3, cook: 4, snack: 1, view: 2, water: 2, work: 2, dishes: 1, laundry: 1 },
  day: { work: 8, laundry: 2, water: 1, snack: 2, coffee: 2, toilet: 1, view: 1, dishes: 1, cook: 3, tv: 1, outfit: 1 },
  evening: { cook: 8, tv: 5, dishes: 2, view: 2, snack: 1, toilet: 1, work: 1, laundry: 1 },
  // late evening and night: only for whoever is staying up
  night: { work: 4, tv: 3, snack: 1, toilet: 1, view: 1 },
};

// Lamps that come on when it gets dark: [x, y] in tiles, radius in pixels.
//   living: on while anyone is up · master: from 10pm until both are asleep
//   scarf: what her ceiling lights throw out through the glass
export const LIGHTS = [
  { x: 40.5, y: 2.4, r: 50, group: 'living' }, // red floor lamp
  { x: 23.5, y: 6.0, r: 30, group: 'master', lamp: [23, 6] },
  { x: 23.5, y: 11.0, r: 30, group: 'master', lamp: [23, 11] },
  { x: SX + 2.6, y: 18.5, r: 34, group: 'scarf', cold: true },
];
// Ceiling lights, in a flat that has nothing else: a whole room lit evenly, and cold. [x0, y0, x1, y1]
export const ROOM_LIGHTS = [
  [4, 11, 16, 21], // kitchen and living room
  [17, 20, 30, 21], // hall
  [18, 11, 27, 18], // bedroom
  [29, 11, 34, 18], // bathroom
  [28, 13, 28, 13], // (and the doorway between the two)
  [4, 23, 12, 29], // second bedroom
  [14, 22, 18, 29], // foyer
  [20, 23, 24, 29], // shower room
  [26, 23, 30, 29], // laundry
].map(([x0, y0, x1, y1]) => ({ flat: 'scarf', rect: [SX + x0, y0, SX + x1, y1] })).concat([
  // Amber: the light in the foyer, which only the story switches on (somebody coming home late, in the
  // epilogue). warm: none of the cold cast that Purple Scarf's rooms have.
  { flat: 'foyer', rect: [28, 16, 35, 20], warm: true },
  { flat: 'foyer', rect: [36, 14, 43, 20], warm: true },
]);
// Screens throw a soft, one-sided light (dir 1 = east, -1 = west) from the
// screen's edge. The TV lights the sofa; the desk monitors light whoever is
// sitting at them, which only shows when someone works late.
export const SCREEN_LIGHTS = [
  { id: 'tv', x: 35, y: 5.6, r: 64, ry: 0.55, dir: 1 },
  { id: 'desk1', x: 7.45, y: 6.1, r: 44, ry: 0.6, dir: 1 },
  { id: 'desk2', x: 14.55, y: 6.1, r: 44, ry: 0.6, dir: -1 },
];

// The robot vacuum's joyrides: each starts and ends on its dock (29,17).
// Routes are written as corners and filled in with straight lines.
function route(...corners) {
  const out = [corners[0]];
  for (let i = 1; i < corners.length; i++) {
    let [x, y] = corners[i - 1];
    const [tx, ty] = corners[i];
    while (x !== tx || y !== ty) {
      x += Math.sign(tx - x);
      y += Math.sign(ty - y);
      out.push([x, y]);
    }
  }
  return out;
}
const DOCK = [29, 17];
export const VACUUM_ROUTES = [
  // a quick lap of the foyer
  route(DOCK, [29, 18], [32, 18], [32, 16], [29, 16], DOCK),
  route(DOCK, [29, 19], [33, 19], [33, 16], [29, 16], DOCK),
  // up and down the hallway
  route(DOCK, [29, 15], [35, 15], [35, 14], [28, 14], [28, 16], [29, 16], DOCK),
  route(DOCK, [29, 15], [19, 15], [19, 14], [33, 14], [33, 16], [29, 16], DOCK),
  // round the kitchen
  route(DOCK, [29, 16], [37, 16], [37, 19], [43, 19], [43, 15], [37, 15], [37, 16], [29, 16], DOCK),
  // a visit to the laundry
  route(DOCK, [29, 16], [46, 16], [46, 17], [45, 17], [45, 16], [29, 16], DOCK),
  // the grand tour of the living room
  route(DOCK, [29, 15], [34, 15], [34, 12], [48, 12], [48, 10], [43, 10], [43, 11], [35, 11], [35, 15], [29, 15], DOCK),
];

// where a human stands just inside the front door, and floor areas
// [x0, y0, x1, y1] where they might put down something they brought home
export const DOOR_SPOTS = [[29, 20], [30, 20]];
export const DROP_ZONES = [
  [36, 10, 40, 12],
  [49, 9, 49, 10], // by the balcony glass (the floor south of the dining table is the cat tunnel's)
  [17, 5, 19, 12],
  [26, 11, 29, 12],
  [31, 17, 34, 19],
  [8, 8, 12, 9],
];
