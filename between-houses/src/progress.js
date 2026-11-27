// How far the player has ever got in the story: the furthest chapter of Select chapter whose start
// has been reached, and whether the story has been played to its end. It is kept in the browser
// beside the save and apart from it, because New game and a chapter loaded from the list both
// replace the save, and what has been reached must not shrink when they do.
//
// The title menu reads it (app.js): Select chapter lists the chapters up to the furthest one
// reached, and Sandbox and Battle mode are grayed out until the story is done. The game writes it
// whenever it would save (game.js). A game started from a chapter that had not been reached (the
// hidden M key on the title menu, for whoever is testing) is marked `flags.peek`, and earns nothing here.
import { HOME_STAGES } from './home.js';
import { ACT3_STAGES } from './act3.js';

const at = (list, now, st) => list.indexOf(now) >= 0 && list.indexOf(now) >= list.indexOf(st);
const home = (s, st) => s.act >= 3 || at(HOME_STAGES, s.quest.home, st);
const act3 = (s, st) => at(ACT3_STAGES, s.quest.act3, st);
// Each listed chapter (the ids of MISSIONS in quests.js, in story order), and what is true of a
// story that has reached its start. A chapter that is added to the list needs a line here.
const REACHED = [
  ['prologue', () => true],
  ['cheetos', (s) => s.act >= 1],
  ['socks', (s) => s.act >= 2 || !['wait', 'tell'].includes(s.quest.socks)],
  ['mama', (s) => s.act >= 2 || !['wait', 'tell'].includes(s.quest.mama)],
  ['thanos', (s) => s.act >= 2 || s.quest.thanos !== 'wait'],
  ['apartment', (s) => s.act >= 2 || !!s.flags.named],
  ['home-day2', (s) => home(s, 'explore2')],
  ['home-night', (s) => home(s, 'balcony')],
  ['act3-dogs', (s) => act3(s, ACT3_STAGES[0])],
  ['act3-garnet', (s) => act3(s, 'garnet')],
  ['act3-flat', (s) => act3(s, 'balcony')],
  ['act3-jetty', (s) => act3(s, 'call')],
  ['act3-epilogue', (s) => act3(s, 'after')],
];
export const CHAPTER_IDS = REACHED.map(([id]) => id);

// what a story (a game's, or a save's) has earned: { chapter: how many chapters past the Prologue, done }
export function progressOf(story) {
  if (!story || story.mode !== 'story' || !story.quest || !story.flags || story.flags.peek) return { chapter: 0, done: false };
  let chapter = 0;
  REACHED.forEach(([, test], i) => {
    if (test(story)) chapter = i;
  });
  return { chapter, done: !!story.flags.epilogue };
}

// Storage can be missing or refuse (see the save in story.js): everything here may fail quietly.
const KEY = 'cats8.progress.1';
export function readProgress() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (data && data.v === 1) return { chapter: Math.max(0, CHAPTER_IDS.indexOf(data.chapter)), done: !!data.done };
  } catch {
    // (nothing kept)
  }
  return { chapter: 0, done: false };
}
// a story has got this far: the record grows, and never shrinks
export function noteProgress(story) {
  const now = progressOf(story);
  const was = readProgress();
  if (now.chapter <= was.chapter && (was.done || !now.done)) return was;
  const next = { chapter: Math.max(now.chapter, was.chapter), done: was.done || now.done };
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, chapter: CHAPTER_IDS[next.chapter], done: next.done }));
  } catch {
    // (nothing kept)
  }
  return next;
}
