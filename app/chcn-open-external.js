/* =============================================================================
 * Creator Hub — safe external link opener (chcn-open-external.js)
 * -----------------------------------------------------------------------------
 * FIX: In the Android app (WebView) tapping an external link such as a bank
 * portal could either (a) open TWO pages, or (b) replace the main app page
 * (“exit main page”). Root cause: code called window.open(url) and then, when
 * window.open returned null inside the WebView, fell back to
 * `location.href = url`, which navigates the app itself away from the home
 * screen — while the native layer had often ALREADY opened a browser tab.
 *
 * window.chcnOpenExternal(url) opens a link exactly ONCE, in a separate
 * page/tab, and NEVER navigates the main app away from its current screen.
 * Order of preference:
 *   1. A real native bridge method, if the app exposes one.
 *   2. window.open(url, '_blank') — one call only.
 *   3. A single hidden <a target="_blank"> click (same mechanism the WebView
 *      uses for new windows) — again, no page navigation.
 * If nothing can open, we show a toast with the address instead of hijacking
 * the current page. Purely additive; safe in a normal browser too.
 * ========================================================================== */
(function (global) {
  'use strict';
  if (global.chcnOpenExternal) return; // already installed

  function toast(msg) {
    try { if (typeof global.showToast === 'function') { global.showToast(msg); return; } } catch (e) {}
  }

  // De-dupe identical opens fired within a short window (double-tap / double
  // handler). Prevents the “two pages” problem at the source.
  var last = { url: null, t: 0 };

  function viaNative(url) {
    try {
      var N = global.CreatorHubNative;
      if (!N) return false;
      if (typeof N.openUrl === 'function') { N.openUrl(url); return true; }
      if (typeof N.openExternal === 'function') { N.openExternal(url); return true; }
      if (typeof N.openInBrowser === 'function') { N.openInBrowser(url); return true; }
    } catch (e) {}
    return false;
  }

  function viaWindowOpen(url) {
    var w = null;
    try { w = global.open(url, '_blank', 'noopener,noreferrer'); } catch (e) { w = null; }
    return !!w;
  }

  function viaAnchor(url) {
    try {
      var a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { try { document.body.removeChild(a); } catch (e) {} }, 0);
      return true;
    } catch (e) { return false; }
  }

  global.chcnOpenExternal = function (url, label) {
    if (!url) return false;
    var now = Date.now();
    if (url === last.url && (now - last.t) < 1500) { return true; } // ignore rapid duplicate
    last.url = url; last.t = now;

    // 1) native bridge (never leaves the app, opens system browser)
    if (viaNative(url)) return true;
    // 2) one window.open attempt
    if (viaWindowOpen(url)) return true;
    // 3) one anchor-click attempt (same path the WebView uses for new windows)
    if (viaAnchor(url)) return true;
    // 4) give up WITHOUT navigating the main page away
    toast('Could not open the link automatically. Address: ' + url);
    return false;
  };
})(window);
