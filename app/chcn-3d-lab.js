/* =====================================================================
   CHCN 3D Learning Lab (v57+)  —  genuine interactive 3D activity.
   Self-registers a "lab3d" page via window.CHCNreg (same pattern as
   game-center.js). Uses Three.js (loaded from CDN on demand). If WebGL
   or the CDN is unavailable, a fully accessible NON-3D fallback is shown
   so the rest of the platform is never blocked.

   Learning activity: "Workplace Fire Safety — identify the extinguisher
   and perform the P.A.S.S. procedure". This maps to the safety/OHS
   outcomes that recur across the CHCN TVET catalogue (e.g. "Participate
   in workplace safety procedures"). It is a SIMULATION and is labelled as
   such; completing it is NOT evidence of real-world competence.

   Accessibility: keyboard (arrow keys rotate, +/- zoom), touch drag,
   prefers-reduced-motion halts auto-rotation, text alternatives + a
   non-3D checklist fallback, visible focus. No inline event handlers.
   ===================================================================== */
(function () {
  'use strict';
  var R = window.CHCNreg || {};
  var esc = R.esc || function (s) { return String(s == null ? '' : s); };
  var toast = R.toast || function (m) { try { alert(m); } catch (e) {} };
  var THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  var loaded = false, scene, camera, renderer, raf, group, reduceMotion = false;
  var step = 0; // P.A.S.S. progress 0..4
  var PASS = [
    { k: 'P', label: 'Pull the pin', detail: 'Pull the safety pin to break the tamper seal.' },
    { k: 'A', label: 'Aim low', detail: 'Aim the nozzle at the BASE of the fire, not the flames.' },
    { k: 'S', label: 'Squeeze', detail: 'Squeeze the handle to release the extinguishing agent.' },
    { k: 'S', label: 'Sweep', detail: 'Sweep side to side at the base until the fire is out.' }
  ];

  function injectCSS() {
    if (document.getElementById('lab3d-css')) return;
    var s = document.createElement('style'); s.id = 'lab3d-css';
    s.textContent = [
      '#page-lab3d{padding:16px;max-width:980px;margin:0 auto;}',
      '.lab3d-wrap{display:flex;flex-direction:column;gap:14px;}',
      '.lab3d-stage{position:relative;width:100%;height:420px;background:linear-gradient(180deg,#0b1020,#1a1a2e);border-radius:14px;overflow:hidden;outline:none;}',
      '.lab3d-stage:focus{box-shadow:0 0 0 3px #4f7cff;}',
      '.lab3d-stage canvas{display:block;width:100%;height:100%;}',
      '.lab3d-sim-tag{position:absolute;top:10px;left:10px;background:#b91c1c;color:#fff;font:600 12px/1 system-ui;padding:6px 10px;border-radius:999px;letter-spacing:.3px;}',
      '.lab3d-controls{display:flex;flex-wrap:wrap;gap:8px;}',
      '.lab3d-btn{border:1px solid #3a3a5a;background:#161630;color:#e8e8ff;border-radius:10px;padding:10px 14px;font:600 14px system-ui;cursor:pointer;}',
      '.lab3d-btn[aria-pressed="true"],.lab3d-btn:hover{background:#2a2a55;}',
      '.lab3d-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}',
      '.lab3d-step{border:1px solid #2a2a4a;border-radius:10px;padding:10px;background:#12122a;color:#cfd3ff;}',
      '.lab3d-step.done{border-color:#16a34a;background:#0f2a1a;}',
      '.lab3d-step h4{margin:0 0 4px;font-size:14px;}',
      '.lab3d-step small{color:#9aa0c8;}',
      '.lab3d-fallback{border:1px dashed #556;border-radius:12px;padding:16px;background:#0f0f22;color:#dfe3ff;}',
      '.lab3d-note{font-size:13px;color:#9aa0c8;}'
    ].join('');
    document.head.appendChild(s);
  }

  function stepsHtml() {
    return PASS.map(function (p, i) {
      return '<div class="lab3d-step' + (i < step ? ' done' : '') + '" data-i="' + i + '">' +
        '<h4>' + esc(p.k + ' \u2014 ' + p.label) + '</h4><small>' + esc(p.detail) + '</small></div>';
    }).join('');
  }

  function render() {
    injectCSS();
    var el = document.getElementById('page-lab3d');
    if (!el) return;
    el.innerHTML =
      '<h2 style="margin:4px 0 2px;">\uD83E\uDDEF 3D Learning Lab \u2014 Workplace Fire Safety</h2>' +
      '<p class="lab3d-note">Interactive simulation. Rotate with drag or arrow keys, zoom with +/\u2212. ' +
      'This is a <strong>simulation for learning</strong> and is not evidence of real-world competence.</p>' +
      '<div class="lab3d-wrap">' +
        '<div class="lab3d-stage" id="lab3dStage" tabindex="0" role="img" ' +
          'aria-label="Interactive 3D fire extinguisher. Use arrow keys to rotate, plus and minus to zoom.">' +
          '<span class="lab3d-sim-tag">SIMULATION</span>' +
        '</div>' +
        '<div class="lab3d-controls" id="lab3dControls">' +
          '<button class="lab3d-btn" data-act="next">Perform next step</button>' +
          '<button class="lab3d-btn" data-act="spin" aria-pressed="false">Auto-rotate</button>' +
          '<button class="lab3d-btn" data-act="reset">Reset</button>' +
          '<button class="lab3d-btn" data-act="fallback">Non-3D version</button>' +
        '</div>' +
        '<div class="lab3d-steps" id="lab3dSteps">' + stepsHtml() + '</div>' +
        '<div id="lab3dMsg" class="lab3d-note" aria-live="polite"></div>' +
      '</div>';
    wireControls();
    startThree();
  }

  function setMsg(t) { var m = document.getElementById('lab3dMsg'); if (m) m.textContent = t; }

  function advance() {
    if (step >= PASS.length) { setMsg('Procedure already complete.'); return; }
    step++;
    var sc = document.getElementById('lab3dSteps'); if (sc) sc.innerHTML = stepsHtml();
    if (step >= PASS.length) complete();
    else setMsg('Step ' + step + ' of ' + PASS.length + ' done: ' + PASS[step - 1].label + '.');
  }

  function complete() {
    setMsg('\u2705 P.A.S.S. procedure complete. (Simulation \u2014 not a competence record.)');
    toast('Fire-safety simulation completed');
    try {
      if (typeof getProgress === 'function' && typeof setProgress === 'function') {
        var p = getProgress() || {};
        p['sim:fire-safety-pass'] = 'done';
        setProgress(p);
      }
    } catch (e) {}
  }

  function reset() {
    step = 0;
    var sc = document.getElementById('lab3dSteps'); if (sc) sc.innerHTML = stepsHtml();
    setMsg('Reset. Perform the four P.A.S.S. steps in order.');
  }

  function showFallback() {
    teardown();
    var stage = document.getElementById('lab3dStage');
    if (!stage) return;
    stage.innerHTML = '<div class="lab3d-fallback"><strong>Non-3D version</strong>' +
      '<p>A red portable fire extinguisher. To use it, follow P.A.S.S.:</p><ol>' +
      PASS.map(function (p) { return '<li><strong>' + esc(p.k + ' \u2014 ' + p.label) + ':</strong> ' + esc(p.detail) + '</li>'; }).join('') +
      '</ol><p class="lab3d-note">This text alternative conveys the same learning content as the 3D scene.</p></div>';
    stage.setAttribute('role', 'region');
  }

  function wireControls() {
    var ctr = document.getElementById('lab3dControls');
    if (!ctr || ctr.__wired) return; ctr.__wired = true;
    ctr.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'next') advance();
      else if (act === 'reset') { reset(); if (!loaded) startThree(); }
      else if (act === 'fallback') showFallback();
      else if (act === 'spin') {
        var on = b.getAttribute('aria-pressed') === 'true';
        b.setAttribute('aria-pressed', on ? 'false' : 'true');
      }
    });
    var stage = document.getElementById('lab3dStage');
    if (stage && !stage.__keys) {
      stage.__keys = true;
      stage.addEventListener('keydown', function (e) {
        if (!group) return;
        if (e.key === 'ArrowLeft') group.rotation.y -= 0.15;
        else if (e.key === 'ArrowRight') group.rotation.y += 0.15;
        else if (e.key === 'ArrowUp') group.rotation.x -= 0.12;
        else if (e.key === 'ArrowDown') group.rotation.x += 0.12;
        else if (e.key === '+' || e.key === '=') camera && (camera.position.z = Math.max(2.2, camera.position.z - 0.4));
        else if (e.key === '-' || e.key === '_') camera && (camera.position.z = Math.min(9, camera.position.z + 0.4));
        else return;
        e.preventDefault();
      });
    }
  }

  function teardown() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    if (renderer) { try { renderer.dispose && renderer.dispose(); } catch (e) {} renderer = null; }
    scene = camera = group = null;
  }

  function buildExtinguisher(T) {
    var g = new T.Group();
    var red = new T.MeshStandardMaterial({ color: 0xc1121f, roughness: 0.4, metalness: 0.3 });
    var dark = new T.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });
    var body = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 2.2, 32), red);
    g.add(body);
    var top = new T.Mesh(new T.SphereGeometry(0.7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), red);
    top.position.y = 1.1; g.add(top);
    var neck = new T.Mesh(new T.CylinderGeometry(0.18, 0.18, 0.4, 16), dark);
    neck.position.y = 1.55; g.add(neck);
    var handle = new T.Mesh(new T.BoxGeometry(0.7, 0.14, 0.18), dark);
    handle.position.set(0.15, 1.8, 0); g.add(handle);
    var hose = new T.Mesh(new T.TorusGeometry(0.5, 0.05, 12, 40, Math.PI), dark);
    hose.position.set(-0.4, 1.0, 0); hose.rotation.z = Math.PI / 2; g.add(hose);
    return g;
  }

  function initScene() {
    var T = window.THREE; if (!T) return false;
    var stage = document.getElementById('lab3dStage'); if (!stage) return false;
    try {
      scene = new T.Scene();
      camera = new T.PerspectiveCamera(45, stage.clientWidth / stage.clientHeight, 0.1, 100);
      camera.position.set(0, 0.6, 6);
      renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(stage.clientWidth, stage.clientHeight);
      var tag = stage.querySelector('.lab3d-sim-tag');
      stage.insertBefore(renderer.domElement, tag || null);
      scene.add(new T.AmbientLight(0xffffff, 0.6));
      var d = new T.DirectionalLight(0xffffff, 0.9); d.position.set(3, 5, 4); scene.add(d);
      group = buildExtinguisher(T); scene.add(group);
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var spinBtn = document.querySelector('[data-act="spin"]');
      if (spinBtn) spinBtn.setAttribute('aria-pressed', reduce ? 'false' : 'true');
      var dragging = false, lx = 0, ly = 0;
      function down(x, y) { dragging = true; lx = x; ly = y; }
      function move(x, y) { if (!dragging || !group) return; group.rotation.y += (x - lx) * 0.01; group.rotation.x += (y - ly) * 0.01; lx = x; ly = y; }
      function up() { dragging = false; }
      renderer.domElement.addEventListener('pointerdown', function (e) { down(e.clientX, e.clientY); });
      window.addEventListener('pointermove', function (e) { move(e.clientX, e.clientY); });
      window.addEventListener('pointerup', up);
      loop();
      return true;
    } catch (e) { return false; }
  }

  function loop() {
    raf = requestAnimationFrame(loop);
    var spinBtn = document.querySelector('[data-act="spin"]');
    var spinning = spinBtn && spinBtn.getAttribute('aria-pressed') === 'true';
    if (spinning && group) group.rotation.y += 0.008;
    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  function startThree() {
    teardown();
    if (window.THREE) { if (!initScene()) showFallback(); loaded = true; return; }
    var s = document.createElement('script');
    s.src = THREE_CDN; s.async = true;
    s.onload = function () { if (!initScene()) showFallback(); loaded = true; };
    s.onerror = function () { showFallback(); setMsg('3D engine unavailable offline \u2014 showing the accessible text version.'); };
    document.head.appendChild(s);
  }

  function boot() {
    if (R.registerPages) R.registerPages(['lab3d']);
    if (R.ensureContainers) R.ensureContainers(['lab3d']);
    if (R.hookNavigate) R.hookNavigate({ 'lab3d': render });
    if (R.addNavLink) R.addNavLink('games', 'lab3d', '\uD83E\uDDEF 3D Lab');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.CHCN_lab3d = { render: render };
})();
