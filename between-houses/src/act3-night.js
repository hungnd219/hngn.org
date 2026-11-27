// Act 3, part "night": the night of the dogs, and the morning after (see act3.js for the stages).
//
//   open     Outside Amber's doors as Act 2 ends. The view goes over the road and the playground,
//            where the dogs are, and on to a tree by the monkey bars with Cheetos up it.
//   cheetos  A dog stands under that tree. When it notices the pair: the fight (one dog, which
//            only barks: nobody would hear it howl). Won, Cheetos comes down, and comes along.
//   east     The player's own way east, bush to bush, with Cheetos behind. Near the shed:
//   shed     Scar and three kittens cornered by three dogs; Socks takes them over the road; the
//            dogs turn on the pair; Thanos. The fight: the pair and Thanos against three dogs.
//            (The stage is `shed` from the end of that scene: if the fight is lost, Thanos holds
//            the dogs off there until the pair come back.)
//   tobox    Back over the road to Mamacat's box, where everybody is. Sleep.
//   morning  Hưng and Trang find them there. Then the Garnet part takes over.
//
// This part also answers, for the whole act up to `regroup`, where the garden's named cats are
// (`present`, and `keep` which puts them there): at Mamacat's box from the moment each gets there,
// Thanos by the shed. The three kittens are its own (kit0..kit2) and stay by Scar to the end of the
// act. Nothing here is saved but the stage and a few flags (a3nTip2, thanosHurt): `enter` puts
// everybody where those say.
import { A3 as W } from './act3-night-text.js';
import { ENCOUNTERS } from './story.js';
import { CHEETOS_TREE, UNDER_TREE, SHED, FRIEND_SPOTS, START, PAVE_S, PLANT_S, KERB_S, AC_UNITS, gardenBlocked, isRoad, onCrossing } from './garden.js';
import { makeKittens } from './act3-art.js';
import { makeCat } from './sprites.js';
import { RANDOM_COATS } from './strays.js';

const T = 16;
const MINE = ['open', 'cheetos', 'east', 'shed', 'tobox', 'morning'];
// the stages in which this part says where the named cats are: its own, and the Garnet part's, and `regroup`
const KEEPS = [...MINE, 'garnet', 'doors', 'favours', 'wait', 'boxed', 'balcony', 'flat', 'durian', 'regroup'];
const NAMED = ['cheetos', 'socks', 'mama', 'baby', 'scar', 'thanos'];
// where each sits by the box (garden tiles), and which way it looks
const seat = (i, dir) => [FRIEND_SPOTS[i][0], FRIEND_SPOTS[i][1], dir, FRIEND_SPOTS[i][2] || 0];
const SEAT = { cheetos: seat(0, 'right'), socks: seat(1, 'right'), mama: seat(2, 'down'), baby: seat(3, 'down'), scar: seat(4, 'left') };
const KIT_SEATS = [FRIEND_SPOTS[5], FRIEND_SPOTS[6], FRIEND_SPOTS[7]];
// Mamacat's white friend (who fought beside her in Act 1, to pay a favor) sits by the box with the
// others, from the night of the dogs until the last night: a little way east of the kittens
const WHITE_SPOT = [43, PAVE_S + 2];
const WHITE_STAGES = ['tobox', 'morning', 'garnet', 'doors', 'favours', 'wait', 'boxed', 'balcony', 'flat', 'durian', 'regroup'];
// ...and once it is all over: by the humming box next to Garnet, where Scar keeps house with them
const KIT_AFTER = [[AC_UNITS[1].x, PAVE_S + 2], [AC_UNITS[1].x + 4, PAVE_S + 2], [AC_UNITS[1].x - 1, PLANT_S]];
// where the pair lie down by the box, and wake
const BED = [[31, PAVE_S + 2], [32, PAVE_S + 2]];
// the shed: who stands where in its scene, and afterwards
const AT = {
  pair: [[88, 31], [88, 32]], cheetos: [87, 32], socksFrom: [79, 32], socks: [88, 30], // (she comes out of the bushes to the west)
  scar: [100, 33], kits: [[99, 32], [100, 32], [101, 32]], // she in front of the roof, they behind her at its edge
  dogs: [[96, 34], [98, 34], [102, 34]], // barking at the shed
  dogsLook: [[95, 34], [97, 34], [101, 34]], // ...turned round, at Orca's meow
  dogsTurned: [[92, 32], [94, 33], [93, 34]], // ...and facing the pair (clear of the roof)
  thanosFrom: [91, 25], thanos: [90, 32],
  in: [[102, 32], [103, 32]], // Socks and Cheetos, in under the roof
  away: [[109, 35], [109, 34], [108, 34], [110, 34], [108, 33], [110, 33]], // Socks, Scar, the kittens, Cheetos: off to Garnet's crossing
  round: [92, 27], // (Socks goes round by the north)
  bush: [[78, 33], [77, 33]], // where the pair fetch up if the fight is lost
  dogsOff: [[107, 32], [108, 33], [107, 34]],
};
// close to the shed itself: one step short of its pavers on the west (they begin at SHED.x - 1), and no
// further north than three rows above its roof (the pavers run on north to the boardwalk: coming down
// them from there, the scene waits until the pair are by the shed)
const inShedZone = (x, y) => x >= SHED.x - 2 && x <= SHED.x + SHED.w + 5 && y >= SHED.y - 3 && y <= 35;
const backAtShed = (x, y) => x >= 84 && x <= 98 && y >= 26 && y <= 35;
const atBox = (x, y) => y > KERB_S && x >= 20 && x <= 44;

export function create(ctx) {
  const { GOX, strays, people, sfx } = ctx;
  const S = () => ctx.story();
  const f = () => S().flags;
  const by = (id) => strays.byId[id];
  const P = (p) => [GOX + p[0], p[1]];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const mine = (st = ctx.stage()) => MINE.includes(st);

  // ---- the part's own actors: three kittens, three dogs for its scenes, and something for the view to follow
  const kits = makeKittens().map((sp, i) => ctx.addExtra('kit' + i, W.kitten, sp, { low: true }));
  const whitePal = RANDOM_COATS.find((c) => c.what === 'white cat');
  const white = ctx.addExtra('a3nwhite', W.whiteName, makeCat(whitePal.pal, { coat: whitePal.coat }), { low: true });
  const sdogs = ['tan', 'black', 'patched'].map((coat, i) => ctx.dogs.actor('a3dog' + i, coat));
  const eye = ctx.addExtra('a3eye', '', makeKittens()[0], { low: true, fast: 6 }); // (never shown)
  const hung = () => ctx.extra('hung');
  const trang = () => ctx.extra('trang');
  const green = () => ctx.extra('green'); // (Green Shirt: the jetty part's, borrowed for the first scene)
  // the act begins at night, after Hưng and Trang have gone to bed (and the clock stands still until
  // the pair are asleep by the box: see `night` in WORLD)
  const isNight = () => ctx.hour() >= 22 || ctx.hour() < 3;
  let treeDog = null; // the dog under Cheetos's tree: one of the roaming kind, put there by hand
  let saidAt = -9999;

  // ---- where everybody is
  // A named cat's place at this point of the story: [x, y, dir, up] (garden tiles; `up`: pixels off the
  // ground), null (out of sight), 'along' (with the pair), or undefined (not this part's to say).
  function where(id) {
    const st = ctx.stage();
    if (!KEEPS.includes(st)) return undefined;
    const sent = !ctx.before('shed'); // Socks has taken the others over the road, and Thanos has come
    if (id === 'mama' || id === 'baby') return SEAT[id];
    if (id === 'cheetos') return st === 'open' || st === 'cheetos' ? [...CHEETOS_TREE, 'down', 30] : sent ? SEAT.cheetos : 'along';
    if (id === 'socks' || id === 'scar') return sent ? SEAT[id] : null;
    if (id === 'thanos') return sent ? [...AT.thanos, 'right'] : null;
    return undefined;
  }
  const kitsOut = () => !!ctx.stage() && !ctx.before('shed');
  function sit(n, [x, y, dir, up]) {
    strays.place(n, x, y);
    Object.assign(n, { hidden: false, pause: 1e9, pose: 'sit', dir: dir || 'down' });
    if (up) n.z = up;
  }
  // One of them walks back to its place, in plain sight (a friend who has been sent home, say): the way
  // there, handed to the cat as its own next steps. False if there is no short way.
  function walkTo(n, [tx, ty]) {
    const from = [n.tx - GOX, n.ty];
    const key = (x, y) => x + ',' + y;
    const prev = new Map([[key(...from), null]]);
    const q = [from];
    let found = false;
    for (let i = 0; i < q.length && i < 2500 && !found; i++) {
      const [x, y] = q[i];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (prev.has(key(nx, ny)) || gardenBlocked(nx, ny) || (isRoad(ny) && !onCrossing(nx))) continue;
        prev.set(key(nx, ny), [x, y]);
        if (nx === tx && ny === ty) {
          found = true;
          break;
        }
        q.push([nx, ny]);
      }
    }
    if (!found) return false;
    const path = [];
    for (let c = [tx, ty]; prev.get(key(c[0], c[1])); c = prev.get(key(c[0], c[1]))) path.unshift(c);
    Object.assign(n, { path, pause: 0, then: null, timer: 1e9, sleepy: false, pose: 'stand', homing: true });
    return true;
  }
  // Everybody where the story has them. force: at once, whoever is looking (a stage has just begun, a
  // game has been loaded); otherwise only what nobody would see happen.
  function keep(force) {
    if (!ctx.outside()) return;
    for (const id of NAMED) {
      const n = by(id);
      const w = n && where(id);
      if (!n || w === undefined || w === 'along' || strays.tagging(n)) continue;
      const seen = !n.hidden && ctx.visible(n.px, n.py);
      if (w === null) {
        if (!n.hidden && (force || !seen)) n.hidden = true;
        continue;
      }
      const there = !n.hidden && n.tx === GOX + w[0] && n.ty === w[1];
      if (!there && !n.moving) {
        if (force || !seen) sit(n, w);
        else if (!(n.homing && n.path.length) && !w[3]) walkTo(n, w); // (in plain sight: it walks back)
      }
      if (there && !n.moving) {
        n.pause = 1e9; // (talking to one sets it thinking of somewhere else to be)
        if (n.homing) Object.assign(n, { homing: false, pose: 'sit', dir: w[2] || 'down', path: [] });
        if (w[3]) n.z = w[3];
      }
    }
    const out = kitsOut();
    kits.forEach((k, i) => {
      if (!out) return void (k.hidden = true);
      const [x, y] = (ctx.stage() === 'after' ? KIT_AFTER : KIT_SEATS)[i];
      if (k.hidden || ((k.tx !== GOX + x || k.ty !== y) && force)) ctx.placeExtra(k, x, y, i === 1 ? 'left' : 'down');
      if (!k.moving) k.pic = k.sp.sit[k.dir];
    });
    if (!WHITE_STAGES.includes(ctx.stage())) white.hidden = true;
    else if (white.hidden || (force && (white.tx !== GOX + WHITE_SPOT[0] || white.ty !== WHITE_SPOT[1]))) ctx.placeExtra(white, WHITE_SPOT[0], WHITE_SPOT[1], 'left');
    if (!white.hidden && !white.moving && white.sp && white.sp.sit) white.pic = white.sp.sit[white.dir];
  }
  // (The game asks this of every named cat every half second or so, at every stage of the act: that is
  // also when the friends are put back on their places, since update() below is only this part's while
  // the stage is one of its own.)
  let keptAt = -1;
  function present(id) {
    if (!mine() && ctx.frame() !== keptAt && !ctx.busy()) {
      keptAt = ctx.frame();
      keep(false);
    }
    const w = where(id);
    return w === undefined ? undefined : w !== null;
  }
  function linesFor(n) {
    const st = ctx.stage();
    if (!n.named || !KEEPS.includes(st)) return null;
    const id = n.def.id;
    if (id === 'cheetos' && (st === 'open' || st === 'cheetos')) return W.cheetosUp;
    if (id === 'cheetos' && st === 'east') return W.cheetosBehind;
    if (st === 'regroup') return W.goneLines[id] || null;
    return ((ctx.before('morning') ? W.nightLines : W.friendLines)[id]) || null;
  }

  // ---- the dog under the tree
  const drop = (d) => {
    const i = ctx.dogs.list.indexOf(d);
    if (i >= 0) ctx.dogs.list.splice(i, 1);
  };
  function treeDogHere() {
    if (treeDog && ctx.dogs.list.includes(treeDog)) return treeDog;
    treeDog = ctx.dogs.put(UNDER_TREE[0], UNDER_TREE[1], { coat: 'tan', still: true, dir: 'up' });
    if (treeDog) Object.assign(treeDog, { pose: 'look', pause: 200 });
    return treeDog;
  }
  function noTreeDog() {
    if (treeDog) drop(treeDog);
    treeDog = null;
  }
  // every other dog that was after the pair forgets them (the story has taken this moment over)
  function callOthersOff(but) {
    for (const o of ctx.dogs.list) {
      if (o === but || (o.state !== 'chase' && o.state !== 'wait')) continue;
      Object.assign(o, { state: 'roam', path: [], spot: null, pose: 'stand', pause: 30, blind: 600 });
    }
  }
  const hideActors = () => {
    for (const d of sdogs) Object.assign(d, { hidden: true, pose: 'stand' });
    eye.hidden = true;
  };

  // ------------------------------------------------------------------ open
  function openScene() {
    const late = !isNight();
    const d = treeDogHere();
    const g = green();
    // (no pool of light around this dog while the view is on it: that is for the tips, afterwards)
    if (d) d.noRing = true;
    // Green Shirt comes across the playground from the east, out of the picture, and goes back that way
    const gFrom = [UNDER_TREE[0] + 13, UNDER_TREE[1] + 1];
    const gAt = [UNDER_TREE[0] + 2, UNDER_TREE[1]];
    // (and out again along the open row north of the bushes, to a tile past the edge of the picture: the tile he
    // comes in from is not one a walk can end on, so a walk back to it gave up after one step)
    const gOut = [UNDER_TREE[0] + 16, UNDER_TREE[1] - 2];
    const c = by('cheetos');
    people.clear(); // (nobody sits out among the dogs: the benches are empty)
    const tour = () => {
      ctx.placeExtra(eye, START[0][0], START[0][1], 'up');
      eye.hidden = true;
    };
    const bark = () => {
      if (d) Object.assign(d, { pose: 'bark', dir: 'up' });
      sfx.bark();
    };
    ctx.playScene('a3-open', [
      ...(late ? [{ fade: 'out' }, { call: () => ctx.setClock(22.5) }, { wait: 12 }, { fade: 'in' }] : []),
      { wait: 30 },
      { say: W.open.doorstep },
      { call: tour },
      { camera: 'a3eye' },
      { walk: ['a3eye', ...P([18, 42])] },
      { walk: ['a3eye', ...P([18, 35])] },
      { walk: ['a3eye', ...P([24, 30])] },
      { walk: ['a3eye', ...P([34, 28])] },
      { walk: ['a3eye', ...P([42, 27])] },
      { wait: 30 },
      { say: W.open.dogs },
      { walk: ['a3eye', ...P([52, 29])] },
      { walk: ['a3eye', ...P([60, 30])] },
      { walk: ['a3eye', ...P([CHEETOS_TREE[0], CHEETOS_TREE[1] - 1])] },
      { wait: 30 },
      { call: bark },
      { call: () => d && ctx.bubble(d, 'WOOF!', 60) },
      { wait: 60 },
      { say: W.open.tree },
      ctx.tip(W.tip1),
      // Green Shirt, and what he thinks of a dog that only barks
      { call: () => { if (g) ctx.placeExtra(g, gFrom[0], gFrom[1], 'left'); } },
      { say: W.open.greenIn },
      { walk: ['green', ...P([gAt[0], gFrom[1]])] },
      { walk: ['green', ...P(gAt)] },
      { face: ['green', 'left'] },
      { call: () => { if (d) Object.assign(d, { pose: 'look', dir: 'right' }); } },
      ...ctx.lines(W.open.green.slice(0, 2)),
      { call: () => { if (d) Object.assign(d, { pose: 'cower', dir: 'right', hd: 'right' }); sfx.startle(); } },
      { wait: 30 },
      ...ctx.lines(W.open.green.slice(2)),
      { walk: ['green', ...P(gOut)] },
      { call: () => { if (g) g.hidden = true; } },
      { wait: 20 },
      { call: bark },
      { call: () => ctx.bubble(c, '!!', 60) },
      { wait: 70 },
      { fade: 'out' },
      { camera: null },
      { call: hideActors },
      { call: () => { if (d) d.noRing = false; } },
      { wait: 10 },
      { fade: 'in' },
      { face: ['orca', 'up'] },
      { face: ['shark', 'up'] },
      ...ctx.lines(W.open.pair),
      { goal: W.goalCheetos },
    ], () => {
      hideActors();
      if (g) g.hidden = true;
      if (d) Object.assign(d, { pose: 'look', dir: 'up', noRing: false });
      ctx.go('cheetos', W.goalCheetos);
    });
  }

  // --------------------------------------------------------------- cheetos
  function tickCheetos() {
    const d = treeDogHere();
    if (!d) return;
    // the first dog of all to notice them, before anything has been said about rings
    if (!f().a3nTip2 && ctx.dogs.list.some((o) => o !== d && o.state === 'chase')) {
      f().a3nTip2 = true;
      return ctx.playScene('a3-tip2', [ctx.tip(W.tip2)]);
    }
    if (d.state === 'chase' || d.state === 'wait') return treeFight();
    // (it went off in somebody else's fight, and that fight was won: Cheetos can come down all the same)
    if (d.state === 'cowed') return treeWon();
    const home = d.tx === GOX + UNDER_TREE[0] && d.ty === UNDER_TREE[1];
    if (!home && !d.moving && !ctx.visible(d.px, d.py)) return noTreeDog(); // (it wandered: back under the tree, unseen)
    if (home && !d.moving && d.pose !== 'bark') Object.assign(d, { dir: 'up', pose: 'look' });
  }
  // It has seen them: a word about rings if there has been none, and the fight.
  function treeFight() {
    const d = treeDog;
    callOthersOff(d);
    Object.assign(d, { state: 'roam', path: [], spot: null, pose: 'bark', blind: 1e7, pause: 1e7 });
    const first = !f().a3nTip2;
    f().a3nTip2 = true;
    ctx.playScene('a3-tree-dog', [{ wait: 20 }, { say: W.treeSeen }, ...(first ? [ctx.tip(W.tip2)] : [])], () => {
      ctx.startFight(ENCOUNTERS.dogs(1, { ...W.treeFight, lone: true }), { then: (result) => (result === 'won' ? treeWon() : treeLost()) });
    });
  }
  function treeLost() {
    if (treeDog) Object.assign(treeDog, { pose: 'look', dir: 'up', blind: 600, pause: 60 });
    ctx.dogsLost();
  }
  // The dog goes; Cheetos comes down, tells what he has heard, and comes along.
  function treeWon() {
    const d = treeDog;
    const a = sdogs[0];
    const from = d ? [d.tx - GOX, d.ty] : UNDER_TREE;
    noTreeDog();
    ctx.placeExtra(a, from[0], from[1], 'right');
    a.pose = 'cower';
    const c = by('cheetos');
    const foot = ctx.freeNear(CHEETOS_TREE[0] + 1, CHEETOS_TREE[1] + 1, 2);
    const land = () => {
      strays.place(c, foot[0], foot[1]);
      Object.assign(c, { hidden: false, pose: 'stand', dir: 'down', pause: 1e9 });
    };
    let t = 0;
    let x0 = 0;
    let y0 = 0;
    ctx.playScene('a3-cheetos-down', [
      { camera: [GOX + CHEETOS_TREE[0], CHEETOS_TREE[1]] },
      { wait: 50 },
      { call: () => (a.pose = 'stand') },
      { walk: ['a3dog0', ...P([from[0] + 9, 33])] },
      { call: () => (a.hidden = true) },
      { wait: 20 },
      { call: () => { x0 = c.px; y0 = c.py; sfx.scratch(); } },
      // down the trunk, backwards, and none too gracefully
      { until: () => {
        const k = Math.min(1, ++t / 26);
        c.px = lerp(x0, (GOX + foot[0]) * T, k);
        c.py = lerp(y0, foot[1] * T, k);
        c.z = 30 * (1 - k);
        return k >= 1;
      } },
      { call: land },
      { sfx: 'land' },
      { bubble: ['cheetos', '!!', 50] },
      { camera: null },
      ...ctx.lines(W.cheetosDown),
      ctx.tip(W.tip3),
      { say: W.cheetosJoins },
      { goal: W.goalEast },
    ], () => {
      a.hidden = true;
      a.pose = 'stand';
      land();
      ctx.escort(c);
      ctx.go('east', W.goalEast);
    });
  }

  // ------------------------------------------------------------------ east
  // Cheetos is behind the pair, whatever has happened (they went indoors and he was left; a game was loaded)
  function cheetosAlong(quiet) {
    const c = by('cheetos');
    if (ctx.guest() === c || ctx.guest()) return;
    const F = ctx.other();
    const [x, y] = ctx.freeNear(F.tx - GOX, F.ty, 2);
    strays.place(c, x, y);
    c.hidden = false;
    ctx.escort(c);
    if (!quiet) ctx.say(ctx.fmt(W.cheetosBack, ctx.leader()));
  }
  function tickEast() {
    cheetosAlong(false);
    const L = ctx.leader();
    if (inShedZone(L.tx - GOX, L.ty)) shedScene();
  }

  // ------------------------------------------------------------------ shed
  // The standing picture once its scene has played: Thanos between the pair's side and three dogs.
  function standoff() {
    sdogs.forEach((d, i) => {
      ctx.placeExtra(d, AT.dogsTurned[i][0], AT.dogsTurned[i][1], 'left');
      d.pose = i === 1 ? 'bark' : 'stand';
    });
    const th = by('thanos');
    sit(th, [...AT.thanos, 'right']);
    th.pose = 'stand';
  }
  function shedScene() {
    const c = by('cheetos');
    const so = by('socks');
    const sc = by('scar');
    const th = by('thanos');
    const setup = () => {
      ctx.dogs.clear(); // (the only dogs in this are the story's own three)
      ctx.clearNpcs(true); // (and nobody else's cat or passer-by is anywhere near)
      ctx.release(c);
      ctx.putCat(0, AT.pair[0][0], AT.pair[0][1], 'right');
      ctx.putCat(1, AT.pair[1][0], AT.pair[1][1], 'right');
      sit(c, [...AT.cheetos, 'right']);
      sit(sc, [...AT.scar, 'down']);
      kits.forEach((k, i) => {
        ctx.placeExtra(k, AT.kits[i][0], AT.kits[i][1], 'down');
        k.pic = k.sp.sit.down;
      });
      sdogs.forEach((d, i) => {
        ctx.placeExtra(d, AT.dogs[i][0], AT.dogs[i][1], 'up');
        d.pose = 'bark';
      });
      so.hidden = th.hidden = true;
    };
    // (what the scene leaves behind it, however it ended)
    const after = () => {
      for (const k of kits) k.pic = null;
      ctx.release(c);
      ctx.putCat(0, AT.pair[0][0], AT.pair[0][1], 'right');
      ctx.putCat(1, AT.pair[1][0], AT.pair[1][1], 'right');
      ctx.go('shed', W.goalShed); // (everybody who went over the road is at the box from here on: see where())
      standoff();
    };
    ctx.playScene('a3-shed', [
      { fade: 'out' },
      { call: setup },
      { camera: [GOX + 94, 33] },
      { wait: 20 },
      { fade: 'in' },
      { sfx: 'bark' },
      { wait: 40 },
      { sfx: 'bark' },
      ...ctx.lines(W.shed.see),
      { sfx: 'rustle' },
      { call: () => sit(so, [...AT.socksFrom, 'right']) },
      { walk: ['socks', ...P(AT.socks)] },
      ...ctx.lines(W.shed.socks),
      // Orca makes himself heard, and the dogs turn round
      { call: () => { sfx.meow(520); ctx.bubble(ctx.cats()[1], 'MEOW!', 70); } },
      { wait: 30 },
      { call: () => { for (const d of sdogs) Object.assign(d, { dir: 'left', pose: 'look' }); } },
      { say: W.shed.yowl },
      { walks: sdogs.map((d, i) => [d.id, ...P(AT.dogsLook[i])]) },
      { call: () => { for (const d of sdogs) Object.assign(d, { dir: 'left', pose: 'bark' }); sfx.bark(); } },
      // Socks and Cheetos go round the back, and in under the roof
      { say: W.shed.slip },
      { walks: [['socks', ...P(AT.round)], ['cheetos', ...P([AT.round[0] - 1, AT.round[1]])]] },
      { walks: [['socks', ...P(AT.in[0])], ['cheetos', ...P(AT.in[1])]] },
      { face: ['socks', 'left'] },
      ...ctx.lines(W.shed.scar),
      { call: () => { sc.pose = 'stand'; for (const k of kits) k.pic = null; } },
      { walks: [['socks', ...P(AT.away[0])], ['scar', ...P(AT.away[1])], ['kit0', ...P(AT.away[2])], ['kit1', ...P(AT.away[3])], ['kit2', ...P(AT.away[4])], ['cheetos', ...P(AT.away[5])]] },
      { call: () => { so.hidden = sc.hidden = c.hidden = true; for (const k of kits) k.hidden = true; } },
      { say: W.shed.off },
      // the dogs, with nothing left to bark at but two cats
      { walks: sdogs.map((d, i) => [d.id, ...P(AT.dogsTurned[i])]) },
      { call: () => { for (const d of sdogs) Object.assign(d, { dir: 'left', pose: 'bark' }); sfx.bark(); } },
      { bubble: ['orca', '!', 50] },
      ...ctx.lines(W.shed.turn),
      { call: () => { sit(th, [...AT.thanosFrom, 'down']); th.pose = 'stand'; } },
      { walk: ['thanos', ...P(AT.thanos)] },
      { face: ['thanos', 'right'] },
      { call: () => { for (const d of sdogs) d.pose = 'stand'; sfx.hiss(); } },
      ...ctx.lines(W.shed.thanos),
      { camera: null },
    ], () => {
      after();
      shedFight();
    });
  }
  function shedFight() {
    ctx.fightWith('thanos', ENCOUNTERS.dogs(3, W.shedFight), { then: (result) => (result === 'won' ? shedWon() : shedLost()) });
  }
  // Lost: the pair are in the bushes a little way west, with nothing left in them. Thanos holds the dogs.
  function shedLost() {
    const hide = () => {
      ctx.putCat(0, AT.bush[0][0], AT.bush[0][1], 'right');
      ctx.putCat(1, AT.bush[1][0], AT.bush[1][1], 'right');
      standoff();
    };
    ctx.playScene('a3-shed-lost', [{ fade: 'out' }, { call: hide }, { wait: 20 }, { fade: 'in' }, { say: W.shedLost }, { goal: W.goalShedAgain }], () => {
      hide();
      ctx.setGoal(W.goalShedAgain, true);
      ctx.dogs.auto();
    });
  }
  function shedAgain() {
    const back = () => {
      ctx.putCat(0, AT.pair[0][0], AT.pair[0][1], 'right');
      ctx.putCat(1, AT.pair[1][0], AT.pair[1][1], 'right');
    };
    ctx.playScene('a3-shed-again', [
      { camera: 'thanos' },
      { walks: [['shark', ...P(AT.pair[0])], ['orca', ...P(AT.pair[1])]] },
      { face: ['shark', 'right'] },
      { face: ['orca', 'right'] },
      { wait: 20 },
      ...ctx.lines(W.shedAgain),
      { camera: null },
    ], () => {
      back();
      shedFight();
    });
  }
  function shedWon() {
    const th = by('thanos');
    const gone = () => {
      for (const d of sdogs) Object.assign(d, { hidden: true, pose: 'stand' });
    };
    ctx.playScene('a3-shed-won', [
      { camera: 'thanos' },
      { call: () => { for (const d of sdogs) d.pose = 'cower'; } },
      { wait: 50 },
      { call: () => { for (const d of sdogs) d.pose = 'stand'; } },
      { walks: sdogs.map((d, i) => [d.id, ...P(AT.dogsOff[i])]) },
      { call: gone },
      { call: () => { th.pose = 'sit'; th.dir = 'left'; } },
      ...ctx.lines(W.shedWon),
      { camera: null },
      { goal: W.goalBox },
    ], () => {
      gone();
      f().thanosHurt = true;
      ctx.go('tobox', W.goalBox);
    });
  }
  function tickShed() {
    const L = ctx.leader();
    if (sdogs[0].hidden) standoff();
    if (backAtShed(L.tx - GOX, L.ty)) shedAgain();
  }

  // ----------------------------------------------------------------- tobox
  function boxScene() {
    ctx.playScene('a3-box', [
      { walks: [['shark', ...P(BED[0])], ['orca', ...P(BED[1])]] },
      { face: ['shark', 'down'] },
      { face: ['orca', 'down'] },
      { wait: 20 },
      ...ctx.lines(W.box),
      { call: () => ctx.lieDown() },
      { wait: 40 },
      { say: W.boxSleep },
      { wait: 40 },
      { fade: 'out' },
      { wait: 30 },
    ], () => {
      // the next morning, and the scene that follows at once, from the same black screen
      ctx.setClock(7.5);
      ctx.go('morning');
      morningScene();
    });
  }

  // --------------------------------------------------------------- morning
  function morningScene() {
    const c = by('cheetos');
    const plate = [30, PAVE_S + 2]; // (between Cheetos and Shark)
    let kib = null;
    const asleep = () => {
      people.clear(); // (it is early: nobody is about yet but the two of them)
      ctx.putCat(0, BED[0][0], BED[0][1], 'down');
      ctx.putCat(1, BED[1][0], BED[1][1], 'down');
      ctx.lieDown();
      keep(true);
    };
    const tidy = () => {
      hung().hidden = trang().hidden = true;
      if (kib) people.eat(kib);
      kib = null;
      keep(true);
    };
    ctx.playScene('a3-morning', [
      { call: asleep },
      { wait: 40 },
      { fade: 'in' },
      { wait: 50 },
      { sfx: 'door' },
      // (Hưng is the one nearer the cats: he sees them first, and it is he who puts the plate down)
      { call: () => { ctx.placeExtra(hung(), 17, PAVE_S + 2, 'down'); ctx.placeExtra(trang(), 18, PAVE_S + 2, 'down'); } },
      { say: W.morning.doors },
      // (along the kerb side of the pavement, round Cheetos and Socks)
      { walks: [['hung', ...P([28, PAVE_S])], ['trang', ...P([27, PAVE_S])]] },
      { walks: [['hung', ...P([28, PAVE_S + 1])], ['trang', ...P([27, PAVE_S + 1])]] },
      { face: ['hung', 'right'] },
      { face: ['trang', 'right'] },
      { bubble: ['hung', '!', 50] },
      ...ctx.lines(W.morning.found.slice(0, 2)),
      { call: () => ctx.getUp() },
      { face: ['shark', 'left'] },
      { face: ['orca', 'left'] },
      ...ctx.lines(W.morning.found.slice(2)),
      ...ctx.lines(W.morning.plate.slice(0, 1)),
      { face: ['hung', 'down'] },
      { call: () => { kib = { x: plate[0], y: plate[1], born: ctx.clock(), keep: true }; people.kibble.push(kib); sfx.land(); } },
      ...ctx.lines(W.morning.plate.slice(1)),
      // Cheetos first
      { call: () => (c.pose = 'stand') },
      { face: ['cheetos', 'right'] },
      { call: () => ctx.bubble(c, '!', 40) },
      { face: ['orca', 'left'] },
      { say: W.morning.wait },
      { sfx: 'crunch' },
      { wait: 50 },
      { sfx: 'crunch' },
      { wait: 50 },
      { call: () => (c.pose = 'sit') },
      { say: W.morning.first },
      { walk: ['orca', ...P([32, PAVE_S + 1])] },
      { walk: ['orca', ...P([30, PAVE_S + 1])] },
      { call: () => {
        const [sh, or] = ctx.cats();
        sh.dir = 'left';
        or.dir = 'down';
        ctx.act(sh, 'eat', 140);
        ctx.act(or, 'eat', 140);
        sfx.crunch();
      } },
      { wait: 140 },
      { call: () => { if (kib) people.eat(kib); kib = null; ctx.mend(1); sfx.purr(); } },
      { say: W.morning.eaten },
      { face: ['hung', 'right'] },
      ...ctx.lines(W.morning.bye),
      { walks: [['hung', ...P([28, PAVE_S])], ['trang', ...P([27, PAVE_S])]] },
      { walks: [['hung', ...P([19, PAVE_S])], ['trang', ...P([20, PAVE_S])]] },
      { walks: [['hung', ...P([17, PAVE_S + 2])], ['trang', ...P([18, PAVE_S + 2])]] },
      { sfx: 'door' },
      { call: () => { hung().hidden = trang().hidden = true; } },
      { say: W.morning.gone },
      ctx.tip(W.tip4),
    ], () => {
      tidy();
      ctx.getUp();
      ctx.mend(1);
      // (the Garnet part's first scene follows at once, and gives the goal)
      ctx.go('garnet', W.goalMorning);
    });
    ctx.blackout();
  }

  // -------------------------------------------------------------- the hooks
  // The act begins (Act 2's last scene has just ended, on a black screen; or a game saved before there was
  // an Act 3 has been loaded): it is evening before anything of the garden is seen, so that the first scene
  // has no need to fade out again and put the clock right.
  function begin() {
    if (!isNight()) ctx.setClock(22.5);
  }
  // Around the BBQ shed, from the walk east until the three dogs are beaten: no passer-by and no cat
  // but the story's own (see keepOut in game.js).
  const SHED_ZONE = [SHED.x - 12, 20, SHED.x + SHED.w + 6, 36];
  function keepOut(stage) {
    return stage === 'east' || stage === 'shed' ? [{ box: SHED_ZONE, allow: NAMED }] : [];
  }
  // The pair have gone up to the flat in the night (to eat, say, after a dog has emptied the meter): nobody
  // is home. Hưng and Trang are out looking for them ("We looked all night"), and have left the kibble
  // machine full. They are back in the flat once the morning scene is over.
  let humansOut = false;
  let flatSaid = false;
  function emptyFlat() {
    if (ctx.floor() !== 'home') return;
    humansOut = true;
    for (const h of ctx.home.humans()) Object.assign(h, { away: true, state: 'activity', script: null, onAbort: null, path: [], moving: false, seated: false, asleep: false, bedtime: false, pet: 0, carry: null, timer: 600 });
    if (flatSaid) return;
    flatSaid = true;
    if (!ctx.flags().a3nKibble) {
      ctx.flags().a3nKibble = true;
      ctx.home.serve('kibble');
    }
    ctx.say(W.emptyFlat, true);
  }
  function humansBack() {
    if (!humansOut) return;
    humansOut = false;
    ctx.home.settle();
    for (const i of [0, 1]) ctx.home.releaseHuman(i);
  }
  function update(stage) {
    if (!ctx.outside()) return void (stage !== 'morning' && emptyFlat());
    flatSaid = false;
    keep(false);
    const L = ctx.leader();
    if (stage === 'open') return openScene();
    if (stage === 'cheetos') return tickCheetos();
    if (stage === 'east') return tickEast();
    if (stage === 'shed') return tickShed();
    if (stage === 'tobox') return void (atBox(L.tx - GOX, L.ty) && boxScene());
    if (stage === 'morning') return morningScene();
  }
  // Everybody where this stage has them: on arriving at it, after a load, after Mission select, and
  // whenever the pair come down to the garden. (Asked at every stage of the act: the friends by the
  // box and the kittens are this part's all the way.)
  function enter(stage) {
    if (ctx.past('morning')) humansBack();
    if (!ctx.outside()) return;
    const c = by('cheetos');
    // (Cheetos walked with them without fighting: whoever comes along after him fights)
    if (stage !== 'east' && ctx.guest() === c && (mine(stage) || !ctx.friends())) ctx.release(c);
    if (stage === 'open' || stage === 'cheetos') treeDogHere();
    else noTreeDog();
    hideActors();
    if (mine(stage)) hung().hidden = trang().hidden = true;
    keep(true);
    if (stage === 'east') cheetosAlong(true);
    if (stage === 'shed') standoff();
  }
  // Mission select and the tests: the pair, the clock and the flags as they would be at this stage.
  function jump(st) {
    const night = () => (ctx.hour() >= 19.5 || ctx.hour() < 5 ? 0 : ctx.setClock(22.5));
    const put = (a, b) => {
      ctx.putCat(0, a[0], a[1], 'down');
      ctx.putCat(1, b[0], b[1], 'down');
    };
    const i = MINE.indexOf(st);
    if (i < 0 || i >= MINE.indexOf('east')) f().a3nTip2 = true;
    if (i < 0 || i >= MINE.indexOf('tobox')) f().thanosHurt = true;
    if (i < 0) return;
    if (st !== 'morning') night();
    if (st === 'open' || st === 'cheetos') put(START[0], START[1]);
    if (st === 'east') put([UNDER_TREE[0], UNDER_TREE[1] + 1], [UNDER_TREE[0] + 1, UNDER_TREE[1] + 1]);
    if (st === 'shed') put(AT.bush[0], AT.bush[1]);
    if (st === 'tobox') put(AT.pair[0], AT.pair[1]);
    if (st === 'morning') {
      put(BED[0], BED[1]);
      if (ctx.hour() < 7 || ctx.hour() >= 9) ctx.setClock(7.5);
    }
    if (st === 'cheetos') S().goal = W.goalCheetos;
    if (st === 'east') S().goal = W.goalEast;
    if (st === 'shed') S().goal = W.goalShedAgain;
    if (st === 'tobox') S().goal = W.goalBox;
  }
  // Do, in front of one of the garden's cats
  function talk(cat, n) {
    const id = n.named && n.def.id;
    const st = ctx.stage();
    if (id === 'thanos' && st === 'shed') return shedAgain(), true;
    // (Cheetos is behind them, and is not sent home: he has no home to go to tonight)
    if (id === 'cheetos' && st === 'east') {
      n.pause = 0;
      ctx.say(ctx.fmt(pick(W.cheetosBehind), cat));
      ctx.bubble(n, '...', 60);
      return true;
    }
    return false;
  }
  // walking into one of the story's own
  function bump(cat, e) {
    if (e === white) {
      ctx.say(ctx.fmt(pick(W.whiteCat), cat));
      sfx.meow(700);
      return true;
    }
    if (kits.includes(e)) {
      ctx.say(ctx.fmt(pick((ctx.stage() === 'regroup' ? W.goneLines : ctx.before('morning') ? W.nightLines : W.friendLines).kitten), cat));
      ctx.bubble(e, '!', 50);
      sfx.meow(900);
      return true;
    }
    if (sdogs.includes(e) && ctx.stage() === 'shed') {
      if (ctx.frame() - saidAt > 90) ctx.say(W.shedStand);
      saidAt = ctx.frame();
      return true;
    }
    return false;
  }

  return { begin, update, enter, jump, present, linesFor, talk, bump, keepOut, debug: { kits, sdogs, where, keep, AT, BED, SEAT, KIT_SEATS, get treeDog() { return treeDog; } } };
}
