/* =====================================================================
 * chcn-nav.js — Centralized Navigation / Route / History Service
 * ---------------------------------------------------------------------
 * ONE service that drives the whole app's navigation:
 *   - Back / Forward / Home / Up(parent) / Close
 *   - Breadcrumb trail (parent-child hierarchy)
 *   - Browser Back/Forward + refresh + deep links  (History API + hash)
 *   - Android hardware Back (native bridge calls handleAndroidBack())
 *   - Escape / Back closes open modals & drawers FIRST
 *   - Unsaved-changes guard (Save / Discard / Continue editing)
 *   - Per-view scroll & state restoration
 *   - Voice navigation commands (registered into CHCN.Commands)
 *
 * Non-destructive: it WRAPS the existing global window.navigate (which is
 * itself already wrapped by chcn-lt-core.js), so every existing
 * onclick="navigate('x')" call in the app becomes history-aware with no
 * markup changes. Loaded LAST so it wraps the fully-composed navigate().
 * ===================================================================== */
(function (global) {
  'use strict';
  if (global.NavigationService) { return; } // idempotent

  var doc = global.document;
  function $(sel, root) { return (root || doc).querySelector(sel); }
  function safeScroll(x, y) { try { global.scrollTo(x, y); } catch (e) {} }
  function esc(s) { var d = doc.createElement('div'); d.textContent = (s == null ? '' : String(s)); return d.innerHTML; }

  /* ---------------------------------------------------------------
   * 1. ROUTE REGISTRY  —  page -> { title, parent }
   *    parent === null  => top-level (Home). Unknown pages fall back
   *    to a prettified title with parent 'index'.
   * ------------------------------------------------------------- */
  var ROUTES = {
    'index':    { title: 'Home', parent: null },
    'courses':  { title: 'Courses', parent: 'index' },
    'about':    { title: 'About Us', parent: 'index' },
    'contact':  { title: 'Contact Us', parent: 'index' },
    'account':  { title: 'My Account', parent: 'index' },
    'payment':  { title: 'Payment', parent: 'index' },
    'map':      { title: 'Map & GPS', parent: 'index' },
    'music':    { title: 'Music', parent: 'index' },
    'lesson':   { title: 'Lesson', parent: 'courses' },
    'quiz':     { title: 'Quiz', parent: 'courses' },
    'course-level1':              { title: 'Level 1 Course', parent: 'courses' },
    'course-assessment':          { title: 'Same-Day Assessment', parent: 'courses' },
    'course-senior':              { title: 'Senior Course', parent: 'courses' },
    'course-junior':              { title: 'Junior Course', parent: 'courses' },
    'course-driver-beginner':     { title: 'Driver — Beginner', parent: 'courses' },
    'course-driver-intermediate': { title: 'Driver — Intermediate', parent: 'courses' },
    'course-driver-advanced':     { title: 'Driver — Advanced', parent: 'courses' },
    /* ---- Life & Tools hierarchy ---- */
    'lifetools': { title: 'Life & Tools', parent: 'index' },
    'bloodtype': { title: 'Blood Type & Genetics', parent: 'lifetools' },
    'family':    { title: 'Family & Relationships', parent: 'lifetools' },
    'cycle':     { title: 'Period & Fertility Tracker', parent: 'lifetools' },
    'calc':      { title: 'Calculators', parent: 'lifetools' },
    'datecalc':  { title: 'Date & Age Calculator', parent: 'lifetools' },
    'bmi':       { title: 'BMI Calculator', parent: 'lifetools' },
    'convert':   { title: 'Unit Converter', parent: 'lifetools' },
    'tools':     { title: 'Creator Tools', parent: 'lifetools' },
    /* ---- Office Tools now lives under Life & Tools ---- */
    'officetools': { title: 'Office Tools', parent: 'lifetools' },
    'spreadsheet': { title: 'Spreadsheet', parent: 'officetools' },
    'presentation-viewer': { title: 'Presentation Viewer', parent: 'officetools' }
  };

  function prettify(page) {
    return String(page || 'index').replace(/^page-/, '').replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }
  function routeOf(page) {
    if (ROUTES[page]) { return ROUTES[page]; }
    return { title: prettify(page), parent: (page === 'index' ? null : 'index') };
  }
  function titleOf(page) { return routeOf(page).title; }

  // Build the parent chain: [root ... page]
  function trail(page) {
    var out = [], seen = {}, cur = page;
    while (cur && !seen[cur]) {
      seen[cur] = true;
      out.unshift(cur);
      cur = routeOf(cur).parent;
    }
    return out;
  }

  /* ---------------------------------------------------------------
   * 2. STATE
   * ------------------------------------------------------------- */
  var current = 'index';      // current page name
  var seq = 0;                // monotonically increasing history id
  var scrollMap = {};         // history-id -> scrollY
  var modalStack = [];        // ids of currently-open modals (LIFO)
  var unsavedGuard = null;    // function -> truthy string when there are unsaved changes
  var internalNav = false;    // guards against re-pushing during popstate
  var origNavigate = null;    // the underlying (LTApp-wrapped) navigate
  var lastRootBackTs = 0;     // for double-back-to-exit at root

  function parseHash() {
    var h = (global.location && global.location.hash) || '';
    var m = /^#\/?(.+)$/.exec(h);
    if (!m) { return null; }
    var p = decodeURIComponent(m[1]).replace(/^page-/, '').split('?')[0].split('/')[0];
    return p || null;
  }

  /* ---------------------------------------------------------------
   * 3. UNSAVED-CHANGES GUARD
   * ------------------------------------------------------------- */
  function setUnsavedGuard(fn) { unsavedGuard = (typeof fn === 'function') ? fn : null; }
  function clearUnsavedGuard() { unsavedGuard = null; }
  // Returns true if it is safe to leave the current view.
  function confirmLeave() {
    if (!unsavedGuard) { return true; }
    var msg;
    try { msg = unsavedGuard(); } catch (e) { msg = null; }
    if (!msg) { return true; }
    var proceed = true;
    try { proceed = global.confirm((typeof msg === 'string' ? msg : 'You have unsaved changes.') + '\n\nLeave this page and discard changes?'); }
    catch (e) { proceed = true; }
    if (proceed) { unsavedGuard = null; } // discarding — clear so we don't re-prompt
    return proceed;
  }

  /* ---------------------------------------------------------------
   * 4. CORE SHOW / PUSH / POP
   * ------------------------------------------------------------- */
  function showOnly(page) {
    if (typeof origNavigate === 'function') {
      try { origNavigate(page); } catch (e) { /* underlying nav guards its own errors */ }
    }
    current = page;
    afterShow(page);
  }

  function pushState(page) {
    seq += 1;
    var st = { chpage: page, chid: seq };
    try { global.history.pushState(st, '', '#/' + page); } catch (e) {}
  }
  function replaceState(page) {
    var st = { chpage: page, chid: seq };
    try { global.history.replaceState(st, '', '#/' + page); } catch (e) {}
  }

  // Public, guarded navigation (what onclick=navigate() ultimately runs).
  function go(page) {
    if (page === current && modalStack.length === 0) { showOnly(page); return; }
    if (!confirmLeave()) { return; }
    // remember where we were leaving from
    scrollMap[seq] = global.pageYOffset || 0;
    closeAllModals(true);
    showOnly(page);
    pushState(page);
    scrollMap[seq] = 0;
    safeScroll(0, 0);
  }

  function back() {
    if (closeTopModal()) { return; }        // modals close first
    try { global.history.back(); } catch (e) {}
  }
  function forward() { try { global.history.forward(); } catch (e) {} }
  function home() { go('index'); }
  function up() { // go to logical parent
    var p = routeOf(current).parent;
    if (p) { go(p); }
  }

  // Android hardware back. Returns TRUE when handled (native should NOT exit).
  function handleAndroidBack() {
    if (closeTopModal()) { return true; }
    if (closeOpenDrawer()) { return true; }
    if (current !== 'index') { back(); return true; }
    // At root: double-press to exit
    var now = Date.now();
    if (now - lastRootBackTs < 2000) { return false; } // let native exit the app
    lastRootBackTs = now;
    toast('Press back again to exit');
    return true;
  }

  function toast(m, isErr) {
    if (typeof global.showToast === 'function') { try { global.showToast(m, isErr); return; } catch (e) {} }
  }

  /* ---------------------------------------------------------------
   * 5. MODAL / DRAWER helpers  (Back & Escape close these FIRST)
   * ------------------------------------------------------------- */
  function activeModals() {
    var list = [];
    var nodes = doc.querySelectorAll('.modal-overlay.active, .modal.active');
    for (var i = 0; i < nodes.length; i++) { list.push(nodes[i]); }
    return list;
  }
  function closeModalEl(el) {
    if (!el) { return; }
    el.classList.remove('active');
    try { doc.body.style.overflow = ''; } catch (e) {}
    if (el.id) {
      var i = modalStack.indexOf(el.id);
      if (i > -1) { modalStack.splice(i, 1); }
    }
  }
  // Close the top-most open modal. Returns true if one was closed.
  function closeTopModal() {
    var open = activeModals();
    if (!open.length) { return false; }
    closeModalEl(open[open.length - 1]);
    return true;
  }
  function closeAllModals(silent) {
    var open = activeModals();
    for (var i = 0; i < open.length; i++) { closeModalEl(open[i]); }
    if (!silent) { /* no-op */ }
  }
  // Close an open nav drawer / off-canvas menu. Returns true if one was closed.
  function closeOpenDrawer() {
    var nav = doc.querySelector('.navbar nav.open');
    if (nav) { nav.classList.remove('open'); return true; }
    var dr = doc.querySelector('.drawer.open, .side-panel.open, .offcanvas.open');
    if (dr) { dr.classList.remove('open'); return true; }
    return false;
  }

  /* ---------------------------------------------------------------
   * 6. CHROME:  Back bar + Breadcrumb trail  (injected once, updated
   *    on every navigation). Hidden on Home.
   * ------------------------------------------------------------- */
  var bar = null, crumbEl = null, backBtn = null, fwdBtn = null;

  function buildBar() {
    if (bar || !doc.body) { return; }
    bar = doc.createElement('div');
    bar.id = 'chcnNavBar';
    bar.className = 'chcn-navbar';
    bar.setAttribute('role', 'navigation');
    bar.setAttribute('aria-label', 'Page navigation');
    bar.innerHTML =
      '<div class="chcn-navbar-inner">' +
        '<button type="button" class="chcn-nav-btn chcn-nav-back" aria-label="Go back">' +
          '<span aria-hidden="true">\u2190</span> Back</button>' +
        '<nav class="chcn-crumbs" aria-label="Breadcrumb"></nav>' +
        '<span class="chcn-nav-spacer"></span>' +
        '<button type="button" class="chcn-nav-btn chcn-nav-home" aria-label="Go to home"><span aria-hidden="true">\u2302</span> Home</button>' +
      '</div>';
    var header = doc.querySelector('header.navbar');
    if (header && header.parentNode) { header.parentNode.insertBefore(bar, header.nextSibling); }
    else { doc.body.insertBefore(bar, doc.body.firstChild); }
    crumbEl = bar.querySelector('.chcn-crumbs');
    backBtn = bar.querySelector('.chcn-nav-back');
    backBtn.addEventListener('click', function () { back(); });
    bar.querySelector('.chcn-nav-home').addEventListener('click', function () { home(); });
    // Breadcrumb links (event delegation)
    crumbEl.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('[data-crumb]') : null;
      if (a) { e.preventDefault(); go(a.getAttribute('data-crumb')); }
    });
  }

  function renderCrumbs(page) {
    if (!crumbEl) { return; }
    var chain = trail(page), html = '';
    for (var i = 0; i < chain.length; i++) {
      var p = chain[i], label = esc(titleOf(p));
      if (i > 0) { html += '<span class="chcn-crumb-sep" aria-hidden="true">\u203A</span>'; }
      if (i === chain.length - 1) {
        html += '<span class="chcn-crumb chcn-crumb-current" aria-current="page">' + label + '</span>';
      } else {
        html += '<a href="#/' + esc(p) + '" class="chcn-crumb" data-crumb="' + esc(p) + '">' + label + '</a>';
      }
    }
    crumbEl.innerHTML = html;
  }

  // Called after every page becomes visible.
  function afterShow(page) {
    buildBar();
    if (!bar) { return; }
    if (page === 'index') { bar.classList.add('chcn-navbar-hidden'); }
    else { bar.classList.remove('chcn-navbar-hidden'); }
    renderCrumbs(page);
    // document title reflects location for accessibility / browser history
    try {
      var base = 'Creator Hub Creator Network';
      doc.title = (page === 'index') ? base : (titleOf(page) + ' \u2014 ' + base);
    } catch (e) {}
    // announce to screen readers if the app's voice layer is present
    try {
      var live = doc.getElementById('chcnNavLive');
      if (!live) { live = doc.createElement('div'); live.id = 'chcnNavLive'; live.className = 'sr-only'; live.setAttribute('aria-live', 'polite'); doc.body.appendChild(live); }
      live.textContent = titleOf(page);
    } catch (e) {}
  }

  /* ---------------------------------------------------------------
   * 7. BROWSER / ANDROID / KEYBOARD wiring + boot
   * ------------------------------------------------------------- */
  function onPopState(e) {
    var st = (e && e.state) || {};
    // Back while a modal is open => close the modal, stay on the page.
    if (activeModals().length) {
      closeTopModal();
      pushState(current); // re-assert current location so we don't actually leave
      return;
    }
    var page = st.chpage || parseHash() || 'index';
    // Unsaved-changes guard also applies to browser/hardware back.
    if (page !== current && !confirmLeave()) {
      // user cancelled: push current back so we stay put
      pushState(current);
      return;
    }
    internalNav = true;
    showOnly(page);
    internalNav = false;
    var y = scrollMap[st.chid] || 0;
    safeScroll(0, y);
  }

  function onHashChange() {
    // Fallback for environments without full History support.
    var page = parseHash();
    if (page && page !== current && !activeModals().length) {
      internalNav = true; showOnly(page); internalNav = false; safeScroll(0, 0);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
      if (closeTopModal()) { e.preventDefault(); return; }
      if (closeOpenDrawer()) { e.preventDefault(); }
    }
  }

  function wrapModals() {
    var oOpen = global.openModal, oClose = global.closeModal;
    if (typeof oOpen === 'function') {
      global.openModal = function (id) {
        var r = oOpen.apply(this, arguments);
        if (id && modalStack.indexOf(id) === -1) { modalStack.push(id); }
        return r;
      };
    }
    if (typeof oClose === 'function') {
      global.closeModal = function (id) {
        var r = oClose.apply(this, arguments);
        var i = modalStack.indexOf(id);
        if (i > -1) { modalStack.splice(i, 1); }
        return r;
      };
    }
  }

  function registerVoiceCommands() {
    var CHCN = global.CHCN;
    if (!CHCN || !CHCN.Commands || typeof CHCN.Commands.register !== 'function') { return; }
    var C = CHCN.Commands;
    var say = function (m) { if (CHCN.Voice && typeof CHCN.Voice.announce === 'function') { try { CHCN.Voice.announce(m); } catch (e) {} } };
    C.register(['go back', 'back', 'previous page', 'go to previous'], function () { back(); say('Going back.'); }, 'Go to the previous page');
    C.register(['go forward', 'forward', 'next page'], function () { forward(); say('Going forward.'); }, 'Go forward');
    C.register(['go up', 'go to parent', 'parent page', 'up one level'], function () { up(); say('Going up.'); }, 'Go to the parent section');
    C.register(['close', 'close this', 'close dialog', 'close window', 'dismiss'], function () { if (closeTopModal()) { say('Closed.'); } else if (closeOpenDrawer()) { say('Closed.'); } }, 'Close the open dialog');
    C.register(['go to life and tools', 'open life and tools', 'life and tools', 'open tools'], function () { go('lifetools'); say('Opening Life and Tools.'); }, 'Open Life & Tools');
  }

  function installAndroidBridge() {
    // Native Android WebView calls one of these on the hardware Back button.
    // Each returns TRUE when handled (native must then NOT close the app).
    global.CreatorHubOnBack = handleAndroidBack;
    global.onBackPressed = handleAndroidBack;
    global.__ch_onBack = handleAndroidBack;
    if (!global.CreatorHub) { global.CreatorHub = {}; }
    global.CreatorHub.onBack = handleAndroidBack;
  }

  function boot() {
    origNavigate = global.navigate; // fully-composed (app + LTApp) navigate
    // Wrap it so every navigate() call in the app is history-aware.
    global.navigate = function (page) {
      if (internalNav) { showOnly(page); return; }
      go(page);
    };
    buildBar();
    wrapModals();
    installAndroidBridge();
    registerVoiceCommands();
    global.addEventListener('popstate', onPopState);
    global.addEventListener('hashchange', onHashChange);
    doc.addEventListener('keydown', onKeyDown);
    // Track scroll into the current history entry (throttled).
    var t = null;
    global.addEventListener('scroll', function () {
      if (t) { return; }
      t = setTimeout(function () { t = null; scrollMap[seq] = global.pageYOffset || 0; }, 200);
    });
    // Initial route: honour deep link (#/page) or default to whatever is shown.
    var start = parseHash() || 'index';
    internalNav = true;
    showOnly(start);
    internalNav = false;
    replaceState(start);
    scrollMap[0] = 0;
  }

  /* ---------------------------------------------------------------
   * 8. PUBLIC API
   * ------------------------------------------------------------- */
  var API = {
    go: go, navigate: go,
    back: back, forward: forward, home: home, up: up,
    handleAndroidBack: handleAndroidBack,
    current: function () { return current; },
    trail: function (p) { return trail(p || current); },
    titleOf: titleOf,
    registerRoute: function (page, def) {
      if (!page || !def) { return; }
      ROUTES[page] = { title: def.title || prettify(page), parent: (def.parent !== undefined ? def.parent : 'index') };
    },
    setUnsavedGuard: setUnsavedGuard,
    clearUnsavedGuard: clearUnsavedGuard,
    closeTopModal: closeTopModal,
    refresh: function () { afterShow(current); }
  };
  global.NavigationService = API;
  if (!global.CHCN) { global.CHCN = {}; }
  global.CHCN.Nav = API;

  // Boot AFTER sibling module scripts (incl. chcn-lt-core) have wrapped navigate.
  if (doc && doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 0); });
  } else {
    setTimeout(boot, 0);
  }
})(typeof window !== 'undefined' ? window : this);
