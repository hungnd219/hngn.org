// Act 2, "House cats": the story indoors, from the first night in the flat to
// the robot vacuum on its back at the front door.
//
//   arrive   Late at night, the inner laundry room. Stripes and Polka let the pair
//            out of the bags and leave them to it.
//   escape   The player is Orca, who has never been indoors and means to leave.
//            Nothing in the flat answers him (see mute). At the foyer the robot
//            vacuum comes off its dock and both cats bolt back to the laundry
//            (no fight), where they sleep. By 5 AM he is taken there anyway.
//   food     Morning. Kibble in the machine (the wet food is for the evening),
//            and the two humans keeping out of the way. The player is Shark,
//            and only the kibble and the water answer him. Once he has eaten,
//            the humans come and sit on the floor, a long way off. By 9 AM he
//            is taken to the machine anyway.
//   explore  The first day. The flat is theirs, and Shark leads. Five things to
//            try, the well-behaved ones, in two groups (DAYS): a group
//            finished that day makes both cats stronger, and the first one
//            finished brings the two humans over. What is for tomorrow does
//            not answer yet. At 10 PM, or when all five are done, they sleep
//            on the guest bed, and the humans look in from the doorway.
//   explore2 The second day: five more, the ones humans do not like. It ends
//            the same way, whatever the hour. The master suite is the humans'
//            territory on both days.
//   bed      Late that night: up onto the big bed, beside the two of them.
//   balcony  Yowling outside. Dogs in the garden, and old friends.
//   wake     "Search for your owner": a meow by the bed, and this time somebody
//            answers. Shark wants to go down; Orca wants to stay.
//   kibble   The next morning, at the kibble machine, Orca hears Cheetos, and
//            leaves his breakfast.
//   robot1   The first fight with the robot vacuum, which cannot be won. Then it
//            is four in the afternoon.
//   learn    Evenings on the sofa: in front of the TV (TV_ZONE), Polka's music
//            show teaches Shark to Sing,
//            Stripes's football teaches Orca the Big Stretch (Meow, on cue, three
//            times running).
//   rematch  The robot beaten, and out of the door. End of Act 2.
//
// How far it has got is `story.quest.home`; what has been tried is `story.did`;
// the gains are `story.gains` (see HOME_GAINS and rungOf in story.js). Every word is in
// home-text.js. `api` is what the game lends (homeApi in game.js), and the game
// calls in here at a few points: every frame, when something is used, petted,
// eaten, knocked over or slept on, at doors, at a meow, at the Do button.
import { HOME as W } from './home-text.js';
import { WORDS } from './game-text.js';
import { ENCOUNTERS } from './story.js';

export const HOME_STAGES = ['arrive', 'escape', 'food', 'explore', 'explore2', 'bed', 'balcony', 'wake', 'kibble', 'robot1', 'learn', 'rematch', 'done'];
// What there is to try on each of the two days, in its two groups. A group pays (HOME_GAINS in
// story.js: 'play' ATK and AGL, 'care' HP) when all of it has been done on its own day.
export const DAYS = {
  explore: { play: ['wand', 'post', 'tunnel'], care: ['litter', 'wetfood'] },
  explore2: { play: ['sofa', 'curtain', 'knock'], care: ['trash', 'toilet'] },
};
// furniture that counts, when a cat has just used it
const USED = { wands: 'wand', post: 'post', sofa: 'sofa', litter: 'litter', trashcan: 'trash', toilet: 'toilet', toiletE: 'toilet' };
// ...what does not answer on the first day, because it is for the second
const DAY2_THINGS = ['sofa', 'trashcan', 'toilet', 'toiletE'];
// ...and what is not jumped onto that day: tables, counters, desks (things are knocked off those)
// ...except what was bought for cats
const OWN = ['cattree', 'catcab', 'cardbox'];
const TABLES = ['coffeetable', 'sidetable', 'tvwall', 'diningtable', 'island', 'counter', 'dresser', 'deskGuest', 'deskRun', 'deskSideL', 'deskSideR', 'wicIsland', 'vanityM', 'vanityS', 'usink', 'boxes'];
// in front of the TV: the two console tiles next to the screen, and the two floor tiles east of them
const TV_ZONE = [35, 5, 36, 6];
const NEST = [[50, 17], [51, 17]]; // where they sleep in the inner laundry room: Shark, Orca
const FOYER = [[36, 17], [34, 18]]; // where they stand when the night has run out: Shark, Orca
const FEEDER = [[43, 3], [44, 3]]; // in front of the kibble machine: Shark, Orca
const SOFA = [[40, 7], [40, 6]]; // on the floor in front of the sofa
const HALL_STOP = 26; // the first night, Orca goes no further west along the hallway than this
const MASTER_DOOR = [18, 15];
const MASTER = [16, 5, 23, 12]; // the bedroom itself
const BALCONY = [50, 2, 51, 12];
const MUSIC = 4; // TV channels
const FOOTBALL = 3;
const FLIP = 60 * 24; // frames a show stays on before the remote changes hands
const CUE = 85; // frames a cue stays up

export function createHome(api) {
  const { sfx } = api;
  const S = () => api.story();
  const f = () => S().flags;
  const stage = () => (S().quest && S().quest.home) || '';
  const idx = (st) => HOME_STAGES.indexOf(st);
  // the act is running (indoors only: nothing of it happens in the garden)
  const on = () => S().mode === 'story' && !!S().adopted && idx(stage()) >= 0 && stage() !== 'done';
  const before = (st) => idx(stage()) < idx(st);
  const lines = (list) => list.map((l) => ({ say: l }));
  const tip = (text) => ({ note: { title: WORDS.notes.tip, text, kind: 'tip' } });
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  const dist = (a, x, y) => Math.abs(a.tx - x) + Math.abs(a.ty - y);
  const inRect = (c, [x0, y0, x1, y1]) => c.tx >= x0 && c.tx <= x1 && c.ty >= y0 && c.ty <= y1;
  const evening = () => api.hour() >= 18 || api.hour() < 1;
  // The evenings with something to learn: the TV goes on once the cats' dinner has been put down
  // (a trip with the bowls in the middle of a lesson took a human off the sofa), or at eight if
  // nobody has brought it, and stays on until one.
  const tvTime = () => api.hour() < 1 || (api.hour() >= 18 && !api.bowls().busy && (api.fedToday() || api.hour() >= 20));
  // the first free floor tile at or near (x, y)
  const spot = (x, y, not = []) => {
    for (let r = 0; r < 6; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++)
          if (Math.max(Math.abs(dx), Math.abs(dy)) === r && api.free(x + dx, y + dy) && !not.some(([a, b]) => a === x + dx && b === y + dy)) return [x + dx, y + dy];
    return [x, y];
  };
  function go(st, goal) {
    S().quest.home = st;
    if (goal) api.setGoal(goal, true);
  }

  const queue = []; // first-time talks waiting for a quiet moment
  let wakeT = 0; // frames spent looking for the humans, on the night of the barking
  let pendingMeal = false; // the first breakfast has been started: the scene follows
  let lesson = null; // a lesson at the TV in progress: { kind, n, phase, t, who }
  let zoneKey = ''; // who was last seen in front of the TV, and what was on
  let flipAt = 0; // the frame the TV last changed hands
  let saidAt = -9999;
  let wasOn = false; // the two humans were watching TV a moment ago (an evening of lessons)
  const talked = {}; // the show a human has already grumbled about this evening: kind -> day

  // ------------------------------------------------------------ 2a: home
  // The first night. (Called when the adoption scene ends, and for a game
  // saved "at home" before this act was built.)
  function begin() {
    const s = S();
    Object.assign(s.quest, { home: 'arrive' });
    s.did = {};
    s.gains = {};
    s.hurt = { shark: 0, orca: 0 }; // (the vet has seen to them)
    f().holdHumans = true;
    api.settle();
    // (half past ten at night, whenever this starts: the night is as long every time)
    if (api.hour() < 22 || api.hour() > 23.5) api.setClock(22.5);
    api.setLeader(0);
    const a = spot(...NEST[0]);
    const b = spot(...NEST[1], [a]);
    api.putCat(0, a[0], a[1], 'left');
    api.putCat(1, b[0], b[1], 'left');
    const h = spot(48, 17, [a, b]);
    const t = spot(48, 16, [a, b, h]);
    api.standHuman(0, h[0], h[1], 'right');
    api.standHuman(1, t[0], t[1], 'right');
    api.setTV(0);
    const toBed = () => {
      api.putHuman(0, 'bed1', { asleep: true });
      api.putHuman(1, 'bed2', { asleep: true });
    };
    api.playScene('home-arrive', [
      { call: () => api.blackout() },
      { wait: 40 },
      { fade: 'in' },
      { wait: 30 },
      ...lines(W.arrive.slice(0, -1)),
      { walk: [1, 46, 16] },
      { walk: [0, 46, 17] },
      { fade: 'out' },
      { call: () => { toBed(); sfx.door(); } },
      { say: W.arrive[W.arrive.length - 1] },
      { fade: 'in' },
      { wait: 40 },
      ...lines(W.arriveAlone),
      { call: () => api.setLeader(1) },
      { goal: W.goals.escape },
    ], () => {
      toBed();
      api.setLeader(1);
      go('escape', W.goals.escape);
      api.camera();
    });
  }
  // The robot vacuum on somebody's heels: it goes where the cat `tail()` picks went, `lag` frames
  // behind (`each` is called every frame of the chase), and turns for home after `limit` frames.
  // `back(n)` takes it home to its dock the way it came, n times as fast.
  function chaser(tail, lag, limit = 1e9) {
    const v = api.object('vacuum');
    const T = api.T;
    const trail = [];
    let c = null;
    let i = 0;
    let out = false; // it has turned for home
    const at = (p) => {
      v.dx = p[0] - v.x * T;
      v.dy = p[1] - v.y * T;
    };
    const home = (n) => {
      if (api.frame() % 14 === 0) sfx.whirr(0.6);
      if (i > 0) return (i = Math.max(0, i - n)), at(trail[i]), false;
      const d = Math.hypot(v.dx || 0, v.dy || 0);
      if (d <= 2 * n) return (v.dx = v.dy = 0), true;
      v.dx -= (v.dx / d) * 2 * n;
      v.dy -= (v.dy / d) * 2 * n;
      return false;
    };
    return {
      each() {
        if (!c) {
          c = tail();
          const from = [v.x * T + (v.dx || 0), v.y * T + (v.dy || 0)];
          for (let k = 1; k < lag; k++) trail.push([from[0] + ((c.px - from[0]) * k) / lag, from[1] + ((c.py - from[1]) * k) / lag]);
        }
        if (out || i >= limit) return void (out = home(1) || true);
        trail.push([c.px, c.py]);
        at(trail[i++]);
        if (i % 14 === 1) sfx.whirr(0.6);
      },
      back: (n) => () => home(n),
    };
  }
  const nearest = (x, y) => () => api.cats().slice().sort((p, q) => dist(p, x, y) - dist(q, x, y))[0];
  // the night has run out, and Orca has not found the door: he is taken to it
  function lateEscape() {
    const place = () => {
      api.setLeader(1);
      api.putCat(0, FOYER[0][0], FOYER[0][1], 'left');
      api.putCat(1, FOYER[1][0], FOYER[1][1], 'left');
    };
    api.playScene('home-late-escape', [{ fade: 'out' }, { call: place }, { wait: 30 }, { fade: 'in' }, { say: ['', W.lateEscape] }], () => {
      place();
      robotScene();
    });
  }
  // Orca at the foyer: the robot vacuum, which he has never seen the like of. Both cats bolt
  // back to the laundry with it behind them; they sleep; and in the morning there is food.
  function robotScene() {
    const v = api.object('vacuum');
    const L = api.leader();
    const T = api.T;
    // it comes off its dock to the tile next to him, then presses on
    const stop = [L.tx + (L.tx > v.x ? -1 : 1), L.ty];
    let n = 0;
    const slide = (to, frames) => () => {
      if (n === 0) slide.from = [v.dx || 0, v.dy || 0];
      n++;
      const k = Math.min(1, n / frames);
      v.dx = slide.from[0] + ((to[0] - v.x) * T - slide.from[0]) * k;
      v.dy = slide.from[1] + ((to[1] - v.y) * T - slide.from[1]) * k;
      if (n % 14 === 1) sfx.whirr(0.6);
      if (k < 1) return false;
      n = 0;
      return true;
    };
    const a = spot(...NEST[0]);
    const b = spot(...NEST[1], [a]);
    // (it gives up after a few tiles: they do not look round to find that out)
    const chase = chaser(() => api.cats()[1], 10, 34);
    const nested = () => {
      v.dx = v.dy = 0;
      api.setLeader(0);
      api.putCat(0, a[0], a[1], 'left');
      api.putCat(1, b[0], b[1], 'right');
      S().quest.home = 'food';
    };
    api.playScene('home-robot', [
      { call: () => { sfx.beep(); for (const c of api.cats()) api.bubble(c, '!', 50); } },
      { say: W.robotMeets[0] },
      { say: W.robotMeets[1] },
      { until: slide([stop[0] + (L.tx > v.x ? -1 : 1), stop[1]], 70) },
      ...lines(W.robotMeets.slice(2, 4)),
      { call: () => { sfx.hiss(); api.bubble(api.cats()[1], 'HSSS!', 60); } },
      { until: slide(stop, 30) },
      { call: () => { sfx.bump(); api.bubble(api.cats()[1], '!!', 50); } },
      { say: W.robotMeets[4] },
      // the two of them bolt: across the kitchen and back into the laundry, flat out
      { call: () => { sfx.startle(); for (const c of api.cats()) api.bubble(c, '!!', 40); } },
      { walks: [['orca', b[0], b[1]], ['shark', a[0], a[1]]], frames: api.runFrames, each: chase.each },
      { until: chase.back(4) },
      { call: nested },
      { wait: 40 },
      ...lines(W.herded.slice(0, -1)),
      { call: () => api.lieDown() },
      { say: W.herded[W.herded.length - 1] },
      { fade: 'out' },
      { call: morningSetup },
      { wait: 70 },
      { fade: 'in' },
      { wait: 30 },
      { call: () => { sfx.whirr(0.6); sfx.beep(); } },
      ...lines(W.morning),
      { call: () => api.getUp() },
      { goal: W.goals.food },
    ], () => {
      v.dx = v.dy = 0;
      api.getUp();
      go('food', W.goals.food);
    });
  }
  // the first morning: kibble in the machine and nothing else (the wet food comes in the evening,
  // as it will every evening), the humans up but out of the way (at their desks, behind a door
  // Orca will not go through), and Shark leading
  function morningSetup() {
    // (unless it is that morning already: this may be called twice)
    if (api.hour() < 6.9 || api.hour() >= 9) api.setClock(7);
    api.settle();
    api.serve('kibble');
    f().holdHumans = true;
    api.putHuman(0, 'desk1', { seated: true });
    api.putHuman(1, 'desk2', { seated: true });
    api.setLeader(0);
    api.lieDown();
  }
  // nine o'clock, and Shark has not found the kibble: he is taken to it
  function lateFood() {
    const place = () => {
      api.setLeader(0);
      api.putCat(0, FEEDER[0][0], FEEDER[0][1], 'up');
      api.putCat(1, FEEDER[1][0], FEEDER[1][1], 'up');
    };
    api.playScene('home-late-food', [{ fade: 'out' }, { call: place }, { wait: 30 }, { fade: 'in' }, { say: ['', W.lateFood] }], () => {
      place();
      mealScene();
    });
  }
  // They eat, at the kibble machine. Then the two humans come in, and sit down on the floor, a
  // long way off. Shark stays where he is, beside Orca: he does not trust them all the way yet.
  function mealScene() {
    pendingMeal = false;
    const [sh, or] = api.cats();
    const L = api.leader();
    // (Orca comes to the dish too, if he is not beside it already)
    const o = dist(or, L.tx, L.ty) === 1 && or.ty === L.ty ? [or.tx, or.ty] : spot(L.tx + 1, L.ty, [[L.tx, L.ty]]);
    const hSpot = spot(L.tx - 4, L.ty, [o]);
    const tSpot = spot(L.tx - 5, L.ty + 1, [o, hSpot]);
    // (they arrive from the hallway, out of sight to the south)
    const from = [spot(36, 14), spot(35, 15)];
    const fed = () => {
      api.mend(1);
      api.serve('none');
    };
    api.playScene('home-meal', [
      { walk: ['orca', o[0], o[1]] },
      { face: ['orca', 'up'] },
      { call: () => { api.act(or, 'eat', 150, {}); api.act(sh, 'eat', 150, {}); sfx.crunch(); } },
      { wait: 60 },
      ...lines(W.firstMeal),
      { call: () => {
        fed();
        api.settle();
        api.standHuman(0, from[0][0], from[0][1], 'up');
        api.standHuman(1, from[1][0], from[1][1], 'up');
      } },
      { say: W.humansCome[0] },
      { walk: [0, hSpot[0], hSpot[1]] },
      { walk: [1, tSpot[0], tSpot[1]] },
      { face: [0, 'right'] },
      { face: [1, 'right'] },
      { face: ['shark', 'left'] },
      { face: ['orca', 'left'] },
      { call: () => { api.bubble(or, '!!', 60); } },
      ...lines(W.humansCome.slice(1, 5)),
      { call: () => api.bubble(sh, '?', 50) },
      ...lines(W.humansCome.slice(5, 10)),
      { face: ['orca', 'up'] },
      { call: () => api.act(or, 'eat', 90, {}) },
      ...lines(W.humansCome.slice(10)),
      { call: () => { S().quest.home = 'explore'; } },
      tip(W.tipExplore),
      { goal: W.goals.explore },
    ], () => {
      fed();
      delete f().holdHumans;
      api.releaseHuman(0);
      api.releaseHuman(1);
      go('explore', W.goals.explore);
    });
  }

  // --------------------------------------------------------- 2b: the flat
  // Two days. On each there are five things to try, in two groups (DAYS); a group finished on
  // its day makes both cats stronger for good, and one that is not is lost. The first group
  // finished each day brings the two humans over. Each day ends on the guest bed: when all
  // five are done, or at 10 PM.
  const today = () => DAYS[stage()] || null;
  const things = () => Object.values(today() || {}).flat();
  const gainKey = (g) => g + (stage() === 'explore2' ? 2 : 1);
  const late = () => api.hour() >= 22 || api.hour() < 5;
  // Something has been done for the first time: the talk about it follows when there is a moment.
  function did(key) {
    if (!on() || !things().includes(key) || f().eat2) return;
    const s = S();
    s.did = s.did || {};
    if (s.did[key]) return;
    s.did[key] = true;
    queue.push(key);
  }
  // a group complete: both cats are stronger, and (the first time each day) the humans will come over
  function gains() {
    const s = S();
    const day = today();
    if (!day) return;
    s.gains = s.gains || {};
    for (const g of Object.keys(day)) {
      const k = gainKey(g);
      if (s.gains[k] || !day[g].every((x) => s.did[x])) continue;
      s.gains[k] = true;
      const seen = 'visited' + (stage() === 'explore2' ? 2 : 1);
      if (!f()[seen]) f()[seen] = f().owed = true;
      api.note(WORDS.notes.stronger, W.gain[k], WORDS.notes.statWords.concat(['+2']));
      return;
    }
  }
  // both of them up, and neither in the middle of bringing the bowls
  const humansFree = () => api.humans().every((h) => !h.asleep) && !api.bowls().busy;
  const towards = (a, b) => (Math.abs(b.tx - a.tx) >= Math.abs(b.ty - a.ty) ? (b.tx < a.tx ? 'left' : 'right') : b.ty < a.ty ? 'up' : 'down');
  // The two humans drop what they are doing and come over to the cats. Day one: how clever, and
  // a first hand on Orca. Day two: a loving scolding, and Shark on his back.
  function visit() {
    delete f().owed;
    const two = stage() === 'explore2';
    const words = two ? W.visit2 : W.visit1;
    const [sh, or] = api.cats();
    const hs = api.humans();
    api.settle();
    const hSpot = spot(sh.tx, sh.ty);
    const tSpot = spot(or.tx, or.ty, [hSpot]);
    const come = () => {
      api.comeTo(0, hSpot[0], hSpot[1], 9);
      api.comeTo(1, tSpot[0], tSpot[1], 10);
    };
    const meet = () => {
      hs[0].dir = towards(hs[0], sh);
      hs[1].dir = towards(hs[1], or);
      if (!sh.onCurtain) sh.dir = towards(sh, hs[0]);
      if (!or.onCurtain) or.dir = towards(or, hs[1]);
    };
    const pet = (h, c) => () => {
      api.bubble(h, '♥', 80);
      api.act(c, 'purr', 90);
      sfx.purr();
    };
    api.playScene('home-visit-' + (two ? 2 : 1), [
      { call: come },
      { say: words[0] },
      { walks: [[0, hSpot[0], hSpot[1]], [1, tSpot[0], tSpot[1]]] },
      { call: meet },
      ...(two
        ? [
          // (cut where the hands go down: after "puts a hand down", and after "finds his chin")
          ...lines(words.slice(1, 6)),
          { call: pet(hs[0], sh) },
          { call: () => { sh.pose = 'sleep'; } },
          ...lines(words.slice(6, 9)),
          { call: pet(hs[1], or) },
          ...lines(words.slice(9)),
          { call: () => { sh.pose = 'sit'; } },
        ]
        : [
          ...lines(words.slice(1, 3)),
          { call: pet(hs[0], sh) },
          { say: words[3] },
          { call: () => api.bubble(or, '!!', 50) },
          ...lines(words.slice(4, 7)),
          { call: pet(hs[1], or) },
          ...lines(words.slice(7)),
        ]),
    ], () => {
      api.releaseHuman(0);
      api.releaseHuman(1);
    });
  }
  // The guest room: where the cats come in, where they hop up, where they lie; the doorway, and
  // where the two humans wait out of sight along the hallway.
  // (Stripes goes in first and stands just inside; Polka stops in the doorway itself. He starts a step
  // ahead of her along the hallway, so that she is not in his way.)
  const GUEST = { cats: [[27, 11], [26, 11]], bedside: [[30, 10], [29, 10]], bed: [[30, 9], [29, 9]], door: [[26, 12], [26, 13]], hall: [[20, 14], [19, 14]], cam: [31, 11] };
  const still = () => !api.cats().some((c) => c.moving);
  // to the guest room and up onto the bed (after a fade), and a few words there
  const toGuestBed = (words) => [
    { fade: 'out' },
    { call: () => {
      api.settle();
      api.setLeader(0);
      GUEST.cats.forEach(([x, y], i) => api.putCat(i, x, y, 'right'));
      GUEST.hall.forEach(([x, y], i) => api.standHuman(i, x, y, 'right'));
    } },
    { camera: GUEST.cam },
    { wait: 30 },
    { fade: 'in' },
    { walks: GUEST.bedside.map(([x, y], i) => [i ? 'orca' : 'shark', x, y]) },
    { call: () => GUEST.bed.forEach(([x, y], i) => api.hop(i, x, y)) },
    { until: still },
    { wait: 20 },
    ...lines(words),
    { call: () => api.lieDown() },
    { wait: 50 },
  ];
  // ...and the two humans in its doorway, who do not come in (`last`: said after they have gone)
  const atDoorway = (words) => [
    { say: words[0] },
    { walks: GUEST.door.map(([x, y], i) => [i, x, y]) },
    { face: [0, 'right'] },
    { face: [1, 'up'] },
    ...lines(words.slice(1, -1)),
    { walks: GUEST.hall.map(([x, y], i) => [i, x, y]) },
    { say: words[words.length - 1] },
  ];
  const onGuestBed = () => {
    api.setLeader(0);
    GUEST.bed.forEach(([x, y], i) => api.putCat(i, x, y, 'down'));
    api.lieDown();
  };
  // The first day is over: the guest bed, the humans in the doorway, and the second morning.
  function nightfall1() {
    queue.length = 0;
    delete f().owed;
    api.playScene('home-day1-end', [
      ...lines(W.day1End),
      ...toGuestBed(W.guestBed),
      ...atDoorway(W.doorway1),
      { fade: 'out' },
      { call: day2Setup },
      { wait: 70 },
      { fade: 'in' },
      { wait: 30 },
      { call: () => { sfx.whirr(0.6); sfx.beep(); } },
      ...lines(W.day2Morning),
      { call: () => api.getUp() },
      { goal: W.goals.eat2 },
    ], () => {
      if (stage() !== 'explore2') day2Setup();
      api.getUp();
      go('explore2', f().eat2 ? W.goals.eat2 : W.goals.explore2);
    });
  }
  // The second morning's breakfast, at the kibble machine: nothing else answers until it is eaten
  // (`eat2`). Orca and food, a day on: it came again, and he hides one piece, not three.
  function breakfast2() {
    const [sh, or] = api.cats();
    const place = () => {
      api.putCat(0, FEEDER[0][0], FEEDER[0][1], 'up');
      api.putCat(1, FEEDER[1][0], FEEDER[1][1], 'up');
    };
    const fed = () => {
      delete f().eat2;
      f().fed2 = true;
      api.mend(1);
      api.serve('none');
    };
    // (after nine he is taken to it, as on the first morning)
    const far = dist(api.leader(), FEEDER[0][0], FEEDER[0][1]) > 3;
    api.playScene('home-breakfast2', [
      ...(far ? [{ fade: 'out' }, { call: place }, { wait: 30 }, { fade: 'in' }, { say: ['', W.lateFood] }] : [{ walks: [['shark', FEEDER[0][0], FEEDER[0][1]], ['orca', FEEDER[1][0], FEEDER[1][1]]] }]),
      { face: ['shark', 'up'] },
      { face: ['orca', 'up'] },
      ...lines(W.breakfast2.slice(0, 4)),
      { call: () => { api.act(or, 'eat', 150, {}); api.act(sh, 'eat', 150, {}); sfx.crunch(); } },
      { wait: 60 },
      ...lines(W.breakfast2.slice(4)),
      { call: fed },
      tip(W.tipDay2),
      { goal: W.goals.explore2 },
    ], () => {
      if (f().eat2) place();
      fed();
      go('explore2', W.goals.explore2);
    });
  }
  // the second morning: kibble, the cats on the guest bed, the humans still asleep for a little while
  function day2Setup() {
    // (unless it is that morning already: this may be called twice)
    if (stage() !== 'explore2' || api.hour() < 6.9 || api.hour() >= 9) api.setClock(7);
    S().quest.home = 'explore2';
    queue.length = 0;
    delete f().owed;
    api.settle();
    api.serve('kibble');
    api.putHuman(0, 'bed1', { asleep: true });
    api.putHuman(1, 'bed2', { asleep: true });
    api.humans()[0].wakeAt = 7.2;
    api.humans()[1].wakeAt = 7.4;
    api.setTV(0);
    if (!f().fed2) f().eat2 = true;
    onGuestBed();
  }
  // The second day is over: the guest bed again, the doorway again, and then the night.
  function nightfall2() {
    queue.length = 0;
    delete f().owed;
    api.playScene('home-day2-end', [
      ...lines(W.day2End),
      ...toGuestBed(W.guestBed2),
      { fade: 'out' },
      // (it may have been the middle of the day: the doorway is late that evening)
      { call: () => { if (api.hour() >= 5 && api.hour() < 22) api.setClock(22.2); onGuestBed(); } },
      { wait: 50 },
      { fade: 'in' },
      ...atDoorway(W.doorway2),
      { fade: 'out' },
      { call: nightSetup },
      { wait: 70 },
      { fade: 'in' },
      { wait: 40 },
      { call: () => { api.cats()[1].pose = 'sit'; api.bubble(api.cats()[1], '?', 50); } },
      ...lines(W.lateNight),
      { call: () => api.getUp() },
      { goal: W.goals.bed },
    ], () => {
      if (stage() !== 'bed') nightSetup();
      api.getUp();
      go('bed', W.goals.bed);
    });
  }
  // half past one in the morning, and it stays that until the humans have been woken
  function nightSetup() {
    api.settle();
    // (unless it is that night already: this may be called twice)
    if (!f().holdClock) api.setClock(1.5);
    f().holdClock = true;
    delete f().owed;
    api.putHuman(0, 'bed1', { asleep: true });
    api.putHuman(1, 'bed2', { asleep: true });
    api.setTV(0);
    onGuestBed();
    S().quest.home = 'bed';
  }

  // -------------------------------------------------------- 2c: the night
  // the tenth thing: asleep on the big bed, beside the two of them. Then a yowl.
  function bedScene() {
    S().did.bed = true;
    api.playScene('home-bed', [
      ...lines(W.bedScene.slice(0, 5)),
      { call: () => api.lieDown() },
      ...lines(W.bedScene.slice(5)),
      { fade: 'out' },
      ...yowlSteps(),
    ], () => {
      api.getUp();
      go('balcony', W.goals.balcony);
    });
  }
  // ...some time in the night (the screen is black): a yowl from far below, and both of them are awake
  const yowlSteps = () => [
    { wait: 90 },
    { call: () => { sfx.meow(300); S().quest.home = 'balcony'; } },
    { wait: 50 },
    { call: () => sfx.meow(340) },
    { say: W.yowl[0] },
    { fade: 'in' },
    { call: () => { api.getUp(); for (const c of api.cats()) api.bubble(c, '!', 50); } },
    ...lines(W.yowl.slice(1)),
    { goal: W.goals.balcony },
  ];
  // (by itself, where the chapter "One Whole Cat" starts: the pair asleep on the big bed already)
  function yowlScene() {
    api.playScene('home-yowl', [{ call: () => { api.blackout(); api.lieDown(); } }, ...yowlSteps()], () => {
      api.getUp();
      go('balcony', W.goals.balcony);
    });
  }
  // Out on the balcony: dogs below, voices they know, and two house cats who do not mind. They
  // are across the gap, on the balconies of two flats in Garnet that share a wall: the view goes
  // over to them when they are the ones talking, and comes back to the pair (see garnet.js).
  function balconyScene() {
    const bark = () => (sfx.bark || sfx.startle)();
    const B = W.balconyScene;
    const garnet = (state) => ({ pan: { kind: 'garnet', state } });
    const amber = { pan: null };
    api.playScene('home-balcony', [
      { say: B[0] },
      { call: bark },
      { wait: 20 },
      { call: bark },
      ...lines(B.slice(1, 3)),
      { call: () => sfx.meow(1000) },
      ...lines(B.slice(3, 5)),
      { call: bark },
      // across to Garnet: the two of them, each on its own rail
      garnet('cats'),
      { wait: 20 },
      ...lines(B.slice(5, 7)),
      // (back to Amber: the pair know them, from the steps of Garnet in Act 1)
      amber,
      ...lines(B.slice(7, 10)),
      garnet('cats'),
      ...lines(B.slice(10, 12)),
      // down off the rails, and indoors
      garnet('down'),
      { call: () => sfx.land() },
      { wait: 30 },
      garnet({ cats: 'in' }),
      { wait: 130 },
      garnet('gone'),
      { wait: 20 },
      { say: B[12] },
      amber,
      { call: () => { for (const c of api.cats()) api.bubble(c, '!!', 60); bark(); } },
      ...lines(W.freakOut),
      { goal: W.goals.wake },
    ], () => go('wake', W.goals.wake));
  }
  // A meow by the bed, and somebody answers at once. They are safe up here, the humans say:
  // which is the trouble. Then the morning.
  function wokenScene() {
    const hs = api.humans();
    api.playScene('home-woken', [
      { say: W.woken[0] },
      { call: () => { hs[0].asleep = false; api.bubble(hs[0], '!', 60); } },
      ...lines(W.woken.slice(1, 3)),
      { call: () => { hs[1].asleep = false; api.bubble(hs[1], '...', 60); } },
      { say: W.woken[3] },
      { call: () => (sfx.bark || sfx.startle)() },
      ...lines(W.woken.slice(4)),
      { call: () => { api.lieDown(); sfx.purr(); } },
      { wait: 40 },
      ...lines(W.conflict),
      { fade: 'out' },
      { call: dayAfter },
      { wait: 80 },
      { fade: 'in' },
      { call: () => { sfx.whirr(0.6); sfx.beep(); } },
      { say: ['', W.morningAfter] },
      { call: () => api.getUp() },
      { goal: W.goals.kibble },
    ], () => {
      if (stage() !== 'kibble') dayAfter();
      api.getUp();
      go('kibble', W.goals.kibble);
    });
  }
  // the third morning: kibble in the machine, and the cats where they fell asleep
  function dayAfter() {
    delete f().holdClock;
    // (unless it is that morning already: this may be called twice)
    if (stage() !== 'kibble') api.setClock(7);
    api.serve('kibble');
    api.putHuman(0, 'bed1', { asleep: true });
    api.putHuman(1, 'bed2', { asleep: true });
    api.humans()[0].wakeAt = 7.7;
    api.humans()[1].wakeAt = 8;
    S().quest.home = 'kibble';
  }

  // ------------------------------------------------------- 2d: the robot
  // at the kibble machine: Cheetos's voice, from the balcony, and for once the kibble comes second
  function kibbleScene() {
    const [sh, or] = api.cats();
    const away = spot(or.tx, or.ty + 3, [[sh.tx, sh.ty]]);
    api.playScene('home-kibble', [
      ...lines(W.kibbleYowl.slice(0, 3)),
      { call: () => { sfx.meow(1000); for (const c of api.cats()) api.bubble(c, '!', 50); } },
      { wait: 30 },
      ...lines(W.kibbleYowl.slice(3, 6)),
      { walk: ['orca', away[0], away[1]] },
      { face: ['orca', 'down'] },
      ...lines(W.kibbleYowl.slice(6)),
      { goal: W.goals.robot },
    ], () => go('robot1', W.goals.robot));
  }
  // The fight is lost (or has run out): the robot vacuum herds the two of them back to the sofa,
  // and goes home to its dock. `after`: what is said there.
  function herdScene(id, after, done) {
    const v = api.object('vacuum');
    const a = spot(...SOFA[0]);
    const b = spot(...SOFA[1], [a]);
    const chase = chaser(nearest(v.x, v.y), 14);
    api.playScene(id, [
      { wait: 20 },
      { call: () => { sfx.beep(); for (const c of api.cats()) api.bubble(c, '!', 40); } },
      { walks: [['shark', a[0], a[1]], ['orca', b[0], b[1]]], frames: 8, each: chase.each },
      { face: ['shark', 'left'] },
      { face: ['orca', 'left'] },
      { call: () => sfx.beep() },
      { wait: 40 },
      { until: chase.back(3) },
      { wait: 20 },
      ...after,
    ], () => {
      v.dx = v.dy = 0;
      if (dist(api.cats()[0], a[0], a[1]) + dist(api.cats()[1], b[0], b[1]) > 0) {
        api.putCat(0, a[0], a[1], 'left');
        api.putCat(1, b[0], b[1], 'left');
      }
      if (done) done();
    });
  }
  // four in the afternoon, the same day, with the humans at their desks (unless it is later than that already)
  function afternoon() {
    if (api.hour() >= 16) return;
    api.settle();
    api.setClock(16);
    api.putHuman(0, 'desk1', { seated: true });
    api.putHuman(1, 'desk2', { seated: true });
  }
  // at the robot vacuum, or the front door behind it: what happens depends on how far things have got
  function robot(cat) {
    const st = stage();
    if (st === 'escape') return robotScene();
    if (st === 'robot1') {
      // (the first attack on it misses and the next that shows better than 0% lands, whatever the odds: so that the miss is
      // seen, and then the recharge)
      return api.startFight(ENCOUNTERS.robot({ intro: W.fight1.intro, timeout: W.fight1.timeout, lost: W.fight1.lost, fate: ['miss', 'hit'] }), {
        robot: true, plain: true, quiet: true, ownHerd: true,
        // (herded to the sofa; and then it is four in the afternoon, and they have been at it all day)
        then: (r) => (r === 'won' ? outScene() : herdScene('home-clues', [
          { fade: 'out' },
          { call: afternoon },
          { wait: 60 },
          { fade: 'in' },
          ...lines(W.clues),
          { goal: W.goals.learn },
        ], () => {
          afternoon();
          go('learn', W.goals.learn);
        })),
      });
    }
    if (st === 'rematch' && !f().lightsOut) return api.playScene('home-robot-wait', lines(W.robotWait));
    if (st === 'rematch') {
      return api.startFight(ENCOUNTERS.robot({ intro: W.fight2.intro, won: W.fight2.won }), {
        robot: true, plain: true, quiet: true, ownHerd: true,
        then: (r) => (r === 'won' ? outScene() : herdScene('home-herded', [{ say: ['', WORDS.robot.back] }])),
      });
    }
    const words = st === 'kibble' ? W.orcaWontGo : st === 'learn' ? W.robotNotYet : W.doorNo;
    api.playScene('home-door-' + st, lines(words));
    void cat;
  }
  // The robot beaten: a look back, the door, and out of it. Nobody is given the flat to dawdle
  // in: it fades, and they are down in the garden.
  function outScene() {
    const cs = api.cats();
    api.playScene('home-out', [
      { wait: 30 },
      ...lines(W.out),
      { sfx: 'door' },
      { walks: [['shark', 29, 20], ['orca', 30, 20]] },
      { face: ['shark', 'down'] },
      { face: ['orca', 'down'] },
      { call: () => { cs[0].hidden = true; sfx.jump(); } },
      { wait: 16 },
      { call: () => { cs[1].hidden = true; sfx.jump(); } },
      { wait: 30 },
      { fade: 'out' },
      { call: () => { S().quest.home = 'done'; S().stage = 'house'; } },
    ], () => {
      // Act 2 is over, and Act 3 (act3.js) starts on the doorstep, from this same black screen
      S().stage = 'house';
      S().quest.home = 'done';
      api.act3Begin();
      api.leave();
    });
  }
  // --- evenings on the sofa
  const watching = () => api.humans().some((h) => h.seated && h.wp.act === 'tv');
  const inZone = (c) => inRect(c, TV_ZONE);
  // Walking into the TV (or Do at it) while the lessons are on: the cats cannot change the channel.
  function tv() {
    api.say(watching() ? W.tvLocked : W.tvDay);
  }
  // Somebody is sitting in front of the TV (TV_ZONE): a lesson, if it is the right show for this
  // cat; if it is not, he says so. Once for each cat and show, until he walks away and comes back.
  function zone() {
    const L = api.leader();
    if (!inZone(L)) return void (zoneKey = '');
    if (L.moving || !api.idle()) return;
    const who = L.cfg.id;
    const ch = api.tv();
    const showing = watching() && (ch === MUSIC || ch === FOOTBALL);
    const key = who + (showing ? ch : '');
    if (key === zoneKey) return;
    zoneKey = key;
    // (by day there is nobody on the sofa and nothing on)
    if (!showing) return api.say(W.tvDay);
    const kind = who === 'shark' ? 'sing' : 'stretch';
    const right = who === 'shark' ? ch === MUSIC : ch === FOOTBALL;
    const told = (k) => talked[k] === api.day() || ((talked[k] = api.day()), false);
    // the wrong show for him (or one he has learned already): he says so once an evening, and
    // after that there is only the reminder of how the channel changes
    if (!right || f()[kind]) {
      if (f()[kind] && right) return api.say(api.fmt(W.tvKnown, L));
      if (told('wrong' + who)) return api.say(W.wrongTip);
      return api.playScene('home-wrong-' + who, lines(W.wrongShow[who]), () => api.say(W.wrongTip));
    }
    const start = () => (lesson = { kind, n: 0, phase: 'wait', t: 70 + rnd(50), who });
    // whoever's show it is has something to say about it first, and then the tip (once an evening)
    if (told(kind)) return api.say(W.cue.again, true), start();
    api.playScene('home-lesson-' + kind, [...lines(W.showTalk[kind]), tip(kind === 'sing' ? W.singTip : W.stretchTip)], start);
  }
  function lessonTick() {
    const L = api.leader();
    if (!watching()) return void (lesson = null);
    // (he has walked away from the TV, or the other one has been given the lead)
    if (L.cfg.id !== lesson.who || !inZone(L)) {
      lesson = null;
      zoneKey = '';
      return api.say(api.fmt(W.cue.left, L), true);
    }
    // (no dozing off in the middle of it)
    L.idle = 0;
    if (--lesson.t > 0) return;
    if (lesson.phase === 'done') return learned(lesson.kind);
    if (lesson.phase === 'wait') {
      // the cue: over the TV, in front of him
      lesson.phase = 'cue';
      lesson.t = CUE;
      api.bubble({ px: (TV_ZONE[0] - 1) * api.T + 4, py: TV_ZONE[1] * api.T, z: 0 }, lesson.kind === 'sing' ? '♪' : '!', CUE);
      (lesson.kind === 'sing' ? sfx.chirp : sfx.blip)();
    } else {
      lesson.n = 0;
      lesson.phase = 'wait';
      lesson.t = 90 + rnd(50);
      api.say(W.cue.late, true);
    }
  }
  // the button for the lesson has been pressed (Meow, for both of them)
  function press() {
    const L = api.leader();
    if (lesson.phase === 'done') return;
    if (lesson.phase !== 'cue') {
      lesson.n = 0;
      lesson.t = 90 + rnd(50);
      return api.say(W.cue.early, true);
    }
    lesson.n++;
    api.act(L, lesson.kind === 'sing' ? 'meow' : 'look', 30);
    if (lesson.kind === 'stretch') sfx.jump();
    // (the third one is said in a box of its own, in the scene that follows: see learned)
    if (lesson.n < 3) api.say(W.cue[lesson.kind + 'Good'][lesson.n - 1], true);
    lesson.phase = lesson.n >= 3 ? 'done' : 'wait';
    lesson.t = lesson.n >= 3 ? 40 : 80 + rnd(50);
  }
  function learned(kind) {
    lesson = null;
    flipAt = api.frame();
    const sing = kind === 'sing';
    f()[sing ? 'sing' : 'stretch'] = true;
    const both = f().sing && f().stretch;
    const after = sing ? W.afterSing : W.afterStretch;
    api.playScene('home-learn-' + kind, [
      { say: ['', W.cue[kind + 'Good'][2]] },
      { wait: 20 },
      { note: { title: WORDS.notes.newMove, text: sing ? W.learnSing : W.learnStretch, hi: [sing ? 'SING' : 'BIG STRETCH'] } },
      // (the last line points the other cat at the other show: not needed once he has his move)
      ...lines(both ? [after[0], ...W.bothLearned] : after),
      ...(both ? [{ call: early }, { goal: W.goals.waitBed }] : []),
    ], () => {
      if (!both) return;
      early();
      go('rematch', W.goals.waitBed);
    });
  }
  // (with both moves learned the humans do not sit up late: an early night, by half past ten)
  function early() {
    api.humans().forEach((h, i) => { h.bedAt = Math.min(h.bedAt, Math.max(api.hour() < 6 ? 0 : api.hour(), 21.5) + 0.3 + i * 0.3); });
  }

  // ---------------------------------------------------------- every frame
  function update() {
    const s = S();
    if (s.mode !== 'story' || !s.adopted || api.outside() || api.busy()) return;
    // (a game saved "at home" before this act was built starts it from the first night)
    if (!s.quest.home && s.act === 2 && !f().robotBeaten) return begin();
    migrate();
    if (!on()) return;
    const L = api.leader();
    const st = stage();
    if (st === 'arrive') return begin();
    if (st === 'escape') {
      if (api.cats().indexOf(L) !== 1) api.setLeader(1);
      if (L.tx <= 35 && L.ty >= 16 && !L.moving) robotScene();
      // (the night began at half past ten: by five he has dawdled long enough)
      else if (api.hour() >= 5 && api.hour() < 22 && api.idle()) lateEscape();
      return;
    }
    if (st === 'food') {
      if (api.cats().indexOf(L) !== 0) api.setLeader(0);
      if (pendingMeal && api.idle()) mealScene();
      else if (!pendingMeal && api.hour() >= 9 && api.idle()) lateFood();
      return;
    }
    if (st === 'explore' || st === 'explore2') {
      supper();
      // (Shark leads: it is his flat to show)
      if (api.cats().indexOf(L) !== 0) return void api.setLeader(0);
      // the second morning: breakfast before anything else (by nine he is taken to it)
      if (f().eat2) {
        if ((dist(L, FEEDER[0][0], FEEDER[0][1]) <= 2 || api.hour() >= 9) && api.idle()) breakfast2();
        return;
      }
      // a first time to talk about
      if (queue.length && api.idle()) {
        const k = queue.shift();
        return api.playScene('home-first-' + k, [{ wait: 20 }, ...lines(W.first[k])], gains);
      }
      // the first group of the day is done: the two humans come over, as soon as both are up
      if (f().owed && api.idle() && humansFree()) return visit();
      // the day is over: all five, or ten o'clock
      const all = things().every((k) => (s.did || {})[k]);
      if (((all && !queue.length && !f().owed) || late()) && api.idle()) (st === 'explore' ? nightfall1 : nightfall2)();
      return;
    }
    if (st === 'bed') {
      // up onto the big bed, beside the two of them: that is enough (no need to find the nap button
      // with a sleeping human in front of his nose)
      if (api.perch(L) === 'bedMaster' && api.idle()) bedScene();
      return;
    }
    if (st === 'balcony') {
      if (inRect(L, BALCONY) && api.idle()) balconyScene();
      return;
    }
    if (st === 'rematch') {
      // the humans are in bed, both of them: now (and from now on, if this try is lost)
      if (!f().lightsOut && api.humans().every((h) => h.asleep) && api.idle()) {
        f().lightsOut = true;
        api.wake();
        api.playScene('home-lights-out', [...lines(W.lightsOut), { goal: W.goals.rematch }], () => go('rematch', W.goals.rematch));
      }
      return;
    }
    if (st === 'wake') {
      // a minute of looking, and no meow yet: Shark says what it will take (once)
      if (!f().wakeHint && ++wakeT > 3600 && api.idle()) {
        f().wakeHint = true;
        api.playScene('home-wake-hint', lines(W.wakeHint));
      }
      return;
    }
    wakeT = 0;
    if (st === 'kibble') {
      const m = api.feeder();
      if (dist(L, m.x, m.y) <= 2 && api.idle()) kibbleScene();
      return;
    }
    if (st === 'learn') {
      if (lesson) return lessonTick();
      if (!watching()) {
        // it has got late, and they have switched it off and gone to bed
        if (wasOn && !evening() && api.hour() < 6 && api.idle()) {
          wasOn = false;
          api.setTV(0);
          if (dist(L, 40, 6) <= 12) api.playScene('home-tv-off', lines(W.tvOff));
        } else if (evening() || api.hour() >= 6) wasOn = false;
        return zone();
      }
      wasOn = true;
      // one of the two shows is always on, and the remote changes hands now and then
      const ch = api.tv();
      if (ch !== MUSIC && ch !== FOOTBALL) {
        api.setTV(MUSIC);
        flipAt = api.frame();
      } else if (api.frame() - flipAt > FLIP) {
        flipAt = api.frame();
        api.setTV(ch === MUSIC ? FOOTBALL : MUSIC);
        if (dist(L, 41, 6) <= 9) api.say(ch === MUSIC ? W.remote.football : W.remote.music);
      }
      if (!f().tvNotice && dist(L, 40, 6) <= 4 && api.idle()) {
        f().tvNotice = true;
        return api.playScene('home-tv', [...lines(W.tvNotice), tip(W.tvTip)]);
      }
      zone();
    }
  }

  // The evening's wet food, if nobody has been free to bring it an hour after its time: it is
  // put down all the same. (The first day's is one of the things to try.)
  function supper() {
    const h = api.hour();
    if (h < 19.4 || h >= 21.5 || api.fedToday()) return;
    api.unstick();
    if (api.bowls().busy) return;
    api.serve('wet');
    api.wake();
    api.say(W.served);
  }

  // ------------------------------------------------- what the game asks
  // In front of a cat is `o` (a piece of furniture, or nothing: a human, a door, a window).
  // True if it does not answer him: the first night only the robot vacuum does, and the first
  // morning only the kibble machine and the water.
  function mute(o) {
    if (!on()) return false;
    const st = stage();
    const t = o ? o.type : '';
    if (st === 'escape') return t !== 'vacuum';
    if (st === 'food') return t !== 'feeder' && t !== 'fountain';
    // the first day: what is for the second day waits for it
    if (st === 'explore' && DAY2_THINGS.includes(t)) return notToday('thing'), true;
    // the second morning, before breakfast: only the kibble machine and the water
    if (f().eat2 && t !== 'feeder' && t !== 'fountain') return notToday('hungry'), true;
    return false;
  }
  function notToday(what) {
    if (api.frame() - saidAt < 240) return;
    saidAt = api.frame();
    api.say(W.notToday[what]);
  }
  // something has just been used (walked into, or Do pressed in front of it)
  function used(o, cat) {
    if (USED[o.type]) did(USED[o.type]);
    void cat;
  }
  // ...or is about to be: true if the story has taken it from there
  function bump(cat, o) {
    if (!on()) return false;
    if (o.type === 'vacuum') return robot(cat), true;
    if (o.type === 'tvwall' && stage() === 'learn') return tv(), true;
    return false;
  }
  // the front door: the robot is in front of it until it has been beaten
  function door(cat) {
    if (!on()) return false;
    robot(cat);
    return true;
  }
  // a portion has been eaten: true if the story has something of its own to say about it
  function ate(o, cat) {
    if (!on()) return false;
    if (stage() === 'food') return (pendingMeal = true);
    if (o === api.bowls()) did('wetfood');
    return false;
  }
  // a tile the leader is about to step onto: true if he does not
  function blocks(tx, ty, cat) {
    if (!on()) return false;
    const st = stage();
    if (st === 'escape' || st === 'food') {
      // nothing is climbed or jumped onto yet
      if (api.surface(tx, ty)) return true;
      // the first night, along the hallway: the bedrooms are that way, and so are the humans
      if (st === 'escape' && tx <= HALL_STOP && tx < cat.tx && (ty === 14 || ty === 15)) {
        if (api.frame() - saidAt > 120) {
          saidAt = api.frame();
          api.playScene('home-hall', [...lines(W.hallNo), { face: ['orca', 'right'] }], () => (cat.dir = 'right'));
        }
        return true;
      }
    }
    // the first day: nothing of the humans' is climbed (a guest keeps to the floor), the guest bed
    // included, until they have slept on it. Their own things are theirs from the start.
    if (st === 'explore' && api.surface(tx, ty) && !OWN.includes(api.perchType(tx, ty)) && !api.surface(cat.tx, cat.ty)) return notToday('up'), true;
    if (f().eat2 && api.surface(tx, ty) && !api.surface(cat.tx, cat.ty)) return notToday('hungry'), true;
    if (tx !== MASTER_DOOR[0] || ty !== MASTER_DOOR[1] || !before('bed') || cat.tx <= tx) return false;
    if (api.frame() - saidAt > 240) {
      saidAt = api.frame();
      api.playScene('home-gate', lines(W.gate));
    }
    return true;
  }
  // Do held with nothing in front: a nap. True if the story does something else with it.
  function nap(cat) {
    if (!on()) return false;
    const st = stage();
    // (the first night and the first morning are not slept through)
    if (st === 'escape' || st === 'food') return true;
    if (st === 'bed') {
      if (api.perch(cat) === 'bedMaster') bedScene();
      else api.say(W.goals.bed);
      return true;
    }
    // (while the night stands still there is no sleeping it away)
    if (st === 'balcony' || st === 'wake') return api.say(W.goals[st]), true;
    return false;
  }
  function meow(cat) {
    if (!on()) return false;
    if (lesson) return press(), true;
    if (stage() !== 'wake') return false;
    if (inRect(cat, MASTER)) wokenScene();
    else api.say(api.fmt(W.meowFar, cat));
    return true;
  }
  // (Do does nothing during a lesson: Meow is the button for both of them)
  const pressDo = () => on() && !!lesson;
  // looking out of a window: sometimes the garden, far below
  function window(cat) {
    if (!on() || before('explore') || Math.random() < 0.35) return null;
    void cat;
    return pick(!before('kibble') ? W.windows.dogs : api.dark() ? W.windows.night : W.windows.day);
  }
  // a human's turn to do something: true if the story is keeping this one where they are
  function human(h) {
    if (S().mode !== 'story' || !S().adopted) return false;
    if (f().holdHumans) return true;
    if (stage() !== 'learn' || !tvTime() || h.asleep || h.away || h.state !== 'activity' || api.mealOn()) return false;
    // the evenings while there is something to learn: both of them on the sofa until late
    const id = h.idx === 0 ? 'sofa2' : 'sofa1';
    if (h.wp.id !== id) return api.sendHuman(h.idx, id), false;
    if (!h.seated) return false;
    h.bedtime = false;
    h.timer = 400;
    return true;
  }
  const noCook = () => on() && stage() === 'learn' && evening();
  // ...and no trips with the cats' bowls while the TV is on: the bowls are cleared in the morning
  const noChores = () => on() && stage() === 'learn' && tvTime();
  // Only one of them may lead (Orca the first night; Shark from the first morning until the two
  // days are over): what to say when the swap button is pressed, or nothing if they may swap.
  const noSwap = () => (on() && before('bed') ? api.fmt(W.noSwap, api.leader()) : '');
  // the cats' sheet: today's things in their two groups; and, that night, the big bed
  function tips() {
    if (!on()) return null;
    const d = S().did || {};
    const day = today();
    if (day) {
      const groups = Object.keys(day).map((g) => ({
        head: W.list.groups[g], stat: g === 'play' ? 'atk' : 'hp', done: !!(S().gains || {})[gainKey(g)],
        items: day[g].map((k) => ({ text: W.list.items[k], done: !!d[k] })),
      }));
      return { title: W.list.title, groups, extra: [] };
    }
    if (before('bed') || !before('kibble')) return null;
    return { title: W.list.title, groups: [], extra: [{ text: W.list.items.bed, done: !!d.bed }] };
  }

  // A game saved before the flat had two days: its stage names and its gains, as they are now.
  function migrate() {
    const s = S();
    if (!s.quest) return;
    if (s.quest.home === 'dinner') s.quest.home = 'kibble';
    const g = s.gains || {};
    if ('atk' in g || 'agl' in g || 'hp' in g) {
      s.gains = {};
      if (g.atk || g.agl) s.gains.play1 = true;
      if (g.atk && g.agl) s.gains.play2 = true;
      if (g.hp) s.gains.care1 = s.gains.care2 = true;
    }
    if (Array.isArray(f().owed)) delete f().owed;
  }

  // Straight to a stage, as it would stand had everything before it been played (Mission select, and
  // the tests). 'tired' is the second day with its fifth thing just done.
  function jump(st) {
    const s = S();
    s.adopted = true;
    s.act = 2;
    s.stage = 'meeting3';
    s.did = {};
    s.gains = {};
    queue.length = 0;
    pendingMeal = false;
    lesson = null;
    zoneKey = '';
    for (const k of ['holdHumans', 'holdClock', 'owed', 'visited1', 'visited2', 'eat2', 'fed2', 'wakeHint', 'lightsOut', 'sing', 'stretch', 'tvNotice', 'robotBeaten']) delete f()[k];
    if (st === 'arrive') return begin();
    const to = st === 'tired' ? 'explore2' : st === 'yowl' ? 'bed' : st;
    const past = (name) => idx(to) > idx(name);
    const all = (day) => {
      for (const g of Object.keys(DAYS[day])) {
        for (const k of DAYS[day][g]) s.did[k] = true;
        s.gains[g + (day === 'explore2' ? 2 : 1)] = true;
      }
      f()['visited' + (day === 'explore2' ? 2 : 1)] = true;
    };
    if (past('explore')) all('explore');
    if (past('explore2') || st === 'tired') all('explore2');
    if (past('bed')) s.did.bed = true;
    if (past('learn')) f().sing = f().stretch = true;
    s.hurt = { shark: 0, orca: 0 };
    api.setLeader(0);
    api.settle();
    s.quest.home = to;
    const goal = { explore: 'explore', explore2: 'explore2', bed: 'bed', balcony: 'balcony', wake: 'wake', kibble: 'kibble', robot1: 'robot', learn: 'learn', rematch: 'rematch', done: 'done' }[to];
    if (goal && W.goals[goal]) s.goal = W.goals[goal];
    if (st === 'escape' || st === 'food') {
      api.putCat(0, NEST[0][0], NEST[0][1], 'left');
      api.putCat(1, NEST[1][0], NEST[1][1], 'right');
      if (st === 'food') return morningSetup(), api.getUp();
      api.setClock(22.5);
      api.putHuman(0, 'bed1', { asleep: true });
      api.putHuman(1, 'bed2', { asleep: true });
      return api.setLeader(1);
    }
    if (st === 'tired') f().fed2 = true;
    if (st === 'explore2') return day2Setup(), (s.goal = f().eat2 ? W.goals.eat2 : s.goal), api.getUp();
    if (st === 'yowl') {
      // (the tenth thing done: asleep on the foot of the big bed, the two humans in it; and then the yowl)
      all('explore2');
      nightSetup();
      s.did.bed = true;
      s.goal = '';
      api.putCat(0, 21, 10);
      api.putCat(1, 22, 10);
      api.lieDown();
      return yowlScene();
    }
    if (st === 'bed' || st === 'balcony' || st === 'wake') {
      nightSetup();
      s.quest.home = st;
      api.getUp();
      api.putCat(0, 38, 10);
      api.putCat(1, 37, 10);
      return;
    }
    if (st === 'kibble') {
      s.quest.home = 'wake';
      dayAfter();
      api.putCat(0, 21, 12);
      api.putCat(1, 20, 12);
      return;
    }
    api.setClock({ explore: 8, tired: 19.5, robot1: 7.5, learn: 19.2, rematch: 22.5, done: 22.5 }[st] || 8);
    api.putCat(0, 38, 10);
    api.putCat(1, 37, 10);
    // (the evening's dinner is down already, so the TV is on; and for the rematch the humans are in bed)
    if (st === 'learn') api.serve('wet');
    if (st === 'rematch') {
      f().lightsOut = true;
      api.putHuman(0, 'bed1', { asleep: true });
      api.putHuman(1, 'bed2', { asleep: true });
      // (in bed for the night: not up again because their usual bedtime is still to come)
      for (const h of api.humans()) h.bedAt = Math.min(h.bedAt, 22);
      api.setTV(0);
    }
    if (st === 'done') s.stage = 'house';
  }

  return {
    begin, update, did, used, bump, door, ate, blocks, mute, nap, meow, pressDo, window, human, noCook, noChores, noSwap, tips, jump,
    debug: { get stage() { return stage(); }, get lesson() { return lesson; }, get queue() { return queue.slice(); }, watching, early, NEST, DAYS, TV_ZONE, GUEST },
  };
}
