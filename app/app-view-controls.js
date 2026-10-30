/* =============================================================================
 * Creator Hub — App View Controls (app-view-controls.js)
 * -----------------------------------------------------------------------------
 * Adds three VISIBLE, working, app-wide display controls that persist between
 * sessions (saved through the existing GlobalSettingsService):
 *   1. Font family   — change the typeface used across the whole app.
 *   2. Overall zoom  — scale the entire interface up or down.
 *   3. Scroll bars   — large on-screen horizontal (X) and vertical (Y) slide
 *                      bars that scroll the page, for users who find small
 *                      native scrollbars hard to use.
 * A floating “Aa” button (bottom-left) opens the panel. Everything is applied
 * live and remembered. Fully offline, no external resources. Purely additive.
 * ========================================================================== */
(function (global) {
  'use strict';
  if (global.__chcnViewControls) return;
  global.__chcnViewControls = true;

  function S() { return global.GlobalSettingsService || null; }
  function get(k, d) { var s = S(); return s && s.get ? s.get(k, d) : d; }
  function set(k, v) { var s = S(); if (s && s.set) s.set(k, v); }

  // -- Font family stacks (all web-safe / system fonts, no downloads) --------
  var FONTS = {
    system: { label: 'System default', stack: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif" },
    sans:   { label: 'Clean sans-serif', stack: "'Helvetica Neue',Helvetica,Arial,sans-serif" },
    serif:  { label: 'Readable serif', stack: "Georgia,'Times New Roman',Times,serif" },
    rounded:{ label: 'Rounded', stack: "'Segoe UI',Verdana,Geneva,sans-serif" },
    mono:   { label: 'Monospace', stack: "'Courier New',Courier,monospace" },
    dyslexic:{ label: 'Easy-read (wide)', stack: "'Comic Sans MS','Trebuchet MS',Verdana,sans-serif" }
  };

  function injectCSS() {
    if (document.getElementById('chcnVCCss')) return;
    var css = [
      '#chcnVCBtn{position:fixed;left:14px;bottom:14px;z-index:99990;width:48px;height:48px;border-radius:50%;border:none;background:#0ea5e9;color:#fff;font-size:20px;font-weight:800;box-shadow:0 4px 14px rgba(0,0,0,.3);cursor:pointer;}',
      '#chcnVCBtn:active{transform:scale(.94);}',
      '#chcnVCPanel{position:fixed;left:14px;bottom:72px;z-index:99991;width:290px;max-width:92vw;background:#fff;color:#0f172a;border-radius:14px;box-shadow:0 10px 40px rgba(0,0,0,.35);padding:16px;display:none;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Arial,sans-serif;}',
      '#chcnVCPanel.open{display:block;}',
      '#chcnVCPanel h4{margin:0 0 10px;font-size:16px;}',
      '#chcnVCPanel .vc-row{margin:12px 0;}',
      '#chcnVCPanel label{display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:#334155;}',
      '#chcnVCPanel select,#chcnVCPanel input[type=range]{width:100%;}',
      '#chcnVCPanel .vc-val{font-weight:700;color:#0ea5e9;}',
      '#chcnVCPanel .vc-close{position:absolute;top:8px;right:10px;border:none;background:transparent;font-size:20px;cursor:pointer;color:#64748b;}',
      '#chcnVCPanel .vc-reset{margin-top:8px;width:100%;padding:9px;border:1px solid #cbd5e1;border-radius:9px;background:#f8fafc;font-weight:600;cursor:pointer;}',
      // vertical (Y) scroll slide bar on the right edge
      '#chcnScrollY{position:fixed;top:70px;right:6px;bottom:120px;z-index:99980;width:30px;display:none;align-items:center;justify-content:center;}',
      '#chcnScrollY.on{display:flex;}',
      '#chcnScrollY input{-webkit-appearance:slider-vertical;appearance:slider-vertical;writing-mode:vertical-lr;width:28px;height:100%;}',
      // horizontal (X) scroll slide bar across the bottom
      '#chcnScrollX{position:fixed;left:70px;right:46px;bottom:8px;z-index:99980;height:30px;display:none;align-items:center;}',
      '#chcnScrollX.on{display:flex;}',
      '#chcnScrollX input{width:100%;}',
      '.chcn-scrollpad{height:46px;}'
    ].join('');
    var st = document.createElement('style');
    st.id = 'chcnVCCss';
    st.textContent = css;
    document.head.appendChild(st);
  }

  // ---- Apply settings to the live document --------------------------------
  function applyFont() {
    var key = get('fontFamily', 'system');
    var f = FONTS[key] || FONTS.system;
    document.documentElement.style.setProperty('--chcn-font-family', f.stack);
    document.body.style.fontFamily = f.stack;
  }
  function applyZoom() {
    var z = parseFloat(get('appZoom', 1)) || 1;
    // Chromium / Android WebView honour CSS zoom without breaking layout width.
    document.body.style.zoom = z;
  }
  function applyScrollBars() {
    var on = !!get('showScrollBars', true);
    var y = document.getElementById('chcnScrollY');
    var x = document.getElementById('chcnScrollX');
    if (y) y.classList.toggle('on', on);
    if (x) x.classList.toggle('on', on);
    syncScrollBars();
  }

  // Keep the slide-bar thumbs in step with the real scroll position.
  function docH() { return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - global.innerHeight; }
  function docW() { return Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - global.innerWidth; }
  var _lock = false;
  function syncScrollBars() {
    if (_lock) return;
    var ys = document.getElementById('chcnScrollYInput');
    var xs = document.getElementById('chcnScrollXInput');
    var mh = docH(), mw = docW();
    if (ys) { ys.disabled = mh <= 2; ys.value = mh > 0 ? Math.round((global.scrollY / mh) * 1000) : 0; }
    if (xs) { xs.disabled = mw <= 2; xs.value = mw > 0 ? Math.round((global.scrollX / mw) * 1000) : 0; }
  }

  function buildScrollBars() {
    if (document.getElementById('chcnScrollY')) return;
    var y = document.createElement('div');
    y.id = 'chcnScrollY';
    y.innerHTML = '<input id="chcnScrollYInput" type="range" min="0" max="1000" value="0" aria-label="Scroll up and down">';
    var x = document.createElement('div');
    x.id = 'chcnScrollX';
    x.innerHTML = '<input id="chcnScrollXInput" type="range" min="0" max="1000" value="0" aria-label="Scroll left and right">';
    document.body.appendChild(y);
    document.body.appendChild(x);
    var yi = y.querySelector('input'), xi = x.querySelector('input');
    if (yi) yi.addEventListener('input', function () {
      _lock = true; var mh = docH(); global.scrollTo({ top: (this.value / 1000) * mh }); setTimeout(function(){_lock=false;}, 60);
    });
    if (xi) xi.addEventListener('input', function () {
      _lock = true; var mw = docW(); global.scrollTo({ left: (this.value / 1000) * mw }); setTimeout(function(){_lock=false;}, 60);
    });
    global.addEventListener('scroll', syncScrollBars, { passive: true });
    global.addEventListener('resize', syncScrollBars);
  }

  // ---- Control panel UI ----------------------------------------------------
  function fontOptions() {
    var cur = get('fontFamily', 'system'), out = '';
    Object.keys(FONTS).forEach(function (k) {
      out += '<option value="' + k + '"' + (k === cur ? ' selected' : '') + '>' + FONTS[k].label + '</option>';
    });
    return out;
  }

  function buildPanel() {
    if (document.getElementById('chcnVCPanel')) return;
    var btn = document.createElement('button');
    btn.id = 'chcnVCBtn';
    btn.type = 'button';
    btn.textContent = 'Aa';
    btn.title = 'Display & view controls';
    btn.setAttribute('aria-label', 'Display and view controls');

    var panel = document.createElement('div');
    panel.id = 'chcnVCPanel';
    var z = parseFloat(get('appZoom', 1)) || 1;
    panel.innerHTML =
      '<button class="vc-close" type="button" aria-label="Close">\u00D7</button>' +
      '<h4>Display &amp; View</h4>' +
      '<div class="vc-row"><label>App font</label><select id="vcFont">' + fontOptions() + '</select></div>' +
      '<div class="vc-row"><label>Overall zoom – <span class="vc-val" id="vcZoomV">' + Math.round(z * 100) + '%</span></label>' +
        '<input id="vcZoom" type="range" min="0.7" max="1.6" step="0.05" value="' + z + '"></div>' +
      '<div class="vc-row"><label><input id="vcBars" type="checkbox"' + (get('showScrollBars', true) ? ' checked' : '') + '> Show large scroll bars (X / Y)</label></div>' +
      '<button class="vc-reset" type="button" id="vcReset">Reset display settings</button>';

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    btn.addEventListener('click', function () { panel.classList.toggle('open'); });
    panel.querySelector('.vc-close').addEventListener('click', function () { panel.classList.remove('open'); });

    panel.querySelector('#vcFont').addEventListener('change', function () {
      set('fontFamily', this.value); applyFont();
    });
    var zoomEl = panel.querySelector('#vcZoom'), zoomV = panel.querySelector('#vcZoomV');
    zoomEl.addEventListener('input', function () {
      set('appZoom', parseFloat(this.value)); zoomV.textContent = Math.round(this.value * 100) + '%'; applyZoom(); syncScrollBars();
    });
    panel.querySelector('#vcBars').addEventListener('change', function () {
      set('showScrollBars', this.checked); applyScrollBars();
    });
    panel.querySelector('#vcReset').addEventListener('click', function () {
      set('fontFamily', 'system'); set('appZoom', 1); set('showScrollBars', true);
      applyFont(); applyZoom(); applyScrollBars();
      panel.querySelector('#vcFont').value = 'system';
      zoomEl.value = 1; zoomV.textContent = '100%';
      panel.querySelector('#vcBars').checked = true;
    });
  }

  function init() {
    injectCSS();
    buildScrollBars();
    buildPanel();
    applyFont();
    applyZoom();
    applyScrollBars();
    // content height can change as pages render; keep the bars honest
    setInterval(syncScrollBars, 1200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
