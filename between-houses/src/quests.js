// The story, as far as it is built: the opening (Act 0), Act 1's questlines,
// and the vet's, where the pair are given their names. Until then the game
// calls them The Tabby and The Orange (see names.js): in the words, {S} and
// {O} stand for whatever the two are called at the time.
// Cheetos: Shark and Orca meet him, play-fight him, hear about the man who
// hogs the monkey bars, meow him off them, and are noticed by Hưng and Trang
// for the first time.
// Socks: at night something keeps tagging them; she fights, then asks for
// help. The rats have her sock, across the road she has not dared cross since
// a motorbike took one of her lives. The three cross together, the pair clear
// out the rats, and the sock turns out to be Hưng's.
// Mamacat: her kitten is lost on the building side of the road. The pair find
// him at the wrong humming box, a snake goes for him, and Shark gets in the
// way (and has learned Protect). The pair fight the snake, which bites Shark
// first: the first sight of Infected. Then Mamacat arrives, takes it all the
// wrong way and fights, with a friend; beaten, she hears the truth from
// Babycat.
// Scar: after each of those three days the pair go back to the BBQ shed and tell her about it (the
// goal says so, and nothing else moves on until they have). After the first two, whoever they helped
// turns up at the shed with the next thing; after the third she tells them where Thanos walks.
// Thanos: Babycat's father, who owes his son a great many dinners. Nobody finds him by looking:
// Scar knows where he is at midnight, on the pavers by the BBQ shed. Beaten, he gets back up
// with two of his sons, and that fight is lost; Hưng and Trang come running,
// and carry the pair home. End of Act 1.
//
// The game calls in here at a few points (see createGame): every frame while
// the story is running, when a cat meows, and when the pair walk into one of
// the garden's cats or one of the story's people. Everything said is in
// game-text.js (WORDS.act1); `api` is what the game lends the story.
import { makeHuman, makeGolfClub, HUMAN_PALS, HUMAN_COATS, makeCat, makeCritter, CRITTER_PALS, CAT_PALS, collar, FLOWER } from './sprites.js';
import { RANDOM_COATS, NAMED } from './strays.js';
import { BARS, ROAD, ENTRANCE, GARNET, AC_UNITS, PLANT_S, PAVE_S, KERB_S, START, SHED, isBush, groundAt, gardenBlocked, TREES, JETTY_SOCK, CROSSINGS } from './garden.js';
import { ENCOUNTERS, MEND } from './story.js';
import { WORDS } from './game-text.js';
import { canvas, R } from './palette.js';
import { catName } from './names.js';
import { HOME as HOME_WORDS } from './home-text.js';

const W = WORDS.act1;
const W0 = WORDS.act0;
// the opening: where the bag is left (out of the rain, at the south edge of the BBQ shed, beside a post),
// and the spots under the shed roof and on the open pavers well north of it
const BAG_AT = [SHED.x + 5, SHED.y + SHED.h];
const CAR_STOP = 113; // the car's nose, just east of the Garnet crossing
const KERB = [114, ROAD.top - 1]; // where its driver gets out
const KIB_AT = [SHED.x + 5, SHED.y + 2]; // under the shed roof, with open floor all round it
const SCAR_AT = [SHED.x + 7, SHED.y + 2];
const PLATE_AT = [SHED.x + 4, SHED.y - 7]; // on open pavers, far enough north that the shed roof hides nobody
const DARK = { k: '#0b0a10', s: '#17151e', h: '#0b0a10', c: '#14121b', v: '#101018', p: '#0f0e15', o: '#0b0a10' }; // somebody seen only as a shape
// garden tiles
const HOME = [[72, 29], [73, 29]]; // where the pair wake up
const S_TILE = [BARS.x + 3, BARS.y]; // under the middle of the monkey bars
const WATCHERS = [[52, 33], [53, 33]]; // where Hưng and Trang stand of an evening (or the nearest free tiles)
const EVENING = [17, 20.5]; // when the man is at the bars, and the two of them are about
const REST = 210; // frames he stands between sets
const HANG = 330; // ...and hangs for
const EARSHOT = 6; // tiles
const TAG_ZONE = [64, 17, 98, 34]; // where Socks plays tag at night: the lawn and its bushes
const WAIT = [17, 36]; // where she waits to cross: the kerb at the cafe end of the stripes
const NEST = [9, PLANT_S]; // the rats' bush, left of Amber's doors
const BY_NEST = [[9, PLANT_S - 1], [10, PLANT_S - 1], [11, PLANT_S - 2]]; // where Shark, Orca and Socks stand in front of it
const SOCK_AT = [8, PLANT_S - 2]; // on the open pavement, clear of the palm
// where the pair sleep after each of the big days: a shrub by the playground, and the bush the rats have left
const NAP_BARS = [[44, 34], [45, 34]]; // (the bush one along to the west: the nearer one is where Hưng and Trang have been standing)
const NAP_NEST = [[NEST[0], NEST[1]], [NEST[0] + 1, NEST[1]]];
// the way home from the vet's: where the car pulls up on the building side (its nose, in tiles), and
// where the two of them get out, on the kerb at Amber's crossing
// (the car pulls up behind the stop line west of the crosswalk, not on the stripes: its nose a little short of the line)
const HOME_CAR = CROSSINGS[0] - 1.25;
const HOME_KERB = [[CROSSINGS[0] - 2, KERB_S], [CROSSINGS[0] - 3, KERB_S]];
const THANOS_AT = [SHED.x + 8, SHED.y - 3]; // where he waits after dark: the open pavers north of the BBQ shed
const RAT_PATCH = [107, 30, 110, 33]; // the pavers east of the BBQ shed, where the garden's rats hang about
// Mamacat's kitten: he has found a humming box, but it is the one by the other building, right at
// the far end of the pavement. The way there goes past Garnet's doors, and the two house cats
// who sit outside them (BBC and Flower: they will matter in Act 3).
const BOX = AC_UNITS[1];
const GARNET_CATS = [[GARNET.doorX - 1, GARNET.y - 1], [GARNET.doorX + 2, GARNET.y - 1]];
const GARNET_DOOR = [[GARNET.doorX, GARNET.y - 1], [GARNET.doorX + 1, GARNET.y - 1]]; // the step in front of the glass
const BABY_AT = [BOX.x + 2, BOX.y - 2]; // on the pavement in front of it
const HOME_BOX = [AC_UNITS[0].x + 2, AC_UNITS[0].y - 2]; // in front of the right one, where nobody is home
// in front of Garnet's doors: the step and the row before it, a little either side of the glass (see keepOut)
const GARNET_FRONT = [GARNET.doorX - 3, GARNET.y - 2, GARNET.doorX + 4, GARNET.y - 1];
const ALLY_COAT = 'white cat'; // the friend Mamacat brings
// where everybody stands once the snake is out (all relative to the kitten)
const at = (dx, dy) => [BABY_AT[0] + dx, BABY_AT[1] + dy];
const SPOT = {
  snakeOut: at(3, 1), snake: at(2, 0), shark: at(1, 0), orca: at(2, -1),
  mamaFrom: at(-9, 0), allyFrom: at(-10, -1), mama: at(-1, 0), ally: at(-1, -1), babyBack: at(-2, 0),
  mum: at(-3, -2), kid: at(-2, -2), // the woman and her girl from Garnet, stopping to look
  // the way round the two of them, along the far edge of the pavement
  round: [at(0, -2), at(-2, -2)],
  // (the night's bush: west of the palm, whose crown would hide all four of them)
  nap: [at(-8, 1), at(-9, 1)], mamaWaits: at(-7, -1), babySleeps: at(-7, 1),
  allyOff: at(-10, -1), hungFrom: at(-13, -1), trangFrom: at(-14, -1), hung: at(-4, -1), trang: at(-5, -1), plate: at(1, -1),
};

// Mission select ("Select chapter" on the title menu): each entry starts the
// story at the beginning of one questline, as it would stand had everything
// before it been played. The menu lists the ones the player has reached (see progress.js). hour: the time of day; at: the garden tile the pair
// start on; set(story): what the earlier questlines would have left behind.
// A new questline adds an entry here. `hidden`: not on the list (a place the tests start from, by id).
// `plain`: on the list without a number (the Prologue and the Epilogue); the others are numbered in order.
export const MISSIONS = [
  // (the very beginning of the game: the opening, as a new game has it)
  { id: 'prologue', name: WORDS.missions.prologue, opening: true, plain: true },
  { id: 'cheetos', name: WORDS.missions.cheetos, hour: 7, at: [44, 27], set(story) { story.goal = W.goalStart; } },
  {
    id: 'socks', name: WORDS.missions.socks, hour: 20, at: [76, 30],
    set(story) {
      Object.assign(story.quest, { cheetos: 'done', socks: 'tag' });
      Object.assign(story.flags, { sawBars: true, tips: true, toldScar: 1 });
      story.stage = 'meeting1';
      story.goal = W.goalNext;
    },
  },
  {
    id: 'mama', name: WORDS.missions.mama, hour: 16, at: START[0],
    set(story) {
      Object.assign(story.quest, { cheetos: 'done', socks: 'done', mama: 'search' });
      Object.assign(story.flags, { sawBars: true, canCross: true, tips: true, toldScar: 2 });
      story.stage = 'meeting2';
      story.goal = W.goalKitten;
    },
  },
  {
    id: 'thanos', name: WORDS.missions.thanos, hour: 0.1, at: [THANOS_AT[0] - 12, THANOS_AT[1] + 1],
    set(story) {
      Object.assign(story.quest, { cheetos: 'done', socks: 'done', mama: 'done', thanos: 'night' });
      Object.assign(story.flags, { sawBars: true, canCross: true, tips: true, protect: true, sawBox: true, toldScar: 3 });
      story.stage = 'meeting3';
      story.goal = W.goalThanosNight;
    },
  },
  {
    // the end of Act 1, from the moment the pair go down in front of Thanos: the rescue, the vet's, and home
    id: 'vet', name: WORDS.missions.vet || 'vet', hidden: !WORDS.missions.vet, hour: 0.5, at: [THANOS_AT[0] - 12, THANOS_AT[1] + 1],
    set(story) {
      Object.assign(story.quest, { cheetos: 'done', socks: 'done', mama: 'done', thanos: 'night' });
      Object.assign(story.flags, { sawBars: true, canCross: true, tips: true, protect: true, sawBox: true, facedThanos: true, toldScar: 3, straightToRescue: true });
      story.stage = 'meeting3';
      story.goal = W.goalThanosNight;
    },
  },
  {
    // Act 2 from the car pulling up at Amber's doors in the rain, after the vet's: the pair have their
    // names, and are carried indoors
    id: 'apartment', name: HOME_WORDS.missions.apartment, hour: 2, at: [THANOS_AT[0] - 12, THANOS_AT[1] + 1],
    set(story) {
      Object.assign(story.quest, { cheetos: 'done', socks: 'done', mama: 'done', thanos: 'done' });
      Object.assign(story.flags, { sawBars: true, canCross: true, tips: true, protect: true, sawBox: true, facedThanos: true, toldScar: 3, named: true, straightToDropOff: true });
      story.stage = 'meeting3';
      story.goal = '';
    },
  },
  // Act 2, indoors (`home`: the stage of it to start at; see jump in home.js). The ones with no name in
  // the text table are not on the list: they are places the tests start from.
  ...[['home', 'arrive'], ['explore', 'explore'], ['day2', 'explore2'], ['tired', 'tired'], ['night', 'yowl'], ['robot', 'kibble']].map(([id, home]) => ({
    id: 'home-' + id, name: HOME_WORDS.missions[id] || id, hidden: !HOME_WORDS.missions[id], hour: 8, at: START[0], home,
    set(story) {
      Object.assign(story.quest, { cheetos: 'done', socks: 'done', mama: 'done', thanos: 'done' });
      Object.assign(story.flags, { sawBars: true, canCross: true, tips: true, protect: true, sawBox: true, facedThanos: true, toldScar: 3, named: true });
      story.stage = 'meeting3';
    },
  })),
  // Act 3 (`act3`: the stage of it to start at; see jump in act3.js, which sets the story up and puts the pair in place)
  ...[['dogs', 'open', 20.5], ['shed', 'east', 21], ['garnet', 'garnet', 8], ['box', 'wait', 15.5], ['flat', 'balcony', 17], ['regroup', 'regroup', 18], ['jetty', 'call', 21], ['ending', 'won', 22.5], ['epilogue', 'after', 20]].map(([id, act3, hour]) => ({
    id: 'act3-' + id, name: WORDS.missions[id] || id, hidden: !WORDS.missions[id], plain: id === 'epilogue', hour, at: START[0], act3,
    set(story) {
      Object.assign(story.quest, { cheetos: 'done', socks: 'done', mama: 'done', thanos: 'done', home: 'done' });
      Object.assign(story.flags, { sawBars: true, canCross: true, tips: true, protect: true, sawBox: true, facedThanos: true, toldScar: 3, named: true });
      story.stage = 'house';
    },
  })),
];

export function createQuests(api) {
  const { GOX, strays, people, sfx } = api;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const story = () => api.story();
  const q = () => story().quest;
  const on = () => story().mode === 'story';
  const evening = () => api.hour() >= EVENING[0] && api.hour() < EVENING[1];
  const dist = (a, b) => Math.abs(a.tx - b.tx) + Math.abs(a.ty - b.ty);
  const lines = (list) => list.map((l) => ({ say: l }));

  // the story's people: they only exist while it needs them
  const man = api.addExtra('s', W.green, makeHuman(HUMAN_PALS.haterS, false, { coat: HUMAN_COATS.haterS }));
  // Purple Scarf (L, one of the three who cannot stand cats): thin, in a yellow dress, with a purple scarf
  // wound round her neck whatever the weather
  const scarf = api.addExtra('l', W.scarf, makeHuman(HUMAN_PALS.haterL, true, { coat: HUMAN_COATS.haterL, scale: [0.875, 1] }));
  const vet = api.addExtra('vet', W.vetName, makeHuman(HUMAN_PALS.vet, false, { coat: HUMAN_COATS.vet }));
  // neighbours who are glad of the cats, as nearly everybody here is: a man from Amber, on his way out
  // (he has a word with Purple Scarf), and a woman and her small girl, out of Garnet just after the snake
  const nb = api.addExtra('nb', W.neighbour, makeHuman({ k: '#17131a', s: '#d9a57e', h: '#55504c', c: '#4a78b0', v: '#365a8a', p: '#6a5f43', o: '#3a3a44' }, false));
  const mum = api.addExtra('mum', W.mumName, makeHuman({ k: '#17131a', s: '#f0c8a0', h: '#3b2a22', c: '#5f9a6c', v: '#457a52', p: '#f4f1ea', o: '#d9d4cc' }, true));
  const kid = api.addExtra('kid', W.kidName, makeHuman({ k: '#17131a', s: '#f0c8a0', h: '#3b2a22', c: '#f2cf3a', v: '#d4ae22', p: '#e58aa0', o: '#f4f1ea' }, true, { scale: [0.8125, 0.75] }));
  // the man with the club hits these across the lawn, and leaves them lying
  // (on open grass: the nearest tile to each of these that has lawn all round it and no tree over it)
  const openLawn = (x, y) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (groundAt(x + dx, y + dy) !== 'lawn' || gardenBlocked(x + dx, y + dy) || isBush(x + dx, y + dy)) return false;
    return !TREES.some(([, tx, ty, n]) => x >= tx - 1 && x <= tx + n && y >= ty - 1 && y <= ty + n);
  };
  const BALLS = [];
  for (const [x, y] of [[74, 23], [84, 29], [88, 21]]) {
    const apart = (a, b) => BALLS.every(([bx, by]) => Math.abs(bx - a) + Math.abs(by - b) >= 6);
    let at = null;
    for (let r = 0; r < 12 && !at; r++) for (let dy = -r; dy <= r && !at; dy++) for (let dx = -r; dx <= r && !at; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r && openLawn(x + dx, y + dy) && apart(x + dx, y + dy)) at = [x + dx, y + dy];
    BALLS.push(at || [x, y]);
  }
  const ballSprite = (() => {
    const [cv, g] = canvas(5, 5);
    R(g, 1, 0, 3, 5, '#2b2024');
    R(g, 0, 1, 5, 3, '#2b2024');
    R(g, 1, 1, 3, 3, '#f6f2e8');
    R(g, 3, 3, 1, 1, '#c9c4b8');
    R(g, 2, 2, 1, 1, '#dedad0');
    const all = { left: cv, right: cv, down: cv, up: cv };
    return { stand: all, sit: all, walk: { left: [cv, cv], right: [cv, cv], down: [cv, cv], up: [cv, cv] } };
  })();
  const balls = BALLS.map((_, i) => api.addExtra('ball' + i, '', ballSprite, { low: true }));
  const hung = api.addExtra('hung', 'Hưng', makeHuman(HUMAN_PALS.him, false, { coat: HUMAN_COATS.him }));
  const lady = api.addExtra('lady', W.ladyName, makeHuman(HUMAN_PALS.owner, true, { coat: HUMAN_COATS.owner })); // Flower's human, in Act 1
  const trang = api.addExtra('trang', 'Trang', makeHuman(HUMAN_PALS.her, true, { coat: HUMAN_COATS.her }));
  let grip = 3; // good meows he can take before he falls
  let watching = -1; // which cat he has his eye on (its index), or -1
  let phase = 'rest';
  let phaseT = 0;
  let saidEvening = -1; // the day the evening was announced
  let plateDay = -1;
  let falling = false; // the scene of his fall, and all that follows, is playing
  // Socks
  let tags = 0; // times she has tagged them tonight
  let tagAt = -9999; // the frame of the last one, and where the leader stood
  let tagFrom = [0, 0];
  let escorting = false; // she is crossing the road with them
  let ratsArmed = true; // walking up to the nest starts the fight (not straight after losing it)
  // Mamacat
  const coat = RANDOM_COATS.find((c) => c.what === ALLY_COAT);
  const ally = api.addExtra('ally', W.ally, makeCat(coat.pal, { coat: coat.coat }), { low: true });
  const snake = api.addExtra('snake', W.snake, makeCritter('snake', CRITTER_PALS.snake[0]), { low: true });
  const blackPal = RANDOM_COATS.find((c) => c.what === 'black cat').pal;
  const grayCoat = RANDOM_COATS.find((c) => c.what === 'gray cat');
  const kicked = api.addExtra('kicked', '', makeCat(grayCoat.pal, { coat: grayCoat.coat }), { low: true });
  const bbc = api.addExtra('bbc', W.bbc, makeCat({ ...blackPal, e: '#f2d37a' }, { scale: [1.3125, 1.3125], thickTail: true, coat: collar('#d23c3c', '#f2d37a') }), { low: true });
  const flower = api.addExtra('flower', W.flower, makeCat(FLOWER.pal, { coat: FLOWER.coat }), { low: true });
  let mamaArmed = false; // walking up to her starts the fight again (not straight after losing it)
  let snakeArmed = false; // ...and the same for the snake, if that fight was lost
  let mewAt = 0;
  // Thanos, and two of his many sons
  const tdef = NAMED.find((d) => d.id === 'thanos');
  const sons = [0, 1].map((i) => api.addExtra('son' + i, W.son, makeCat(tdef.pal, { coat: tdef.coat, scale: [0.9375, 0.9375] }), { low: true }));
  let thanosArmed = true; // walking up to him starts it (not straight after backing off)
  // the garden's own rats (nothing to do with the sock)
  const rat = api.addExtra('rat', WORDS.finds.ratName, makeCritter('rat', CRITTER_PALS.rat[1]), { low: true });
  const NOTE = WORDS.notes;
  const stronger = (text) => ({ note: { title: NOTE.stronger, text, hi: NOTE.statWords } });
  const learned = (text, move) => ({ note: { title: NOTE.newMove, text, hi: [move] } });
  // After each of the big days the pair are fed, and sleep where the story
  // leaves them: until morning (see sleepOver). `during` happens in the dark.
  // `talk`: what the two of them say to each other once they have lain down.
  const overnight = (spots, during, talk = []) => [
    { say: ['', W.sleepy] },
    { walk: ['shark', GOX + spots[0][0], spots[0][1]] },
    { walk: ['orca', GOX + spots[1][0], spots[1][1]] },
    { call: () => api.lieDown() },
    { wait: 60 },
    ...lines(talk),
    { wait: 50 },
    { fade: 'out' },
    { call: () => { api.sleepOver(); hung.hidden = trang.hidden = scarf.hidden = true; leave(); if (during) during(); } },
    { wait: 50 },
    { fade: 'in' },
    { wait: 50 },
    { call: () => api.getUp() },
  ];
  // where the two of them stand this evening
  const spots = () => {
    const a = api.freeNear(WATCHERS[0][0], WATCHERS[0][1], 3);
    return [a, api.freeNear(WATCHERS[1][0], WATCHERS[1][1], 3, [a])];
  };
  function watchersArrive() {
    const [a, b] = spots();
    api.placeExtra(hung, a[0], a[1], 'right');
    api.placeExtra(trang, b[0], b[1], 'right');
    return [a, b];
  }

  // ---------------------------------------------------------- the start
  // Act 1: the two of them, in their bush. (After the opening the controls need no telling again.)
  // Eat first: a woman in gray (Flower's human, who is not named until Act 3) puts a plate down behind the
  // cafe, at the west end of the garden, and goes; the pair cross the playground to it. Cheetos is not in
  // the garden until it is eaten.
  const BREAKFAST = [-18, 25]; // behind the cafe, between its back wall and the trees
  const LADY_FROM = [-6, 19]; // where she comes around the cafe from, and goes back to
  const breakfastAt = () => api.freeNear(BREAKFAST[0], BREAKFAST[1], 2);
  const breakfastPlate = () => people.kibble.find((k) => k.breakfast);
  function begin(played) {
    story().flags.a1Kibble = 'wait';
    // the golf club caught him last night: he starts the day on half his HP, and the first plate is for that
    api.hurtShare('shark', 0.5);
    const [px, py] = breakfastAt();
    api.playScene('act1-intro', [
      { wait: 30 },
      ...lines(W.intro),
      // over at the cafe: the plate
      { call: () => api.placeExtra(lady, LADY_FROM[0], LADY_FROM[1], 'left') },
      { camera: [GOX + px + 2, py - 2], ease: 0.125 }, // (half the usual speed: it is a long way across the garden)
      { wait: 70 },
      { walk: ['lady', GOX + px + 1, py] },
      { face: ['lady', 'left'] },
      { wait: 20 },
      { call: () => { if (!breakfastPlate()) people.kibble.push({ x: px, y: py, born: api.clock(), keep: true, breakfast: true }); sfx.land(); } },
      { say: ['', W.ladyPlate] },
      { walk: ['lady', GOX + LADY_FROM[0], LADY_FROM[1]] },
      { call: () => (lady.hidden = true) },
      { camera: null, ease: 0.125 },
      { wait: 60 },
      ...lines(W.introAfter),
      ...(played ? [] : [{ say: ['', W.introKeys] }]),
      { goal: W.goalBreakfast },
      // after the opening: Orca is with him now, and here is the button for it (to be tried straight away)
      ...(played ? [{ note: { title: WORDS.notes.friend, text: W0.joined, hi: [catName('orca')] } }, tip(W0.tipSwap), tip(W0.tipRun)] : []),
    ], () => delete story().flags.noRun);
  }
  // ...and once it is eaten, the orange blur by the playground
  function breakfast() {
    delete story().flags.a1Kibble;
    for (let i = people.kibble.length - 1; i >= 0; i--) if (people.kibble[i].breakfast) people.kibble.splice(i, 1);
    api.playScene('act1-breakfast', [{ wait: 70 }, ...lines(W.breakfast), { goal: W.goalStart }]);
  }

  // ------------------------------------------------------- her daily rounds
  // After that first morning she comes every day while the pair are strays: a plate behind the cafe in
  // the morning, and one by the BBQ shed in the evening, from Garnet over the east crosswalk. A plate
  // mends all of a cat's hurts (see MEND); the garden's other cats know her rounds too.
  const ROUNDS = [
    { key: 'am', hours: [7, 9], from: () => LADY_FROM, at: () => breakfastAt(), back: () => [LADY_FROM] },
    {
      key: 'pm', hours: [17.5, 19.5],
      from: () => [GARNET.doorX, GARNET.y - 1],
      at: () => api.freeNear(SHED.x + SHED.w - 2, SHED.y + SHED.h + 2, 3),
      via: () => [[GARNET.doorX, KERB_S + 1], [GARNET.doorX, ROAD.top - 2]],
      back: () => [[GARNET.doorX, ROAD.top - 2], [GARNET.doorX, KERB_S + 1], [GARNET.doorX, GARNET.y - 1]],
    },
  ];
  const round = { phase: 'idle', done: {}, route: [], plate: null, wait: 0, r: null };
  function roundsTick() {
    const st = story();
    if (st.act !== 1 || st.adopted || st.flags.a1Kibble) return;
    const hr = api.hour();
    if (round.phase === 'idle') {
      if (api.busy() || !lady.hidden) return;
      const r = ROUNDS.find((o) => hr >= o.hours[0] && hr < o.hours[1] && round.done[o.key] !== api.day());
      if (!r) return;
      const plate = r.at();
      const stand = api.freeNear(plate[0] + 1, plate[1], 2, [plate]);
      Object.assign(round, { phase: 'out', r, plate, route: [...(r.via ? r.via() : []), stand], wait: 0 });
      api.placeExtra(lady, ...r.from(), r.key === 'pm' ? 'up' : 'left');
      if (r.key === 'pm') sfx.door();
      return;
    }
    if (lady.moving) return;
    if (round.phase === 'put') {
      if (--round.wait > 0) return;
      round.phase = 'back';
      round.route = round.r.back();
      return;
    }
    const [x, y] = round.route[0];
    if (lady.tx - GOX === x && lady.ty === y) {
      round.route.shift();
      if (round.route.length) return;
      if (round.phase === 'out') {
        // the plate goes down, and she waits a little to see who comes
        if (!people.kibble.some((k) => k.x === round.plate[0] && k.y === round.plate[1])) people.kibble.push({ x: round.plate[0], y: round.plate[1], born: api.clock(), plate: true });
        sfx.land();
        if (api.visible(lady.px, lady.py)) api.say(pick(W.roundPlate));
        round.done[round.r.key] = api.day();
        Object.assign(round, { phase: 'put', wait: 240 });
      } else {
        lady.hidden = true;
        round.phase = 'idle';
        if (round.r.key === 'pm') sfx.door();
      }
      return;
    }
    // (a step at a time; put there if there is no way)
    if (!api.walkStep(lady, GOX + x, y)) api.placeExtra(lady, x, y, lady.dir);
  }

  // ------------------------------------------------------------ the opening
  // Act 0, all of it directed: a bag left in the rain, Shark alone, Scar, the
  // first kibble, the first nap, Orca, and a man with a golf club. Nothing in
  // it is saved; it ends where Act 1 begins.
  const owner = api.addExtra('owner', W0.unknown, makeHuman(DARK, false));
  // (Golf Club, seen in full and by name: his own sprite with the club in hand, and its swing, as in Act 3)
  const hater = api.addExtra('h', W0.hName, makeGolfClub());
  const swingPic = (n) => () => { hater.pic = n == null ? null : hater.sp.swing[hater.dir][n]; };
  const bagSprite = (() => {
    const [cv, g] = canvas(12, 9);
    R(g, 2, 2, 8, 7, '#0c0b11');
    R(g, 1, 4, 10, 5, '#0c0b11');
    R(g, 3, 3, 6, 5, '#6b5a48');
    R(g, 2, 5, 8, 3, '#6b5a48');
    R(g, 4, 0, 4, 3, '#0c0b11');
    R(g, 5, 1, 2, 2, '#8a7660');
    R(g, 3, 4, 3, 1, '#8a7660');
    const all = { left: cv, right: cv, down: cv, up: cv };
    return { stand: all, sit: all, walk: { left: [cv, cv], right: [cv, cv], down: [cv, cv], up: [cv, cv] } };
  })();
  const bag = api.addExtra('bag', W0.bagName, bagSprite, { low: true });
  // the first cat to put a nose to the bag: an orange stray, who turns out, that evening, to be The Orange
  const sniffer = api.addExtra('sniffer', '', makeCat(CAT_PALS.orca), { low: true });
  const scar = () => strays.byId.scar;
  const a0 = () => story().flags.a0;
  const tip = (text) => ({ note: { title: WORDS.notes.tip, text, kind: 'tip' } });
  // the first tile going west from (x, y) that somebody could be standing on, out of the bushes
  const openWest = (x, y) => {
    for (let i = 0; i < 8; i++) for (const dy of [0, 1, -1, 2, -2]) if (api.tileFree(x - i, y + dy) && !isBush(x - i, y + dy)) return [x - i, y + dy];
    return [x, y];
  };
  let meterAt = 0; // the frame the energy meter appeared
  let moved = 0; // tiles Shark has walked since he was left
  let lastAt = '';
  let since = 0;
  let mews = 0;
  let mewedAt = -999; // the frame of the last call that counted
  function begin0() {
    const sh = api.cats()[0];
    const S = (p) => [GOX + p[0], p[1]];
    const stand = [BAG_AT[0], BAG_AT[1] + 1];
    let car = null;
    story().flags.a0 = 'open';
    story().flags.nightMusic = true; // (the quiet tune, whatever the clock says, until Scar)
    api.strays.newVisit(); // (no nameless strays in the opening: see quiet in game.js)
    story().flags.noRun = true; // (no running until The Orange is with him: see begin, and tipRun)
    moved = since = mews = 0;
    api.showCat(0, false);
    api.showCat(1, false);
    // (he gets out on its south side: to the east he would be standing behind the lamp post)
    api.putCat(0, stand[0], stand[1], 'down');
    api.putCat(1, stand[0] - 1, stand[1], 'down');
    const sniff = [stand[0] - 1, stand[1]]; // where the white cat stops
    const whiteFrom = openWest(BAG_AT[0] - 11, BAG_AT[1] + 1);
    api.playScene('act0-open', [
      { call: () => api.blackout() },
      { camera: [GOX + CAR_STOP - 2, ROAD.top - 2] },
      { wait: 30 },
      { fade: 'in' },
      { say: ['', W0.open] },
      { call: () => (car = api.car(0, CAR_STOP)) },
      { wait: 250 },
      { call: () => { api.placeExtra(owner, KERB[0], KERB[1], 'left'); sfx.door(); } },
      { camera: 'owner' },
      { wait: 40 },
      { walk: ['owner', ...S(stand)] },
      { face: ['owner', 'up'] },
      { wait: 30 },
      { call: () => { api.placeExtra(bag, BAG_AT[0], BAG_AT[1], 'down'); sfx.land(); } },
      { wait: 150 },
      { say: W0.sorry },
      { wait: 40 },
      { walk: ['owner', ...S(KERB)] },
      { call: () => { owner.hidden = true; sfx.door(); car.stopAt = null; } },
      { wait: 150 },
      { camera: 'bag' },
      { wait: 150 },
      // one of the garden's cats comes to see what has been left (an orange one: he will be back)
      { call: () => { api.placeExtra(sniffer, whiteFrom[0], whiteFrom[1], 'right'); sniffer.fast = 9; } },
      { walk: ['sniffer', ...S(sniff)] },
      { face: ['sniffer', 'right'] },
      { say: ['', W0.sniff] },
      { bubble: ['sniffer', '?', 60] },
      { wait: 70 },
      { call: () => { bag.shake = 50; sfx.rustle(); api.bubble(sniffer, '!', 50); } },
      { wait: 70 },
      { call: () => { bag.shake = 70; sfx.rustle(); } },
      { wait: 80 },
      { call: () => { api.showCat(0, true); sh.dir = 'down'; api.bubble(sh, '?', 70); api.bubble(sniffer, '!!', 50); sfx.rustle(); sfx.startle(); sniffer.fast = 4; } },
      { walk: ['sniffer', ...S(whiteFrom)] },
      { call: () => { sniffer.hidden = true; delete sniffer.fast; } },
      { camera: null },
      { wait: 50 },
      ...lines(W0.out),
      { goal: W0.goalSearch },
      tip(W0.tipMeow),
    ], () => {
      owner.hidden = sniffer.hidden = true;
      delete sniffer.fast;
      if (car) car.stopAt = null;
      api.showCat(0, true);
      // the first lesson: call for them. He stays where he is until he has (see meow, below)
      story().flags.noWalk = true;
      story().flags.a0 = 'call';
      mews = 0;
    });
  }
  // The opening keeps him on the BBQ pavers, where he was left: the shed, Scar and the plate are all there, and
  // out on the dark lawn Scar could come at him from nowhere he can be seen. Stepping off them while he is
  // looking for his human is what brings her (see scarComes).
  const onPavers = (x, y) => groundAt(x, y) === 'paver' && y < ROAD.top - 2;
  function blocks(x, y, cat) {
    if (story().mode !== 'story' || story().act !== 0 || onPavers(x, y)) return false;
    if (a0() === 'search') scarComes(cat);
    else if (!api.busy() && api.frame() - edgeAt > 240) {
      edgeAt = api.frame();
      api.say(api.fmt(W0.edge, cat));
    }
    return true;
  }
  let edgeAt = -999;
  // Three calls, and only the rain answers. Then he sets off to look, and is shown how to walk.
  function called() {
    api.playScene('act0-walk', [{ say: W0.goFind }, tip(W0.tipMove)], () => {
      delete story().flags.noWalk;
      story().flags.a0 = 'search';
      moved = since = mews = 0;
    });
  }
  // Scar comes out of the rain at him: the first fight, and nobody wins it
  function scarComes(L) {
    const s = scar();
    const lx = L.tx - GOX;
    const from = [[10, 0], [-10, 0], [0, 8], [0, -8], [9, 5], [-9, -5]].map(([dx, dy]) => [lx + dx, L.ty + dy]).find(([x, y]) => api.tileFree(x, y) && !api.visible((GOX + x) * 16, y * 16)) || api.freeNear(lx + 9, L.ty, 3);
    const to = api.freeNear(lx + Math.sign(from[0] - lx || 1), L.ty, 1);
    story().flags.a0 = 'scar';
    api.playScene('act0-scar', [
      { call: () => { appear(s, from[0], from[1]); s.pose = 'stand'; } },
      { walk: ['scar', GOX + to[0], to[1]] },
      { bubble: ['scar', 'Hsss!', 60] },
      { sfx: 'hiss' },
      ...lines(W0.scarMeets),
      { call: () => { delete story().flags.nightMusic; api.startFight(ENCOUNTERS.scarMeet(), { quiet: true, then: scarAfter }); } },
    ]);
  }
  function scarAfter() {
    api.playScene('act0-scar2', [
      ...lines(W0.scarAsks),
      { walk: ['scar', GOX + SCAR_AT[0], SCAR_AT[1]] },
      { face: ['scar', 'left'] },
      { goal: W0.goalFollow },
    ], () => {
      appear(scar(), SCAR_AT[0], SCAR_AT[1]);
      story().flags.a0 = 'follow';
    });
  }
  // under the shed roof: what kibble is, and what it is for
  function kibbleLesson() {
    story().flags.a0 = 'eat';
    api.playScene('act0-kibble', [
      { say: W0.kibble[0] },
      { call: () => { people.kibble.push({ x: KIB_AT[0], y: KIB_AT[1], born: api.clock(), keep: true }); sfx.land(); } },
      ...lines(W0.kibble.slice(1)),
      { goal: W0.goalEat },
    ]);
  }
  // he has eaten: the meter, a proper bite, and bed
  function ate() {
    if (story().act === 1 && story().flags.a1Kibble === 'wait') return breakfast();
    if (story().act !== 0 || a0() !== 'eat') return;
    story().flags.a0 = 'ate';
    api.playScene('act0-ate', [{ wait: 70 }, { say: ['', W0.ate] }], () => {
      // back in the garden, and something new under the clock
      delete story().flags.noEnergy;
      story().hurt = { shark: 0, orca: 0 };
      api.flashMeter();
      sfx.learn();
      meterAt = api.frame();
      story().flags.a0 = 'meter';
    });
  }
  // ...explained with the meter in view (a dialog box, but no scene: the top right of the screen stays as it is)
  function meterTip() {
    story().flags.a0 = 'bite';
    sfx.learn();
    api.openDialog({ name: WORDS.notes.tip, kind: 'tip', text: W0.tipEnergy, then: biteLesson });
  }
  function biteLesson() {
    story().flags.a0 = 'nap';
    api.playScene('act0-bite', [
      ...lines(W0.bite),
      { call: () => (story().stage = 'start') },
      { note: { title: WORDS.notes.newMove, text: W0.learnChomp, hi: ['CHOMP'] } },
      ...lines(W0.sleep),
      { call: () => delete story().flags.noNap },
      { goal: W0.goalNap },
      tip(W0.tipNap),
    ], () => {
      // (no wandering off: the nap is the only thing to do, as the meow was)
      story().flags.noWalk = true;
      api.cats()[0].dir = 'down';
    });
  }
  // He sleeps the rain out. Then the garden, as Scar sees it; a plate; and Orca.
  function afterNap() {
    const or = api.cats()[1];
    const P = PLATE_AT;
    const S = (dx, dy) => [GOX + P[0] + dx, P[1] + dy];
    const softFrom = openWest(P[0] - 12, P[1]);
    story().flags.a0 = 'orca';
    delete story().flags.noWalk;
    api.playScene('act0-plate', [
      { call: () => api.lieDown() },
      { fade: 'out' },
      { call: () => { api.setClock(18); api.dry(); api.lieDown(); } },
      { wait: 40 },
      { fade: 'in' },
      { wait: 40 },
      { say: ['', W0.woke] },
      { call: () => api.getUp() },
      ...lines(W0.garden),
      // right on cue: a gray cat on the pavers, and the man in the green shirt after it
      { call: () => { api.placeExtra(kicked, P[0] - 2, P[1] + 1, 'left'); kicked.sat = true; api.placeExtra(man, P[0] + 8, P[1] + 1, 'left'); man.fast = 6; } },
      { camera: [GOX + P[0] - 2, P[1]] },
      { wait: 50 },
      { walk: ['s', ...S(-1, 1)] },
      { call: () => { sfx.startle(); sfx.crash(); kicked.sat = false; kicked.shake = 20; api.bubble(kicked, 'MRAOW!', 60); api.burst(kicked.px + 8, kicked.py + 6, '#ffffff', 8); kicked.fast = 4; } },
      { say: W0.kick[0] },
      { walk: ['kicked', GOX + softFrom[0] + 1, softFrom[1]] },
      { call: () => { kicked.hidden = true; delete kicked.fast; delete man.fast; } },
      ...lines(W0.kick.slice(1)),
      // ...and somebody who has come out with the evening's plate
      { call: () => api.placeExtra(trang, softFrom[0], softFrom[1], 'right') },
      { walk: ['trang', ...S(-3, 1)] },
      { face: ['s', 'left'] },
      { bubble: ['trang', '!', 50] },
      ...lines(W0.toldOff.slice(0, 3)),
      { say: W0.toldOff[3] },
      { walk: ['s', ...S(9, 1)] },
      { call: () => (man.hidden = true) },
      { say: W0.some },
      { camera: 'trang' },
      { wait: 30 },
      { walk: ['trang', ...S(-1, 0)] },
      { wait: 50 },
      { call: () => { people.kibble.push({ x: P[0], y: P[1], born: api.clock(), keep: true }); sfx.land(); } },
      { camera: [GOX + P[0], P[1]] },
      { wait: 110 },
      { walk: ['trang', GOX + softFrom[0], softFrom[1]] },
      { call: () => (trang.hidden = true) },
      { wait: 80 },
      { camera: null },
      { wait: 40 },
      ...lines(W0.soft),
      { walk: ['shark', ...S(2, 2)] },
      { walk: ['scar', ...S(3, 3)] },
      { face: ['shark', 'left'] },
      // and somebody has been watching that plate
      { call: () => { api.showCat(1, true); api.putCat(1, P[0], P[1] - 1, 'down'); api.bubble(or, 'HSSS!', 70); sfx.hiss(); sfx.rustle(); } },
      { walk: ['orca', ...S(1, 1)] },
      { face: ['orca', 'right'] },
      ...lines(W0.orcaMeets),
      // (Scar is wary of humans: she goes back under her roof, and the two humans see only two cats)
      { walk: ['scar', GOX + SCAR_AT[0], SCAR_AT[1]] },
      { face: ['scar', 'down'] },
      { call: () => api.startFight(ENCOUNTERS.orcaMeet(), { quiet: true, then: secondPlate }) },
    ]);
  }
  // Whoever won: Hưng and Trang, who saw it, come back out. There is no reason to fight: there is
  // enough for everybody, and here is a second plate. The pair eat side by side, and the two humans go.
  // The Orange has always eaten alone; what he takes from it, for now, is that two cats get two plates.
  function secondPlate() {
    const P = PLATE_AT;
    const S = (dx, dy) => [GOX + P[0] + dx, P[1] + dy];
    const from = openWest(P[0] - 12, P[1]);
    const first = () => people.kibble.find((k) => k.keep && k.x === P[0] && k.y === P[1]);
    let plate2 = null;
    story().flags.a0 = 'plates';
    api.playScene('act0-plates', [
      { call: () => { api.setClock(19.5); api.putCat(0, P[0] + 2, P[1] + 2, 'left'); api.putCat(1, P[0] + 1, P[1] + 1, 'right'); } },
      { camera: [GOX + P[0], P[1] + 1] },
      { wait: 30 },
      { say: W0.back },
      { call: () => { api.placeExtra(trang, from[0], from[1], 'right'); api.placeExtra(hung, from[0] - 1, from[1], 'right'); } },
      { walks: [['trang', ...S(-3, 1)], ['hung', ...S(-3, 0)]] },
      { face: ['trang', 'right'] },
      { face: ['hung', 'right'] },
      { face: ['shark', 'left'] },
      { face: ['orca', 'left'] },
      { bubble: ['orca', '!', 50] },
      ...lines(W0.enough),
      { walk: ['hung', ...S(-1, 2)] },
      { wait: 30 },
      { call: () => { plate2 = { x: P[0], y: P[1] + 2, born: api.clock(), keep: true }; people.kibble.push(plate2); sfx.land(); } },
      { say: W0.second },
      { walk: ['hung', ...S(-3, 0)] },
      { face: ['hung', 'right'] },
      // one plate each
      { walks: [['orca', ...S(1, 0)], ['shark', ...S(1, 2)]] },
      { call: () => { for (const cat of api.cats()) { cat.dir = 'left'; api.act(cat, 'eat', 150); } } },
      { wait: 150 },
      { call: () => { for (const k of [first(), plate2]) if (k) people.eat(k); api.mend(MEND.plate); sfx.purr(); } },
      { say: W0.twoPlates },
      ...lines(W0.friends),
      { walks: [['trang', GOX + from[0], from[1]], ['hung', GOX + from[0] - 1, from[1]]] },
      { call: () => { hung.hidden = trang.hidden = true; } },
      { wait: 40 },
      // the humans gone, Scar comes back out from under her roof
      { walk: ['scar', ...S(3, 3)] },
      { walks: [['orca', ...S(1, 1)], ['shark', ...S(2, 2)]] },
      { face: ['orca', 'right'] },
      { face: ['shark', 'left'] },
      ...lines(W0.math),
      { camera: null },
    ], () => {
      hung.hidden = trang.hidden = true;
      for (const k of [first(), plate2]) if (k && people.kibble.includes(k)) people.eat(k);
      manWithClub();
    });
  }
  // Night, and both plates clean: a man with a golf club. Shark has only ever met kind humans.
  function manWithClub() {
    const [sh, or] = api.cats();
    const s = scar();
    const P = PLATE_AT;
    const S = (dx, dy) => [GOX + P[0] + dx, P[1] + dy];
    const bed = [[SCAR_AT[0] - 2, SCAR_AT[1]], [SCAR_AT[0] - 3, SCAR_AT[1]], [SCAR_AT[0] - 1, SCAR_AT[1]]]; // Shark, Orca, Scar: under the shed roof
    story().flags.a0 = 'club';
    api.playScene('act0-club', [
      { call: () => { api.setClock(20.5); api.putCat(0, P[0] + 2, P[1] + 2, 'left'); api.putCat(1, P[0] + 1, P[1] + 1, 'right'); } },
      { say: ['', W0.afterPlates] },
      { call: () => { api.placeExtra(hater, P[0] + 12, P[1] + 1, 'left'); } },
      { camera: 'h' },
      { walk: ['h', ...S(6, 1)] },
      ...lines(W0.club),
      { call: swingPic(0) },
      { wait: 12 },
      { call: () => { swingPic(1)(); sfx.startle(); api.bubble(or, '!!', 50); api.bubble(s, '!!', 50); } },
      { wait: 12 },
      { call: swingPic(null) },
      { camera: null },
      { walk: ['orca', ...S(-3, 0)] },
      { walk: ['scar', ...S(-2, 4)] },
      { face: ['orca', 'right'] },
      { face: ['scar', 'right'] },
      ...lines(W0.shout),
      { walk: ['shark', ...S(5, 1)] },
      { face: ['shark', 'right'] },
      { say: W0.excuse },
      { call: swingPic(0) },
      { wait: 12 },
      { call: swingPic(1) },
      { wait: 2 },
      { call: () => { sfx.crash(); api.burst(sh.px + 8, sh.py + 6, '#ffffff', 12); api.lieDown(); api.blackout(); } },
      { wait: 170 }, // nothing, for a long moment
      { say: ['', W0.hit] },
      { call: () => {
        hater.hidden = true;
        hater.pic = null;
        api.setClock(23);
        api.putCat(0, bed[0][0], bed[0][1], 'right');
        api.putCat(1, bed[1][0], bed[1][1], 'right');
        appear(s, bed[2][0], bed[2][1]);
        s.dir = 'left';
        api.lieDown();
        or.pose = 'sit';
        for (let i = people.kibble.length - 1; i >= 0; i--) if (people.kibble[i].keep) people.kibble.splice(i, 1);
      } },
      { wait: 190 },
      { fade: 'in' },
      { wait: 60 },
      { say: ['', W0.dark] },
      ...lines(W0.awake),
      { call: () => { sh.pose = 'sit'; } },
      ...lines(W0.deal),
      { say: ['', W0.bush] },
      { fade: 'out' },
      { call: () => { s.pause = 0; api.startAct1(); } },
      { wait: 200 }, // the night, in the dark
      { fade: 'in' },
    ], () => begin(true));
  }
  // every frame of the opening
  function act0Tick(L) {
    if (api.busy()) return;
    const stage = a0();
    if (stage === 'called') {
      if (api.frame() - mewedAt > 200) called();
    } else if (stage === 'search') {
      since++;
      const here = L.tx + ',' + L.ty;
      if (here !== lastAt) {
        lastAt = here;
        moved++;
      }
      if (moved >= 30 || (since > 60 * 28 && moved >= 8)) scarComes(L);
    } else if (stage === 'meter') {
      if (api.frame() - meterAt > 110) meterTip();
    } else if (stage === 'follow') {
      if (dist(L, scar()) <= 3) kibbleLesson();
    } else if (stage === 'nap') {
      if (api.napping()) afterNap();
    }
  }

  // ------------------------------------------------------------ Cheetos
  const cheetos = () => strays.byId.cheetos;
  function dare(first) {
    const c = cheetos();
    api.playScene(first ? 'cheetos-meet' : 'cheetos-again', [
      { bubble: ['cheetos', '!', 40] },
      ...(first ? lines(W.meet) : []),
      {
        choice: {
          who: 'cheetos', text: (first ? W.dare : W.again)[1], options: W.dareChoice,
          then: (i) => (i === 0 ? [{ call: playFight }] : [{ say: W.later }]),
        },
      },
    ], () => {
      q().cheetos = q().cheetos === 'meet' ? 'met' : q().cheetos;
      c.pause = 120;
    });
  }
  function playFight() {
    api.startFight(ENCOUNTERS.cheetosPlay(), {
      quiet: true,
      then(result) {
        if (q().cheetos === 'done') return;
        if (result !== 'won') return api.playScene('cheetos-lost', [{ say: W.lost }]);
        q().cheetos = 'bars';
        api.playScene('cheetos-won', [...lines(W.won), { goal: W.goalBars }]);
      },
    });
  }

  // ------------------------------------------------- the man at the bars
  function arrive() {
    api.placeExtra(man, S_TILE[0], S_TILE[1], 'down');
    man.lift = 0;
    grip = 3;
    watching = -1;
    phase = 'rest';
    phaseT = 0;
  }
  function leave() {
    man.hidden = true;
    man.lift = 0;
  }
  function manTick() {
    if (++phaseT >= (phase === 'rest' ? REST : HANG)) {
      phase = phase === 'rest' ? 'hang' : 'rest';
      phaseT = 0;
      if (phase === 'hang') man.dir = 'down';
      if (api.visible(man.px, man.py)) (phase === 'hang' ? sfx.jump : sfx.land)();
    }
    // hanging: pull-ups, slower as he tires; standing: feet on the ground
    if (phase === 'hang') {
      const up = Math.min(1, phaseT / 14) * Math.min(1, (HANG - phaseT) / 14);
      man.lift = Math.round(up * (5 + 3 * Math.sin(phaseT / 9)));
    } else man.lift = 0;
    man.hang = phase === 'hang';
  }
  // a cat has meowed: was he in earshot, and was he hanging?
  function meow(cat) {
    if (on() && story().act === 0) {
      // nobody he is calling for is going to answer
      if (a0() === 'call' && api.frame() - mewedAt > 80) {
        mewedAt = api.frame();
        api.say(api.fmt(W0.calls[mews++], cat));
        if (mews >= W0.calls.length) story().flags.a0 = 'called';
      } else if (a0() === 'search') api.say(api.fmt(W0.meows[mews++ % W0.meows.length], cat));
      return true;
    }
    if (on() && mamaStage() === 'search') return call(cat), true;
    if (!on() || q().cheetos !== 'bars' || man.hidden) return false;
    if (dist(cat, man) > EARSHOT) {
      if (dist(cat, man) <= EARSHOT + 5) api.say(api.fmt(W.far, cat));
      return true;
    }
    const who = api.cats().indexOf(cat);
    if (phase === 'rest') return shoo(cat), true;
    if (watching === who) {
      api.bubble(man, '...', 60);
      api.say(api.fmt(W.watched, cat));
      return true;
    }
    watching = who;
    man.dir = cat.tx < man.tx ? 'left' : cat.tx > man.tx ? 'right' : 'down';
    api.bubble(man, '!', 50);
    sfx.startle();
    if (--grip <= 0) return fall(), true;
    api.say(api.fmt(W.slip[2 - grip] || W.slip[0], cat));
    return true;
  }
  function shoo(cat) {
    api.bubble(man, 'Shoo!', 70);
    sfx.startle();
    for (const c of api.cats()) api.bubble(c, '!', 50);
    api.say(api.fmt(pick(W.shoo), cat));
    api.startBolt(man.tx, man.ty);
  }
  // the third good meow: off he comes, and everything that follows
  function fall() {
    const L = api.leader();
    q().cheetos = 'done';
    q().socks = 'tell'; // (nothing of hers until Scar has heard about this)
    falling = true;
    const home = hung.hidden ? watchersArrive() : [[hung.tx - GOX, hung.ty], [trang.tx - GOX, trang.ty]];
    const [hx, hy] = api.freeNear(L.tx - GOX - 2, L.ty + 1, 2);
    const [tx, ty] = api.freeNear(L.tx - GOX - 3, L.ty + 1, 2, [[hx, hy]]);
    const plate = api.freeNear(L.tx - GOX - 1, L.ty + 1, 1, [[hx, hy], [tx, ty]]);
    const c = cheetos();
    const near = api.freeNear(L.tx - GOX + 1, L.ty + 1, 2, [[hx, hy], [tx, ty], plate]);
    const off = api.freeNear(S_TILE[0] + 9, S_TILE[1] + 2, 3);
    const toBars = api.freeNear(S_TILE[0], S_TILE[1] + 1, 2);
    let kib = null;
    api.playScene('bars-fall', [
      { camera: 's' },
      { wait: 20 },
      { call: () => { man.hang = false; man.lift = 0; man.sat = true; sfx.crash(); api.burst(man.px + 8, man.py + 12, '#cbc5bb', 10); } },
      { wait: 30 },
      { say: W.fall[0] },
      { call: () => { for (const p of people.list) if (api.visible(p.px, p.py)) api.bubble(p, pick(['Ha!', 'Ha ha!', 'Pfff!']), 90); sfx.chirp(); } },
      { say: W.fall[1] },
      { call: () => { man.sat = false; man.dir = 'down'; } },
      { say: W.fall[2] },
      { say: W.fall[3] },
      { walk: ['s', GOX + off[0], off[1]] },
      { call: leave },
      { camera: null },
      // Cheetos comes running
      { call: () => { c.hidden = false; if (dist(c, L) > 8) strays.place(c, near[0], near[1]); c.pose = 'stand'; } },
      { walk: ['cheetos', GOX + near[0], near[1]] },
      { bubble: ['cheetos', '!!', 50] },
      ...lines(W.after),
      // and so do the two humans who saw it all from across the playground
      { walk: ['trang', GOX + tx, ty] },
      { walk: ['hung', GOX + hx, hy] },
      { face: ['trang', 'right'] },
      { face: ['hung', 'right'] },
      ...lines(W.meeting.slice(0, 3)),
      { call: () => { kib = { x: plate[0], y: plate[1], born: api.clock() }; people.kibble.push(kib); sfx.land(); } },
      { say: W.meeting[3] },
      { walk: ['hung', GOX + hx - 1, hy] },
      { say: W.coffee },
      { call: () => { for (const cat of api.cats()) { cat.dir = plate[0] < cat.tx - GOX ? 'left' : 'down'; api.act(cat, 'eat', 150); } } },
      { wait: 150 },
      { call: () => { people.eat(kib); api.mend(MEND.plate); story().stage = 'meeting1'; sfx.purr(); } },
      { say: W.eaten },
      stronger(W.boost),
      { say: W.bye },
      { walk: ['hung', GOX + home[0][0], home[0][1]] },
      { walk: ['trang', GOX + home[1][0], home[1][1]] },
      { say: W.cheetosNight },
      // off he goes, to his bars; the night; and in the morning there is somebody to tell
      { walk: ['cheetos', GOX + toBars[0], toBars[1]] },
      ...overnight(NAP_BARS, () => strays.actions.bars(c), W.night1),
      { say: W.wake1 },
      { goal: W.goalTell1 },
    ], () => {
      falling = false;
      leave();
      // and Cheetos is straight back on his bars
      strays.actions.bars(c);
    });
  }

  // -------------------------------------------------------------- Socks
  const socks = () => strays.byId.socks;
  const night = () => api.hour() >= 19.5 || api.hour() < 5;
  // (a game saved before her story was built picks it up where Cheetos's left off)
  const socksStage = () => q().socks || (q().cheetos === 'done' ? 'tag' : 'wait');
  const vanish = (s) => {
    api.burst(s.px + 8, s.py + 8, '#f7f1e3', 8);
    sfx.rustle();
    s.hidden = true;
  };
  const appear = (s, x, y) => {
    strays.place(s, x, y);
    s.hidden = false;
    s.pause = 1e9; // she stays where the story puts her
    s.pose = 'sit';
  };
  // a tap on the tail from nowhere; the third time she stays
  function tag() {
    const s = socks();
    const F = api.other();
    const L = api.leader();
    const [x, y] = api.freeNear(F.tx - GOX, F.ty, 1);
    tags++;
    tagAt = api.frame();
    tagFrom = [L.tx, L.ty];
    const tap = { call: () => { appear(s, x, y); s.pose = 'stand'; api.bubble(s, 'Tag!', 45); api.bubble(F, '?', 45); sfx.blip(); } };
    if (tags < 3) return api.playScene('socks-tag' + tags, [tap, { wait: 34 }, { call: () => vanish(s) }, { wait: 20 }, { say: tags === 1 ? W.tag1 : W.tag2 }]);
    api.playScene('socks-meet', [tap, { wait: 30 }, ...lines(W.socksMeet), { call: socksFight }]);
  }
  function socksFight() {
    api.startFight(ENCOUNTERS.socksTag(), {
      quiet: true,
      then(result) {
        const s = socks();
        if (result !== 'won') {
          vanish(s);
          tags = 2; // she will be back
          tagAt = api.frame();
          return api.playScene('socks-lost', [{ say: W.socksLostLine }]);
        }
        // two socks: one out on the jetty (she won't go near the river), the other over the road
        q().socks = 'jetty';
        api.placePickup('sock', JETTY_SOCK[0], JETTY_SOCK[1]);
        api.playScene('socks-won', [...lines(W.socksFriend), { call: () => vanish(s) }, { goal: W.goalJetty }]);
      },
    });
  }
  // the first sock, from the jetty, at the crosswalk: then the other one, over the road. She comes along
  // straight away (playtest, 27 Nov: having to walk into her a second time to start the crossing was
  // not found).
  function sockOne(cat, sock) {
    q().socks = 'cross';
    sock.floor = 'held';
    sock.by = null;
    api.playScene('sock-one', [
      { bubble: ['socks', '♥', 70] },
      { sfx: 'purr' },
      ...lines(W.sockOne),
      ...lines(W.crossTalk),
    ], startCrossing);
  }
  // she comes along, and for as long as she does the pair dare the road
  function startCrossing() {
    escorting = true;
    story().flags.canCross = true;
    api.escort(socks());
    api.setGoal(W.goalCrossing);
  }
  // at the kerb again, after they went back into the garden or a car came too close: walked into, she
  // comes along once more
  function engage() {
    api.playScene('socks-cross', lines(W.crossTalk), startCrossing);
  }
  function disengage(line) {
    escorting = false;
    story().flags.canCross = false;
    api.release(socks());
    appear(socks(), WAIT[0], WAIT[1]);
    api.say(line, true);
  }
  // all three on the far pavement: she leads the way to the rats
  function crossed() {
    const s = socks();
    const L = api.leader();
    escorting = false;
    q().socks = 'rats';
    api.release(s);
    const [x, y] = api.freeNear(L.tx - GOX, L.ty, 1);
    api.playScene('socks-crossed', [
      { call: () => { appear(s, x, y); s.pose = 'stand'; api.bubble(s, '!!', 60); sfx.purr(); } },
      ...lines(W.crossed),
      { walk: ['socks', GOX + BY_NEST[2][0], BY_NEST[2][1]] },
      { walk: ['shark', GOX + BY_NEST[0][0], BY_NEST[0][1]] },
      { walk: ['orca', GOX + BY_NEST[1][0], BY_NEST[1][1]] },
      { face: ['shark', 'down'] },
      { face: ['orca', 'down'] },
      { face: ['socks', 'left'] },
      { sfx: 'rustle' },
      ...lines(W.nest),
      { goal: W.goalRats },
      { call: ratFight },
    ]);
  }
  function ratFight() {
    api.startFight(ENCOUNTERS.ratNest(), {
      quiet: true,
      then(result) {
        if (result !== 'won') {
          ratsArmed = false;
          return api.playScene('rats-lost', [{ say: W.ratsRetry }]);
        }
        q().socks = 'sock';
        api.placePickup('sock', SOCK_AT[0], SOCK_AT[1]);
        api.playScene('rats-won', [{ sfx: 'rustle' }, ...(story().flags.shedRatsGone ? [{ say: ['', WORDS.finds.noRats] }] : []), { say: W.sockOut }, { goal: W.goalSock }]);
      },
    });
  }
  // the sock is back where it belongs, and the building's doors open
  function meeting2(cat, sock) {
    const s = socks();
    q().socks = 'done';
    q().mama = 'tell'; // (nothing of Mamacat's until Scar has heard about this)
    sock.floor = 'held';
    sock.by = null;
    const door = [ENTRANCE.doorX, ENTRANCE.y];
    const spot = (dx, dy, not) => api.freeNear(BY_NEST[2][0] + dx, BY_NEST[2][1] + dy, 2, not);
    const a = spot(2, 0, []);
    const b = spot(3, 0, [a]);
    const c = spot(5, 0, [a, b]);
    const east = api.freeNear(c[0] + 15, c[1], 3, [a, b, c]); // the way to Garnet, along the pavement
    const plate = api.freeNear(SOCK_AT[0], SOCK_AT[1], 1, [a, b, c]);
    const nbAt = api.freeNear(b[0], b[1] + 1, 2, [a, b, c, plate]); // the neighbour, beside Hưng and Trang
    let kib = null;
    api.playScene('meeting-2', [
      { bubble: ['socks', '♥♥', 90] },
      { sfx: 'purr' },
      ...lines(W.sockGiven),
      { say: W.meeting2[0] },
      { call: () => { api.placeExtra(hung, door[0], door[1], 'up'); sfx.door(); } },
      { walk: ['hung', GOX + a[0], a[1]] },
      { call: () => api.placeExtra(trang, door[0] + 1, door[1], 'up') },
      { walk: ['trang', GOX + b[0], b[1]] },
      { face: ['hung', 'left'] },
      { face: ['trang', 'left'] },
      ...lines(W.meeting2.slice(1)),
      // and somebody else, from the other building
      { call: () => api.placeExtra(scarf, east[0], east[1], 'left') },
      { camera: 'l' },
      { say: W.scarfComes },
      { walk: ['l', GOX + c[0], c[1]] },
      { face: ['l', 'left'] },
      { camera: null },
      ...lines(W.scarfLooks),
      { face: ['hung', 'right'] },
      { face: ['trang', 'right'] },
      ...lines(W.scarfTalk.slice(0, 5)),
      // (and a neighbour, on his way out, who has heard enough)
      { call: () => { api.placeExtra(nb, door[0] + 1, door[1], 'up'); sfx.door(); } },
      { say: W.nbComes },
      { walk: ['nb', GOX + nbAt[0], nbAt[1]] },
      { face: ['nb', 'right'] },
      ...lines(W.scarfTalk.slice(5)),
      { say: W.scarfGoes },
      { walk: ['l', GOX + east[0], east[1]] },
      { call: () => (scarf.hidden = true) },
      { face: ['hung', 'left'] },
      { face: ['trang', 'left'] },
      { face: ['nb', 'left'] },
      ...lines(W.nbGoes),
      { walk: ['nb', GOX + door[0] + 1, door[1]] },
      { call: () => { nb.hidden = true; sfx.door(); } },
      ...lines(W.meeting2b),
      { call: () => { kib = { x: plate[0], y: plate[1], born: api.clock() }; people.kibble.push(kib); sfx.land(); } },
      { call: () => { for (const k of api.cats()) api.act(k, 'eat', 150); } },
      { wait: 150 },
      { call: () => { people.eat(kib); api.mend(MEND.plate); story().stage = 'meeting2'; sfx.purr(); } },
      { say: W.eaten2 },
      stronger(W.boost2),
      { say: W.groom },
      learned(W.learnGroom, 'GROOM'),
      { say: W.bye2 },
      { walk: ['trang', GOX + door[0] + 1, door[1]] },
      { call: () => (trang.hidden = true) },
      { walk: ['hung', GOX + door[0], door[1]] },
      { call: () => { hung.hidden = true; sfx.door(); } },
      // Socks is off with her sock; the night in the rats' old bush; and in the morning there is somebody to tell
      { say: W.socksGoes },
      { call: () => vanish(s) },
      ...overnight(NAP_NEST, null, W.night2),
      { say: W.wake2 },
      { goal: W.goalTell2 },
    ], () => {
      s.pause = 0; // she is her own cat again (and the road no longer frightens her)
      if (!s.hidden) vanish(s);
    });
  }
  // every frame of her story
  function socksTick(L) {
    const stage = socksStage();
    const s = socks();
    if (!s) return;
    if (stage === 'tag') {
      const [x0, y0, x1, y1] = TAG_ZONE;
      const gx = L.tx - GOX;
      const inZone = gx >= x0 && gx <= x1 && L.ty >= y0 && L.ty <= y1;
      const moved = Math.abs(L.tx - tagFrom[0]) + Math.abs(L.ty - tagFrom[1]) >= 5;
      if (night() && inZone && api.frame() - tagAt > 420 && (tags === 0 || moved)) tag();
      return;
    }
    if (stage === 'jetty') {
      // she waits at the crosswalk; on the jetty, the sock lies by an empty cage
      if (s.hidden || s.tx !== GOX + WAIT[0] || s.ty !== WAIT[1]) appear(s, WAIT[0], WAIT[1]);
      if (!story().flags.a1Cage && Math.abs(L.tx - GOX - JETTY_SOCK[0]) + Math.abs(L.ty - JETTY_SOCK[1]) <= 3) {
        story().flags.a1Cage = true;
        // (and, right after it, how carrying works: before the sock is picked up, not once it has been)
        story().flags.a1CarryTip = true;
        api.playScene('jetty-cage', [...lines(W.jettyCage), tip(W.tipCarry)]);
      }
      // (a sock picked up without the cage scene having played: the tip, then)
      if (!story().flags.a1CarryTip && api.cats().some((c) => { const p = api.carrying(c); return p && p.id === 'sock'; })) {
        story().flags.a1CarryTip = true;
        api.playScene('carry-tip', [tip(W.tipCarry)]);
      }
      return;
    }
    if (stage === 'cross') {
      if (!escorting) {
        if (s.hidden || s.tx !== GOX + WAIT[0] || s.ty !== WAIT[1]) appear(s, WAIT[0], WAIT[1]);
        // (a game picked up again on the garden side starts the crossing afresh)
        if (L.ty < ROAD.top) story().flags.canCross = false;
        return;
      }
      if (L.ty <= ROAD.top - 4) disengage(W.crossBack); // back into the garden: she stays at the kerb
      else if (L.ty > ROAD.bottom + 1) crossed();
      return;
    }
    if (stage === 'rats' || stage === 'sock') {
      // she keeps watch by the bush
      if (s.hidden) appear(s, BY_NEST[2][0], BY_NEST[2][1]);
      if (stage !== 'rats') return;
      const d = Math.abs(L.tx - GOX - NEST[0]) + Math.abs(L.ty - NEST[1]);
      if (d > 4) ratsArmed = true;
      else if (ratsArmed && d <= 2) {
        ratsArmed = false;
        api.playScene('rats-again', [{ sfx: 'rustle' }, { say: W.ratsAgain }, { call: ratFight }]);
      }
    }
  }

  // ------------------------------------------------------------ Mamacat
  const mama = () => strays.byId.mama;
  const baby = () => strays.byId.baby;
  // (a game saved before her story was built picks it up where Socks's left off)
  const mamaStage = () => (q().mama && q().mama !== 'wait' ? q().mama : socksStage() === 'done' ? 'search' : 'wait');
  const sit = (n, [x, y], dir) => {
    appear(n, x, y);
    n.dir = dir;
  };
  // a meow on the building side: the kitten answers, and the answer says which way
  function call(cat) {
    const b = baby();
    if (cat.ty <= ROAD.bottom || b.hidden) return api.say(api.fmt(W.mewNone, cat));
    const d = dist(cat, b);
    sfx.meow(1150);
    if (api.visible(b.px, b.py)) api.bubble(b, 'Mew!', 50);
    api.say(api.fmt(d > 45 ? W.mewFaint : d > 12 ? W.mewFar : W.mewNear, cat).replace('{dir}', b.tx > cat.tx ? W.east : W.west));
  }
  // On the way: two house cats outside Garnet's doors, with collars on. They have seen him go by.
  function garnetCats() {
    story().flags.metGarnet = true;
    const S = (p) => [GOX + p[0], p[1]];
    api.playScene('garnet-cats', [
      { camera: 'bbc' },
      { wait: 30 },
      { say: W.garnetCats[0] },
      { bubble: ['flower', '!', 50] },
      ...lines(W.garnetCats.slice(1)),
      { walk: ['bbc', ...S(GARNET_DOOR[0])] },
      { walk: ['flower', ...S(GARNET_DOOR[1])] },
      { face: ['bbc', 'down'] },
      { face: ['flower', 'down'] },
      { sfx: 'door' },
      { call: () => (bbc.hidden = flower.hidden = true) },
      { say: W.garnetGo },
      { camera: null },
      ...lines(W.garnetAfter),
    ], () => (bbc.hidden = flower.hidden = true));
  }
  // found: the snake, Shark in the way, a fight with it, and then his mother
  // (q().mama is 'snake' from the moment the kitten is found until the snake is seen off, and then 'fight')
  function found() {
    const S = (k) => [GOX + SPOT[k][0], SPOT[k][1]];
    q().mama = 'snake';
    api.playScene('baby-found', [
      { camera: 'baby' },
      { bubble: ['baby', 'Mew!', 50] },
      { wait: 30 },
      ...lines(W.babyFound),
      // out of the bush behind him
      { call: () => { api.placeExtra(snake, SPOT.snakeOut[0], SPOT.snakeOut[1], 'left'); sfx.rustle(); api.bubble(snake, 'Sss!', 60); } },
      { wait: 30 },
      { say: W.snakeOut },
      { walk: ['snake', ...S('snake')] },
      { walk: ['shark', ...S('shark')] },
      { face: ['shark', 'right'] },
      { call: () => { sfx.hiss(); sfx.startle(); api.bubble(api.cats()[0], '!', 50); } },
      { wait: 30 },
      { say: W.snakeBite },
      { flag: ['protect', true] },
      learned(W.learnProtect, 'PROTECT'),
      { walk: ['orca', ...S('orca')] },
      { face: ['orca', 'down'] },
      { call: () => { sfx.hiss(); api.bubble(api.cats()[1], 'HSSS!', 60); } },
      { wait: 30 },
      ...lines(W.snakeFace),
      { camera: null },
      { goal: W.goalSnake },
      { call: snakeFight },
    ]);
  }
  // The pair against the snake. It goes first, and its first move is the bite: Venom, on Shark, and it lands
  // (see snakeBite in story.js). Lost: it stays where it is, and walking back up to it starts the fight again.
  function snakeFight() {
    snakeArmed = false;
    api.startFight(ENCOUNTERS.snakeBite(), {
      quiet: true,
      then(result) {
        if (result !== 'won') {
          api.playScene('snake-lost', [{ say: W.snakeRetry }], () => api.startBolt(snake.tx, snake.ty));
          return;
        }
        snakeGone();
      },
    });
  }
  function snakeAgain() {
    snakeArmed = false;
    api.playScene('snake-again', [{ bubble: ['snake', 'Sss!', 60] }, { sfx: 'hiss' }, { call: snakeFight }]);
  }
  // seen off, for good; and here comes his mother
  function snakeGone() {
    const S = (k) => [GOX + SPOT[k][0], SPOT[k][1]];
    q().mama = 'fight';
    // (after a second go the pair may have come at it from anywhere: back to where they stood)
    const [sh, or] = api.cats();
    const placed = sh.tx === S('shark')[0] && sh.ty === SPOT.shark[1] && or.tx === S('orca')[0] && or.ty === SPOT.orca[1];
    const reset = placed ? [] : [{ fade: 'out' }, { call: () => { api.putCat(0, ...SPOT.shark, 'right'); api.putCat(1, ...SPOT.orca, 'down'); } }, { fade: 'in' }];
    api.playScene('snake-gone', [
      ...reset,
      { camera: 'baby' },
      { walk: ['snake', ...S('snakeOut')] },
      { call: () => { snake.hidden = true; sfx.rustle(); } },
      { say: W.snakeGone },
      { face: ['baby', 'right'] },
      ...lines(W.babyThanks),
      // somebody saw that: a woman and her small girl, out of Garnet on their way somewhere
      { call: () => { api.placeExtra(mum, GARNET_DOOR[1][0], GARNET_DOOR[1][1], 'down'); api.placeExtra(kid, GARNET_DOOR[0][0], GARNET_DOOR[0][1], 'down'); sfx.door(); } },
      { say: W.garnetPair[0] },
      { walks: [['mum', ...S('mum')], ['kid', ...S('kid')]] },
      { face: ['mum', 'right'] },
      { face: ['kid', 'right'] },
      { face: ['baby', 'left'] },
      { bubble: ['kid', '!', 50] },
      ...lines(W.garnetPair.slice(1, -1)),
      { walks: [['mum', GOX + GARNET.x - 5, PAVE_S], ['kid', GOX + GARNET.x - 6, PAVE_S]] },
      { call: () => { mum.hidden = kid.hidden = true; } },
      { say: W.garnetPair[W.garnetPair.length - 1] },
      { face: ['baby', 'right'] },
      // and here she comes
      { call: () => { sit(mama(), SPOT.mamaFrom, 'right'); mama().pose = 'stand'; api.placeExtra(ally, SPOT.allyFrom[0], SPOT.allyFrom[1], 'right'); } },
      { walk: ['mama', ...S('mama')] },
      { walk: ['ally', ...S('ally')] },
      { face: ['shark', 'left'] },
      { face: ['orca', 'left'] },
      { face: ['baby', 'left'] },
      { bubble: ['mama', 'HSSS!', 70] },
      { sfx: 'hiss' },
      ...lines(W.mamaArrives),
      { walk: ['baby', GOX + SPOT.round[0][0], SPOT.round[0][1]] },
      { walk: ['baby', GOX + SPOT.round[1][0], SPOT.round[1][1]] },
      { walk: ['baby', ...S('babyBack')] },
      { face: ['baby', 'right'] },
      { say: W.mamaLast },
      { camera: null },
      { goal: W.goalMama },
      { call: mamaFight },
    ]);
  }
  function mamaFight() {
    api.startFight(ENCOUNTERS.mamaGuard(ALLY_COAT), {
      quiet: true,
      then(result) {
        if (result !== 'won') {
          mamaArmed = false;
          api.playScene('mama-lost', [{ say: W.mamaRetry }], () => api.startBolt(mama().tx, mama().ty));
          return;
        }
        meeting3();
      },
    });
  }
  // beaten, she has to listen; and two humans saw the whole thing
  function meeting3() {
    const S = (k) => [GOX + SPOT[k][0], SPOT[k][1]];
    const m = mama();
    const b = baby();
    q().mama = 'done';
    let kib = null;
    // (after a second go the pair may have come at her from anywhere: back to where the snake left them)
    const [sh, or] = api.cats();
    const placed = sh.tx === S('shark')[0] && sh.ty === SPOT.shark[1] && or.tx === S('orca')[0] && or.ty === SPOT.orca[1];
    const reset = placed ? [] : [{ fade: 'out' }, { call: () => { api.putCat(0, ...SPOT.shark, 'left'); api.putCat(1, ...SPOT.orca, 'left'); } }, { fade: 'in' }];
    api.playScene('meeting-3', [
      ...reset,
      { face: ['shark', 'left'] },
      { face: ['orca', 'left'] },
      { walk: ['baby', GOX + SPOT.round[1][0], SPOT.round[1][1]] },
      { walk: ['baby', GOX + SPOT.round[0][0], SPOT.round[0][1]] },
      { walk: ['baby', GOX + BABY_AT[0], BABY_AT[1]] },
      { face: ['baby', 'left'] },
      { bubble: ['baby', '!!', 60] },
      ...lines(W.babyTells),
      { say: W.allyGoes },
      { walk: ['ally', ...S('allyOff')] },
      { call: () => (ally.hidden = true) },
      { call: () => { api.placeExtra(hung, SPOT.hungFrom[0], SPOT.hungFrom[1], 'right'); api.placeExtra(trang, SPOT.trangFrom[0], SPOT.trangFrom[1], 'right'); } },
      { walk: ['hung', ...S('hung')] },
      { walk: ['trang', ...S('trang')] },
      ...lines(W.meeting3),
      { call: () => { kib = { x: SPOT.plate[0], y: SPOT.plate[1], born: api.clock() }; people.kibble.push(kib); sfx.land(); } },
      { call: () => { sh.dir = 'up'; or.dir = 'left'; for (const k of api.cats()) api.act(k, 'eat', 150); } },
      { wait: 150 },
      { call: () => { people.eat(kib); api.mend(MEND.plate); story().stage = 'meeting3'; sfx.purr(); } },
      { say: W.eaten3 },
      stronger(W.boost3),
      ...lines(W.bye3),
      { walk: ['trang', ...S('trangFrom')] },
      { call: () => (trang.hidden = true) },
      { walk: ['hung', ...S('hungFrom')] },
      { call: () => (hung.hidden = true) },
      // the night in the bush by the wrong box; the two of them do not go home either
      ...overnight(SPOT.nap, () => {
        sit(m, SPOT.mamaWaits, 'left');
        sit(b, SPOT.babySleeps, 'left');
        b.pose = 'sleep';
      }, W.night3),
      { say: W.morning3 },
      { call: () => (b.pose = 'sit') },
      ...lines(W.pointsOn3),
      { bubble: ['baby', '>:(', 70] },
      ...lines(W.pointsOn3b),
      { goal: W.goalNext3 },
    ], () => {
      // the two of them are their own cats again
      ally.hidden = hung.hidden = trang.hidden = true;
      m.pause = b.pause = 0;
    });
  }
  // every frame of her story
  function mamaTick(L) {
    const stage = mamaStage();
    const b = baby();
    if (!b || stage === 'wait' || stage === 'tell' || stage === 'done' || api.busy()) return;
    // BBC and Flower sit outside Garnet's doors until the pair have come past (and spoken to them)
    const waiting = stage === 'search' && !story().flags.metGarnet;
    if (waiting && bbc.hidden) {
      api.placeExtra(bbc, GARNET_CATS[0][0], GARNET_CATS[0][1], 'down');
      api.placeExtra(flower, GARNET_CATS[1][0], GARNET_CATS[1][1], 'down');
    } else if (!waiting && !bbc.hidden) bbc.hidden = flower.hidden = true;
    if (waiting && L.ty > ROAD.bottom && Math.abs(L.tx - GOX - GARNET.doorX) <= 5) return garnetCats();
    if (stage === 'search') {
      if (story().goal !== W.goalKitten) story().goal = W.goalKitten; // (a game saved when this was as far as the story went)
      if (b.hidden || b.tx !== GOX + BABY_AT[0] || b.ty !== BABY_AT[1]) sit(b, BABY_AT, 'down');
      // he is telling the box what he thinks of it
      if (api.frame() - mewAt > 260 && api.visible(b.px, b.py)) {
        mewAt = api.frame();
        api.bubble(b, 'Mew!', 50);
        sfx.meow(1150);
      }
      if (dist(L, b) <= 3) return found();
      // nobody home at the right box
      if (!story().flags.sawBox && Math.abs(L.tx - GOX - HOME_BOX[0]) + Math.abs(L.ty - HOME_BOX[1]) <= 3) {
        story().flags.sawBox = true;
        api.playScene('mama-box', lines(W.boxEmpty));
      }
      return;
    }
    if (stage === 'snake') {
      // the snake is still between its bush and the kitten, until the pair have seen it off
      if (b.hidden || b.tx !== GOX + BABY_AT[0] || b.ty !== BABY_AT[1]) sit(b, BABY_AT, 'down');
      if (snake.hidden) api.placeExtra(snake, SPOT.snake[0], SPOT.snake[1], 'left');
      if (story().goal !== W.goalSnake) story().goal = W.goalSnake;
      // (coming from the west the kitten is in the way: walking up to him is walking up to it)
      if (dist(L, snake) > 5) snakeArmed = true;
      else if (snakeArmed && Math.min(dist(L, snake), dist(L, b)) <= 2) snakeAgain();
      return;
    }
    // 'fight': the three of them hold their ground until she has been made to listen
    const m = mama();
    if (m.hidden || m.tx !== GOX + SPOT.mama[0] || m.ty !== SPOT.mama[1]) {
      sit(m, SPOT.mama, 'right');
      m.pose = 'stand';
      sit(b, SPOT.babyBack, 'right');
      api.placeExtra(ally, SPOT.ally[0], SPOT.ally[1], 'right');
    }
    const d = dist(L, m);
    if (d > 5) mamaArmed = true;
    else if (mamaArmed && d <= 2) mamaAgain();
  }
  function mamaAgain() {
    mamaArmed = false;
    api.playScene('mama-again', [{ bubble: ['mama', 'HSSS!', 60] }, { sfx: 'hiss' }, { say: W.mamaAgain }, { call: mamaFight }]);
  }

  // ------------------------------------------------------------- Thanos
  const thanos = () => strays.byId.thanos;
  // (a game saved when Mamacat's story was as far as it went picks this one up)
  const thanosStage = () => (q().thanos && q().thanos !== 'wait' ? q().thanos : mamaStage() === 'done' ? 'find' : 'wait');
  const atPost = (t) => !t.hidden && t.tx === GOX + THANOS_AT[0] && t.ty === THANOS_AT[1];
  // when he is on his pavers: from midnight until it starts to get light
  const late = () => api.hour() < 5;
  let saidMidnight = -1; // the day midnight was announced
  // face to face, at midnight
  function thanosFace() {
    thanosArmed = false;
    q().thanos = 'night';
    const first = !story().flags.facedThanos;
    story().flags.facedThanos = true;
    api.playScene(first ? 'thanos-face' : 'thanos-again', [
      ...(first ? [{ camera: 'thanos' }, { wait: 30 }, ...lines(W.thanosFace), { camera: null }] : []),
      { choice: { who: 'thanos', text: (first ? W.thanosDare : W.thanosAgain)[1], options: W.thanosChoice, then: (i) => (i === 0 ? [{ call: thanosFight }] : [{ say: W.thanosLater }]) } },
    ]);
  }
  function thanosFight() {
    api.startFight(ENCOUNTERS.thanosBoss(), {
      quiet: true,
      then(result) {
        if (result === 'rescued') return rescue();
        api.playScene('thanos-lost', [{ say: W.thanosLost }], () => api.startBolt(thanos().tx, thanos().ty));
      },
    });
  }
  // Down, with three of them standing over the pair: and then a light. The
  // fourth meeting, and the last night Shark and Orca spend in the garden.
  let homeCar = null;
  // The way home from the vet's (the screen is black when it begins): the last of that scene, and
  // where the chapter "The Apartment" starts.
  const wayHome = (t) => [
    // The way home. Rain again, a car pulling up, and two bags: the opening, the other way
    // round. This time the bags are carried indoors.
    { call: () => {
      trang.torch = false;
      hung.hidden = trang.hidden = t.hidden = true;
      for (const s of sons) s.hidden = true;
      api.showCat(0, false);
      api.showCat(1, false);
      api.wet();
      // (the screen is black: whoever was standing about where the car pulls up is gone, and nobody comes)
      rescuing = false;
      dropOff = true;
      api.clearNpcs(true);
    } },
    { camera: [GOX + HOME_KERB[0][0] + 1, KERB_S + 1] },
    { wait: 40 },
    { fade: 'in' },
    { wait: 30 },
    { call: () => (homeCar = api.car(3, HOME_CAR)) },
    { wait: 60 },
    { say: ['', W.rainHome] },
    { until: () => !homeCar || homeCar.v < 0.05 },
    { wait: 50 },
    { call: () => { api.placeExtra(hung, HOME_KERB[0][0], HOME_KERB[0][1], 'down'); hung.holds = bagSprite.stand.down; hung.fast = trang.fast = 17; sfx.door(); } },
    { wait: 40 },
    { call: () => { api.placeExtra(trang, HOME_KERB[1][0], HOME_KERB[1][1], 'down'); trang.holds = bagSprite.stand.down; sfx.door(); } },
    { wait: 50 },
    { say: ['', W.bagsHome] },
    { walk: ['hung', GOX + ENTRANCE.doorX + 1, ENTRANCE.y] },
    { face: ['hung', 'down'] },
    { wait: 25 },
    { call: () => { hung.hidden = true; sfx.door(); } },
    { walk: ['trang', GOX + ENTRANCE.doorX, ENTRANCE.y] },
    { face: ['trang', 'down'] },
    { wait: 25 },
    { call: () => { trang.hidden = true; sfx.door(); if (homeCar) homeCar.stopAt = null; } },
    { wait: 130 },
    { say: ['', W.carriedHome] },
    { fade: 'out' },
    { camera: null },
    { call: () => { hung.holds = trang.holds = null; delete hung.fast; delete trang.fast; hung.hidden = trang.hidden = true; api.adopt(); } },
    { wait: 40 },
    // (Act 2 opens in the dark, where this leaves off: see begin in home.js)
  ];
  // ...by itself, for that chapter: the pair are in the car already, and have their names
  function dropOffScene() {
    const t = thanos();
    q().thanos = 'done';
    rescuing = true;
    api.playScene('drop-off', [{ call: () => api.blackout() }, ...wayHome(t)], () => {
      rescuing = dropOff = false;
      api.homeBegin();
    });
  }
  function rescue() {
    const t = thanos();
    q().thanos = 'done';
    const tx = t.tx - GOX;
    const ty = t.ty;
    const near = (dx, dy, not = []) => api.freeNear(tx + dx, ty + dy, 2, not);
    const a = near(-2, 0);
    const b = near(-3, 1, [a]);
    const s0 = near(1, -1, [a, b]);
    const s1 = near(1, 1, [a, b, s0]);
    const h = near(-5, 0, [a, b]);
    const g = near(-6, 1, [a, b, h]);
    const from = [tx - 14, ty];
    const off = near(10, 0);
    const off0 = near(9, -1, [off]);
    const off1 = near(9, 1, [off, off0]);
    rescuing = true;
    api.playScene('meeting-4', [
      { call: () => {
        api.putCat(0, a[0], a[1], 'right');
        api.putCat(1, b[0], b[1], 'right');
        api.lieDown();
        t.dir = 'left';
        t.pose = 'stand';
        api.placeExtra(sons[0], s0[0], s0[1], 'left');
        api.placeExtra(sons[1], s1[0], s1[1], 'left');
        hung.hidden = trang.hidden = true;
      } },
      { wait: 60 },
      { say: ['', W.down] },
      { call: () => { api.placeExtra(trang, from[0], from[1], 'right'); api.placeExtra(hung, from[0] - 1, from[1], 'right'); trang.torch = true; sfx.startle(); } },
      { say: W.hey },
      { walk: ['trang', GOX + h[0], h[1]] },
      { walk: ['hung', GOX + g[0], g[1]] },
      { bubble: ['thanos', 'Hsss!', 60] },
      { sfx: 'hiss' },
      { say: ['', W.thanosGoes] },
      // (all three of them go, the two young ones at his heels)
      { call: () => { for (const s of sons) s.fast = 7; sfx.rustle(); } },
      { walks: [['thanos', GOX + off[0], off[1]], ['son0', GOX + off0[0], off0[1]], ['son1', GOX + off1[0], off1[1]]] },
      { call: () => { t.hidden = true; t.pause = 0; for (const s of sons) { s.hidden = true; delete s.fast; } } },
      ...lines(W.meeting4),
      { say: ['', W.pickedUp] },
      { fade: 'out' },
      { say: ['', W.carried] },
      // The vet's: one still picture (vet.js). The big one has a chip, and a number that
      // does not want him back; and then, for the first time, the two of them have names.
      { picture: 'room' },
      { wait: 30 },
      { fade: 'in' },
      { wait: 40 },
      ...lines(W.vetRoom),
      { picture: 'scan' },
      { sfx: 'blip' },
      { wait: 70 },
      { sfx: 'blip' },
      ...lines(W.vetChip),
      { picture: 'phone' },
      { wait: 50 },
      ...lines(W.vetCall),
      { picture: 'room' },
      { wait: 40 },
      ...lines(W.vetAlone),
      ...lines(W.vetNames),
      { call: () => api.nameThem() },
      { note: { title: W.namedTitle, text: W.named, hi: ['SHARK', 'ORCA'] } },
      ...lines(W.vetAfter),
      { fade: 'out' },
      { picture: null },
      ...wayHome(t),
    ], () => {
      rescuing = dropOff = false;
      api.homeBegin();
    });
  }
  // every frame of his story
  function thanosTick(L) {
    const stage = thanosStage();
    const t = thanos();
    if (!t || stage === 'wait' || stage === 'done' || api.busy()) return;
    // 'find': nobody has seen him, and nobody will, until Scar has said where he walks (see tellScar)
    if (stage === 'find') {
      if (story().goal !== W.goalNext3) story().goal = W.goalNext3; // (a game saved when this was as far as the story went)
      return;
    }
    // 'night': from midnight he is at his post; at any other hour he is not to be found (see present)
    if (!late()) {
      if (t.pause > 1e6) t.pause = 0;
      return;
    }
    if (saidMidnight !== api.day()) {
      saidMidnight = api.day();
      api.wake();
      api.say(W.midnight, true);
    }
    if (!atPost(t)) {
      if (t.hidden || !api.visible(t.px, t.py)) {
        appear(t, THANOS_AT[0], THANOS_AT[1]);
        t.dir = 'left';
      }
      return;
    }
    const d = dist(L, t);
    if (d > 6) thanosArmed = true;
    else if (thanosArmed && d <= 3) thanosFace();
  }

  // ------------------------------------------------- the rats by the shed
  // One of them is always nosing about east of the BBQ shed, until the pair
  // see them off: that is worth something (see FINDS), and they do not come
  // back. They are gone when Act 1 is, too. With the nest across the road cleared out as well, the garden has
  // no rats left.
  function ratTick(L) {
    // (and once the pair live upstairs there are none either, seen off or not: Act 1's rats are Act 1's)
    if (story().flags.shedRatsGone || story().adopted) return void (rat.hidden = true);
    const [x0, y0, x1, y1] = RAT_PATCH;
    if (rat.hidden) {
      const x = x0 + Math.floor(Math.random() * (x1 - x0 + 1));
      const y = y0 + Math.floor(Math.random() * (y1 - y0 + 1));
      if (api.tileFree(x, y) && !api.visible((GOX + x) * 16, y * 16)) api.placeExtra(rat, x, y, 'left');
      return;
    }
    // it scuttles about until it has seen them; then it holds its ground
    if (rat.moving || api.busy() || dist(L, rat) <= 2 || api.frame() % 45 || Math.random() < 0.4) return;
    const [dx, dy] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
    const x = rat.tx - GOX + dx;
    const y = rat.ty + dy;
    if (x >= x0 && x <= x1 && y >= y0 && y <= y1 && api.tileFree(x, y)) api.stepExtra(rat, x, y);
  }
  function ratMeet() {
    api.playScene('shed-rat', [
      { bubble: ['rat', '!', 40] },
      { sfx: 'hiss' },
      { choice: { who: '', text: WORDS.finds.ratDare, options: WORDS.finds.ratChoice, then: (i) => (i === 0 ? [{ call: shedFight }] : [{ say: ['', WORDS.finds.ratLeave] }]) } },
    ]);
  }
  function shedFight() {
    api.startFight(ENCOUNTERS.shedRats(), {
      quiet: true,
      then(result) {
        if (result !== 'won') {
          api.say(WORDS.finds.ratLostLine, true);
          return api.startBolt(rat.tx, rat.ty);
        }
        // seen off once, they have left the garden for good
        rat.hidden = true;
        story().flags.shedRatsGone = true;
        api.discover('rat');
        if (q().socks === 'sock' || q().socks === 'done') api.say(WORDS.finds.noRats, true);
      },
    });
  }

  // ------------------------------------------------------ every frame
  function update() {
    if (!on() || !api.outside() || falling) return;
    const L = api.leader();
    if (story().act === 0) return act0Tick(L);
    roundsTick();
    // (Mission select: straight to the car pulling up at Amber's doors, after the vet's)
    if (story().flags.straightToDropOff && !api.busy()) {
      delete story().flags.straightToDropOff;
      return dropOffScene();
    }
    // (Mission select: straight to the end of the Thanos fight)
    if (story().flags.straightToRescue && !api.busy()) {
      delete story().flags.straightToRescue;
      const t = thanos();
      if (t) {
        appear(t, THANOS_AT[0], THANOS_AT[1]);
        return rescue();
      }
    }
    // the small white balls on the lawn
    // (none after the end: the man who hit them has moved out)
    const noBalls = story().act === 3 && story().quest.act3 === 'after';
    balls.forEach((b, i) => {
      if (noBalls) b.hidden = true;
      else if (b.hidden && api.tileFree(BALLS[i][0], BALLS[i][1])) api.placeExtra(b, BALLS[i][0], BALLS[i][1], 'down');
    });
    const eve = evening();
    // Hưng and Trang, out for their evening walk: they leave a plate, and watch the playground
    if (eve && hung.hidden && !story().adopted) {
      const [a] = watchersArrive();
      if (plateDay !== api.day()) {
        plateDay = api.day();
        const spot = api.freeNear(a[0] + 2, a[1] + 1, 2);
        people.kibble.push({ x: spot[0], y: spot[1], born: api.clock() });
      }
    } else if (!eve && !hung.hidden && !api.visible(hung.px, hung.py)) hung.hidden = trang.hidden = true;

    const stage = q().cheetos;
    if (stage === 'bars') {
      if (eve && man.hidden) {
        arrive();
        if (saidEvening !== api.day()) {
          saidEvening = api.day();
          api.wake();
          api.say(W.evening, true);
        }
      } else if (!eve && !man.hidden) {
        if (api.visible(man.px, man.py)) api.say(W.gone, true);
        leave();
      }
      if (!man.hidden) {
        manTick();
        // the first good look at him
        if (!story().flags.sawBars && dist(L, man) <= 7) {
          story().flags.sawBars = true;
          api.playScene('bars-first', [{ camera: 's' }, { wait: 50 }, ...lines(W.barsFirst), { camera: null }, { goal: W.goalMeow }]);
        }
      }
    } else if (!man.hidden) leave();

    if (q().cheetos === 'done') socksTick(L);
    mamaTick(L);
    thanosTick(L);
    ratTick(L);
    tellTick(L);
    if (api.busy()) return;
    // Cheetos comes over to meet the new cats
    const c = cheetos();
    const hungry = story().flags.a1Kibble === 'wait';
    if (hungry && !api.busy() && !breakfastPlate()) {
      const [x, y] = breakfastAt();
      people.kibble.push({ x, y, born: api.clock(), keep: true, breakfast: true });
    }
    if (stage === 'meet' && !hungry && c && !c.hidden && !c.ride && !c.moving && dist(L, c) <= 3 && api.visible(c.px, c.py)) dare(true);
  }

  // Scar hears about each of the three big days, once: how many there are to tell, and the telling
  const TALES = ['cheetos', 'socks', 'mama'];
  const told = () => story().flags.toldScar || 0;
  const tales = () => {
    let n = 0;
    while (n < TALES.length && q()[TALES[n]] === 'done') n++;
    return n;
  };
  // (which of the three is waiting to be told: 1, 2, 3, or 0)
  const toTell = () => (!on() || story().act !== 1 || story().adopted ? 0 : socksStage() === 'tell' ? 1 : mamaStage() === 'tell' ? 2 : thanosStage() === 'find' ? 3 : 0);
  const news = () => toTell() > 0;
  // The telling, and what comes of it. After the bars: Cheetos comes running to the shed with word of
  // a ghost. After the road: Socks, who has crossed it by herself, with word of a lost kitten. After
  // the kitten: Scar says where Thanos walks at midnight.
  function tellScar() {
    const i = toTell();
    if (!i) return;
    const L = api.leader();
    const sc = scar();
    story().flags.toldScar = i;
    const face = [{ call: () => { sc.pose = 'sit'; sc.dir = L.tx < sc.tx ? 'left' : L.tx > sc.tx ? 'right' : L.ty < sc.ty ? 'up' : 'down'; } }, { bubble: ['scar', '!', 40] }];
    if (i === 1) {
      const c = cheetos();
      const near = api.freeNear(L.tx - GOX - 1, L.ty + 1, 2, [[sc.tx - GOX, sc.ty]]);
      const from = api.freeNear(near[0] - 9, near[1] + 1, 3);
      return api.playScene('scar-tell1', [
        ...face,
        ...lines(W.tell1),
        { call: () => { if (c.ride) c.ride = null; strays.place(c, from[0], from[1]); c.hidden = false; c.pause = 1e9; c.pose = 'stand'; } },
        { say: W.morning1[0] },
        { walk: ['cheetos', GOX + near[0], near[1]] },
        { bubble: ['cheetos', '!!', 50] },
        ...lines(W.morning1.slice(1)),
        { flag: ['tips', true] },
        { goal: W.goalNext },
        { note: { title: NOTE.tip, text: W.tip, hi: NOTE.statWords, kind: 'tip' } },
      ], () => {
        q().socks = 'tag';
        story().flags.tips = true;
        c.pause = 0;
        strays.actions.bars(c);
      });
    }
    if (i === 2) {
      const s = socks();
      const F = api.other();
      const at = api.freeNear(F.tx - GOX, F.ty + 1, 2, [[sc.tx - GOX, sc.ty]]);
      return api.playScene('scar-tell2', [
        ...face,
        ...lines(W.tell2),
        { call: () => { appear(s, at[0], at[1]); s.pose = 'stand'; api.bubble(s, 'Tag!', 45); api.bubble(F, '?', 45); sfx.blip(); } },
        { wait: 30 },
        ...lines(W.morning2),
        { goal: W.goalKitten },
      ], () => {
        s.pause = 0; // she is her own cat again
        vanish(s);
        q().mama = 'search';
      });
    }
    api.playScene('scar-tell3', [...face, ...lines(W.tell3), { goal: W.goalThanosNight }], () => {
      q().thanos = 'night';
    });
  }
  // walking up to her is enough: the pair have come to tell her, and she can see that they have
  function tellTick(L) {
    const sc = scar();
    if (!toTell() || api.busy() || !sc || sc.hidden || !api.visible(sc.px, sc.py) || dist(L, sc) > 3) return;
    tellScar();
  }

  // The pair have walked into one of the garden's cats (or pressed Do in front
  // of it). True if the story dealt with it.
  function talk(cat, n) {
    if (!on() || story().act >= 3) return false; // (Act 3 has its own say: act3.js, and the game's own talk after it)
    const id = n.named ? n.def.id : '';
    if (story().act === 0) {
      if (id === 'scar' && W0.scarWaits[a0()]) api.say(W0.scarWaits[a0()]);
      return true;
    }
    if (id === 'scar' && news()) return tellScar(), true;
    if (id === 'cheetos') {
      const stage = q().cheetos;
      if (stage === 'meet' && story().flags.a1Kibble === 'wait') return false;
      if (stage === 'meet') return dare(true), true;
      if (stage === 'met') return dare(false), true;
      const line = strays.interact(cat, n.tx, n.ty, true);
      if (stage !== 'done') return api.say(line), true;
      api.openDialog({ text: line, choices: [W.playFight, W.notNow], then: (i) => i === 0 && playFight() });
      return true;
    }
    if (id === 'socks') {
      const stage = socksStage();
      if (stage === 'cross' && !escorting) return engage(), true;
      if (stage === 'jetty') {
        // walked into with the jetty's sock in his mouth: that is giving it to her. Without it, she says where it is.
        // (Her line is spoken, with her name on it: it is a dialog box, not a caption.)
        const held = api.carrying(cat);
        if (held && held.id === 'sock') return sockOne(cat, held), true;
        return api.playScene('socks-wait', [{ say: W.jettyWait }]), true;
      }
      const line = stage === 'cross' ? W.crossGo : stage === 'rats' || stage === 'sock' ? W.watch : strays.interact(cat, n.tx, n.ty, true);
      return api.say(line), true;
    }
    if (id === 'baby' && mamaStage() === 'search') return found(), true;
    if ((id === 'baby' || id === 'mama') && mamaStage() === 'fight') return mamaAgain(), true;
    if (id === 'baby' && mamaStage() === 'snake') return snakeAgain(), true;
    if (id === 'thanos' && thanosStage() === 'night' && late()) return thanosFace(), true;
    if (id === 'thanos') {
      // not yet (or not any more): he swats, and they run
      sfx.hiss();
      api.bubble(n, 'Hsss!', 70);
      for (const c of api.cats()) api.bubble(c, '!', 50);
      api.say(api.fmt(W.thanos, cat));
      api.startBolt(n.tx, n.ty);
      return true;
    }
    // anyone else has a line and nothing more, this early on
    api.say(strays.interact(cat, n.tx, n.ty, true));
    return true;
  }
  // ...or into one of the story's people
  function bump(cat, e) {
    if (e === bag) return api.say(api.fmt(W0.bag, cat));
    if (e === man) return shoo(cat);
    if (e === ally) return mamaStage() === 'fight' ? mamaAgain() : undefined;
    if (e === snake) return mamaStage() === 'snake' ? snakeAgain() : undefined;
    if (e === rat) return ratMeet();
    if (balls.includes(e)) {
      const first = !story().flags.sawBall;
      story().flags.sawBall = true;
      api.act(cat, 'look', 40);
      return api.say(api.fmt(W.ball[first ? 0 : 1], cat));
    }
    if (e !== hung && e !== trang) return undefined;
    api.bubble(e, q().cheetos === 'done' ? '♥' : '?', 70);
    api.act(cat, 'look', 40);
    api.say(api.fmt(pick((q().cheetos === 'done' ? W.friendly : W.wary)[cat.cfg.id]), cat));
  }
  // what the garden's cats say at this point of the story
  function linesFor(n) {
    if (!on()) return null;
    if (!n.named) return W.stray;
    if (n.def.id === 'scar') return W.scar;
    if (n.def.id === 'cheetos') return q().cheetos === 'bars' ? [W.cheetosBars] : W.cheetosFriend;
    if (n.def.id === 'socks') return W.socksFriendLines;
    if (n.def.id === 'mama' && mamaStage() === 'done') return W.mamaFriend;
    if (n.def.id === 'baby' && mamaStage() === 'done') return W.babyFriend;
    return null;
  }
  // ...and which of them are about: Cheetos while his story runs; Socks and
  // Mamacat keep out of sight until theirs begin
  function present(id) {
    if (!on()) return undefined;
    // the opening: nobody but Scar, and her only where the story has put her
    if (story().act === 0) return id === 'scar' && ['scar', 'follow', 'eat', 'ate', 'meter', 'bite', 'nap', 'orca', 'plates', 'club'].includes(a0());
    // through Act 1 Scar is always somewhere about her shed: she does not go past the lamp posts
    if (id === 'scar' && story().act === 1 && !story().adopted) return true;
    // (Cheetos isn't in the garden until the pair have had their breakfast, behind the cafe)
    if (id === 'cheetos') return q().cheetos === 'done' ? undefined : story().flags.a1Kibble !== 'wait';
    if (id === 'socks') {
      // out of sight until her story starts; where it needs her while it runs; her own cat after
      const stage = socksStage();
      return stage === 'done' ? undefined : stage === 'jetty' || stage === 'cross' || stage === 'rats' || stage === 'sock';
    }
    // Mamacat keeps out of sight until her kitten has been found; he is wherever the story has put him
    // Thanos: his own cat until somebody goes looking for him; then nowhere at all, except on his pavers from midnight
    if (id === 'thanos') return thanosStage() === 'find' ? false : thanosStage() === 'night' ? late() : undefined;
    if (id === 'mama' || id === 'baby') {
      const stage = mamaStage();
      return stage === 'done' ? undefined : stage === 'fight' || ((stage === 'search' || stage === 'snake') && id === 'baby');
    }
    return undefined;
  }

  // the pair have been knocked down on the road: that is enough for Socks
  function roadHit() {
    if (on() && escorting) disengage(W.crossHit);
  }
  // something has been offered to one of the garden's cats: true if the story takes it from there
  function give(cat, item, to) {
    if (!on() || to !== socks() || item.id !== 'sock') return false;
    if (socksStage() === 'jetty') return sockOne(cat, item), true;
    if (socksStage() !== 'sock') return false;
    meeting2(cat, item);
    return true;
  }

  // Places the story keeps clear of the garden's passers-by and cats for now (see keepOut in game.js): a box
  // in garden tiles, and the named cats who belong in it all the same.
  let rescuing = false; // the pair are down in front of Thanos, and Hưng and Trang are on their way
  let dropOff = false; // the car is pulling up at Amber's doors with the two of them in it
  const PAVERS = [SHED.x - 1, SHED.y - 12, SHED.x + SHED.w + 4, SHED.y + SHED.h + 1]; // the BBQ pavers, where Thanos waits
  function keepOut() {
    const z = [];
    if (story().mode !== 'story') return z;
    // Green Shirt at the monkey bars: nobody right beside them or under them (further off is fine)
    if (story().act === 1 && !man.hidden && (q().cheetos === 'bars' || falling)) z.push({ box: [BARS.x - 2, BARS.y - 2, BARS.x + BARS.w + 1, BARS.y + 2], allow: ['cheetos'] });
    // Thanos on his pavers, from the moment he is there: it is his, and nobody walks through it
    if (rescuing || (story().act === 1 && thanosStage() === 'night' && late())) z.push({ box: PAVERS, allow: ['thanos', 'scar'] });
    if (dropOff) z.push({ box: [HOME_KERB[1][0] - 8, ROAD.bottom - 1, ENTRANCE.doorX + 8, ENTRANCE.y + 2] });
    // the opening: the BBQ pavers are Shark's and Scar's (and whoever the story walks on), nobody else's
    if (story().act === 0) z.push({ box: [SHED.x - 2, 17, SHED.x + SHED.w + 5, 34], allow: ['scar'] });
    // Garnet's doors while BBC or Flower is at them (Act 1, Act 3, and by day after the end): nobody
    // comes out of those doors, crosses the step or stands about in front of it. (The row along the
    // kerb is left, for walking past.)
    const bare = api.extra && api.extra('a3bbc0'); // (BBC without his collar: Act 3's own)
    const atGarnet = (e) => e && !e.hidden && Math.abs(e.tx - GOX - GARNET.doorX) <= 4 && e.ty >= GARNET.y - 2 && e.ty <= GARNET.y - 1;
    if ([bbc, flower, bare].some(atGarnet)) z.push({ box: GARNET_FRONT });
    return z;
  }
  return { begin, begin0, ate, update, meow, talk, bump, blocks, keepOut, linesFor, present, roadHit, give, news, HOME, debug: { man, hung, trang, scarf, vet, nb, mum, kid, kicked, BREAKFAST, balls, BALLS, bbc, flower, GARNET_CATS, ally, snake, rat, sons, THANOS_AT, RAT_PATCH, NAP_BARS, NAP_NEST, WAIT, NEST, BABY_AT, HOME_BOX, SPOT, get mamaArmed() { return mamaArmed; }, get snakeArmed() { return snakeArmed; }, get tags() { return tags; }, set tagAt(v) { tagAt = v; }, get escorting() { return escorting; }, get ratsArmed() { return ratsArmed; }, get grip() { return grip; }, get phase() { return phase; }, set phase(p) { phase = p; phaseT = 0; }, get watching() { return watching; } } };
}
