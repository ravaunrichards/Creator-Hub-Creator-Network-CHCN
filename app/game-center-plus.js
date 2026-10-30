/* =============================================================================
 * Creator Hub — Game Center Plus (game-center-plus.js)
 * -----------------------------------------------------------------------------
 * Adds, on top of the existing Game Center (game-center.js):
 *   1. A categorised game lobby with a WORKING filter (All / Action / Arcade /
 *      Puzzle / Educational). Legacy games open through the original engine
 *      (GCshow); new games open through this file.
 *   2. Brand-new original offline ACTION games built on requestAnimationFrame,
 *      each with a real PAUSE/RESUME button:
 *        • Lane Runner — dodge falling blocks by steering left/right.
 *        • Star Catch — catch good stars, dodge bombs.
 *   3. Optional WEBCAM HAND-MOTION STEERING for those action games: move your
 *      hand left/right in front of the camera to steer. Implemented with
 *      offline frame-differencing (no network, no ML model, no data leaves the
 *      device). Falls back cleanly to buttons/keyboard when no camera.
 * Everything is first-party and offline. Purely additive.
 * ========================================================================== */
(function (global) {
  'use strict';
  if (global.__gcPlus) return;
  global.__gcPlus = true;

  var R = global.CHCNreg || {};
  var esc = R.esc || function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var toast = R.toast || function (m) { try { global.showToast ? global.showToast(m) : alert(m); } catch (e) {} };

  // ---- Game catalogue (display only; legacy games reuse the old engine) ----
  // cat: action|arcade|puzzle|edu ; engine: 'legacy' (GCshow) or 'plus' (here)
  var CATALOG = [
    { k: 'runner',   emo: '\uD83C\uDFC3', name: 'Lane Runner', cat: 'action', engine: 'plus', edu: false, motion: true,  desc: 'Dodge falling blocks – steer left/right.' },
    { k: 'catch',    emo: '\u2B50',       name: 'Star Catch',  cat: 'action', engine: 'plus', edu: false, motion: true,  desc: 'Catch stars, dodge bombs.' },
    { k: 'snake',    emo: '\uD83D\uDC0D', name: 'Snake',       cat: 'arcade', engine: 'legacy', edu: false },
    { k: 'simon',    emo: '\uD83C\uDFB5', name: 'Simon Says',  cat: 'arcade', engine: 'legacy', edu: false },
    { k: 'memory',   emo: '\uD83E\uDDE0', name: 'Memory Match',cat: 'puzzle', engine: 'legacy', edu: false },
    { k: 'mines',    emo: '\uD83D\uDCA3', name: 'Mines',       cat: 'puzzle', engine: 'legacy', edu: false },
    { k: 'merge',    emo: '\uD83D\uDD22', name: 'Number Merge',cat: 'puzzle', engine: 'legacy', edu: false },
    { k: 'math',     emo: '\u2795',       name: 'Math Challenge', cat: 'edu', engine: 'legacy', edu: true },
    { k: 'scramble', emo: '\uD83D\uDD24', name: 'Word Scramble',  cat: 'edu', engine: 'legacy', edu: true },
    { k: 'capitals', emo: '\uD83C\uDF0D', name: 'Capital Cities', cat: 'edu', engine: 'legacy', edu: true },
    { k: 'typing',   emo: '\u2328\uFE0F', name: 'Typing Test',    cat: 'edu', engine: 'legacy', edu: true }
  ];
  var CATS = [
    { id: 'all',    label: 'All games' },
    { id: 'action', label: '\uD83C\uDFAF Action (motion)' },
    { id: 'arcade', label: '\uD83D\uDD79\uFE0F Arcade' },
    { id: 'puzzle', label: '\uD83E\uDDE9 Puzzle' },
    { id: 'edu',    label: '\uD83C\uDF93 Educational' }
  ];
  var curFilter = 'all';

  function injectCSS() {
    if (document.getElementById('gcp-css')) return;
    var s = document.createElement('style'); s.id = 'gcp-css';
    s.textContent = [
      '.gcp-filter{display:flex;flex-wrap:wrap;gap:8px;margin:6px 2px 14px;}',
      '.gcp-fbtn{border:1px solid #d6d3ef;background:#fff;color:#4c1d95;border-radius:999px;padding:7px 14px;font-size:13px;font-weight:700;cursor:pointer;}',
      '.gcp-fbtn.on{background:#7c3aed;color:#fff;border-color:#7c3aed;}',
      '.gcp-badge{display:inline-block;font-size:10px;font-weight:700;border-radius:20px;padding:1px 8px;margin-top:4px;}',
      '.gcp-badge.motion{color:#9a3412;background:#ffedd5;} .gcp-badge.edu{color:#166534;background:#dcfce7;} .gcp-badge.new{color:#3730a3;background:#e0e7ff;}',
      '.gcp-wrap{max-width:760px;margin:0 auto;}',
      '.gcp-stage{position:relative;background:#0f172a;border-radius:12px;overflow:hidden;touch-action:none;}',
      '.gcp-stage canvas{display:block;width:100%;height:auto;}',
      '.gcp-hud{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin:10px 0;}',
      '.gcp-hud .gcp-score{font-weight:800;color:#0f172a;}',
      '.gcp-ctrls{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0;}',
      '.gcp-btn{border:1px solid #d6d3ef;background:#fff;border-radius:10px;padding:9px 14px;font-weight:700;cursor:pointer;font-size:14px;}',
      '.gcp-btn.pri{background:#7c3aed;color:#fff;border-color:#7c3aed;}',
      '.gcp-btn:active{transform:scale(.96);}',
      '.gcp-steer{display:flex;gap:10px;justify-content:center;margin:12px 0;}',
      '.gcp-steer button{flex:1;max-width:160px;font-size:26px;padding:16px 0;border-radius:14px;border:1px solid #cbd5e1;background:#f1f5f9;font-weight:800;cursor:pointer;user-select:none;}',
      '.gcp-steer button:active{background:#7c3aed;color:#fff;}',
      '.gcp-cam{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#f8f7ff;border:1px solid #ece9ff;border-radius:10px;padding:10px;margin:10px 0;}',
      '.gcp-cam video{width:96px;height:72px;border-radius:8px;background:#000;transform:scaleX(-1);object-fit:cover;}',
      '.gcp-cam .cam-txt{font-size:12px;color:#475569;flex:1;min-width:140px;}',
      '.gcp-note{background:#f8f7ff;border-left:3px solid #7c3aed;border-radius:8px;padding:10px 12px;margin:8px 0;font-size:13px;color:#475569;line-height:1.5;}',
      '.gcp-over{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(15,23,42,.78);color:#fff;text-align:center;padding:16px;}',
      '.gcp-over h3{margin:0 0 6px;font-size:22px;} .gcp-over p{margin:0 0 14px;}'
    ].join('');
    document.head.appendChild(s);
  }
  // ---- Categorised lobby with working filter -------------------------------
  function tileHtml(g) {
    var badge = g.motion ? '<div class="gcp-badge motion">\uD83C\uDFA5 Motion</div>'
              : (g.engine === 'plus' ? '<div class="gcp-badge new">New</div>'
              : (g.edu ? '<div class="gcp-badge edu">Educational</div>' : ''));
    var onclick = g.engine === 'plus'
      ? 'GCPlusStart(\'' + g.k + '\')'
      : 'GCshow(\'' + g.k + '\')';
    return '<div class="gc-tile" data-cat="' + g.cat + '" onclick="' + onclick + '">' +
      '<div class="emo">' + g.emo + '</div><div>' + esc(g.name) + '</div>' + badge + '</div>';
  }

  function filterBar() {
    var h = '<div class="gcp-filter">';
    CATS.forEach(function (c) {
      h += '<button type="button" class="gcp-fbtn' + (c.id === curFilter ? ' on' : '') +
        '" onclick="GCPlusFilter(\'' + c.id + '\')">' + c.label + '</button>';
    });
    return h + '</div>';
  }

  function lobby() {
    injectCSS();
    var el = document.getElementById('page-games');
    if (!el) return;
    var h = '<div class="gc-wrap"><div class="gc-hero"><h1>\uD83C\uDFAE Game Center</h1>' +
      '<p>Original offline games – arcade fun, brain-training and camera-steered action, no internet needed. Use the filter to pick a category.</p></div>';
    h += filterBar();
    // group by category in a fixed, friendly order
    var order = ['action', 'arcade', 'puzzle', 'edu'];
    var titles = { action: '\uD83C\uDFAF Action (steer / motion)', arcade: '\uD83D\uDD79\uFE0F Arcade', puzzle: '\uD83E\uDDE9 Puzzle', edu: '\uD83C\uDF93 Educational' };
    order.forEach(function (cat) {
      var items = CATALOG.filter(function (g) { return g.cat === cat; });
      if (!items.length) return;
      var show = (curFilter === 'all' || curFilter === cat);
      h += '<div class="gcp-cat-sec" data-cat="' + cat + '" style="' + (show ? '' : 'display:none;') + '">';
      h += '<div class="gc-sec-title">' + titles[cat] + '</div><div class="gc-grid">';
      items.forEach(function (g) { h += tileHtml(g); });
      h += '</div></div>';
    });
    h += '<div id="gcPanel"></div></div>';
    el.innerHTML = h;
  }

  global.GCPlusFilter = function (cat) {
    curFilter = cat;
    // toggle category sections
    var secs = document.querySelectorAll('.gcp-cat-sec');
    for (var i = 0; i < secs.length; i++) {
      var c = secs[i].getAttribute('data-cat');
      secs[i].style.display = (cat === 'all' || cat === c) ? '' : 'none';
    }
    var btns = document.querySelectorAll('.gcp-fbtn');
    for (var j = 0; j < btns.length; j++) { btns[j].classList.remove('on'); }
    var active = document.querySelector('.gcp-fbtn[onclick*="\'' + cat + '\'"]');
    if (active) active.classList.add('on');
  };

  // Replace the stock lobby and make navigation use ours.
  global.renderGames = lobby;
  function reroute() {
    if (typeof global.navigate === 'function' && !global.__gcpNav) {
      global.__gcpNav = true;
      var orig = global.navigate;
      global.navigate = function (p) {
        var r = orig.apply(this, arguments);
        if (p === 'games') { try { lobby(); } catch (e) {} }
        return r;
      };
    }
    // When a plus game ends and the user quits, show OUR lobby.
    if (typeof global.GCquit === 'function' && !global.__gcpQuit) {
      global.__gcpQuit = true;
      var oq = global.GCquit;
      global.GCquit = function () { try { stopGame(); } catch (e) {} oq.apply(this, arguments); try { lobby(); } catch (e) {} };
    }
  }
  // ======================================================================
  //  WEBCAM HAND-MOTION STEERING (offline frame-differencing)
  // ----------------------------------------------------------------------
  //  No ML model, no network. We grab small video frames, compute the
  //  per-pixel brightness change vs the previous frame, and work out the
  //  horizontal centre of motion. Moving your hand left/right shifts that
  //  centre, which we map (mirrored) to a steering value in [-1, 1].
  // ======================================================================
  var Motion = {
    stream: null, video: null, canvas: null, ctx: null, prev: null,
    raf: 0, active: false, value: 0, amount: 0, onUpdate: null, W: 48, H: 36
  };

  Motion.supported = function () {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  Motion.start = function (videoEl, onUpdate) {
    if (!Motion.supported()) return Promise.reject(new Error('no-camera'));
    Motion.onUpdate = onUpdate;
    return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 }, audio: false })
      .then(function (stream) {
        Motion.stream = stream;
        Motion.video = videoEl;
        videoEl.srcObject = stream;
        videoEl.muted = true; videoEl.playsInline = true;
        var c = document.createElement('canvas'); c.width = Motion.W; c.height = Motion.H;
        Motion.canvas = c; Motion.ctx = c.getContext('2d');
        Motion.prev = null; Motion.active = true;
        return videoEl.play().catch(function () {}).then(function () { Motion.loop(); });
      });
  };

  Motion.loop = function () {
    if (!Motion.active) return;
    try {
      var W = Motion.W, H = Motion.H, ctx = Motion.ctx;
      ctx.drawImage(Motion.video, 0, 0, W, H);
      var frame = ctx.getImageData(0, 0, W, H).data;
      if (Motion.prev) {
        var sumX = 0, total = 0;
        for (var y = 0; y < H; y++) {
          for (var x = 0; x < W; x++) {
            var i = (y * W + x) * 4;
            var g1 = (frame[i] + frame[i + 1] + frame[i + 2]) / 3;
            var g0 = (Motion.prev[i] + Motion.prev[i + 1] + Motion.prev[i + 2]) / 3;
            var d = Math.abs(g1 - g0);
            if (d > 24) { total += d; sumX += x * d; }
          }
        }
        if (total > 1500) {
          var cx = (sumX / total) / (W - 1);      // 0..1 across frame
          var mirrored = 1 - cx;                   // camera is mirrored for the user
          var steer = (mirrored - 0.5) * 2;        // -1 (left) .. +1 (right)
          // smooth toward the new value
          Motion.value = Motion.value * 0.6 + steer * 0.4;
          Motion.amount = total;
        } else {
          Motion.amount = 0; // not enough movement: hold steering
        }
        if (typeof Motion.onUpdate === 'function') Motion.onUpdate(Motion.value, Motion.amount);
      }
      Motion.prev = frame;
    } catch (e) { /* frame not ready yet */ }
    Motion.raf = requestAnimationFrame(Motion.loop);
  };

  Motion.stop = function () {
    Motion.active = false;
    if (Motion.raf) { cancelAnimationFrame(Motion.raf); Motion.raf = 0; }
    if (Motion.stream) { Motion.stream.getTracks().forEach(function (t) { t.stop(); }); Motion.stream = null; }
    if (Motion.video) { try { Motion.video.srcObject = null; } catch (e) {} }
    Motion.prev = null; Motion.value = 0; Motion.amount = 0;
  };

  // ---- tiny offline sound helper (Web Audio) ----
  var AC = null;
  function ac() { try { if (!AC) AC = new (global.AudioContext || global.webkitAudioContext)(); } catch (e) { AC = null; } return AC; }
  function beep(freq, dur, type) {
    var c = ac(); if (!c) return;
    try {
      var o = c.createOscillator(), g = c.createGain();
      o.type = type || 'square'; o.frequency.value = freq;
      g.gain.value = 0.0001; o.connect(g); g.connect(c.destination);
      var t = c.currentTime;
      g.gain.exponentialRampToValueAtTime(0.2, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.12));
      o.start(t); o.stop(t + (dur || 0.12) + 0.02);
    } catch (e) {}
  }
  // ======================================================================
  //  ACTION GAME ENGINE (requestAnimationFrame, with real Pause)
  // ======================================================================
  var G = null; // active game state

  var DEFS = {
    runner: {
      name: 'Lane Runner', emo: '\uD83C\uDFC3',
      help: 'Steer left and right to dodge the falling blocks. The longer you last, the faster they come. Use the on-screen \u25C0 \u25B6 buttons, the arrow keys, or turn on camera steering and move your hand left/right.'
    },
    catch: {
      name: 'Star Catch', emo: '\u2B50',
      help: 'Move your basket to CATCH the yellow stars (+1 each) and AVOID the red bombs. Use the \u25C0 \u25B6 buttons, the arrow keys, or camera hand-steering.'
    }
  };

  function best(key) { try { return parseInt(localStorage.getItem('chcn_gcp_best_' + key) || '0', 10) || 0; } catch (e) { return 0; } }
  function setBest(key, v) { try { localStorage.setItem('chcn_gcp_best_' + key, String(v)); } catch (e) {} }

  global.GCPlusStart = function (key) {
    if (!DEFS[key]) return;
    stopGame();
    injectCSS();
    var panel = document.getElementById('gcPanel');
    if (!panel) { lobby(); panel = document.getElementById('gcPanel'); }
    if (!panel) return;
    var d = DEFS[key];
    panel.innerHTML =
      '<div class="gc-card"><div class="gc-bar"><h3 style="margin:0;">' + d.emo + ' ' + esc(d.name) + '</h3></div>' +
      '<div class="gcp-note">' + esc(d.help) + '</div>' +
      '<div class="gcp-hud"><span class="gcp-score" id="gcpScore">Score: 0</span>' +
        '<span class="gcp-score" id="gcpBest">Best: ' + best(key) + '</span></div>' +
      '<div class="gcp-stage" id="gcpStage"><canvas id="gcpCanvas" width="360" height="480"></canvas></div>' +
      '<div class="gcp-steer"><button type="button" id="gcpL">\u25C0</button><button type="button" id="gcpR">\u25B6</button></div>' +
      '<div class="gcp-ctrls">' +
        '<button type="button" class="gcp-btn pri" id="gcpPause" onclick="GCPlusPause()">\u23F8\uFE0F Pause</button>' +
        '<button type="button" class="gcp-btn" onclick="GCPlusRestart()">\u21BB Restart</button>' +
        '<button type="button" class="gcp-btn" onclick="GCPlusQuitGame()">\u2715 Back to games</button>' +
      '</div>' +
      '<div class="gcp-cam">' +
        '<video id="gcpVideo" playsinline muted></video>' +
        '<span class="cam-txt" id="gcpCamTxt">Camera steering is off. Turn it on to steer by moving your hand left/right.</span>' +
        '<button type="button" class="gcp-btn" id="gcpCamBtn" onclick="GCPlusCamToggle()">\uD83C\uDFA5 Enable camera steering</button>' +
      '</div></div>';

    var cv = document.getElementById('gcpCanvas');
    G = {
      key: key, cv: cv, ctx: cv.getContext('2d'), w: cv.width, h: cv.height,
      raf: 0, running: true, paused: false, over: false, score: 0, last: 0,
      player: { x: cv.width / 2, w: 46, h: 16 },
      btn: 0, keyDir: 0, camOn: false,
      ents: [], spawn: 0, speed: 120, acc: 6
    };
    bindInput();
    G.last = 0;
    G.raf = requestAnimationFrame(frame);
    try { panel.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
  };

  function stopGame() {
    if (G) { G.running = false; if (G.raf) cancelAnimationFrame(G.raf); }
    try { Motion.stop(); } catch (e) {}
    G = null;
  }
  global.GCPlusQuitGame = function () { stopGame(); lobby(); };
  global.GCPlusRestart = function () { if (G) { var k = G.key; GCPlusStart(k); } };

  global.GCPlusPause = function () {
    if (!G || G.over) return;
    var btn = document.getElementById('gcpPause');
    G.paused = !G.paused;
    if (G.paused) { if (btn) btn.textContent = '\u25B6\uFE0F Resume'; drawPauseOverlay(); }
    else { if (btn) btn.textContent = '\u23F8\uFE0F Pause'; G.last = 0; }
  };

  function drawPauseOverlay() {
    var st = document.getElementById('gcpStage'); if (!st || document.getElementById('gcpPauseOv')) return;
    var o = document.createElement('div'); o.className = 'gcp-over'; o.id = 'gcpPauseOv';
    o.innerHTML = '<h3>\u23F8\uFE0F Paused</h3><p>Take a break – your game is frozen.</p>' +
      '<button type="button" class="gcp-btn pri" onclick="GCPlusPause()">\u25B6\uFE0F Resume</button>';
    st.appendChild(o);
  }
  function clearOverlay() { var o = document.getElementById('gcpPauseOv'); if (o) o.parentNode.removeChild(o); var g = document.getElementById('gcpOverOv'); if (g) g.parentNode.removeChild(g); }
  // ---- input ----
  function bindInput() {
    var L = document.getElementById('gcpL'), Rb = document.getElementById('gcpR');
    function hold(el, dir) {
      var down = function (e) { e.preventDefault(); if (G) G.btn = dir; };
      var up = function () { if (G && G.btn === dir) G.btn = 0; };
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointerleave', up);
      el.addEventListener('pointercancel', up);
    }
    if (L) hold(L, -1);
    if (Rb) hold(Rb, 1);
    if (!global.__gcpKeys) {
      global.__gcpKeys = true;
      document.addEventListener('keydown', function (e) {
        if (!G || !G.running) return;
        if (e.key === 'ArrowLeft') { G.keyDir = -1; e.preventDefault(); }
        else if (e.key === 'ArrowRight') { G.keyDir = 1; e.preventDefault(); }
        else if (e.key === ' ' || e.key === 'p' || e.key === 'P') { GCPlusPause(); e.preventDefault(); }
      });
      document.addEventListener('keyup', function (e) {
        if (!G) return;
        if ((e.key === 'ArrowLeft' && G.keyDir === -1) || (e.key === 'ArrowRight' && G.keyDir === 1)) G.keyDir = 0;
      });
    }
  }

  global.GCPlusCamToggle = function () {
    if (!G) return;
    var txt = document.getElementById('gcpCamTxt'), btn = document.getElementById('gcpCamBtn');
    if (G.camOn) {
      Motion.stop(); G.camOn = false;
      if (btn) btn.textContent = '\uD83C\uDFA5 Enable camera steering';
      if (txt) txt.textContent = 'Camera steering is off. Turn it on to steer by moving your hand left/right.';
      return;
    }
    if (!Motion.supported()) { if (txt) txt.textContent = 'This device/browser has no camera available for motion steering – use the buttons or arrow keys.'; return; }
    if (txt) txt.textContent = 'Starting camera\u2026 please allow camera access.';
    var video = document.getElementById('gcpVideo');
    Motion.start(video, function () {}).then(function () {
      G.camOn = true;
      if (btn) btn.textContent = '\uD83C\uDFA5 Turn off camera steering';
      if (txt) txt.textContent = 'Camera steering ON – move your hand left/right in front of the camera to steer. Buttons/keys still work too.';
    }).catch(function () {
      G.camOn = false;
      if (txt) txt.textContent = 'Could not start the camera (permission denied or unavailable). Use the buttons or arrow keys instead.';
    });
  };

  // ---- main loop ----
  function frame(ts) {
    if (!G || !G.running) return;
    G.raf = requestAnimationFrame(frame);
    if (G.paused || G.over) return;
    if (!G.last) G.last = ts;
    var dt = Math.min(0.05, (ts - G.last) / 1000); G.last = ts;
    update(dt); draw();
  }

  function applySteer(dt) {
    var pw = G.player.w, minX = pw / 2, maxX = G.w - pw / 2;
    if (G.camOn && Motion.amount > 0) {
      var v = Math.max(-1, Math.min(1, Motion.value));
      var target = minX + (0.5 + v * 0.5) * (maxX - minX);
      G.player.x += (target - G.player.x) * Math.min(1, dt * 9);
    } else {
      var dir = G.keyDir || G.btn;
      G.player.x += dir * G.w * 1.15 * dt;
    }
    if (G.player.x < minX) G.player.x = minX;
    if (G.player.x > maxX) G.player.x = maxX;
  }

  function update(dt) {
    applySteer(dt);
    G.speed += G.acc * dt;
    G.spawn -= dt;
    if (G.key === 'runner') updateRunner(dt);
    else updateCatch(dt);
  }

  function updateRunner(dt) {
    if (G.spawn <= 0) {
      var bw = 34 + Math.random() * 40;
      G.ents.push({ x: Math.random() * (G.w - bw), y: -40, w: bw, h: 26 });
      G.spawn = Math.max(0.35, 0.95 - G.score * 0.015);
    }
    var py = G.h - 30, pw = G.player.w, ph = G.player.h;
    var px0 = G.player.x - pw / 2, px1 = G.player.x + pw / 2;
    for (var i = G.ents.length - 1; i >= 0; i--) {
      var e = G.ents[i]; e.y += G.speed * dt;
      if (e.y > G.h) { G.ents.splice(i, 1); G.score++; setScore(); beep(620, 0.05, 'sine'); continue; }
      if (e.y + e.h >= py && e.y <= py + ph && e.x < px1 && e.x + e.w > px0) { return gameOver(); }
    }
  }

  function updateCatch(dt) {
    if (G.spawn <= 0) {
      var bomb = Math.random() < 0.3;
      G.ents.push({ x: 18 + Math.random() * (G.w - 36), y: -20, r: 14, bomb: bomb });
      G.spawn = Math.max(0.4, 0.9 - G.score * 0.01);
    }
    var by = G.h - 24, pw = G.player.w;
    for (var i = G.ents.length - 1; i >= 0; i--) {
      var e = G.ents[i]; e.y += G.speed * dt;
      var caught = (e.y + e.r >= by && Math.abs(e.x - G.player.x) < pw / 2 + e.r);
      if (caught) {
        if (e.bomb) { return gameOver(); }
        G.ents.splice(i, 1); G.score++; setScore(); beep(720, 0.06, 'sine'); continue;
      }
      if (e.y - e.r > G.h) { G.ents.splice(i, 1); }
    }
  }

  function setScore() { var s = document.getElementById('gcpScore'); if (s) s.textContent = 'Score: ' + G.score; }

  function draw() {
    var c = G.ctx, w = G.w, h = G.h;
    c.fillStyle = '#0f172a'; c.fillRect(0, 0, w, h);
    if (G.key === 'runner') {
      c.fillStyle = '#f43f5e';
      G.ents.forEach(function (e) { c.fillRect(e.x, e.y, e.w, e.h); });
      c.fillStyle = '#22c55e';
      c.fillRect(G.player.x - G.player.w / 2, G.h - 30, G.player.w, G.player.h);
    } else {
      G.ents.forEach(function (e) {
        c.beginPath(); c.arc(e.x, e.y, e.r, 0, 7);
        c.fillStyle = e.bomb ? '#ef4444' : '#facc15'; c.fill();
      });
      c.fillStyle = '#38bdf8';
      c.fillRect(G.player.x - G.player.w / 2, G.h - 24, G.player.w, 12);
    }
  }

  function gameOver() {
    G.over = true;
    beep(180, 0.3, 'sawtooth');
    if (G.score > best(G.key)) { setBest(G.key, G.score); var b = document.getElementById('gcpBest'); if (b) b.textContent = 'Best: ' + G.score; }
    var st = document.getElementById('gcpStage'); if (!st) return;
    var o = document.createElement('div'); o.className = 'gcp-over'; o.id = 'gcpOverOv';
    o.innerHTML = '<h3>\uD83D\uDCA5 Game over</h3><p>Score: ' + G.score + '</p>' +
      '<button type="button" class="gcp-btn pri" onclick="GCPlusRestart()">\u21BB Play again</button>';
    st.appendChild(o);
  }

  function boot() {
    injectCSS();
    reroute();
    var el = document.getElementById('page-games');
    if (el && el.style.display !== 'none' && el.innerHTML.indexOf('gcp-filter') < 0) {
      try { lobby(); } catch (e) {}
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
