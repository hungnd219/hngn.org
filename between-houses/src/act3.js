// Act 3, "Both worlds": the hub. The story of the act is in three parts, each
// with its own script and its own words:
//
//   act3-night.js   the night of the dogs, and the morning after
//                   open     Outside Amber's doors as Act 2 ends: dogs everywhere, and Cheetos up a tree.
//                   cheetos  The first dog, under his tree.
//                   east     The way east, bush to bush, with Cheetos behind.
//                   shed     Scar and the kittens cornered; Socks leads them over the road; three
//                            dogs, and Thanos.
//                   tobox    Back over the road to Mamacat's box, where everybody is. Sleep.
//                   morning  Stripes and Polka find them there. From here friends can be asked along.
//   act3-garnet.js  Garnet
//                   garnet   What the others have seen: why Garnet.
//                   doors    BBC with no collar, Flower above it all: two against two.
//                   favours  His collar from the river bushes; her catnip from the flat. (And the
//                            first time home.)
//                   wait     Flower's plan: her human comes down for a delivery between 4 and 5.
//                   boxed    Into the box, and up.
//                   balcony  Flower's balcony; BBC's beyond it; Purple Scarf's across a gap.
//                   flat     Her flat, and three things to find in it.
//                   durian   She comes home. Orca keeps her off Shark, who is at the door handle.
//   act3-jetty.js   the jetty
//   act3-after.js   the epilogue, and the open game after it
//                   regroup  No dogs anywhere. Home, where nobody understands a meow; and the wait for the
//                            boat's hours (10 PM to 2 AM), when the front door is the point of no return.
//                   call     Down in the night, with the clock stopped. One word: Meow. Every friend, in a line.
//                   pick     One of them comes.
//                   walk     The garden with nobody in it, the barrier, the long way round.
//                   jetty    The three of them, a boat full of dogs, and the last fight.
//                   won      A man in the river, and Stripes and Polka following Orca.
//                   after    The epilogue (home from the honeymoon), and free roaming for good.
//
// How far it has got is `story.quest.act3` (one of ACT3_STAGES); `story.act`
// is 3. What each stage means for the world (dogs out or not, the barrier,
// the boat, an empty garden, a night that stands still, whether friends can be asked along) is the table
// WORLD below, and nothing else decides it: `apply()` puts the world as the
// table says whenever the stage changes, a game is loaded, or Mission select
// jumps here.
//
// `api` is what the game lends (act3Api in game.js): everything the garden
// story has (questApi), the flat's (`api.home`: homeApi), the dogs
// (`api.dogs`), and the way into and out of Purple Scarf's flat. A part gets
// `ctx`: the api, and what is below. The game calls the hub at its hooks, and
// the hub passes each call to the part whose stage it is.
import { create as createNight } from './act3-night.js';
import { create as createGarnet } from './act3-garnet.js';
import { create as createJetty } from './act3-jetty.js';
import { create as createAfter } from './act3-after.js';
import { WORDS } from './game-text.js';

export const ACT3_PARTS = {
  night: ['open', 'cheetos', 'east', 'shed', 'tobox', 'morning'],
  garnet: ['garnet', 'doors', 'favours', 'wait', 'boxed', 'balcony', 'flat', 'durian'],
  jetty: ['regroup', 'call', 'pick', 'walk', 'jetty', 'won'],
  after: ['after'], // the epilogue, and the open game after it
};
export const ACT3_STAGES = Object.values(ACT3_PARTS).flat();
// The world at each stage. dogs: 'on' (roaming), 'off' (none: a scene has its own), 'gone' (called
// back to the boat, and after the end for good). barrier: the covered walkway is closed. boat: dogs
// aboard. noBoat: the boat itself is gone. cages: which of the garden's CAGE_SETS is out. calm: no dogs at the east end of the garden. quiet: nobody in the garden at all (no people, no strays,
// no rats). friends: they can be asked along. Anything not named is off.
const from = (a, b) => ACT3_STAGES.slice(ACT3_STAGES.indexOf(a), ACT3_STAGES.indexOf(b) + 1);
const WORLD = {};
for (const st of ACT3_STAGES) WORLD[st] = { dogs: 'on' };
// (until Cheetos is down from his tree the only dog about is the one under it: the tips about dogs come after)
for (const st of ['open', 'cheetos']) WORLD[st].dogs = 'off';
for (const st of from('garnet', 'durian')) WORLD[st].friends = true;
for (const st of from('regroup', 'after')) WORLD[st].dogs = 'gone';
for (const st of from('call', 'jetty')) Object.assign(WORLD[st], { barrier: true, quiet: true });
for (const st of from('call', 'jetty')) WORLD[st].boat = true; // (the boat comes in after dark, on the last night)
for (const st of ['pick', 'walk', 'after']) WORLD[st].friends = true;
WORLD.after.noBoat = true; // (towed away, once it is all over)
// The cages (CAGE_SETS in garden.js). Once the dogs are called back they are in cages along the dock,
// and the boat is away, fetching the hungrier ones; on the last night most are stacked across the
// walkway, and a cart stands on the dock with one more; after the end they are gone.
WORLD.regroup.cages = 'held';
WORLD.regroup.noBoat = true;
for (const st of from('call', 'won')) WORLD[st].cages = 'loading';
WORLD.after.cages = 'none';
for (const st of from('open', 'tobox')) WORLD[st].night = true; // (the clock stands still until they sleep by the box)
WORLD.tobox.calm = true; // (the pack at the shed is beaten: no dog at the east end for the rest of that night)

export function createAct3(api) {
  const S = () => api.story();
  const f = () => S().flags;
  const stage = () => (S().act === 3 && S().quest && S().quest.act3) || '';
  const on = () => S().mode === 'story' && !!stage();
  const idx = (st) => ACT3_STAGES.indexOf(st);
  const partOf = (st) => Object.keys(ACT3_PARTS).find((k) => ACT3_PARTS[k].includes(st));
  const lines = (list) => list.map((l) => ({ say: l }));
  const tip = (text) => ({ note: { title: WORDS.notes.tip, text, kind: 'tip' } });
  const dist = (a, x, y) => Math.abs(a.tx - x) + Math.abs(a.ty - y);

  // the world as the stage has it
  function apply() {
    const w = WORLD[stage()] || {};
    if (on() && w.dogs === 'gone') f().dogsGone = true;
    else delete f().dogsGone;
    if (on() && w.night) f().nightHold = true;
    else delete f().nightHold;
    // (no cat of the garden's own is out while the dogs are: only the story's)
    if (on() && stage() !== 'after' && api.outside() && api.noStrays) api.noStrays();
    const wasQuiet = !!f().quietGarden;
    if (on() && w.quiet) f().quietGarden = true;
    else delete f().quietGarden;
    // (the people and the strays who are about go at once; nobody comes while the flag is set)
    if (f().quietGarden && !wasQuiet && api.outside() && api.emptyGarden) api.emptyGarden();
    // The dogs keep their own rule (dogs.js): out in Act 3, unless flags.dogsGone. 'off' is for a stage
    // whose only dogs are the story's own.
    if (api.dogs) {
      if (on() && w.dogs === 'off') api.dogs.off();
      else api.dogs.auto();
      api.dogs.calmEast(on() && !!w.calm);
    }
    if (api.setBarrier) api.setBarrier(on() && !!w.barrier);
    if (api.setBoatDogs) api.setBoatDogs(on() && !!w.boat);
    if (api.setBoatGone) api.setBoatGone(on() && !!w.noBoat);
    if (api.setCages) api.setCages((on() && w.cages) || 'empty');
  }
  // on to a stage: its goal, the world as it should be, everybody where they belong, and a save
  function go(st, goal) {
    S().act = 3;
    S().quest.act3 = st;
    if (goal) api.setGoal(goal, true);
    apply();
    enter();
    if (api.autosave) api.autosave();
  }
  // every part puts its actors where this stage has them (after a stage change, a load, a jump)
  function enter() {
    if (!on()) return;
    for (const p of Object.values(parts)) if (p.enter) p.enter(stage());
  }

  const ctx = {
    ...api,
    stage, go, on, apply, lines, tip, dist,
    flags: f,
    before: (st) => idx(stage()) < idx(st),
    past: (st) => idx(stage()) > idx(st),
    // friends can be asked along at this point of the act
    friends: () => on() && !!(WORLD[stage()] || {}).friends,
    // a fight in which a friend the story names fights beside the pair, whoever is tagging along
    fightWith: (kind, enc, opts = {}) => api.startFight(enc, { ...opts, ally: kind }),
  };
  const parts = { night: createNight(ctx), garnet: createGarnet(ctx), jetty: createJetty(ctx), after: createAfter(ctx) };
  const mine = () => parts[partOf(stage())] || {};
  // a hook of the part whose stage it is: its answer, or `none` if it has no such hook
  const call = (name, none, ...a) => {
    if (!on()) return none;
    const p = mine();
    return p[name] ? p[name](...a) : none;
  };

  // Act 2 has just ended, and the pair are on their way out of the front door: the act begins. (The
  // first scene is the night part's: its update() plays it as soon as they are outside.)
  function begin() {
    S().act = 3;
    S().quest.act3 = 'open';
    // (Act 2's last goal says nothing true any more: the first scene gives the act its own)
    api.setGoal('', true);
    // (a part may have something to put right before anything is seen: the hour, for the first scene)
    for (const p of Object.values(parts)) if (p.begin) p.begin();
    apply();
  }
  // a saved game has been loaded, a game started, or the pair have come down to the garden: the world
  // as the stage has it
  function restore() {
    // (a game saved at the end of Act 2, before there was an Act 3: it starts here)
    const s = S();
    if (s.mode === 'story' && s.adopted && s.quest && s.quest.home === 'done' && !s.quest.act3) begin();
    // (another game altogether: whatever a part changed for good in the last one is put back)
    if (!on()) for (const p of Object.values(parts)) if (p.reset) p.reset();
    apply();
    enter();
  }
  // Mission select, and the tests: straight to a stage, as if everything before it had been played
  function jump(st) {
    const s = S();
    s.mode = 'story';
    s.adopted = true;
    s.act = 3;
    s.stage = 'house';
    s.quest = { ...(s.quest || {}), cheetos: 'done', socks: 'done', mama: 'done', thanos: 'done', home: 'done', act3: st };
    Object.assign(s.flags, { named: true, sing: true, stretch: true, protect: true, robotBeaten: true });
    s.gains = { play1: true, care1: true, play2: true, care2: true }; // (everything the flat had to give)
    s.hurt = { shark: 0, orca: 0 };
    for (const k of Object.keys(parts)) if (parts[k].jump) parts[k].jump(st);
    apply();
    enter();
  }

  // Purple Scarf's flat asks the story first about anything walked into there (see onFlat in game.js)
  if (api.home && api.home.onFlat)
    api.home.onFlat('scarf', {
      door: (cat) => !!call('door', false, cat, 'scarf'),
      bump: (cat, o) => !!call('object', false, cat, o),
      tile: (cat, ch, x, y) => !!call('tile', false, cat, ch, x, y),
      meow: (cat) => !!call('meow', false, cat),
    });

  return {
    begin, restore, jump, apply,
    on, stage,
    // every frame, on either floor
    update() {
      if (!on() || api.busy()) return;
      call('update', undefined, stage());
    },
    // outdoors: walking into one of the story's people or animals; Do in front of one of the garden's cats;
    // a meow; something offered to somebody. True if the story has taken it from there.
    // (walking into one of the story's own goes to the part whose stage it is, and then to the others:
    // the kittens by Mamacat's box are the night's, all act long)
    bump(cat, extra) {
      if (!on()) return false;
      const p = mine();
      if (p.bump && p.bump(cat, extra)) return true;
      return Object.values(parts).some((q) => q !== p && q.bump && q.bump(cat, extra));
    },
    talk: (cat, stray) => !!call('talk', false, cat, stray),
    meow: (cat) => !!call('meow', false, cat),
    give: (cat, item, to) => !!call('give', false, cat, item, to),
    // where one of the garden's named cats is, as the story has it: true (where it was put), false
    // (out of sight), undefined (its own cat). Every part is asked: friends keep their places all act.
    present(id) {
      if (!on()) return undefined;
      for (const p of Object.values(parts)) {
        const v = p.present ? p.present(id, stage()) : undefined;
        if (v !== undefined) return v;
      }
      return undefined;
    },
    linesFor(n) {
      if (!on()) return null;
      for (const p of Object.values(parts)) {
        const v = p.linesFor ? p.linesFor(n, stage()) : null;
        if (v) return v;
      }
      return null;
    },
    // indoors: something walked into (a clue, say); a front door ('home' | 'scarf'). Outdoors, object() is
    // asked about the barrier ({ type: 'barrier' }) and Garnet's doors ({ type: 'garnet' }).
    object: (cat, o) => !!call('object', false, cat, o),
    door: (cat, flat) => !!call('door', false, cat, flat),
    // a fight with dogs has been lost (the game has already sent them to a bush with an empty meter)
    lost: (what) => call('lost', undefined, what),
    friends: ctx.friends,
    // the friend picked for the last fight, while it walks with the pair (see friend in act3-jetty.js)
    finaleFriend: () => (on() && parts.jetty.friend ? parts.jetty.friend() : null),
    // places kept clear of passers-by and of the garden's own cats, for a scene (see keepOut in game.js)
    keepOut() {
      if (!on()) return [];
      const st = stage();
      return Object.values(parts).flatMap((p) => (p.keepOut ? p.keepOut(st) : []));
    },
    debug: { get stage() { return stage(); }, parts, WORLD, ctx },
  };
}
