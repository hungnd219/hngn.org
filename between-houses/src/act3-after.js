// Act 3's last part: the epilogue, and everything after it (stage 'after').
//
// The jetty's last scene fades to black and tells what came of it all; then,
// in the same scene, come this part's own steps (homecoming): "Some time
// later...", and the flat in the evening with nobody in it. Stripes and Polka
// come home from a honeymoon that had waited a year (and a little longer, for
// two cats). Shark and Orca run to the door. There are two toy demons from
// Japan, and an orchid from Flower's human, which is not to be eaten.
//
// After that the game is open, on both floors, for good. What is new:
//   upstairs    the two demon toys and the orchid; and Stripes and Polka have
//               pet names for the pair (see EPILOGUE and NICKS in flat-lines.js)
//   downstairs  the first time each of the garden's cats is met there is news
//               (W.news); Thanos is cut short by the vet, who has been after
//               him for weeks; BBC and Flower are on Garnet's step by day; the
//               boat is gone from the jetty and the golf balls from the lawn
//               (the pair remark on each, once);
//               and every evening Flower's human comes out of Garnet, crosses
//               the road, and puts a plate down by the BBQ shed.
// (Scar's new home by Garnet's box, and Thanos's rounds, are the jetty part's:
// see afterHomes there.)
//
// Flags, all in story.flags:
//   epHome      the homecoming has been played (or skipped: Sandbox starts after it)
//   epilogue    the same, for the rest of the game: pet names, the flat's old lines, the toys
//   epToys      the two demons are in the flat
//   epNews      { id: true } for each of the garden's cats who has told the news
//   epThanos    the vet has come for Thanos
//   epOwner     Flower's human has said hello
//   epJetty, epLawn   the pair have seen that the boat is gone, and the golf balls
// Sandbox, on the title menu, starts here: after the homecoming, in the flat.
import { A3 as W } from './act3-after-text.js';
import { GARNET, ROAD, KERB_S, PAVE_S, SHED, JETTY_N, gardenBlocked, isBush } from './garden.js';
import { DOOR_SPOTS, START } from './map.js';
import { canvas, R } from './palette.js';
import { makeHuman } from './sprites.js';

// indoors: where everybody stands in the foyer (tiles of the flat)
const IN = [[30, 18], [32, 18]]; // Stripes and Polka, once they are in
const CASES = [[29, 19], [33, 19]]; // their suitcases
const RUN = [[30, 16], [32, 16]]; // Shark and Orca, come to meet them
const TOYS = { oniRed: [31, 17], oniBlue: [33, 17] }; // where the two demons are put down
const ORCHID = [16, 12]; // the corner of the big bedroom
// outdoors
const STEP = [[GARNET.doorX - 1, GARNET.y - 1], [GARNET.doorX + 2, GARNET.y - 1]]; // BBC and Flower, on Garnet's step
const OWNER_DOOR = [GARNET.doorX, GARNET.y - 1];
const OWNER_HOURS = [17.5, 19.5]; // when Flower's human sets out with the plate
// Cheetos's girl and her mother from Garnet, at a table by the cafe after school
const CAFE_HOURS = [15.5, 18];
const CAFE_SPOTS = [[-3, 22], [-1, 22]];
// (the same two as in Act 1: see quests.js)
const MUM_PAL = { k: '#17131a', s: '#f0c8a0', h: '#3b2a22', c: '#5f9a6c', v: '#457a52', p: '#f4f1ea', o: '#d9d4cc' };
const KID_PAL = { k: '#17131a', s: '#f0c8a0', h: '#3b2a22', c: '#f2cf3a', v: '#d4ae22', p: '#e58aa0', o: '#f4f1ea' };
const DAY = [7, 19]; // when BBC and Flower are let out
// where the small white balls used to lie on the lawn (thereabouts), and the jetty's planks
const BALLS_WERE = [[74, 23], [84, 29], [88, 21]];
const onJetty = (x, y) => x >= 17 && x <= 30 && y >= JETTY_N && y <= 10;

function suitcase(a, b) {
  const [cv, g] = canvas(12, 13);
  const k = '#17131a';
  R(g, 4, 0, 4, 3, k);
  R(g, 5, 1, 2, 2, '#c9ccd3');
  R(g, 1, 2, 10, 11, k);
  R(g, 2, 3, 8, 9, a);
  R(g, 2, 6, 8, 1, b);
  R(g, 2, 9, 8, 1, b);
  R(g, 3, 4, 1, 7, b);
  R(g, 8, 4, 1, 7, b);
  const all = { left: cv, right: cv, down: cv, up: cv };
  return { stand: all, sit: all, walk: { left: [cv, cv], right: [cv, cv], down: [cv, cv], up: [cv, cv] } };
}

export function create(ctx) {
  const G = ctx.GOX;
  const H = ctx.home;
  const { sfx, strays } = ctx;
  const f = () => ctx.flags();
  const X = (id) => ctx.extra(id);
  const stray = (id) => strays.byId[id];
  const gx = (a) => a.tx - G;
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const mum = ctx.addExtra('a3emum', W.cafe.mumName, makeHuman(MUM_PAL, true));
  const kid = ctx.addExtra('a3ekid', W.cafe.kidName, makeHuman(KID_PAL, true, { scale: [0.8125, 0.75] }));
  // after school they sit out by the cafe: the girl who plays with Cheetos, and her mother
  function cafeTick() {
    const on = ctx.hour() >= CAFE_HOURS[0] && ctx.hour() < CAFE_HOURS[1];
    [mum, kid].forEach((e, i) => {
      if (on && e.hidden) {
        const [x, y] = ctx.freeNear(CAFE_SPOTS[i][0], CAFE_SPOTS[i][1], 2);
        ctx.placeExtra(e, x, y, i ? 'left' : 'up');
      } else if (!on && !e.hidden && !ctx.visible(e.px, e.py)) e.hidden = true;
    });
  }
  // lines of the text file as scene steps: indoors Stripes and Polka are the flat's own two; in the garden
  // 'owner' is Flower's human
  const linesIn = (list) => ctx.lines(list.map(([who, t]) => [who === 'stripes' ? 0 : who === 'polka' ? 1 : who, t]));
  const linesOut = (list) => ctx.lines(list.map(([who, t]) => [who === 'owner' ? 'fowner' : who, t]));
  // (their two suitcases are the colors of their two cats: a gray-brown tabby and an orange one)
  const cases = [H.addExtra('case0', '', suitcase('#8d8272', '#4e463f'), { indoor: true, low: true }), H.addExtra('case1', '', suitcase('#dc8f41', '#b0652b'), { indoor: true, low: true })];
  let orchid = null; // the object, while it stands in the bedroom
  // A garden tile that somebody can stand on, `want` steps' walk (or a little more) from (x0, y0), by the
  // way people walk: not through bushes, trunks or hedges, and not on the road. ok(x, y): which tiles
  // will do. Whoever is put there can walk back to (x0, y0), which is the point of it. cat: the way may
  // go through a bush (a cat's can), though nobody is ever put down in one.
  const road = (y) => y >= ROAD.top - 1 && y <= ROAD.bottom + 1;
  function walkable(x0, y0, want, ok = () => true, cat = false) {
    const seen = new Map([[x0 + ',' + y0, 0]]);
    const q = [[x0, y0]];
    let best = null;
    for (let i = 0; i < q.length && i < 900; i++) {
      const [x, y] = q[i];
      const d = seen.get(x + ',' + y);
      if (d > 0 && !road(y) && !isBush(x, y) && ok(x, y) && ctx.tileFree(x, y)) {
        if (d >= want) return [x, y];
        if (!best || d > best[2]) best = [x, y, d];
      }
      if (d >= want + 6) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = x + dx + ',' + (y + dy);
        if (seen.has(k) || gardenBlocked(x + dx, y + dy) || (!cat && isBush(x + dx, y + dy))) continue;
        seen.set(k, d + 1);
        q.push([x + dx, y + dy]);
      }
    }
    return best ? [best[0], best[1]] : null;
  }

  // ---------------------------------------------------------- the flat
  function orchidHere(on) {
    if (on && !orchid && H.addObject) orchid = H.addObject('orchid', ...ORCHID);
    if (!on && orchid) {
      H.removeObject(orchid);
      orchid = null;
    }
  }
  function toysHere(at) {
    f().epToys = true;
    for (const id of Object.keys(TOYS)) {
      const p = ctx.pickup(id);
      if (!p) continue;
      if (at) Object.assign(p, { floor: 'apt', x: TOYS[id][0], y: TOYS[id][1], by: null, away: 0 });
      else if (p.floor === 'gone') ctx.toyHome(id);
    }
  }
  // the flat as the homecoming finds it: late in the evening, nobody in, the cats at the far end
  function stage() {
    if (ctx.floor() !== 'home') ctx.toHome();
    H.settle();
    for (const h of H.humans()) Object.assign(h, { away: true, state: 'activity', script: null, onAbort: null, path: [], moving: false, seated: false, asleep: false, bedtime: false, pet: 0, carry: null, timer: 600 });
    H.setClock(23); // (late: it is dark indoors, and the lamps come on with them)
    H.putCat(0, ...START.cats[0], 'down');
    H.putCat(1, ...START.cats[1], 'down');
    ctx.mend(1);
    for (const c of cases) c.hidden = true;
    H.flatLights('foyer', false);
  }
  function comeIn() {
    H.flatLights('foyer', true);
    DOOR_SPOTS.forEach(([x, y], i) => {
      H.standHuman(i, x, y, 'up');
      H.humans()[i].away = false;
    });
  }
  // the next morning, and the game is open
  function settleIn() {
    f().epHome = f().epilogue = true;
    H.flatLights('foyer', false);
    for (const c of cases) c.hidden = true;
    orchidHere(true);
    toysHere(false);
    H.settle();
    H.setClock(8, true);
    for (const i of [0, 1]) {
      H.humans()[i].away = false;
      H.releaseHuman(i);
    }
    ctx.mend(1);
  }
  // The steps of the homecoming, for a scene whose screen is already black. (The jetty's last scene ends
  // with them; so does this part's own, for a game that comes to this stage any other way.)
  function homecoming() {
    const cats = ctx.cats();
    return [
      { say: W.later },
      { call: stage },
      { camera: [30, 18] },
      { wait: 50 },
      { fade: 'in' },
      { wait: 70 },
      { say: W.home.dark },
      { sfx: 'door' },
      { call: comeIn },
      { wait: 30 },
      { say: W.home.door },
      { walks: [[0, ...IN[0]], [1, ...IN[1]]] },
      { call: () => cases.forEach((c, i) => H.placeExtra(c, ...CASES[i], 'down')) },
      { face: [0, 'up'] },
      { face: [1, 'up'] },
      ...linesIn(W.home.in),
      { call: () => sfx.meow(700) },
      { wait: 24 },
      { call: () => sfx.meow(820) },
      { say: W.home.run },
      { walks: [['shark', ...RUN[0]], ['orca', ...RUN[1]]], frames: 5 },
      { face: ['shark', 'down'] },
      { face: ['orca', 'down'] },
      { call: () => { ctx.bubble(cats[0], 'MEOW!', 60); ctx.bubble(cats[1], 'MEOW!', 60); sfx.meow(760); } },
      { wait: 40 },
      ...linesIn(W.home.meow),
      { call: () => { for (const h of H.humans()) ctx.bubble(h, '♥', 70); sfx.purr(); } },
      { wait: 30 },
      ...linesIn(W.home.toys.slice(0, 1)),
      { call: () => { toysHere(true); sfx.squeak(); } },
      { wait: 20 },
      ...linesIn(W.home.toys.slice(1)),
      ...linesIn(W.home.orchid),
      { fade: 'out' },
      { wait: 40 },
      { say: W.home.end },
      { say: W.home.thanks },
      { call: settleIn },
      { camera: null },
      { wait: 40 },
      { fade: 'in' },
      { say: W.home.morning },
      // (said in a box of its own, whatever goal the game had: the story is told, and the game is open)
      { call: () => { ctx.story().goal = ''; } },
      { goal: W.goals.after },
      // (and one box more, the owner's: Battle mode is on the title menu from now on)
      ctx.tip(W.battleTip),
    ];
  }
  const homecomingDone = () => {
    if (!f().epHome) settleIn();
    ctx.setGoal(W.goals.after, true);
    if (ctx.autosave) ctx.autosave();
  };
  // (the jetty's last scene is built when it is played, long after this)
  ctx.homecoming = homecoming;
  ctx.homecomingDone = homecomingDone;

  // -------------------------------------------------------- the garden
  // BBC and Flower: on Garnet's step by day, indoors at night
  function stepCats() {
    const day = ctx.hour() >= DAY[0] && ctx.hour() < DAY[1];
    [X('bbc'), X('flower')].forEach((e, i) => {
      if (!e) return;
      // (not onto a passer-by who happens to be on the step: they come out once it is free)
      if (day && e.hidden && !(ctx.people && ctx.people.at(G + STEP[i][0], STEP[i][1]))) ctx.placeExtra(e, ...STEP[i], 'down');
      else if (!day && !e.hidden && !ctx.visible(e.px, e.py)) e.hidden = true;
    });
  }
  // Flower's human and the evening plate: out of Garnet, over the road, a plate by the shed, and home
  const own = { phase: 'idle', day: -1, route: [], wait: 0, plate: null };
  const ownerOff = () => {
    const o = X('fowner');
    if (o) o.hidden = true;
    if (own.phase !== 'idle' && own.phase !== 'out') own.day = ctx.day(); // (the plate is down: that was today's)
    own.phase = 'idle';
  };
  function ownerTick() {
    const o = X('fowner');
    if (!o) return;
    const hr = ctx.hour();
    if (own.phase === 'idle') {
      if (hr < OWNER_HOURS[0] || hr >= OWNER_HOURS[1] || own.day === ctx.day()) return;
      const plate = ctx.freeNear(SHED.x + SHED.w - 2, SHED.y + SHED.h + 2, 3);
      const stand = ctx.freeNear(plate[0] + 1, plate[1], 2, [plate]);
      own.plate = plate;
      own.route = [[OWNER_DOOR[0], KERB_S + 1], [OWNER_DOOR[0], ROAD.top - 2], stand];
      own.phase = 'out';
      ctx.placeExtra(o, ...OWNER_DOOR, 'up');
      sfx.door();
      return;
    }
    if (o.moving) return;
    if (own.phase === 'put') {
      if (--own.wait > 0) return;
      own.phase = 'back';
      own.route = [[OWNER_DOOR[0], ROAD.top - 2], [OWNER_DOOR[0], KERB_S + 1], OWNER_DOOR];
      return;
    }
    const [x, y] = own.route[0];
    if (gx(o) === x && o.ty === y) {
      own.route.shift();
      if (own.route.length) return;
      if (own.phase === 'out') {
        // the plate goes down, and she waits a little to see who comes
        ctx.people.kibble.push({ x: own.plate[0], y: own.plate[1], born: ctx.clock() });
        sfx.land();
        own.phase = 'put';
        own.wait = 300;
        own.day = ctx.day();
      } else {
        o.hidden = true;
        own.phase = 'idle';
        sfx.door();
      }
      return;
    }
    // (a step at a time, by the way people walk in the garden; put there if there is no way)
    if (!ctx.walkStep(o, G + x, y)) ctx.placeExtra(o, x, y, o.dir);
  }
  function ownerTalk(cat, o) {
    if (!f().epOwner) {
      f().epOwner = true;
      const [a, b] = ctx.cats();
      ctx.playScene('ep-owner', [
        { call: () => { o.dir = cat.px < o.px ? 'left' : cat.px > o.px ? 'right' : cat.py < o.py ? 'up' : 'down'; } },
        ...linesOut(W.owner.first.slice(0, 3)),
        { call: () => { ctx.bubble(a, '♥', 60); ctx.bubble(b, '♥', 60); sfx.purr(); } },
        ...linesOut(W.owner.first.slice(3)),
      ], () => ctx.autosave && ctx.autosave());
      return true;
    }
    sfx.purr();
    ctx.say(ctx.fmt(pick(W.owner.again), cat));
    return true;
  }

  // the first time each of the garden's cats is met again: the news
  const told = (id) => !!(f().epNews && f().epNews[id]);
  const tell = (id) => {
    f().epNews = { ...(f().epNews || {}), [id]: true };
  };
  function news(id, cat, who) {
    tell(id);
    const held = who && who.kind !== 'extra';
    if (held) who.pause = 1e9; // (nobody wanders off in the middle of their own news)
    const steps = [...linesOut(W.news[id])];
    if (id === 'mama') {
      // Socks turns up, on Mamacat's side of the road again
      const s = stray('socks');
      const m = stray('mama');
      // (where she can be seen: the middle row of the pavement if Mamacat is on the building side, open
      // ground if not; never a bush, and never behind the humming box)
      const paved = !!m && m.ty >= PAVE_S - 1;
      const row = (x, y) => !paved || y === PAVE_S + 1;
      const spot = s && m && ctx.guest() !== s ? walkable(gx(cat), cat.ty, 2, row, true) : null;
      const from = spot ? walkable(spot[0], spot[1], 6, row, true) : null;
      if (spot && from) {
        steps.push(
          { call: () => { if (s.following) ctx.release(s); strays.place(s, from[0], from[1]); Object.assign(s, { hidden: false, pause: 1e9, pose: 'stand', dir: from[0] > spot[0] ? 'left' : 'right' }); } },
          { walk: ['socks', G + spot[0], spot[1]] },
          { call: () => { s.pose = 'sit'; tell('socks'); } },
          ...linesOut(W.news.mamaSocks),
          { call: () => { s.pause = 0; } }
        );
      }
    }
    ctx.playScene('ep-' + id, steps, () => {
      if (held) who.pause = 0;
      if (ctx.autosave) ctx.autosave();
    });
    return true;
  }
  // Thanos, and the one thing he runs from. He stays gone until the pair are well away from where he was
  // (or indoors): `fled` is that place, and while it is set he is nowhere in the garden (see present).
  let fled = null;
  function thanosScene(cat, n) {
    f().epThanos = true;
    f().epThanosDay = ctx.day();
    const vet = X('vet');
    // (he stops a couple of steps from Thanos, and starts from somewhere he can walk there from)
    const to = walkable(gx(n), n.ty, 2) || ctx.freeNear(gx(n) + 2, n.ty, 2);
    const from = walkable(to[0], to[1], 8) || to;
    const away = ctx.freeNear(gx(n) - 7, n.ty - 2, 4);
    n.pause = 1e9;
    ctx.playScene('ep-thanos', [
      ...linesOut(W.thanos.talk),
      ...(vet ? [
        { call: () => ctx.placeExtra(vet, from[0], from[1], 'left') },
        { say: W.thanos.vetComes },
        { bubble: ['thanos', '!!', 50] },
        { walk: ['vet', G + to[0], to[1]] },
        ...linesOut(W.thanos.vet),
      ] : []),
      // (gone, between one box and the next)
      { call: () => { n.pose = 'stand'; sfx.rustle(); ctx.burst(n.px + 8, n.py + 8, '#f7f1e3', 8); strays.place(n, away[0], away[1]); n.hidden = true; } },
      { wait: 30 },
      { say: W.thanos.gone },
      ...linesOut(W.thanos.after),
      ...(vet ? [{ walk: ['vet', G + from[0], from[1]] }, { call: () => { vet.hidden = true; } }] : []),
    ], () => {
      if (vet) vet.hidden = true;
      n.pause = 0;
      n.hidden = true;
      fled = [gx(cat), cat.ty];
      if (ctx.autosave) ctx.autosave();
    });
    return true;
  }
  function present(id, st) {
    return st === 'after' && id === 'thanos' && fled ? false : undefined;
  }

  // ------------------------------------------------------------- hooks
  function update(st) {
    if (st !== 'after') return;
    // a game that has come to this stage without the homecoming (an older save, Mission select): it is played now
    if (!f().epHome) return void ctx.playScene('ep-home', [{ fade: 'out' }, { wait: 60 }, ...homecoming()], homecomingDone);
    if (!ctx.outside()) return void ((fled = null), own.phase !== 'idle' && ownerOff());
    if (fled && Math.abs(gx(ctx.leader()) - fled[0]) + Math.abs(ctx.leader().ty - fled[1]) > 26) fled = null;
    stepCats();
    ownerTick();
    cafeTick();
    // the first time on the jetty, and on the lawn where the balls used to lie: something is missing
    const L = ctx.leader();
    if (L.moving) return;
    const x = gx(L);
    if (!f().epJetty && onJetty(x, L.ty)) return remark('epJetty', W.jetty);
    if (!f().epLawn && BALLS_WERE.some(([bx, by]) => Math.abs(bx - x) + Math.abs(by - L.ty) <= 3)) return remark('epLawn', W.lawn);
  }
  function remark(flag, list) {
    f()[flag] = true;
    ctx.playScene('ep-' + flag, [{ wait: 10 }, ...linesOut(list)], () => ctx.autosave && ctx.autosave());
  }
  function enter(st) {
    if (st !== 'after') return void orchidHere(false);
    orchidHere(!!f().epHome);
    if (f().epHome) {
      f().epilogue = true;
      toysHere(false);
    }
    ownerOff();
    if (ctx.outside()) stepCats();
  }
  const reset = () => orchidHere(false);
  // Do in front of one of the garden's cats (or walking into one)
  function talk(cat, n) {
    if (ctx.stage() !== 'after' || !n.named) return false;
    const id = n.def.id;
    // (nobody stops for a talk in the middle of the road: there, it is the ordinary box)
    const onRoad = n.ty >= ROAD.top - 1 && n.ty <= ROAD.bottom + 1;
    if (onRoad) return ctx.strayTalk(cat, n), true;
    if (id === 'thanos') {
      if (!f().epThanos) return thanosScene(cat, n);
      // (for the rest of that day he has nothing to say about it)
      if (f().epThanosDay === ctx.day()) return ctx.say(ctx.fmt(pick(W.thanos.later), cat)), true;
    } else if (W.news[id] && !told(id)) return news(id, cat, n);
    // (after that they are friends to be asked along like any other: the game's own box, with this part's lines)
    return ctx.strayTalk(cat, n), true;
  }
  let said = 0;
  const turn = (list) => list[said++ % list.length];
  function bump(cat, e) {
    if (ctx.stage() !== 'after') return false;
    if (e.id === 'fowner') return ownerTalk(cat, e);
    if (e === mum || e === kid) return ctx.say(ctx.fmt(pick(e === mum ? W.cafe.mum : W.cafe.kid), cat)), true;
    if (e.id === 'bbc' || e.id === 'flower') {
      if (!told(e.id)) return news(e.id, cat, e);
      return ctx.say(ctx.fmt(turn(W.lines[e.id]), cat)), true;
    }
    return e.id === 'vet' || cases.includes(e);
  }
  function linesFor(n, st) {
    if (st !== 'after' || !n.named) return null;
    return W.lines[n.def.id] || null;
  }
  // Mission select, Sandbox and the tests: the stage as it begins (the homecoming still to come)
  function jump(st) {
    for (const k of Object.keys(f())) if (k.startsWith('ep')) delete f()[k];
    orchidHere(false);
    own.phase = 'idle';
    own.day = -1;
    if (st === 'after') ctx.story().goal = W.goals.after;
  }

  return { update, enter, reset, talk, bump, linesFor, jump, present, debug: { own, cases, STEP, ORCHID, TOYS, homecoming, settleIn, get orchid() { return orchid; } } };
}
