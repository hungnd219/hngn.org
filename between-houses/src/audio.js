// Chiptune sound effects and five original music loops, all synthesised with
// WebAudio — no audio files.
let ac = null;
let master = null;
let musicGain = null;
let mode = 0; // 0 music + sfx · 1 sfx only · 2 silent
let timer = null;
let fade = null; // the music's own volume, for fading one loop into the next
let night = 0; // 0 day … 1 night
let dark = false; // night enough for the night-time loop (with some give, so dusk does not flicker)
let place = 'apartment'; // apartment | garden | battle | battlePrep

export function initAudio() {
  if (ac) {
    if (ac.state === 'suspended') ac.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try {
    ac = new AC();
  } catch (e) {
    return;
  }
  master = ac.createGain();
  master.gain.value = 0.7;
  master.connect(ac.destination);
  musicGain = ac.createGain();
  musicGain.gain.value = mode === 0 && !hushed ? 1 : 0;
  musicGain.connect(master);
  fade = ac.createGain();
  fade.connect(musicGain);
  startMusic();
}

export function cycleSound() {
  mode = (mode + 1) % 3;
  if (ac) {
    master.gain.value = mode === 2 ? 0 : 0.7;
    musicGain.gain.value = mode === 0 && !hushed ? 1 : 0;
  }
  return ['Sound: music + effects', 'Sound: effects only', 'Sound: off'][mode];
}
// The music held down for a while, whatever the sound setting says (the pause menu): the tune goes on
// underneath, unheard, and is there again when this is let go. Effects are not touched.
let hushed = false;
export function hushMusic(on) {
  if (hushed === !!on) return;
  hushed = !!on;
  if (musicGain) musicGain.gain.value = mode === 0 && !hushed ? 1 : 0;
}
export const soundMode = () => mode;
export function setNight(m) {
  night = Math.max(0, Math.min(1, m));
  if (night > 0.6) dark = true;
  else if (night < 0.4) dark = false;
}
// where the game is: 'apartment', 'garden', 'battle' (a fight) or 'battlePrep' (picking teams)
export function setPlace(p) {
  place = p;
}

function tone(f, dur, o = {}) {
  if (!ac) return;
  // to: bend to this pitch over the note. from: slide in from this pitch.
  // hold: the share of the note kept at full volume before it dies away.
  const { type = 'square', vol = 0.08, to = 0, from = 0, hold = 0, at = 0, out = master } = o;
  const t = ac.currentTime + at;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from || f, t);
  if (from) osc.frequency.exponentialRampToValueAtTime(f, t + 0.09);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.value = 0.0001; // silent until its own start, or the first sample can slip through at full volume as a click
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.008);
  if (hold) g.gain.setValueAtTime(vol, t + dur * hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.03);
}

let noiseBuf = null;
function noise(dur, o = {}) {
  if (!ac) return;
  const { vol = 0.08, at = 0, hp = 0, lp = 0, out = master } = o;
  if (!noiseBuf) {
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = ac.currentTime + at;
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  let node = src;
  if (hp) {
    const f = ac.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = hp;
    node.connect(f);
    node = f;
  }
  if (lp) {
    const f = ac.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = lp;
    node.connect(f);
    node = f;
  }
  const g = ac.createGain();
  g.gain.value = 0.0001; // (as in tone(): no click on the first sample)
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  node.connect(g);
  g.connect(out);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.03);
}

export const sfx = {
  // a dog, somewhere below: two short barks
  bark() {
    tone(210, 0.09, { type: 'sawtooth', vol: 0.05, to: 120 });
    tone(190, 0.1, { type: 'sawtooth', vol: 0.05, to: 100, at: 0.16 });
  },
  bump: () => tone(120, 0.07, { vol: 0.05, to: 70 }),
  step: () => {},
  meow(p = 600) {
    tone(p * 0.85, 0.11, { type: 'triangle', vol: 0.16, to: p * 1.35 });
    tone(p * 1.35, 0.24, { type: 'triangle', vol: 0.16, to: p * 0.75, at: 0.11 });
    tone(p * 1.7, 0.1, { type: 'square', vol: 0.02, to: p * 2.7 });
    tone(p * 2.7, 0.2, { type: 'square', vol: 0.02, to: p * 1.5, at: 0.11 });
  },
  purr() {
    for (let i = 0; i < 16; i++) {
      tone(46, 0.045, { type: 'sawtooth', vol: 0.06, at: i * 0.06 });
      noise(0.04, { vol: 0.03, at: i * 0.06, lp: 400 });
    }
  },
  scratch: () => noise(0.08, { vol: 0.07, hp: 2400 }),
  jump: () => tone(300, 0.09, { vol: 0.05, to: 640 }),
  land: () => tone(170, 0.06, { type: 'triangle', vol: 0.08, to: 90 }),
  crash() {
    noise(0.28, { vol: 0.14, hp: 900 });
    tone(520, 0.22, { vol: 0.05, to: 110 });
    tone(1400, 0.08, { vol: 0.04, to: 500, at: 0.05 });
  },
  crunch: () => noise(0.035, { vol: 0.06, hp: 1600 }),
  blip: () => tone(880, 0.05, { vol: 0.04 }),
  // a rubber toy, trodden on
  squeak() {
    tone(1500, 0.05, { type: 'square', vol: 0.035, to: 2400 });
    tone(2400, 0.08, { type: 'square', vol: 0.03, to: 1700, at: 0.05 });
  },
  // something learned, or a stat gone up: a short rising fanfare
  learn() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i === 3 ? 0.22 : 0.09, { type: 'square', vol: 0.05, at: i * 0.09 }));
  },
  swap() {
    tone(520, 0.05, { vol: 0.05 });
    tone(780, 0.07, { vol: 0.05, at: 0.05 });
  },
  chirp() {
    for (let i = 0; i < 4; i++)
      tone(2300 + (i % 2) * 500, 0.06, { type: 'sine', vol: 0.06, at: i * 0.09, to: 3000 });
  },
  tvOn() {
    tone(440, 0.06, { vol: 0.05 });
    tone(660, 0.1, { vol: 0.05, at: 0.06 });
  },
  tvOff() {
    tone(660, 0.06, { vol: 0.05 });
    tone(330, 0.1, { vol: 0.05, at: 0.06 });
  },
  poof: () => noise(0.14, { vol: 0.05, lp: 1000 }),
  rustle: () => noise(0.09, { vol: 0.03, lp: 2600 }),
  hiss: () => noise(0.4, { vol: 0.07, hp: 3200 }),
  startle() {
    tone(900, 0.05, { vol: 0.05 });
    tone(1300, 0.08, { vol: 0.05, at: 0.05 });
  },
  whirr: (dur = 0.5) => tone(130, dur, { type: 'sawtooth', vol: 0.03, to: 170 }),
  beep() {
    tone(1200, 0.06, { vol: 0.04 });
    tone(1600, 0.08, { vol: 0.04, at: 0.09 });
  },
  door() {
    tone(150, 0.09, { type: 'triangle', vol: 0.12, to: 90 });
    noise(0.06, { vol: 0.05, at: 0.1, lp: 900 });
    tone(110, 0.1, { type: 'triangle', vol: 0.1, to: 70, at: 0.12 });
  },
  start() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, { vol: 0.06, at: i * 0.08 }));
  },
};

// ---------------------------------------------------------------- music
// Five original loops. The garden by day is the first tune the game had;
// by night it thins out to a slow one over the same sort of chords. The
// apartment is a lazy island shuffle (a steel guitar that slides into its
// notes, ukulele strums on the off-beats), and by night the same idea as a
// lullaby. Battles get a driving one in A minor; while teams are being
// picked it plays without its lead and snare. setPlace() says where the game
// is and setNight() how dark it is; one loop fades into the next.
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
// A tune, a token to a step: "E5" a note, "." a rest, "-" holds the note
// before it, "~E5" slides up into the note. Returns an entry per step.
function tune(str) {
  const out = [];
  let last = null;
  for (const tok of str.trim().split(/\s+/)) {
    if (tok === '-') {
      if (last) last.len++;
      out.push(null);
      continue;
    }
    const m = /^(~?)([A-G])([#b]?)(\d)$/.exec(tok);
    last = m ? { m: 12 * (+m[4] + 1) + SEMI[m[2]] + (m[3] === '#' ? 1 : m[3] === 'b' ? -1 : 0), len: 1, slide: !!m[1] } : null;
    out.push(last);
  }
  return out;
}

// ---- the garden by day (C  Am  F  G  C  Em  F  G)
const GARDEN = tune(`
  E5 . G5 . E5 D5 C5 .   A4 . C5 . E5 . C5 .
  F5 . A5 . F5 E5 D5 .   D5 . B4 . D5 . G5 .
  E5 . G5 . C6 B5 G5 .   E5 . G5 . B5 . G5 .
  A5 G5 F5 . A4 . C5 .   D5 . E5 D5 B4 . G4 .`);
const GARDEN_CH = [[48, 55, 64], [45, 52, 60], [41, 53, 60], [43, 55, 62], [48, 55, 64], [40, 52, 59], [41, 53, 60], [43, 55, 62]];
// ---- the garden by night (Am  F  C  G  Am  F  Dm  G)
const GARDEN_NIGHT = tune(`
  A4 - - C5 - - E5 -   D5 - C5 - A4 - - -
  G4 - - C5 - - E5 -   D5 - - - B4 - - -
  A4 - - C5 - E5 - A5  G5 - F5 - C5 - - -
  D5 - - F5 - - E5 D5  B4 - - - G4 - - -`);
const GARDEN_NIGHT_CH = [[45, 52, 60], [41, 53, 60], [48, 55, 64], [43, 55, 62], [45, 52, 60], [41, 53, 60], [38, 53, 57], [43, 55, 62]];
// ---- the apartment by day (C  C7  F  Fm  C  A7  D7  G7): [bass, fifth, then the ukulele's four strings]
const ISLAND = tune(`
  G4 . C5 . E5 - D5 C5     E5 - . . ~G5 - E5 .
  A5 - . G5 F5 . A4 .      Ab4 - . C5 ~F5 - . .
  E5 . G5 . ~C6 - A5 G5    E5 - . C#5 E5 . G5 .
  F#5 - . E5 D5 . A4 .     B4 . D5 . ~F5 - D5 .`);
const ISLAND_CH = [
  [36, 43, 67, 60, 64, 72], [36, 43, 67, 60, 64, 70], [41, 48, 69, 60, 65, 72], [41, 48, 68, 60, 65, 72],
  [36, 43, 67, 60, 64, 72], [45, 40, 67, 61, 64, 69], [38, 45, 69, 62, 66, 72], [43, 38, 67, 62, 65, 71],
];
// ---- the apartment by night (C  Am  Dm  G7  C  C7  F  G7)
const ISLAND_NIGHT = tune(`
  E5 - - - G5 - - -      ~A5 - - G5 E5 - - -
  F5 - - - D5 - A4 -     B4 - - - . . D5 -
  E5 - - - ~C6 - - -     Bb5 - - G5 E5 - - -
  A5 - - - F5 - C5 -     D5 - - - . . . .`);
const ISLAND_NIGHT_CH = [
  [36, 43, 67, 60, 64, 72], [45, 40, 67, 60, 64, 69], [38, 45, 69, 62, 65, 69], [43, 38, 67, 62, 65, 71],
  [36, 43, 67, 60, 64, 72], [36, 43, 67, 60, 64, 70], [41, 48, 69, 60, 65, 72], [43, 38, 67, 62, 65, 71],
];
// ---- battle (Am  Am  F  G  Am  Am  F  E): the tune is in eighths, two steps a note
const BATTLE = tune(`
  A4 . C5 E5 - D5 C5 B4    A4 . E5 . A5 - G5 E5
  F5 . A5 C6 - A5 F5 .     G5 . B5 D6 - B5 G5 D5
  E5 E5 . C5 E5 A5 - G5    E5 . C5 A4 B4 C5 D5 E5
  F5 - A5 - C6 B5 A5 F5    E5 . G#5 B5 E6 - - .`);
const BATTLE_CH = [[45, 57, 60, 64], [45, 57, 60, 64], [41, 53, 57, 60], [43, 55, 59, 62], [45, 57, 60, 64], [45, 57, 60, 64], [41, 53, 57, 60], [40, 52, 56, 59]];
const BATTLE_BASS = [0, 0, 12, 0, 0, 12, 0, 12];
const BATTLE_ARP = [1, 2, 3, 2, 1, 2, 3, 2];

// Each loop: step (seconds), steps in the loop, and play(i, at) to sound
// step i. swing: the long share of each pair of steps. vol: its level beside
// the others (the night ones sit back, the battle one forward). family:
// loops of one family swap without starting over.
const TRACKS = {
  garden: {
    step: 0.3, len: 64,
    play(i, at) {
      const N = (m, len, o) => tone(midi(m), 0.3 * len, { at, out: fade, ...o });
      const b = i % 8;
      const ch = GARDEN_CH[i >> 3];
      const lead = GARDEN[i];
      if (lead) N(lead.m, 1.6, { type: 'square', vol: 0.022 });
      if (b === 0) N(ch[0], 3.5, { type: 'triangle', vol: 0.085 });
      if (b === 4) N(ch[1], 3, { type: 'triangle', vol: 0.07 });
      if (b % 2 === 1) N(ch[2] + (b === 5 ? 12 : 0), 0.9, { type: 'triangle', vol: 0.03 });
    },
  },
  gardenNight: {
    step: 0.36, len: 64, vol: 0.5,
    play(i, at) {
      const N = (m, len, o) => tone(midi(m), 0.36 * len, { at, out: fade, ...o });
      const b = i % 8;
      const bar = i >> 3;
      const ch = GARDEN_NIGHT_CH[bar];
      const lead = GARDEN_NIGHT[i];
      if (lead) {
        N(lead.m, lead.len * 1.15, { type: 'triangle', vol: 0.05, hold: 0.3 });
        N(lead.m + 12, lead.len, { type: 'sine', vol: 0.012, hold: 0.2 });
      }
      if (b === 0) N(ch[0], 7, { type: 'triangle', vol: 0.065, hold: 0.4 });
      // a slow broken chord under it, and now and then a firefly
      if (b === 2 || b === 4 || b === 6) N(ch[b === 4 ? 2 : 1], 2.2, { type: 'sine', vol: 0.028 });
      if ((bar % 2 === 1 && b === 7) || (bar % 4 === 2 && b === 5)) N(ch[2] + 24, 1.4, { type: 'sine', vol: 0.016 });
    },
  },
  apartment: {
    step: 0.26, len: 64, swing: 0.63, vol: 0.65,
    play(i, at) {
      const beat = 0.52;
      const N = (m, dur, o) => tone(midi(m), dur, { at, out: fade, ...o });
      const b = i % 8;
      const ch = ISLAND_CH[i >> 3];
      const lead = ISLAND[i];
      if (lead) {
        // a steel guitar: it slides up into some notes, and rings
        const dur = lead.len * beat * 0.5 + 0.12;
        const from = lead.slide ? midi(lead.m - 2) : 0;
        N(lead.m, dur, { type: 'triangle', vol: 0.055, hold: 0.45, from });
        N(lead.m + 12, dur, { type: 'sine', vol: 0.012, hold: 0.3, from: from * 2 });
      }
      if (b === 0) N(ch[0], beat * 1.7, { type: 'triangle', vol: 0.085, hold: 0.2 });
      if (b === 4) N(ch[1], beat * 1.5, { type: 'triangle', vol: 0.07, hold: 0.2 });
      // ukulele: a down-strum on beats two and four, a lighter one coming back up
      const uke = ch.slice(2);
      if (b === 2 || b === 6) uke.forEach((m, k) => tone(midi(m), 0.24, { type: 'triangle', vol: 0.03, at: at + k * 0.014, out: fade }));
      if (b === 3 || b === 7) uke.slice(1).reverse().forEach((m, k) => tone(midi(m), 0.14, { type: 'triangle', vol: 0.017, at: at + k * 0.012, out: fade }));
      if (b % 2 === 1) noise(0.03, { vol: 0.006, hp: 6500, at, out: fade }); // a shaker
    },
  },
  apartmentNight: {
    step: 0.36, len: 64, vol: 0.5,
    play(i, at) {
      const N = (m, len, o) => tone(midi(m), 0.36 * len, { at, out: fade, ...o });
      const b = i % 8;
      const ch = ISLAND_NIGHT_CH[i >> 3];
      const lead = ISLAND_NIGHT[i];
      if (lead) {
        const from = lead.slide ? midi(lead.m - 2) : 0;
        N(lead.m, lead.len * 1.1 + 0.3, { type: 'triangle', vol: 0.045, hold: 0.4, from });
        N(lead.m + 12, lead.len, { type: 'sine', vol: 0.009, hold: 0.3, from: from * 2 });
      }
      if (b === 0) N(ch[0], 6.5, { type: 'triangle', vol: 0.06, hold: 0.4 });
      // the ukulele, rolled slowly once a bar, and one string answering
      if (b === 0) ch.slice(2).forEach((m, k) => tone(midi(m), 1.5, { type: 'triangle', vol: 0.018, at: at + 0.08 + k * 0.07, out: fade }));
      if (b === 4) N(ch[5], 2.5, { type: 'sine', vol: 0.02 });
    },
  },
  battle: {
    step: 0.105, len: 128, vol: 0.85, family: 'battle',
    play(i, at, calm) {
      const S = 0.105;
      const N = (m, len, o) => tone(midi(m), S * len, { at, out: fade, ...o });
      const b = i % 16;
      const bar = i >> 4;
      const ch = BATTLE_CH[bar];
      const level = calm ? 0.7 : 1;
      // bass in eighths, jumping the octave; a quick broken chord over it
      if (b % 2 === 0) {
        const m = ch[0] + BATTLE_BASS[b >> 1];
        N(m, 1.7, { type: 'triangle', vol: 0.08 * level });
        N(m, 1.5, { type: 'sawtooth', vol: 0.02 * level });
      }
      N(ch[BATTLE_ARP[b % 8]] + (b >= 8 ? 12 : 0), 0.9, { type: 'triangle', vol: 0.02 * level });
      // drums: kick on one and three, snare on two and four, a hat on every eighth
      if (b === 0 || b === 8 || (!calm && b === 6 && bar % 2 === 1)) tone(150, 0.13, { type: 'sine', vol: calm ? 0.12 : 0.2, to: 45, at, out: fade });
      if (b % 2 === 0) noise(0.03, { vol: (b % 4 === 2 ? 0.02 : 0.012) * level, hp: 7000, at, out: fade });
      if (calm) return;
      if (b === 4 || b === 12 || (bar === 7 && b >= 12)) noise(0.09, { vol: 0.05, hp: 1800, at, out: fade });
      const lead = b % 2 === 0 ? BATTLE[i >> 1] : null;
      if (lead) {
        N(lead.m, lead.len * 2 * 0.95, { type: 'square', vol: 0.028, hold: 0.55 });
        N(lead.m - 12, lead.len * 2 * 0.9, { type: 'triangle', vol: 0.03, hold: 0.4 });
      }
    },
  },
};
TRACKS.battlePrep = { ...TRACKS.battle, calm: true };

let track = null; // the loop that is playing
let musicStep = 0;
const wanted = () => (place === 'battle' || place === 'battlePrep' ? place : place + (dark ? 'Night' : ''));
export const musicState = () => ({ track, wanted: wanted(), step: musicStep, place, dark });

function startMusic() {
  let next = ac.currentTime + 0.3;
  let changing = false;
  timer = setInterval(() => {
    if (!ac || ac.state !== 'running') return;
    const want = wanted();
    if (!track) {
      track = want;
      fade.gain.value = TRACKS[track].vol || 1;
    } else if (want !== track && !changing) {
      if (TRACKS[want].family && TRACKS[want].family === TRACKS[track].family) track = want; // the same tune with more or less in it: carry on
      else {
        // fade out, start the other from its top, fade in
        changing = true;
        const t = ac.currentTime;
        fade.gain.cancelScheduledValues(t);
        fade.gain.setValueAtTime(fade.gain.value, t);
        fade.gain.linearRampToValueAtTime(0.0001, t + 0.4);
        setTimeout(() => {
          if (!ac) return;
          track = wanted();
          musicStep = 0;
          next = ac.currentTime + 0.15;
          fade.gain.cancelScheduledValues(ac.currentTime);
          fade.gain.setValueAtTime(0.0001, ac.currentTime);
          fade.gain.linearRampToValueAtTime(TRACKS[track].vol || 1, ac.currentTime + 0.5);
          changing = false;
        }, 430);
      }
    }
    if (next < ac.currentTime) next = ac.currentTime + 0.05;
    while (next < ac.currentTime + 0.25) {
      const T = TRACKS[track];
      const i = musicStep % T.len;
      T.play(i, next - ac.currentTime, !!T.calm);
      next += T.swing ? T.step * 2 * (i % 2 === 0 ? T.swing : 1 - T.swing) : T.step;
      musicStep++;
    }
  }, 60);
}

export function stopAudio() {
  if (timer) clearInterval(timer);
  timer = null;
  if (ac) ac.close();
  ac = null;
}
