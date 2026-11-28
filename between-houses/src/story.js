// The story's state and the tables it runs on: where the pair stand on the
// ladder of stats and moves, how hurt they are, who has been beaten
// and befriended, and the fights the world can start. Saving and loading too.
//
// A game is either the story (Act 0 and Act 1 are built) or a 'sandbox': the
// two places to roam, with everything this file describes switched on.
import { WORDS } from './game-text.js';
import { catName } from './names.js';

// The ladder: Shark's and Orca's stats and moves at each milestone of the
// story. They end on the same numbers as battle mode: the last rung, with
// nothing added for what was found in the garden or earned in the flat.
const cat = (hp, atk, agl, heavy, specials) => ({ hp, atk, agl, heavy, specials });
export const LADDER = {
  // the opening (Act 0): Shark on his first day outdoors, before he has learned to bite
  act0: { shark: cat(48, 7, 10, null, []), orca: cat(24, 7, 25, 'kick', []) },
  start: { shark: cat(48, 7, 10, 'chomp', []), orca: cat(24, 7, 25, 'kick', []) },
  meeting1: { shark: cat(54, 8, 10, 'chomp', []), orca: cat(27, 8, 25, 'kick', []) },
  meeting2: { shark: cat(60, 8, 10, 'chomp', []), orca: cat(30, 9, 25, 'kick', ['groom']) },
  meeting3: { shark: cat(66, 9, 10, 'chomp', ['protect']), orca: cat(33, 10, 25, 'kick', ['groom']) },
  // (the end of Act 2: the same numbers as meeting3, since what Act 2 adds is earned in the flat
  // and can be missed: see HOME_GAINS)
  house: { shark: cat(66, 9, 10, 'chomp', ['sing', 'protect']), orca: cat(33, 10, 25, 'kick', ['groom', 'yoga']) },
  // (Sandbox from the menu, the game after the epilogue for somebody who has not played the story: the
  // same numbers again, which are Battle mode's)
  full: { shark: cat(66, 9, 10, 'chomp', ['sing', 'protect']), orca: cat(33, 10, 25, 'kick', ['groom', 'yoga']) },
};
export const STAGES = Object.keys(LADDER);
// a stray that will fight for food (see ENCOUNTERS.plateFight): its numbers at each rung of Act 1, over the
// battle's own stray. Tuned with design/battle/carry.mjs: a pair on half HP nearly always win and come out
// ahead once they have eaten; on a quarter it is a gamble.
export const PLATE_STRAY = {
  start: { hp: 44, atk: 9, agl: 15 },
  meeting1: { hp: 46, atk: 9, agl: 15 },
  meeting2: { hp: 52, atk: 10, agl: 15 },
  meeting3: { hp: 58, atk: 12, agl: 15 },
};

// HP is kept from one fight to the next (there is no energy meter: that was the old way). What a fight
// leaves a cat with is what he has until something mends it. Each number is a share of his full HP.
// Before the adoption the pair are thin strays, and a hurt mends only with food (and a little with
// sleep). After it they are fed every day, and mend by themselves as they walk about.
export const MEND = {
  plate: 0.5, // a plate put down for them (the story's, or one of the garden's regular plates): half, like a pile (his word)
  pile: 0.5, // a little pile of kibble a passer-by left
  meat: 0.25, // a bit of meat dropped from a BBQ table
  portion: 0.5, // upstairs: one cat's portion of a bowl or of the kibble machine
  bite: 0.15, // upstairs: a bite stolen off a human's plate
  nap: 0.1, // the most naps can give back between one fight and the next (napping again and again gives no more)...
  napHours: 1, // ...over this many game hours asleep
  sleep: 0.25, // a night's sleep the story puts them down for, before the adoption
  step: 0.0075, // after the adoption: mended by each tile walked (the walk from Cheetos's tree to the shed is about 27)
  road: 0.25, // what a vehicle takes...
  floor: 0.25, // ...though it never leaves anybody under this. A cat knocked out in a fight comes round with this much
  low: 1 / 3, // a pair who lose to dogs having gone into the fight under this are taken home
};

// Looking around pays: the first time the pair do each of these in the story,
// both of them gain a little for good. [stat, how much]
export const FINDS = { tree: ['agl', 1], sink: ['hp', 3], rat: ['atk', 1] };
// ...and so does trying things around the flat, in Act 2. Each of its two days has two groups of
// things, "play" and "care": a group finished on its day is worth this, for good, and one that
// is not finished that day is lost. (story.gains: play1, care1, play2, care2.)
export const HOME_GAINS = {
  play: { atk: { shark: 1, orca: 1 }, agl: { shark: 1, orca: 1 } },
  care: { hp: { shark: 3, orca: 2 } },
};

// two of Act 1's fights, in numbers (design/battle/story.mjs plays them): the snake at Babycat's box, and
// Mamacat with the friend she brings
export const SNAKE = { hp: 40, agl: 30 };
export const MAMA_GUARD = { mama: 52, stray: 36 }; // (the pair come in on what the snake left them: Groom and Protect see them through)

// which cats downstairs can be fought and asked along, and as which fighter
export const FIGHTER_OF = { scar: 'scar', thanos: 'thanos', mama: 'mama', cheetos: 'cheetos', socks: 'socks' };
// friends from the start; the others have to be beaten in a spar first
export const OLD_FRIENDS = ['scar', 'socks'];

// mode: 'story' (Act 1 onwards, as far as it is built) or 'sandbox' (both
// floors to roam, with everything switched on)
export function newStory(mode = 'sandbox') {
  const tale = mode === 'story';
  return {
    v: 1,
    mode,
    act: 0, // the story opens with Act 0
    stage: tale ? 'act0' : 'full',
    adopted: !tale, // house cats eat upstairs, and leave the garden's kibble for cats who need it
    hurt: { shark: 0, orca: 0 }, // HP each has lost and not got back (see MEND)
    goal: tale ? '' : WORDS.goal.sandbox,
    quest: { cheetos: 'meet', socks: 'wait', mama: 'wait', thanos: 'wait' }, // how far each questline has got
    // anything the story needs to remember. The opening starts with Shark alone (solo), no health bar
    // yet (noEnergy: the flag's name is from the energy meter there used to be; until it goes, a fight
    // leaves nobody hurt), no naps, rain, and an empty road.
    flags: tale ? { solo: true, noEnergy: true, noNap: true, rain: true, quietRoad: true } : {},
    found: {}, // things tried for the first time around the garden (see FINDS)
    bonus: { hp: 0, atk: 0, agl: 0 }, // what those have added to both cats' numbers
    beaten: {}, // stray id -> true once the pair have won a spar against it
    resting: {}, // stray id -> the day it went home hurt (back the next day)
    party: null, // the stray id that is along
    seen: {}, // scenes already watched (they can be skipped next time)
  };
}

// the pair as fighters, at their stage; hungry cats start Weakened and well-fed ones Snacking
// where the pair stand on the ladder, with anything the story has taught them ahead of their rung
export function rungOf(story) {
  const rung = LADDER[story.stage] || LADDER.full;
  const out = {};
  const b = story.bonus || {};
  for (const kind of ['shark', 'orca']) {
    const r = rung[kind];
    out[kind] = { ...r, hp: r.hp + (b.hp || 0), atk: r.atk + (b.atk || 0), agl: r.agl + (b.agl || 0), specials: r.specials.slice() };
  }
  // Shark learns Protect in front of a snake, a little before the third meeting
  if (story.flags && story.flags.protect && !out.shark.specials.includes('protect')) out.shark.specials.push('protect');
  // Act 2: what was earned around the flat on its two days (kept for the rest of the story: a game that
  // was played stays on the 'house' rung to the end, epilogue included), and a move each, learned at the TV.
  const g = story.gains || {};
  if (story.stage === 'meeting3' || story.stage === 'house') {
    for (const key of Object.keys(g)) {
      const gain = g[key] && HOME_GAINS[key.replace(/\d+$/, '')];
      if (!gain) continue;
      for (const stat of Object.keys(gain)) for (const k of ['shark', 'orca']) out[k][stat] += gain[stat][k];
    }
  }
  if (story.flags && story.flags.sing && !out.shark.specials.includes('sing')) out.shark.specials.unshift('sing');
  if (story.flags && story.flags.stretch && !out.orca.specials.includes('yoga')) out.orca.specials.push('yoga');
  return out;
}
// How hurt each of the pair is: HP lost and not mended. (A game saved before HP was kept has none.)
export const hurtOf = (story, kind) => Math.max(0, (story.hurt && story.hurt[kind]) || 0);
// whether what a fight does to the pair counts for after it (see afterFight in game.js)
export const keepsHurt = (story) => story.mode === 'story' && !(story.flags && story.flags.noEnergy);
// The pair as fighters. They come in on what they have left, unless the fight is `plain` (one the
// story arranges to end a certain way: it starts them on full HP, whatever went before).
export function partySpecs(story, { plain = false } = {}) {
  const rung = rungOf(story);
  const who = story.flags && story.flags.solo ? ['shark'] : ['shark', 'orca'];
  // (by whatever name the story gives each of them at this point: see names.js)
  return who.map((kind) => {
    const hp = rung[kind].hp;
    const now = plain || !keepsHurt(story) ? hp : Math.max(1, Math.round(hp - hurtOf(story, kind)));
    return { kind, name: catName(kind), ...rung[kind], specials: rung[kind].specials.slice(), ...(now < hp ? { start: { hp: now } } : {}) };
  });
}

// ---------------------------------------------------------------- fights
// What the battle screen needs for each kind of fight (see battle-screen.js).
// `party` is filled in when the fight starts.
export const ENCOUNTERS = {
  // a fight for food with one of the garden's nameless strays (see plateContest in game.js): `what` is its
  // coat ('gray cat'), `fill` puts the names into the words
  plateFight: (what, fill, stage) => ({
    id: 'plate',
    phases: [{ foes: [{ kind: 'stray', coat: what, ...(PLATE_STRAY[stage] || PLATE_STRAY.meeting3) }] }],
    intro: [fill(WORDS.plate.intro)],
    words: { won: fill(WORDS.plate.won), lost: fill(WORDS.plate.lost) },
  }),
  // a friendly bout with one of the garden's cats
  spar: (kind, name) => ({
    id: 'spar:' + kind,
    phases: [{ foes: [{ kind }] }],
    intro: [WORDS.fights.spar.replace('{name}', name)],
    words: { won: WORDS.fights.sparWon.replace('{name}', name), lost: WORDS.fights.sparLost.replace('{name}', name) },
  }),
  // Act 1: Cheetos thinks fighting is a game. The pair against him alone.
  cheetosPlay: () => ({
    id: 'cheetosPlay',
    guide: true,
    // (a plain swipe to begin with, and on his second turn he gets the Zoomies: the first sight of Swift)
    phases: [{ foes: [{ kind: 'cheetos', script: { 1: 'attack', 2: 'zoomies' } }] }],
    intro: [WORDS.act1.fightIntro],
    words: { won: WORDS.act1.fightWon, lost: WORDS.act1.fightLost },
  }),
  // Act 1: Socks plays tag the hard way. She has extra HP: alone, at her usual 34, she is no match for two.
  socksTag: () => ({
    id: 'socksTag',
    // (she opens with Trip, on Orca: the first sight of Slowed, on the cat who lives by dodging)
    phases: [{ foes: [{ kind: 'socks', hp: 50, script: { 1: { id: 'trip', on: 'orca', lands: true } } }] }],
    intro: [WORDS.act1.socksFightIntro],
    words: { won: WORDS.act1.socksWon, lost: WORDS.act1.socksLost },
  }),
  // Act 1: the rats that took the sock: one big one and two ordinary ones, a little tougher than a garden rat.
  // (They come the same night as Socks's tag, which counts: the owner played it, and wants them as they
  // were. A pair who eat between are fresh for them; the plate after is a full one.)
  ratNest: () => ({
    id: 'ratNest',
    phases: [{ foes: [{ kind: 'rat', big: true, hp: 30, atk: 8 }, { kind: 'rat', hp: 18, atk: 6 }, { kind: 'rat', hp: 18, atk: 6 }] }],
    intro: [WORDS.act1.ratsIntro],
    words: { won: WORDS.act1.ratsWon, lost: WORDS.act1.ratsLost },
  }),
  // Act 0: Scar finds a stranger on her pavers. A first fight: Shark alone, with nothing but Swipe and
  // Defend, against a Scar who is holding back. After four rounds neither has won, whatever happened.
  scarMeet: () => ({
    id: 'scarMeet',
    guide: true,
    phases: [{ foes: [{ kind: 'scar', hp: 36, atk: 6, heavy: null, specials: [] }], maxRounds: 3, hideRounds: true, ends: { won: 'draw', lost: 'draw', timeout: 'draw', draw: 'draw' } }],
    intro: WORDS.act0.scarIntro,
    // (each shown once, over the menu it is about: see `lesson` in battle-screen.js)
    lessons: { menu: WORDS.act0.scarMenu, aim: WORDS.act0.scarAim },
    words: { draw: WORDS.act0.scarDraw },
  }),
  // Act 0: Orca wants the plate to himself. Shark alone again, now with Chomp; it does not matter who wins.
  orcaMeet: () => ({
    id: 'orcaMeet',
    phases: [{ foes: [{ kind: 'orca', name: catName('orca'), hp: 24, atk: 7, specials: [] }], teach: WORDS.act0.statTeach }],
    intro: WORDS.act0.orcaIntro,
    words: { won: WORDS.act0.orcaWon, lost: WORDS.act0.orcaLost },
  }),
  // the rats that hang about by the BBQ shed: seeing them off for the first time is worth something
  shedRats: () => ({
    id: 'shedRats',
    phases: [{ foes: [{ kind: 'rat' }, { kind: 'rat' }] }],
    intro: [WORDS.finds.ratIntro],
    words: { won: WORDS.finds.ratWon, lost: WORDS.finds.ratLost },
  }),
  // Act 1: a snake comes out of the bush for Mamacat's kitten, and Shark gets in the way. A big one (40 HP,
  // not a snake's usual 26: the fight lasts four or five rounds, long enough for the infection to bite), and
  // quick enough to go first (AGL 30, ahead of Orca even with the tree climbed): its first move is arranged,
  // Venom, on Shark, and it lands whatever the odds. That is the first sight of Infected, with Orca's Groom there to take it off
  // him and Protect new on Shark's menu.
  snakeBite: () => ({
    id: 'snakeBite',
    phases: [{ foes: [{ kind: 'snake', hp: SNAKE.hp, agl: SNAKE.agl, script: { 1: { id: 'venom', on: 'shark', lands: true } } }] }],
    intro: [WORDS.act1.snakeIntro, WORDS.act1.snakeVenom, WORDS.act1.mamaHint, WORDS.act1.mamaWait],
    words: { won: WORDS.act1.snakeWon, lost: WORDS.act1.snakeLost },
  }),
  // Act 1: Mamacat finds the pair standing over her kitten, and has brought a friend. (Babycat is not at her side
  // for this one. Shark comes into it clean: the snake's bite was the fight before. So her friend has a
  // stray's usual 36 HP, where it had 22 when Shark came in Infected: the odds are about what they were.)
  mamaGuard: (coat) => ({
    id: 'mamaGuard',
    // (on her second turn Mamacat shares out her Leftovers: Snacking, on the other side for once)
    phases: [{ foes: [{ kind: 'mama', look: 'solo', hp: MAMA_GUARD.mama, script: { 2: 'leftovers' } }, { kind: 'stray', coat, hp: MAMA_GUARD.stray }] }],
    intro: [WORDS.act1.mamaIntro, WORDS.act1.mamaBoth],
    words: { won: WORDS.act1.mamaWon, lost: WORDS.act1.mamaLost },
  }),
  // The end of Act 1. Thanos alone can be beaten. Then he gets back up with two
  // of his sons, all three Strengthened for good: nothing says so, but that
  // one is not there to be won. However it ends, the pair are rescued.
  thanosBoss: () => ({
    id: 'thanosBoss',
    phases: [
      // He holds back in this one: 90 HP of his 120, and he calls nobody in. He opens with Intimidate, on
      // Shark: the first sight of Spooked and Weakened (and Orca's Groom takes both off him).
      { foes: [{ kind: 'thanos', hp: 90, specials: ['intimidate'], script: { 1: { id: 'intimidate', on: 'shark' } }, koText: WORDS.fights.bossDown }], key: 'thanos', intro: [WORDS.fights.boss], after: WORDS.fights.bossBetween },
      {
        before: WORDS.fights.bossSons,
        // (Thanos in the middle place, his sons above and below him: the middle is where he stood alone, and
        // where he stands in the scene after the fight)
        foes: [
          { kind: 'stray', look: 'lookalike', start: { st: { strong: true }, strongPerm: true } },
          { kind: 'thanos', specials: ['intimidate'], start: { st: { strong: true }, strongPerm: true } },
          { kind: 'stray', look: 'lookalike', start: { st: { strong: true }, strongPerm: true } },
        ],
        intro: [WORDS.fights.boss2a, WORDS.fights.boss2b],
        ends: { lost: 'rescued', won: 'rescued', draw: 'rescued', timeout: 'rescued' },
      },
    ],
    words: { rescued: WORDS.fights.rescued, lost: WORDS.fights.bossLost },
  }),
  // Act 3: the dogs that roam the garden (see dogs.js): one, two or three of them at once. Each is the
  // fighter `dog`, so one that is losing howls for another. Nothing is won by it: beaten, they back off.
  // words: { intro: [lines], won, lost, lone }
  dogs: (n = 1, words = {}) => {
    const k = Math.max(1, Math.min(3, n));
    return {
      id: 'dogs:' + k,
      // (words.lone: a dog whose howl nobody would hear, the rest being at the other end of the garden. It only barks.)
      phases: [{ foes: Array.from({ length: k }, () => ({ kind: 'dog', ...(words.lone ? { specials: ['bark'] } : {}) })) }],
      intro: words.intro || [['A dog has caught up with {S} and {O}!', 'Two dogs have caught up with {S} and {O}!', 'Three dogs have caught up with {S} and {O}!'][k - 1]],
      words: {
        won: words.won || (k > 1 ? "The dogs back off with their tails down. They'll keep away for a while." : "The dog backs off with its tail down. It'll keep away for a while."),
        lost: words.lost || 'Too many teeth. {S} and {O} run for it!',
      },
    };
  },
  // the Act 2 gate: AGL 60, so Bunny Kick cannot land unless it is Distracted, and it is back at full charge the moment one
  // lands, so only one hit as big as all its HP will do. (Act 2 has its own words for its two fights with
  // it, and settles how the first two attacks of the first fight come out: words.fate.)
  robot: (words = {}) => ({
    id: 'robot',
    backdrop: 'home',
    phases: [{ foes: [{ kind: 'robot', ...(words.fate ? { fate: words.fate } : {}) }], maxRounds: 3 }],
    intro: words.intro || [WORDS.fights.robot, WORDS.fights.robotHint],
    words: { won: words.won || WORDS.fights.robotWon, timeout: words.timeout || WORDS.fights.robotTimeout, lost: words.lost || WORDS.fights.robotLost },
  }),
  // ---- Act 3. Each takes the story's words for it (all optional: there are plain ones here), as robot() does.
  // The numbers of all three are argued out, and played many thousands of times, in design/battle/act3.mjs.
  //
  // At Garnet's doors: BBC, in a panic, with Flower beside him. The pair against the two of them. Losing
  // it costs nothing: walk up and try again. words: { intro: [lines], won, lost }
  garnetDoors: (words = {}) => ({
    id: 'garnetDoors',
    // (Flower's first move is Hiss, at Shark: the story's first sight of Rattled, on the cat who Protects)
    phases: [{ foes: [{ kind: 'bbc' }, { kind: 'flower', script: { 1: { id: 'hiss', on: 'shark', lands: true } } }] }],
    intro: words.intro || ["BBC is in a panic, and won't hear a word. Flower won't leave his side."],
    words: {
      won: words.won || "BBC sits down, breathing hard. Flower sits down beside him. They're ready to listen.",
      lost: words.lost || "There's no getting near BBC like this. The pair back off to catch their breath.",
    },
  }),
  // In Purple Scarf's flat: Orca alone keeps her busy while Shark works at the front door. It is over after
  // four rounds, whatever has happened, and always ends as 'escaped'. `only` is who fights it: the game is
  // to leave everybody else out of the party. Her HP here (more than at the jetty) and her ATK are a lock:
  // in four rounds Orca cannot bring her to 0 and she cannot bring him to 0, whatever he has earned and
  // however the rolls fall (the proof is printed by design/battle/act3.mjs).
  // words: { intro: [lines], escaped }
  durian: (words = {}) => ({
    id: 'durian',
    backdrop: 'bare',
    only: 'orca',
    // (she throws a durian first, so that it is seen)
    phases: [{ foes: [{ kind: 'scarf', hp: DURIAN_HP, script: { 1: 'durians' } }], maxRounds: 4, ends: { won: 'escaped', lost: 'escaped', timeout: 'escaped', draw: 'escaped' } }],
    intro: words.intro || [
      'Purple Scarf is home, with a big bag of durians. {S} is trying to get the front door open.',
      "{O} has to keep her busy, alone, until it's open: four rounds.",
    ],
    words: { escaped: words.escaped || 'The front door swings open. {S} and {O} bolt for it.' },
  }),
  // The last fight, on the jetty: the pair and one friend against Green Shirt, Golf Club and Purple Scarf.
  // `friend` is the kind of fighter who was picked (cheetos, socks, mama, scar, thanos, bbc), or nothing;
  // `enc.friend` is that fighter as the party should have it: the game is to add it to the party as it
  // stands. (Thanos took a bad hit from the dogs, and comes into this one hurt.) Won: 'won'. Lost: 'lost',
  // and the story goes back to its checkpoint. Golf Club's first Golf Swing is arranged for his second
  // turn, so that the wind-up is seen while everybody is still standing.
  // words: { before: [[kind, line]], intro: [lines], won, lost }
  finale: (friend, words = {}) => ({
    id: 'finale',
    backdrop: 'jetty',
    friend: friend ? { kind: friend, ...(FINALE_FRIENDS[friend] || {}) } : null,
    phases: [{
      foes: [{ kind: 'green' }, { kind: 'club', script: { 1: 'attack', 2: 'golfswing' } }, { kind: 'scarf' }],
      before: words.before || [
        ['club', 'I know you two. The tabby that walked right up to me on my lawn, and the orange one.'],
        ['club', 'One swing was all it took, that night. I should have made it two.'],
        ['club', "Every evening there are more of you. After tonight there'll be fewer."],
        ['shark', "I never saw it coming, that night. I'll see it this time."],
        ['orca', 'He takes his time over a swing. When he winds up, get in front of us.'],
      ],
    }],
    intro: words.intro || ["Green Shirt, Purple Scarf and Golf Club are on the dock, and they're not going to move."],
    words: {
      won: words.won || 'All three of them have had enough. {names} hold the dock.',
      lost: words.lost || "It's too much. The cats scatter into the dark.",
    },
  }),
};
// Purple Scarf's HP in her flat (see durian above)
export const DURIAN_HP = 180;
// how a friend comes into the last fight, where it is not as they always are
export const FINALE_FRIENDS = {
  thanos: { start: { hp: 80 } }, // of 120, two thirds: the dogs got him (one Groom from Orca makes it 110)
  mama: { look: 'solo' }, // (Babycat stays in the box)
};

// ---------------------------------------------------------------- saving
// One save, in the browser. Storage can be missing or refuse (private
// windows, embedded pages), so everything here is allowed to fail quietly.
const KEY = 'cats8.save.1';
export function readSave() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || 'null');
    return data && data.v === 1 ? data : null;
  } catch {
    return null;
  }
}
export function writeSave(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}
