// The sprites each kind of fighter uses, at the sizes they have in the game.
// Used by the battle screen.
import { makeCat, CAT_PALS, makeCritter, CRITTER_PALS, pairSprites, FLOWER, makeDog, DOG_PALS, makeHuman, makeGolfClub, HUMAN_PALS, HUMAN_COATS } from './sprites.js';
import { NAMED, RANDOM_COATS } from './strays.js';

// opts.maxScale shrinks the big cats (for the picker's tiles); opts.overlap
// tucks Babycat further in front of Mamacat.
export function fighterSprites(opts = {}) {
  const cap = (sc) => (sc && opts.maxScale ? sc.map((v) => Math.min(v, opts.maxScale)) : sc);
  const named = (id) => NAMED.find((n) => n.id === id);
  const catOf = (def) => makeCat(def.pal, { coat: def.coat, scale: cap(def.scale), thickTail: def.thickTail });
  const black = RANDOM_COATS.find((c) => c.what === 'black cat').pal;
  return {
    shark: makeCat(CAT_PALS.shark),
    orca: makeCat(CAT_PALS.orca),
    thanos: catOf(named('thanos')),
    scar: catOf(named('scar')),
    cheetos: catOf(named('cheetos')),
    socks: catOf(named('socks')),
    mama: pairSprites(catOf(named('mama')), catOf(named('baby')), opts.overlap),
    bbc: makeCat({ ...black, e: '#f2d37a' }, { scale: cap([1.3125, 1.3125]), thickTail: true }),
    flower: makeCat(FLOWER.pal, { coat: FLOWER.coat }),
    // one of each of the kinds that come in several coats
    stray: makeCat(RANDOM_COATS[2].pal),
    rat: makeCritter('rat', CRITTER_PALS.rat[0]),
    snake: makeCritter('snake', CRITTER_PALS.snake[0]),
    dog: dogSprites(0),
    // the three humans of Act 3, as they look in the garden (quests.js)
    scarf: standing(makeHuman(HUMAN_PALS.haterL, true, { coat: HUMAN_COATS.haterL, scale: [0.875, 1] })),
    green: standing(makeHuman(HUMAN_PALS.haterS, false, { coat: HUMAN_COATS.haterS })),
    // (Golf Club, with the club in his hand: his pictures are wider than the others')
    club: standing(makeGolfClub()),
  };
}
// a human in a fight: no sitting pose, so bracing and standing look the same
const standing = (sp) => ({ ...sp, sit: sp.stand });
// the i-th dog of a fight: each has a coat of its own (tan, black, patched, and round again)
export const DOG_COATS = Object.keys(DOG_PALS);
export const dogSprites = (i) => makeDog(DOG_PALS[DOG_COATS[i % DOG_COATS.length]]);
// how a fighter looks standing still, facing the viewer (critters only have a side view)
export const portrait = (sp, kind) => (kind === 'rat' || kind === 'snake' || kind === 'dog' ? sp.stand.left : sp.stand.down);

// A condition's chip: an 11 x 11 picture, the colour framed in ink with its
// icon drawn in ink (see STATUS in battle.js). Needs a canvas maker.
export function statusChip(st, makeCanvas) {
  const [cv, g] = makeCanvas(11, 11);
  g.fillStyle = '#0c0b11';
  g.fillRect(0, 0, 11, 11);
  g.fillStyle = st.colour;
  g.fillRect(1, 1, 9, 9);
  g.fillStyle = '#0c0b11';
  st.icon.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === '#') g.fillRect(2 + x, 2 + y, 1, 1);
  });
  return cv;
}
