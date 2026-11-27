// Unified keyboard + touch input, the same in the apartment, the garden and a
// battle. Buttons: up down left right, a (do / select; held: nap), b (run /
// back), swap (held: the cats' sheet), meow, menu (the pause menu, everywhere).
// The keys the game talks about are Space, Shift, C, Z and Esc. X and O also
// work as the pad's cross and circle, so that text which shows those icons is
// true on a keyboard too; Enter and Tab are older aliases.
const KEYS = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Space: 'a', Enter: 'a', KeyX: 'a',
  ShiftLeft: 'b', ShiftRight: 'b', KeyO: 'b',
  KeyC: 'swap',
  KeyZ: 'meow',
  Escape: 'menu',
  Tab: 'menu', // (Esc is the key; Tab still works, for anyone whose browser keeps Esc for itself)
  KeyP: 'win', // (not for players: wins the fight in hand at once, for whoever is testing. See app.js)
  KeyM: 'all', // (not for players: on the title menu, everything is unlocked, or locked again. See app.js)
};
const DIRS = ['up', 'down', 'left', 'right'];

export function createInput() {
  const held = new Set();
  const pressed = new Set();
  const dirStack = [];

  const api = {
    down(name) {
      if (held.has(name)) return;
      held.add(name);
      pressed.add(name);
      if (DIRS.includes(name)) dirStack.push(name);
    },
    up(name) {
      held.delete(name);
      const i = dirStack.indexOf(name);
      if (i >= 0) dirStack.splice(i, 1);
    },
    clear() {
      held.clear();
      pressed.clear();
      dirStack.length = 0;
    },
    // most recently pressed direction that is still held
    dir: () => (dirStack.length ? dirStack[dirStack.length - 1] : null),
    isHeld: (name) => held.has(name),
    // true once per press
    take(name) {
      if (!pressed.has(name)) return false;
      pressed.delete(name);
      return true;
    },
    anyPressed: () => pressed.size > 0,
    flush: () => pressed.clear(),
    keyName: (e) => KEYS[e.code],
  };
  return api;
}
