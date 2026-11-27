/* hngn.org split-flap board */
(() => {
  'use strict';

  // ---------- tunables ----------
  const CFG = {
    flapMs: 66,           // one flap (top falls + bottom rises)
    jitter: 0.15,         // per-flap speed variation
    bootCap: 18,          // max flaps per tile on first load
    cap: 9,               // max flaps per tile afterwards
    name: {
      full: [2500, 4500],    // time showing the full name
      blinkGap: [600, 1500], // gap between random blinks
      blink: [250, 900],     // how long a blinked tile stays dark
      decay: [80, 200],      // gap between tiles dropping out
      hold: [2000, 3200],    // time showing HNGN
      restore: [60, 160],    // gap between tiles coming back
    },
    rotate: [3000, 8000],    // each row re-rolls its nonsense time / gate in this window
    songMs: 120000,          // music-of-the-day line changes this often
  };

  // character drums: a tile flaps through these in order
  const FULL = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,-@:/&'!?+()\"#$%*";
  const DIGITS = ' 0123456789';
  const NUM = '0123456789';
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ?';
  // tile counts per column, shared by both panels. Every row sits on a grid of tile-wide
  // slots: the colon takes one slot and each block is followed by one empty slot.
  const W = { time: 4, code: 3, place: 14, gate: 2, status: 10 };
  const SLOTS = {
    full: (W.time + 1) + 1 + W.code + 1 + W.place + 1 + W.gate + 1 + W.status, // 38
    compact: (W.time + 1) + 1 + W.code + 1 + W.place + 1 + 1,                   // 26, lamp in the last slot
  };
  // music line: full width uses the slots after the time block and before the sound button
  const songTiles = (mode) => (mode === 'compact' ? SLOTS.compact : SLOTS.full - (W.time + 1) - 1 - 2);

  const root = document.getElementById('board');
  const src = document.getElementById('source');
  if (!root || !src) return;

  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => motionQuery.matches;

  // ---------- utils ----------
  const rand = ([a, b]) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const whenVisible = () => (document.hidden
    ? new Promise((r) => document.addEventListener('visibilitychange', function f() {
        if (!document.hidden) { document.removeEventListener('visibilitychange', f); r(); }
      }))
    : null);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms)).then(whenVisible);

  function h(tag, cls, attrs, kids) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (attrs) for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, v);
    if (kids != null) (Array.isArray(kids) ? kids : [kids]).forEach((k) => el.append(k));
    return el;
  }
  const svg = (markup) => {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = markup;
    return s;
  };
  const PLANE = '<path d="M21.5 11.2c.8 0 1.5.4 1.5.8s-.7.8-1.5.8H15l-4.6 7.4H8.3l2.4-7.4H6l-1.6 2.2H2.6l1-3-1-3h1.8L6 11.2h4.7L8.3 3.8h2.1l4.6 7.4z"/>';
  const ICONS = {
    cam: '<path fill-rule="evenodd" d="M8.6 4.5 7.2 6.5H4a2 2 0 0 0-2 2V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8.5a2 2 0 0 0-2-2h-3.2l-1.4-2zM12 17.6a4.3 4.3 0 1 0 0-8.6 4.3 4.3 0 0 0 0 8.6zm0-2.1a2.2 2.2 0 1 1 0-4.4 2.2 2.2 0 0 1 0 4.4z"/>',
    bag: '<path fill-rule="evenodd" d="M9 3.5h6a1.2 1.2 0 0 1 1.2 1.2v2.1H20a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.8a2 2 0 0 1 2-2h3.8V4.7A1.2 1.2 0 0 1 9 3.5zm.9 3.3h4.2V5.4H9.9zM2 12.6h20v1.3H2z"/>',
    mail: '<path fill-rule="evenodd" d="M3.2 5h17.6A1.2 1.2 0 0 1 22 6.2v11.6a1.2 1.2 0 0 1-1.2 1.2H3.2A1.2 1.2 0 0 1 2 17.8V6.2A1.2 1.2 0 0 1 3.2 5zm1.4 2L12 12.6 19.4 7z"/>',
    arr: `<g transform="rotate(28 12 12) translate(0 -1)">${PLANE}</g><rect x="2" y="21" width="20" height="1.6" rx=".8"/>`,
    dep: `<g transform="rotate(-28 12 12) translate(0 -1)">${PLANE}</g><rect x="2" y="21" width="20" height="1.6" rx=".8"/>`,
  };

  // ---------- sound (synthesised clack, off by default) ----------
  const Sound = {
    on: false, ctx: null, buf: null, last: 0,
    ensure() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const len = Math.floor(this.ctx.sampleRate * 0.02);
      this.buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 5);
    },
    tick() {
      if (!this.on || !this.ctx || this.ctx.state !== 'running') return;
      const t = this.ctx.currentTime;
      if (t - this.last < 0.024) return;
      this.last = t;
      const s = this.ctx.createBufferSource();
      s.buffer = this.buf;
      s.playbackRate.value = 0.75 + Math.random() * 0.5;
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 1400 + Math.random() * 1800; f.Q.value = 1.1;
      const g = this.ctx.createGain(); g.gain.value = 0.22;
      s.connect(f).connect(g).connect(this.ctx.destination);
      s.start(t);
    },
    set(on) {
      this.on = on;
      try { localStorage.setItem('hngn-sound', on ? '1' : '0'); } catch (e) { /* ignore */ }
      if (on) { this.ensure(); if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
    },
  };
  try { Sound.on = localStorage.getItem('hngn-sound') === '1'; } catch (e) { /* ignore */ }
  if (Sound.on) {
    const wake = () => { Sound.ensure(); Sound.ctx && Sound.ctx.resume(); removeEventListener('pointerdown', wake); removeEventListener('keydown', wake); };
    addEventListener('pointerdown', wake);
    addEventListener('keydown', wake);
  }

  // ---------- tile ----------
  class Tile {
    constructor(ch) {
      this.ch = ch; this.target = ch; this.opts = {}; this.steps = 0; this.running = false;
      const el = this.el = document.createElement('span');
      el.className = 'tile';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = '<span class="h t"><b></b></span><span class="h b"><b></b></span><span class="h ft"><b></b></span><span class="h fb"><b></b></span>';
      [this.t, this.b, this.ft, this.fb] = Array.from(el.children, (c) => c.firstChild);
      this.paint(ch);
    }
    paint(ch) { this.t.textContent = ch; this.b.textContent = ch; }
    set(ch, opts = {}) {
      if (ch === this.target) return;
      this.target = ch; this.opts = opts; this.steps = 0;
      if (reduced() || !this.el.isConnected) { this.ch = ch; this.paint(ch); return; }
      if (!this.running) this.run();
    }
    // set after a delay; a newer schedule/set always cancels an older pending one
    schedule(ch, opts, when) {
      clearTimeout(this.pend);
      if (when > 0 && !reduced()) this.pend = setTimeout(() => this.set(ch, opts), when);
      else this.set(ch, opts);
    }
    get busy() { return this.running || this.ch !== this.target; }
    pulse() {
      if (this.running || reduced() || !this.el.isConnected) return;
      this.running = true;
      this.flip(this.ch).then(() => { this.running = false; if (this.ch !== this.target) this.run(); });
    }
    async run() {
      this.running = true;
      while (this.ch !== this.target) {
        if (!this.el.isConnected || reduced()) { this.ch = this.target; this.paint(this.ch); break; }
        await this.flip(this.next());
      }
      this.running = false;
    }
    next() {
      const cur = this.ch, tgt = this.target;
      if (this.opts.direct || tgt === ' ') return tgt; // clearing a tile is a single flap
      let drum;
      if (this.opts.classed) {
        // nonsense fields: digits only ever flap through digits, letters/? through letters/?;
        // a tile that changes between the two flips straight to its new character
        drum = NUM.includes(cur) && NUM.includes(tgt) ? NUM : ALPHA.includes(cur) && ALPHA.includes(tgt) ? ALPHA : null;
        if (!drum) return tgt;
      } else {
        drum = DIGITS.includes(cur) && DIGITS.includes(tgt) ? DIGITS : FULL;
      }
      const i = drum.indexOf(cur), j = drum.indexOf(tgt);
      if (i < 0 || j < 0) return tgt;
      const dist = (j - i + drum.length) % drum.length;
      const left = Math.max(1, (this.opts.cap || CFG.cap) - this.steps);
      this.steps++;
      return drum[(i + Math.max(1, Math.ceil(dist / left))) % drum.length];
    }
    flip(next) {
      const cur = this.ch;
      const d = CFG.flapMs * (1 + (Math.random() * 2 - 1) * CFG.jitter);
      this.t.textContent = next;
      this.ft.textContent = cur;
      this.fb.textContent = next;
      this.el.classList.add('flipping');
      Sound.tick();
      const ft = this.ft.parentNode, fb = this.fb.parentNode;
      const a1 = ft.animate(
        [{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-90deg)' }],
        { duration: d / 2, easing: 'ease-in', fill: 'forwards' });
      const a2 = fb.animate(
        [{ transform: 'rotateX(90deg)' }, { transform: 'rotateX(0deg)' }],
        { duration: d / 2, delay: d / 2, easing: 'ease-out', fill: 'backwards' });
      return a2.finished.catch(() => {}).then(() => {
        this.b.textContent = next;
        this.ch = next;
        this.el.classList.remove('flipping');
        a1.cancel(); a2.cancel();
      });
    }
  }

  // ---------- field: a fixed-width run of tiles ----------
  class Field {
    constructor(width, align = 'left') {
      this.w = width; this.align = align;
      this.chars = Array(width).fill(' ');
      this.tiles = []; this.colon = null; this.cell = null;
    }
    fmt(text) {
      let s = String(text || '').toUpperCase().slice(0, this.w);
      const pad = this.w - s.length;
      if (this.align === 'right') s = ' '.repeat(pad) + s;
      else if (this.align === 'center') s = ' '.repeat(pad >> 1) + s + ' '.repeat(pad - (pad >> 1));
      else s += ' '.repeat(pad);
      return [...s];
    }
    get str() { return this.chars.join(''); }
    get text() { return this.str.trim(); }
    get busy() { return this.tiles.some((t) => t.busy); }
    mount(parent, colonAt) {
      this.cell = parent; this.tiles = []; this.colon = null;
      this.chars.forEach((c, i) => {
        if (colonAt && i === colonAt) { this.colon = h('span', 'colon', { 'aria-hidden': 'true' }, ':'); parent.append(this.colon); }
        const t = new Tile(c);
        this.tiles.push(t);
        parent.append(t.el);
      });
      this.syncColon();
    }
    unmount() { this.tiles = []; this.colon = null; this.cell = null; }
    syncColon() { /* the colon is printed on the board and always shown */ }
    write(text, { stagger = 0, delay = 0, order = null, ...opts } = {}) {
      const next = this.fmt(text);
      (order || [...next.keys()]).forEach((i, k) => {
        this.chars[i] = next[i];
        const tile = this.tiles[i];
        if (tile) tile.schedule(next[i], opts, delay + k * stagger);
      });
      this.syncColon();
    }
    setAt(i, ch, opts, when = 0) { this.chars[i] = ch; if (this.tiles[i]) this.tiles[i].schedule(ch, opts, when); }
    pulse(stagger = 18, delay = 0) {
      this.tiles.forEach((t, i) => { if (t.ch !== ' ') setTimeout(() => t.pulse(), delay + i * stagger); });
    }
    tone(name) {
      if (!this.cell) return;
      this.cell.classList.remove('tone-green', 'tone-amber', 'tone-rust');
      if (name) this.cell.classList.add('tone-' + name);
    }
  }

  // ---------- rotating nonsense (times and gates) ----------
  // A nonsense value mixes letters, digits and "?". Every row always shows between `lo` and
  // `hi` digits, including while it flips: each tile shows either its old or its new
  // character, so every old/new mix is checked before a value is used.
  const isNum = (c) => c >= '0' && c <= '9';
  const numCount = (s) => [...s].filter(isNum).length;
  const yearish = (s) => s.length === 4 && isNum(s[0]) && isNum(s[1]) && +s.slice(0, 2) >= 16 && +s.slice(0, 2) <= 21;
  const NONSENSE = { time: [4, 1, 3], gate: [2, 1, 1] };
  function nonsense(kind, prev) {
    const [len, lo, hi] = NONSENSE[kind];
    const okay = (s) => { const n = numCount(s); return n >= lo && n <= hi && !yearish(s); };
    const prevOk = prev && prev.length === len && !prev.includes(' ') && okay(prev);
    for (let tries = 0; tries < 2000; tries++) {
      let s = '';
      for (let i = 0; i < len; i++) s += Math.random() < 0.5 ? pick(NUM) : pick('ABCDEFGHIJKLMNOPQRSTUVWXYZ???');
      if (s === prev || !okay(s)) continue;
      if (prevOk) {
        let all = true;
        for (let m = 1; m < (1 << len) - 1 && all; m++) {
          let mix = '';
          for (let i = 0; i < len; i++) mix += (m >> i) & 1 ? s[i] : prev[i];
          all = okay(mix);
        }
        if (!all) continue;
      }
      return s;
    }
    return prev && prevOk ? prev : (kind === 'gate' ? 'A1' : 'A1B2');
  }
  // non-digit positions flip first, so a row coming from a year (all digits) drops below 4 digits at once
  function writeNonsense(f, value, { delay = 0, cap = CFG.cap } = {}) {
    const order = [...Array(value.length).keys()].sort((a, b) => isNum(value[a]) - isNum(value[b]));
    f.write(value, { order, stagger: 110, delay, cap, classed: true });
  }

  // ---------- content from the HTML source ----------
  const nameEl = src.querySelector('[data-name]');
  const NAME = (nameEl ? nameEl.dataset.name : 'HUNG NGUYEN').toUpperCase();
  const VARIANTS = (nameEl && nameEl.dataset.variants ? nameEl.dataset.variants : '')
    .split('|').map((v) => v.split(',').map(Number)).filter((v) => v.length > 1);
  const TITLE = document.title;
  const IS404 = document.body.dataset.page === '404';

  function parseItems(ol) {
    const rows = [];
    if (!ol) return rows;
    [...ol.children].forEach((li) => {
      const d = li.dataset;
      if (!('place' in d)) { rows.push({ ...EMPTY }); return; }
      const a = li.querySelector('a[href]');
      const item = {
        href: a ? a.getAttribute('href') : null,
        target: a ? a.getAttribute('target') : null,
        copy: d.copy || null,
        done: (d.done || 'COPIED').toUpperCase(),
        status: (d.status || '').toUpperCase(),
        hoverStatus: (d.hover || '').toUpperCase(),
        label: li.textContent.replace(/\s+/g, ' ').trim(),
        hover: false, flash: null,
      };
      rows.push({ item, time: d.time || '*', code: d.code || '', place: d.place });
    });
    return rows;
  }
  const EMPTY = { item: null, time: '', code: '', place: '' };

  const screens = {};
  src.querySelectorAll('[data-screen]').forEach((s) => {
    screens[s.dataset.screen] = {
      id: s.dataset.screen,
      title: s.dataset.title || '',
      icon: s.dataset.icon || '',
      cols: (s.dataset.cols || '').split('|'),
      rows: parseItems(s.querySelector('ol')),
    };
  });
  const navSrc = src.querySelector('nav[data-title]');
  const nav = {
    title: navSrc ? navSrc.dataset.title : 'Departures',
    cols: (navSrc ? navSrc.dataset.cols || '' : '').split('|'),
    rows: parseItems(navSrc && navSrc.querySelector('ol')),
  };

  // songs for the now-playing line: plain A–Z text that the tiles can show
  function tileText(s) {
    return String(s).replace(/[Đđ]/g, 'D').replace(/[Øø]/g, 'O').replace(/[Ææ]/g, 'AE').replace(/ß/g, 'SS').replace(/[Łł]/g, 'L')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[‘’`´]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...').replace(/_/g, ' ')
      .toUpperCase().replace(/\s+/g, ' ').trim();
  }
  const fitsDrum = (s) => [...s].every((c) => FULL.includes(c));
  const SONGS = (Array.isArray(window.HNGN_PLAYLIST) ? window.HNGN_PLAYLIST : [])
    .map(([t, a]) => ({ title: tileText(t), artist: tileText(a), label: `${t} by ${a}` }))
    .filter((s) => s.title && fitsDrum(s.title) && fitsDrum(s.artist));
  // shorten to n tiles at a word boundary
  function clip(s, n) {
    if (s.length <= n) return s;
    const cut = s.slice(0, n + 1).lastIndexOf(' ');
    return (cut > n * 0.5 ? s.slice(0, cut) : s.slice(0, n)).replace(/[\s&,+\/-]+$/, '').trim();
  }

  const leftCount = Math.max(1, ...Object.values(screens).map((s) => s.rows.length));

  // ---------- model ----------
  const newRow = (data) => ({
    time: new Field(W.time), code: new Field(W.code), place: new Field(W.place),
    gate: new Field(W.gate), status: new Field(W.status), data,
  });
  const F = { name: new Field(NAME.length), song: [null, null] };
  const top = Array.from({ length: leftCount }, () => newRow(EMPTY));
  const bottom = nav.rows.map((d) => newRow(d));
  const state = { screen: 'home', mode: null, tw: 0, forceHNGN: false, song: null, short: null };

  // ---------- routing ----------
  function screenFromHref(href) {
    if (!href) return null;
    let u;
    try { u = new URL(href, location.href); } catch (e) { return null; }
    if (u.origin !== location.origin || !u.hash) return null;
    const id = u.hash.slice(1);
    return screens[id] && id !== 'home' ? id : null;
  }
  function go(id) {
    if (id === state.screen) return;
    try {
      history.pushState(null, '', id === 'home' ? location.pathname + location.search : '#' + id);
    } catch (e) {
      location.hash = id === 'home' ? '' : id; // hashchange → route()
      return;
    }
    show(id);
  }
  function route() {
    const id = location.hash.slice(1);
    show(screens[id] ? id : 'home');
  }
  function setTitle() {
    const s = screens[state.screen];
    if (state.screen === 'home' || !s) document.title = state.short && !IS404 ? state.short : TITLE;
    else document.title = `${s.title} · ${TITLE}`;
  }

  // ---------- statuses ----------
  const TONES = {
    BOARDING: 'green', 'ON TIME': 'green', OPEN: 'green', COPIED: 'green',
    'GO TO GATE': 'amber', SOON: 'amber',
    DELAYED: 'rust', TBA: 'rust', CANCELLED: 'rust',
  };
  const isLive = (item) => !!(item && (item.href || item.copy));
  function statusText(r, side) {
    const it = r.data.item;
    if (!it) return '';
    if (it.flash) return it.flash;
    if (side === 'bottom') {
      const sid = screenFromHref(it.href);
      if (sid && sid === state.screen) return 'ARRIVED';
      if (it.hover && isLive(it)) return 'GO TO GATE';
    } else if (it.hover && it.hoverStatus) return it.hoverStatus;
    return it.status;
  }
  function applyTone(r, txt) {
    const tone = TONES[txt] || '';
    r.status.tone(tone);
    if (r.lampEl) r.lampEl.className = 'lamp ' + ({ green: 'go', amber: 'blink', rust: 'dim' }[tone] || '');
  }
  function refreshStatus(r, side, opts = {}) {
    const txt = statusText(r, side);
    if (r.status.text !== txt) r.status.write(txt, { stagger: 28, ...opts });
    if (opts.delay && !reduced()) setTimeout(() => applyTone(r, statusText(r, side)), opts.delay);
    else applyTone(r, txt);
  }
  function flash(r, side, txt, ms) {
    const it = r.data.item;
    it.flash = txt; refreshStatus(r, side);
    clearTimeout(it.flashT);
    it.flashT = setTimeout(() => { it.flash = null; refreshStatus(r, side); }, ms);
  }

  // write a whole row (both panels use the same columns)
  function fillRow(r, side, { delay = 0, cap = CFG.cap } = {}) {
    const d = r.data;
    if (d.item && d.time === '*') writeNonsense(r.time, nonsense('time', r.time.str), { delay, cap });
    else r.time.write(d.time, { stagger: 45, delay, cap });
    r.code.write(d.code, { stagger: 45, delay: delay + 120, cap });
    r.place.write(d.place, { stagger: 24, delay: delay + 200, cap });
    if (d.item) writeNonsense(r.gate, nonsense('gate', r.gate.str), { delay: delay + 350, cap });
    else r.gate.write('', { delay: delay + 350 });
    refreshStatus(r, side, { delay: delay + 420, cap });
  }

  // ---------- building the board ----------
  let topTitle, topCols, topBack, topIcon, topH2;

  function colDefs(cols) {
    const defs = [['l-time', cols[0]], ['l-code', cols[1]], ['l-place', cols[2]]];
    if (state.mode === 'compact') defs.push(['l-lamp', '']);
    else defs.push(['l-gate', cols[3]], ['l-status', cols[4]]);
    return defs;
  }
  function colLabels(container, cols) {
    container.textContent = '';
    colDefs(cols).forEach(([cls, txt]) => container.append(h('span', cls, null, txt || '')));
  }

  function setTopHead(s, animate) {
    const apply = () => {
      topIcon.innerHTML = ICONS[s.icon] || '';
      topH2.textContent = s.title;
      topBack.hidden = s.id === 'home' || IS404;
      colLabels(topCols, s.cols);
      topTitle.classList.remove('fade'); topCols.classList.remove('fade');
    };
    if (!animate || reduced()) return apply();
    topTitle.classList.add('fade'); topCols.classList.add('fade');
    setTimeout(apply, 160);
  }

  function setHit(r) {
    const it = r.data.item;
    const hit = r.hit;
    ['href', 'target', 'rel', 'role', 'tabindex', 'aria-disabled'].forEach((a) => hit.removeAttribute(a));
    hit.hidden = false;
    r.el.classList.toggle('live', isLive(it));
    if (!it) { hit.hidden = true; return; }
    if (it.copy) {
      hit.setAttribute('role', 'button');
      hit.setAttribute('tabindex', '0');
    } else if (it.href) {
      hit.setAttribute('href', it.href);
      if (it.target) { hit.setAttribute('target', it.target); hit.setAttribute('rel', 'noopener'); }
    } else {
      hit.setAttribute('role', 'link');
      hit.setAttribute('aria-disabled', 'true');
      hit.setAttribute('tabindex', '0');
    }
  }
  function setLabel(r, side) {
    const it = r.data.item;
    r.hit.textContent = '';
    if (!it) return;
    const st = statusText(r, side);
    r.hit.append(h('span', 'sr', null, st ? `${it.label}. ${st.toLowerCase()}` : it.label));
  }

  function hoverRow(r, on, side) {
    const it = r.data.item;
    if (!isLive(it)) return;
    r.el.classList.toggle('hover', on);
    if (on) r.place.pulse(16);
    if (side === 'bottom' || it.hoverStatus) { it.hover = on; refreshStatus(r, side); }
  }

  function activate(r, side, e) {
    const it = r.data.item;
    if (!it) return;
    if (it.copy) {
      e.preventDefault();
      const done = () => { it.hover = false; flash(r, side, it.done, 2200); };
      const fallback = () => {
        const ta = h('textarea', null, { 'aria-hidden': 'true', style: 'position:fixed;opacity:0' });
        ta.value = it.copy; document.body.append(ta); ta.select();
        try { document.execCommand('copy'); } catch (err) { /* ignore */ }
        ta.remove(); done();
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(it.copy).then(done, fallback);
      else fallback();
      return;
    }
    if (!it.href) { e.preventDefault(); flash(r, side, 'TBA', 1600); return; }
    const sid = screenFromHref(it.href);
    if (sid) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      go(state.screen === sid ? 'home' : sid);
      return;
    }
    if (side === 'bottom') flash(r, side, 'DEPARTED', 4000);
  }

  function buildRow(r, side) {
    const compact = state.mode === 'compact';
    r.el = h('li', 'row');
    const cell = (cls, f, colonAt) => { const c = h('span', 'cell ' + cls); f.mount(c, colonAt); r.el.append(c); };
    cell('c-time', r.time, 2);
    cell('c-code', r.code);
    cell('c-place', r.place);
    r.lampEl = null;
    if (compact) {
      r.gate.unmount(); r.status.unmount();
      r.lampEl = h('span', 'lamp', { 'aria-hidden': 'true' });
      r.el.append(h('span', 'cell c-lamp', null, r.lampEl));
    } else {
      cell('c-gate', r.gate);
      cell('c-status', r.status);
    }
    r.hit = h('a', 'hit');
    r.el.append(r.hit);
    setHit(r); setLabel(r, side);
    applyTone(r, r.status.text);
    r.hit.addEventListener('mouseenter', () => hoverRow(r, true, side));
    r.hit.addEventListener('mouseleave', () => hoverRow(r, false, side));
    r.hit.addEventListener('focus', () => hoverRow(r, true, side));
    r.hit.addEventListener('blur', () => hoverRow(r, false, side));
    r.hit.addEventListener('click', (e) => activate(r, side, e));
    r.hit.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !r.hit.hasAttribute('href')) { e.preventDefault(); activate(r, side, e); }
    });
    return r.el;
  }

  function panel(side, title, icon, rows) {
    const sec = h(side === 'bottom' ? 'nav' : 'section', 'panel', { 'aria-labelledby': 'pt-' + side });
    const t = h('div', 'ptitle');
    const ic = svg(ICONS[icon] || '');
    const h2 = h('h2', null, { id: 'pt-' + side }, title);
    t.append(ic, h2);
    const cols = h('div', 'cols', { 'aria-hidden': 'true' });
    const list = h('ol', 'rows', side === 'top' ? { 'aria-live': 'polite' } : null);
    rows.forEach((r) => list.append(buildRow(r, side)));
    sec.append(t, cols, list);
    return { sec, t, ic, h2, cols };
  }

  function build() {
    root.textContent = '';
    root.dataset.mode = state.mode;
    const s = screens[state.screen] || screens.home;

    // name
    const nameA = h('a', 'name', { href: '/', 'aria-label': 'Hung Nguyen' });
    F.name.mount(nameA);
    nameA.addEventListener('click', (e) => {
      if (IS404) return;
      e.preventDefault();
      if (state.screen !== 'home') go('home');
      else state.forceHNGN = true;
    });
    root.append(h('header', 'head', null, [h('h1', 'h1', null, nameA)]));

    // arrivals (or the screen chosen in departures) on top, departures below
    const tp = panel('top', s.title, s.icon, top);
    topTitle = tp.t; topIcon = tp.ic; topH2 = tp.h2; topCols = tp.cols;
    topBack = h('button', 'back', { type: 'button' }, '← ' + (screens.home ? screens.home.title : 'Back'));
    topBack.addEventListener('click', () => go('home'));
    topTitle.append(topBack);
    setTopHead(s, false);
    const bp = panel('bottom', nav.title, 'dep', bottom);
    colLabels(bp.cols, nav.cols);
    root.append(tp.sec, bp.sec);

    // now playing + sound
    const tk = h('div', 'ticker');
    const lines = h('span', 'tk-lines', { 'aria-hidden': 'true' }, [h('span', 'tk-line'), h('span', 'tk-line')]);
    const snd = h('button', 'snd', { type: 'button', 'aria-pressed': String(Sound.on), 'aria-label': 'Flap sound', title: 'Flap sound' });
    snd.append(svg('<path d="M4 9h4l5-4v14l-5-4H4z"/><path class="on-only" d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/><path class="off-only" d="M17 9.5l5 5M22 9.5l-5 5"/>'));
    snd.addEventListener('click', () => { Sound.set(!Sound.on); snd.setAttribute('aria-pressed', String(Sound.on)); });
    state.songSr = h('span', 'sr');
    tk.append(h('span', 'tk-lbl', { 'aria-hidden': 'true' }, [h('span', null, null, 'Music'), h('span', null, null, 'of the day')]), lines, snd, state.songSr);
    if (!SONGS.length) tk.hidden = true;
    root.append(tk);
    state.lines = [...lines.children];
    songLabel();
  }

  function songLines(n) {
    const s = state.song;
    return s ? [clip(s.title, n), clip(s.artist, n)] : ['', ''];
  }
  function songLabel() {
    if (state.songSr) state.songSr.textContent = state.song ? `Music of the day: ${state.song.label}` : '';
  }
  function fitTicker() {
    if (!state.lines || !SONGS.length) return;
    state.lines.forEach((l) => { l.textContent = ''; });
    const n = songTiles(state.mode);
    const text = songLines(n);
    state.lines.forEach((l, i) => {
      const f = new Field(n);
      f.chars = f.fmt(state.songShown ? text[i] : '');
      f.mount(l);
      F.song[i] = f;
    });
  }
  function playSong(song, { delay = 0, cap = CFG.cap } = {}) {
    state.song = song; state.songShown = true;
    songLabel();
    if (!F.song[0]) return;
    const text = songLines(F.song[0].w);
    F.song.forEach((f, i) => f.write(text[i], { stagger: 30, delay: delay + i * 250, cap }));
  }

  // ---------- layout ----------
  const UNITS = { full: SLOTS.full + 3.8, compact: SLOTS.compact + 2.3 };
  function layout() {
    const vw = document.documentElement.clientWidth;
    const gutter = vw < 640 ? 12 : 24;
    const avail = Math.min(vw - 2 * gutter, 1800);
    const mode = vw < 640 ? 'compact' : 'full';
    let tw = Math.max(10, Math.floor(Math.min(avail / UNITS[mode], 30)));
    const setVars = () => {
      const hw = mode === 'compact'
        ? Math.floor(Math.min(tw * 2.4, (avail - tw * 1.6) / NAME.length))
        : Math.floor(Math.min(tw * 2.3, 64));
      root.style.setProperty('--tw', tw + 'px');
      root.style.setProperty('--hw', hw + 'px');
      state.tw = tw;
    };
    const changed = mode !== state.mode;
    state.mode = mode;
    setVars();
    if (changed) build();
    fitTicker(); // fixed tile count, so the board can be measured with it in place
    // refine from the real size (everything scales with --tw); on larger screens also fit the height
    const w = Math.max(root.offsetWidth, root.scrollWidth);
    let exact = tw * avail / w;
    if (mode === 'full') exact = Math.min(exact, Math.max(16, tw * (innerHeight - 2 * gutter) / root.offsetHeight));
    const next = Math.max(10, Math.floor(Math.min(exact, 30)));
    if (next !== tw) { tw = next; setVars(); }
  }

  // ---------- screens ----------
  function show(id, { boot = false } = {}) {
    const s = screens[id] || screens.home;
    if (!s) return;
    const changed = s.id !== state.screen;
    state.screen = s.id;
    if (!boot && !changed) return;
    if (!boot) setTopHead(s, true);
    top.forEach((r, i) => {
      r.data = s.rows[i] || EMPTY;
      fillRow(r, 'top', boot ? { delay: 700 + i * 170, cap: CFG.bootCap } : { delay: 60 + i * 90 });
      if (r.hit) { setHit(r); setLabel(r, 'top'); r.el.classList.remove('hover'); }
    });
    bottom.forEach((r, i) => {
      if (!boot && r.data.item) { r.place.pulse(14, 120 + i * 80); r.code.pulse(30, 120 + i * 80); }
      refreshStatus(r, 'bottom', { delay: boot ? 0 : 200 + i * 80 });
      if (r.hit) setLabel(r, 'bottom');
    });
    setTitle();
  }

  // ---------- loops ----------
  async function nameLoop() {
    const N = F.name;
    const live = [...NAME].map((c, i) => (c === ' ' ? -1 : i)).filter((i) => i >= 0);
    const variants = VARIANTS.length ? VARIANTS : [live];
    const C = CFG.name;
    for (;;) {
      if (reduced()) { await sleep(2000); continue; }
      const end = Date.now() + rand(C.full);
      while (Date.now() < end && !state.forceHNGN) {
        await sleep(rand(C.blinkGap));
        if (state.forceHNGN || reduced()) break;
        const picks = shuffle(live).slice(0, Math.random() < 0.7 ? 1 : 2);
        picks.forEach((i) => N.setAt(i, ' ', { direct: true }));
        await sleep(rand(C.blink));
        picks.forEach((i) => N.setAt(i, NAME[i], { cap: 5 }));
      }
      state.forceHNGN = false;
      await sleep(500);
      const core = pick(variants);
      const drop = shuffle(live.filter((i) => !core.includes(i)));
      for (const i of drop) { N.setAt(i, ' ', { direct: true }); await sleep(rand(C.decay)); }
      state.short = core.map((i) => NAME[i]).join('');
      setTitle();
      await sleep(rand(C.hold));
      for (const i of shuffle(drop)) { N.setAt(i, NAME[i], { cap: 6 }); await sleep(rand(C.restore)); }
      state.short = null;
      setTitle();
      await sleep(800);
    }
  }

  // every row with content re-rolls its nonsense time (where it has one) and gate now and then
  async function rotateLoop(r) {
    for (;;) {
      await sleep(rand(CFG.rotate));
      const d = r.data;
      if (reduced() || !d.item || r.time.busy || r.gate.busy) continue;
      const doTime = d.time === '*' && Math.random() < 0.75;
      if (doTime) writeNonsense(r.time, nonsense('time', r.time.str));
      if (!doTime || Math.random() < 0.5) writeNonsense(r.gate, nonsense('gate', r.gate.str), { delay: doTime ? 500 : 0 });
    }
  }

  async function songLoop() {
    if (SONGS.length < 2) return;
    for (;;) {
      await sleep(CFG.songMs);
      if (reduced()) continue;
      let next;
      do { next = pick(SONGS); } while (next === state.song);
      playSong(next);
    }
  }

  // ---------- boot ----------
  function boot() {
    state.screen = screens[location.hash.slice(1)] ? location.hash.slice(1) : 'home';
    state.song = SONGS.length ? pick(SONGS) : null;
    state.songShown = false;
    layout();

    F.name.write(NAME, { stagger: 70, delay: 150, cap: CFG.bootCap });
    show(state.screen, { boot: true });
    bottom.forEach((r, i) => fillRow(r, 'bottom', { delay: 1500 + i * 170, cap: CFG.bootCap }));
    if (state.song) playSong(state.song, { delay: 2600, cap: CFG.bootCap });

    setTimeout(() => {
      nameLoop();
      top.concat(bottom).forEach((r) => rotateLoop(r));
      songLoop();
    }, reduced() ? 0 : 3800);

    let raf = 0;
    addEventListener('resize', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(layout); });
    addEventListener('popstate', route);
    addEventListener('hashchange', route);
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && state.screen !== 'home') go('home'); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  }

  boot();
})();
