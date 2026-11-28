// The flat's captions, as Act 2 has them.
//
// The captions in furniture.js and game.js were written for Sandbox, where
// Shark and Orca have lived in the flat for years: the bowls are "as is
// tradition", the humans "haven't seen you all day", and somebody sighs when
// a vase goes over "again". None of that is true of two cats in their first
// days here: one a house cat who has lost his home, the other a stray who has
// never been indoors, and two humans who took them in last night and are far
// too pleased with them to shout.
//
// So some of those lists have a second version here, used whenever the story
// is running and the pair have been adopted (Act 2, and after it until a later
// act says otherwise). Sandbox keeps the old lines untouched. A list with no
// entry here is true of any cat, and is used as it is.
//
// An entry is a list of lines, or a function of how things stand that returns
// one (or nothing, for "use Sandbox's"):
//   cat    'shark' or 'orca': whose caption it is (Shark knows what things in
//          a house are; Orca meets each of them for the first time)
//   wary   Orca is not yet easy with the humans: true until the night on the
//          big bed
//   dogs   the night of the dogs has happened
//   did    what has been tried (story.did): did.wetfood once the first wet
//          food has been eaten
// The game asks through flatLines(story, key, cat): keys are the furniture's
// type and the name of its list ('bowls.cleanLines'), or one of the names
// below for the lists that live in game.js. The lines are filled in as any
// caption is: {c} the cat, {o} the other one, {h} the human, {S} and {O} the
// tabby and the orange one by name.

// the stages of Act 2 (story.quest.home, see home.js) in which Orca still keeps his distance...
const WARY = ['arrive', 'escape', 'food', 'explore', 'explore2'];
// ...and those before the dogs are heard from the balcony
const QUIET = ['arrive', 'escape', 'food', 'explore', 'explore2', 'bed'];

// one list for Shark and another for Orca (null: Sandbox's will do for that one)
const by = (shark, orca) => ({ cat }) => (cat === 'orca' ? orca : shark);

// A hand on Orca, while a hand is still a new thing. (One list for wherever the human happens to be.)
const ORCA_WARY = [
  '{h} holds a hand out, low, and waits. {c} sniffs it, and lets it touch the top of his head. Once.',
  '{h}: "Hello, {c}. Only saying hello." {c} stands very stiff, and allows it.',
  "{h} strokes {c} once, slowly, and takes the hand away again. {c} hadn't finished making up his mind.",
];
const PETS = {
  shark: {
    seek: [
      '{h} comes looking for {c}, just to say hello. Chin scratches.',
      '{h}: "There you are, {c}." {c} leans his whole weight against a shin.',
      '{h} picks {c} up. He goes soft all over. He had forgotten about being carried.',
    ],
  },
  // Orca, once he has slept on their bed
  orca: {
    seek: [
      '{h} comes looking for {c}, just to say hello. {c} lets himself be found.',
      '{h}: "There you are, {c}!" A hand on his head. He pushes back against it.',
      "{h}: \"Who's the best cat?\" {c} doesn't know the answer. It seems to be him.",
    ],
    walk: [
      '{h} bends down and pets {c}. He stays for all of it.',
      "{h}: \"Who's a good cat? {c} is!\"",
      '{c} flops over, and is surprised at himself. {h} rubs his belly. He allows that too.',
    ],
  },
};

export const FLAT = {
  // ------------------------------------------------------------- food
  // eating the wet food (the first of it ever comes on the first evening). One bowl each: the caption goes
  // on to say that the other half is the other cat's.
  'bowls.lines': by(
    [
      "Wet food. {c} eats it slowly, like a cat who knows that there'll be more.",
      'Soft, and warm, and a bowl of it all for him. {c} licks his bowl clean.',
      '{c} checks both bowls first, in case one is better. Then he eats.',
    ],
    [
      '{c} eats fast, with one eye on the door. Nobody comes to take it away.',
      'Soft food, in a bowl, put down for him. {c} eats it before anybody can change their mind.',
      '{c} eats until his bowl is clean, and looks around to see who he has to fight for it. Nobody.',
    ]
  ),
  // the bowls after a meal
  'bowls.emptyLines': by(
    ['Only a smear of gravy left. {c} cleans it up anyway.', '{c} licks the empty bowl once more, to be sure.'],
    [
      '{c} licks the empty bowl until it shines. He ate all of it himself, and nobody stopped him.',
      'Empty. {c} sniffs the bowl for more, finds none, and minds less than he expected to.',
    ]
  ),
  // the bowls washed and waiting. Before the first wet food there has never been anything in them;
  // after it, Orca has Shark's word that it comes again. (No time of day is promised in either.)
  'bowls.cleanLines': ({ cat, did }) =>
    did.wetfood
      ? cat === 'orca'
        ? [
            'The bowls are clean and empty again. {S} says that the food comes again. {c} checks, in case it already has.',
            "{c} stares into an empty bowl. Nothing yet today. He's thinking about believing in it.",
          ]
        : [
            "Clean, empty bowls. Nothing in them yet today. {c} isn't worried: it comes again.",
            "{c} sits down by the empty bowls to wait. He's done this before, in another kitchen.",
          ]
      : cat === 'orca'
        ? [
            '{c} sniffs the two empty bowls. They smell like soap. Nothing has been in them yet today.',
            'Two bowls with nothing in them. {c} looks around for whoever got there first. Nobody did: nothing has been in them yet.',
          ]
        : [
            'Two clean bowls, side by side. Nothing has been put in them yet today. {c} knows what bowls like these are for.',
            '{c} sniffs the empty bowls. Soap, and nothing else. Nothing has been in them yet today.',
          ],
  // the kibble machine: Shark's old home had one ("Mine came out of a machine")
  'feeder.lines': by(
    ['Crunch crunch crunch. Kibble out of a machine: {c} grew up on this.', '{c} eats his kibble in record time. Breakfast: done.'],
    [
      'Crunch crunch. {c} eats kibble that a machine has made, and keeps one eye on the machine.',
      '{c} eats his kibble out of a tray, dry and whole, with nobody hissing at him for it.',
    ]
  ),
  'feeder.emptyLines': by(
    [
      "The tray of the kibble machine is empty. {c} knows the kind: it gives when it's ready, and not before.",
      '{c} looks into the kibble machine. Nothing in the tray for now.',
    ],
    [
      "{c} stares into the machine that makes kibble. It's not making any. He pats it, in case that's how it works. It's not.",
      'The tray is empty. {c} sniffs the crumbs. A machine with food inside it, and no way in.',
    ]
  ),
  // (the first can ever opened for them: one of the two knows the sound)
  can: ({ did }) => (did.wetfood ? null : ["{h} opens a can at the kitchen island. {S}'s ears turn right away: he knows that sound. {O} only knows the smell that comes after it."]),
  'fountain.lines': by(null, [
    'Water that comes up by itself and never stops. {c} drinks, and watches it, and drinks again.',
    '{c} dips a paw in the fountain to see what it does. It does nothing. He drinks from the paw.',
  ]),
  'hob.lines': by(null, ['{c} puts his nose near the stove. It ticks, and it smells like old dinners. He keeps his paws off it.', '{c} stares at the stove. Is dinner happening?']),

  // ------------------------------------------------------------- toys
  // Shark has had toys before. Orca has never seen one: nothing he ever chased was for fun.
  'mouse.take': by(null, ["{c} picks the gray mouse up by its tail. It squeaks, and it doesn't smell like mouse at all."]),
  'mouse.play': by(null, [
    '{c} hits the small gray thing. It SCREAMS. He jumps straight up in the air, comes down, and hits it again.',
    "{c} bats the gray mouse. It squeaks, and it doesn't bleed. He's never met a mouse like it.",
  ]),
  'catnip.take': by(
    ['{c} picks up the catnip stick. He had one of these once. This one is better.', '{c} has the catnip stick. The room has gone a little soft at the edges.'],
    ['{c} picks up the green stick. It smells like the best bush in the garden, all in one place.']
  ),
  'catnip.play': by(null, [
    "{c} sniffs the green stick. ...{c} is lying on his back. He doesn't know how that happened, and he doesn't mind.",
    '{c} rubs his face on the green stick. For a little while everything is very funny.',
  ]),
  'rope.play': by(null, [
    "{c} chews the knotted rope. It's not food. He chews it anyway, and finds that he likes that.",
    '{c} gets a knot between his teeth and pulls. Nothing comes off it. He goes on trying, for the fun of it.',
  ]),

  // ------------------------------------------------------- places to sit
  'catcab.perchLines': ['{c} curls up on the cushion above the litter boxes. It smells new. Nobody has slept on it before.'],
  'island.perchLines': ['{c} is on the kitchen island. Nobody has told him not to. Yet.', '{c} inspects the countertop for crumbs.'],
  // a nap up on something
  'nap.perch': ({ cat, wary }) =>
    cat === 'orca'
      ? wary
        ? ["{c} curls up, with one ear turned to the door. It's soft up here. He hadn't known that things could be this soft.", '{c} curls up for a nap. Zzz...']
        : ['{c} curls up for a nap. Zzz...', '{c} naps with both ears down. Nobody has to keep watch in here.']
      : ['{c} curls up for a nap. Zzz...', "{c} naps like a cat who's slept on furniture before. He has."],

  // ----------------------------------- a cat where a cat should not be
  // (whichever human is near says it: in these first days they are much too pleased to shout)
  'sofa.scold': ["\"Oh. The sofa. ...Go on, then, {c}. You've had a hard week.\"", "\"There's a scratching post, {c}. Just over there. No? All right.\""],
  'diningtable.scold': ['"Not on the table, {c}. ...Well. One minute, then."'],
  'island.scold': ["\"Careful, {c}. That's where we cook. Down you come, when you're ready.\"", "\"Oh, he's on the island. Look at him.\""],
  'counter.scold': ["\"Careful up there, {c}. That's where we cook.\""],
  'curtain.scold': ["\"He's up the curtain. Dummy, come and look at this!\"", '"Careful, {c}! ...How did you even get up there?"'],
  'headboard.scold': ["\"The headboard as well, {c}? ...It's only a headboard.\""],
  'knock.scold': ["\"What fell? ...It's all right, {c}. Nothing is broken.\"", '"I saw that paw, {c}. You looked at me first."'],
  // ({h}: whoever picks it up; {n}: the thing)
  'knock.back': ['{h} puts the {n} back, a little further from the edge this time.'],
  'keyboard.scold': ['"Oh. Hello, {c}. ...I can type that again."'],
  // a bite off somebody's plate, with them sitting at it
  'steal.scold': ["{h}: \"Oh! {c}, that's mine. ...Was it good?\"", '{h}: "Not from the plate, {c}. You have bowls of your own now."', '{h}: "Gently, gently. Down you go."'],

  // ------------------------------------------- the humans, meeting a cat
  // the first time each day (late at night they are half asleep, and say what Sandbox has them say)
  'greet.morning': ["{h}: \"Good morning, {c}. You're still here. Good.\"", '{h}: "Morning, {c}. Did you sleep? Was it too quiet for you?"', '{h}: "There he is. Good morning, {c}."'],
  'greet.day': ['{h}: "Hello, {c}. Finding your way around?"', "{h}: \"There you are, {c}. Take your time. It's all yours.\""],
  'greet.evening': ['{h}: "Good evening, {c}. Settling in?"', '{h}: "Hi, {c}. Come and sit with us, if you like. Only if you like."'],
  // a hand on a cat ('pets.' and whatever the human is doing: see PET_LINES in game.js)
  pets: ({ key, cat, wary }) => {
    const doing = key.slice(5);
    // (a sleeping human holds out no hand, and one on the toilet has other things to say)
    if (cat === 'orca' && wary)
      return doing === 'sleep'
        ? ["{c} watches {h} sleep, from the end of the bed. Humans are smaller when they're asleep."]
        : doing === 'toilet'
          ? ['{h}: "{c}! A little privacy?!" {c} stares. Unblinking.']
          : ORCA_WARY;
    return (PETS[cat] || {})[doing] || null;
  },
  // the first human to meet them after a trip downstairs (which nobody has let them make)
  out: [
    '{h}: "There you are! How did you get past the... never mind. You came back."',
    "{h} picks a leaf off {c}. \"You've been down in the garden. And you came home again.\"",
    "{h} sniffs {c}'s fur. \"Grass. You went to see your friends, did you?\"",
  ],

  // --------------------------------- the garden, heard from the balcony
  // at night: until a few days ago that was them down there. Then the dogs come.
  stray: ({ dogs }) =>
    dogs
      ? [
          '{c} listens over the rail. No yowling tonight. Only barking, far down, going from one end of the lawn to the other.',
          "The garden is dark, and the wrong kind of loud. {c} listens for a voice he knows, and doesn't hear one.",
          "Barking, below. {c}'s ears go flat. Everybody he knew a week ago is somewhere down there.",
        ]
      : [
          'From the garden below, a cat yowls. {c} knows the voice. He was down there himself, not long ago.',
          'Meows drift up from the garden. {c} listens for the ones he knows: a shrill one by the playground, and a low one from the shed.',
          "Two cats are arguing somewhere below. {c} could tell them how it ends. He's had that argument.",
        ],
};

// ------------------------------------------------------------ the epilogue
// Some time later (see act3-after.js). The pair have lived here long enough for Sandbox's lines to be
// true of them, so those are used again; but Stripes and Polka have pet names for them now, and a hand on
// a cat is no longer a new thing to anybody. {k} is one of the cat's pet names, a different one each
// time (the game fills it in: see fmt in game.js).
export const NICKS = {
  shark: ['Sharkie', 'Shark Shark', 'Sharkira', 'Baby Shark'],
  orca: ['Orkie Porkie', 'Ork', 'Ork Ork', 'Baby Ork', 'Orphaned Carnivore'],
};
const EP_PETS = {
  shark: [
    '{h}: "There he is. {k}." {c} gets the long stroke, nose to tail, and pushes back into it.',
    '{h} picks {c} up, all of him. "{k}, you weigh more than the suitcase did." {c} purrs anyway.',
    '{h}: "Sing for me, {k}." {c} does. {h} sings the next line back, badly.',
    '{h} scratches {c} under the chin, in exactly the right place. Two people know that place now.',
    "{h}: \"Who's my {k}?\" {c} knows the answer to that one.",
  ],
  orca: [
    "{h}: \"{k}. Come here.\" {c} comes. Once, he wouldn't have.",
    '{h} rubs {c} between the ears. {c} leans on the hand with his whole weight, and his eyes close.',
    '{h}: "{k}. My {k}." {c} purrs like an engine.',
    "{h} holds a hand out, low. {c} doesn't sniff it first anymore: he walks straight under it.",
    '{h}: "{k}! You were a stray once, you know." {c} has no idea what {he} is talking about.',
  ],
};
const EPILOGUE = {
  pets: ({ key, cat }) => {
    const doing = key.slice(5);
    if (doing === 'toilet') return null;
    if (doing === 'sleep') return ['{c} climbs onto {h}, turns around twice, and lies down. {h}, fast asleep: "...{k}..."', "{c} walks across {h}'s face. {h}: \"mmph... {k}... five more minutes.\""];
    return EP_PETS[cat] || null;
  },
  'greet.morning': ['{h}: "Good morning, {k}. Did you keep the bed warm for us?"', '{h}: "Morning, {k}." A hand comes down without looking, and finds the right ear.', "{h}: \"There's my {k}. Breakfast is in the machine. You know that. You've checked.\""],
  'greet.day': ['{h}: "Hello, {k}. What have you two been up to?"', '{h}: "There you are, {k}. I missed you. I was gone for an hour."'],
  'greet.evening': ["{h}: \"Good evening, {k}. Come and sit with us.\" There's a place kept for him on the sofa.", '{h}: "Hi, {k}. Long day in the garden?"'],
  out: [
    '{h}: "Back from the garden, {k}? Did you say hello to everybody for us?"',
    "{h} picks a leaf off {c}. \"You've been to see your friends. Good.\"",
    "{h} sniffs {c}'s fur. \"Grass, and river. Welcome home, {k}.\"",
  ],
};

// The Act 2 version of one of the flat's lists of lines, if there is one and it applies now; otherwise null.
// (In the epilogue, the epilogue's version if there is one, and otherwise null: Sandbox's.)
export function flatLines(story, key, cat) {
  if (!story || story.mode !== 'story' || !story.adopted) return null;
  if (story.flags && story.flags.epilogue) {
    let e = EPILOGUE[key] || (key.startsWith('pets.') ? EPILOGUE.pets : null);
    if (typeof e === 'function') e = e({ key, cat: cat && cat.cfg ? cat.cfg.id : null });
    return e && e.length ? e : null;
  }
  let v = FLAT[key] || (key.startsWith('pets.') ? FLAT.pets : null);
  if (typeof v === 'function') {
    const stage = (story.quest && story.quest.home) || 'arrive';
    v = v({ key, cat: cat && cat.cfg ? cat.cfg.id : null, wary: WARY.includes(stage), dogs: !QUIET.includes(stage), did: story.did || {} });
  }
  return v && v.length ? v : null;
}
