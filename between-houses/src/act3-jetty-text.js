// Every word of Act 3, part "jetty": home again with news that nobody
// understands, the one meow that brings every friend to the door, the long way
// round an empty garden, the three on the jetty, and what comes after. The
// script that plays them is src/act3-jetty.js.
//
// A scene is a list of lines, each [who, words]: '' is the narrator; 'shark'
// and 'orca'; 'stripes' and 'polka' (in the flat and in the garden alike); the
// garden's cats by their ids ('cheetos', 'socks', 'mama', 'scar', 'thanos',
// 'baby'), 'bbc' and 'flower'; 'club' (Golf Club), 'green' (Green Shirt), 'l'
// (Purple Scarf); 'nb0' and 'nb1' (two of the neighbours). A caption is a line
// at the bottom of the screen with no name on it ({c} is whoever leads, {o}
// the other cat).
//
// Stripes and Polka never use each other's names: each calls the other "dummy".
export const A3 = {
  names: { club: 'Golf Club', green: 'Green Shirt', nb: ['Man from Amber', 'Woman from Garnet', 'Neighbor', 'Neighbor', 'Neighbor'], owner: "Flower's Human", son: 'Lookalike' },
  goals: {
    wait: 'Wait for the boat. It comes in after dark, between 10 PM and 2 AM: leave by the front door then. (Hold Space or ✕ to nap.)',
    meow: 'Meow (Z or ▢) to call your friends.',
    pick: 'Pick one friend for the dock. Walk up to one and press Space or ✕ to see what they can do.',
    jetty: 'To the dock, where the boat is.',
    round: 'To the dock, the long way around.',
  },

  // ---- regroup (straight after the flat, the goal is Garnet's: go home and tell them)
  // in the pair's own flat: they try. It comes out as meows.
  tell: {
    in: ['', 'Stripes and Polka are on their feet before the front door has swung shut.'],
    try: [
      ['shark', "The man with the golf club! He knows the purple scarf woman! And the green shirt man! They're behind the dogs!"],
      ['orca', "He brings them! She feeds them! Then he sends them after us! The first dogs weren't good enough. So they're bringing worse ones tonight!"],
      ['', 'What Stripes and Polka hear is this: meow. Mrrow. Meow, meow. Me-eow. MEOW.'],
    ],
    // (the second time they are understood wrongly: on the balcony night it was taken for fear)
    heard: [
      ['polka', "Is something wrong? Listen to them, dummy."],
      ['stripes', "Is it the dogs downstairs again? Show me. But... I don't hear any barking."],
      ['stripes', "Maybe you're hungry? Tell you what, I'll give you some extra kibble, yeah? Just this one time."],
    ],
    machine: ['', 'The kibble machine rattles, twice. Stripes looks pleased with himself.'],
    alone: [
      ['orca', "They don't understand. ...It's not the dogs. It's the humans behind them."],
      ['shark', "We're on our own."],
      ['orca', "Then we'll do it ourselves. Together."],
      ['shark', 'Together. ...But eat first.'],
    ],
    ate: ['', 'They eat every piece.'],
    // (what is left of the day is theirs: the flat, a nap, and the front door when it is time)
    wait: [
      ['shark', 'The boat comes in after ten, she said. When nobody is around.'],
      ['orca', "Then that's when we go down. Not before. And we don't come back up until it's done."],
    ],
  },
  // the front door, once they know when the boat comes
  door: {
    notYet: [
      '{c} looks at the front door. Not yet: the boat comes in after dark, between 10 PM and 2 AM.',
      'Not time yet. The boat comes in between 10 PM and 2 AM. {c} could nap until then.',
    ],
    warn: "This is the point of no return. Once Shark and Orca go down tonight, they can't come back up to the apartment until the villains are dealt with. Go down now?",
    go: 'Go down',
    stay: 'Not yet',
    // Amber's doors, from outside, on the last night
    noBack: "{c} looks back at Amber's doors. Not until it's done.",
  },
  // down in the garden, on the last night: the clock has stopped
  down: [
    ['', 'Night. Nothing is moving. No cars on the road, nobody on the sidewalk, not a cat or a dog to be seen.'],
    ['shark', 'Three humans, and a boat full of dogs. And only two of us.'],
    ['orca', "We're going to need help. But how?"],
    ['shark', "Let's call. I think they'll come."],
  ],

  // ---- call
  // a meow in the garden that is nowhere near the doors
  far: 'Nobody answers. The others are by Mamacat\'s box: call them from outside Amber\'s doors.',
  // walked up to before they have been called
  waiting: {
    cheetos: ["Cheetos is trying to sit still. He's not very good at it."],
    socks: ["Socks is staring at something across the road."],
    mama: ['Mamacat has one eye on the box and one on the sidewalk.'],
    scar: ['Scar is sitting very straight, a long way from her shed. She nods at {c}.'],
    baby: ["Babycat has been told to stay in the box. He's mostly in the box."],
  },
  line: {
    meow: ['', 'Shark lifts his head, and meows. Once. It carries along the empty sidewalk, and over the road.'],
    cheetos: ['cheetos', "Me first! I was first. Is it the dogs again? Tell me it's not the dogs again."],
    socks: ['socks', "You called. I came."],
    mama: ['mama', "I still owe you. The small ones are in the box, and I told them to stay there."],
    scar: ['scar', 'House cats. To what do I owe the pleasure?'],
    bbc: [
      ['bbc', "I'll help, if you want me."],
      ['bbc', "Flower can't. She's grounded. Her human caught her with the catnip stick."],
    ],
    limp: ['', 'And then something big comes over the crosswalk, hobbling on three good legs.'],
    thanos: [
      ['thanos', 'I was just passing by.'],
      ['orca', 'What happened to your leg?'],
      ['thanos', 'Nothing happened to my leg.'],
    ],
    // (as on the balcony night; and in the opening he called three times, and only the rain answered)
    once: [
      ['', "He didn't have to call twice."],
      ['', 'Every friend the two of them have made, in a line.'],
    ],
    plan: [
      ['shark', "This is it. There are three bad humans and a boat full of dogs at the river. New dogs, much more dangerous than the old ones. We're going to stop the humans before any dog comes back out again."],
    ],
    // what the cats know about the three, said before anybody is picked: what to watch out for, and no more
    foes: [
      ['shark', "There is a man with a golf club. He's slow to wind it up. But when it comes down, it comes down hard on everybody at once, and it doesn't miss. One swing knocked me out last time."],
      ['orca', "The purple scarf woman throws durians. One got me earlier: it stinks, it sticks, and it keeps on hurting long after it lands. Then she eats one, and gets her strength back."],
      ['cheetos', "And the green shirt man launches hard little balls at everybody! They don't hurt much. But after one hits you, you're too spooked to do anything clever."],
      ['thanos', "Hm. Humans. Humans don't get scared. I've tried."],
    ],
    plan2: [
      ['orca', "Here's the plan. One of you comes with us. Only one. The rest of you have two jobs here."],
      ['shark', "Somebody stays with the kittens. They're not to be left alone tonight."],
      ['orca', 'And the others go get the humans, the good ones. Make a noise at every door until they come out, and bring them to the river. They may not understand. But maybe they will follow.'],
    ],
  },

  // ---- pick
  pick: {
    yes: 'Come with us',
    no: 'Not yet',
    stay: 'Stay with us',
    wait: 'Wait at the doors',
    // what each says when walked up to in the line
    ask: {
      cheetos: "Me? Pick me. I'm fast, and I've been practicing ever since the tree.",
      socks: "I've done the road. I can do the river.",
      mama: "I've fought for one kitten. I can fight for a garden full of them.",
      scar: "I limp. But I also saw what that man did to you, that night, and I'd like a word with him.",
      thanos: "I'm not hurt. Don't look at my leg.",
      bbc: "That fight on my step was my first. This would be my second. ...I'm coming anyway. Don't let me think about it.",
    },
    // said before Thanos's own line, so that the player knows what picking him means
    thanosHurt: "Thanos is hurt, whatever he says: the dogs got him. He'd start the fight on two-thirds of his HP.",
    // the one who is picked
    joins: {
      cheetos: 'Cheetos bounces twice on the spot, and falls in behind them.',
      socks: "Socks comes along. She no longer seems afraid of crossing the road.",
      mama: 'Mamacat gives the box one last look, and comes.',
      scar: "Scar gets up, stiffly, and comes. She doesn't look back at the sidewalk.",
      thanos: 'Thanos comes along, a step behind, limping as little as he can.',
      bbc: 'BBC falls in behind them, with the tag on his collar shining.',
    },
    // walked up to again while tagging along
    along: {
      cheetos: 'Are we there? Is that it? Are we there now?',
      socks: "I'm with you. Let's finish this.",
      mama: "Keep walking. I'm right behind you.",
      scar: "Go on. I'll keep up.",
      thanos: "I'm not limping. This is how I walk.",
      bbc: "I've never been this far from my own building.",
    },
    // somebody else is picked, or the friend is sent back: {n} is the one who goes back to the line
    back: '{n} goes back to the doors.',
    // leaving the doors with nobody picked
    notAlone: [
      ['orca', 'Three of them, and only two of us. Not without a friend.'],
      ['shark', 'Back to the line. One of them comes.'],
    ],
    baby: "Babycat has been told to stay in the box. He's mostly in the box.",
  },

  // ---- walk: the garden with nobody in it
  walk: {
    // over the road, the first time
    quiet: [
      ['shark', 'Listen.'],
      ['orca', 'To what?'],
      ['shark', "That's what I mean."],
      ['orca', 'Not a sound. No cats, no barking, no footsteps. Not even a rat.'],
    ],
    barrier: [
      ['orca', "Look. There are still dogs here, in cages. The humans haven't put them all back on the boat yet."],
      ['shark', "These are the dogs they didn't want anymore. And to think it was the same dogs chasing us earlier... I almost don't recognize them."],
      ['orca', "I'm not squeezing past a dog, cage or no cage. Let's find a way around."],
    ],
    // On the way home from Garnet (the stage before the last night), for a pair who wander over to the
    // dock: the dogs are in cages all along it, and the boat is away.
    held: [
      ['', 'The dock. All along it, metal cages with dogs inside every one of them.'],
      ['orca', "That's them. All of them, locked up."],
      ['shark', "And the boat is gone. They must be getting the new ones."],
      ['orca', "These dogs... They're not even barking."],
    ],
    playground: [
      ['', 'The playground. Nobody on the slide. Nobody on the bars.'],
      ['orca', "I've never seen those bars with nobody on them."],
    ],
    shed: [
      ['', 'The BBQ shed. A bag was left out here in the rain once.'],
      ['shark', 'This is where I was left.'],
      ['orca', 'This is where I found you. I said MINE.'],
      ['shark', 'You meant the plate.'],
      ['orca', 'Maybe I meant both.'],
    ],
    boardwalk: [
      ['', "The boardwalk. The river is black. A long way west there's one light on the water: the boat."],
    ],
  },

  // ---- jetty
  jetty: {
    boat: ['', 'The dock. The white boat is tied up along it, low in the water, and full of dogs.'],
    three: ['', 'Three people are standing on it with their heads together. Green Shirt. Purple Scarf. And a man all in white, with a golf club in his hand.'],
    // what the three say to each other, before they see the cats
    huddle: [
      ['l', "They were INSIDE my apartment. Two of them! It's your fault. You and your stupid dogs haven't caught a single cat since they got here."],
      ['green', "MY stupid dogs? HE brought them in. It's not my fault those dogs were useless. You want me to chase and bark at the cats myself?"],
      ['club', "You two shut up. We'll fix it tonight. The last dogs were too soft. But these new ones..."],
      ['club', "They haven't eaten in days. They'll get it done. You keep them hungry enough, they'll do whatever you say."],
      ['green', 'Keep them hungry? Then why did you make me carry all that extra food up to her place?'],
      ['club', "That food is for after. They'll starve until every cat is gone."],
      ['green', '...Is that even legal?'],
      ['club', "They're MY dogs."],
    ],
    // a second try, after the fight was lost: all he has to say
    again: ['club', 'Back for more?'],
    // three boxes on the battle screen before the first turn, on every try (the third at the owner's word: a
    // reminder of what does not work on a human)
    tips: [
      'Green Shirt and Purple Scarf each have a special move that puts a condition on your team: Spooked from his Pickleball, Infected from her Durians.',
      "Golf Club's Golf Swing takes two turns to wind up, then hits everybody, and it can't miss. Hint: Defend right before it lands, or use Shark's Protect. Some friends may also have unique ways to deal with the humans' abilities.",
      "Remember: humans can't be Spooked or Weakened. Intimidate and Charm can't be aimed at them, and Ghost Cat doesn't spook them. Every other condition works on them.",
    ],
    // Golf Club has his say (in the garden, not on the battle screen)
    speech: [
      ['club', "You. I hit you."],
      ['shark', "I'm still here."],
      ['club', "Five years I have hit balls on that lawn. MY lawn. And every evening there are CATS on it."],
      ['club', "Under my feet. In the middle of my swing. Especially YOU. Orange one. You do it on purpose."],
      ['orca', 'Guilty.'],
      ['club', "The idiots in the management office won't get rid of the vermin. And yet they still have the nerve to complain about my golf. Do they know who pays their salaries?"],
      ['club', "No matter. I'll get rid of you myself."],
      ['l', "Why are you talking to them? They're cats."],
      ['green', "They don't understand you."],
      ['club', "They'll understand the dogs."],
      ['orca', "That man sure talks a lot, for somebody who thinks we don't understand what he says."],
    ],
    // the friend who came, last of all
    friend: {
      cheetos: ['cheetos', 'Three of them! I can do three. Probably.'],
      socks: ['socks', "I'm ready."],
      mama: ['mama', 'Get behind me, small ones. ...Sorry. Habit.'],
      scar: ['scar', "That's the man. I never forget a pair of shoes."],
      thanos: ['thanos', "I've fought worse than him on three legs."],
      bbc: ['bbc', "These people are my neighbors? It's so embarrassing."],
    },
    // the fight's own words (see ENCOUNTERS.finale in story.js)
    fight: {
      before: [
        ['shark', "The golf club is mine. If he winds up, I can shield you two: I know how to take that swing now. You two just keep hitting them."],
      ],
      // ...and the friend who came, on what they are there for (a hint, not a recipe)
      plan: {
        cheetos: ['cheetos', "They can't hit what they can't catch! And if one of you needs a breather, I've got energy to spare."],
        socks: ['socks', "I'll be at his ankles. A man can't swing if he can't stand. ...And if one of you goes down, I know a way back up."],
        mama: ['mama', "Then I'll keep you two on your feet. Whatever they throw at you, I've washed worse off a kitten."],
        scar: ['scar', "I fight dirty, house cats. One good scratch on each of them, and then all we have to do is outlast them."],
        thanos: ['thanos', "I don't do clever. I will hit all three of them at once."],
        bbc: ['bbc', "I don't know any tricks. I just shut my eyes and I run at them. ...But it kind of worked on you two?"],
      },
      intro: ['Green Shirt, Golf Club and Purple Scarf stand between the cats and the boat. Behind them the dogs have gone quiet.'],
      won: 'All three of them have had enough. The dock belongs to the cats.',
      lost: "It's too much. The cats scatter into the dark, back the way they came.",
    },
  },
  // the checkpoint: outside Amber's doors again, the line still standing
  lost: [
    ['', 'Outside Amber\'s doors again. Nobody is badly hurt. The line is still standing.'],
    ['orca', 'Again. And think about who comes.'],
  ],

  // ---- won
  won: {
    enough: ['', "Green Shirt and Purple Scarf are out of breath. Golf Club's hands are still clutching the iron."],
    cats: ['club', "CATS! I will NOT be beaten by CATS!"],
    first: ['', 'He winds up, and the golf club comes down where Shark was. This time Shark sees it coming.'],
    second: ['', 'It comes down where Orca was. One little hop and Orca is already behind him.'],
    // the third swing: the cats drop flat, and it goes on into the other two
    third: ['', 'He swings a third time, as hard as he can, all the way around. Shark and Orca drop flat. The club goes over them, right into Green Shirt and Purple Scarf.'],
    ow: [
      ['green', "OW! Watch what you're DOING!"],
      ['l', 'My NECK! You hit my NECK!'],
    ],
    // ...and carries him off his feet
    over: [
      ['', 'The swing was far too big. It pulls Golf Club all the way around after it.'],
      ['', 'His shoe slips on the wet planks. He takes two steps backward to get his balance.'],
      ['', 'There are no planks left behind him.'],
    ],
    splash: [
      ['', 'Golf Club goes over the edge of the dock, backward, and into the river.'],
      ['', "It's not deep there. It's very cold. He comes up spitting, with the club still in his hand."],
    ],
    // the other two go for the cats, and chase them off the jetty
    chase: [
      ['green', 'This is YOUR fault. Get them!'],
      ['', 'Green Shirt and Purple Scarf come at the cats. The cats run: off the dock, and east along the boardwalk.'],
    ],
    // ...and stop short: there are people on the boardwalk
    crowd: [
      ['', "They don't chase them far. There are already people on the boardwalk. A lot of people, coming from the east end."],
      ['', 'In front of the people are cats. The others have done it. They made a noise at every door until somebody followed them.'],
    ],
    // nobody on the boardwalk knows what they are looking at; the two who were chasing back off to the jetty
    confused: [
      ['nb0', "What's going on out here? A cat sat outside my door and screamed until I put my shoes on."],
      ['nb1', "Same. I thought she was in heat. I nearly threw a slipper at her."],
      ['nb1', "...Hold on. Isn't that the scarf lady? Why is she chasing cats in the middle of the night?"],
      ['', 'Green Shirt and Purple Scarf look at all those faces and stop. Then they back away, fast.'],
    ],
    // Orca sees Stripes and Polka among them
    spots: [
      ['', "Nobody on the boardwalk knows what they're looking at. But Orca has seen two faces he knows."],
      ['', "He's never asked a human for anything. Not once in his life. But..."],
    ],
    // Orca calls Stripes and Polka over, and this time they understand
    // before Orca calls: the last time they were told, and heard "hungry"; this time he asks
    ask: [
      ['shark', "What are you doing, Orca? They won't understand what you're saying."],
      ['orca', "They will. This time I'm really asking."],
    ],
    call: ['', 'Orca stares at Stripes and Polka and makes a decision. He meows. Once. Then he walks back toward the dock, looking back over his shoulder at his humans every few seconds.'],
    follow: [
      ['stripes', "Does Orca want us to follow? He's never asked us for anything."],
      ['polka', 'Then we follow him. Come on, dummy.'],
    ],
    lead: ['', 'The cats go first. Stripes and Polka go after the cats, and everybody else after them onto the dock.'],
    found: [
      ['polka', 'Look at the boat.'],
      ['stripes', "Dogs. All over the boat. I think there are some in cages over here too."],
      ['nb1', "Are those the same dogs that have been roaming the garden?"],
      ['nb0', "Huh. So THAT is how they got in! No security guards on the dock."],
    ],
    // on the jetty, once everybody is out on it. Flower has come down too, with her human
    // (and it is her human who has something to say)
    flower: [
      ['owner', "Oh. Look! In the water. Of course it's him!"],
      ['nb0', "Is that the guy from the building group chat?"],
      ['owner', "Who else? Every evening, the same drunken rant about cats. Said he'd throw all the cats into the river himself if he had to."],
      ['nb0', "Kind of funny how it's him in the river now. I never liked that guy."],
      ['owner', "Did you know one time I called him out and he said he'd meet me downstairs with his golf club?"],
      ['orca', "Flower? I thought you were grounded."],
      ['flower', "I'm supervised. It's not the same thing."],
    ],
    neighbours: [
      ['nb1', "You three. What in the world were you thinking? Smuggling dogs into the garden like that. People could have been hurt!"],
      ['nb0', "She's right. I haven't let my son downstairs since Tuesday. He was crying at the elevator! Somebody needs to report all this."],
    ],
    film: ['', "The residents' phones come up, one after another, until the whole dock is lit: the boat, the dogs, and three neighbors with nothing to say."],
    // (after the screen has gone black: one sentence to a box)
    after: [
      ['', 'By breakfast, videos of Golf Club, Purple Scarf and Green Shirt are all over the building group chat.'],
      ['', "Management can't make anyone leave the buildings. Neither can the neighbors. But nobody holds the elevator for them anymore, and nobody says good morning."],
      ['', 'Three moving trucks come to Amber and Garnet by the end of the month. Nobody waves when they leave.'],
      ['', 'The garden goes back to the nice humans, and the cats who live in it.'],
      ['', 'And to the two cats who live above it.'],
      ['', 'As for the dogs...'],
    ],
    // (the vet's, as a picture, with a dog on the table: they were never bad dogs. Flower's human has
    // driven them over, with Stripes and Polka: the three are friends since the jetty. Nobody here is going
    // to keep a dog, and Polka is scared of them; what they hope is that each finds a home, as the cats did.)
    vet: [
      ['', "The vet's, the next morning. Flower's human has a car, and she drives: Stripes and Polka beside her, and two dogs in the back. Sixteen dogs is eight trips."],
      ['vet', "Look at these ribs. I can count every one."],
      ['owner', "But I heard there were sacks and sacks of dog food in that woman's apartment."],
      ['vet', "Then somebody decided to keep it from them. Starve a dog, hold it in a cage, shout at it all day. It'll go after anything that moves."],
      ['polka', "That sounds terrifying. You know what, I'm staying right over here. I've been scared of dogs all my life."],
      ['vet', "They're more scared of you than you are of them. These aren't bad dogs. Look..."],
      ['', "The dog on the table licks the vet's hand. Then, for some time, the whole arm."],
      ['vet', "This one has been trying to get my watch off for ten minutes. Just a few weeks of food and quiet, and you'll have sixteen very nice dogs."],
      ['vet', "I know a shelter that can take these dogs in. They could be great pets too, you know."],
      ['owner', "Don't look at me. Flower would never speak to me again."],
      ['stripes', "Well... We're cat people. Aren't we?"],
      ['polka', "We are. ...But I hope these dogs all find somebody. People who choose them for them, not for what they can do."],
      ['polka', 'Like how we chose our two.'],
      ['stripes', 'I think our two chose us.'],
    ],
  },

  // ---- after: free roaming, for good
};
