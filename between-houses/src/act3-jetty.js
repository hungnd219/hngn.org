// Act 3, part "jetty": the end of the story (see act3.js for the stages).
//
//   regroup  Outside Garnet with no dog anywhere. Home, where two cats try to tell two humans about
//            a boat, and are fed for it. They wait for the dark.
//   call     Outside Amber's doors, one meow: every friend they have made comes and stands in a line.
//   pick     One of the line is asked along (it can be changed until the fight).
//   walk     The garden with nobody in it; the barrier; the long way round to the jetty.
//   jetty    The three come down off the boat, Golf Club has his say, and the last fight begins.
//   won      He swings at cats who are not there, and goes into the river. Orca fetches Stripes and
//            Polka, and the neighbours follow. The End.
//   after    Free roaming, for good.
//
// What this part keeps in story.flags (all `a3j…`): (a3jOut, in older saves, is no longer used)
// a3jTold (the scene in the flat has been played), a3jLine (the line has been called and is
// standing), a3jFriend (who has been picked: 'cheetos' | 'socks' | 'mama' | 'scar' | 'thanos' |
// 'bbc'), a3jQuiet / a3jBarrier / a3jPlay / a3jShed / a3jBoard (remarks made on the walk), a3jDone
// (the morning after has been set). Nothing else is remembered: enter() puts everybody where the
// stage and these flags say, after a load, a floor change or Mission select.
//
// Every word is in act3-jetty-text.js.
import { A3 as W } from './act3-jetty-text.js';
import { A3 as GARNET_WORDS } from './act3-garnet-text.js'; // (the goal outside Garnet's doors is the flat's last word)
import { makeHuman, makeGolfClub, HUMAN_PALS, HUMAN_COATS, makeCat } from './sprites.js';
import { NAMED, applyAfter } from './strays.js';
import { durianBag } from './act3-art.js';
import { canvas, R } from './palette.js';
import { ENCOUNTERS, FINALE_FRIENDS } from './story.js';
import { ENTRANCE, GARNET, ROAD, KERB_S, PAVE_S, PLANT_S, AC_UNITS, FRIEND_SPOTS, LINE_SPOTS, JETTY_FACE, JETTY_STAND, JETTY_FALL, JETTY_SPLASH, JETTY_N, JETTY_PLANK, SHED } from './garden.js';

const T = 16;
const MINE = ['regroup', 'call', 'pick', 'walk', 'jetty', 'won', 'after'];
// the line outside Amber's doors, west to east (LINE_SPOTS), and who waits where by Mamacat's box until
// they are called (FRIEND_SPOTS: Cheetos, Socks, Mamacat, Babycat, Scar)
const LINE = ['cheetos', 'socks', 'mama', 'scar', 'bbc', 'thanos'];
const AT_BOX = { cheetos: 0, socks: 1, mama: 2, baby: 3, scar: 4 };
const NAMES = { cheetos: 'Cheetos', socks: 'Socks', mama: 'Mamacat', scar: 'Scar', thanos: 'Thanos', bbc: 'BBC' };
// where the pair stand to call, and stand again after a lost fight: in the gap of the hedge, facing the doors
const CALL = [[ENTRANCE.doorX, KERB_S + 1], [ENTRANCE.doorX + 1, KERB_S + 1]];
// Garnet's step: BBC and Flower, once it is all over; and where the pair come out of Garnet
const GARNET_STEP = [[GARNET.doorX - 1, GARNET.y - 1], [GARNET.doorX + 2, GARNET.y - 1]];
const GARNET_OUT = [[GARNET.doorX, GARNET.y - 2], [GARNET.doorX + 1, GARNET.y - 2]];
// in front of the kibble machine (Shark, Orca), as Act 2 has it
const FEEDER = [[43, 3], [44, 3]];
// the neighbours who come along the walkway behind Stripes and Polka
const NEIGHBOURS = [
  [{ k: '#17131a', s: '#e2ad84', h: '#2a2320', c: '#4a78b0', v: '#365a8a', p: '#3a3a44', o: '#d9d4cc' }, false],
  [{ k: '#17131a', s: '#f0c8a0', h: '#3b2a22', c: '#d8704a', v: '#b2542f', p: '#5a5148', o: '#f4f1ea' }, true],
  [{ k: '#17131a', s: '#d9a57e', h: '#55504c', c: '#e9e4d6', v: '#c4bda9', p: '#6a5f43', o: '#3a3a44' }, false],
  [{ k: '#17131a', s: '#ecc7a4', h: '#231c22', c: '#5f9a6c', v: '#457a52', p: '#2f3a5c', o: '#f4f1ea' }, true],
  [{ k: '#17131a', s: '#e8b98f', h: '#8b8d97', c: '#8a6aa8', v: '#6a4f88', p: '#4a4a52', o: '#17131a' }, false],
];

export function create(ctx) {
  const G = ctx.GOX;
  const { sfx, strays } = ctx;
  const S = () => ctx.story();
  const f = () => ctx.flags();
  const gx = (a) => a.tx - G;
  const stray = (id) => strays.byId[id];
  const X = (id) => ctx.extra(id);
  const fid = () => f().a3jFriend || null;
  // ('owner' in this part's words is Flower's human: the garden's story has an owner of its own)
  const lines = (list, indoors) => ctx.lines(list.map(([who, t]) => [indoors && who === 'stripes' ? 0 : indoors && who === 'polka' ? 1 : who === 'owner' ? 'fowner' : who, t]));
  const say1 = (l, indoors) => lines([l], indoors)[0];

  // ---- the people and animals of this part
  const club = ctx.addExtra('club', W.names.club, makeGolfClub());
  const SW = club.sp.swing;
  const nbs = NEIGHBOURS.map(([pal, long], i) => ctx.addExtra('nb' + i, W.names.nb[i], makeHuman(pal, long)));
  // one of Thanos's grown sons (the lookalikes from Act 1), among the cats who fetch the humans at the end
  const THANOS_DEF = NAMED.find((d) => d.id === 'thanos');
  const son = ctx.addExtra('a3json', W.names.son, makeCat(THANOS_DEF.pal, { coat: THANOS_DEF.coat, scale: [0.9375, 0.9375] }), { low: true });
  // (Green Shirt is this part's own, though he looks as he always has: the garden story puts its own
  // away again whenever it is not using him)
  const greenShirt = ctx.addExtra('green', W.names.green, makeHuman(HUMAN_PALS.haterS, false, { coat: HUMAN_COATS.haterS }));
  const green = () => greenShirt;
  const scarf = () => X('l');
  const bbc = () => X('bbc');
  const flower = () => X('flower');
  const stripes = () => X('stripes');
  const polka = () => X('polka');
  const hide = (...list) => {
    for (const e of list) if (e) Object.assign(e, { hidden: true, pic: null, sat: false, holds: null });
  };

  // one of the garden's cats, sitting where the story puts it until the story lets it go
  const appear = (n, [x, y, up], dir = 'up') => {
    if (!n) return;
    if (n.following) ctx.release(n);
    strays.place(n, x, y);
    Object.assign(n, { hidden: false, pause: 1e9, pose: 'sit', dir });
    if (up) n.z = up; // (on Mamacat's box)
  };
  // ...its own cat again, back on its own ground
  const letGo = (n) => {
    if (!n || n.pause < 1e6) return;
    n.pause = 0;
    strays.settle(n);
  };
  const spotOf = (id) => LINE_SPOTS[LINE.indexOf(id)];
  // back to the line (or put there in the first place)
  function toLine(id) {
    if (id === 'bbc') {
      const b = bbc();
      if (b) ctx.placeExtra(b, ...spotOf(id), 'up');
    } else appear(stray(id), spotOf(id));
  }
  // ...and everybody who is not tagging along
  function standLine() {
    for (const id of LINE) if (id !== fid()) toLine(id);
    appear(stray('baby'), FRIEND_SPOTS[AT_BOX.baby], 'down');
  }
  // before they are called: nobody in sight at all (the box is at the edge of the picture from where the
  // pair stand, and a friend half in it gave the call away). They come from out of the picture: FROM.
  const FROM = [CALL[1][0] + 13, PAVE_S + 1];
  function waitAtBox() {
    for (const id of [...Object.keys(AT_BOX), 'thanos']) if (stray(id)) stray(id).hidden = true;
    hide(bbc());
  }

  // ---- the friend who has been picked
  // BBC is not one of the garden's cats: he walks in the footsteps of whichever of the pair is behind.
  let crumbs = [];
  let last = null;
  const fresh = () => {
    crumbs = [];
    last = null;
  };
  function nearOther() {
    const o = ctx.other();
    const L = ctx.leader();
    return ctx.freeNear(gx(o), o.ty, 2, [[gx(L), L.ty], [gx(o), o.ty]]);
  }
  // the friend at the pair's heels (after a load, or when they come back down from the flat)
  function friendAlong() {
    const id = fid();
    if (!id || !ctx.outside()) return;
    const o = ctx.other();
    if (id === 'bbc') {
      const b = bbc();
      if (b && (b.hidden || Math.abs(b.tx - o.tx) + Math.abs(b.ty - o.ty) > 6)) {
        ctx.placeExtra(b, ...nearOther(), o.dir);
        fresh();
      }
      return;
    }
    const n = stray(id);
    if (!n || ctx.guest() === n) return;
    ctx.release(n);
    strays.place(n, ...nearOther());
    ctx.escort(n);
  }
  function followBBC() {
    const b = bbc();
    if (fid() !== 'bbc' || !b || !ctx.outside()) return;
    const o = ctx.other();
    if (!last) last = [o.tx, o.ty];
    if (last[0] !== o.tx || last[1] !== o.ty) {
      crumbs.push(last);
      last = [o.tx, o.ty];
    }
    if (b.moving || !crumbs.length) return;
    // (left a long way behind: a climb, a nap, a scene)
    if (crumbs.length > 10) crumbs = crumbs.slice(-2);
    const [x, y] = crumbs[0];
    const d = Math.abs(b.tx - x) + Math.abs(b.ty - y);
    if (d <= 1) {
      crumbs.shift();
      if (d) ctx.stepExtra(b, x - G, y, crumbs.length ? 6 : 9);
      return;
    }
    // off the trail (he stepped aside for somebody): a step back towards it, if there is one
    const step = d > 5 ? null : [[Math.sign(x - b.tx), 0], [0, Math.sign(y - b.ty)]].filter(([dx, dy]) => dx || dy).map(([dx, dy]) => [b.tx + dx, b.ty + dy]).find(([tx, ty]) => ctx.tileFree(tx - G, ty));
    if (step) return ctx.stepExtra(b, step[0] - G, step[1], 6);
    crumbs.shift();
    ctx.placeExtra(b, x - G, y, b.dir);
  }
  // he is in the way of whoever has turned round: he steps aside (or, with nowhere to go, changes places)
  function aside(b, cat) {
    const side = cat.dir === 'left' || cat.dir === 'right' ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]];
    const to = side.map(([dx, dy]) => [b.tx + dx, b.ty + dy]).find(([tx, ty]) => ctx.tileFree(tx - G, ty)) || [cat.tx, cat.ty];
    ctx.stepExtra(b, to[0] - G, to[1], 6);
    fresh();
  }
  const stopFollowing = (id) => {
    if (id && id !== 'bbc' && stray(id) && stray(id).following) ctx.release(stray(id));
    fresh();
  };

  // ------------------------------------------------------------ regroup
  // the first free floor tile at or near (x, y) in the flat
  const floorSpot = (x, y, not = []) => {
    for (let r = 0; r < 6; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++)
          if (Math.max(Math.abs(dx), Math.abs(dy)) === r && ctx.home.free(x + dx, y + dy) && !not.some(([a, b]) => a === x + dx && b === y + dy)) return [x + dx, y + dy];
    return [x, y];
  };
  // In the flat: they tell Stripes and Polka everything, and are fed. Then they wait for the dark.
  function tellScene() {
    const H = ctx.home;
    const [sh, or] = ctx.cats();
    const hs = H.humans();
    H.settle();
    const hSpot = floorSpot(sh.tx, sh.ty - 1);
    const tSpot = floorSpot(or.tx, or.ty - 1, [hSpot]);
    const byMachine = () => {
      FEEDER.forEach(([x, y], i) => H.putCat(i, x, y, 'up'));
      // (one each side of the cats, not in front of them)
      const a = floorSpot(FEEDER[0][0] - 2, FEEDER[0][1] + 1, FEEDER);
      const b = floorSpot(FEEDER[1][0] + 2, FEEDER[1][1] + 1, [a, ...FEEDER]);
      H.standHuman(0, a[0], a[1], 'right');
      H.standHuman(1, b[0], b[1], 'left');
      H.serve('kibble');
    };
    const fed = () => {
      H.serve('none');
      ctx.mend(1);
    };
    // (it is six in the evening if they got home before that; if they took their time and it is later,
    // it stays as late as it is: the clock is not put on to the next day's six. The night runs to 5 AM.)
    const six = () => {
      const hr = ctx.hour();
      if (hr >= 5 && hr < 18) ctx.setClock(18);
    };
    const free = () => {
      H.releaseHuman(0);
      H.releaseHuman(1);
    };
    const meows = (c, p, t) => () => {
      sfx.meow(p);
      ctx.bubble(c, t, 50);
    };
    ctx.playScene('a3j-tell', [
      { call: () => { H.comeTo(0, hSpot[0], hSpot[1], 7); H.comeTo(1, tSpot[0], tSpot[1], 8); } },
      say1(W.tell.in, true),
      { walks: [[0, hSpot[0], hSpot[1]], [1, tSpot[0], tSpot[1]]] },
      { call: () => { hs[0].dir = hs[1].dir = 'down'; sh.dir = or.dir = 'up'; } },
      { call: meows(sh, 620, 'MEOW!') },
      { wait: 40 },
      ...lines(W.tell.try.slice(0, 1), true),
      { call: meows(or, 760, 'MROW!') },
      { wait: 40 },
      ...lines(W.tell.try.slice(1, 2), true),
      { call: meows(sh, 560, 'Meow.') },
      ...lines(W.tell.try.slice(2), true),
      ...lines(W.tell.heard, true),
      { fade: 'out' },
      { call: six },
      { call: byMachine },
      { sfx: 'whirr' },
      { wait: 30 },
      { sfx: 'whirr' },
      { fade: 'in' },
      say1(W.tell.machine, true),
      ...lines(W.tell.alone, true),
      { sfx: 'crunch' },
      { wait: 20 },
      { sfx: 'crunch' },
      { wait: 20 },
      { sfx: 'crunch' },
      { wait: 20 },
      { call: fed },
      say1(W.tell.ate, true),
      ...lines(W.tell.wait, true),
      { call: free },
      { goal: W.goals.wait },
    ], () => {
      six();
      free();
      f().a3jTold = true;
      ctx.setGoal(W.goals.wait, true);
      if (ctx.autosave) ctx.autosave();
    });
  }
  // The front door, once they know when the boat comes: not before ten or after two; and then it is
  // the point of no return, and the game says so.
  let doorSaid = 0;
  const boatHours = () => ctx.hour() >= 22 || ctx.hour() < 2;
  function door(cat, flat) {
    if (flat !== 'home' || ctx.stage() !== 'regroup' || !f().a3jTold) return false;
    if (!boatHours()) return ctx.say(ctx.fmt(W.door.notYet[doorSaid++ % W.door.notYet.length], cat)), true;
    delete S().seen['a3j-leave']; // (a question is never skipped)
    ctx.playScene('a3j-leave', [
      { choice: { who: '', text: W.door.warn, options: [W.door.go, W.door.stay], then: (i) => (i === 0 ? [{ call: leave }] : null) } },
    ]);
    return true;
  }
  // down they go: the last night begins (the hub stops the clock and empties the garden)
  function leave() {
    if (ctx.stage() !== 'regroup') return;
    ctx.go('call');
    ctx.goDown();
  }
  // ...and at the bottom of the stairs: they are going to need help
  function helpScene() {
    ctx.playScene('a3j-help', [
      { wait: 40 },
      ...lines(W.down),
      { goal: W.goals.meow },
    ], () => {
      f().a3jHelp = true;
      ctx.setGoal(W.goals.meow, true);
    });
  }

  // --------------------------------------------------------------- call
  const P = (x, y) => [G + x, y];
  // One meow outside Amber's doors, and they come: from the box, from Garnet, and one from over the road.
  function lineScene() {
    const L = ctx.leader();
    const who = [ctx.cats().indexOf(L), 1 - ctx.cats().indexOf(L)];
    const t = stray('thanos');
    const b = bbc();
    const comes = (id) => [
      ...(id === 'bbc' ? [] : [{ call: () => { appear(stray(id), FROM, 'left'); if (stray(id)) stray(id).pose = 'stand'; } }]),
      { walk: [id, ...P(...spotOf(id))] },
      { face: [id, 'up'] },
    ];
    // Thanos, on three good legs: a step, and a rest
    const limp = [[19, 44], [19, 45], [19, 46], [19, 47], [19, 48], [19, 49], [19, 50], [20, 50], [20, 51]].flatMap(([x, y]) => [{ walk: ['thanos', ...P(x, y)] }, { wait: 7 }]);
    ctx.playScene('a3j-line', [
      { walks: [[who[0] ? 'orca' : 'shark', ...P(...CALL[0])], [who[0] ? 'shark' : 'orca', ...P(...CALL[1])]] },
      { face: ['shark', 'down'] },
      { face: ['orca', 'down'] },
      { call: () => { sfx.meow(520); ctx.bubble(ctx.cats()[0], 'MEOW!', 80); } },
      say1(W.line.meow),
      { wait: 30 },
      ...comes('cheetos'),
      say1(W.line.cheetos),
      ...comes('socks'),
      say1(W.line.socks),
      ...comes('mama'),
      say1(W.line.mama),
      ...comes('scar'),
      say1(W.line.scar),
      { call: () => { if (b) { ctx.placeExtra(b, ...FROM, 'left'); b.fast = 7; } } },
      ...comes('bbc'),
      ...lines(W.line.bbc),
      { call: () => { if (t) { strays.place(t, 19, 43); Object.assign(t, { hidden: false, pause: 1e9, pose: 'stand', dir: 'down' }); } } },
      { wait: 30 },
      say1(W.line.limp),
      ...limp,
      { face: ['thanos', 'up'] },
      ...lines(W.line.thanos),
      ...lines(W.line.once),
      ...lines(W.line.plan),
      ...lines(W.line.foes),
      ...lines(W.line.plan2),
      { goal: W.goals.pick },
    ], () => {
      if (b) delete b.fast;
      f().a3jLine = true;
      ctx.go('pick', W.goals.pick);
    });
  }

  // --------------------------------------------------------------- pick
  // Walked up to in the line (or at the pair's heels): what each says, and the question.
  function ask(id) {
    const cur = fid();
    delete S().seen['a3j-ask']; // (a question is never skipped)
    // while the question is up, so is their card: the three numbers, and each move with what it does
    // (as they would come into this fight: Thanos on two thirds of his HP)
    const card = { call: () => ctx.showCard(id, id === 'bbc' ? bbc() : stray(id), (FINALE_FRIENDS[id] || {}).start) };
    const done = (more) => (ctx.showCard(null), more);
    if (cur === id) {
      return ctx.playScene('a3j-ask', [
        card,
        { choice: { who: id, text: W.pick.along[id], options: [W.pick.stay, W.pick.wait], then: (i) => done(i === 1 ? sendBack() : null) } },
      ], settle);
    }
    ctx.playScene('a3j-ask', [
      ...(id === 'thanos' ? [{ say: ['', W.pick.thanosHurt] }] : []),
      card,
      { choice: { who: id, text: W.pick.ask[id], options: [W.pick.yes, W.pick.no], then: (i) => done(i === 0 ? choose(id) : null) } },
    ], settle);
  }
  function choose(id) {
    const prev = fid();
    if (prev) {
      stopFollowing(prev);
      toLine(prev);
    }
    f().a3jFriend = id;
    fresh();
    if (id !== 'bbc') {
      const n = stray(id);
      n.pause = 0;
      ctx.escort(n);
    }
    return [
      { say: ['', W.pick.joins[id]] },
      ...(prev ? [{ say: ['', W.pick.back.replace('{n}', NAMES[prev])] }] : []),
      { goal: f().a3jBarrier ? W.goals.round : W.goals.jetty },
    ];
  }
  function sendBack() {
    const id = fid();
    stopFollowing(id);
    delete f().a3jFriend;
    toLine(id);
    return [{ say: ['', W.pick.back.replace('{n}', NAMES[id])] }, { goal: W.goals.pick }];
  }
  // the stage follows the pick: with a friend it is `walk`, without one `pick`
  function settle() {
    const st = ctx.stage();
    if (fid() && st === 'pick') ctx.go('walk', f().a3jBarrier ? W.goals.round : W.goals.jetty);
    else if (!fid() && st === 'walk') ctx.go('pick', W.goals.pick);
  }
  // off towards the road with nobody picked
  function notAlone() {
    const i = ctx.cats().indexOf(ctx.leader());
    ctx.playScene('a3j-notalone', [
      ...lines(W.pick.notAlone),
      { walks: [[i ? 'orca' : 'shark', ...P(...CALL[0])], [i ? 'shark' : 'orca', ...P(...CALL[1])]] },
      // (if the way back was shut to them, they are put there: this must never come round twice)
      { call: () => ctx.cats().some((c, n) => gx(c) !== CALL[i ? 1 - n : n][0] || c.ty !== CALL[i ? 1 - n : n][1]) && (ctx.putCat(i ? 1 : 0, ...CALL[0], 'down'), ctx.putCat(i ? 0 : 1, ...CALL[1], 'down')) },
      { face: ['shark', 'down'] },
      { face: ['orca', 'down'] },
    ]);
  }
  // how far along the pavement the pair may go while they pick: as far as Mamacat's box and a little past it
  const PICK_W = ENTRANCE.doorX - 12;
  const PICK_E = FRIEND_SPOTS.reduce((m, [x]) => Math.max(m, x), 0) + 5;

  // --------------------------------------------------------------- walk
  const remark = (flag, list, goal) => {
    f()[flag] = true;
    ctx.playScene('a3j-' + flag, [...lines(list), ...(goal ? [{ goal }] : [])]);
  };
  function walkTick(L) {
    const x = gx(L);
    const y = L.ty;
    if (!f().a3jQuiet && y < ROAD.top - 1) return remark('a3jQuiet', W.walk.quiet);
    if (!f().a3jPlay && x >= 36 && x <= 66 && y >= 20 && y <= 34) return remark('a3jPlay', W.walk.playground);
    if (!f().a3jShed && Math.abs(x - (SHED.x + SHED.w / 2)) <= 9 && Math.abs(y - (SHED.y + 2)) <= 5) return remark('a3jShed', W.walk.shed);
    if (!f().a3jBoard && y <= 16 && x >= 60) return remark('a3jBoard', W.walk.boardwalk);
    // along the boardwalk, coming up to the jetty
    if (y <= 16 && x >= 12 && x <= 34) return jettyScene();
    followBBC();
  }

  // -------------------------------------------------------------- jetty
  // Where everybody stands on the jetty: the three with their backs to the fall, the cats facing them.
  const FACE = { shark: JETTY_FACE[0], orca: JETTY_FACE[1], friend: JETTY_FACE[2] };
  const friendActor = () => (fid() === 'bbc' ? bbc() : fid() ? stray(fid()) : null);
  function stageJetty(cats) {
    ctx.placeExtra(club, ...JETTY_STAND[0], 'left');
    if (green()) ctx.placeExtra(green(), ...JETTY_STAND[1], 'left');
    if (scarf()) {
      ctx.placeExtra(scarf(), ...JETTY_STAND[2], 'left');
      scarf().holds = durianBag();
    }
    for (const e of [club, green(), scarf()]) if (e) Object.assign(e, { pic: null, sat: false });
    hide(...nbs, son, stripes(), polka());
    if (!cats) return;
    ctx.putCat(0, ...FACE.shark, 'right');
    ctx.putCat(1, ...FACE.orca, 'right');
    const a = friendActor();
    if (!a) return;
    if (a.kind === 'extra') ctx.placeExtra(a, ...FACE.friend, 'right');
    else {
      strays.place(a, ...FACE.friend);
      Object.assign(a, { hidden: false, pose: 'stand', dir: 'right' });
    }
  }
  function jettyScene() {
    const id = fid();
    const a = friendActor();
    const o = ctx.other();
    // (a friend who has fallen a long way behind is brought up first)
    if (a && Math.abs(a.tx - o.tx) + Math.abs(a.ty - o.ty) > 8) {
      const [x, y] = nearOther();
      if (a.kind === 'extra') ctx.placeExtra(a, x, y, o.dir);
      else strays.place(a, x, y);
    }
    // the three are on the jetty already, with their heads together (Golf Club in the middle of them)
    const huddle = () => {
      stageJetty(false);
      club.dir = 'right';
      if (green()) green().dir = 'down';
      if (scarf()) scarf().dir = 'up';
      fresh();
    };
    const walkUp = [
      { walks: [['shark', ...P(...FACE.shark)], ['orca', ...P(...FACE.orca)], [id, ...P(...FACE.friend)]], frames: 8 },
      { face: ['shark', 'right'] },
      { face: ['orca', 'right'] },
      { face: [id, 'right'] },
      { call: () => { for (const e of [club, green(), scarf()]) if (e) e.dir = 'left'; ctx.bubble(club, '!', 50); } },
    ];
    const done = () => {
      stageJetty(true);
      ctx.go('jetty');
    };
    // A second try (the fight was lost once): none of it is said again. They walk up, and he has one line.
    if (f().a3jTried) {
      return ctx.playScene('a3j-jetty-again', [
        { call: huddle },
        { camera: P(25, 9) },
        { wait: 30 },
        ...walkUp,
        { wait: 10 },
        say1(W.jetty.again),
      ], done);
    }
    ctx.playScene('a3j-jetty', [
      { call: huddle },
      { camera: P(25, 9) },
      { wait: 40 },
      say1(W.jetty.boat),
      say1(W.jetty.three),
      // what they are saying to each other, before they know anybody is listening
      ...lines(W.jetty.huddle),
      { sfx: 'bark' },
      { wait: 30 },
      ...walkUp,
      { wait: 20 },
      ...lines(W.jetty.speech),
      say1(W.jetty.friend[id]),
    ], done);
  }
  let fighting = false;
  function fight() {
    if (fighting) return;
    fighting = true;
    const F = W.jetty.fight;
    // On the battle screen, before the first turn: the three tips (on every try: the owner's wish), then
    // Shark's piece (not on a second try), and the friend's line (once for each friend).
    const said = (f().a3jPlans = f().a3jPlans || {});
    const tips = W.jetty.tips.map((t) => ['tip', t, ctx.tip(t).note.title]);
    const before = [...tips, ...(f().a3jTried ? [] : F.before), ...(F.plan[fid()] && !said[fid()] ? [F.plan[fid()]] : [])];
    said[fid()] = true;
    ctx.startFight(ENCOUNTERS.finale(fid(), { before, intro: F.intro, won: F.won, lost: F.lost }), {
      keepFriend: true,
      then: (result) => {
        fighting = false;
        if (result === 'won') ctx.go('won');
        else lostScene();
      },
    });
  }
  // Lost: the checkpoint. Outside Amber's doors, fed, with the line still standing and nobody picked.
  function backToDoors() {
    stopFollowing(fid());
    delete f().a3jFriend;
    hide(club, green(), scarf());
    if (!ctx.outside()) return;
    ctx.putCat(0, ...CALL[0], 'down');
    ctx.putCat(1, ...CALL[1], 'down');
    standLine();
    ctx.mend(1);
  }
  function lostScene() {
    f().a3jTried = true;
    ctx.playScene('a3j-lost', [
      { call: () => ctx.blackout() },
      { call: backToDoors },
      { camera: null },
      { wait: 40 },
      { fade: 'in' },
      ...lines(W.lost),
      { goal: W.goals.pick },
    ], () => {
      if (fid() || ctx.stage() !== 'pick') backToDoors();
      ctx.go('pick', W.goals.pick);
    });
  }

  // ---------------------------------------------------------------- won
  // one tile at a time, quickly, by the way given (so that nobody runs through anybody)
  const dash = (who, tiles, frames = 4) => tiles.map(([x, y]) => ({ walks: [[who, ...P(x, y)]], frames }));
  const splash = () => {
    const x = (G + JETTY_SPLASH[0]) * T + 8;
    const y = JETTY_SPLASH[1] * T + 8;
    ctx.burst(x, y, '#dff1ff', 14);
    ctx.burst(x, y, '#8fc4ee', 14);
    ctx.burst(x - 4, y + 2, '#ffffff', 8);
    sfx.crash();
    sfx.poof();
  };
  // the morning after, in the flat (once)
  function morning() {
    const was = fid();
    stopFollowing(was);
    if (was && was !== 'bbc' && stray(was)) strays.settle(stray(was));
    delete f().a3jFriend;
    hide(club, green(), scarf(), ...nbs, son, stripes(), polka(), bbc(), flower(), X('fowner'));
    ctx.showCat(0, true);
    ctx.showCat(1, true);
    if (f().a3jDone) return;
    f().a3jDone = true;
    ctx.toHome();
    ctx.setClock(8);
    ctx.mend(1);
  }
  // Golf Club in the river: his head and shoulders, the club still in his hand, and the water round him
  const floating = (() => {
    const im = club.sp.stand.down;
    const [cv, g] = canvas(im.width, 16);
    g.drawImage(im, 0, 0, im.width, 12, 0, 2, im.width, 12);
    R(g, 2, 13, im.width - 4, 1, '#dff1ff');
    R(g, 0, 14, im.width, 1, '#8fc4ee');
    R(g, 4, 15, im.width - 8, 1, '#dff1ff');
    return cv;
  })();
  function wonScene() {
    const id = fid();
    const friend = friendActor();
    const h = stripes();
    const t = polka();
    const fl = flower();
    const owner = X('fowner');
    // who has fetched the humans: the ones from the line who did not come to the jetty, and are not
    // keeping the kittens (Mamacat and Scar do that)
    const fetchers = ['cheetos', 'socks', 'thanos', 'bbc'].filter((k) => k !== id);
    const actorOf = (k) => (k === 'bbc' ? bbc() : k === 'son' ? son : stray(k));
    const idOf = (k) => (k === 'son' ? son.id : k);
    // where everybody ends up on the boardwalk, east of the gangway: [who, x, y]
    const cats = [...[['cheetos', 34, 14], ['socks', 34, 15], ['bbc', 34, 16], ['thanos', 35, 16]].filter(([k]) => fetchers.includes(k)), ['son', 35, 15]];
    const people = [[h, 36, 15], [t, 36, 14], ...(owner ? [[owner, 36, 16]] : []), [nbs[0], 37, 14], [nbs[1], 37, 15], [nbs[2], 37, 16], [nbs[3], 38, 14], [nbs[4], 38, 15]];
    // ...and on the jetty, once Orca has led them all out onto it: the pair and their friend in front, the
    // two who chased them backed up against the boat, everybody else behind (down the gangway and along it)
    const ON = {
      shark: [26, 9], orca: [26, 10], friend: [25, 8], green: [29, 8], l: [29, 10],
      stripes: [24, 9], polka: [24, 10], fowner: [23, 8], flower: [24, 8],
      cheetos: [21, 9], socks: [21, 10], bbc: [20, 10], thanos: [20, 9], son: [19, 9],
      nbs: [[22, 9], [22, 10], [22, 11], [23, 11], [23, 12]],
    };
    const FROM = 10; // how far east of there they start from (out of the picture)
    const swing = (dir, n) => () => {
      club.dir = dir;
      club.pic = SW[dir][n];
      if (n) sfx.bump();
    };
    const arrive = () => {
      for (const [k, x, y] of cats) {
        const a = actorOf(k);
        if (!a) continue;
        if (a.kind === 'extra') ctx.placeExtra(a, x + FROM, y, 'left');
        else {
          if (a.following) ctx.release(a);
          strays.place(a, x + FROM, y);
          Object.assign(a, { hidden: false, pause: 1e9, pose: 'stand', dir: 'left' });
        }
      }
      for (const [e, x, y] of people) {
        ctx.placeExtra(e, x + FROM, y, 'left');
        e.fast = 7;
      }
      if (fl) ctx.placeExtra(fl, 35 + FROM, 14, 'left');
    };
    const settle = () => {
      for (const [e] of people) delete e.fast;
      for (const [k] of cats) {
        const a = actorOf(k);
        if (a && a.kind !== 'extra') Object.assign(a, { pose: 'sit', dir: 'left' });
      }
    };
    // (he backs away: his feet go north, and he is still looking at where the cats were)
    const back = (x, y) => () => {
      ctx.stepExtra(club, x, y, 12);
      club.dir = 'down';
    };
    ctx.playScene('a3j-won', [
      { call: () => { stageJetty(true); ctx.setBoatDogs(true); ctx.setBarrier(true); } },
      { camera: P(25, 9) },
      { wait: 40 },
      say1(W.won.enough),
      { bubble: ['club', '!!', 60] },
      say1(W.won.cats),
      // at Shark, who goes round him
      { call: () => { club.fast = 6; } },
      { walk: ['club', ...P(25, 9)] },
      { call: swing('left', 0) },
      { wait: 16 },
      ...dash('shark', [[24, 8], [25, 8]]),
      { call: swing('left', 1) },
      ...dash('shark', [[26, 8]]),
      { face: ['shark', 'left'] },
      { wait: 20 },
      say1(W.won.first),
      // at Orca, who does the same
      { call: () => { club.pic = null; } },
      { bubble: ['orca', 'Hsss!', 50] },
      { sfx: 'hiss' },
      { walk: ['club', ...P(24, 10)] },
      { call: swing('left', 0) },
      { wait: 14 },
      ...dash('orca', [[23, 9], [24, 9]]),
      { call: swing('left', 1) },
      ...dash('orca', [[25, 9], [26, 9]]),
      { face: ['orca', 'left'] },
      ...(id ? [{ bubble: [id, '!', 50] }] : []),
      { wait: 20 },
      say1(W.won.second),
      // the other two close in behind the cats; and he swings at both cats at once, with everything he has
      { call: () => { club.pic = null; green().fast = scarf().fast = 9; } },
      { walks: [['green', ...P(27, 8)], ['l', ...P(27, 10)]] },
      { face: ['green', 'left'] },
      { face: ['l', 'left'] },
      { walk: ['club', ...P(25, 10)] },
      { walk: ['club', ...P(25, 9)] },
      { call: swing('right', 0) },
      { wait: 24 },
      { call: () => ctx.lieDown() },
      { wait: 6 },
      { call: swing('right', 1) },
      { call: () => {
        // ...and it goes on into Green Shirt and Purple Scarf
        sfx.crash();
        for (const e of [green(), scarf()]) {
          e.sat = true;
          e.shake = 30;
          ctx.bubble(e, 'OW!', 60);
        }
        scarf().holds = null;
      } },
      { wait: 30 },
      say1(W.won.third),
      ...lines(W.won.ow),
      { call: () => ctx.getUp() },
      // the swing takes him with it: round, back two steps, and off the north edge
      { call: () => { club.pic = null; club.dir = 'down'; } },
      say1(W.won.over[0]),
      { call: back(JETTY_FALL[0], JETTY_FALL[1] + 1) },
      { wait: 14 },
      say1(W.won.over[1]),
      { call: back(...JETTY_FALL) },
      { wait: 14 },
      say1(W.won.over[2]),
      { call: () => { ctx.stepExtra(club, ...JETTY_SPLASH, 8); club.dir = 'down'; sfx.jump(); } },
      { wait: 9 },
      { call: () => { club.pic = floating; delete club.fast; splash(); ctx.bubble(green(), '!', 70); ctx.bubble(scarf(), '!', 70); } },
      { wait: 30 },
      { sfx: 'bark' },
      { wait: 30 },
      ...lines(W.won.splash),
      // the other two go for the cats, and chase them off the jetty and a little way along the boardwalk
      { call: () => { green().sat = scarf().sat = false; green().fast = scarf().fast = 7; if (id === 'bbc' && bbc()) bbc().fast = 4; } },
      say1(W.won.chase[0]),
      { camera: P(29, 12) },
      { walks: [['shark', ...P(31, 14)], ['orca', ...P(32, 15)], ...(id ? [[id, ...P(31, 16)]] : []), ['green', ...P(27, 15)], ['l', ...P(27, 14)]], frames: 4 },
      { call: () => { if (bbc()) delete bbc().fast; } },
      { face: ['shark', 'left'] },
      { face: ['orca', 'left'] },
      ...(id ? [{ face: [id, 'left'] }] : []),
      { face: ['green', 'right'] },
      { face: ['l', 'right'] },
      say1(W.won.chase[1]),
      // ...where everybody else is: the cats who went for the humans, the humans, and Flower with hers
      { call: arrive },
      { wait: 20 },
      { walks: [...cats.filter(([k]) => actorOf(k)).map(([k, x, y]) => [idOf(k), ...P(x, y)]), ...people.map(([e, x, y]) => [e.id, ...P(x, y)]), ...(fl ? [['flower', ...P(35, 14)]] : [])], frames: 6 },
      { call: settle },
      { face: ['shark', 'right'] },
      { face: ['orca', 'right'] },
      { call: () => { for (const e of [green(), scarf()]) ctx.bubble(e, '!', 60); } },
      ...lines(W.won.crowd),
      // nobody there knows what they are looking at; and the two who were chasing think better of it
      { call: () => { ctx.bubble(nbs[0], '?', 60); ctx.bubble(nbs[1], '?', 60); } },
      ...lines(W.won.confused),
      { call: () => { green().fast = scarf().fast = 6; } },
      { walks: [['green', ...P(23, 14)], ['l', ...P(22, 14)]] },
      { walks: [['green', ...P(...ON.green)], ['l', ...P(...ON.l)]] },
      { face: ['green', 'left'] },
      { face: ['l', 'left'] },
      // Orca has seen Stripes and Polka among them: he goes over, and asks
      ...lines(W.won.spots),
      { walks: [['orca', ...P(33, 15)]] },
      { face: ['orca', 'right'] },
      { face: ['shark', 'right'] },
      ...lines(W.won.ask),
      { call: () => { sfx.meow(760); ctx.bubble(ctx.cats()[1], 'MEOW!', 70); } },
      { wait: 40 },
      { walks: [['orca', ...P(30, 15)]], frames: 8 },
      { face: ['orca', 'right'] },
      say1(W.won.call),
      { call: () => { ctx.bubble(h, '!', 60); ctx.bubble(t, '!', 60); } },
      ...lines(W.won.follow),
      // the cats lead, and everybody follows: down the gangway and out onto the jetty
      { call: () => { for (const [e] of people) e.fast = 8; if (fl) fl.fast = 8; } },
      { camera: 'orca' },
      { walks: [
        ['orca', ...P(...ON.orca)], ['shark', ...P(...ON.shark)], ...(id ? [[id, ...P(...ON.friend)]] : []),
        ['stripes', ...P(...ON.stripes)], ['polka', ...P(...ON.polka)], ...(owner ? [['fowner', ...P(...ON.fowner)]] : []), ...(fl ? [['flower', ...P(...ON.flower)]] : []),
        ...cats.filter(([k]) => actorOf(k)).map(([k]) => [idOf(k), ...P(...ON[k])]),
        ...nbs.map((e, i) => [e.id, ...P(...ON.nbs[i])]),
      ], frames: 8 },
      { call: () => {
        settle();
        if (fl) delete fl.fast;
        for (const k of ['shark', 'orca']) ctx.cats()[k === 'shark' ? 0 : 1].dir = 'right';
        for (const [e] of people) e.dir = 'right';
        for (const e of nbs.slice(2)) e.dir = 'up';
        for (const [k] of cats) if (actorOf(k)) actorOf(k).dir = 'right';
      } },
      ...(id ? [{ face: [id, 'right'] }] : []),
      { camera: P(25, 9) },
      { wait: 30 },
      say1(W.won.lead),
      // (what they are looking at: the boat, its dogs, and the man in the water)
      { camera: P(26, 7) },
      { wait: 40 },
      ...lines(W.won.found),
      { camera: P(25, 9) },
      { wait: 20 },
      // Flower's human knows him; and Flower has come down too
      ...(fl ? lines(W.won.flower) : []),
      ...lines(W.won.neighbours),
      { call: () => { ctx.bubble(h, '!', 60); ctx.bubble(t, '!', 60); sfx.blip(); } },
      say1(W.won.film),
      // black, and what came of it: one sentence to a box
      { fade: 'out' },
      { wait: 30 },
      ...lines(W.won.after),
      // the dogs, at the vet's (a picture): nobody's enemies, only hungry and frightened
      { picture: 'dogs' },
      { wait: 20 },
      { fade: 'in' },
      { wait: 40 },
      ...lines(W.won.vet),
      { fade: 'out' },
      { wait: 20 },
      { picture: null },
      { camera: null },
      { call: morning },
      // ...and, after a long moment in the dark, the epilogue (act3-after.js), which ends the scene
      { wait: 200 },
      ...ctx.homecoming(),
    ], () => {
      morning();
      ctx.go('after');
      ctx.homecomingDone();
    });
  }

  // -------------------------------------------------------------- after
  // Everybody is their own cat again; BBC and Flower sit on Garnet's step. Scar keeps house by the
  // humming box next to Garnet now, with the kittens (the night's part seats them there): a mother and
  // her small ones by each building. She still goes over the road to look at her shed. And Thanos, on
  // his rounds, looks in at both boxes. (Both by changing where each of them calls home: strays.js
  // does the rest. reset() puts it back for any other game.)
  // (and Socks has the boardwalk and the far sidewalk now.) What changes for each is `after` in strays.js.
  const afterHomes = (on) => applyAfter(on);
  const reset = () => afterHomes(false);
  function freeAll() {
    afterHomes(true);
    for (const id of ['cheetos', 'socks', 'mama', 'thanos', 'baby']) letGo(stray(id));
    hide(club, green(), scarf(), ...nbs, son, stripes(), polka(), X('fowner'));
    if (bbc()) ctx.placeExtra(bbc(), ...GARNET_STEP[0], 'down');
    if (flower()) ctx.placeExtra(flower(), ...GARNET_STEP[1], 'down');
    // Scar, by her new box the first time, and her own cat from there
    const s = stray('scar');
    if (s && !s.following && ctx.guest() !== s && (s.pause >= 1e6 || s.hidden)) {
      appear(s, s.def.home[1], 'down');
      s.pause = 0;
    }
  }
  let said = 0;
  const turn = (list) => list[said++ % list.length];

  // ------------------------------------------------------------- hooks
  function enter(st) {
    // (until they have called, the pair stay where they are, outside Amber's doors: a meow is all there is to do)
    if (st === 'call' && !f().a3jLine) f().noWalk = true;
    else delete f().noWalk;
    // (from the call to the jetty nothing in the garden answers: no tree, no faucet, no slide)
    if (['call', 'pick', 'walk', 'jetty'].includes(st)) f().noThings = true;
    else delete f().noThings;
    if (st !== 'after') afterHomes(false);
    if (!MINE.includes(st)) return void hide(club, greenShirt, ...nbs, son);
    if (st !== 'jetty' && st !== 'won') hide(club, green(), scarf(), ...nbs, son);
    if (st === 'regroup') {
      // (the goal as the game words it now: a game saved here keeps the words it was saved with, and
      // the two humans were called something else before version 1.0.2)
      if (!f().a3jTold) ctx.story().goal = GARNET_WORDS.goals.regroup;
      return void hide(bbc(), flower());
    }
    hide(flower());
    if (st === 'call' && !f().a3jLine) return waitAtBox();
    if (st === 'after') {
      stopFollowing(fid());
      delete f().a3jFriend;
      return freeAll();
    }
    standLine();
    if (st === 'pick' || st === 'walk') friendAlong();
    if (st === 'jetty') stageJetty(false);
    if (st === 'won') {
      stageJetty(false);
      ctx.setBoatDogs(true);
      ctx.setBarrier(true);
    }
  }
  function update(st) {
    const L = ctx.leader();
    const out = ctx.outside();
    if (st === 'regroup') {
      if (!out && ctx.floor() === 'home' && !f().a3jTold) return tellScene();
      // (a pair who wander over to the dock on the way home: the dogs in their cages, and no boat)
      if (out && !f().a3jHeld && L.ty <= 16 && gx(L) >= 10 && gx(L) <= 36) remark('a3jHeld', W.walk.held);
      return;
    }
    if (!out) return;
    if (st === 'call') {
      if (!f().a3jHelp && !f().a3jLine) return helpScene();
      return;
    }
    if (st === 'pick') {
      if (L.ty <= KERB_S || gx(L) < PICK_W || gx(L) > PICK_E) notAlone();
      return;
    }
    if (st === 'walk') return walkTick(L);
    if (st === 'jetty') return fight();
    if (st === 'won') return wonScene();
  }
  // a meow: outside Amber's doors, in `call`, it is the one that counts
  function meow(cat) {
    if (ctx.stage() !== 'call' || !ctx.outside() || f().a3jLine) return false;
    const near = cat.ty > ROAD.bottom && Math.abs(gx(cat) - ENTRANCE.doorX) <= 9;
    if (!near) return ctx.say(W.far), true;
    lineScene();
    return true;
  }
  // Do, in front of one of the garden's cats
  function talk(cat, n) {
    const st = ctx.stage();
    const id = n.def.id;
    if (st === 'regroup' || !n.named) return false;
    if (st === 'call' && !f().a3jLine) {
      if (W.waiting[id]) ctx.say(ctx.fmt(W.waiting[id][0], cat));
      return true;
    }
    if (id === 'baby') return ctx.say(W.pick.baby), true;
    if (!LINE.includes(id)) return true;
    if (st === 'pick' || st === 'walk') ask(id);
    return true;
  }
  // ...and walking into one of the story's own
  function bump(cat, e) {
    const st = ctx.stage();
    if (e.id === 'bbc') {
      if (st !== 'pick' && st !== 'walk') return true;
      // at the pair's heels he is in the way of whoever turns round: he changes places
      if (fid() === 'bbc') {
        if (!e.moving) aside(e, cat);
        return true;
      }
      if (fid() !== 'bbc') ask('bbc');
      return true;
    }
    return [club, greenShirt, ...nbs, son].includes(e) || (MINE.includes(st) && ['l', 'stripes', 'polka'].includes(e.id));
  }
  // the barrier, the first time it is walked into
  function object(cat, o) {
    // (Amber's doors, on the last night: there is no going back up)
    if (o.type === 'amber') return ['call', 'pick', 'walk', 'jetty'].includes(ctx.stage()) ? (ctx.say(ctx.fmt(W.door.noBack, cat)), true) : false;
    if (o.type !== 'barrier' || f().a3jBarrier || !['pick', 'walk'].includes(ctx.stage())) return false;
    remark('a3jBarrier', W.walk.barrier, fid() ? W.goals.round : null);
    return true;
  }
  // (while the dogs wait in their cages along the dock, nobody strolls onto it)
  const keepOut = (st) => (st === 'regroup' ? [{ box: [16, 6, 31, 10] }] : []);
  function present(id, st) {
    if (!MINE.includes(st) || st === 'regroup') return undefined;
    if (st === 'after') return undefined;
    if (st === 'call' && !f().a3jLine) return id === 'thanos' || id in AT_BOX ? false : undefined;
    return ['cheetos', 'socks', 'mama', 'scar', 'thanos', 'baby'].includes(id) ? true : undefined;
  }
  // Mission select and the tests: the pair, the clock and this part's flags as the stage begins
  function jump(st) {
    for (const k of Object.keys(f())) if (k.startsWith('a3j')) delete f()[k];
    fresh();
    fighting = false;
    const i = MINE.indexOf(st);
    if (i < 0) return;
    // (the last night: some time in the boat's hours)
    const evening = () => {
      if (!boatHours()) ctx.setClock(22.5);
    };
    if (st === 'regroup') {
      ctx.putCat(0, ...GARNET_OUT[0], 'down');
      ctx.putCat(1, ...GARNET_OUT[1], 'down');
      ctx.story().goal = GARNET_WORDS.goals.regroup;
      return;
    }
    f().a3jTold = true;
    evening();
    if (i >= MINE.indexOf('pick')) f().a3jLine = true;
    if (st === 'walk' || st === 'jetty' || st === 'won') f().a3jFriend = 'thanos';
    if (st === 'jetty' || st === 'won') {
      Object.assign(f(), { a3jQuiet: true, a3jPlay: true, a3jShed: true, a3jBoard: true });
      return void stageJetty(true);
    }
    if (st === 'after') f().a3jDone = true;
    ctx.putCat(0, ...CALL[0], 'down');
    ctx.putCat(1, ...CALL[1], 'down');
    // (`call` opens with a scene that puts its goal up in a box: no goal before it, or the box is left out)
    S().goal = st === 'pick' ? W.goals.pick : st === 'walk' ? W.goals.jetty : '';
  }

  // the friend picked for the last fight, while it walks with the pair (for the cats' sheet): its kind,
  // the one walking, and what it comes into the fight on
  const friend = () => {
    const id = fid();
    if (!id || !['pick', 'walk', 'jetty'].includes(ctx.stage())) return null;
    return { kind: id, who: id === 'bbc' ? bbc() : stray(id), start: (FINALE_FRIENDS[id] || {}).start || {} };
  };
  return { update, enter, jump, reset, meow, talk, bump, object, door, present, keepOut, friend, debug: { club, nbs, fid, stageJetty, boatHours } };
}
