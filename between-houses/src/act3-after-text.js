// The epilogue's words: what comes after the jetty, and everything that is new
// in the flat and the garden once the story is told (see act3-after.js).
//
// A line is [who, text]: '' the narrator; 'shark', 'orca'; 'hung', 'trang';
// the garden's cats by their ids ('cheetos', 'socks', 'mama', 'baby', 'scar',
// 'thanos', 'bbc', 'flower'); 'owner' (Flower's human) and 'vet'.
// {c} is the cat who is doing it and {o} the other one, as everywhere.
export const A3 = {
  // Cheetos's girl and her mother, out by the cafe after school
  cafe: {
    mumName: 'Woman from Garnet',
    kidName: 'Little girl',
    mum: [
      'The woman from Garnet has a coffee from the cafe, and one eye on the playground.',
      'The woman from Garnet looks at {c}, and smiles. On the table by her cup is a cat carrier, still in its box.',
    ],
    kid: [
      'The little girl waves at {c}. "Have you seen Cheetos? He\'s orange. He\'s my friend."',
      'The little girl: "Mommy said maybe. Maybe means yes."',
    ],
  },
  goals: {
    // the hint that there is more to see
    after: "The story is told. But there's still more to explore: the apartment and the garden are both yours to roam. Go and see friends downstairs with news, bring them presents, meet somebody by the BBQ shed in the evenings, or try new toys upstairs.",
  },
  // on a black screen, after what came of it all
  later: ['', 'Some time later...'],

  // ---------------------------------------------------------- the homecoming
  home: {
    dark: ['', "The apartment, late in the evening. The lights are off, and it's been very quiet in here for ten days."],
    door: ['', 'A key turns. The front door opens, the lights come on, and two suitcases come in behind two humans.'],
    in: [
      ['trang', "We're home! ...Where are they? Sharkie? Orkie?"],
      ['hung', 'Ten days in Hokkaido, dummy, and the first thing you say in your own house is the cats.'],
      ['trang', 'It was you who put our honeymoon off for the cats.'],
      ['hung', 'It was a year late already. They had only just moved in. What was a little longer?'],
      ['trang', 'It was wonderful. The mountains, and the ice cream, and all of it. But every night I still looked at photos of these two.'],
      ['hung', "Same here."],
    ],
    run: ['', 'From the far end of the apartment: eight paws on the floor, practically galloping to the front door.'],
    meow: [
      ['shark', 'You came back.'],
      ['orca', "Of course they came back. ...I counted the days. Don't tell them."],
      ['', 'What Hưng and Trang hear is this: meow. Mrrow. Meow, meow. Me-eow. MEOW! This time they understand all of it.'],
      ['hung', 'Yes. Yes! We missed you too. Both of you.'],
    ],
    toys: [
      ['trang', "Wait. We brought you something. Where's the small bag?"],
      ['', 'Two soft toys, round and fat, with cat ears and little striped horns: a red one and a blue one. Each has two small fangs and a very pleased face.'],
      ['trang', 'Demons. One each. Demons for my two little naughty demons.'],
      ['orca', 'It has my face.'],
      ['shark', 'It has your teeth.'],
    ],
    orchid: [
      ['', 'Hưng brings in one more thing from the hallway: a white orchid in a pot, with a card tied to it.'],
      ['hung', "From Flower's human, over in Garnet. \"Congratulations on the wedding. Better late than never, like your honeymoon.\""],
      ['trang', "She came up to feed these two every day that we were away. I'm putting this in our bedroom, in the corner."],
      ['trang', "And you two aren't eating it, okay? I looked it up: orchids are safe for cats. That's not the same as allowed."],
      ['orca', "She said it's safe."],
      ['shark', "She said it's not allowed."],
      ['orca', 'She said safe FIRST.'],
      ['orca', '...Safe.'],
    ],
    end: ['', 'The End.'],
    thanks: ['', "Thank you for playing Between Houses!"],
    morning: ['', "Morning, in the apartment. The front door is open. It's open every morning now."],
  },

  // ------------------------------------------------- the two demons, and the orchid
  // (the toys' own lines are with the other toys, in game-text.js; the orchid's are in furniture.js)

  // ------------------------------------------------------------ the garden
  // The first time each of the garden's cats is met again. (Thanos has his own, below.)
  news: {
    cheetos: [
      ['cheetos', "You're back down again! Is it good, up there? Is there a slide?"],
      ['orca', "There's a tunnel. And a machine that makes kibble."],
      ['cheetos', "A MACHINE. ...Listen. There's a girl. She comes to the playground most days, and she plays with me, only me, and she brings chicken."],
      ['cheetos', 'Yesterday her mother came too. She looked at me for a long time. Then she measured me, with her hands.'],
      ['shark', "That's what they do before they take you home."],
      ['cheetos', "I think so too! I'm going to be very good this time. I'm going to break almost nothing."],
    ],
    socks: [
      ['socks', 'You two. Still alive? How many lives each?'],
      ['orca', 'All nine. As far as we know.'],
      ['socks', "Keep it that way. I cross the road every day now, both ways. I don't even run."],
      ['shark', 'Do you ever think about becoming a house cat?'],
      ['socks', "I like being outside too much. So many places to go. ...Like Mamacat's box. She says I'm on her side of the road a lot lately. The box is warm."],
    ],
    mama: [
      ['mama', 'House cats. You look fed. Good.'],
      ['shark', "We are. It's warm up there. And you? And the small one?"],
      ['mama', "He's nearly too big for the box. And his father comes by. Every day, over the road, to look at him."],
      ['mama', "I let him. He sits over there, and I sit over here, and nobody hisses. That's new."],
    ],
    // (Socks turns up while Mamacat is talking, if she is not already along)
    mamaSocks: [
      ['socks', "Tag. ...Oh. It's you two."],
      ['mama', "And this one. On my side of the road again. That's four days in a row."],
      ['socks', 'The road belongs to me now. I like to cross it.'],
      ['mama', 'You like my box. Just say so.'],
      ['socks', "...It's warm."],
    ],
    baby: [
      ['baby', "It's the BIG one! And the fast one! I tell Scar's kittens about the snake every day. I do the snake, like this, and they scream."],
      ['shark', 'How big is the snake now?'],
      ['baby', 'As long as the road.'],
      ['orca', "That sounds about right."],
      ['baby', "Mama says they're my brothers. They have Papa's glare. I have Mama's."],
    ],
    scar: [
      ['scar', 'House cats. Both of them. Come to look at the old one.'],
      ['orca', "You're walking better."],
      ['scar', 'The human in the white coat caught me. A box with a door, and fish in it. I knew what it was, and I went in for the fish anyway.'],
      ['scar', 'He did something to the leg, and something else that I slept through. Then he carried me back here.'],
      ['shark', "I'm glad you're back. And the kittens?"],
      ['scar', "The little ones are growing well. But they stick to me like glue. Some days I don't even have time to return to the shed."],
      ['shark', "Remember to eat first, old one."],
      ['scar', 'Mm. Eat first, house cat.'],
      ['shark', 'Always.'],
    ],
    bbc: [
      ['bbc', 'You two. Good. I have my collar, my lady has her window open, and I look at the garden for her every morning.'],
      ['bbc', "I told her all about the dogs. She didn't understand a word of it. She gave me scallop churu."],
      ['orca', "I've never heard of scallop churu. What is it?"],
      ['shark', 'Should we ask our humans?'],
    ],
    flower: [
      ['flower', "I'm not grounded anymore. I'm let out, with conditions."],
      ['orca', 'What conditions?'],
      ['flower', "My human comes with me. ...And there's talk of a playdate. I haven't agreed to it."],
      ['shark', 'What IS a playdate?'],
      ['flower', 'You come to my apartment, and you touch nothing.'],
    ],
  },
  // Thanos: cut short by the vet, who has been after him for weeks
  thanos: {
    talk: [
      ['thanos', 'House cats.'],
      ['orca', "Thanos."],
      ['thanos', 'Hm. The kittens are well. All of them. I look in.'],
      ['shark', 'Mamacat says that you come by every day.'],
      ['thanos', "I pass. It's on my way to..."],
    ],
    vetComes: ['', 'Somebody is coming along the path in a white coat, with a wire box in one hand and a can of fish in the other.'],
    vet: [
      ['vet', "There you are, big man. Three weeks I've been after you. Half the kittens in this garden have your face."],
      ['vet', 'Come on. One small operation, and I bring you straight back. Ask the old lady with the leg.'],
    ],
    gone: ['', "Thanos isn't there anymore. Nobody saw him go. A bush on the far side of the path is shaking, a little."],
    after: [
      ['vet', "...Tomorrow, then. Oh hello, you two. You're looking fuller. Is that a primordial pouch?"],
      ['orca', "So that guy is afraid of something after all."],
      ['shark', "Don't let him hear you say it."],
    ],
    // (talked to again that day, he is not about to explain)
    later: ['Thanos looks at {c} for a long moment. Nothing happened. Nobody ran anywhere.', 'Thanos has one eye on the path, in case of white coats.'],
  },
  // The jetty and the lawn, the first time each is walked onto after the end: the boat is gone, and so are
  // the small white balls
  jetty: [
    ['', 'The dock. The boat is gone. The management had it towed away, and nobody has come to ask for it back.'],
    ['orca', 'No boat. No dogs. No rude humans.'],
    ['shark', 'It still smells like the man with the golf club, a little.'],
    ['orca', "Do you remember? He went right into the water. Backward. It's the best thing I've ever seen."],
    ['shark', 'I know. I saw it coming, that time.'],
  ],
  lawn: [
    ['', "The lawn. There's not one small white ball in the grass."],
    ['orca', 'I used to cross here every evening, just to spoil his swing.'],
    ['shark', 'And now?'],
    ['orca', "Now I cross it because it's the short way. ...I miss it, a little."],
    ['shark', 'You miss being chased with a club?'],
    ['orca', 'I miss winning.'],
  ],
  // Flower's human, who puts a plate down by the BBQ shed every evening now
  owner: {
    first: [
      ['owner', "Oh, hello! It's Shark and Orca. Look at you both."],
      ['owner', 'Kibble for the garden cats, every day. I used to leave it behind the cafe. Now I bring it here, closer to the cats.'],
      ['owner', "Your humans and I have been talking, you know. We should all get together: you two, and my Flower. A playdate."],
      ['', 'She scratches both of them behind the ears, one hand each, and goes on her way.'],
      ['orca', "What's a playdate?"],
      ['shark', "I don't know. It sounded like something that's done to you."],
      ['orca', 'With Flower. ...Do we have to wear anything?'],
    ],
    again: [
      "Flower's human puts a hand down for {c} to sniff. \"Hello again, {c}. Tell Flower that I'll be up in a minute.\"",
      '"There you are, {c}. No: this plate is for the ones who live down here. You have a kibble machine."',
      "Flower's human scratches {c} under the chin. \"A playdate. I haven't forgotten.\"",
    ],
  },

  // ------------------------------------ the garden's cats, any time after that
  lines: {
    cheetos: ['Cheetos is back on the monkey bars, and nobody shouts. He tells {c} so, twice.', 'Cheetos shows {c} how he got down from the tree. It takes him three tries.', 'Cheetos is watching the gate of the playground. She comes after school. He tells {c} so, three times.'],
    socks: ['Socks bonks heads with {c}. She has recently invented a new method of crossing the road: asking a nice human to carry her.'],
    mama: ['Mamacat gives {c} a slow blink. The box has never been so full.'],
    baby: ['Babycat is teaching three smaller kittens to stay in the box. Nobody is in the box.'],
    scar: ['Scar has moved in by the humming box next to Garnet, with three kittens. She still goes back to look at her shed.', 'Scar: "Have you eaten?" She asks the kittens first now, and {c} second.'],
    thanos: ["Thanos is passing. He passes both humming boxes most days now, slowly: Mamacat's, and the one where his kittens are.", 'Thanos looks {c} over, and looks away first.'],
    bbc: ["BBC is on Garnet's step, in his collar. The guard says his number every time he goes in: G1410.", 'BBC lets {c} sniff his collar. Once.'],
    flower: ["Flower doesn't talk to strays. {c} and {o} aren't exactly strays, which she finds very awkward.", "Flower smells like catnip, and isn't going to discuss it."],
  },
};
