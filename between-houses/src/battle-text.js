// Every word the battle shows, in one place: move names and descriptions,
// conditions, menu labels, narration, the picker and the guide. battle.js and
// battle-screen.js read it; nothing here changes a rule.
//
// In narration, {User} / {user} and {Target} / {target} are names (at the
// start of a sentence, or inside one). {he} {He} {him} {his} {himself} are the
// user's pronouns; {t.he}, {t.him} and so on are the target's. {n} is a
// number. In a condition's "gain" line, {User} is the cat that just got it.
//
// Not every fighter is a cat. A rat, a snake and the robot vacuum have no
// ears to flatten, and some of them no legs to stumble on, so "fighters" may
// give a kind of fighter words of its own (the key is the fighter's kind):
//   attack      its light attack, in place of "swipes at"
//   narration   lines that replace the narration line of the same name
//               whenever that line is about a fighter of this kind
//   conditions  the "gain" line of a condition, when this kind gets it
//   hitBy       what a move is said to do when it is aimed at this kind, in
//               place of the move's own text ("trips" a snake: no)
// A line with no entry there is used as it stands for every fighter.
//
// The copy editor page (copy.html) lists all of this with the space each
// line has on screen. `node design/battle/copy.mjs edits.json` writes a set of
// edits from that page back into this file.
export const COPY = {
  "moves": {
    "attack": {
      "name": "Swipe",
      "text": "swipes at",
      "hint": "Deals 1x damage.",
      "brief": "1x damage"
    },
    "defend": {
      "name": "Defend",
      "hint": "Halves incoming damage until your next turn."
    },
    "chomp": {
      "name": "Chomp",
      "text": "chomps",
      "hint": "Deals 1.5x damage. Ignores guards and Weakened.",
      "brief": "1.5x damage, ignores guards"
    },
    "sing": {
      "name": "Sing",
      "text": "sings at",
      "hint": "Applies Distracted: next attack on the target can't miss.",
      "brief": "Next attack on target lands"
    },
    "protect": {
      "name": "Protect",
      "hint": "Takes every hit aimed at his team, at a quarter damage.",
      "brief": "Takes hits for his team"
    },
    "kick": {
      "name": "Bunny Kick",
      "text": "bunny-kicks",
      "hint": "Deals 2x damage.",
      "brief": "2x damage, low accuracy"
    },
    "groom": {
      "name": "Groom",
      "text": "grooms",
      "verb": "Groom",
      "hint": "Heals 25% of full HP. Takes on an ally's bad conditions.",
      "brief": "Heals 25%, takes conditions"
    },
    "yoga": {
      "name": "Big Stretch",
      "hint": "From next turn, applies Strengthened: 2x ATK until hit.",
      "brief": "2x ATK next turn, until hit"
    },
    "rampage": {
      "name": "Rampage",
      "hint": "Charges this turn. Next turn, deals 1.5x damage to every foe.",
      "brief": "Charges, then hits all foes"
    },
    "stomp": {
      "name": "Rampage",
      "text": "tears into"
    },
    "intimidate": {
      "name": "Intimidate",
      "text": "looms over",
      "hint": "Applies Spooked for 2 turns, Weakened until hit. Not on humans.",
      "brief": "Spooks and weakens"
    },
    "summon": {
      "name": "Summon",
      "hint": "A minion joins his team. Once per fight.",
      "brief": "Calls a minion to assist"
    },
    "lowblow": {
      "name": "Low Blow",
      "text": "goes low on",
      "hint": "Deals 1x damage, or 1.5x if the target has a bad condition.",
      "brief": "1.5x dmg vs. bad conditions"
    },
    "infect": {
      "name": "Infect",
      "text": "scratches",
      "hint": "Applies Infected: 8% of full HP lost per turn, 4 turns.",
      "brief": "Infects: damage over time"
    },
    "stealth": {
      "name": "Stealth",
      "hint": "Costs 25% of current HP. Applies permanent Swift: AGL raised to 60.",
      "brief": "Sacrifices HP, raises AGL"
    },
    "flurry": {
      "name": "Flurry",
      "text": "flies at",
      "hint": "Deals 0.7x damage three times, each rolled on its own.",
      "brief": "Three hits of 0.7x damage"
    },
    "zoomies": {
      "name": "Zoomies",
      "hint": "Whole team Swift for 2 turns, then Slowed for 1. Swipes a foe.",
      "brief": "Team Swift, then Slowed"
    },
    "energy": {
      "name": "Kitten Energy",
      "text": "riles up",
      "verb": "Rile up",
      "hint": "Resets an ally's cooldown: their special is ready right away.",
      "brief": "Resets an ally's cooldown"
    },
    "trip": {
      "name": "Trip",
      "text": "trips",
      "hint": "Deals 0.5x dmg. Slowed: AGL -25, 2 turns. Stops a wind-up.",
      "brief": "0.5x damage, also slows"
    },
    "ninelives": {
      "name": "Nine Lives",
      "text": "nudges",
      "verb": "Revive",
      "hint": "Brings a downed ally back at 50% HP. Once per fight.",
      "brief": "Revives an ally, once"
    },
    "ghost": {
      "name": "Ghost Cat",
      "text": "fixes her eyes on",
      "hint": "Applies Spooked for 2 turns (not on humans). She vanishes this turn.",
      "brief": "Spooks, then vanishes"
    },
    "spook": {
      "name": "Ghost Cat"
    },
    "charm": {
      "name": "Charm",
      "text": "charms",
      "hint": "Deals 0.5x dmg. Applies Weakened until hit. Not on humans.",
      "brief": "0.5x damage, also weakens"
    },
    "cure": {
      "name": "Cure",
      "hint": "Cures every bad condition on her whole team.",
      "brief": "Cures bad conditions"
    },
    "leftovers": {
      "name": "Leftovers",
      "hint": "Applies Snacking to team: 4% of full HP back per turn, 3 turns.",
      "brief": "Team heals 4% per turn"
    },
    "headbutt": {
      "name": "Headbutt",
      "text": "shuts his eyes and charges at",
      "hint": "Takes half of the target's current HP.",
      "brief": "Halves target's current HP"
    },
    "enrage": {
      "name": "Panic",
      "hint": "Costs 50% of current HP. Applies permanent Strengthened: 2x ATK.",
      "brief": "Sacrifices HP, doubles ATK"
    },
    "pounce": {
      "name": "Pounce",
      "text": "pounces on",
      "hint": "Deals 1.3x damage, or 2x if the target is Rattled.",
      "brief": "1.3x dmg; 2x vs. Rattled"
    },
    "hiss": {
      "name": "Hiss",
      "text": "hisses at",
      "hint": "Applies Rattled: no Defend or Protect for 2 turns. Drops a guard.",
      "brief": "Disables Defend and Protect"
    },
    "snub": {
      "name": "Snub",
      "text": "looks straight through",
      "hint": "Removes Strengthened, Swift and Snacking from one foe.",
      "brief": "Strips a foe's boosts"
    },
    "lunge": {
      "name": "Lunge",
      "text": "lunges at",
      "hint": "Deals 1.5x damage.",
      "brief": "1.5x damage"
    },
    "bark": {
      "name": "Bark",
      "text": "barks at",
      "hint": "Applies Spooked for 2 turns.",
      "brief": "Spooks"
    },
    "howl": {
      "name": "Howl",
      "hint": "At 60% HP or less, another dog joins. Once per fight.",
      "brief": "Calls another dog"
    },
    "venom": {
      "name": "Venom",
      "text": "bites",
      "hint": "Deals 0.5x dmg. Applies Infected: 8% of full HP lost per turn, 4 turns.",
      "brief": "0.5x damage, also infects"
    },
    "durians": {
      "name": "Durians",
      "text": "throws a durian at",
      "hint": "Deals 0.5x dmg. Applies Infected for 4 turns. She gets Snacking.",
      "brief": "0.5x damage, also infects"
    },
    "pickleball": {
      "name": "Pickleball",
      "text": "paddles a ball at",
      "hint": "Aims at every foe, one at a time: 0.5x dmg, and Spooked for 2 turns.",
      "brief": "Hits all foes, also spooks"
    },
    "golfswing": {
      "name": "Golf Swing",
      "hint": "Winds up for 2 turns. Then deals 3x damage to every foe.",
      "brief": "Winds up, then hits all foes"
    },
    "swing": {
      "name": "Golf Swing",
      "text": "swings at"
    }
  },
  "conditions": {
    "distracted": {
      "name": "Distracted",
      "brief": "Can't dodge next attack",
      "gain": "{User} is distracted. The next attack on {him} can't miss."
    },
    "spooked": {
      "name": "Spooked",
      "brief": "Heavy/Special disabled",
      "gain": "{User} is spooked: heavy and special disabled for two turns."
    },
    "infected": {
      "name": "Infected",
      "brief": "Loses 8% of full HP per turn",
      "gain": "{User} is infected: 8% of full HP lost per turn, for four turns."
    },
    "rattled": {
      "name": "Rattled",
      "brief": "Defend/Protect disabled",
      "gain": "{User} is rattled: no Defend or Protect for two turns."
    },
    "weak": {
      "name": "Weakened",
      "brief": "ATK reduced to 0.5x",
      "gain": "{User} goes soft: 0.5x ATK until hit."
    },
    "slowed": {
      "name": "Slowed",
      "brief": "AGL reduced by 25",
      "gain": "{User} stumbles and is easier to hit for two turns."
    },
    "swift": {
      "name": "Swift",
      "brief": "AGL raised to 60"
    },
    "strong": {
      "name": "Strengthened",
      "brief": "ATK raised to 2x"
    },
    "snacking": {
      "name": "Snacking",
      "brief": "Regains 4% of full HP per turn"
    }
  },
  "blocked": {
    "spooked": "Too spooked.",
    "human": "No use on a human.",
    "used": "Used up.",
    "waitOne": "Ready in 1 turn.",
    "wait": "Ready in {n} turns.",
    "heal": "No ally needs it.",
    "energy": "No ally is on cooldown.",
    "revive": "No ally is down.",
    "cure": "Nothing to cure.",
    "summon": "No room.",
    "yoga": "Already strong.",
    "rattled": "Too rattled.",
    "snub": "No foe has a boost.",
    "reach": "No one in reach."
  },
  "accuracy": {
    "sure": "Can't miss",
    "veryHigh": "Very high accuracy",
    "high": "High accuracy",
    "medium": "Medium accuracy",
    "low": "Low accuracy"
  },
  "menu": {
    "attack": "Attack",
    "special": "Special",
    "back": "Back",
    "whoNext": "Who next?",
    "whatNext": "What next?",
    "whichAttack": "Which attack?",
    "whichSpecial": "Which special?",
    "yourTurn": "Your turn",
    "theirTurn": "Foes' turn",
    "hit": "Hit",
    "noConditions": "No conditions",
    "noSpecials": "No specials",
    "specialIn": "in {n}",
    "covers": "{name} covers",
    "round": "Round {n}",
    "roundOf": "Round {n} of {max}",
    "thinking": "{name}..."
  },
  "narration": {
    "guard": "{User} braces.",
    "cover": "{User} plants {himself} in front of {his} team.",
    "coverAlone": "{User} digs in. Only a quarter of damage gets through.",
    "yoga": "{User} settles into a long, slow stretch. It'll pay off next turn.",
    "enrage": "{User} panics and goes wild.",
    "snack": "{User} shares out the leftover kibble.",
    "charge": "{User} lowers {his} head and winds up. Something big is coming.",
    "groomSelf": "{User} grooms {himself}.",
    "groom": "{User} grooms {target}.",
    "revive": "{User} nudges {target} back up.",
    "energy": "{User} riles up {target}.",
    "cure": "{User} washes every face on {his} team.",
    "summon": "{User} yowls for backup.",
    "stealth": "{User} slips into the shadows.",
    "zoom": "{User} gets the zoomies!",
    "ghost": "{User} fixes {his} eyes on {target}.",
    "rampage": "{User} rampages through all of them!",
    "rampageNobody": "{User} rampages, but nobody is in reach.",
    "attack": "{User} {does} {target}!",
    "healed": "{n} HP back.",
    "healedNone": "Not a hair out of place: nothing to heal.",
    "revived": "{Target} is back in the fight.",
    "energised": "{Target} is ready to use a special again.",
    "cured": "{User} shakes it off.",
    "curedOnto": "{User} is clean. {Target} has taken it on {t.himself}.",
    "secondWind": "But {user} has one of {his} nine lives left! {He}'s back up.",
    "strong": "{User} is limbered up. {He}'s Strengthened until something hits {him}.",
    "enrageCost": "It costs {him} {n} HP. {He}'s Strengthened for the rest of the fight.",
    "snacking": "Everyone on {his} team is Snacking.",
    "snackingAlone": "{He}'s Snacking.",
    "nibble": "{User} nibbles: {n} HP back.",
    "nibbleLast": "{User} finishes the last of the kibble.",
    "fizzle": "The Rampage is off.",
    "join": "A {newcomer} turns up at {target}'s side!",
    "stealthCost": "It costs {him} {n} HP. {He}'s Swift and harder to hit for the rest of the fight.",
    "zoomOn": "{He}'s Swift and harder to hit for two turns.",
    "zoomOnAll": "It's catching! Everyone on {his} team is Swift for two turns.",
    "zoomOff": "The zoomies wear off. {User} is Slowed for a turn.",
    "zoomOffAll": "The zoomies wear off. Everyone who had them is Slowed for a turn.",
    "vanished": "Then {he} melts away.",
    "appear": "{User} steps back out of the shadows.",
    "coverTake": "{User} takes it instead!",
    "hitSure": "No dodging that one.",
    "hit": "{n} damage!",
    "hitBraced": "Braced: only {n} damage.",
    "hitPierced": "Straight through the guard: {n} damage!",
    "missSoft": "{Target} shrugs it off.",
    "missDodged": "{Target} dodges!",
    "miss": "{User} misses!",
    "redock": "{User} rolls back onto its dock. Full charge again.",
    "unguard": "{His} guard comes down.",
    "strip": "{Target} loses {list}.",
    "stripNone": "{Target} has nothing to lose.",
    "stripWarm": "the stretch",
    "tick": "The infection bites {user}: {n} damage.",
    "ko": "{User} backs off, ears flat. {He}'s out of this fight.",
    "koMinor": "{User} has had enough, and bolts for the bushes."
  },
  "floats": {
    "ready": "READY",
    "cured": "CURED",
    "strong": "STRONG",
    "snack": "SNACK",
    "swift": "SWIFT",
    "slowed": "SLOW",
    "dodge": "DODGE",
    "miss": "MISS"
  },
  "fight": {
    "intro": "{left} against {right}.",
    "guide": "Hint: the bubble over a foe's head shows what it'll do on its next turn. ⫽ means an attack, ⛨ a guard, ✦ a special.",
    "guideTab": "Esc or ☰, then Help, brings up a guide to the stats and conditions.",
    "wonOne": "{names} holds the pool of lamplight. Your team wins!",
    "wonMany": "{names} hold the pool of lamplight. Your team wins!",
    "lost": "Your team bolts for the bushes. Nothing hurt but pride.",
    "draw": "Forty rounds, and nobody has given way. Both teams back off, stiff-legged, pretending it was their idea.",
    "tally": "(Won {w}, lost {l}.)"
  },
  "fighters": {
    "robot": {
      "name": "The robot vacuum",
      "label": "Robot Vacuum",
      "attack": "bumps into",
      "narration": {
        "missDodged": "{Target} swerves out of the way.",
        "hitSure": "No swerving out of that one.",
        "ko": "{User} goes over with a clatter. It's out of this fight."
      }
    },
    "flower": {
      "narration": {
        "guard": "{User} sits down and washes a paw, as if nothing were happening.",
        "ko": "{User} turns {his} back on all of them. {He}'s out of this fight."
      }
    },
    "dog": {
      "attack": "snaps at",
      "narration": {
        "guard": "{User} plants its feet and growls.",
        "summon": "{User} throws back its head and howls.",
        "join": "Another dog comes running!",
        "koMinor": "{User} has had enough. It backs off, tail down."
      }
    },
    "lookalike": {
      "name": "The lookalike",
      "label": "Lookalike"
    },
    "bigRat": {
      "name": "The big rat",
      "label": "Big Rat"
    },
    "rat": {
      "attack": "bites"
    },
    "snake": {
      "attack": "strikes at",
      "narration": {
        "guard": "{User} coils up tight.",
        "missSoft": "{Target} takes no notice.",
        "healedNone": "Not a scale out of place: nothing to heal.",
        "nibble": "{User} swallows a piece of kibble whole: {n} HP back.",
        "nibbleLast": "{User} swallows the last of the kibble.",
        "koMinor": "{User} has had enough, and slides off into the bushes."
      },
      "conditions": {
        "slowed": "{User} gets in a tangle and is easier to hit for two turns."
      },
      "hitBy": {
        "trip": "tangles up"
      }
    },
    "scarf": {
      "name": "Purple Scarf",
      "label": "Purple Scarf",
      "attack": "kicks at",
      "narration": {
        "snackingAlone": "{He} breaks open another one for {himself}. {He}'s Snacking.",
        "nibble": "{User} eats a piece of durian: {n} HP back.",
        "nibbleLast": "{User} finishes the durian.",
        "ko": "{User} drops {his} bag and backs away. {He}'s out of this fight."
      }
    },
    "green": {
      "name": "Green Shirt",
      "label": "Green Shirt",
      "attack": "kicks at",
      "narration": {
        "pickleball": "{User} paddles a ball at every one of them!",
        "ko": "{User} throws down {his} paddle. {He}'s out of this fight."
      }
    },
    "club": {
      "name": "Golf Club",
      "label": "Golf Club",
      "attack": "kicks at",
      "narration": {
        "charge": "{User} draws back for a big swing. It lands in TWO turns, not one.",
        "wind": "{User} is still winding up. The swing lands on {his} NEXT turn!",
        "swing": "{User} swings at all of them!",
        "fizzle": "{User} loses {his} grip. The Golf Swing is off.",
        "ko": "{User} stops, red in the face. {He}'s out of this fight."
      }
    }
  },
  "picker": {
    "you": "You",
    "them": "Foes",
    "yours": "Pick your team",
    "theirs": "Pick foes",
    "next": "Next",
    "fight": "Fight!",
    "doneNone": "Pick at least one first.",
    "doneNext": "Next: pick the foes.",
    "doneFight": "Start the fight.",
    "doneKey": "C or △",
    "keys": "Space or ✕: pick   Shift or ◯: undo or back   C or △: done",
    "leave": "Shift or ◯ with nobody picked: back to the title.",
    "foesOnly": "Only on the foes' side.",
    "onTeam": "On the team. Choose again to take off.",
    "manyOn": "On the team. Choose again for another one.",
    "manyFull": "On the team. Choose again to take them all off.",
    "otherTeam": "On the other team.",
    "full": "This team is full.",
    "move": "Move",
    "description": "Description",
    "noMoves": "No heavy attack, no specials."
  },
  "guide": {
    "title": "Battle Guide",
    "close": "Any button: back",
    "hp": "HP = Health",
    "atk": "ATK = Attack",
    "agl": "AGL = Agility",
    "conditions": "Conditions",
    "bars": "Health Bars",
    "bracing": "Bracing",
    "bracingText": "Incoming damage is halved.",
    "protected": "Protected",
    "protectedText": "A friend takes the hits instead.",
    "charging": "Charging",
    "chargingText": "Winding up: a big attack is coming."
  }
};
