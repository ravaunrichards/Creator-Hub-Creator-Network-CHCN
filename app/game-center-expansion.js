/* =============================================================================
 * Creator Hub – Game Center EXPANSION (game-center-expansion.js)
 * -----------------------------------------------------------------------------
 * Adds a batch of ORIGINAL, fully-offline, genuinely-playable games on top of
 * the existing Game Center (game-center.js + game-center-plus.js). All names,
 * characters, worlds, art, audio and code are first-party and original – these
 * are genre/feature-inspired games, NOT copies of any commercial title.
 *
 * Self-contained: own stage harness, own AI, keyboard + touch controls, a
 * draggable floating game controller, per-game settings, pause/resume/restart,
 * fullscreen and save/restore where it makes sense. Loaded AFTER the two older
 * game files; it takes over the lobby so every prior game still opens through
 * its original launcher (GCshow / GCPlusStart).
 * ========================================================================== */
(function (global) {
  'use strict';
  if (global.__gcx) return; global.__gcx = true;

  var R = global.CHCNreg || {};
  var esc = R.esc || function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var toast = R.toast || function (m) { try { global.showToast ? global.showToast(m) : console.log(m); } catch (e) {} };

  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  // ---- per-game settings (difficulty / music / sfx / volume / vibration) ----
  var SET = LS.get('chcn_gcx_settings', {});
  function gset(key) {
    if (!SET[key]) SET[key] = { diff: 'normal', music: true, sfx: true, vol: 0.7, vibe: true };
    return SET[key];
  }
  function saveSet() { LS.set('chcn_gcx_settings', SET); }
  function best(key) { return LS.get('chcn_gcx_best_' + key, 0) || 0; }
  function setBest(key, v) { if (v > best(key)) LS.set('chcn_gcx_best_' + key, v); }
  function diffNum(key) { var d = gset(key).diff; return d === 'easy' ? 0 : d === 'hard' ? 2 : 1; }

  // ---- audio (WebAudio, offline) ----
  var _AC = null;
  function ac() { if (!_AC) { try { _AC = new (global.AudioContext || global.webkitAudioContext)(); } catch (e) {} } if (_AC && _AC.state === 'suspended') { try { _AC.resume(); } catch (e) {} } return _AC; }
  function sfx(freq, dur, type, gain) {
    var g = ACTIVE && gset(ACTIVE.key); if (g && !g.sfx) return;
    var c = ac(); if (!c) return;
    try {
      var o = c.createOscillator(), gg = c.createGain();
      o.type = type || 'square'; o.frequency.value = freq;
      var v = (g ? g.vol : 0.7) * (gain == null ? 0.2 : gain);
      o.connect(gg); gg.connect(c.destination);
      var t = c.currentTime; gg.gain.setValueAtTime(0.0001, t);
      gg.gain.exponentialRampToValueAtTime(Math.max(0.0001, v), t + 0.01);
      gg.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.12));
      o.start(t); o.stop(t + (dur || 0.12) + 0.02);
    } catch (e) {}
  }
  function vibrate(ms) { var g = ACTIVE && gset(ACTIVE.key); if (g && !g.vibe) return; try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

  // ---- full catalogue: legacy (GCshow) + plus (GCPlusStart) + new (GCXStart) --
  var LEGACY = [
    { k: 'memory', emo: '\uD83E\uDDE0', name: 'Memory Match', cat: 'puzzle', go: 'GCshow' },
    { k: 'mines', emo: '\uD83D\uDCA3', name: 'Mines', cat: 'puzzle', go: 'GCshow' },
    { k: 'merge', emo: '\uD83D\uDD22', name: 'Number Merge', cat: 'puzzle', go: 'GCshow' },
    { k: 'snake', emo: '\uD83D\uDC0D', name: 'Snake', cat: 'arcade', go: 'GCshow' },
    { k: 'simon', emo: '\uD83C\uDFB5', name: 'Simon Says', cat: 'arcade', go: 'GCshow' },
    { k: 'math', emo: '\u2795', name: 'Math Challenge', cat: 'edu', go: 'GCshow', edu: true },
    { k: 'scramble', emo: '\uD83D\uDD24', name: 'Word Scramble', cat: 'edu', go: 'GCshow', edu: true },
    { k: 'capitals', emo: '\uD83C\uDF0D', name: 'Capital Cities', cat: 'edu', go: 'GCshow', edu: true },
    { k: 'typing', emo: '\u2328\uFE0F', name: 'Typing Test', cat: 'edu', go: 'GCshow', edu: true },
    { k: 'runner', emo: '\uD83C\uDFC3', name: 'Lane Runner', cat: 'arcade', go: 'GCPlusStart' },
    { k: 'catch', emo: '\u2B50', name: 'Star Catch', cat: 'arcade', go: 'GCPlusStart' }
  ];
  // NEW games (engine in this file). cat drives the lobby section.
  var NEW = [
    { k: 'pursuit',  emo: '\uD83D\uDE94', name: 'CHCN: Street Pursuit',    cat: 'racing',  go: 'GCXStart', desc: 'Street racing with police-style pursuit, traffic and upgrades.' },
    { k: 'nightshift', emo: '\uD83C\uDF03', name: 'CHCN: Nightshift Racing', cat: 'racing', go: 'GCXStart', desc: 'Night circuit racing – overtake rivals before time runs out.' },
    { k: 'moto',     emo: '\uD83C\uDFCD\uFE0F', name: 'CHCN: Velocity Moto', cat: 'racing', go: 'GCXStart', desc: 'Motorbike traffic weaving with a nitro boost.' },
    { k: 'garden',   emo: '\uD83C\uDF31', name: 'CHCN: Garden Guardians',  cat: 'strategy', go: 'GCXStart', desc: 'Lane defence: grow guardians, bank energy, stop the waves.' },
    { k: 'forge',    emo: '\uD83E\uDD4A', name: 'CHCN: Battle Forge',      cat: 'fighting', go: 'GCXStart', desc: '1v1 fighter: punch, kick, block, combos vs a thinking AI.' },
    { k: 'strikers', emo: '\u26BD',       name: 'CHCN: World Strikers',    cat: 'sports',   go: 'GCXStart', desc: 'Top-down football vs a tactical CPU team.' },
    { k: 'skybound', emo: '\uD83E\uDE82', name: 'CHCN: Skybound Adventure', cat: 'platformer', go: 'GCXStart', desc: 'Jump-and-run across floating worlds, collect, beat the level.' },
    { k: 'void',     emo: '\uD83D\uDEF8', name: 'CHCN: Void Frontier',     cat: 'shooter',  go: 'GCXStart', desc: 'Sci-fi arena shooter – survive escalating alien waves.' },
    { k: 'chess',    emo: '\u265F\uFE0F', name: 'CHCN: Grandmaster Canvas', cat: 'board',   go: 'GCXStart', desc: 'Full chess rules engine with a real evaluating AI.' },
    { k: 'cards',    emo: '\uD83C\uDCCF', name: 'CHCN: Card Arena',        cat: 'card',     go: 'GCXStart', desc: 'Strategic card duel against an adaptive AI.' }
  ];
  var CATALOG = LEGACY.concat(NEW);
  var SECTIONS = [
    { id: 'all', label: 'All games' },
    { id: 'racing', label: '\uD83C\uDFC1 Racing & Driving' },
    { id: 'fighting', label: '\uD83E\uDD4A Fighting' },
    { id: 'shooter', label: '\uD83D\uDEF8 Sci-Fi & Shooter' },
    { id: 'platformer', label: '\uD83E\uDE82 Platformer' },
    { id: 'sports', label: '\u26BD Sports' },
    { id: 'strategy', label: '\uD83C\uDF31 Strategy & Defence' },
    { id: 'board', label: '\u265F\uFE0F Board & Chess' },
    { id: 'card', label: '\uD83C\uDCCF Card' },
    { id: 'puzzle', label: '\uD83E\uDDE9 Puzzle' },
    { id: 'arcade', label: '\uD83D\uDD79\uFE0F Arcade' },
    { id: 'edu', label: '\uD83C\uDF93 Educational' }
  ];
  var curFilter = 'all';

  // ---------------------------------------------------------------- CSS ----
  function injectCSS() {
    if (document.getElementById('gcx-css')) return;
    var s = document.createElement('style'); s.id = 'gcx-css';
    s.textContent = [
      '.gcx-filter{display:flex;flex-wrap:wrap;gap:8px;margin:6px 2px 14px;}',
      '.gcx-fbtn{border:1px solid #d6d3ef;background:#fff;color:#4c1d95;border-radius:999px;padding:7px 14px;font-size:13px;font-weight:700;cursor:pointer;}',
      '.gcx-fbtn.on{background:#7c3aed;color:#fff;border-color:#7c3aed;}',
      '.gcx-badge{display:inline-block;font-size:10px;font-weight:700;border-radius:20px;padding:1px 8px;margin-top:4px;}',
      '.gcx-badge.new{color:#3730a3;background:#e0e7ff;} .gcx-badge.edu{color:#166534;background:#dcfce7;}',
      '.gcx-stage{position:relative;background:#0b1020;border-radius:12px;overflow:hidden;touch-action:none;display:flex;justify-content:center;}',
      '.gcx-stage canvas{display:block;width:100%;height:auto;max-width:100%;touch-action:none;}',
      '.gcx-stage.fs{position:fixed;inset:0;z-index:9000;border-radius:0;background:#000;align-items:center;}',
      '.gcx-stage.fs canvas{max-height:100%;width:auto;height:100%;}',
      '.gcx-hud{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin:10px 0;}',
      '.gcx-score{font-weight:800;color:#0f172a;}',
      '.gcx-ctrls{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0;}',
      '.gcx-btn{border:1px solid #d6d3ef;background:#fff;border-radius:10px;padding:9px 14px;font-weight:700;cursor:pointer;font-size:14px;}',
      '.gcx-btn.pri{background:#7c3aed;color:#fff;border-color:#7c3aed;} .gcx-btn:active{transform:scale(.96);}',
      '.gcx-note{background:#f8f7ff;border-left:3px solid #7c3aed;border-radius:8px;padding:10px 12px;margin:8px 0;font-size:13px;color:#475569;line-height:1.5;}',
      '.gcx-over{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(11,16,32,.82);color:#fff;text-align:center;padding:16px;z-index:5;}',
      '.gcx-over h3{margin:0 0 6px;font-size:22px;} .gcx-over p{margin:0 0 14px;max-width:320px;}',
      '.gcx-pad{position:absolute;bottom:10px;left:0;right:0;display:flex;justify-content:space-between;padding:0 14px;pointer-events:none;z-index:6;}',
      '.gcx-pad .side{display:flex;gap:10px;pointer-events:auto;}',
      '.gcx-pad button{width:58px;height:58px;border-radius:50%;border:none;background:rgba(255,255,255,.22);color:#fff;font-size:22px;font-weight:800;cursor:pointer;user-select:none;-webkit-user-select:none;}',
      '.gcx-pad button:active{background:rgba(124,58,237,.75);}',
      '.gcx-fab{position:fixed;z-index:9500;width:52px;height:52px;border-radius:50%;background:#7c3aed;color:#fff;border:none;box-shadow:0 6px 18px rgba(0,0,0,.3);font-size:22px;cursor:pointer;display:none;align-items:center;justify-content:center;touch-action:none;}',
      '.gcx-fab.show{display:flex;}',
      '.gcx-fabmenu{position:fixed;z-index:9600;background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.25);padding:8px;display:none;flex-direction:column;gap:4px;min-width:150px;}',
      '.gcx-fabmenu.show{display:flex;} .gcx-fabmenu button{text-align:left;border:none;background:#f8f7ff;border-radius:8px;padding:9px 12px;font-size:13px;font-weight:700;color:#4c1d95;cursor:pointer;} .gcx-fabmenu button:hover{background:#ede9fe;}',
      '.gcx-modal{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9800;display:flex;align-items:center;justify-content:center;padding:16px;}',
      '.gcx-modal .box{background:#fff;border-radius:14px;max-width:420px;width:100%;max-height:85vh;overflow:auto;padding:20px;}',
      '.gcx-modal h3{margin:0 0 12px;} .gcx-modal .close{float:right;cursor:pointer;font-size:22px;color:#64748b;}',
      '.gcx-srow{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #f1f5f9;gap:10px;}',
      '.gcx-srow select,.gcx-srow input[type=range]{max-width:150px;}'
    ].join('');
    document.head.appendChild(s);
  }

  // ---------------------------------------------------------- lobby --------
  function tileHtml(g) {
    var badge = g.go === 'GCXStart' ? '<div class="gcx-badge new">New</div>'
              : (g.edu ? '<div class="gcx-badge edu">Educational</div>' : '');
    return '<div class="gc-tile" data-cat="' + g.cat + '" onclick="' + g.go + '(\'' + g.k + '\')">' +
      '<div class="emo">' + g.emo + '</div><div>' + esc(g.name) + '</div>' + badge + '</div>';
  }
  function lobby() {
    injectCSS();
    var el = document.getElementById('page-games'); if (!el) return;
    var h = '<div class="gc-wrap"><div class="gc-hero"><h1>\uD83C\uDFAE Game Center</h1>' +
      '<p>Original, offline games – racing, fighting, sports, strategy, chess, cards, platformers, sci-fi and brain-training. All first-party; no internet needed. Pick a category to filter.</p></div>';
    h += '<div class="gcx-filter">';
    SECTIONS.forEach(function (c) {
      if (c.id !== 'all' && !CATALOG.some(function (g) { return g.cat === c.id; })) return;
      h += '<button type="button" class="gcx-fbtn' + (c.id === curFilter ? ' on' : '') + '" onclick="GCXFilter(\'' + c.id + '\')">' + c.label + '</button>';
    });
    h += '</div>';
    SECTIONS.forEach(function (c) {
      if (c.id === 'all') return;
      var items = CATALOG.filter(function (g) { return g.cat === c.id; });
      if (!items.length) return;
      var show = (curFilter === 'all' || curFilter === c.id);
      h += '<div class="gcx-cat-sec" data-cat="' + c.id + '" style="' + (show ? '' : 'display:none;') + '">';
      h += '<div class="gc-sec-title">' + c.label + '</div><div class="gc-grid">';
      items.forEach(function (g) { h += tileHtml(g); });
      h += '</div></div>';
    });
    h += '<div id="gcPanel"></div></div>';
    el.innerHTML = h;
  }
  global.GCXFilter = function (cat) {
    curFilter = cat;
    var secs = document.querySelectorAll('.gcx-cat-sec');
    for (var i = 0; i < secs.length; i++) { var c = secs[i].getAttribute('data-cat'); secs[i].style.display = (cat === 'all' || cat === c) ? '' : 'none'; }
    var btns = document.querySelectorAll('.gcx-fbtn');
    for (var j = 0; j < btns.length; j++) btns[j].classList.remove('on');
    var a = document.querySelector('.gcx-fbtn[onclick*="\'' + cat + '\'"]'); if (a) a.classList.add('on');
  };
  // take over the lobby renderer (overrides game-center-plus)
  global.renderGames = lobby;
  (function reroute() {
    if (typeof global.navigate === 'function' && !global.__gcxNav) {
      global.__gcxNav = true; var orig = global.navigate;
      global.navigate = function (p) { var r = orig.apply(this, arguments); if (p === 'games') { try { lobby(); } catch (e) {} } return r; };
    }
  })();

  // =======================================================================
  //  STAGE HARNESS + GAME REGISTRY
  // =======================================================================
  var MODULES = {};          // key -> { name, kind:'raf'|'dom', help, controls, make }
  var ACTIVE = null;         // live game instance

  function catName(key) { var e = CATALOG.filter(function (g) { return g.k === key; })[0]; return e ? e.name : key; }
  function catEmo(key) { var e = CATALOG.filter(function (g) { return g.k === key; })[0]; return e ? e.emo : '\uD83C\uDFAE'; }

  global.GCXStart = function (key) {
    var mod = MODULES[key]; if (!mod) { toast('That game is still loading.'); return; }
    stopActive();
    injectCSS();
    var panel = document.getElementById('gcPanel');
    if (!panel) { lobby(); panel = document.getElementById('gcPanel'); }
    if (!panel) return;
    ac(); // unlock audio on user gesture
    var isRaf = mod.kind !== 'dom';
    var head = '<div class="gc-card"><div class="gc-bar"><h3 style="margin:0;">' + catEmo(key) + ' ' + esc(catName(key)) + '</h3>' +
      '<span class="gcx-score" id="gcxBest">Best: ' + best(key) + '</span></div>' +
      '<div class="gcx-note">' + esc(mod.help || '') + '</div>';
    var ctrls = '<div class="gcx-ctrls">' +
      (isRaf ? '<button type="button" class="gcx-btn pri" id="gcxPause" onclick="GCXPause()">\u23F8\uFE0F Pause</button>' : '') +
      '<button type="button" class="gcx-btn" onclick="GCXRestart()">\u21BB Restart</button>' +
      '<button type="button" class="gcx-btn" onclick="GCXFullscreen()">\u26F6 Fullscreen</button>' +
      '<button type="button" class="gcx-btn" onclick="GCXSettings()">\u2699\uFE0F Settings</button>' +
      '<button type="button" class="gcx-btn" onclick="GCXQuit()">\u2715 Back to games</button></div>';
    if (isRaf) {
      panel.innerHTML = head +
        '<div class="gcx-hud"><span class="gcx-score" id="gcxScore">Score: 0</span><span class="gcx-score" id="gcxInfo"></span></div>' +
        '<div class="gcx-stage" id="gcxStage"><canvas id="gcxCanvas" width="' + (mod.w || 360) + '" height="' + (mod.h || 540) + '"></canvas></div>' +
        ctrls + '</div>';
    } else {
      panel.innerHTML = head + '<div class="gcx-stage" id="gcxStage" style="background:transparent;display:block;"><div id="gcxDom"></div></div>' + ctrls + '</div>';
    }
    var cv = document.getElementById('gcxCanvas');
    ACTIVE = {
      key: key, kind: mod.kind || 'raf', mod: mod, raf: 0, running: true, paused: false, over: false,
      score: 0, last: 0, keys: {}, btn: {}, cv: cv, ctx: cv ? cv.getContext('2d') : null,
      w: cv ? cv.width : 0, h: cv ? cv.height : 0
    };
    bindKeys();
    showFab(true);
    if (isRaf) {
      ACTIVE.inst = mod.make(ACTIVE);
      bindPointer();
      ACTIVE.raf = requestAnimationFrame(frame);
    } else {
      ACTIVE.inst = mod.make(ACTIVE, document.getElementById('gcxDom'));
    }
    try { panel.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
  };

  function stopActive() {
    if (ACTIVE) {
      ACTIVE.running = false; if (ACTIVE.raf) cancelAnimationFrame(ACTIVE.raf);
      try { if (ACTIVE.inst && ACTIVE.inst.destroy) ACTIVE.inst.destroy(); } catch (e) {}
    }
    ACTIVE = null; showFab(false); exitFs();
  }
  global.GCXQuit = function () { stopActive(); lobby(); };
  global.GCXRestart = function () { if (ACTIVE) { var k = ACTIVE.key; GCXStart(k); } };
  global.GCXPause = function () {
    if (!ACTIVE || ACTIVE.over || ACTIVE.kind !== 'raf') return;
    ACTIVE.paused = !ACTIVE.paused;
    var b = document.getElementById('gcxPause');
    if (ACTIVE.paused) { if (b) b.textContent = '\u25B6\uFE0F Resume'; drawOverlay('\u23F8\uFE0F Paused', 'Your game is frozen.', 'Resume', 'GCXPause'); }
    else { if (b) b.textContent = '\u23F8\uFE0F Pause'; ACTIVE.last = 0; clearOverlay(); }
  };

  function frame(ts) {
    if (!ACTIVE || !ACTIVE.running) return;
    if (!ACTIVE.last) ACTIVE.last = ts;
    var dt = Math.min(0.05, (ts - ACTIVE.last) / 1000); ACTIVE.last = ts;
    if (!ACTIVE.paused && !ACTIVE.over) { try { ACTIVE.inst.update(dt); } catch (e) {} }
    try { ACTIVE.inst.render(); } catch (e) {}
    ACTIVE.raf = requestAnimationFrame(frame);
  }
  function setScore(v) { if (ACTIVE) ACTIVE.score = v; var s = document.getElementById('gcxScore'); if (s) s.textContent = 'Score: ' + v; }
  function setInfo(t) { if (ACTIVE) ACTIVE.info = t; var s = document.getElementById('gcxInfo'); if (s) s.textContent = t; }
  function gameOver(title, msg) {
    if (!ACTIVE || ACTIVE.over) return; ACTIVE.over = true;
    setBest(ACTIVE.key, ACTIVE.score);
    var b = document.getElementById('gcxBest'); if (b) b.textContent = 'Best: ' + best(ACTIVE.key);
    drawOverlay(title || 'Game Over', msg || ('Score: ' + ACTIVE.score), 'Play again', 'GCXRestart');
  }

  // ---- overlays ----
  function drawOverlay(title, msg, btnLabel, btnFn) {
    var st = document.getElementById('gcxStage'); if (!st) return; clearOverlay();
    var o = document.createElement('div'); o.className = 'gcx-over'; o.id = 'gcxOver';
    o.innerHTML = '<h3>' + esc(title) + '</h3><p>' + esc(msg) + '</p>' +
      (btnLabel ? '<button type="button" class="gcx-btn pri" onclick="' + btnFn + '()">' + esc(btnLabel) + '</button>' : '');
    st.appendChild(o);
  }
  function clearOverlay() { var o = document.getElementById('gcxOver'); if (o) o.parentNode.removeChild(o); }

  // ---- fullscreen (CSS fallback + native where available) ----
  var _fs = false;
  global.GCXFullscreen = function () { _fs ? exitFs() : enterFs(); };
  function enterFs() {
    var st = document.getElementById('gcxStage'); if (!st) return; st.classList.add('fs'); _fs = true;
    try { if (st.requestFullscreen) st.requestFullscreen(); else if (st.webkitRequestFullscreen) st.webkitRequestFullscreen(); } catch (e) {}
  }
  function exitFs() {
    var st = document.getElementById('gcxStage'); if (st) st.classList.remove('fs'); _fs = false;
    try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen(); else if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen(); } catch (e) {}
  }
  document.addEventListener('fullscreenchange', function () { if (!document.fullscreenElement) { var st = document.getElementById('gcxStage'); if (st) st.classList.remove('fs'); _fs = false; } });

  // ---- keyboard ----
  function bindKeys() {
    if (global.__gcxKeys) return; global.__gcxKeys = true;
    document.addEventListener('keydown', function (e) {
      if (!ACTIVE || !ACTIVE.running) return;
      ACTIVE.keys[e.key] = true; ACTIVE.keys[e.code] = true;
      if (ACTIVE.inst && ACTIVE.inst.onKey) ACTIVE.inst.onKey(e.key, true);
      if (e.key === ' ' || e.key === 'p' || e.key === 'P') { if (ACTIVE.kind === 'raf') { GCXPause(); } }
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].indexOf(e.key) >= 0) e.preventDefault();
    });
    document.addEventListener('keyup', function (e) {
      if (!ACTIVE) return; ACTIVE.keys[e.key] = false; ACTIVE.keys[e.code] = false;
      if (ACTIVE.inst && ACTIVE.inst.onKey) ACTIVE.inst.onKey(e.key, false);
    });
  }
  // ---- pointer on canvas (tap / drag) + optional on-screen pad ----
  function bindPointer() {
    var cv = ACTIVE.cv; if (!cv) return;
    function rel(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (cv.width / r.width), y: (e.clientY - r.top) * (cv.height / r.height) }; }
    cv.addEventListener('pointerdown', function (e) { e.preventDefault(); var p = rel(e); ACTIVE.ptr = p; if (ACTIVE.inst && ACTIVE.inst.onPointer) ACTIVE.inst.onPointer(p.x, p.y, 'down'); });
    cv.addEventListener('pointermove', function (e) { if (!ACTIVE.ptr) return; var p = rel(e); ACTIVE.ptr = p; if (ACTIVE.inst && ACTIVE.inst.onPointer) ACTIVE.inst.onPointer(p.x, p.y, 'move'); });
    cv.addEventListener('pointerup', function (e) { var p = rel(e); ACTIVE.ptr = null; if (ACTIVE.inst && ACTIVE.inst.onPointer) ACTIVE.inst.onPointer(p.x, p.y, 'up'); });
    cv.addEventListener('pointercancel', function () { ACTIVE.ptr = null; });
  }
  // helper used by raf games to add a 2-side touch pad; names -> onAction
  function addPad(leftBtns, rightBtns) {
    var st = document.getElementById('gcxStage'); if (!st) return;
    var pad = document.createElement('div'); pad.className = 'gcx-pad';
    function side(list) { var h = '<div class="side">'; list.forEach(function (b) { h += '<button type="button" data-act="' + b.a + '">' + b.t + '</button>'; }); return h + '</div>'; }
    pad.innerHTML = side(leftBtns || []) + side(rightBtns || []);
    st.appendChild(pad);
    Array.prototype.forEach.call(pad.querySelectorAll('button'), function (bt) {
      var a = bt.getAttribute('data-act');
      var dn = function (e) { e.preventDefault(); ACTIVE.btn[a] = true; if (ACTIVE.inst && ACTIVE.inst.onAction) ACTIVE.inst.onAction(a, true); };
      var up = function (e) { e.preventDefault(); ACTIVE.btn[a] = false; if (ACTIVE.inst && ACTIVE.inst.onAction) ACTIVE.inst.onAction(a, false); };
      bt.addEventListener('pointerdown', dn); bt.addEventListener('pointerup', up);
      bt.addEventListener('pointerleave', up); bt.addEventListener('pointercancel', up);
    });
  }

  // ---- per-game settings modal ----
  global.GCXSettings = function () {
    if (!ACTIVE) return; var g = gset(ACTIVE.key);
    var m = document.createElement('div'); m.className = 'gcx-modal'; m.id = 'gcxModal';
    m.innerHTML = '<div class="box"><span class="close" onclick="GCXCloseModal()">\u2715</span><h3>\u2699\uFE0F ' + esc(catName(ACTIVE.key)) + ' settings</h3>' +
      '<div class="gcx-srow"><span><strong>Difficulty</strong></span><select onchange="GCXSet(\'diff\',this.value)">' +
        ['easy','normal','hard'].map(function (d) { return '<option value="' + d + '"' + (g.diff === d ? ' selected' : '') + '>' + d.charAt(0).toUpperCase() + d.slice(1) + '</option>'; }).join('') + '</select></div>' +
      '<div class="gcx-srow"><span><strong>Music</strong></span><input type="checkbox"' + (g.music ? ' checked' : '') + ' onchange="GCXSet(\'music\',this.checked)"></div>' +
      '<div class="gcx-srow"><span><strong>Sound effects</strong></span><input type="checkbox"' + (g.sfx ? ' checked' : '') + ' onchange="GCXSet(\'sfx\',this.checked)"></div>' +
      '<div class="gcx-srow"><span><strong>Master volume</strong></span><input type="range" min="0" max="1" step="0.05" value="' + g.vol + '" onchange="GCXSet(\'vol\',parseFloat(this.value))"></div>' +
      '<div class="gcx-srow"><span><strong>Vibration</strong></span><input type="checkbox"' + (g.vibe ? ' checked' : '') + ' onchange="GCXSet(\'vibe\',this.checked)"></div>' +
      '<div style="margin-top:14px;display:flex;gap:8px;"><button type="button" class="gcx-btn" onclick="GCXResetSet()">Reset settings</button>' +
      '<button type="button" class="gcx-btn pri" onclick="GCXCloseModal()">Done</button></div></div>';
    m.addEventListener('click', function (e) { if (e.target === m) GCXCloseModal(); });
    document.body.appendChild(m);
  };
  global.GCXCloseModal = function () { var m = document.getElementById('gcxModal'); if (m) m.parentNode.removeChild(m); };
  global.GCXSet = function (k, v) { if (!ACTIVE) return; gset(ACTIVE.key)[k] = v; saveSet(); if (ACTIVE.inst && ACTIVE.inst.onSetting) try { ACTIVE.inst.onSetting(k, v); } catch (e) {} };
  global.GCXResetSet = function () { if (!ACTIVE) return; SET[ACTIVE.key] = { diff: 'normal', music: true, sfx: true, vol: 0.7, vibe: true }; saveSet(); GCXCloseModal(); GCXSettings(); };

  // ---- draggable floating game controller (FAB) ----
  var fab, fabMenu;
  function buildFab() {
    if (fab) return;
    fab = document.createElement('button'); fab.className = 'gcx-fab'; fab.id = 'gcxFab'; fab.innerHTML = '\uD83C\uDFAE';
    fab.style.left = (LS.get('chcn_gcx_fab', {}).x || (global.innerWidth - 74)) + 'px';
    fab.style.top = (LS.get('chcn_gcx_fab', {}).y || (global.innerHeight - 150)) + 'px';
    document.body.appendChild(fab);
    fabMenu = document.createElement('div'); fabMenu.className = 'gcx-fabmenu'; fabMenu.id = 'gcxFabMenu';
    fabMenu.innerHTML = [
      ['\u23F8\uFE0F Pause / Resume', 'GCXPause'], ['\u21BB Restart', 'GCXRestart'],
      ['\u2699\uFE0F Settings', 'GCXSettings'], ['\u26F6 Fullscreen', 'GCXFullscreen'],
      ['\u2316 Reset button', 'GCXResetFab'], ['\u2715 Exit to Game Centre', 'GCXQuit']
    ].map(function (p) { return '<button type="button" onclick="GCXFabDo(\'' + p[1] + '\')">' + p[0] + '</button>'; }).join('');
    document.body.appendChild(fabMenu);
    var moved = false, sx, sy, ox, oy;
    fab.addEventListener('pointerdown', function (e) { moved = false; sx = e.clientX; sy = e.clientY; ox = fab.offsetLeft; oy = fab.offsetTop; fab.setPointerCapture(e.pointerId); });
    fab.addEventListener('pointermove', function (e) {
      if (sx == null) return; var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
      var nx = Math.max(4, Math.min(global.innerWidth - 56, ox + dx)), ny = Math.max(4, Math.min(global.innerHeight - 56, oy + dy));
      fab.style.left = nx + 'px'; fab.style.top = ny + 'px';
    });
    fab.addEventListener('pointerup', function (e) {
      sx = null; LS.set('chcn_gcx_fab', { x: fab.offsetLeft, y: fab.offsetTop });
      if (!moved) { var open = fabMenu.classList.toggle('show'); if (open) positionMenu(); }
    });
  }
  function positionMenu() {
    var r = fab.getBoundingClientRect(); var left = Math.min(r.left, global.innerWidth - 170);
    var top = r.top - fabMenu.offsetHeight - 8; if (top < 8) top = r.bottom + 8;
    fabMenu.style.left = Math.max(8, left) + 'px'; fabMenu.style.top = top + 'px';
  }
  function showFab(on) { buildFab(); fab.classList.toggle('show', !!on); if (!on && fabMenu) fabMenu.classList.remove('show'); }
  global.GCXFabDo = function (fn) { fabMenu.classList.remove('show'); if (typeof global[fn] === 'function') global[fn](); };
  global.GCXResetFab = function () { fab.style.left = (global.innerWidth - 74) + 'px'; fab.style.top = (global.innerHeight - 150) + 'px'; LS.set('chcn_gcx_fab', { x: fab.offsetLeft, y: fab.offsetTop }); };

  // ---- shared helpers exposed to game modules ----
  var ENV = { sfx: sfx, vibrate: vibrate, diffNum: diffNum, gset: gset, setScore: setScore, setInfo: setInfo, gameOver: gameOver, addPad: addPad, best: best, setBest: setBest, LS: LS, esc: esc, toast: toast };

  // =======================================================================
  //  SHARED ROAD RACER (powers Street Pursuit, Nightshift, Velocity Moto)
  // =======================================================================
  function roadRacer(cfg) {
    return function make(G) {
      var ctx = G.ctx, W = G.w, H = G.h, d = diffNum(G.key);
      var roadX = W * 0.14, roadW = W * 0.72;
      var S = {
        px: W / 2, pw: cfg.moto ? 24 : 34, ph: cfg.moto ? 46 : 58,
        vx: 0, dist: 0, speed: 240 + d * 70, baseSpeed: 240 + d * 70,
        lives: 3, inv: 0, dash: [], cars: [], tokens: [],
        spawnT: 0, tokT: 1.2, nitro: 100, nitroOn: false, lineOff: 0, rivalsPassed: 0,
        police: cfg.police ? { x: W / 2, y: H + 80, active: false, t: 6 - d } : null,
        timeLeft: cfg.goalTime || 0
      };
      G._s = S;
      ENV.addPad([{ a: 'left', t: '\u25C0' }, { a: 'right', t: '\u25B6' }],
        cfg.nitro ? [{ a: 'nitro', t: '\u26A1' }] : [{ a: 'up', t: '\u25B2' }, { a: 'down', t: '\u25BC' }]);
      function spawnCar() {
        var x = roadX + 20 + Math.random() * (roadW - 40);
        S.cars.push({ x: x, y: -70, w: 32, h: 56, vy: S.speed * (0.25 + Math.random() * 0.2), c: ['#ef4444','#22d3ee','#f59e0b','#a78bfa','#34d399'][Math.floor(Math.random() * 5)], rival: cfg.goalTime && Math.random() < 0.5 });
      }
      function hit(a, b) { return Math.abs(a.x - b.x) < (a.w + b.w) / 2 - 6 && Math.abs(a.y - b.y) < (a.h + b.h) / 2 - 6; }
      return {
        update: function (dt) {
          var left = G.keys['ArrowLeft'] || G.keys['a'] || G.btn.left;
          var right = G.keys['ArrowRight'] || G.keys['d'] || G.btn.right;
          var up = G.keys['ArrowUp'] || G.keys['w'] || G.btn.up;
          var down = G.keys['ArrowDown'] || G.keys['s'] || G.btn.down;
          S.vx += ((right ? 1 : 0) - (left ? 1 : 0)) * 1400 * dt;
          S.vx *= 0.86; S.px += S.vx * dt;
          if (S.px < roadX + S.pw / 2) { S.px = roadX + S.pw / 2; S.vx = 0; }
          if (S.px > roadX + roadW - S.pw / 2) { S.px = roadX + roadW - S.pw / 2; S.vx = 0; }
          // speed control / nitro
          S.nitroOn = cfg.nitro ? (G.keys[' '] || G.btn.nitro) && S.nitro > 0 : false;
          if (cfg.nitro) { if (S.nitroOn) { S.nitro = Math.max(0, S.nitro - 40 * dt); } else S.nitro = Math.min(100, S.nitro + 12 * dt); }
          var tgt = S.baseSpeed + (up ? 160 : 0) - (down ? 120 : 0) + (S.nitroOn ? 260 : 0);
          S.speed += (tgt - S.speed) * Math.min(1, dt * 3);
          S.dist += S.speed * dt; S.lineOff = (S.lineOff + S.speed * dt) % 60;
          ENV.setScore(Math.floor(S.dist / 10));
          // spawns
          S.spawnT -= dt; var gap = cfg.moto ? 0.75 : 0.95; gap -= d * 0.18;
          if (S.spawnT <= 0) { spawnCar(); S.spawnT = gap + Math.random() * 0.5; }
          S.tokT -= dt; if (S.tokT <= 0) { S.tokens.push({ x: roadX + 20 + Math.random() * (roadW - 40), y: -30, w: 18, h: 18 }); S.tokT = 2 + Math.random() * 2; }
          var pc = { x: S.px, y: H - S.ph / 2 - 14, w: S.pw, h: S.ph };
          // move traffic
          for (var i = S.cars.length - 1; i >= 0; i--) {
            var c = S.cars[i]; c.y += (S.speed - c.vy) * dt;
            if (c.y > H + 80) { S.cars.splice(i, 1); if (c.rival) { S.rivalsPassed++; ENV.sfx(880, 0.1, 'sine'); } continue; }
            if (S.inv <= 0 && hit(pc, c)) { crash(); S.cars.splice(i, 1); }
          }
          for (var j = S.tokens.length - 1; j >= 0; j--) {
            var t = S.tokens[j]; t.y += S.speed * dt;
            if (t.y > H + 30) { S.tokens.splice(j, 1); continue; }
            if (hit(pc, t)) { S.tokens.splice(j, 1); S.dist += 400; if (cfg.nitro) S.nitro = Math.min(100, S.nitro + 25); ENV.sfx(1040, 0.09, 'triangle'); }
          }
          // police AI
          if (S.police) {
            var P = S.police; P.t -= dt;
            if (P.t <= 0 && !P.active) { P.active = true; P.y = H + 60; }
            if (P.active) {
              var aggr = 60 + d * 50;
              P.x += Math.max(-aggr * dt, Math.min(aggr * dt, (S.px - P.x)));
              P.y += (H - S.ph - 90 - P.y) * Math.min(1, dt * (0.5 + d * 0.3));
              if (S.inv <= 0 && Math.abs(P.x - pc.x) < 28 && Math.abs(P.y - pc.y) < 54) crash();
            }
          }
          if (S.inv > 0) S.inv -= dt;
          if (cfg.goalTime) { S.timeLeft -= dt; ENV.setInfo('Time ' + Math.max(0, S.timeLeft).toFixed(0) + 's \u2022 Rivals ' + S.rivalsPassed); if (S.timeLeft <= 0) ENV.gameOver('Time!', 'You overtook ' + S.rivalsPassed + ' rivals \u2022 score ' + Math.floor(S.dist / 10)); }
          else ENV.setInfo('\u2764\uFE0F' + S.lives + (cfg.nitro ? '  \u26A1' + Math.floor(S.nitro) : ''));
          function crash() { S.lives--; S.inv = 1.6; ENV.sfx(140, 0.3, 'sawtooth'); ENV.vibrate(120); if (S.lives <= 0) ENV.gameOver('Crashed!', 'Distance ' + Math.floor(S.dist / 10)); }
        },
        render: function () {
          var night = cfg.night;
          ctx.fillStyle = night ? '#07101f' : '#1f6b2e'; ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = night ? '#111827' : '#3b3f46'; ctx.fillRect(roadX, 0, roadW, H);
          ctx.fillStyle = '#e5e7eb';
          for (var y = -60 + S.lineOff; y < H; y += 60) ctx.fillRect(W / 2 - 3, y, 6, 34);
          ctx.fillStyle = '#fde047'; ctx.fillRect(roadX - 4, 0, 4, H); ctx.fillRect(roadX + roadW, 0, 4, H);
          S.tokens.forEach(function (t) { ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(t.x, t.y, 9, 0, 7); ctx.fill(); });
          S.cars.forEach(function (c) { car(c.x, c.y, c.w, c.h, c.c); });
          if (S.police && S.police.active) { car(S.police.x, S.police.y, 34, 58, '#1e3a8a'); ctx.fillStyle = (Math.floor(Date.now() / 150) % 2) ? '#ef4444' : '#3b82f6'; ctx.fillRect(S.police.x - 10, S.police.y - 30, 20, 5); }
          var blink = S.inv > 0 && Math.floor(Date.now() / 100) % 2;
          if (!blink) { if (cfg.moto) moto(S.px, H - S.ph / 2 - 14); else car(S.px, H - S.ph / 2 - 14, S.pw, S.ph, '#7c3aed'); }
          if (night) { var grd = ctx.createRadialGradient(S.px, H - 120, 20, S.px, H - 120, 200); grd.addColorStop(0, 'rgba(255,255,200,0.18)'); grd.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H); }
          function car(x, y, w, h, col) { ctx.fillStyle = col; rr(x - w / 2, y - h / 2, w, h, 7); ctx.fillStyle = '#0b1020'; rr(x - w / 2 + 4, y - h / 2 + 8, w - 8, h * 0.28, 3); ctx.fillStyle = '#cbd5e1'; rr(x - w / 2 + 4, y + h * 0.12, w - 8, h * 0.22, 3); }
          function moto(x, y) { ctx.fillStyle = '#111827'; rr(x - 10, y - 20, 20, 40, 8); ctx.fillStyle = '#7c3aed'; rr(x - 7, y - 10, 14, 20, 5); ctx.fillStyle = '#e5e7eb'; ctx.beginPath(); ctx.arc(x, y - 26, 7, 0, 7); ctx.fill(); }
          function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.fill(); }
        },
        destroy: function () {}
      };
    };
  }
  MODULES.pursuit = { kind: 'raf', w: 360, h: 540, help: 'Steer with \u25C0 \u25B6 (or A/D / arrows). \u25B2\u25BC change speed. Dodge traffic, grab boost tokens, and shake the pursuit car. 3 lives.', make: roadRacer({ police: true }) };
  MODULES.nightshift = { kind: 'raf', w: 360, h: 540, help: 'Night circuit: overtake as many rival cars as you can before the clock runs out. \u25C0 \u25B6 to steer, \u25B2\u25BC for speed.', make: roadRacer({ night: true, goalTime: 60 }) };
  MODULES.moto = { kind: 'raf', w: 360, h: 540, help: 'Weave your motorbike through traffic. Hold \u26A1 (or Space) for nitro – it refills over time and from boost tokens. 3 lives.', make: roadRacer({ moto: true, nitro: true }) };

  // =======================================================================
  //  GARDEN GUARDIANS – lane defence
  // =======================================================================
  MODULES.garden = { kind: 'raf', w: 420, h: 520, help: 'Tap a guardian in the top bar, then tap a tile to plant it. Sprouts make energy, Shooters fire, Walls block. Stop every crawler before it reaches your garden gate.', make: function (G) {
    var ctx = G.ctx, W = G.w, H = G.h, d = diffNum(G.key);
    var COLS = 9, ROWS = 5, padT = 64, gx = 6, gy = padT, gw = W - 12, gh = H - padT - 6;
    var cw = gw / COLS, ch = gh / ROWS;
    var TYPES = [
      { id: 'sprout', cost: 50, hp: 60, col: '#f59e0b', label: 'Sprout 50' },
      { id: 'shooter', cost: 100, hp: 70, col: '#16a34a', label: 'Shooter 100' },
      { id: 'wall', cost: 50, hp: 240, col: '#6b7280', label: 'Wall 50' }
    ];
    var S = { energy: 75, sel: 'shooter', plants: [], foes: [], shots: [], kills: 0, wave: 1, spawnT: 3, pulse: 0, waveLeft: 6 + d * 2 };
    function cellOf(c, r) { return S.plants.filter(function (p) { return p.c === c && p.r === r; })[0]; }
    function spawnFoe() {
      var r = Math.floor(Math.random() * ROWS);
      S.foes.push({ x: W - 10, r: r, hp: 40 + S.wave * 14 + d * 20, max: 40 + S.wave * 14 + d * 20, sp: 14 + d * 6 + S.wave, chew: 0 });
      S.waveLeft--;
    }
    return {
      onPointer: function (x, y, t) {
        if (t !== 'down') return;
        if (y < padT) { var i = Math.floor(x / (W / TYPES.length)); if (TYPES[i]) { S.sel = TYPES[i].id; ENV.sfx(600, 0.05); } return; }
        var c = Math.floor((x - gx) / cw), r = Math.floor((y - gy) / ch);
        if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return;
        var T = TYPES.filter(function (q) { return q.id === S.sel; })[0];
        if (cellOf(c, r)) { ENV.sfx(160, 0.1, 'sawtooth'); return; }
        if (S.energy < T.cost) { ENV.toast('Not enough energy'); return; }
        S.energy -= T.cost; S.plants.push({ c: c, r: r, type: T.id, hp: T.hp, max: T.hp, t: Math.random() }); ENV.sfx(760, 0.08);
      },
      update: function (dt) {
        S.pulse += dt; if (S.pulse >= 5) { S.pulse = 0; S.energy += 25; }
        // plants act
        S.plants.forEach(function (p) {
          p.t += dt;
          if (p.type === 'sprout' && p.t >= 6) { p.t = 0; S.energy += 25; ENV.sfx(900, 0.05, 'sine'); }
          if (p.type === 'shooter' && p.t >= 1.4) {
            var tgt = S.foes.some(function (f) { return f.r === p.r && f.x > gx + p.c * cw; });
            if (tgt) { p.t = 0; S.shots.push({ x: gx + p.c * cw + cw * 0.7, y: gy + p.r * ch + ch / 2, r: p.r }); ENV.sfx(520, 0.04, 'triangle'); }
          }
        });
        // shots
        for (var i = S.shots.length - 1; i >= 0; i--) { var s = S.shots[i]; s.x += 320 * dt; if (s.x > W) { S.shots.splice(i, 1); continue; }
          for (var k = 0; k < S.foes.length; k++) { var f = S.foes[k]; if (f.r === s.r && Math.abs(f.x - s.x) < 18) { f.hp -= 20; S.shots.splice(i, 1); break; } }
        }
        // foes
        for (var j = S.foes.length - 1; j >= 0; j--) {
          var fo = S.foes[j]; if (fo.hp <= 0) { S.foes.splice(j, 1); S.kills++; ENV.setScore(S.kills); ENV.sfx(300, 0.1, 'square'); continue; }
          var cc = Math.floor((fo.x - gx) / cw);
          var block = cc >= 0 && cc < COLS ? cellOf(cc, fo.r) : null;
          if (block) { fo.chew += dt; if (fo.chew >= 0.5) { fo.chew = 0; block.hp -= 20; if (block.hp <= 0) S.plants.splice(S.plants.indexOf(block), 1); } }
          else fo.x -= fo.sp * dt;
          if (fo.x < gx) { ENV.gameOver('Garden overrun!', 'Guardians defeated \u2022 ' + S.kills + ' crawlers stopped'); return; }
        }
        // waves
        S.spawnT -= dt;
        if (S.waveLeft > 0 && S.spawnT <= 0) { spawnFoe(); S.spawnT = Math.max(0.7, 2.2 - d * 0.4 - S.wave * 0.08); }
        if (S.waveLeft <= 0 && S.foes.length === 0) { S.wave++; S.waveLeft = 6 + d * 2 + S.wave; S.spawnT = 3; S.energy += 50; ENV.toast('Wave ' + S.wave); }
        ENV.setInfo('\u26A1' + S.energy + '  Wave ' + S.wave);
      },
      render: function () {
        ctx.fillStyle = '#0b2e14'; ctx.fillRect(0, 0, W, H);
        // palette
        var pw = W / TYPES.length;
        TYPES.forEach(function (t, i) {
          ctx.fillStyle = S.sel === t.id ? '#14532d' : '#052e16'; ctx.fillRect(i * pw, 0, pw - 2, padT - 6);
          ctx.fillStyle = t.col; ctx.beginPath(); ctx.arc(i * pw + 20, padT / 2 - 2, 11, 0, 7); ctx.fill();
          ctx.fillStyle = S.energy >= t.cost ? '#e5e7eb' : '#9ca3af'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
          ctx.fillText(t.label, i * pw + 36, padT / 2 + 2);
        });
        // grid
        for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) { ctx.fillStyle = (r + c) % 2 ? '#166534' : '#15803d'; ctx.fillRect(gx + c * cw, gy + r * ch, cw - 1, ch - 1); }
        S.plants.forEach(function (p) { var T = TYPES.filter(function (q){return q.id===p.type;})[0]; var cx = gx + p.c * cw + cw / 2, cy = gy + p.r * ch + ch / 2; ctx.fillStyle = T.col; ctx.beginPath(); ctx.arc(cx, cy, Math.min(cw, ch) * 0.32, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(cx - 12, cy + 12, 24, 3); ctx.fillStyle = '#4ade80'; ctx.fillRect(cx - 12, cy + 12, 24 * (p.hp / p.max), 3); });
        S.shots.forEach(function (s) { ctx.fillStyle = '#bbf7d0'; ctx.beginPath(); ctx.arc(s.x, s.y, 5, 0, 7); ctx.fill(); });
        S.foes.forEach(function (f) { var cy = gy + f.r * ch + ch / 2; ctx.fillStyle = '#7f1d1d'; ctx.beginPath(); ctx.arc(f.x, cy, Math.min(cw, ch) * 0.3, 0, 7); ctx.fill(); ctx.fillStyle = '#fca5a5'; ctx.fillRect(f.x - 14, cy - 20, 28 * (f.hp / f.max), 3); });
      },
      destroy: function () {}
    };
  } };

  // =======================================================================
  //  BATTLE FORGE – 1v1 fighter with thinking AI
  // =======================================================================
  MODULES.forge = { kind: 'raf', w: 480, h: 300, help: 'Move A/D (\u25C0\u25B6), jump W/\u25B2. Attack: J=Punch, K=Kick. Hold L (or Block) to guard – blocking cuts damage. Chain hits for combos. First to win 2 rounds takes the match.', make: function (G) {
    var ctx = G.ctx, W = G.w, H = G.h, d = diffNum(G.key), floor = H - 40;
    function fighter(x, col, face) { return { x: x, y: floor, vy: 0, w: 34, h: 70, col: col, face: face, hp: 100, block: false, atk: 0, atkType: null, cd: 0, hitDone: false, combo: 0, air: false }; }
    var P = fighter(120, '#7c3aed', 1), E = fighter(W - 120, '#ef4444', -1);
    var S = { round: 1, pw: 0, ew: 0, msg: '', msgT: 0, over: false, aiT: 0, aiAct: 0 };
    function reset() { P.hp = E.hp = 100; P.x = 120; E.x = W - 120; P.atk = E.atk = 0; P.vy = E.vy = 0; P.y = E.y = floor; S.msg = 'Round ' + S.round; S.msgT = 1.2; }
    reset();
    ENV.addPad([{ a: 'left', t: '\u25C0' }, { a: 'right', t: '\u25B6' }, { a: 'up', t: '\u25B2' }], [{ a: 'punch', t: 'P' }, { a: 'kick', t: 'K' }, { a: 'block', t: '\u26E8' }]);
    function attack(f, type) { if (f.atk > 0 || f.cd > 0) return; f.atk = 0.26; f.atkType = type; f.hitDone = false; f.cd = type === 'kick' ? 0.55 : 0.4; ENV.sfx(type === 'kick' ? 300 : 440, 0.06, 'square'); }
    function doHit(a, b) {
      if (a.hitDone || a.atk <= 0) return;
      var reach = a.atkType === 'kick' ? 54 : 42; var dmgBase = a.atkType === 'kick' ? 12 : 8;
      if (a.atk < 0.14 && Math.abs(a.x - b.x) < reach && Math.abs(a.y - b.y) < 60 && (a.face > 0 ? b.x > a.x - 10 : b.x < a.x + 10)) {
        a.hitDone = true; var dmg = dmgBase; if (b.block) dmg = Math.round(dmg * 0.25); else { a.combo++; dmg += Math.min(6, a.combo); }
        b.hp = Math.max(0, b.hp - dmg); b.x += a.face * (b.block ? 4 : 12);
        ENV.sfx(b.block ? 220 : 660, 0.07, b.block ? 'triangle' : 'sawtooth'); if (!b.block) ENV.vibrate(40);
        if (!b.block && a === P) ENV.setScore(ENV.best ? Math.max(ACTIVE.score, a.combo) : a.combo);
      }
    }
    function roundEnd(winner) { if (S.over) return; if (winner === 'p') S.pw++; else S.ew++;
      if (S.pw >= 2 || S.ew >= 2) { S.over = true; ENV.gameOver(S.pw > S.ew ? 'Victory!' : 'Defeat', 'Rounds ' + S.pw + ' \u2013 ' + S.ew); }
      else { S.round++; setTimeout(function () { if (ACTIVE && ACTIVE.inst) reset(); }, 900); S.msg = (S.pw > S.ew ? 'You win the round' : 'AI wins the round'); S.msgT = 1.5; S._pending = true; }
    }
    return {
      onKey: function (k, dn) { if (!dn) return; if (k === 'j' || k === 'J') attack(P, 'punch'); if (k === 'k' || k === 'K') attack(P, 'kick'); if ((k === 'w' || k === 'W') && !P.air) { P.vy = -300; P.air = true; } },
      onAction: function (a, dn) { if (!dn) return; if (a === 'punch') attack(P, 'punch'); if (a === 'kick') attack(P, 'kick'); if (a === 'up' && !P.air) { P.vy = -300; P.air = true; } },
      update: function (dt) {
        if (S._pending) { if (S.msgT <= 0) S._pending = false; }
        P.block = (G.keys['l'] || G.keys['L'] || G.btn.block) && P.atk <= 0;
        var mv = ((G.keys['ArrowRight'] || G.keys['d'] || G.btn.right) ? 1 : 0) - ((G.keys['ArrowLeft'] || G.keys['a'] || G.btn.left) ? 1 : 0);
        if (!P.block && !S._pending) P.x += mv * 150 * dt;
        // physics
        [P, E].forEach(function (f) { f.vy += 900 * dt; f.y += f.vy * dt; if (f.y >= floor) { f.y = floor; f.vy = 0; f.air = false; } f.x = Math.max(20, Math.min(W - 20, f.x)); if (f.atk > 0) f.atk -= dt; if (f.cd > 0) f.cd -= dt; });
        P.face = P.x < E.x ? 1 : -1; E.face = E.x < P.x ? 1 : -1;
        // AI
        if (!S._pending) aiThink(dt);
        doHit(P, E); doHit(E, P);
        if (P.atk <= 0) {} if (P.combo && P.cd <= 0 && P.atk <= 0) {}
        if (E.hp <= 0 && !S._pending && !S.over) roundEnd('p');
        else if (P.hp <= 0 && !S._pending && !S.over) roundEnd('e');
        if (S.msgT > 0) S.msgT -= dt;
        ENV.setInfo('Rounds  You ' + S.pw + ' \u2013 ' + S.ew + ' AI');
      },
      render: function () {
        var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1e293b'); g.addColorStop(1, '#0f172a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#334155'; ctx.fillRect(0, floor + 20, W, H - floor);
        // health bars
        bar(14, 14, true, P.hp, '#7c3aed'); bar(W - 14 - 180, 14, false, E.hp, '#ef4444');
        ctx.fillStyle = '#e5e7eb'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('YOU', 14, 44); ctx.textAlign = 'right'; ctx.fillText('AI', W - 14, 44);
        drawF(P); drawF(E);
        if (S.msgT > 0) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, H / 2 - 24, W, 48); ctx.fillStyle = '#fde047'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(S.msg, W / 2, H / 2 + 8); }
        function bar(x, y, left, hp, col) { ctx.fillStyle = '#111827'; ctx.fillRect(x, y, 180, 16); ctx.fillStyle = col; var w = 180 * hp / 100; ctx.fillRect(left ? x : x + 180 - w, y, w, 16); ctx.strokeStyle = '#e5e7eb'; ctx.strokeRect(x, y, 180, 16); }
        function drawF(f) {
          var x = f.x, y = f.y; ctx.save(); ctx.translate(x, y); ctx.scale(f.face, 1);
          ctx.fillStyle = f.col; ctx.fillRect(-14, -f.h, 28, f.h - 18); // torso
          ctx.beginPath(); ctx.arc(0, -f.h - 8, 12, 0, 7); ctx.fillStyle = f.col; ctx.fill(); // head
          ctx.fillStyle = '#0f172a'; ctx.fillRect(-12, -18, 10, 18); ctx.fillRect(2, -18, 10, 18); // legs
          ctx.strokeStyle = f.col; ctx.lineWidth = 7; ctx.lineCap = 'round';
          var ax = f.atk > 0 ? (f.atkType === 'kick' ? 0 : 44) : 20, ay = f.atk > 0 && f.atkType === 'kick' ? 6 : -f.h + 24;
          ctx.beginPath(); ctx.moveTo(10, -f.h + 24); ctx.lineTo(ax, ay); ctx.stroke(); // arm
          if (f.atk > 0 && f.atkType === 'kick') { ctx.beginPath(); ctx.moveTo(6, -14); ctx.lineTo(40, -8); ctx.stroke(); }
          if (f.block) { ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3; ctx.strokeRect(-18, -f.h - 4, 36, f.h + 6); }
          ctx.restore();
        }
      },
      _ai: null,
      destroy: function () {}
    };
    function aiThink(dt) {
      S.aiT -= dt; var dist = Math.abs(E.x - P.x);
      var reactP = [0.2, 0.45, 0.75][d]; // chance to block player's attack
      E.block = false;
      if (P.atk > 0 && P.atk > 0.12 && dist < 60 && Math.random() < reactP * 0.3) { E.block = true; return; }
      if (S.aiT > 0) { if (S.aiAct === 1) E.x += E.face * 120 * dt; else if (S.aiAct === -1) E.x -= E.face * 90 * dt; return; }
      S.aiT = [0.5, 0.34, 0.22][d] + Math.random() * 0.2;
      if (dist > 60) { S.aiAct = 1; }
      else { var r = Math.random(); if (r < [0.5, 0.68, 0.82][d]) { attack(E, Math.random() < 0.5 ? 'kick' : 'punch'); S.aiAct = 0; } else if (r < 0.85) { S.aiAct = -1; } else { if (!E.air) { E.vy = -300; E.air = true; } S.aiAct = 0; } }
    }
  } };

  // =======================================================================
  //  WORLD STRIKERS – top-down football vs CPU
  // =======================================================================
  MODULES.strikers = { kind: 'raf', w: 360, h: 520, help: 'You control the blue player nearest the ball. Move with arrows / \u25C0\u25B6\u25B2\u25BC, touch the ball to dribble, press Shoot to blast it at the goal. Most goals in 90s wins.', make: function (G) {
    var ctx = G.ctx, W = G.w, H = G.h, d = diffNum(G.key);
    var goalW = W * 0.4, gx = (W - goalW) / 2;
    function mk(x, y, team) { return { x: x, y: y, r: 11, team: team, vx: 0, vy: 0 }; }
    var blues = [mk(W / 2, H * 0.7, 0), mk(W * 0.3, H * 0.55, 0), mk(W * 0.7, H * 0.55, 0)];
    var reds = [mk(W / 2, H * 0.3, 1), mk(W * 0.3, H * 0.45, 1), mk(W * 0.7, H * 0.45, 1)];
    var ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, r: 7 };
    var S = { bs: 0, rs: 0, t: 90, cool: 0, flash: 0 };
    function reset(dir) { ball.x = W / 2; ball.y = H / 2; ball.vx = 0; ball.vy = 0; blues.forEach(function (p, i) { p.x = W * [0.5, 0.3, 0.7][i]; p.y = H * [0.7, 0.55, 0.55][i]; }); reds.forEach(function (p, i) { p.x = W * [0.5, 0.3, 0.7][i]; p.y = H * [0.3, 0.45, 0.45][i]; }); }
    function nearest(team) { var arr = team ? reds : blues, best = arr[0], bd = 1e9; arr.forEach(function (p) { var dd = (p.x - ball.x) * (p.x - ball.x) + (p.y - ball.y) * (p.y - ball.y); if (dd < bd) { bd = dd; best = p; } }); return best; }
    ENV.addPad([{ a: 'left', t: '\u25C0' }, { a: 'right', t: '\u25B6' }, { a: 'up', t: '\u25B2' }, { a: 'down', t: '\u25BC' }], [{ a: 'shoot', t: '\u26BD' }]);
    return {
      onKey: function (k, dn) { if (dn && (k === ' ' || k === 'j' || k === 'J')) shoot(); },
      onAction: function (a, dn) { if (dn && a === 'shoot') shoot(); },
      update: function (dt) {
        if (S.cool > 0) { S.cool -= dt; }
        var me = nearest(0);
        var mv = { x: ((G.keys['ArrowRight'] || G.btn.right) ? 1 : 0) - ((G.keys['ArrowLeft'] || G.btn.left) ? 1 : 0), y: ((G.keys['ArrowDown'] || G.btn.down) ? 1 : 0) - ((G.keys['ArrowUp'] || G.btn.up) ? 1 : 0) };
        var ml = Math.hypot(mv.x, mv.y) || 1; me.x += mv.x / ml * 150 * dt; me.y += mv.y / ml * 150 * dt;
        // other blues drift to formation / support
        blues.forEach(function (p) { if (p === me) return; var tx = p.x + (ball.x - p.x) * 0.15, ty = Math.min(H * 0.85, p.y + (ball.y - p.y) * 0.1); p.x += (tx - p.x) * dt * 2; p.y += (ty - p.y) * dt * 2; });
        // reds AI chase & shoot toward bottom goal
        var rc = nearest(1); reds.forEach(function (p) {
          var sp = 90 + d * 40; var tx = (p === rc) ? ball.x : (p.x + (ball.x - p.x) * 0.1), ty = (p === rc) ? ball.y : Math.max(H * 0.15, p.y + (ball.y - p.y) * 0.08);
          var a = Math.atan2(ty - p.y, tx - p.x); if (Math.hypot(tx - p.x, ty - p.y) > 2) { p.x += Math.cos(a) * sp * dt; p.y += Math.sin(a) * sp * dt; }
        });
        // ball possession / kick
        [].concat(blues, reds).forEach(function (p) { if (Math.hypot(p.x - ball.x, p.y - ball.y) < p.r + ball.r + 2) {
          if (p.team === 1) { // AI kicks toward bottom goal
            if (Math.random() < (0.02 + d * 0.015)) { var a = Math.atan2(H - ball.y, (gx + goalW / 2) - ball.x); ball.vx = Math.cos(a) * 260; ball.vy = Math.sin(a) * 260; }
            else { ball.vx = (ball.x - p.x) * 6; ball.vy = (ball.y - p.y) * 6 + 40; }
          } else { ball.vx = (ball.x - p.x) * 5; ball.vy = (ball.y - p.y) * 5; }
        } });
        ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.vx *= 0.96; ball.vy *= 0.96;
        if (ball.x < ball.r || ball.x > W - ball.r) ball.vx *= -0.6, ball.x = Math.max(ball.r, Math.min(W - ball.r, ball.x));
        // goals (top = AI net, bottom = your net)
        if (ball.y < 6) { if (ball.x > gx && ball.x < gx + goalW) { S.bs++; S.flash = 1; ENV.sfx(880, 0.2, 'sine'); ENV.setScore(S.bs); reset(); } else { ball.vy *= -0.6; ball.y = 6; } }
        if (ball.y > H - 6) { if (ball.x > gx && ball.x < gx + goalW) { S.rs++; S.flash = 1; ENV.sfx(200, 0.2, 'sawtooth'); reset(); } else { ball.vy *= -0.6; ball.y = H - 6; } }
        [].concat(blues, reds).forEach(function (p) { p.x = Math.max(p.r, Math.min(W - p.r, p.x)); p.y = Math.max(p.r, Math.min(H - p.r, p.y)); });
        S.t -= dt; if (S.flash > 0) S.flash -= dt;
        ENV.setInfo('You ' + S.bs + ' \u2013 ' + S.rs + ' CPU \u2022 ' + Math.max(0, S.t).toFixed(0) + 's');
        if (S.t <= 0) ENV.gameOver(S.bs > S.rs ? 'You win!' : S.bs === S.rs ? 'Draw' : 'CPU wins', 'Final ' + S.bs + ' \u2013 ' + S.rs);
        function shoot() { if (Math.hypot(nearest(0).x - ball.x, nearest(0).y - ball.y) < 24) { var a = Math.atan2(0 - ball.y, (gx + goalW / 2) - ball.x); ball.vx = Math.cos(a) * 340; ball.vy = Math.sin(a) * 340; ENV.sfx(520, 0.08, 'square'); } }
      },
      render: function () {
        ctx.fillStyle = '#15803d'; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.strokeRect(6, 6, W - 12, H - 12);
        ctx.beginPath(); ctx.moveTo(6, H / 2); ctx.lineTo(W - 6, H / 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(W / 2, H / 2, 36, 0, 7); ctx.stroke();
        ctx.fillStyle = '#fde047'; ctx.fillRect(gx, 0, goalW, 6); ctx.fillRect(gx, H - 6, goalW, 6);
        var me = nearest(0);
        blues.forEach(function (p) { ctx.fillStyle = p === me ? '#60a5fa' : '#2563eb'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); if (p === me) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); } });
        reds.forEach(function (p) { ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); });
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, 7); ctx.fill();
        if (S.flash > 0) { ctx.fillStyle = 'rgba(253,224,71,' + (S.flash * 0.5) + ')'; ctx.fillRect(0, 0, W, H); }
      },
      destroy: function () {}
    };
  } };

  // =======================================================================
  //  SKYBOUND ADVENTURE – platformer
  // =======================================================================
  MODULES.skybound = { kind: 'raf', w: 420, h: 300, help: 'Run with \u25C0\u25B6 (A/D / arrows), jump with \u25B2 / W / Space. Bounce on enemies to defeat them, grab the gems, and reach the glowing flag. Falling off costs a life.', make: function (G) {
    var ctx = G.ctx, W = G.w, H = G.h, d = diffNum(G.key);
    var LEVELS = [
      { plats: [[0,260,600,40],[220,210,90,16],[360,170,90,16],[520,210,120,16],[700,250,200,40],[950,200,120,16],[1120,250,400,50]], gems: [[250,185],[390,145],[560,185],[980,175],[1200,210]], foes: [[420,236,360,480],[760,226,700,900],[1200,236,1120,1480]], goal: [1460,180], end: 1520 },
      { plats: [[0,260,400,40],[300,200,80,16],[460,160,80,16],[620,210,80,16],[760,160,80,16],[920,230,500,40],[1200,180,100,16]], gems: [[330,175],[490,135],[650,185],[790,135],[1230,155]], foes: [[980,206,920,1380],[1120,206,980,1380]], goal: [1360,206], end: 1420 }
    ];
    var li = 0, cam = 0;
    var P = { x: 40, y: 200, vx: 0, vy: 0, w: 20, h: 26, grd: false, face: 1 };
    var S = { lives: 3, gems: 0, foes: [], done: false };
    function load() { var L = LEVELS[li]; P.x = 40; P.y = 200; P.vx = P.vy = 0; cam = 0; S.foes = L.foes.map(function (f) { return { x: f[0], y: f[1], w: 22, h: 20, a: f[2], b: f[3], dir: 1, dead: 0 }; }); S.collected = {}; }
    load();
    ENV.addPad([{ a: 'left', t: '\u25C0' }, { a: 'right', t: '\u25B6' }], [{ a: 'jump', t: '\u25B2' }]);
    function solid(x, y, w, h) { var L = LEVELS[li]; for (var i = 0; i < L.plats.length; i++) { var p = L.plats[i]; if (x + w > p[0] && x < p[0] + p[2] && y + h > p[1] && y < p[1] + p[3]) return p; } return null; }
    function jump() { if (P.grd) { P.vy = -360; P.grd = false; ENV.sfx(600, 0.08, 'square'); } }
    return {
      onKey: function (k, dn) { if (dn && (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W')) jump(); },
      onAction: function (a, dn) { if (dn && a === 'jump') jump(); },
      update: function (dt) {
        var L = LEVELS[li];
        var mv = ((G.keys['ArrowRight'] || G.btn.right) ? 1 : 0) - ((G.keys['ArrowLeft'] || G.btn.left) ? 1 : 0);
        P.vx = mv * 160; if (mv) P.face = mv;
        P.vy += 980 * dt; if (P.vy > 520) P.vy = 520;
        // horizontal
        P.x += P.vx * dt; var hit = solid(P.x, P.y, P.w, P.h); if (hit) { if (P.vx > 0) P.x = hit[0] - P.w; else if (P.vx < 0) P.x = hit[0] + hit[2]; }
        if (P.x < 0) P.x = 0;
        // vertical
        P.y += P.vy * dt; P.grd = false; var hv = solid(P.x, P.y, P.w, P.h);
        if (hv) { if (P.vy > 0) { P.y = hv[1] - P.h; P.grd = true; } else if (P.vy < 0) P.y = hv[1] + hv[3]; P.vy = 0; }
        // fall off
        if (P.y > H + 60) { lose(); }
        // gems
        L.gems.forEach(function (g, i) { if (!S.collected[i] && Math.abs(P.x + P.w / 2 - g[0]) < 18 && Math.abs(P.y + P.h / 2 - g[1]) < 20) { S.collected[i] = 1; S.gems++; ENV.setScore(S.gems * 10 + li * 100); ENV.sfx(1000, 0.07, 'triangle'); } });
        // foes
        S.foes.forEach(function (f) { if (f.dead) return; f.x += f.dir * (40 + d * 20) * dt; if (f.x < f.a) { f.x = f.a; f.dir = 1; } if (f.x > f.b) { f.x = f.b; f.dir = -1; }
          if (P.x + P.w > f.x && P.x < f.x + f.w && P.y + P.h > f.y && P.y < f.y + f.h) {
            if (P.vy > 0 && P.y + P.h - f.y < 16) { f.dead = 1; P.vy = -260; S.gems++; ENV.setScore(S.gems * 10 + li * 100); ENV.sfx(300, 0.1, 'square'); }
            else lose();
          }
        });
        // goal
        if (P.x > L.goal[0]) { if (li < LEVELS.length - 1) { li++; load(); ENV.toast('Level ' + (li + 1)); } else { ENV.gameOver('World cleared!', 'Gems ' + S.gems + ' \u2022 all levels done'); } }
        cam = Math.max(0, Math.min(L.end - W, P.x - W * 0.4));
        ENV.setInfo('\u2764\uFE0F' + S.lives + '  \uD83D\uDC8E' + S.gems + '  Lv' + (li + 1));
        function lose() { S.lives--; ENV.sfx(140, 0.3, 'sawtooth'); ENV.vibrate(120); if (S.lives <= 0) ENV.gameOver('Game Over', 'Gems ' + S.gems); else load(); }
      },
      render: function () {
        var L = LEVELS[li]; var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#38bdf8'); g.addColorStop(1, '#bae6fd'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.save(); ctx.translate(-cam, 0);
        ctx.fillStyle = '#fff'; [120,340,620,900].forEach(function (cx, i) { ctx.beginPath(); ctx.arc(cx, 50 + i * 10, 20, 0, 7); ctx.arc(cx + 24, 50 + i * 10, 26, 0, 7); ctx.arc(cx + 48, 50 + i * 10, 20, 0, 7); ctx.fill(); });
        L.plats.forEach(function (p) { ctx.fillStyle = '#15803d'; ctx.fillRect(p[0], p[1], p[2], 6); ctx.fillStyle = '#854d0e'; ctx.fillRect(p[0], p[1] + 6, p[2], p[3] - 6); });
        L.gems.forEach(function (gm, i) { if (S.collected[i]) return; ctx.fillStyle = '#22d3ee'; ctx.save(); ctx.translate(gm[0], gm[1] + Math.sin(Date.now() / 300 + i) * 3); ctx.rotate(0.78); ctx.fillRect(-6, -6, 12, 12); ctx.restore(); });
        S.foes.forEach(function (f) { if (f.dead) return; ctx.fillStyle = '#7c3aed'; ctx.fillRect(f.x, f.y, f.w, f.h); ctx.fillStyle = '#fff'; ctx.fillRect(f.x + 4, f.y + 5, 4, 4); ctx.fillRect(f.x + 14, f.y + 5, 4, 4); });
        ctx.fillStyle = '#64748b'; ctx.fillRect(L.goal[0], L.goal[1] - 50, 4, 50); ctx.fillStyle = '#facc15'; ctx.fillRect(L.goal[0] + 4, L.goal[1] - 50, 26, 16);
        ctx.fillStyle = '#1d4ed8'; ctx.fillRect(P.x, P.y, P.w, P.h); ctx.fillStyle = '#fde047'; ctx.fillRect(P.x + (P.face > 0 ? 12 : 2), P.y + 5, 5, 5);
        ctx.restore();
      },
      destroy: function () {}
    };
  } };

  // =======================================================================
  //  VOID FRONTIER – sci-fi arena shooter (auto-fire at nearest hostile)
  // =======================================================================
  MODULES.void = { kind: 'raf', w: 400, h: 460, help: 'Fly with \u25C0\u25B6\u25B2\u25BC (WASD / arrows). Your cannon auto-targets the nearest hostile. Tap \u2605 to release a screen-clearing pulse (recharges by scoring). Survive the waves.', make: function (G) {
    var ctx = G.ctx, W = G.w, H = G.h, d = diffNum(G.key);
    var P = { x: W / 2, y: H - 70, r: 14, hp: 100, fire: 0, pulse: 0 };
    var S = { foes: [], shots: [], efoes: [], parts: [], wave: 1, left: 6, spawnT: 1, kills: 0 };
    function spawn() { var edge = Math.random() * W; S.foes.push({ x: edge, y: -20, r: 12 + (Math.random() < 0.2 ? 6 : 0), hp: 20 + S.wave * 8 + d * 10, max: 20 + S.wave * 8 + d * 10, sp: 30 + d * 12 + S.wave * 2, t: Math.random() * 2, c: Math.random() < 0.3 ? '#f472b6' : '#34d399' }); S.left--; }
    ENV.addPad([{ a: 'left', t: '\u25C0' }, { a: 'right', t: '\u25B6' }, { a: 'up', t: '\u25B2' }, { a: 'down', t: '\u25BC' }], [{ a: 'pulse', t: '\u2605' }]);
    function nearest() { var b = null, bd = 1e9; S.foes.forEach(function (f) { var dd = (f.x - P.x) * (f.x - P.x) + (f.y - P.y) * (f.y - P.y); if (dd < bd) { bd = dd; b = f; } }); return b; }
    function pulse() { if (P.pulse < 100) return; P.pulse = 0; S.foes.forEach(function (f) { f.hp -= 60; boom(f.x, f.y, f.c); }); ENV.sfx(120, 0.3, 'sawtooth'); ENV.vibrate(80); }
    function boom(x, y, c) { for (var i = 0; i < 8; i++) { var a = Math.random() * 7; S.parts.push({ x: x, y: y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, t: 0.4, c: c || '#fff' }); } }
    return {
      onKey: function (k, dn) { if (dn && (k === ' ' || k === 'j' || k === 'J')) pulse(); },
      onAction: function (a, dn) { if (dn && a === 'pulse') pulse(); },
      update: function (dt) {
        var mv = { x: ((G.keys['ArrowRight'] || G.keys['d'] || G.btn.right) ? 1 : 0) - ((G.keys['ArrowLeft'] || G.keys['a'] || G.btn.left) ? 1 : 0), y: ((G.keys['ArrowDown'] || G.keys['s'] || G.btn.down) ? 1 : 0) - ((G.keys['ArrowUp'] || G.keys['w'] || G.btn.up) ? 1 : 0) };
        var ml = Math.hypot(mv.x, mv.y) || 1; P.x += mv.x / ml * 200 * dt; P.y += mv.y / ml * 200 * dt;
        P.x = Math.max(P.r, Math.min(W - P.r, P.x)); P.y = Math.max(P.r, Math.min(H - P.r, P.y));
        // auto fire
        P.fire -= dt; var tgt = nearest();
        if (tgt && P.fire <= 0) { P.fire = 0.22; var a = Math.atan2(tgt.y - P.y, tgt.x - P.x); S.shots.push({ x: P.x, y: P.y, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420 }); ENV.sfx(760, 0.03, 'square'); }
        for (var i = S.shots.length - 1; i >= 0; i--) { var s = S.shots[i]; s.x += s.vx * dt; s.y += s.vy * dt; if (s.x < -10 || s.x > W + 10 || s.y < -10 || s.y > H + 10) { S.shots.splice(i, 1); continue; }
          for (var k = 0; k < S.foes.length; k++) { var f = S.foes[k]; if (Math.hypot(f.x - s.x, f.y - s.y) < f.r + 3) { f.hp -= 10; S.shots.splice(i, 1); break; } } }
        for (var j = S.foes.length - 1; j >= 0; j--) { var fo = S.foes[j];
          if (fo.hp <= 0) { boom(fo.x, fo.y, fo.c); S.foes.splice(j, 1); S.kills++; P.pulse = Math.min(100, P.pulse + 8); ENV.setScore(S.kills); continue; }
          var ang = Math.atan2(P.y - fo.y, P.x - fo.x); fo.x += Math.cos(ang) * fo.sp * dt; fo.y += Math.sin(ang) * fo.sp * dt;
          if (Math.hypot(fo.x - P.x, fo.y - P.y) < fo.r + P.r) { P.hp -= 18; boom(fo.x, fo.y, fo.c); S.foes.splice(j, 1); ENV.sfx(160, 0.2, 'sawtooth'); ENV.vibrate(60); if (P.hp <= 0) { ENV.gameOver('Ship destroyed', 'Hostiles cleared: ' + S.kills); return; } }
        }
        for (var p = S.parts.length - 1; p >= 0; p--) { var pa = S.parts[p]; pa.x += pa.vx * dt; pa.y += pa.vy * dt; pa.t -= dt; if (pa.t <= 0) S.parts.splice(p, 1); }
        S.spawnT -= dt; if (S.left > 0 && S.spawnT <= 0) { spawn(); S.spawnT = Math.max(0.4, 1.4 - d * 0.3 - S.wave * 0.05); }
        if (S.left <= 0 && S.foes.length === 0) { S.wave++; S.left = 6 + S.wave + d * 2; S.spawnT = 2; P.hp = Math.min(100, P.hp + 15); ENV.toast('Wave ' + S.wave); }
        ENV.setInfo('\u2764\uFE0F' + Math.max(0, Math.floor(P.hp)) + '  \u2605' + Math.floor(P.pulse) + '%  W' + S.wave);
      },
      render: function () {
        ctx.fillStyle = '#05060f'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,.5)'; for (var i = 0; i < 40; i++) { var yy = (i * 53 + (Date.now() / 20)) % H; ctx.fillRect((i * 71) % W, yy, 2, 2); }
        S.parts.forEach(function (pa) { ctx.fillStyle = pa.c; ctx.globalAlpha = Math.max(0, pa.t / 0.4); ctx.fillRect(pa.x - 2, pa.y - 2, 4, 4); ctx.globalAlpha = 1; });
        S.shots.forEach(function (s) { ctx.fillStyle = '#67e8f9'; ctx.fillRect(s.x - 2, s.y - 4, 4, 8); });
        S.foes.forEach(function (f) { ctx.fillStyle = f.c; ctx.beginPath(); ctx.moveTo(f.x, f.y + f.r); ctx.lineTo(f.x - f.r, f.y - f.r); ctx.lineTo(f.x + f.r, f.y - f.r); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#000'; ctx.fillRect(f.x - f.r, f.y - f.r - 6, f.r * 2 * (f.hp / f.max), 2); });
        ctx.fillStyle = '#7c3aed'; ctx.beginPath(); ctx.moveTo(P.x, P.y - P.r); ctx.lineTo(P.x - P.r, P.y + P.r); ctx.lineTo(P.x + P.r, P.y + P.r); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#c4b5fd'; ctx.fillRect(P.x - 3, P.y - 4, 6, 10);
      },
      destroy: function () {}
    };
  } };

  // =======================================================================
  //  GRANDMASTER CANVAS – full chess rules engine + evaluating AI
  // =======================================================================
  MODULES.chess = { kind: 'dom', help: 'Full chess: legal moves, check, checkmate, stalemate, castling, en passant and promotion. Play a friend (2P) or a thinking AI (difficulty = search depth). Click a piece, then its destination.', make: function (G, root) {
    var GLY = { P: '\u2659', N: '\u2658', B: '\u2657', R: '\u2656', Q: '\u2655', K: '\u2654', p: '\u265F', n: '\u265E', b: '\u265D', r: '\u265C', q: '\u265B', k: '\u265A' };
    var VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
    function start() { return 'rnbqkbnr'.split('').concat('pppppppp'.split('')).concat('........'.split('')).concat('........'.split('')).concat('........'.split('')).concat('........'.split('')).concat('PPPPPPPP'.split('')).concat('RNBQKBNR'.split('')); }
    var ST = { b: start(), turn: 'w', cr: { K: true, Q: true, k: true, q: true }, ep: -1, hist: [], vsAI: true };
    function isW(p) { return p !== '.' && p === p.toUpperCase(); }
    function side(p) { return p === '.' ? null : (isW(p) ? 'w' : 'b'); }
    function onB(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
    function idx(r, c) { return r * 8 + c; }
    function kingSq(b, s) { var t = s === 'w' ? 'K' : 'k'; for (var i = 0; i < 64; i++) if (b[i] === t) return i; return -1; }
    function attacked(b, sq, by) { // is sq attacked by side 'by'
      var r = (sq / 8) | 0, c = sq % 8;
      var pd = by === 'w' ? 1 : -1; // white pawns attack upward (toward row 0) => from r+1
      var pr = r + pd;
      if (onB(pr, c - 1) && b[idx(pr, c - 1)] === (by === 'w' ? 'P' : 'p')) return true;
      if (onB(pr, c + 1) && b[idx(pr, c + 1)] === (by === 'w' ? 'P' : 'p')) return true;
      var N = [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
      for (var i = 0; i < 8; i++) { var nr = r + N[i][0], nc = c + N[i][1]; if (onB(nr, nc) && b[idx(nr, nc)] === (by === 'w' ? 'N' : 'n')) return true; }
      var dirsB = [[1,1],[1,-1],[-1,1],[-1,-1]], dirsR = [[1,0],[-1,0],[0,1],[0,-1]];
      function ray(ds, pieces) { for (var d = 0; d < ds.length; d++) { var nr = r + ds[d][0], nc = c + ds[d][1]; while (onB(nr, nc)) { var q = b[idx(nr, nc)]; if (q !== '.') { if (side(q) === by && pieces.indexOf(q.toUpperCase()) >= 0) return true; break; } nr += ds[d][0]; nc += ds[d][1]; } } return false; }
      if (ray(dirsB, ['B', 'Q'])) return true; if (ray(dirsR, ['R', 'Q'])) return true;
      var K = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
      for (var j = 0; j < 8; j++) { var kr = r + K[j][0], kc = c + K[j][1]; if (onB(kr, kc) && b[idx(kr, kc)] === (by === 'w' ? 'K' : 'k')) return true; }
      return false;
    }
    function inCheck(b, s) { return attacked(b, kingSq(b, s), s === 'w' ? 'b' : 'w'); }
    function pseudo(s) { // generate pseudo-legal moves for side s on ST
      var b = ST.b, mv = [];
      for (var i = 0; i < 64; i++) { var p = b[i]; if (p === '.' || side(p) !== s) continue; var r = (i / 8) | 0, c = i % 8, up = p.toUpperCase();
        function add(tr, tc, opt) { if (!onB(tr, tc)) return false; var t = b[idx(tr, tc)]; if (t !== '.' && side(t) === s) return false; var m = { f: i, t: idx(tr, tc), p: p, cap: t }; if (opt) for (var k in opt) m[k] = opt[k]; mv.push(m); return t === '.'; }
        if (up === 'P') { var dir = s === 'w' ? -1 : 1, sr = s === 'w' ? 6 : 1, pr = s === 'w' ? 1 : 6;
          if (onB(r + dir, c) && b[idx(r + dir, c)] === '.') { if (r + dir === (s === 'w' ? 0 : 7)) { ['Q','R','B','N'].forEach(function(pp){ mv.push({ f: i, t: idx(r + dir, c), p: p, cap: '.', promo: s === 'w' ? pp : pp.toLowerCase() }); }); } else { mv.push({ f: i, t: idx(r + dir, c), p: p, cap: '.' }); if (r === sr && b[idx(r + 2 * dir, c)] === '.') mv.push({ f: i, t: idx(r + 2 * dir, c), p: p, cap: '.', dbl: true }); } }
          [[dir, -1], [dir, 1]].forEach(function (dd) { var tr = r + dd[0], tc = c + dd[1]; if (!onB(tr, tc)) return; var t = b[idx(tr, tc)]; if (t !== '.' && side(t) !== s) { if (tr === (s === 'w' ? 0 : 7)) { ['Q','R','B','N'].forEach(function(pp){ mv.push({ f: i, t: idx(tr, tc), p: p, cap: t, promo: s === 'w' ? pp : pp.toLowerCase() }); }); } else mv.push({ f: i, t: idx(tr, tc), p: p, cap: t }); } else if (idx(tr, tc) === ST.ep) mv.push({ f: i, t: idx(tr, tc), p: p, cap: s === 'w' ? 'p' : 'P', epc: true }); });
        } else if (up === 'N') { [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].forEach(function (d) { add(r + d[0], c + d[1]); }); }
        else if (up === 'K') { [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].forEach(function (d) { add(r + d[0], c + d[1]); });
          // castling
          if (!inCheck(b, s)) { var rr = s === 'w' ? 7 : 0; var ks = s === 'w' ? 'K' : 'k', qs = s === 'w' ? 'Q' : 'q';
            if (ST.cr[ks] && b[idx(rr, 5)] === '.' && b[idx(rr, 6)] === '.' && b[idx(rr, 7)] === (s === 'w' ? 'R' : 'r') && !attacked(b, idx(rr, 5), s === 'w' ? 'b' : 'w') && !attacked(b, idx(rr, 6), s === 'w' ? 'b' : 'w')) mv.push({ f: i, t: idx(rr, 6), p: p, cap: '.', castle: 'k' });
            if (ST.cr[qs] && b[idx(rr, 3)] === '.' && b[idx(rr, 2)] === '.' && b[idx(rr, 1)] === '.' && b[idx(rr, 0)] === (s === 'w' ? 'R' : 'r') && !attacked(b, idx(rr, 3), s === 'w' ? 'b' : 'w') && !attacked(b, idx(rr, 2), s === 'w' ? 'b' : 'w')) mv.push({ f: i, t: idx(rr, 2), p: p, cap: '.', castle: 'q' });
          }
        } else { var ds = up === 'B' ? [[1,1],[1,-1],[-1,1],[-1,-1]] : up === 'R' ? [[1,0],[-1,0],[0,1],[0,-1]] : [[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
          ds.forEach(function (d) { var nr = r + d[0], nc = c + d[1]; while (add(nr, nc)) { nr += d[0]; nc += d[1]; } }); }
      }
      return mv;
    }
    ST._pseudo = pseudo; ST._inCheck = inCheck; ST._kingSq = kingSq;

    function apply(m) {
      var b = ST.b; var fr = (m.f / 8) | 0, fc = m.f % 8, tr = (m.t / 8) | 0, tc = m.t % 8;
      var undo = { m: m, cr: { K: ST.cr.K, Q: ST.cr.Q, k: ST.cr.k, q: ST.cr.q }, ep: ST.ep, extra: null };
      b[m.t] = m.promo ? m.promo : m.p; b[m.f] = '.';
      if (m.epc) { var cs = idx(fr, tc); undo.extra = { sq: cs, pc: b[cs] }; b[cs] = '.'; }
      if (m.castle === 'k') { undo.extra = { rookFrom: idx(fr, 7), rookTo: idx(fr, 5) }; b[idx(fr, 5)] = b[idx(fr, 7)]; b[idx(fr, 7)] = '.'; }
      if (m.castle === 'q') { undo.extra = { rookFrom: idx(fr, 0), rookTo: idx(fr, 3) }; b[idx(fr, 3)] = b[idx(fr, 0)]; b[idx(fr, 0)] = '.'; }
      if (m.p === 'K') { ST.cr.K = ST.cr.Q = false; } if (m.p === 'k') { ST.cr.k = ST.cr.q = false; }
      if (m.f === 63 || m.t === 63) ST.cr.K = false; if (m.f === 56 || m.t === 56) ST.cr.Q = false;
      if (m.f === 7 || m.t === 7) ST.cr.k = false; if (m.f === 0 || m.t === 0) ST.cr.q = false;
      ST.ep = m.dbl ? ((m.f + m.t) / 2) : -1;
      ST.turn = ST.turn === 'w' ? 'b' : 'w'; ST.hist.push(undo);
    }
    function undoMove() {
      var u = ST.hist.pop(); if (!u) return; var b = ST.b, m = u.m;
      b[m.f] = m.p; b[m.t] = '.';
      if (m.epc) { b[u.extra.sq] = u.extra.pc; } else b[m.t] = m.cap;
      if (m.castle === 'k' || m.castle === 'q') { b[u.extra.rookFrom] = b[u.extra.rookTo]; b[u.extra.rookTo] = '.'; }
      ST.cr = u.cr; ST.ep = u.ep; ST.turn = ST.turn === 'w' ? 'b' : 'w';
    }
    function legal(s) { var out = []; pseudo(s).forEach(function (m) { apply(m); if (!inCheck(ST.b, s)) out.push(m); undoMove(); }); return out; }
    function evalBoard() { var sc = 0; for (var i = 0; i < 64; i++) { var p = ST.b[i]; if (p === '.') continue; var v = VAL[p.toLowerCase()]; sc += isW(p) ? v : -v; } return sc; }
    function negamax(depth, a, bb, s) {
      if (depth === 0) { var e = evalBoard(); return s === 'w' ? e : -e; }
      var ms = legal(s); if (!ms.length) { return inCheck(ST.b, s) ? -99999 + (3 - depth) : 0; }
      var bestv = -1e9;
      for (var i = 0; i < ms.length; i++) { apply(ms[i]); var v = -negamax(depth - 1, -bb, -a, s === 'w' ? 'b' : 'w'); undoMove(); if (v > bestv) bestv = v; if (v > a) a = v; if (a >= bb) break; }
      return bestv;
    }
    function aiMove() {
      var s = ST.turn, ms = legal(s); if (!ms.length) return null;
      var depth = [1, 2, 3][diffNum('chess')], best = null, bv = -1e9;
      ms.sort(function (x, y) { return (y.cap !== '.' ? 1 : 0) - (x.cap !== '.' ? 1 : 0); });
      for (var i = 0; i < ms.length; i++) { apply(ms[i]); var v = -negamax(depth - 1, -1e9, 1e9, s === 'w' ? 'b' : 'w'); undoMove(); if (diffNum('chess') === 0) v += (Math.random() * 60 - 30); if (v > bv) { bv = v; best = ms[i]; } }
      return best;
    }
    // ---------------- UI ----------------
    var sel = -1, legalCache = [], msg = '';
    function status() {
      var s = ST.turn, ms = legal(s), chk = inCheck(ST.b, s);
      if (!ms.length) return chk ? ((s === 'w' ? 'Black' : 'White') + ' wins by checkmate') : 'Stalemate \u2013 draw';
      return (s === 'w' ? 'White' : 'Black') + ' to move' + (chk ? ' \u2013 check!' : '');
    }
    function render() {
      var light = '#f0d9b5', dark = '#b58863';
      var h = '<div style="max-width:400px;margin:0 auto;">';
      h += '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px;">' +
        '<button type="button" class="gcx-btn" id="chMode">Mode: ' + (ST.vsAI ? 'vs AI' : '2 Players') + '</button>' +
        '<button type="button" class="gcx-btn" id="chUndo">\u21A9 Undo</button>' +
        '<button type="button" class="gcx-btn" id="chNew">\u21BB New</button></div>';
      h += '<div id="chMsg" style="font-weight:800;color:#4c1d95;margin-bottom:6px;">' + esc(msg || status()) + '</div>';
      h += '<div style="display:grid;grid-template-columns:repeat(8,1fr);width:100%;max-width:380px;margin:0 auto;aspect-ratio:1;border:3px solid #4c1d95;border-radius:6px;overflow:hidden;">';
      for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) { var i = idx(r, c); var base = (r + c) % 2 ? dark : light;
        var isSel = i === sel; var isTgt = legalCache.some(function (m) { return m.t === i; });
        var bg = isSel ? '#f6e05e' : (isTgt ? '#86efac' : base); var p = ST.b[i];
        h += '<div data-i="' + i + '" style="display:flex;align-items:center;justify-content:center;background:' + bg + ';font-size:min(8vw,30px);cursor:pointer;user-select:none;line-height:1;color:' + (isW(p) ? '#fafafa' : '#111') + ';text-shadow:0 1px 1px rgba(0,0,0,.35);">' + (p === '.' ? '' : GLY[p]) + '</div>';
      }
      h += '</div></div>';
      root.innerHTML = h;
      root.querySelector('#chMode').onclick = function () { ST.vsAI = !ST.vsAI; sel = -1; legalCache = []; msg = ''; render(); };
      root.querySelector('#chUndo').onclick = function () { if (ST.hist.length) { undoMove(); if (ST.vsAI && ST.hist.length) undoMove(); sel = -1; legalCache = []; msg = ''; render(); } };
      root.querySelector('#chNew').onclick = function () { ST.b = start(); ST.turn = 'w'; ST.cr = { K: true, Q: true, k: true, q: true }; ST.ep = -1; ST.hist = []; sel = -1; legalCache = []; msg = ''; render(); };
      Array.prototype.forEach.call(root.querySelectorAll('[data-i]'), function (cell) { cell.onclick = function () { onCell(parseInt(cell.getAttribute('data-i'), 10)); }; });
    }
    function onCell(i) {
      var ms = legal(ST.turn); if (!ms.length) return;
      if (ST.vsAI && ST.turn === 'b') return;
      var hit = legalCache.filter(function (m) { return m.t === i; })[0];
      if (sel >= 0 && hit) {
        if (hit.promo) { var pc = prompt('Promote to (Q, R, B, N)?', 'Q'); if (pc) { pc = pc.toUpperCase(); if ('QRBN'.indexOf(pc) >= 0) { var want = ST.turn === 'w' ? pc : pc.toLowerCase(); hit = legalCache.filter(function (m) { return m.t === i && m.promo === want; })[0] || hit; } } }
        apply(hit); ENV.sfx(hit.cap !== '.' ? 300 : 520, 0.07, 'triangle'); sel = -1; legalCache = []; render();
        var st = status(); if (/wins|Stalemate/.test(st)) { msg = st; render(); ENV.sfx(880, 0.2, 'sine'); return; }
        if (ST.vsAI && ST.turn === 'b') { msg = 'AI thinking\u2026'; render(); setTimeout(function () { var am = aiMove(); if (am) { apply(am); ENV.sfx(am.cap !== '.' ? 280 : 460, 0.07, 'square'); } msg = ''; render(); var s2 = status(); if (/wins|Stalemate/.test(s2)) { msg = s2; render(); } }, 140); }
        return;
      }
      if (ST.b[i] !== '.' && side(ST.b[i]) === ST.turn) { sel = i; legalCache = ms.filter(function (m) { return m.f === i; }); } else { sel = -1; legalCache = []; }
      render();
    }
    render();
    return { update: function () {}, render: function () {}, destroy: function () {} };
  } };

  // =======================================================================
  //  CARD ARENA – strategic elemental card duel vs adaptive AI
  // =======================================================================
  MODULES.cards = { kind: 'dom', help: 'Elemental duel. Each card has a power (1\u20139) and an element: Flame \u25B6 Leaf \u25B6 Wave \u25B6 Flame. The element that beats the other wins the clash and deals its power as damage; same element = higher power wins by the difference. Drop both to 0? Highest HP wins. First to empty the foe\u2019s HP takes the match.', make: function (G, root) {
    var ELS = [{ n: 'Flame', c: '#ef4444', g: '\uD83D\uDD25' }, { n: 'Leaf', c: '#22c55e', g: '\uD83C\uDF43' }, { n: 'Wave', c: '#3b82f6', g: '\uD83C\uDF0A' }];
    var d = diffNum('cards');
    function card() { return { v: 1 + Math.floor(Math.random() * 9), e: Math.floor(Math.random() * 3) }; }
    var S = { php: 30, ahp: 30, hand: [card(), card(), card(), card()], ai: [card(), card(), card(), card()], log: 'Choose a card to attack.', seenP: [0, 0, 0], over: false, lastA: null, lastP: null, busy: false };
    function beats(a, b) { return (a - b + 3) % 3 === 1; } // element a beats b
    function aiPick() {
      if (d === 0) return Math.floor(Math.random() * S.ai.length);
      // predict player's likely element from history
      var likely = S.seenP.indexOf(Math.max.apply(null, S.seenP));
      var best = 0, bv = -1e9;
      for (var i = 0; i < S.ai.length; i++) { var c = S.ai[i]; var sc = c.v;
        if (d >= 1) { if (beats(c.e, likely)) sc += 7; if (beats(likely, c.e)) sc -= 5; }
        if (d >= 2) { sc += c.v >= 7 ? 3 : 0; } if (bv < sc) { bv = sc; best = i; } }
      return best;
    }
    function resolve(pi) {
      if (S.busy || S.over) return; S.busy = true;
      var pc = S.hand[pi]; S.seenP[pc.e]++;
      var ai = aiPick(); var acard = S.ai[ai];
      S.lastP = pc; S.lastA = acard;
      var msg = 'You: ' + ELS[pc.e].g + pc.v + '  vs  AI: ' + ELS[acard.e].g + acard.v + '. ';
      var dmgToA = 0, dmgToP = 0;
      if (pc.e === acard.e) { if (pc.v > acard.v) { dmgToA = pc.v - acard.v; msg += 'Same element \u2013 you win by ' + dmgToA + '.'; } else if (acard.v > pc.v) { dmgToP = acard.v - pc.v; msg += 'Same element \u2013 AI wins by ' + dmgToP + '.'; } else msg += 'Dead heat \u2013 no damage.'; }
      else if (beats(pc.e, acard.e)) { dmgToA = pc.v; msg += ELS[pc.e].n + ' beats ' + ELS[acard.e].n + ' \u2013 you hit ' + dmgToA + '!'; }
      else { dmgToP = acard.v; msg += ELS[acard.e].n + ' beats ' + ELS[pc.e].n + ' \u2013 AI hits ' + dmgToP + '!'; }
      S.ahp = Math.max(0, S.ahp - dmgToA); S.php = Math.max(0, S.php - dmgToP);
      ENV.sfx(dmgToA > dmgToP ? 760 : dmgToP > dmgToA ? 200 : 440, 0.1, 'triangle');
      S.hand.splice(pi, 1); S.hand.push(card()); S.ai.splice(ai, 1); S.ai.push(card());
      S.log = msg;
      if (S.php <= 0 || S.ahp <= 0) { S.over = true; S.log = (S.ahp <= 0 && S.php > 0) ? 'You win the duel!' : (S.php <= 0 && S.ahp > 0) ? 'AI wins the duel.' : 'Both fell \u2013 draw!'; }
      render(); setTimeout(function () { S.busy = false; }, 150);
    }
    function bar(hp, col) { return '<div style="background:#1f2937;border-radius:8px;height:18px;overflow:hidden;"><div style="background:' + col + ';height:100%;width:' + (hp / 30 * 100) + '%;transition:width .3s;"></div></div>'; }
    function render() {
      var h = '<div style="max-width:420px;margin:0 auto;">';
      h += '<div style="display:flex;justify-content:space-between;gap:14px;margin-bottom:6px;"><div style="flex:1;"><b>AI</b> ' + S.ahp + '/30' + bar(S.ahp, '#ef4444') + '</div><div style="flex:1;"><b>You</b> ' + S.php + '/30' + bar(S.php, '#7c3aed') + '</div></div>';
      h += '<div style="display:flex;justify-content:center;gap:30px;align-items:center;background:#0f172a;border-radius:12px;padding:14px;margin:8px 0;min-height:70px;">';
      h += '<div style="text-align:center;color:#fff;">' + (S.lastA ? '<div style="font-size:26px;">' + ELS[S.lastA.e].g + '</div><b>' + S.lastA.v + '</b>' : '<span style="color:#64748b;">AI</span>') + '</div>';
      h += '<div style="color:#64748b;font-weight:800;">VS</div>';
      h += '<div style="text-align:center;color:#fff;">' + (S.lastP ? '<div style="font-size:26px;">' + ELS[S.lastP.e].g + '</div><b>' + S.lastP.v + '</b>' : '<span style="color:#64748b;">You</span>') + '</div></div>';
      h += '<div style="min-height:40px;font-weight:700;color:#4c1d95;margin:6px 2px;">' + esc(S.log) + '</div>';
      h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">';
      if (!S.over) S.hand.forEach(function (c, i) { h += '<button type="button" data-c="' + i + '" style="border:2px solid ' + ELS[c.e].c + ';border-radius:12px;background:#fff;padding:12px 4px;cursor:pointer;"><div style="font-size:26px;">' + ELS[c.e].g + '</div><div style="font-weight:800;font-size:20px;color:' + ELS[c.e].c + ';">' + c.v + '</div><div style="font-size:10px;color:#64748b;">' + ELS[c.e].n + '</div></button>'; });
      h += '</div>';
      if (S.over) h += '<div style="text-align:center;margin-top:12px;"><button type="button" class="gcx-btn pri" id="cdNew">\u21BB Play again</button></div>';
      h += '<div style="font-size:12px;color:#64748b;margin-top:10px;">\uD83D\uDD25 Flame beats \uD83C\uDF43 Leaf \u2022 \uD83C\uDF43 Leaf beats \uD83C\uDF0A Wave \u2022 \uD83C\uDF0A Wave beats \uD83D\uDD25 Flame.</div></div>';
      root.innerHTML = h;
      Array.prototype.forEach.call(root.querySelectorAll('[data-c]'), function (bt) { bt.onclick = function () { resolve(parseInt(bt.getAttribute('data-c'), 10)); }; });
      var nb = root.querySelector('#cdNew'); if (nb) nb.onclick = function () { S.php = S.ahp = 30; S.hand = [card(), card(), card(), card()]; S.ai = [card(), card(), card(), card()]; S.seenP = [0, 0, 0]; S.over = false; S.busy = false; S.lastA = S.lastP = null; S.log = 'Choose a card to attack.'; render(); };
    }
    render();
    return { update: function () {}, render: function () {}, destroy: function () {} };
  } };


  // ======================================================================
  //  CHCN GAME REGISTRY  —  single source of truth + unified lobby (v54)
  //  Fixes: base game-center.js hookNavigate map re-rendered its 9-game
  //  lobby LAST on every navigation, hiding the merged catalogue. We now
  //  register the unified lobby through hookNavigate AFTER the base map so
  //  it is the final render, and expose one registry every surface reads.
  // ======================================================================
  var GCX_DETAILS = {
    memory:    { genre:'Memory / Puzzle',        ai:false, diff:true,  desc:'Flip tiles two at a time and clear every matching pair in as few moves as possible.' },
    mines:     { genre:'Logic / Puzzle',         ai:false, diff:true,  desc:'Reveal safe squares, flag the hidden mines and clear the whole board.' },
    merge:     { genre:'Number / Puzzle',        ai:false, diff:true,  desc:'Slide and merge matching numbers to build your way up to 2048.' },
    snake:     { genre:'Arcade',                 ai:false, diff:true,  desc:'Steer the snake, eat food to grow longer and avoid hitting your own tail.' },
    simon:     { genre:'Memory / Arcade',        ai:false, diff:true,  desc:'Watch the colour-and-tone sequence then repeat it – it grows every round.' },
    math:      { genre:'Educational',            ai:false, diff:true,  desc:'Beat the timer by answering as many arithmetic questions as you can.' },
    scramble:  { genre:'Word / Educational',     ai:false, diff:true,  desc:'Unscramble the jumbled letters to spell the hidden word.' },
    capitals:  { genre:'Geography / Educational',ai:false, diff:true,  desc:'Choose the correct capital city – real-world geography trivia.' },
    typing:    { genre:'Typing / Educational',   ai:false, diff:true,  desc:'Type the sentence accurately and see your words-per-minute and accuracy.' },
    runner:    { genre:'Action / Arcade',        ai:false, diff:false, desc:'Dodge falling blocks by steering left and right – optional camera motion steering.' },
    catch:     { genre:'Action / Arcade',        ai:false, diff:false, desc:'Catch the good stars and dodge the bombs – optional camera motion steering.' },
    pursuit:   { genre:'Street Racing / Pursuit',ai:true,  diff:true,  desc:'Weave through city traffic, grab boost and shake the pursuit car. Three lives.' },
    nightshift:{ genre:'Underground Racing',     ai:true,  diff:true,  desc:'Night-circuit street racing – overtake as many rivals as you can before time runs out.' },
    moto:      { genre:'Motorcycle Racing',      ai:true,  diff:true,  desc:'Thread your bike through traffic and trigger nitro bursts for extra speed.' },
    garden:    { genre:'Lane Defence / Strategy',ai:true,  diff:true,  desc:'Plant guardians, bank energy and stop every wave before it reaches the gate.' },
    forge:     { genre:'Fighting',               ai:true,  diff:true,  desc:'1v1 brawler – punch, kick, block and chain combos against a thinking AI. Best of three.' },
    strikers:  { genre:'Football / Sports',      ai:true,  diff:true,  desc:'Top-down football against a tactical CPU team – dribble, pass and shoot.' },
    skybound:  { genre:'Platformer / Adventure', ai:true,  diff:false, desc:'Run and jump across floating islands, bop enemies, collect gems and reach the flag.' },
    void:      { genre:'Sci-Fi Shooter',         ai:true,  diff:true,  desc:'Survive escalating alien waves in an arena shooter with a screen-clearing pulse.' },
    chess:     { genre:'Board / Chess',          ai:true,  diff:true,  desc:'Full chess rules with a real evaluating AI – castling, en passant, promotion, checkmate.' },
    cards:     { genre:'Card Strategy',          ai:true,  diff:false, desc:'Elemental card duel against an adaptive AI – win the clash and drain their HP.' },
    blockfall: { genre:'Falling-Block Puzzle',   ai:false, diff:true,  desc:'Rotate and drop falling blocks to clear full lines – the stack speeds up as you score.' },
    mazechaser:{ genre:'Maze / Arcade',          ai:true,  diff:true,  desc:'Clear every pellet in the maze while dodging the roaming chasers.' }
  };

  // extra genuinely-playable games added this release (engines appended below)
  CATALOG.push({ k:'blockfall',  emo:'\uD83D\uDFE6', name:'CHCN: Block Fall',  cat:'puzzle', go:'GCXStart', desc:GCX_DETAILS.blockfall.desc });
  CATALOG.push({ k:'mazechaser', emo:'\uD83D\uDC7E', name:'CHCN: Maze Chaser', cat:'arcade', go:'GCXStart', desc:GCX_DETAILS.mazechaser.desc });

  function gcxRaw(id){ for(var i=0;i<CATALOG.length;i++){ if(CATALOG[i].k===id) return CATALOG[i]; } return null; }
  function gcxCatLabel(id){ for(var i=0;i<SECTIONS.length;i++){ if(SECTIONS[i].id===id) return SECTIONS[i].label; } return id; }

  function gcxRegistry(){
    var out=[];
    for(var i=0;i<CATALOG.length;i++){
      var g=CATALOG[i]; var d=GCX_DETAILS[g.k]||{};
      out.push({
        gameId:g.k, title:g.name, thumbnail:g.emo, category:g.cat,
        genre:d.genre || (g.cat?g.cat.charAt(0).toUpperCase()+g.cat.slice(1):'Game'),
        description:d.desc || g.desc || '',
        engine:g.go, route:'games', playable:true, offline:true,
        difficulty:!!d.diff, ai:!!d.ai, mobile:true, desktop:true,
        version:'54', release:'released', edu:(!!g.edu||g.cat==='edu')
      });
    }
    return out;
  }
  function gcxById(id){ var a=gcxRegistry(); for(var i=0;i<a.length;i++){ if(a[i].gameId===id) return a[i]; } return null; }
  function gcxCounts(){ var a=gcxRegistry(); return { total:a.length,
    playable:a.filter(function(x){return x.playable;}).length,
    offline:a.filter(function(x){return x.offline;}).length,
    ai:a.filter(function(x){return x.ai;}).length }; }
  function gcxCats(){ var m={}; gcxRegistry().forEach(function(x){ m[x.category]=(m[x.category]||0)+1; }); return m; }

  // ---- favourites + recently-played (localStorage, offline) ----
  function gcxFavs(){ return LS.get('chcn_gcx_favs', []); }
  function gcxIsFav(id){ return gcxFavs().indexOf(id)>=0; }
  function gcxToggleFav(id){ var f=gcxFavs(); var i=f.indexOf(id); if(i>=0) f.splice(i,1); else f.push(id); LS.set('chcn_gcx_favs', f); }
  function gcxRecents(){ return LS.get('chcn_gcx_recent', []); }
  function gcxRecord(id){ if(!gcxRaw(id)) return; var r=gcxRecents().filter(function(x){return x!==id;}); r.unshift(id); if(r.length>8) r=r.slice(0,8); LS.set('chcn_gcx_recent', r); }

  // single source of truth exposed to every surface (web + APK webview)
  try{ global.CHCNGameModules = MODULES; }catch(e){}
  global.CHCNGameRegistry = {
    version:'54',
    all:function(){ return gcxRegistry(); },
    byId:function(id){ return gcxById(id); },
    count:function(){ return gcxCounts(); },
    categories:function(){ return gcxCats(); },
    favorites:function(){ return gcxFavs(); },
    recent:function(){ return gcxRecents(); },
    launch:function(id){ var e=gcxRaw(id); if(!e) return false; gcxRecord(id); if(typeof global[e.go]==='function'){ global[e.go](id); return true; } return false; }
  };

  // ---- unified lobby CSS ----
  function gcxCSS2(){
    if(document.getElementById('gcx2-css')) return;
    var s=document.createElement('style'); s.id='gcx2-css';
    s.textContent=[
      '.gcx2 .gcx-head h1{margin:0 0 4px;font-size:24px;}',
      '.gcx2 .gcx-sub{margin:0 0 12px;color:#64748b;font-size:13px;}',
      '.gcx-stats{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 14px;}',
      '.gcx-stat{flex:1;min-width:92px;background:#f8f7ff;border:1px solid #ece9ff;border-radius:12px;padding:10px 12px;text-align:center;}',
      '.gcx-stat span{display:block;font-size:22px;font-weight:800;color:#4c1d95;}',
      '.gcx-stat{font-size:12px;color:#64748b;font-weight:700;}',
      '.gcx-tools{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px;}',
      '.gcx-search{flex:1;min-width:180px;border:1px solid #d6d3ef;border-radius:10px;padding:10px 14px;font-size:14px;}',
      '.gcx-sortsel{border:1px solid #d6d3ef;border-radius:10px;padding:10px 12px;font-size:14px;background:#fff;color:#4c1d95;font-weight:700;}',
      '.gcx-chips{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 16px;}',
      '.gcx-chip{border:1px solid #d6d3ef;background:#fff;color:#4c1d95;border-radius:999px;padding:6px 13px;font-size:13px;font-weight:700;cursor:pointer;}',
      '.gcx-chip.on{background:#7c3aed;color:#fff;border-color:#7c3aed;}',
      '.gcx-chipn{opacity:.7;font-size:11px;}',
      '.gcx-row{margin:0 0 18px;} .gcx-row-t{font-weight:800;color:#0f172a;margin:0 0 10px;font-size:15px;} .gcx-allt{margin-top:4px;}',
      '.gcx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;}',
      '.gcx-card{position:relative;background:#fff;border:1px solid #ece9ff;border-radius:14px;padding:14px 12px 12px;display:flex;flex-direction:column;align-items:center;text-align:center;box-shadow:0 1px 3px rgba(15,23,42,.06);}',
      '.gcx-card-emo{font-size:34px;line-height:1;margin:2px 0 8px;}',
      '.gcx-card-title{font-weight:800;font-size:14px;color:#0f172a;line-height:1.25;}',
      '.gcx-card-genre{font-size:11px;color:#7c3aed;font-weight:700;margin:3px 0 6px;}',
      '.gcx-card-desc{font-size:12px;color:#64748b;line-height:1.4;flex:1;margin-bottom:10px;}',
      '.gcx-card-tags{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-bottom:10px;}',
      '.gcx-tag{font-size:9px;font-weight:800;border-radius:20px;padding:2px 7px;text-transform:uppercase;letter-spacing:.3px;}',
      '.gcx-tag.new{color:#3730a3;background:#e0e7ff;} .gcx-tag.edu{color:#166534;background:#dcfce7;} .gcx-tag.ai{color:#9a3412;background:#ffedd5;} .gcx-tag.off{color:#0369a1;background:#e0f2fe;}',
      '.gcx-play{width:100%;border:none;background:#7c3aed;color:#fff;border-radius:10px;padding:9px 0;font-weight:800;font-size:13px;cursor:pointer;}',
      '.gcx-play:active{transform:scale(.97);}',
      '.gcx-star{position:absolute;top:8px;right:8px;border:none;background:transparent;font-size:18px;color:#cbd5e1;cursor:pointer;line-height:1;}',
      '.gcx-star.on{color:#f59e0b;}',
      '.gcx-empty{grid-column:1/-1;text-align:center;color:#64748b;padding:30px 10px;font-size:14px;}',
      '@media(max-width:420px){ .gcx-grid{grid-template-columns:repeat(auto-fill,minmax(130px,1fr));} }'
    ].join('');
    document.head.appendChild(s);
  }

  var GUI={ cat:'all', sort:'default', q:'' };
  function gcxFilter(reg){
    var out=reg.slice();
    if(GUI.cat!=='all') out=out.filter(function(x){return x.category===GUI.cat;});
    if(GUI.q){ var q=GUI.q.toLowerCase(); out=out.filter(function(x){ return (x.title+' '+x.genre+' '+x.description+' '+x.category).toLowerCase().indexOf(q)>=0; }); }
    if(GUI.sort==='az') out.sort(function(a,b){return a.title.localeCompare(b.title);});
    else if(GUI.sort==='za') out.sort(function(a,b){return b.title.localeCompare(a.title);});
    else if(GUI.sort==='genre') out.sort(function(a,b){return (a.genre+a.title).localeCompare(b.genre+b.title);});
    return out;
  }
  function gcxCard(x){
    var t='';
    if(x.engine==='GCXStart') t+='<span class="gcx-tag new">New</span>';
    if(x.edu) t+='<span class="gcx-tag edu">Edu</span>';
    if(x.ai) t+='<span class="gcx-tag ai">AI</span>';
    if(x.offline) t+='<span class="gcx-tag off">Offline</span>';
    return '<div class="gcx-card" data-id="'+x.gameId+'" data-cat="'+x.category+'">'+
      '<button type="button" class="gcx-star'+(gcxIsFav(x.gameId)?' on':'')+'" title="Favourite" onclick="event.stopPropagation();GCXFav(\''+x.gameId+'\')">'+(gcxIsFav(x.gameId)?'\u2605':'\u2606')+'</button>'+
      '<div class="gcx-card-emo">'+x.thumbnail+'</div>'+
      '<div class="gcx-card-title">'+esc(x.title)+'</div>'+
      '<div class="gcx-card-genre">'+esc(x.genre)+'</div>'+
      '<div class="gcx-card-desc">'+esc(x.description)+'</div>'+
      '<div class="gcx-card-tags">'+t+'</div>'+
      '<button type="button" class="gcx-play" onclick="GCXPlay(\''+x.gameId+'\')">\u25B6 Play</button>'+
    '</div>';
  }
  function gcxGridHtml(list){ return list.length ? list.map(gcxCard).join('') : '<div class="gcx-empty">No games match your search.</div>'; }

  function gcxLobby(){
    gcxCSS2(); injectCSS();
    var el=document.getElementById('page-games'); if(!el) return;
    var reg=gcxRegistry(); var c=gcxCounts();
    var favIds=gcxFavs(); var fav=reg.filter(function(x){return favIds.indexOf(x.gameId)>=0;});
    var rec=[]; gcxRecents().forEach(function(id){ var r=gcxById(id); if(r) rec.push(r); });
    var list=gcxFilter(reg);
    var h='<div class="gc-wrap gcx2">';
    h+='<div class="gcx-head"><h1>\uD83C\uDFAE CHCN Game Centre</h1>'+
       '<p class="gcx-sub">All original, offline games. <b id="gcxCount">'+list.length+'</b> shown \u2022 <b>'+c.total+'</b> total \u2022 '+c.playable+' playable \u2022 '+c.offline+' offline \u2022 '+c.ai+' with AI.</p></div>';
    h+='<div class="gcx-stats">'+
       '<div class="gcx-stat"><span>'+c.total+'</span>All Games</div>'+
       '<div class="gcx-stat"><span>'+fav.length+'</span>Favourites</div>'+
       '<div class="gcx-stat"><span>'+rec.length+'</span>Recently Played</div>'+
       '<div class="gcx-stat"><span>'+Object.keys(gcxCats()).length+'</span>Categories</div></div>';
    h+='<div class="gcx-tools"><input id="gcxSearch" class="gcx-search" type="search" placeholder="\uD83D\uDD0D Search all games\u2026" value="'+esc(GUI.q)+'" oninput="GCXSearch(this.value)">'+
       '<select class="gcx-sortsel" onchange="GCXSort(this.value)">'+
       ['default|Sort: Default','az|Title A\u2013Z','za|Title Z\u2013A','genre|By Genre'].map(function(o){var p=o.split('|');return '<option value="'+p[0]+'"'+(GUI.sort===p[0]?' selected':'')+'>'+p[1]+'</option>';}).join('')+
       '</select></div>';
    // category chips with live counts
    var cats=gcxCats(); var chips='<div class="gcx-chips"><button type="button" class="gcx-chip'+(GUI.cat==='all'?' on':'')+'" onclick="GCXCat(\'all\')">All <span class="gcx-chipn">'+reg.length+'</span></button>';
    for(var si=0;si<SECTIONS.length;si++){ var sid=SECTIONS[si].id; if(sid==='all'||!cats[sid]) continue; chips+='<button type="button" class="gcx-chip'+(GUI.cat===sid?' on':'')+'" onclick="GCXCat(\''+sid+'\')">'+SECTIONS[si].label+' <span class="gcx-chipn">'+cats[sid]+'</span></button>'; }
    chips+='</div>'; h+=chips;
    if(rec.length) h+='<div class="gcx-row"><div class="gcx-row-t">\u23F1\uFE0F Recently Played</div><div class="gcx-grid">'+rec.slice(0,6).map(gcxCard).join('')+'</div></div>';
    if(fav.length) h+='<div class="gcx-row"><div class="gcx-row-t">\u2605 Favourites</div><div class="gcx-grid">'+fav.map(gcxCard).join('')+'</div></div>';
    h+='<div class="gcx-row-t gcx-allt">\uD83D\uDCDA '+(GUI.cat==='all'?'All Games':gcxCatLabel(GUI.cat))+' <span class="gcx-chipn">('+list.length+')</span></div>';
    h+='<div class="gcx-grid" id="gcxGrid">'+gcxGridHtml(list)+'</div>';
    h+='<div id="gcPanel"></div></div>';
    el.innerHTML=h;
  }
  function gcxRenderGrid(){
    var list=gcxFilter(gcxRegistry());
    var g=document.getElementById('gcxGrid'); if(g) g.innerHTML=gcxGridHtml(list);
    var cnt=document.getElementById('gcxCount'); if(cnt) cnt.textContent=list.length;
  }

  global.GCXPlay=function(id){ var e=gcxRaw(id); if(!e){ toast('Game not found: '+id); return; } gcxRecord(id); if(typeof global[e.go]==='function') global[e.go](id); else toast('That game engine is unavailable.'); };
  global.GCXFav=function(id){ gcxToggleFav(id); gcxLobby(); };
  global.GCXCat=function(c){ GUI.cat=c; gcxLobby(); };
  global.GCXSort=function(v){ GUI.sort=v; gcxLobby(); };
  global.GCXSearch=function(v){ GUI.q=v; gcxRenderGrid(); };

  // ---- make the unified lobby authoritative ----
  global.renderGames=gcxLobby;
  // record recently-played across every engine (legacy / plus / new)
  ['GCshow','GCPlusStart','GCXStart'].forEach(function(fn){ var o=global[fn]; if(typeof o==='function'&&!o.__gcxWrap){ var w=function(k){ try{ gcxRecord(k); }catch(e){} return o.apply(this,arguments); }; w.__gcxWrap=true; try{ for(var kk in o){ if(o.hasOwnProperty(kk)) w[kk]=o[kk]; } }catch(e){} global[fn]=w; } });
  // register the unified lobby through hookNavigate AFTER base game-center.js
  // (its boot pushes first). Running last = our render wins, no hidden games.
  // NOTE: game-center-plus.js and the legacy expansion lobby ALSO wrap
  // window.navigate and re-render their own (smaller) lobby AFTER the hook
  // maps. To guarantee the unified registry is the final word on every
  // navigate('games'), we install one more OUTERMOST navigate wrapper as the
  // very last step of boot so gcxLobby always paints last.
  function gcxForceLast(){ if(global.__gcxForce) return; if(typeof global.navigate!=='function') return; global.__gcxForce=true; var orig=global.navigate; global.navigate=function(p){ var r=orig?orig.apply(this,arguments):undefined; if(p==='games'){ try{ gcxLobby(); }catch(e){} } return r; }; }
  function gcx2Boot(){ if(R.hookNavigate){ try{ R.hookNavigate({ games:gcxLobby }); }catch(e){} } gcxForceLast(); try{ var el=document.getElementById('page-games'); if(el&&el.offsetParent!==null) gcxLobby(); }catch(e){} }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){ gcx2Boot(); setTimeout(gcxForceLast,0); }); else setTimeout(function(){ gcx2Boot(); setTimeout(gcxForceLast,0); },0);

  // ---------------- CHCN: Block Fall (falling-block puzzle) ----------------
  MODULES.blockfall = { kind:'raf', w:300, h:540, help:'\u25C0 \u25B6 move, \u25B2 rotate, \u25BC soft-drop, Space hard-drop. Fill an entire row to clear it. The drop speeds up as your level rises.', make:function(G){
    var ctx=G.ctx, COLS=10, ROWS=18, CELL=30, d=ENV.diffNum(G.key);
    var COLORS=['#7c3aed','#0ea5e9','#f59e0b','#ef4444','#10b981','#ec4899','#eab308'];
    var SHAPES=[ [[1,1,1,1]], [[1,1],[1,1]], [[0,1,0],[1,1,1]], [[0,1,1],[1,1,0]], [[1,1,0],[0,1,1]], [[1,0,0],[1,1,1]], [[0,0,1],[1,1,1]] ];
    var grid=[]; for(var r=0;r<ROWS;r++){ grid.push([]); for(var c=0;c<COLS;c++) grid[r].push(0); }
    var cur=null, lines=0, level=1, dropAcc=0, dropInt=0.8-d*0.15;
    function rotate(m){ var R=m.length,C=m[0].length,o=[],x,y; for(x=0;x<C;x++){ o.push([]); for(y=R-1;y>=0;y--) o[x].push(m[y][x]); } return o; }
    function collide(m,px,py){ for(var y=0;y<m.length;y++) for(var x=0;x<m[y].length;x++){ if(!m[y][x]) continue; var gx=px+x, gy=py+y; if(gx<0||gx>=COLS||gy>=ROWS) return true; if(gy>=0&&grid[gy][gx]) return true; } return false; }
    function spawn(){ var i=Math.floor(Math.random()*SHAPES.length); cur={ m:SHAPES[i], x:Math.floor((COLS-SHAPES[i][0].length)/2), y:-SHAPES[i].length, col:COLORS[i] }; }
    function lock(){ var y,x; for(y=0;y<cur.m.length;y++) for(x=0;x<cur.m[y].length;x++){ if(cur.m[y][x]){ var gy=cur.y+y, gx=cur.x+x; if(gy<0){ ENV.gameOver('Stack overflow','Lines cleared: '+lines); cur=null; return; } grid[gy][gx]=cur.col; } }
      var cleared=0; for(var rr=ROWS-1;rr>=0;rr--){ var full=true; for(var cc=0;cc<COLS;cc++){ if(!grid[rr][cc]){ full=false; break; } } if(full){ grid.splice(rr,1); var row=[]; for(var k=0;k<COLS;k++) row.push(0); grid.unshift(row); cleared++; rr++; } }
      if(cleared){ lines+=cleared; var pts=[0,40,100,300,1200][cleared]*level; G.score=(G.score||0)+pts; ENV.setScore(G.score); level=1+Math.floor(lines/8); dropInt=Math.max(0.12,0.8-d*0.15-(level-1)*0.07); ENV.sfx(600+cleared*120,0.12,'square'); }
      spawn();
    }
    function step(){ if(!cur) return; if(collide(cur.m,cur.x,cur.y+1)) lock(); else cur.y++; }
    function tryMove(dx){ if(cur&&!collide(cur.m,cur.x+dx,cur.y)) cur.x+=dx; }
    function tryRotate(){ if(!cur) return; var nm=rotate(cur.m); var kicks=[0,-1,1,-2,2]; for(var k=0;k<kicks.length;k++){ if(!collide(nm,cur.x+kicks[k],cur.y)){ cur.m=nm; cur.x+=kicks[k]; ENV.sfx(500,0.04,'sine'); return; } } }
    function hardDrop(){ if(!cur) return; while(!collide(cur.m,cur.x,cur.y+1)) cur.y++; ENV.vibrate(30); lock(); }
    ENV.addPad([{a:'left',t:'\u25C0'},{a:'right',t:'\u25B6'}],[{a:'rot',t:'\u21BB'},{a:'down',t:'\u25BC'}]);
    spawn();
    return {
      onKey:function(k,dn){ if(!dn||G.over) return; if(k==='ArrowUp'||k==='w'||k==='W') tryRotate(); else if(k==='ArrowLeft'||k==='a'||k==='A') tryMove(-1); else if(k==='ArrowRight'||k==='d'||k==='D') tryMove(1); else if(k==='ArrowDown'||k==='s'||k==='S') step(); else if(k===' ') hardDrop(); },
      onAction:function(a,dn){ if(!dn||G.over) return; if(a==='left') tryMove(-1); else if(a==='right') tryMove(1); else if(a==='rot') tryRotate(); else if(a==='down') step(); },
      update:function(dt){ if(!cur) return; dropAcc+=dt; var di=dropInt; if(G.keys['ArrowDown']||G.btn.down) di=Math.min(di,0.05); if(dropAcc>=di){ dropAcc=0; step(); } ENV.setInfo('Lines '+lines+' \u2022 Lv '+level); },
      render:function(){ ctx.fillStyle='#0b1020'; ctx.fillRect(0,0,G.w,G.h); var r,c; for(r=0;r<ROWS;r++) for(c=0;c<COLS;c++){ ctx.fillStyle=grid[r][c]||'#131a2e'; ctx.fillRect(c*CELL+1,r*CELL+1,CELL-2,CELL-2); }
        if(cur){ ctx.fillStyle=cur.col; for(var y=0;y<cur.m.length;y++) for(var x=0;x<cur.m[y].length;x++){ if(cur.m[y][x]){ var gy=cur.y+y; if(gy>=0) ctx.fillRect((cur.x+x)*CELL+1,gy*CELL+1,CELL-2,CELL-2); } } } },
      destroy:function(){}
    };
  } };

  // ---------------- CHCN: Maze Chaser (maze / arcade) ----------------------
  MODULES.mazechaser = { kind:'raf', w:360, h:360, help:'Move with \u25C0\u25B6\u25B2\u25BC (or WASD / arrows). Eat every pellet to clear the maze. Avoid the chasers \u2013 touching one costs a life. Three lives.', make:function(G){
    var ctx=G.ctx, N=15, CELL=24, d=ENV.diffNum(G.key);
    function wall(r,c){ return (r===0||c===0||r===N-1||c===N-1) || (r%2===0 && c%2===0); }
    var pellets=[]; var total=0; for(var r=0;r<N;r++){ pellets.push([]); for(var c=0;c<N;c++){ var p=(!wall(r,c)); pellets[r].push(p); if(p) total++; } }
    function cellCenter(cc,rr){ return { x:cc*CELL+CELL/2, y:rr*CELL+CELL/2 }; }
    var player={ c:7, r:7, dir:{x:0,y:0}, next:{x:0,y:0}, acc:0, speed:0.14-d*0.015 };
    if(pellets[7][7]){ pellets[7][7]=false; total--; }
    var ghosts=[ {c:1,r:1,col:'#ef4444',acc:0,rnd:false}, {c:13,r:1,col:'#0ea5e9',acc:0,rnd:true}, {c:1,r:13,col:'#f59e0b',acc:0,rnd:false} ];
    var gSpeed=0.22-d*0.02; var lives=3, eaten=0, msgT=0;
    function canGo(rr,cc){ return rr>=0&&cc>=0&&rr<N&&cc<N&&!wall(rr,cc); }
    function ghostStep(g){ var opts=[], dirs=[[0,-1],[0,1],[-1,0],[1,0]]; for(var i=0;i<dirs.length;i++){ var nr=g.r+dirs[i][1], nc=g.c+dirs[i][0]; if(canGo(nr,nc)){ if(g.last&&dirs[i][0]===-g.last[0]&&dirs[i][1]===-g.last[1]) continue; opts.push(dirs[i]); } }
      if(!opts.length){ dirs.forEach(function(dd){ if(canGo(g.r+dd[1],g.c+dd[0])) opts.push(dd); }); }
      if(!opts.length) return; var pick;
      if(g.rnd && Math.random()<0.35){ pick=opts[Math.floor(Math.random()*opts.length)]; }
      else { var best=1e9; opts.forEach(function(o){ var dist=Math.abs((g.c+o[0])-player.c)+Math.abs((g.r+o[1])-player.r); if(dist<best){ best=dist; pick=o; } }); }
      g.c+=pick[0]; g.r+=pick[1]; g.last=pick;
    }
    function hitCheck(){ for(var i=0;i<ghosts.length;i++){ if(ghosts[i].c===player.c&&ghosts[i].r===player.r){ lives--; ENV.sfx(140,0.3,'sawtooth'); ENV.vibrate(120); if(lives<=0){ ENV.gameOver('Caught!','Pellets eaten: '+eaten+' / '+(eaten+total)); return; } player.c=7; player.r=7; player.dir={x:0,y:0}; player.next={x:0,y:0}; ghosts[0].c=1;ghosts[0].r=1; ghosts[1].c=13;ghosts[1].r=1; ghosts[2].c=1;ghosts[2].r=13; msgT=1.2; } } }
    ENV.addPad([{a:'left',t:'\u25C0'},{a:'right',t:'\u25B6'}],[{a:'up',t:'\u25B2'},{a:'down',t:'\u25BC'}]);
    function setDir(x,y){ player.next={x:x,y:y}; }
    return {
      onKey:function(k,dn){ if(!dn) return; if(k==='ArrowLeft'||k==='a'||k==='A') setDir(-1,0); else if(k==='ArrowRight'||k==='d'||k==='D') setDir(1,0); else if(k==='ArrowUp'||k==='w'||k==='W') setDir(0,-1); else if(k==='ArrowDown'||k==='s'||k==='S') setDir(0,1); },
      onAction:function(a,dn){ if(!dn) return; if(a==='left') setDir(-1,0); else if(a==='right') setDir(1,0); else if(a==='up') setDir(0,-1); else if(a==='down') setDir(0,1); },
      update:function(dt){ if(G.over) return; if(msgT>0) msgT-=dt;
        player.acc+=dt; if(player.acc>=player.speed){ player.acc=0;
          if((player.next.x||player.next.y)&&canGo(player.r+player.next.y,player.c+player.next.x)) player.dir={x:player.next.x,y:player.next.y};
          if((player.dir.x||player.dir.y)&&canGo(player.r+player.dir.y,player.c+player.dir.x)){ player.c+=player.dir.x; player.r+=player.dir.y; if(pellets[player.r][player.c]){ pellets[player.r][player.c]=false; total--; eaten++; G.score=eaten; ENV.setScore(eaten); ENV.sfx(880,0.03,'square'); if(total<=0){ ENV.gameOver('Maze cleared!','You ate all '+eaten+' pellets!'); return; } } }
          hitCheck(); if(G.over) return;
        }
        for(var i=0;i<ghosts.length;i++){ ghosts[i].acc+=dt; if(ghosts[i].acc>=gSpeed){ ghosts[i].acc=0; ghostStep(ghosts[i]); } }
        hitCheck();
        ENV.setInfo('\u2764\uFE0F'+lives+'  Pellets '+eaten);
      },
      render:function(){ ctx.fillStyle='#0b1020'; ctx.fillRect(0,0,G.w,G.h); var r,c;
        for(r=0;r<N;r++) for(c=0;c<N;c++){ if(wall(r,c)){ ctx.fillStyle='#1e293b'; ctx.fillRect(c*CELL,r*CELL,CELL,CELL); ctx.fillStyle='#334155'; ctx.fillRect(c*CELL+2,r*CELL+2,CELL-4,CELL-4); } else if(pellets[r][c]){ ctx.fillStyle='#fde68a'; var p=cellCenter(c,r); ctx.fillRect(p.x-2,p.y-2,4,4); } }
        var pc=cellCenter(player.c,player.r); ctx.fillStyle='#facc15'; if(ctx.beginPath){ ctx.beginPath(); ctx.arc(pc.x,pc.y,CELL/2-3,0,7); ctx.fill(); } else ctx.fillRect(pc.x-8,pc.y-8,16,16);
        for(var gi=0;gi<ghosts.length;gi++){ var gc=cellCenter(ghosts[gi].c,ghosts[gi].r); ctx.fillStyle=ghosts[gi].col; if(ctx.beginPath){ ctx.beginPath(); ctx.arc(gc.x,gc.y,CELL/2-3,0,7); ctx.fill(); } else ctx.fillRect(gc.x-8,gc.y-8,16,16); }
        if(msgT>0){ ctx.fillStyle='rgba(255,255,255,.9)'; ctx.font='16px sans-serif'; if(ctx.fillText) ctx.fillText('Life lost!',G.w/2-34,G.h/2); }
      },
      destroy:function(){}
    };
  } };


})(window);
