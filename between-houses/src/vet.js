// The vet's: one still picture, shown in place of the world while the scene
// between Act 1 and Act 2 plays (see `rescue` in quests.js). Nobody walks
// about in it; the dialog box does the rest.
//
// state: 'room' (everybody waiting), 'scan' (the scanner is out, over the big
// one's shoulders), 'phone' (Hưng has his phone to his ear), or 'dogs' (the
// end of Act 3: the dogs off the boat are being looked at, one on the table
// and two waiting on the floor; no cats; Flower's human is there too).
// who: the sprites to stand in it: { cats: [tabby, orange], hung, trang, vet, owner (Flower's human, for 'dogs') }
import { C, R } from './palette.js';
import { CONFIG } from './config.js';
import { makeDog, DOG_PALS } from './sprites.js';

// (the three dogs of the last picture, made when they are first wanted)
let dogSprites = null;
const dogs = () => dogSprites || (dogSprites = { tan: makeDog(DOG_PALS.tan), black: makeDog(DOG_PALS.black), patched: makeDog(DOG_PALS.patched) });

const VW = CONFIG.viewW;
const VH = CONFIG.viewH;
const FLOOR = 106; // where the wall meets the floor
const FEET = 146; // where people stand
const TABLE = { x: 114, y: 98, w: 92 };

// a sprite at twice its size, standing on (x, y)
function big(g, im, x, y) {
  g.drawImage(im, 0, 0, im.width, im.height, x, y - im.height * 2, im.width * 2, im.height * 2);
}

export function drawVet(g, frame, state, who) {
  const smooth = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = false;
  // the wall, a darker band along the bottom of it, and a tiled floor
  R(g, 0, 0, VW, FLOOR, '#d3e6df');
  R(g, 0, FLOOR - 26, VW, 26, '#b4d2c9');
  R(g, 0, FLOOR - 27, VW, 1, '#8fb5ab');
  R(g, 0, FLOOR, VW, VH - FLOOR, '#e9e5d9');
  for (let y = FLOOR; y < VH; y += 14) for (let x = (((y - FLOOR) / 14) % 2) * 14 - 14; x < VW; x += 28) R(g, x, y, 14, 14, '#d8d3c5');
  R(g, 0, FLOOR, VW, 2, '#8fb5ab');

  // on the wall: the green cross, a chart of a cat, a clock, and a shelf of bottles over a cupboard
  R(g, 16, 20, 30, 30, C.k);
  R(g, 17, 21, 28, 28, '#ffffff');
  R(g, 27, 25, 8, 20, '#3aa55d');
  R(g, 21, 31, 20, 8, '#3aa55d');
  R(g, 58, 18, 40, 48, C.k);
  R(g, 59, 19, 38, 46, '#f6f1e4');
  // (a cat, side on, with little lines pointing at the parts of it)
  R(g, 68, 40, 18, 9, '#8a8f99');
  R(g, 64, 34, 8, 8, '#8a8f99');
  R(g, 64, 32, 2, 2, '#8a8f99');
  R(g, 70, 32, 2, 2, '#8a8f99');
  R(g, 86, 34, 2, 10, '#8a8f99');
  R(g, 69, 49, 2, 5, '#8a8f99');
  R(g, 83, 49, 2, 5, '#8a8f99');
  for (const [x, y, w] of [[74, 28, 16], [78, 58, 14], [63, 58, 10], [90, 30, 5]]) R(g, x, y, w, 1, '#c2371f');
  R(g, 62, 22, 22, 2, '#5c5863');
  // the clock
  R(g, 186, 20, 20, 20, C.k);
  R(g, 187, 21, 18, 18, '#ffffff');
  R(g, 195, 24, 2, 7, C.k);
  R(g, 196, 29, 6, 2, C.k);
  // shelf and bottles
  R(g, 226, 40, 80, 3, '#7a6a58');
  R(g, 226, 43, 80, 1, '#5a4c3e');
  [['#c2371f', 9], ['#3a78c2', 12], ['#f1ece0', 8], ['#3aa55d', 11], ['#e0a23a', 9], ['#f1ece0', 13], ['#8a5fb0', 8]].forEach(([col, h], i) => {
    const x = 230 + i * 11;
    R(g, x, 40 - h, 7, h, C.k);
    R(g, x + 1, 41 - h, 5, h - 1, col);
    R(g, x + 2, 38 - h, 3, 2, C.k);
  });
  // the cupboard, with a sink in its top
  R(g, 232, 70, 72, FLOOR - 66, C.k);
  R(g, 233, 71, 70, FLOOR - 68, '#f4f1ea');
  R(g, 233, 71, 70, 4, '#b9c0c9');
  R(g, 267, 75, 1, FLOOR - 72, '#b9b4a8');
  R(g, 262, 86, 3, 2, '#8a8f99');
  R(g, 270, 86, 3, 2, '#8a8f99');
  R(g, 284, 62, 2, 9, '#8a8f99');
  R(g, 278, 62, 8, 2, '#8a8f99');
  // a lamp over the table
  R(g, 159, 0, 2, 44, '#5c5863');
  R(g, 148, 44, 24, 5, '#5c5863');
  R(g, 152, 49, 16, 2, '#fff3b8');

  // on the floor: the scales, and the carrier the two of them came in
  R(g, 3, FEET - 6, 34, 5, C.k);
  R(g, 4, FEET - 5, 32, 3, '#b9c0c9');
  R(g, 15, FEET - 12, 10, 6, C.k);
  R(g, 16, FEET - 11, 8, 4, '#bfe6c8');
  R(g, 262, FEET - 24, 44, 24, C.k);
  R(g, 263, FEET - 23, 42, 22, '#c9b28a');
  R(g, 268, FEET - 18, 18, 14, C.k);
  for (let x = 270; x < 285; x += 4) R(g, x, FEET - 17, 2, 12, '#8a7a5e');
  R(g, 276, FEET - 28, 16, 4, C.k);

  // Hưng and Trang, to the left of the table
  if (state === 'dogs') {
    // (with the dogs: Trang keeps well back, half behind Hưng, and Flower's human, who drove them all
    // here, stands nearest the dogs with one of them on a lead)
    big(g, who.trang.stand.right, 8, FEET);
    big(g, who.hung.stand.right, 36, FEET);
    if (who.owner) big(g, who.owner.stand.right, 78, FEET);
  } else {
    big(g, who.trang.stand.right, 40, FEET);
    big(g, who.hung.stand.right, 76, FEET);
  }
  if (state === 'phone') {
    // his phone, at his ear
    R(g, 101, FEET - 38, 5, 9, C.k);
    R(g, 102, FEET - 37, 3, 7, '#3a78c2');
  }

  // the table: steel, and cold under the paws
  const T = TABLE;
  R(g, T.x + 6, T.y + 6, 4, FEET - T.y - 6, '#7d848f');
  R(g, T.x + T.w - 10, T.y + 6, 4, FEET - T.y - 6, '#7d848f');
  R(g, T.x + 4, FEET - 2, T.w - 8, 3, '#5c5863');
  R(g, T.x, T.y, T.w, 7, C.k);
  R(g, T.x + 1, T.y + 1, T.w - 2, 4, '#cfd5dc');
  R(g, T.x + 1, T.y + 1, T.w - 2, 1, '#eef1f4');
  if (state === 'dogs') {
    // a thin dog on the table, looking at the vet; and two more waiting their turn on the floor
    const d = dogs();
    big(g, d.tan.sit.right, T.x + 34, T.y + 1);
    big(g, d.patched.sit.right, T.x + 6, FEET + 2);
    big(g, d.black.cower.left, 238, FEET + 2);
    // the lead, from her hand to the collar of the one beside her
    // (it hangs in a slack curve from her hand, in the picture's own double pixels)
    if (who.owner) for (let i = 0; i <= 16; i++) R(g, 106 + i * 2, FEET - 18 - Math.round(i / 4) + Math.round(4 * Math.sin((Math.PI * i) / 16)), 2, 2, '#b64a3b');
  } else {
    // the two of them on it, patched up
    // (the big one on the vet's side: it is him the scanner is for)
    big(g, who.cats[1].sit.down, T.x + 8, T.y + 1);
    big(g, who.cats[0].sit.down, T.x + 50, T.y + 1);
    R(g, T.x + 54, T.y - 16, 6, 4, '#8fc7e8'); // a dressing on the big one's shoulder
    R(g, T.x + 14, T.y - 5, 6, 3, '#8fc7e8'); // and one on the small one's paw
  }

  // the vet, on the other side
  big(g, who.vet.stand.left, 212, FEET);
  if (state === 'scan') {
    // the scanner, held over the big one: its light blinks while it reads
    R(g, 192, FEET - 76, 20, 8, C.k);
    R(g, 193, FEET - 75, 18, 6, '#e9e5d9');
    R(g, 195, FEET - 74, 3, 3, (frame >> 3) & 1 ? '#3aa55d' : '#9be0b0');
    R(g, 210, FEET - 68, 3, 28, '#d9a57e');
  }
  g.imageSmoothingEnabled = smooth;
}
