/* =============================================================================
 * Creator Hub — Non-Blocking Overlay Manager  (chcn-overlay-manager.js)
 * -----------------------------------------------------------------------------
 * FINAL MASTER BUILD module. Purely ADDITIVE — never removes/disables features.
 * Loaded LAST so its layer rules win the cascade.
 *
 * SAFETY-HARDENED build:
 *   • All DOM reads/writes are DEBOUNCED and run OUTSIDE the MutationObserver
 *     via requestAnimationFrame, with a re-entrancy guard + observer
 *     disconnect-during-write, so there is NO feedback loop / main-thread hang.
 *   • It never disables pointer-events on real content; the only elements it
 *     ever hides are a short, explicit allow-list of optional floating buttons.
 * ========================================================================== */
(function (global) {
  'use strict';
  if (global.__chcnOverlayMgr) return;
  global.__chcnOverlayMgr = true;

  var doc = global.document;
  var LS = { floating: 'chcn_floating_enabled', focus: 'chcn_focus_mode' };
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---- 1. Central layer scale (single source of truth) ------------------- */
  function injectLayerCSS() {
    if (doc.getElementById('chcnLayerCSS')) return;
    var s = doc.createElement('style');
    s.id = 'chcnLayerCSS';
    s.textContent = [
      ':root{',
      '  --chcn-z-optfloat:4000; --chcn-z-modal:9000; --chcn-z-toast:9800; --chcn-z-system:10000;}',
      '.modal-overlay{z-index:var(--chcn-z-modal)!important;}',
      '.voice-hub{z-index:var(--chcn-z-modal)!important;}',
      '.chcn-settings-overlay{z-index:var(--chcn-z-modal)!important;}',
      '.gc-modal{z-index:var(--chcn-z-modal)!important;}',
      '.ch-ed-modal{z-index:var(--chcn-z-modal)!important;}',
      '.toast{z-index:var(--chcn-z-toast)!important;}',
      '.chcn-optfloat{z-index:var(--chcn-z-optfloat)!important;transition:opacity .18s ease;}',
      '.chcn-optfloat.chcn-hidden{opacity:0!important;pointer-events:none!important;visibility:hidden!important;}',
      'body.chcn-focus *{animation-duration:.001s!important;}'
    ].join('\n');
    (doc.head || doc.documentElement).appendChild(s);
  }

  /* ---- 2. Optional floating controls — INDIVIDUAL, per-tool toggles ------ */
  /* Each tool can be switched on/off on its own. The master switch below is
   * an overall on/off that applies to all of them at once. */
  var FLOAT_ITEMS = [
    { id: 'display', label: 'Display button (Aa)',     sel: ['#chcnVCBtn'] },
    { id: 'voice',   label: 'Voice & read-aloud dock', sel: ['.chcn-dock', '#chcnDockPanel', '#chcnMicBtn', '#chcnReadBtn'] },
    { id: 'orient',  label: 'Screen rotation button',  sel: ['#chcnOrientFab', '.chcn-orient-fab'] },
    { id: 'assist',  label: 'Assistant microphone',    sel: ['#assistantMicBtn'] }
  ];
  var LS_ITEM = 'chcn_float_item_';
  function itemEnabled(id) { return lsGet(LS_ITEM + id, '1') !== '0'; }
  function setItemEnabled(id, on) { lsSet(LS_ITEM + id, on ? '1' : '0'); scheduleApply(); }

  function optionalNodes() {
    var list = [];
    FLOAT_ITEMS.forEach(function (it) {
      it.sel.forEach(function (sel) {
        var n; try { n = doc.querySelectorAll(sel); } catch (e) { return; }
        for (var i = 0; i < n.length; i++) { n[i].classList.add('chcn-optfloat'); if (!n[i].__chcnDrag) makeDraggable(n[i], 'chcn_pos_' + it.id); list.push({ node: n[i], item: it.id }); }
      });
    });
    return list;
  }

  /* ---- 3. Lightweight context detection → body[data-chcn-mode] ----------- */
  function shown(el) { return !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length)); }
  function anyShown(sel) {
    var n; try { n = doc.querySelectorAll(sel); } catch (e) { return false; }
    for (var i = 0; i < n.length; i++) if (shown(n[i])) return true;
    return false;
  }
  function detectMode() {
    var vids = doc.getElementsByTagName('video'), i;
    for (i = 0; i < vids.length; i++) if (vids[i].srcObject && shown(vids[i])) return 'camera';
    if (anyShown('#gcpCanvas') || anyShown('.gcp-stage')) return 'game';
    if (anyShown('.quiz-viewer') || anyShown('.quiz-body')) return 'quiz';
    if (anyShown('.lesson-viewer')) return 'lesson';
    for (i = 0; i < vids.length; i++) if (shown(vids[i]) && !vids[i].paused) return 'video';
    var pay = doc.getElementById('page-payment');
    if (pay && shown(pay)) return 'payment';
    var ae = doc.activeElement;
    if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return 'form';
    return 'browse';
  }
  var RESTRICTIVE = { game: 1, quiz: 1, exam: 1, payment: 1, camera: 1, video: 1 };

  /* ---- 4. State ---------------------------------------------------------- */
  var floatingEnabled = lsGet(LS.floating, '1') !== '0';
  var focusMode = lsGet(LS.focus, '0') === '1';
  var tempShow = false;
  var currentMode = 'browse';

  function shouldHide() {
    if (!floatingEnabled) return true;
    if (focusMode && !tempShow) return true;
    if (RESTRICTIVE[currentMode] && !tempShow) return true;
    return false;
  }

  /* ---- 5. Apply (debounced, guarded, observer-safe) ---------------------- */
  var mo = null, writing = false, scheduled = false;
  function scheduleApply() {
    if (scheduled) return; scheduled = true;
    global.requestAnimationFrame(function () { scheduled = false; apply(); });
  }
  function apply() {
    if (writing) return;
    writing = true;
    try {
      if (mo) mo.disconnect();              // never observe our own writes
      var m = detectMode();
      if (m !== currentMode) { currentMode = m; if (doc.body) doc.body.setAttribute('data-chcn-mode', m); }
      var hide = shouldHide();
      var nodes = optionalNodes();
      for (var i = 0; i < nodes.length; i++) {
        var itemHide = hide || !itemEnabled(nodes[i].item);
        nodes[i].node.classList.toggle('chcn-hidden', itemHide);
      }
      if (doc.body) doc.body.classList.toggle('chcn-focus', focusMode);
    } catch (e) { /* never break the page */ }
    finally {
      if (mo && doc.body) mo.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
      writing = false;
    }
  }

  /* ---- 6. Auto-hide after inactivity ------------------------------------- */
  var idleTimer = null;
  function armIdle() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { if (tempShow) { tempShow = false; scheduleApply(); } }, 7000);
  }

  /* ---- 7. Public API ----------------------------------------------------- */
  var API = {
    getMode: function () { return currentMode; },
    setFloatingEnabled: function (on) { floatingEnabled = !!on; lsSet(LS.floating, floatingEnabled ? '1' : '0'); if (API._renderFloatToggle) API._renderFloatToggle(); scheduleApply(); },
    isFloatingEnabled: function () { return floatingEnabled; },
    setFocus: function (on) { focusMode = !!on; lsSet(LS.focus, focusMode ? '1' : '0'); tempShow = false; scheduleApply(); },
    isFocus: function () { return focusMode; },
    showControlsTemporarily: function () { tempShow = true; scheduleApply(); armIdle(); },
    refresh: scheduleApply
  };
  global.CHCN = global.CHCN || {};
  global.CHCN.Overlay = API;

  /* ---- 8. Boot ----------------------------------------------------------- */
  function boot() {
    if (!doc.body) { setTimeout(boot, 50); return; }
    injectLayerCSS();
    mo = new MutationObserver(function () { if (!writing) scheduleApply(); });
    scheduleApply(); // first pass also connects the observer in apply()'s finally
    ['focusin', 'focusout', 'fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) {
      doc.addEventListener(ev, scheduleApply, true);
    });
    ['click', 'touchstart', 'keydown', 'pointerdown'].forEach(function (ev) {
      doc.addEventListener(ev, armIdle, { passive: true, capture: true });
    });
    // Keep overlay layering and modal safety; do not create an always-visible floating tools hub.
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();

  /* ---- 9. Comfort controls injected into existing view-controls panel ---- */
  function buildComfortPanel() {
    var host = doc.getElementById('chcnVCPanel');
    if (host && !doc.getElementById('chcnComfort')) {
      var box = doc.createElement('div');
      box.id = 'chcnComfort';
      box.style.cssText = 'margin-top:12px;border-top:1px solid #e5e7eb;padding-top:12px;';
      var itemsHtml = FLOAT_ITEMS.map(function (it) {
        return '<label style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:5px 0;font-size:13px;color:#334155;">' + it.label +
               '<input type="checkbox" class="chcnFloatItemSw" data-item="' + it.id + '"></label>';
      }).join('');
      box.innerHTML =
        '<h4 style="margin:0 0 8px;font-size:14px;">Comfort &amp; Floating Controls</h4>' +
        '<label style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:6px 0;font-size:13px;font-weight:700;">All floating controls<input type="checkbox" id="chcnFloatSw"></label>' +
        '<div id="chcnFloatItems" style="margin:2px 0 8px;padding:6px 8px;border:1px solid #eef1f5;border-radius:8px;background:#f8fafc;">' +
          '<div style="font-size:11px;font-weight:700;letter-spacing:.4px;color:#94a3b8;margin-bottom:2px;">INDIVIDUAL TOOLS</div>' + itemsHtml +
        '</div>' +
        '<label style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:6px 0;font-size:13px;">Focus mode (fewer distractions)<input type="checkbox" id="chcnFocusSw"></label>' +
        '<button id="chcnShowCtl" type="button" style="width:100%;margin-top:6px;padding:8px;border:none;border-radius:8px;background:#0ea5e9;color:#fff;font-weight:600;cursor:pointer;">Show controls</button>';
      host.appendChild(box);
      var fsw = doc.getElementById('chcnFloatSw'), ksw = doc.getElementById('chcnFocusSw');
      fsw.checked = floatingEnabled; ksw.checked = focusMode;
      fsw.addEventListener('change', function () {
        API.setFloatingEnabled(fsw.checked);
        syncItemRow();
      });
      ksw.addEventListener('change', function () { API.setFocus(ksw.checked); });
      doc.getElementById('chcnShowCtl').addEventListener('click', API.showControlsTemporarily);
      // wire individual tool toggles
      var itemSws = box.querySelectorAll('.chcnFloatItemSw');
      function syncItemRow() {
        for (var i = 0; i < itemSws.length; i++) {
          itemSws[i].checked = itemEnabled(itemSws[i].getAttribute('data-item'));
          itemSws[i].disabled = !floatingEnabled;
        }
        var wrap = doc.getElementById('chcnFloatItems');
        if (wrap) wrap.style.opacity = floatingEnabled ? '1' : '.45';
      }
      for (var i = 0; i < itemSws.length; i++) {
        itemSws[i].addEventListener('change', function () {
          setItemEnabled(this.getAttribute('data-item'), this.checked);
        });
      }
      API._syncFloatItemRow = syncItemRow;
      syncItemRow();
    } else if (!host) {
      if ((buildComfortPanel._t = (buildComfortPanel._t || 0) + 1) < 20) setTimeout(buildComfortPanel, 800);
    }
  }

  /* ---- 10. Draggable "Floating Tools" hub (always visible, easy to find) - */
  /* A clearly-labelled pill that is NEVER hidden by the floating-off state, so
   * the user can always find it and turn tools back on. Tap it to open a menu
   * with a master switch + one individual switch per tool. Press-and-drag it
   * anywhere on screen; its position is remembered and always kept on-screen
   * so it can never block or hide behind content. */
  function buildHub() {
    if (!doc.body) { setTimeout(buildHub, 100); return; }
    if (doc.getElementById('chcnHub')) return;
    if (!doc.getElementById('chcnHubCSS')) {
      var st = doc.createElement('style');
      st.id = 'chcnHubCSS';
      st.textContent = [
        '#chcnHub{position:fixed;left:14px;bottom:72px;z-index:100000;display:flex;align-items:center;gap:7px;padding:11px 15px;border-radius:30px;border:none;background:#0ea5e9;color:#fff;font-weight:800;font-size:14px;line-height:1;box-shadow:0 6px 18px rgba(0,0,0,.32);cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none;opacity:.96;}',
        '#chcnHub.dragging{cursor:grabbing;opacity:.9;}',
        '#chcnHub .chcn-hub-ico{font-size:17px;}',
        '#chcnHub.off{background:#64748b;}',
        '#chcnHubMenu{position:fixed;z-index:100001;width:264px;max-width:92vw;background:#fff;color:#0f172a;border-radius:16px;box-shadow:0 16px 50px rgba(0,0,0,.34);padding:16px;display:none;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Arial,sans-serif;}',
        '#chcnHubMenu.open{display:block;}',
        '#chcnHubMenu h4{margin:0 0 4px;font-size:15px;}',
        '#chcnHubMenu .chcn-hub-tip{font-size:11px;color:#94a3b8;margin:0 0 12px;line-height:1.4;}',
        '#chcnHubMenu .chcn-hub-row{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:9px 0;font-size:13px;color:#334155;}',
        '#chcnHubMenu .chcn-hub-row.master{font-weight:800;color:#0f172a;border-bottom:1px solid #eef1f5;padding-bottom:10px;}',
        '#chcnHubMenu .chcn-hub-sub{font-size:11px;font-weight:700;letter-spacing:.4px;color:#94a3b8;margin:10px 0 2px;}',
        '#chcnHubMenu .chcn-sw{position:relative;width:42px;height:24px;flex:0 0 auto;}',
        '#chcnHubMenu .chcn-sw input{opacity:0;width:100%;height:100%;margin:0;cursor:pointer;}',
        '#chcnHubMenu .chcn-sw .track{position:absolute;inset:0;background:#cbd5e1;border-radius:999px;transition:background .15s;pointer-events:none;}',
        '#chcnHubMenu .chcn-sw .knob{position:absolute;top:2px;left:2px;width:20px;height:20px;background:#fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .15s;pointer-events:none;}',
        '#chcnHubMenu .chcn-sw input:checked ~ .track{background:#0ea5e9;}',
        '#chcnHubMenu .chcn-sw input:checked ~ .knob{transform:translateX(18px);}',
        '#chcnHubMenu .chcn-sw input:disabled ~ .track{opacity:.45;}',
        '#chcnHubMenu .chcn-hub-btn{width:100%;margin-top:12px;padding:10px;border:none;border-radius:10px;background:#0ea5e9;color:#fff;font-weight:700;cursor:pointer;}'
      ].join('');
      (doc.head || doc.documentElement).appendChild(st);
    }

    function sw(id, checked) {
      return '<span class="chcn-sw"><input type="checkbox" data-k="' + id + '"' + (checked ? ' checked' : '') + '><span class="track"></span><span class="knob"></span></span>';
    }
    var itemRows = FLOAT_ITEMS.map(function (it) {
      return '<div class="chcn-hub-row">' + it.label + sw('item:' + it.id, itemEnabled(it.id)) + '</div>';
    }).join('');

    var hub = doc.createElement('button');
    hub.id = 'chcnHub';
    hub.type = 'button';
    hub.setAttribute('aria-label', 'Floating tools — tap to open, press and drag to move');
    hub.innerHTML = '<span class="chcn-hub-ico">⚙️</span><span class="chcn-hub-txt">Tools</span>';
    doc.body.appendChild(hub);

    var menu = doc.createElement('div');
    menu.id = 'chcnHubMenu';
    menu.innerHTML =
      '<h4>Floating Tools</h4>' +
      '<p class="chcn-hub-tip">Tap a switch to turn a tool on or off. Press &amp; hold the ⚙️ Tools button to drag it anywhere.</p>' +
      '<div class="chcn-hub-row master">All floating tools' + sw('master', floatingEnabled) + '</div>' +
      '<div class="chcn-hub-sub">INDIVIDUAL TOOLS</div>' + itemRows +
      '<button type="button" class="chcn-hub-btn" data-act="show">Show tools now</button>';
    doc.body.appendChild(menu);

    function positionMenu() {
      var r = hub.getBoundingClientRect();
      var mw = menu.offsetWidth || 264, mh = menu.offsetHeight || 300, m = 8;
      var left = Math.min(Math.max(m, r.left), global.innerWidth - mw - m);
      var top = r.top - mh - 10;                 // prefer above the hub
      if (top < m) top = Math.min(r.bottom + 10, global.innerHeight - mh - m);
      if (top < m) top = m;
      menu.style.left = left + 'px';
      menu.style.top = top + 'px';
    }
    function renderHub() {
      hub.classList.toggle('off', !floatingEnabled);
      var txt = hub.querySelector('.chcn-hub-txt');
      if (txt) txt.textContent = floatingEnabled ? 'Tools' : 'Tools off';
    }
    function syncMenu() {
      var m = menu.querySelector('input[data-k="master"]'); if (m) m.checked = floatingEnabled;
      FLOAT_ITEMS.forEach(function (it) {
        var el = menu.querySelector('input[data-k="item:' + it.id + '"]');
        if (el) { el.checked = itemEnabled(it.id); el.disabled = !floatingEnabled; }
      });
      renderHub();
      // keep the old Aa-panel switches in step too
      var fsw = doc.getElementById('chcnFloatSw'); if (fsw) fsw.checked = floatingEnabled;
      if (API._syncFloatItemRow) API._syncFloatItemRow();
    }
    API._renderFloatToggle = syncMenu;
    API._syncHub = syncMenu;

    menu.addEventListener('change', function (e) {
      var t = e.target; if (!t || t.getAttribute == null) return;
      var k = t.getAttribute('data-k'); if (!k) return;
      if (k === 'master') API.setFloatingEnabled(t.checked);
      else if (k.indexOf('item:') === 0) setItemEnabled(k.slice(5), t.checked);
      syncMenu();
    });
    menu.addEventListener('click', function (e) {
      if (e.target && e.target.getAttribute && e.target.getAttribute('data-act') === 'show') {
        API.showControlsTemporarily();
      }
    });

    hub.addEventListener('click', function () {
      if (hub.__suppressClick) return;             // ignore the click that ends a drag
      var open = menu.classList.toggle('open');
      if (open) { syncMenu(); positionMenu(); }
    });
    doc.addEventListener('click', function (e) {
      if (menu.classList.contains('open') && e.target !== hub && !hub.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('open');
      }
    }, true);
    global.addEventListener('resize', function () { if (menu.classList.contains('open')) positionMenu(); });

    makeDraggable(hub, 'chcn_hub_pos');
    renderHub();
  }

  /* ---- 11. Generic press-and-drag helper (touch + mouse/pointer) --------- */
  /* Lets the user grab any floating element and move it in ANY direction,
   * anywhere, at any time. Position is saved and always clamped inside the
   * viewport so the element can never go off-screen or hide behind an edge.
   * A real tap (no meaningful movement) still fires the element's click. */
  function makeDraggable(el, key) {
    if (!el || el.__chcnDrag) return;
    el.__chcnDrag = true;
    el.style.touchAction = 'none';
    var sx = 0, sy = 0, ox = 0, oy = 0, moved = false, active = false;
    function clamp(x, y) {
      var r = el.getBoundingClientRect(), m = 4;
      var maxX = global.innerWidth - r.width - m, maxY = global.innerHeight - r.height - m;
      return [Math.max(m, Math.min(x, Math.max(m, maxX))), Math.max(m, Math.min(y, Math.max(m, maxY)))];
    }
    function place(x, y) {
      var c = clamp(x, y);
      el.style.left = c[0] + 'px'; el.style.top = c[1] + 'px';
      el.style.right = 'auto'; el.style.bottom = 'auto';
    }
    try { var p = JSON.parse(lsGet(key, '') || 'null'); if (p && typeof p.x === 'number') { requestAnimationFrame(function () { place(p.x, p.y); }); } } catch (e) {}
    function pt(e) { return e.touches && e.touches[0] ? e.touches[0] : e; }
    function move(e) {
      if (!active) return;
      var q = pt(e), dx = q.clientX - sx, dy = q.clientY - sy;
      if (!moved && Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      if (moved) { if (e.cancelable) e.preventDefault(); place(ox + dx, oy + dy); }
    }
    function up() {
      if (!active) return;
      active = false; el.classList.remove('dragging');
      doc.removeEventListener('pointermove', move, true); doc.removeEventListener('pointerup', up, true);
      doc.removeEventListener('touchmove', move, true); doc.removeEventListener('touchend', up, true);
      doc.removeEventListener('mousemove', move, true); doc.removeEventListener('mouseup', up, true);
      if (moved) {
        var r = el.getBoundingClientRect();
        lsSet(key, JSON.stringify({ x: r.left, y: r.top }));
        el.__suppressClick = true;
        setTimeout(function () { el.__suppressClick = false; }, 350);
      }
    }
    function down(e) {
      active = true; moved = false;
      var q = pt(e); sx = q.clientX; sy = q.clientY;
      var r = el.getBoundingClientRect(); ox = r.left; oy = r.top;
      el.classList.add('dragging');
      doc.addEventListener('pointermove', move, true); doc.addEventListener('pointerup', up, true);
      doc.addEventListener('touchmove', move, { capture: true, passive: false }); doc.addEventListener('touchend', up, true);
      doc.addEventListener('mousemove', move, true); doc.addEventListener('mouseup', up, true);
    }
    if ('onpointerdown' in el) el.addEventListener('pointerdown', down, true);
    else { el.addEventListener('touchstart', down, { capture: true, passive: true }); el.addEventListener('mousedown', down, true); }
    // re-clamp on rotation / resize so it never ends up off-screen
    global.addEventListener('resize', function () {
      var r = el.getBoundingClientRect(); place(r.left, r.top);
    });
  }
})(window);
