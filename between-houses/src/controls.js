// The controls screen (in the pause menu): one table for both ways of
// playing, drawn over whatever is on screen.
import { R, P } from './palette.js';
import { drawText, textWidth } from './font.js';

const BOX = '#1c1a22';
const EDGE = '#55515c';
const TEXT = '#ece6d8';
const DIM = '#8d8894';
const GOLD = '#f2d37a';

// the four pad buttons, 7 x 7
const ICONS = {
  pad(g, x, y, c) {
    R(g, x + 2, y, 3, 7, c);
    R(g, x, y + 2, 7, 3, c);
  },
  cross(g, x, y, c) {
    for (let i = 0; i < 7; i++) {
      P(g, x + i, y + i, c);
      P(g, x + 6 - i, y + i, c);
    }
  },
  circle(g, x, y, c) {
    R(g, x + 2, y, 3, 1, c);
    R(g, x + 2, y + 6, 3, 1, c);
    R(g, x, y + 2, 1, 3, c);
    R(g, x + 6, y + 2, 1, 3, c);
    for (const [a, b] of [[1, 1], [5, 1], [1, 5], [5, 5]]) P(g, x + a, y + b, c);
  },
  triangle(g, x, y, c) {
    R(g, x, y + 6, 7, 1, c);
    for (let i = 0; i < 6; i++) {
      P(g, x + 3 - Math.ceil(i / 2), y + i, c);
      P(g, x + 3 + Math.ceil(i / 2), y + i, c);
    }
  },
  square(g, x, y, c) {
    R(g, x, y, 7, 1, c);
    R(g, x, y + 6, 7, 1, c);
    R(g, x, y, 1, 7, c);
    R(g, x + 6, y, 1, 7, c);
  },
  note: (g, x, y, c) => drawText(g, '♪', x + 1, y - 1, c),
  menu(g, x, y, c) {
    for (const j of [1, 3, 5]) R(g, x, y + j, 7, 1, c);
  },
};

// [keyboard, pad button, exploring, in a battle]
const ROWS = [
  ['Arrows', 'pad', 'Move', 'Choose'],
  ['Space', 'cross', 'Do; hold to nap', 'Select'],
  ['Z', 'square', 'Meow', '-'],
  ['Shift', 'circle', 'Run (hold)', 'Back'],
  ['C', 'triangle', 'Swap; hold for stats', '-'],
  ['Esc', 'menu', 'Menu', 'Menu'],
];

export function drawControls(g, fullW, fullH) {
  g.fillStyle = 'rgba(12,11,17,0.82)';
  g.fillRect(0, 0, fullW, fullH);
  // the table is laid out on a 240 x 160 card in the middle of the screen
  const W = 240;
  const H = 160;
  g.save();
  g.translate(Math.round((fullW - W) / 2), Math.round((fullH - H) / 2));
  R(g, 4, 6, W - 8, H - 12, EDGE);
  R(g, 5, 7, W - 10, H - 14, BOX);
  const title = 'CONTROLS';
  drawText(g, title, Math.round((W - textWidth(title)) / 2), 11, GOLD);
  const X = [11, 72, 84, 192]; // (the widest entry, "Swap; hold for stats", ends at 185)
  const y0 = 26;
  ['Keyboard', '', 'Exploring', 'Battle'].forEach((h, i) => h && drawText(g, h, X[i], y0, DIM));
  R(g, 10, y0 + 11, W - 20, 1, '#34313c');
  ROWS.forEach(([key, icon, a, b], i) => {
    const y = y0 + 16 + i * 13;
    drawText(g, key, X[0], y, TEXT);
    if (icon) ICONS[icon](g, X[1], y + 1, GOLD);
    drawText(g, a, X[2], y, a === '-' ? '#5c5863' : TEXT);
    drawText(g, b, X[3], y, b === '-' ? '#5c5863' : TEXT);
  });
  const foot = 'Any button: back';
  drawText(g, foot, Math.round((W - textWidth(foot)) / 2), H - 18, DIM);
  g.restore();
}
