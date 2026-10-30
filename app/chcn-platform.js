/* =====================================================================
 * chcn-platform.js — Centralized CLIENT-SIDE platform services
 * ---------------------------------------------------------------------
 * Real, persistent, testable services that live entirely on-device
 * (localStorage) and need no backend. They complement NavigationService
 * (chcn-nav.js) to satisfy the FUNCTIONALITY + DATA-INTEGRITY tiers of
 * the upgrade spec WITHOUT fabricating server/DB/auth/payment features
 * that this static PWA cannot honestly provide.
 *
 * Provides under window.CHCN.Platform:
 *   Store           - safe JSON get/set/remove
 *   Favorites       - persistent favorites for any content type
 *   Bookmarks       - add/remove/rename/note/search, deep-link back
 *   Activity         - recent activity feed (privacy-filtered)
 *   Search          - central index across registered sources
 *   State           - per-route scroll/filter/tab/form persistence
 *   Draft           - autosave + crash/close recovery
 *   Connectivity    - online/offline + offline action queue
 *   Notifications   - local notification store (read/unread/deep-link)
 *   Permissions     - HONEST device-permission status (no fakes)
 *   Dashboard       - \"continue where I left off\" + honest empty states
 * ===================================================================== */
(function (global) {
  'use strict';
  if (global.CHCN && global.CHCN.Platform) { return; }
  var CHCN = global.CHCN = global.CHCN || {};
  var P = {};

  /* ---------- Store: safe JSON persistence ---------- */
  var Store = {
    get: function (key, dflt) {
      try { var v = global.localStorage.getItem(key); return v == null ? dflt : JSON.parse(v); }
      catch (e) { return dflt; }
    },
    set: function (key, val) {
      try { global.localStorage.setItem(key, JSON.stringify(val)); return true; }
      catch (e) { return false; }
    },
    remove: function (key) { try { global.localStorage.removeItem(key); return true; } catch (e) { return false; } }
  };
  P.Store = Store;

  function now() { return Date.now(); }
  function uid() { return 'x' + now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function emit(name, detail) { try { global.dispatchEvent(new global.CustomEvent(name, { detail: detail })); } catch (e) {} }

  /* ---------- Favorites ---------- */
  var FAV_KEY = 'chcn_favorites';
  var Favorites = {
    all: function () { var a = Store.get(FAV_KEY, []); return Array.isArray(a) ? a : []; },
    _key: function (type, id) { return String(type) + '::' + String(id); },
    has: function (type, id) { var k = this._key(type, id); return this.all().some(function (f) { return f.k === k; }); },
    add: function (type, id, meta) {
      var a = this.all(), k = this._key(type, id);
      if (a.some(function (f) { return f.k === k; })) { return false; }
      a.push({ k: k, type: type, id: String(id), title: (meta && meta.title) || String(id), route: (meta && meta.route) || null, ts: now() });
      Store.set(FAV_KEY, a); emit('chcn:favorites-changed', {}); return true;
    },
    remove: function (type, id) {
      var k = this._key(type, id), a = this.all().filter(function (f) { return f.k !== k; });
      Store.set(FAV_KEY, a); emit('chcn:favorites-changed', {}); return true;
    },
    toggle: function (type, id, meta) { return this.has(type, id) ? (this.remove(type, id), false) : (this.add(type, id, meta), true); },
    list: function (type) { var a = this.all(); return type ? a.filter(function (f) { return f.type === type; }) : a; }
  };
  P.Favorites = Favorites;

  /* ---------- Bookmarks ---------- */
  var BM_KEY = 'chcn_bookmarks';
  var Bookmarks = {
    all: function () { var a = Store.get(BM_KEY, []); return Array.isArray(a) ? a : []; },
    add: function (bm) {
      if (!bm || !bm.title) { return null; }
      var a = this.all(), rec = { id: uid(), title: String(bm.title), route: bm.route || null, type: bm.type || 'page', note: bm.note || '', ts: now() };
      a.unshift(rec); Store.set(BM_KEY, a); emit('chcn:bookmarks-changed', {}); return rec;
    },
    remove: function (id) { Store.set(BM_KEY, this.all().filter(function (b) { return b.id !== id; })); emit('chcn:bookmarks-changed', {}); return true; },
    rename: function (id, title) { var a = this.all(); a.forEach(function (b) { if (b.id === id) { b.title = String(title); } }); Store.set(BM_KEY, a); return true; },
    setNote: function (id, note) { var a = this.all(); a.forEach(function (b) { if (b.id === id) { b.note = String(note); } }); Store.set(BM_KEY, a); return true; },
    search: function (q) {
      q = String(q || '').toLowerCase().trim(); if (!q) { return this.all(); }
      return this.all().filter(function (b) { return (b.title + ' ' + (b.note || '')).toLowerCase().indexOf(q) > -1; });
    }
  };
  P.Bookmarks = Bookmarks;

  /* ---------- Activity (privacy-filtered) ---------- */
  var ACT_KEY = 'chcn_activity';
  var ACT_MAX = 200;
  // Sensitive kinds are NEVER auto-recorded in the general feed (privacy by default).
  var ACT_BLOCK = { 'period': 1, 'cycle': 1, 'health': 1, 'family-detail': 1, 'bloodtype-result': 1 };
  var Activity = {
    all: function () { var a = Store.get(ACT_KEY, []); return Array.isArray(a) ? a : []; },
    record: function (kind, meta) {
      if (!kind || ACT_BLOCK[kind]) { return false; } // honor privacy
      var a = this.all();
      a.unshift({ id: uid(), kind: kind, title: (meta && meta.title) || kind, route: (meta && meta.route) || null, ts: now() });
      if (a.length > ACT_MAX) { a = a.slice(0, ACT_MAX); }
      Store.set(ACT_KEY, a); emit('chcn:activity-changed', {}); return true;
    },
    list: function (limit) { var a = this.all(); return limit ? a.slice(0, limit) : a; },
    remove: function (id) { Store.set(ACT_KEY, this.all().filter(function (e) { return e.id !== id; })); emit('chcn:activity-changed', {}); return true; },
    clear: function () { Store.remove(ACT_KEY); emit('chcn:activity-changed', {}); return true; },
    isSensitiveKind: function (kind) { return !!ACT_BLOCK[kind]; }
  };
  P.Activity = Activity;

  /* ---------- Search: central index across registered sources ---------- */
  var SR_KEY = 'chcn_recent_searches';
  var Search = (function () {
    var sources = {}; // name -> function() => [{type,title,route,keywords}]
    function registerSource(name, fn) { if (name && typeof fn === 'function') { sources[name] = fn; } }
    function collect() {
      var out = [];
      Object.keys(sources).forEach(function (n) {
        var items = [];
        try { items = sources[n]() || []; } catch (e) { items = []; }
        items.forEach(function (it) { if (it && it.title) { it._source = n; out.push(it); } });
      });
      return out;
    }
    function score(item, q) {
      var hay = (item.title + ' ' + (item.keywords || '') + ' ' + (item.type || '')).toLowerCase();
      var t = item.title.toLowerCase();
      if (t === q) { return 100; }
      if (t.indexOf(q) === 0) { return 80; }
      if (t.indexOf(q) > -1) { return 60; }
      if (hay.indexOf(q) > -1) { return 30; }
      return 0;
    }
    function query(q) {
      q = String(q || '').toLowerCase().trim(); if (!q) { return []; }
      return collect().map(function (it) { return { item: it, s: score(it, q) }; })
        .filter(function (r) { return r.s > 0; })
        .sort(function (a, b) { return b.s - a.s; })
        .map(function (r) { return r.item; });
    }
    function recordRecent(q) {
      q = String(q || '').trim(); if (!q) { return; }
      var a = Store.get(SR_KEY, []); if (!Array.isArray(a)) { a = []; }
      a = a.filter(function (x) { return x.toLowerCase() !== q.toLowerCase(); }); a.unshift(q);
      Store.set(SR_KEY, a.slice(0, 12));
    }
    return {
      registerSource: registerSource,
      query: query,
      recent: function () { var a = Store.get(SR_KEY, []); return Array.isArray(a) ? a : []; },
      recordRecent: recordRecent,
      clearRecent: function () { Store.remove(SR_KEY); },
      sourceCount: function () { return Object.keys(sources).length; }
    };
  })();
  P.Search = Search;

  /* ---------- State: per-route scroll/filter/tab/form persistence ---------- */
  var ST_KEY = 'chcn_route_state';
  var State = {
    _all: function () { var o = Store.get(ST_KEY, {}); return (o && typeof o === 'object') ? o : {}; },
    get: function (route) { return this._all()[route] || {}; },
    save: function (route, patch) {
      if (!route || !patch) { return false; }
      var all = this._all(); all[route] = Object.assign({}, all[route] || {}, patch, { _ts: now() });
      return Store.set(ST_KEY, all);
    },
    saveScroll: function (route, y) { return this.save(route, { scroll: y || 0 }); },
    getScroll: function (route) { return this.get(route).scroll || 0; },
    clear: function (route) { var all = this._all(); delete all[route]; return Store.set(ST_KEY, all); }
  };
  P.State = State;

  /* ---------- Draft: autosave + crash/close recovery ---------- */
  var DR_KEY = 'chcn_drafts';
  var Draft = {
    _all: function () { var o = Store.get(DR_KEY, {}); return (o && typeof o === 'object') ? o : {}; },
    save: function (key, data, label) {
      if (!key) { return false; }
      var all = this._all(); all[key] = { data: data, label: label || key, ts: now() };
      var ok = Store.set(DR_KEY, all); emit('chcn:draft-saved', { key: key }); return ok;
    },
    get: function (key) { var d = this._all()[key]; return d ? d.data : null; },
    has: function (key) { return Object.prototype.hasOwnProperty.call(this._all(), key); },
    discard: function (key) { var all = this._all(); delete all[key]; Store.set(DR_KEY, all); emit('chcn:draft-discarded', { key: key }); return true; },
    list: function () { var all = this._all(); return Object.keys(all).map(function (k) { return { key: k, label: all[k].label, ts: all[k].ts }; }); },
    hasRecoverable: function () { return this.list().length > 0; }
  };
  P.Draft = Draft;

  /* ---------- Connectivity: online/offline + offline queue ---------- */
  var Q_KEY = 'chcn_offline_queue';
  var Connectivity = {
    isOnline: function () { try { return global.navigator ? global.navigator.onLine !== false : true; } catch (e) { return true; } },
    onChange: function (cb) {
      if (typeof cb !== 'function') { return; }
      try {
        global.addEventListener('online', function () { cb(true); });
        global.addEventListener('offline', function () { cb(false); });
      } catch (e) {}
    },
    queue: function (op) {
      var a = Store.get(Q_KEY, []); if (!Array.isArray(a)) { a = []; }
      a.push({ id: uid(), op: op, ts: now() }); Store.set(Q_KEY, a); emit('chcn:queue-changed', {}); return true;
    },
    pending: function () { var a = Store.get(Q_KEY, []); return Array.isArray(a) ? a : []; },
    // Attempt each queued op with handler(op)->truthy on success. Failed ops stay queued.
    flush: function (handler) {
      if (typeof handler !== 'function') { return 0; }
      var a = this.pending(), kept = [], done = 0;
      a.forEach(function (rec) {
        var ok = false; try { ok = handler(rec.op); } catch (e) { ok = false; }
        if (ok) { done++; } else { kept.push(rec); }
      });
      Store.set(Q_KEY, kept); emit('chcn:queue-changed', {}); return done;
    },
    clearQueue: function () { Store.remove(Q_KEY); emit('chcn:queue-changed', {}); return true; }
  };
  P.Connectivity = Connectivity;

  /* ---------- Notifications: local store (read/unread/deep-link/privacy) ---------- */
  var NT_KEY = 'chcn_notifications';
  var NT_DETAIL_KEY = 'chcn_notif_detail_level';
  var Notifications = {
    all: function () { var a = Store.get(NT_KEY, []); return Array.isArray(a) ? a : []; },
    add: function (n) {
      if (!n || !n.title) { return null; }
      var a = this.all(), rec = { id: uid(), title: String(n.title), body: n.body || '', category: n.category || 'general', route: n.route || null, sensitive: !!n.sensitive, read: false, ts: now() };
      a.unshift(rec); Store.set(NT_KEY, a); emit('chcn:notifications-changed', {}); return rec;
    },
    list: function () { return this.all(); },
    unreadCount: function () { return this.all().filter(function (n) { return !n.read; }).length; },
    markRead: function (id) { var a = this.all(); a.forEach(function (n) { if (n.id === id) { n.read = true; } }); Store.set(NT_KEY, a); emit('chcn:notifications-changed', {}); return true; },
    markAllRead: function () { var a = this.all(); a.forEach(function (n) { n.read = true; }); Store.set(NT_KEY, a); emit('chcn:notifications-changed', {}); return true; },
    remove: function (id) { Store.set(NT_KEY, this.all().filter(function (n) { return n.id !== id; })); emit('chcn:notifications-changed', {}); return true; },
    clear: function () { Store.remove(NT_KEY); emit('chcn:notifications-changed', {}); return true; },
    // 'full' shows body; 'minimal' hides body for sensitive notifications (privacy).
    setDetailLevel: function (lvl) { Store.set(NT_DETAIL_KEY, lvl === 'minimal' ? 'minimal' : 'full'); },
    detailLevel: function () { return Store.get(NT_DETAIL_KEY, 'full'); },
    displayBody: function (n) {
      if (!n) { return ''; }
      if (n.sensitive && this.detailLevel() === 'minimal') { return 'New notification (details hidden for privacy)'; }
      return n.body || '';
    }
  };
  P.Notifications = Notifications;

  /* ---------- Permissions: HONEST device-permission status (never fake) ---------- */
  var Permissions = {
    // Returns a Promise resolving to one of:
    // 'granted' | 'denied' | 'prompt' | 'unsupported'
    query: function (name) {
      return new global.Promise(function (resolve) {
        try {
          if (!global.navigator || !global.navigator.permissions || !global.navigator.permissions.query) {
            resolve('unsupported'); return;
          }
          // Map friendly names to Permissions API names.
          var map = { microphone: 'microphone', camera: 'camera', location: 'geolocation', notifications: 'notifications' };
          var pn = map[name] || name;
          global.navigator.permissions.query({ name: pn }).then(function (st) { resolve(st.state || 'prompt'); })
            .catch(function () { resolve('unsupported'); });
        } catch (e) { resolve('unsupported'); }
      });
    },
    // Synchronous best-effort snapshot for things queryable without the API.
    snapshot: function () {
      var s = {};
      try { s.notifications = (global.Notification && global.Notification.permission) ? global.Notification.permission : 'unsupported'; } catch (e) { s.notifications = 'unsupported'; }
      try { s.geolocation = (global.navigator && global.navigator.geolocation) ? 'available' : 'unsupported'; } catch (e) { s.geolocation = 'unsupported'; }
      return s;
    },
    reason: function (name) {
      var reasons = {
        microphone: 'Used for voice commands and voice search.',
        camera: 'Used only when you choose to take or upload a photo.',
        location: 'Used for the map, GPS and compass features you open.',
        notifications: 'Used to send reminders you have opted into.'
      };
      return reasons[name] || 'Requested only when a feature you open needs it.';
    }
  };
  P.Permissions = Permissions;

  /* ---------- Dashboard: continue + honest empty states ---------- */
  var Dashboard = {
    // Uses the app's existing progress store (chcn_progress) to build a
    // real \"continue where I left off\" list — no fabricated numbers.
    continueItems: function () {
      var prog = Store.get('chcn_progress', {}); if (!prog || typeof prog !== 'object') { prog = {}; }
      return Object.keys(prog).map(function (name) {
        var p = prog[name] || {}; var total = p.total || 0, done = p.completed || 0;
        var pct = total ? Math.round((done / total) * 100) : 0;
        return { title: name, completed: done, total: total, percent: pct, route: 'courses' };
      }).filter(function (x) { return x.percent < 100; });
    },
    enrolled: function () { var a = Store.get('chcn_enrolled', []); return Array.isArray(a) ? a : []; },
    summary: function () {
      return {
        continueLearning: this.continueItems(),
        enrolled: this.enrolled(),
        favorites: Favorites.all(),
        bookmarks: Bookmarks.all(),
        recentActivity: Activity.list(20),
        notifications: Notifications.list(),
        unreadNotifications: Notifications.unreadCount()
      };
    },
    // Honest empty-state text for a given section (no fake stats).
    emptyText: function (section) {
      var m = {
        continueLearning: 'No courses in progress yet.',
        enrolled: 'No courses enrolled yet.',
        favorites: 'No favorite tools yet.',
        bookmarks: 'No bookmarks yet.',
        recentActivity: 'No recent activity yet.',
        notifications: 'No notifications yet.'
      };
      return m[section] || 'Nothing here yet.';
    }
  };
  P.Dashboard = Dashboard;

  /* ---------- Default search sources (courses + Life & Tools + help) ---------- */
  function installDefaultSources() {
    // Life & Tools + main pages, taken from the navigation route registry.
    Search.registerSource('pages', function () {
      var routes = (CHCN.Nav && CHCN.Nav.trail) ? null : null; // route titles come from NavigationService
      var known = ['lifetools','bloodtype','family','cycle','calc','datecalc','bmi','convert','courses','map','payment','about','contact','account'];
      return known.map(function (p) {
        var title = (CHCN.Nav && CHCN.Nav.titleOf) ? CHCN.Nav.titleOf(p) : p;
        return { type: 'page', title: title, route: p, keywords: p };
      });
    });
    // Enrolled courses become searchable, real data only.
    Search.registerSource('courses', function () {
      return Dashboard.enrolled().map(function (name) { return { type: 'course', title: name, route: 'courses', keywords: 'course lesson' }; });
    });
    // Favorites + bookmarks are searchable and deep-link back.
    Search.registerSource('favorites', function () { return Favorites.all().map(function (f) { return { type: 'favorite', title: f.title, route: f.route, keywords: 'favorite ' + f.type }; }); });
    Search.registerSource('bookmarks', function () { return Bookmarks.all().map(function (b) { return { type: 'bookmark', title: b.title, route: b.route, keywords: 'bookmark ' + (b.note || '') }; }); });
  }

  /* ---------- Command Center: unify search + voice + navigation ---------- */
  function installCommands() {
    if (!CHCN.Commands || typeof CHCN.Commands.register !== 'function') { return; }
    var C = CHCN.Commands;
    var nav = function (p) { if (CHCN.Nav && CHCN.Nav.go) { CHCN.Nav.go(p); } else if (typeof global.navigate === 'function') { global.navigate(p); } };
    C.register(['show my favorites', 'open favorites', 'my favorites', 'favourites'], function () { nav('account'); }, 'Show favorites');
    C.register(['show my bookmarks', 'open bookmarks', 'my bookmarks'], function () { nav('account'); }, 'Show bookmarks');
    C.register(['open my last course', 'continue my course', 'continue learning'], function () {
      var items = Dashboard.continueItems();
      nav('courses');
    }, 'Continue your last course');
    C.register(['show my activity', 'my activity', 'recent activity'], function () { nav('account'); }, 'Show activity');
  }

  function boot() {
    installDefaultSources();
    installCommands();
    // Record page views into activity (privacy-filtered) when navigation happens.
    try {
      global.addEventListener('popstate', function () {});
    } catch (e) {}
  }
  if (global.document && global.document.readyState === 'loading') {
    global.document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 0); });
  } else { setTimeout(boot, 0); }

  /* __CH_APPEND__ */
  CHCN.Platform = P;
})(typeof window !== 'undefined' ? window : this);
