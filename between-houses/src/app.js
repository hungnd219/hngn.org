// The whole game as one screen: the title screen and its menu, the game itself,
// the battle screen (battle mode from the title, or a fight the story starts),
// and the pause menu over any of them. Same shape as any screen main.js can mount:
// { update, draw, pointer }.
import { CONFIG } from './config.js';
import { C, R } from './palette.js';
import { drawText, textWidth, wrapText, LINE_H } from './font.js';
import { createGame } from './game.js';
import { createBattleScreen, icon, STAT_COLOUR, STAT_MAX } from './battle-screen.js';
import { drawBar } from './hud.js';
import { drawControls } from './controls.js';
import { sfx, cycleSound, soundMode, setPlace, setNight, hushMusic } from './audio.js';
import { readSave, clearSave, STAGES } from './story.js';
import { MISSIONS } from './quests.js';
import { readProgress, noteProgress, CHAPTER_IDS } from './progress.js';
import { WORDS } from './game-text.js';
import { setNamed } from './names.js';
import { createTitle, PROMPT_Y } from './title-screen.js';

const VW = CONFIG.viewW;
const VH = CONFIG.viewH;
const SOUND = ['music + effects', 'effects only', 'off'];
const BOX = '#1c1a22';
const EDGE = '#55515c';
const TEXT = '#ece6d8';
const DIM = '#8d8894';
const OFF = '#5c5863'; // a row that cannot be chosen yet
const GOLD = '#f2d37a';
const ROW = 13; // height of a menu row
const TITLE_ROW = 12; // the title menu's rows are a little closer, so all seven fit in the gap between the towers
// ?menu=1 on the page's address opens on the title menu, not on "press X", with everything on it
// unlocked as the M key unlocks it (the tests use it). Like M and P, it only works on a page that
// has asked for the playtest switches (`cheats`: see createApp).
const MENU_ASKED = typeof location !== 'undefined' && /[?&]menu\b/.test(location.search || '');
const FADE = 14; // frames to black (and back) going into and out of a fight

// The chapters as Select chapter lists them: [label, mission]. The ones between the Prologue and the
// Epilogue are numbered in order ("1. Cheetos"); a hidden one is not listed at all.
const chapters = () => {
  let n = 0;
  return MISSIONS.filter((m) => !m.hidden).map((m) => [m.plain ? m.name : ++n + '. ' + m.name, m]);
};

// opts.cheats: the playtest switches are on: M on the title menu, P in a fight, and ?menu=1 on the
// address. The page asks for them (index.html in the repository does, and the tests; the released
// game's page does not: see design/release/make.mjs), and without them none of the three does anything.
export function createApp(input, opts = {}) {
  const CHEATS = !!opts.cheats;
  const START_MENU = CHEATS && MENU_ASKED;
  let state = 'title'; // title | play | battle (a fight from the story) | free (battle mode) | pause
  let under = 'play'; // what the pause menu is over: play | battle | free
  let page = null; // a page over a menu: 'cats' | 'help'
  let direct = false; // the page was opened straight from the game (closing it goes back there)
  let fade = null; // { t, then }: fading to black, doing `then` in the dark, and fading back
  let ask = null; // "Are you sure?" is up: { yes: the row that goes ahead, go(), back: the cursor to go back to }
  let picking = false; // the list of chapters is up
  // M (a keyboard only, and said nowhere on the screen): the title menu as a player who has finished the
  // story has it, every chapter listed and Sandbox and Battle mode open; M again, as this player has it.
  // For playtesting.
  let open = START_MENU;
  let cursor = 0;
  let frame = 0;
  let toast = null; // a short line over everything: { text, t }
  let battle = null; // the battle screen, while there is one
  let warned = false;
  let game = null;
  // the title screen (the towers, the cats on the ledge): "press X" first, then its menu
  const title = createTitle({ prompt: WORDS.title.press });
  let pressing = !START_MENU;

  const host = {
    // a fight from the story: play it, then hand the result back
    startBattle(encounter, done) {
      fadeTo(() => {
        battle = createBattleScreen(input, {
          encounter,
          onDone(result, info) {
            fadeTo(() => {
              battle = null;
              state = 'play';
              page = null;
              done(result, info);
            });
          },
        });
        state = 'battle';
      });
    },
    // the swap button held down: the cats' sheet, straight over the game
    showCats() {
      pause();
      page = 'cats';
      direct = true;
    },
    saved(ok) {
      if (ok || warned) return;
      warned = true;
      say(WORDS.pause.notSaved);
    },
  };
  // a fresh world behind the title screen (and for each new game)
  function fresh() {
    game = createGame(input, host);
    setPlace('garden');
    setNight(1);
  }
  fresh();
  const say = (text, t = 150) => (toast = { text, t });
  function fadeTo(then) {
    fade = { t: 0, then };
    input.flush();
  }
  const sound = (tpl) => tpl.replace('{mode}', SOUND[soundMode()]);

  // ------------------------------------------------------------- menus
  // What this player has reached (progress.js). A save from before that was kept counts for what it holds.
  const reached = () => noteProgress((readSave() || {}).story);
  function titleItems() {
    if (ask) return [{ label: WORDS.title.no, go: () => (cursor = ask.back, ask = null) }, { label: ask.yes, go: ask.go }];
    const save = readSave();
    const got = reached();
    // a game from here replaces the saved one, if there is one: asked first
    const sure = (yes, go) => () => (save ? (ask = { yes, go, back: cursor }, cursor = 0) : go());
    // Select chapter: the story from the start of any chapter the player has reached (a game like any
    // other: it is saved, in place of the one there was). The Prologue is a new game.
    if (picking) {
      const list = chapters();
      const most = open ? list.length - 1 : Math.max(...list.map(([, m], i) => (CHAPTER_IDS.indexOf(m.id) <= got.chapter ? i : 0)));
      return [
        ...list.slice(0, most + 1).map(([label, m]) => ({ label, go: sure(WORDS.title.load, () => newGame('story', m.id, CHAPTER_IDS.indexOf(m.id) > got.chapter)) })),
        { label: WORDS.title.back, go: () => (picking = false, cursor = 0) },
      ];
    }
    // Sandbox and Battle mode are for after the story: until then the row is gray, and says why when it is chosen
    const after = (label, go) => (open || got.done ? { label, go } : { label, off: true, go: () => say(WORDS.title.locked.replace('{mode}', label)) });
    return [
      ...(save ? [{ label: WORDS.title.continue, go: () => begin(save) }] : []),
      { label: WORDS.title.newGame, go: sure(WORDS.title.yes, () => newGame('story')) },
      // (not on the menu until the first chapter after the Prologue has been reached)
      ...(open || got.chapter > 0 ? [{ label: WORDS.title.missions, go: () => (picking = true, cursor = 0) }] : []),
      // both floors to roam, with no story in them (never saved: the saved game is left as it is)
      after(WORDS.title.sandbox, () => begin(null, 'sandbox')),
      after(WORDS.title.battleMode, freeBattle),
      { label: WORDS.title.help, go: () => (page = 'help') },
      { label: sound(WORDS.title.sound), go: cycleSound },
    ];
  }
  // The same menu wherever it is opened. Help is the controls while exploring
  // and the battle guide during a fight; battle mode has no story behind it,
  // so no goal, no cats and nothing to save.
  function pauseItems() {
    const story = game.story;
    const inStory = under !== 'free';
    return [
      { label: WORDS.pause.resume, go: resume },
      ...(inStory && under === 'play' && !story.flags.solo ? [{ label: WORDS.pause.cats, go: () => (page = 'cats') }] : []),
      { label: WORDS.pause.help, go: () => (page = 'help') },
      { label: sound(WORDS.pause.sound), go: cycleSound },
      // Sandbox: try the pair at any point of the story
      ...(under === 'play' && (story.mode === 'sandbox' || story.flags.sandbox) ? [{ label: WORDS.pause.stage.replace('{stage}', WORDS.stages[story.stage]), note: stageNote(), go: () => game.setStage(STAGES[(STAGES.indexOf(story.stage) + 1) % STAGES.length]) }] : []),
      // (neither Sandbox nor the opening is saved, so those only leave)
      inStory && story.mode === 'story' && story.act !== 0 ? { label: WORDS.pause.quit, go: quit } : { label: WORDS.pause.leave, go: toTitle },
    ];
  }
  const items = () => (state === 'title' ? titleItems() : pauseItems());
  // what the stage row changes, spelled out: the pair's numbers and moves in any fight from here on
  const stageNote = () => WORDS.pause.stageNote + ' ' + game.info().cats.map((c) => c.name + ': HP ' + c.hp + ', ATK ' + c.atk + ', ' + c.moves.slice(1).join(', ') + '.').join(' ');
  // every menu box is one width: wide enough for the longest line any of them can show
  const MENU_W = 30 + Math.max(...[
    WORDS.title.continue, WORDS.title.newGame, WORDS.title.missions, WORDS.title.back, ...chapters().map(([label]) => label),
    WORDS.title.sandbox, WORDS.title.battleMode, WORDS.title.help, WORDS.title.yes, WORDS.title.no, WORDS.title.load,
    WORDS.pause.resume, WORDS.pause.cats, WORDS.pause.help, WORDS.pause.quit, WORDS.pause.leave,
    ...SOUND.flatMap((m) => [WORDS.title.sound.replace('{mode}', m), WORDS.pause.sound.replace('{mode}', m)]),
    ...Object.values(WORDS.stages).map((v) => WORDS.pause.stage.replace('{stage}', v)),
  ].map(textWidth));
  // the title menu's box: in the gap between the towers, under the title
  const TITLE_BOX = { x: Math.round((VW - MENU_W) / 2), w: MENU_W, y: 84 };
  const titleMenu = (on) => {
    pressing = !on;
    title.menu(on, TITLE_BOX);
  };
  if (!pressing) titleMenu(true);
  function pause() {
    under = state;
    state = 'pause';
    cursor = 0;
    page = null;
    direct = false;
    sfx.swap();
    input.flush();
  }

  function begin(save, kind, mission, peek) {
    ask = null;
    picking = false;
    state = 'play';
    game.start(save, kind, mission, peek);
  }
  // a new story, from the opening or from a chapter (peek: one the player has not reached), in place of the saved one
  function newGame(kind, mission, peek) {
    clearSave();
    begin(null, kind, mission, peek);
  }
  function freeBattle() {
    fadeTo(() => {
      setNamed(true); // (Battle mode always knows the pair by name)
      battle = createBattleScreen(input, { onExit: () => fadeTo(toTitle) });
      state = 'free';
    });
  }
  function toTitle() {
    battle = null;
    page = null;
    ask = null;
    picking = false;
    cursor = 0;
    state = 'title';
    // (back from a game, the menu is up at once: "press X" is only for when the game is opened)
    titleMenu(true);
    fresh();
    input.flush();
  }
  function resume() {
    state = under;
    page = null;
    input.flush();
  }
  function quit() {
    const ok = game.save();
    toTitle();
    say(ok ? WORDS.pause.saved : WORDS.pause.notSaved);
  }

  // ------------------------------------------------------------- update
  function menuKeys() {
    const list = items();
    const len = list.length;
    cursor = Math.min(cursor, len - 1);
    if (input.take('up')) cursor = (cursor + len - 1) % len;
    if (input.take('down')) cursor = (cursor + 1) % len;
    if (input.take('a')) {
      sfx.blip();
      list[cursor].go();
    }
  }
  function update() {
    frame++;
    if (toast && --toast.t <= 0) toast = null;
    // no music while the pause menu is up, in the game or in a fight (the cats' sheet on its own, by the
    // swap button, is a look and not a pause; the title screen has its tune)
    hushMusic(state === 'pause' && !direct);
    // P (a keyboard only, and said nowhere on the screen): the fight in hand is won at once. For playtesting.
    if (input.take('win') && CHEATS && !fade && (state === 'battle' || state === 'free')) battle.winNow();
    // M, on the title menu: everything unlocked, or locked again (see `open`)
    if (input.take('all') && CHEATS && !fade && state === 'title' && !pressing && !page) {
      open = !open;
      ask = null;
      picking = false;
      cursor = 0;
      sfx.swap();
    }
    if (fade) {
      // nothing else moves while the screen goes dark and comes back
      if (++fade.t === FADE) fade.then();
      if (fade.t >= FADE * 2) fade = null;
      return input.flush();
    }
    if (state === 'title') {
      // the title screen has the quietest tune there is: the garden's, by night
      setPlace('garden');
      setNight(1);
      title.step();
      if (pressing) {
        // X, Space or Enter: the menu comes up
        if (input.take('a')) {
          sfx.blip();
          cursor = 0;
          titleMenu(true);
        }
        return input.flush();
      }
      if (page) {
        if (input.anyPressed()) page = null;
        return input.flush();
      }
      if ((ask || picking) && (input.take('b') || input.take('menu'))) {
        // back: from the question to the row that asked it, from the chapters to the menu
        if (ask) (cursor = ask.back, ask = null);
        else (picking = false, cursor = 0);
      } else if (input.take('b') || input.take('menu')) {
        // back from the menu to "press X"
        sfx.swap();
        titleMenu(false);
        return input.flush();
      }
      menuKeys();
      return input.flush();
    }
    if (state === 'pause') {
      if (page) {
        // any button puts a page away
        if (input.anyPressed()) direct ? resume() : (page = null);
        return input.flush();
      }
      if (input.take('menu') || input.take('b')) {
        resume();
        return sfx.swap();
      }
      menuKeys();
      return input.flush();
    }
    // exploring or fighting: the menu button pauses either
    if (input.take('menu')) return pause();
    if (state === 'play') game.update();
    else battle.update();
  }

  // --------------------------------------------------------------- draw
  const centred = (g, s, y, c, scale) => drawText(g, s, Math.round((VW - textWidth(s) * (scale || 1)) / 2), y, c, scale);
  function box(g, x, y, w, h) {
    R(g, x, y, w, h, EDGE);
    R(g, x + 1, y + 1, w - 2, h - 2, BOX);
  }
  // a column of choices in a box; returns where each row is, for taps
  let rows = [];
  // A long list (Mission select) shows MENU_ROWS of its rows at a time, and follows the cursor;
  // a small mark at the right says that there is more above or below.
  // (The title menu shows seven rows, a little closer together: all of its rows when there is a save.)
  const MENU_ROWS = 6;
  const shown = (list, most = MENU_ROWS) => Math.min(list.length, most);
  function drawMenu(g, list, x, y, w, row = ROW, most = MENU_ROWS) {
    const n = shown(list, most);
    const first = Math.max(0, Math.min(cursor - (n >> 1), list.length - n));
    box(g, x, y, w, n * row + 9);
    rows = list.map((it, i) => {
      const ry = y + 6 + (i - first) * row;
      if (i < first || i >= first + n) return { x: -1, y: -1, w: 0, h: 0 };
      if (i === cursor) drawText(g, '>', x + 7, ry, GOLD);
      drawText(g, it.label, x + 16, ry, it.off ? (i === cursor ? DIM : OFF) : i === cursor ? GOLD : TEXT);
      return { x, y: ry - 3, w, h: row };
    });
    const mark = (my, up) => [0, 1, 2].forEach((k) => R(g, x + w - 12 + (up ? 2 - k : k), my + k, 1 + 2 * (up ? k : 2 - k), 1, DIM));
    if (first > 0) mark(y + 5, true);
    if (first + n < list.length) mark(y + n * row + 1, false);
  }

  // The title menu, over the title screen (which has dimmed itself behind it): the box in the gap
  // between the towers, under the title; "Start over?" above the box when it is asked; a row's note under it.
  function drawTitle(g) {
    if (pressing) return;
    const list = titleItems();
    const top = ask ? TITLE_BOX.y + 14 : TITLE_BOX.y;
    if (ask) {
      centred(g, WORDS.title.overwrite, TITLE_BOX.y + 1, C.k);
      centred(g, WORDS.title.overwrite, TITLE_BOX.y, C.cream);
    }
    drawMenu(g, list, TITLE_BOX.x, top, MENU_W, TITLE_ROW, 7);
    const note = list[cursor] && list[cursor].note;
    // (on the ledge's face, under the box)
    if (note) centred(g, note, Math.min(top + shown(list, 7) * TITLE_ROW + 20, VH - 10), C.grayL);
    // which version this is, small and gray in the top right corner
    const ver = WORDS.title.version.replace('{v}', CONFIG.version);
    drawText(g, ver, VW - textWidth(ver) - 5, 5, DIM);
    // and along the bottom, which buttons choose and go back: on the line "press X" was on (PROMPT_Y in
    // title-screen.js), so that the words do not jump when the menu comes up
    centred(g, WORDS.title.keys, PROMPT_Y, C.grayL);
  }

  function drawPause(g) {
    g.fillStyle = 'rgba(12,11,17,0.78)';
    g.fillRect(0, 0, VW, VH);
    centred(g, WORDS.pause.title, 14, GOLD);
    let y = 34;
    if (under !== 'free') {
      // what the pair are meant to be doing
      const goal = wrapText(game.info().goal, VW - 60);
      box(g, 20, 28, VW - 40, goal.length * LINE_H + 20);
      drawText(g, WORDS.pause.goal, 28, 33, DIM);
      goal.forEach((l, i) => drawText(g, l, 28, 44 + i * LINE_H, TEXT));
      y = 58 + goal.length * LINE_H;
    }
    const list = pauseItems();
    drawMenu(g, list, Math.round((VW - MENU_W) / 2), y, MENU_W);
    const note = list[cursor] && list[cursor].note;
    if (note) wrapText(note, VW - 40).forEach((l, i) => centred(g, l, y + list.length * ROW + 16 + i * LINE_H, DIM));
  }

  // The cats' sheet (from the pause menu, or by holding the swap button): a
  // column each for Shark, Orca and whoever is tagging along. Name, picture,
  // the three stats as bars on the battle's scale, moves, and what is carried.
  function drawCats(g) {
    g.fillStyle = 'rgba(12,11,17,0.86)';
    g.fillRect(0, 0, VW, VH);
    const info = game.info();
    box(g, 4, 4, VW - 8, VH - 8);
    drawText(g, WORDS.cats.title, 12, 10, GOLD);
    const COL = 102;
    // (in a game that keeps HP, the stats beside the face are ATK and AGL, and under the face is the HP
    // each has now: a heart, HP and the numbers, then the bar; then the moves, and what each carries at the
    // bottom. In one that does not, the stats are the three as before.)
    const keeps = !!(info.keeps && info.hp);
    const NUM = 88; // (keeps) where the numbers end, short of the line between columns
    [info.cats[0], info.cats[1], info.guest].forEach((c, i) => {
      const x = 12 + i * COL;
      if (i) R(g, x - 5, 24, 1, keeps ? 156 : 122, '#34313c');
      if (!c) {
        // nobody along (and nothing at all until friends can be asked)
        if (info.sandbox) drawText(g, WORDS.cats.alone, x, 24, '#5c5863');
        else if (info.list) {
          // Act 2: the things to try around the flat, in their groups, each headed by what it pays
          drawText(g, info.list.title, x, 24, DIM);
          let y = 36;
          const row = (t) => {
            if (t.done) icon(g, 'yes', x, y, '#8fdc8a');
            else R(g, x + 1, y + 2, 3, 3, DIM);
            drawText(g, t.text, x + 10, y, t.done ? '#5c5863' : TEXT);
            y += 10;
          };
          for (const grp of info.list.groups) {
            drawText(g, grp.head, x, y, grp.done ? '#5c5863' : STAT_COLOUR[grp.stat]);
            y += 10;
            grp.items.forEach(row);
            y += 2;
          }
          info.list.extra.forEach(row);
        } else if (info.tips) {
          // things around the garden worth trying once, and what each is worth
          drawText(g, WORDS.finds.tipsLabel.toUpperCase(), x, 24, DIM);
          let y = 37;
          for (const t of info.tips) {
            const lines = wrapText(t.text, COL - 22);
            if (t.done) icon(g, 'yes', x, y, '#8fdc8a');
            else R(g, x + 1, y + 2, 3, 3, DIM);
            lines.forEach((l, j) => drawText(g, l, x + 10, y + j * LINE_H, t.done ? '#5c5863' : TEXT));
            y += lines.length * LINE_H;
            if (t.stat) {
              drawText(g, t.stat.toUpperCase() + ' +' + t.n, x + 10, y, t.done ? '#5c5863' : STAT_COLOUR[t.stat]);
              y += LINE_H;
            }
            y += 5;
          }
        }
        return;
      }
      drawText(g, c.name.toUpperCase(), x, 24, c.colour);
      R(g, x, 35, 34, 28, EDGE);
      R(g, x + 1, 36, 32, 26, '#2a2732');
      g.drawImage(c.face, 0, 0, 32, Math.min(26, c.face.height), x + 1, 36 + 26 - Math.min(26, c.face.height), 32, Math.min(26, c.face.height));
      if (keeps) {
        ['atk', 'agl'].forEach((k, j) => {
          const y = 41 + j * 10;
          icon(g, k, x + 38, y, STAT_COLOUR[k]);
          R(g, x + 48, y + 1, 24, 5, '#34313c');
          if (c[k]) R(g, x + 48, y + 1, Math.max(1, Math.round((24 * c[k]) / STAT_MAX[k])), 5, STAT_COLOUR[k]);
          const n = String(c[k]);
          drawText(g, n, x + NUM - textWidth(n), y, TEXT);
        });
        // the HP each has now (a friend comes in on his own, full)
        const kind = i === 0 ? 'shark' : i === 1 ? 'orca' : null;
        const [now, full] = kind ? info.hp[kind] : [c.hp, c.full || c.hp];
        icon(g, 'hp', x, 68, STAT_COLOUR.hp);
        drawText(g, WORDS.cats.hpNow, x + 10, 68, DIM);
        const nums = now + '/' + full;
        drawText(g, nums, x + NUM - textWidth(nums), 68, TEXT);
        drawBar(g, x, 79, NUM, now, full);
        drawText(g, WORDS.cats.moves, x, 92, DIM);
        c.moves.forEach((m, j) => drawText(g, m, x, 103 + j * LINE_H, TEXT));
        if (c.carrying === undefined) return; // (a friend carries nothing)
        drawText(g, WORDS.cats.carrying, x, 158, DIM);
        if (c.carrying) {
          g.drawImage(c.carrying.sprite, x, 169);
          drawText(g, c.carrying.name, x + 13, 169, TEXT);
        } else drawText(g, WORDS.cats.nothing, x, 169, '#5c5863');
        return;
      }
      ['hp', 'atk', 'agl'].forEach((k, j) => {
        const y = 36 + j * 10;
        icon(g, k, x + 39, y, STAT_COLOUR[k]);
        R(g, x + 49, y + 1, 28, 5, '#34313c');
        if (c[k]) R(g, x + 49, y + 1, Math.max(1, Math.round((28 * c[k]) / STAT_MAX[k])), 5, STAT_COLOUR[k]);
        const n = String(c[k]);
        drawText(g, n, x + 95 - textWidth(n), y, TEXT);
      });
      drawText(g, WORDS.cats.moves, x, 70, DIM);
      c.moves.forEach((m, j) => drawText(g, m, x, 81 + j * LINE_H, TEXT));
      if (c.carrying === undefined) return; // (a friend carries nothing)
      drawText(g, WORDS.cats.carrying, x, 126, DIM);
      if (c.carrying) {
        g.drawImage(c.carrying.sprite, x, 137);
        drawText(g, c.carrying.name, x + 13, 137, TEXT);
      } else drawText(g, WORDS.cats.nothing, x, 137, '#5c5863');
    });
    drawText(g, WORDS.pause.back, VW - 12 - textWidth(WORDS.pause.back), VH - 18, DIM);
  }

  // A fighter's card, over the top of the game while the story asks about them (a friend in the line, on
  // the last night): name, picture and the three numbers on the left, as on the cats' sheet; on the
  // right each move, how sure it is, and what it does, in the battle menu's own words.
  function drawCard(g, c) {
    const X = 4, Y = 4, W = VW - 8;
    const MX = 118; // where the moves start
    const MW = VW - MX - 12;
    const rows = c.moves.map((m) => wrapText(m.hint, MW));
    const H = Math.max(76, 12 + rows.reduce((n, r) => n + (r.length + 1) * LINE_H + 5, 0));
    box(g, X, Y, W, H);
    // (the left side as on the cats' sheet: the face with ATK and AGL beside it, then a heart, HP and the
    // numbers, then the HP bar the length of it)
    const x = X + 8;
    const NUM = 96; // where the numbers end
    drawText(g, c.name.toUpperCase(), x, Y + 6, GOLD);
    R(g, x, Y + 18, 34, 28, EDGE);
    R(g, x + 1, Y + 19, 32, 26, '#2a2732');
    if (c.face) g.drawImage(c.face, 0, 0, 32, Math.min(26, c.face.height), x + 1, Y + 19 + 26 - Math.min(26, c.face.height), 32, Math.min(26, c.face.height));
    ['atk', 'agl'].forEach((k, j) => {
      const y = Y + 24 + j * 10;
      icon(g, k, x + 38, y, STAT_COLOUR[k]);
      R(g, x + 48, y + 1, 30, 5, '#34313c');
      if (c[k]) R(g, x + 48, y + 1, Math.max(1, Math.round((30 * c[k]) / STAT_MAX[k])), 5, STAT_COLOUR[k]);
      const n = String(c[k]);
      drawText(g, n, x + NUM - textWidth(n), y, TEXT);
    });
    const full = c.full || c.hp;
    icon(g, 'hp', x, Y + 51, STAT_COLOUR.hp);
    drawText(g, WORDS.cats.hpNow, x + 10, Y + 51, DIM);
    const nums = c.hp + '/' + full;
    drawText(g, nums, x + NUM - textWidth(nums), Y + 51, TEXT);
    drawBar(g, x, Y + 62, NUM, c.hp, full);
    R(g, MX - 7, Y + 6, 1, H - 12, '#34313c');
    let y = Y + 6;
    c.moves.forEach((m, i) => {
      drawText(g, m.name.toUpperCase(), MX, y, GOLD);
      if (m.acc) drawText(g, m.acc, MX + MW - textWidth(m.acc), y, DIM);
      rows[i].forEach((l, j) => drawText(g, l, MX, y + (j + 1) * LINE_H, TEXT));
      y += (rows[i].length + 1) * LINE_H + 5;
    });
  }

  function draw(g) {
    const fighting = state === 'pause' ? under !== 'play' : state === 'battle' || state === 'free';
    if (fighting) battle.draw(g);
    else if (state === 'title') title.draw(g);
    else {
      game.draw(g);
      const c = state === 'play' && game.card && game.card();
      if (c) drawCard(g, c);
    }
    if (state === 'title') page === 'help' ? drawControls(g, VW, VH) : drawTitle(g);
    else if (state === 'pause') {
      if (page === 'cats') drawCats(g);
      else if (page === 'help') fighting ? battle.drawHelp(g) : drawControls(g, VW, VH);
      else drawPause(g);
    }
    if (fade) {
      g.fillStyle = 'rgba(23,18,28,' + Math.max(0, Math.min(1, fade.t < FADE ? fade.t / FADE : 2 - fade.t / FADE)).toFixed(3) + ')';
      g.fillRect(0, 0, VW, VH);
    }
    if (toast) {
      const w = textWidth(toast.text) + 14;
      const x = Math.round((VW - w) / 2);
      R(g, x, 3, w, 15, C.k);
      R(g, x + 1, 4, w - 2, 13, C.cream);
      drawText(g, toast.text, x + 7, 7, C.k);
    }
  }

  // a tap: a menu row (the first tap moves the cursor, the second chooses);
  // a page goes away; otherwise it is the game's or the battle's to deal with
  function pointer(x, y) {
    if (fade) return;
    if (page) return void (direct ? resume() : (page = null));
    // a tap on "press X" is the press
    if (state === 'title' && pressing) {
      sfx.blip();
      cursor = 0;
      return titleMenu(true);
    }
    if (state === 'title' || state === 'pause') {
      const i = rows.findIndex((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
      if (i < 0) return;
      if (cursor !== i) return void (cursor = i);
      sfx.blip();
      items()[i].go();
      return;
    }
    if (state === 'play') return game.pointer(x, y);
    battle.pointer(x, y);
  }

  return {
    update,
    draw,
    pointer,
    ownsMenu: true,
    get game() { return game; },
    // for tests and tinkering in the console
    debug: {
      get state() { return state; },
      get page() { return page; },
      get battle() { return battle; },
      get menu() { return state === 'title' || state === 'pause' ? items().map((it, i) => (i === cursor ? '>' : '') + it.label) : null; },
      // the title screen: 'press' or 'menu' (null once the game is on), and what moves on it
      get title() { return state === 'title' ? (pressing ? 'press' : 'menu') : null; },
      get titleScreen() { return title.state(); },
      get titleBox() { return { ...TITLE_BOX, rows: rows.filter((r) => r.w > 0).length }; },
      get toast() { return toast ? toast.text : ''; },
      // the story from one of MISSIONS, by its id: the ones that are not on the list too
      mission: (id) => begin(null, 'story', id),
      // everything on the title menu unlocked (M), and what this player has reached
      get open() { return open; },
      get reached() { return reached(); },
      // the title menu's rows that are grayed out
      get locked() { return state === 'title' ? items().filter((it) => it.off).map((it) => it.label) : []; },
    },
  };
}
