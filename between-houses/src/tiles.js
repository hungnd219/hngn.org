// Floor, wall and flat "decor" art drawn once onto the ground layer.
import { C, R, P } from './palette.js';

export const T = 16;

// What the glass shows at different times of day. The ground is painted once
// per sky and the game cross-fades between them.
export const SKIES = {
  day: { sky: C.sky, skyL: C.skyL, city: '#9fb7c4', lit: C.skyL, glass: C.glass, night: false },
  dusk: { sky: '#e39a7f', skyL: '#f4c58f', city: '#86637a', lit: '#f8d68f', glass: '#e6bba4', night: false },
  night: { sky: '#1c2346', skyL: '#2b3462', city: '#11162c', lit: '#f2d37a', glass: '#36406c', night: true },
};
// (s, m and c are Purple Scarf's: stark pale tile, the laminate platform by her windows, bathroom tile)
export const FLOORS = 'wtgplbhfsmc';
export const isFloor = (ch) => FLOORS.includes(ch);
// tiles a wall face may sit above
export const isOpen = (ch) => isFloor(ch) || ch === 'G' || ch === 'R';
export const isWall = (ch) => ch === '#' || ch === 'D';

const CAP = '#55443f';
const CAP_HI = '#6b5850';

function planks(g, x, y, ty, tx, base, line, joints) {
  R(g, x, y, T, T, base);
  for (let i = 0; i < 4; i++) {
    R(g, x, y + i * 4 + 3, T, 1, line);
    if (joints) {
      const row = ty * 4 + i;
      if ((tx + row) % 2 === 0) R(g, x + ((row * 5) % 13) + 1, y + i * 4, 1, 3, line);
    }
  }
}
function grid(g, x, y, base, grout, step) {
  R(g, x, y, T, T, base);
  for (let i = step - 1; i < T; i += step) {
    R(g, x + i, y, 1, T, grout);
    R(g, x, y + i, T, 1, grout);
  }
}

// The colours of a flat with nothing done to it: cold whites and greys, and a laminate that is not wood.
const STARK = {
  tile: '#e2e5e6', grout: '#c9ced1', wall: '#eceeee', wallD: '#d3d8da', skirt: '#b9bfc3',
  lam: '#c2a682', lamD: '#a98c68', lamK: '#86694a', bath: '#d9c9ad', bathD: '#c2b092', bathWall: '#e4d6bd',
};
// what each floor looks like through the foot of a glass door
const UNDER_GLASS = { w: '#dfbb86', s: STARK.tile, m: STARK.lam };

// `at(x, y)`: the map, for a floor that looks at its neighbours (the platform's edge)
export function drawFloor(g, ch, tx, ty, at) {
  const x = tx * T;
  const y = ty * T;
  switch (ch) {
    case 's': // big pale tiles, every room the same
      grid(g, x, y, STARK.tile, STARK.grout, 16);
      P(g, x + 15, y + 15, '#b9bfc3');
      break;
    case 'c': // her bathrooms: small beige tiles
      grid(g, x, y, STARK.bath, STARK.bathD, 8);
      break;
    case 'm': {
      // a low platform of laminate: every board the same board
      R(g, x, y, T, T, STARK.lam);
      for (let i = 7; i < T; i += 8) R(g, x, y + i, T, 1, STARK.lamD);
      if ((tx + ty) % 2 === 0) R(g, x + 9, y, 1, 7, STARK.lamD);
      else R(g, x + 4, y + 8, 1, 7, STARK.lamD);
      if (at) {
        // its edges: a strip of trim, and the step down
        if (at(tx + 1, ty) !== 'm') {
          R(g, x + T - 3, y, 3, T, STARK.lamK);
          R(g, x + T - 3, y, 1, T, '#dcc7a6');
        }
        if (at(tx, ty + 1) !== 'm' && at(tx, ty + 1) !== '#') {
          R(g, x, y + T - 3, T, 3, STARK.lamK);
          R(g, x, y + T - 3, T, 1, '#dcc7a6');
        }
      }
      break;
    }
    case 'w': // wood: living room, bedrooms, office, closet
      planks(g, x, y, ty, tx, '#dfbb86', '#cba46d', true);
      break;
    case 't': // kitchen
    case 'h': // hallway, storage
    case 'p': // guest bathroom
    case 'l': // laundry
    case 'f': // foyer
      grid(g, x, y, '#ead8c6', '#f1e3d3', 16);
      break;
    case 'g': // master bath
      planks(g, x, y, ty, tx, '#cfa672', '#b98e5b', true);
      break;
    case 'b': {
      R(g, x, y, T, T, '#aaa093');
      for (let i = 3; i < T; i += 4) R(g, x + i, y, 1, T, '#91877b');
      break;
    }
  }
}

export function drawCap(g, tx, ty, nb) {
  const x = tx * T;
  const y = ty * T;
  R(g, x, y, T, T, CAP);
  if (!nb.u) R(g, x, y, T, 1, CAP_HI);
  if (!nb.l) R(g, x, y, 1, T, CAP_HI);
  if (!nb.r) R(g, x + T - 1, y, 1, T, C.k);
  if (!nb.d) R(g, x, y + T - 1, T, 1, C.k);
}

// style is picked from the floor of the room the face looks into
export function drawFace(g, tx, ty, floorCh, capTop) {
  const x = tx * T;
  const y = ty * T;
  switch (floorCh) {
    case 'g': {
      R(g, x, y, T, T, C.emeraldD);
      for (let j = 0; j < 4; j++)
        for (let i = 0; i < 4; i++)
          R(g, x + i * 4, y + j * 4, 3, 3, (i + j + tx) % 3 === 0 ? C.emeraldL : C.emerald);
      P(g, x + 3, y + 7, C.copper);
      P(g, x + 11, y + 7, C.copper);
      P(g, x + 7, y + 11, C.copper);
      P(g, x + 15, y + 11, C.copper);
      break;
    }
    case 'p': {
      R(g, x, y, T, 9, '#f5eee2');
      for (let i = 3; i < T; i += 4) R(g, x + i, y, 1, 9, '#e0d5c4');
      R(g, x, y + 9, T, 7, C.pink);
      for (let i = 3; i < T; i += 4) R(g, x + i, y + 9, 1, 7, '#c6917c');
      R(g, x, y + 9, T, 1, '#c6917c');
      break;
    }
    case 'l': {
      R(g, x, y, T, T, '#f1eee8');
      R(g, x, y, T, 1, '#d6d1c7');
      R(g, x, y + 13, T, 3, C.grayL);
      break;
    }
    case 'b': {
      R(g, x, y, T, T, '#bdb1a1');
      R(g, x, y + 7, T, 1, '#a89c8c');
      R(g, x, y + 15, T, 1, '#8f8478');
      break;
    }
    case 's':
    case 'm': {
      // bare white paint, and a strip of grey plastic where a skirting board would be
      R(g, x, y, T, T, STARK.wall);
      R(g, x, y, T, 1, STARK.wallD);
      R(g, x, y + 13, T, 2, STARK.skirt);
      R(g, x, y + 15, T, 1, '#8e959a');
      break;
    }
    case 'c': {
      // beige tiles to the ceiling
      R(g, x, y, T, T, STARK.bathWall);
      for (let i = 7; i < T; i += 8) R(g, x + i, y, 1, T, STARK.bathD);
      R(g, x, y + 7, T, 1, STARK.bathD);
      R(g, x, y + 15, T, 1, '#a8977b');
      break;
    }
    default: {
      R(g, x, y, T, 12, '#f4ebd8');
      R(g, x, y, T, 1, '#dccfb6');
      R(g, x, y + 12, T, 1, C.woodD);
      R(g, x, y + 13, T, 2, C.wood);
      R(g, x, y + 15, T, 1, C.walnut);
    }
  }
  if (capTop) {
    R(g, x, y, T, 4, CAP);
    R(g, x, y, T, 1, CAP_HI);
    R(g, x, y + 4, T, 1, C.k);
  }
}

// o.flip: the balcony is on the west of the glass (Garnet's). o.inner: the floor of the room behind it.
export function drawGlassDoor(g, tx, ty, s = SKIES.day, o = {}) {
  const x = tx * T;
  const y = ty * T;
  const inner = UNDER_GLASS[o.inner] || UNDER_GLASS.w;
  R(g, x, y, 8, T, o.flip ? '#aaa093' : inner);
  R(g, x + 8, y, 8, T, o.flip ? inner : '#aaa093');
  R(g, x + 5, y, 6, T, C.charcoal);
  R(g, x + 6, y, 4, T, s.glass);
  R(g, x + (o.flip ? 8 : 7), y, 1, T, s.skyL);
  if (ty % 3 === 0) R(g, x + 5, y + 15, 6, 1, C.charcoal);
}

const SKYLINE = [5, 9, 3, 7, 11, 4, 8, 6, 10, 5, 7];
// the far side of the gap: a few roofs against the sky, on the outer edge of a tile
function skyline(g, y, ty, s, X) {
  const h = SKYLINE[ty % 11];
  R(g, X(T - h, h), y + 2, h, T - 2, s.city);
  R(g, X(T - h + 1, 1), y + 4, 1, 2, s.lit);
  if (h > 6) R(g, X(T - h + 3, 1), y + 9, 1, 2, s.lit);
  if (s.night) {
    P(g, X(T - h + 2, 1), y + 7, s.lit);
    if (h > 4) P(g, X(T - 2, 1), y + 12, s.lit);
  }
}

// o.flip: the rail faces west (Garnet's). o.far: there is more open air beyond this tile, which
// draws the skyline itself.
export function drawRailing(g, tx, ty, s = SKIES.day, o = {}) {
  const x = tx * T;
  const y = ty * T;
  // a strip w wide that starts dx from the balcony's side of the tile
  const X = (dx, w) => (o.flip ? x + T - dx - w : x + dx);
  // sky + a little skyline beyond the balcony
  R(g, x, y, T, T, s.sky);
  R(g, X(6, T - 6), y, T - 6, T, s.skyL);
  if (!o.far) skyline(g, y, ty, s, X);
  if (s.night) P(g, X(8, 1), y + 3 + (ty % 5), '#c9d2ff');
  // glass rail with a steel cap
  R(g, X(0, 4), y, 4, T, s.glass);
  R(g, X(0, 1), y, 1, T, C.steel);
  R(g, X(3, 1), y, 1, T, C.steelL);
  if (ty % 2 === 0) R(g, X(0, 4), y + 7, 4, 1, C.steel);
}

// Open air: the gap between two balconies, and what lies beyond a rail that is set back.
// o.city: this is the last tile before the edge of the picture. o.n, o.s: the tiles above and below
// (a balcony's end rail is drawn along the edge of the air beside it).
export function drawAir(g, tx, ty, s = SKIES.day, o = {}) {
  const x = tx * T;
  const y = ty * T;
  R(g, x, y, T, T, s.skyL);
  if (o.city) skyline(g, y, ty, s, (dx, w) => x + T - dx - w);
  else if (s.night && (tx + ty) % 2) P(g, x + 5, y + 6, '#c9d2ff');
  const rail = (side, ry) => {
    if (side === 'b') {
      R(g, x, ry, T, 4, s.glass);
      R(g, x, ry === y ? ry : ry + 3, T, 1, C.steel);
      R(g, x, ry === y ? ry + 3 : ry, T, 1, C.steelL);
      R(g, x + 7, ry, 1, 4, C.steel);
    } else if (side === 'R') {
      // the corner post, where a side rail meets the front one
      R(g, x + 12, ry, 4, 4, s.glass);
      R(g, x + 12, ry, 4, 1, C.steel);
      R(g, x + 12, ry + 3, 4, 1, C.steel);
      R(g, x + 12, ry, 1, 4, C.steelL);
    }
  };
  rail(o.n, y);
  rail(o.s, y + T - 4);
}

// A scarf left over a west-facing rail: it hangs down on the balcony's side.
export function drawScarf(g, tx, ty) {
  const x = tx * T + 9;
  const y = ty * T + 2;
  const purple = '#7d4fa0';
  const purpleD = '#5c3879';
  const purpleL = '#a57cc4';
  R(g, x, y, 7, 11, C.k);
  R(g, x + 1, y + 1, 5, 9, purple);
  R(g, x + 1, y + 1, 5, 1, purpleL);
  R(g, x + 1, y + 5, 5, 1, purpleD);
  R(g, x + 4, y + 2, 1, 8, purpleD);
  // the end that hangs over the floor, with a fringe
  R(g, x + 5, y + 6, 6, 8, C.k);
  R(g, x + 6, y + 7, 4, 6, purple);
  R(g, x + 6, y + 7, 1, 6, purpleL);
  for (let i = 0; i < 4; i += 2) P(g, x + 6 + i, y + 13, purpleL);
}

// ------------------------------------------------------------- decor
// roller: a white roller blind, pulled this many pixels down
export function drawWindow(g, x0, x1, row, { blinds = false, offset = 0, roller = 0 } = {}, s = SKIES.day) {
  const x = x0 * T + 2 + offset;
  const y = row * T + 2;
  const w = (x1 - x0 + 1) * T - 4;
  R(g, x - 1, y - 1, w + 2, 12, C.charcoal);
  R(g, x, y, w, 10, s.sky);
  R(g, x, y, w, 3, s.skyL);
  if (s.night) {
    // city lights below, a few stars above
    for (let i = 1; i < w - 1; i += 3) {
      R(g, x + i, y + 6 + ((i * 7) % 4), 1, 4, s.city);
      if ((i * 5) % 7 < 3) P(g, x + i, y + 7 + ((i * 3) % 2), s.lit);
    }
    for (let i = 4; i < w - 2; i += 11) P(g, x + i, y + 1 + (i % 2), '#c9d2ff');
  } else {
    for (let i = 0; i < w - 6; i += 9) {
      P(g, x + i + 5, y + 5, s.skyL);
      P(g, x + i + 4, y + 6, s.skyL);
    }
  }
  for (let mx = x0 + 1; mx <= x1; mx++) R(g, mx * T - 1 + offset, y, 1, 10, C.charcoal);
  if (blinds) for (let j = 1; j < 10; j += 2) R(g, x, y + j, w, 1, '#8c8378');
  if (roller) {
    R(g, x, y, w, roller, '#dfe2e2');
    R(g, x, y + roller - 1, w, 1, '#aab0b4');
    R(g, x + w - 4, y + roller, 1, 4, '#aab0b4'); // its cord
  }
  R(g, x - 1, y + 10, w + 2, 1, C.taupe);
}

// kind: 'full' covers the tile, 'left' / 'right' cover that half of it
export function drawCurtain(g, tx, row, kind) {
  const x = tx * T + (kind === 'right' ? 8 : 0);
  const w = kind === 'full' ? T : 8;
  const y = row * T;
  R(g, x, y + 1, w, 14, C.tan);
  for (let i = 0; i < w; i += 4) {
    R(g, x + i, y + 1, 1, 14, C.taupe);
    R(g, x + i + 2, y + 1, 1, 14, C.beige);
  }
  R(g, x, y, w, 2, C.walnut);
  R(g, x, y + 14, w, 1, C.taupe);
}

export function drawArt(g, tx, row, kind) {
  const x = tx * T + 2;
  const y = row * T + 2;
  R(g, x, y, 12, 9, C.walnut);
  if (kind === 'flower') {
    R(g, x + 1, y + 1, 10, 7, C.cream);
    R(g, x + 3, y + 3, 3, 3, C.red);
    P(g, x + 6, y + 2, C.olive);
    P(g, x + 7, y + 3, C.olive);
    P(g, x + 8, y + 5, C.olive);
    P(g, x + 6, y + 6, C.olive);
  } else if (kind === 'fern') {
    R(g, x + 1, y + 1, 10, 7, C.charcoal);
    for (let i = 0; i < 4; i++) {
      P(g, x + 2 + i * 2, y + 5 - i, C.leaf);
      P(g, x + 3 + i * 2, y + 3 + (i % 2) * 3, C.leafL);
    }
    R(g, x + 7, y + 2, 2, 2, C.white);
  } else {
    // abstract cream arches on green, like the foyer piece
    R(g, x + 1, y + 1, 10, 7, C.oliveD);
    R(g, x + 2, y + 3, 3, 5, C.beige);
    R(g, x + 6, y + 2, 4, 6, C.beige);
    R(g, x + 7, y + 5, 2, 3, C.oliveD);
  }
}

export function drawRug(g, x0, y0, x1, y1, style) {
  const x = x0 * T + 2;
  const y = y0 * T + 3;
  const w = (x1 - x0 + 1) * T - 4;
  const h = (y1 - y0 + 1) * T - 6;
  if (style === 'living') {
    R(g, x, y, w, h, '#e9ddc4');
    R(g, x, y, w, 1, '#cdbd9f');
    R(g, x, y + h - 1, w, 1, '#cdbd9f');
    for (let j = 3; j < h - 2; j += 3)
      for (let i = 2 + (j % 2) * 2; i < w - 2; i += 4) P(g, x + i, y + j, '#d6c7aa');
    for (let i = 1; i < w; i += 2) {
      P(g, x + i, y - 1, '#cdbd9f');
      P(g, x + i, y + h, '#cdbd9f');
    }
  } else if (style === 'master') {
    const accent = '#d9cab3';
    R(g, x, y, w, h, '#e3d6c2');
    for (let j = 2; j < h - 2; j += 4)
      for (let i = 2; i < w - 4; i += 6) {
        const o = ((j / 4) | 0) % 2 ? 3 : 0;
        R(g, x + i + o, y + j, 4, 2, accent);
      }
    R(g, x, y, w, 1, accent);
    R(g, x, y + h - 1, w, 1, accent);
  } else if (style === 'guest') {
    R(g, x, y, w, h, '#e6d6ba');
    R(g, x + 2, y + 2, w - 4, h - 4, '#dcc9a9');
    R(g, x + 4, y + 4, w - 8, h - 8, '#e6d6ba');
    R(g, x + 6, y + 6, w - 12, h - 12, '#dcc9a9');
  } else if (style === 'bath') {
    R(g, x, y, w, h, C.gray);
    R(g, x + 1, y + 1, w - 2, h - 2, C.grayL);
  }
}

export function drawDrain(g, tx, ty) {
  const x = tx * T + 6;
  const y = ty * T + 6;
  R(g, x, y, 4, 4, C.grayD);
  P(g, x + 1, y + 1, C.grayL);
  P(g, x + 2, y + 2, C.grayL);
}

// A shower head seen from above, on an arm coming out of the wall on `side`.
export function drawShowerHead(g, tx, ty, side, color) {
  const x = tx * T;
  const y = ty * T;
  const head = (cx, cy) => {
    R(g, cx - 3, cy - 4, 6, 8, C.k);
    R(g, cx - 4, cy - 3, 8, 6, C.k);
    R(g, cx - 3, cy - 3, 6, 6, color);
    for (const [dx, dy] of [[-2, -2], [1, -2], [-2, 1], [1, 1]]) P(g, cx + dx, cy + dy, C.white);
  };
  if (side === 'W') {
    R(g, x, y + 6, 6, 4, C.k);
    R(g, x, y + 7, 6, 2, color);
    head(x + 9, y + 8);
  } else {
    R(g, x + 6, y + 10, 4, 6, C.k);
    R(g, x + 7, y + 10, 2, 6, color);
    head(x + 8, y + 7);
  }
}

// look: 'plain' is a flat grey fire door, the kind every flat in a tower starts with
export function drawFrontDoor(g, x0, row, look) {
  const x = x0 * T;
  const y = row * T;
  R(g, x, y, T * 2, T, C.k);
  if (look === 'plain') {
    R(g, x + 1, y + 2, T * 2 - 2, T - 4, '#8b9096');
    R(g, x + 1, y + 2, T * 2 - 2, 1, '#a3a8ad');
    R(g, x + 24, y + 5, 4, 5, '#55595f');
    R(g, x + 25, y + 6, 2, 2, C.steelL);
    R(g, x + 14, y + 4, 4, 2, '#d7dadb'); // the spyhole's plate
    P(g, x + 15, y + 4, C.k);
    return;
  }
  R(g, x + 1, y + 2, T * 2 - 2, T - 4, '#f0e4d0');
  R(g, x + 3, y + 4, T * 2 - 6, T - 8, '#e2d3ba');
  R(g, x + 25, y + 6, 3, 3, C.steel);
}

// An open door: the doorway keeps its floor, with the door leaf folded back
// along one edge. `vertical` = the door sits in a vertical (north-south) wall.
// look: 'plain' is a white laminate door with a steel handle
export function drawThreshold(g, tx, ty, vertical, look) {
  const x = tx * T;
  const y = ty * T;
  const [leaf, edge, knob] = look === 'plain' ? ['#d9dcdc', '#f1f3f3', C.steel] : [C.wood, C.woodL, C.gold];
  if (vertical) {
    R(g, x, y, T, 4, C.k);
    R(g, x + 1, y, T - 2, 3, leaf);
    R(g, x + 1, y, T - 2, 1, edge);
    P(g, x + T - 4, y + 1, knob);
  } else {
    R(g, x, y, 4, T, C.k);
    R(g, x, y + 1, 3, T - 2, leaf);
    R(g, x, y + 1, 1, T - 2, edge);
    P(g, x + 1, y + T - 4, knob);
  }
}

// A slim padded headboard running along the east wall of a room.
export function drawHeadboard(g, tx, y0, y1) {
  const x = tx * T + 10;
  const top = y0 * T - 6;
  const h = (y1 + 1) * T - top;
  R(g, x, top, 6, h, C.k);
  R(g, x + 1, top + 1, 4, h - 9, C.olive);
  R(g, x + 1, top + 1, 1, h - 9, C.oliveL);
  R(g, x + 1, top + h - 8, 4, 7, C.oliveD);
  for (let y = top + 16; y < top + h - 10; y += 16) R(g, x + 1, y, 4, 1, C.oliveD);
}

// A window in a north-south wall, seen from above as a strip of glass.
export function drawSideWindow(g, tx, y0, y1, s = SKIES.day) {
  const x = tx * T + 4;
  const y = y0 * T + 2;
  const h = (y1 - y0 + 1) * T - 4;
  R(g, x, y, 8, h, C.charcoal);
  R(g, x + 1, y + 1, 6, h - 2, s.sky);
  R(g, x + 1, y + 1, 2, h - 2, s.skyL);
  if (s.night) for (let j = 4; j < h - 3; j += 5) P(g, x + 5, y + j, s.lit);
  R(g, x + 1, y + (h >> 1), 6, 1, C.charcoal);
}
