// Game state, rules and rendering.
import { CONFIG } from './config.js';
import { C, R, P, canvas } from './palette.js';
import {
  T, isFloor, isOpen, isWall, drawFloor, drawCap, drawFace, drawGlassDoor, drawRailing,
  drawWindow, drawCurtain, drawArt, drawRug, drawDrain, drawShowerHead, drawFrontDoor, drawThreshold,
  drawHeadboard, drawSideWindow, drawAir, drawScarf, SKIES,
} from './tiles.js';
import { TYPES, ITEMS, renderType, renderItem, SCARF_WORDS } from './furniture.js';
import {
  MAP_W, MAP_H, buildTiles, roomAt, OBJECTS, ITEM_SPOTS, DECOR, WAYPOINTS, START,
  DOOR_SPOTS, DROP_ZONES, SCHEDULE, LIGHTS, SCREEN_LIGHTS, VACUUM_ROUTES,
  FLATS, flatAt, SCARF, ROOM_LIGHTS,
} from './map.js';
import { makeCat, CAT_PALS, makeHuman, HUMAN_PALS, HUMAN_COATS } from './sprites.js';
import { drawText, textWidth, wrapText, markLines, drawMarked, LINE_H, CONTROLS, ICON_INK } from './font.js';
import { sfx, setNight, setPlace } from './audio.js';
import { createStrays } from './strays.js';
import { createPeople } from './people.js';
import { createDogs, DOG_WORDS } from './dogs.js';
import { createDialog, faceOf } from './dialog.js';
import { PICKUPS, renderPickup } from './pickups.js';
import { WORDS } from './game-text.js';
import { newStory, partySpecs, rungOf, writeSave, LADDER, STAGES, MEND, hurtOf, keepsHurt, ENCOUNTERS, FIGHTER_OF, OLD_FRIENDS, FINDS } from './story.js';
import { MOVES, FIGHTERS, accuracyWord } from './battle.js';
import { drawHealth } from './hud.js';
import { createQuests, MISSIONS } from './quests.js';
import { noteProgress } from './progress.js';
import { createAct3 } from './act3.js';
import {
  GW, GH, GX0, buildGarden, setBarrier, setBoatDogs, setBoatGone, setCages, gardenBlocked, isMat, START as GARDEN_START, drawLobbyGlow, ENTRANCE, GARNET, LAMP_HEAD,
  gardenPerch, gardenThing, isBush, SLIDE, BARS, NET, drawCafeGlow, cafeLight, areaAt as gardenArea,
  ROAD, isRoad, roadEnd,
} from './garden.js';
import { createTraffic } from './traffic.js';
import { setNamed, catName, putName, fillNames } from './names.js';
import { drawVet } from './vet.js';
import { drawGarnet } from './garnet.js';
import { createHome } from './home.js';
import { flatLines, NICKS } from './flat-lines.js';

const VW = CONFIG.viewW;
const VH = CONFIG.viewH;
// The garden downstairs shares the tile space with the apartment: its tiles
// sit far off to the east, so nothing up here ever mistakes one for the other.
const GOX = 1000;
// (for the tests: the old Sandbox, with no story in it. See start().)
const FADE = 22; // frames to fade out (and back in) when changing floors
const PAN = 50; // frames a scene's view takes to slide across to a picture, or back
const FADE_HOLD = 14;
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
const rnd = (n) => Math.floor(Math.random() * n);
// Each human's hours vary day to day. Bedtimes are on a 6am-to-6am scale
// (25 = 1am). Walking across the home takes about an hour of game time, so
// a normal bedtime starts around 10pm; now and then someone stays up late.
const bedTime = (i) => {
  const r = Math.random();
  const late = r < 0.15 ? 2 + Math.random() : r < 0.4 ? 0.8 + Math.random() * 0.8 : 0;
  return 21.8 + i * 0.4 + Math.random() * 0.4 + late;
};
// about 7.5 hours after falling asleep, give or take, between 6am and 10am
const wakeTime = (fellAsleep) => {
  const h = fellAsleep >= 12 ? fellAsleep - 24 : fellAsleep;
  return Math.max(6.2, Math.min(10, h + 7 + Math.random() * 1.2));
};
// the 6am-to-6am hour, so bedtimes after midnight compare properly
const lateHour = (hr) => (hr < 6 ? hr + 24 : hr);
const pick = (a) => a[rnd(a.length)];
const lerp = (a, b, t) => a + (b - a) * t;
const dirName = (dx, dy) => (dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up');
// which side of a tile you come in through when moving by (dx,dy)
const sideOf = (dx, dy) => (dx > 0 ? 'W' : dx < 0 ? 'E' : dy > 0 ? 'N' : 'S');

const PET_LINES = {
  work: [
    '{h} stops typing to scratch {c} under the chin. Purrrr.',
    "{h}: \"Hi {c}. Yes, you're more important than this email.\"",
  ],
  tv: [
    '{h} gives {c} the good ear scratches. Purrrrr.',
    '{h}: "Come watch with me, {c}."',
  ],
  cook: [
    "{h}: \"No, {c}, this isn't for you.\" ...A tiny piece falls anyway.",
    "{c} rubs against {h}'s legs, all the way around, while {h} tries to cook.",
  ],
  dishes: ["{h}: \"I'm busy, {c}!\" ...and pets {c} with a soapy hand anyway."],
  snack: ['{h}: "You already ate, {c}." {c} disagrees. Loudly.'],
  coffee: ['{h} sips coffee and rubs {c}\'s head. Good morning.'],
  eat: ['{h}: "This is people food, {c}." {c} keeps staring.'],
  view: ['{h} picks {c} up to look at the view together.'],
  outfit: ['{h}: "Which one, {c}?" {c} sits on the chosen one.'],
  laundry: ['{h} folds laundry. {c} supervises and gets a head rub.'],
  water: ["{h}: \"Don't eat this plant, {c}.\" Pat pat."],
  sleep: [
    "{c} walks across {h}'s face. {h}: \"mmph... five more minutes...\"",
    '{c} curls up on {h}\'s chest. Purrrr. Nobody is getting up for a while.',
    "{c} pats {h}'s nose. Gently. Then less gently. {h}: \"...it's not breakfast time.\"",
  ],
  toilet: [
    '{h}: "{c}! A little privacy?!" {c} stares. Unblinking.',
    '{c} sits in the bathroom and watches. Somebody has to.',
    "{h}: \"Really, {c}? Right now?\" {c} flops on {h}'s feet.",
  ],
  seek: [
    '{h} comes looking for {c} just to say hi. Chin scratches!',
    '{h}: "There you are, {c}!" A hand on his head.',
    '{h} scoops up {c} for a cuddle. {c} tolerates it. Barely.',
    "{h}: \"Who's the best cat?\" It's {c}. Obviously.",
  ],
  walk: [
    '{h} bends down and pets {c}. Purrrr.',
    "{h}: \"Who's a good cat? {c} is!\"",
    '{c} flops over. {h} rubs his belly, and gets away with it.',
  ],
};
const WARDROBE_LINES = [
  "{c} hooks a paw under the wardrobe door. It won't open. Yet.",
  '{c} squeezes into the wardrobe... and comes back out wearing a sock.',
  "Inside: sweaters. {c} leaves some fur on them.",
];
const ERRAND = {
  parcel: {
    back: '{h} is back, with a delivery box!',
    put: '{h} puts the box down. Clearly a present for the cats.',
  },
  shopbag: {
    back: '{h} is back, with a big shopping bag!',
    put: '{h} sets the shopping bag down. It rustles. {c} has questions.',
  },
  takeout: {
    back: '{h} is back, and something smells DELICIOUS.',
    put: '{h} sits down with the takeout. Two cats are suddenly very attentive.',
  },
};
// what the cats hear from the balcony at night: the garden downstairs, where
// they were once strays themselves
const STRAY_LINES = [
  'From the garden below, a stray cat yowls. {c} listens, then looks back at the warm apartment.',
  'Meows drift up from the garden downstairs. {c} used to live down there. Now {c} has a sofa. And a fountain.',
  "Two strays argue in the garden below. {c} remembers those days.",
  'A small meow from the bushes downstairs. {c} chirps back.',
];
// the first time each day a cat and a human meet
const GREETINGS = {
  morning: [
    '{h}: "Good morning, {c}! Did you sleep well?"',
    '{h}: "Morning, {c}! Yes, yes, I see you. Hello!"',
    '{h} scoops up {c}: "Good morning, my little {c}!"',
  ],
  day: [
    "{h}: \"There you are, {c}! Haven't seen you all day.\"",
    '{h}: "Hello, {c}! What have you been up to?"',
  ],
  evening: [
    '{h}: "Good evening, {c}. Busy day of napping?"',
    '{h}: "Hi {c}! Come here, I missed you today."',
  ],
  night: [
    "{h} mumbles: \"Hi, {c}... it's so late... good night.\"",
    '{h}, half asleep: "Night night, {c}."',
  ],
};
// the first human to meet the cats after a trip downstairs
const OUT_LINES = [
  '{h}: "Where have you two been? Do we not feed you guys enough up here?"',
  '{h} picks a leaf off {c}. "Downstairs again? Do we not feed you enough?"',
  "{h} sniffs {c}'s fur. \"You smell like grass. Visiting the old garden, were you?\"",
  '{h}: "There you are! Off begging at the BBQ shed again? You get two meals a day!"',
];
// downstairs: hopping onto things
const GARDEN_PERCH_LINES = {
  bench: ['{c} hops onto the bench. A fine place to watch the kids go by.', '{c} takes the whole bench, and stretches out to make sure.'],
  picnic: ['{c} sits on the BBQ bench like a guest waiting to be served.', '{c} checks under the table for dropped sausage. Nothing. Yet.'],
  table: ['{c} sits in the middle of the BBQ table, where the food goes.', '{c} is on the table. This is where the grilled fish used to appear.'],
  chair: ['{c} takes a seat at the cafe. It smells like coffee and sugar.', '{c} sits in a cafe chair and waits to be served. Service is slow.'],
  cafetable: ['{c} sits on the cafe table. The croissant crumbs are {c}\'s now.', '{c} is on the table, sniffing where a latte once stood.'],
  ac: ["{c} hops onto the AC unit. It hums, and it's warm underneath.", '{c} sits on the humming AC unit and vibrates gently.'],
  counter: ['{c} patrols the shed counter. Somebody prepped chicken here once. {c} remembers.', '{c} hops onto the counter and inspects it for crumbs.'],
};
const KIBBLE_BITS = [[6, 8, '#a8642f'], [8, 8, '#7a4a26'], [10, 8, '#a8642f'], [5, 9, '#7a4a26'], [7, 9, '#c98a4a'], [9, 9, '#a8642f'], [11, 9, '#7a4a26'], [6, 10, '#a8642f'], [8, 10, '#7a4a26'], [10, 10, '#c98a4a']];
const SINK_LINES = [
  '{c} bats at the faucet. Drip. Drip. He waits for the next one.',
  '{c} licks the faucet. Shed water tastes better than bowl water. It just does.',
  "{c} peers into the sink. Is that a fish scale? ...It's a leaf.",
];
const TOILET_LINES = [
  '{c} peers into the toilet. The lid is down. Boring.',
  '{c} unrolls the toilet paper. Then some more. Then all of it.',
];

// ---------------------------------------------------------------- world
function buildWorld() {
  const tiles = buildTiles();
  const at = (x, y) => (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H ? ' ' : tiles[y][x]);
  const forceCap = new Set(DECOR.caps.map(([x, y]) => x + ',' + y));
  // a wall cell shows its face when there is open floor directly below it
  const isFace = (x, y) => isWall(at(x, y)) && isOpen(at(x, y + 1)) && !forceCap.has(x + ',' + y);
  // thin walls (and the faces that continue them) get a strip of wall-top
  const thin = (x, y) => isFace(x, y) && !isWall(at(x, y - 1));

  // lookups the game needs (independent of the time of day)
  const windows = new Set();
  for (const [x0, x1, row, opt] of DECOR.windows)
    for (let x = x0; x <= x1 + (opt.offset ? 1 : 0); x++) windows.add(x + ',' + row);
  const curtainKind = new Map(DECOR.curtains.map(([x, row, kind]) => [x + ',' + row, kind]));
  const curtains = new Set(curtainKind.keys());
  const sideWindows = new Set();
  for (const [x, y0, y1] of DECOR.sideWindows) for (let y = y0; y <= y1; y++) sideWindows.add(x + ',' + y);
  const headboards = new Set();
  for (const [x, y0, y1] of DECOR.headboards) for (let y = y0; y <= y1; y++) headboards.add(x + ',' + y);

  // Garnet's balconies face west: a glass door there has its balcony on the west of it
  const westward = (x, y) => at(x - 1, y) === 'b';
  // the floor of the room behind a glass door
  const behindGlass = (x, y) => at(westward(x, y) ? x + 1 : x - 1, y);

  // the floor plan is painted once per sky (day, dusk, night)
  function paint(sky) {
    const [cv, g] = canvas(MAP_W * T, MAP_H * T);
    R(g, 0, 0, MAP_W * T, MAP_H * T, C.void);
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const ch = tiles[y][x];
        if (isFloor(ch)) drawFloor(g, ch, x, y, at);
        else if (ch === 'G') drawGlassDoor(g, x, y, sky, { flip: westward(x, y), inner: behindGlass(x, y) });
        else if (ch === 'R') drawRailing(g, x, y, sky, { flip: at(x + 1, y) === 'b', far: at(x - 1, y) === 'A' });
        else if (ch === 'A') drawAir(g, x, y, sky, { city: at(x - 1, y) !== 'A', n: at(x, y - 1), s: at(x, y + 1) });
        else if (isWall(ch)) {
          const below = at(x, y + 1);
          if (isFace(x, y))
            drawFace(g, x, y, below === 'R' ? 'b' : below === 'G' ? behindGlass(x, y + 1) : below, thin(x, y) || thin(x - 1, y) || thin(x + 1, y));
          else
            drawCap(g, x, y, {
              u: isWall(at(x, y - 1)),
              d: isWall(at(x, y + 1)),
              l: isWall(at(x - 1, y)),
              r: isWall(at(x + 1, y)),
            });
        }
      }
    }
    for (const [x0, x1, row, opt] of DECOR.windows) drawWindow(g, x0, x1, row, opt, sky);
    for (const [x, row, kind] of DECOR.curtains) drawCurtain(g, x, row, kind);
    for (const [x, y0, y1] of DECOR.sideWindows) drawSideWindow(g, x, y0, y1, sky);
    for (const [x, y0, y1] of DECOR.headboards) drawHeadboard(g, x, y0, y1);
    for (const [x, row, kind] of DECOR.art) drawArt(g, x, row, kind);
    for (const [x, y, v, look] of DECOR.thresholds) drawThreshold(g, x, y, v, look);
    for (const [x0, y0, x1, y1, style] of DECOR.rugs) drawRug(g, x0, y0, x1, y1, style);
    for (const [x, y] of DECOR.drains) drawDrain(g, x, y);
    for (const [x, y, side, col] of DECOR.showerHeads) drawShowerHead(g, x, y, side, C[col]);
    drawFrontDoor(g, DECOR.frontDoor[0], DECOR.frontDoor[1]);
    for (const [x, row, look] of DECOR.doors) drawFrontDoor(g, x, row, look);
    drawScarf(g, DECOR.scarf[0], DECOR.scarf[1]);
    return cv;
  }
  const grounds = { day: paint(SKIES.day), dusk: paint(SKIES.dusk), night: paint(SKIES.night) };

  // bits of glass that should glow a little through the dark
  const glassRects = [];
  for (const [x0, x1, row, opt] of DECOR.windows) {
    const off = opt.offset || 0;
    for (let x = x0; x <= x1; x++) {
      const kind = curtainKind.get(x + ',' + row);
      if (kind === 'full') continue;
      const px = x * T + off + (kind === 'left' ? 8 : 0);
      glassRects.push([px, row * T + 2, kind ? 8 : T, 10]);
    }
  }
  for (const [x, y0, y1] of DECOR.sideWindows) glassRects.push([x * T + 5, y0 * T + 3, 6, (y1 - y0 + 1) * T - 6]);
  for (let y = 0; y < MAP_H; y++)
    for (let x = 0; x < MAP_W; x++) {
      if (tiles[y][x] === 'R') glassRects.push([x * T + (at(x + 1, y) === 'b' ? 0 : 4), y * T, 12, T]);
      if (tiles[y][x] === 'A') glassRects.push([x * T, y * T, T, T]);
      if (tiles[y][x] === 'G') glassRects.push([x * T + 6, y * T, 4, T]);
    }

  // furniture
  const objGrid = [];
  const perchGrid = [];
  for (let y = 0; y < MAP_H; y++) {
    objGrid.push(new Array(MAP_W).fill(null));
    perchGrid.push(new Array(MAP_W).fill(null));
  }
  const sprites = {};
  const objects = OBJECTS.map(([type, x, y]) => {
    const def = TYPES[type];
    if (!def) throw new Error('unknown furniture type ' + type);
    if (!sprites[type]) sprites[type] = renderType(def);
    const o = {
      type, def, x, y, w: def.w, h: def.h, sprite: sprites[type],
      sortY: (y + def.h) * T, shake: 0, dx: 0, dy: 0, saidAt: -9999,
    };
    for (let ly = 0; ly < def.h; ly++) {
      for (let lx = 0; lx < def.w; lx++) {
        if (!isFloor(at(x + lx, y + ly))) console.warn('furniture on non-floor', type, x + lx, y + ly);
        if (objGrid[y + ly][x + lx]) console.warn('furniture overlap', type, x + lx, y + ly);
        objGrid[y + ly][x + lx] = o;
        if (def.perch !== undefined) {
          const spec = typeof def.perch === 'number' ? { h: def.perch } : def.perch(lx, ly);
          if (spec) perchGrid[y + ly][x + lx] = { obj: o, ...spec };
        }
      }
    }
    return o;
  });

  const items = ITEM_SPOTS.map(([key, x, y]) => {
    const def = ITEMS[key];
    return { key, def, sp: renderItem(def), x, y, home: [x, y], state: 'up', fall: null, slide: null, reset: 0 };
  });

  return { tiles, at, grounds, glassRects, objects, objGrid, perchGrid, items, windows, curtains, headboards, sideWindows };
}

// ----------------------------------------------------------------- game
// host: what the app around the game offers it. host.startBattle(encounter,
// done) plays a fight and calls done(result, info); host.saved(ok) is told
// each time the game saves itself.
export function createGame(input, host = {}) {
  const world = buildWorld();
  const { at, objGrid, perchGrid, items } = world;
  const inb = (x, y) => x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
  const objAt = (x, y) => (inb(x, y) ? objGrid[y][x] : null);
  const perchAt = (x, y) => (inb(x, y) ? perchGrid[y][x] : null);
  const heightAt = (x, y) => {
    if (outside) {
      const gp = gardenPerch(x - GOX, y);
      return gp ? gp.h : 0;
    }
    const p = perchAt(x, y);
    return p ? p.h : 0;
  };

  const cats = CONFIG.cats.map((cfg, i) => {
    const [x, y] = START.cats[i];
    return {
      // (what he is called depends on how far the story has got: see names.js)
      kind: 'cat', cfg, get name() { return catName(cfg.id); }, sp: makeCat(CAT_PALS[cfg.pal]),
      tx: x, ty: y, fx: x, fy: y, px: x * T, py: y * T, z: 0, z0: 0, z1: 0, hop: 0,
      dir: 'down', moving: false, mt: 0, md: 1, steps: 0,
      action: null, idle: 0, pose: 'stand', hidden: false, riding: null, perchObj: null,
    };
  });
  let leader = 0;
  let onDid = null; // the story listens here (see home.js): onDid(key, cat), the first-time things of Act 2

  const humans = CONFIG.humans.map((cfg, i) => {
    const wp = WAYPOINTS.find((w) => w.id === START.humans[i]);
    const [x, y] = wp.seat || wp.stand;
    return {
      kind: 'human', cfg, idx: i, name: cfg.name, sp: makeHuman(HUMAN_PALS[cfg.pal], cfg.longHair, { coat: HUMAN_COATS[cfg.pal] }),
      tx: x, ty: y, fx: x, fy: y, px: x * T, py: y * T,
      dir: wp.face, moving: false, mt: 0, md: CONFIG.humanFrames, steps: 0,
      state: 'activity', wp, seated: !!wp.seat, timer: Infinity, path: [], wait: 0, pet: 0,
      script: null, away: false, carry: null,
      // sleep schedule (hours): reset every morning
      asleep: wp.act === 'sleep', bedtime: wp.act === 'sleep', wcDone: true,
      wakeAt: 6.4 + i * 0.3 + Math.random() * 0.4, bedAt: bedTime(i),
    };
  });

  const particles = [];
  const bubbles = [];
  let caption = null;
  let banner = null;
  // the goal the player has been shown in a GOAL box: whenever the story's goal is something else (set by a
  // scene that was skipped, by a quest, by a stage, or brought back by a load), a GOAL box comes up as soon
  // as nothing else is on the screen. There is no "Goal:" line in a caption anywhere.
  let shownGoal = '';
  let goalWait = 0; // frames a new goal has waited for its box (see tick)
  let mode = 'title';
  let frame = 0;
  let room = '';
  const cam = { x: 0, y: 0 };
  const bump = { dir: null, t: 0, lock: false };
  const stats = { scratches: 0, knocks: 0, pets: 0 };
  let curtainSaidAt = -9999;
  // a home-cooked meal in progress: { cook, partner, plates, endAt, phase }
  let meal = null;
  let lastRoute = null;
  let balconySaidAt = -99999;
  let errand = null; // the thing a human has gone out for / brought home
  let nextErrandAt = 60 * 50;
  // downstairs
  let outside = false; // the cats are in the garden
  let beenOut = false; // ...and nobody upstairs has remarked on it yet
  let fade = null; // { t, down } while changing floors
  let garden = null; // painted the first time it is needed
  let gardenSeen = false;
  let gride = null; // a scripted bit of playground fun: { t, parts, done }
  // the other cats who live downstairs (see strays.js)
  let act3 = null; // Act 3's story (act3.js): made further down, once everything it borrows exists
  // Places the story is keeping clear of the garden's passers-by and cats for a scene (quests.js and act3.js
  // say which, each frame): [{ box: [x0, y0, x1, y1], allow: [named cats who belong there] }], in garden
  // tiles. people.js and strays.js keep out of them, and whoever is inside when one is set walks out.
  let zones = [];
  let zonesAt = -1;
  let zonesReady = false; // (the story's modules are made further down)
  function keepOut(x, y, id) {
    if (!zonesReady) return false;
    if (zonesAt !== frame) {
      zonesAt = frame;
      zones = [...quests.keepOut(), ...(act3 && act3.keepOut ? act3.keepOut() : [])];
    }
    return zones.some((z) => x >= z.box[0] && x <= z.box[2] && y >= z.box[1] && y <= z.box[3] && !(id && z.allow && z.allow.includes(id)));
  }
  // (hard: this instant, seen or not: for when the screen is black)
  const clearNpcs = (hard) => {
    zonesAt = -1;
    people.clearZones(hard);
    strays.clearZones(hard);
  };
  const strays = createStrays({
    GOX,
    cats: () => cats.filter((c) => !c.ghost),
    outside: () => outside,
    hour: () => hourNow(),
    // is this spot (world pixels) on screen right now?
    visible: (px, py) => outside && px > cam.x - 40 && px < cam.x + VW + 24 && py > cam.y - 40 && py < cam.y + VH + 24,
    say: (t) => say(t),
    fmt: (t, c) => fmt(t, c),
    bubble: (e, t, n) => bubble(e, t, n),
    spawn: (...a) => spawn(...a),
    act: (c, type, dur) => act(c, type, dur),
    rustle: (tx, ty, fx, fy) => {
      for (const [x, y] of [[fx, fy], [tx, ty]]) if (isBush(x - GOX, y)) rustles.set(x + ',' + y, 16);
    },
    sfx,
    blocked: (tx, ty) => !!people.at(tx, ty) || !!extraAt(tx, ty) || !!dogs.at(tx, ty),
    dogs: () => dogs.about,
    present: (id) => {
      const v = act3 ? act3.present(id) : undefined;
      return v !== undefined ? v : quests.present(id);
    },
    lines: (n) => (act3 && act3.linesFor(n)) || quests.linesFor(n),
    keepOut: (x, y, id) => keepOut(x, y, id),
    // (no anonymous cat is out in Act 3, from the night of the dogs until it is all over)
    // (nor in the opening: Shark alone on the BBQ pavers, with Scar, and nobody else about)
    quiet: () => !!story.flags.quietGarden || !!(act3 && act3.on() && act3.stage() !== 'after') || (story.mode === 'story' && story.act === 0),
    kibble: () => people.kibble.filter((k) => !k.keep), // (not what the story has put down for the pair)
    clock: () => clock,
    // Act 1, before the adoption: food is short, so more of the garden's nameless strays are out, and
    // they come for food from further off (see sniff in strays.js; the pair may have to fight for it)
    lean: () => story.mode === 'story' && story.act === 1 && !story.adopted,
    eatKibble: (k, n) => {
      if (plateContest(k, n)) return; // (the pair got there at the same moment: they may fight for it)
      people.eat(k);
      if (!outside || !strays_visible(n)) return;
      sfx.crunch();
      const L = cats[leader];
      if (Math.abs(n.tx - L.tx) + Math.abs(n.ty - L.ty) < 9) say(fmt(pick([n.name + ' trots over and finishes off the kibble.', 'Too slow. ' + n.name + ' got to the kibble first.', n.name + ' hoovers up the kibble without looking up once.']), L));
    },
  });
  const strays_visible = (n) => n.px > cam.x - 40 && n.px < cam.x + VW + 24 && n.py > cam.y - 40 && n.py < cam.y + VH + 24;
  // the people in the garden, and the kibble some of them leave (see people.js)
  const people = createPeople({
    GOX,
    cats: () => cats.filter((c) => !c.ghost),
    strays: () => strays.list,
    outside: () => outside,
    hour: () => hourNow(),
    clock: () => clock,
    visible: (px, py) => outside && px > cam.x - 40 && px < cam.x + VW + 24 && py > cam.y - 40 && py < cam.y + VH + 24,
    // (in Act 3 the story's own people and animals stand about the garden for days on end, BBC and Flower
    // on Garnet's step among them: a passer-by goes round them too. Not round a golf ball.)
    catAt: (tx, ty) => cats.find((c) => c.tx === tx && c.ty === ty) || strays.at(tx, ty) || dogs.at(tx, ty) || (act3 && act3.on() && extras.find((e) => !e.hidden && !e.indoor && e.tx === tx && e.ty === ty && !/^ball/.test(e.id))) || null,
    dogs: () => dogs.about,
    keepOut: (x, y) => keepOut(x, y, null),
    quiet: () => !!story.flags.quietGarden,
    allKind: () => !!story.flags.epilogue,
    say: (t) => say(t),
    fmt: (t, c) => fmt(t, c),
    bubble: (e, t, n) => bubble(e, t, n),
    act: (c, type, dur) => act(c, type, dur),
    bolt: (tx, ty) => startBolt(tx, ty),
    sfx,
  });
  let bolt = null; // tiles the cats are fleeing along after being shooed
  let gardenSaidAt = -9999;
  // the dogs that roam the garden from Act 3 on (see dogs.js)
  let treed = null; // both cats up a tree, until the player walks: { x, y (the trunk), t, held, parts: [{ cat, home }] }
  const dogs = createDogs({
    GOX,
    cats: () => cats.filter((c) => !c.ghost),
    leader: () => cats[leader],
    company: () => [cats[1 - leader].ghost ? null : cats[1 - leader], guest], // the follower, and a friend who is along
    heel: (n, cat) => (n.following = cat),
    treed: () => (treed ? [treed.x, treed.y] : null),
    outside: () => outside,
    hour: () => hourNow(),
    story: () => story,
    visible: (px, py) => outside && px > cam.x - 40 && px < cam.x + VW + 24 && py > cam.y - 40 && py < cam.y + VH + 24,
    say: (t) => say(t),
    fmt: (t, c) => fmt(t, c),
    bubble: (e, t, n) => bubble(e, t, n),
    sfx,
    addExtra: (...a) => addExtra(...a),
    blocked: (tx, ty) => !!strays.at(tx, ty) || !!people.at(tx, ty) || !!extraAt(tx, ty),
    // nothing else is going on: the pair can be caught, or shuffled along
    free: () => mode === 'play' && !scene && !dialog.active && !fade && !gride && !bolt && !cats[leader].riding,
    shift: (m, tx, ty) => (m.kind === 'cat' ? startMove(m, tx, ty, CONFIG.walkFrames) : strays.trail(m, tx, ty, 9)),
    fight: (n, then) => startFight(ENCOUNTERS.dogs(n), { then }),
    lost: () => dogsLost(),
  });
  // the traffic on the road (see traffic.js): it waits at a crossing for people and for the garden's own cats
  const traffic = createTraffic({
    hour: () => hourNow(),
    quiet: () => !!story.flags.quietRoad || !!story.flags.quietGarden,
    onZebra: (c) => {
      // on the stripes themselves; or a person stepping off the kerb. (Somebody who is only sitting on the
      // kerb, like Socks waiting to cross, holds nothing up.)
      const col = (e) => !e.hidden && e.tx - GOX >= c && e.tx - GOX < c + 4;
      const on = (e) => col(e) && isRoad(e.ty);
      const stepping = (e) => col(e) && e.moving && (e.ty === ROAD.top - 1 || e.ty === ROAD.bottom + 1);
      return people.list.some((e) => on(e) || stepping(e)) || extras.some(on) || strays.list.some((n) => on(n) && !strays.tagging(n));
    },
  });
  let roadSide = 'south'; // the side of the road the pair were last on
  let rain = 0; // how hard it is raining, 0 to 1: it follows story.flags.rain, a little at a time
  const weather = () => (rain = Math.max(0, Math.min(1, rain + (story.flags.rain ? 0.02 : -0.004))));
  // ---- the story's side of things (see story.js)
  let story = newStory();
  // until the vet has named them, the story calls the pair The Tabby and The Orange
  const syncNames = () => setNamed(story.mode !== 'story' || !!story.flags.named || !!story.adopted);
  const dialog = createDialog(input);
  let scene = null; // a scripted scene in progress: { id, steps, i, wait, ... }
  let hold = 0; // frames Do has been held with nothing to do (a long hold is a nap)
  let swapT = 0; // frames the swap button has been down (a tap swaps; a hold shows the cats' sheet)
  let swapWant = false; // a tap is waiting for the cats to stand still
  let nap = null; // { t, gained } while the cats are napping
  let guest = null; // the stray that is tagging along
  let guestFights = true; // ...and whether it joins in a fight (not when the story is only walking it somewhere)
  let leftKibbleAt = -99999;
  let lastSave = 0;
  // things that can be carried: where each one lies, or who has it
  const pickups = Object.entries(PICKUPS).map(([id, def]) => ({ id, def, sp: renderPickup(def), words: WORDS.items[id], floor: def.late ? 'gone' : def.home[0], x: def.home[1], y: def.home[2], by: null, away: 0 }));
  const FACES = {};
  const faceFor = (who) => {
    if (!who) return null;
    // a person's picture starts a row down and runs on to the top of the shirt
    // (one face for each of the story's own, by its id: there are two of BBC, with and without his collar)
    const key = who.kind === 'extra' ? 'extra:' + who.id : who.name;
    if (!FACES[key]) FACES[key] = who.kind === 'human' || (who.kind === 'extra' && !who.low) ? faceOf(who.sp.stand.down, 14, 1) : faceOf(who.sp.stand.down, 13);
    return FACES[key];
  };
  // People the story brings into the garden (see quests.js): they stand where
  // they are put and move only when a scene moves them. One made with
  // { indoor: true } lives on the flats' map instead (Purple Scarf at her own
  // front door): it is put on a tile of that map, drawn
  // and walked by scenes as the others are, and not seen from the garden.
  const extras = [];
  const extraAt = (tx, ty) => extras.find((e) => !e.hidden && e.tx === tx && e.ty === ty) || null;
  function addExtra(id, name, sp, opts = {}) {
    // opts.low: an animal, drawn standing on its tile
    const e = { kind: 'extra', id, name, sp, ...opts, tx: 0, ty: 0, fx: 0, fy: 0, px: 0, py: 0, dir: 'down', moving: false, mt: 0, md: 12, steps: 0, hidden: true, lift: 0, hang: false, sat: false };
    extras.push(e);
    return e;
  }
  function placeExtra(e, gx, gy, dir) {
    const x = e.indoor ? gx : GOX + gx;
    Object.assign(e, { tx: x, ty: gy, fx: x, fy: gy, px: x * T, py: gy * T, moving: false, hidden: false, dir: dir || e.dir });
  }
  // ---- somebody else's flat
  // Purple Scarf's flat lies on the same map as Hưng and Trang's (FLATS and SCARF in map.js) and is
  // reached only by the story. What the story wants to answer for itself there, it says here:
  //   door(cat)            her front door, walked into or asked with Do
  //   bump(cat, object)    a piece of furniture (object.type: 'clueCoat', 'clueMap', 'clueSacks'...)
  //   tile(cat, ch, x, y)  anything else walked into: glass 'G', a rail 'R', a wall '#'
  //   meow(cat)            the leader has meowed
  // Each returns true when it has dealt with it; otherwise the flat's own caption is said.
  const flatHooks = { scarf: {} };
  const flatLit = { scarf: true }; // after dark, are its ceiling lights on?
  // the flat the pair are in: 'home', 'scarf', or '' down in the garden
  const flatNow = () => (outside ? '' : flatAt(cats[leader].tx, cats[leader].ty));
  // the free garden tile nearest (gx, gy): nothing standing on it, and not one of `not`
  const tileFree = (x, y, not = []) => !gardenBlocked(x, y) && !gardenPerch(x, y) && !isMat(x, y) && !strays.at(GOX + x, y) && !people.at(GOX + x, y) && !extraAt(GOX + x, y) && !catAt(GOX + x, y) && !not.some(([a, b]) => a === x && b === y);
  function freeNear(gx, gy, maxR = 3, not = []) {
    const ok = (x, y) => tileFree(x, y, not);
    for (let r = 0; r <= maxR + 6; r++)
      for (let oy = -r; oy <= r; oy++)
        for (let ox = -r; ox <= r; ox++) if (Math.max(Math.abs(ox), Math.abs(oy)) === r && ok(gx + ox, gy + oy)) return [gx + ox, gy + oy];
    return [gx, gy];
  }
  const questApi = {
    // one of the story's own people or animals, by its id (whichever part of the story made it)
    extra: (id) => extras.find((e) => e.id === id) || null,
    GOX, strays, people, dogs, sfx, addExtra, placeExtra, freeNear,
    story: () => story,
    cats: () => cats,
    leader: () => cats[leader],
    outside: () => outside,
    hour: () => hourNow(),
    day: () => dayNow(),
    clock: () => clock,
    visible: (px, py) => outside && px > cam.x - 40 && px < cam.x + VW + 24 && py > cam.y - 40 && py < cam.y + VH + 24,
    // keep: news the player must have time to read; without it, the next thing said replaces it as usual
    say: (t, keep) => say(t, keep),
    fmt: (t, c) => fmt(t, c),
    bubble: (e, t, n) => bubble(e, t, n),
    act: (c, type, dur) => act(c, type, dur),
    discover: (key) => discover(key),
    tileFree: (gx, gy) => tileFree(gx, gy),
    // one of the story's people takes the next step of the way to a garden tile, outside a scene (false: no way there)
    walkStep: (e, x, y) => sceneStep(e, x, y),
    // one step for one of the story's animals
    stepExtra(e, gx, gy, frames = 9) {
      hMove(e, GOX + gx, gy);
      e.md = frames;
    },
    // the pair curl up where they are, and get up again
    lieDown() {
      for (const c of cats) Object.assign(c, { pose: 'sleep', action: null, idle: 0 });
    },
    getUp() {
      for (const c of cats) Object.assign(c, { pose: 'sit', idle: 0, dir: 'down' });
    },
    // the vet has given the pair their names: from here on the game uses them
    nameThem() {
      story.flags.named = true;
      syncNames();
    },
    // --- the opening ---
    napping: () => !!nap,
    // ring the health bars for a few seconds: they have just appeared
    flashMeter() {
      meterFlash = 420;
    },
    dry() {
      story.flags.rain = false;
      rain = 0;
    },
    // ...and the other way: rain at once, and an empty road
    wet() {
      story.flags.rain = story.flags.quietRoad = true;
      rain = 1;
      traffic.fill();
    },
    // is a cat part of the scene? (Orca is not, for most of the opening; Shark starts it in a bag)
    showCat(i, on) {
      cats[i].ghost = !on;
    },
    // the clock, forward to an hour (today, or tomorrow if that has passed)
    setClock(hr) {
      let t = calDay() * 1440 + hr * 60;
      if (t <= clock) t += 1440;
      clock = t;
      lastPhase = phaseOf(hourNow());
      wakeUp();
      nap = null;
      traffic.fill();
    },
    // a car the story drives: lane 0 is the one along the garden's kerb, going west
    car: (lane, stopAtTile) => traffic.add('car', lane, stopAtTile * T),
    // the screen, black at once (a scene that opens in the dark)
    blackout() {
      if (scene) scene.fade = scene.fadeTo = 1;
    },
    // Act 1 starts: the two of them, the next morning, in their bush
    startAct1() {
      story.act = 1;
      story.stage = 'start';
      story.goal = '';
      for (const k of ['solo', 'noEnergy', 'noNap', 'rain', 'quietRoad', 'noWalk', 'nightMusic']) delete story.flags[k];
      for (const c of cats) c.ghost = false;
      story.hurt = { shark: 0, orca: 0 };
      let t = calDay() * 1440 + 7 * 60;
      if (t <= clock) t += 1440;
      clock = t;
      lastPhase = phaseOf(hourNow());
      leader = 0;
      cats.forEach((c, i) => {
        const [x, y] = freeNear(quests.HOME[i][0], quests.HOME[i][1]);
        placeCat(c, GOX + x, y, 'down');
      });
      for (const e of extras) e.hidden = true;
      strays.roll();
      strays.newVisit(); // (the garden's nameless strays, none of whom was out in the opening)
      traffic.fill();
      caption = null;
      captionQueue.length = 0;
      banner = { text: PHASE_NAME[phaseOf(hourNow())], t: 150 };
      updateCamera(true);
    },
    // Carried upstairs, for good: house cats from here on, waking on the sofa the next morning
    // Carried upstairs, for good: house cats from here on. It is still the same night, and late:
    // Act 2 (home.js) takes it from the laundry room.
    adopt() {
      story.adopted = true;
      story.act = 2;
      for (const k of ['rain', 'quietRoad']) delete story.flags[k];
      rain = 0;
      for (const c of cats) c.ghost = false;
      const hr = hourNow();
      if (hr >= 5 && hr < 22.5) clock = calDay() * 1440 + 22.5 * 60;
      lastPhase = phaseOf(hourNow());
      for (const e of extras) e.hidden = true;
      changeFloor(false);
      caption = null;
      captionQueue.length = 0;
      banner = null;
      story.quest.home = 'arrive';
      updateCamera(true);
    },
    homeBegin: () => home.begin(),
    // A long sleep after a big day: to seven the next morning if it is evening
    // or night, and otherwise for eight hours. They wake as full as they lay down.
    sleepOver() {
      const hr = hourNow();
      let t = hr >= 15 || hr < 7 ? calDay() * 1440 + 7 * 60 : clock + 8 * 60;
      if (t <= clock) t += 1440;
      if (t - clock < 3 * 60) t = clock + 8 * 60; // (nearly morning already: eight hours all the same)
      const slept = (t - clock) / 60;
      if (keepsHurt(story)) mend(story.adopted ? 1 : MEND.sleep); // (a night's sleep gives a little back; a house cat, all of it)
      clock = t;
      lastPhase = phaseOf(hourNow());
      strays.roll();
      traffic.fill();
      return slept;
    },
    burst: (...a) => burst(...a),
    mend: (share) => mend(share),
    // leave one of the pair this share of his full HP short
    hurtShare: (kind, share) => setHurt(kind, share * fullHp(kind)),
    wake: () => wakeUp(),
    playScene: (...a) => playScene(...a),
    startFight: (...a) => startFight(...a),
    startBolt: (x, y) => startBolt(x, y),
    openDialog: (o) => dialog.open(o),
    setGoal: (t) => setGoal(t),
    other: () => cats[1 - leader],
    // stand a cat (0 Shark, 1 Orca) on a garden tile
    putCat: (i, gx, gy, dir) => placeCat(cats[i], GOX + gx, gy, dir),
    frame: () => frame,
    busy: () => !!scene || dialog.active,
    clearNpcs,
    // one of the garden's cats walks with the pair for a while (the story's doing: it takes no part in fights)
    escort(n) {
      guest = n;
      guestFights = false;
      strays.follow(n, cats[1 - leader]);
    },
    release(n) {
      strays.unfollow(n);
      if (guest === n) guest = null;
      guestFights = true;
    },
    // what a cat has in his mouth, if anything
    carrying: (cat) => carried(cat),
    // put one of the things that can be carried on a garden tile
    placePickup(id, gx, gy) {
      const p = pickups.find((o) => o.id === id);
      Object.assign(p, { floor: 'garden', x: gx, y: gy, by: null, away: 0 });
    },
  };
  const quests = createQuests(questApi);
  zonesReady = true;
  // Act 2 (indoors) is home.js, and this is what the game lends it. Humans are numbered: 0 Hưng, 1 Trang.
  const wpOf = (id) => WAYPOINTS.find((w) => w.id === id);
  const setHuman = (h, x, y, more) => Object.assign(h, {
    tx: x, ty: y, fx: x, fy: y, px: x * T, py: y * T, moving: false, mt: 0, path: [], wait: 0, pet: 0,
    state: 'activity', script: null, onAbort: null, away: false, carry: null, seated: false, asleep: false, bedtime: false, timer: 600, ...more,
  });
  const homeApi = {
    T,
    story: () => story,
    cats: () => cats,
    humans: () => humans,
    leader: () => cats[leader],
    other: () => cats[1 - leader],
    setLeader(i) {
      leader = i;
      if (guest) guest.following = cats[1 - leader];
    },
    hour: () => hourNow(),
    frame: () => frame,
    dark: () => isDark(),
    busy: () => !!scene || dialog.active || !!fade,
    clearNpcs,
    idle: () => !scene && !dialog.active && !fade && !gride && !cats[leader].action && !cats.some((c) => c.moving || c.riding),
    outside: () => outside,
    sfx,
    fmt: (t, cat) => fmt(t, cat || cats[leader]),
    say: (t, keep) => say(t, keep),
    bubble: (who, text, t) => bubble(who, text, t),
    note: (...a) => note(...a),
    openDialog: (o) => dialog.open(o),
    playScene: (...a) => playScene(...a),
    setGoal: (t, quiet) => setGoal(t, quiet),
    startFight: (...a) => startFight(...a),
    blackout() {
      if (scene) scene.fade = scene.fadeTo = 1;
    },
    autosave: () => autosave(),
    act: (...a) => act(...a),
    putCat(i, x, y, dir = 'down') {
      placeCat(cats[i], x, y, dir);
      updateCamera(true);
    },
    lieDown() {
      for (const c of cats) Object.assign(c, { pose: 'sleep', action: null, idle: 0 });
    },
    getUp() {
      for (const c of cats) Object.assign(c, { pose: 'sit', idle: 0 });
    },
    wake: () => wakeUp(),
    mend: (share) => mend(share),
    free: (x, y) => freeFloor(x, y) && !humanAt(x, y) && !catAt(x, y),
    // what a cat is standing on (a bed, say): the furniture's type, or ''
    perch(cat) {
      const p = perchAt(cat.tx, cat.ty);
      return p && p.obj ? p.obj.type : '';
    },
    object: (type) => world.objects.find((o) => o.type === type),
    // something a cat would hop up onto or climb (furniture, a curtain)
    surface: (x, y) => !!perchAt(x, y) || curtainAt(x, y),
    curtain: (x, y) => curtainAt(x, y),
    // the piece of furniture a cat on this tile would be standing on: its type, or ''
    perchType(x, y) {
      const p = perchAt(x, y);
      return p && p.obj ? p.obj.type : '';
    },
    // a cat (0 Shark, 1 Orca) steps onto the next tile, hopping up or down if it is higher or lower
    hop: (i, x, y) => startMove(cats[i], x, y, 14),
    runFrames: CONFIG.runFrames,
    day: () => calDay(),
    // --- the two humans ---
    // at a waypoint, at once: seated there (or asleep in bed) if asked
    putHuman(i, id, { seated = false, asleep = false } = {}) {
      const w = wpOf(id);
      const [x, y] = (seated || asleep) && w.seat ? w.seat : w.stand;
      setHuman(humans[i], x, y, { wp: w, dir: w.face, seated: (seated || asleep) && !!w.seat, asleep, bedtime: asleep, wcDone: true, timer: asleep ? Infinity : 600 });
      if (asleep) humans[i].wakeAt = wakeTime(hourNow());
    },
    // standing on a tile, for a scene to walk about
    standHuman(i, x, y, dir = 'down') {
      setHuman(humans[i], x, y, { dir });
    },
    // back to their own day, from wherever a scene has left them
    releaseHuman(i) {
      const h = humans[i];
      Object.assign(h, { state: 'activity', script: null, path: [], seated: false, timer: 40, moving: false });
    },
    // On his or her feet, for a scene to walk them to (x, y). Nobody appears out of thin air: one who
    // is in the picture walks from where they are, and one who is not starts just out of it, on the
    // way there, and walks in. (n is only for a flat with no way through: then they are put there.)
    comeTo(i, x, y, n) {
      const h = humans[i];
      if (h.seated || h.asleep) {
        const [sx, sy] = h.wp.stand;
        setHuman(h, sx, sy, { wp: h.wp, dir: h.dir });
      }
      Object.assign(h, { state: 'activity', script: null, onAbort: null, path: [], moving: false, pet: 0, bedtime: false, px: h.tx * T, py: h.ty * T });
      const path = bfs([h.tx, h.ty], [x, y]);
      if (!path) return void setHuman(h, x, y, { wp: h.wp, dir: h.dir });
      const seen = ([tx, ty]) => tx * T > cam.x - 2 * T && tx * T < cam.x + VW + T && ty * T > cam.y - 2 * T && ty * T < cam.y + VH + 2 * T;
      let k = -1;
      for (let j = path.length - 1; j >= 0; j--) if (!seen(path[j])) { k = j; break; }
      if (k >= 0) setHuman(h, path[k][0], path[k][1], { wp: h.wp, dir: h.dir });
    },
    sendHuman: (i, id) => goToWaypoint(humans[i], wpOf(id)),
    seek: (i, cat) => startSeek(humans[i], cat),
    // up, about, and not in the middle of something
    humanFree(i) {
      const h = humans[i];
      return h.state === 'activity' && awake(h) && !h.bedtime && !h.pet && !h.moving && !dining(h);
    },
    mealOn: () => !!meal,
    // Whatever the two of them were in the middle of is over: a meal on the table, an errand out
    // of the door, a trip with the bowls. (Before a scene puts them somewhere else at a stroke.)
    settle() {
      if (meal) {
        for (const it of meal.plates) {
          const i = items.indexOf(it);
          if (i >= 0) items.splice(i, 1);
        }
        meal = null;
      }
      if (errand && humans.some((h) => h.away)) finishErrand();
      // (whoever was in the middle of a meal, an errand or a trip with the bowls stops there: the steps
      // still to come are about something that is over)
      for (const h of humans) if (h.state === 'script') endScript(h);
      for (const h of humans) Object.assign(h, { away: false, carry: null });
      bowls.busy = false;
      bowls.hidden = false;
    },
    // --- the flat ---
    setClock(hr, nextDay) {
      let t = calDay() * 1440 + hr * 60;
      if (t <= clock || nextDay) t += 1440;
      clock = t;
      lastPhase = phaseOf(hourNow());
      wakeUp();
      nap = null;
    },
    // breakfast and dinner as the story wants them: both portions out, and not put out a second time today
    serve(what) {
      if (what === 'kibble') {
        fired.kibble = calDay();
        setFeeder(2);
      } else if (what === 'none') setFeeder(0);
      else if (what === 'eaten' || what === 'half') setBowls(what);
      else {
        fired.feed = calDay();
        setBowls('full');
        bowls.busy = false;
      }
    },
    // the evening's wet food has been brought (or is on its way) today
    fedToday: () => fired.feed === calDay(),
    // a trip with the bowls that nobody is making any more is over
    unstick() {
      if (!bowls.busy || humans.some((h) => h.script)) return;
      bowls.busy = false;
      bowls.hidden = false;
      for (const h of humans) h.carry = null;
    },
    bowls: () => bowls,
    feeder: () => feeder,
    tv: () => tvObj.ch,
    setTV: (ch) => setTV(ch),
    camera: () => updateCamera(true),
    // Out of the front door and down to the garden, from a screen that is already black (the end of
    // a scene that has faded out): it clears on the garden.
    leave() {
      if (!garden) garden = buildGarden();
      fade = { t: FADE, down: true };
    },
    // --- another flat: Purple Scarf's (its tiles are SCARF in map.js) ---
    // The pair, from wherever they are (the garden, say), onto a tile of that flat, at a stroke: for a
    // scene that has faded to black. spot: [x, y] for the leader (the other one goes beside him), or
    // [[x, y], [x, y]] for the leader and then the other; left out, where the story first puts them down.
    toFlat: (id, spot, dir) => enterFlat(id, spot, dir),
    // 'home', 'scarf', or '' in the garden
    flat: () => flatNow(),
    // what the story answers for itself there: { door, bump, tile, meow } (see flatHooks); {} for nothing
    onFlat(id, hooks) {
      flatHooks[id] = hooks || {};
    },
    // its ceiling lights, after dark: on (as they start) or off
    flatLights(id, on) {
      flatLit[id] = !!on;
    },
    // a piece of furniture the story brings into the flat (one tile), and takes out again
    addObject: (type, x, y) => addObject(type, x, y),
    removeObject: (o) => removeObject(o),
    // the story's own people and animals, indoors: addExtra(id, name, sprite, { indoor: true, low }) and
    // then placeExtra(e, x, y, dir) on a tile of the flats' map; e.hidden = true takes one away again
    addExtra: (...a) => addExtra(...a),
    placeExtra: (...a) => placeExtra(...a),
    // a cat (0 Shark, 1 Orca) jumps to a tile that is not next to him, in an arc: across a gap, say
    leap(i, x, y, frames = 24, height = 12) {
      const c = cats[i];
      startMove(c, x, y, frames);
      Object.assign(c, { md: frames, hop: height });
      sfx.jump();
    },
  };
  const home = createHome(homeApi);
  // Act 3 (act3.js and its three parts) borrows all that the garden's story has, the flat's, and this.
  const act3Api = {
    ...questApi,
    home: homeApi,
    setGoal: (t, quiet) => setGoal(t, quiet),
    busy: () => !!scene || dialog.active || !!fade,
    clearNpcs,
    setBarrier, setBoatDogs, setBoatGone, setCages,
    autosave: () => autosave(),
    // one of the story's people or animals, by its id (the garden story's own among them: 'bbc', 'flower', 's', 'l', 'hung', 'trang')
    extra: (id) => extras.find((e) => e.id === id) || null,
    // the friend who is tagging along (one of the garden's cats), or null; asking one along; sending one back
    guest: () => guest,
    askAlong: (cat, n) => askAlong(cat, n),
    sendHome: (n, line) => sendHome(n, line),
    strayTalk: (cat, n) => strayTalk(cat, n),
    // what losing to dogs does: the pair bolt for the nearest bush, with nothing left in them
    dogsLost: () => dogsLost(),
    // out of the flat's front door and down to the garden, as walking through it does
    goDown: () => travel(true),
    // nobody in the garden at all, this instant (and nobody comes while story.flags.quietGarden is set)
    emptyGarden() {
      people.clear();
      strays.newVisit();
    },
    // none of the garden's anonymous cats (while `quiet` below says so, none comes either)
    noStrays() {
      if (strays.list.some((n) => !n.named)) strays.newVisit();
    },
    // From indoors, with the screen black (a scene that has faded out), to two garden tiles: the leader's,
    // and the other one's. The screen stays as the scene has it.
    toGarden(a, b, dir = 'down') {
      if (!garden) garden = buildGarden();
      if (!outside) changeFloor(true);
      placeCat(cats[leader], GOX + a[0], a[1], dir);
      placeCat(cats[1 - leader], GOX + b[0], b[1], dir);
      caption = null;
      captionQueue.length = 0;
      room = gardenArea(a[0], a[1]) || '';
      banner = null;
      updateCamera(true);
    },
    // ...and from the garden up to the pair's own flat, the same way: just inside the front door
    toHome() {
      if (outside) changeFloor(false);
      caption = null;
      captionQueue.length = 0;
      banner = null;
      updateCamera(true);
    },
    setLeader: (i) => homeApi.setLeader(i),
    floor: () => (outside ? 'garden' : flatNow()),
    pickup: (id) => pickups.find((o) => o.id === id) || null,
    // a thing to carry, put where it belongs (a toy the story has just brought into the flat, say)
    toyHome: (id) => pickups.filter((o) => o.id === id).forEach(sendBack),
    carrying: (cat) => carried(cat),
    mend: (share) => mend(share),
    showCard: (kind, who, start) => showCard(kind, who, start),
  };
  act3 = createAct3(act3Api);
  homeApi.act3Begin = () => act3.begin();
  onDid = (key, cat) => home.did(key, cat);
  const rustles = new Map(); // bush tile -> frames left to shake
  const carryIcons = {};
  for (const k of ['parcel', 'shopbag', 'takeout', 'bowls', 'bowlsFull', 'tray', 'trayEmpty']) carryIcons[k] = renderItem(ITEMS[k]).up;
  const tvObj = world.objects.find((o) => o.type === 'tvwall');
  tvObj.ch = 0; // 0 = off, then four channels: birds, an aquarium, football, a singing show
  // ------------------------------------------------------------- clock
  // `clock` counts game minutes from midnight before day 1
  const MIN_PER_FRAME = 60 / (CONFIG.hourSeconds * 60);
  let clock = CONFIG.startHour * 60;
  const hourNow = () => (clock / 60) % 24;
  const calDay = () => Math.floor(clock / 1440);
  // days roll over at 6am, so the game's first hour still counts as day 1
  const dayNow = () => Math.max(1, Math.floor((clock - 360) / 1440) + 1);
  const phaseOf = (hr) => (hr < 6 ? 'night' : hr < 12 ? 'morning' : hr < 18 ? 'day' : 'evening');
  const PHASE_NAME = { morning: 'Morning', day: 'Afternoon', evening: 'Evening', night: 'Night' };
  let lastPhase = phaseOf(hourNow());
  const fired = {}; // once-a-day events: name -> calendar day
  // first meeting of the day: returns a greeting once per cat-human pair per day
  const greeted = new Set();
  function greeting(c, h) {
    const key = dayNow() + ':' + c.name + ':' + h.name;
    if (greeted.has(key)) return null;
    greeted.add(key);
    const hr = hourNow();
    const when = h.asleep || hr >= 22 || hr < 6 ? 'night' : phaseOf(hr) === 'morning' ? 'morning' : phaseOf(hr);
    return fmt(pick(flat('greet.' + when, GREETINGS[when], c)), c, h);
  }
  // what a human says on meeting a cat: a word about the trip downstairs
  // comes before the ordinary first-hello of the day
  function hello(c, h) {
    if (beenOut && !h.asleep) {
      beenOut = false;
      return fmt(pick(flat('out', OUT_LINES, c)), c, h);
    }
    return greeting(c, h);
  }
  const bedtimeFor = (h) => lateHour(hourNow()) >= h.bedAt;
  // awake between wake time and last night's bedtime (both on the 6am-to-6am scale)
  const wakeUpFor = (h) => {
    const t = lateHour(hourNow());
    return t >= h.wakeAt && t < h.bedAt;
  };
  const awake = (h) => !h.asleep && !h.away;
  // dark outside (the indoor lights stay on until about 10pm)
  const isDark = () => {
    const hr = hourNow();
    return hr >= 19.5 || hr < 6;
  };

  // Food comes in two portions, one per cat. `portions` counts what's left and
  // `eaters` remembers who has eaten from this serving.
  // wet food bowls: 'clean' (empty, waiting for 7pm), 'full', 'half', 'eaten'
  const bowls = world.objects.find((o) => o.type === 'bowls');
  const bowlSprites = {
    full: bowls.sprite,
    half: renderType(TYPES.bowlsHalf),
    clean: renderType(TYPES.bowlsEmpty),
    eaten: renderType(TYPES.bowlsDirty),
  };
  Object.assign(bowls, { food: true, state: 'clean', portions: 0, eaters: [], eatenAt: 0, busy: false, hidden: false });
  const setBowls = (state) => {
    bowls.state = state;
    bowls.sprite = bowlSprites[state];
    bowls.portions = { full: 2, half: 1 }[state] || 0;
    if (state === 'full') bowls.eaters = [];
    if (state === 'eaten') bowls.eatenAt = frame;
  };
  setBowls('clean');
  // kibble machine: dispenses two portions at 6am
  const feeder = world.objects.find((o) => o.type === 'feeder');
  const feederSprites = [renderType(TYPES.feederEmpty), renderType(TYPES.feederHalf), feeder.sprite];
  Object.assign(feeder, { food: true, portions: 0, eaters: [] });
  const setFeeder = (n) => {
    if (n === 2) feeder.eaters = [];
    feeder.portions = n;
    feeder.sprite = feederSprites[n];
  };
  setFeeder(0);
  // one portion gone
  function eatPortion(o) {
    if (o === bowls) setBowls(bowls.portions === 2 ? 'half' : 'eaten');
    else setFeeder(Math.max(0, feeder.portions - 1));
  }
  // lamps: a level per light that fades towards on/off
  const lights = LIGHTS.map((l) => ({ ...l, level: 0, obj: l.lamp ? objGrid[l.lamp[1]][l.lamp[0]] : null }));
  const screens = SCREEN_LIGHTS.map((l) => ({ ...l, level: 0, screen: true }));
  const [lightCv, lg] = canvas(VW, VH);
  // tiles a pushed bag may not end up on (doorways)
  const noPush = new Set([...DECOR.thresholds.map(([x, y]) => x + ',' + y), ...DOOR_SPOTS.map((p) => p.join(',')), '15,14', '15,15']);

  const humanAt = (x, y) => humans.find((h) => !h.away && h.tx === x && h.ty === y);
  const catAt = (x, y) => cats.find((c) => !c.ghost && c.tx === x && c.ty === y);
  const itemAt = (x, y) => items.find((i) => i.state === 'up' && i.x === x && i.y === y);
  // (while Shark is alone, a sentence about the other cat is left out)
  const alone = (s) => (story.flags.solo && s.includes('{o}') ? s.split(/(?<=[.!?])\s+/).filter((p) => !p.includes('{o}')).join(' ') : s);
  const fmt = (s, cat, h) =>
    fillNames(putName(putName(alone(s), '{c}', cat ? cat.name : ''), '{o}', cat ? cats[1 - cats.indexOf(cat)].name : ''))
      .replaceAll('{k}', () => (cat && NICKS[cat.cfg.id] ? pick(NICKS[cat.cfg.id]) : cat ? cat.name : ''))
      .replaceAll('{h}', h ? h.name : '')
      .replaceAll('{He}', h ? h.cfg.he[0].toUpperCase() + h.cfg.he.slice(1) : '')
      .replaceAll('{he}', h ? h.cfg.he : '')
      .replaceAll('{him}', h ? h.cfg.him : '')
      .replaceAll('{his}', h ? h.cfg.his : '');

  // ------------------------------------------------------------ ui bits
  // captions show one "page" per line break, then move on by themselves
  const captionQueue = [];
  const MIN_CAPTION = 60; // frames a page stays up before something else can replace it
  const kept = new Set(); // captions that must be given time to be read (the story's)
  function showCaption(text) {
    // (a spoken line, [who, words], handed over where a caption was wanted: show its words; anything else, as text)
    if (Array.isArray(text)) text = text[text.length - 1];
    text = String(text == null ? '' : text);
    const pages = text.split('\n');
    caption = { text, pages, i: 0, lines: wrapText(pages[0], VW - 26), n: 0, t: 0, keep: kept.delete(text) };
  }
  // how long a page needs: typed out, and then read
  const readTime = (n) => n / 1.5 + Math.max(MIN_CAPTION, Math.min(190, n * 2.2));
  const settled = (c) => (c.keep ? c.i === c.pages.length - 1 && c.t >= readTime(c.pages[c.i].length) : c.t >= MIN_CAPTION);
  // keep: nothing may push this one off the screen before it can have been read
  function say(text, keep) {
    if (!text) return;
    text = fillNames(text);
    if (keep) kept.add(text);
    if (caption && !settled(caption)) {
      // too soon to replace what's showing: wait in line (newest few only)
      if (captionQueue[captionQueue.length - 1] !== text && caption.text !== text) captionQueue.push(text);
      if (captionQueue.length > 3) captionQueue.shift();
      return;
    }
    showCaption(text);
  }

  function bubble(ent, text, t = 70) {
    if (ent.ghost) return;
    for (let i = bubbles.length - 1; i >= 0; i--) if (bubbles[i].ent === ent) bubbles.splice(i, 1);
    bubbles.push({ ent, text, t });
  }
  function spawn(kind, x, y, o = {}) {
    particles.push({
      kind, x, y, vx: o.vx || 0, vy: o.vy || 0, g: o.g || 0, life: o.life || 40, max: o.life || 40,
      color: o.color || C.white, ch: o.ch || '',
    });
  }
  function burst(x, y, color, n = 6) {
    for (let i = 0; i < n; i++)
      spawn('px', x, y, { vx: Math.random() * 1.6 - 0.8, vy: -Math.random() * 1.4 - 0.2, g: 0.08, life: 22 + rnd(14), color });
  }
  const centre = (e) => [e.px + 8, e.py + 8 - (e.z || 0)];

  // One of the flat's lists of lines: the Act 2 version when the story has one (flat-lines.js),
  // and otherwise `own`, which is Sandbox's.
  const flat = (key, own, cat) => flatLines(story, key, cat) || own;
  // ...for a list that a piece of furniture carries ('lines', 'scold', 'perchLines'...)
  // (a piece of furniture may have one list for each cat: { shark: [...], orca: [...] })
  const mine = (lines, cat) => (lines && !Array.isArray(lines) ? lines[cat && cat.cfg ? cat.cfg.id : 'shark'] || lines.shark : lines);
  const said = (o, k, cat) => flat(o.type + '.' + k, mine(o.def[k], cat), cat);

  // nearest human within a few tiles gets to complain
  function scold(lines, cat) {
    if (!lines) return '';
    let best = null;
    let bd = 9;
    for (const h of humans) {
      if (h.away) continue;
      const d = Math.abs(h.tx - cat.tx) + Math.abs(h.ty - cat.ty);
      if (d < bd) {
        bd = d;
        best = h;
      }
    }
    if (!best || Math.random() < 0.25) return '';
    bubble(best, '!');
    return '\n' + best.name + ': ' + fmt(pick(lines), cat, best);
  }

  // ------------------------------------------------------- cat movement
  const curtainAt = (x, y) => world.curtains.has(x + ',' + y);

  function canEnter(fx, fy, tx, ty, dx, dy) {
    if (outside) {
      const n = strays.at(tx, ty);
      if (isRoad(ty) && (!mayCross() || traffic.blocked(tx - GOX, ty))) return false;
      // (the opening: he climbs onto nothing, a counter or a table no more than anything else)
      if (story.mode === 'story' && story.act === 0 && gardenPerch(tx - GOX, ty)) return false;
      return (!n || strays.tagging(n)) && !people.at(tx, ty) && !extraAt(tx, ty) && !dogs.at(tx, ty) && (!!gardenPerch(tx - GOX, ty) || !gardenBlocked(tx - GOX, ty));
    }
    // curtains: climb straight up onto one, shimmy sideways along them,
    // and only come off by dropping straight down
    if (curtainAt(tx, ty)) return dy === -1 || (dy === 0 && curtainAt(fx, fy));
    if (curtainAt(fx, fy) && dy !== 1) return false;
    if (!isFloor(at(tx, ty))) return false;
    const o = objAt(tx, ty);
    if (o) {
      const p = perchAt(tx, ty);
      if (!p) return false;
      const fp = perchAt(fx, fy);
      const sameObj = fp && fp.obj === p.obj;
      if (!sameObj && p.from !== undefined && !p.from.includes(sideOf(dx, dy))) return false;
    }
    if (humanAt(tx, ty) || extraAt(tx, ty)) return false;
    return true;
  }

  function startMove(cat, tx, ty, dur) {
    cat.fx = cat.tx;
    cat.fy = cat.ty;
    cat.tx = tx;
    cat.ty = ty;
    cat.dir = dirName(tx - cat.fx, ty - cat.fy);
    cat.z0 = heightAt(cat.fx, cat.fy);
    cat.z1 = heightAt(tx, ty);
    cat.hop = cat.z0 !== cat.z1 ? 5 + Math.abs(cat.z1 - cat.z0) * 0.4 : 0;
    cat.md = cat.hop ? Math.max(dur, 14) : dur;
    if (curtainAt(tx, ty) || curtainAt(cat.fx, cat.fy)) cat.md = Math.max(cat.md, 20);
    cat.mt = 0;
    cat.moving = true;
    cat.pose = 'stand';
    cat.idle = 0;
    if (cat.action && cat.action.type === 'nap') cat.action = null;
    if (cat.hop && cat === cats[leader]) sfx.jump();
    if (outside) {
      // pushing through a bush: it shakes and sheds a few leaves
      let any = false;
      for (const [x, y] of [[cat.fx, cat.fy], [tx, ty]]) {
        if (!isBush(x - GOX, y)) continue;
        any = true;
        rustles.set(x + ',' + y, 16);
        for (let i = 0; i < 2; i++)
          spawn('px', x * T + 3 + rnd(10), y * T + 4 + rnd(6), { vx: Math.random() - 0.5, vy: -Math.random() * 0.8 - 0.2, g: 0.06, life: 16 + rnd(10), color: pick(['#5c9a46', '#3f7a3a', '#84b257']) });
      }
      if (any && cat === cats[leader]) sfx.rustle();
    }
  }

  // strays do not set foot on the road until somebody has shown them how
  const mayCross = () => story.mode !== 'story' || !!story.flags.canCross;
  function onArrive(cat) {
    const isLeader = cat === cats[leader];
    // house cats, fed every day, get HP back as they walk about (see MEND); the first step they take
    // hurt after a fight brings up a TIP box that says so (not before: a box straight after a lost fight
    // would stop the run to the bush)
    if (isLeader && story.adopted && keepsHurt(story)) {
      mend(MEND.step);
      if (story.flags.mendTip === 'due' && !scene && !bolt && !dialog.active && pairKinds().some((k) => hurtOf(story, k) > 0)) {
        story.flags.mendTip = true;
        sfx.learn();
        dialog.open({ name: WORDS.notes.tip, kind: 'tip', text: WORDS.cats.mendTip });
      }
    }
    // a toy underfoot (not in a scene, and not while the story has the flat keeping quiet)
    const toy = !scene && !fade && !bolt && !gride && pickupAt(cat.tx, cat.ty);
    if (toy && toy.def.toy && (outside || !home.mute(null))) playWith(cat, toy, isLeader);
    if (outside) {
      if (isLeader && !isRoad(cat.ty)) roadSide = cat.ty < ROAD.top ? 'north' : 'south';
      // in through the lobby doors and back upstairs
      if (isLeader && isMat(cat.tx - GOX, cat.ty)) {
        if (story.adopted) {
          // (Act 3 may have a reason why not just now: the last night, when there is no going back up)
          if (!act3.object(cat, { type: 'amber' })) travel(false);
        } else if (frame - leftKibbleAt > 300) {
          leftKibbleAt = frame;
          say(WORDS.act1.lobby);
        }
      }
      // a pile of kibble somebody left: first come, first served
      const kib = isLeader && !bolt && people.kibbleAt(cat.tx - GOX, cat.ty);
      if (kib && kib.meat) {
        // a bit of somebody's dinner, dropped from a BBQ table: nobody says no to that
        people.eat(kib);
        mend(MEND.meat);
        act(cat, 'eat', 70, {});
        quests.ate(kib);
        say(fmt(pick(WORDS.energy.meat), cat));
      } else if (kib && story.adopted) {
        // house cats now: there is a full bowl upstairs, and this is somebody else's dinner
        if (frame - leftKibbleAt > 600) {
          leftKibbleAt = frame;
          act(cat, 'look', 30);
          say(fmt(pick(WORDS.energy.leave), cat));
        }
      } else if (kib && (() => {
        // a nameless stray already on its way to this food, and close: it won't give it up without a fight
        const rival = strays.list.find((n) => !n.named && !n.hidden && n.eating === kib && Math.abs(n.tx - cat.tx) + Math.abs(n.ty - cat.ty) <= 3);
        return rival && plateContest(kib, rival);
      })()) {
        // (the question is up: see plateContest)
      } else if (kib) {
        people.eat(kib);
        mend(kib.plate || kib.breakfast ? MEND.plate : MEND.pile);
        act(cat, 'eat', 70, {});
        quests.ate(kib);
        // (not in the opening: there the story says what the first plate means, and Orca isn't there yet)
        if (!(story.mode === 'story' && story.act === 0)) say(fmt(pick(['{c} crunches up the kibble. Not bad, for the garden.', '{c} eats the kibble before anyone else gets a look in. {o} gets a sniff of the crumbs.', "Free kibble! {c} doesn't ask where it came from."]), cat));
      }
      const gp = gardenPerch(cat.tx - GOX, cat.ty);
      if (isLeader && gp && gp.id !== cat.perchObj && frame - gardenSaidAt > 240) {
        gardenSaidAt = frame;
        say(fmt(pick(GARDEN_PERCH_LINES[gp.kind]), cat));
      }
      cat.perchObj = gp ? gp.id : null;
      return;
    }
    if (cat.hop && isLeader) sfx.land();
    const p = perchAt(cat.tx, cat.ty);
    const obj = p ? p.obj : null;
    if (isLeader && obj && obj !== cat.perchObj) {
      const def = obj.def;
      if (def.perchLines && frame - obj.saidAt > 900) {
        obj.saidAt = frame;
        say(fmt(pick(said(obj, 'perchLines', cat)), cat) + scold(said(obj, 'scold', cat), cat));
      }
    }
    cat.perchObj = obj;
    const hanging = curtainAt(cat.tx, cat.ty);
    if (hanging) cat.dir = 'up';
    if (isLeader && hanging && !cat.onCurtain && frame - curtainSaidAt > 600) {
      curtainSaidAt = frame;
      sfx.scratch();
      say(
        fmt(pick(['{c} climbs the curtain! Claws out, no regrets.', '{c} scales the curtain like a tiny mountaineer.']), cat) +
          scold(flat('curtain.scold', ['"{c}!! Get OFF the curtains!"', '"Not the curtains!!"'], cat), cat)
      );
    }
    if (isLeader && hanging && !cat.onCurtain) home.did('curtain', cat);
    cat.onCurtain = hanging;
    if (isLeader && p && p.key) {
      const typist = humans.find((h) => h.seated && Math.abs(h.tx - cat.tx) + Math.abs(h.ty - cat.ty) === 1);
      let line = fmt('{c} walks across the keyboard: asdfghjkl;;;;;', cat);
      if (typist) {
        bubble(typist, '!');
        line += '\n' + typist.name + ': ' + fmt(pick(flat('keyboard.scold', ['"{c}!! I was typing!"'], cat)), cat);
      }
      say(line);
      sfx.blip();
    }
  }

  function moveEntity(e) {
    e.mt++;
    const t = Math.min(1, e.mt / e.md);
    e.px = lerp(e.fx, e.tx, t) * T;
    e.py = lerp(e.fy, e.ty, t) * T;
    if (e.kind === 'cat') e.z = lerp(e.z0, e.z1, t) + Math.sin(Math.PI * t) * e.hop;
    if (e.mt >= e.md) {
      e.moving = false;
      e.steps++;
      if (e.kind === 'cat') {
        e.z = e.z1;
        onArrive(e);
      }
    }
  }

  function pushItem(it, dx, dy, cat) {
    const here = perchAt(it.x, it.y);
    const nx = it.x + dx;
    const ny = it.y + dy;
    const there = perchAt(nx, ny);
    if (here && there && there.obj === here.obj && !itemAt(nx, ny) && !catAt(nx, ny)) {
      it.slide = { dx, dy, t: 8 };
      it.x = nx;
      it.y = ny;
      sfx.blip();
      say(fmt('{c} nudges the ' + it.def.name + '. Closer to the edge...', cat));
      return;
    }
    const free = (x, y) => isFloor(at(x, y)) && !objAt(x, y);
    const cands = [[nx, ny], [nx + dx, ny + dy], [it.x + dy, it.y + dx], [it.x - dy, it.y - dx], [nx + dy, ny + dx], [nx - dy, ny - dx]];
    let land = cands.find(([x, y]) => free(x, y));
    // boxed in? it bounces to the nearest bit of open floor
    for (let r = 1; r <= 3 && !land; r++)
      for (let oy = -r; oy <= r && !land; oy++)
        for (let ox = -r; ox <= r && !land; ox++)
          if (Math.max(Math.abs(ox), Math.abs(oy)) === r && free(it.x + ox, it.y + oy) && !catAt(it.x + ox, it.y + oy))
            land = [it.x + ox, it.y + oy];
    if (!land) return;
    it.state = 'fallen';
    it.fall = { x: it.x * T + 3, y: it.y * T - (here ? here.h : 0) + 1, t: 0 };
    it.x = land[0];
    it.y = land[1];
    it.reset = it.temp ? Infinity : 60 * 40;
    stats.knocks++;
    home.did('knock', cat);
    const host = here ? here.obj.def.name : 'table';
    say(fmt('{c} pushes the ' + it.def.name + ' off the ' + host + '. Oops.', cat) + scold(flat('knock.scold', ['"{c}!! Not again!"', '"...Why are you like this, {c}?"'], cat), cat));
    bubble(cats[1 - cats.indexOf(cat)], '!');
  }

  function tryMove(d) {
    const L = cats[leader];
    const F = cats[1 - leader];
    const [dx, dy] = DIRS[d];
    L.dir = d;
    L.pose = 'stand';
    L.idle = 0;
    const tx = L.tx + dx;
    const ty = L.ty + dy;
    // (a cat who has not been shown how does not run: the opening, until The Orange is with him)
    const mayRun = !story.flags.noRun;
    const dur = input.isHeld('b') && mayRun ? CONFIG.runFrames : CONFIG.walkFrames;
    // (a door the story keeps shut for now; and in the opening, the edge of the pavers)
    if (!outside && home.blocks(tx, ty, L)) return;
    if (outside && quests.blocks(tx - GOX, ty, L)) return;
    if (F.tx === tx && F.ty === ty && !F.hidden) {
      // squeeze past each other
      const ox = L.tx;
      const oy = L.ty;
      startMove(L, tx, ty, dur);
      startMove(F, ox, oy, L.md);
      F.md = L.md = Math.max(F.md, L.md);
      return;
    }
    const plate = itemAt(tx, ty);
    if (plate && plate.def.food) {
      if (!bump.lock) {
        bump.lock = true;
        stealFood(L, plate);
      }
      return;
    }
    const po = objAt(tx, ty);
    if (po && po.def.pushable && !po.push && !curtainAt(L.tx, L.ty)) {
      const nx = tx + dx;
      const ny = ty + dy;
      if (freeFloor(nx, ny) && !catAt(nx, ny) && !humanAt(nx, ny) && !noPush.has(nx + ',' + ny)) {
        objGrid[po.y][po.x] = null;
        po.x = nx;
        po.y = ny;
        po.sortY = (ny + 1) * T;
        objGrid[ny][nx] = po;
        po.push = { dx, dy, t: dur, d: dur };
        po.dx = -dx * T;
        po.dy = -dy * T;
        sfx.scratch();
        if (frame - po.saidAt > 500) {
          po.saidAt = frame;
          say(fmt(pick(['{c} shoves the shopping bag along. Rustle rustle rustle.', "{c} bulldozes the bag across the floor. It's {c}'s bag now."]), L));
        }
      }
    }
    if (canEnter(L.tx, L.ty, tx, ty, dx, dy)) {
      const it = itemAt(tx, ty);
      if (it) pushItem(it, dx, dy, L);
      const ox = L.tx;
      const oy = L.ty;
      startMove(L, tx, ty, dur);
      if (F.tx !== ox || F.ty !== oy) {
        const bx = F.tx;
        const by = F.ty;
        startMove(F, ox, oy, L.md);
        // whoever is tagging along steps into the space Orca (or Shark) just left
        if (guest && outside) strays.trail(guest, bx, by, L.md);
      }
      bump.t = 0;
      bump.lock = false;
      bump.dir = d;
      return;
    }
    if (bump.dir !== d) {
      bump.dir = d;
      bump.t = 0;
      bump.lock = false;
    }
    bump.t++;
    if (bump.t >= 7 && !bump.lock) {
      bump.lock = true;
      interact(L, tx, ty, d, false);
    }
  }

  // ------------------------------------------------------- interactions
  function act(cat, type, dur, extra = {}) {
    cat.action = { type, t: 0, dur, ...extra };
    cat.idle = 0;
    cat.pose = 'stand';
  }

  function setTV(ch) {
    if (ch === tvObj.ch) return;
    if (nearLeader(tvObj.x, tvObj.y + 4, 16)) (ch ? sfx.tvOn : sfx.tvOff)();
    tvObj.ch = ch;
  }

  function meow(cat) {
    sfx.meow(cat.cfg.meow);
    bubble(cat, pick(['Meow!', 'Mrow?', 'Meow~', 'Mew!']), 50);
    act(cat, 'meow', 24);
  }

  function pet(cat, h) {
    h.pet = 90;
    if (!h.seated) h.dir = OPP[cat.dir];
    act(cat, 'purr', 90);
    sfx.purr();
    const busy = h.state === 'activity' && h.seated ? h.wp.act : '';
    bubble(h, busy === 'toilet' ? '!' : busy === 'sleep' ? '...' : '♥', 80);
    stats.pets++;
    home.did('pets', cat, h);
    let key = h.state === 'activity' && PET_LINES[h.wp.act] ? h.wp.act : 'walk';
    if (key === 'sleep' && !h.asleep) key = 'walk'; // just woken up
    say(hello(cat, h) || fmt(pick(flat('pets.' + key, PET_LINES[key], cat)), cat, h));
  }

  const ACTIONS = {
    scratch(cat, o) {
      act(cat, 'scratch', 66, { obj: o });
      stats.scratches++;
      say(fmt(pick(said(o, 'lines', cat)), cat) + scold(said(o, 'scold', cat), cat));
    },
    chew(cat, o) {
      act(cat, 'chew', 54, { obj: o });
      say(fmt(pick(said(o, 'lines', cat)), cat) + scold(said(o, 'scold', cat), cat));
    },
    eat(cat, o) {
      if (o.food && !o.portions) {
        sfx.meow(cat.cfg.meow);
        bubble(cat, 'Meow?!', 60);
        act(cat, 'look', 50);
        const lines = said(o, o === bowls && o.state === 'clean' ? 'cleanLines' : 'emptyLines', cat);
        return say(fmt(pick(lines), cat));
      }
      if (!o.food) {
        act(cat, 'eat', 84, { obj: o });
        return say(fmt(pick(said(o, 'lines', cat)), cat));
      }
      const what = o === bowls ? 'wet food' : 'kibble';
      if (o.portions === 2) {
        act(cat, 'eat', 84, { obj: o });
        return say(fmt(pick(said(o, 'lines', cat)), cat) + '\n' + fmt('Half the ' + what + ' is left. That one is for {o}.', cat));
      }
      // the second portion: fair share, or seconds?
      const greedy = o.eaters[0] === cat;
      act(cat, 'eat', 84, { obj: o, greedy });
      say(
        fmt(
          greedy
            ? pick(['{c} goes back for seconds. That was {o}\'s half!', '{c} looks around... and eats {o}\'s portion too.', 'Nobody saw that. {c} eats the other half.'])
            : pick(['{c} eats the other half. Fair\'s fair.', 'Both cats fed. Look at them, sharing like angels.', '{c} finishes the ' + what + '. One portion each, exactly as planned.']),
          cat
        )
      );
    },
    look(cat, o) {
      act(cat, 'look', 40);
      say(fmt(pick(said(o, 'lines', cat)), cat));
    },
    wobble(cat, o) {
      o.shake = 22;
      sfx.bump();
      act(cat, 'look', 30);
      say(fmt(pick(said(o, 'lines', cat)), cat));
    },
    sock(cat, o) {
      o.shake = 26;
      act(cat, 'scratch', 40, { obj: o, quiet: true });
      say(fmt(pick(said(o, 'lines', cat)), cat));
    },
    wardrobe(cat, o) {
      o.shake = 10;
      sfx.bump();
      act(cat, 'look', 36);
      say(fmt(pick(WARDROBE_LINES), cat));
    },
    toilet(cat, o) {
      const i = rnd(TOILET_LINES.length);
      act(cat, 'look', 40);
      if (i === 1) {
        const [x, y] = centre(cat);
        for (let n = 0; n < 12; n++)
          spawn('px', x, y, { vx: Math.random() * 2 - 1, vy: -Math.random() * 1.5, g: 0.06, life: 40 + rnd(20), color: C.white });
        sfx.scratch();
      }
      say(fmt(TOILET_LINES[i], cat));
    },
    washer(cat, o) {
      o.spin = 240;
      sfx.whirr(1.2);
      act(cat, 'look', 70);
      say(fmt('{c} watches the laundry spin. Round and round and round...', cat));
    },
    // The cat tunnel. Into one end (walking along its length) and out of the other: the cat is out of
    // sight while it is inside, and the other one follows it through. From the side it only crackles.
    tunnel(cat, o, dir) {
      const [dx] = DIRS[dir];
      const y = o.y;
      const east = dx > 0;
      const mouth = east ? o.x - 1 : o.x + o.w; // the tile in front of the end being walked into
      if (!dx || cat.tx !== mouth || cat.ty !== y) {
        o.shake = 14;
        sfx.rustle();
        act(cat, 'look', 30);
        return say(fmt(pick(o.def.sideLines), cat));
      }
      // out at the far end: the first one through lands a tile further on, to leave room for the second
      const out = east ? [o.x + o.w, o.x + o.w + 1] : [o.x - 1, o.x - 2];
      if (!out.every((x) => freeFloor(x, y) && !humanAt(x, y))) {
        o.shake = 8;
        sfx.rustle();
        return say(fmt(o.def.blockedLine, cat));
      }
      const other = cats[1 - cats.indexOf(cat)];
      const inX = (east ? o.x : o.x + o.w) * T - 8; // half way into the near mouth
      const outX = (east ? o.x + o.w : o.x) * T - 8; // ...and half way out of the far one
      const py = y * T;
      const run = (c, endX, delay) => {
        const first = c === cat;
        const rustle = () => {
          o.shake = 8;
          if (first) sfx.rustle();
        };
        return {
          cat: c, delay, end: [endX, y], face: dir,
          steps: [
            [mouth * T, py, 0, first ? 1 : 12, dir],
            [inX, py, 0, 5, dir, null, () => first && sfx.jump()],
            [lerp(inX, outX, 0.34), py, 0, 9, dir, null, () => { c.hidden = true; rustle(); }],
            [lerp(inX, outX, 0.67), py, 0, 9, dir, null, rustle],
            [outX, py, 0, 9, dir, null, rustle],
            // out with a hop
            [lerp(outX, endX * T, 0.6), py, 5, 5, dir, null, () => {
              c.hidden = false;
              burst(c.px + 8, c.py + 8, '#efe2c2', 5);
              if (first && onDid) onDid('tunnel', c);
            }],
            [endX * T, py, 0, 4, dir],
          ],
        };
      };
      // (a cat that is not in the scene yet does not follow)
      const parts = [run(cat, out[1], 0)];
      if (!other.ghost && !other.hidden && !other.riding) parts.push(run(other, out[0], 20));
      startRide(parts, fmt(pick(o.def.lines), cat));
    },
    tv(cat, o) {
      setTV((o.ch + 1) % 5);
      act(cat, 'look', 36);
      say(
        fmt(
          [
            '{c} sits on the remote. TV off.',
            '{c} steps on the remote. The TV comes on: birds. He watches every one of them.',
            '{c} paws the remote. An aquarium channel. Fish, everywhere. He watches them all.',
            '{c} flops on the remote. Soccer! {c} tracks the ball. Left. Right. Left.',
            '{c} rolls over the remote. A singing show! Somebody on a stage is holding a very long note.',
          ][o.ch],
          cat
        )
      );
    },
    complain(cat, o) {
      sfx.meow(cat.cfg.meow);
      bubble(cat, 'MEOW!', 60);
      act(cat, 'look', 50);
      say(fmt(pick(said(o, 'lines', cat)), cat));
    },
    litter(cat, o) {
      act(cat, 'litter', 150, { obj: o });
      say(fmt('{c} hops into the Litter-Robot, and gives everybody a look.', cat));
    },
    vacuum(cat, o) {
      // until it has been beaten it is nobody's ride: it fights
      if (!story.flags.robotBeaten && host.startBattle) return startFight(ENCOUNTERS.robot(), { robot: true });
      const L = cat;
      const home = [L.tx, L.ty];
      startMove(L, o.x, o.y, 14);
      L.z1 = 4;
      L.hop = 7;
      // a different route every time, never the same one twice in a row
      const opts = VACUUM_ROUTES.filter((rt) => rt !== lastRoute);
      lastRoute = pick(opts);
      L.riding = { obj: o, i: 0, t: 0, home, phase: 'mount', route: lastRoute };
      sfx.beep();
      bubble(cats[1 - cats.indexOf(cat)], '!');
      say(fmt('{c} climbs onto the robot vacuum, and rides it for a bit.', cat));
    },
  };

  // ----------------------------------------------- downstairs playground
  // A "ride" moves cats along a list of steps [px, py, z, frames, dir, pose]
  // (pixels, with z the height off the ground), then drops them on a tile.
  function startRide(parts, line) {
    gride = { t: 0, parts };
    for (const p of parts) {
      const c = p.cat;
      Object.assign(c, { moving: false, action: null, pose: 'stand', idle: 0, front: 60 });
      p.from = [c.px, c.py, c.z || 0];
    }
    if (line) say(line);
  }
  function updateRide2() {
    gride.t++;
    let busy = false;
    for (const p of gride.parts) {
      const c = p.cat;
      let t = gride.t - (p.delay || 0);
      if (t < 0) {
        busy = true;
        continue;
      }
      let prev = p.from;
      let done = true;
      for (const st of p.steps) {
        if (t < st[3]) {
          const k = t / st[3];
          c.px = lerp(prev[0], st[0], k);
          c.py = lerp(prev[1], st[1], k);
          c.z = lerp(prev[2], st[2], k);
          if (st[4]) c.dir = st[4];
          c.pose = st[5] || 'stand';
          c.gwalk = !st[5] && (st[0] !== prev[0] || st[1] !== prev[1] || st[2] !== prev[2]);
          if (t === 0 && st[6]) st[6]();
          done = false;
          break;
        }
        t -= st[3];
        prev = st;
      }
      if (!done) {
        busy = true;
        continue;
      }
      if (!p.landed) {
        p.landed = true;
        if (gride.stay) continue; // (up a tree: they stay where the climb left them)
        const [x, y] = p.end;
        placeCat(c, x, y, p.face || c.dir);
        c.front = 0;
        c.gwalk = false;
        if (c === cats[leader]) sfx.land();
      }
    }
    if (!busy) {
      const then = gride.then;
      gride = null;
      bump.lock = true;
      if (then) then();
    }
  }
  const gfree = (x, y) => !gardenBlocked(x, y);

  // ---- up a tree: both of them, the follower after the leader, and there they stay until the player
  // walks or presses something. (Up a tree a cat is hidden from the dogs, which cannot climb: see dogs.js.)
  // Where the two sit, in garden tiles (parts of a tile are fine), the leader's seat first. The garden says
  // so itself (`seats` on the tree it hands back: pixels east of the trunk's tile, pixels up); otherwise the
  // top of the trunk and a branch beside it.
  const treeSeats = (th) => (th.seats ? th.seats.map(([dx, up]) => [th.x + dx / T, th.y - up / T]) : [[th.x, th.y - 1.875], [th.x + 0.625, th.y - 1.125], [th.x - 0.75, th.y - 1.25]]);
  const TREE_LINES = {
    up: ['{c} digs in the claws and scrambles up the tree! {o} goes up after him.', '{c} goes straight up the trunk, and {o} right behind. Bark everywhere.'],
    upAlone: ['{c} digs in the claws and scrambles up the tree!', '{c} goes straight up the trunk. Bark everywhere.'],
    top: [
      'The view from up here! {c} can see the whole garden. {o} has a branch of his own. Walk to climb down.',
      '{c} sits in the tree and looks down at everybody. {o} sits one branch down. Walk to climb down.',
      'Up in the branches. A bird was here recently. {c} and {o} can smell it. Walk to climb down.',
    ],
    topAlone: ['The view from up here! {c} can see the whole garden. Walk to climb down.', '{c} sits in the tree and looks down at everybody. Walk to climb down.'],
  };
  function climbTree(cat, other, th) {
    const seats = treeSeats(th);
    const px = (GOX + th.x) * T;
    const py = th.y * T;
    const up = (c, i) => {
      const sx = (GOX + seats[i][0]) * T;
      const z = (th.y - seats[i][1]) * T;
      return {
        cat: c, delay: i * 16, home: [c.tx, c.ty], end: [c.tx, c.ty], face: 'down',
        steps: [[px, py, 4, i ? 10 : 8, 'up', null, () => i && sfx.scratch()], [sx, py, z, i ? 20 : 24, 'up'], [sx, py, z, 2, 'down', 'sit']],
      };
    };
    const alone = !!other.ghost;
    const parts = alone ? [up(cat, 0)] : [up(cat, 0), up(other, 1)];
    sfx.scratch();
    startRide(parts, fmt(pick(alone ? TREE_LINES.upAlone : TREE_LINES.up), cat));
    gride.stay = true;
    // a friend who is with them goes up last, onto a bough of their own, and sits there for as long as they do
    const friend = guest && !guest.hidden && !guest.ride && strays.tagging(guest) && seats[2] ? { n: guest, home: [guest.tx - GOX, guest.ty] } : null;
    if (friend) {
      const sx = (GOX + seats[2][0]) * T;
      const z = (th.y - seats[2][1]) * T;
      const n = friend.n;
      Object.assign(n, { moving: false, px: n.tx * T, py: n.ty * T });
      strays.ride(n, [[n.px, n.py, 0, 34, null], [px, py, 4, 10, 'up'], [sx, py, z, 20, 'up'], [sx, py, z, 1e9, 'down', 'sit']], friend.home, 'down');
    }
    gride.then = () => {
      treed = { x: th.x, y: th.y, t: 0, held: true, friend, parts: parts.map((q) => ({ cat: q.cat, home: q.home })) };
      say(fmt(pick(alone ? TREE_LINES.topAlone : TREE_LINES.top), cat));
      discover('tree'); // (the first tree is worth something)
    };
  }
  function treeHold() {
    const t = treed;
    t.t++;
    for (const q of t.parts) Object.assign(q.cat, { idle: 0, pose: 'sit' });
    input.take('swap');
    swapWant = false;
    const a = input.take('a');
    const z = input.take('meow');
    // (the direction that walked them into the trunk has to be let go first)
    if (!input.dir()) t.held = false;
    if (t.t >= 20 && (a || z || (input.dir() && !t.held))) climbDown();
  }
  function climbDown() {
    const t = treed;
    const px = (GOX + t.x) * T;
    const py = t.y * T;
    treed = null;
    sfx.scratch();
    if (t.friend && t.friend.n.ride) {
      const [hx, hy] = t.friend.home;
      strays.ride(t.friend.n, [[px, py, 4, 22, 'up'], [(GOX + hx) * T, hy * T, 0, 8, 'down']], t.friend.home, 'down');
    }
    // the lower one first
    startRide(t.parts.map((q, i) => ({
      cat: q.cat, delay: i ? 0 : 10, end: q.home, face: 'down',
      steps: [[px, py, 4, 18, 'up'], [q.home[0] * T, q.home[1] * T, 0, 8, 'down']],
    })));
  }
  // down at once, wherever they were (something else has hold of them: a scene, a fright)
  function leaveTree() {
    if (!treed) return;
    for (const q of treed.parts) {
      placeCat(q.cat, q.home[0], q.home[1], 'down');
      q.cat.front = 0;
      q.cat.gwalk = false;
    }
    if (treed.friend && treed.friend.n.ride) strays.place(treed.friend.n, treed.friend.home[0], treed.friend.home[1]);
    treed = null;
  }
  // Beaten by dogs: the pair run for the nearest bush, with nothing left in them
  let carriedUp = false; // beaten by dogs with nothing left in them: they come round upstairs
  function dogsLost() {
    const L = cats[leader];
    // Beaten again, having gone into it already badly hurt: no bush this time. They get themselves to
    // Amber's doors and up the stairs, where there is a bowl (and they mend as they walk, in any case).
    if (story.mode === 'story' && story.adopted && fightLow) {
      carriedUp = true;
      bolt = null;
      travel(false);
      act3.lost('dogs');
      return;
    }
    const bush = (x, y) => isBush(x - GOX, y);
    // (the middle of a bush if there is one, so that there is room for whoever comes behind)
    const deep = (x, y) => bush(x, y) && ((bush(x - 1, y) && bush(x + 1, y)) || (bush(x, y - 1) && bush(x, y + 1)));
    startBolt(L.tx, L.ty, { steps: 30, to: deep });
    if (!bolt) startBolt(L.tx, L.ty, { steps: 30, to: bush });
    say(fmt(bolt ? DOG_WORDS.lost : DOG_WORDS.lostNoBush, L));
    if (!bolt) startBolt(L.tx, L.ty, { steps: 8 });
    act3.lost('dogs');
  }

  // Shooed! The cats run a few tiles away from (tx, ty) before they can be
  // steered again. opts.steps: how far (5 unless said). opts.side: get off the
  // road, and on that side of it ('north' | 'south') if it can be reached.
  // opts.to(x, y): run to the nearest tile that passes it instead (and not by way of the road).
  function startBolt(tx, ty, opts = {}) {
    leaveTree();
    const steps = opts.steps || 5;
    const L = cats[leader];
    const free = (x, y) => !gardenBlocked(x - GOX, y) && !strays.at(x, y) && !people.at(x, y) && !dogs.at(x, y) && !(opts.to && isRoad(y));
    const seen = new Map([[L.tx + ',' + L.ty, null]]);
    const q = [[L.tx, L.ty, 0]];
    let best = null;
    let far = -1;
    for (let i = 0; i < q.length; i++) {
      const [x, y, d] = q[i];
      let away = Math.abs(x - tx) + Math.abs(y - ty) + d * 0.01;
      if (opts.side) away += isRoad(y) ? -40 : (y < ROAD.top) === (opts.side === 'north') ? 40 : 0;
      if (opts.to) away = opts.to(x, y) ? 1e6 - d : -1;
      if (d > 0 && away > far) {
        far = away;
        best = [x, y];
      }
      if (d >= steps) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = x + dx + ',' + (y + dy);
        if (seen.has(k) || !free(x + dx, y + dy)) continue;
        seen.set(k, [x, y]);
        q.push([x + dx, y + dy, d + 1]);
      }
    }
    if (!best) return;
    const path = [];
    for (let p = best; p && seen.get(p[0] + ',' + p[1]); p = seen.get(p[0] + ',' + p[1])) path.unshift(p);
    for (const c of cats) {
      c.action = null;
      if (carried(c)) putDown(c, 'forced');
    }
    bolt = path;
  }

  function gardenInteract(cat, gx, gy, dir, viaButton) {
    // one of the garden's cats: the same whether walked into or asked with Do
    if (roadEnd(gx, gy)) return dialog.open({ text: WORDS.road.end });
    if (isRoad(gy) && !mayCross()) return dialog.open({ text: WORDS.road.notYet });
    const ex = extraAt(GOX + gx, gy);
    if (ex) return act3.bump(cat, ex) || quests.bump(cat, ex);
    const cat2 = strays.at(GOX + gx, gy);
    // (the garden story's own talks are Act 1's: in Act 3 they would get in the way of asking a friend along)
    if (cat2) return act3.talk(cat, cat2) || (!act3.on() && quests.talk(cat, cat2)) || strayTalk(cat, cat2);
    if (people.interact(cat, GOX + gx, gy)) return;
    // (the opening: nothing in the garden answers him yet, and he climbs onto nothing. As on Act 2's first night.)
    if (story.mode === 'story' && story.act === 0) return void (!viaButton && sfx.bump());
    const th = gardenThing(gx, gy);
    // (the last night: nothing in the garden is climbed or remarked on but what the story has put in the way)
    if (story.flags.noThings && !(th && (th.kind === 'barrier' || th.kind === 'garnet' || (th.kind === 'cage' && th.dog)))) return void (!viaButton && sfx.bump());
    const other = cats[1 - cats.indexOf(cat)];
    // nobody lands on another cat
    const inTheWay = (x, y) => {
      const n = strays.at(GOX + x, y);
      if (n) say(fmt(n.name + ' is sitting right where {c} would land. Rude.', cat));
      return !!n;
    };
    if (!th) {
      if (!viaButton) sfx.bump();
      return;
    }
    const X = (x) => (GOX + x) * T;
    if (th.kind === 'slide') {
      if (inTheWay(SLIDE.x + 8, SLIDE.y) || inTheWay(SLIDE.x + 7, SLIDE.y)) return;
      const y = SLIDE.y * T;
      const run = (c, endX, delay) => ({
        cat: c, delay, end: [GOX + endX, SLIDE.y], face: 'right',
        steps: [
          [X(SLIDE.x), y, 0, 10, 'right'],
          [X(SLIDE.x), y, 24, 16, 'up', null, () => c === cat && sfx.jump()],
          [X(SLIDE.x + 1) + 4, y, 27, 8, 'right'],
          [X(SLIDE.x + 5) + 8, y, 8, 18, 'right', 'sit', () => c === cat && sfx.whirr(0.35)],
          [X(endX), y, 0, 8, 'right', 'sit'],
        ],
      });
      // the leader lands furthest out, the other one right behind
      return startRide([run(cat, SLIDE.x + 8, 0), run(other, SLIDE.x + 7, 16)], fmt(pick(['{c} climbs the ladder... and WHEEEEE! {o} goes right after.', 'Up the ladder, down the chute. {c} and {o} still have it.']), cat));
    }
    if (th.kind === 'bars') {
      const y = BARS.y * T;
      const d = th.dir;
      const face = d > 0 ? 'right' : 'left';
      // off the far end: the leader two tiles out, the other one next to the ladder
      let endL = th.to + 2 * d;
      const endF = th.to + d;
      if (!gfree(endL, BARS.y)) endL = endF;
      if (inTheWay(endL, BARS.y) || inTheWay(endF, BARS.y)) return;
      const run = (c, endX, delay) => ({
        cat: c, delay, end: [GOX + endX, BARS.y], face,
        steps: [
          [X(th.from), y, 0, 8, face],
          [X(th.from), y, 26, 14, 'up', null, () => c === cat && sfx.jump()],
          [X(th.to), y, 26, 44, face],
          [X(endX), y, 0, 12, face],
        ],
      });
      const parts = [run(cat, endL, 0)];
      if (endL !== endF && gfree(endF, BARS.y)) parts.push(run(other, endF, 18));
      return startRide(parts, fmt(pick(['{c} scales the ladder and tightropes across the monkey bars. {o} follows, less gracefully.', 'Along the top of the monkey bars, tail up. The kids hang underneath. Amateurs.']), cat));
    }
    if (th.kind === 'tree') return climbTree(cat, other, th);
    if (th.kind === 'net') {
      const home = [cat.tx, cat.ty];
      const px = NET.cx - 8 + GOX * T;
      const py = NET.mast[0][1] * T;
      other.pose = 'sit';
      bubble(other, '!', 50);
      sfx.scratch();
      return startRide(
        [{
          cat, end: home, face: 'down',
          steps: [
            [px, py, 4, 8, 'up'],
            [px, py, 42, 34, 'up'],
            [px, py, 42, 110, 'down', 'sit', () => say(fmt(pick(['{c} reaches the top of the net, and looks down at the whole playground.', '{c} clings to the top of the mast and surveys the playground.']), cat))],
            [px, py, 4, 24, 'up', null, () => sfx.scratch()],
            [home[0] * T, home[1] * T, 0, 8, 'down'],
          ],
        }],
        fmt(pick(['{c} climbs the rope net, paw over paw.', '{c} swarms up the climbing net like a furry pirate.']), cat)
      );
    }
    if (th.kind === 'barrier') {
      // (the story has its own words for it the first time: Act 3)
      if (act3.object(cat, { type: 'barrier' })) return;
      act(cat, 'look', 50);
      if (!viaButton) sfx.bump();
      return say(fmt(WORDS.garden.barrier, cat));
    }
    if (th.kind === 'cage') {
      act(cat, 'look', 40);
      if (!viaButton) sfx.bump();
      return say(fmt(pick(th.dog ? WORDS.garden.cageDog : WORDS.garden.cage), cat));
    }
    if (th.kind === 'garnet') {
      if (act3.object(cat, { type: 'garnet' })) return;
      act(cat, 'look', 50);
      if (!viaButton) sfx.bump();
      // (strays have no home yet: Amber is not theirs until they are carried in)
      if (story.mode === 'story' && !story.adopted) return say(WORDS.act1.garnetLobby);
      return say(fmt(pick([
        '{c} sniffs at the Garnet lobby doors. Wrong building. Home smells different.',
        "{c} peers through the glass. Nice lobby. Not {c}'s lobby. Home is Amber, across the way.",
        "The Garnet doors stay shut. {c} doesn't live here, and the doors seem to know it.",
      ]), cat));
    }
    if (th.kind === 'sink') {
      act(cat, 'look', 50);
      sfx.blip();
      for (let i = 0; i < 5; i++)
        spawn('px', (GOX + th.x) * T + 8, th.y * T - 2, { vx: Math.random() * 0.6 - 0.3, vy: 0.2, g: 0.07, life: 16 + i * 5, color: C.skyL });
      say(fmt(pick(SINK_LINES), cat));
      return void discover('sink');
    }
  }

  function interact(cat, x, y, dir, viaButton) {
    if (outside) return gardenInteract(cat, x - GOX, y, dir, viaButton);
    // one of the story's own people or animals, indoors: the story answers, as it does in the garden
    const ex = extraAt(x, y);
    if (ex) return act3.bump(cat, ex) || quests.bump(cat, ex);
    if (flatAt(x, y) !== 'home') return flatInteract(cat, x, y, dir, viaButton);
    const o = objAt(x, y);
    // (the first night and the first morning of Act 2: only what the goal is about answers)
    if (home.mute(o)) return void (!viaButton && sfx.bump());
    const h = humanAt(x, y);
    if (h) return pet(cat, h);
    if (o) {
      // (Act 2 may have something of its own to do with the robot vacuum, the TV...)
      if (home.bump(cat, o) || act3.object(cat, o)) return;
      if (o.def.bump) {
        ACTIONS[o.def.bump](cat, o, dir, viaButton);
        home.used(o, cat);
        return;
      }
      if (!viaButton) sfx.bump();
      return;
    }
    const ch = at(x, y);
    if (ch === 'D') {
      if (home.door(cat) || act3.door(cat, 'home')) return;
      return travel(true);
    }
    // a window, the balcony glass or its railing: in Act 2 the garden is down there
    const looksOut = ch === 'R' || ch === 'G' || (ch === '#' && ((dir === 'right' && world.sideWindows.has(x + ',' + y)) || (dir === 'up' && world.windows.has(x + ',' + y))));
    const view = looksOut ? home.window(cat) : null;
    if (view) {
      act(cat, 'look', 60);
      return say(fmt(view, cat));
    }
    if (ch === 'R') {
      act(cat, 'look', 80);
      if (isDark()) {
        sfx.meow(cat.cfg.meow * 0.8);
        return say(fmt(pick(flat('stray', STRAY_LINES, cat)), cat));
      }
      sfx.chirp();
      spawn('bird', x * T - 10, y * T + 20, { vx: 0.9, vy: -0.7, life: 90 });
      return say(fmt('A bird! {c} goes ek-ek-ek-ek-ek.', cat));
    }
    if (ch === 'G') {
      act(cat, 'look', 40);
      return say(
        fmt(
          isDark()
            ? pick(['{c} presses a nose to the cold balcony glass, and leaves a print.', "{c} sees his own reflection in the dark glass. Who's that handsome cat?"])
            : '{c} presses a nose to the balcony glass, and leaves a print.',
          cat
        )
      );
    }
    if (ch === '#' && dir === 'right' && world.headboards.has(x - 1 + ',' + y)) {
      act(cat, 'scratch', 66, {});
      stats.scratches++;
      return say(
        fmt(pick(['{c} scratches the green headboard. Same fabric as the sofa. Just as good.', 'Scritch scritch... the headboard has joined the list.']), cat) +
          scold(flat('headboard.scold', ['"{c}! Not the headboard too!"'], cat), cat)
      );
    }
    if (ch === '#' && dir === 'right' && world.sideWindows.has(x + ',' + y)) {
      act(cat, 'look', 60);
      return say(
        fmt(
          pick(
            isDark()
              ? ['{c} looks out of the laundry window. Just the dark and a few lit windows across the street.', '{c} watches a moth bump against the laundry window. Tempting.']
              : ['{c} looks out of the laundry window. A pigeon looks back.', '{c} watches the clouds go by from the laundry window.']
          ),
          cat
        )
      );
    }
    if (ch === '#' && dir === 'up' && world.windows.has(x + ',' + y)) {
      act(cat, 'look', 60);
      const hr = hourNow();
      const lines = isDark()
        ? ['{c} gazes out at the city lights. So many windows, so many other cats.', '{c} watches the night from the window. Something moved down there. Probably.']
        : hr >= 17 && hr < 19
          ? ['{c} watches the sunset from the window. Orange, like Orca.', '{c} watches the sky turn pink. The birds are going home.']
          : ['{c} watches the world from the window, and counts birds.', '{c} sits by the window and chatters at a bird. Ek-ek-ek.'];
      return say(fmt(pick(lines), cat));
    }
    if (!viaButton) sfx.bump();
  }

  // Something walked into (or asked with Do) in a flat that is not home: the story first, if it
  // has said it wants to answer (flatHooks), and otherwise what two cats would make of the place.
  function flatInteract(cat, x, y, dir, viaButton) {
    const hook = flatHooks[flatAt(x, y)] || {};
    const words = (key, frames = 60) => {
      act(cat, 'look', frames);
      say(fmt(pick(mine(SCARF_WORDS[key], cat)), cat));
    };
    const o = objAt(x, y);
    if (o) {
      if (hook.bump && hook.bump(cat, o)) return;
      if (o.def.bump) return ACTIONS[o.def.bump](cat, o, dir, viaButton);
      if (!viaButton) sfx.bump();
      return;
    }
    const ch = at(x, y);
    if (ch === 'D') return hook.door && hook.door(cat) ? undefined : words('door', 40);
    if (hook.tile && hook.tile(cat, ch, x, y)) return;
    if (ch === 'R') return words(x === DECOR.scarf[0] && y === DECOR.scarf[1] ? 'scarf' : 'rail');
    if (ch === 'G') return words('glass');
    if (ch === '#' && dir === 'up' && world.windows.has(x + ',' + y)) return words('window');
    if (ch === '#' && dir === 'left' && world.sideWindows.has(x + ',' + y)) return words('sideWindow');
    if (!viaButton) sfx.bump();
  }
  // The pair, onto a tile of another flat, at a stroke (see toFlat in homeApi).
  function enterFlat(id, spot, dir = 'down') {
    if (!FLATS[id]) throw new Error('no such flat: ' + id);
    const L = cats[leader];
    const F = cats[1 - leader];
    const two = !!spot && Array.isArray(spot[0]);
    const a = two ? spot[0] : spot || SCARF.arrive[0];
    if (outside) {
      // (as coming in by the front door does: nobody tags along, and the garden's people go home)
      if (guest) sendHome(guest, null);
      people.clear();
      bolt = null;
      outside = false;
    }
    gride = null;
    bump.t = 0;
    bump.lock = true;
    captionQueue.length = 0;
    placeCat(L, a[0], a[1], dir);
    const b = two ? spot[1] : !spot ? SCARF.arrive[1] : neighbours(a[0], a[1]).find(([x, y]) => freeFloor(x, y) && !extraAt(x, y) && !humanAt(x, y)) || a;
    placeCat(F, b[0], b[1], dir);
    room = roomAt(L.tx, L.ty);
    banner = null;
    updateCamera(true);
  }

  // ------------------------------------------------- upstairs / downstairs
  // The front door leads down to the garden and the building's lobby doors lead
  // back up. The screen fades to black and the cats swap places at the darkest
  // moment; the apartment carries on without them while they are out.
  function travel(down) {
    if (fade) return;
    fade = { t: 0, down };
    sfx.door();
    if (down && !garden) garden = buildGarden();
  }
  function placeCat(c, x, y, dir) {
    Object.assign(c, {
      tx: x, ty: y, fx: x, fy: y, px: x * T, py: y * T, z: 0, z0: 0, z1: 0, hop: 0, dir,
      moving: false, action: null, pose: 'stand', idle: 0, perchObj: null, onCurtain: false, riding: null, hidden: false,
    });
    c.z = c.z1 = heightAt(x, y);
  }
  function changeFloor(down) {
    gride = null;
    leaveTree();
    const L = cats[leader];
    const F = cats[1 - leader];
    bump.t = 0;
    bump.lock = true;
    captionQueue.length = 0;
    if (down) {
      outside = true;
      beenOut = true;
      placeCat(L, GOX + GARDEN_START[0][0], GARDEN_START[0][1], 'up');
      placeCat(F, GOX + GARDEN_START[1][0], GARDEN_START[1][1], 'up');
      // no box on the doorstep: the first one comes up on reaching a named part of the garden
      room = '';
      banner = null;
      // (not when the story has a scene of its own waiting on the doorstep: Act 3's first night, and its last)
      const staged = story.mode === 'story' && story.act === 3 && story.quest && ['open', 'call'].includes(story.quest.act3);
      if (!staged) showCaption(
        fmt(
          !gardenSeen
            ? 'Downstairs! The riverside garden, where {c} and {o} lived before they had a sofa to ruin.'
            : isDark()
              ? pick(['The garden at night. Crickets, river smell, and the lobby lights behind you.', '{c} and {o} slip out into the dark garden.'])
              : pick(['Back in the old garden. It smells like grass, river and barbecue.', '{c} and {o} trot out of the lobby, into the garden.']),
          L
        )
      );
      gardenSeen = true;
      strays.newVisit();
      people.newVisit();
      traffic.fill();
      roadSide = 'south';
      act3.restore();
    } else {
      const left = guest;
      if (guest) sendHome(guest, null);
      people.clear();
      bolt = null;
      outside = false;
      if (left) captionQueue.push(WORDS.party.door.replaceAll('{n}', left.name));
      // just inside the front door, wherever there is room
      const [dx, dy] = DOOR_SPOTS[0];
      const spots = [...DOOR_SPOTS, [dx, dy - 1], [dx + 1, dy - 1], [dx - 1, dy], [dx + 2, dy], [dx - 1, dy - 1], [dx + 2, dy - 1], [dx, dy - 2], [dx + 1, dy - 2]]
        .filter(([x, y]) => freeFloor(x, y) && !humanAt(x, y));
      const a = spots[0] || DOOR_SPOTS[0];
      const b = spots[1] || a;
      placeCat(L, a[0], a[1], 'up');
      placeCat(F, b[0], b[1], 'up');
      room = roomAt(L.tx, L.ty);
      banner = { text: room, t: 150 };
      if (carriedUp) {
        carriedUp = false;
        // (there is always something to eat: nobody is sent back down hungry)
        if (!feeder.portions) setFeeder(2);
        showCaption(fmt(WORDS.lost.dogsHome, L));
      } else showCaption(fmt(pick(['Back upstairs. {c} and {o} stroll in as if nothing happened.', 'Home again. Paws wiped on the mat? No.']), L));
    }
    updateCamera(true);
    autosave();
  }

  // ------------------------------------------------------------ health
  // HP is kept from one fight to the next (see MEND in story.js). story.hurt holds what each of the pair
  // has lost; full HP is whatever the ladder (and what they have found and earned) makes it, so a gain
  // raises what they have now as well.
  const fullHp = (kind) => rungOf(story)[kind].hp;
  const pairKinds = () => (story.flags.solo ? ['shark'] : ['shark', 'orca']);
  function setHurt(kind, n) {
    if (!story.hurt) story.hurt = { shark: 0, orca: 0 };
    story.hurt[kind] = Math.max(0, Math.min(fullHp(kind), n));
  }
  // mend both of them by a share of full HP (1: all of it)
  function mend(share) {
    for (const k of ['shark', 'orca']) setHurt(k, hurtOf(story, k) - share * fullHp(k));
  }
  const hpShare = (kind) => 1 - hurtOf(story, kind) / fullHp(kind);
  const lowestShare = () => Math.min(...pairKinds().map(hpShare));
  function wakeUp() {
    for (const c of cats) if (c.action && c.action.type === 'nap') c.action = null;
  }
  // A nap, anywhere. It mends a little (see MEND), and after a moment the clock runs fast until
  // something wakes them.
  function startNap() {
    const L = cats[leader];
    if (!outside && home.nap(L)) return;
    act(L, 'nap', 0);
    act(cats[1 - leader], 'nap', 0);
    nap = { t: 0, gained: 0 };
    const set = outside ? WORDS.nap.garden : perchAt(L.tx, L.ty) ? WORDS.nap.perch : inSunbeam(L.tx, L.ty) ? WORDS.nap.sun : WORDS.nap.start;
    say(fmt(pick(set === WORDS.nap.perch ? flat('nap.perch', set, L) : set), L));
    autosave();
  }

  // A fight for food. Some cats out here will fight you for a plate (Scar says so on the first night):
  // before the adoption, when one of the garden's nameless strays reaches a plate or a pile of kibble
  // at the moment the pair do, it stands its ground, and the player chooses: fight for it, or let it
  // eat. Won, the stray runs off and the pair eat; lost, it eats and they come round sore (see
  // afterFight). The first time, a tip says what is at stake.
  function plateContest(k, n) {
    const L = cats[leader];
    if (story.mode !== 'story' || story.act !== 1 || story.adopted || !keepsHurt(story) || n.named || !outside) return false;
    if (scene || dialog.active || fade || bolt || Math.abs(L.tx - GOX - k.x) + Math.abs(L.ty - k.y) > 2) return false;
    const P = WORDS.plate;
    const what = (n.def && n.def.what) || 'cat';
    const fill = (t) => fmt(t.replaceAll('{n}', what), L);
    n.path = [];
    n.then = null;
    n.eating = null;
    n.pause = 400; // (it stands its ground until the question is answered)
    bubble(n, '!', 60);
    for (const c of cats) c.dir = k.x + GOX < c.tx ? 'left' : k.x + GOX > c.tx ? 'right' : k.y < c.ty ? 'up' : 'down';
    const ask = () => dialog.open({
      name: '', text: fill(P.ask), choices: [P.fight, P.leave],
      then: (i) => {
        if (i === 0) {
          return playScene('plate-fight', [
            { say: ['orca', P.mine] },
            { battle: ENCOUNTERS.plateFight(what, fill, story.stage), then: (result) => {
              if (result === 'won') {
                strays.runOff(n, k.x, k.y);
                people.eat(k);
                mend(k.plate ? MEND.plate : MEND.pile);
                act(L, 'eat', 70, {});
                say(fill(P.ate));
              } else {
                people.eat(k);
                n.pause = 110;
                say(fill(P.lostAfter));
                startBolt(n.tx, n.ty, { steps: 4 });
              }
            } },
          ]);
        }
        playScene('plate-leave', [{ say: ['shark', P.letIt] }], () => {
          people.eat(k);
          n.pause = 110;
        });
      },
    });
    if (story.flags.plateTip) ask();
    else {
      story.flags.plateTip = true;
      sfx.learn();
      dialog.open({ name: WORDS.notes.tip, kind: 'tip', text: P.tip, then: ask });
    }
    return true;
  }

  // Knocked down by the traffic: the vehicle stops for a moment, the pair are hurt (a quarter of
  // full HP, but never left under a quarter) and lose whatever they were carrying, and bolt back off
  // the road (twice as far as from an angry human), on the side they came from if they can.
  // the pair, and the cat that is walking with them (if one is)
  const party = () => [...cats.filter((c) => !c.ghost), ...(guest && !guest.hidden && strays.tagging(guest) ? [guest] : [])];
  // Traffic carries on through scenes and dialog boxes, except while one of the
  // party is standing on the road: nothing can be done about a car then.
  function idleTraffic() {
    if (outside && !party().some((e) => isRoad(Math.floor((e.py + 8) / T)))) traffic.update();
  }
  function roadHit(v, who = cats[leader]) {
    const L = cats[leader];
    if (v) traffic.stop(v);
    sfx.beep();
    sfx.crash();
    wakeUp();
    for (const c of cats) {
      bubble(c, '!!', 60);
      if (carried(c)) putDown(c, 'forced');
    }
    burst(who.px + 8, who.py + 8, C.white, 10);
    let lost = false;
    if (keepsHurt(story)) {
      for (const k of pairKinds()) {
        const was = hurtOf(story, k);
        setHurt(k, Math.min(was + MEND.road * fullHp(k), Math.max(was, (1 - MEND.floor) * fullHp(k))));
        if (hurtOf(story, k) > was) lost = true;
      }
      if (lost) story.napLeft = MEND.nap;
    }
    // (what it cost, said as it is: a quarter of their HP, or nothing more once they are down to a quarter)
    say((who.kind === 'cat' ? fmt(pick(WORDS.road.hit), who) : named(fmt(WORDS.road.hitFriend, L), who.name)) + '\n' + (lost ? WORDS.road.cost : WORDS.road.costNone));
    quests.roadHit();
    startBolt(Math.round(L.px / T), L.ty, { steps: 10, side: roadSide });
  }

  // ----------------------------------------------------------- carrying
  // A pickup lies on a tile of one floor (garden tiles counted without GOX),
  // or is in a cat's mouth (`by`: 0 or 1), or has been given away ('held').
  const floorNow = () => (outside ? 'garden' : 'apt');
  const lx = (tx) => (outside ? tx - GOX : tx);
  const carried = (cat) => pickups.find((p) => p.by === cats.indexOf(cat)) || null;
  const pickupAt = (tx, ty) => pickups.find((p) => p.by === null && p.floor === floorNow() && p.x === lx(tx) && p.y === ty) || null;
  const named = (tpl, name) => tpl.replaceAll('{n}', name);
  // may something be put down on this tile?
  function canLie(tx, ty) {
    if (pickupAt(tx, ty) || catAt(tx, ty)) return false;
    if (outside) return !gardenBlocked(tx - GOX, ty) && !gardenPerch(tx - GOX, ty) && !isMat(tx - GOX, ty) && !strays.at(tx, ty) && !people.at(tx, ty);
    return freeFloor(tx, ty) && !humanAt(tx, ty) && !itemAt(tx, ty);
  }
  // where each thing belongs: the free tile nearest its mark on the map
  function homeOf(p) {
    const [floor, hx, hy] = p.def.home;
    const free = (x, y) => (floor === 'garden' ? !gardenBlocked(x, y) && !gardenPerch(x, y) && !isMat(x, y) : freeFloor(x, y)) && !pickups.some((q) => q !== p && q.by === null && q.floor === floor && q.x === x && q.y === y);
    for (let r = 0; r < 12; r++)
      for (let oy = -r; oy <= r; oy++)
        for (let ox = -r; ox <= r; ox++) if (Math.max(Math.abs(ox), Math.abs(oy)) === r && free(hx + ox, hy + oy)) return [floor, hx + ox, hy + oy];
    return [floor, hx, hy];
  }
  function sendBack(p) {
    const [floor, x, y] = homeOf(p);
    Object.assign(p, { floor, x, y, by: null, away: 0 });
  }
  function takePickup(cat, p) {
    if (carried(cat)) return say(fmt(WORDS.items.full, cat));
    p.by = cats.indexOf(cat);
    p.away = clock;
    (p.def.toy === 'squeak' ? sfx.squeak : sfx.blip)();
    act(cat, 'look', 14);
    if (p.def.toy === 'nip') whiff(cat);
    say(named(fmt(pick(flat(p.id + '.take', p.words.take || WORDS.items.take, cat)), cat), p.words.a));
  }
  // catnip, close to: a little green in the air
  function whiff(cat) {
    const [x, y] = centre(cat);
    burst(x, y - 2, '#b5d977', 7);
  }
  // A cat has walked onto a toy. The mouse squeaks, and is batted a tile further on when there is
  // room for it; the catnip stick has him over on his back; the rope gets chewed. (The antics and
  // the caption only now and then, and only for the cat the player is: the squeak, every time.)
  function playWith(cat, p, isLeader) {
    const kind = p.def.toy;
    if (kind === 'squeak') {
      if (frame - (p.squeakAt || -99) > 8) sfx.squeak();
      p.squeakAt = frame;
      const [dx, dy] = DIRS[cat.dir];
      if (isLeader && canLie(cat.tx + dx, cat.ty + dy)) {
        Object.assign(p, { x: lx(cat.tx + dx), y: cat.ty + dy, away: clock });
        burst((cat.tx + dx) * T + 8, (cat.ty + dy) * T + 12, C.grayL, 3);
      }
    }
    if (!isLeader || frame - (p.playedAt || -9999) < 600) return;
    p.playedAt = frame;
    if (kind === 'nip') {
      whiff(cat);
      act(cat, 'roll', 70);
      sfx.purr();
    } else if (kind === 'chew') act(cat, 'chew', 54, { obj: p, bits: '#e3d2ad' });
    say(fmt(pick(flat(p.id + '.play', p.words.play, cat)), cat));
  }
  // where a thrown toy comes down: a few tiles off along the floor, behind the cat for choice
  function tossSpot(cat) {
    let best = null;
    for (const d of [OPP[cat.dir], ...Object.keys(DIRS).filter((k) => k !== cat.dir && k !== OPP[cat.dir])]) {
      const [dx, dy] = DIRS[d];
      let at = null;
      for (let k = 1; k <= 4 && freeFloor(cat.tx + dx * k, cat.ty + dy * k); k++) if (canLie(cat.tx + dx * k, cat.ty + dy * k)) at = [cat.tx + dx * k, cat.ty + dy * k, k];
      if (at && (!best || at[2] > best[2])) best = at;
      if (best && best[2] >= 3) break;
    }
    return best;
  }
  // how: 'drop' (asked to), 'meow' (the mouth opened), 'forced' (shooed, or a fight)
  function putDown(cat, how = 'drop') {
    const p = carried(cat);
    if (!p) return false;
    const [dx, dy] = DIRS[cat.dir];
    let spot = how === 'drop' && canLie(cat.tx + dx, cat.ty + dy) ? [cat.tx + dx, cat.ty + dy] : null;
    if (!spot && !pickupAt(cat.tx, cat.ty) && !(outside && isMat(cat.tx - GOX, cat.ty))) spot = [cat.tx, cat.ty];
    if (!spot) spot = neighbours(cat.tx, cat.ty).find(([x, y]) => canLie(x, y)) || null;
    if (!spot) {
      if (how === 'drop') say(named(fmt(WORDS.items.noRoom, cat), p.words.a));
      return false;
    }
    Object.assign(p, { by: null, floor: floorNow(), x: lx(spot[0]), y: spot[1], away: clock });
    if (p.def.toy === 'squeak') sfx.squeak();
    else if (how !== 'forced') sfx.land();
    say(named(fmt(how === 'drop' ? pick(p.words.drop || WORDS.items.drop) : how === 'meow' ? WORDS.items.meowDrop : WORDS.items.forced, cat), p.words.a));
    return true;
  }
  // offering what is in the mouth to whoever is in front
  function give(cat, p, to) {
    if (act3.give(cat, p, to) || quests.give(cat, p, to)) return;
    if (to.kind === 'human') {
      // a toy is thrown for him, not kept (unless there is nowhere for it to land, or nobody awake to throw it)
      const at = p.def.toy && !to.asleep && !outside ? tossSpot(cat) : null;
      if (at) {
        Object.assign(p, { by: null, floor: 'apt', x: at[0], y: at[1], away: clock });
        (p.def.toy === 'squeak' ? sfx.squeak : sfx.land)();
        burst(at[0] * T + 8, at[1] * T + 12, C.grayL, 4);
        bubble(to, '♥', 60);
        act(cat, 'look', 30);
        return say(fmt(pick(p.words.human), cat, to));
      }
      p.floor = 'held';
      p.by = null;
      p.away = clock;
      bubble(to, '?', 70);
      act(cat, 'look', 40);
      return say(fmt(pick(WORDS.items.human), cat, to));
    }
    // a present: each friend wants one thing, and says (more or less) what it is when given another
    const want = WORDS.items.wanted[to.named ? to.def.id : to.id];
    // (BBC and Flower are house cats: they want for nothing, and say so)
    const house = !want && WORDS.items.house[to.id];
    if (house) {
      bubble(to, '...', 60);
      return say(fmt(p.def.toy === 'nip' && house.nip ? house.nip : pick(house.lines), cat));
    }
    if (!want || want.item !== p.id) {
      bubble(to, '...', 60);
      if (p.def.toy === 'nip') whiff(to);
      if (want && want.hint) return say(fmt(want.hint, cat));
      return say(named(fmt(pick(p.words.cat || WORDS.items.refuse), cat), to.name));
    }
    p.floor = 'held';
    p.by = null;
    p.away = clock;
    bubble(to, '♥♥', 90);
    sfx.purr();
    act(cat, 'purr', 60);
    say(fmt(want.line, cat));
  }
  // anything left lying about for a day (or given away) finds its way home
  function updatePickups() {
    // (the story starts with nothing lying about: the flat's toys are there from the day the pair move in)
    // (and the two demons come home from Japan in the epilogue)
    if (story.mode === 'story' && story.adopted) for (const p of pickups) if (p.def.toy && p.floor === 'gone' && (!p.def.late || story.flags.epToys)) sendBack(p);
    for (const p of pickups) {
      if (p.by !== null || !p.away || clock - p.away < 1440) continue;
      const [floor, x, y] = homeOf(p);
      if (p.floor === floor && p.x === x && p.y === y) {
        p.away = 0;
        continue;
      }
      // not while someone is looking at it
      const L = cats[leader];
      if (p.floor === floorNow() && Math.abs(lx(L.tx) - p.x) + Math.abs(L.ty - p.y) < 12) continue;
      const seen = floor === floorNow() && Math.abs(lx(L.tx) - x) + Math.abs(L.ty - y) < 10;
      sendBack(p);
      if (seen) say(named(WORDS.items.home, p.words.name));
    }
  }

  // -------------------------------------------------------------- party
  // One friend at a time can tag along downstairs, and joins any fight.
  function askAlong(cat, n) {
    const id = n.def.id;
    if (guest) return say(named(WORDS.party.full, n.name));
    if (story.resting[id] === dayNow()) return say(named(WORDS.party.resting, n.name));
    if (!OLD_FRIENDS.includes(id) && !story.beaten[id] && !act3.on()) return say(named(fmt(WORDS.party.notYet, cat), n.name));
    guest = n;
    story.party = id;
    strays.follow(n, cats[1 - leader]);
    bubble(n, '♥', 80);
    sfx.purr();
    say(named(fmt(pick(WORDS.party.joins), cat), n.name));
  }
  function sendHome(n, line) {
    strays.unfollow(n);
    if (guest === n) guest = null;
    guestFights = true; // (one the story was only walking somewhere, left at a door: the next to come along fights)
    story.party = null;
    if (line) say(named(line, n.name));
  }
  // Do, in front of one of the garden's cats: what it has to say, then what can be done
  function strayTalk(cat, n) {
    const line = strays.interact(cat, n.tx, n.ty, true);
    const kind = n.named ? FIGHTER_OF[n.def.id] : 'stray';
    if (!kind || !host.startBattle) return say(line);
    // Act 3: nobody spars with dogs about. A friend can be asked along once the story has got that far.
    const a3 = act3.on();
    if (a3 && n !== guest && !(n.named && act3.friends())) return say(line);
    const options = [];
    const acts = [];
    const add = (label, fn) => (options.push(label), acts.push(fn));
    // (something in his mouth: it can be handed over from here too)
    const mine = n.named && carried(cat);
    if (mine) add(WORDS.party.give.replace('{n}', mine.words.name || mine.id), () => give(cat, mine, n));
    if (n === guest) {
      add(WORDS.party.stay, null);
      add(WORDS.party.home, () => sendHome(n, pick(WORDS.party.goes)));
    } else {
      if (n.named) add(WORDS.party.ask, () => askAlong(cat, n));
      // (a spar with a cat who is already a friend is only practice: HP afterward is what it was before.
      // The first fight with a cat, the one that makes them a friend, counts like any other.)
      const friend = !!story.beaten[n.def.id] || OLD_FRIENDS.includes(n.def.id);
      if (!a3 || !dogs.about) add(WORDS.party.spar, () => startFight(ENCOUNTERS.spar(kind, n.name), { foe: n, plain: friend }));
      add(WORDS.party.leave, null);
    }
    dialog.open({ text: line, choices: options, then: (i) => acts[i] && acts[i]() });
  }

  // -------------------------------------------------------------- fights
  // Hands a fight to the battle screen: the pair at their stage of the story
  // (and whoever is tagging along) against the encounter's side.
  let fightLow = false;
  function startFight(enc, ctx = {}) {
    if (!host.startBattle) return;
    for (const c of cats) if (carried(c)) putDown(c, 'forced');
    wakeUp();
    syncNames();
    enc = fillNames(enc);
    // Who fights: the pair and the friend who is tagging along. The story may have it otherwise: one of
    // the pair alone (ctx.only or enc.only: 'shark' | 'orca'); the friend left out of it (ctx.noFriend);
    // a fighter of the story's choosing beside the pair, whoever is tagging along (ctx.ally: a kind, or
    // enc.friend: a fighter as the party is to have it, or null for nobody).
    let party = partySpecs(story, { plain: !!ctx.plain });
    const only = ctx.only || enc.only;
    if (only) party = party.filter((p) => p.kind === only);
    else if (enc.friend !== undefined) {
      if (enc.friend) party.push({ ...enc.friend });
    } else if (ctx.ally) party.push({ kind: ctx.ally });
    else if (guest && guestFights && outside && !ctx.noFriend) party.push({ kind: FIGHTER_OF[guest.def.id] });
    // (a fight may have one of them come into it under something: Infected by a snake's bite, say)
    for (const p of party) {
      const st = enc.partyStart && enc.partyStart[p.kind];
      if (st) p.start = { ...(p.start || {}), st: { ...((p.start && p.start.st) || {}), ...st } };
    }
    enc.party = party;
    // (how they stood going in: a pair who lose to dogs having come in low are taken home)
    fightLow = keepsHurt(story) && !ctx.plain && lowestShare() < MEND.low;
    input.flush();
    hold = 0;
    host.startBattle(enc, (result, info) => afterFight(enc, ctx, result, info));
  }
  function afterFight(enc, ctx, result, info) {
    input.flush();
    // What the fight left them with is what they have now (a fight the story arranges is not counted).
    // Anybody knocked out comes round with a quarter of full HP; so do both, in a fight that was lost
    // (every fight that counts is lost by being knocked out: none of them ends on a count of rounds).
    if (keepsHurt(story) && !ctx.plain && info && info.party) {
      for (const f of info.party) {
        if (f.kind !== 'shark' && f.kind !== 'orca') continue;
        const full = fullHp(f.kind);
        const floor = Math.ceil(MEND.floor * full);
        const left = result === 'lost' || f.hp <= 0 ? floor : Math.min(full, f.hp);
        setHurt(f.kind, full - left);
      }
      story.napLeft = MEND.nap; // (what naps may give back before the next fight)
      // (the first time house cats come out of a fight hurt, a tip says how they get HP back now: see onArrive)
      if (story.adopted && !story.flags.mendTip && pairKinds().some((k) => hurtOf(story, k) > 0)) story.flags.mendTip = 'due';
    }
    const L = cats[leader];
    if (guest && guestFights && !ctx.keepFriend) {
      const g = info.party.find((f) => f.kind === FIGHTER_OF[guest.def.id]);
      if (g && g.hp <= 0) {
        story.resting[guest.def.id] = dayNow();
        sendHome(guest, WORDS.party.hurt);
      }
    }
    if (ctx.robot) {
      if (result === 'won') story.flags.robotBeaten = true;
      else if (!ctx.ownHerd) {
        // herded back to the sofa
        const spots = WAYPOINTS.filter((w) => w.act === 'tv').flatMap((w) => [w.stand, ...neighbours(w.stand[0], w.stand[1])]).filter(([x, y]) => freeFloor(x, y) && !humanAt(x, y));
        if (spots.length > 1) {
          placeCat(L, spots[0][0], spots[0][1], 'down');
          placeCat(cats[1 - leader], spots[1][0], spots[1][1], 'down');
          updateCamera(true);
        }
        say(WORDS.robot.back);
      }
    } else if (ctx.foe) {
      if (result === 'won' && ctx.foe.named && !ctx.boss && !story.beaten[ctx.foe.def.id] && !OLD_FRIENDS.includes(ctx.foe.def.id)) {
        story.beaten[ctx.foe.def.id] = true;
        say(named(fmt(WORDS.party.won, L), ctx.foe.name));
      } else if (result === 'lost' && outside) {
        say(fmt(WORDS.lost.garden, L));
        startBolt(ctx.foe.tx, ctx.foe.ty);
      }
    }
    if (ctx.then) ctx.then(result, info);
    autosave();
  }

  // -------------------------------------------------------------- scenes
  // A scripted scene: a list of steps played in order, with the controls
  // locked. Steps:
  //   { say: [who, text] }      who: '' (the narrator), 'shark', 'orca', 'leader',
  //                             'other', a human's number, or a stray's id
  //   { choice: { who, text, options, then(i) } }   then may return more steps
  //   { wait: frames }   { walk: [who, x, y] }   { face: [who, dir] }
  //   { bubble: [who, text, frames] }   { sfx: name }   { fade: 'out' | 'in' }
  //   { camera: who | [x, y] | null }   { goal: text }   { flag: [key, value] }
  //   { picture: state | null }   a still picture in place of the world (the vet's: see vet.js).
  //                               A picture that is not the vet's is { kind: 'garnet', state } (garnet.js)
  //   { pan: picture | null }     the view slides sideways off the world and onto a picture that lies to
  //                               the east of it, or (null) back again; on a picture already, it changes at once
  //   { until: fn }   wait here until fn() is true
  //   { walks: [[who, x, y], ...], frames, each }   several walk at once (frames a tile for the cats; each() every frame)
  //   { note: { title, text, hi } }   a box of its own, with the words in `hi` picked out
  //   { call: fn }   { battle: encounter, then(result) }
  // Holding Run skips a scene that has been watched before; steps that change
  // the story (goal, flag, call) still happen.
  const actor = (who) => {
    if (typeof who === 'number') return humans[who];
    const k = String(who).toLowerCase();
    return k === 'leader' ? cats[leader] : k === 'other' ? cats[1 - leader] : k === 'shark' ? cats[0] : k === 'orca' ? cats[1] : extras.find((e) => e.id === k) || strays.byId[k] || null;
  };
  function playScene(id, steps, done) {
    wakeUp();
    // (any scene can be skipped: `armed` once the skip button has been let go since the scene began, so that
    // a player who was running when it started does not skip it by holding on)
    scene = { id, steps: steps.map((st) => ({ ...st })), done, skip: 0, canSkip: true, armed: false, cam: null, fade: 0, fadeTo: 0, bars: 0, picture: null, pan: 0, panTo: 0 };
    // (whatever was being said outside the scene is over)
    caption = null;
    captionQueue.length = 0;
    hold = 0;
    input.flush();
  }
  // A fighter's card, put up over the game while the story asks a question about them (the friends in
  // the line, on the last night): name, face, the three numbers, and each move with what it does.
  // who: the one standing there (for the name and the face); start: { hp } where they come in hurt.
  let card = null;
  function showCard(kind, who, start = {}) {
    const f = kind && FIGHTERS[kind];
    if (!f) return void (card = null);
    const mv = (id) => ({ name: MOVES[id].name, hint: MOVES[id].hint || '', acc: accuracyWord(MOVES[id]) });
    card = { name: who ? who.name : f.name, face: faceFor(who), hp: (start && start.hp) || f.hp, full: f.hp, atk: f.atk, agl: f.agl, moves: [f.heavy, ...f.specials].filter(Boolean).map(mv) };
  }
  // The skip button has been held: on to the scene's next question or fight, or (there is none) to its
  // end. Whatever on the way changes the game (a goal, a flag, a call) is done at once, in order; what is
  // only seen (walking, waiting, talking) is left out.
  function skipScene() {
    const sc = scene;
    const i = sc.steps.findIndex((st) => st.choice || st.battle);
    if (i < 0) return endScene(true);
    dialog.close();
    for (const st of sc.steps.splice(0, i)) {
      if (st.goal) setGoal(st.goal);
      if (st.flag) story.flags[st.flag[0]] = st.flag[1];
      if (st.call) st.call();
      if (st.fade) sc.fade = sc.fadeTo = st.fade === 'out' ? 1 : 0;
      if (st.camera !== undefined) sc.cam = st.camera;
      if (st.picture !== undefined) { sc.picture = st.picture; sc.pan = sc.panTo = st.picture ? 1 : 0; }
      if (st.pan !== undefined) { sc.picture = st.pan || null; sc.pan = sc.panTo = st.pan ? 1 : 0; }
    }
    sc.skip = 0;
    sc.armed = false;
    input.flush();
  }
  function endScene(skipped) {
    const sc = scene;
    card = null;
    if (skipped) for (const st of sc.steps) {
      if (st.goal) setGoal(st.goal);
      if (st.flag) story.flags[st.flag[0]] = st.flag[1];
      if (st.call) st.call();
    }
    dialog.close();
    scene = null;
    story.seen[sc.id] = true;
    input.flush();
    if (sc.done) sc.done(skipped);
    autosave();
  }
  // (the second argument, once "say nothing", is not needed any more: the GOAL box comes up by itself)
  function setGoal(text) {
    if (story.goal === text) return;
    story.goal = text;
  }
  // a goal the player has not been shown yet, in a GOAL box of its own
  function goalBox() {
    if (!story.goal) return void (shownGoal = '');
    if (story.goal === shownGoal) return;
    shownGoal = story.goal;
    dialog.open({ name: WORDS.pause.goal.toUpperCase(), text: story.goal, kind: 'goal' });
  }
  // A box of its own for news that matters: a move learned, a stat gone up.
  // `hi`: the words to pick out.
  // kind: 'gain' (the default) or 'tip': each has its own colours (see dialog.js)
  function note(title, text, hi, kind = 'gain') {
    sfx.learn();
    dialog.open({ name: title, text, hi, kind });
  }
  // Something tried for the first time around the garden (story only): both cats gain a little, for good.
  function discover(key) {
    if (story.mode !== 'story' || story.act === 0) return false; // (not in the opening: nobody has said that it pays yet)
    if (story.flags.epilogue) return false; // (...nor after the end: the story's numbers are settled)
    story.found = story.found || {};
    if (story.found[key]) return false;
    story.found[key] = true;
    const [stat, n] = FINDS[key];
    story.bonus = story.bonus || { hp: 0, atk: 0, agl: 0 };
    story.bonus[stat] += n;
    note(WORDS.finds.title, WORDS.finds[key], WORDS.finds.hi);
    autosave();
    return true;
  }
  // one step of a walk: towards (x, y) by the shortest way
  function sceneStep(a, x, y) {
    let path = null;
    if (a.kind === 'stray' || (a.kind === 'extra' ? !a.indoor : outside)) {
      const from = [a.tx, a.ty];
      const prev = new Map([[from.join(), null]]);
      const q = [from];
      for (let i = 0; i < q.length && i < 1500 && !path; i++) {
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const n = [q[i][0] + dx, q[i][1] + dy];
          if (prev.has(n.join()) || (gardenBlocked(n[0] - GOX, n[1]) && !gardenPerch(n[0] - GOX, n[1]))) continue;
          if (a.kind === 'extra' && !a.low && isBush(n[0] - GOX, n[1])) continue; // people keep out of the bushes
          prev.set(n.join(), q[i]);
          if (n[0] === x && n[1] === y) {
            path = [n];
            for (let c = q[i]; prev.get(c.join()); c = prev.get(c.join())) path.unshift(c);
            break;
          }
          q.push(n);
        }
      }
    } else path = bfs([a.tx, a.ty], [x, y]);
    if (!path || !path.length) return false;
    const [nx, ny] = path[0];
    if (a.kind === 'cat') startMove(a, nx, ny, a.sceneFrames || CONFIG.walkFrames);
    else if (a.kind === 'human') hMove(a, nx, ny);
    else if (a.kind === 'extra') {
      hMove(a, nx, ny);
      a.md = a.fast || 11;
    }
    else if (!strays.trail(a, nx, ny, a.sceneFrames || 10, true)) return false;
    return true;
  }
  function sceneAnimate() {
    weather();
    idleTraffic();
    for (const c of cats) if (c.moving) moveEntity(c);
    for (const h of humans) if (h.moving) moveEntity(h);
    for (const e of extras) if (e.moving) moveEntity(e);
    strays.update(frame, true);
    dogs.update(frame, true);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g;
      if (--p.life <= 0) particles.splice(i, 1);
    }
    for (let i = bubbles.length - 1; i >= 0; i--) if (--bubbles[i].t <= 0) bubbles.splice(i, 1);
    updateCamera(false);
  }
  function runScene() {
    const sc = scene;
    if (dialog.active) dialog.update();
    // (a question is never skipped: not while its box is up)
    const asking = dialog.active && dialog.state && dialog.state.asks;
    if (!input.isHeld('b')) sc.armed = true;
    if (sc.canSkip && sc.armed && !asking && input.isHeld('b')) {
      if (++sc.skip > 50) return skipScene();
    } else sc.skip = 0;
    sc.bars = Math.min(1, sc.bars + 0.1);
    if (sc.fade !== sc.fadeTo) sc.fade = Math.max(0, Math.min(1, sc.fade + Math.sign(sc.fadeTo - sc.fade) * 0.06));
    if (sc.pan !== sc.panTo) sc.pan = Math.max(0, Math.min(1, sc.pan + Math.sign(sc.panTo - sc.pan) / PAN));
    sceneAnimate();
    for (let guard = 0; guard < 24; guard++) {
      if (dialog.active || scene !== sc) return;
      const st = sc.steps[0];
      if (!st) return endScene(false);
      if (st.wait !== undefined) {
        if (--st.wait > 0) return;
      } else if (st.walk) {
        const [who, x, y] = st.walk;
        const a = actor(who);
        if (a && a.moving) return;
        if (a && a.kind === 'human' && a.seated) {
          // up off the chair (or out of bed) first
          a.asleep = false;
          standUp(a);
          return;
        }
        if (a && (a.tx !== x || a.ty !== y) && sceneStep(a, x, y)) return;
      } else if (st.say) {
        const a = st.say[0] === '' ? null : actor(st.say[0]);
        dialog.open({ name: a ? a.name : '', face: faceFor(a), text: fmt(st.say[1], cats[leader]) });
      } else if (st.choice) {
        const a = st.choice.who ? actor(st.choice.who) : null;
        sc.steps.shift();
        dialog.open({
          name: a ? a.name : '', face: faceFor(a), text: fmt(st.choice.text, cats[leader]), choices: st.choice.options,
          then: (i) => {
            const more = st.choice.then && st.choice.then(i);
            if (more && scene === sc) sc.steps.unshift(...more.map((m) => ({ ...m })));
          },
        });
        return;
      } else if (st.face) {
        const a = actor(st.face[0]);
        if (a) a.dir = st.face[1];
      } else if (st.bubble) {
        const a = actor(st.bubble[0]);
        if (a) bubble(a, st.bubble[1], st.bubble[2] || 60);
      } else if (st.sfx) sfx[st.sfx]();
      else if (st.fade) {
        sc.fadeTo = st.fade === 'out' ? 1 : 0;
        sc.steps[0] = { wait: 18 };
        continue;
      } else if (st.camera !== undefined) {
        // (ease: how fast the view goes there, as a share of the way left each frame; a quarter if not said)
        sc.cam = st.camera;
        sc.camEase = st.ease || 0;
      }
      else if (st.picture !== undefined) {
        sc.picture = st.picture;
        sc.pan = sc.panTo = st.picture ? 1 : 0;
      } else if (st.pan !== undefined) {
        // across to a picture, or back to the world: the step ends when the view has got there
        if (!st.on) {
          st.on = true;
          if (st.pan) sc.picture = st.pan;
          sc.panTo = st.pan ? 1 : 0;
        }
        if (sc.pan !== sc.panTo) return;
        if (!st.pan) sc.picture = null;
      }
      else if (st.walks) {
        // several at once: [[who, x, y], ...], each on his own way there. `frames`: a tile's worth, for
        // the cats (a run, say). `each`: called every frame while they go (something that follows them).
        if (st.each) st.each();
        let going = false;
        for (const [who, x, y] of st.walks) {
          const a = actor(who);
          if (!a) continue;
          if (a.kind === 'cat' || a.kind === 'stray') a.sceneFrames = st.frames; // (a friend keeps up with the pair)
          if (a.moving) going = true;
          else if (a.kind === 'human' && a.seated && (a.tx !== x || a.ty !== y)) {
            // up off the chair (or out of bed) first
            a.asleep = false;
            standUp(a);
            going = true;
          }
          else if ((a.tx !== x || a.ty !== y) && (st.n = (st.n || 0) + 1) < 4000 && sceneStep(a, x, y)) going = true;
        }
        if (going) return;
        for (const [who] of st.walks) if (actor(who)) delete actor(who).sceneFrames;
      } else if (st.until) {
        // hold the scene here until something has happened (a car has pulled up, say), or a few seconds have gone by
        st.n = (st.n || 0) + 1;
        if (!st.until() && st.n < 900) return;
      }
      else if (st.goal) {
        // a new goal at the end of a scene waits for a button, like everything else in it
        setGoal(st.goal);
        goalBox();
      } else if (st.note) note(st.note.title, fmt(st.note.text, cats[leader]), st.note.hi, st.note.kind);
      else if (st.flag) story.flags[st.flag[0]] = st.flag[1];
      else if (st.call) st.call();
      else if (st.battle) {
        sc.steps.shift();
        return startFight(st.battle, { then: st.then });
      }
      sc.steps.shift();
    }
  }
  // the opening, until Act 0 is built: a few lines to show who is who
  function introScene() {
    const [a, b] = WORDS.intro;
    // (the goal the game started with is put up in a box at the end, as any new goal is)
    const goal = story.mode === 'story' && story.goal ? story.goal : WORDS.goal.sandbox;
    if (story.mode === 'story') story.goal = '';
    playScene('intro', [
      { wait: 30 },
      { say: a },
      { bubble: ['orca', '!', 50] },
      { face: ['orca', 'right'] },
      { say: b },
      { face: ['shark', 'left'] },
      ...WORDS.intro.slice(2).map((l) => ({ say: l })),
      { bubble: ['shark', '♪', 50] },
      { goal },
    ]);
  }

  // -------------------------------------------------------------- saving
  // Everything worth keeping: the story, the clock, where the cats and the
  // things they carry are. The humans simply pick their day up from the clock.
  function snapshot() {
    return {
      v: 1, at: Date.now(), story, clock, leader, outside, gardenSeen, beenOut,
      cats: cats.map((c) => ({ x: c.tx, y: c.ty, dir: c.dir })),
      pickups: pickups.map((p) => ({ id: p.id, floor: p.floor, x: p.x, y: p.y, by: p.by, away: p.away })),
      feeder: feeder.portions, bowls: bowls.state, fired: { ...fired }, stats: { ...stats },
    };
  }
  function autosave() {
    if (mode !== 'play' || scene) return false;
    noteProgress(story); // (how far the player has ever got: see progress.js)
    if (story.mode !== 'story' || story.act === 0) return false; // (neither Sandbox nor the opening is ever saved)
    lastSave = frame;
    const ok = writeSave(snapshot());
    if (host.saved) host.saved(ok);
    return ok;
  }
  function restore(save) {
    story = { ...newStory(), ...save.story };
    clock = save.clock;
    leader = save.leader ? 1 : 0;
    gardenSeen = !!save.gardenSeen;
    beenOut = !!save.beenOut;
    Object.assign(stats, save.stats || {});
    Object.assign(fired, save.fired || {});
    setFeeder(save.feeder || 0);
    setBowls(save.bowls || 'clean');
    lastPhase = phaseOf(hourNow());
    for (const q of save.pickups || []) {
      const p = pickups.find((o) => o.id === q.id);
      if (p) Object.assign(p, { floor: q.floor, x: q.x, y: q.y, by: q.by, away: q.away });
    }
    if (save.outside) {
      garden = buildGarden();
      outside = true;
      strays.newVisit();
      people.newVisit();
      traffic.fill();
    }
    // back where they were, if that is still somewhere a cat can stand
    const fits = (x, y) => (outside ? !!gardenPerch(x - GOX, y) || !gardenBlocked(x - GOX, y) : isFloor(at(x, y)) && (!objAt(x, y) || !!perchAt(x, y)) && !humanAt(x, y));
    cats.forEach((c, i) => {
      const q = (save.cats || [])[i];
      const home = outside ? [GOX + GARDEN_START[i][0], GARDEN_START[i][1]] : START.cats[i];
      // (not in the middle of the road: a save from before it was widened could put them there)
      const [x, y] = q && fits(q.x, q.y) && !(outside && isRoad(q.y)) ? [q.x, q.y] : home;
      placeCat(c, x, y, (q && q.dir) || 'down');
    });
    const n = outside && story.party ? strays.byId[story.party] : null;
    if (n) {
      const F = cats[1 - leader];
      const spot = neighbours(F.tx, F.ty).find(([x, y]) => !gardenBlocked(x - GOX, y) && !catAt(x, y)) || [F.tx, F.ty];
      strays.place(n, spot[0] - GOX, spot[1]);
      guest = n;
      strays.follow(n, F);
    } else story.party = null;
    room = outside ? gardenArea(cats[leader].tx - GOX, cats[leader].ty) || '' : roomAt(cats[leader].tx, cats[leader].ty);
    banner = { text: PHASE_NAME[phaseOf(hourNow())], t: 180 };
  }
  // out of the title screen: a saved game picked up again, or a new one
  // kind: 'story' | 'sandbox'; mission: the id of one of MISSIONS, to start the story part-way through;
  // peek: that chapter is one the player has not reached (see progress.js)
  function start(save, kind = 'sandbox', mission = null, peek = false) {
    shownGoal = ''; // (a game that is started or loaded shows its goal in a box, once)
    mode = 'play';
    for (const e of extras) e.hidden = true; // the story's people and animals are put back by the story
    sfx.start();
    input.flush();
    if (save) restore(save);
    else if (kind === 'story') {
      // the opening (Act 0): five in the morning, in the rain; or, from Mission select, the start of a later questline
      story = newStory('story');
      for (const p of pickups) p.floor = 'gone'; // nothing lies about until the story puts it there
      clock = 5 * 60;
      rain = mission ? 0 : 1;
      leader = 0;
      for (const c of cats) c.ghost = false;
      lastPhase = phaseOf(hourNow());
      garden = buildGarden();
      outside = true;
      gardenSeen = true;
      strays.newVisit();
      people.newVisit();
      traffic.fill();
      roadSide = 'north';
      const found = MISSIONS.find((o) => o.id === mission);
      // (Prologue is the opening itself: a new game)
      const m = found && found.opening ? null : found;
      if (found && found.opening) rain = 1;
      if (m) {
        // straight to the start of one questline, with the earlier ones behind it
        story.act = 1;
        story.stage = 'start';
        story.flags = { mission: m.id, ...(peek ? { peek: true } : {}) };
        story.hurt = { shark: 0, orca: 0 };
        m.set(story);
        strays.newVisit(); // (the visit above was made for the opening, which has no nameless strays)
        // Every mission but the first starts as a game played that far would stand: the garden's
        // first-time finds (the tree, the faucet, the rats by the shed) already had, with what each was
        // worth, and those rats gone for good. (Cheetos is the one who says that they pay, at the end
        // of the first questline: until then nobody has been told.) The flat's gains are the missions'
        // own business: see jump in home.js and in act3.js.
        if (m.id !== 'cheetos') {
          story.found = Object.fromEntries(Object.keys(FINDS).map((k) => [k, true]));
          story.bonus = { hp: 0, atk: 0, agl: 0 };
          for (const [stat, n] of Object.values(FINDS)) story.bonus[stat] += n;
          story.flags.shedRatsGone = true;
        }
        clock = m.hour * 60;
        lastPhase = phaseOf(hourNow());
      }
      cats.forEach((c, i) => {
        const [hx, hy] = m ? [m.at[0] + i, m.at[1]] : quests.HOME[i];
        const [x, y] = freeNear(hx, hy);
        placeCat(c, GOX + x, y, 'down');
      });
      room = '';
      banner = { text: PHASE_NAME[phaseOf(hourNow())], t: 150 };
      if (m && m.home) {
        // Act 2: indoors, at one of its stages (see jump in home.js)
        changeFloor(false);
        caption = null;
        captionQueue.length = 0;
        home.jump(m.home);
        room = roomAt(cats[leader].tx, cats[leader].ty);
        banner = { text: room, t: 150 };
      } else if (m && m.act3) {
        // Act 3: at one of its stages (see jump in act3.js)
        act3.jump(m.act3);
      } else if (m) {
        // (a chapter that opens on a scene has no goal yet: the scene gives it one. Whatever goal there is
        // comes up in a GOAL box, as soon as nothing else is on the screen)
      } else quests.begin0();
    } else {
      // Sandbox: the flat and the garden with no story in them at all, to wander in. It is never saved,
      // and leaves the saved game alone. (From 20 to 25 Nov it was the game after the epilogue: that is
      // the Epilogue chapter of Select chapter now. A save from then still has `flags.sandbox`.)
      story = newStory();
      room = roomAt(cats[leader].tx, cats[leader].ty);
      banner = { text: room, t: 150 };
      introScene();
    }
    act3.restore(); // (the world as Act 3 has it, if this is Act 3; and no dogs left over from another game if not)
    syncNames();
    tuneIn();
    updateCamera(true);
  }

  // Do: whatever is in front of the cat. Returns false if there was nothing
  // to do (holding the button down then starts a nap).
  function pressDo() {
    const L = cats[leader];
    if (!outside && home.pressDo(L)) return true;
    const [dx, dy] = DIRS[L.dir];
    const tx = L.tx + dx;
    const ty = L.ty + dy;
    const mine = carried(L);
    const n = outside ? strays.at(tx, ty) : null;
    const h = outside ? null : humanAt(tx, ty);
    if (mine) {
      // a full mouth: give it to whoever is in front, go through a door, or put it down
      if (n || h) return give(L, mine, n || h), true;
      // (one of the story's own people or animals may be offered something too: Act 3; and after the end,
      // BBC and Flower on Garnet's step can be given a present like any of the garden's cats)
      const ex = extraAt(tx, ty);
      if (ex && act3.give(L, mine, ex)) return true;
      if (ex && (WORDS.items.wanted[ex.id] || WORDS.items.house[ex.id])) return give(L, mine, ex), true;
      if (!outside && at(tx, ty) === 'D') return interact(L, tx, ty, L.dir, true), true;
      return putDown(L), true;
    }
    const lying = pickupAt(tx, ty) || pickupAt(L.tx, L.ty);
    // (the first night and the first morning of Act 2, nothing in the flat answers: see mute in home.js)
    if (lying) return (!outside && home.mute(null)) || takePickup(L, lying), true;
    if (outside) {
      if (n || extraAt(tx, ty) || gardenThing(tx - GOX, ty) || people.at(tx, ty)) return gardenInteract(L, tx - GOX, ty, L.dir, true), true;
      return false;
    }
    const o = objAt(tx, ty);
    const ch = at(tx, ty);
    const special =
      h || (o && o.def.bump) || ch === 'D' || ch === 'R' || ch === 'G' || ch === 'A' || extraAt(tx, ty) ||
      (ch === '#' && L.dir === 'right' && world.headboards.has(L.tx + ',' + L.ty)) ||
      (ch === '#' && L.dir === 'up' && world.windows.has(tx + ',' + ty));
    if (special) return interact(L, tx, ty, L.dir, true), true;
    return false;
  }

  // Meow. A cat cannot meow with its mouth full, so whatever it was carrying
  // drops. Upstairs, sometimes a human hears and comes over.
  function pressMeow() {
    const L = cats[leader];
    if (carried(L)) putDown(L, 'meow');
    meow(L);
    if (act3.meow(L)) return;
    if (outside) return void quests.meow(L);
    // (in somebody else's flat nobody comes: the story may have something to say about that)
    if (flatNow() !== 'home') return void ((flatHooks[flatNow()] || {}).meow || (() => 0))(L);
    if (home.meow(L)) return;
    if (Math.random() > 0.35) return;
    let best = null;
    let bd = 1e9;
    for (const h of humans) {
      if (h.state !== 'activity' || !awake(h) || h.bedtime || h.pet || h.moving || dining(h)) continue;
      const d = Math.abs(h.tx - L.tx) + Math.abs(h.ty - L.ty);
      if (d < bd) {
        bd = d;
        best = h;
      }
    }
    if (!best) {
      // everyone is asleep: someone grumbles from bed
      const sleeper = humans.find((h) => h.asleep);
      if (sleeper) {
        bubble(sleeper, '...', 60);
        say(fmt(pick(['{h} mumbles from bed: "mmph... go to sleep, {c}..."', "{h}, from under the comforter: \"It's the middle of the night, {c}.\""]), L, sleeper));
      }
      return;
    }
    bubble(best, '?', 50);
    startSeek(best, L);
    if (nearLeader(best.tx, best.ty)) say(fmt('{h}: "Was that {c}? Coming!"', L, best));
  }

  // one cat ate both portions: the other one (and maybe a human) has words
  function greedyReaction(cat) {
    const other = cats[1 - cats.indexOf(cat)];
    bubble(other, pick(['!!', '?!', '...']), 70);
    sfx.meow(other.cfg.meow * 1.15);
    let near = null;
    for (const h of humans) if (awake(h) && Math.abs(h.tx - cat.tx) + Math.abs(h.ty - cat.ty) < 10) near = h;
    const lines = [
      "{o} stares at {c}. {c} doesn't make eye contact.",
      '{o} sits by the empty bowl and lets out a very small, very sad meow.',
      "{o} files a formal complaint. It's just one long meow.",
      '{c} licks his lips. {o} will remember this.',
    ];
    let text = fmt(pick(lines), cat);
    if (near && Math.random() < 0.7) {
      bubble(near, '!', 60);
      text += '\n' + fmt(pick(["{h}: \"{c}! That was {o}'s!\"", '{h}: "Did you just eat both portions, {c}?"', '{h}: "Poor {o}... {c}, you greedy thing."']), cat, near);
    }
    say(text);
  }

  function updateAction(cat) {
    const a = cat.action;
    a.t++;
    const [dx, dy] = DIRS[cat.dir];
    const fx = cat.px + 8 + dx * 9;
    const fy = cat.py + 8 + dy * 9 - cat.z;
    switch (a.type) {
      case 'scratch':
        if (a.t % 11 === 1) {
          if (!a.quiet) sfx.scratch();
          if (a.obj) a.obj.shake = Math.max(a.obj.shake, 6);
          for (let i = 0; i < 3; i++)
            spawn('px', fx + rnd(7) - 3, fy + rnd(7) - 3, { vx: Math.random() - 0.5, vy: -0.6, g: 0.07, life: 16, color: C.cream });
        }
        break;
      case 'chew':
        if (a.t % 13 === 1) {
          sfx.crunch();
          a.obj.shake = 8;
          // (leaves off a plant; threads off a rope toy)
          spawn('px', fx, fy - 8, { vx: Math.random() - 0.5, vy: -0.8, g: 0.06, life: 30, color: a.bits || C.leafL });
          spawn('px', fx, fy - 6, { vx: Math.random() - 0.5, vy: -0.6, g: 0.06, life: 30, color: a.bits || C.leaf });
        }
        break;
      case 'eat':
        if (a.t % 14 === 1) {
          sfx.crunch();
          spawn('px', fx, fy, { vx: Math.random() - 0.5, vy: -0.9, g: 0.09, life: 18, color: C.walnut });
        }
        if (a.t === a.dur - 1 && a.obj && a.obj.food) {
          a.obj.eaters.push(cat);
          mend(MEND.portion);
          eatPortion(a.obj);
          if (a.greedy && !home.ate(a.obj, cat)) greedyReaction(cat);
          else if (!a.greedy) home.ate(a.obj, cat);
        }
        if (a.t === a.dur - 1 && a.shoo) shoo(cat, a.shoo);
        break;
      case 'purr':
        if (a.t % 22 === 1) spawn('glyph', cat.px + 4 + rnd(8), cat.py - 4 - cat.z, { vy: -0.35, life: 40, ch: '♥', color: C.red });
        break;
      case 'roll':
        // catnip: over on his back, and over again
        if (a.t % 14 === 1) spawn('px', cat.px + 3 + rnd(10), cat.py + 4 - cat.z, { vx: Math.random() - 0.5, vy: -0.7, g: 0.03, life: 34, color: '#b5d977' });
        break;
      case 'nap':
        if (a.t % 80 === 20) spawn('glyph', cat.px + 10, cat.py - 2 - cat.z, { vy: -0.25, vx: 0.12, life: 60, ch: 'z', color: C.white });
        break;
      case 'litter':
        if (a.t === 12) {
          cat.hidden = true;
          sfx.jump();
        }
        if (a.t > 30 && a.t < 110 && a.t % 16 === 0) {
          a.obj.shake = 6;
          sfx.scratch();
        }
        if (a.t === 120) {
          cat.hidden = false;
          sfx.land();
          burst(cat.px + 8, cat.py + 4, C.tan, 8);
        }
        if (a.t === 149) {
          a.obj.shake = 30;
          sfx.whirr(0.8);
          say('The Litter-Robot starts its cleaning cycle. Whirrrrr.');
        }
        break;
    }
    if (a.dur && a.t >= a.dur) cat.action = null;
  }

  function updateRide(cat) {
    const r = cat.riding;
    const o = r.obj;
    const route = r.route;
    if (cat.moving) return;
    if (r.phase === 'mount') r.phase = 'go';
    const SPEED = 9;
    r.t++;
    const a = route[r.i];
    const b = route[r.i + 1];
    const f = r.t / SPEED;
    const x = lerp(a[0], b[0], f) * T;
    const y = lerp(a[1], b[1], f) * T;
    o.dx = x - o.x * T;
    o.dy = y - o.y * T;
    cat.px = x;
    cat.py = y;
    cat.z = 4;
    cat.dir = dirName(b[0] - a[0], b[1] - a[1]);
    if (frame % 6 === 0) spawn('px', x + 8, y + 12, { vx: Math.random() - 0.5, vy: -0.2, life: 18, color: C.grayL });
    if (frame % 40 === 0) sfx.whirr(0.6);
    if (r.t >= SPEED) {
      r.t = 0;
      r.i++;
      cat.tx = b[0];
      cat.ty = b[1];
      if (r.i >= route.length - 1) {
        o.dx = o.dy = 0;
        cat.riding = null;
        cat.tx = o.x;
        cat.ty = o.y;
        let [hx, hy] = r.home;
        if (humanAt(hx, hy) || cats.some((c) => c !== cat && c.tx === hx && c.ty === hy)) {
          const alt = [[o.x, o.y - 1], [o.x + 1, o.y]].find(([x2, y2]) => isFloor(at(x2, y2)) && !objAt(x2, y2) && !humanAt(x2, y2) && !catAt(x2, y2));
          if (alt) [hx, hy] = alt;
        }
        startMove(cat, hx, hy, 14);
        cat.z0 = 4;
        cat.hop = 6;
        sfx.beep();
        say(fmt('The ride is over. {c} would like to go again.', cat));
      }
    }
  }

  // ------------------------------------------------------------- humans
  function bfs(from, to) {
    const key = (x, y) => y * MAP_W + x;
    const prev = new Map();
    const q = [from];
    prev.set(key(from[0], from[1]), null);
    while (q.length) {
      const [x, y] = q.shift();
      if (x === to[0] && y === to[1]) {
        const path = [];
        let cur = [x, y];
        while (cur) {
          path.unshift(cur);
          cur = prev.get(key(cur[0], cur[1]));
        }
        path.shift();
        return path;
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (!isFloor(at(nx, ny)) || objAt(nx, ny) || prev.has(key(nx, ny))) continue;
        // route around anyone standing still (someone walking will be gone by then)
        if (humans.some((h) => !h.away && !h.moving && h.tx === nx && h.ty === ny)) continue;
        prev.set(key(nx, ny), [x, y]);
        q.push([nx, ny]);
      }
    }
    return null;
  }

  function hMove(h, x, y) {
    h.fx = h.tx;
    h.fy = h.ty;
    h.tx = x;
    h.ty = y;
    h.dir = dirName(x - h.fx, y - h.fy);
    h.mt = 0;
    h.md = CONFIG.humanFrames;
    h.moving = true;
  }

  // get up from a chair / the sofa / bed / the loo
  function standUp(h) {
    if (!h.seated) return;
    const [sx, sy] = h.wp.stand;
    hMove(h, sx, sy);
    h.md = 9 * Math.max(1, Math.abs(sx - h.fx) + Math.abs(sy - h.fy));
    h.seated = false;
  }

  // one step along a path; false = properly stuck, plan again
  function walkStep(h, path) {
    const [nx, ny] = path[0];
    if (humans.some((o) => o !== h && !o.away && o.tx === nx && o.ty === ny)) {
      if (++h.wait <= 90) return true;
      // still face to face: step aside (sometimes) and plan again
      const side = neighbours(h.tx, h.ty).filter(([x, y]) => freeFloor(x, y) && !humanAt(x, y) && !catAt(x, y) && !(x === nx && y === ny));
      if (side.length && Math.random() < 0.6) {
        const [x, y] = pick(side);
        hMove(h, x, y);
      }
      return false;
    }
    if (catAt(nx, ny) && h.wait < 45) {
      h.wait++;
      return true;
    }
    h.wait = 0;
    path.shift();
    hMove(h, nx, ny);
    return true;
  }

  const nearLeader = (x, y, n = 14) => Math.abs(cats[leader].tx - x) + Math.abs(cats[leader].ty - y) < n;
  const freeFloor = (x, y) => isFloor(at(x, y)) && !objAt(x, y);
  const neighbours = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy]);

  function goToWaypoint(h, w) {
    const path = bfs(h.seated ? h.wp.stand : [h.tx, h.ty], w.stand);
    if (!path) return false;
    standUp(h);
    h.wp = w;
    h.path = path;
    h.state = 'walk';
    h.wait = 0;
    return true;
  }

  // bedtime: own bathroom first, then bed
  function goToBed(h) {
    if (tvObj.ch && !humans.some((o) => o !== h && awake(o) && !o.bedtime)) {
      setTV(0);
      if (nearLeader(h.tx, h.ty)) say(fmt('{h} turns off the TV before bed.', null, h));
    }
    let w;
    if (!h.wcDone) {
      h.wcDone = true;
      const ids = [START.wc[h.idx], START.wc[1 - h.idx]];
      w = ids.map((id) => WAYPOINTS.find((v) => v.id === id)).find((v) => !humans.some((o) => o !== h && o.wp === v));
    }
    w = w || WAYPOINTS.find((v) => v.act === 'sleep' && v.who === h.idx);
    if (!goToWaypoint(h, w)) h.timer = 120;
  }

  function wake(h) {
    h.asleep = false;
    h.bedtime = false;
    h.wcDone = false;
    h.bedAt = bedTime(h.idx);
    h.timer = 20;
    bubble(h, '...', 60);
    if (nearLeader(h.tx, h.ty, 10)) say(fmt(pick(['{h} wakes up and stretches. Good morning!', '{h} yawns. "...morning, cats."']), null, h));
  }

  function pickNext(h) {
    // meals come first: the cook serves when done cooking, and clears up after
    if (meal && h === meal.cook && meal.phase === 'eating') return clearMeal(h);
    if (h.wp.act === 'cook' && !h.bedtime && canCook()) return serveMeal(h);
    if (meal && h === meal.partner && meal.phase !== 'clearing' && !h.bedtime) {
      if (joinMeal(h)) return;
    }
    if (h.bedtime) return goToBed(h);
    const hr = hourNow();
    // now and then: pop out on an errand, or go and find a cat to pet
    if (!errand && frame > nextErrandAt && hr >= 9 && hr < 18.5 && Math.random() < 0.5) return startErrand(h);
    if (flatNow() === 'home' && Math.random() < 0.16) return startSeek(h, pick(cats));
    // after 9:30pm only the night owls are up, and they mostly work or watch TV
    const weights = SCHEDULE[hr >= 21.5 || hr < 6 ? 'night' : phaseOf(hr)];
    const opts = WAYPOINTS.filter(
      (w) =>
        (w.who === undefined || w.who === h.idx) &&
        w !== h.wp &&
        weights[w.act] &&
        !humans.some((o) => o !== h && o.wp === w) &&
        (w.act !== 'cook' || canCook())
    );
    // last one off the sofa usually turns the TV off
    if (h.seated && h.wp.act === 'tv' && tvObj.ch && Math.random() < 0.7 && !humans.some((o) => o !== h && o.seated && o.wp.act === 'tv')) {
      setTV(0);
      if (nearLeader(h.tx, h.ty)) say(fmt('{h} turns the TV off.', null, h));
    }
    const total = opts.reduce((n, w) => n + weights[w.act], 0);
    for (let tries = 0; tries < 6 && opts.length; tries++) {
      let r = Math.random() * total;
      const w = opts.find((v) => (r -= weights[v.act]) < 0) || opts[opts.length - 1];
      if (goToWaypoint(h, w)) return;
    }
    h.timer = 180;
  }

  // -------------------------------------------------- scripted behaviour
  // h.script is a list of steps: {go:[x,y]} {wait:n} {fn} {chase:cat,t}
  function startScript(h, steps, onAbort) {
    h.state = 'script';
    h.script = [{ fn: () => standUp(h) }, ...steps];
    h.onAbort = onAbort || null;
    h.wait = 0;
  }
  function endScript(h) {
    h.state = 'activity';
    h.timer = 30;
    h.script = null;
    h.onAbort = null;
  }
  function abortScript(h) {
    const f = h.onAbort;
    h.away = false;
    h.carry = null;
    endScript(h);
    if (f) f();
  }

  function humanPets(h, c) {
    h.pet = 90;
    h.dir = dirName(c.tx - h.tx, c.ty - h.ty);
    bubble(h, '♥', 80);
    stats.pets++;
    home.did('pets', c, h);
    const isLeader = c === cats[leader];
    if (!c.moving && !c.action && !c.riding && !(isLeader && input.dir())) act(c, 'purr', 70);
    const hi = hello(c, h);
    if (nearLeader(h.tx, h.ty)) {
      sfx.purr();
      say(hi || fmt(pick(flat('pets.seek', PET_LINES.seek, c)), c, h));
    }
  }

  function runScript(h) {
    const st = h.script[0];
    if (!st) return endScript(h);
    if (st.wait !== undefined) {
      if (--st.wait <= 0) h.script.shift();
      return;
    }
    if (st.fn) {
      h.script.shift();
      st.fn();
      return;
    }
    if (st.go) {
      if (h.tx === st.go[0] && h.ty === st.go[1]) {
        h.script.shift();
        return;
      }
      if (!st.path || !st.path.length) {
        st.path = bfs([h.tx, h.ty], st.go);
        if (!st.path) {
          st.fail = (st.fail || 0) + 1;
          if (st.fail > 5) abortScript(h);
          else h.script.unshift({ wait: 45 });
          return;
        }
      }
      if (!walkStep(h, st.path)) {
        h.wait = 0;
        st.path = null;
      }
      return;
    }
    if (st.fetch) {
      const o = st.fetch;
      st.t--;
      if (Math.abs(o.x - h.tx) + Math.abs(o.y - h.ty) === 1 && !o.push) {
        h.script.shift();
        h.dir = dirName(o.x - h.tx, o.y - h.ty);
        return;
      }
      if (st.last && (st.last[0] !== o.x || st.last[1] !== o.y)) {
        st.path = null;
        if (frame - (st.yell || -999) > 260) {
          st.yell = frame;
          bubble(h, '!');
          if (nearLeader(h.tx, h.ty))
            say(h.name + ": '" + pick(['Hey! Bring that back!', 'Stop pushing it around!', 'Give me the bag, you little gremlin!', 'I just want to throw it away!']) + "'");
        }
      }
      st.last = [o.x, o.y];
      if (st.t <= 0) {
        // outrun! try again in a bit
        if (nearLeader(h.tx, h.ty)) say(fmt('{h} gives up on the ' + o.def.name + '. For now.', null, h));
        bubble(h, '...', 60);
        errand.phase = 'delivered';
        errand.t = frame - 60 * 45;
        return endScript(h);
      }
      if (!st.path || !st.path.length || st.t % 30 === 0) {
        let best = null;
        for (const [x, y] of neighbours(o.x, o.y)) {
          if (!freeFloor(x, y)) continue;
          const pth = bfs([h.tx, h.ty], [x, y]);
          if (pth && (!best || pth.length < best.length)) best = pth;
        }
        st.path = best;
      }
      if (st.path && st.path.length && !walkStep(h, st.path)) {
        h.wait = 0;
        st.path = null;
      }
      return;
    }
    if (st.chase) {
      const c = st.chase;
      st.t--;
      const d = Math.abs(c.tx - h.tx) + Math.abs(c.ty - h.ty);
      if (d === 1 && !c.moving && !c.riding && !c.hidden) {
        h.script.shift();
        return humanPets(h, c);
      }
      if (st.t <= 0 || c.riding || outside || curtainAt(c.tx, c.ty)) {
        h.script.shift();
        bubble(h, '...', 50);
        return;
      }
      if (!st.path || !st.path.length || st.t % 40 === 0) {
        let best = null;
        for (const [x, y] of neighbours(c.tx, c.ty)) {
          if (!freeFloor(x, y)) continue;
          const pth = bfs([h.tx, h.ty], [x, y]);
          if (pth && (!best || pth.length < best.length)) best = pth;
        }
        if (!best) {
          h.script.shift();
          return;
        }
        st.path = best;
      }
      if (st.path.length && !walkStep(h, st.path)) {
        h.wait = 0;
        st.path = null;
      }
    }
  }

  function startSeek(h, cat) {
    startScript(h, [{ chase: cat, t: 900 }]);
  }

  // ------------------------------------------------------------- errands
  // A human pops out, comes back carrying something, leaves it around (or
  // eats it at the table), and later takes it out with the rubbish.
  function addObject(type, x, y) {
    const def = TYPES[type];
    const o = { type, def, x, y, w: 1, h: 1, sprite: renderType(def), sortY: (y + 1) * T, shake: 0, dx: 0, dy: 0, saidAt: -9999 };
    world.objects.push(o);
    objGrid[y][x] = o;
    if (def.perch !== undefined) perchGrid[y][x] = { obj: o, h: def.perch };
    return o;
  }
  function removeObject(o) {
    objGrid[o.y][o.x] = null;
    perchGrid[o.y][o.x] = null;
    world.objects.splice(world.objects.indexOf(o), 1);
    for (const c of cats)
      if (c.tx === o.x && c.ty === o.y) {
        c.z = c.z1 = 0;
        c.perchObj = null;
      }
  }

  function doorSteps(h, text) {
    return [
      { go: DOOR_SPOTS[h.idx % DOOR_SPOTS.length] },
      {
        fn() {
          h.dir = 'down';
          if (nearLeader(h.tx, h.ty, 22)) {
            sfx.door();
            say(text);
          }
        },
      },
      { wait: 30 },
      { fn: () => (h.away = true) },
    ];
  }
  function returnSteps(h) {
    return [
      {
        fn() {
          h.away = false;
          h.dir = 'up';
          if (nearLeader(h.tx, h.ty, 22)) sfx.door();
        },
      },
      { wait: 25 },
    ];
  }

  function pickDropSpot() {
    const stands = new Set(WAYPOINTS.map((w) => w.stand.join(',')));
    const loop = new Set(VACUUM_ROUTES.flat().map((p) => p.join(',')));
    const ok = (x, y) => freeFloor(x, y) && !catAt(x, y) && !humanAt(x, y);
    for (let i = 0; i < 60; i++) {
      const [x0, y0, x1, y1] = pick(DROP_ZONES);
      const x = x0 + rnd(x1 - x0 + 1);
      const y = y0 + rnd(y1 - y0 + 1);
      if (!ok(x, y) || stands.has(x + ',' + y) || loop.has(x + ',' + y)) continue;
      const stand = neighbours(x, y).find(([a, b]) => ok(a, b));
      if (stand) return { spot: [x, y], stand };
    }
    return null;
  }

  function finishErrand() {
    errand = null;
    nextErrandAt = frame + 60 * (50 + rnd(70));
  }

  function startErrand(h, kind = pick(['parcel', 'parcel', 'shopbag', 'takeout'])) {
    errand = { h, kind, phase: 'out', t: frame, obj: null, item: null };
    const lines = ERRAND[kind];
    const deliver = () => {
      h.carry = kind;
      if (nearLeader(h.tx, h.ty, 22)) say(fmt(lines.back, null, h));
      if (kind === 'takeout') {
        const w = WAYPOINTS.filter((v) => v.act === 'eat').find((v) => !humans.some((o) => o !== h && o.wp === v));
        if (!w) return abortScript(h);
        h.script.unshift(
          { go: w.stand },
          {
            fn() {
              // sit down and tuck in; the box stays on the table afterwards
              h.wp = w;
              hMove(h, w.seat[0], w.seat[1]);
              h.md = 10;
              h.seated = true;
              h.dir = w.face;
              const x = w.seat[0] + (w.face === 'right' ? 1 : -1);
              const y = w.seat[1];
              const def = ITEMS.takeout;
              const it = { key: 'takeout', def, sp: renderItem(def), x, y, home: [x, y], state: 'up', fall: null, slide: null, reset: Infinity, temp: true };
              items.push(it);
              Object.assign(errand, { item: it, phase: 'delivered', t: frame });
              h.carry = null;
              endScript(h);
              h.timer = 900;
              if (nearLeader(h.tx, h.ty, 22)) say(fmt(lines.put, null, h));
            },
          }
        );
        return;
      }
      const drop = pickDropSpot();
      if (!drop) return abortScript(h);
      const place = (tries) => () => {
        const [x, y] = drop.spot;
        if ((catAt(x, y) || humanAt(x, y)) && tries < 4) return h.script.unshift({ wait: 60 }, { fn: place(tries + 1) });
        if (objAt(x, y) || catAt(x, y)) return abortScript(h);
        h.dir = dirName(x - h.tx, y - h.ty);
        Object.assign(errand, { obj: addObject(kind, x, y), phase: 'delivered', t: frame });
        h.carry = null;
        if (nearLeader(h.tx, h.ty, 22)) say(fmt(lines.put, null, h));
      };
      h.script.unshift({ go: drop.stand }, { fn: place(0) });
    };
    startScript(
      h,
      [
        ...doorSteps(h, fmt("{h} heads out the front door. Where's {he} going?!", null, h)),
        { wait: 420 + rnd(300) },
        ...returnSteps(h),
        { fn: deliver },
      ],
      finishErrand
    );
  }

  function startTrash() {
    const h = errand.h;
    const name = ERRAND[errand.kind] && ITEMS[errand.kind].name;
    errand.phase = 'trash';
    const cleanup = () => {
      if (errand.obj && world.objects.includes(errand.obj)) removeObject(errand.obj);
      if (errand.item) {
        const i = items.indexOf(errand.item);
        if (i >= 0) items.splice(i, 1);
      }
    };
    const take = (tries) => () => {
      const o = errand.obj;
      const c = o && catAt(o.x, o.y);
      if (c && tries < 3) {
        bubble(h, '?');
        if (nearLeader(h.tx, h.ty)) say(h.name + ": '" + c.name + ", I need to throw that out...'");
        return h.script.unshift({ wait: 200 }, { fn: take(tries + 1) });
      }
      cleanup();
      h.carry = errand.kind;
    };
    const steps = [];
    if (errand.obj) {
      steps.push({ fetch: errand.obj, t: 60 * 40 });
    } else {
      const it = errand.item;
      if (it.state === 'up') steps.push({ go: it.x <= 45 ? [43, 7] : [48, 7] });
      else if (freeFloor(it.x, it.y)) steps.push({ go: [it.x, it.y] });
    }
    steps.push(
      { fn: take(0) },
      ...doorSteps(h, h.name + ' takes the ' + name + ' out with the rubbish.'),
      { wait: 300 },
      ...returnSteps(h),
      {
        fn() {
          h.carry = null;
          finishErrand();
        },
      }
    );
    startScript(h, steps, () => {
      cleanup();
      finishErrand();
    });
  }

  // A human carries the bowls somewhere, does something, and brings them back.
  //   to: where they go · work: frames spent there · after: the bowls' new state
  function bowlTrip(h, { pickLine, to, face, atLine, work, carryBack, after, putLine }) {
    bowls.busy = true;
    const spot = [bowls.x, bowls.y + 1];
    const back = () => {
      bowls.hidden = false;
      objGrid[bowls.y][bowls.x] = bowls;
      setBowls(after);
      bowls.busy = false;
      h.carry = null;
    };
    const place = (tries) => () => {
      if (catAt(bowls.x, bowls.y) && tries < 5) return h.script.unshift({ wait: 60 }, { fn: place(tries + 1) });
      h.dir = 'up';
      back();
      if (putLine) putLine();
    };
    startScript(
      h,
      [
        { go: spot },
        {
          fn() {
            h.dir = 'up';
            bowls.hidden = true;
            objGrid[bowls.y][bowls.x] = null;
            h.carry = bowls.portions ? 'bowlsFull' : 'bowls';
            if (nearLeader(h.tx, h.ty, 18)) say(fmt(pickLine, null, h));
          },
        },
        { go: to },
        {
          fn() {
            h.dir = face;
            bubble(h, '♪', 80);
            atLine();
          },
        },
        { wait: work },
        { fn: () => (h.carry = carryBack) },
        { go: spot },
        { fn: place(0) },
      ],
      back
    );
  }

  // ------------------------------------------------------------- meals
  const dineSeats = () => WAYPOINTS.filter((w) => w.act === 'eat');
  const mealName = () => {
    const hr = hourNow();
    return hr < 11 ? 'breakfast' : hr < 16.5 ? 'lunch' : 'dinner';
  };
  const mealKey = () => mealName() + calDay();
  // sitting down to (or bringing) a meal: leave them be
  const dining = (h) => !!meal && meal.phase !== 'clearing' && (h === meal.cook || h === meal.partner);
  function canCook() {
    if (meal || fired.meal === mealKey() || home.noCook()) return false;
    if (errand && errand.kind === 'takeout' && errand.phase !== 'out') return false;
    return dineSeats().every((w) => !humans.some((o) => o.wp === w && (o.seated || o.state === 'walk')));
  }
  // the plate sits on the table in front of a seat
  const plateSpot = (w) => [w.seat[0] + (w.face === 'right' ? 1 : -1), w.seat[1]];

  // Nudge a cat out of a spot a human needs: onto the same piece of furniture
  // if there's room, otherwise down to the floor.
  function scootCat(c, x, y) {
    const here = perchAt(x, y);
    const near = [[x, y - 1], [x, y + 1], [x - 1, y], [x + 1, y], [x - 2, y]];
    const ok = (a, b) => freeFloor(a, b) && !catAt(a, b) && !humanAt(a, b);
    let spot =
      near.find(([a, b]) => here && perchAt(a, b) && perchAt(a, b).obj === here.obj && !catAt(a, b) && !humanAt(a, b) && !itemAt(a, b)) ||
      near.find(([a, b]) => ok(a, b));
    // hemmed in (a dining chair between the table and the person): hop a bit further
    for (let r = 2; r <= 3 && !spot; r++)
      for (let dy = -r; dy <= r && !spot; dy++)
        for (let dx = -r; dx <= r && !spot; dx++)
          if (Math.abs(dx) + Math.abs(dy) === r && ok(x + dx, y + dy)) spot = [x + dx, y + dy];
    c.action = null;
    c.pose = 'stand';
    c.idle = 0;
    if (spot) startMove(c, spot[0], spot[1], 18);
    bubble(c, '!', 40);
  }

  // down off the table (after trying to steal food)
  function shoo(c, h) {
    const near = [[1, 0], [-1, 0], [0, 1], [0, -1], [0, -2], [0, 2], [2, 0], [-2, 0]].map(([dx, dy]) => [c.tx + dx, c.ty + dy]);
    const spot = near.find(([a, b]) => freeFloor(a, b) && !catAt(a, b) && !humanAt(a, b));
    if (!spot) return;
    if (Math.abs(spot[0] - c.tx) + Math.abs(spot[1] - c.ty) > 1) {
      // two tiles: a little leap
      c.fx = c.tx;
      c.fy = c.ty;
    }
    startMove(c, spot[0], spot[1], 16);
    if (h) bubble(h, '!', 40);
  }

  // the cook carries two plates over and sits down; the other one comes to the table
  function serveMeal(h) {
    const partner = humans[1 - h.idx];
    const seats = dineSeats();
    const mine = seats[h.idx] || seats[0];
    const theirs = seats.find((w) => w !== mine);
    meal = { cook: h, partner, mine, theirs, plates: [], endAt: Infinity, phase: 'serving', name: mealName() };
    fired.meal = mealKey();
    const name = meal.name;
    if (nearLeader(h.tx, h.ty, 18)) say(fmt('{h} finishes cooking. ' + name[0].toUpperCase() + name.slice(1) + ' is ready!', null, h));
    bubble(h, '♪', 60);
    startScript(
      h,
      [
        { fn: () => (h.carry = 'tray') },
        { go: mine.stand },
        {
          fn() {
            // set the table: one plate each
            for (const w of [mine, theirs]) {
              const [x, y] = plateSpot(w);
              const c = catAt(x, y);
              if (c) scootCat(c, x, y);
              const it = {
                key: 'plate', def: ITEMS.plate, sp: renderItem(ITEMS.plate), x, y, home: [x, y], state: 'up',
                fall: null, slide: null, reset: Infinity, temp: true, owner: w === mine ? h : partner, bites: 2,
              };
              items.push(it);
              meal.plates.push(it);
            }
            h.carry = null;
            const [sx, sy] = mine.seat;
            const c = catAt(sx, sy);
            if (c) scootCat(c, sx, sy);
            endScript(h);
            h.wp = mine;
            hMove(h, sx, sy);
            h.md = 10;
            h.seated = true;
            h.dir = mine.face;
            meal.phase = 'eating';
            meal.endAt = frame + 60 * 16;
            h.timer = meal.endAt - frame;
            if (partner.seated && partner.wp === theirs) return;
            if (nearLeader(h.tx, h.ty, 16)) say(fmt(pick(['{h}: "{name} is on the table!"', '{h} sets two plates down and calls {his} ' + (h.idx === 0 ? 'wife' : 'husband') + ' over.']).replace('{name}', name[0].toUpperCase() + name.slice(1)), null, h));
          },
        },
      ],
      () => {
        // something went wrong on the way: no meal after all
        h.carry = null;
        meal = null;
      }
    );
    // the other one drops what they're doing and comes to the table
    joinMeal(partner);
  }

  // false if they can't come right now (asleep, out, mid-errand...): they'll
  // try again the next time they pick something to do
  function joinMeal(p) {
    if (!meal || p !== meal.partner || !awake(p) || p.bedtime || p.state === 'script') return false;
    if (p.wp === meal.theirs && (p.seated || p.state === 'walk')) return true;
    if (p.seated && p.wp.act === 'toilet') return false;
    return goToWaypoint(p, meal.theirs);
  }

  // when the meal is over the cook collects the plates and takes them to the sink
  function clearMeal(h) {
    meal.phase = 'clearing';
    const plates = meal.plates;
    const finish = () => {
      for (const it of plates) {
        const i = items.indexOf(it);
        if (i >= 0) items.splice(i, 1);
      }
      h.carry = null;
      meal = null;
    };
    startScript(
      h,
      [
        {
          fn() {
            for (const it of plates) {
              const i = items.indexOf(it);
              if (i >= 0) items.splice(i, 1);
            }
            h.carry = 'trayEmpty';
            if (nearLeader(h.tx, h.ty, 14)) say(fmt(pick(['{h} clears the table.', '{h} stacks the plates. Not a crumb left for the cats.']), null, h));
          },
        },
        { go: [42, 15] },
        { fn: () => ((h.dir = 'up'), bubble(h, '♪', 60)) },
        { wait: 120 },
        { fn: finish },
      ],
      finish
    );
  }

  // a cat goes for a plate on the table
  function stealFood(cat, it) {
    const owner = it.owner;
    const name = meal ? meal.name : 'food';
    const there = owner && !owner.away && owner.seated && owner.wp.act === 'eat';
    if (it.bites <= 0) {
      act(cat, 'look', 40);
      return say(fmt("Nothing left on {h}'s plate but a smear. {c} licks it anyway.", cat, owner));
    }
    it.bites--;
    mend(MEND.bite);
    if (it.bites <= 0) it.sp = renderItem(ITEMS.plateEmpty);
    act(cat, 'eat', 40, { shoo: there ? owner : null });
    let text = fmt(pick(["{c} steals a bite of {h}'s " + name + '.', "{c} sticks his whole face in {h}'s plate.", "{c} paws a piece of {h}'s " + name + ' off the plate.']), cat, owner);
    if (there) {
      bubble(owner, '!!', 70);
      text += '\n' + fmt(pick(flat('steal.scold', ["{h}: '{c}!! That's MY " + name + "!'", '{h}: "Off the table! Now!"', '{h}: "You have your OWN food, {c}!"'], cat)), cat, owner);
      if (it.bites <= 0) text += '\n' + fmt("{h} stares at the empty plate. Then at {c}.", cat, owner);
    }
    say(text);
  }

  // 7pm: wet food
  function startFeeding(h) {
    bowlTrip(h, {
      pickLine: '{h} picks up the bowls. Wet food time!',
      to: [40, 15],
      face: 'up',
      atLine() {
        // every cat in the home hears a can being opened
        sfx.crunch();
        if (flatNow() !== 'scarf') for (const c of cats) bubble(c, '!', 50);
        if (flatNow() === 'home') say(fmt(pick(flat('can', ['{h} opens a can at the kitchen island. THAT sound. Every cat ear turns.'])), null, h));
      },
      work: 240,
      carryBack: 'bowlsFull',
      after: 'full',
      putLine() {
        if (!outside) wakeUp();
        if (nearLeader(h.tx, h.ty, 18)) say(fmt('{h} puts the bowls down. Dinner is served!', null, h));
      },
    });
  }

  // after the cats have eaten, or at 10pm if they never did
  function startClearing(h) {
    const uneaten = bowls.state === 'full';
    const half = bowls.state === 'half';
    bowlTrip(h, {
      pickLine: uneaten
        ? '{h} clears away the untouched wet food. Nobody wanted it? Really?'
        : half
          ? '{h} clears away the bowls. One portion went uneaten tonight.'
          : '{h} collects the licked-clean bowls.',
      to: [42, 15],
      face: 'up',
      atLine() {
        if (nearLeader(h.tx, h.ty, 14)) sfx.poof();
      },
      work: 150,
      carryBack: 'bowls',
      after: 'clean',
    });
  }

  // things that happen at set times of day
  function updateClock() {
    // (one night of Act 2 stands still until the story lets it go)
    // (the clock stands still while the story holds it: Act 2's late night, and the last night of Act 3)
    if (!story.flags.holdClock && !story.flags.quietGarden && !story.flags.nightHold) clock += MIN_PER_FRAME;
    const hr = hourNow();
    const day = calDay();
    const free = (v) => !story.flags.holdHumans && v.state === 'activity' && awake(v) && !v.bedtime && !v.pet && !v.moving && !dining(v);
    if (hr >= 6 && hr < 12 && fired.kibble !== day) {
      fired.kibble = day;
      setFeeder(2);
      sfx.beep();
      sfx.whirr(0.6);
      feeder.shake = 20;
      if (flatNow() !== 'scarf') for (const c of cats) bubble(c, '!', 50);
      if (outside) story.adopted && say('6:00 AM. Somewhere upstairs, a kibble machine whirs. Breakfast is waiting.');
      else if (flatNow() === 'home') {
        wakeUp();
        say('6:00 AM. The kibble machine whirs to life. Breakfast is served: one portion each!');
      }
    }
    if (hr >= 18.25 && hr < 21.5 && fired.feed !== day && bowls.state === 'clean' && !bowls.busy) {
      const h = humans.find(free);
      if (h) {
        fired.feed = day;
        startFeeding(h);
      }
    }
    const leftover = (bowls.state === 'full' || bowls.state === 'half') && (hr >= 22 || hr < 12);
    if (meal && meal.phase !== 'clearing' && frame % 30 === 0) {
      const p = meal.partner;
      const busy = p.state === 'activity' && p.wp.act === 'toilet';
      if ((p.state === 'activity' || p.state === 'walk') && !(p.wp === meal.theirs) && !busy) joinMeal(p);
    }
    if (!bowls.busy && !home.noChores() && (leftover || (bowls.state === 'eaten' && frame - bowls.eatenAt > 60 * 8))) {
      const h = humans.find(free);
      if (h) startClearing(h);
    }
    const ph = phaseOf(hr);
    if (ph !== lastPhase) {
      lastPhase = ph;
      banner = { text: PHASE_NAME[ph], t: 180 };
    }
    setPlace(outside ? 'garden' : 'apartment'); // each has its own music
  }

  // which tune: the night-time one after dark, and whenever the story wants it whatever the hour
  // (the opening, until the first fight: it starts a little before dawn)
  function tuneIn() {
    setNight(story.flags.nightMusic ? 1 : nightAmount(hourNow()));
  }
  // 0 by day, 1 deep in the night: past the middle, the night-time music takes over
  function nightAmount(hr) {
    if (hr >= 21 || hr < 5) return 1;
    if (hr >= 19) return (hr - 19) / 2;
    if (hr < 7) return (7 - hr) / 2;
    return 0;
  }

  function updateHuman(h) {
    if (h.moving) return moveEntity(h);
    if (h.pet > 0) {
      h.pet--;
      return;
    }
    // (the story may be keeping this one where they are: out of the way, or on the sofa)
    if (home.human(h)) return;
    if (h.state === 'script') return runScript(h);
    if (h.state === 'activity') {
      if (h.asleep) {
        if (wakeUpFor(h)) wake(h);
        else if (frame % 90 === h.idx * 45) spawn('glyph', h.px + 6, h.py - 4, { vy: -0.25, vx: 0.12, life: 60, ch: 'z', color: C.white });
        return;
      }
      if (bedtimeFor(h) && !h.bedtime) {
        h.bedtime = true;
        h.timer = Math.min(h.timer, 40);
      }
      if (meal && meal.phase === 'eating' && (h === meal.cook || h === meal.partner) && h.wp.act === 'eat' && h.seated)
        h.timer = Math.max(1, meal.endAt - frame);
      h.timer--;
      const a = h.wp.act;
      if (h.timer % 260 === 100 && Math.random() < 0.5) {
        const e = { tv: '♪', cook: '♪', work: '...', coffee: '♥', eat: '♪', view: '...', toilet: '...' }[a];
        if (e) bubble(h, e, 60);
      }
      if (a === 'tv' && h.seated && !h.moving && h.timer % 420 === 200 && (!tvObj.ch || Math.random() < 0.5)) {
        const was = tvObj.ch;
        setTV((tvObj.ch % 3) + 1);
        if (nearLeader(h.tx, h.ty)) say(fmt(was ? '{h} flips to another channel.' : '{h} turns on the TV.', null, h));
      }
      if (h.timer <= 0) pickNext(h);
      return;
    }
    // walking to a waypoint
    if (!h.path.length) {
      const w = h.wp;
      h.state = 'activity';
      h.timer = w.act === 'toilet' ? 300 + rnd(240) : w.act === 'sleep' ? 900 + rnd(900) : 480 + rnd(900);
      h.dir = w.face;
      if (w.seat) {
        const [sx, sy] = w.seat;
        let c = catAt(sx, sy);
        let scooted = false;
        if (c && ((w.act === 'sleep' && h.bedtime) || (w.act === 'eat' && meal)) && !c.moving && !c.riding) {
          scooted = true;
          // bedtime wins: the cat gets scooted over
          scootCat(c, sx, sy);
          if (nearLeader(h.tx, h.ty, 12))
            say(fmt(w.act === 'sleep' ? '{h} scoots {c} off the pillow. "Move over, {c}. My turn."' : '{h} lifts {c} off the chair. "Sorry, {c}. Dinner time."', c, h));
          c = null;
        }
        if (c) {
          h.dir = dirName(sx - h.tx, sy - h.ty);
          h.timer = 150;
          bubble(h, '?');
          if (nearLeader(h.tx, h.ty, 9)) say(h.name + ": '" + c.name + ", that's my spot...'");
        } else {
          hMove(h, sx, sy);
          h.md = 9 * Math.max(1, Math.abs(sx - h.fx) + Math.abs(sy - h.fy));
          h.seated = true;
          h.dir = w.face;
          if (meal && w.act === 'eat' && h === meal.partner && nearLeader(h.tx, h.ty, 14) && !scooted)
            say(fmt(pick(['{h} sits down to eat with {p}.', '{h}: "Smells great!"']).replace('{p}', meal.cook.name), null, h));
          if (w.act === 'sleep' && h.bedtime) {
            h.asleep = true;
            h.timer = Infinity;
            h.wakeAt = wakeTime(hourNow());
            if (!scooted && nearLeader(h.tx, h.ty, 10)) say(fmt('{h} gets into bed. Lights out soon.', null, h));
          }
        }
      }
      return;
    }
    if (!walkStep(h, h.path)) {
      h.wait = 0;
      pickNext(h);
    }
  }

  // -------------------------------------------------------------- update
  function updateItems() {
    for (const it of items) {
      if (it.slide && --it.slide.t <= 0) it.slide = null;
      if (it.state !== 'fallen') continue;
      if (it.fall) {
        it.fall.t++;
        if (it.fall.t === 16) {
          sfx.crash();
          burst(it.x * T + 8, it.y * T + 10, it.def.spill, 9);
          it.fall = null;
        }
        continue;
      }
      if (--it.reset <= 0) {
        const [hx, hy] = it.home;
        if (catAt(hx, hy)) {
          it.reset = 120;
          continue;
        }
        burst(it.x * T + 8, it.y * T + 8, C.white, 6);
        it.x = hx;
        it.y = hy;
        it.state = 'up';
        burst(hx * T + 8, hy * T, C.white, 6);
        const L = cats[leader];
        if (Math.abs(L.tx - hx) + Math.abs(L.ty - hy) < 10) {
          sfx.poof();
          say(fmt(pick(flat('knock.back', ['{h} put the {n} back. *sigh*'])), null, pick(humans)).replace('{n}', it.def.name));
        }
      }
    }
  }

  const HOLD = 30; // frames of holding Do before a nap starts
  const SHEET_HOLD = 20; // frames of holding the swap button before the cats' sheet comes up
  const NAP_FAST = 11; // extra ticks a frame once a nap is under way
  function update() {
    tick(false);
    // a nap that has gone on for a couple of seconds runs the clock fast
    if (nap && nap.t > 120 && mode === 'play' && !scene && !dialog.active && !fade) for (let i = 0; i < NAP_FAST && nap && !scene; i++) tick(true);
  }
  // one frame of the world. fast: an extra frame during a nap, with nobody at the controls.
  function tick(fast) {
    frame++;
    if (mode === 'title') {
      updateCamera(true);
      return;
    }
    setPlace(outside ? 'garden' : 'apartment'); // each has its own music (and a scene straight after a fight is not the fight)
    if (frame % 30 === 0) tuneIn();
    if (treed && (scene || fade)) leaveTree();
    if (scene) {
      goalWait = 0;
      return runScene();
    }
    weather();
    if (dialog.active) {
      idleTraffic();
      return dialog.update();
    }
    // a new goal gets a box of its own, a frame late: a scene the story starts on this frame (as on a
    // load or a jump straight into one) goes first, and says its own goal if it has one
    if (!fade && !fast && story.goal !== shownGoal) {
      if (goalWait++) {
        goalWait = 0;
        goalBox();
        if (dialog.active) return;
      }
    } else goalWait = 0;

    updateClock();
    if (frame % 60 === 0) updatePickups();
    const napping = !!(cats[leader].action && cats[leader].action.type === 'nap');
    if (!napping) nap = null;
    else if (nap) {
      nap.t++;
      // asleep, they get a little HP back: at most MEND.nap between one fight (or car) and the next, however
      // many naps it takes (story.napLeft is what is left of it), so that napping again and again gives no more
      const hurt = pairKinds().some((k) => hurtOf(story, k) > 0);
      if (keepsHurt(story) && hurt && (story.napLeft || 0) > 0) {
        const d = Math.min(story.napLeft, MIN_PER_FRAME / (60 * MEND.napHours) * MEND.nap);
        story.napLeft -= d;
        mend(d);
      }
    }
    if (fade) {
      fade.t++;
      if (fade.t === FADE + (FADE_HOLD >> 1)) changeFloor(fade.down);
      if (fade.t >= FADE * 2 + FADE_HOLD) fade = null;
    }
    const L = cats[leader];
    const F = cats[1 - leader];
    for (const c of cats) if (c.moving) moveEntity(c);
    if (!input.dir()) {
      bump.t = 0;
      bump.lock = false;
      bump.dir = null;
    }

    // the swap button: let go quickly and the cats swap; held, it shows their sheet
    if (!fast && story.flags.solo) {
      // Shark is alone: nobody to swap with, and no sheet yet
      input.take('swap');
      swapT = 0;
      swapWant = false;
    } else if (!fast) {
      if (input.take('swap')) swapT = 1;
      else if (swapT && input.isHeld('swap')) {
        if (++swapT >= SHEET_HOLD) {
          swapT = 0;
          if (host.showCats) host.showCats();
        }
      } else if (swapT) {
        swapT = 0;
        // (at some points of Act 2 only one of them may lead: the sheet still comes up when the button is held)
        const no = home.noSwap();
        swapWant = !no;
        if (no) say(no);
      }
    }
    if (gride || bolt || L.riding || fade || (L.action && L.action.type !== 'nap')) {
      // busy: presses made now are not saved up for later
      input.take('meow');
      hold = 0;
      swapWant = false;
    }
    if (treed) treeHold();
    else if (gride) {
      updateRide2();
      input.take('a');
      input.take('swap');
    } else if (bolt) {
      // running away: no steering until they have got clear
      input.take('a');
      input.take('swap');
      if (!L.moving && !F.moving) {
        const [x, y] = bolt.shift();
        const ox = L.tx;
        const oy = L.ty;
        if (strays.at(x, y) || people.at(x, y) || dogs.at(x, y)) bolt = [];
        else {
          const bx = F.tx;
          const by = F.ty;
          startMove(L, x, y, CONFIG.runFrames);
          if (F.tx === x && F.ty === y) startMove(F, ox, oy, L.md);
          else if (F.tx !== ox || F.ty !== oy) {
            startMove(F, ox, oy, L.md);
            if (guest) strays.trail(guest, bx, by, L.md);
          }
          F.md = L.md = Math.max(F.md, L.md);
        }
        if (!bolt.length) bolt = null;
      }
    } else if (L.riding) {
      updateRide(L);
      input.flush();
    } else if (L.action) {
      if (L.action.type === 'nap') {
        // any button wakes them (but not the one still held down from starting the nap)
        if (!fast && (input.dir() || input.take('a') || input.take('meow') || swapWant)) {
          swapWant = false;
          L.action = null;
          if (F.action && F.action.type === 'nap') F.action = null;
        }
      } else {
        input.take('a');
      }
      if (L.action) updateAction(L);
    } else if (fade) {
      input.take('a');
      input.take('swap');
    } else if (!L.moving && !F.moving) {
      if (swapWant) {
        swapWant = false;
        leader = 1 - leader;
        hold = 0;
        if (guest) guest.following = cats[1 - leader];
        sfx.swap();
        bubble(cats[leader], '!', 40);
        say(cats[leader].name + ' takes the lead!');
      } else if (input.take('meow')) {
        hold = 0;
        pressMeow();
      } else if (input.take('a')) hold = pressDo() ? 0 : 1;
      else if (hold && input.isHeld('a')) {
        // nothing to do here: keep holding and it is nap time (once he has been shown how)
        if (story.flags.noNap) hold = 0;
        else if (++hold >= HOLD) {
          hold = 0;
          startNap();
        }
      } else {
        hold = 0;
        // (the opening's first lesson is the meow, and nothing else: he does not walk until it is done)
        const d = story.flags.noWalk ? null : input.dir();
        if (d) tryMove(d);
        else {
          bump.t = 0;
          bump.lock = false;
          bump.dir = null;
        }
      }
    }
    if (F.action && F !== cats[leader]) updateAction(F);

    for (const [k, v] of rustles) v > 1 ? rustles.set(k, v - 1) : rustles.delete(k);
    for (const e of extras) if (e.moving) moveEntity(e);
    if (outside) {
      traffic.update();
      // the middle of anybody in the party, on the road, with something coming: all of them are knocked back
      if (!bolt && !fade && !gride)
        for (const e of party()) {
          const v = traffic.hitAt(e.px - GOX * T + 8, Math.floor((e.py + 8) / T));
          if (v) {
            roadHit(v, e);
            break;
          }
        }
    }
    quests.update();
    home.update();
    act3.update();
    if (scene) return; // the story has just started a scene
    strays.update(frame);
    if (outside) people.update(frame);
    dogs.update(frame);
    for (const c of cats) {
      if (gride && gride.parts.some((p) => p.cat === c && !p.landed)) continue;
      if (c.moving || c.action || c.riding) {
        c.idle = 0;
        if (!c.riding) c.pose = c.action ? c.pose : 'stand';
        continue;
      }
      c.idle++;
      const lazy = c === cats[leader] ? 1 : 0.6;
      const hr = hourNow();
      const sleepy = hr >= 22 || hr < 6 ? 1260 : 1500;
      if (c.idle > sleepy * lazy) {
        c.pose = 'sleep';
        if (c.idle % 90 === 0) spawn('glyph', c.px + 10, c.py - 2 - c.z, { vy: -0.25, vx: 0.12, life: 60, ch: 'z', color: C.white });
      } else if (c.idle > 150 * lazy) c.pose = 'sit';
    }
    // the follower looks at whatever the leader is up to
    const Lc = cats[leader];
    const Fc = cats[1 - leader];
    if (Lc.action && !Fc.moving && !Fc.action && Lc.action.type !== 'meow' && !gride) {
      Fc.pose = 'sit';
      Fc.dir = dirName(Math.sign(Lc.tx - Fc.tx), Lc.tx === Fc.tx ? Math.sign(Lc.ty - Fc.ty) : 0);
    }

    for (const h of humans) updateHuman(h);
    if (errand && errand.phase === 'delivered' && frame - errand.t > 60 * 75) {
      const h = errand.h;
      if (h.state === 'activity' && awake(h) && !h.bedtime && !h.pet && !h.moving && !dining(h)) startTrash();
    }
    updateItems();
    for (const o of world.objects) {
      if (o.push) {
        o.push.t--;
        o.dx = (-o.push.dx * T * o.push.t) / o.push.d;
        o.dy = (-o.push.dy * T * o.push.t) / o.push.d;
        if (o.push.t <= 0) {
          o.push = null;
          o.dx = o.dy = 0;
        }
      }
      if (o.shake > 0) o.shake--;
      if (o.spin > 0) o.spin--;
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g;
      if (--p.life <= 0) particles.splice(i, 1);
    }
    for (let i = bubbles.length - 1; i >= 0; i--) if (--bubbles[i].t <= 0) bubbles.splice(i, 1);
    if (caption && !fast) {
      caption.t++;
      const total = caption.pages[caption.i].length;
      const last = caption.i === caption.pages.length - 1;
      if (captionQueue.length && (caption.keep ? caption.t >= readTime(total) : caption.t >= MIN_CAPTION)) {
        // something is waiting: finish this caption's pages quickly, then move on
        if (last) showCaption(captionQueue.shift());
        else {
          caption.i++;
          caption.lines = wrapText(caption.pages[caption.i], VW - 26);
          caption.n = 0;
          caption.t = 0;
        }
      } else if (caption.n < total) caption.n = Math.min(total, caption.n + 1.5);
      else if (caption.t > total / 1.5 + (last ? 190 : 100)) {
        if (last) caption = captionQueue.length ? (showCaption(captionQueue.shift()), caption) : null;
        else {
          caption.i++;
          caption.lines = wrapText(caption.pages[caption.i], VW - 26);
          caption.n = 0;
          caption.t = 0;
        }
      }
    }
    if (banner && !fast && --banner.t <= 0) banner = null;

    const r = outside ? (fade ? '' : gardenArea(Lc.tx - GOX, Lc.ty)) : roomAt(Lc.tx, Lc.ty);
    if (r && r !== room) {
      room = r;
      // (no names of rooms in somebody else's flat: the cats do not know it)
      banner = !outside && flatNow() !== 'home' ? null : { text: r, t: 150 };
      if (r === 'Balcony' && isDark() && frame - balconySaidAt > 60 * 40) {
        balconySaidAt = frame;
        sfx.meow(Lc.cfg.meow * 0.8);
        say(fmt(pick(flat('stray', STRAY_LINES, Lc)), Lc));
      }
    }
    updateCamera(false);
  }

  function updateCamera(snap) {
    let L = cats[leader];
    if (scene && scene.cam) L = Array.isArray(scene.cam) ? { px: scene.cam[0] * T, py: scene.cam[1] * T } : actor(scene.cam) || L;
    const ease = (scene && scene.camEase) || 0.25;
    if (outside) {
      const gx = L.px + 8 - VW / 2;
      cam.x = Math.max((GOX + GX0) * T, Math.min((GOX + GX0 + GW) * T - VW, snap || Math.abs(gx - cam.x) < 0.5 ? gx : cam.x + (gx - cam.x) * ease));
      const gy = Math.max(0, Math.min(GH * T - VH + 46, L.py + 8 - VH / 2 - 6));
      cam.y = snap || Math.abs(gy - cam.y) < 0.5 ? gy : cam.y + (gy - cam.y) * ease;
      return;
    }
    // the view keeps to the flat that whoever it follows is in: the other one is never seen from it
    const [fx0, fy0, fx1, fy1] = FLATS[flatAt(Math.round(L.px / T), Math.round(L.py / T))];
    const tx = Math.max(fx0 * T, Math.min((fx1 + 1) * T - VW, L.px + 8 - VW / 2));
    // the view may run past the top and bottom of the map, so the badges in the
    // top-right and the caption box at the bottom never sit over the cats
    const ty = Math.max(fy0 * T - 32, Math.min((fy1 + 1) * T - VH + 46, L.py + 8 - VH / 2 - 6));
    if (snap || Math.abs(tx - cam.x) > VW * 1.5) {
      cam.x = tx;
      cam.y = ty;
    } else {
      cam.x += (tx - cam.x) * 0.25;
      cam.y += (ty - cam.y) * 0.25;
      if (Math.abs(tx - cam.x) < 0.5) cam.x = tx;
      if (Math.abs(ty - cam.y) < 0.5) cam.y = ty;
    }
  }

  // ---------------------------------------------------------------- draw
  function catSprite(cat) {
    const sp = cat.sp;
    const a = cat.action;
    if (cat.riding) return sp.sit[cat.dir];
    if (cat.gwalk) return sp.walk[cat.dir][(frame >> 2) & 1];
    if (curtainAt(cat.tx, cat.ty) || (cat.moving && curtainAt(cat.fx, cat.fy)))
      return cat.moving ? sp.walk.up[Math.floor((cat.mt * 2) / cat.md) % 2] : sp.stand.up;
    if (cat.moving) return sp.walk[cat.dir][Math.floor((cat.mt * 2) / cat.md) % 2];
    if (a) {
      switch (a.type) {
        case 'nap':
          return cat.dir === 'right' ? sp.sleepR : sp.sleep;
        case 'scratch':
        case 'chew':
        case 'eat':
          return sp.walk[cat.dir][(a.t >> 3) & 1];
        case 'purr':
          return cat.dir === 'down' || (a.t >> 4) & 1 ? sp.blink : sp.sit[cat.dir];
        case 'roll':
          return (a.t >> 3) & 1 ? sp.sleepR : sp.sleep;
        default:
          return sp.sit[cat.dir];
      }
    }
    if (cat.pose === 'sleep') return cat.dir === 'right' ? sp.sleepR : sp.sleep;
    if (cat.pose === 'sit') return cat.dir === 'down' && cat.idle % 200 > 192 ? sp.blink : sp.sit[cat.dir];
    return sp.stand[cat.dir];
  }

  function drawBubble(g, cx, top, text) {
    const w = textWidth(text) + 6;
    const x = Math.round(Math.max(1, Math.min(VW - w - 1, cx - w / 2)));
    const y = Math.round(Math.max(1, top - 13));
    R(g, x + 1, y, w - 2, 12, C.k);
    R(g, x, y + 1, w, 10, C.k);
    R(g, x + 1, y + 1, w - 2, 10, C.white);
    const tx = Math.round(Math.max(x + 3, Math.min(x + w - 6, cx - 1)));
    R(g, tx, y + 11, 3, 2, C.k);
    P(g, tx + 1, y + 11, C.white);
    P(g, tx + 1, y + 13, C.k);
    drawText(g, text, x + 3, y + 2, text === '♥' ? C.red : C.k);
  }

  function drawPanel(g, x, y, w, h) {
    R(g, x + 1, y, w - 2, h, C.k);
    R(g, x, y + 1, w, h - 2, C.k);
    R(g, x + 1, y + 1, w - 2, h - 2, C.cream);
    R(g, x + 2, y + 2, w - 4, 1, C.white);
    R(g, x + 2, y + h - 3, w - 4, 1, C.beige);
  }

  // which painted sky to show: [from, to, mix]
  const SKY_KEYS = [[0, 'night'], [5.2, 'night'], [6.2, 'dusk'], [7.4, 'day'], [17.2, 'day'], [18.4, 'dusk'], [19.6, 'night'], [24, 'night']];
  function skyBlend(hr) {
    for (let i = 0; i < SKY_KEYS.length - 1; i++) {
      const [h0, a] = SKY_KEYS[i];
      const [h1, b] = SKY_KEYS[i + 1];
      if (hr >= h0 && hr < h1) return [a, b, a === b ? 0 : (hr - h0) / (h1 - h0)];
    }
    return ['night', 'night', 0];
  }

  // the tint laid over the whole home: [hour, r, g, b, alpha]
  const TINT_KEYS = [
    [0, 14, 18, 48, 0.62], [5.2, 14, 18, 48, 0.62], [6.2, 110, 70, 100, 0.3], [7, 255, 190, 140, 0.06],
    [7.6, 255, 220, 180, 0], [21.8, 30, 30, 70, 0], [22.5, 14, 18, 48, 0.6], [24, 14, 18, 48, 0.62],
  ];
  function tintAt(hr, keys = TINT_KEYS) {
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i];
      const b = keys[i + 1];
      if (hr >= a[0] && hr < b[0]) {
        const t = (hr - a[0]) / (b[0] - a[0]);
        return [1, 2, 3, 4].map((k) => lerp(a[k], b[k], t));
      }
    }
    return keys[0].slice(1);
  }

  // A sunbeam from the north windows that slides across the living room.
  // Returns the patches as [x, y, w, h, shear] in pixels.
  // 0 before 9am, building through the day to a peak around 4:30pm, gone by 6pm
  function sunStrength(hr) {
    if (hr < 9 || hr >= 18) return 0;
    if (hr < 16.5) return Math.pow((hr - 9) / 7.5, 1.5);
    return (18 - hr) / 1.5;
  }
  function sunPatches(hr) {
    if (sunStrength(hr) <= 0) return [];
    const t = (hr - 9) / 9;
    // the low afternoon sun throws a longer, more slanted beam
    const shear = lerp(20, -44, t);
    const y = 2 * T + 6;
    const h = Math.round(lerp(26, 58, t));
    return [
      [36 * T + 4, y, 5 * T, h, shear],
      [44 * T + 8, y, 3 * T, h, shear],
    ];
  }
  function inSunbeam(tx, ty) {
    const px = tx * T + 8;
    const py = ty * T + 8;
    if (sunStrength(hourNow()) < 0.2) return false;
    return sunPatches(hourNow()).some(([x, y, w, h, sh]) => {
      const j = py - y;
      if (j < 0 || j >= h) return false;
      const x0 = x + (sh * j) / h;
      return px >= x0 && px < x0 + w;
    });
  }
  function drawSunbeam(g, hr, cx, cy) {
    const fade = sunStrength(hr);
    if (fade <= 0) return;
    // warmer as the afternoon goes on
    const warm = Math.max(0, (hr - 14) / 4);
    g.fillStyle = 'rgba(255,' + Math.round(244 - 40 * warm) + ',' + Math.round(196 - 70 * warm) + ',' + (0.42 * fade).toFixed(3) + ')';
    for (const [x, y, w, h, sh] of sunPatches(hr))
      for (let j = 0; j < h; j++) g.fillRect(Math.round(x + (sh * j) / h) - cx, y + j - cy, w, 1);
  }

  // stepped (pixel) ellipse
  function blob(c, x, y, rx, ry) {
    for (let j = -ry; j <= ry; j++) {
      const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry + 0.5))));
      c.fillRect(Math.round(x - half), Math.round(y + j), half * 2, 1);
    }
  }

  // half an ellipse opening to the right, from a straight edge at x
  // half an ellipse from a straight edge at x, opening east (dir 1) or west (-1)
  function fan(c, x, y, rx, ry, dir = 1) {
    for (let j = -ry; j <= ry; j++) {
      const len = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry + 0.5))));
      c.fillRect(dir > 0 ? Math.round(x) : Math.round(x) - len, Math.round(y + j), len, 1);
    }
  }
  // is a screen on? the TV by its channel, a monitor while someone works at it
  const screenOn = (l) =>
    l.id === 'tv' ? tvObj.ch > 0 : humans.some((h) => h.seated && !h.moving && !h.away && h.state === 'activity' && h.wp.id === l.id);

  // ...and over a flat with nobody home and no lamp on (Purple Scarf's, while she is out): dark from dusk
  const UNLIT_KEYS = [
    [0, 10, 13, 40, 0.72], [5.2, 10, 13, 40, 0.72], [6.2, 110, 70, 100, 0.3], [7, 255, 190, 140, 0.06],
    [7.6, 255, 220, 180, 0], [17.6, 60, 40, 80, 0], [18.6, 30, 26, 70, 0.4], [19.4, 10, 13, 40, 0.7], [24, 10, 13, 40, 0.72],
  ];
  function drawLighting(g, hr, cx, cy) {
    const [r, gg, b, a] = tintAt(hr, flatNow() === 'scarf' && !flatLit.scarf ? UNLIT_KEYS : TINT_KEYS);
    // who is up decides which lamps are on
    const up = humans.some((h) => awake(h));
    const goingToBed = humans.some((h) => h.bedtime && !h.asleep && !h.away);
    // bedside lamps: on from 10pm (or when someone heads to bed) until both are asleep
    const bedLamps = goingToBed || ((hr >= 21.8 || hr < 6) && up && !humans.some((h) => h.asleep));
    for (const l of lights) {
      const on = a > 0.12 && (l.group === 'master' ? bedLamps : l.group === 'scarf' ? flatLit.scarf : up);
      l.level += ((on ? 1 : 0) - l.level) * 0.05;
    }
    for (const l of screens) l.level += ((screenOn(l) ? 1 : 0) - l.level) * 0.1;
    // Purple Scarf's rooms: white paint and pale tile have a cold cast by day as well (more of it under her lights)
    const roomRect = (l) => [l.rect[0] * T - cx, (l.rect[1] - 1) * T - cy, (l.rect[2] - l.rect[0] + 1) * T, (l.rect[3] - l.rect[1] + 2) * T];
    g.fillStyle = 'rgba(196,222,255,0.07)';
    for (const l of ROOM_LIGHTS) if (!l.warm) g.fillRect(...roomRect(l));
    if (a < 0.005) return;
    lg.globalCompositeOperation = 'copy';
    lg.fillStyle = 'rgba(' + (r | 0) + ',' + (gg | 0) + ',' + (b | 0) + ',' + a.toFixed(3) + ')';
    lg.fillRect(0, 0, VW, VH);
    lg.globalCompositeOperation = 'destination-out';
    lg.fillStyle = 'rgba(0,0,0,0.45)';
    for (const [x, y, w, h] of world.glassRects) lg.fillRect(x - cx, y - cy, w, h);
    // a flat with only ceiling lights: each room lit from wall to wall (and the wall above it), all alike
    const lit = ROOM_LIGHTS.filter((l) => flatLit[l.flat]).map(roomRect);
    lg.fillStyle = 'rgba(0,0,0,0.86)';
    for (const [x, y, w, h] of lit) lg.fillRect(x, y, w, h);
    const glow = [];
    for (const l of [...lights, ...screens]) {
      if (l.level < 0.02) continue;
      const x = l.x * T - cx;
      const y = l.y * T - cy;
      if (x < -l.r || y < -l.r || x > VW + l.r || y > VH + l.r) continue;
      const ry = l.ry || 0.75;
      for (const k of l.screen ? [1, 0.86, 0.72, 0.58, 0.44, 0.3] : [1, 0.72, 0.46]) {
        lg.fillStyle = 'rgba(0,0,0,' + ((l.screen ? 0.1 : 0.34) * l.level).toFixed(3) + ')';
        if (l.screen) fan(lg, x, y, l.r * k, Math.round(l.r * k * ry), l.dir);
        else blob(lg, x, y, l.r * k, Math.round(l.r * k * ry));
      }
      glow.push([l, x, y, ry]);
    }
    g.drawImage(lightCv, 0, 0);
    // ...and cold: the white of a bulb that was the cheapest in the shop
    g.fillStyle = 'rgba(196,222,255,' + (0.16 * a).toFixed(3) + ')';
    for (const [x, y, w, h] of lit) g.fillRect(x, y, w, h);
    // a little warmth (or screen blue) in the middle of each pool of light
    for (const [l, x, y, ry] of glow) {
      if (l.screen) {
        g.fillStyle = 'rgba(140,180,255,' + (0.07 * l.level * a).toFixed(3) + ')';
        fan(g, x, y, l.r * 0.7, Math.round(l.r * 0.7 * ry), l.dir);
        continue;
      }
      g.fillStyle = (l.cold ? 'rgba(196,222,255,' : 'rgba(255,196,110,') + (0.16 * l.level * a).toFixed(3) + ')';
      blob(g, x, y, l.r * 0.5, Math.round(l.r * 0.5 * ry));
      if (l.obj && l.level > 0.3) {
        // the lampshade itself glows
        const [sx, sy, sw, sh] = l.obj.def.shade;
        g.fillStyle = 'rgba(255,228,150,' + (0.85 * l.level).toFixed(3) + ')';
        g.fillRect(l.obj.x * T + sx + 1 - cx, l.obj.y * T - l.obj.def.up + sy + 1 - cy, sw - 2, sh - 2);
      }
    }
  }

  function drawWorld(g) {
    const cx = Math.round(cam.x);
    const cy = Math.round(cam.y);
    const hr = hourNow();
    const [ga, gb, gt] = skyBlend(hr);
    g.drawImage(world.grounds[ga], -cx, -cy);
    if (gt > 0) {
      g.globalAlpha = gt;
      g.drawImage(world.grounds[gb], -cx, -cy);
      g.globalAlpha = 1;
    }
    drawSunbeam(g, hr, cx, cy);

    const list = [];
    for (const o of world.objects) {
      if (o.hidden) continue;
      const x = o.x * T + o.dx - cx;
      const y = o.y * T + o.dy - o.def.up - cy;
      if (x > VW || y > VH || x + o.sprite.width < 0 || y + o.sprite.height < 0) continue;
      list.push({ key: o.dx || o.dy ? o.y * T + o.dy + T : o.sortY, o });
    }
    for (const it of items) {
      if (it.state === 'up') {
        const p = perchAt(it.x, it.y);
        list.push({ key: (p ? p.obj.sortY : it.y * T + T) + 1, it, h: p ? p.h : 0 });
      } else list.push({ key: it.fall ? 99999 : it.y * T + 2, it });
    }
    for (const pk of pickups) {
      if (pk.by !== null || pk.floor !== 'apt') continue;
      const p = perchAt(pk.x, pk.y);
      list.push({ key: p ? p.obj.sortY + 1.5 : pk.y * T + 3, pk, h: p ? p.h : 0 });
    }
    for (const c of cats) {
      if (c.hidden) continue;
      let key = c.py + T;
      const p = perchAt(c.tx, c.ty);
      if (p) key = Math.max(key, p.obj.sortY + 2);
      if (c.moving) {
        const q = perchAt(c.fx, c.fy);
        if (q) key = Math.max(key, q.obj.sortY + 2);
      }
      if (c.riding) key = c.py + T + 2;
      list.push({ key, cat: c });
    }
    for (const h of humans) {
      if (h.away) continue;
      let key = h.py + T;
      const o = objAt(h.tx, h.ty);
      if (h.seated && o) key = Math.max(key, o.sortY + 1);
      list.push({ key: key + 0.5, hum: h });
    }
    for (const e of extras) if (e.indoor && !e.hidden) list.push({ key: e.py + T + 0.5, extra: e });
    list.sort((a, b) => a.key - b.key);

    for (const d of list) {
      if (d.o) {
        const o = d.o;
        const sx = o.shake > 0 ? ((o.shake >> 1) & 1 ? 1 : -1) : 0;
        const x = o.x * T + o.dx - cx + sx;
        const y = o.y * T + o.dy - o.def.up - cy;
        g.drawImage(o.sprite, x, y);
        if (o.type === 'tvwall' && o.ch) {
          // the screen is the 6 x 56 strip at (8, 36) of the sprite
          const sx0 = x + 8;
          const sy0 = y + 36;
          const t = frame >> 3;
          if (o.ch === 1) {
            R(g, sx0, sy0, 6, 56, [C.sky, C.skyL, C.sky, C.skyL][t & 3]);
            R(g, sx0, sy0 + 34, 6, 22, C.leaf);
            const by = sy0 + 8 + (t % 20);
            R(g, sx0 + 2, by, 2, 3, C.charcoal);
            P(g, sx0 + 1 + (t & 1) * 3, by + 1, C.charcoal);
          } else if (o.ch === 2) {
            R(g, sx0, sy0, 6, 56, '#2f6fa0');
            R(g, sx0 + 5, sy0, 1, 56, C.tan);
            for (let i = 0; i < 3; i++) {
              const fy = sy0 + ((t * (i + 1) + i * 19) % 52);
              R(g, sx0 + 1 + i, fy, 2, 3, [C.orange, C.yellow, C.pinkL][i]);
              P(g, sx0 + 1 + i, fy + 3, [C.orange, C.yellow, C.pinkL][i]);
            }
            P(g, sx0 + 2, sy0 + 50 - (t % 40), C.skyL);
          } else if (o.ch === 4) {
            // a singing show (the picture lies on its side, like the others: the stage floor is the east edge)
            R(g, sx0, sy0, 6, 56, '#2b1d3a');
            R(g, sx0 + 5, sy0, 1, 56, '#8a4a6a');
            // the lights along the top of the stage, chasing each other
            for (let i = 0; i < 7; i++) R(g, sx0, sy0 + 3 + i * 8, 1, 2, [C.yellow, C.pinkL, C.skyL][(i + (t >> 1)) % 3]);
            // the singer, swaying in a spotlight that widens down to the stage
            const cy = sy0 + 27 + [0, 1, 0, -1][(t >> 2) & 3];
            g.fillStyle = 'rgba(255,226,150,0.4)';
            for (let i = 1; i <= 4; i++) g.fillRect(sx0 + i, sy0 + 27 - 2 - i, 1, 5 + 2 * i);
            R(g, sx0 + 3, cy - 1, 2, 3, C.red);
            P(g, sx0 + 2, cy, '#f0c8a0');
            P(g, sx0 + 1, cy, '#3b3038');
            P(g, sx0 + 3, cy + 2 - ((t >> 2) & 1) * 4, '#f0c8a0'); // an arm, out one side and then the other
            // notes drifting up and away, either side of the singer
            for (let i = 0; i < 4; i++) {
              const up = (t + i * 4) % 16;
              if (up >= 12) continue;
              const nx = sx0 + 4 - (up >> 2);
              const ny = sy0 + [9, 18, 37, 46][i] + ((up >> 1) & 1);
              P(g, nx, ny, [C.white, C.yellow, C.pinkL, C.white][i]);
              P(g, nx - 1, ny + 1, [C.white, C.yellow, C.pinkL, C.white][i]);
            }
          } else {
            R(g, sx0, sy0, 6, 56, '#3f8f4a');
            R(g, sx0, sy0 + 27, 6, 1, C.white);
            R(g, sx0 + 2, sy0 + 24, 2, 7, '#56a85f');
            const ball = Math.abs(((t * 2) % 96) - 48);
            R(g, sx0 + 2 + ((t >> 2) & 1), sy0 + 3 + ball, 2, 2, C.white);
            P(g, sx0 + 1, sy0 + 6 + ((t * 3) % 44), C.red);
            P(g, sx0 + 4, sy0 + 48 - ((t * 2) % 40), C.navy);
          }
          g.fillStyle = ['', 'rgba(170,215,255,0.12)', 'rgba(120,180,255,0.14)', 'rgba(160,235,170,0.12)', 'rgba(225,170,255,0.13)'][o.ch];
          g.fillRect(x + 16, y + 30, 16, 66);
          g.fillRect(x + 32, y + 38, 20, 50);
        }
        if (o.type === 'washer' && o.spin > 0) {
          const a = (frame >> 2) & 3;
          const pts = [[-2, -2], [2, -2], [2, 2], [-2, 2]][a];
          P(g, x + 8 + pts[0], y + 29 + pts[1], C.skyL);
          P(g, x + 8 - pts[0], y + 29 - pts[1], C.white);
        }
      } else if (d.it) {
        const it = d.it;
        if (it.state === 'up') {
          let ox = 0;
          let oy = 0;
          if (it.slide) {
            ox = -it.slide.dx * it.slide.t * 2;
            oy = -it.slide.dy * it.slide.t * 2;
          }
          g.drawImage(it.sp.up, it.x * T + 3 + ox - cx, it.y * T - d.h + 1 + oy - cy);
        } else if (it.fall) {
          const t = it.fall.t / 16;
          const x = lerp(it.fall.x, it.x * T + 2, t);
          const y = lerp(it.fall.y, it.y * T + 4, t) - Math.sin(Math.PI * t) * 8;
          g.drawImage(t > 0.5 ? it.sp.fallen : it.sp.up, Math.round(x) - cx, Math.round(y) - cy);
        } else {
          const x = it.x * T - cx;
          const y = it.y * T - cy;
          R(g, x + 9, y + 10, 5, 2, it.def.spill);
          R(g, x + 11, y + 9, 2, 4, it.def.spill);
          P(g, x + 14, y + 12, it.def.spill);
          g.drawImage(it.sp.fallen, x + 1, y + 3);
        }
      } else if (d.pk) {
        g.drawImage(d.pk.sp.ground, d.pk.x * T + 4 - cx, d.pk.y * T + 8 - d.h - cy);
      } else if (d.cat) {
        drawCat(g, d.cat, cx, cy);
      } else if (d.hum) {
        const h = d.hum;
        const x = Math.round(h.px) - cx;
        const y = Math.round(h.py) - cy;
        const sp = h.moving && !h.seated ? h.sp.walk[h.dir][(Math.floor((h.mt * 2) / h.md) + h.steps) % 2] : h.sp.stand[h.dir];
        if (h.seated && !h.moving && h.wp.act === 'sleep') {
          // tucked up in bed: just a head on the pillow
          g.drawImage(h.sp.sleep, 0, 1, 16, 10, x - 3, y + 3, 16, 10);
        } else if (h.seated && !h.moving) g.drawImage(sp, 0, 0, 16, 17, x, y - 7, 16, 17);
        else {
          g.fillStyle = 'rgba(30,20,20,0.2)';
          g.fillRect(x + 3, y + 13, 10, 3);
          // carried things are held out in front, at waist height
          const icon = h.carry && carryIcons[h.carry];
          if (icon && h.dir === 'up') g.drawImage(icon, x + 3, y - 6);
          g.drawImage(sp, x, y - 9);
          if (icon && h.dir !== 'up') g.drawImage(icon, x + (h.dir === 'left' ? -5 : h.dir === 'right' ? 10 : 3), y - 2);
        }
      } else if (d.extra) {
        // one of the story's own, indoors: drawn as the garden draws them (an animal stands on its tile;
        // a person may be holding something in front)
        const e = d.extra;
        const x = Math.round(e.px) - cx;
        const y = Math.round(e.py) - cy;
        const sp = e.pic && !e.moving ? e.pic : e.moving ? e.sp.walk[e.dir][(Math.floor((e.mt * 2) / e.md) + e.steps) % 2] : e.sp.stand[e.dir];
        g.fillStyle = 'rgba(30,20,20,0.2)';
        if (e.low) {
          const jx = e.shake > 0 ? ((frame >> 1) & 1 ? 1 : -1) : 0;
          if (e.shake > 0) e.shake--;
          g.fillRect(x + 8 - (sp.width >> 1) + 2, y + 12, sp.width - 5, 3);
          g.drawImage(sp, x + 8 - (sp.width >> 1) + jx, y + 14 - sp.height);
          continue;
        }
        g.fillRect(x + 3, y + 13, 10, 3);
        if (e.holds && e.dir === 'up') g.drawImage(e.holds, x + 2, y - 2);
        g.drawImage(sp, x + 8 - (sp.width >> 1), y + 15 - sp.height - (e.lift || 0));
        if (e.holds && e.dir !== 'up') g.drawImage(e.holds, x + (e.dir === 'left' ? -3 : e.dir === 'right' ? 7 : 2), y + 1);
      }
    }

    drawParticles(g, cx, cy);
    drawLighting(g, hr, cx, cy);
    drawBubbles(g, cx, cy);
  }

  function drawCat(g, c, cx, cy) {
    if (c.ghost) return; // (not in the story yet, or still in the bag)
    const zl = c.moving ? lerp(c.z0, c.z1, Math.min(1, c.mt / c.md)) : c.riding || c.front ? 0 : c.z;
    const x = Math.round(c.px) - cx;
    const y = Math.round(c.py) - cy;
    g.fillStyle = 'rgba(30,20,20,0.22)';
    g.fillRect(x + 4, y + 12 - Math.round(zl), 9, 3);
    g.fillRect(x + 3, y + 13 - Math.round(zl), 11, 1);
    let ox = 0;
    let oy = 0;
    const a = c.action;
    if (a && (a.type === 'scratch' || a.type === 'chew' || a.type === 'eat')) {
      const [dx, dy] = DIRS[c.dir];
      const k = (a.t >> 2) & 1;
      ox = dx * (2 + k);
      oy = dy * (2 + k);
    }
    if (a && a.type === 'litter' && a.t < 12) oy = -a.t;
    g.drawImage(catSprite(c), x + ox, y - 2 - Math.round(c.z) + oy);
    // whatever it is carrying, at its mouth (out of sight when it faces away)
    const pk = c.kind === 'cat' ? carried(c) : null;
    if (pk && c.dir !== 'up') {
      const [mx, my] = c.dir === 'down' ? [5, 7] : c.dir === 'left' ? [-2, 6] : [12, 6];
      g.drawImage(pk.sp.mouth, x + mx + ox, y + my - Math.round(c.z) + oy);
    }
  }

  function drawParticles(g, cx, cy) {
    for (const p of particles) {
      const x = Math.round(p.x) - cx;
      const y = Math.round(p.y) - cy;
      if (p.kind === 'px') R(g, x, y, p.life > p.max / 2 ? 2 : 1, p.life > p.max / 2 ? 2 : 1, p.color);
      else if (p.kind === 'glyph') drawText(g, p.ch, x, y, p.color);
      else if (p.kind === 'bird') {
        const f = (p.life >> 2) & 1;
        R(g, x, y, 3, 2, C.charcoal);
        P(g, x + 3, y, C.gold);
        if (f) R(g, x, y - 1, 2, 1, C.charcoal);
        else R(g, x, y + 2, 2, 1, C.charcoal);
      }
    }
  }

  function drawBubbles(g, cx, cy) {
    for (const b of bubbles) {
      const e = b.ent;
      if (e.away) continue;
      if (outside ? e.kind === 'human' || e.indoor : e.kind === 'stray' || e.kind === 'person' || (e.kind === 'extra' ? !e.indoor : e.kind === 'human' && flatNow() !== 'home')) continue; // whoever is on the other floor (or in the other flat)
      if (e.kind === 'extra' && e.hidden) continue;
      if (e.kind === 'person' && !people.list.includes(e)) continue; // gone home
      const top = e.py - (e.kind === 'human' ? 10 : e.kind === 'extra' ? 12 + e.lift : e.kind === 'person' ? e.tall - 12 + (e.z || 0) : 2 + (e.z || 0)) - cy;
      drawBubble(g, Math.round(e.px) + 8 - cx, Math.round(top), b.text);
    }
  }

  // the tint over the garden: it follows the sky, so it is dark by 8pm
  const OUT_TINT = [
    [0, 12, 16, 46, 0.58], [5.2, 12, 16, 46, 0.58], [6.2, 120, 80, 110, 0.3], [7.4, 255, 220, 180, 0],
    [17, 255, 190, 140, 0], [18.4, 235, 120, 80, 0.2], [19.6, 12, 16, 46, 0.58], [24, 12, 16, 46, 0.58],
  ];

  // A cat in a bush is half hidden: the front of the bush is drawn back over
  // its legs, with a ragged leafy top edge.
  function bushCover(g, c, cx, cy) {
    for (const [tx, ty] of c.moving ? [[c.fx, c.fy], [c.tx, c.ty]] : [[c.tx, c.ty]]) {
      if (!isBush(tx - GOX, ty)) continue;
      const sx = (tx - GOX - GX0) * T;
      const sy = ty * T;
      const r = rustles.get(tx + ',' + ty);
      const dx = tx * T - cx + (r ? ((r >> 1) & 1 ? 1 : -1) : 0);
      const dy = ty * T - cy;
      g.drawImage(garden.base, sx, sy + 9, T, 7, dx, dy + 9, T, 7);
      for (let i = 0; i < T; i++) {
        const up = (i * 7 + tx * 5 + ty * 3) % 5;
        if (up < 3) g.drawImage(garden.base, sx + i, sy + 9 - up - 1, 1, up + 1, dx + i, dy + 9 - up - 1, 1, up + 1);
      }
    }
  }

  // downstairs: the garden, the cats, and whatever they walk underneath
  function drawOutside(g) {
    const cx = Math.round(cam.x);
    const cy = Math.round(cam.y);
    const ox = GOX * T - cx;
    g.drawImage(garden.base, ox + GX0 * T, -cy);
    // everything that stands up, and the cats, from the back of the view to the front
    // bushes a cat has just pushed through shake from side to side
    for (const [k, v] of rustles) {
      const [tx, ty] = k.split(',').map(Number);
      g.drawImage(garden.base, (tx - GOX - GX0) * T, ty * T, T, T, tx * T - cx + ((v >> 1) & 1 ? 1 : -1), ty * T - cy, T, T);
    }
    dogs.drawRings(g, cx, cy, frame);
    const list = cats.map((c) => ({ key: c.py + T + (c.front || 0) + (c.z > 0 || gardenPerch(c.fx - GOX, c.fy) ? 2 : 0), cat: c }));
    for (const d of dogs.list) if (d.px - cx > -40 && d.px - cx < VW + 24 && d.py - cy > -40 && d.py - cy < VH + 40) list.push({ key: d.py + T + 0.4, dog: d });
    for (const s of garden.sprites) {
      if (s.tick) s.tick(frame);
      const x = s.x + ox;
      const y = s.y - cy;
      if (x > VW || y > VH || x + s.cv.width < 0 || y + s.cv.height < 0) continue;
      list.push({ key: s.sortY, s, x, y });
    }
    for (const n of strays.list) {
      if (n.hidden || n.px - cx < -40 || n.px - cx > VW + 24 || n.py - cy < -40 || n.py - cy > VH + 40) continue;
      list.push({ key: n.py + T + (n.front || 0) + (n.z > 0 ? 2 : 0), stray: n });
    }
    for (const p of people.list) {
      if (p.px - cx < -40 || p.px - cx > VW + 24 || p.py - cy < -40 || p.py - cy > VH + 40) continue;
      list.push({ key: p.py + T + 0.5 + (p.front || 0), person: p });
    }
    for (const e of extras) if (!e.hidden) list.push({ key: e.py + T + 0.5, extra: e });
    for (const v of traffic.list) {
      const x = v.x + ox;
      if (x > VW + 8 || x + v.w < -8) continue;
      list.push({ key: (v.y + 1) * T + 1, car: v, x: Math.round(x), y: (v.y + 1) * T - v.im.height - cy });
    }
    // kibble lies on the ground, under everybody's feet: a white plastic plate of it
    for (const k of people.kibble) {
      const x = (GOX + k.x) * T - cx;
      const y = k.y * T - cy;
      if (x < -16 || y < -16 || x > VW || y > VH) continue;
      if (k.meat) {
        // a bit of somebody's dinner, dropped from a BBQ table: a little drumstick
        R(g, x + 4, y + 8, 6, 5, C.k);
        R(g, x + 5, y + 9, 4, 3, '#b8682e');
        P(g, x + 5, y + 9, '#d9904a');
        R(g, x + 10, y + 10, 3, 1, C.k);
        R(g, x + 12, y + 9, 2, 3, C.k);
        P(g, x + 12, y + 10, '#f4efe2');
        P(g, x + 10, y + 10, '#f4efe2');
        continue;
      }
      R(g, x + 5, y + 6, 6, 1, C.k);
      R(g, x + 3, y + 7, 10, 1, C.k);
      R(g, x + 2, y + 8, 12, 3, C.k);
      R(g, x + 3, y + 11, 10, 1, C.k);
      R(g, x + 5, y + 12, 6, 1, C.k);
      R(g, x + 5, y + 7, 6, 1, '#ffffff');
      R(g, x + 3, y + 8, 10, 3, '#ffffff');
      R(g, x + 5, y + 11, 6, 1, C.grayL);
      P(g, x + 3, y + 10, C.grayL);
      P(g, x + 4, y + 10, C.grayL);
      P(g, x + 11, y + 10, C.grayL);
      P(g, x + 12, y + 10, C.grayL);
      // loose biscuits, not a heap
      for (const [dx, dy, c] of KIBBLE_BITS) P(g, x + dx, y + dy, c);
    }
    for (const pk of pickups) {
      if (pk.by !== null || pk.floor !== 'garden') continue;
      const x = (GOX + pk.x) * T - cx;
      const y = pk.y * T - cy;
      if (x > -16 && y > -16 && x < VW && y < VH) g.drawImage(pk.sp.ground, x + 4, y + 8);
    }
    list.sort((a, b) => a.key - b.key);
    for (const d of list) {
      if (d.cat) {
        drawCat(g, d.cat, cx, cy);
        bushCover(g, d.cat, cx, cy);
      } else if (d.person) {
        const p = d.person;
        const x = Math.round(p.px) - cx;
        const y = Math.round(p.py) - cy - Math.round(p.z || 0);
        // people fade in and out at the lobby doors
        g.globalAlpha = p.arriving ? 1 - p.arriving / 16 : p.leaving ? p.leaving / 16 : 1;
        if (!p.seated && !p.ride) {
          g.fillStyle = 'rgba(30,20,20,0.2)';
          g.fillRect(x + 3, y + 13, 10, 3);
        }
        for (const [im, sx, sy, sw, sh, dx, dy] of people.parts(p, frame)) g.drawImage(im, sx, sy, sw, sh, x + dx, y + dy, sw, sh);
        g.globalAlpha = 1;
      } else if (d.car) g.drawImage(d.car.im, d.x, d.y);
      else if (d.dog) dogs.draw(g, d.dog, cx, cy, frame);
      else if (d.extra) {
        const e = d.extra;
        const x = Math.round(e.px) - cx;
        const y = Math.round(e.py) - cy;
        let sp = e.moving ? e.sp.walk[e.dir][(Math.floor((e.mt * 2) / e.md) + e.steps) % 2] : e.sp.stand[e.dir];
        // (the story may give one a picture of its own for a moment: e.pic, a canvas, stood on the tile by its feet)
        if (e.pic && !e.moving) sp = e.pic;
        g.fillStyle = 'rgba(30,20,20,0.2)';
        if (e.dog) {
          // one of the story's dogs (dogs.actor): in whatever pose it has been given
          if (!e.moving && e.pose && e.pose !== 'stand') sp = dogs.sprite(e, frame);
          g.fillRect(x - 1, y + 12, 18, 3);
          g.drawImage(sp, x - 4, y - 8);
          continue;
        }
        if (e.low) {
          const jx = e.shake > 0 ? ((frame >> 1) & 1 ? 1 : -1) : 0;
          if (e.shake > 0) e.shake--;
          g.fillRect(x + 8 - (sp.width >> 1) + 2, y + 12, sp.width - 5, 3);
          g.drawImage(sp, x + 8 - (sp.width >> 1) + jx, y + 14 - sp.height);
          continue;
        }
        if (e.club) {
          // a golf club: held low, or (swing > 0) coming down
          const up = e.swing > 0;
          if (e.swing > 0) e.swing--;
          g.fillStyle = '#9aa0ab';
          for (let i = 0; i < 12; i++) g.fillRect(x + (e.dir === 'left' ? 2 - (up ? i >> 1 : i >> 2) : 13 + (up ? i >> 1 : i >> 2)), y + (up ? -12 + i : -1 + i), 1, 1);
          g.fillRect(x + (e.dir === 'left' ? (up ? -4 : -1) : up ? 18 : 15), y + (up ? -1 : 10), 3, 2);
        }
        g.fillRect(x + 3, y + 13, 10, 3);
        // a bag held in front (drawn first when its bearer walks away from us)
        if (e.holds && e.dir === 'up') g.drawImage(e.holds, x + 2, y - 2);
        if (e.sat) g.drawImage(sp, 0, 0, 16, 17, x, y - 1, 16, 17); // on his backside
        else {
          if (e.hang) {
            // arms up to the bar he is hanging from
            g.fillStyle = e.sp.skin || '#e2ad84';
            g.fillRect(x + 2, y - 13, 2, 16 - e.lift);
            g.fillRect(x + 12, y - 13, 2, 16 - e.lift);
          }
          g.drawImage(sp, x + 8 - (sp.width >> 1), y + 15 - sp.height - e.lift); // (16 x 24, or wider: feet in the middle of the tile)
        }
        if (e.holds && e.dir !== 'up') g.drawImage(e.holds, x + (e.dir === 'left' ? -3 : e.dir === 'right' ? 7 : 2), y + 1);
        if (e.torch && e.dir !== 'up') {
          // a torch in the hand: a grey barrel and a bright end
          const tx = x + (e.dir === 'left' ? -2 : e.dir === 'right' ? 13 : 11);
          R(g, tx, y + 3, 5, 3, C.k);
          R(g, tx + 1, y + 4, 3, 1, '#9aa0ab');
          R(g, e.dir === 'left' ? tx : e.dir === 'right' ? tx + 4 : tx + 1, e.dir === 'down' ? y + 6 : y + 4, e.dir === 'down' ? 3 : 1, 1, '#fff6cc');
        }
      } else if (d.stray) {
        // strays come in different sizes: stand each one on the bottom middle of its tile
        const n = d.stray;
        const sp = strays.sprite(n, frame);
        const x = Math.round(n.px) - cx;
        const y = Math.round(n.py) - cy;
        const zs = n.ride ? 0 : Math.round(n.moving ? lerp(n.z0, n.z1, Math.min(1, n.mt / n.md)) : n.z);
        g.fillStyle = 'rgba(30,20,20,0.22)';
        g.fillRect(x + 8 - (sp.width >> 1) + 2, y + 12 - zs, sp.width - 5, 3);
        g.drawImage(sp, x + 8 - (sp.width >> 1), y + 14 - sp.height - Math.round(n.z));
        bushCover(g, n, cx, cy);
      } else g.drawImage(d.s.cv, d.x, d.y);
    }
    drawParticles(g, cx, cy);
    const [r, gg, b, a] = tintAt(hourNow(), OUT_TINT);
    if (a > 0.005) {
      // night falls everywhere except around the lit lobby
      const lit = Math.min(1, a / 0.4);
      lg.globalCompositeOperation = 'copy';
      lg.fillStyle = 'rgba(' + (r | 0) + ',' + (gg | 0) + ',' + (b | 0) + ',' + a.toFixed(3) + ')';
      lg.fillRect(0, 0, VW, VH);
      lg.globalCompositeOperation = 'destination-out';
      for (const E of [ENTRANCE, GARNET]) {
        const lx = (E.x + E.w / 2) * T + ox;
        const ly = (E.y + 1) * T - cy;
        if (lx < -80 || lx > VW + 80) continue;
        for (const k of [1, 0.75, 0.5]) {
          lg.fillStyle = 'rgba(0,0,0,' + (0.36 * lit).toFixed(3) + ')';
          blob(lg, lx, ly, 74 * k, Math.round(44 * k));
        }
      }
      // the cafe's windows are lit from noon until a quarter to ten at night (it's shut by the boat's hours)
      const cafeOn = hourNow() >= 12 && hourNow() < 21.75;
      if (cafeOn) {
        const [fx, fy, frx, fry] = cafeLight();
        for (const k of [1, 0.72, 0.46]) {
          lg.fillStyle = 'rgba(0,0,0,' + (0.3 * lit).toFixed(3) + ')';
          blob(lg, fx + ox, fy - cy, frx * k, Math.round(fry * k));
        }
      }
      // a pool of light under each lamppost
      const lamps = [];
      for (const [tx, ty] of garden.lamps) {
        const x = tx * T + 8 + ox;
        const y = ty * T + 10 - cy;
        if (x < -60 || y < -50 || x > VW + 60 || y > VH + 60) continue;
        lamps.push([x, y]);
        for (const k of [1, 0.72, 0.46]) {
          lg.fillStyle = 'rgba(0,0,0,' + (0.3 * lit).toFixed(3) + ')';
          blob(lg, x, y, 52 * k, Math.round(34 * k));
        }
      }
      // headlights: a patch of lit road ahead of everything that drives
      const beams = [];
      for (const v of traffic.list) {
        const nose = (v.dir < 0 ? v.x : v.x + v.w) + ox;
        if (nose < -70 || nose > VW + 70) continue;
        const by = (v.y + 1) * T - 5 - cy;
        beams.push([nose, by, v.dir]);
        for (const [k, far] of [[1, 30], [0.6, 20]]) {
          lg.fillStyle = 'rgba(0,0,0,' + (0.34 * lit).toFixed(3) + ')';
          blob(lg, nose + v.dir * far, by, Math.round(34 * k), Math.round(11 * k));
        }
      }
      // a torch in somebody's hand: a pool of light on the ground ahead of them
      const torches = [];
      for (const e of extras) {
        if (e.hidden || !e.torch) continue;
        const [dx, dy] = DIRS[e.dir];
        const x = Math.round(e.px) - cx + 8 + dx * 26;
        const y = Math.round(e.py) - cy + 10 + dy * 18;
        torches.push([x, y]);
        for (const k of [1, 0.7, 0.45]) {
          lg.fillStyle = 'rgba(0,0,0,' + (0.42 * lit).toFixed(3) + ')';
          blob(lg, x, y, Math.round(34 * k), Math.round(20 * k));
        }
      }
      g.drawImage(lightCv, 0, 0);
      dogs.drawRings(g, cx, cy, frame, lit); // (again, over the dark)
      for (const [x, y] of torches) {
        g.fillStyle = 'rgba(255,250,225,' + (0.12 * lit).toFixed(3) + ')';
        blob(g, x, y, 30, 17);
      }
      for (const [nose, by, dir] of beams) {
        g.fillStyle = 'rgba(255,236,170,' + (0.1 * lit).toFixed(3) + ')';
        blob(g, nose + dir * 26, by, 30, 9);
        g.fillStyle = 'rgba(255,244,200,' + (0.95 * lit).toFixed(3) + ')';
        g.fillRect(nose - (dir < 0 ? 0 : 2), by - 3, 2, 3);
      }
      drawLobbyGlow(g, ox, -cy, lit);
      drawLobbyGlow(g, ox, -cy, lit, GARNET);
      if (cafeOn) drawCafeGlow(g, ox, -cy, lit);
      let li = 0;
      for (const [x, y] of lamps) {
        // in the rain they flicker, each to its own beat
        const k = li++ * 41;
        const lf = lit * (rain > 0.3 && ((frame + k) % 131 < 7 || (frame + k * 3) % 59 < 2) ? 0.15 : 1);
        g.fillStyle = 'rgba(255,196,110,' + (0.12 * lf).toFixed(3) + ')';
        blob(g, x, y, 30, 19);
        g.fillStyle = 'rgba(255,238,170,' + (0.9 * lf).toFixed(3) + ')';
        g.fillRect(x + LAMP_HEAD.dx, y + 5 + LAMP_HEAD.dy, LAMP_HEAD.w, LAMP_HEAD.h);
        g.fillStyle = 'rgba(255,226,140,' + (0.28 * lf).toFixed(3) + ')';
        blob(g, x, y + 5 + LAMP_HEAD.dy + 2, 9, 7);
      }
    }
    drawBubbles(g, cx, cy);
  }

  // Top right, three boxes of one width: who is leading (and what he is
  // carrying), the time, and how much HP each of the pair has left.
  const HUD_MIN = 66;
  const CAPTION_MARKS = [[CONTROLS, '#c2371f'], ...ICON_INK];
  let meterFlash = 0; // frames the health bars are ringed, when they first appear
  const HP_MARK = { shark: '#8d8272', orca: '#dc8f41' };
  // a cat's face for the box at the top right: the head only (x 2 to 12 of his sprite; one column more
  // and the tip of a tail that curls up beside him shows, a cream dot on Orca)
  const hudFace = (g, cat, x, y) => g.drawImage(cat.sp.stand.down, 2, 1, 11, 9, x, y, 11, 9);
  function drawUI(g) {
    const L = cats[leader];
    const pk = carried(L);
    // One width for all three boxes, whoever leads and whatever he carries: room for the longer of the
    // pair's two names (The Orange, before the vet names them; Shark, after) and for a thing carried.
    const HUD_W = Math.max(HUD_MIN, Math.max(...cats.map((c) => textWidth(c.name))) + 37);
    const x0 = VW - HUD_W - 3;
    const plate = (y, h) => {
      R(g, x0, y, HUD_W, h, C.k);
      R(g, x0 + 1, y + 1, HUD_W - 2, h - 2, C.charcoal);
    };
    // the clock, on top
    plate(3, 13);
    const hr = hourNow();
    const mins = Math.floor((clock % 60) / 10) * 10;
    const h12 = Math.floor(hr) % 12 || 12;
    const time = h12 + ':' + String(mins).padStart(2, '0') + (hr < 12 ? ' AM' : ' PM');
    const ix = x0 + 4;
    if (hr >= 6.5 && hr < 18.5) {
      R(g, ix + 1, 6, 5, 7, C.yellow);
      R(g, ix, 7, 7, 5, C.yellow);
      R(g, ix + 2, 8, 2, 2, C.gold);
    } else {
      R(g, ix + 1, 6, 5, 7, C.cream);
      R(g, ix, 7, 7, 5, C.cream);
      R(g, ix + 3, 5, 5, 7, C.charcoal);
    }
    drawText(g, time, x0 + HUD_W - 4 - textWidth(time), 6, C.cream);
    // who is leading: his face on the left, what he is carrying beside it, his name on the right
    plate(18, 13);
    hudFace(g, L, x0 + 3, 20);
    if (pk) g.drawImage(pk.sp.ground, x0 + 18, 21 + ((7 - pk.sp.ground.height) >> 1));
    drawText(g, L.name, x0 + HUD_W - 4 - textWidth(L.name), 21, C.cream);
    // HP: a bar for each of the pair, Shark's on top, each with a chip of his own color; the one who is
    // leading in HP red, the other in gray (once the story has explained them; not in a game that is
    // not the story, where nothing is kept)
    if (keepsHurt(story)) {
      const kinds = pairKinds();
      const h = kinds.length * 7 + 3;
      if (meterFlash > 0 && (--meterFlash >> 3) & 1) R(g, x0 - 2, 31, HUD_W + 4, h + 4, C.yellow);
      plate(33, h);
      kinds.forEach((k, i) => drawHealth(g, x0 + 3, 35 + i * 7, HUD_W - 6, fullHp(k) - hurtOf(story, k), fullHp(k), HP_MARK[k], cats[leader] === cats[i]));
    }
    if (hold > 6) {
      // Do is being held with nothing to do: a nap is on its way
      const hx = Math.round(L.px - cam.x) + 1;
      const hy = Math.round(L.py - cam.y) - 8 - Math.round(L.z || 0);
      R(g, hx - 1, hy - 1, 16, 5, C.k);
      R(g, hx, hy, 14, 3, C.charcoal);
      R(g, hx, hy, Math.round((14 * hold) / HOLD), 3, C.skyL);
    }

    if (banner) {
      const w = textWidth(banner.text) + 12;
      const slide = banner.t > 138 ? (150 - banner.t) / 12 : banner.t < 12 ? banner.t / 12 : 1;
      const y = Math.round(-16 + slide * 19);
      drawPanel(g, 3, y, w, 15);
      drawText(g, banner.text, 9, y + 4, C.k);
    }
    if (caption && !dialog.active) {
      const lines = caption.lines;
      const h = lines.length * LINE_H + 9;
      const y = VH - h - 3;
      drawPanel(g, 3, y, VW - 6, h);
      let left = Math.floor(caption.n);
      // (buttons and menu items that a caption names are picked out, as in the dialog box)
      markLines(caption.pages[caption.i], VW - 26, CAPTION_MARKS).forEach((line, i) => {
        if (left <= 0) return;
        drawMarked(g, line, 10, y + 5 + i * LINE_H, C.k, '#c2371f', left);
        left -= line.text.length + 1;
      });
    }
  }

  function draw(g) {
    g.fillStyle = C.void;
    g.fillRect(0, 0, VW, VH);
    // (a scene's view part of the way across to a picture: the world is that far off to the left)
    const pic = mode === 'play' && scene ? scene.picture : null;
    const off = pic ? Math.round(VW * scene.pan * scene.pan * (3 - 2 * scene.pan)) : 0;
    if (off > 0) {
      g.save();
      g.translate(-off, 0);
    }
    if (off < VW) {
      if (outside) drawOutside(g);
      else drawWorld(g);
      if (outside && rain > 0.01) drawRain(g);
    }
    if (off > 0) g.restore();
    if (fade) {
      // fade to black, hold, fade back in
      const k = fade.t < FADE ? fade.t / FADE : fade.t < FADE + FADE_HOLD ? 1 : 1 - (fade.t - FADE - FADE_HOLD) / FADE;
      g.fillStyle = 'rgba(23,18,28,' + Math.max(0, Math.min(1, k)).toFixed(3) + ')';
      g.fillRect(0, 0, VW, VH);
    }
    if (mode !== 'play') return;
    if (scene) {
      // a scene somewhere that is not on the map (the vet's, or Garnet across the gap): one still picture,
      // in place of the world, or to the east of it while the view is on its way across
      if (pic) {
        g.save();
        g.translate(VW - off, 0);
        if (pic.kind === 'garnet') drawGarnet(g, frame, pic.state, { bbc: quests.debug.bbc.sp, flower: quests.debug.flower.sp, shark: cats[0].sp, orca: cats[1].sp });
        else drawVet(g, frame, pic, { cats: cats.map((c) => c.sp), hung: quests.debug.hung.sp, trang: quests.debug.trang.sp, vet: quests.debug.vet.sp, owner: (extras.find((e) => e.id === 'fowner') || {}).sp });
        g.restore();
      }
      // a scene: black bars top and bottom, and its own fades
      if (scene.fade > 0) {
        g.fillStyle = 'rgba(23,18,28,' + scene.fade.toFixed(3) + ')';
        g.fillRect(0, 0, VW, VH);
      }
      const bar = Math.round(scene.bars * 10);
      R(g, 0, 0, VW, bar, C.void);
      R(g, 0, VH - bar, VW, bar, C.void);
      if (scene.canSkip) {
        const t = WORDS.title.skip;
        drawText(g, t, VW - textWidth(t) - 4, 1, scene.skip ? C.yellow : C.grayD);
      }
    } else drawUI(g);
    dialog.draw(g);
  }
  // Rain (the opening): only to look at. A cold tint, slanting streaks, and splashes on the ground.
  function drawRain(g) {
    g.fillStyle = 'rgba(18,22,46,' + (0.24 * rain).toFixed(3) + ')';
    g.fillRect(0, 0, VW, VH);
    g.fillStyle = 'rgba(190,206,236,' + (0.5 * rain).toFixed(3) + ')';
    const n = Math.round(80 * rain);
    for (let i = 0; i < n; i++) {
      const fall = 6 + (i % 3);
      const y = ((i * 37 + frame * fall) % (VH + 16)) - 8;
      const x = ((i * 53 + i * i * 7) % (VW + 60)) - Math.round(y * 0.25);
      g.fillRect(x, y, 1, 3);
      g.fillRect(x - 1, y + 3, 1, 3);
    }
    g.fillStyle = 'rgba(214,226,246,' + (0.45 * rain).toFixed(3) + ')';
    for (let j = 0; j < Math.round(14 * rain); j++) {
      const s = (j * 977 + Math.floor((frame + j * 3) / 6) * 1319) % 9973;
      g.fillRect(s % VW, 24 + ((s * 7) % (VH - 40)), 2, 1);
    }
  }
  // a tap on the screen: a dialog takes it; otherwise it is the Do button
  function pointer(x, y) {
    if (mode === 'play' && dialog.active) return dialog.pointer(x, y);
    input.down('a');
    setTimeout(() => input.up('a'), 60);
    return true;
  }
  // for the pause menu's page about the cats
  function info() {
    const rung = rungOf(story);
    const moves = (r) => [MOVES.attack.name, ...(r.heavy ? [MOVES[r.heavy].name] : []), ...r.specials.map((id) => MOVES[id].name)];
    const g = guest && guestFights ? FIGHTERS[FIGHTER_OF[guest.def.id]] : null;
    // (on the last night the friend picked for the fight is walked along by the story, not asked along:
    // on the sheet as the fighter it will be, on the HP it comes in on)
    const fin = !g && act3.finaleFriend ? act3.finaleFriend() : null;
    const fg = fin ? FIGHTERS[fin.kind] : null;
    return {
      // (house cats, once they are: the rung of that name is only reached at the end of Act 2)
      stage: story.adopted && story.stage === 'meeting3' ? 'house' : story.stage, mode: story.mode, sandbox: story.mode === 'sandbox' || !!story.flags.sandbox, hp: Object.fromEntries(['shark', 'orca'].map((k) => [k, [Math.round(fullHp(k) - hurtOf(story, k)), fullHp(k)]])), keeps: keepsHurt(story), solo: !!story.flags.solo, adopted: !!story.adopted, goal: story.goal,
      // things around the garden still to be tried for the first time (once somebody has pointed them out)
      // (and, while there is something she has not heard yet, a reminder that Scar likes to be told)
      tips: story.mode === 'story' && story.flags.tips && !story.adopted ? [...Object.keys(FINDS).map((k) => ({ text: WORDS.finds.tips[k], stat: FINDS[k][0], n: FINDS[k][1], done: !!(story.found || {})[k] })), ...(quests.news() ? [{ text: WORDS.finds.tips.scar }] : [])] : null,
      cats: cats.map((c) => {
        const r = rung[c.cfg.id];
        const pk = carried(c);
        return { name: c.name, face: faceFor(c), colour: c.cfg.colour, hp: r.hp, atk: r.atk, agl: r.agl, moves: moves(r), carrying: pk ? { name: pk.words.name, sprite: pk.sp.ground } : null };
      }),
      // Act 2's list of things to try, in its groups (see home.js)
      list: home.tips(),
      // whoever is tagging along, as the fighter it will be
      guest: g ? { name: guest.name, face: faceFor(guest), colour: '#8fc1ff', hp: g.hp, full: g.hp, atk: g.atk, agl: g.agl, moves: moves(g) }
        : fg ? { name: fin.who ? fin.who.name : fg.name, face: faceFor(fin.who), colour: '#8fc1ff', hp: fin.start.hp || fg.hp, full: fg.hp, atk: fg.atk, agl: fg.agl, moves: moves(fg) } : null,
    };
  }
  for (const p of pickups) sendBack(p);

  return {
    update,
    draw,
    pointer,
    start,
    info,
    // a fighter's card, while the story has one up (see showCard)
    card: () => (mode === 'play' ? card : null),
    save: autosave,
    get story() { return story; },
    // sandbox only: jump to another rung of the ladder
    setStage(k) { if (STAGES.includes(k)) story.stage = k; },
    // handy for tests and tinkering in the console
    debug: {
      world, cats, humans, items, cam, stats, pickups, dialog, quests, extras, traffic,
      get story() { return story; },
      get scene() { return scene; },
      get guest() { return guest; },
      get nap() { return nap; },
      get hold() { return hold; },
      snapshot, playScene, startFight, carried, askAlong, strayTalk, mend,
      // HP: setHurt('shark', 10) leaves him 10 under full; mend(1) heals both
      setHurt: (kind, n) => setHurt(kind, n),
      mend: (share) => mend(share),
      get hurt() { return { ...(story.hurt || {}) }; },
      // the lowest share of full HP between the two of them (1 where nothing is kept)
      get health() { return keepsHurt(story) ? Math.min(...pairKinds().map(hpShare)) : 1; },
      // knocked down on the road, as if a vehicle had come by (tests)
      roadHit: () => roadHit(null),
      get errand() { return errand; },
      startErrand: (i, kind) => startErrand(humans[i], kind),
      startSeek: (i, c) => startSeek(humans[i], cats[c]),
      hurryErrand() { if (errand) errand.t = -99999; for (const h of humans) if (h.script) for (const st of h.script) if (st.wait > 30) st.wait = 30; },
      get mode() { return mode; },
      get outside() { return outside; },
      strays,
      traffic,
      people,
      dogs,
      get treed() { return treed; },
      home,
      act3,
      get extras() { return extras; },
      get guest() { return guest; },
      homeApi,
      humans,
      get fading() { return !!fade; },
      get banner() { return banner ? banner.text : ''; },
      get beenOut() { return beenOut; },
      GOX,
      travel,
      get meal() { return meal; },
      get clock() { return clock; },
      get hour() { return hourNow(); },
      bowls, feeder, lights,
      kibble: () => people.kibble,
      fmt: (t, c, h) => fmt(t, c, h),
      discover: (k) => discover(k), // (a first-time find, as the story would count it)
      // (for tests) past the opening, to the first morning of Act 1
      skipOpening() {
        dialog.close();
        scene = null;
        questApi.startAct1();
        delete story.flags.noRun; // (the opening's: Act 1's first scene takes it off, and that is skipped here)
        story.goal = WORDS.act1.goalStart;
      },
      // jump to an hour today (or tomorrow if it has passed)
      setTime(hr) {
        let t = calDay() * 1440 + hr * 60;
        if (t < clock) t += 1440;
        clock = t;
      },
      get leader() { return leader; },
      // (Sandbox has no door to it) the pair, into Purple Scarf's flat: where the story first puts them, or on `spot`
      toFlat: (id = 'scarf', spot, dir) => enterFlat(id, spot, dir),
      get flat() { return flatNow(); },
      flatHooks,
      set onDid(f) { onDid = f; }, // (for tests: listen where the story does)
      get caption() { return caption ? caption.text : ''; },
      get captionQueue() { return captionQueue; },
      teleport(x, y) {
        const L = cats[leader];
        const F = cats[1 - leader];
        leaveTree();
        gride = null;
        for (const c of cats) Object.assign(c, { front: 0, gwalk: false });
        Object.assign(L, { tx: x, ty: y, fx: x, fy: y, px: x * T, py: y * T, moving: false, z: heightAt(x, y), action: null });
        const spot = [[-1, 0], [1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy]).find(([a, b]) => (outside ? !gardenBlocked(a - GOX, b) && !strays.at(a, b) && !extraAt(a, b) : isFloor(at(a, b)) && !objAt(a, b))) || [x, y];
        Object.assign(F, { tx: spot[0], ty: spot[1], fx: spot[0], fy: spot[1], px: spot[0] * T, py: spot[1] * T, moving: false, z: 0, action: null });
        updateCamera(true);
      },
    },
  };
}
