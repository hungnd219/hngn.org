// Every word of Act 3's second part, "Garnet": what the others have seen, BBC
// and Flower at Garnet's doors, the two favours, the box, the balconies,
// Purple Scarf's flat and what is found in it, and the way out. The script
// that plays them is src/act3-garnet.js.
//
// A scene is a list of lines, each [who, words]: '' is the narrator, and the
// others are 'shark', 'orca', 'cheetos', 'mama', 'hung', 'trang', and the
// names in `who` below (BBC, Flower, the guard, Flower's human, Purple
// Scarf). A caption is a line at the bottom of the screen with no name on it
// ({c} is whoever leads, {o} the other cat, {n} a friend who is along).
//
// Hưng and Trang never use each other's names: each calls the other "dummy".
export const A3 = {
  // name plates of the people this part brings in
  names: {
    guard: 'Guard',
    owner: "Flower's Human",
  },
  // the goal box, at each stage
  goals: {
    doors: "Go to Garnet's doors, and find BBC and Flower. There are dogs on the sidewalk.",
    favours: "Two favors. BBC's collar is in the bushes past the BBQ tables, in the far east corner. Flower wants the catnip stick from the apartment upstairs.",
    collarLeft: "One favor left. BBC's collar is in the bushes past the BBQ tables, in the far east corner.",
    catnipLeft: 'One favor left. Flower wants the catnip stick from the apartment upstairs.',
    wait: "Be at Garnet's doors when Flower's human comes down for her delivery: between 4 and 5 in the afternoon. (Hold Space or ✕ to nap.)",
    flat: "Look around Purple Scarf's apartment. What's she doing with the dogs?",
    out: 'Get out, by her front door.',
    regroup: 'Go home. Tell Hưng and Trang.',
  },

  // ----------------------------------------------------------------- garnet
  // at Mamacat's box, straight after the morning: what the others have seen
  garnet: [
    ['', "By Mamacat's box. The plate is clean, and nobody has gone far from it."],
    ['socks', 'Two nice humans and all the food you want. And here you are, back on the sidewalk with us.'],
    ['orca', 'The food is not going anywhere.'],
    ['mama', "Why not go back to your humans?"],
    ['shark', "They're not going anywhere either. And we will go back. But only when everybody here can go back to where they sleep."],
    ['shark', 'So. The dogs. What do we know?'],
    ['scar', "Mm. One stray dog is bad luck. A whole pack in one night is somebody's doing."],
    ['cheetos', 'I was hiding in a tree all day. But I saw that man in the green shirt from up there.'],
    ['cheetos', 'I think he was ordering the dogs around? He whistled, and they went where he pointed.'],
    ['mama', "Green shirt. He lives in this building, same as your two humans. But he's been in and out of that other building at the far end. I watch the sidewalk all day, so I know."],
    ['mama', "When he goes to that other building, the thin woman in the purple scarf comes down to pick him up. They carry sacks inside together."],
    ['mama', "The sacks smell like dog food. But no dog lives in that building. I would've heard them."],
    ['shark', 'That other building... BBC and Flower. They live there. Maybe they know something?'],
    ['orca', "You think they'll help? They said it wasn't their problem."],
    ['shark', "The problem is on their doorstep now."],
  ],

  // ------------------------------------------------------------------ doors
  // the pair come up to Garnet's doors: BBC with no collar, shut out; Flower above it all
  doors: {
    open: [
      ['', "Garnet's doors. The big black cat is on the step, and he seems different than usual. His neck is bare."],
      ['bbc', 'OPEN! Open the door! I LIVE here! Fourteenth floor! I have a BED!'],
    ],
    guard: [
      ['guard', "Shoo. Go on. No strays in this lobby. That's three times now."],
      ['guard', 'Not you, miss. You have your collar on.'],
      ['flower', 'Naturally.'],
    ],
    // the guard has gone back in, and the pair have walked up
    talk: [
      ['shark', "You're the two from the balcony the other night. You live here."],
      ['bbc', "I AM a house cat. Not a STRAY! Tell him!"],
      ['shark', "Where's your collar?"],
      ['bbc', 'A dog had hold of it. A DOG. It came off in its teeth, and I ran.'],
      ['orca', 'And you. You live up there too. Have you seen a human with a purple scarf?'],
      ['flower', "I don't talk to strays."],
      ['orca', "I thought you said we were house cats now."],
    ],
    // a friend has come along (one line, the guard's)
    friend: [
      ['guard', 'And that one stays off my step as well. Go on!'],
      ['', '{n} backs off to the edge of the forecourt, to wait there.'],
    ],
    snap: [
      ['bbc', 'There were no dogs before there were strays. This is YOUR fault. GET OFF MY STEP!'],
      ['', "He's past listening. And where BBC goes, Flower goes."],
    ],
    // walking up again after losing
    again: [
      ['bbc', 'You again! I said OFF!'],
    ],
    fight: {
      intro: ["BBC is in a panic, and won't hear a word. Flower won't leave his side."],
      won: "BBC sits down, breathing hard. Flower sits down beside him. They're ready to listen.",
      lost: "There's no getting near BBC like this. {S} and {O} back off to catch their breath.",
    },
    lostAfter: "BBC is back on the step, shouting at the glass. Walk up to Garnet's doors to try again.",
    won: [
      ['bbc', "...All right. All right. I'm sitting down."],
      ['orca', "Why are you shaking? You're as big as Thanos."],
      ['bbc', "I've actually never been in a fight. That was my first. I had my eyes shut."],
      ['flower', 'You two still fight like strays.'],
      ['orca', 'Thank you.'],
      ['shark', "Listen. That human with the purple scarf has something to do with the dogs. We have to get inside to find out."],
      ['bbc', "Yes. The thin one. She's on the floor below ours. I know her door."],
      ['bbc', "But I can't help you if I can't even get in myself. The guard reads the tag on my collar, and the collar is gone. He thinks I'm a stray."],
      ['bbc', "And nobody is coming down for me. My human is very old. She hasn't been further than her own front door in years."],
      ['bbc', "That's why she lets me out: I go down and look at the garden for her, and I come back and tell her all about it. She's waiting up there now."],
      ['bbc', "Here's the deal. My collar is in the bushes past the BBQ tables, in the far east corner. Where the dogs are thickest. Bring it back, and I'll help."],
      ['flower', 'And I might remember something about that human with the purple scarf. For a price, naturally.'],
      ['flower', "My human doesn't allow catnip. She says it makes me undignified."],
      ['flower', "I can smell it on you. There's a catnip stick somewhere in your apartment. I want it."],
      ['orca', "Shark. Her Majesty is begging two strays for a favor."],
      ['flower', "I'm not begging. I'm ordering."],
    ],
  },
  // walking into Garnet's lobby doors while this part is on
  lobby: 'The guard looks down through the glass at {c}, and shakes his head. No tag, no lobby.',

  // ---------------------------------------------------------------- favours
  // walking up to either of them, before and after his or her favour
  ask: {
    bbc: ['bbc', 'My collar. Red, with a gold tag. In the bushes past the BBQ tables, in the far east corner. Please.'],
    bbcDone: ['bbc', "G1410. I'm saying it to myself. It's a good number."],
    flower: ['flower', "The catnip stick. From your apartment. Then I'll tell you what I've smelled."],
    flowerDone: ['flower', "Don't look at me like that. Nothing happened."],
    // something else is offered
    notThat: ['bbc', "That's not a collar."],
    notNip: ['flower', "That's not catnip. Take it away."],
  },
  // coming near the bush the collar is in
  collarNear: "Something red is caught in the bush ahead. There's dog all over this corner of the garden.",
  collar: {
    put: [
      ['', "The collar goes down at BBC's feet. It's red, with a gold tag, and it's been well chewed."],
      ['bbc', "MINE. That's mine. Oh, that's mine."],
      ['', 'He picks it up in his teeth, carries it to the glass, and drops it where the guard can see.'],
    ],
    guard: [
      ['guard', 'What have you got there? Give it here. ...Hm.'],
      ['guard', 'G1410. So you do live here. In you come, then.'],
      ['guard', 'The old lady on fourteen. She has rung down six times today about a cat with a red collar, and I told her there was no such cat here.'],
      ['', "The guard buckles it on. BBC stands very still for it, like a cat who's been dressed before."],
    ],
    after: [
      ['bbc', "Not yet. I'm not going up until you two are in. I said I'd help, and I will."],
    ],
  },
  catnip: {
    put: [
      ['', 'The catnip stick goes down in front of Flower. She looks at it. She looks away. She looks at it.'],
      ['flower', 'Turn around. Both of you.'],
      ['', "Behind them there's a noise like a much smaller, much sillier cat. It goes on for some time."],
      ['flower', 'You may turn back. Nothing happened.'],
      ['orca', "There's catnip on your chin."],
      ['flower', 'Nothing HAPPENED.'],
    ],
    told: [
      ['flower', "Now. Do you know what I've smelled from my balcony? Dog food. Sacks of it."],
      ['flower', "The smell comes from the balcony under mine. It's the thin human's balcony, the one with the purple scarf."],
      ['flower', "She doesn't have a dog. But she brings all that dog food up with someone else, after dark."],
      ['shark', 'Dog food, but no dog.'],
      ['orca', "Whose dogs is she feeding?"],
    ],
  },
  // both favours done: Flower's plan
  plan: [
    ['bbc', "Now, getting you in. That guard won't let a stray through that door, whoever asks."],
    ['flower', 'I have thought of something. Do try to keep up.'],
    ['flower', "My human comes down every afternoon, between four and five, for a box. It's cat food. She has it delivered."],
    ['flower', "She feeds the strays of the garden with it. I've told her what I think of that."],
    ['orca', "Wait. The plate behind the cafe? That's HER?"],
    ['flower', "Don't make me sorry I spoke."],
    ['flower', "She won't carry a stray upstairs. She'll carry a box."],
    ['bbc', "Flower and I keep her busy. I'm very good at ankles. You two get into the box."],
    ['shark', "And when we're up there?"],
    ['flower', "Her balcony is right under mine. What you do about it isn't my business."],
  ],

  // ------------------------------------------------------------------- wait
  wait: {
    bbc: ['bbc', 'Between four and five. When she opens the box, I do the ankles and you do the box.'],
    flower: ['flower', "Between four and five. She's never late. Nap, if you must."],
    early: "Flower yawns. Her human isn't down yet: she comes between 4 and 5 in the afternoon.",
    // (after dark, and before they are let out in the morning: nobody on the step)
    night: "Garnet's step is empty. BBC and Flower are indoors for the night. They'll be back out in the morning.",
    missed: [
      ['flower', "You've missed her. She came down at four, as she does every day."],
      ['flower', 'Come back tomorrow, between four and five. And do be on time.'],
    ],
    // walking into the box before she is down
    box: 'A box, taped shut, with a picture of a cat on it. It smells like very good cans.',
    friend: "{n} goes back to Mamacat's box. There's room in that box for two, at the most.",
  },
  // she comes down: the box, and up
  box: {
    open: [
      ['', "Four o'clock. The doors slide open, and a woman in a dark gray dress comes out to the box on the sidewalk."],
      ['owner', 'There you are. Right on time. Let me see what they have sent this week.'],
      ['', 'She cuts the tape and folds the flaps back.'],
    ],
    ankles: [
      ['flower', 'Now.'],
      ['bbc', 'MRROOOW.'],
      ['owner', "Flower! What are you doing down here? And you, big guy. Where have you been? Your owner has been asking around."],
      ['', 'BBC goes around her ankles one way, and Flower the other. She has her back to the box.'],
    ],
    inIt: [
      ['', 'Two cats will fit in one box of cat food, if neither of them breathes out.'],
    ],
    lift: [
      ['owner', 'Come on, you two. Upstairs. ...Now then.'],
      ['owner', 'Oof. This one is heavy today.'],
    ],
    dark: [
      ['', 'An elevator, going up for a long time. A hallway. A key in a lock.'],
    ],
  },

  // ---------------------------------------------------------------- balcony
  // (the picture of Garnet's balconies from Act 2's balcony night, by day: BBC's above, Flower's with
  // the pair on it, and under hers the one with the scarf on its rail)
  balcony: {
    open: [
      ['', "The box is put down by a glass door. The door slides open for Flower. Two cats who aren't Flower go out with her, low and fast."],
      ['flower', "This is my balcony. You may stand on it. Don't touch anything."],
    ],
    bbc: [
      ['', "The next balcony along is BBC's. He's back on it, brushed flat, with his collar on straight."],
      ['bbc', 'My human cried when she saw me. It was embarrassing.'],
      ['orca', 'You liked it.'],
      ['bbc', "I didn't say that I didn't."],
    ],
    hers: [
      ['', 'The balcony under Flower\'s is one floor down, and stands out a little further than hers.'],
      ['', 'A purple scarf hangs over its rail. Sacks are stacked against the wall. The door stands open.'],
      ['flower', "That's hers. She leaves the door open to let the smell out. It doesn't go."],
    ],
    edge: [
      ['', "Shark looks over the rail. It's one floor down to her balcony. Past it, the garden is a long way down, and very small."],
      ['shark', "House cats don't jump off balconies."],
      ['orca', "You were a stray last week. Strays jump."],
    ],
    orcaOver: [
      ['orca', "There. Nothing to it. Don't look down."],
    ],
    // (black, and then her balcony)
    sharkOver: [
      ['', "He jumps. For a moment there's nothing under him at all. Then there's her balcony."],
      ['shark', '...Strays jump.'],
      ['orca', "Wait. Look up. That's too high to jump back."],
      ['shark', "Then we go out by her front door. We've done it before."],
    ],
  },
  // walking into the wall they came down, on her balcony
  noWayUp: "{c} looks up. Flower's rail is a whole floor above, and no cat jumps that high. The way out is her front door.",

  // ------------------------------------------------------------------- flat
  flat: {
    // the first steps indoors
    look: [
      ['shark', 'No rug. No curtains worth climbing. Nobody has ever knocked anything off anything in here.'],
      ['orca', 'It smells sad.'],
    ],
    coat: [
      ['', 'One door of the wardrobe hangs open. Just inside it is a long dark coat, still damp at the hem.'],
      ['orca', 'Smells like dogs. Lots of dogs. All different.'],
      ['shark', "Like the river too. And like the man with the golf club. From my first night."],
      ['orca', 'The one who hit you.'],
      ['shark', "I also smell that boat at the dock, when we went out there for the sock."],
      ['orca', "So she's been on that boat. With him and the dogs?"],
    ],
    map: [
      ['', 'A board on a stand, by her front door. Pinned to it is a drawing of the garden from above: the river, the lawn, the road, both buildings.'],
      ['shark', "It's the garden, the way it looks from our balcony."],
      ['', 'There are red crosses on it: at the BBQ shed, at the playground, in the bushes by the road, at the humming box by Amber. A red line runs from the dock onto the lawn.'],
      ['orca', 'The shed. The playground. The box. Every cross is where one of us sleeps.'],
      ['shark', 'And the line starts at the river. At the dock, where the boat is.'],
      ['', 'A whistle hangs from one corner of the board, on a bright green string.'],
      ['orca', 'Cheetos was right. The one in the green shirt whistles, and the dogs go where he points.'],
    ],
    sacks: [
      ['', 'Sacks of dog food, stacked up the wall. Above them is a row of hooks, and a leash on every hook.'],
      ['orca', "Twelve leashes. And I'm pretty sure no dog has ever been in here."],
      ['shark', "All that food, but most of it is unopened. And not one bowl?"],
    ],
    // all three found
    sum: [
      ['shark', "That coat smells like the golf club man. She has to know him."],
      ['orca', "And she was with the green shirt man too. I think they all know each other."],
      ['shark', "And they all want to get rid of every cat in this garden."],
      ['orca', "Dogs, in through the river, straight to every bush with a cat in it."],
      ['orca', "We know enough. Let's go, before she comes back."],
    ],
    // her front door, before all three are found
    notYet: "{c} sniffs at the front door. Not yet: they came to find out what she's doing with the dogs. There are three things to find in here.",
    // each clue, looked at again
    again: {
      clueCoat: 'The coat in her wardrobe: it smells like dogs, the river, and the man with the golf club.',
      clueMap: 'The drawing of the garden by her front door: a red cross wherever a cat sleeps, a red line from the dock, and a whistle on a green string.',
      clueSacks: 'Sacks of dog food, and twelve leashes on twelve hooks.',
    },
  },
  // she comes home
  home: {
    smell: [
      ['orca', "What's that terrible smell?"],
      ['shark', "It's on the other side of the door. Is it getting stronger?"],
    ],
    enter: [
      ['', 'The door opens. Purple Scarf, with a big bag of durians in one hand and her phone at her ear.'],
      ['l', "...No, back to the boat. All of them. These dogs are not getting the job done."],
      ['l', "They chase and bark, but the moment a cat hisses they just run away. They're useless."],
      ['l', 'He said he had others. Hungrier, meaner ones. Tell him to bring those ones tonight. Same way. Yes, the river, after ten.'],
      ['l', "And tell him he'd better get it right this time."],
      ['', 'She pushes the door shut with her heel. Then she sees two cats on her floor.'],
      ['l', 'CATS? In MY apartment?'],
    ],
    plan: [
      ['shark', "The door. I'll get the handle. You keep her busy."],
      ['orca', 'ME?'],
      ['shark', "You kick harder. And you're too skinny to push the handle down."],
    ],
  },
  // Orca alone against her, for four rounds
  durian: {
    intro: [
      'Purple Scarf is home, with a big bag of durians. {S} has a paw on the door handle.',
      '{O} has to keep her busy, alone, until the door is open: four rounds.',
    ],
    escaped: 'The handle moves. The front door swings open!',
    // the fight again, after a game is loaded in the middle of it
    again: [
      ['', 'Purple Scarf is between Orca and the door. Shark has a paw on the handle.'],
    ],
  },
  escape: {
    now: [
      ['shark', 'NOW!'],
    ],
    shout: [
      ['l', 'COME BACK HERE!'],
    ],
    dark: [
      ['', 'Out of her door. Along the hallway. Down flight after flight of stairs, and across a lobby with a very shiny floor.'],
    ],
    guard: [
      ['guard', 'Two more? How many of you live here?'],
    ],
    out: [
      ['', "The doors slide shut behind them. They're outside Garnet again, on the sidewalk, both in one piece. There are no dogs in sight."],
      ['orca', "They've already pulled the dogs back to the boat. All of them. They're gone."],
      ['shark', 'Not for long. And the next ones will be worse. We have to tell somebody.'],
    ],
  },

  // -------------------------------------------------- the first time home
  // the first time the pair are back in their own flat (the plan's draft, as it stands)
  firstHome: [
    ['', 'The apartment. The robot vacuum is back on its dock, turned to face the wall. Two bowls are full by the window, and the front door has been left open behind them.'],
    ['trang', 'You came back.'],
    ['hung', 'Of course they came back, dummy. This is where the food is.'],
    ['trang', "That's not why."],
    ['orca', 'They left the door open.'],
    ['shark', "I said we'd come back."],
    ['orca', 'You said it was ours.'],
    ['shark', 'It is.'],
  ],
};
