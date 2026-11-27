// The dialog box: who is speaking (a name plate and a face), their words
// typed out a page at a time, and now and then a choice of two or three
// things to say. Do moves it on; Run hurries the typing.
//   const d = createDialog(input);
//   d.open({ name, face, text, choices: ['Yes', 'No'], then: (i) => ... });
// `text` may be a string or a list of pages; a page that is too long for the
// box is split. `face` is a small canvas (see faceOf), or nothing for the
// narrator. `then` gets the index of the choice made (or -1). `hi` is a list of
// words to pick out in another colour (a new move's name, a stat that went up).
// `kind` ('goal', 'gain' or 'tip') gives the box its own colours and an icon
// beside its heading: these are the boxes that must not be missed.
// A page never ends in the middle of a sentence if it can be helped: text too
// long for one box is cut where a sentence ends.
import { CONFIG } from './config.js';
import { C, R, canvas } from './palette.js';
import { drawText, textWidth, wrapText, markLines, drawMarked, LINE_H, CONTROLS, ICON_INK } from './font.js';
import { sfx } from './audio.js';
import { fillNames } from './names.js';

const VW = CONFIG.viewW;
const VH = CONFIG.viewH;
const LINES = 3; // lines of text in the box
const BOX_H = LINES * LINE_H + 11;
const BOX_Y = VH - BOX_H - 3;
const FACE_W = 34; // the frame for a face, when there is one
const FACE_H = 28;
const HI = '#c2371f'; // picked-out words
// tab: the heading's plate and the box's edge; bg and lip: the box itself; icon: 7 x 7
const KINDS = {
  goal: { tab: '#2a5da8', bg: '#e2ebf8', lip: '#b9cdea', icon: ['.#####.', '.#####.', '.#####.', '.#####.', '.#.....', '.#.....', '.#.....'] },
  gain: { tab: '#b0640f', bg: '#fbeecb', lip: '#e9cf8e', icon: ['...#...', '..###..', '.#####.', '#######', '..###..', '..###..', '..###..'] },
  tip: { tab: '#2c7a4b', bg: '#e1f2e1', lip: '#b4d9b6', icon: ['..###..', '.#####.', '.#####.', '.#####.', '..###..', '.......', '..###..'] },
};
// the sentences of a text, each with the space that follows it
const sentences = (text) => text.match(/[^.!?]*[.!?]+["')\]]*\s*|[^.!?]+$/g) || [text];

// the head and shoulders of a sprite (facing the viewer), twice the size:
// `rows` rows of it, starting `skip` rows down
export function faceOf(sprite, rows = 13, skip = 0) {
  const [cv, g] = canvas(32, rows * 2);
  g.imageSmoothingEnabled = false;
  const w = Math.min(16, sprite.width);
  const h = Math.min(rows, sprite.height - skip);
  g.drawImage(sprite, (sprite.width - w) >> 1, skip, w, h, 16 - w, 0, w * 2, h * 2);
  return cv;
}

export function createDialog(input) {
  let cur = null;
  let frame = 0;

  function panel(g, x, y, w, h, kind) {
    R(g, x + 1, y, w - 2, h, kind ? kind.tab : C.k);
    R(g, x, y + 1, w, h - 2, kind ? kind.tab : C.k);
    R(g, x + 1, y + 1, w - 2, h - 2, kind ? kind.bg : C.cream);
    R(g, x + 2, y + 2, w - 4, 1, C.white);
    R(g, x + 2, y + h - 3, w - 4, 1, kind ? kind.lip : C.beige);
  }
  // Pages of at most LINES lines. A text that needs more is cut between
  // sentences; a single sentence too long for a box is cut where it must be.
  function paginate(text, w, re) {
    const whole = markLines(text, w, re);
    if (whole.length <= LINES) return [whole];
    const pages = [];
    let cur = '';
    const flush = () => {
      if (!cur.trim()) return;
      const lines = markLines(cur.trim(), w, re);
      for (let i = 0; i < lines.length; i += LINES) pages.push(lines.slice(i, i + LINES));
      cur = '';
    };
    for (const s of sentences(text)) {
      if (cur && wrapText((cur + s).trim(), w).length > LINES) flush();
      cur += s;
    }
    flush();
    return pages;
  }
  const textX = (d) => (d.face ? 7 + FACE_W + 7 : 11);
  const textW = (d) => VW - textX(d) - 12;

  function open(o) {
    // ({S} and {O}: the pair, by whatever they are called at this point of the story)
    o = { ...o, text: fillNames(o.text), name: fillNames(o.name || '') };
    const d = { name: o.name || '', face: o.face || null, choices: o.choices || null, then: o.then || null, kind: KINDS[o.kind] || null, i: 0, n: 0, pick: 0 };
    // what is picked out: the words asked for; the game's icons, each in its colour; and, where nobody is
    // speaking (the narrator, a goal, a tip), the names of buttons and menu items
    const re = [
      ...(o.hi && o.hi.length ? [[new RegExp(o.hi.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g'), HI]] : []),
      ...(d.face ? [] : [[CONTROLS, HI]]),
      ...ICON_INK,
    ];
    d.pages = (Array.isArray(o.text) ? o.text : [o.text]).flatMap((page) => paginate(page, textW(d), re));
    cur = d;
  }
  const total = (d) => d.pages[d.i].reduce((a, l) => a + l.text.length + 1, 0);
  const typed = (d) => d.n >= total(d);
  const choosing = (d) => !!d.choices && d.i === d.pages.length - 1 && typed(d);

  function finish(choice) {
    const d = cur;
    cur = null;
    if (d.then) d.then(choice);
  }
  function advance() {
    const d = cur;
    if (!typed(d)) return void (d.n = total(d));
    if (d.i < d.pages.length - 1) {
      d.i++;
      d.n = 0;
      return sfx.blip();
    }
    sfx.blip();
    finish(d.choices ? d.pick : -1);
  }

  function update() {
    const d = cur;
    if (!d) return;
    frame++;
    if (!typed(d)) d.n = Math.min(total(d), d.n + (input.isHeld('b') ? 6 : 1.5));
    if (choosing(d)) {
      const len = d.choices.length;
      if (input.take('up')) d.pick = (d.pick + len - 1) % len;
      if (input.take('down')) d.pick = (d.pick + 1) % len;
    }
    if (input.take('a')) advance();
    input.flush();
  }

  // the list of choices sits above the right-hand end of the box
  function choiceBox(d) {
    const w = Math.max(...d.choices.map(textWidth)) + 22;
    const h = d.choices.length * LINE_H + 8;
    return { x: VW - w - 3, y: BOX_Y - h - 2, w, h };
  }
  // a tap: on a choice, pick it (or choose it if it is picked); anywhere else, move on
  function pointer(x, y) {
    const d = cur;
    if (!d) return false;
    if (choosing(d)) {
      const b = choiceBox(d);
      const i = Math.floor((y - b.y - 4) / LINE_H);
      if (x >= b.x && x < b.x + b.w && i >= 0 && i < d.choices.length) {
        if (d.pick === i) advance();
        else d.pick = i;
      }
      return true;
    }
    advance();
    return true;
  }

  function draw(g) {
    const d = cur;
    if (!d) return;
    panel(g, 3, BOX_Y, VW - 6, BOX_H, d.kind);
    if (d.name) {
      // the name, on a dark tab that stands on the box; a box of a kind has its colour, and its icon first
      const w = textWidth(d.name) + (d.kind ? 20 : 10);
      R(g, 8, BOX_Y - 10, w, 12, C.k);
      R(g, 9, BOX_Y - 9, w - 2, 11, d.kind ? d.kind.tab : C.charcoal);
      if (d.kind) d.kind.icon.forEach((row, j) => [...row].forEach((c, i) => c === '#' && R(g, 13 + i, BOX_Y - 7 + j, 1, 1, C.white)));
      drawText(g, d.name, d.kind ? 23 : 13, BOX_Y - 7, d.kind ? C.white : C.cream);
    }
    if (d.face) {
      R(g, 7, BOX_Y + 6, FACE_W + 2, FACE_H + 2, C.k);
      R(g, 8, BOX_Y + 7, FACE_W, FACE_H, C.beige);
      const h = Math.min(d.face.height, FACE_H);
      g.drawImage(d.face, 0, 0, d.face.width, h, 8 + ((FACE_W - d.face.width) >> 1), BOX_Y + 7 + FACE_H - h, d.face.width, h);
    }
    let left = Math.floor(d.n);
    d.pages[d.i].forEach((line, i) => {
      if (left <= 0) return;
      // the narrator's words are a shade quieter than a speaker's
      drawMarked(g, line, textX(d), BOX_Y + 6 + i * LINE_H, d.name ? C.k : C.charcoal, HI, left);
      left -= line.text.length + 1;
    });
    if (choosing(d)) {
      const b = choiceBox(d);
      panel(g, b.x, b.y, b.w, b.h);
      d.choices.forEach((c, i) => {
        if (i === d.pick) drawText(g, '>', b.x + 6, b.y + 5 + i * LINE_H, C.burgundy);
        drawText(g, c, b.x + 14, b.y + 5 + i * LINE_H, i === d.pick ? C.burgundy : C.k);
      });
    } else if (typed(d) && (frame >> 4) & 1) drawText(g, '>', VW - 14, BOX_Y + BOX_H - 13, C.burgundy);
  }

  return {
    open,
    update,
    draw,
    pointer,
    close: () => (cur = null),
    get active() { return !!cur; },
    // for tests
    get state() { return cur ? { name: cur.name, text: cur.pages[cur.i].map((l) => l.text).join(' '), choices: choosing(cur) ? cur.choices.slice() : null, asks: !!cur.choices, pick: cur.pick } : null; },
  };
}
