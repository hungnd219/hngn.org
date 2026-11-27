// Names and tunables — the first place to look when personalising the game.
export const CONFIG = {
  title: 'Between Houses',
  version: '1.0', // shown in a corner of the title menu (WORDS.title.version)

  // the first cat leads at the start; press C / the swap button to switch
  cats: [
    { id: 'shark', name: 'Shark', pal: 'shark', meow: 560, colour: '#c8d46a' },
    { id: 'orca', name: 'Orca', pal: 'orca', meow: 720, colour: '#f0b973' },
  ],
  humans: [
    { name: 'Hưng', pal: 'him', longHair: false, he: 'he', him: 'him', his: 'his' },
    { name: 'Trang', pal: 'her', longHair: true, he: 'she', him: 'her', his: 'her' },
  ],

  viewW: 320, // logical screen size in pixels (20 x 13 tiles; it was 240 x 160)
  viewH: 208,
  walkFrames: 11, // frames per tile (60 fps)
  runFrames: 6,
  humanFrames: 14,

  // clock: one game hour lasts this many real seconds (20 s = an 8-minute day)
  hourSeconds: 20,
  startHour: 5,
};
