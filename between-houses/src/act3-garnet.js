// Act 3, part two: Garnet. (The hub is act3.js; every word is in
// act3-garnet-text.js.)
//
//   garnet   At Mamacat's box, straight after the morning: what Cheetos and Mamacat have seen.
//   doors    BBC on Garnet's step with no collar, shut out by the guard; Flower above it all.
//            The pair against the two of them (a friend who is along keeps out of it).
//   favours  His collar from the bushes in the far east corner, past the BBQ tables (COLLAR_SPOT), her catnip stick from the
//            pair's own flat: in either order. Then Flower's plan.
//   wait     Her human comes down for a box between 4 and 5 in the afternoon.
//   boxed    ...and the pair are at the doors when she does: into the box, and up.
//   balcony  Flower's balcony, BBC on his (the picture of Act 2's balcony night, by day), and the jump
//            down to Purple Scarf's, the balcony under hers.
//   flat     Her flat: three things to find, in any order. Then she comes home.
//   durian   Orca alone keeps her off Shark for four rounds, and they bolt.
//
// And once, whenever the pair are first back in their own flat during these stages: the first
// time home. BBC's collar is the game's own `collar` (pickups.js), put in its bush for the
// favour; the catnip stick is the toy from the pair's flat. Either is given by walking into the
// cat with it, by Do in front of the cat, or by putting it down at the cat's feet.
// What has happened so far is in story.flags, under a3g...:
//   a3gDoorsSeen (the scene at the doors has been played: after it, the short one)
//   a3gDoors (the fight at the doors is won)   a3gCollarOut (the collar has been put in its bush)
//   a3gCollar, a3gCatnip (each favour done)    a3gHome (the first time home has been seen)
//   a3gBalcony (they are down on her balcony)       a3gLook, a3gCoat, a3gMap, a3gSacks, a3gAll (the flat)
import { A3 } from './act3-garnet-text.js';
import { GARNET, BOX_SPOT, BOX_SIDES, COLLAR_SPOT, AC_UNITS, KERB_S } from './garden.js';
import { SCARF } from './map.js';
import { makeHuman, HUMAN_PALS, HUMAN_COATS, makeCat } from './sprites.js';
import { RANDOM_COATS } from './strays.js';
import { deliveryBox, heldBox, durianBag } from './act3-art.js';
import { ENCOUNTERS } from './story.js';

const MINE = ['garnet', 'doors', 'favours', 'wait', 'boxed', 'balcony', 'flat', 'durian'];
// Garnet's front (garden tiles): the step in front of the glass, where the two of them sit, and
// where the pair stand to talk to them
const DOOR = [[GARNET.doorX, GARNET.y - 1], [GARNET.doorX + 1, GARNET.y - 1]];
const SEATS = [[GARNET.doorX - 1, GARNET.y - 1], [GARNET.doorX + 2, GARNET.y - 1]]; // BBC, Flower
const FACING = [[GARNET.doorX - 1, GARNET.y - 2], [GARNET.doorX, GARNET.y - 2]];
const HIDE = [[BOX_SPOT[0] + 2, BOX_SPOT[1] - 1], [BOX_SPOT[0] + 3, BOX_SPOT[1] - 1]]; // where the pair wait for her to turn her back
const OUT = [[GARNET.doorX, GARNET.y - 2], [GARNET.doorX + 1, GARNET.y - 2]]; // where they land when they bolt
const BY_BOX = [AC_UNITS[0].x - 2, AC_UNITS[0].y - 2]; // by Mamacat's box
// the dog that guards the collar's bush: back and forth from just off its west side (the way in past
// the table), through the middle in front of it (from there it sees both ways in, the west and the south
// tip), to just off its south tip. It passes the middle twice for every visit to an end; only at an end
// is the far way in out of its sight (it sees 3.5 tiles), and the pair who wait for that can slip in.
// The bush hides them.
const DOG_BEAT = [[COLLAR_SPOT[0] - 4, COLLAR_SPOT[1] + 1], [COLLAR_SPOT[0] - 1, COLLAR_SPOT[1] + 4], [COLLAR_SPOT[0], COLLAR_SPOT[1] + 6]];
const DOG_AT = DOG_BEAT[0];
const WINDOW = [16, 17]; // when Flower's human is down, in hours
const OUT_HOURS = [7, 19]; // when BBC and Flower are out on the step, once both have their collars (the wait)
const BOX_OUT = 15.5; // ...and from when her box is on the pavement
// Purple Scarf's flat (tiles of the flats' map)
const ACROSS = SCARF.arrive; // on her balcony, where they come down: Shark, Orca
const still = (cv) => {
  const all = { left: cv, right: cv, down: cv, up: cv };
  return { stand: all, sit: all, walk: { left: [cv, cv], right: [cv, cv], down: [cv, cv], up: [cv, cv] } };
};

export function create(ctx) {
  const { GOX, sfx } = ctx;
  const H = ctx.home;
  const f = () => ctx.flags();
  const S = (p) => [GOX + p[0], p[1]];
  const cats = () => ctx.cats();
  const gx = (a) => a.tx - GOX;
  const friendName = () => (ctx.guest() ? ctx.guest().name : '');
  // lines of the text file as scene steps ('owner' is Flower's human: the garden story has an owner of its own)
  // (BBC with no collar is another of the story's own, with a face of his own: lines of his that are
  // said before he has it back are said by that one. `collared`: said by the one with it on, all the same.)
  const lines = (list, collared) => list.map(([who, text]) => ({ say: [who === 'owner' ? 'fowner' : who === 'bbc' && !collared && !ctx.flags().a3gCollar ? 'a3bbc0' : who, text.replaceAll('{n}', friendName())] }));
  const one = (id, line) => ctx.playScene(id, lines([line]));
  const caption = (text, cat) => ctx.say(ctx.fmt(text.replaceAll('{n}', friendName()), cat || ctx.leader()));

  // ------------------------------------------------------------ the cast
  // BBC and Flower are the garden story's own ('bbc' has his collar on); here is BBC without it
  const bbc = ctx.extra('bbc');
  const flower = ctx.extra('flower');
  const blackPal = RANDOM_COATS.find((c) => c.what === 'black cat').pal;
  const bbc0 = ctx.addExtra('a3bbc0', bbc.name, makeCat({ ...blackPal, e: '#f2d37a' }, { scale: [1.3125, 1.3125], thickTail: true }), { low: true });
  const guard = ctx.addExtra('guard', A3.names.guard, makeHuman(HUMAN_PALS.guard, false, { coat: HUMAN_COATS.guard }));
  const owner = ctx.addExtra('fowner', A3.names.owner, makeHuman(HUMAN_PALS.owner, true, { coat: HUMAN_COATS.owner }));
  const box = ctx.addExtra('a3box', '', still(deliveryBox('closed')), { low: true });
  // ...and upstairs: Purple Scarf at her own front door. (Flower's and BBC's balconies are a picture:
  // see balconyScene.)
  const her = ctx.extra('l');
  const iscarf = ctx.addExtra('a3iscarf', her.name, her.sp, { indoor: true });
  const theBbc = () => (f().a3gCollar ? bbc : bbc0); // whichever of him is on the step
  let armed = true; // walking up to the doors starts the scene there (not straight after losing the fight)
  let said = ''; // what Flower last said about the time, and on which day
  let hinted = false; // the collar's bush has been pointed out
  let dog = null; // the dog that sits by it

  // ---------------------------------------------------------- where things are
  const inFront = (L, x0 = GARNET.doorX - 5, x1 = GARNET.doorX + 7) => ctx.floor() === 'garden' && L.ty > KERB_S && gx(L) >= x0 && gx(L) <= x1;
  const hourIn = ([a, b]) => ctx.hour() >= a && ctx.hour() < b;
  const boxOut = () => ctx.hour() >= BOX_OUT && ctx.hour() < WINDOW[1];
  const stage = () => ctx.stage();
  const atDoors = () => ['doors', 'favours', 'wait', 'boxed'].includes(stage());
  const upstairs = () => ['balcony', 'flat', 'durian'].includes(stage());
  function seat() {
    // the two of them on Garnet's step
    const b = theBbc();
    (b === bbc ? bbc0 : bbc).hidden = true;
    ctx.placeExtra(b, SEATS[0][0], SEATS[0][1], 'down');
    ctx.placeExtra(flower, SEATS[1][0], SEATS[1][1], 'down');
    b.pic = flower.pic = null;
  }
  function showBox(on, kind = 'closed') {
    if (!on) return void (box.hidden = true);
    box.pic = kind === 'closed' ? null : deliveryBox(kind);
    if (box.hidden) ctx.placeExtra(box, BOX_SPOT[0], BOX_SPOT[1], 'down');
  }
  // the collar: the game's own, put where the dog dropped it
  const collar = () => ctx.pickup('collar');
  const catnip = () => ctx.pickup('catnip');
  function dropDog() {
    const i = dog ? ctx.dogs.list.indexOf(dog) : -1;
    if (i >= 0) ctx.dogs.list.splice(i, 1);
    dog = null;
  }
  // Every actor of this part where the stage has it (after a stage change, a load, a jump).
  function enter(st) {
    for (const e of [bbc0, guard, owner, box, iscarf]) e.hidden = true;
    owner.holds = iscarf.holds = null;
    if (!MINE.includes(st)) {
      // (before this part the two of them are nowhere; after it they are the jetty's)
      if (ctx.before('garnet')) bbc.hidden = flower.hidden = true;
      return dropDog();
    }
    bbc.hidden = flower.hidden = true;
    if (atDoors()) {
      if (st !== 'wait' || hourIn(OUT_HOURS)) seat(); // (waiting for her human, they are indoors for the night)
      showBox(st === 'boxed' || (st === 'wait' && boxOut()));
    }
    if (st === 'favours' && !f().a3gCollar) {
      if (!f().a3gCollarOut) {
        ctx.placePickup('collar', COLLAR_SPOT[0], COLLAR_SPOT[1]);
        f().a3gCollarOut = true;
      }
      // (a dog walks up and down in front of the bush it is in: wait for it to turn its back)
      if (ctx.floor() === 'garden' && !(dog && ctx.dogs.list.includes(dog))) dog = ctx.dogs.put(DOG_AT[0], DOG_AT[1], { coat: 'black', beat: DOG_BEAT, dir: 'down' });
    } else dropDog();
    if (upstairs()) {
      H.flatLights('scarf', st === 'durian'); // (she is out until she comes home)
      if (st === 'durian') {
        ctx.placeExtra(iscarf, SCARF.enter[0], SCARF.enter[1] - 1, 'up');
        iscarf.holds = durianBag();
      }
    }
  }

  // ----------------------------------------------------------------- garnet
  function garnetScene() {
    ctx.playScene('a3g-garnet', [
      { wait: 20 },
      ...lines(A3.garnet),
      { goal: A3.goals.doors },
    ], () => ctx.go('doors', A3.goals.doors));
  }

  // ------------------------------------------------------------------ doors
  const meet = () => [
    { walks: [['leader', ...S(FACING[0])], ['other', ...S(FACING[1])]] },
    { face: ['leader', 'down'] },
    { face: ['other', 'down'] },
  ];
  function doorsFight() {
    ctx.startFight(ENCOUNTERS.garnetDoors(A3.doors.fight), {
      noFriend: true,
      then: (result) => {
        seat();
        if (result === 'won') return doorsWon();
        armed = false;
        ctx.say(A3.doors.lostAfter, true);
      },
    });
  }
  function doorsScene() {
    const again = !!f().a3gDoorsSeen;
    f().a3gDoorsSeen = true;
    if (again) return ctx.playScene('a3g-doors-again', [...meet(), { bubble: ['a3bbc0', '!!', 50] }, ...lines(A3.doors.again)], doorsFight);
    ctx.playScene('a3g-doors', [
      { camera: 'a3bbc0' },
      { wait: 30 },
      { say: A3.doors.open[0] },
      { bubble: ['a3bbc0', '!!', 60] },
      ...lines(A3.doors.open.slice(1)),
      { sfx: 'door' },
      { call: () => ctx.placeExtra(guard, DOOR[0][0], DOOR[0][1], 'left') },
      { wait: 30 },
      ...lines(A3.doors.guard),
      // (a friend who is along is sent off the step as well, and keeps out of what follows)
      ...(ctx.guest() ? lines(A3.doors.friend) : []),
      { sfx: 'door' },
      { call: () => (guard.hidden = true) },
      { camera: null },
      ...meet(),
      ...lines(A3.doors.talk),
      { bubble: ['a3bbc0', '!!', 50] },
      ...lines(A3.doors.snap),
    ], () => {
      guard.hidden = true;
      doorsFight();
    });
  }
  function doorsWon() {
    ctx.playScene('a3g-doors-won', [
      { wait: 20 },
      ...lines(A3.doors.won),
      { goal: A3.goals.favours },
    ], () => {
      f().a3gDoors = true;
      ctx.go('favours', A3.goals.favours);
    });
  }

  // ---------------------------------------------------------------- favours
  function favourDone() {
    if (f().a3gCollar && f().a3gCatnip) return planScene();
    ctx.setGoal(f().a3gCollar ? A3.goals.catnipLeft : A3.goals.collarLeft);
    if (ctx.autosave) ctx.autosave();
  }
  function collarScene(p) {
    const take = () => Object.assign(p, { by: null, floor: 'gone', away: 0 });
    const collared = () => {
      f().a3gCollar = true;
      guard.hidden = true;
      seat();
      dropDog();
    };
    ctx.playScene('a3g-collar', [
      { call: take },
      { sfx: 'land' },
      ...lines(A3.collar.put),
      { walk: ['a3bbc0', ...S(DOOR[0])] },
      { face: ['a3bbc0', 'down'] },
      { sfx: 'door' },
      { call: () => ctx.placeExtra(guard, DOOR[1][0], DOOR[1][1], 'left') },
      { wait: 30 },
      ...lines(A3.collar.guard),
      { sfx: 'blip' },
      // (the same cat, with his collar on)
      { call: () => { bbc0.hidden = true; ctx.placeExtra(bbc, DOOR[0][0], DOOR[0][1], 'down'); } },
      { bubble: ['bbc', '♥', 60] },
      { wait: 40 },
      { sfx: 'door' },
      { call: () => (guard.hidden = true) },
      { walk: ['bbc', ...S(SEATS[0])] },
      { face: ['bbc', 'down'] },
      ...lines(A3.collar.after, true),
    ], () => {
      take();
      collared();
      favourDone();
    });
  }
  function catnipScene(p) {
    // (she keeps it)
    const take = () => Object.assign(p, { by: null, floor: 'held', away: 0 });
    ctx.playScene('a3g-catnip', [
      { call: take },
      { sfx: 'land' },
      ...lines(A3.catnip.put.slice(0, 2)),
      { face: ['leader', 'up'] },
      { face: ['other', 'up'] },
      { call: () => { flower.shake = 150; sfx.purr(); } },
      { bubble: ['flower', '♥♥', 120] },
      { say: A3.catnip.put[2] },
      { wait: 30 },
      { face: ['leader', 'down'] },
      { face: ['other', 'down'] },
      ...lines(A3.catnip.put.slice(3)),
      ...lines(A3.catnip.told),
    ], () => {
      take();
      flower.shake = 0;
      f().a3gCatnip = true;
      favourDone();
    });
  }
  function planScene() {
    ctx.playScene('a3g-plan', [
      { wait: 20 },
      ...lines(A3.plan),
      { goal: A3.goals.wait },
    ], () => ctx.go('wait', A3.goals.wait));
  }
  // something offered to one of them, or carried up to one: true if the story takes it from there
  function offer(cat, p, to) {
    if (stage() !== 'favours' || !p) return false;
    if (to === bbc0 || to === bbc) {
      if (p.id === 'collar' && !f().a3gCollar) return collarScene(p), true;
      return one('a3g-not-that', f().a3gCollar ? A3.ask.bbcDone : A3.ask.notThat), true;
    }
    if (to === flower) {
      if (p.id === 'catnip' && !f().a3gCatnip) return catnipScene(p), true;
      return one('a3g-not-nip', f().a3gCatnip ? A3.ask.flowerDone : A3.ask.notNip), true;
    }
    return false;
  }

  // ------------------------------------------------------------ wait / boxed
  function boxScene() {
    const g = ctx.guest();
    const [sh] = cats();
    const b = theBbc().id;
    const inBox = (i) => () => {
      ctx.showCat(i, false);
      sfx.jump();
    };
    const finish = () => {
      ctx.showCat(0, true);
      ctx.showCat(1, true);
      // (on her balcony already, behind the picture of Flower's: they are seen there when it is taken away)
      H.toFlat('scarf', ctx.leader() === sh ? [ACROSS[0], ACROSS[1]] : [ACROSS[1], ACROSS[0]], 'down');
      ctx.go('balcony');
      balconyScene();
      ctx.blackout();
    };
    ctx.playScene('a3g-box', [
      { call: () => showBox(true) },
      // (a friend who is along goes back to the others: the box is for two)
      ...(g ? [...lines([['', A3.wait.friend]]), { call: () => ctx.guest() && ctx.sendHome(ctx.guest(), null) }] : []),
      { walks: [['leader', ...S(HIDE[0])], ['other', ...S(HIDE[1])]] },
      { face: ['leader', 'left'] },
      { face: ['other', 'left'] },
      { camera: 'a3box' },
      { sfx: 'door' },
      { call: () => ctx.placeExtra(owner, DOOR[1][0], DOOR[1][1], 'up') },
      { wait: 20 },
      { say: A3.box.open[0] },
      { walk: ['fowner', ...S(BOX_SIDES[0])] },
      { face: ['fowner', 'right'] },
      ...lines(A3.box.open.slice(1)),
      { sfx: 'scratch' },
      { call: () => showBox(true, 'open') },
      { wait: 30 },
      { say: A3.box.ankles[0] },
      { walk: [b, GOX + BOX_SIDES[0][0] - 1, BOX_SIDES[0][1] - 1] },
      { bubble: [b, '♪', 60] },
      { say: A3.box.ankles[1] },
      { face: ['fowner', 'left'] },
      { bubble: ['fowner', '!', 50] },
      ...lines(A3.box.ankles.slice(2)),
      // into the box, one after the other
      { walks: [['leader', ...S(BOX_SIDES[1])], ['other', GOX + BOX_SIDES[1][0], BOX_SIDES[1][1] - 1]], frames: 7 },
      { call: inBox(ctx.cats().indexOf(ctx.leader())) },
      { wait: 14 },
      { call: inBox(1 - ctx.cats().indexOf(ctx.leader())) },
      { call: () => showBox(true, 'cats') },
      { wait: 30 },
      ...lines(A3.box.inIt),
      { face: ['fowner', 'right'] },
      { say: lines(A3.box.lift)[0].say },
      { call: () => { showBox(false); owner.holds = heldBox('cats'); sfx.land(); } },
      { wait: 20 },
      { say: lines(A3.box.lift)[1].say },
      { walk: ['fowner', ...S(DOOR[1])] },
      { face: ['fowner', 'down'] },
      { sfx: 'door' },
      { call: () => (owner.hidden = true) },
      { walks: [[b, ...S(DOOR[0])], ['flower', ...S(DOOR[1])]] },
      { call: () => (theBbc().hidden = flower.hidden = true) },
      { fade: 'out' },
      ...lines(A3.box.dark),
    ], finish);
  }
  // While the pair wait for Flower's human (which can be days), the two house cats are not left out on the
  // step all night: with his collar back the doors open for BBC again. They go in at seven in the evening
  // and are out again at seven in the morning (OUT_HOURS). Seen, they walk the one step between seat and
  // door; not seen, they are there or they are not.
  function stepTick() {
    const out = hourIn(OUT_HOURS);
    [[theBbc(), 0], [flower, 1]].forEach(([e, i]) => {
      const [sx, sy] = SEATS[i];
      const [dx, dy] = DOOR[i];
      if (e.moving) return;
      const at = (x, y) => gx(e) === x && e.ty === y;
      if (out) {
        if (e.hidden) {
          // out through the doors; straight onto the step if nobody is there to see
          ctx.placeExtra(e, dx, dy, 'down');
          if (ctx.visible(e.px, e.py)) sfx.door();
          else ctx.placeExtra(e, sx, sy, 'down');
          e.pic = null;
        }
        if (at(sx, sy)) e.dir = 'down';
        else if (!ctx.walkStep(e, GOX + sx, sy)) ctx.placeExtra(e, sx, sy, 'down');
        return;
      }
      if (e.hidden) return;
      if (!ctx.visible(e.px, e.py)) return void (e.hidden = true);
      if (at(dx, dy)) {
        e.hidden = true;
        if (i === 0) sfx.door();
      } else if (!ctx.walkStep(e, GOX + dx, dy)) e.hidden = true;
    });
  }
  function waitTick(L) {
    showBox(boxOut());
    stepTick();
    const here = inFront(L);
    if (!here) return void (said = '');
    if (hourIn(WINDOW)) {
      ctx.go('boxed');
      return boxScene();
    }
    // (once each time they come to the doors at the wrong hour)
    const indoors = !hourIn(OUT_HOURS);
    const key = ctx.day() + (indoors ? ':night' : ctx.hour() >= WINDOW[1] ? ':late' : ':early');
    if (said === key) return;
    said = key;
    // (after dark there is nobody on the step to say that she has been and gone)
    if (indoors) caption(A3.wait.night);
    else if (ctx.hour() >= WINDOW[1]) ctx.playScene('a3g-missed', lines(A3.wait.missed));
    else caption(A3.wait.early);
  }

  // ---------------------------------------------------------------- balcony
  // Flower's balcony is not on any map: it is the picture of Garnet that Act 2's balcony night looked
  // across at (garnet.js), by day, with the pair standing on it. Purple Scarf's is the balcony under
  // hers: they jump down out of the bottom of the picture, the screen goes black, and they are on it.
  function balconyScene() {
    const view = { day: true, cats: 'home', shark: 'door', orca: 'door' };
    const across = () => {
      H.putCat(0, ACROSS[0][0], ACROSS[0][1], 'down');
      H.putCat(1, ACROSS[1][0], ACROSS[1][1], 'up');
    };
    ctx.playScene('a3g-balcony', [
      { call: () => ctx.blackout() },
      { picture: { kind: 'garnet', state: view } },
      { wait: 30 },
      { fade: 'in' },
      { say: A3.balcony.open[0] },
      // out of her door and onto the balcony, one after the other
      { call: () => { view.orca = { walk: ctx.frame() }; } },
      { wait: 14 },
      { call: () => { view.shark = { walk: ctx.frame() }; } },
      { wait: 50 },
      { call: () => { view.orca = view.shark = 'balcony'; } },
      ...lines(A3.balcony.open.slice(1)),
      ...lines(A3.balcony.bbc),
      // (a look at the balcony below, with no box of words over it)
      { wait: 70 },
      ...lines(A3.balcony.hers),
      { call: () => { view.orca = view.shark = 'rail'; } },
      { wait: 40 },
      ...lines(A3.balcony.edge),
      { call: () => { view.orca = { jump: ctx.frame() }; sfx.jump(); } },
      { wait: 34 },
      { sfx: 'land' },
      { call: () => { view.orca = 'down'; } },
      { wait: 30 },
      ...lines(A3.balcony.orcaOver),
      { call: () => { view.shark = { jump: ctx.frame() }; sfx.jump(); } },
      { wait: 34 },
      { sfx: 'land' },
      { call: () => { view.shark = 'down'; } },
      { wait: 40 },
      { fade: 'out' },
      { call: () => { view.shark = view.orca = null; across(); } },
      { picture: null },
      { wait: 20 },
      { fade: 'in' },
      ...lines(A3.balcony.sharkOver),
      { goal: A3.goals.flat },
    ], () => {
      across();
      f().a3gBalcony = true;
      ctx.go('flat', A3.goals.flat);
    });
  }

  // ------------------------------------------------------------------- flat
  // (the third was a golf bag once: a game saved then has it as a3gBag)
  // (the first clue was a photo by her bed once: a game saved then has it as a3gPhoto)
  const CLUES = { clueCoat: ['a3gCoat', 'coat'], clueMap: ['a3gMap', 'map'], clueSacks: ['a3gSacks', 'sacks'] };
  const allFound = () => Object.values(CLUES).every(([k]) => f()[k] || (k === 'a3gMap' && f().a3gBag) || (k === 'a3gCoat' && f().a3gPhoto));
  function clueScene(type) {
    const [flag, words] = CLUES[type];
    ctx.playScene('a3g-' + words, [{ wait: 10 }, ...lines(A3.flat[words])], () => {
      f()[flag] = true;
      if (allFound() && !f().a3gAll) return sumScene();
      if (ctx.autosave) ctx.autosave();
    });
  }
  function sumScene() {
    ctx.playScene('a3g-sum', [
      { wait: 20 },
      ...lines(A3.flat.sum),
      { goal: A3.goals.out },
    ], () => {
      f().a3gAll = true;
      ctx.setGoal(A3.goals.out, true);
      if (ctx.autosave) ctx.autosave();
    });
  }
  // the places for the fight: Orca in front of her, Shark at the door behind her
  const stand = () => {
    ctx.placeExtra(iscarf, SCARF.enter[0], SCARF.enter[1] - 1, 'up');
    iscarf.holds = durianBag();
    H.putCat(1, SCARF.pause[0][0], SCARF.pause[0][1], 'down');
    H.putCat(0, SCARF.doorStep[1][0], SCARF.doorStep[1][1], 'down');
    H.flatLights('scarf', true);
  };
  function sheComesHome() {
    ctx.playScene('a3g-she', [
      { walks: [['orca', ...SCARF.pause[0]], ['shark', ...SCARF.pause[1]]] },
      { face: ['orca', 'down'] },
      { face: ['shark', 'down'] },
      { wait: 20 },
      ...lines(A3.home.smell),
      { sfx: 'door' },
      // (side on, so that the bag is seen; then she turns and sees them)
      { call: () => { ctx.placeExtra(iscarf, SCARF.enter[0], SCARF.enter[1], 'right'); iscarf.holds = durianBag(); H.flatLights('scarf', true); } },
      { wait: 20 },
      // (her call, on the phone: four lines; then the door, and she sees them)
      ...lines(A3.home.enter.slice(0, 5)),
      { sfx: 'door' },
      { say: A3.home.enter[5] },
      { face: ['a3iscarf', 'up'] },
      { bubble: ['a3iscarf', '!', 50] },
      ...lines(A3.home.enter.slice(6)),
      ...lines(A3.home.plan),
      { bubble: ['orca', '!!', 40] },
      { sfx: 'hiss' },
      // she comes for Orca, and Shark slips round her to the door
      { walk: ['a3iscarf', SCARF.enter[0], SCARF.enter[1] - 1] },
      { walk: ['shark', SCARF.doorStep[1][0], SCARF.doorStep[1][1]] },
      { face: ['shark', 'down'] },
    ], () => {
      stand();
      ctx.go('durian');
      durianFight();
    });
  }

  // ----------------------------------------------------------------- durian
  function durianFight() {
    ctx.startFight(ENCOUNTERS.durian({ intro: A3.durian.intro, escaped: A3.durian.escaped }), { plain: true, then: () => escapeScene() });
  }
  function escapeScene() {
    const [sh, or] = cats();
    const outside = () => {
      sh.hidden = or.hidden = false;
      iscarf.hidden = true;
      if (ctx.floor() !== 'garden') ctx.toGarden(OUT[0], OUT[1], 'up');
      ctx.placeExtra(guard, DOOR[1][0], DOOR[1][1], 'up');
    };
    ctx.playScene('a3g-escape', [
      { wait: 10 },
      ...lines(A3.escape.now),
      // out of her front door, one after the other, as fast as they can go
      { sfx: 'door' },
      { call: () => { H.leap(0, SCARF.door[1][0], SCARF.door[1][1], 7, 2); } },
      { until: () => !sh.moving },
      { call: () => { sh.hidden = true; } },
      { walks: [['orca', SCARF.doorStep[1][0], SCARF.doorStep[1][1] - 1]], frames: 5 },
      { walks: [['orca', SCARF.doorStep[1][0], SCARF.doorStep[1][1]]], frames: 5 },
      { call: () => { H.leap(1, SCARF.door[1][0], SCARF.door[1][1], 7, 2); } },
      { until: () => !or.moving },
      { call: () => { or.hidden = true; } },
      { face: ['a3iscarf', 'down'] },
      ...lines(A3.escape.shout),
      { fade: 'out' },
      ...lines(A3.escape.dark),
      { call: outside },
      { sfx: 'door' },
      { wait: 20 },
      { fade: 'in' },
      ...lines(A3.escape.guard),
      { sfx: 'door' },
      { call: () => (guard.hidden = true) },
      { wait: 20 },
      ...lines(A3.escape.out),
      { goal: A3.goals.regroup },
    ], () => {
      outside();
      guard.hidden = true;
      // (the jetty's part takes it from here: its own goal follows at once)
      ctx.go('regroup', A3.goals.regroup);
    });
  }

  // ----------------------------------------------------- the first time home
  function firstHome() {
    const [sh, or] = cats();
    const hs = H.humans();
    const spot = (x, y, not = []) => {
      for (let r = 1; r < 7; r++)
        for (let dy = -r; dy <= r; dy++)
          for (let dx = -r; dx <= r; dx++)
            if (Math.max(Math.abs(dx), Math.abs(dy)) === r && H.free(x + dx, y + dy) && !not.some(([a, b]) => a === x + dx && b === y + dy)) return [x + dx, y + dy];
      return [x, y];
    };
    const towards = (a, b) => (Math.abs(b.tx - a.tx) >= Math.abs(b.ty - a.ty) ? (b.tx > a.tx ? 'right' : 'left') : b.ty > a.ty ? 'down' : 'up');
    H.settle();
    const tSpot = spot(or.tx, or.ty);
    const hSpot = spot(sh.tx, sh.ty, [tSpot]);
    ctx.playScene('a3g-first-home', [
      { call: () => { H.serve('wet'); H.comeTo(1, tSpot[0], tSpot[1], 7); H.comeTo(0, hSpot[0], hSpot[1], 9); } },
      { wait: 20 },
      { say: A3.firstHome[0] },
      { walks: [[1, tSpot[0], tSpot[1]], [0, hSpot[0], hSpot[1]]] },
      { call: () => { hs[1].dir = towards(hs[1], or); hs[0].dir = towards(hs[0], sh); or.dir = towards(or, hs[1]); sh.dir = towards(sh, hs[0]); } },
      ...lines(A3.firstHome.slice(1, 4)),
      { call: () => { H.bubble(hs[1], '♥', 80); H.act(or, 'purr', 90); sfx.purr(); } },
      { wait: 40 },
      ...lines(A3.firstHome.slice(4)),
    ], () => {
      f().a3gHome = true;
      H.releaseHuman(0);
      H.releaseHuman(1);
    });
  }

  // ------------------------------------------------------------------ hooks
  function update(st) {
    const L = ctx.leader();
    const fl = ctx.floor();
    if (fl === 'home' && !f().a3gHome && st !== 'garnet') return firstHome();
    if (st === 'garnet') return fl === 'garden' ? garnetScene() : undefined;
    if (st === 'doors') {
      const here = inFront(L, GARNET.doorX - 4, GARNET.doorX + 5);
      if (here && armed) return doorsScene();
      if (!here && !inFront(L, GARNET.doorX - 8, GARNET.doorX + 9)) armed = true;
      return;
    }
    if (st === 'favours') {
      // (the collar does not find its own way back to where the garden keeps one: it stays where it is put down)
      const c = collar();
      if (c && c.by === null && c.away) c.away = 0;
      if (fl !== 'garden') return;
      if (!f().a3gCollar && !hinted && c && c.by === null && c.floor === 'garden' && Math.abs(gx(L) - c.x) + Math.abs(L.ty - c.y) <= 5) {
        hinted = true;
        return caption(A3.collarNear);
      }
      // put down at his feet, or at hers: as good as given
      const lying = (p, [x, y]) => p && p.by === null && p.floor === 'garden' && Math.abs(p.x - x) + Math.abs(p.y - y) <= 2;
      if (!f().a3gCollar && lying(c, SEATS[0])) return collarScene(c);
      if (!f().a3gCatnip && lying(catnip(), SEATS[1])) return catnipScene(catnip());
      return;
    }
    if (st === 'wait') return fl === 'garden' ? waitTick(L) : undefined;
    if (st === 'boxed') {
      if (fl !== 'garden') return;
      if (inFront(L)) return boxScene();
      // (a game saved at that moment, and loaded somewhere else: the hour may have gone by)
      ctx.go('wait', A3.goals.wait);
      return;
    }
    if (fl !== 'scarf') return;
    if (st === 'balcony') return balconyScene();
    if (st === 'flat') {
      if (!f().a3gLook && L.tx >= SCARF.inside[0]) {
        f().a3gLook = true;
        return ctx.playScene('a3g-look', [{ wait: 20 }, ...lines(A3.flat.look)]);
      }
      if (allFound() && !f().a3gAll) return sumScene();
      const near = (p) => Math.abs(L.tx - p[0]) + Math.abs(L.ty - p[1]) <= 1;
      if (f().a3gAll && [...SCARF.pause, ...SCARF.doorStep].some(near)) return sheComesHome();
      return;
    }
    if (st === 'durian') {
      // (a game loaded in the middle of it)
      stand();
      ctx.playScene('a3g-durian-again', [{ wait: 20 }, ...lines(A3.durian.again)], durianFight);
    }
  }
  // walking into (or Do in front of) one of this part's people and animals
  function bump(cat, e) {
    const st = stage();
    const p = ctx.carrying(cat);
    if (e === box) return caption(A3.wait.box, cat), true;
    if (e !== bbc && e !== bbc0 && e !== flower) return e === guard || e === owner || e === iscarf;
    const isFlower = e === flower;
    if (st === 'doors') return doorsScene(), true;
    if (st === 'favours') {
      if (p && offer(cat, p, e)) return true;
      const done = isFlower ? f().a3gCatnip : f().a3gCollar;
      return one('a3g-ask-' + (isFlower ? 'flower' : 'bbc') + (done ? '-done' : ''), A3.ask[(isFlower ? 'flower' : 'bbc') + (done ? 'Done' : '')]), true;
    }
    if (st === 'wait' || st === 'boxed') return one('a3g-wait-' + (isFlower ? 'flower' : 'bbc'), A3.wait[isFlower ? 'flower' : 'bbc']), true;
    return false;
  }
  // something walked into: Garnet's lobby doors; a clue in her flat
  function object(cat, o) {
    if (o.type === 'garnet') return atDoors() ? (caption(A3.lobby, cat), true) : false;
    if (!CLUES[o.type] || !upstairs()) return false;
    if (stage() !== 'flat') return false;
    if (f()[CLUES[o.type][0]]) return caption(A3.flat.again[o.type], cat), true;
    return clueScene(o.type), true;
  }
  // her front door
  function door(cat, flat) {
    if (flat !== 'scarf') return false;
    if (stage() === 'flat' && f().a3gAll) return sheComesHome(), true;
    return caption(A3.flat.notYet, cat), true;
  }
  // the wall at the north end of her balcony, where they came down: there is no going back up it
  function tile(cat, ch, x, y) {
    if ((ch !== '#' && ch !== 'A') || y !== ACROSS[0][1] - 1 || cat.tx > ACROSS[0][0]) return false;
    return caption(A3.noWayUp, cat), true;
  }

  // Mission select, and the tests: this part as if it had been played as far as `st`; and if `st`
  // is one of its own stages, the pair and the clock where that stage starts.
  function jump(st) {
    const fl = f();
    for (const k of Object.keys(fl)) if (k.startsWith('a3g')) delete fl[k];
    armed = true;
    said = '';
    hinted = false;
    const c = collar();
    const n = catnip();
    if (ctx.before('garnet')) {
      if (c) Object.assign(c, { by: null, floor: 'gone', away: 0 });
      return;
    }
    if (ctx.past('doors')) fl.a3gDoors = fl.a3gDoorsSeen = true;
    if (ctx.past('favours')) {
      fl.a3gCollar = fl.a3gCatnip = fl.a3gHome = fl.a3gCollarOut = true;
      if (c) Object.assign(c, { by: null, floor: 'gone', away: 0 });
      if (n) Object.assign(n, { by: null, floor: 'held', away: 0 });
    } else if (c) Object.assign(c, { by: null, floor: 'gone', away: 0 }); // (enter puts it in its bush)
    if (ctx.past('balcony')) fl.a3gBalcony = true;
    if (ctx.past('flat')) fl.a3gLook = fl.a3gCoat = fl.a3gMap = fl.a3gSacks = fl.a3gAll = true;
    if (!MINE.includes(st)) return;
    // (garnet and balcony open with a scene, which gives the goal itself)
    const goal = { doors: A3.goals.doors, favours: A3.goals.favours, wait: A3.goals.wait, boxed: A3.goals.wait, flat: A3.goals.flat, durian: A3.goals.out }[st];
    if (goal) ctx.setGoal(goal, true);
    const hr = ctx.hour();
    const clock = (to, ok) => !ok && ctx.setClock(to);
    const lead = ctx.cats().indexOf(ctx.leader());
    const flatAt = (a, b) => H.toFlat('scarf', lead === 0 ? [a, b] : [b, a], 'down'); // a: Shark's tile, b: Orca's
    if (st === 'garnet') {
      clock(8, hr >= 6 && hr < 12);
      const a = ctx.freeNear(BY_BOX[0], BY_BOX[1]);
      ctx.toGarden(a, ctx.freeNear(a[0] + 1, a[1], 3, [a]));
    } else if (st === 'doors' || st === 'favours') {
      clock(9, hr >= 7 && hr < 15);
      ctx.toGarden([GARNET.doorX - 7, GARNET.y - 2], [GARNET.doorX - 8, GARNET.y - 2], 'right');
    } else if (st === 'wait') {
      clock(BOX_OUT, hr >= 12 && hr < WINDOW[0]);
      ctx.toGarden([GARNET.doorX - 7, GARNET.y - 2], [GARNET.doorX - 8, GARNET.y - 2], 'right');
    } else if (st === 'boxed') {
      clock(WINDOW[0] + 0.1, hourIn(WINDOW));
      ctx.toGarden([GARNET.doorX - 3, GARNET.y - 2], [GARNET.doorX - 4, GARNET.y - 2], 'right');
    } else {
      clock(WINDOW[0] + 0.3, hr >= WINDOW[0] && hr < 18);
      if (st === 'balcony') flatAt(SCARF.arrive[0], SCARF.arrive[1]);
      else if (st === 'flat') flatAt(ACROSS[0], ACROSS[1]);
      else flatAt(SCARF.pause[1], SCARF.pause[0]);
    }
  }

  return {
    update, enter, bump, object, door, tile, jump,
    give: (cat, item, to) => offer(cat, item, to),
    debug: { bbc0, bbc, flower, guard, owner, box, iscarf, SEATS, DOOR, HIDE, DOG_AT, DOG_BEAT, get dog() { return dog; }, get armed() { return armed; } },
  };
}
