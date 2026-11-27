// Small pieces of on-screen furniture that more than one screen draws.
import { R } from './palette.js';

const HP_RED = '#e8645a'; // the battle screen's own HP color (STAT_COLOUR.hp)
const HP_RED_LIT = '#f39a90';
const FRAME_ON = '#f7f1e3'; // the leader's outline (the dialog box's cream)
const FRAME_OFF = '#55515c'; // the other cat's

// A framed bar w pixels wide and 5 high, filled in HP red as far as now of full, empty (the box's own
// background) where HP is lost. `frame` is its outline. (No lines across it: segments of 10 HP, then of
// 20, were tried and taken out at the owner's word, 25 Nov.)
export function drawBar(g, x, y, w, now, full, frame = FRAME_OFF) {
  R(g, x, y, w, 1, frame);
  R(g, x, y + 4, w, 1, frame);
  R(g, x, y, 1, 5, frame);
  R(g, x + w - 1, y, 1, 5, frame);
  const ix = x + 1;
  const iw = w - 2;
  const len = Math.round(iw * Math.max(0, Math.min(1, now / full)));
  if (len > 0) {
    R(g, ix, y + 1, len, 3, HP_RED);
    R(g, ix, y + 1, len, 1, HP_RED_LIT);
  }
}

// The HUD's row for one cat: a chip of his own color, a gap, then his bar, w pixels in all. The chip and
// the bar have the same outline: cream for the cat who is leading (`active`), dim gray for the other.
export function drawHealth(g, x, y, w, now, full, mark, active = true) {
  const frame = active ? FRAME_ON : FRAME_OFF;
  R(g, x, y, 5, 5, frame);
  R(g, x + 1, y + 1, 3, 3, mark);
  drawBar(g, x + 7, y, w - 7, now, full, frame);
}
