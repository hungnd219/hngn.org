// The words of Act 3, part "night": the night of the dogs, and the morning
// after (act3-night.js). Lines are [who, words]: '' is the narrator; a cat's
// or a person's id otherwise. Captions (said at the foot of the screen, not in
// a box) may use {c} for the leader and {o} for the other one.
export const A3 = {
  // name plates
  kitten: 'Kitten',
  whiteName: 'White Cat',
  // Mamacat's white friend, by the box from the night of the dogs on
  whiteCat: [
    "The white cat that fought beside Mamacat once, to pay back a favor. The favor's paid. It came anyway.",
    'The white cat blinks at {c}, slowly, and goes back to watching the sidewalk.',
  ],

  // ---- the four tips of the act
  tip1: "Dogs are loose in the garden: a new and very dangerous foe. One dog is a tricky fight. Two are a hard one. Three will be near impossible.",
  tip2: "A dog notices a cat that comes into the faint blue circle around it. The circle turns red, and a moment later the dog has them: you can't outrun a dog. A losing dog howls for backup, so finish it quickly.",
  tip3: "A bush or a large tree hides a cat from a dog that's not noticed it yet. A dog that saw you go in waits a while: stay put until it's gone.",
  tip4: "Friends can be asked along from now on: walk up to one and press Space or ✕. A friend who comes along fights beside the pair. They all stay near Mamacat's box now: the garden is too dangerous.",

  // ---- open: outside Amber's doors, as Act 2 ends
  open: {
    doorstep: ['', 'Night. The garden, from the doorstep.'],
    dogs: ['', 'The benches are empty. Nobody is on the slide. From the far east end of the garden comes barking: a lot of it.'],
    tree: ['', 'By the monkey bars a small orange shape is up a tree. A dog is standing under it, looking up.'],
    // Green Shirt, at the dog under the tree (he is seen from the doorstep, and does not see the pair)
    greenIn: ['', 'A man in a green shirt, a whistle around his neck, comes across the playground straight to the dog.'],
    green: [
      ['green', "One cat. One tiny cat, and you can't even catch it."],
      ['green', "Up a tree is not caught. Caught is caught. GOT IT?"],
      ['', "The dog puts its ears back and its tail down. It doesn't make a sound."],
      ['green', 'Useless animal. You hear me? Useless.'],
    ],
    pair: [
      ['shark', "That's Green Shirt. What's he doing down here with a dog?"],
      ['orca', 'Later. Look at the tree. Cheetos.'],
      ['shark', 'He was calling for help this morning.'],
      ['orca', 'And we spent all day on a robot. ...Come on.'],
    ],
  },
  goalCheetos: "Rescue Cheetos. He's up a tree by the monkey bars.",

  // ---- cheetos: the first dog, under his tree
  // (said when the dog under the tree notices the pair, before the fight)
  treeSeen: ['', "The dog under the tree turns its head. It's seen them."],
  // the fight: one dog, and no other near enough to hear it
  treeFight: {
    intro: ["The dog leaves the tree and comes for Shark and Orca. It's on its own: the others are all at the east end, too far off to hear it howl."],
    won: 'The dog has had enough. It backs off with its tail down.',
    lost: 'Too many teeth. Shark and Orca run for it!',
  },
  // walking into the trunk while he is up it (captions)
  cheetosUp: [
    "Cheetos looks down at {c} through the leaves. He's not coming down while that dog is there.",
    'A small orange face, a long way up. Cheetos has never kept so still in his life.',
    'Cheetos points his nose at the dog, and then at {c}, and then at the dog again.',
  ],
  cheetosDown: [
    ['cheetos', "You took your time. I've been up here since breakfast."],
    ['shark', 'You called. We heard you.'],
    ['orca', 'We came as soon as we got the front door open.'],
    ['cheetos', 'The front door? Oh, right. The two nice humans. All of us heard about it. But you left them to come back down?'],
    ['cheetos', '...Anyway. Listen, that was only one dog. There are more at the east end, by the shed. A whole pack.'],
    ['cheetos', 'They have cats cornered there. I heard Scar. And small ones.'],
    ['shark', 'Scar.'],
    ['orca', "Then that's where we're going. Stay behind us."],
    ['cheetos', "Behind. Yes. I'm very good at behind."],
  ],
  cheetosJoins: ['', "Cheetos comes along. He keeps out of fights: he's small, and he's had a long day."],
  goalEast: "Go east, to the BBQ shed. Keep out of the blue circle around each dog.",

  // ---- east: the way there, with Cheetos behind (captions, when he is walked into)
  cheetosBehind: [
    'Cheetos is right behind {c}, and would like to be further behind.',
    "Cheetos has his ears flat and his eyes on every bush. He doesn't make a sound.",
    'Cheetos bumps into {c}. He was looking the other way. He was looking every other way.',
  ],
  // he was left behind (the pair went indoors, say) and has caught up again
  cheetosBack: 'Cheetos comes out from under the hedge and falls in behind {o} again.',

  // going up to the flat during the night (a caption)
  emptyFlat: 'The apartment is dark, and nobody is home: Hưng and Trang are out looking for two cats. The kibble machine has been left full.',

  // ---- shed: Scar and the kittens, three dogs, Socks, and Thanos
  shed: {
    see: [
      ['', 'The BBQ shed. Three dogs are standing in front of it, barking.'],
      ['', 'Scar is at the edge of the roof, with her back to the shed and her bad leg under her. Behind her are three kittens, patched orange and white.'],
      ['cheetos', "Those are Thanos's. His youngest."],
      ['cheetos', "Their mother got chased away when the dogs first came. Nobody has seen her since. And you know Thanos doesn't visit his kittens."],
      ['cheetos', 'So Scar took them in, under her shed. She grooms them, and she tells them off. All while you two were upstairs.'],
      ['shark', "He's the one who gave her that bad leg."],
      ['cheetos', "I know. She says somebody has to be their mother. She had her own, once."],
    ],
    socks: [
      ['', 'The bushes behind them rustle. Four white socks come out of the dark.'],
      ['socks', 'You two are back. I could hear that all the way from the river. What are we doing about this?'],
      ['shark', 'He and I will keep the dogs busy. You take Scar and the small ones over the road, to the box by our doors. Cheetos goes with you.'],
      ['socks', "Cross the road? Are you sure?"],
      ['shark', 'You know how to do it.'],
      ['socks', "...Fine."],
    ],
    yowl: ['', 'Orca gives the loudest meow he has. Three heads turn around.'],
    slip: ['', 'While the dogs look at Orca, Socks goes around behind them and in under the roof.'],
    scar: [
      ['socks', "Out. All of you. Now, while they're looking the other way."],
      ['scar', "I don't leave this shed."],
      ['socks', "Then the kittens won't leave it either."],
      ['', "Scar looks at the kittens. Then she gets up, and slowly limps out from under her roof."],
    ],
    off: ['', "Socks goes first. The kittens go in a row behind Scar, and Cheetos runs last, looking back. They're gone into the dark, toward the crosswalk."],
    turn: [
      ['', 'The dogs have stopped looking at where the kittens were. All three of them are looking at Shark and Orca.'],
      ['orca', "Two against three. ...It's been nice knowing you, Shark."],
    ],
    thanos: [
      ['', "Suddenly, something very big comes out of the dark, and stops between the pair and the dogs. It's orange and white, and it doesn't hurry."],
      ['thanos', 'Those are my kittens under that roof.'],
      ['shark', "They're not under it anymore. They're over the road."],
      ['thanos', 'Then these three have nothing to bark at. Get ready.'],
    ],
  },
  goalShed: 'Chase the three dogs off, with Thanos.',
  shedFight: {
    intro: ["Three dogs, and nowhere to hide. But Thanos is in front, and he's very angry. Now it's three against three."],
    won: 'The last dog backs off with its tail down. All three of them have had enough.',
    lost: "It's too much, even for three. Shark and Orca run for it!",
  },
  shedLost: ['', "Shark and Orca are in the bushes west of the shed, with nothing left in them. Thanos is still out there, holding the dogs off. He can't do it for ever."],
  goalShedAgain: 'Thanos is holding three dogs off at the BBQ shed. Go back and help him.',
  // coming back after losing it
  shedAgain: [
    ['thanos', 'You again. Good. I was getting bored.'],
    ['orca', "He's not bored. Look at his ears."],
  ],
  // walking into Thanos or a dog while they stand there
  shedStand: "Thanos doesn't take his eyes off the dogs. The dogs don't take theirs off him.",
  shedWon: [
    ['', 'The dogs run for the river end, all three. Thanos watches them go, and then sits down, pretty hard.'],
    ['thanos', "You came back down. House cats don't come back down. Not for stray cats."],
    ['orca', "We're both now. House cats, and strays."],
    ['thanos', '...Hm.'],
    ['', "He's holding one front paw off the ground. He doesn't say a word about it."],
    ['shark', "They're safe. Socks took them to the box by our doors, with Mamacat and her small one."],
    ['thanos', "Mamacat's small one. ...You asked about him before. Fine. I'll look in on them, now and then. From over here."],
    ['thanos', 'Go on. I keep this side of the road. Tell the one with the leg... No. Tell her nothing.'],
  ],
  goalBox: "Go to Mamacat's box, by Amber's doors. Be careful: there are still dogs on the sidewalk. Bushes can hide you from dogs.",

  // ---- tobox: everybody, in the bush by the box
  box: [
    ['', "Mamacat's box. Every cat they know is here, pressed up against the hedge beside it, and every one of them is awake."],
    ['socks', 'Eight lives when I set out. Eight now. I counted them on the far side.'],
    ['scar', "It's not my shed. ...It's dry."],
    ['', 'The three kittens are in a heap against Scar. Babycat is looking at his half-brothers as if they were the biggest news of his life.'],
    ['cheetos', 'You should have seen us run. I was last, so I saw all of it.'],
    ['orca', "We're safe for now. Thanos has the other side. And no dog comes too close to this building. Further along the sidewalk is another matter."],
    ['shark', "I can't feel my paws."],
    ['mama', "Sleep. I'm awake anyway."],
  ],
  boxSleep: ['', 'They lie down where they are. Nobody has ever fallen asleep so fast.'],

  // ---- morning: Hưng and Trang find them
  morning: {
    doors: ['', "Morning. Amber's doors open, and two people come out who haven't been to bed."],
    found: [
      ['hung', 'There. THERE. By the box, look. Both of them.'],
      ['trang', 'The door was open, and the vacuum was on its back. We looked all night.'],
      ['hung', "One, two... there's the little orange one. And the one with the socks. Three, four... are those kittens? How many cats are there in this garden?"],
      ['trang', "The cats didn't run away, dummy. They came back for their friends."],
      ['', "For a moment neither of them says anything."],
    ],
    plate: [
      ['hung', 'Well. Nobody here has had breakfast.'],
      ['', 'He puts a big plate down in the middle of them all, the way the two of them always did.'],
    ],
    wait: ['', 'Orca looks at the plate. Then he sits down, and waits until Cheetos has eaten.'],
    first: ['orca', "That's right, Cheetos. Eat first."],
    eaten: ['', "Then everybody eats. Shark and Orca eat until they're full."],
    bye: [
      ['trang', 'Do we carry the cats back up? The vet said they needed time to recover from that fight. And now with all those dogs down here...'],
      ['hung', "They were climbing our curtains yesterday, dummy. I think they're fine. Besides... I have a feeling they're in the middle of something."],
      ['trang', "...Fine. But I'll ask the guard to keep an eye on the cats. And did he ever get back to you about where the dogs came from?"],
      ['hung', "Yeah. He said the guards were checking the gate all day, but didn't see a single dog come in. I'll ask him again."],
      ['trang', 'Well. Shark. Orca. ...The door is open. Come back up when you like. And be safe, okay?'],
    ],
    gone: ['', 'The two of them go back in, slowly, looking over their shoulders all the way.'],
  },
  // (the Garnet part puts its own goal in place of this one at once)
  goalMorning: "Hear what the others have seen, at Mamacat's box.",

  // ---- the friends at the box (and Thanos by the shed), walked up to: captions, three each
  // on the night itself
  nightLines: {
    mama: [
      "Mamacat has Babycat pressed up against the hedge behind her. Her eyes don't leave the sidewalk.",
      "Mamacat looks {c} over, and then past him, at the dark. She's counting dogs.",
      "Mamacat doesn't move. A dog went by an hour ago, and she hasn't moved since.",
    ],
    baby: [
      'Babycat has a lot to say about dogs. Mamacat puts a paw on his head, and he says it more quietly.',
      "Babycat peeks out from under Mamacat. Mew. It's the smallest mew he has.",
      "Babycat isn't scared. He'd like {c} to know that. He stays exactly where he is.",
    ],
    cheetos: [
      'Cheetos has curled up as small as he goes, which is very small.',
      "Cheetos opens one eye at {c}, and shuts it again. He's not asleep. Nobody is.",
      "Cheetos has stopped bouncing. It doesn't suit him.",
    ],
    socks: [
      "Socks is washing a white foot that's already clean. She's crossed a road tonight and would like it known.",
      'Socks blinks at {c}, slowly.',
      "Socks is watching the curb, where the cars go by. From this side they don't look so bad.",
    ],
    scar: [
      "Scar has three kittens asleep against her, and her bad leg stuck out in front. She looks as if she's not sure how this happened.",
      'Scar bumps noses with {c}, very carefully, so as not to wake anybody.',
      'Scar looks over the road, at where her shed is. Then she looks at the kittens, and stays.',
    ],
    thanos: [
      'Thanos is lying across the path to the shed like a fallen tree. Nothing is getting past him tonight.',
      "Thanos hisses at {c}. It's not his best hiss. He's tired, and he's holding one paw off the ground.",
      'Thanos looks over the road, at the box by the doors, and then away again, quickly.',
    ],
    kitten: [
      'The kitten looks up at {c} with a glare that it can only have gotten from one cat.',
      'The kitten is asleep against Scar, with one paw over its nose.',
      "The kitten wakes, sees {c}, and goes straight back to sleep. It's had enough for one night.",
    ],
  },
  // on the way home from Garnet, with the dogs called back to the boat: one line each
  goneLines: {
    mama: ['Mamacat: "They went off toward the river, all at once. I\'m keeping the small ones in the box anyway."'],
    baby: ['Babycat: "I scared them off! ALL of them! ...Mama says I didn\'t."'],
    cheetos: ['Cheetos: "No barking! Listen! Not one bark! ...They\'re coming back, aren\'t they? Probably."'],
    socks: ['Socks: "The sidewalk is empty. I checked it twice. I don\'t trust it."'],
    scar: ['Scar: "Mm. Quiet. Dogs don\'t just leave, house cat. Somebody called them."'],
    thanos: ['Thanos: "Hm. Gone. For now."'],
    kitten: ["The kitten looks down the empty sidewalk, and then up at {c}. No dogs. It doesn't know what to do with itself."],
  },
  // from the morning on, by day and by night, while the dogs are still about
  friendLines: {
    mama: [
      'Mamacat watches the doors of both buildings from her box, as she does all day. Nothing gets past her.',
      "Mamacat gives {c} a slow blink. It's a longer one than it used to be.",
      "Mamacat has her box, her kitten, and now a sidewalk full of company. She's bearing up.",
    ],
    baby: [
      "Babycat is showing the three kittens how to shout at a humming box. They're quick to learn.",
      'Babycat pounces on {c}, and three kittens pounce on Babycat.',
      'Mew! Babycat has been telling everybody about the snake. It gets longer every time.',
    ],
    cheetos: [
      "Cheetos bounces on the spot. He hasn't had a slide to go down all day, and it shows.",
      "Cheetos sniffs {c}. Kibble, and bushes, and dog. He'd come along, if he were asked.",
      "Cheetos has run around the box nine times. There's nowhere else to run.",
    ],
    socks: [
      'Socks bonks heads with {c}. Four white socks, and not one of them has been off the sidewalk today.',
      'Socks taps {c} on the tail and bolts three steps, out of habit. Then she comes back.',
      "Socks looks at the road, and yawns at it. She's crossed worse.",
    ],
    scar: [
      "Scar leans against {c} for a moment. She's never been this far from her shed, and she hasn't said a word about it.",
      "Scar is washing a kitten that doesn't want to be washed. It's being washed.",
      'Scar looks {c} up and down: sofa, kibble, humans. And dog, now. She purrs anyway.',
    ],
    thanos: [
      "Thanos is on his own side of the road, by the shed, and means to stay there. He glares at {c}. It's nearly friendly.",
      "Thanos is still holding that paw off the ground. He'd bite anybody who mentioned it.",
      'Thanos looks at {c} for a long time. HSSS. Then, very quietly: Hm.',
    ],
    kitten: [
      'The kitten glares up at {c}. Half the garden has that glare. This one is still learning it.',
      "The kitten has hold of the end of Scar's tail, and isn't letting go.",
      "The kitten is trying to follow Babycat up onto the humming box. It's not big enough yet.",
    ],
  },
};
