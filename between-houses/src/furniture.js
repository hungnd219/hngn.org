// Every piece of furniture: its footprint (in tiles), how tall its sprite is,
// how it is drawn, and what a cat can do with it.
//
//   w,h    footprint in tiles          up     extra sprite pixels above it
//   perch  number | fn(lx,ly) -> {h, from?}   (a surface cats can hop onto;
//          `from` limits which sides it can be entered from: 'N','S','E','W')
//   bump   what happens when a cat walks into it (see ACTIONS in game.js)
//   lines  captions for the bump · perchLines  captions when hopping on
//          (a list; or { shark: [...], orca: [...] } where each cat notices something else)
import { C, R, P, canvas } from './palette.js';

const k = C.k;

// a box seen in 3/4 view: top face + south face
function block(g, x, y, w, h, f, top, front) {
  R(g, x, y, w, h, k);
  R(g, x + 1, y + 1, w - 2, h - f - 2, top);
  R(g, x + 1, y + h - f, w - 2, f - 1, front);
}
function corners(g, x, y, w, h, n = 1) {
  for (let i = 0; i < n; i++) {
    const l = n - i;
    g.clearRect(x, y + i, l, 1);
    g.clearRect(x + w - l, y + i, l, 1);
    g.clearRect(x, y + h - 1 - i, l, 1);
    g.clearRect(x + w - l, y + h - 1 - i, l, 1);
  }
}
function disc(g, cx, cy, rx, ry, c) {
  g.fillStyle = c;
  for (let y = -ry; y <= ry; y++) {
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.5))));
    g.fillRect(cx - half, cy + y, half * 2, 1);
  }
}
function ring(g, cx, cy, rx, ry, c, fill) {
  disc(g, cx, cy, rx, ry, c);
  disc(g, cx, cy, rx - 1, ry - 1, fill);
}

function drawBed(g, W, H, o) {
  // headboard on the east side
  R(g, W - 6, 0, 6, H, k);
  R(g, W - 5, 1, 4, H - 9, o.head);
  R(g, W - 5, H - 8, 4, 7, o.headD);
  // mattress + duvet
  R(g, 0, 4, W - 5, H - 4, k);
  R(g, 1, 5, W - 7, H - 14, o.duvet);
  R(g, 1, H - 9, W - 7, 1, o.duvetD);
  R(g, 1, H - 8, W - 7, 7, o.base);
  g.clearRect(0, 4, 1, 1);
  g.clearRect(0, H - 1, 1, 1);
  // duvet folds
  for (let x = 8; x < W - 28; x += 9) R(g, x, 7, 1, H - 18, o.duvetD);
  // throw blanket
  if (o.throw) {
    R(g, 10, 5, 18, H - 14, o.throw);
    R(g, 10, 5, 1, H - 14, o.throwD);
    R(g, 27, 5, 1, H - 14, o.throwD);
    R(g, 14, 5, 1, H - 14, o.throwD);
    R(g, 10, H - 8, 18, 6, o.throwD);
  }
  // two pillows by the headboard
  const ph = ((H - 16) / 2) | 0;
  for (let i = 0; i < 2; i++) {
    const py = 6 + i * ph;
    R(g, W - 19, py, 13, ph - 1, k);
    R(g, W - 18, py + 1, 11, ph - 3, o.pillow || C.white);
    R(g, W - 18, py + ph - 3, 11, 1, o.pillowD || C.grayL);
    if (o.accent) {
      R(g, W - 24, py + 2, 6, ph - 5, k);
      R(g, W - 23, py + 3, 4, ph - 7, o.accent);
    }
  }
  if (o.knot) {
    disc(g, W - 24, (H / 2) | 0, 4, 4, k);
    disc(g, W - 24, (H / 2) | 0, 3, 3, C.terracotta);
    P(g, W - 25, ((H / 2) | 0) - 1, C.pinkL);
  }
}

function chairDraw(back) {
  // dining-style chair; `back` is the side the backrest is on
  return (g) => {
    R(g, 3, 19, 2, 3, C.walnut);
    R(g, 11, 19, 2, 3, C.walnut);
    R(g, 2, 7, 12, 12, k);
    R(g, 3, 8, 10, 8, C.white);
    R(g, 3, 16, 10, 2, C.beige);
    if (back === 'W') {
      R(g, 1, 2, 4, 16, k);
      R(g, 2, 3, 2, 12, C.cream);
      R(g, 2, 15, 2, 2, C.walnut);
    } else if (back === 'E') {
      R(g, 11, 2, 4, 16, k);
      R(g, 12, 3, 2, 12, C.cream);
      R(g, 12, 15, 2, 2, C.walnut);
    } else if (back === 'S') {
      R(g, 2, 13, 12, 7, k);
      R(g, 3, 14, 10, 3, C.cream);
      R(g, 3, 17, 10, 2, C.walnut);
    } else {
      R(g, 2, 2, 12, 7, k);
      R(g, 3, 3, 10, 3, C.cream);
      R(g, 3, 6, 10, 2, C.beige);
    }
  };
}

function wardrobeTop(g, W, H, f, front) {
  block(g, 0, 0, W, H, f, C.cream, front);
  // wood trim around the top
  R(g, 1, 1, W - 2, 1, C.wood);
  R(g, 1, H - f - 2, W - 2, 1, C.wood);
  R(g, 1, 1, 1, H - f - 2, C.wood);
  R(g, W - 2, 1, 1, H - f - 2, C.wood);
}

// portions: 2 full, 1 half, 0 empty
function drawFeeder(g, H, portions) {
  R(g, 3, 0, 10, 13, k);
  R(g, 4, 1, 8, 11, C.charcoal);
  R(g, 4, 1, 8, 1, C.grayD);
  // hopper window: how much kibble is left
  R(g, 5, 3, 6, 5, C.grayD);
  const fill = [2, 3, 4][portions];
  R(g, 5, 8 - fill, 6, fill, C.tan);
  P(g, 6, 9 - fill, C.taupe);
  P(g, 10, 10, portions ? C.leafL : C.orange);
  // tray + bowl
  R(g, 1, 12, 14, H - 12, k);
  R(g, 2, 13, 12, H - 16, C.charcoal);
  R(g, 2, H - 3, 12, 2, '#26222a');
  disc(g, 8, 16, 4, 2, C.steel);
  disc(g, 8, 16, 3, 1, portions ? C.walnut : C.grayD);
  if (portions) P(g, 7, 15, C.tan);
  if (portions === 2) {
    P(g, 9, 16, C.tan);
    P(g, 6, 16, C.tan);
    P(g, 10, 15, C.tan);
  }
}

// each bowl is 'food', 'licked' or 'clean'
function drawBowls(g, left, right) {
  R(g, 0, 4, 16, 10, C.gray);
  R(g, 1, 5, 14, 8, C.grayL);
  for (const [cx, bowl, dark, st] of [[5, C.wood, C.woodD, left], [11, C.oliveL, C.olive, right]]) {
    disc(g, cx, 9, 4, 3, k);
    disc(g, cx, 9, 3, 2, bowl);
    if (st === 'food') {
      R(g, cx - 2, 8, 4, 2, C.terracotta);
      P(g, cx, 9, C.walnut);
      P(g, cx - 1, 8, C.pinkL);
    } else {
      R(g, cx - 1, 9, 3, 1, dark);
      if (st === 'licked') {
        P(g, cx - 2, 8, C.terracotta);
        P(g, cx + 1, 10, C.walnut);
      }
    }
  }
}

// Purple Scarf's flat (the `ps` types below): laminate, plastic and white paint, none of it chosen.
const PS = {
  lam: '#a7a49c', lamD: '#8a8780', lamL: '#bcb9b1', // greige laminate
  white: '#e6e9e9', whiteD: '#c9ced0', whiteL: '#f6f7f7', // white laminate, white plastic
  black: '#2c2a30', blackD: '#1d1b20', blackL: '#514e58', shine: '#8a8795', // worktops, and a sofa that is not leather
  green: '#bcdccb', greenD: '#9fc4b0', // a strip of pale green glass
  sheet: '#c8c5bc', sheetD: '#aeaba2', // bedding that used to be white
  sack: '#b99b6a', sackD: '#93764a', label: '#efe6d2',
  tile: '#dccdb2', tileD: '#c2b092',
};
// a white plastic chair on thin steel legs; `back` is the side its back is on
function psChair(back) {
  return (g) => {
    R(g, 3, 18, 1, 4, C.steel);
    R(g, 12, 18, 1, 4, C.steel);
    R(g, 2, 7, 12, 12, k);
    R(g, 3, 8, 10, 8, PS.white);
    R(g, 3, 8, 10, 1, PS.whiteL);
    R(g, 3, 16, 10, 2, PS.whiteD);
    if (back === 'W') {
      R(g, 1, 2, 4, 16, k);
      R(g, 2, 3, 2, 14, PS.white);
      R(g, 2, 3, 2, 1, PS.whiteL);
    } else if (back === 'E') {
      R(g, 11, 2, 4, 16, k);
      R(g, 12, 3, 2, 14, PS.white);
      R(g, 12, 3, 2, 1, PS.whiteL);
    } else if (back === 'S') {
      R(g, 2, 13, 12, 8, k);
      R(g, 3, 14, 10, 6, PS.white);
      R(g, 5, 16, 6, 2, PS.whiteD);
    } else {
      R(g, 2, 1, 12, 8, k);
      R(g, 3, 2, 10, 6, PS.white);
      R(g, 5, 4, 6, 2, PS.whiteD);
    }
  };
}
// a paper sack of dog food, standing: 14 wide, h tall
function psSack(g, x, y, h) {
  R(g, x, y, 14, h, k);
  R(g, x + 1, y + 1, 12, h - 2, PS.sack);
  R(g, x + 1, y + 1, 12, 2, PS.sackD);
  R(g, x + 12, y + 3, 1, h - 4, PS.sackD);
  R(g, x + 3, y + 5, 8, 6, PS.label);
  // a bone, printed on the label
  R(g, x + 5, y + 7, 4, 2, PS.sackD);
  P(g, x + 4, y + 7, PS.sackD);
  P(g, x + 9, y + 8, PS.sackD);
}

export const TYPES = {
  // ------------------------------------------------------------ living
  sofa: {
    w: 2, h: 6, up: 6, name: 'sofa',
    perch: (lx) => (lx === 0 ? { h: 5, from: 'W' } : { h: 10, from: '' }),
    bump: 'scratch',
    lines: [
      "{c} scratches the sofa. It's even better than it looks.",
      '{c} sharpens those claws on the green sofa. Scritch scritch!',
      'Scritch scritch scritch... the sofa never stood a chance.',
    ],
    scold: ['"{c}! Not the sofa!!"', '"Hey! We have a scratching post!"'],
    perchLines: ['{c} hops onto the sofa, and picks the warm end.'],
    draw(g, W, H) {
      R(g, 1, 2, 30, H - 2, k);
      corners(g, 1, 2, 30, H - 2, 2);
      R(g, 2, 3, 28, H - 11, C.olive);
      R(g, 2, H - 8, 28, 6, C.oliveD);
      R(g, 3, H - 2, 26, 1, k);
      // arms
      R(g, 2, 3, 28, 10, C.oliveL);
      R(g, 2, 13, 28, 1, C.oliveD);
      R(g, 2, H - 20, 28, 1, C.oliveD);
      R(g, 2, H - 19, 28, 11, C.oliveL);
      // backrest
      R(g, 18, 14, 1, H - 34, C.oliveD);
      R(g, 19, 14, 11, H - 34, C.oliveL);
      R(g, 28, 14, 2, H - 34, C.olive);
      // cushion split
      const mid = ((14 + H - 20) / 2) | 0;
      R(g, 2, mid, 28, 1, C.oliveD);
      // puffy seat cushions
      for (const y0 of [15, mid + 2]) {
        R(g, 4, y0 + 1, 12, mid - 18, '#687a43');
        R(g, 4, y0 + 1, 12, 1, C.oliveL);
        R(g, 4, y0 + 1, 1, mid - 18, C.oliveL);
        R(g, 22, y0 + 1, 5, mid - 18, '#8c9e59');
      }
      g.clearRect(2, 3, 1, 1);
      g.clearRect(29, 3, 1, 1);
    },
  },
  armchair: {
    w: 2, h: 2, up: 6, name: 'armchair', perch: 5,
    perchLines: ['{c} claims the big armchair. Room for two!', "The armchair is {c}'s now."],
    draw(g, W, H) {
      R(g, 3, H - 5, 3, 5, C.walnut);
      R(g, 26, H - 5, 3, 5, C.walnut);
      R(g, 1, 1, 30, H - 5, k);
      corners(g, 1, 1, 30, H - 5, 2);
      // backrest
      R(g, 2, 2, 28, 10, C.cream);
      R(g, 2, 2, 28, 1, C.white);
      R(g, 2, 12, 28, 1, C.tan);
      for (let x = 5; x < 28; x += 3) P(g, x, 6 + (x % 2), C.beige);
      // wooden arms
      R(g, 2, 13, 4, 20, C.walnut);
      R(g, 26, 13, 4, 20, C.walnut);
      R(g, 3, 13, 1, 20, C.wood);
      R(g, 27, 13, 1, 20, C.wood);
      // seat
      R(g, 6, 13, 20, 15, C.white);
      R(g, 6, 13, 20, 1, C.cream);
      for (let y = 16; y < 27; y += 3) for (let x = 8 + (y % 2) * 2; x < 25; x += 4) P(g, x, y, C.cream);
      R(g, 6, 28, 20, 5, C.beige);
      g.clearRect(1, 1, 1, 1);
    },
  },
  coffeetable: {
    w: 2, h: 2, up: 4, name: 'coffee table', perch: 5,
    perchLines: ["{c} is on the coffee table, next to somebody's cup."],
    draw(g) {
      disc(g, 16, 20, 15, 13, k);
      disc(g, 16, 20, 14, 12, C.walnut);
      for (let x = 3; x < 30; x += 4) R(g, x, 26, 2, 5, C.walnutD);
      disc(g, 16, 15, 15, 12, k);
      disc(g, 16, 15, 14, 11, C.wood);
      disc(g, 16, 14, 10, 7, C.woodL);
      disc(g, 16, 14, 6, 4, C.wood);
      // books
      R(g, 17, 14, 9, 6, k);
      R(g, 18, 15, 7, 4, C.cream);
      R(g, 18, 17, 7, 1, C.gray);
    },
  },
  sidetable: {
    w: 1, h: 1, up: 6, name: 'side table', perch: 6,
    perchLines: ['{c} perches on the little red side table.'],
    draw(g) {
      block(g, 2, 2, 12, 20, 9, C.orange, C.red);
      R(g, 6, 15, 4, 5, C.burgundy);
      R(g, 4, 4, 8, 6, k);
      R(g, 5, 5, 6, 4, C.white);
      R(g, 5, 7, 6, 1, C.blue);
    },
  },
  tvwall: {
    // Against the west wall. The back column is the wall of shelving drawn
    // "unfolded" (as you would see it from the sofa, tipped onto its back) so
    // the TV, books and green doors can be read from above; the front column
    // is the low wooden console the cats can walk along.
    w: 2, h: 8, up: 8, name: 'TV console', bump: 'tv',
    perch: (lx) => (lx === 1 ? { h: 6 } : null),
    perchLines: ['{c} hops onto the TV console. Front-row seat.', '{c} inspects the trinkets on the console, one paw at a time.'],
    scold: ['"{c}, careful up there!"'],
    draw(g, W, H) {
      const back = '#c99c63';
      const books = (x, y, n, cols) => {
        for (let i = 0; i < n; i++) R(g, x, y + i * 2, 3, 2, cols[i % cols.length]);
      };
      R(g, 0, 0, 16, H, k);
      R(g, 1, 1, 14, H - 2, C.woodL);
      R(g, 1, 1, 2, H - 2, C.wood); // top edge, against the wall
      // north bay: open shelves with a plant and books
      R(g, 4, 2, 11, 15, back);
      R(g, 7, 2, 1, 15, C.woodL);
      R(g, 11, 2, 1, 15, C.woodL);
      R(g, 4, 4, 3, 3, C.white);
      R(g, 4, 3, 2, 3, C.leaf);
      P(g, 5, 2, C.leafL);
      books(8, 4, 5, [C.cream, C.burgundy, C.white, C.gold]);
      books(12, 3, 6, [C.navy, C.cream, C.white, C.blue]);
      // tall green door
      R(g, 4, 18, 11, 12, C.olive);
      R(g, 4, 18, 11, 1, C.oliveL);
      P(g, 12, 27, C.cream);
      // TV recess: wood back panel, a high shelf above the screen
      R(g, 4, 31, 11, 66, back);
      R(g, 4, 31, 2, 18, C.olive);
      books(4, 51, 12, [C.navy, C.burgundy, C.cream, C.blue, C.white]);
      R(g, 4, 77, 2, 20, C.olive);
      R(g, 6, 31, 1, 66, C.woodL);
      // the TV (the game draws the picture when it is on)
      R(g, 7, 35, 8, 58, k);
      R(g, 8, 36, 6, 56, C.charcoal);
      R(g, 9, 38, 1, 16, C.grayD);
      R(g, 10, 38, 1, 6, C.grayD);
      // narrow bay: books, a vase and a photo frame
      R(g, 4, 98, 11, 11, back);
      R(g, 8, 98, 1, 11, C.woodL);
      books(5, 99, 4, [C.cream, C.burgundy, C.navy]);
      R(g, 10, 100, 3, 3, C.cream);
      R(g, 11, 104, 3, 4, C.gold);
      P(g, 12, 105, C.sky);
      // south bay: tall green door with boxes on top
      R(g, 4, 110, 11, 16, back);
      R(g, 7, 110, 8, 16, C.olive);
      R(g, 7, 110, 8, 1, C.oliveL);
      R(g, 4, 112, 2, 5, C.charcoal);
      R(g, 4, 119, 2, 5, C.charcoal);
      P(g, 13, 113, C.cream);
      for (const y of [17, 30, 97, 109]) R(g, 3, y, 12, 1, C.woodL);
      R(g, 1, H - 9, 14, 8, C.wood);
      R(g, 1, H - 9, 14, 1, C.woodD);
      // the low console
      block(g, 16, 2, 16, H - 2, 7, C.wood, C.woodD);
      R(g, 17, 3, 14, 1, C.woodL);
      for (let y = 18; y < H - 10; y += 16) R(g, 17, y, 14, 1, C.woodD);
      // stacks of books and a box at the two ends
      R(g, 19, 5, 10, 9, k);
      R(g, 20, 6, 8, 3, C.burgundy);
      R(g, 20, 9, 8, 2, C.white);
      R(g, 20, 11, 8, 2, C.burgundy);
      R(g, 18, 102, 8, 8, k);
      R(g, 19, 103, 6, 6, C.white);
      P(g, 21, 105, C.orange);
      R(g, 22, 114, 8, 8, k);
      R(g, 23, 115, 6, 2, C.cream);
      R(g, 23, 117, 6, 2, C.navy);
      R(g, 23, 119, 6, 2, C.cream);
    },
  },
  plant: {
    w: 1, h: 1, up: 16, name: 'fiddle-leaf fig', bump: 'chew',
    lines: [
      '{c} nibbles the fiddle-leaf fig. Crunchy.',
      '{c} bats at a leaf. The plant is winning.',
      'Chomp. That leaf had it coming.',
    ],
    scold: ["\"{c}, that's NOT cat grass!\""],
    draw(g) {
      R(g, 4, 22, 8, 9, k);
      R(g, 5, 23, 6, 7, C.white);
      R(g, 5, 28, 6, 2, C.grayL);
      R(g, 7, 16, 2, 7, C.walnut);
      disc(g, 8, 10, 7, 8, k);
      disc(g, 8, 10, 6, 7, C.leafD);
      disc(g, 5, 7, 3, 3, C.leaf);
      disc(g, 11, 9, 3, 3, C.leaf);
      disc(g, 7, 13, 3, 2, C.leaf);
      P(g, 4, 6, C.leafL);
      P(g, 5, 6, C.leafL);
      P(g, 11, 8, C.leafL);
      P(g, 7, 12, C.leafL);
      P(g, 9, 4, C.leafL);
    },
  },
  post: {
    w: 1, h: 1, up: 12, name: 'scratching post', bump: 'scratch',
    lines: [
      '{c} goes to town on the scratching post. Good kitty!',
      "Scritch scritch! This is what it's for.",
    ],
    draw(g) {
      R(g, 1, 21, 14, 7, k);
      R(g, 2, 22, 12, 3, C.cream);
      R(g, 2, 25, 12, 2, C.beige);
      R(g, 5, 2, 6, 21, k);
      R(g, 6, 3, 4, 19, C.tan);
      for (let y = 4; y < 22; y += 2) R(g, 6, y, 4, 1, C.taupe);
      R(g, 4, 1, 8, 3, k);
      R(g, 5, 2, 6, 1, C.cream);
      P(g, 12, 4, k);
      P(g, 13, 5, k);
      R(g, 12, 6, 3, 3, C.red);
      P(g, 13, 6, C.pinkL);
    },
  },
  surflamp: {
    w: 1, h: 1, up: 30, name: 'red floor lamp', bump: 'wobble',
    lines: [
      '{c} rubs against the red lamp. It sways like a surfboard... and stays up.',
      "{c} bats at the lamp cable. The lamp isn't amused.",
    ],
    draw(g, W, H) {
      // marble base + pole
      disc(g, 8, H - 3, 6, 2, k);
      disc(g, 8, H - 3, 5, 1, C.white);
      R(g, 7, 0, 2, H - 4, k);
      // the red board with three glowing panels
      disc(g, 8, 20, 6, 17, k);
      disc(g, 8, 20, 5, 16, '#8f2a2a');
      R(g, 4, 8, 1, 24, '#a83a34');
      for (const y of [8, 17, 26]) {
        R(g, 5, y, 6, 7, '#6e1f20');
        R(g, 6, y, 4, 7, C.white);
        R(g, 5, y + 1, 6, 5, C.white);
        R(g, 6, y + 1, 4, 2, '#fffaf0');
      }
    },
  },
  trashcan: {
    w: 1, h: 1, up: 16, name: 'egg bin', bump: 'look',
    lines: [
      '{c} sniffs the egg-shaped trash can. Something in there smells AMAZING.',
      "{c} paws at the trash can lid. It stays shut. Whatever's in there is staying in there.",
    ],
    draw(g, W, H) {
      const body = '#e6d6ba';
      const shade = '#cdbb9c';
      disc(g, 8, H - 3, 6, 2, k);
      disc(g, 8, H - 3, 5, 1, body);
      R(g, 7, H - 9, 2, 6, k);
      P(g, 7, H - 8, body);
      disc(g, 8, 12, 7, 12, k);
      disc(g, 8, 12, 6, 11, body);
      R(g, 3, 9, 1, 8, C.cream);
      R(g, 12, 8, 1, 10, shade);
      // lid button + door seams
      disc(g, 8, 5, 3, 3, shade);
      disc(g, 8, 5, 2, 2, body);
      R(g, 4, 10, 8, 1, shade);
      R(g, 6, 12, 4, 1, C.taupe);
      R(g, 2, 16, 2, 1, C.taupe);
      R(g, 12, 16, 2, 1, C.taupe);
      R(g, 5, 21, 6, 1, shade);
    },
  },
  fountain: {
    w: 1, h: 1, up: 4, name: 'water fountain', bump: 'eat',
    lines: [
      'Slurp slurp slurp. {c} loves the bubbly fountain water.',
      '{c} dips a paw in the fountain, then drinks from the paw.',
    ],
    draw(g, W, H) {
      block(g, 1, 3, 14, H - 3, 6, C.charcoal, '#26222a');
      corners(g, 1, 3, 14, H - 3);
      R(g, 3, 5, 10, 7, C.grayD);
      R(g, 4, 6, 8, 5, C.sky);
      R(g, 5, 7, 3, 1, C.skyL);
      R(g, 7, 3, 2, 6, k);
      P(g, 7, 4, C.grayD);
      P(g, 8, 9, C.skyL);
      P(g, 12, H - 3, C.leafL);
    },
  },
  feeder: {
    w: 1, h: 1, up: 6, name: 'kibble machine', bump: 'eat',
    lines: [
      'Crunch crunch crunch. The kibble machine provides.',
      '{c} eats the kibble in about four bites.',
      '{c} eats three kibbles and saves the rest for later. Then eats the rest.',
    ],
    emptyLines: [
      'The kibble machine is empty. It goes off at 6 AM. {c} will wait right here.',
      '{c} stares into the kibble machine, as if that might help.',
      '{c} paws the empty kibble tray. Nothing. He paws it again.',
    ],
    draw: (g, W, H) => drawFeeder(g, H, 2),
  },
  feederHalf: { w: 1, h: 1, up: 6, name: 'kibble machine', draw: (g, W, H) => drawFeeder(g, H, 1) },
  feederEmpty: { w: 1, h: 1, up: 6, name: 'kibble machine', draw: (g, W, H) => drawFeeder(g, H, 0) },
  purifier: {
    w: 1, h: 1, up: 18, name: 'air purifier', bump: 'look',
    lines: [
      '{c} sits in front of the air purifier. Whiskers in the breeze.',
      "The purifier hums. {c} hums back. (It's a purr.)",
    ],
    draw(g, W, H) {
      R(g, 3, 4, 10, H - 5, k);
      R(g, 4, 5, 8, H - 7, C.gray);
      R(g, 4, 5, 2, H - 7, C.grayL);
      R(g, 10, 5, 2, H - 7, C.grayD);
      disc(g, 8, 4, 5, 3, k);
      disc(g, 8, 4, 4, 2, C.grayL);
      disc(g, 8, 4, 2, 1, C.grayD);
      for (let y = H - 12; y < H - 3; y += 2) R(g, 5, y, 6, 1, C.grayD);
      P(g, 8, 12, C.sky);
      g.clearRect(3, H - 2, 1, 1);
      g.clearRect(12, H - 2, 1, 1);
    },
  },
  wands: {
    w: 1, h: 1, up: 8, name: 'feather wands', bump: 'sock',
    lines: [
      '{c} bats the feather wand. Bap! Bap bap bap!',
      '{c} catches the pink feather. Bunny kicks!',
      'The feather wiggles. {c} wiggles. POUNCE.',
    ],
    draw(g) {
      // clipped to the end of the sofa, feathers dangling over the floor
      R(g, 3, 0, 10, 4, k);
      R(g, 4, 1, 8, 2, C.grayD);
      const stick = (pts) => pts.forEach(([x, y]) => P(g, x, y, k));
      stick([[5, 4], [5, 5], [4, 6], [4, 7], [4, 8], [3, 9], [3, 10], [3, 11], [3, 12]]);
      stick([[10, 4], [10, 5], [11, 6], [11, 7], [12, 8], [12, 9], [12, 10]]);
      for (const [x, y] of [[3, 15], [12, 13]]) {
        disc(g, x, y, 2, 3, '#e58fb0');
        P(g, x, y - 2, '#f6bfd3');
        P(g, x - 1, y, '#f6bfd3');
        P(g, x, y + 3, '#c96a92');
      }
    },
  },
  tunnel: {
    // A collapsible cat tunnel: cream fabric over dark hoops, lying east-west
    // on the floor with a slow S-bend in it, and a mouth at each end. A cat
    // that walks into one end comes out of the other (ACTIONS.tunnel in
    // game.js); from the side it only crackles.
    w: 4, h: 1, up: 8, name: 'cat tunnel', bump: 'tunnel',
    lines: [
      '{c} dives into the tunnel and shoots out of the far end. {o} is right behind.',
      'Rustle, rustle, rustle... POP. {c} is out, and {o} comes tumbling after.',
      "In at one end, out at the other. {c} can't say why that's so good. {o} agrees that it is.",
    ],
    sideLines: ['{c} pats the side of the tunnel. It crackles. The way in is at either end.', '{c} leans on the tunnel. It gives, and crackles. The way in is at either end.'],
    blockedLine: 'Something is in the way at the far end of the tunnel. {c} stays out, for now.',
    draw(g, W) {
      const cream = '#efe2c2';
      const light = '#fbf4de';
      const shade = '#d3c098';
      const hoop = '#5b4032';
      const hoopL = '#7c5b47';
      const dark = '#2a1c18';
      const r = 6; // half the tube's height
      // the middle of the tube, along its length: one slow wave, so that it
      // lies in a bend like the real thing and does not read as a pipe
      const mid = (x) => 13 + Math.round(2.6 * Math.sin(((x - 3) / (W - 7)) * Math.PI * 2));
      for (let x = 3; x < W - 3; x++) {
        const c = mid(x);
        R(g, x, c + r + 2, 1, 1, 'rgba(30,20,20,0.18)'); // its shadow on the floor
        R(g, x, c - r - 1, 1, 2 * r + 3, k);
        R(g, x, c - r, 1, 2 * r + 1, cream);
        R(g, x, c - r, 1, 2, light); // the top catches the light
        R(g, x, c + r - 2, 1, 3, shade);
      }
      // creases in the fabric between the hoops
      for (const [x, dy, n] of [[8, -1, 3], [14, 2, 2], [17, -2, 2], [24, 1, 3], [32, -1, 2], [35, 2, 2], [42, 0, 3], [50, -2, 2], [57, 1, 2]]) R(g, x, mid(x) + dy, n, 1, shade);
      for (const [x, dy] of [[12, -3], [22, -2], [30, 2], [40, -3], [48, 1], [58, -2]]) P(g, x, mid(x) + dy, light);
      // the hoops: rings seen a little from above, so each leans at its top and bottom
      for (const x of [11, 20, 29, 38, 47, 55]) {
        const c = mid(x);
        for (let dy = -r; dy <= r; dy++) {
          const lean = dy < -3 ? 1 : dy > 3 ? -1 : 0;
          R(g, x + lean, c + dy, 2, 1, hoop);
        }
        P(g, x + 1, c - r, hoopL);
      }
      // a mouth at each end: a dark way in, inside a hoop
      for (const [x0, dir] of [[2, 1], [W - 3, -1]]) {
        const c = mid(dir > 0 ? 3 : W - 4);
        R(g, x0 - (dir > 0 ? 1 : 0), c - r, 2, 2 * r + 1, k);
        R(g, x0, c - r + 1, 1, 2 * r - 1, hoop);
        for (let i = 1; i <= 3; i++) {
          const x = x0 + dir * i;
          R(g, x, c - r, 1, 2 * r + 1, hoop);
          R(g, x, c - r + 1 + (i === 3 ? 1 : 0), 1, 2 * r - 1 - (i === 3 ? 2 : 0), dark);
        }
        R(g, x0 + dir * 4, c - r, 1, 2 * r + 1, hoop);
        P(g, x0 + dir * 4, c - r, hoopL);
      }
      // the pompom that hangs in one mouth, on its bit of string
      P(g, 4, mid(3) - r + 1, C.white);
      P(g, 4, mid(3) - r + 2, C.white);
      R(g, 3, mid(3) - r + 3, 2, 2, C.orange);
    },
  },
  cattree: {
    w: 1, h: 1, up: 22, name: 'cat tree', perch: 16,
    perchLines: [
      '{c} climbs the cat tree, all the way to the top.',
      'From up here {c} can see the whole living room.',
    ],
    draw(g, W, H) {
      R(g, 1, 6, 2, H - 7, k);
      R(g, 13, 6, 2, H - 7, k);
      R(g, 1, 7, 1, H - 9, C.wood);
      R(g, 14, 7, 1, H - 9, C.wood);
      // top bed
      R(g, 0, 7, 16, 4, k);
      R(g, 1, 8, 14, 2, C.woodL);
      R(g, 2, 3, 12, 5, k);
      R(g, 3, 4, 10, 3, C.cream);
      R(g, 3, 4, 10, 1, C.white);
      // shelves
      R(g, 1, 20, 14, 3, k);
      R(g, 2, 21, 12, 1, C.woodL);
      R(g, 0, H - 5, 16, 5, k);
      R(g, 1, H - 4, 14, 2, C.woodL);
      R(g, 1, H - 2, 14, 1, C.wood);
      // sisal wrap
      R(g, 6, 11, 4, 9, k);
      R(g, 7, 11, 2, 9, C.tan);
      P(g, 7, 13, C.taupe);
      P(g, 8, 15, C.taupe);
      P(g, 7, 17, C.taupe);
    },
  },
  diningtable: {
    w: 2, h: 5, up: 8, name: 'dining table', perch: 9,
    perchLines: [
      '{c} strolls across the dining table, leaving very faint paw marks behind.',
    ],
    scold: ['"{c}! Off the table!"'],
    draw(g, W, H) {
      g.fillStyle = 'rgba(40,25,20,0.18)';
      g.fillRect(4, H - 5, 24, 4);
      // twin slab legs
      R(g, 11, H - 22, 10, 20, k);
      R(g, 12, H - 21, 3, 18, C.burgundy);
      R(g, 17, H - 21, 3, 18, C.walnut);
      R(g, 15, H - 21, 2, 18, C.walnutD);
      // top
      R(g, 1, 0, 30, H - 12, k);
      corners(g, 1, 0, 30, H - 12, 3);
      R(g, 2, 1, 28, H - 16, C.white);
      R(g, 2, H - 15, 28, 2, C.grayL);
      corners(g, 2, 1, 28, H - 14, 2);
      R(g, 4, 3, 1, H - 22, '#fffaf0');
    },
  },
  chairW: { w: 1, h: 1, up: 6, name: 'dining chair', perch: 5, draw: chairDraw('W') },
  chairE: { w: 1, h: 1, up: 6, name: 'dining chair', perch: 5, draw: chairDraw('E') },
  chairN: { w: 1, h: 1, up: 6, name: 'chair', perch: 5, draw: chairDraw('N') },
  chairS: { w: 1, h: 1, up: 6, name: 'chair', perch: 5, draw: chairDraw('S') },

  // ----------------------------------------------------------- kitchen
  island: {
    w: 6, h: 2, up: 9, name: 'kitchen island', perch: 9,
    perchLines: [
      "{c} is on the kitchen island. He knows he shouldn't be.",
      '{c} inspects the countertop for crumbs.',
    ],
    scold: ['"{c}! Off the counter!"', '"No no no, not on the island!"'],
    draw(g, W, H) {
      R(g, 0, 0, W, H, k);
      corners(g, 0, 0, W, H, 3);
      R(g, 1, 1, W - 2, H - 13, C.cream);
      R(g, 1, 1, W - 2, 1, C.white);
      g.clearRect(1, 1, 2, 1);
      g.clearRect(1, 2, 1, 1);
      R(g, 1, H - 12, W - 2, 1, C.yellow);
      // signature green tile front
      const cols = [C.emerald, C.emeraldL, C.emerald, C.sage, C.emeraldD, C.emerald, C.sage, C.emeraldL];
      for (let row = 0; row < 2; row++) {
        for (let i = 0, x = 1; x < W - 1; i++, x += 3) {
          const c = cols[(i * 3 + row * 5) % cols.length];
          R(g, x, H - 11 + row * 5, 2, 4, c);
          R(g, x + 2, H - 11 + row * 5, 1, 4, C.emeraldD);
        }
        R(g, 1, H - 7, W - 2, 1, C.emeraldD);
      }
      R(g, 1, H - 2, W - 2, 1, C.wood);
      g.clearRect(0, H - 3, 2, 3);
      P(g, 1, H - 3, k);
      // sink + tap
      R(g, 61, 8, 18, 13, k);
      R(g, 62, 9, 16, 11, C.charcoal);
      R(g, 63, 10, 14, 1, C.grayD);
      R(g, 69, 3, 2, 8, k);
      R(g, 69, 3, 5, 2, k);
      // coffee machine + kettle
      R(g, 82, 4, 7, 10, k);
      R(g, 83, 5, 5, 8, C.charcoal);
      P(g, 84, 6, C.red);
      R(g, 84, 9, 3, 3, C.grayL);
      R(g, 90, 7, 5, 8, k);
      R(g, 91, 8, 3, 6, C.steelL);
    },
  },
  counter: {
    w: 1, h: 1, up: 9, name: 'counter', perch: 9,
    perchLines: ['{c} patrols the kitchen counter.'],
    scold: ['"{c}! Off the counter!"'],
    draw(g, W, H) {
      block(g, 0, 0, 16, H, 10, C.cream, C.olive);
      R(g, 1, H - 10, 14, 1, C.oliveD);
      R(g, 7, H - 6, 3, 1, C.copper);
    },
  },
  ricecounter: {
    w: 1, h: 1, up: 9, name: 'counter', bump: 'look',
    lines: ['{c} sniffs the rice cooker. Still warm. Interesting.'],
    draw(g, W, H) {
      block(g, 0, 0, 16, H, 10, C.cream, C.olive);
      R(g, 1, H - 10, 14, 1, C.oliveD);
      R(g, 7, H - 6, 3, 1, C.copper);
      R(g, 3, 2, 10, 10, k);
      corners(g, 3, 2, 10, 10);
      R(g, 4, 3, 8, 8, C.white);
      R(g, 5, 8, 6, 3, C.charcoal);
      P(g, 7, 5, C.grayL);
    },
  },
  hob: {
    w: 1, h: 1, up: 9, name: 'stove', bump: 'look',
    lines: ['Hot! No paws on the stove. {c} knows this one.', '{c} stares at the stove. Is dinner happening?'],
    draw(g, W, H) {
      block(g, 0, 0, 16, H, 10, C.cream, C.olive);
      R(g, 1, H - 10, 14, 1, C.oliveD);
      R(g, 7, H - 6, 3, 1, C.copper);
      R(g, 2, 2, 12, 11, k);
      R(g, 3, 3, 10, 9, C.charcoal);
      for (const [x, y] of [[4, 4], [9, 4], [4, 8], [9, 8]]) {
        R(g, x, y, 3, 3, C.grayD);
        P(g, x + 1, y + 1, C.charcoal);
      }
    },
  },
  fridge: {
    w: 1, h: 1, up: 18, name: 'fridge', bump: 'look',
    lines: [
      '{c} stares at the fridge. The tuna is in there. {c} can feel it.',
      "Meow? ...The fridge doesn't open by itself.",
    ],
    draw(g, W, H) {
      block(g, 0, 0, 16, H, 19, C.steelL, C.steel);
      R(g, 1, H - 9, 14, 1, C.grayD);
      R(g, 12, H - 16, 1, 5, C.grayD);
      R(g, 12, H - 7, 1, 4, C.grayD);
    },
  },
  tallunit: {
    w: 2, h: 1, up: 18, name: 'oven cabinet', bump: 'look',
    lines: ['{c} watches the oven. Something smells like chicken.', "The oven is closed. The smell isn't."],
    draw(g, W, H) {
      block(g, 0, 0, 32, H, 19, C.olive, C.oliveD);
      R(g, 16, 1, 1, H - 2, C.oliveD);
      R(g, 19, H - 15, 10, 8, k);
      R(g, 20, H - 14, 8, 6, C.charcoal);
      R(g, 21, H - 13, 6, 1, C.grayD);
      R(g, 6, H - 12, 1, 5, C.copper);
    },
  },
  bowls: {
    w: 1, h: 1, up: 0, name: 'wet food bowls', bump: 'eat',
    lines: [
      'Nom nom nom. Wet food! {c} licks the bowl clean.',
      '{c} eats the chunks and also makes sure to slurp all the juice. As is tradition.',
      '{c} checks both bowls, just in case one is better.',
    ],
    emptyLines: [
      '{c} licks the empty bowl, just to make a point.',
      'Empty. EMPTY. {c} has never been fed in his entire life.',
      'Only a smear of gravy left. {c} cleans it up anyway.',
    ],
    cleanLines: [
      'Clean, empty bowls. Wet food is at 7 PM. {c} has started waiting already.',
      '{c} sits next to the empty bowls and stares at the nearest human.',
      'No wet food yet. {c} checks again, in case it appeared.',
    ],
    draw: (g) => drawBowls(g, 'food', 'food'),
  },
  bowlsHalf: { w: 1, h: 1, up: 0, name: 'wet food bowls', draw: (g) => drawBowls(g, 'licked', 'food') },
  bowlsEmpty: { w: 1, h: 1, up: 0, name: 'empty bowls', draw: (g) => drawBowls(g, 'clean', 'clean') },
  bowlsDirty: { w: 1, h: 1, up: 0, name: 'empty bowls', draw: (g) => drawBowls(g, 'licked', 'licked') },
  partition: {
    w: 1, h: 3, up: 18, name: 'glass block screen', bump: 'look',
    lines: [
      '{c} sees a blurry {o} through the glass blocks. Suspicious.',
      '{c} presses a nose against the glass blocks. Cold.',
    ],
    draw(g, W, H) {
      R(g, 3, 0, 10, H, k);
      // glass-block top
      R(g, 4, 1, 8, 31, C.wood);
      for (let y = 2; y < 31; y += 5) {
        R(g, 5, y, 3, 4, '#efe6cf');
        R(g, 9, y, 3, 4, '#e2d6ba');
        P(g, 5, y, C.white);
      }
      // burgundy wall section
      R(g, 4, 33, 8, H - 34 - 18, C.burgundy);
      R(g, 4, H - 19, 8, 18, '#662623');
      R(g, 4, H - 19, 8, 1, k);
      // the little artwork
      R(g, 5, H - 15, 6, 8, C.gold);
      R(g, 6, H - 14, 4, 6, C.oliveD);
      R(g, 7, H - 12, 2, 4, C.cream);
    },
  },
  // ------------------------------------------------------------- foyer
  bench: {
    w: 1, h: 2, up: 5, name: 'bench', perch: 5,
    perchLines: ['{c} sits on the bench and watches the front door.'],
    draw(g, W, H) {
      R(g, 2, H - 6, 2, 6, C.walnut);
      R(g, 12, H - 6, 2, 6, C.walnut);
      R(g, 4, H - 3, 8, 1, C.walnut);
      R(g, 1, 0, 14, H - 4, k);
      R(g, 2, 1, 12, H - 10, C.cream);
      for (let y = 3; y < H - 10; y += 3) R(g, 2, y, 12, 1, C.beige);
      R(g, 2, H - 9, 12, 2, C.beige);
      R(g, 2, H - 7, 12, 2, C.walnut);
    },
  },
  shoecab: {
    w: 1, h: 4, up: 16, name: 'shoe cabinet', bump: 'look',
    lines: [
      '{c} sniffs the shoe cabinet. Mmm. Outside smells.',
      '{c} tries to pry the shoe cabinet open. So many laces in there.',
    ],
    draw(g, W, H) {
      block(g, 0, 0, 16, H, 17, C.wood, C.woodD);
      for (let x = 4; x < 15; x += 4) R(g, x, 1, 1, H - 19, C.woodD);
      R(g, 5, H - 16, 1, 11, C.walnut);
      R(g, 10, H - 16, 1, 11, C.walnut);
      R(g, 1, H - 5, 14, 4, C.walnutD);
    },
  },
  vacuum: {
    w: 1, h: 1, up: 0, name: 'robot vacuum', bump: 'vacuum',
    draw(g) {
      disc(g, 8, 9, 7, 6, k);
      disc(g, 8, 9, 6, 5, C.white);
      disc(g, 8, 8, 6, 4, '#fffaf0');
      disc(g, 8, 8, 3, 2, C.grayL);
      P(g, 8, 8, C.gray);
      P(g, 8, 4, C.leafL);
      R(g, 4, 13, 8, 1, C.grayD);
    },
  },
  // ----------------------------------------------------------- bedrooms
  bedMaster: {
    w: 4, h: 4, up: 6, name: 'big bed', perch: 6,
    perchLines: [
      '{c} jumps on the big bed. Softest place in the whole home.',
      '{c} kneads the comforter, slowly, with his eyes half shut.',
    ],
    draw(g, W, H) {
      drawBed(g, W, H, {
        head: C.olive, headD: C.oliveD, duvet: '#f2bfae', duvetD: '#e3a593', base: '#eab09d',
        pillow: '#e89e8b', pillowD: '#d4836f',
      });
    },
  },
  bedGuest: {
    w: 4, h: 3, up: 6, name: 'guest bed', perch: 6,
    perchLines: ["{c} jumps on the guest bed. No guests? Then it's the cat bed."],
    draw(g, W, H) {
      drawBed(g, W, H, {
        head: C.wood, headD: C.woodD, duvet: '#e6d6bd', duvetD: '#cfbb9c', base: '#d8c4a4',
        accent: C.burgundy,
      });
    },
  },
  nightstand: {
    w: 1, h: 1, up: 12, name: 'nightstand', bump: 'wobble',
    lines: ['{c} bumps the nightstand. The lamp does a little dance.'],
    draw(g, W, H) {
      block(g, 2, 10, 12, 18, 7, C.wood, C.woodD);
      R(g, 6, H - 5, 4, 1, C.walnut);
      R(g, 7, 9, 3, 4, k);
      R(g, 8, 9, 1, 3, C.burgundy);
      R(g, 4, 1, 9, 8, k);
      corners(g, 4, 1, 9, 8);
      R(g, 5, 2, 7, 6, C.white);
      R(g, 5, 6, 7, 2, C.cream);
    },
  },
  nightstandM: {
    w: 1, h: 1, up: 12, name: 'bedside lamp', bump: 'wobble',
    lines: ['{c} bumps the bedside table. The lamp does a little dance.', '{c} headbutts the bedside lamp. It wobbles. It holds.'],
    // the shade, in sprite pixels: lit up when the lamp is on
    shade: [4, 1, 9, 7],
    draw(g, W, H) {
      block(g, 2, 10, 12, 18, 7, C.walnut, C.walnutD);
      R(g, 6, H - 5, 4, 1, C.wood);
      // ceramic base + linen shade
      R(g, 6, 8, 5, 5, k);
      R(g, 7, 9, 3, 3, C.terracotta);
      R(g, 4, 1, 9, 8, k);
      corners(g, 4, 1, 9, 8);
      R(g, 5, 2, 7, 6, C.cream);
      R(g, 5, 6, 7, 2, C.beige);
    },
  },
  dresser: {
    w: 1, h: 4, up: 9, name: 'dresser', perch: 9,
    perchLines: ["{c} is on the dresser. There's a lot up here to knock off."],
    draw(g, W, H) {
      block(g, 0, 0, 16, H, 11, C.walnut, C.walnutD);
      R(g, 1, 1, 14, 1, C.wood);
      R(g, 2, H - 6, 12, 1, C.walnut);
      R(g, 6, H - 8, 4, 1, C.gold);
      R(g, 6, H - 4, 4, 1, C.gold);
      // tray + box
      R(g, 3, 30, 9, 6, k);
      R(g, 4, 31, 7, 4, C.charcoal);
      R(g, 5, 32, 3, 2, C.gold);
    },
  },
  wardrobeGuest: {
    w: 1, h: 6, up: 12, name: 'wardrobe', bump: 'wardrobe',
    draw(g, W, H) {
      wardrobeTop(g, W, H, 13, C.beige);
      for (let y = 16; y < H - 14; y += 16) R(g, 1, y, 14, 1, C.wood);
      for (let y = 8; y < H - 14; y += 16) P(g, 12, y, C.copper);
      R(g, 8, H - 12, 1, 11, C.wood);
    },
  },
  deskGuest: {
    w: 1, h: 2, up: 7, name: 'little desk', perch: 8,
    perchLines: ['{c} sits on the little desk like a paperweight.'],
    draw(g, W, H) {
      block(g, 0, 0, 16, H, 8, C.woodL, C.wood);
      // desk lamp
      R(g, 9, 3, 5, 3, k);
      R(g, 10, 4, 3, 1, C.sage);
      R(g, 11, 6, 1, 4, k);
      R(g, 9, 10, 5, 2, k);
      // notebook
      R(g, 3, 16, 7, 9, k);
      R(g, 4, 17, 5, 7, C.white);
      R(g, 5, 19, 3, 1, C.grayL);
    },
  },

  // ------------------------------------------------------------- office
  deskRun: {
    w: 8, h: 1, up: 7, name: 'desk', perch: 8,
    perchLines: ['{c} sits on the desk, right where the hands would go.'],
    draw(g, W, H) {
      block(g, 0, 0, W, H, 8, C.woodL, C.wood);
      R(g, 1, H - 8, W - 2, 1, C.woodD);
      // books, a mug, a pot plant
      for (let i = 0; i < 4; i++) {
        R(g, 36 + i * 4, 3, 4, 9, k);
        R(g, 37 + i * 4, 4, 2, 7, [C.blue, C.cream, C.burgundy, C.sage][i]);
      }
      R(g, 60, 6, 5, 5, k);
      R(g, 61, 7, 3, 3, C.white);
      R(g, 84, 5, 6, 6, k);
      R(g, 85, 6, 4, 4, C.terracotta);
      disc(g, 87, 4, 4, 3, C.leafD);
      P(g, 86, 3, C.leafL);
      P(g, 88, 5, C.leaf);
    },
  },
  deskSideL: {
    w: 1, h: 2, up: 7, name: 'desk',
    perch: (lx, ly) => ({ h: 8, key: ly === 0 }),
    perchLines: ['{c} sits on the desk, right where the hands would go.'],
    draw(g, W, H) {
      
      block(g, 0, 0, 16, H, 8, C.woodL, C.wood);
      R(g, 1, H - 8, 14, 1, C.woodD);
      // screen against the wall, facing into the room
      R(g, 1, 2, 5, 13, k);
      R(g, 2, 3, 3, 11, C.charcoal);
      R(g, 4, 4, 1, 5, C.blue);
      R(g, 6, 7, 2, 3, C.steel);
      // keyboard + mouse
      R(g, 9, 3, 5, 11, k);
      R(g, 10, 4, 3, 9, C.white);
      P(g, 11, 5, C.grayL);
      P(g, 11, 8, C.grayL);
      P(g, 11, 11, C.grayL);
      R(g, 10, 16, 3, 3, k);
      P(g, 11, 17, C.white);
      // notes
      R(g, 4, 21, 8, 8, k);
      R(g, 5, 22, 6, 6, C.cream);
      R(g, 6, 24, 4, 1, C.gray);
    },
  },

  deskSideR: {
    w: 1, h: 2, up: 7, name: 'desk',
    perch: (lx, ly) => ({ h: 8, key: ly === 0 }),
    perchLines: ['{c} sits on the desk, right where the hands would go.'],
    draw(g, W, H) {
      g.translate(16, 0);
      g.scale(-1, 1);
      block(g, 0, 0, 16, H, 8, C.woodL, C.wood);
      R(g, 1, H - 8, 14, 1, C.woodD);
      // screen against the wall, facing into the room
      R(g, 1, 2, 5, 13, k);
      R(g, 2, 3, 3, 11, C.charcoal);
      R(g, 4, 4, 1, 5, C.blue);
      R(g, 6, 7, 2, 3, C.steel);
      // keyboard + mouse
      R(g, 9, 3, 5, 11, k);
      R(g, 10, 4, 3, 9, C.white);
      P(g, 11, 5, C.grayL);
      P(g, 11, 8, C.grayL);
      P(g, 11, 11, C.grayL);
      R(g, 10, 16, 3, 3, k);
      P(g, 11, 17, C.white);
      // notes
      R(g, 4, 21, 8, 8, k);
      R(g, 5, 22, 6, 6, C.cream);
      R(g, 6, 24, 4, 1, C.gray);
    },
  },
  ochairL: {
    w: 1, h: 1, up: 8, name: 'office chair', perch: 6,
    perchLines: ['{c} takes the office chair. It turns, very slowly, under him.'],
    draw(g, W, H) {
      
      R(g, 7, H - 6, 2, 4, k);
      R(g, 3, H - 3, 10, 2, k);
      // seat, with the backrest on the far side from the desk
      R(g, 1, 6, 12, 11, k);
      corners(g, 1, 6, 12, 11);
      R(g, 2, 7, 10, 9, C.charcoal);
      R(g, 3, 8, 8, 1, C.grayD);
      R(g, 11, 3, 4, 15, k);
      R(g, 12, 4, 2, 13, C.grayD);
      R(g, 12, 4, 2, 1, C.gray);
    },
  },

  ochairR: {
    w: 1, h: 1, up: 8, name: 'office chair', perch: 6,
    perchLines: ['{c} takes the office chair. It turns, very slowly, under him.'],
    draw(g, W, H) {
      g.translate(16, 0);
      g.scale(-1, 1);
      R(g, 7, H - 6, 2, 4, k);
      R(g, 3, H - 3, 10, 2, k);
      // seat, with the backrest on the far side from the desk
      R(g, 1, 6, 12, 11, k);
      corners(g, 1, 6, 12, 11);
      R(g, 2, 7, 10, 9, C.charcoal);
      R(g, 3, 8, 8, 1, C.grayD);
      R(g, 11, 3, 4, 15, k);
      R(g, 12, 4, 2, 13, C.grayD);
      R(g, 12, 4, 2, 1, C.gray);
    },
  },
  // ----------------------------------------------------- walk-in closet
  wardrobeS: {
    w: 6, h: 1, up: 16, name: 'wardrobe', bump: 'wardrobe',
    draw(g, W, H) {
      block(g, 0, 0, W, H, 23, C.cream, C.cream);
      R(g, 1, 1, W - 2, 1, C.wood);
      R(g, W - 2, 1, 1, 8, C.wood);
      R(g, 16, 9, W - 17, 1, C.wood);
      // the corner section runs straight on into the wardrobe below it
      R(g, 1, 2, 14, H - 2, C.cream);
      R(g, 1, 1, 1, H - 1, C.wood);
      R(g, 14, 10, 1, H - 10, C.wood);
      R(g, 15, 10, 1, H - 10, k);
      P(g, 0, H - 1, k);
      // two pairs of doors, handles meeting in the middle of each pair
      R(g, 16, 15, W - 24, 1, C.wood);
      for (const x of [32, 48, 64, 80]) R(g, x, 10, 1, 21, C.wood);
      for (const x of [29, 34, 61, 66]) R(g, x, 20, 1, 5, C.copper);
      // rounded walnut end
      R(g, W - 8, 10, 7, 21, C.wood);
      R(g, W - 7, 10, 1, 21, C.woodL);
      R(g, W - 3, 10, 2, 21, C.woodD);
      R(g, 16, H - 2, W - 17, 1, C.woodD);
      g.clearRect(0, 0, 2, 1);
      g.clearRect(0, 1, 1, 1);
      g.clearRect(W - 2, 0, 2, 1);
      g.clearRect(W - 1, 1, 1, 1);
      g.clearRect(W - 2, H - 1, 2, 1);
      g.clearRect(W - 1, H - 2, 1, 1);
    },
  },
  wardrobeV: {
    w: 1, h: 6, up: 12, name: 'wardrobe', bump: 'wardrobe',
    draw(g, W, H) {
      wardrobeTop(g, W, H, 13, C.beige);
      for (let y = 16; y < H - 14; y += 16) R(g, 1, y, 14, 1, C.wood);
      for (let y = 8; y < H - 14; y += 16) P(g, 12, y, C.copper);
      R(g, 8, H - 12, 1, 11, C.wood);
      // no top edge: the corner unit above runs straight into this one
      R(g, 0, 0, 16, 2, C.cream);
      P(g, 0, 0, k);
      P(g, 0, 1, k);
      P(g, 15, 0, k);
      P(g, 15, 1, k);
      P(g, 1, 0, C.wood);
      P(g, 1, 1, C.wood);
      P(g, 14, 0, C.wood);
      P(g, 14, 1, C.wood);
      R(g, 1, 0, 14, 1, C.wood); // …but still its own cabinet
    },
  },
  wardrobeV3: {
    w: 1, h: 3, up: 12, name: 'wardrobe', bump: 'wardrobe',
    draw(g, W, H) {
      wardrobeTop(g, W, H, 13, C.beige);
      for (let y = 16; y < H - 14; y += 16) R(g, 1, y, 14, 1, C.wood);
      for (let y = 8; y < H - 14; y += 16) P(g, 3, y, C.copper);
      R(g, 8, H - 12, 1, 11, C.wood);
    },
  },
  wardrobeB: {
    w: 8, h: 1, up: 12, name: 'wardrobe', bump: 'wardrobe',
    draw(g, W, H) {
      wardrobeTop(g, W, H, 13, C.wood);
      for (let x = 16; x < W; x += 16) R(g, x, 1, 1, H - 15, C.wood);
      for (let x = 8; x < W; x += 16) P(g, x, 4, C.copper);
      R(g, 1, H - 13, W - 2, 1, C.woodD);
    },
  },
  wicIsland: {
    w: 2, h: 3, up: 8, name: 'closet island', perch: 9,
    perchLines: ['{c} hops on the closet island, among the earrings.'],
    draw(g, W, H) {
      block(g, 1, 0, 30, H, 13, C.white, C.walnut);
      R(g, 2, 1, 28, 1, '#fffaf0');
      R(g, 2, H - 9, 28, 1, C.walnutD);
      R(g, 2, H - 5, 28, 1, C.walnutD);
      R(g, 16, H - 12, 1, 11, C.walnutD);
      // a little tray
      R(g, 5, 26, 9, 7, k);
      R(g, 6, 27, 7, 5, C.cream);
      disc(g, 9, 29, 2, 1, C.pinkL);
    },
  },
  // ----------------------------------------------------------- bathrooms
  tub: {
    w: 5, h: 2, up: 5, name: 'bathtub', perch: 5,
    perchLines: [
      '{c} hops into the empty tub. MEOW. ...meow... ...meow... Nice echo.',
      'The tub is dry. {c} checks every corner anyway.',
    ],
    draw(g, W, H) {
      block(g, 0, 0, W, H, 8, C.wood, C.woodD);
      R(g, 4, 3, W - 8, H - 14, k);
      corners(g, 4, 3, W - 8, H - 14, 3);
      R(g, 5, 4, W - 10, H - 16, C.white);
      corners(g, 5, 4, W - 10, H - 16, 2);
      R(g, 8, 7, W - 16, H - 22, C.skyL);
      corners(g, 8, 7, W - 16, H - 22, 2);
      R(g, 8, 7, W - 16, 2, C.grayL);
      // bronze tap + handles at the west end
      R(g, 1, 12, 10, 5, k);
      R(g, 1, 13, 9, 3, C.copper);
      R(g, 8, 13, 2, 3, '#e0a070');
      for (const y of [7, 19]) {
        R(g, 1, y, 4, 4, k);
        R(g, 2, y + 1, 2, 2, C.copper);
      }
    },
  },
  vanityM: {
    w: 1, h: 5, up: 8, name: 'vanity', perch: 9,
    perchLines: [
      '{c} curls up in the sink. A perfect fit.',
      '{c} taps the faucet. No drip. He taps it again.',
    ],
    draw(g, W, H) {
      block(g, 0, 0, 16, H, 10, C.grayL, C.walnut);
      R(g, 1, 1, 14, 1, C.white);
      for (const y of [12, 46]) {
        R(g, 4, y, 10, 16, k);
        R(g, 5, y + 1, 8, 14, C.steelL);
        R(g, 6, y + 2, 6, 12, C.blue);
        R(g, 6, y + 2, 6, 2, C.steel);
        R(g, 1, y + 6, 4, 2, C.copper);
      }
      R(g, 8, H - 9, 1, 8, C.walnutD);
    },
  },
  toilet: {
    w: 1, h: 1, up: 6, name: 'toilet', bump: 'toilet',
    draw(g, W, H) {
      // tank against the south wall
      R(g, 2, 11, 12, 11, k);
      R(g, 3, 12, 10, 4, C.white);
      R(g, 3, 16, 10, 5, C.grayL);
      P(g, 11, 13, C.steel);
      disc(g, 8, 6, 6, 6, k);
      disc(g, 8, 6, 5, 5, C.white);
      disc(g, 8, 6, 3, 3, C.grayL);
      disc(g, 8, 5, 3, 2, '#fffaf0');
    },
  },
  toiletE: {
    // against the west wall, facing east
    w: 1, h: 1, up: 6, name: 'toilet', bump: 'toilet',
    draw(g, W, H) {
      R(g, 0, 5, 6, 15, k);
      R(g, 1, 6, 4, 9, C.white);
      R(g, 1, 15, 4, 4, C.grayL);
      P(g, 2, 8, C.steel);
      R(g, 5, 7, 10, 12, k);
      corners(g, 5, 7, 10, 12, 2);
      R(g, 6, 8, 8, 9, C.white);
      corners(g, 6, 8, 8, 9);
      R(g, 7, 10, 6, 5, C.grayL);
      R(g, 7, 10, 6, 2, '#fffaf0');
      R(g, 6, 17, 8, 1, C.grayL);
    },
  },
  glassH: {
    w: 3, h: 1, up: 14, name: 'shower glass', bump: 'look',
    lines: ['{c} paws at the shower glass. It squeaks.'],
    draw(g, W, H) {
      g.fillStyle = 'rgba(200,232,238,0.45)';
      g.fillRect(0, 2, W, H - 6);
      R(g, 0, 2, W, 1, C.white);
      R(g, 0, H - 4, W, 1, C.steelL);
      R(g, 0, 2, 1, H - 6, C.steelL);
      R(g, W - 1, 2, 1, H - 6, C.steelL);
      for (let i = 0; i < 6; i++) P(g, 6 + i, 6 + i, C.white);
      for (let i = 0; i < 5; i++) P(g, 30 + i, 8 + i, C.white);
    },
  },
  glassV: {
    w: 1, h: 2, up: 14, name: 'shower glass', bump: 'look',
    lines: ['{c} paws at the shower glass. It squeaks.'],
    draw(g, W, H) {
      g.fillStyle = 'rgba(200,232,238,0.5)';
      g.fillRect(6, 0, 4, H - 3);
      R(g, 6, 0, 4, 1, C.white);
      R(g, 6, 0, 1, H - 3, C.steelL);
      R(g, 9, 0, 1, H - 3, C.steelL);
      R(g, 6, H - 4, 4, 1, C.steel);
    },
  },
  vanityS: {
    w: 2, h: 1, up: 8, name: 'vanity', perch: 9,
    perchLines: ['{c} curls up in the sink. A perfect fit.'],
    draw(g, W, H) {
      block(g, 0, 0, 32, H, 10, C.white, C.wood);
      R(g, 8, 3, 16, 9, k);
      corners(g, 8, 3, 16, 9);
      R(g, 9, 4, 14, 7, C.grayL);
      R(g, 10, 5, 12, 5, C.skyL);
      R(g, 15, 1, 2, 4, k);
      R(g, 1, H - 6, 30, 1, C.woodD);
      R(g, 13, H - 8, 6, 1, C.gold);
      R(g, 13, H - 4, 6, 1, C.gold);
    },
  },
  // ------------------------------------------------------------ laundry
  litter: {
    w: 1, h: 1, up: 12, name: 'Litter-Robot', bump: 'litter',
    draw(g, W, H) {
      R(g, 2, 18, 12, 10, k);
      R(g, 3, 19, 10, 8, C.white);
      R(g, 5, 23, 6, 1, C.grayD);
      R(g, 3, 25, 10, 2, C.grayL);
      disc(g, 8, 10, 8, 9, k);
      disc(g, 8, 10, 7, 8, C.white);
      disc(g, 8, 11, 5, 6, C.grayL);
      disc(g, 8, 11, 4, 5, C.charcoal);
      R(g, 5, 14, 6, 2, C.tan);
      P(g, 4, 4, '#fffaf0');
      P(g, 5, 3, '#fffaf0');
    },
  },
  catcab: {
    w: 1, h: 1, up: 14, name: 'cat cabinet', perch: 14,
    perchLines: [
      '{c} curls up on the cushion above the litter boxes. The usual spot.',
    ],
    draw(g, W, H) {
      block(g, 0, 0, 16, H, 15, C.wood, C.woodD);
      R(g, 5, H - 12, 6, 1, C.walnut);
      R(g, 8, H - 14, 1, 13, C.walnut);
      R(g, 1, 2, 14, 11, k);
      corners(g, 1, 2, 14, 11);
      R(g, 2, 3, 12, 9, C.navy);
      for (let y = 4; y < 11; y += 2) for (let x = 3 + (y % 4); x < 13; x += 3) P(g, x, y, C.blue);
    },
  },
  washer: {
    w: 1, h: 1, up: 22, name: 'washer and dryer', bump: 'washer',
    draw(g, W, H) {
      R(g, 0, 0, 16, H, k);
      R(g, 1, 1, 14, 5, '#7f9a88');
      R(g, 1, 7, 14, 13, '#5f7f6c');
      R(g, 1, 20, 14, 2, C.charcoal);
      P(g, 4, 20, C.yellow);
      P(g, 6, 20, C.grayL);
      P(g, 10, 20, C.grayL);
      R(g, 1, 22, 14, H - 23, C.cream);
      for (const cy of [13, 29]) {
        disc(g, 8, cy, 5, 5, k);
        disc(g, 8, cy, 4, 4, C.charcoal);
        disc(g, 8, cy, 2, 2, C.steel);
        P(g, 6, cy - 2, C.skyL);
      }
      R(g, 3, H - 4, 3, 2, C.grayL);
    },
  },
  tallcab: {
    w: 1, h: 1, up: 22, name: 'cabinet', bump: 'look',
    lines: ['{c} sniffs the cabinet. The treats are DEFINITELY in here.'],
    draw(g, W, H) {
      block(g, 0, 0, 16, H, 32, C.woodL, C.wood);
      R(g, 8, 7, 1, H - 8, C.woodD);
      R(g, 1, 20, 14, 1, C.woodD);
      for (let y = 9; y < H - 2; y += 3) R(g, 1, y, 14, 1, '#ad7c49');
      R(g, 8, 7, 1, H - 8, C.woodD);
    },
  },
  clothes: {
    w: 2, h: 1, up: 22, name: 'clothes rail', bump: 'sock',
    lines: [
      '{c} tugs a sweater sleeve. It stretches. Oops.',
      '{c} bats at a dangling sleeve. Bap bap bap.',
    ],
    draw(g, W, H) {
      block(g, 0, 0, W, H, 32, C.woodL, C.walnutD);
      R(g, 2, 9, W - 4, 1, C.steelL);
      const shirts = [C.white, C.gray, C.cream, C.white, C.navy];
      shirts.forEach((c, i) => {
        const x = 3 + i * 5;
        R(g, x, 10, 5, 12 + (i % 2), k);
        R(g, x + 1, 10, 3, 11 + (i % 2), c);
        if (i === 3) for (let y = 12; y < 21; y += 2) R(g, x + 1, y, 3, 1, C.charcoal);
      });
      // hampers
      for (const x of [3, 17]) {
        R(g, x, 26, 12, 11, k);
        R(g, x + 1, 27, 10, 9, C.beige);
        R(g, x + 1, 27, 10, 2, C.tan);
        R(g, x + 4, 31, 4, 1, C.taupe);
      }
    },
  },
  usink: {
    // against the west wall, facing east
    w: 1, h: 2, up: 8, name: 'laundry sink', perch: 9,
    perchLines: ['{c} sits in the laundry sink. Cool and quiet.'],
    draw(g, W, H) {
      block(g, 0, 0, 16, H, 10, C.white, C.wood);
      R(g, 1, 1, 14, 1, '#fffaf0');
      R(g, 4, 6, 10, 18, k);
      corners(g, 4, 6, 10, 18);
      R(g, 5, 7, 8, 16, C.steelL);
      R(g, 6, 8, 6, 14, C.skyL);
      R(g, 1, 13, 5, 3, C.steel);
      P(g, 5, 14, C.steelL);
      R(g, 1, H - 10, 14, 1, C.woodD);
      R(g, 8, H - 9, 1, 8, C.woodD);
      R(g, 5, H - 6, 2, 1, C.gold);
      R(g, 10, H - 6, 2, 1, C.gold);
    },
  },
  acunit: {
    w: 2, h: 3, up: 10, name: 'AC outdoor unit', bump: 'complain',
    lines: [
      "{c} wants to squeeze in behind the AC's outdoor unit. No way in. MEOW!",
      'Warm air, odd noises, and {c} is not allowed in.',
      '{c} files a loud complaint about the mechanical corner being off limits.',
    ],
    draw(g, W, H) {
      block(g, 0, 0, W, H, 14, C.grayL, C.gray);
      R(g, 1, 1, W - 2, 1, C.white);
      // fan grille
      disc(g, 16, 22, 13, 13, k);
      disc(g, 16, 22, 12, 12, C.charcoal);
      disc(g, 16, 22, 9, 9, C.grayD);
      disc(g, 16, 22, 6, 6, C.charcoal);
      disc(g, 16, 22, 2, 2, C.grayL);
      R(g, 4, 22, 24, 1, C.gray);
      R(g, 16, 10, 1, 24, C.gray);
      // louvres + pipes on the front
      for (let y = H - 12; y < H - 2; y += 2) R(g, 2, y, W - 10, 1, C.grayD);
      R(g, W - 6, H - 12, 2, 10, C.copper);
      R(g, W - 3, H - 12, 1, 10, C.charcoal);
    },
  },
  // ------------------------------------------------------------- storage
  shelf: {
    w: 1, h: 4, up: 12, name: 'storage shelf', bump: 'look',
    lines: [
      "{c} sniffs the shelf. Spare cat food is up there. He'll remember.",
      'So many boxes. {c} wants to sit in ALL of them.',
    ],
    draw(g, W, H) {
      block(g, 0, 0, 16, H, 13, C.steelL, C.steel);
      const cs = [C.tan, C.white, C.blue, C.tan, C.terracotta];
      for (let i = 0, y = 2; y < H - 24; i++, y += 12) {
        R(g, 2, y, 12, 10, k);
        R(g, 3, y + 1, 10, 8, cs[i % cs.length]);
        R(g, 3, y + 4, 10, 1, C.taupe);
      }
      R(g, 1, H - 7, 14, 1, C.grayD);
    },
  },
  boxes: {
    w: 1, h: 2, up: 10, name: 'stack of boxes', perch: 10,
    perchLines: ['{c} climbs the box mountain.'],
    draw(g, W, H) {
      block(g, 1, 0, 14, H, 12, C.tan, C.taupe);
      R(g, 7, 1, 2, H - 14, C.beige);
      R(g, 2, 14, 12, 1, C.taupe);
      R(g, 7, H - 11, 2, 10, C.tan);
    },
  },
  cardbox: {
    w: 1, h: 1, up: 2, name: 'cardboard box', perch: 2,
    perchLines: ['If it fits, {c} sits. It fits.', '{c} is in the box, with only his ears showing.'],
    draw(g, W, H) {
      R(g, 1, 2, 14, H - 2, k);
      R(g, 2, 3, 12, 9, C.walnut);
      R(g, 2, 3, 12, 2, C.tan);
      R(g, 2, 3, 2, 9, C.tan);
      R(g, 12, 3, 2, 9, C.tan);
      R(g, 2, 12, 12, 5, C.tan);
      R(g, 2, 12, 12, 1, C.beige);
      R(g, 7, 13, 2, 3, C.taupe);
    },
  },
  // ------------------------------------------------------------- balcony
  planter: {
    w: 1, h: 1, up: 10, name: 'planter', bump: 'chew',
    lines: [
      '{c} chews the balcony plants. They taste green.',
      '{c} hides in the leaves, and waits for something to walk by.',
    ],
    draw(g, W, H) {
      block(g, 0, 12, W, H - 12, 8, C.walnut, C.wood);
      for (let i = 0; i * 8 + 5 < W; i++) {
        const x = 4 + i * 8;
        disc(g, x, 9 + (i % 2) * 2, 5, 5, k);
        disc(g, x, 9 + (i % 2) * 2, 4, 4, i % 2 ? C.leaf : C.leafD);
        P(g, x - 1, 7 + (i % 2) * 2, C.leafL);
        P(g, x + 2, 9 + (i % 2) * 2, C.leafL);
      }
      P(g, 11, 6, C.pinkL);
    },
  },
  // ------------------------------------------------ Purple Scarf's flat
  // The same kind of flat as Stripes and Polka's, with nothing done to it. What
  // two cats from a flat with a cat tunnel in it notice here is care, not money.
  psSacks: {
    w: 1, h: 2, up: 6, name: 'sacks', bump: 'look',
    lines: {
      shark: [
        'Sacks, stood against the wall out of the rain. {c} sniffs one. Dog food, the dry kind.',
        "More dog food than one dog could eat in a year. {c} hasn't smelled one dog that lives here.",
      ],
      orca: [
        '{c} sniffs the sacks. Dog food. He knows it from the trash cans behind the cafe.',
        'Dog food, sack on sack. And no dog. {c} sniffs again, to be sure of the second part.',
      ],
    },
    draw(g, W, H) {
      psSack(g, 1, 4, 16);
      psSack(g, 1, 19, 18);
    },
  },
  psPot: {
    w: 1, h: 1, up: 6, name: 'plant pot', bump: 'look',
    lines: {
      shark: [
        "A pot of dry earth, with one brown stalk in it. {c} doesn't chew it. There's nothing left to chew.",
        '{c} sniffs the stalk. It snaps.',
      ],
      orca: ["{c} sniffs the pot. Dust, and old earth.", 'One dead stalk in a pot. {c} has seen more alive things in a drain.'],
    },
    draw(g, W, H) {
      R(g, 8, 2, 1, 10, '#8a7350');
      P(g, 9, 4, '#8a7350');
      P(g, 10, 3, '#a98c68');
      P(g, 7, 7, '#8a7350');
      P(g, 6, 6, '#a98c68');
      R(g, 3, 10, 10, 11, k);
      R(g, 4, 11, 8, 9, C.terracotta);
      R(g, 4, 11, 8, 2, '#75624f');
      R(g, 4, 17, 8, 3, '#b07a5c');
    },
  },
  psFridge: {
    w: 1, h: 1, up: 18, name: 'fridge', bump: 'look',
    lines: {
      shark: [
        'A white fridge with a bare door. Not one magnet to knock off.',
        '{c} noses along the foot of the fridge. It hums. Nothing in it smells like fish.',
      ],
      orca: [
        '{c} sniffs the fridge. Cold, and a little sour.',
        "The fridge hums. {c} sits in front of it, in case it opens. It doesn't.",
      ],
    },
    draw(g, W, H) {
      block(g, 0, 0, 16, H, 19, PS.white, PS.whiteD);
      R(g, 1, 1, 14, 1, PS.whiteL);
      R(g, 1, H - 9, 14, 1, PS.lamD);
      R(g, 12, H - 16, 1, 5, C.steel);
      R(g, 12, H - 7, 1, 4, C.steel);
    },
  },
  psKitchen: {
    // against the north wall: the cupboards and the strip of glass are on the wall above it
    w: 6, h: 1, up: 24, name: 'kitchen counter', perch: 9,
    perchLines: {
      shark: [
        "{c} walks the countertop from end to end. Nobody tells him to get down.",
        'A kettle, one cup, a roll of paper. Nobody cooks in this kitchen.',
      ],
      orca: ['{c} hops up by the stove. Not one crumb. He checks twice.', 'Up here it smells like cold tea, and like dog food. {c} sneezes.'],
    },
    draw(g, W, H) {
      // on the wall: white cupboards, and pale green glass under them
      R(g, 0, 0, W, 11, k);
      R(g, 1, 1, W - 2, 9, PS.white);
      R(g, 1, 1, W - 2, 1, PS.whiteL);
      R(g, 1, 8, W - 2, 2, PS.whiteD);
      for (let x = 16; x < W; x += 16) R(g, x, 1, 1, 9, PS.whiteD);
      for (let x = 13; x < W; x += 32) R(g, x, 6, 1, 2, C.steel);
      for (let x = 18; x < W; x += 32) R(g, x, 6, 1, 2, C.steel);
      // the hood over the hob
      R(g, 33, 3, 14, 7, C.steelL);
      R(g, 33, 8, 14, 2, C.steel);
      R(g, 1, 11, W - 2, 5, PS.green);
      R(g, 1, 11, W - 2, 1, PS.greenD);
      for (let x = 24; x < W - 2; x += 24) R(g, x, 11, 1, 5, PS.greenD);
      // the run of units: a black top on grey laminate, with no handles
      block(g, 0, 15, W, H - 15, 10, PS.black, PS.lam);
      R(g, 1, 16, W - 2, 1, PS.blackL);
      R(g, 1, H - 10, W - 2, 1, PS.lamD);
      R(g, 1, H - 9, W - 2, 1, PS.lamL);
      for (let x = 16; x < W; x += 16) R(g, x, H - 9, 1, 8, PS.lamD);
      // the hob
      R(g, 34, 18, 12, 10, PS.blackL);
      for (const [x, y] of [[36, 19], [41, 19], [36, 24], [41, 24]]) {
        R(g, x, y, 3, 3, C.grayD);
        P(g, x + 1, y + 1, PS.black);
      }
      // a kettle, one cup, a roll of kitchen paper
      R(g, 67, 17, 7, 10, k);
      R(g, 68, 18, 5, 8, PS.white);
      R(g, 68, 18, 5, 1, PS.whiteL);
      R(g, 74, 20, 2, 4, k);
      R(g, 80, 21, 5, 6, k);
      R(g, 81, 22, 3, 4, PS.white);
      R(g, 8, 17, 6, 10, k);
      R(g, 9, 18, 4, 8, PS.whiteL);
      R(g, 10, 18, 2, 1, PS.whiteD);
    },
  },
  psIsland: {
    w: 4, h: 2, up: 9, name: 'kitchen island', perch: 9,
    perchLines: {
      shark: [
        '{c} is on the black counter. One cup, upside down on a cloth.',
        'The faucet drips. {c} watches three drops fall, and bats at the fourth.',
      ],
      orca: [
        "{c} hops onto the island. It looks like stone. Under his paws it's cold plastic.",
        '{c} sniffs the sink. Tea, soap, and under those, dog.',
      ],
    },
    draw(g, W, H) {
      block(g, 0, 0, W, H, 12, PS.black, PS.lam);
      R(g, 1, 1, W - 2, 1, PS.blackL);
      R(g, 1, H - 12, W - 2, 1, PS.lamD);
      R(g, 1, H - 11, W - 2, 1, PS.lamL);
      for (let x = 16; x < W; x += 16) R(g, x, H - 11, 1, 10, PS.lamD);
      // sink and tap
      R(g, 7, 7, 20, 15, C.steel);
      R(g, 8, 8, 18, 13, C.steelL);
      R(g, 9, 9, 16, 11, C.grayD);
      R(g, 9, 9, 16, 1, C.charcoal);
      P(g, 17, 15, C.charcoal);
      R(g, 16, 2, 2, 9, C.steelL);
      R(g, 16, 2, 6, 2, C.steelL);
      // one cup, upside down on a cloth
      R(g, 34, 9, 12, 9, PS.lamL);
      R(g, 34, 9, 12, 1, PS.whiteD);
      R(g, 37, 10, 6, 6, k);
      R(g, 38, 11, 4, 4, PS.white);
    },
  },
  psBar: {
    w: 1, h: 2, up: 7, name: 'bar table', perch: 7,
    perchLines: {
      shark: ["{c} sits on the table. It's plastic, and it wobbles."],
      orca: ['{c} stands on the table and looks around the room. Nothing to knock off.'],
    },
    draw(g, W, H) {
      // (it stands the way the table in Amber does: long side north to south)
      R(g, 3, H - 6, 2, 6, k);
      R(g, W - 5, H - 6, 2, 6, k);
      R(g, 1, 1, W - 2, H - 7, k);
      R(g, 2, 2, W - 4, H - 11, PS.white);
      R(g, 2, 2, W - 4, 1, PS.whiteL);
      R(g, 2, H - 9, W - 4, 2, PS.whiteD);
    },
  },
  psChairW: { w: 1, h: 1, up: 6, name: 'plastic chair', perch: 5, perchLines: ['{c} tries the plastic chair. It creaks, and tips a little under him.'], draw: psChair('W') },
  psChairE: { w: 1, h: 1, up: 6, name: 'plastic chair', perch: 5, perchLines: ['{c} tries the plastic chair. It creaks, and tips a little under him.'], draw: psChair('E') },
  psSofa: {
    // its back to the tall glass
    w: 2, h: 4, up: 6, name: 'black sofa',
    perch: (lx) => (lx === 1 ? { h: 5, from: 'E' } : { h: 10, from: '' }),
    bump: 'scratch',
    lines: {
      shark: [
        "{c} tries his claws on the black sofa. They slide. It's not leather. It's not anything.",
        'Scritch... no. The sofa only squeaks. {c} gives up on it.',
      ],
      orca: [
        "{c} scratches the black sofa. It squeaks back at him. He doesn't like that.",
        '{c} digs his claws in. They leave no mark, and they come away smelling like plastic.',
      ],
    },
    perchLines: {
      shark: [
        "{c} hops onto the sofa. Cold, and it sticks to his fur. There's a dent at one end.",
        'From the sofa {c} can see the whole room, and the door.',
      ],
      orca: [
        '{c} hops up. The sofa is cold, and it squeaks. It smells like dog.',
        "{c} turns around three times on the sofa and still can't get comfortable.",
      ],
    },
    draw(g, W, H) {
      R(g, 1, 2, 30, H - 2, k);
      corners(g, 1, 2, 30, H - 2, 2);
      R(g, 2, 3, 28, H - 11, PS.black);
      R(g, 2, H - 8, 28, 6, PS.blackD);
      R(g, 3, H - 2, 26, 1, k);
      // arms
      R(g, 2, 3, 28, 10, PS.blackL);
      R(g, 2, 13, 28, 1, PS.blackD);
      R(g, 2, H - 20, 28, 1, PS.blackD);
      R(g, 2, H - 19, 28, 11, PS.blackL);
      // the back, against the glass
      R(g, 2, 14, 11, H - 34, PS.blackL);
      R(g, 2, 14, 2, H - 34, PS.black);
      R(g, 13, 14, 1, H - 34, PS.blackD);
      // two flat seats, with a shine where the light catches them
      const mid = ((14 + H - 20) / 2) | 0;
      R(g, 14, mid, 16, 1, PS.blackD);
      for (const y0 of [15, mid + 2]) {
        R(g, 15, y0 + 1, 14, mid - 18, '#3d3a44');
        R(g, 17, y0 + 2, 7, 1, PS.shine);
        P(g, 25, y0 + 3, PS.shine);
      }
      // the dent at one end
      R(g, 18, mid + 6, 8, 6, '#25232a');
      R(g, 18, mid + 6, 8, 1, PS.blackD);
      // shine along the arms
      R(g, 5, 5, 10, 1, PS.shine);
      R(g, 5, H - 17, 10, 1, PS.shine);
      R(g, 4, 17, 1, 12, PS.shine);
      g.clearRect(2, 3, 1, 1);
      g.clearRect(29, 3, 1, 1);
    },
  },
  psTable: {
    w: 1, h: 2, up: 4, name: 'low table', perch: 4,
    perchLines: {
      shark: ['{c} steps onto the low white table. A remote, and a ring from a cup.'],
      orca: ['{c} sniffs the table top. Tea, and dog food, somehow.'],
    },
    draw(g, W, H) {
      block(g, 1, 0, 14, H, 6, PS.white, PS.whiteD);
      R(g, 2, 1, 12, 1, PS.whiteL);
      R(g, 5, 6, 4, 10, k);
      R(g, 6, 7, 2, 8, C.grayD);
      P(g, 6, 8, C.red);
      ring(g, 9, 23, 3, 3, PS.whiteD, PS.white);
    },
  },
  psConsole: {
    // against the east wall of the living room: a long low shelf, and a TV standing on it
    w: 1, h: 4, up: 12, name: 'TV', bump: 'look',
    lines: {
      shark: [
        'The TV is off. {c} sees himself in it.',
        'A long shelf under the TV, with nothing on it to knock off.',
      ],
      orca: [
        '{c} looks into the black TV. A cat looks back. It looks annoyed.',
        '{c} sniffs along the shelf under the TV. Dust, and the smell of a thing that came out of a box.',
      ],
    },
    draw(g, W, H) {
      block(g, 1, 12, 14, H - 12, 8, PS.white, PS.black);
      R(g, 2, 13, 3, H - 22, PS.black);
      R(g, 2, 13, 12, 1, PS.whiteL);
      for (let y = 28; y < H - 12; y += 16) R(g, 5, y, 9, 1, PS.whiteD);
      R(g, 2, H - 8, 12, 1, PS.blackL);
      // the TV, on a foot
      R(g, 6, 34, 4, 8, k);
      R(g, 9, 2, 6, 60, k);
      R(g, 10, 3, 4, 58, PS.blackD);
      R(g, 10, 3, 1, 58, PS.blackL);
      R(g, 11, 12, 1, 14, PS.shine);
      P(g, 11, 30, PS.shine);
      P(g, 13, 60, C.red);
    },
  },
  clueCoat: {
    // a clue (the story gives it a scene): her wardrobe, and the coat in it
    w: 3, h: 1, up: 18, name: 'wardrobe', bump: 'look',
    lines: {
      shark: [
        "One door of the wardrobe hangs open. Coats, all of them dark. {c} doesn't climb in.",
        '{c} noses the wardrobe door. It swings out, and bumps, and swings back.',
      ],
      orca: [
        '{c} puts his head in the wardrobe. Coats. They smell like rain, and like dogs. More than one dog. But no dog lives here?',
        "{c} backs out of the wardrobe. He's been in sewer pipes that smelled better.",
      ],
    },
    draw(g, W, H) {
      block(g, 0, 0, W, H, 19, PS.white, PS.whiteD);
      R(g, 1, 1, W - 2, 1, PS.whiteL);
      R(g, 16, H - 18, 1, 17, '#aeb4b7');
      R(g, 13, H - 11, 1, 5, C.steel);
      R(g, 19, H - 11, 1, 5, C.steel);
      // the third door, open a hand's width: dark coats behind it
      R(g, 32, H - 18, 6, 17, '#34323a');
      R(g, 33, H - 15, 2, 12, '#4c4853');
      R(g, 36, H - 14, 1, 11, '#5b4a5e');
      R(g, 38, H - 18, 1, 17, '#aeb4b7');
      R(g, 44, H - 11, 1, 5, C.steel);
    },
  },
  psBed: {
    w: 4, h: 3, up: 6, name: 'bed', perch: 6,
    perchLines: {
      shark: [
        '{c} hops onto the bed. The cover is thin, and gray from washing.',
        "{c} kneads the cover. It doesn't give.",
      ],
      orca: [
        "{c} hops up. The bed smells like her, and a little like dog.",
        '{c} walks across the bed. Cold all the way over.',
      ],
    },
    draw(g, W, H) {
      drawBed(g, W, H, {
        head: PS.lam, headD: PS.lamD, duvet: PS.sheet, duvetD: PS.sheetD, base: '#b9b6ae',
        pillow: '#dddbd4', pillowD: '#bdbab2',
      });
      // creases, and a corner where the cover has come off the mattress
      for (const [x, y, n] of [[5, 12, 6], [18, 24, 7], [30, 10, 5], [12, 33, 8], [26, 36, 5]])
        for (let i = 0; i < n; i++) P(g, x + i, y + (i >> 1), PS.sheetD);
      R(g, 1, 5, 6, 5, '#e2e0d9');
      R(g, 1, 10, 7, 1, PS.sheetD);
      R(g, 7, 5, 1, 5, PS.sheetD);
      // the dent in the one pillow that is used
      R(g, W - 16, 30, 6, 7, '#c6c3bb');
    },
  },
  psTub: {
    w: 5, h: 2, up: 12, name: 'bath', perch: 5,
    perchLines: {
      shark: [
        '{c} hops into the tub. Dry. A gray line runs all the way around it.',
        'No window in here. {c} looks for one anyway.',
      ],
      orca: [
        "{c} drops into the tub. Meow. It comes back flat off the tiles. Terrible acoustics.",
        '{c} sniffs the plug hole. Soap, the kind that smells like nothing that grows.',
      ],
    },
    draw(g, W, H) {
      block(g, 0, 7, W, H - 7, 8, PS.tile, PS.tileD);
      for (let x = 8; x < W - 1; x += 8) R(g, x, H - 8, 1, 7, '#a8977b');
      R(g, 4, 10, W - 8, 23, k);
      corners(g, 4, 10, W - 8, 23, 3);
      R(g, 5, 11, W - 10, 21, PS.whiteL);
      corners(g, 5, 11, W - 10, 21, 2);
      R(g, 8, 14, W - 16, 15, '#dde1e2');
      corners(g, 8, 14, W - 16, 15, 2);
      R(g, 9, 16, W - 18, 1, '#b4babd');
      // tap and plug, at the west end
      R(g, 1, 18, 9, 5, k);
      R(g, 1, 19, 8, 3, C.steelL);
      P(g, 13, 21, C.grayD);
    },
  },
  psVanity: {
    // against the east wall
    w: 1, h: 2, up: 8, name: 'sink', perch: 9,
    perchLines: {
      shark: ['{c} sits in the sink. One toothbrush in the cup. Not the buzzing kind his humans have.', "{c} taps the faucet. It's stiff. He leaves it."],
      orca: ["{c} curls into the sink. It fits him perfectly."],
    },
    draw(g, W, H) {
      block(g, 0, 0, 16, H, 10, PS.white, PS.lam);
      R(g, 1, 1, 14, 1, PS.whiteL);
      R(g, 3, 9, 11, 15, k);
      R(g, 4, 10, 9, 13, PS.whiteL);
      R(g, 5, 11, 7, 11, PS.whiteD);
      P(g, 8, 16, C.grayD);
      R(g, 12, 15, 3, 2, C.steelL);
      // a cup with one toothbrush in it
      R(g, 4, 2, 4, 6, k);
      R(g, 5, 3, 2, 4, PS.whiteD);
      R(g, 6, 0, 1, 4, C.blue);
      R(g, 8, H - 9, 1, 8, PS.lamD);
    },
  },
  psToilet: {
    // against the west wall, facing east
    w: 1, h: 1, up: 6, name: 'toilet', bump: 'look',
    lines: [
      '{c} looks into the toilet. The lid is up. The toilet water at home smells better.',
      "A roll of paper stands on the floor. {c} knocks it over, on principle.",
    ],
    draw(g, W, H) {
      R(g, 0, 5, 6, 15, k);
      R(g, 1, 6, 4, 9, PS.whiteL);
      R(g, 1, 15, 4, 4, PS.whiteD);
      P(g, 2, 8, C.steel);
      R(g, 5, 7, 10, 12, k);
      corners(g, 5, 7, 10, 12, 2);
      R(g, 6, 8, 8, 9, PS.whiteL);
      corners(g, 6, 8, 8, 9);
      R(g, 7, 10, 6, 5, PS.whiteD);
      R(g, 8, 11, 4, 3, '#b9cdd6');
      R(g, 6, 17, 8, 1, PS.whiteD);
      // the roll, on the floor
      R(g, 1, 0, 4, 4, k);
      R(g, 2, 1, 2, 2, PS.whiteL);
    },
  },
  clueSacks: {
    // a clue (the story gives it a scene): dog food, and leads, in a flat with no dog. The hooks are on the wall above.
    w: 3, h: 1, up: 16, name: 'sacks and leads', bump: 'look',
    lines: [
      "Sacks of dog food, in a row. On the wall above them, a row of hooks, and a dog leash on every hook. There's no dog in this apartment.",
      '{c} sniffs the sacks. Dog food, the dry kind. Then the leashes: every one of them smells like a different dog.',
    ],
    draw(g, W, H) {
      // a strip of hooks, and five leads
      R(g, 2, 2, W - 4, 3, k);
      R(g, 3, 3, W - 6, 1, '#9aa0a5');
      const cols = [C.red, C.navy, PS.black, C.olive, C.red];
      cols.forEach((c, i) => {
        const x = 6 + i * 9;
        P(g, x, 4, C.steelL);
        R(g, x - 1, 5, 3, 3, c);
        P(g, x, 6, PS.white);
        R(g, x, 8, 1, 5 + (i % 2) * 2, c);
        P(g, x, 13 + (i % 2) * 2, C.steelL);
      });
      psSack(g, 1, 14, 17);
      psSack(g, 17, 13, 18);
      psSack(g, 33, 15, 16);
    },
  },
  psBoxes: {
    w: 2, h: 1, up: 10, name: 'boxes', perch: 10,
    perchLines: {
      shark: ['{c} climbs the boxes. Still taped shut. Whatever she moved in with, she never took it out.'],
      orca: ["{c} is on top of the boxes. Cardboard smells the same everywhere. That's something."],
    },
    draw(g, W, H) {
      block(g, 0, 0, 17, H, 12, C.tan, C.taupe);
      R(g, 7, 1, 3, H - 14, C.beige);
      R(g, 7, H - 11, 3, 5, C.beige);
      R(g, 3, H - 7, 4, 4, C.walnut);
      block(g, 16, 4, 16, H - 4, 10, C.tan, C.taupe);
      R(g, 22, 5, 3, H - 16, C.beige);
      R(g, 22, H - 9, 3, 4, C.beige);
    },
  },
  psMattress: {
    w: 2, h: 3, up: 3, name: 'mattress', perch: 3,
    perchLines: {
      shark: ["A mattress on the floor, with no sheet on it. {c} steps onto it. It's firm."],
      orca: ["{c} walks over the bare mattress, and sneezes at the dust."],
    },
    draw(g, W, H) {
      block(g, 0, 0, W, H, 5, '#dddbd3', '#bcb9b0');
      const pipe = '#93a4b6';
      R(g, 1, 1, W - 2, 1, pipe);
      R(g, 1, H - 7, W - 2, 1, pipe);
      R(g, 1, 1, 1, H - 7, pipe);
      R(g, W - 2, 1, 1, H - 7, pipe);
      for (let y = 6; y < H - 10; y += 8) for (let x = 5 + (((y / 8) | 0) % 2) * 4; x < W - 3; x += 8) P(g, x, y, '#bcb9b0');
      disc(g, 20, 30, 4, 3, '#cdc7b3');
    },
  },
  orchid: {
    // the epilogue's: a white orchid in a pot, from Flower's human. It is safe for cats, and not allowed.
    w: 1, h: 1, up: 14, name: 'orchid', bump: 'chew',
    lines: [
      'Chomp. {c} takes one white petal off the orchid. It tastes like nothing at all. He takes another, to be sure.',
      "{c} looks at the orchid. It's safe for cats. She said so herself. Chomp.",
      '{c} bites the tip off a leaf of the orchid, very gently, as if that made it allowed.',
    ],
    scold: ["\"{k}! Not the orchid! ...It's safe. I know it's safe. That's not the point!\"", '"{k}. We talked about the orchid."'],
    draw(g, W, H) {
      // the pot
      R(g, 4, H - 9, 8, 9, k);
      R(g, 5, H - 8, 6, 7, '#c9764f');
      R(g, 5, H - 8, 6, 1, '#e09a72');
      R(g, 5, H - 3, 6, 2, '#a85c3a');
      // two long leaves, and the stem bending over
      R(g, 2, H - 12, 5, 3, k);
      R(g, 3, H - 11, 4, 1, '#4f8a3c');
      R(g, 9, H - 12, 5, 3, k);
      R(g, 9, H - 11, 4, 1, '#4f8a3c');
      R(g, 7, 8, 2, H - 17, k);
      R(g, 7, 9, 1, H - 18, '#6fa052');
      // three white flowers with pink hearts
      for (const [x, y] of [[4, 2], [9, 4], [5, 8]]) {
        R(g, x, y, 5, 5, k);
        R(g, x + 1, y, 3, 5, k);
        R(g, x + 1, y + 1, 3, 3, '#fbfaf6');
        R(g, x, y + 2, 5, 1, '#fbfaf6');
        R(g, x + 2, y, 1, 5, '#fbfaf6');
        R(g, x + 2, y + 2, 1, 1, '#e58aa0');
      }
      // the card tied to it
      R(g, 11, 12, 4, 4, k);
      R(g, 12, 13, 2, 2, '#f4f1ea');
    },
  },
  clueMap: {
    // a clue (the story gives it a scene): a board on a stand by the front door, with a drawing of the
    // garden pinned to it, and a whistle on a green string hanging from one corner
    w: 1, h: 1, up: 14, name: 'board', bump: 'look',
    lines: [
      'A board on a stand, with a drawing pinned to it: the river, the lawn, the road. There are red crosses all over the lawn.',
      '{c} looks up at the board by the door. A drawing of the garden, with red crosses on it. A whistle hangs from one corner, on a green string.',
    ],
    draw(g, W, H) {
      // the stand's two legs
      R(g, 3, 20, 2, H - 21, k);
      R(g, 11, 20, 2, H - 21, k);
      R(g, 2, H - 2, 4, 2, k);
      R(g, 10, H - 2, 4, 2, k);
      // the board, and the sheet of paper on it
      R(g, 0, 0, W, 22, k);
      R(g, 1, 1, W - 2, 20, '#8a6a48');
      R(g, 2, 2, W - 4, 18, '#f4f1ea');
      // the drawing: the river along the top, the lawn, the road, the two buildings
      R(g, 3, 3, W - 6, 3, '#6fa8d6');
      R(g, 3, 6, W - 6, 8, '#8fc27a');
      R(g, 3, 14, W - 6, 2, '#8a8d98');
      R(g, 4, 17, 3, 2, '#e0aa52');
      R(g, 9, 17, 3, 2, '#b4505c');
      // a red line from the jetty onto the lawn, and the crosses
      R(g, 5, 4, 1, 4, '#d8362b');
      for (const [x, y] of [[4, 9], [8, 8], [11, 11], [7, 12], [6, 16]]) {
        P(g, x, y, '#d8362b');
        P(g, x + 1, y + 1, '#d8362b');
        P(g, x + 1, y, '#a3241c');
      }
      // the pin, and the whistle on its green string
      P(g, 8, 2, '#d8362b');
      R(g, W - 2, 4, 1, 9, '#3fbf5a');
      R(g, W - 3, 13, 3, 3, k);
      R(g, W - 2, 13, 1, 2, '#c9ccd3');
    },
  },
  // ---- what she has added to it herself: cheap, loud, and for nobody's eyes but her own
  psClothes: {
    w: 1, h: 1, up: 4, name: 'heap of clothes', bump: 'look',
    lines: {
      shark: [
        'A heap of clothes on the floor. Purple, and a yellow that hurts to look at. {c} walks around it.',
        "Sweaters, mostly. In anybody else's home {c} would knead one.",
      ],
      orca: [
        '{c} sniffs the heap. Laundry soap, the cheap kind, and one human. Nobody else has ever sat on these.',
        '{c} pulls a yellow sleeve out of the heap, and lets go of it. Scratchy.',
      ],
    },
    draw(g, W, H) {
      R(g, 1, H - 9, 14, 8, k);
      corners(g, 1, H - 9, 14, 8, 2);
      R(g, 2, H - 8, 12, 6, '#7d4fa0');
      R(g, 3, H - 6, 4, 1, '#a57cc4');
      R(g, 9, H - 4, 4, 1, '#5c3879');
      R(g, 4, H - 13, 9, 6, k);
      corners(g, 4, H - 13, 9, 6, 1);
      R(g, 5, H - 12, 7, 5, '#e2c23a');
      R(g, 5, H - 12, 7, 1, '#f1d868');
      R(g, 5, H - 9, 7, 1, '#b8992a');
      // a sleeve hanging off it
      R(g, 12, H - 8, 3, 6, k);
      R(g, 13, H - 7, 1, 4, '#e2c23a');
    },
  },
  psCups: {
    w: 1, h: 1, up: 6, name: 'noodle cups', bump: 'look',
    lines: {
      shark: [
        'Noodle cups, stacked inside each other. One fork.',
        '{c} sniffs the top cup. Salt, and nothing else. He leaves it.',
      ],
      orca: ['Empty, every one. {c} counts them anyway. A lot of dinners, all for one.'],
    },
    draw(g, W, H) {
      for (const [x, y] of [[2, H - 9], [8, H - 9], [5, H - 15]]) {
        R(g, x, y, 6, 7, k);
        R(g, x + 1, y + 1, 4, 5, '#f1ead8');
        R(g, x + 1, y + 3, 4, 1, '#d2452f');
      }
      R(g, 13, H - 12, 1, 6, '#b08a5a');
    },
  },
  psFlowers: {
    w: 1, h: 1, up: 10, name: 'plastic flowers', bump: 'look',
    lines: {
      shark: [
        'Flowers in a yellow vase. {c} sniffs them. Plastic, and dust.',
        "Plastic flowers. Nothing to chew, and they'll never need water.",
      ],
      orca: ['{c} bats a flower. It bends, and stays bent.'],
    },
    draw(g, W, H) {
      R(g, 7, H - 15, 1, 6, '#4f8a52');
      R(g, 9, H - 17, 1, 8, '#4f8a52');
      R(g, 5, H - 13, 1, 4, '#4f8a52');
      R(g, 11, H - 13, 1, 4, '#4f8a52');
      R(g, 4, H - 10, 8, 9, k);
      corners(g, 4, H - 10, 8, 9, 1);
      R(g, 5, H - 9, 6, 7, '#e2c23a');
      R(g, 5, H - 9, 1, 7, '#f1d868');
      R(g, 5, H - 5, 6, 1, '#7d4fa0');
      for (const [x, y, c] of [[6, H - 19, '#c06fd0'], [8, H - 22, '#e58aa0'], [3, H - 16, '#c06fd0'], [10, H - 16, '#f2cf3a']]) {
        R(g, x - 1, y - 1, 5, 5, k);
        R(g, x, y, 3, 3, c);
        P(g, x + 1, y + 1, '#fff6cc');
      }
    },
  },
  psLamp: {
    w: 1, h: 1, up: 18, name: 'floor lamp', bump: 'look',
    lines: {
      shark: [
        'A lamp with a purple shade, and a yellow fringe all the way around it. {c} looks at the fringe for a long time. No.',
        "The lamp is off. It's the only thing in here with a color, and it's two of them.",
      ],
      orca: ["{c} bats the fringe on the lamp. Bap. It's the best thing in this apartment."],
    },
    draw(g, W, H) {
      R(g, 4, H - 5, 8, 4, k);
      R(g, 5, H - 4, 6, 2, C.steel);
      R(g, 7, 9, 3, H - 13, k);
      R(g, 8, 10, 1, H - 15, C.steelL);
      R(g, 2, 0, 12, 12, k);
      corners(g, 2, 0, 12, 12, 2);
      R(g, 3, 1, 10, 9, '#7d4fa0');
      R(g, 4, 1, 8, 2, '#a57cc4');
      R(g, 3, 8, 10, 1, '#5c3879');
      for (let x = 3; x < 13; x += 2) R(g, x, 10, 1, 2, '#e2c23a');
    },
  },
  psFlyers: {
    w: 1, h: 1, up: 3, name: 'stack of flyers', bump: 'look',
    lines: {
      shark: [
        'A stack of flyers and coupons, tied up with string. Two for one. Half off. Last day.',
        '{c} sniffs the stack. Paper, and the lobby downstairs.',
      ],
      orca: ['{c} sharpens one claw on the stack of coupons. Just the one.'],
    },
    draw(g, W, H) {
      R(g, 2, H - 10, 12, 9, k);
      R(g, 3, H - 9, 10, 7, '#efe6d2');
      R(g, 3, H - 6, 10, 1, '#c9ccd3');
      R(g, 3, H - 4, 10, 1, '#c9ccd3');
      R(g, 4, H - 9, 4, 2, '#d2452f');
      R(g, 9, H - 9, 3, 2, '#e2c23a');
      R(g, 8, H - 10, 1, 9, '#8a5a2b');
    },
  },
  psShoes: {
    w: 1, h: 1, up: 6, name: 'shoe rack', bump: 'look',
    lines: {
      shark: ['A rack by the door. One pair of boots, one pair of flat shoes. All of them the same size.'],
      orca: ['{c} sniffs the boots. River mud on the soles, and grass from the garden.'],
    },
    draw(g, W, H) {
      R(g, 1, 3, 14, H - 4, k);
      R(g, 2, 4, 12, H - 6, PS.white);
      R(g, 2, 11, 12, 1, PS.whiteD);
      R(g, 3, 5, 4, 6, '#3d4d38');
      R(g, 3, 5, 4, 1, '#566a4f');
      R(g, 8, 5, 4, 6, '#3d4d38');
      R(g, 8, 5, 4, 1, '#566a4f');
      R(g, 3, 15, 5, 3, '#3a3840');
      R(g, 9, 15, 4, 3, '#3a3840');
    },
  },
  psScreen: {
    w: 3, h: 1, up: 14, name: 'shower glass', bump: 'look',
    lines: ['{c} paws at the shower glass. It rattles in its frame.', 'Water marks, all the way down the glass.'],
    draw(g, W, H) {
      g.fillStyle = 'rgba(200,232,238,0.45)';
      g.fillRect(0, 2, W, H - 6);
      R(g, 0, 2, W, 1, C.white);
      R(g, 0, H - 4, W, 1, C.steelL);
      R(g, 0, 2, 1, H - 6, C.steelL);
      R(g, W - 1, 2, 1, H - 6, C.steelL);
      for (let i = 0; i < 6; i++) P(g, 6 + i, 6 + i, C.white);
      for (const x of [14, 21, 33, 40]) R(g, x, 9 + (x % 5), 1, 9, 'rgba(255,255,255,0.5)');
    },
  },
  psWasher: {
    w: 1, h: 1, up: 12, name: 'washing machine', bump: 'look',
    lines: {
      shark: ['The washing machine is open. Inside it, one gray sock.'],
      orca: ['{c} sniffs the washing machine. Damp. It was shut for too long, and opened too late.'],
    },
    draw(g, W, H) {
      block(g, 1, 0, 14, H, 16, PS.white, PS.whiteD);
      R(g, 2, 1, 12, 1, PS.whiteL);
      R(g, 3, H - 15, 6, 1, C.grayD);
      disc(g, 8, H - 8, 5, 5, k);
      disc(g, 8, H - 8, 4, 4, C.steelL);
      disc(g, 8, H - 8, 3, 3, '#34323a');
      R(g, 7, H - 7, 3, 1, C.gray);
    },
  },
  psRack: {
    w: 2, h: 1, up: 10, name: 'washing rack', bump: 'look',
    lines: [
      'A rack of laundry, dry for days.',
      '{c} walks under the laundry rack. Nothing hangs low enough to pull down.',
    ],
    draw(g, W, H) {
      for (const x of [3, 28]) {
        R(g, x, 3, 1, H - 4, C.steel);
        R(g, x - 2, H - 2, 5, 1, C.steel);
      }
      for (const y of [3, 6, 9]) R(g, 1, y, W - 2, 1, C.steelL);
      R(g, 5, 3, 7, 12, k);
      R(g, 6, 4, 5, 10, '#55525c');
      R(g, 14, 6, 6, 10, k);
      R(g, 15, 7, 4, 8, PS.lamD);
      R(g, 21, 3, 6, 14, k);
      R(g, 22, 4, 4, 12, PS.black);
    },
  },
  psMop: {
    w: 1, h: 1, up: 12, name: 'mop and bucket', bump: 'look',
    lines: [
      'A bucket and a mop. The mop is dry. {c} bats it once, to be fair to it.',
      'The bucket smells like bleach. So does the floor. So does all of it.',
    ],
    draw(g, W, H) {
      R(g, 11, 0, 3, 21, k);
      R(g, 12, 1, 1, 19, C.woodL);
      R(g, 9, 19, 7, 7, k);
      R(g, 10, 20, 5, 5, PS.whiteD);
      P(g, 11, 22, PS.lamD);
      P(g, 13, 23, PS.lamD);
      R(g, 1, 14, 10, 13, k);
      R(g, 2, 15, 8, 11, '#6f8fb0');
      R(g, 2, 15, 8, 2, '#3d5876');
      R(g, 2, 21, 8, 1, '#89a6c3');
    },
  },
  // ---------------------------------------------- things the humans bring home
  parcel: {
    w: 1, h: 1, up: 3, name: 'delivery box', perch: 3,
    perchLines: [
      'A new box! {c} is in it before anyone can open it.',
      '{c} sits in the box. It fits him exactly.',
    ],
    draw(g, W, H) {
      R(g, 1, 2, 14, H - 2, k);
      R(g, 2, 3, 12, 9, C.walnut);
      R(g, 2, 3, 12, 2, C.tan);
      R(g, 2, 3, 2, 9, C.tan);
      R(g, 12, 3, 2, 9, C.tan);
      R(g, 2, 12, 12, H - 13, C.tan);
      R(g, 2, 12, 12, 1, C.beige);
      R(g, 7, 13, 2, H - 14, C.cream);
      R(g, 10, 14, 3, 2, C.white);
    },
  },
  shopbag: {
    w: 1, h: 1, up: 6, name: 'shopping bag', bump: 'sock', pushable: true,
    lines: [
      '{c} dives head first into the shopping bag. Rustle rustle rustle.',
      '{c} gets a handle stuck around his neck, and takes the bag with him.',
      "What's in the bag? {c} checks. Thoroughly.",
    ],
    draw(g, W, H) {
      R(g, 2, 5, 12, H - 6, k);
      R(g, 3, 6, 10, H - 8, C.beige);
      R(g, 3, 6, 10, 2, C.tan);
      R(g, 10, 8, 3, H - 10, C.tan);
      R(g, 5, 11, 4, 4, C.red);
      for (const x of [5, 10]) {
        R(g, x, 1, 1, 5, k);
      }
      R(g, 5, 1, 6, 1, k);
    },
  },
};

// Small things that sit on surfaces and can be knocked off.
export const ITEMS = {
  mug: {
    name: 'coffee mug',
    draw(g) {
      R(g, 2, 3, 6, 7, k);
      R(g, 3, 4, 4, 5, C.white);
      R(g, 3, 4, 4, 1, C.walnut);
      R(g, 8, 5, 2, 3, k);
      P(g, 8, 6, C.white);
    },
    spill: C.walnut,
  },
  vase: {
    name: 'flower vase',
    draw(g) {
      R(g, 3, 6, 5, 6, k);
      R(g, 4, 7, 3, 4, C.pinkL);
      disc(g, 3, 3, 2, 2, C.white);
      disc(g, 7, 2, 2, 2, C.pinkL);
      disc(g, 5, 4, 2, 2, C.white);
      P(g, 1, 5, C.leaf);
      P(g, 9, 4, C.leaf);
      P(g, 5, 1, C.leaf);
    },
    spill: C.sky,
  },
  oranges: {
    name: 'bowl of oranges',
    draw(g) {
      disc(g, 5, 8, 5, 3, k);
      disc(g, 5, 8, 4, 2, C.charcoal);
      disc(g, 3, 6, 2, 2, C.orange);
      disc(g, 7, 6, 2, 2, C.orange);
      disc(g, 5, 5, 2, 2, '#f09a4a');
    },
    spill: C.orange,
  },
  herb: {
    name: 'little plant',
    draw(g) {
      R(g, 3, 7, 5, 5, k);
      R(g, 4, 8, 3, 3, C.grayD);
      disc(g, 5, 4, 3, 3, C.leafD);
      P(g, 4, 3, C.leafL);
      P(g, 6, 5, C.leaf);
      P(g, 2, 2, C.leaf);
      P(g, 8, 2, C.leaf);
    },
    spill: C.walnut,
  },
  driedvase: {
    name: 'vase of dried flowers',
    draw(g) {
      R(g, 3, 6, 5, 6, k);
      R(g, 4, 7, 3, 4, C.taupe);
      P(g, 3, 4, C.tan);
      P(g, 5, 2, C.terracotta);
      P(g, 7, 3, C.tan);
      P(g, 4, 5, C.walnut);
      P(g, 6, 5, C.walnut);
      P(g, 5, 4, C.walnut);
      P(g, 2, 2, C.terracotta);
      P(g, 8, 1, C.tan);
    },
    spill: C.tan,
  },
};

Object.assign(ITEMS, {
  sculpture: {
    name: 'little sculpture',
    draw(g) {
      R(g, 2, 2, 7, 10, k);
      R(g, 3, 3, 5, 2, C.white);
      R(g, 5, 5, 3, 2, C.white);
      R(g, 3, 7, 5, 2, C.white);
      R(g, 3, 9, 5, 2, C.grayL);
      P(g, 3, 5, k);
      P(g, 4, 5, k);
      P(g, 7, 7, k);
    },
    spill: C.white,
  },
  candle: {
    name: 'candle',
    draw(g) {
      R(g, 3, 5, 5, 7, k);
      R(g, 4, 6, 3, 5, C.terracotta);
      R(g, 4, 6, 3, 1, C.pinkL);
      P(g, 5, 4, k);
      P(g, 5, 3, C.yellow);
      P(g, 5, 2, C.orange);
    },
    spill: C.pinkL,
  },
  frame: {
    name: 'photo frame',
    draw(g) {
      R(g, 1, 3, 9, 9, k);
      R(g, 2, 4, 7, 7, C.gold);
      R(g, 3, 5, 5, 5, C.sky);
      R(g, 3, 8, 5, 2, C.leaf);
      P(g, 5, 7, C.orange);
      P(g, 6, 7, '#8d8272');
    },
    spill: C.gold,
  },
});

Object.assign(ITEMS, {
  takeout: {
    name: 'takeout',
    draw(g) {
      R(g, 1, 4, 9, 8, k);
      R(g, 2, 5, 7, 6, C.white);
      R(g, 2, 5, 7, 2, C.red);
      R(g, 4, 8, 3, 2, C.orange);
      P(g, 4, 3, C.gray);
      P(g, 6, 2, C.gray);
    },
    spill: C.orange,
  },
  bowls: {
    name: 'empty bowls',
    draw(g) {
      for (const [cx, c] of [[3, C.wood], [8, C.oliveL]]) {
        R(g, cx - 3, 6, 6, 5, k);
        R(g, cx - 2, 7, 4, 3, c);
      }
    },
    spill: C.wood,
  },
  bowlsFull: {
    name: 'full bowls',
    draw(g) {
      for (const [cx, c] of [[3, C.wood], [8, C.oliveL]]) {
        R(g, cx - 3, 6, 6, 5, k);
        R(g, cx - 2, 7, 4, 3, c);
        R(g, cx - 2, 7, 4, 1, C.terracotta);
      }
    },
    spill: C.terracotta,
  },
  // a home-cooked plate on the dining table
  plate: {
    name: 'plate',
    food: true,
    draw(g) {
      R(g, 0, 5, 11, 7, k);
      R(g, 1, 4, 9, 9, k);
      R(g, 1, 5, 9, 7, C.white);
      R(g, 2, 6, 7, 5, C.grayL);
      R(g, 2, 6, 4, 3, '#fffaf0'); // rice
      R(g, 6, 7, 3, 3, C.orange); // something saucy
      P(g, 7, 7, C.red);
      P(g, 3, 9, C.leafL);
      P(g, 4, 10, C.leaf);
    },
    spill: C.orange,
  },
  plateEmpty: {
    name: 'empty plate',
    food: true,
    draw(g) {
      R(g, 0, 5, 11, 7, k);
      R(g, 1, 4, 9, 9, k);
      R(g, 1, 5, 9, 7, C.white);
      R(g, 2, 6, 7, 5, C.grayL);
      P(g, 6, 8, C.orange);
      P(g, 3, 7, '#fffaf0');
    },
    spill: C.grayL,
  },
  // carried versions of the things above
  tray: {
    name: 'tray',
    draw(g) {
      R(g, 0, 5, 11, 7, k);
      R(g, 1, 6, 9, 5, C.wood);
      R(g, 1, 4, 4, 4, k);
      R(g, 6, 4, 4, 4, k);
      R(g, 2, 5, 2, 2, C.orange);
      R(g, 7, 5, 2, 2, C.orange);
      P(g, 2, 2, C.grayL);
      P(g, 8, 1, C.grayL);
    },
    spill: C.orange,
  },
  trayEmpty: {
    name: 'tray',
    draw(g) {
      R(g, 0, 5, 11, 7, k);
      R(g, 1, 6, 9, 5, C.wood);
      R(g, 1, 4, 4, 4, k);
      R(g, 6, 4, 4, 4, k);
      R(g, 2, 5, 2, 2, C.white);
      R(g, 7, 5, 2, 2, C.white);
    },
    spill: C.grayL,
  },
  parcel: {
    name: 'delivery box',
    draw(g) {
      R(g, 0, 3, 11, 9, k);
      R(g, 1, 4, 9, 7, C.tan);
      R(g, 1, 4, 9, 2, C.beige);
      R(g, 5, 4, 1, 7, C.cream);
    },
    spill: C.tan,
  },
  shopbag: {
    name: 'shopping bag',
    draw(g) {
      R(g, 1, 4, 9, 8, k);
      R(g, 2, 5, 7, 6, C.beige);
      R(g, 4, 7, 3, 3, C.red);
      R(g, 3, 1, 1, 4, k);
      R(g, 7, 1, 1, 4, k);
      R(g, 3, 1, 5, 1, k);
    },
    spill: C.beige,
  },
});

// What the walls, the glass and the rails of Purple Scarf's flat have to say (the game asks for one of
// these when a cat walks into something there that is not a piece of furniture). A list, or one each.
export const SCARF_WORDS = {
  door: ['Her front door. Shut. The handle is a long way up.', '{c} sniffs under the front door. A long hallway, and nobody in it.'],
  scarf: ["A purple scarf, left over the rail. {c} knows it. He's seen it down in the garden, and kept out of its way."],
  rail: {
    shark: [
      'Across the gap stands Amber. {c} looks for one balcony among all of them, and finds it.',
      '{c} looks through the rail. The garden is a long way down.',
    ],
    orca: ['Wind comes over the rail. {c} flattens his ears and stays low.', "{c} looks through the rail. He's never been this high up on the outside of anything."],
  },
  glass: {
    shark: [
      'Glass from the floor to the ceiling, and nothing hung at it. The whole room can be seen from outside.',
      '{c} presses his nose to the tall glass. There are no nose prints on it but his.',
    ],
    orca: ['{c} puts a paw on the tall glass. Cold.', '{c} sees himself in the glass, and the garden far below him.'],
  },
  window: {
    shark: ["A blind, half way down, and no curtain. {c} looks for something to climb. There's nothing."],
    orca: ["{c} stands up against the wall under the window. The sill is bare. He'd sit on it, if he could reach."],
  },
  sideWindow: ["A narrow window with nothing at it. {c} can see the sky, and that's all."],
};

export function renderType(type) {
  const W = type.w * 16;
  const H = type.h * 16 + type.up;
  const [cv, g] = canvas(W, H);
  type.draw(g, W, H);
  return cv;
}

export function renderItem(item) {
  const [cv, g] = canvas(11, 13);
  item.draw(g);
  // tipped-over version
  const [fv, fg] = canvas(13, 11);
  fg.translate(0, 11);
  fg.rotate(-Math.PI / 2);
  fg.drawImage(cv, 0, 0);
  return { up: cv, fallen: fv };
}
