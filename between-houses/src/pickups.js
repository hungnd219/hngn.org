// Things a cat can carry in its mouth: small items that lie on a tile without
// being in anybody's way. One per cat. (The mugs and vases upstairs are a
// different kind of thing: those get knocked over, not carried.)
// home: which floor it belongs on ('apt' | 'garden') and roughly where; the
// game finds the nearest free tile. Names and lines are in game-text.js.
// toy: a cat toy, and what it does when a cat walks onto it: 'squeak' (it
// squeaks, and is batted a tile further on), 'nip' (catnip: he rolls about)
// or 'chew' (he lies down and chews it). A human who is handed a toy throws
// it for the cat instead of keeping it. late: a toy that comes into the flat
// in the epilogue, and is nowhere before it.
import { canvas } from './palette.js';

const K = '#2b2024';
export const PICKUPS = {
  sock: {
    home: ['apt', 9, 12],
    pal: { k: K, a: '#5d6e3c', b: '#f1ece0', c: '#80924f' },
    rows: ['.kkkk....', '.kabk....', '.kbak....', '.kabkkkk.', '.kbababk.', '.kccccck.', '..kkkkk..'],
  },
  hairtie: {
    home: ['apt', 18, 11],
    pal: { k: K, a: '#8a2b3f', b: '#c0566a' },
    rows: ['.........', '..kkkkk..', '.kabbbak.', '.kak.kak.', '.kabbbak.', '..kkkkk..', '.........'],
  },
  // a gray toy mouse that squeaks: pink ear, pink nose, a string for a tail
  mouse: {
    home: ['apt', 39, 10], toy: 'squeak',
    pal: { k: K, a: '#8f8a86', b: '#bdb8b2', c: '#e59aa6', d: '#6e5a50' },
    rows: ['.........', '..kk.....', '.kcakkk..', 'kakbbbbk.', 'cbabbbakd', '.kkkkkk.d', '.....ddd.'],
  },
  // a catnip stick: green and knobbly, the shape of a dill pickle
  catnip: {
    home: ['apt', 48, 5], toy: 'nip',
    pal: { k: K, a: '#4f8a3c', b: '#77b052', c: '#b5d977', d: '#356b2c' },
    rows: ['......kk.', '....kkbck', '...kbcabk', '..kbadbk.', '.kcabbk..', 'kbadbk...', '.kkkk....'],
  },
  // a chew toy: a length of beige rope with a knot at each end
  rope: {
    home: ['apt', 26, 7], toy: 'chew',
    pal: { k: K, a: '#dcc79a', b: '#b3956a', c: '#efe2c0' },
    rows: ['.........', '.kk...kk.', 'kcakkkcak', 'kabababbk', 'kbakkkabk', '.kk...kk.', '.........'],
  },
  // The epilogue's: two soft toy demons from Japan, round and fat, with cat ears and striped horns, two
  // fangs and a pleased face. A red one and a blue one, one each. (late: not in the flat before then.)
  oniRed: {
    home: ['apt', 41, 11], toy: 'chew', late: true,
    pal: { k: K, a: '#d8433a', b: '#f2cf3a', c: '#2b2024', d: '#f4f1ea', e: '#f29a9a' },
    rows: ['.b.kkk.b.', 'kbkccckbk', 'kaaaaaaak', 'kackackak', 'keaddaaek', 'kaaaaaaak', '.kkkkkkk.'],
  },
  oniBlue: {
    home: ['apt', 43, 11], toy: 'chew', late: true,
    pal: { k: K, a: '#2f9fe0', b: '#f2cf3a', c: '#2b2024', d: '#f4f1ea', e: '#f2a6c0' },
    rows: ['.b.kkk.b.', 'kbkccckbk', 'kaaaaaaak', 'kackackak', 'keaddaaek', 'kaaaaaaak', '.kkkkkkk.'],
  },
  collar: {
    home: ['garden', 46, 12],
    pal: { k: K, a: '#b64a3b', b: '#d9a94a', c: '#f2d37a' },
    rows: ['..kkkkk..', '.kaaaaak.', 'kak...kak', 'kak...kak', '.kaakaak.', '..kkbkk..', '...kck...'],
  },
  feather: {
    home: ['garden', 63, 27],
    pal: { k: K, a: '#5b7fa6', b: '#a9d6e8', c: '#f7f1e3' },
    rows: ['......kk.', '....kkbak', '...kbbak.', '..kbbak..', '.kcbak...', 'kckkk....', 'kk.......'],
  },
};

// the picture on the ground, and a smaller one for a cat's mouth
export function renderPickup(def) {
  const [cv, g] = canvas(9, def.rows.length);
  def.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '.') continue;
      g.fillStyle = def.pal[row[x]];
      g.fillRect(x, y, 1, 1);
    }
  });
  // in the mouth: the middle of it, with the outline kept
  const [mv, mg] = canvas(6, 5);
  mg.drawImage(cv, 0, 0, 9, def.rows.length, 0, 0, 6, 5);
  return { ground: cv, mouth: mv };
}
