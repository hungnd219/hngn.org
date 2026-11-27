// Entry point. `mount(element)` drops the whole game into any element, so it
// can live on its own page or be embedded in another site.
import { CONFIG } from './config.js';
import { createInput } from './input.js';
import { createApp } from './app.js';
import { initAudio, stopAudio } from './audio.js';
import { drawControls } from './controls.js';

const VW = CONFIG.viewW;
const VH = CONFIG.viewH;

const CSS = `
.cats8{position:relative;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;
  justify-content:center;background:#17121c;overflow:hidden;outline:none;user-select:none;-webkit-user-select:none;
  touch-action:none;-webkit-tap-highlight-color:transparent;font:bold 13px/1 ui-monospace,Menlo,Consolas,monospace}
.cats8.cats8-portrait{justify-content:flex-start;padding-top:10px;box-sizing:border-box}
.cats8 canvas{display:block;image-rendering:pixelated;image-rendering:crisp-edges;background:#17121c;
  box-shadow:0 0 0 2px #2b2024,0 0 0 4px #55443f}
.cats8-touch{display:none}
.cats8.cats8-has-touch .cats8-touch{display:block}
.cats8-dpad{position:absolute;left:6px;bottom:14px;width:164px;height:164px;border-radius:50%;
  transform:scale(var(--cats8-k,1));transform-origin:left bottom;
  background:rgba(239,226,200,.13);border:2px solid rgba(239,226,200,.3);box-sizing:border-box}
.cats8-dpad i{position:absolute;left:50%;top:50%;width:48px;height:48px;margin:-24px;border-radius:10px;
  background:rgba(239,226,200,.25)}
.cats8-dpad i:nth-child(1){transform:translateY(-52px)}
.cats8-dpad i:nth-child(2){transform:translateY(52px)}
.cats8-dpad i:nth-child(3){transform:translateX(-52px)}
.cats8-dpad i:nth-child(4){transform:translateX(52px)}
.cats8-dpad i.on{background:rgba(242,211,122,.75)}
.cats8-pad{position:absolute;right:6px;bottom:14px;width:164px;height:164px;
  transform:scale(var(--cats8-k,1));transform-origin:right bottom}
.cats8-btn{position:absolute;display:flex;align-items:center;justify-content:center;border-radius:50%;box-sizing:border-box;
  width:60px;height:60px;color:#efe2c8;background:rgba(239,226,200,.16);border:2px solid rgba(239,226,200,.35)}
.cats8-btn svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}
.cats8-btn.on{background:rgba(242,211,122,.6);color:#2b2024}
.cats8-swap{left:52px;top:0}
.cats8-b{right:0;top:52px}
.cats8-a{left:52px;bottom:0}
.cats8-item{left:0;top:52px}
.cats8-mini{position:absolute;right:6px;bottom:calc(26px + 164px * var(--cats8-k,1));width:calc(164px * var(--cats8-k,1));
  display:flex;justify-content:center;gap:14px}
.cats8-mini .cats8-btn{position:static;width:46px;height:30px;border-radius:15px;font-size:15px}
.cats8-mini .cats8-btn svg{width:20px;height:20px}
.cats8-portrait .cats8-mini{left:50%;right:auto;width:auto;transform:translateX(-50%)}
`;

let styled = false;
function injectCSS() {
  if (styled) return;
  styled = true;
  const s = document.createElement('style');
  s.textContent = CSS;
  document.head.appendChild(s);
}

/**
 * @param {HTMLElement} container
 * @param {{keyboard?: 'window'|'focus', create?: Function, cheats?: boolean}} [opts]
 *   keyboard 'window' (default for full pages) listens everywhere;
 *   'focus' only while the game is clicked/focused, so it plays nicely
 *   inside a longer page.
 *   cheats: the playtest switches are on (M, P, ?menu=1, and the two-button hold on a phone:
 *   see app.js). Off unless the page asks: the released game's page does not.
 */
export function mount(container, opts = {}) {
  injectCSS();
  const root = document.createElement('div');
  root.className = 'cats8';
  root.tabIndex = 0;
  if (!container.clientHeight) root.style.aspectRatio = VW + ' / ' + VH;
  const cv = document.createElement('canvas');
  cv.width = VW;
  cv.height = VH;
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  root.appendChild(cv);

  const touch = document.createElement('div');
  touch.className = 'cats8-touch';
  // a D-pad on the left; on the right a diamond: triangle (swap) on top, circle
  // (run / back) right, cross (do / select) bottom, square (meow) left;
  // and the menu button (in the middle when the controls are under the screen)
  const svg = (d) => '<svg viewBox="0 0 24 24">' + d + '</svg>';
  touch.innerHTML =
    '<div class="cats8-dpad"><i></i><i></i><i></i><i></i></div>' +
    '<div class="cats8-mini">' +
    '<div class="cats8-btn" data-k="menu" aria-label="Menu">' + svg('<path d="M5 7H19M5 12H19M5 17H19"/>') + '</div>' +
    '</div>' +
    '<div class="cats8-pad">' +
    '<div class="cats8-btn cats8-swap" data-k="swap" aria-label="Swap cat">' + svg('<path d="M12 4 21 20H3Z"/>') + '</div>' +
    '<div class="cats8-btn cats8-b" data-k="b" aria-label="Run or back">' + svg('<circle cx="12" cy="12" r="8.5"/>') + '</div>' +
    '<div class="cats8-btn cats8-a" data-k="a" aria-label="Do or select">' + svg('<path d="M5 5 19 19M19 5 5 19"/>') + '</div>' +
    '<div class="cats8-btn cats8-item" data-k="meow" aria-label="Meow">' + svg('<rect x="4.5" y="4.5" width="15" height="15"/>') + '</div>' +
    '</div>';
  root.appendChild(touch);
  container.appendChild(root);

  const input = createInput();
  // opts.create swaps in another screen with the same shape (the battle on its own)
  const game = (opts.create || createApp)(input, { cheats: !!opts.cheats });
  let help = false; // the guide is up (only for a screen that has no menu of its own)

  // ---------------------------------------------------------- keyboard
  const keyTarget = opts.keyboard === 'focus' ? root : window;
  const onKeyDown = (e) => {
    const n = input.keyName(e);
    if (!n || e.metaKey || e.ctrlKey || e.altKey) return;
    e.preventDefault();
    initAudio();
    if (!e.repeat) input.down(n);
  };
  const onKeyUp = (e) => {
    const n = input.keyName(e);
    if (n) input.up(n);
  };
  const onBlur = () => input.clear();
  keyTarget.addEventListener('keydown', onKeyDown);
  keyTarget.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);

  // ------------------------------------------------------------- touch
  const showTouch = () => {
    if (!root.classList.contains('cats8-has-touch')) {
      root.classList.add('cats8-has-touch');
      resize();
    }
  };
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) root.classList.add('cats8-has-touch');
  root.addEventListener('touchstart', showTouch, { passive: true });

  cv.addEventListener('pointerdown', (e) => {
    root.focus();
    initAudio();
    if (help) return void (help = false);
    // a screen that wants to know where the tap landed gets it in game pixels
    if (game.pointer) {
      const r = cv.getBoundingClientRect();
      return game.pointer(((e.clientX - r.left) * VW) / r.width, ((e.clientY - r.top) * VH) / r.height);
    }
    // tapping the screen is the action button
    input.down('a');
    setTimeout(() => input.up('a'), 60);
  });

  const dpad = touch.querySelector('.cats8-dpad');
  const arrows = [...dpad.children];
  const NAMES = ['up', 'down', 'left', 'right'];
  let padDir = null;
  const setPad = (d) => {
    if (d === padDir) return;
    if (padDir) input.up(padDir);
    padDir = d;
    if (d) input.down(d);
    arrows.forEach((el, i) => el.classList.toggle('on', NAMES[i] === d));
  };
  const padMove = (e) => {
    const r = dpad.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(x, y) < r.width * 0.09) return setPad(null);
    setPad(Math.abs(x) > Math.abs(y) ? (x < 0 ? 'left' : 'right') : y < 0 ? 'up' : 'down');
  };
  dpad.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    initAudio();
    dpad.setPointerCapture(e.pointerId);
    padMove(e);
  });
  dpad.addEventListener('pointermove', (e) => {
    if (dpad.hasPointerCapture(e.pointerId)) padMove(e);
  });
  for (const ev of ['pointerup', 'pointercancel']) dpad.addEventListener(ev, () => setPad(null));

  // Not for players, and said nowhere on the screen: △ and ▢ held down together for two seconds are the
  // keyboard's M and P (see app.js), for whoever is testing on a phone. On the title menu everything
  // is unlocked, or locked again; in a fight, the fight is won. (Neither button does anything in
  // either place, and it takes two fingers. It comes out with M and P.)
  const CHEAT = ['swap', 'meow'];
  const CHEAT_MS = 2000;
  const down = new Set();
  let cheatT = 0;
  const cheatWatch = () => {
    clearTimeout(cheatT);
    cheatT = 0;
    if (!opts.cheats || !CHEAT.every((k) => down.has(k))) return;
    cheatT = setTimeout(() => {
      cheatT = 0;
      for (const k of ['all', 'win']) {
        input.down(k);
        input.up(k);
      }
    }, CHEAT_MS);
  };
  for (const b of touch.querySelectorAll('.cats8-btn')) {
    const k = b.dataset.k;
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      initAudio();
      b.setPointerCapture(e.pointerId);
      b.classList.add('on');
      input.down(k);
      down.add(k);
      cheatWatch();
    });
    for (const ev of ['pointerup', 'pointercancel'])
      b.addEventListener(ev, () => {
        b.classList.remove('on');
        input.up(k);
        down.delete(k);
        cheatWatch();
      });
  }
  root.addEventListener('contextmenu', (e) => e.preventDefault());

  // ------------------------------------------------------------ sizing
  // The touch controls: the D-pad in the bottom left corner and the four buttons in the bottom right, each
  // PAD across and EDGE in from its side, so that the two mirror each other (the middle of the D-pad is level
  // with the middle of the four). On a screen too narrow or too low for the two of them they are scaled down.
  const PAD = 164, EDGE = 6, FOOT = 14, GAP = 12, MINI = 30;
  function resize() {
    const w = root.clientWidth;
    const h = root.clientHeight;
    const hasTouch = root.classList.contains('cats8-has-touch');
    const portrait = h > w;
    root.classList.toggle('cats8-portrait', portrait && hasTouch);
    // (side by side with a little air between them; and, lying down, the menu button fits above the four)
    const k = Math.max(0.5, Math.min(1, (w - 2 * EDGE - 8) / (2 * PAD), portrait ? 1 : (h - FOOT - 2 * GAP - MINI) / PAD));
    root.style.setProperty('--cats8-k', k.toFixed(3));
    // upright, the controls are under the screen (the menu button above them, in the middle)
    const availH = portrait && hasTouch ? h - 10 - (FOOT + PAD * k + 2 * GAP + MINI) : h - 8;
    // lying down, they are either side of it, the same distance from it
    const availW = hasTouch && !portrait ? w - 2 * (EDGE + PAD * k + GAP) : w - 8;
    let s = Math.min(availW / VW, availH / VH);
    if (s >= 2) s = Math.floor(s);
    s = Math.max(0.5, s);
    cv.style.width = Math.round(VW * s) + 'px';
    cv.style.height = Math.round(VH * s) + 'px';
  }
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  if (ro) ro.observe(root);
  else window.addEventListener('resize', resize);
  resize();

  // -------------------------------------------------------------- loop
  const STEP = 1000 / 60;
  let last = performance.now();
  let acc = 0;
  let raf = 0;
  function tick(now) {
    // (the next frame is asked for first: if anything in this one throws, the game is not left frozen for good)
    raf = requestAnimationFrame(tick);
    acc += Math.min(100, now - last);
    last = now;
    while (acc >= STEP) {
      if (game.ownsMenu) game.update(); // the app has a pause menu and handles the button itself
      else {
        // the guide stops the clock; any button puts it away
        const was = help;
        if (input.take('menu')) help = !help;
        else if (help && input.anyPressed()) help = false;
        if (help || was) input.flush(); // the press that closes it does nothing else
        else game.update();
      }
      acc -= STEP;
    }
    game.draw(g);
    // a screen may bring its own guide (the battle does); otherwise, the controls
    if (help) game.drawHelp ? game.drawHelp(g) : drawControls(g, VW, VH);
  }
  raf = requestAnimationFrame(tick);

  if (opts.keyboard !== 'focus') root.focus({ preventScroll: true });

  return {
    game,
    input,
    canvas: cv,
    destroy() {
      cancelAnimationFrame(raf);
      keyTarget.removeEventListener('keydown', onKeyDown);
      keyTarget.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      clearTimeout(cheatT);
      if (ro) ro.disconnect();
      stopAudio();
      root.remove();
    },
  };
}
