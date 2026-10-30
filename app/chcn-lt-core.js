/* =============================================================================
 * Creator Hub Creator Network — Life & Tools APP FRAMEWORK (self-injecting)
 * -----------------------------------------------------------------------------
 * A tiny module registry that upgrades the existing SPA WITHOUT breaking it.
 * Feature files (hub, blood type, family center, period tracker, calculators)
 * call LTApp.register({...}); this core wraps window.navigate, injects every
 * module page before the footer, wires a single "Life & Tools" nav link, and
 * runs each module's init + onShow hooks. Nothing here fakes data.
 * ========================================================================== */
(function () {
  'use strict';
  if (window.LTApp) { return; }

  var modules = [];
  var pageOwners = {}; // page name -> onShow handler

  var LTApp = {
    register: function (mod) {
      modules.push(mod);
      (mod.pages || []).forEach(function (p) {
        if (mod.onShow && mod.onShow[p]) { pageOwners[p] = mod.onShow[p]; }
        else { pageOwners[p] = pageOwners[p] || null; }
      });
    },
    isModulePage: function (p) { return Object.prototype.hasOwnProperty.call(pageOwners, p); },
    el: function (id) { return document.getElementById(id); },
    esc: function (s) { var d = document.createElement('div'); d.textContent = (s == null ? '' : s); return d.innerHTML; },
    toast: function (m, e) { if (typeof window.showToast === 'function') { window.showToast(m, e); } else { try { console.log(m); } catch (x) {} } },
    // localStorage helpers with graceful failure
    load: function (key, fallback) { try { var v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    save: function (key, val) { try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { LTApp.toast('Could not save — device storage may be full or blocked', true); return false; } },
    navigate: function (p) { if (typeof window.navigate === 'function') { window.navigate(p); } }
  };
  window.LTApp = LTApp;

  function hideAllPages() {
    var nodes = document.querySelectorAll('[id^="page-"]');
    for (var i = 0; i < nodes.length; i++) { nodes[i].style.display = 'none'; }
  }

  function installNavigation() {
    var orig = window.navigate;
    window.navigate = function (page) {
      if (LTApp.isModulePage(page)) {
        hideAllPages();
        var t = document.getElementById('page-' + page);
        if (t) { t.style.display = 'block'; }
        document.querySelectorAll('.nav-link').forEach(function (l) { l.classList.remove('active'); });
        document.querySelectorAll('.nav-link[data-page="' + page + '"]').forEach(function (l) { l.classList.add('active'); });
        window.scrollTo(0, 0);
        var nav = document.querySelector('.navbar nav'); if (nav) { nav.classList.remove('open'); }
        var h = pageOwners[page]; if (typeof h === 'function') { try { h(); } catch (e) { LTApp.toast('This tool hit an error while opening', true); } }
        return;
      }
      if (typeof orig === 'function') { return orig(page); }
    };
  }

  function installNavLink() {
    var nav = document.querySelector('.navbar nav');
    if (!nav || nav.querySelector('.nav-link[data-page="lifetools"]')) { return; }
    var signin = nav.querySelector('.nav-btn-signin');
    var a = document.createElement('a');
    a.className = 'nav-link'; a.setAttribute('data-page', 'lifetools');
    a.textContent = 'Life & Tools';
    a.onclick = function () { window.navigate('lifetools'); };
    if (signin) { nav.insertBefore(a, signin); } else { nav.appendChild(a); }
  }

  function boot() {
    // 1. build markup for every registered module
    var wrap = document.createElement('div');
    var html = '';
    modules.forEach(function (m) { try { if (m.build) { html += m.build(); } } catch (e) { try { console.error(e); } catch (x) {} } });
    wrap.innerHTML = html;
    var footer = document.querySelector('footer.footer') || document.querySelector('.footer-sidebar') || document.querySelector('footer');
    if (footer && footer.parentNode) { while (wrap.firstChild) { footer.parentNode.insertBefore(wrap.firstChild, footer); } }
    else { while (wrap.firstChild) { document.body.appendChild(wrap.firstChild); } }
    // 2. navigation + link
    installNavigation();
    installNavLink();
    // 3. init each module
    modules.forEach(function (m) { try { if (m.init) { m.init(); } } catch (e) { try { console.error(e); } catch (x) {} } });
  }

  // Run after all sibling module scripts have registered (setTimeout defers past sync scripts).
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 0); }); }
  else { setTimeout(boot, 0); }
})();
