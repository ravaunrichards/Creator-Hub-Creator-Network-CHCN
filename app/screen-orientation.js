/* Creator Hub — Screen orientation + scrolling helper
 * Offline, no backend. Adds:
 *  1) CSS so pages can scroll BOTH vertically and horizontally when content
 *     is wider than the screen (keeps pinch-zoom working).
 *  2) A floating button to switch Landscape / Portrait / Auto at any time,
 *     using the Screen Orientation API with a graceful fallback note for
 *     WebView builds that do not allow programmatic lock.
 */
(function (global) {
  'use strict';
  var LS_KEY = 'chcn_orientation_pref'; // 'auto' | 'portrait' | 'landscape'
  var TIP_KEY = 'chcn_orient_tip_seen';

  function injectCSS() {
    if (document.getElementById('chcnOrientCSS')) return;
    var s = document.createElement('style');
    s.id = 'chcnOrientCSS';
    s.textContent = [
      /* Allow scrolling in both directions; never trap content off-screen. */
      'html,body{overflow-x:auto !important;overflow-y:auto !important;-webkit-overflow-scrolling:touch;}',
      'body{max-width:100%;}',
      /* Floating orientation control */
      '.chcn-orient-fab{position:fixed;right:12px;bottom:84px;z-index:99999;display:flex;flex-direction:column;gap:6px;align-items:flex-end;font-family:inherit;}',
      '.chcn-orient-fab button{border:none;border-radius:24px;padding:10px 14px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.25);background:#111827;color:#fff;}',
      '.chcn-orient-fab button.on{background:#FE2C55;}',
      '.chcn-orient-menu{display:none;flex-direction:column;gap:6px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:8px;box-shadow:0 6px 20px rgba(0,0,0,.18);}',
      '.chcn-orient-menu.open{display:flex;}',
      '.chcn-orient-menu button{background:#f3f4f6;color:#111827;border-radius:8px;text-align:left;min-width:150px;}',
      '.chcn-orient-menu button.sel{background:#FE2C55;color:#fff;}',
      '.chcn-orient-note{font-size:11px;color:#475467;background:#fff;border-radius:8px;padding:6px 8px;max-width:200px;box-shadow:0 4px 14px rgba(0,0,0,.15);}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function getPref() { try { return localStorage.getItem(LS_KEY) || 'auto'; } catch (e) { return 'auto'; } }
  function setPref(v) { try { localStorage.setItem(LS_KEY, v); } catch (e) {} }

  function supportsLock() {
    return !!(screen && screen.orientation && typeof screen.orientation.lock === 'function');
  }

  function note(msg) {
    var n = document.getElementById('chcnOrientNote');
    if (!n) return;
    n.textContent = msg;
    n.style.display = msg ? 'block' : 'none';
  }

  // Try to enter fullscreen first (many engines require it before locking).
  function requestFs() {
    try {
      var d = document.documentElement;
      var fn = d.requestFullscreen || d.webkitRequestFullscreen || d.msRequestFullscreen;
      if (fn && !document.fullscreenElement) return fn.call(d);
    } catch (e) {}
    return null;
  }

  function applyPref(pref, userGesture) {
    setPref(pref);
    highlight(pref);
    if (pref === 'auto') {
      try { if (supportsLock() && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
      note('Auto-rotate: the screen follows how you hold the device. Make sure your phone\u2019s auto-rotate is turned on.');
      return;
    }
    var target = (pref === 'landscape') ? 'landscape' : 'portrait';
    if (!supportsLock()) {
      note('This device can\u2019t lock orientation from inside the app. Please rotate your phone and keep auto-rotate ON — the app follows the device either way.');
      return;
    }
    var tryLock = function () {
      screen.orientation.lock(target).then(function () {
        note(target === 'landscape' ? 'Locked to Landscape. Choose Auto to release.' : 'Locked to Portrait. Choose Auto to release.');
      }).catch(function () {
        note('Could not lock to ' + target + ' on this device. Rotate your phone instead — the app will follow, since auto-rotate is supported.');
      });
    };
    // Only meaningful on a user gesture; attempt fullscreen then lock.
    var fs = requestFs();
    if (fs && typeof fs.then === 'function') { fs.then(tryLock).catch(tryLock); } else { tryLock(); }
  }

  function highlight(pref) {
    var map = { auto: 'oAuto', portrait: 'oPort', landscape: 'oLand' };
    Object.keys(map).forEach(function (k) {
      var b = document.getElementById(map[k]);
      if (b) b.classList.toggle('sel', k === pref);
    });
  }

  function build() {
    if (document.getElementById('chcnOrientFab')) return;
    injectCSS();
    var wrap = document.createElement('div');
    wrap.className = 'chcn-orient-fab';
    wrap.id = 'chcnOrientFab';

    var noteEl = document.createElement('div');
    noteEl.className = 'chcn-orient-note';
    noteEl.id = 'chcnOrientNote';
    noteEl.style.display = 'none';

    var menu = document.createElement('div');
    menu.className = 'chcn-orient-menu';
    menu.id = 'chcnOrientMenu';

    function mkItem(id, label) {
      var b = document.createElement('button');
      b.id = id; b.type = 'button'; b.textContent = label;
      return b;
    }
    var bAuto = mkItem('oAuto', '\uD83D\uDD04 Auto-rotate');
    var bPort = mkItem('oPort', '\uD83D\uDCF1 Portrait');
    var bLand = mkItem('oLand', '\uD83D\uDCFA Landscape');
    menu.appendChild(bAuto); menu.appendChild(bPort); menu.appendChild(bLand);

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.id = 'chcnOrientToggle';
    toggle.textContent = '\uD83D\uDD04 Rotate';

    wrap.appendChild(noteEl);
    wrap.appendChild(menu);
    wrap.appendChild(toggle);
    document.body.appendChild(wrap);

    toggle.addEventListener('click', function () {
      menu.classList.toggle('open');
    });
    bAuto.addEventListener('click', function () { applyPref('auto', true); menu.classList.remove('open'); });
    bPort.addEventListener('click', function () { applyPref('portrait', true); menu.classList.remove('open'); });
    bLand.addEventListener('click', function () { applyPref('landscape', true); menu.classList.remove('open'); });

    highlight(getPref());

    // One-time tip.
    try {
      if (!localStorage.getItem(TIP_KEY)) {
        note('Tip: tap \u201CRotate\u201D to switch between Portrait, Landscape, or Auto at any time. You can also scroll up/down and left/right, and pinch to zoom.');
        localStorage.setItem(TIP_KEY, '1');
        setTimeout(function () { if (getPref() === 'auto') { noteEl.style.display = 'none'; } }, 9000);
      }
    } catch (e) {}
  }

  function boot() {
    build();
    // If a non-auto preference was set earlier, re-apply quietly (no gesture
    // so lock may be ignored by the engine — that is fine, the note explains).
    var p = getPref();
    if (p !== 'auto') highlight(p);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
