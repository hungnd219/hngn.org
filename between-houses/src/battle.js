// Battle rules: turn-based, no drawing, no DOM. Any fighters against any
// fighters, up to three a side. Everything that decides a fight is in the
// tables at the top, so it can be rebalanced without touching the logic (and
// simulated in bulk: see design/battle/simulate.mjs).
//
// Every fighter has the light attack. Named cats also have one heavy attack
// of their own and two specials. Attacks have no wait; a cat's two specials
// share one wait.
//
// The maths, in full:
//
//   hit chance = move accuracy - target AGL            (never below 0%)
//              = 100% if the move cannot miss, or the target is Distracted
//                and the move is a light or heavy attack (Headbutt aside)
//   damage     = ATK x move power                      (+/- 10%, rounded up)
//              x 2 if the attacker is Strengthened
//              x 0.5 if the attacker is Weakened
//              x 0.5 if the target is bracing, x 0.25 through Protect
//   Chomp ignores every reduction: Weakened, bracing and Protect.
//
// AGL is a percentage: AGL 25 dodges a quarter of ordinary attacks.
// Nothing is ever a fraction: damage, healing and costs all round up.
//
// Turn order: the side whose fastest cat has the higher AGL when the fight
// starts goes first in every round. It is settled once: Swift, Slowed and
// knock-outs do not change it. All of a side's cats act, then all of the
// other side's. Within a side the order is the player's to choose
// (computer-run cats go fastest first).

import { COPY } from './battle-text.js';

export const RULES = {
  variance: 0.1, // damage rolls between 90% and 110%
  defend: 0.5, // share of damage that gets through a bracing cat
  protect: 0.25, // share that gets through Shark's Protect
  minHit: 0, // a move that its target's AGL outruns cannot land (Bunny Kick, 60%, on anybody Swift)
  cooldown: 2, // turns a cat waits after any special before the next one
  maxSide: 3, // cats on one side at once
  maxRounds: 40, // after this both sides back off: a draw
  infection: 0.08, // share of full HP an Infected cat loses each turn
  snack: 0.04, // share of full HP a Snacking cat regains each turn
  swift: 60, // the AGL of a Swift cat
  slow: 25, // how much AGL a Slowed cat loses
  strong: 2, // damage multiple of a Strengthened cat (at 1.5 neither Yoga nor Enrage paid for itself)
  weak: 0.5, // damage multiple of a Weakened cat
  focus: 0.5, // how often a computer-run cat picks its best target, not a random one
  howlAt: 0.6, // a dog at this share of its HP or less howls for another
  showIntent: true, // opponents show what they will do on their next turn
};

// Conditions, shown as chips beside a cat's health bar. The key is the entry
// in the fighter's `st`; icon is a 7 x 7 drawing; bad ones are what Cure
// lifts. Colours: greens are boosts, pinks are their opposites. Their names
// and descriptions are in battle-text.js.
export const STATUS = {
  distracted: {
    colour: '#8fc1ff', bad: true,
    icon: ['..###..', '.#...#.', '.....#.', '....#..', '...#...', '.......', '...#...'],
  },
  spooked: {
    colour: '#e4e2ee', bad: true,
    icon: ['.#####.', '#######', '#.###.#', '#######', '#######', '#######', '#.#.#.#'],
  },
  infected: {
    colour: '#c3a0f2', bad: true,
    icon: ['.#####.', '#.....#', '#.###.#', '#.#.#.#', '#.#...#', '#.#####', '#......'],
  },
  // (Hiss: no bracing and no Protect, and a guard that is up comes down)
  rattled: {
    colour: '#f3c58e', bad: true,
    icon: ['#.....#', '.#...#.', '..#.#..', '...#...', '..#.#..', '.#...#.', '#.....#'],
  },
  weak: {
    colour: '#ff9db0', bad: true,
    icon: ['.......', '.......', '#######', '#######', '#######', '.......', '.......'],
  },
  slowed: {
    colour: '#f7b49a', bad: true,
    icon: ['..###..', '..###..', '..###..', '#######', '.#####.', '..###..', '...#...'],
  },
  swift: {
    colour: '#8fe6c2',
    icon: ['...#...', '..###..', '.#####.', '#######', '..###..', '..###..', '..###..'],
  },
  strong: {
    colour: '#b5e37c',
    icon: ['..###..', '..###..', '#######', '#######', '#######', '..###..', '..###..'],
  },
  snacking: {
    colour: '#f6d868',
    icon: ['.##.##.', '#######', '#######', '#######', '.#####.', '..###..', '...#...'],
  },
};
for (const k in STATUS) Object.assign(STATUS[k], COPY.conditions[k]); // names and descriptions: battle-text.js
const BAD = Object.keys(STATUS).filter((k) => STATUS[k].bad);
const badKeys = (f) => BAD.filter((k) => f.st[k]);

// kind: light | heavy | special | defend. power: multiple of ATK. accuracy:
// chance to land before the target's AGL (sure: it cannot miss). status:
// [key, turns] pairs put on the target if the move lands (turns true: until
// something ends it). fx: anything else the move does (see act()). The words
// for each move (name, text, hint, brief, verb) are in battle-text.js.
export const MOVES = {
  attack: { kind: 'light', power: 1, accuracy: 1 },
  defend: { kind: 'defend', self: true, fx: 'guard' },
  // Shark
  chomp: { kind: 'heavy', power: 1.5, accuracy: 0.75, pierce: true },
  sing: { kind: 'special', sure: true, status: [['distracted', true]] }, // (until an attack lands on it: no count of turns)
  protect: { kind: 'special', self: true, fx: 'cover' },
  // Orca
  kick: { kind: 'heavy', power: 2, accuracy: 0.6 },
  groom: { kind: 'special', ally: true, fx: 'heal', heal: 0.25 }, // (all the way to full HP: the cap at 80% is gone)
  yoga: { kind: 'special', self: true, fx: 'yoga' },
  // Thanos
  rampage: { kind: 'heavy', self: true, fx: 'charge', power: 1.5, accuracy: 0.9 },
  stomp: { kind: 'heavy', power: 1.5, accuracy: 0.9 }, // the second half of Rampage, once per opponent
  // (notHumans: a move that does nothing to a person. A cat looming over a man with a golf club does not frighten him.)
  intimidate: { kind: 'special', sure: true, notHumans: true, status: [['spooked', 2], ['weak', true]] },
  summon: { kind: 'special', self: true, fx: 'summon', summons: 'stray', as: { hp: 25, agl: 5 }, limit: 1 },
  // Scar
  lowblow: { kind: 'heavy', power: 1, bonus: 1.5, accuracy: 0.9 },
  infect: { kind: 'special', accuracy: 0.9, status: [['infected', 4]] },
  stealth: { kind: 'special', self: true, fx: 'stealth', cost: 0.25, limit: 1 },
  // Cheetos
  flurry: { kind: 'heavy', power: 0.7, hits: 3, accuracy: 0.75 },
  // (the whole side is Swift for those turns; when it runs out, everybody who had it is Slowed for a turn)
  zoomies: { kind: 'special', self: true, fx: 'zoom', turns: 2, crash: 2 },
  energy: { kind: 'special', ally: true, other: true, fx: 'energy' },
  // Socks
  trip: { kind: 'heavy', power: 0.5, accuracy: 0.9, status: [['slowed', 2]] },
  ninelives: { kind: 'special', ally: true, downed: true, fx: 'revive', heal: 0.5, limit: 1 },
  ghost: { kind: 'special', sure: true, fx: 'vanish' },
  spook: { sure: true, status: [['spooked', 2]] }, // what Ghost cat does to its target
  // Mamacat (with Babycat)
  charm: { kind: 'heavy', power: 0.5, accuracy: 0.8, notHumans: true, status: [['weak', true]] },
  cure: { kind: 'special', self: true, fx: 'cure' },
  leftovers: { kind: 'special', self: true, fx: 'snack', turns: 3 },
  // BBC
  headbutt: { kind: 'heavy', accuracy: 0.5, fx: 'half', blind: true },
  enrage: { kind: 'special', self: true, fx: 'enrage', cost: 0.5, limit: 1 },
  // Flower: she takes away what the other side was counting on. Hiss leaves its target unable to
  // brace or Protect (and brings down a guard that is up); Pounce hits harder on a cat with no guard
  // to put up; Snub strips one foe's boosts (Strengthened unless it is for good, a stretch that has
  // not paid off yet, Swift from the Zoomies, Snacking).
  pounce: { kind: 'heavy', power: 1.3, accuracy: 0.75, bonus: 1.5, bonusOn: 'rattled' },
  hiss: { kind: 'special', accuracy: 1, status: [['rattled', 2]] },
  snub: { kind: 'special', sure: true, fx: 'strip' },
  // Dog: a Bark shuts a cat's best moves off. And a dog that is losing (RULES.howlAt of its HP or
  // less) Howls, and another dog comes running: once a fight for each side, and only while there is
  // room. So a dog has to be finished quickly or left alone, and two dogs are soon three.
  lunge: { kind: 'heavy', power: 1.5, accuracy: 0.8 },
  bark: { kind: 'special', sure: true, status: [['spooked', 2]] },
  howl: { kind: 'special', self: true, fx: 'summon', summons: 'dog', as: { hp: 60, atk: 15 }, sideLimit: 1, when: 'hurt' }, // (the one that comes is a smaller dog)
  // Snake
  venom: { kind: 'special', power: 0.5, accuracy: 1, status: [['infected', 4]] },
  // The three humans (the story's only: see STORY_FIGHTERS). Each has the light attack, which for
  // them is a kick, and one move of their own.
  // Purple Scarf: a durian thrown at one cat. If it lands he is Infected, and she is Snacking
  // (she alone: selfSnack is how many turns).
  durians: { kind: 'special', power: 0.5, accuracy: 0.9, status: [['infected', 4]], selfSnack: 3 },
  // Green Shirt: a ball paddled at every opponent, a roll each. Whoever is hit is Spooked.
  pickleball: { kind: 'special', all: true, fx: 'volley', power: 0.5, accuracy: 0.7, status: [['spooked', 2]] },
  // Golf Club: a bigger Rampage. He winds up for TWO of his turns (windup), and then the club comes
  // round at every opponent in reach (release: the move that lands). Spooking him while he winds
  // up calls it off; Protect takes all of it, at a quarter. After one, he needs `rest` turns
  // before he can start another.
  golfswing: { kind: 'heavy', self: true, fx: 'charge', windup: 2, release: 'swing', rest: 2 },
  swing: { kind: 'heavy', power: 3.5, sure: true }, // what lands at the end of it, once per opponent: it cannot miss
};

for (const id in MOVES) Object.assign(MOVES[id], COPY.moves[id]); // names and descriptions: battle-text.js

// heavy: the cat's own heavy attack. pro: he / she / it, for the commentary.
// minor: leaves for good when beaten (cannot be revived, and frees its place).
export const FIGHTERS = {
  // (the pair as the story leaves them when nothing has been earned on the way: the top of the ladder in
  // story.js. The story's gains would make them too strong for Battle mode: design/battle/pair.mjs.)
  shark: { name: 'Shark', hp: 66, atk: 9, agl: 10, heavy: 'chomp', specials: ['sing', 'protect'], pro: 'he' },
  orca: { name: 'Orca', hp: 33, atk: 10, agl: 25, heavy: 'kick', specials: ['groom', 'yoga'], pro: 'he' },
  thanos: { name: 'Thanos', hp: 120, atk: 16, agl: 0, heavy: 'rampage', specials: ['intimidate', 'summon'], pro: 'he' },
  scar: { name: 'Scar', hp: 52, atk: 9, agl: 20, heavy: 'lowblow', specials: ['infect', 'stealth'], pro: 'she' },
  cheetos: { name: 'Cheetos', hp: 40, atk: 7, agl: 45, heavy: 'flurry', specials: ['zoomies', 'energy'], pro: 'he' },
  socks: { name: 'Socks', hp: 34, atk: 9, agl: 30, heavy: 'trip', specials: ['ninelives', 'ghost'], pro: 'she' },
  mama: { name: 'Mamacat', hp: 64, atk: 11, agl: 15, heavy: 'charm', specials: ['cure', 'leftovers'], pro: 'she' },
  bbc: { name: 'BBC', hp: 95, atk: 8, agl: 5, heavy: 'headbutt', specials: ['intimidate', 'enrage'], pro: 'he' },
  // (well kept: her owner has always just fed her, so she comes into every fight Snacking)
  flower: { name: 'Flower', hp: 48, atk: 10, agl: 40, heavy: 'pounce', specials: ['hiss', 'snub'], pro: 'she' },
  // (many: a side may have more than one of them: dogs, rats and snakes)
  dog: { name: 'Dog', hp: 90, atk: 18, agl: 5, heavy: 'lunge', specials: ['bark', 'howl'], pro: 'it', minor: true, many: true },
  stray: { name: 'Stray', hp: 36, atk: 8, agl: 15, specials: [], pro: 'it', minor: true },
  rat: { name: 'Rat', hp: 14, atk: 5, agl: 20, specials: [], pro: 'it', minor: true, many: true },
  snake: { name: 'Snake', hp: 26, atk: 9, agl: 25, specials: ['venom'], pro: 'it', minor: true, many: true },
};

// Fighters that only the story meets: not in the picker.
//
// The three who cannot stand cats. A human has a great deal of HP (it stands for their nerve:
// nobody is hurt) and next to no AGL, kicks for a light attack, and has one move of their own.
// Golf Club is the hardest to wear down, and Purple Scarf the easiest. (Her ATK is as low as it
// is so that, alone against Orca for four rounds in her flat, she cannot put him down: see
// design/battle/act3.mjs, which also has the numbers of the last fight.)
//
// The robot vacuum.
// AGL 60: Orca's Bunny Kick (60%) cannot land on it unless it is Distracted,
// and nothing else lands often. redock: back at full HP as soon as a hit has
// landed and it is still standing, and at the start of each of its turns: so
// only a single hit as big as its whole HP beats it. Between them, the two are
// the lock that needs both of the TV's lessons: Sing for the kick to land, Big
// Stretch for it to be big enough.
// mindless: it only ever attacks (a robot that braced would shrug off the one
// hit that can beat it).
// Its HP is the lock: Orca's Bunny Kick after a Big Stretch does at least 36
// at his lowest ATK and the lowest roll (10 x 2 x 2 x 0.9), and no single hit
// without the stretch does more than 29 at his highest (13 x 2 x 1.1).
export const STORY_FIGHTERS = {
  scarf: { hp: 100, atk: 5, agl: 0, specials: ['durians'], pro: 'she', human: true, ...COPY.fighters.scarf },
  green: { hp: 105, atk: 8, agl: 5, specials: ['pickleball'], pro: 'he', human: true, ...COPY.fighters.green },
  club: { hp: 150, atk: 10, agl: 0, heavy: 'golfswing', specials: [], pro: 'he', human: true, ...COPY.fighters.club },
  robot: { hp: 33, atk: 6, agl: 60, specials: [], pro: 'it', redock: true, mindless: true, ...COPY.fighters.robot },
};

// how opponents choose: relative weights (a special on cooldown is skipped)
export const AI = { attack: 5, special: 3, defend: 2 };

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const isAttack = (m) => m.kind === 'light' || m.kind === 'heavy';
const hurts = (m) => m.power > 0 || m.fx === 'half';

// a cat's AGL right now: Swift sets a floor, Slowed takes a flat bite out of it
export function aglOf(f) {
  const a = f.hidden || f.zoom > 0 ? Math.max(f.agl, RULES.swift) : f.agl;
  return f.st.slowed ? Math.max(0, a - RULES.slow) : a;
}
// How sure a move is, in words. The number in the tables is before the
// target's AGL comes off, so the menus do not quote it.
// One rule for every move of every fighter (ACCURACY): 95% or more is very high (the light attack is:
// it is never the worse bet), 85% or more is high, 70% or more is medium, anything under that is low;
// a move marked `sure` cannot miss whatever the target's AGL. No fighter's heavy attack is in the same
// band as his light one, so the menu never makes the stronger of two attacks look free.
export const ACCURACY = { veryHigh: 0.95, high: 0.85, medium: 0.7 };
export const accuracyTier = (move) =>
  move.sure ? 'sure' : move.accuracy == null ? '' : move.accuracy >= ACCURACY.veryHigh ? 'veryHigh' : move.accuracy >= ACCURACY.high ? 'high' : move.accuracy >= ACCURACY.medium ? 'medium' : 'low';
export function accuracyWord(move) {
  const tier = accuracyTier(move);
  return tier ? COPY.accuracy[tier] : '';
}
export function hitChance(move, target) {
  if (move.self || move.ally) return 1;
  if (move.sure) return 1;
  if (target.st.distracted && isAttack(move) && !move.blind) return 1;
  return clamp(move.accuracy - aglOf(target) / 100, RULES.minHit, 1);
}
const blockOf = (t) => (t.covering ? RULES.protect : t.defending ? RULES.defend : 1);
// the damage one hit of a move would do before the +/- roll
export function baseDamage(user, move, target) {
  if (move.fx === 'half') return Math.ceil(target.hp * 0.5 * (user.st.weak ? RULES.weak : 1) * blockOf(target)); // ATK and Strengthened do nothing for it
  let d = user.atk * (move.power || 0) * (user.st.strong ? RULES.strong : 1);
  if (move.bonus && (move.bonusOn ? target.st[move.bonusOn] : badKeys(target).length)) d *= move.bonus;
  if (move.pierce) return d;
  return d * (user.st.weak ? RULES.weak : 1) * blockOf(target);
}
// how much a healing move would restore
export function healAmount(move, target) {
  if (move.downed) return Math.ceil(target.max * move.heal);
  return Math.max(0, Math.min(Math.ceil(target.max * move.heal), Math.floor(target.max * (move.cap || 1)) - target.hp));
}

// left and right are lists of { kind, name?, ... }: kind is a key of
// FIGHTERS (or STORY_FIGHTERS), the rest overrides its stats. `start` sets how
// a fighter comes in: { hp, st: { weak: true, snacking: 3 }, strongPerm }.
// Two things let the story arrange a moment in a fight:
//   script  a computer-run fighter's move on a given one of its own turns:
//           { 2: 'zoomies', 4: { id: 'trip', on: 'orca' } } (`on`: the kind of
//           fighter to aim at, if it is there; `lands: true`: it cannot miss,
//           whatever the odds). If the move cannot be used
//           when the turn comes, it chooses for itself as usual.
//   fate    how the first light or heavy attacks aimed at this fighter come
//           out, whatever the odds: ['miss', 'hit'] (not counted while it is
//           Distracted, when nothing misses anyway; a 'hit' waits for an attack
//           with better than 0% of landing).
// The left side is 'party' (the player's), the right side 'foes'.
// opts.maxRounds: the fight stops after that many rounds (over: 'timeout').
// opts.key: a kind of foe; the fight is won as soon as none of that kind is standing.
export function createBattle(left, right, rng = Math.random, opts = {}) {
  // phases: the sides still to act this round; cur: the side acting now and
  // which of its cats have not acted yet
  const all = [];
  const mk = (f, side) => {
    const base = FIGHTERS[f.kind] || STORY_FIGHTERS[f.kind];
    const hp = f.hp || base.hp;
    const taken = all.filter((o) => o.side === side && !o.gone).map((o) => o.slot);
    const slot = [0, 1, 2].find((i) => !taken.includes(i));
    const n = { ...base, ...f, side, slot, max: hp, hp, cd: 0, turns: 0, st: {}, used: {}, zoom: 0, hidden: false, strongPerm: false, defending: false, covering: false, vanished: false, charging: 0, rest: 0, warm: false, gone: false, intent: null };
    delete n.start;
    n.fate = f.fate ? f.fate.slice() : null;
    // (how it comes in: the fight's own word on that, or else the fighter's)
    const start = f.start || base.start;
    if (start) {
      if (start.hp != null) n.hp = Math.max(0, Math.min(hp, start.hp));
      n.st = { ...(start.st || {}) };
      n.strongPerm = !!start.strongPerm;
    }
    all.push(n);
    return n;
  };
  left.forEach((f) => mk(f, 'party'));
  right.forEach((f) => mk(f, 'foes'));
  const side = (s) => all.filter((f) => f.side === s && !f.gone);
  const alive = (list) => list.filter((f) => f.hp > 0 && !f.gone);
  const allies = (f) => alive(side(f.side));
  const enemies = (f) => alive(side(f.side === 'party' ? 'foes' : 'party')).filter((e) => !e.vanished);
  const pick = (list) => list[Math.floor(rng() * list.length)];
  let phases = [];
  let order = null;
  let cur = null;
  let round = 0;
  let over = null; // 'won' (left side) | 'lost' | 'draw'
  const sideUsed = { party: {}, foes: {} }; // moves a side may only make so many times in a fight (Howl)

  const ready = (f) => f.specials.length > 0 && f.cd === 0 && !f.st.spooked;
  // what Snub would take off a cat: its boosts, as long as they are not there for good
  const boosts = (o) => [
    ...(o.st.strong && !o.strongPerm ? ['strong'] : []),
    ...(o.warm ? ['warm'] : []),
    ...(o.st.swift && !o.hidden ? ['swift'] : []),
    ...(o.st.snacking ? ['snacking'] : []),
  ];

  // who a move can be aimed at: null for a move with no target
  function targets(f, id) {
    const m = MOVES[id];
    if (m.self || m.all) return null;
    if (m.downed) return side(f.side).filter((o) => o.hp <= 0);
    if (m.ally) return allies(f).filter((o) => !(m.other && o === f) && !o.vanished);
    return enemies(f).filter((o) => !(m.notHumans && o.human));
  }
  // null if the move can be used now, else the reason it cannot (a short line)
  function blocked(f, id, soon) {
    const m = MOVES[id];
    if (f.st.spooked && (m.kind === 'heavy' || m.kind === 'special')) return COPY.blocked.spooked;
    if (f.st.rattled && (m.fx === 'guard' || m.fx === 'cover')) return COPY.blocked.rattled;
    if (m.kind === 'special' && f.cd > (soon ? 1 : 0)) return f.cd === 1 ? COPY.blocked.waitOne : COPY.blocked.wait.replace('{n}', f.cd);
    if (m.limit && (f.used[id] || 0) >= m.limit) return COPY.blocked.used;
    if (m.sideLimit && (sideUsed[f.side][id] || 0) >= m.sideLimit) return COPY.blocked.used;
    switch (m.fx) {
      case 'heal': return targets(f, id).some((o) => healAmount(m, o) > 0 || (o !== f && badKeys(o).length)) ? null : COPY.blocked.heal;
      case 'energy': return targets(f, id).some((o) => o.cd > 0) ? null : COPY.blocked.energy;
      case 'revive': return targets(f, id).length ? null : COPY.blocked.revive;
      case 'cure': return allies(f).some((o) => badKeys(o).length) ? null : COPY.blocked.cure;
      case 'summon': return side(f.side).length < RULES.maxSide ? null : COPY.blocked.summon;
      case 'yoga': return f.st.strong || f.warm ? COPY.blocked.yoga : null;
      case 'strip': return targets(f, id).some((o) => boosts(o).length) ? null : COPY.blocked.snub;
      case 'charge': return f.rest > 0 ? (f.rest === 1 ? COPY.blocked.waitOne : COPY.blocked.wait.replace('{n}', f.rest)) : enemies(f).length ? null : COPY.blocked.reach;
      case 'volley': return enemies(f).length ? null : COPY.blocked.reach;
      default: return m.self || targets(f, id).length ? null : m.notHumans && enemies(f).length ? COPY.blocked.human : COPY.blocked.reach;
    }
  }

  // ---- turn order
  const byAgl = (a, b) => aglOf(b) - aglOf(a) || a.slot - b.slot;
  function sideOrder() {
    const fastest = (x) => Math.max(-1, ...alive(side(x)).map(aglOf));
    return fastest('foes') > fastest('party') ? ['foes', 'party'] : ['party', 'foes']; // ties go to the left side
  }

  // ---- computer-run cats
  // what the story has arranged for this fighter's next turn, if anything (and if it can be done)
  function scripted(f) {
    const e = f.script && f.script[f.turns + 1];
    if (!e) return null;
    const id = typeof e === 'string' ? e : e.id;
    if (blocked(f, id)) return null;
    const m = MOVES[id];
    if (m.self || m.all) return { id, target: f };
    const list = targets(f, id) || [];
    const lacks = (o) => !m.status || m.status.some(([k]) => !o.st[k]);
    const target = (e.on && list.find((o) => o.kind === e.on)) || list.find(lacks) || list[0];
    return target ? { id, target } : null;
  }
  // The kind of move it will make next turn (and shows, over its head).
  function plan(f) {
    const s = scripted(f);
    if (s) return MOVES[s.id].kind === 'special' ? 'special' : MOVES[s.id].kind === 'defend' ? 'defend' : 'attack';
    if (f.mindless || f.charging || f.warm || (f.st.strong && !f.strongPerm)) return 'attack'; // no wasting a wind-up
    if (f.human) {
      // A human does not brace for a cat, and uses what they have whenever it is ready and worth the turn.
      // One with something to throw at everybody (Pickleball) keeps it for a friend's wind-up: thrown the
      // turn before a Golf Swing lands, it leaves a frightened cat unable to Protect, Groom, Cure or Trip.
      const ready = (id) => f.cd <= 1 && !!aim(f, id, true);
      const volley = f.specials.find((id) => MOVES[id].fx === 'volley');
      const swinger = volley && allies(f).find((o) => o !== f && o.heavy && MOVES[o.heavy].fx === 'charge');
      if (swinger) return swinger.charging && ready(volley) ? 'special' : 'attack';
      return f.specials.some(ready) ? 'special' : 'attack';
    }
    // (a dog that is losing howls as soon as it can)
    if (f.cd <= 1 && !f.st.spooked && f.specials.some((id) => MOVES[id].when === 'hurt' && aim(f, id, true))) return 'special';
    const w = { attack: AI.attack, defend: f.st.rattled || f.human ? 0 : AI.defend }; // (a human does not brace for a cat)
    if (enemies(f).some((o) => o.charging === 1)) w.defend *= 4; // something big is coming (and lands before its next turn)
    if (f.cd <= 1 && f.specials.some((id) => aim(f, id, true))) w.special = AI.special; // ready by then, and worth it as things stand
    else w.attack += AI.special; // with no special to use, it attacks instead: it does not brace more
    let r = rng() * Object.values(w).reduce((a, b) => a + b, 0);
    for (const [id, n] of Object.entries(w)) if ((r -= n) < 0) return id;
    return 'attack';
  }
  // is this special worth the turn right now, and on whom?
  function aim(f, id, soon) {
    const m = MOVES[id];
    if (blocked(f, id, soon)) return null;
    const frac = (o) => o.hp / o.max;
    const lacking = (o) => (m.status || MOVES.spook.status).some(([k]) => !o.st[k]);
    switch (m.fx) {
      case 'heal': {
        const t = targets(f, id).filter((o) => healAmount(m, o) > 0).sort((a, b) => frac(a) - frac(b))[0];
        return t && frac(t) <= 0.65 ? t : null;
      }
      case 'snack': return allies(f).some((o) => !o.st.snacking && frac(o) < 0.75) ? f : null;
      case 'energy': return targets(f, id).filter((o) => o.cd > 1).sort((a, b) => b.cd - a.cd)[0];
      case 'revive': return pick(targets(f, id));
      case 'zoom': return f.zoom > 0 ? null : f;
      case 'yoga': return frac(f) >= 0.4 ? f : null;
      // (a howl is for a dog that is losing)
      case 'summon': return m.when === 'hurt' && frac(f) > RULES.howlAt ? null : f;
      case 'strip': {
        // whoever has the most to lose (a doubled hit that is on its way, above all)
        const t = targets(f, id).filter((o) => boosts(o).length).sort((a, b) => boosts(b).length + (b.st.strong || b.warm ? 2 : 0) - boosts(a).length - (a.st.strong || a.warm ? 2 : 0))[0];
        return t || null;
      }
      case 'enrage': return frac(f) <= 0.3 ? f : null; // the last throw of the dice
      case 'volley': return enemies(f).some(lacking) ? f : null; // (somebody over there is still to be spooked)
      case 'cure': {
        // not for a trifle: something that bites, or a pile of small things
        const n = allies(f).reduce((a, o) => a + badKeys(o).length + (o.st.infected > 1 || o.st.weak ? 1 : 0), 0);
        return n >= 2 ? f : null;
      }
      case 'cover': {
        // for a friend who is hurting; alone, only when something big is on its way
        const coming = enemies(f).some((o) => o.charging === 1 || o.warm || (o.st.strong && !o.strongPerm));
        return (allies(f).length === 1 ? coming : allies(f).some((o) => o !== f && frac(o) < 0.7)) ? f : null;
      }
      default: {
        if (m.self) return f;
        const foes = targets(f, id);
        // calling off a Rampage comes first
        const winding = foes.some((o) => o.covering) ? [] : foes.filter((o) => o.charging); // (a protector would take it instead)
        if (winding.length && (m.status || MOVES.spook.status).some(([k]) => k === 'spooked')) return pick(winding);
        let list = foes.filter(lacking);
        if (m.fx === 'vanish') {
          // only worth a turn on a cat that leans on what it takes away
          list = list.filter((o) => lean(o) >= 0.5).sort((a, b) => lean(b) - lean(a)).slice(0, 1);
          if (allies(f).length === 1) list = [];
        }
        if (id === 'intimidate') {
          // alone, it only pays against a cat that hits harder than he does
          const mine = f.atk * (f.st.strong ? RULES.strong : 1);
          list = list.filter((o) => !o.st.weak && (allies(f).length > 1 || o.atk * (o.st.strong ? RULES.strong : 1) >= mine * 1.25));
        }
        if (id === 'sing') {
          // worth a turn against a dodger, or when a wound-up friend is waiting on it
          const primed = allies(f).some((o) => o !== f && (o.warm || o.st.strong));
          list = list.filter((o) => primed || aglOf(o) >= 30);
        }
        if (id === 'infect') list.sort((a, b) => b.max - a.max).splice(1); // it bites deepest into the biggest
        if (id === 'durians') {
          // ...and so do these: whoever stands to lose most, for the chance that it lands
          const bite = (o) => Math.ceil(o.max * RULES.infection) * hitChance(m, o);
          list.sort((a, b) => bite(b) - bite(a)).splice(1);
        }
        if (id === 'hiss') {
          // a guard that is up comes first; then whoever can Protect; then anybody, since Pounce pays on it
          const up = list.filter((o) => o.defending || o.covering);
          const able = list.filter((o) => o.specials.includes('protect'));
          list = up.length ? up : able.length ? able : list;
        }
        if (id === 'bark') list = list.filter((o) => o.heavy || o.specials.length); // (nothing to shut off in a cat with only a swipe)
        return list.length ? pick(list) : null;
      }
    }
  }
  // a move that is wound up first (Rampage, Golf Swing): what lands at the end of it, and how
  // many turns the whole thing takes
  const landing = (id) => (MOVES[id].fx === 'charge' ? MOVES[MOVES[id].release || 'stomp'] : MOVES[id]);
  const turnsOf = (id) => (MOVES[id].fx === 'charge' ? (MOVES[id].windup || 1) + 1 : 1);
  // what an attack is worth on a target: the damage to expect, plus a little
  // for what it leaves behind
  function worth(f, id, t) {
    const m = landing(id);
    const chance = hitChance(m, t);
    const first = Math.min(t.hp, baseDamage(f, m, t));
    let v = chance * first;
    if (m.hits) v += (m.hits - 1) * clamp(m.accuracy - aglOf(t) / 100, RULES.minHit, 1) * first;
    for (const [k] of m.status || []) {
      if (t.st[k]) continue;
      if (k === 'slowed') v += aglOf(t) >= 20 ? chance * f.atk * 0.6 : 0;
      if (k === 'weak') v += chance * t.atk * (t.st.strong ? RULES.strong : 1) * 0.3;
    }
    if (id !== 'charm' && t.st.weak) v -= t.atk * 0.25; // hitting a Weakened cat wakes it up
    return v;
  }
  // how much a cat leans on what Spooked takes away: its heavy attack, as a
  // share of what its light attack does, and a little for having specials
  function lean(t) {
    const foes = enemies(t);
    if (!foes.length) return 0;
    let v = t.specials.length ? 0.3 : 0;
    if (!t.heavy) return v;
    const light = worth(t, 'attack', foes[0]);
    const heavy = MOVES[t.heavy].fx === 'charge' ? foes.reduce((a, o) => a + worth(t, t.heavy, o), 0) / turnsOf(t.heavy) : worth(t, t.heavy, foes[0]);
    return v + Math.max(0, heavy - light) / Math.max(1, light);
  }
  function attackWith(f) {
    const foes = enemies(f);
    const ids = ['attack', ...(f.heavy && !blocked(f, f.heavy) ? [f.heavy] : [])];
    const best = (list) => {
      let top = null;
      for (const t of list)
        for (const id of ids) {
          // a Rampage takes two turns and lands on everybody (and a Golf Swing three)
          const wound = MOVES[id].fx === 'charge';
          const v = (wound ? foes.reduce((a, o) => a + worth(f, id, o), 0) / turnsOf(id) : worth(f, id, t)) * (0.85 + rng() * 0.3);
          if (!top || v > top.v) top = { v, id, target: wound ? f : t };
        }
      return top;
    };
    return best(rng() < RULES.focus ? foes : [pick(foes)]);
  }
  // what a computer-run cat does this turn: the kind of move it showed, aimed sensibly
  function choose(f) {
    const s = scripted(f);
    if (s) return s;
    let kind = f.intent || plan(f);
    if (kind === 'special' && ready(f)) {
      const usable = f.specials.map((id) => ({ id, target: aim(f, id) })).filter((c) => c.target);
      const urgent = usable.filter((c) => MOVES[c.id].when === 'hurt');
      if (usable.length) return pick(urgent.length ? urgent : usable);
    }
    if ((kind === 'defend' && !blocked(f, 'defend')) || !enemies(f).length) return { id: 'defend', target: f };
    const a = attackWith(f);
    return { id: a.id, target: a.target };
  }

  // Is the fight over? A side with nobody standing loses, unless it has a
  // Socks who has not spent her Nine lives: then she gets back up, once.
  function check(ev) {
    if (over) return over;
    for (const s of ['party', 'foes']) {
      if (alive(side(s)).length) continue;
      const cat = side(s).find((f) => f.specials.includes('ninelives') && !f.used.ninelives);
      if (!cat) continue;
      cat.used.ninelives = 1;
      cat.hp = healAmount(MOVES.ninelives, cat);
      if (cat.side === 'foes') cat.intent = plan(cat);
      ev.push({ t: 'secondwind', who: cat, amount: cat.hp });
    }
    // (opts.key: a fight that is won the moment that one foe is down, whoever else is still standing)
    if (!alive(side('foes')).length || (opts.key && !alive(side('foes')).some((f) => f.kind === opts.key))) over = 'won';
    else if (!alive(side('party')).length) over = 'lost';
    if (over) ev.push({ t: 'over', result: over });
    return over;
  }
  // every condition goes when its carrier does
  function knockOut(t, ev) {
    t.st = {};
    t.zoom = t.cd = 0;
    t.hidden = t.strongPerm = false;
    t.defending = t.covering = t.vanished = t.warm = false;
    t.charging = 0;
    if (t.minor) t.gone = true;
    ev.push({ t: 'ko', who: t });
  }
  // things that wear off at the end of a cat's own turn
  function endTurn(f) {
    for (const k of ['distracted', 'spooked', 'slowed', 'weak', 'rattled']) { // (Weakened only counts down if a move gives it a number of turns)
      if (f.fresh && f.fresh.includes(k)) continue; // only just taken on (Groom): it starts counting next turn
      if (typeof f.st[k] === 'number' && --f.st[k] <= 0) delete f.st[k];
    }
    f.fresh = null;
    f.turns++;
    if (f.rest > 0 && !f.charging) f.rest--;
    if (f.side === 'foes' && f.hp > 0) f.intent = plan(f);
  }
  // A wind-up has begun or been called off: the humans beside whoever it is think again about their next
  // turn (somebody may have been keeping a throw for it), and their thought bubbles change with it.
  function rethink(f) {
    if (f.side !== 'foes') return;
    for (const o of allies(f)) if (o !== f && o.human && !o.charging) o.intent = plan(o);
  }
  // a wind-up is knocked off: by a fright (Spooked), or by a Trip that lands
  function callOffWindUp(target, ev) {
    if (!target.charging) return;
    target.charging = 0;
    target.rest = target.restAfter || 0;
    ev.push({ t: 'fizzle', who: target });
    rethink(target);
  }
  function afflict(f, target, key, turns, ev) {
    // (a person is not frightened by a cat, and is not put off their stroke by one: no Spooked, no Weakened)
    if (target.human && (key === 'spooked' || key === 'weak')) return;
    // (a move that trips: whatever its target was winding up is off, whatever it is)
    if (key === 'slowed' && f !== target) callOffWindUp(target, ev);
    const had = target.st[key];
    target.st[key] = turns === true || had === true ? true : Math.max(had || 0, turns);
    ev.push({ t: 'status', who: f, target, key });
    if (key === 'rattled' && (target.defending || target.covering)) {
      // a guard that is up comes down
      target.defending = target.covering = false;
      ev.push({ t: 'unguard', who: target });
    }
    if (key !== 'spooked') return;
    callOffWindUp(target, ev);
    if (target.intent === 'special') target.intent = 'attack';
  }
  // one roll of a move against one target; true if it landed
  function strike(f, m, target, ev) {
    const chance = hitChance(m, target);
    // (the story may have settled how the first attacks on this one come out, or that the move it has
    // arranged for this turn lands: `lands` on a script entry)
    const due = f.script && f.script[f.turns + 1];
    // (a fated hit waits for an attack that could have landed: one that shows 0% and lands would look like a fault)
    const fate = isAttack(m) && !target.st.distracted && target.fate && target.fate.length && !(target.fate[0] === 'hit' && chance <= 0);
    const fated = due && due.lands && MOVES[due.id] === m ? 'hit' : fate ? target.fate.shift() : null;
    if (fated ? fated === 'miss' : rng() >= chance) {
      ev.push({ t: 'miss', who: f, target, soft: !hurts(m), dodged: rng() < aglOf(target) / 100 / Math.max(0.01, 1 - chance) });
      return false;
    }
    if (hurts(m)) {
      // Every attack that lands on a Distracted target uses the distraction up (only a move that could not
      // have missed anyway leaves it be). That goes for a blind one too (Headbutt, eyes shut), which gets
      // nothing from it: it used to leave Distracted where it was, so one Sing served the kick after it as well.
      const distracted = !!target.st.distracted && isAttack(m) && !m.sure;
      const aimed = distracted && !m.blind;
      const base = baseDamage(f, m, target);
      const dmg = Math.max(1, m.fx === 'half' ? base : Math.ceil(base * (1 - RULES.variance + rng() * 2 * RULES.variance)));
      target.hp = Math.max(0, target.hp - dmg);
      const lost = [];
      if (distracted) lost.push('distracted');
      if (target.st.weak) lost.push('weak');
      if (target.st.strong && !target.strongPerm) lost.push('strong');
      for (const k of lost) delete target.st[k];
      ev.push({ t: 'hit', who: f, target, dmg, sure: aimed, blocked: !m.pierce && (target.defending || target.covering), pierced: !!m.pierce && (target.defending || target.covering), lost });
      if (target.hp <= 0) {
        knockOut(target, ev);
        return true;
      }
    }
    for (const [key, turns] of m.status || []) afflict(f, target, key, turns, ev);
    return true;
  }
  // a protecting cat steps in front of whatever was meant for its friend
  function redirect(target, ev) {
    const cover = alive(side(target.side)).find((g) => g.covering && g !== target && !g.vanished);
    if (!cover) return target;
    ev.push({ t: 'cover', who: cover, target });
    return cover;
  }
  // the second half of Rampage (or the end of a Golf Swing): one roll at every opponent in reach
  function release(f, ev) {
    const id = f.releaseId || 'stomp';
    f.charging = 0;
    cur.left = cur.left.filter((x) => x !== f);
    const list = enemies(f);
    ev.push({ t: 'move', who: f, id, move: MOVES[id], target: list[0] || f, all: true });
    for (const o of list) {
      if (o.hp <= 0) continue;
      const t = redirect(o, ev);
      if (t.hp > 0) strike(f, MOVES[id], t, ev);
    }
    endTurn(f);
    f.rest = f.restAfter || 0;
    check(ev);
  }
  // ...and a wind-up that takes more than one turn: this turn goes on winding
  function wind(f, ev) {
    f.charging--;
    cur.left = cur.left.filter((x) => x !== f);
    ev.push({ t: 'wind', who: f });
    endTurn(f);
  }

  // A side's turn begins: stances drop, waits tick down, infections bite and
  // snacks are nibbled, a stretch pays off, a vanished cat comes back and a
  // charged Rampage lands. Whoever is left may then act in any order.
  function startPhase(ev) {
    if (!phases.length) {
      if (++round > (opts.maxRounds || RULES.maxRounds)) {
        over = opts.maxRounds ? 'timeout' : 'draw';
        round--;
        ev.push({ t: 'over', result: over });
        return;
      }
      if (!order) order = sideOrder(); // settled at the first round, for the whole fight
      phases = order.slice();
    }
    cur = { side: phases.shift(), left: [] };
    cur.left = alive(side(cur.side)).sort(byAgl);
    const crashed = []; // whoever's zoomies ran out this turn
    for (const f of cur.left.slice()) {
      if (over || f.hp <= 0) continue;
      f.defending = f.covering = false;
      if (f.redock && f.hp < f.max) {
        ev.push({ t: 'redock', who: f, amount: f.max - f.hp });
        f.hp = f.max;
      }
      if (f.cd > 0) f.cd--;
      if (f.zoom > 0 && --f.zoom === 0 && !f.hidden) {
        // The zoomies have run out, and they come down hard: Slowed until this turn of theirs and the
        // opponents' next are over. (Otherwise a side could be Swift round after round with no gap.)
        delete f.st.swift;
        if (f.st.slowed !== true) f.st.slowed = Math.max(f.st.slowed || 0, MOVES.zoomies.crash);
        crashed.push(f);
      }
      if (f.st.infected) {
        const dmg = Math.max(1, Math.ceil(f.max * RULES.infection));
        f.hp = Math.max(0, f.hp - dmg);
        if (--f.st.infected <= 0) delete f.st.infected;
        ev.push({ t: 'tick', who: f, dmg });
        if (f.hp <= 0) {
          knockOut(f, ev);
          check(ev);
          continue;
        }
      }
      if (f.st.snacking) {
        const amount = Math.min(f.max - f.hp, Math.max(1, Math.ceil(f.max * RULES.snack)));
        f.hp += amount;
        const last = --f.st.snacking <= 0;
        if (last) delete f.st.snacking;
        if (amount || last) ev.push({ t: 'nibble', who: f, amount, last });
      }
      if (f.warm) {
        // the stretch pays off
        f.warm = false;
        f.st.strong = true;
        ev.push({ t: 'strong', who: f });
      }
      if (f.vanished) {
        // back out of the shadows, with her turn still to take
        f.vanished = false;
        ev.push({ t: 'appear', who: f });
      }
      if (f.charging > 1) wind(f, ev);
      else if (f.charging) release(f, ev);
    }
    const down = crashed.filter((f) => f.hp > 0 && f.st.slowed);
    if (down.length) ev.unshift({ t: 'crash', targets: down });
  }

  // What happens next. Returns either { done: true, events } (play the events,
  // then call begin() again), or { side, ready, who }: the cats on that side
  // that have yet to act this round, fastest first, and the first of them.
  // Any of `ready` may be passed to act().
  function begin() {
    for (let guard = 0; guard < 8 && !over; guard++) {
      if (cur) cur.left = cur.left.filter((f) => f.hp > 0 && !f.gone);
      if (cur && cur.left.length) return { side: cur.side, ready: cur.left.slice(), who: cur.left[0], events: [], done: false };
      const ev = [];
      startPhase(ev);
      if (ev.length) return { who: null, events: ev, done: true };
    }
    return { who: null, events: [], done: true };
  }

  // carry out a move; returns what happened, in order, for the screen to play back
  function act(f, id, target) {
    const m = MOVES[id];
    if (cur) cur.left = cur.left.filter((x) => x !== f);
    const ev = [{ t: 'move', who: f, id, move: m, target }];
    if (m.kind === 'special') f.cd = RULES.cooldown + 1;
    if (m.limit) f.used[id] = (f.used[id] || 0) + 1;
    if (m.sideLimit) sideUsed[f.side][id] = (sideUsed[f.side][id] || 0) + 1;
    switch (m.fx) {
      case 'guard':
      case 'cover':
        f.defending = true;
        f.covering = m.fx === 'cover';
        ev.push({ t: 'stance', who: f, fx: m.fx });
        break;
      case 'heal': {
        const n = healAmount(m, target);
        target.hp += n;
        ev.push({ t: 'heal', who: f, target, amount: n });
        // an ally's troubles come off on his tongue
        const keys = target === f ? [] : badKeys(target);
        if (keys.length) {
          f.fresh = keys.filter((k) => !f.st[k] || (typeof f.st[k] === 'number' && target.st[k] > f.st[k])); // what is new to him counts down from next turn
          for (const k of keys) {
            const v = target.st[k];
            delete target.st[k];
            f.st[k] = v === true || f.st[k] === true ? true : Math.max(f.st[k] || 0, v);
          }
          if (f.st.spooked && f.intent === 'special') f.intent = 'attack';
          ev.push({ t: 'cured', who: target, keys, to: f });
        }
        break;
      }
      case 'revive': {
        const n = healAmount(m, target);
        target.hp = n;
        if (target.side === 'foes') target.intent = plan(target);
        ev.push({ t: 'revive', who: f, target, amount: n });
        break;
      }
      case 'energy':
        target.cd = 0;
        ev.push({ t: 'energy', who: f, target });
        break;
      case 'cure':
        for (const o of allies(f)) {
          const keys = badKeys(o);
          for (const k of keys) delete o.st[k];
          if (keys.length) ev.push({ t: 'cured', who: o, keys });
        }
        break;
      case 'snack': {
        const list = allies(f);
        for (const o of list) o.st.snacking = m.turns;
        ev.push({ t: 'snack', who: f, targets: list });
        break;
      }
      case 'summon': {
        const n = mk({ kind: m.summons, ...(m.as || {}) }, f.side);
        if (n.side === 'foes') n.intent = plan(n);
        ev.push({ t: 'join', who: n, by: f });
        break;
      }
      case 'stealth': {
        const cost = Math.min(f.hp - 1, Math.ceil(f.hp * m.cost)); // rounded up, but it never costs the last point
        f.hp -= cost;
        f.hidden = true;
        f.st.swift = true;
        ev.push({ t: 'stealth', who: f, cost });
        break;
      }
      case 'zoom': {
        // everybody on his side, for his two turns (each one's counts down at the start of their own turns)
        const list = allies(f);
        for (const o of list) {
          o.zoom = m.turns;
          o.st.swift = true;
        }
        ev.push({ t: 'zoom', who: f, targets: list });
        // ...and he clips somebody on the way past
        if (enemies(f).length) {
          const t = pick(enemies(f));
          ev.push({ t: 'move', who: f, id: 'attack', move: MOVES.attack, target: t });
          strike(f, MOVES.attack, redirect(t, ev), ev);
        }
        break;
      }
      case 'strip': {
        const keys = boosts(target);
        for (const k of keys) {
          if (k === 'warm') target.warm = false;
          else delete target.st[k];
        }
        if (keys.includes('swift')) target.zoom = 0;
        ev.push({ t: 'strip', who: f, target, keys });
        break;
      }
      case 'yoga':
        f.warm = true; // it pays off at the start of his next turn, so it cannot be knocked out of him first
        break;
      case 'enrage': {
        const cost = Math.min(f.hp - 1, Math.ceil(f.hp * m.cost)); // rounded up, but it never costs the last point
        f.hp -= cost;
        f.st.strong = true;
        f.strongPerm = true;
        ev.push({ t: 'enrage', who: f, cost });
        break;
      }
      case 'charge':
        // (how many of his turns go by before it lands; what lands; and how long he rests after it)
        f.charging = m.windup || 1;
        f.releaseId = m.release || 'stomp';
        f.restAfter = m.rest || 0;
        ev.push({ t: 'charge', who: f });
        rethink(f);
        break;
      case 'vanish':
        // the spook lands as she goes; she is back at the start of her next turn
        strike(f, MOVES.spook, redirect(target, ev), ev);
        f.vanished = true;
        ev.push({ t: 'vanish', who: f, target });
        break;
      case 'volley':
        // one at every opponent in reach, a roll each (a protecting cat takes the lot)
        ev[0].all = true;
        ev[0].target = enemies(f)[0] || f;
        for (const o of enemies(f)) {
          if (o.hp <= 0) continue;
          const t = redirect(o, ev);
          if (t.hp > 0) strike(f, m, t, ev);
        }
        break;
      default: {
        // something aimed at the other side, once or several times over
        const t = redirect(target, ev);
        let landed = false;
        for (let i = 0; i < (m.hits || 1) && t.hp > 0; i++) landed = strike(f, m, t, ev) || landed;
        if (landed && m.selfSnack && f.hp > 0) {
          // (Durians: and she breaks another one open for herself)
          f.st.snacking = Math.max(f.st.snacking || 0, m.selfSnack);
          ev.push({ t: 'snack', who: f, targets: [f] });
        }
      }
    }
    // (something that redocks is back at full charge as soon as the one who hit it has finished)
    for (const o of all) {
      if (!o.redock || o.gone || o.hp <= 0 || o.hp >= o.max || o.side === f.side) continue;
      ev.push({ t: 'redock', who: o, amount: o.max - o.hp });
      o.hp = o.max;
    }
    endTurn(f);
    check(ev);
    return ev;
  }

  for (const f of side('foes')) f.intent = plan(f);

  return {
    all, side, alive, allies, enemies, begin, act, choose, targets, blocked, ready,
    // call the fight off with this result (tests use it)
    stop(result) { over = result; },
    get party() { return side('party'); },
    get foes() { return side('foes'); },
    get over() { return over; },
    get turn() { return over || !cur ? null : cur.side; }, // whose turn it is: 'party' | 'foes'
    get round() { return Math.max(1, round); },
  };
}
