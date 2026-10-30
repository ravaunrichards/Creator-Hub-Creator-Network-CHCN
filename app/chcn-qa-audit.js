/* =============================================================================
 * Creator Hub — Automated QA / Audit  (chcn-qa-audit.js)
 * -----------------------------------------------------------------------------
 * Purely ADDITIVE in-browser audit the command marks as mandatory:
 *   • INVISIBLE BLOCKER TEST — full/near-full viewport fixed|absolute elements
 *     that are transparent yet still capture pointer events (ghost overlays),
 *     plus lingering modal backdrops.
 *   • DEAD BUTTON TEST — clickable elements whose inline handler calls a
 *     function that is not defined on window.
 *   • Z-INDEX OUTLIER TEST — elements using arbitrary extreme z-index outside
 *     the central scale managed by chcn-overlay-manager.js.
 * Run manually from the console:  CHCN.QA.audit()
 * It never mutates the page; it only reports. (A soft auto-fix helper is
 * provided separately via CHCN.QA.neutralizeGhosts().)
 * ========================================================================== */
(function (global) {
  'use strict';
  var doc = global.document;

  function rectCoversViewport(r) {
    var vw = global.innerWidth, vh = global.innerHeight;
    return r.width >= vw * 0.6 && r.height >= vh * 0.6;
  }
  function transparent(cs) {
    var bg = cs.backgroundColor || '';
    var noBg = bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)' || /rgba\(.*,\s*0\)$/.test(bg);
    return noBg && (cs.backgroundImage === 'none');
  }

  function findInvisibleBlockers() {
    var out = [];
    var all = doc.querySelectorAll('body *');
    for (var i = 0; i < all.length; i++) {
      var el = all[i], cs = global.getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'absolute') continue;
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      if (cs.pointerEvents === 'none') continue;            // safe: lets taps through
      var r = el.getBoundingClientRect();
      if (!rectCoversViewport(r)) continue;
      var z = parseInt(cs.zIndex, 10); if (isNaN(z)) z = 0;
      var looksEmpty = el.children.length === 0 && !(el.textContent || '').trim();
      if (z >= 1000 && (transparent(cs) || parseFloat(cs.opacity) < 0.05 || looksEmpty)) {
        out.push({ el: el, id: el.id || null, cls: el.className || null, z: z,
                   bg: cs.backgroundColor, opacity: cs.opacity });
      }
    }
    return out;
  }

  function findOrphanBackdrops() {
    var out = [];
    doc.querySelectorAll('.modal-overlay, .voice-hub, .gc-modal, .chcn-settings-overlay').forEach(function (el) {
      var cs = global.getComputedStyle(el);
      var active = el.classList.contains('active') || el.classList.contains('open') ||
                   (cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0');
      // orphan = painted (captures taps) but not flagged active/open
      if (cs.display !== 'none' && cs.pointerEvents !== 'none' && !active) {
        out.push({ id: el.id || null, cls: el.className });
      }
    });
    return out;
  }

  function findDeadButtons() {
    var out = [];
    var ignore = /^(if|for|while|return|function|typeof|new|parseInt|parseFloat|JSON|Number|String|Boolean|Array|Object|Math|console|alert|confirm|prompt|setTimeout|setInterval|document|window|this|event|true|false|null)$/;
    var nodes = doc.querySelectorAll('[onclick]');
    for (var i = 0; i < nodes.length; i++) {
      var code = nodes[i].getAttribute('onclick') || '';
      var m, re = /([A-Za-z_$][\w$]*)\s*\(/g;
      while ((m = re.exec(code))) {
        var fn = m[1];
        if (ignore.test(fn)) continue;
        // allow member calls like foo.bar() — only test bare global calls
        var before = code.charAt(m.index - 1);
        if (before === '.') continue;
        if (typeof global[fn] !== 'function') {
          out.push({ fn: fn, text: (nodes[i].textContent || '').trim().slice(0, 40),
                     tag: nodes[i].tagName });
        }
      }
    }
    return out;
  }

  function findZIndexOutliers() {
    var out = [], MAX = 10000;
    doc.querySelectorAll('body *').forEach(function (el) {
      var z = parseInt(global.getComputedStyle(el).zIndex, 10);
      if (!isNaN(z) && z > MAX) out.push({ id: el.id || null, cls: el.className || null, z: z });
    });
    return out;
  }

  var API = {
    audit: function (opts) {
      opts = opts || {};
      var report = {
        mode: (global.CHCN && global.CHCN.Overlay) ? global.CHCN.Overlay.getMode() : 'n/a',
        invisibleBlockers: findInvisibleBlockers(),
        orphanBackdrops: findOrphanBackdrops(),
        deadButtons: findDeadButtons(),
        zIndexOutliers: findZIndexOutliers()
      };
      if (!opts.silent) {
        var ib = report.invisibleBlockers.length, db = report.deadButtons.length;
        var ob = report.orphanBackdrops.length, zo = report.zIndexOutliers.length;
        try {
          console.groupCollapsed('%cCHCN QA Audit', 'font-weight:bold;color:#0ea5e9');
          console.log('Mode:', report.mode);
          console.log('Invisible blockers:', ib, report.invisibleBlockers);
          console.log('Orphan backdrops :', ob, report.orphanBackdrops);
          console.log('Dead buttons     :', db, report.deadButtons);
          console.log('Z-index outliers :', zo, report.zIndexOutliers);
          console.log(ib + ob + db === 0 ? 'PASS: no blocking/dead-button issues.' : 'Review the items above.');
          console.groupEnd();
        } catch (e) {}
      }
      return report;
    },
    // Soft, reversible mitigation: let taps pass through confirmed ghosts.
    neutralizeGhosts: function () {
      var n = findInvisibleBlockers(), fixed = 0;
      n.forEach(function (b) { if (b.el) { b.el.style.pointerEvents = 'none'; fixed++; } });
      return fixed;
    }
  };
  global.CHCN = global.CHCN || {};
  global.CHCN.QA = API;

  // Run one SILENT, read-only self-check after load. It only logs — it never
  // mutates the page, so it can never make real content unclickable.
  function selfCheck() {
    try {
      var r = API.audit({ silent: true });
      if (r.invisibleBlockers.length && global.console) {
        console.warn('CHCN QA: potential invisible blocker(s) detected. Run CHCN.QA.audit() to inspect, or CHCN.QA.neutralizeGhosts() to let taps pass through.', r.invisibleBlockers);
      }
    } catch (e) {}
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { setTimeout(selfCheck, 1500); });
  else setTimeout(selfCheck, 1500);
})(window);
