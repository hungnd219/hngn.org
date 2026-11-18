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
    times: {
      every: [3000, 8000],   // each departure time re-rolls in this window
      impossible: 0.6,       // share of times that are not valid clock times
      bannedHH: [16, 21],    // first pair never in this range (could read as a year)
    },
    tickerMs: 7000,
    tz: 'Asia/Ho_Chi_Minh',
    city: 'HO CHI MINH CITY',
  };

  const FULL = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-@:/&'!?+";
  const DIGITS = ' 0123456789';
  const W = { time: 4, place: 13, code: 3, gate: 1, status: 9 };

  const root = document.getElementById('board');
  const src = document.getElementById('source');
  if (!root || !src) return;

  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => motionQuery.matches;

  // ---------- utils ----------
  const rand = ([a, b]) => a + Math.random() * (b - a);
  const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
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
  const svg = (markup, cls) => {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    if (cls) s.setAttribute('class', cls);
    s.innerHTML = markup;
    return s;
  };
  const PLANE = '<path d="M21.5 11.2c.8 0 1.5.4 1.5.8s-.7.8-1.5.8H15l-4.6 7.4H8.3l2.4-7.4H6l-1.6 2.2H2.6l1-3-1-3h1.8L6 11.2h4.7L8.3 3.8h2.1l4.6 7.4z"/>';
  const ICONS = {
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
      const tgt = this.target;
      if (this.opts.direct) return tgt;
      const drum = DIGITS.includes(this.ch) && DIGITS.includes(tgt) ? DIGITS : FULL;
      const i = drum.indexOf(this.ch), j = drum.indexOf(tgt);
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
        [{ transform: 'rotateX(0deg)', filter: 'brightness(1)' }, { transform: 'rotateX(-90deg)', filter: 'brightness(.5)' }],
        { duration: d / 2, easing: 'ease-in', fill: 'forwards' });
      const a2 = fb.animate(
        [{ transform: 'rotateX(90deg)', filter: 'brightness(1.5)' }, { transform: 'rotateX(0deg)', filter: 'brightness(1)' }],
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
    get text() { return this.chars.join('').trim(); }
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
    syncColon() { if (this.colon) this.colon.classList.toggle('off', !/^\d{4}$/.test(this.chars.join(''))); }
    write(text, { stagger = 0, delay = 0, random = false, ...opts } = {}) {
      const next = this.fmt(text);
      let order = [...next.keys()];
      if (random) order = shuffle(order);
      order.forEach((i, k) => {
        this.chars[i] = next[i];
        const tile = this.tiles[i];
        if (tile) tile.schedule(next[i], opts, delay + (random ? k : i) * stagger);
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
      const a = li.querySelector('a[href]');
      const item = {
        href: a ? a.getAttribute('href') : null,
        target: a ? a.getAttribute('target') : null,
        copy: d.copy || null,
        done: d.done || null,
        status: (d.status || '').toUpperCase(),
        label: li.textContent.replace(/\s+/g, ' ').trim(),
        hover: false, flash: null,
      };
      if (!('place' in d)) { rows.push({ item: null, time: '', place: '', code: '', gate: '', lamp: 'off', first: true }); return; }
      d.place.split('|').forEach((p, k) => rows.push({
        item, first: k === 0,
        time: k ? '' : d.time || '',
        place: p,
        code: k ? '' : d.code || '',
        gate: k ? '' : d.gate || '',
        lamp: k ? 'off' : d.lamp || 'off',
      }));
    });
    return rows;
  }

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
  const tickerSrc = src.querySelector('[data-ticker]');
  const MESSAGES = tickerSrc ? tickerSrc.textContent.split('|').map((m) => m.trim().toUpperCase()).filter(Boolean) : [];

  const leftCount = Math.max(4, ...Object.values(screens).map((s) => s.rows.length));
  const EMPTY = { item: null, time: '', place: '', code: '', gate: '', lamp: 'off', first: true };

  // ---------- model ----------
  const F = { name: new Field(NAME.length), clock: new Field(4), city: new Field(CFG.city.length), ticker: null };
  const left = Array.from({ length: leftCount }, () => ({
    time: new Field(W.time), place: new Field(W.place), code: new Field(W.code), data: EMPTY,
  }));
  while (nav.rows.length < leftCount) nav.rows.push({ ...EMPTY });
  const right = nav.rows.map((d) => ({
    time: new Field(W.time), place: new Field(W.place), gate: new Field(W.gate, 'right'), status: new Field(W.status), data: d,
  }));
  const state = { screen: 'home', mode: null, tw: 0, forceHNGN: false, tickerIdx: 0, tickerMsg: '', booted: false };

  // ---------- nonsense departure times ----------
  function nonsenseTime(prev) {
    const [lo, hi] = CFG.times.bannedHH;
    for (;;) {
      let hh, mm;
      if (Math.random() >= CFG.times.impossible) { hh = randInt(0, 23); mm = randInt(0, 59); }
      else if (Math.random() < 0.5) { hh = randInt(24, 99); mm = randInt(0, 99); }
      else { hh = randInt(0, 23); mm = randInt(60, 99); }
      const s = String(hh).padStart(2, '0') + String(mm).padStart(2, '0');
      if (s === prev) continue;
      // the hour digits flip one at a time, so every old/new mix must be safe too
      const p = /^\d\d/.test(prev || '') ? prev : s;
      const mixes = [s[0] + s[1], p[0] + s[1], s[0] + p[1]].map(Number);
      if (mixes.some((x) => x >= lo && x <= hi)) continue;
      return s;
    }
  }
  // hour digits flip straight to the new value (no cycling through year-like pairs); minutes cycle freely
  function writeTime(f, next, { delay = 0, cap = CFG.cap } = {}) {
    [...next].forEach((ch, i) => {
      f.setAt(i, ch, i < 2 ? { direct: true } : { cap }, delay + i * 70);
    });
    f.syncColon();
  }

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

  // ---------- statuses ----------
  const TONES = { BOARDING: 'green', 'LAST CALL': 'amber', ARRIVED: 'amber', DELAYED: 'rust', TBA: 'rust' };
  const isLive = (item) => !!(item && (item.href || item.copy));
  function statusText(r) {
    const it = r.data.item;
    if (!it) return '';
    if (it.flash) return it.flash;
    const sid = screenFromHref(it.href);
    if (sid && sid === state.screen) return 'ARRIVED';
    if (it.hover && isLive(it)) return 'LAST CALL';
    return it.status;
  }
  function applyTone(r, txt) {
    const tone = TONES[txt] || '';
    r.status.tone(tone);
    if (r.lampEl) r.lampEl.className = 'lamp ' + ({ green: 'go', amber: 'blink', rust: 'dim' }[tone] || '');
  }
  function refreshStatus(r, opts = {}) {
    const txt = statusText(r);
    if (r.status.text !== txt) r.status.write(txt, { stagger: 28, ...opts });
    if (opts.delay && !reduced()) setTimeout(() => applyTone(r, statusText(r)), opts.delay);
    else applyTone(r, txt);
  }
  function flash(r, txt, ms) {
    const it = r.data.item;
    it.flash = txt; refreshStatus(r);
    clearTimeout(it.flashT);
    it.flashT = setTimeout(() => { it.flash = null; refreshStatus(r); }, ms);
  }

  // ---------- building the board ----------
  let leftTitle, leftCols, leftBack, leftIcon, leftH2;

  function colLabels(container, defs) {
    container.textContent = '';
    defs.forEach(([cls, txt]) => container.append(h('span', cls, null, txt || '')));
  }

  function leftColDefs(s) {
    const c = s.cols;
    const defs = [['l-time', c[0]], ['l-place', c[1]], ['l-code', c[2]], ['l-lamp', '']];
    return defs;
  }
  function rightColDefs() {
    const c = nav.cols;
    const defs = [['l-time', c[0]], ['l-place', c[1]]];
    if (state.mode !== 'compact') defs.push(['l-gate', c[2]], ['l-status', c[3]]);
    else defs.push(['l-lamp', '']);
    return defs;
  }

  function panelTitle(side, title, icon) {
    const wrap = h('div', 'ptitle');
    const ic = svg(ICONS[icon] || '');
    const h2 = h('h2', null, { id: 'pt-' + side }, title);
    wrap.append(ic, h2);
    return { wrap, ic, h2 };
  }

  function setLeftHead(s, animate) {
    const apply = () => {
      leftIcon.innerHTML = ICONS[s.icon] || '';
      leftH2.textContent = s.title;
      leftBack.hidden = s.id === 'home' || IS404;
      colLabels(leftCols, leftColDefs(s));
      leftTitle.classList.remove('fade'); leftCols.classList.remove('fade');
    };
    if (!animate || reduced()) return apply();
    leftTitle.classList.add('fade'); leftCols.classList.add('fade');
    setTimeout(apply, 160);
  }

  function setHit(r) {
    const it = r.data.item;
    const hit = r.hit;
    ['href', 'target', 'rel', 'role', 'tabindex', 'aria-disabled', 'aria-hidden'].forEach((a) => hit.removeAttribute(a));
    hit.hidden = false;
    r.el.classList.toggle('live', isLive(it));
    if (!it) { hit.hidden = true; return; }
    if (!r.data.first) { hit.setAttribute('aria-hidden', 'true'); hit.setAttribute('tabindex', '-1'); }
    if (it.href) {
      hit.setAttribute('href', it.href);
      if (it.target) { hit.setAttribute('target', it.target); hit.setAttribute('rel', 'noopener'); }
    } else if (it.copy) {
      hit.setAttribute('role', 'button');
      if (r.data.first) hit.setAttribute('tabindex', '0');
    } else {
      hit.setAttribute('role', 'link');
      hit.setAttribute('aria-disabled', 'true');
      if (r.data.first) hit.setAttribute('tabindex', '0');
    }
  }

  function labelFor(r, side) {
    const d = r.data;
    if (!d.item) return '';
    if (side === 'right') return `${d.item.label}. Gate ${d.gate}. ${statusText(r).toLowerCase()}`;
    return d.first ? d.item.label : '';
  }
  function setLabel(r, side) {
    r.hit.textContent = '';
    r.hit.append(h('span', 'sr', null, labelFor(r, side)));
  }

  function hoverItem(rows, r, on, side) {
    const it = r.data.item;
    if (!isLive(it)) return;
    const group = rows.filter((x) => x.data.item === it);
    group.forEach((x) => x.el.classList.toggle('hover', on));
    if (on) group.forEach((x, k) => x.place.pulse(16, k * 60));
    if (side === 'right') { it.hover = on; refreshStatus(r); }
  }

  function activate(r, side, e) {
    const it = r.data.item;
    if (!it) return;
    if (it.copy) {
      e.preventDefault();
      const done = () => {
        r.place.write(it.done || 'COPIED', { stagger: 22 });
        clearTimeout(it.copyT);
        it.copyT = setTimeout(() => { if (r.data.item === it) r.place.write(r.data.place, { stagger: 22 }); }, 2200);
      };
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
    if (!it.href) { e.preventDefault(); if (side === 'right') flash(r, 'TBA', 1600); return; }
    const sid = screenFromHref(it.href);
    if (sid) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      go(state.screen === sid ? 'home' : sid);
      return;
    }
    if (side === 'right') flash(r, 'DEPARTED', 4000);
  }

  function buildRow(r, side, rows) {
    const compact = state.mode === 'compact';
    r.el = h('li', 'row');
    const tc = h('span', 'cell c-time'); r.time.mount(tc, 2); r.el.append(tc);
    const pc = h('span', 'cell c-place'); r.place.mount(pc); r.el.append(pc);
    r.lampEl = null;
    if (side === 'left') {
      const cc = h('span', 'cell c-code'); r.code.mount(cc); r.el.append(cc);
      r.lampEl = h('span', 'lamp ' + (r.data.lamp || ''), { 'aria-hidden': 'true' }); r.el.append(r.lampEl);
    } else if (!compact) {
      const gc = h('span', 'cell c-gate'); r.gate.mount(gc); r.el.append(gc);
      const sc = h('span', 'cell c-status'); r.status.mount(sc); r.el.append(sc);
    } else {
      r.gate.unmount(); r.status.unmount();
      r.lampEl = h('span', 'lamp', { 'aria-hidden': 'true' }); r.el.append(r.lampEl);
    }
    r.hit = h('a', 'hit');
    r.el.append(r.hit);
    setHit(r); setLabel(r, side);
    r.hit.addEventListener('mouseenter', () => hoverItem(rows, r, true, side));
    r.hit.addEventListener('mouseleave', () => hoverItem(rows, r, false, side));
    r.hit.addEventListener('focus', () => hoverItem(rows, r, true, side));
    r.hit.addEventListener('blur', () => hoverItem(rows, r, false, side));
    r.hit.addEventListener('click', (e) => activate(r, side, e));
    r.hit.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !r.hit.hasAttribute('href')) { e.preventDefault(); activate(r, side, e); }
    });
    return r.el;
  }

  function build() {
    root.textContent = '';
    root.dataset.mode = state.mode;
    const s = screens[state.screen] || screens.home;

    // header
    const nameA = h('a', 'name', { href: '/', 'aria-label': NAME === 'HUNG NGUYEN' ? 'Hung Nguyen' : NAME });
    F.name.mount(nameA);
    nameA.addEventListener('click', (e) => {
      if (IS404) return;
      e.preventDefault();
      if (state.screen !== 'home') go('home');
      else state.forceHNGN = true;
    });
    root.append(h('header', 'head', null, [h('h1', 'h1', null, nameA)]));

    // left panel
    const panels = h('div', 'panels');
    const lp = h('section', 'panel panel-left', { 'aria-labelledby': 'pt-left' });
    const lt = panelTitle('left', s.title, s.icon);
    leftTitle = lt.wrap; leftIcon = lt.ic; leftH2 = lt.h2;
    leftBack = h('button', 'back', { type: 'button' }, '← ' + (screens.home ? screens.home.title : 'Back'));
    leftBack.addEventListener('click', () => go('home'));
    leftTitle.append(leftBack);
    leftCols = h('div', 'cols', { 'aria-hidden': 'true' });
    const lrows = h('ol', 'rows', { 'aria-live': 'polite' });
    left.forEach((r) => lrows.append(buildRow(r, 'left', left)));
    lp.append(leftTitle, leftCols, lrows);
    setLeftHead(s, false);

    // right panel
    const rp = h('nav', 'panel panel-right', { 'aria-labelledby': 'pt-right' });
    const rt = panelTitle('right', nav.title, 'dep');
    const rcols = h('div', 'cols', { 'aria-hidden': 'true' });
    colLabels(rcols, rightColDefs());
    const rrows = h('ol', 'rows');
    right.forEach((r) => rrows.append(buildRow(r, 'right', right)));
    rp.append(rt.wrap, rcols, rrows);
    right.forEach((r) => applyTone(r, r.status.text));

    panels.append(lp, rp);
    root.append(panels);

    // bottom bar: ticker + sound, then the local clock
    const foot = h('div', 'foot');
    const tk = h('div', 'ticker');
    const tiles = h('span', 'tk-tiles', { 'aria-hidden': 'true' });
    const snd = h('button', 'snd', { type: 'button', 'aria-pressed': String(Sound.on), 'aria-label': 'Flap sound', title: 'Flap sound' });
    snd.append(svg('<path d="M4 9h4l5-4v14l-5-4H4z"/><path class="on-only" d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/><path class="off-only" d="M17 9.5l5 5M22 9.5l-5 5"/>'));
    snd.addEventListener('click', () => { Sound.set(!Sound.on); snd.setAttribute('aria-pressed', String(Sound.on)); });
    tk.append(h('span', 'tk-lbl', { 'aria-hidden': 'true' }, 'INFO'), tiles, snd);
    const cityCell = h('span', 'cell c-city', { 'aria-hidden': 'true' });
    F.city.mount(cityCell);
    const timeCell = h('span', 'cell c-time', { 'aria-hidden': 'true' });
    F.clock.mount(timeCell, 2);
    const clock = h('div', 'clock', null, [
      h('span', 'clock-lbl', { 'aria-hidden': 'true' }, 'Local time'),
      cityCell, timeCell,
      h('span', 'sr', null, 'Local time in Ho Chi Minh City'),
    ]);
    foot.append(tk, clock);
    root.append(foot);
    state.tickerEl = tiles;
  }

  function fitTicker() {
    const el = state.tickerEl;
    if (!el) return;
    el.textContent = '';
    const n = Math.max(6, Math.floor(el.clientWidth / state.tw));
    const f = new Field(n, 'center');
    f.chars = f.fmt(state.tickerMsg.length <= n ? state.tickerMsg : '');
    f.mount(el);
    F.ticker = f;
  }

  // ---------- layout ----------
  const UNITS = { wide: 59, stack: 33.5, compact: 25 };
  function layout() {
    const vw = document.documentElement.clientWidth;
    const gutter = vw < 640 ? 12 : 24;
    const avail = Math.min(vw - 2 * gutter, 1800);
    let mode = 'wide';
    let tw = avail / UNITS.wide;
    if (tw < 18.5) {
      mode = vw < 640 ? 'compact' : 'stack';
      tw = avail / UNITS[mode];
    }
    tw = Math.max(10, Math.floor(Math.min(tw, 30)));
    const setVars = () => {
      const hw = state.mode === 'compact'
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
    if (state.tickerEl) state.tickerEl.textContent = '';
    // refine from the real size: everything scales with --tw
    const w = Math.max(root.offsetWidth, root.scrollWidth);
    let exact = tw * avail / w;
    // stacked boards are tall: shrink to fit the screen height where that stays readable
    if (mode === 'stack') exact = Math.min(exact, Math.max(18, tw * (innerHeight - 2 * gutter) / root.offsetHeight));
    const next = Math.max(10, Math.floor(Math.min(exact, 30)));
    if (next !== tw) { tw = next; setVars(); }
    fitTicker();
  }

  // ---------- screens ----------
  function show(id, { boot = false } = {}) {
    const s = screens[id] || screens.home;
    if (!s) return;
    const changed = s.id !== state.screen;
    state.screen = s.id;
    if (!boot && !changed) return;
    if (!boot) setLeftHead(s, true);
    const cap = boot ? CFG.bootCap : CFG.cap;
    left.forEach((r, i) => {
      const d = s.rows[i] || EMPTY;
      r.data = d;
      const delay = boot ? 700 + i * 170 : 60 + i * 90;
      r.time.write(d.time, { stagger: 45, delay, cap });
      r.place.write(d.place, { stagger: 24, delay, cap });
      r.code.write(d.code, { stagger: 45, delay: delay + 200, cap });
      if (r.lampEl) {
        r.lampEl.className = 'lamp';
        setTimeout(() => { if (r.data === d && r.lampEl) r.lampEl.className = 'lamp ' + d.lamp; }, reduced() ? 0 : delay + 500);
      }
      if (r.hit) { setHit(r); setLabel(r, 'left'); r.el.classList.remove('hover'); }
    });
    right.forEach((r, i) => {
      if (!boot && r.data.item) { r.place.pulse(14, 120 + i * 80); r.time.pulse(30, 120 + i * 80); }
      refreshStatus(r, { delay: boot ? 0 : 200 + i * 80 });
      if (r.hit) setLabel(r, 'right');
    });
    setTitle();
  }
  function setTitle() {
    const s = screens[state.screen];
    if (state.screen === 'home' || !s) document.title = state.short && !IS404 ? state.short : TITLE;
    else document.title = `${s.title} · ${TITLE}`;
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

  async function timeLoop(r) {
    for (;;) {
      await sleep(rand(CFG.times.every));
      if (reduced()) continue;
      writeTime(r.time, nonsenseTime(r.time.chars.join('')));
    }
  }

  function clockNow() {
    try {
      return new Intl.DateTimeFormat('en-GB', { timeZone: CFG.tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .format(new Date()).replace(/\D/g, '');
    } catch (e) {
      const d = new Date(Date.now() + 7 * 3600e3);
      return String(d.getUTCHours()).padStart(2, '0') + String(d.getUTCMinutes()).padStart(2, '0');
    }
  }

  async function tickerLoop() {
    if (!MESSAGES.length) return;
    for (;;) {
      await sleep(CFG.tickerMs);
      if (reduced() || !F.ticker) continue;
      const n = F.ticker.w;
      const fits = MESSAGES.filter((m) => m.length <= n);
      if (fits.length < 2) continue;
      do { state.tickerIdx = (state.tickerIdx + 1) % MESSAGES.length; } while (MESSAGES[state.tickerIdx].length > n);
      state.tickerMsg = MESSAGES[state.tickerIdx];
      F.ticker.write(state.tickerMsg, { stagger: 35 });
    }
  }

  // ---------- boot ----------
  function boot() {
    const initial = screens[location.hash.slice(1)] ? location.hash.slice(1) : 'home';
    state.screen = initial;
    right.forEach((r) => { r.data.item && (r.data.item.flash = null); });
    layout();

    F.name.write(NAME, { stagger: 70, delay: 150, cap: CFG.bootCap });
    F.city.write(CFG.city, { stagger: 40, delay: 2000, cap: CFG.bootCap });
    F.clock.write(clockNow(), { stagger: 60, delay: 2400, cap: CFG.bootCap });
    show(initial, { boot: true });
    right.forEach((r, i) => {
      const d = r.data;
      if (!d.item) return;
      const delay = 1300 + i * 170;
      writeTime(r.time, nonsenseTime(''), { delay, cap: CFG.bootCap });
      r.place.write(d.place, { stagger: 24, delay, cap: CFG.bootCap });
      r.gate.write(d.gate, { delay: delay + 150, cap: CFG.bootCap });
      refreshStatus(r, { delay: delay + 250, cap: CFG.bootCap });
    });
    state.tickerMsg = MESSAGES[0] || '';
    if (F.ticker) F.ticker.write(state.tickerMsg.length <= F.ticker.w ? state.tickerMsg : '', { stagger: 35, delay: 2200, cap: CFG.bootCap });

    setTimeout(() => {
      nameLoop();
      right.forEach((r) => r.data.item && timeLoop(r));
      tickerLoop();
    }, reduced() ? 0 : 3600);

    setInterval(() => {
      const t = clockNow();
      if (t !== F.clock.chars.join('')) F.clock.write(t, { stagger: 60 });
    }, 1000);

    let raf = 0;
    addEventListener('resize', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(layout); });
    addEventListener('popstate', route);
    addEventListener('hashchange', route);
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && state.screen !== 'home') go('home'); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  }

  boot();
})();
