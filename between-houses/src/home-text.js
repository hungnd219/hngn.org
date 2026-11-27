// Every word of Act 2 ("House cats"): the first night in the flat, the
// things to try over two days, the balcony night, and the robot vacuum at the door. The
// script that plays them is src/home.js.
//
// A scene is a list of lines, each [who, words]: '' is the narrator, and the
// others are 'shark', 'orca', 'hung', 'trang', 'bbc' and 'flower'. A caption
// is a line at the bottom of the screen with no name on it ({c} is whoever
// leads, {o} the other cat). A tip goes in a green TIP box: it names keys the
// way the game does, so that they are picked out by themselves.
//
// Hưng and Trang never use each other's names: each calls the other "dummy".
export const HOME = {
  // the goal box, at each stage of the act (wake is the goal of Act 0, on purpose)
  goals: {
    escape: 'Escape.',
    food: 'Find the food.',
    explore: 'Explore the apartment. Five things to try before 10 PM: hold C or △ for the list.',
    eat2: 'Eat first. Breakfast is in the kibble machine.',
    explore2: 'The second day. Five new things to try before 10 PM: hold C or △ for the list.',
    bed: 'Sleep where the humans sleep: climb onto the big bed in the master bedroom.',
    balcony: 'Something is yowling outside. Go out onto the balcony.',
    wake: 'Look for your humans.', // (the opening's first goal, word for word: see act0.goalSearch in game-text.js)
    kibble: "Shark wants to go down. Orca doesn't. Breakfast is in the kibble machine.",
    robot: 'Get past the robot vacuum, at the front door.',
    learn: "Find a way to beat the robot vacuum. Hint: Watch what the humans do in the evening, after they've put your dinner down. (Hold Space or ✕ to nap until then.)",
    waitBed: "Wait for the humans to go to bed. (Hold Space or ✕ to nap until then.) Then the robot vacuum, at the front door.",
    rematch: 'Back to the front door.',
  },
  // the names in Mission select on the title menu
  missions: { apartment: 'The Apartment', day2: 'The Apartment, Day 2', night: 'One Whole Cat' },
  // when only one of them may lead, and the swap button is pressed
  noSwap: '{c} wants to lead.',

  // ------------------------------------------------------------ homecoming
  // the first night: the inner laundry room, the bags opened, and the two humans leaving them to it
  arrive: [
    ['', 'Night. A small room that smells like soap. The bags are put down on the floor, gently, and unzipped.'],
    ['trang', "There. Out you come, when you're ready. Nobody is going to pull you."],
    ['hung', 'Water is in the bowl. The litter box is through that door.'],
    ['hung', 'Breakfast first thing in the morning. The vet said to let your stomachs settle tonight.'],
    ['trang', 'This is your home now, Shark. Orca. All of it. Feel at home.'],
    ['hung', "Come on, dummy. Let them be. They'll come out when they want to."],
    ['trang', 'Good night, you two.'],
    ['', 'A light goes off. Footsteps go away through the apartment, and a door closes softly, a long way off.'],
  ],
  // the two of them alone in the laundry; it ends with Orca making for the door
  arriveAlone: [
    ['orca', 'Bags. They put us in BAGS. Do you know what goes in bags? Food goes in bags.'],
    ['shark', "It's called a laundry room. That white box washes their clothes. I know this smell."],
    ['orca', "First the bright room, and now this. They're fattening us. They're going to eat us, Shark."],
    ['shark', "Nobody is going to eat us. It's a house. I had one."],
    ['shark', '...I HAD one.'],
    ['orca', "Walls. A roof. One way out. I've seen a trap before."],
    ['orca', "A very clever trap. I'm not staying in it."],
    ['orca', "There was a big door where they carried us in. I'm going. Come, or don't come."],
  ],
  // Orca has reached the foyer: the robot vacuum comes off its dock at him (then it herds him back)
  robotMeets: [
    ['', 'By the big door, something flat and round is sitting against the wall. It has one small green light.'],
    ['', 'The light turns red. The thing slides away from the wall, humming, and comes straight for Orca.'],
    ['orca', 'What IS that? It has no legs. It has no FACE.'],
    ['orca', 'Hsss! Get back! I said GET BACK!'],
    ['', "It doesn't get back. It doesn't even slow down."],
  ],
  // the first night has run out (5 AM) and Orca has not found the door: he is taken to it
  lateEscape: "It's nearly morning. Orca stops looking around, and follows the smell of outside to the big door.",
  // back in the laundry, after being herded
  herded: [
    ['orca', "It has no legs. It has no smell. I hissed at it, and it didn't blink."],
    ['shark', "It's a robot vacuum. It eats dust. And tails, if you leave one lying around."],
    ['orca', 'You KNEW about that thing?'],
    ['shark', 'I lived with one before. That one never chased anybody. This one sits by the door like a guard.'],
    ['orca', "Fine. I'll deal with it tomorrow. When I've slept."],
    ['orca', "And we sleep in here. I'm not shutting my eyes out there, with all that open space."],
    ['shark', 'In here, then. Back to back.'],
    ['', 'They sleep the way they slept in the bush: back to back, with one ear each for the door.'],
  ],
  // the next morning, still in the laundry: the kibble machine, and two empty stomachs
  morning: [
    ['', 'Morning. Somewhere across the apartment a machine whirs, and something small and dry rattles into a dish.'],
    ['shark', "That's a kibble machine. I know that sound exactly."],
    ['orca', "It's bait. That's what you put in a trap. You put the good thing in the middle."],
    ['', "Orca's stomach answers for him. It's been a long time since the last plate."],
    ['orca', '...I can smell it from here, though.'],
    ['shark', 'Eat first. We can be afraid afterward. Stay behind me.'],
  ],
  // nine o'clock, and Shark has not found the kibble: he is taken to it
  lateFood: "Shark's stomach won't wait any longer. He follows his nose across the apartment to the kibble machine.",
  // at the kibble machine: the two of them eat
  firstMeal: [
    ['', "Two heaps of kibble, one each. Shark savors his breakfast."],
    ['', 'Orca eats with one eye on every door, as fast as he can. Just in case somebody comes to take it away.'],
    ['', 'Nobody takes it away.'],
    ['', 'Orca carries three pieces off anyway, and pushes them under the sofa. For later. Just in case.'],
  ],
  // ...and then the two humans come in, and sit down on the floor
  humansCome: [
    ['', 'Two humans come in from the hallway, slowly. They stop a long way off.'],
    ['', 'Then they sit down on the floor, both of them, and do nothing at all.'],
    ['orca', "They're here. Shark. They're HERE. Don't move."],
    ['trang', "Good morning, you two. We're only going to sit. That's all."],
    ['hung', "Finish your breakfast. It's yours. And there's something better than kibble coming this evening."],
    ['', "The tall human smells like coffee. Shark's nose goes up before he can stop it."],
    ['', 'Then he remembers a phone hanging up, and he stays where he is, beside Orca.'],
    ['shark', "He smells like mine did. ...He's not mine."],
    ['hung', "No hurry, Shark. We're not going anywhere."],
    ['trang', 'Orca. Nobody is going to make you do anything. Eat.'],
    ['', "Orca goes on eating, with two humans watching. He's never done that before."],
    ['shark', "They sat down. People who mean harm don't sit down."],
    ['orca', "You don't know that. I'm not going near them."],
    ['shark', "Me neither. Not yet. But I'm going to look around this place. Stick together?"],
    ['shark', "Remember: paws on the floor, and claws in. The first day in a house, you're a guest."],
    ['orca', "...I'll go where you go. For now. Not them. You."],
  ],
  // after that scene: the flat is open, and there is a list
  tipExplore: 'The apartment is theirs to explore. There are five things to try today: hold C or △ to see the list. Finish a group of tasks before 10 PM, and both cats get stronger.',
  // the first day, at something that is for the second: up on a table or a curtain; the sofa, the bin, the toilet
  notToday: {
    up: "{S} stays down on the floor. The first day in a house, you're a guest.",
    thing: "{S} leaves it alone. The first day in a house, you're a guest.",
    hungry: "{S} isn't trying anything on an empty stomach. Breakfast is in the kibble machine.",
  },
  // at the door of the master suite, before the night on the big bed
  gate: [
    ['orca', "Are you sure? That's the humans' territory. It smells like them all the way through."],
    ['shark', "It's where they sleep. ...No. Not yet. We leave it."],
  ],
  // the first night, too far along the hallway: that way are the bedrooms
  hallNo: [
    ['orca', "No. Not that way. That's where the humans are. I can smell them."],
  ],
  // on either of the two days, at the robot vacuum or the front door
  doorNo: [
    ['orca', "No. I'm not going near that thing again. It didn't BLINK."],
    ['shark', "Not yet, then. There's a whole apartment to look at first."],
  ],

  // ----------------------------------------------------------- exploring
  // the first time each of the things is done (five on each of the two days): Shark knows houses, Orca does not
  first: {
    wand: [
      ['orca', "Feathers on a stick. Where's the rest of the bird?"],
      ['shark', "There's no bird. You hit it. That's all it does."],
      ['orca', "What's it for?"],
      ['shark', "Nothing. It's not for anything."],
      ['orca', 'Everything I ever chased was dinner. ...Make it move again.'],
    ],
    post: [
      ['shark', 'This one is FOR scratching. They put it here on purpose.'],
      ['orca', 'On purpose. And nobody shouts?'],
      ['shark', 'Nobody shouts.'],
      ['orca', 'They gave us a tree. A small one, indoors, only for claws. What kind of trap is this?'],
    ],
    sofa: [
      ['shark', 'The sofa. This one they do shout about.'],
      ['orca', 'Then why are we doing it?'],
      ['shark', "Because it's the best one. Feel that. It was made for claws, whatever they say."],
      ['orca', '...Oh. Oh, that IS good. Way better than tree bark. Let them shout.'],
    ],
    curtain: [
      ['orca', "It goes up. Like a tree. But it's soft, and it's indoors."],
      ['shark', "Claws in, and climb. Don't look down until you're at the top."],
      ['orca', 'I can see the whole room from up here. Every door. I like it up here.'],
    ],
    knock: [
      ['shark', 'Watch. You put a paw on it. You look at them. And then you push.'],
      ['orca', 'It fell. It just FELL. And then a human came running.'],
      ['shark', 'They always come running.'],
      ['orca', 'And nobody was kicked. They only picked it up again. ...Can we do another one?'],
    ],
    tunnel: [
      ['orca', "A bush with two ends, and nothing living in it. What's it for?"],
      ['shark', 'In at one end, out at the other. As fast as you can.'],
      ['orca', "That wasn't for food. That wasn't for getting away from anything."],
      ['orca', "I did that for nothing at all. I'm going again."],
    ],
    litter: [
      ['orca', 'You went inside it. And then it TURNED. The whole thing turned around with nobody touching it.'],
      ['shark', "It's a litter box. You go in, you dig, you come out. It cleans up after you."],
      ['orca', 'Indoors. They want us to do that indoors? In a round white thing that moves?'],
      ['shark', 'It beats the bougainvillea bush.'],
      ['orca', "...Fine. But you stand outside and keep watch while I'm in there."],
    ],
    wetfood: [
      ['orca', 'Soft. The one in the bright room said soft food, for my gums. They remembered.'],
      ['shark', 'It comes again tomorrow. Every evening, the same.'],
      ['orca', 'Nothing comes again tomorrow.'],
      ['shark', 'This does.'],
      ['orca', "I'm going to watch that bowl tomorrow. If it comes again, I'll think about believing you."],
    ],
    trash: [
      ['orca', 'This egg smells better than anything else in the apartment. Old chicken. Why is it shut?'],
      ['shark', "It's the trash can. Food ends up in there, and then they close the lid on it."],
      ['orca', 'I ate out of trash cans all my life. They never smell this good.'],
      ['shark', "You don't need the trash can. You have a bowl now."],
      ['orca', "...I'm still going to check it every day. In case."],
    ],
    toilet: [
      ['shark', "Don't tell them I showed you this. It's the best water in a house."],
      ['orca', "It's a white chair with a pond in it."],
      ['shark', "Cold, and always full. They leave the lid up for us. They don't know that they do."],
      ['orca', "There's a water fountain out there. Why are we in here again?"],
      ['shark', "This water is better. I can't explain it."],
      ['orca', '...It IS better. Why is it better?'],
    ],
  },
  // the STRONGER box when a group is complete, on the day it belongs to
  gain: {
    play1: "Everything here that's made for a cat, tried! Shark and Orca both gain ATK +1 and AGL +1.",
    care1: 'Fed and clean! Shark gains HP +3 and Orca HP +2.',
    play2: 'Claws, curtains and crimes! Shark and Orca both gain ATK +1 and AGL +1.',
    care2: 'The best smell and the best water in the house! Shark gains HP +3 and Orca HP +2.',
  },
  // The first group finished on the first day: the two humans stop what they are doing and come over.
  // (They pet the cats: Orca for the first time.)
  visit1: [
    ['', "Hưng and Trang stop what they're doing and come over. Slowly."],
    ['trang', "Look at you two. One day, and you've already worked out where everything is. Smart kitties!"],
    ['hung', "They may be smarter than you, dummy. We moved in six months ago and you still don't know which switch turns on the kitchen light."],
    ['', 'A hand comes down, slowly, where Orca can see it the whole way.'],
    ['orca', "It's touching me. Shark. It's touching my HEAD."],
    ['shark', "That's what they do. You push back against it. Try."],
    ['', "Orca doesn't run. He stands very stiff, and allows it."],
    ['trang', "There. That wasn't so bad, was it, Orca?"],
    ['orca', "One. I allowed one. ...It wasn't the worst thing."],
  ],
  // the end of the first day (all five done, or 10 PM): to the guest room
  day1End: [
    ['', "It's dark outside the windows. It's been a full day."],
    ['shark', "That was a full day. I can't feel my legs."],
    ['orca', "You know what? I'm not going back to the laundry room. It smells like the vet in there."],
    ['shark', "There's a room with a bed that nobody is using. Come on."],
  ],
  // ...and up onto the guest bed
  guestBed: [
    ['orca', 'It gives way. The whole thing gives way under my feet. Is it meant to?'],
    ['shark', "It's a bed. That's the point of it."],
    ['orca', "I've slept in bushes, on concrete, and one time in a pipe. Never on anything that gives way."],
    ['orca', "...Don't wake me."],
  ],
  // later that night: the two humans in the doorway of the guest room. They do not come in.
  doorway1: [
    ['', 'Later. Two humans stop in the doorway of the guest room, and come no further.'],
    ['trang', 'Shh. Look. They picked the guest bed.'],
    ['hung', "Last night they wouldn't leave the laundry room."],
    ['trang', 'Look how peaceful they are. As if they had always been here.'],
    ['hung', 'Come away, dummy. Let them sleep.'],
    ['', "One of Orca's ears turns toward the door, and turns back. He doesn't get up."],
  ],
  // the second morning, on the guest bed
  day2Morning: [
    ['', 'Morning. Sun on the guest bed, and the kibble machine whirring somewhere across the apartment.'],
    ['orca', "I slept all night. I didn't wake up once."],
    ['shark', "That's what beds do."],
    ['orca', 'Yesterday you wouldn\'t let me up on anything. "You\'re a guest", you said.'],
    ['shark', "The first day, you're a guest. The second day, you live here."],
    ['orca', "What's the difference?"],
    ['shark', 'Come on. Eat first.'],
  ],
  // the second morning, at the kibble machine: it came again. (Orca and food: three pieces hidden
  // on the first morning, one on the second, none on the third.)
  breakfast2: [
    ['', 'Two heaps of kibble in the tray, one each. The same as yesterday.'],
    ['orca', 'It came again. Nobody even meowed for it.'],
    ['shark', "It comes every morning. Same time. That's what the machine is for."],
    ['orca', "In the garden, a plate that shows up twice is luck. You don't count on luck."],
    ['', 'Orca eats slower than yesterday. He only looks at the doors twice.'],
    ['', 'Then he checks under the sofa. Three pieces, right where he left them. Nobody took those either.'],
    ['orca', "Still there. ...I'll put one more with them. One."],
    ['shark', 'Yesterday it was three.'],
    ['orca', "Yesterday I didn't know about dinner."],
  ],
  tipDay2: "Five new things to try today, and these are the ones that humans don't like so much. Hold C or △ to see the list.",
  // The first group finished on the second day: the two humans come over again. A loving scolding,
  // and Shark on his back.
  visit2: [
    ['', "Hưng and Trang come over. They've seen all of it."],
    ['trang', "Right. Whose idea was it to climb the curtains? Don't both look at the other one."],
    ['hung', "Leave it. Let them explore! Those curtains were cheap anyway."],
    ['trang', 'We have a cat tree, you know.'],
    ['hung', '...Bad kitties. Veeeery bad kitties.'],
    ['', 'He says it the way people say good morning, and puts a hand down.'],
    ['', 'Shark flops over onto his back, and shows him the little tuft of cream-colored fur on his belly.'],
    ['shark', "...That's the spot. ...That's enough of the spot."],
    ['', "Orca doesn't back away. He stays where he is, and the other hand finds his chin."],
    ['orca', "Two. That's two now."],
    ['trang', "They wouldn't be this naughty if they were still afraid of us. Do you think they're starting to feel at home?"],
    ['hung', "I think they already think it's their apartment. We just live in it."],
  ],
  // the end of the second day (all five done, or 10 PM, whichever comes first: it may be any time of day)
  day2End: [
    ['orca', 'I have to lie down. My legs have stopped.'],
    ['shark', 'The bed that gives way?'],
    ['orca', 'The bed that gives way.'],
  ],
  // ...on it
  guestBed2: [
    ['orca', "It's actually not so bad in here. With you."],
    ['shark', "Down there you knew everything, and I knew nothing. Up here it's the other way around."],
  ],
  // late that evening: the doorway again
  doorway2: [
    ['', 'Late in the evening. Two humans stop in the doorway of the guest room again.'],
    ['trang', 'In here again. I thought they might come in with us tonight.'],
    ['hung', "Give them time. ...Why don't we leave our bedroom door open, dummy. In case."],
    ['trang', 'Good night, Shark. Good night, Orca.'],
    ['', 'The footsteps go away along the hallway. A door is left open.'],
  ],
  // the list on the cats' sheet (items: 15 characters at most)
  list: {
    title: 'TO TRY TODAY',
    groups: { play: 'ATK +1 AGL +1', care: 'HP +3 / +2' },
    items: {
      wand: 'Feather wands',
      post: 'Scratching post',
      tunnel: 'Cat tunnel',
      litter: 'Litter-Robot',
      wetfood: 'Wet food (7 PM)',
      sofa: 'Scratch a sofa',
      curtain: 'Climb a curtain',
      knock: 'Knock something',
      trash: 'Trash can',
      toilet: 'Toilet water',
      bed: 'The big bed',
    },
  },
  // looking out of a window, or from the balcony: by day, by night, and after the night of the dogs
  windows: {
    day: [
      '{c} looks down. Far below is the garden, very small. An orange dot is going around and around the monkey bars.',
      '{c} can see the roof of the BBQ shed from here. Somebody is under it. Somebody always is.',
      '{c} watches the road from above. From up here the wheels look slow, and nobody could be hit by them.',
    ],
    night: [
      '{c} looks down at the garden lamps, one pool of light after another. That was home, a few days ago.',
      'Somewhere far below, somebody yowls, and somebody else answers. {c} knows both voices.',
      '{c} watches the dark lawn. Something pale goes from one bush to the next. A ghost, probably.',
    ],
    dogs: [
      "{c} looks down. The lawn is empty. It's never empty.",
      "{c} looks for the orange dot on the monkey bars. It's not there.",
      '{c} listens at the glass. Since that night, every sound from down there sounds like barking.',
    ],
  },

  // ------------------------------------------------------------ midpoint
  // late that night, the humans asleep: Orca is awake, and curious
  lateNight: [
    ['', 'Later still. The apartment is dark and quiet.'],
    ['orca', 'Shark. Are you awake? The humans have stopped moving. Both of them.'],
    ['shark', "They're asleep."],
    ['orca', "Do humans sleep the way we do? I've never seen one asleep. I have only seen them coming at me."],
    ['shark', "Why don't you find out for yourself?"],
    ['orca', '...You come too.'],
  ],
  // on the big bed, beside the two of them
  bedScene: [
    ['', 'The big bed. Two long shapes under one cover, breathing slowly.'],
    ['orca', 'They do it lying flat on their backs. Like dead things. And one of them is making a noise.'],
    ['shark', "That's snoring. Scar says I do it."],
    ['', 'Orca steps onto the silk blanket. One of the shapes moves over, without waking, and leaves a warm space.'],
    ['orca', "She made room. She's asleep, and she made room for me."],
    ['', "He turns around twice, and lies down against a human back. Shark is already asleep on Hưng's feet."],
    ['orca', '...I could get used to this.'],
  ],
  // some time later: a yowl from outside wakes them both
  yowl: [
    ['', 'Some time in the night, a long way down, something yowls.'],
    ['', 'Both cats are awake right away. The humans sleep on.'],
    ['orca', 'That was outside. That sounded like a cat.'],
    ['shark', 'The balcony. Come on.'],
  ],
  // on the balcony: dogs in the garden, old friends, and two house cats across the way (from the
  // sixth line the view goes over to Garnet for Flower and BBC, and comes back for the pair, who
  // know them: the two on the steps of Garnet in Act 1, the day Babycat was lost)
  balconyScene: [
    ['', 'The balcony. Night air, and the garden far below, with its lamps.'],
    ['', 'And barking. A lot of it, from more than one throat, moving across the lawn.'],
    ['orca', "Dogs? There are no dogs in our garden."],
    ['', 'A thin, furious shriek goes up from somewhere near the playground. Then a second voice, lower.'],
    ['shark', "That's Cheetos. And that was Socks!"],
    ['', 'Across the gap is the other building, Garnet. On adjacent balconies, two cats are on the rails watching: a huge black one, and a spotted one. Both have collars.'],
    ['flower', 'Dogs. Loose in the garden again, like last night. How annoying.'],
    ['shark', 'I remember those two. They were on the steps of that building, when we saved Babycat from the snake.'],
    ['orca', "The ones with collars. She \"doesn't talk to strays.\" Only near them."],
    ['orca', 'You! You can see from there. Who are they after? Is anybody hurt?'],
    ['bbc', "Strays, I guess. Who knows? It's not our problem. We're house cats."],
    ['flower', "And so are you, now. I'd go back to bed."],
    ['', 'The two of them drop down off their rails and go back inside.'],
  ],
  // ...and what the pair make of that
  freakOut: [
    ['orca', "How is Cheetos going to defend himself? I've seen sewer rats bigger than that cat."],
    ['shark', "And Scar can't run. Not on that bad leg."],
    ['orca', "What do we do?"],
    ['shark', 'The humans. Humans know things.'],
    ['orca', 'You said that once before. Then you walked up to a man with a club.'],
    ['shark', 'These ones are different.'],
    ['shark', "I'm going to wake them."],
  ],
  // a meow anywhere but by the humans' bed, while they are to be woken
  meowFar: '{c} meows. Nobody stirs. The humans are asleep in the big bedroom, too far away to hear.',
  // a minute of looking, and nobody has meowed
  wakeHint: [['shark', "They're sleeping too deeply. I need to meow to wake them."]],
  // a meow by the bed: this time somebody answers
  woken: [
    ['', 'Shark meows, once, by the side of the bed.'],
    ['hung', "Shark? ...What is it? What's the matter?"],
    ['', "He didn't have to call twice."],
    ['trang', 'Mmh. What time is it? Why is he crying, dummy?'],
    ['', 'Through the open balcony door, the barking comes up from below. Trang pulls the blanket up a little.'],
    ['trang', "Oh. Someone in the group chat mentioned loose dogs in the garden last night. Management has no idea where they're coming from."],
    ['hung', "It's okay, Shark and Orca. Is that what frightened you? It's all right. They're down there, and you're up here. They can't hurt you."],
    ['trang', "...Those poor strays downstairs though. Let's put extra plates out tomorrow. Now go back to sleep."],
    ['hung', 'Come here. Both of you. Up.'],
    ['', "They're gathered up onto the bed, one under each arm. Even Orca. He doesn't fight it."],
  ],
  // the two cats, low, with the humans asleep again
  conflict: [
    ['shark', "Orca. Should we go back down there?"],
    ['orca', "What? But we're SAFE here. I'm safe, for the first time ever. I'm not giving this up. This is MINE!"],
    ['orca', "And why do you even want to go back down there? Isn't this what you wanted? To be a house cat again?"],
    ['shark', "Orca. Scar can't run."],
    ['orca', '...'],
    ['shark', "She fed me when I had nothing. And Cheetos and Socks. They're our friends."],
    ['orca', "..."],
    ['', "Neither of them sleeps much. The barking goes on until it's nearly light."],
  ],
  // the next morning
  morningAfter: 'Morning. The barking has stopped. Down in the garden, nothing moves. Across the apartment, the kibble machine whirs.',
  // that morning, Shark at the robot vacuum or the front door: Orca will not come
  orcaWontGo: [
    ['orca', "No. I'm not coming. That thing is there, and we're safe here."],
    ['shark', 'Orca.'],
    ['orca', 'I said no.'],
  ],

  // ----------------------------------------------------- the robot vacuum
  // at the kibble machine: a yowl from below, and Orca leaves his breakfast
  kibbleYowl: [
    ['', 'Two heaps of kibble in the tray, exactly as there were yesterday, and the day before.'],
    ['orca', "Three mornings in a row. That's not luck anymore. ...I didn't hide any last night."],
    ['shark', 'Eat first?'],
    ['', "From the balcony, far below and very thin: a yowl. One small, shrill voice that doesn't stop."],
    ['shark', 'Cheetos.'],
    ['', "Orca looks at the kibble. He's never in his life walked away from food."],
    ['', 'But he walks away from this one, and leaves it whole.'],
    ['orca', 'Eat second.'],
    ['orca', "We need to help our friends down there. Come on. The door."],
    ['shark', 'What about the robot vacuum?'],
    ['orca', "I said I'd deal with it. I don't need help."],
  ],
  // the first fight with it (in the battle's own text panel): it cannot be won. (Nothing here about the
  // recharge: the first attack on it misses and the next one that could land does, so that the player sees it happen.)
  fight1: {
    intro: [
      'The robot vacuum slides off its dock and parks itself between the cats and the door.',
      'It sees attacks coming, and swerves out of the way of most of them.',
    ],
    timeout: "Not a scratch on the robot vacuum, and it isn't tired. The cats are. It herds them back to the sofa, beeping.",
    lost: 'The robot vacuum herds two flattened cats back to the sofa, beeping.',
  },
  // on the sofa afterwards, and it is four in the afternoon: what it would take
  clues: [
    ['', 'They try again. And again. By four in the afternoon the robot vacuum has herded them back to the sofa eleven times.'],
    ['orca', "All day. I've been hitting that thing since breakfast, and I've hardly laid a claw on it."],
    ['shark', 'It dodges nearly everything. It sees it coming.'],
    ['orca', "And when I DO land one, it's back on its dock at full charge before I can land another."],
    ['orca', "So it has to be ONE kick, big enough to put it on its back. I can't kick that hard."],
    ['shark', 'And a kick that big, it would see coming from a mile away.'],
    ['shark', 'It would have to be looking the other way. It would have to be DISTRACTED.'],
    ['orca', "...I can't do this one by myself."],
    ['shark', "You don't have to. We're a team. You find a way to kick harder, and I'll find a way to make it look at me."],
    ['shark', "The humans do things that we can't. Watch them. There may be something to learn."],
  ],
  // near the sofa in the evening, while the two humans watch TV (once)
  tvNotice: [
    ['orca', "They sit in front of that light box a lot, lately. What's on it?"],
    ['shark', 'Two things. She likes the one with the singing. He likes the one with the grass and ball.'],
    ['orca', 'And they fight over the little stick that changes it.'],
    ['shark', 'The remote. Yes. Sit in front of the light box, and take a good look.'],
  ],
  // ...and how that works
  tvTip: "Sit in front of the TV to watch. The music show is for Shark, and the soccer is for Orca. The cats can't change the channel: only the humans do, every little while. Swap cats with C or △, or wait for the humans.",
  // the TV, while the cats cannot change its channel
  tvLocked: "The remote is in a human hand, and it's staying there. Only the humans can change the channel.",
  // the wrong cat in front of the TV (after what he says about it)
  wrongTip: "The cats can't change the channel. Swap cats with C or △, or wait for the humans to change it.",
  // in front of his own show, after he has learned his move from it
  tvKnown: '{c} has learned all that this show has to teach him.',
  // in front of the TV with nothing on
  tvDay: "Nothing is on. The humans watch TV in the evening, after they've put the cats' dinner down.",
  // the wrong cat for what is on: Shark at the football, Orca at the music show
  wrongShow: {
    shark: [
      ['shark', "People running after a ball. I don't see what there is to learn from that."],
      ['shark', "You look at it, Orca. You're the one who kicks."],
    ],
    orca: [
      ['orca', "It's only noise. Humans, standing still, making noise."],
      ['orca', 'You like noise, Shark. You try it.'],
    ],
  },
  // just before each lesson: the human whose show it is has something to say about it
  showTalk: {
    sing: [
      ['trang', 'The first season of this show was so much better. Nobody in this one can hold a note.'],
      ['hung', 'You say that every week, dummy.'],
    ],
    stretch: [
      ['hung', "Manchester United is playing like garbage. What's our defense doing? That's another penalty conceded!"],
      ['trang', 'You say that every week, dummy.'],
    ],
  },
  // it has got late, and the TV goes off before both moves are learned
  tvOff: [
    ['', "It's late. The TV goes dark, and the two humans get up off the sofa and stretch."],
    ['orca', "They've switched it off."],
    ['shark', 'Then we try again tomorrow night.'],
  ],
  // the evening's wet food, when nobody has been free to bring it by the usual time
  served: 'Two full bowls are put down by the window. Wet food!',
  // before each of the two lessons
  singTip: 'The singer holds a long note. When ♪ appears over the TV, press Z or ▢ to sing along. Do it three times in a row. Stay in front of the TV: walk away, and the lesson stops.',
  stretchTip: 'The players stretch before they kick. When ! appears over the TV, press Z or ▢ to stretch with them. Do it three times in a row. Stay in front of the TV: walk away, and the lesson stops.',
  // during a lesson: after the first, second and third good one; too soon; too late; walking off
  cue: {
    singGood: [
      'Shark sings along. Not bad at all. One.',
      'Shark holds the note. Hưng: "Is he singing along?" Two.',
      'Shark sings the whole line. Trang: "He has better pitch than you, dummy." Three!',
    ],
    stretchGood: [
      'Orca stretches when they stretch: front legs out, back end up. One.',
      "Orca stretches again, longer. Hưng: \"Look. He's warming up with them.\" Two.",
      'Orca stretches until every joint clicks. He feels twice his size. Three!',
    ],
    early: 'Too soon. Wait for the TV. Start again.',
    late: 'Too late. The moment has gone. Start again.',
    left: '{c} wanders off. The lesson can wait.',
    again: 'From the top. Wait for the TV.',
  },
  // the NEW MOVE boxes
  learnSing: "Shark learned SING! He sings at a foe, and it's Distracted: the next attack on it can't miss.",
  learnStretch: "Orca learned BIG STRETCH! From his next turn he's Strengthened: double damage, until he's hit.",
  // straight after Shark's lesson (the last line is the hint for Orca: only if he has not learned his yet)
  afterSing: [
    ['shark', "I've got it. If I sing at something, it has to look at me. It can't help it."],
    ['shark', 'That was her show. Take a look at his, Orca. There may be something in it for you.'],
  ],
  // straight after Orca's (the last line is the hint for Shark: only if he has not learned his yet)
  afterStretch: [
    ['orca', 'They stretch first, and then they kick twice as hard. I can do that. I can feel it.'],
    ['orca', 'That was his show. Hers is the one with the noise. You like noise, Shark. Go look.'],
  ],
  // both moves learned
  bothLearned: [
    ['shark', "Sing, so it's looking at me and not at you."],
    ['orca', 'Big Stretch, so a single kick can knock it out.'],
    ['shark', "Between us that's one whole cat."],
    ['orca', "That's my line."],
    ['shark', "Tonight, when they're asleep. They'd never let us out that door."],
    ['orca', 'Then we wait for the lights to go off.'],
  ],
  // at the robot vacuum with both moves learned, and the humans still up
  robotWait: [['shark', "Not while the humans are up. They'd never let us out that door."]],
  // both of them are in bed
  lightsOut: [['', "The last light goes off in the big bedroom. The apartment is dark, and for now it's all theirs."]],
  // at the robot vacuum before both moves are learned
  robotNotYet: [
    ['shark', 'Not yet. It would only send us back to the sofa. Again.'],
    ['orca', "One way for you to distract it, and one way for me to kick harder. We need both."],
  ],
  // the two humans, swapping what is on
  remote: {
    music: 'Trang takes the remote. Her music show is on.',
    football: 'Hưng takes the remote back. Soccer.',
  },
  // the rematch (in the battle's own text panel)
  fight2: {
    intro: [
      'The robot vacuum slides off its dock and parks itself in the way. This time the cats have a plan.',
      "Big Stretch and Sing first. Then Bunny Kick, while it's Distracted.",
    ],
    won: 'One enormous kick, and the robot vacuum is on its back, wheels spinning. The way is clear.',
  },
  // the robot beaten: the door, a look back, and out
  out: [
    ['', "The robot vacuum lies on its back with its wheels going around. Its light is still red. It doesn't matter."],
    ['shark', "The door has a handle. That's no problem for a cat."],
    ['shark', "I've opened doors before. You just put your weight on it."],
    ['', 'Orca looks back, once: the sofa, the tunnel, two bowls by the window.'],
    ['shark', "Don't worry. We'll come back. It's ours."],
    ['orca', '...MINE.'],
    ['orca', '...Fine. Ours.'],
    ['', 'Shark jumps and puts his weight on the handle. Eleven pounds of tabby cat later, the door finally swings open.'],
  ],
  // the last line of the act
};
