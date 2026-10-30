/* ===========================================================================
 * Creator Hub Creator Network — Incremental Content Manager (CHCN-CM)
 * ---------------------------------------------------------------------------
 * PURPOSE
 *   Turn the bundled catalogue into a PERMANENT, INCREMENTAL content platform.
 *   New pieces (course / module / lesson / quiz / doc) can be added ONE AT A
 *   TIME without destroying existing bundled content or learner data.
 *
 * ARCHITECTURE (local-first, migration-ready)
 *   - Bundled courses live in the global COURSE_DATA registry (app.js +
 *     enhance.js + latest-update.js). CHCN-CM never mutates the bundled JS
 *     files; instead it keeps an OVERLAY of additions in localStorage and
 *     re-applies them over COURSE_DATA at every boot. Bundled content is the
 *     immutable base; the overlay is additive.
 *   - Every addition is a versioned, hashed UPDATE OP stored in an ordered log.
 *     Reconstructing state = replaying every op with status 'applied' in order.
 *     Rollback = flip an op to 'rolledback' and rebuild from the base. This is
 *     genuine, deterministic, non-destructive versioning.
 *
 * HONESTY / LIMITATIONS (static bundled WebView APK, no backend)
 *   - There is NO server. Cross-device / cross-user SERVER SYNC is IMPOSSIBLE
 *     in this build. The overlay is per-device (localStorage). Anything that
 *     needs a server is marked REQUIRES SERVER in the audit and is NOT faked.
 *   - Export / Import JSON is provided as the real, working migration path.
 * ======================================================================== */
(function (global) {
  'use strict';

  var REPO_KEY = 'chcn_content_repo';
  var SCHEMA = 1;

  /* ---------- storage helpers ---------- */
  function load(key, def) {
    try { var v = JSON.parse(localStorage.getItem(key)); return (v == null) ? def : v; }
    catch (e) { return def; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { return false; }
  }
  function esc(s) { var d = document.createElement('div'); d.textContent = (s == null ? '' : String(s)); return d.innerHTML; }
  function nowISO() { return new Date().toISOString(); }

  /* ---------- id + version helpers ---------- */
  function slug(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  }
  function shortHash(str) {
    // deterministic non-crypto hash for duplicate / change detection
    var h = 5381, i = String(str).length;
    while (i) { h = (h * 33) ^ String(str).charCodeAt(--i); }
    return (h >>> 0).toString(36);
  }
  function genId(prefix, title) {
    return prefix + '-' + (slug(title) || 'item') + '-' + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36);
  }
  function parseSemver(v) {
    var m = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(v || '1.0.0'));
    return m ? [+m[1], +m[2], +m[3]] : [1, 0, 0];
  }
  function bumpVersion(v, kind) {
    var p = parseSemver(v);
    if (kind === 'major') { p[0]++; p[1] = 0; p[2] = 0; }
    else if (kind === 'minor') { p[1]++; p[2] = 0; }
    else { p[2]++; }
    return p.join('.');
  }

  /* ---------- repo model ---------- */
  function freshRepo() {
    return { schema: SCHEMA, version: '1.0.0', created: nowISO(), updated: nowISO(), counter: 0, ops: [] };
  }
  function getRepo() {
    var r = load(REPO_KEY, null);
    if (!r || r.schema !== SCHEMA || !Array.isArray(r.ops)) r = freshRepo();
    return r;
  }
  function putRepo(r) { r.updated = nowISO(); return save(REPO_KEY, r); }
  function nextUpdateId(r) {
    r.counter = (r.counter || 0) + 1;
    return 'CHCN-UPDATE-' + String(r.counter).padStart(4, '0');
  }

  /* ---------- deep clone (structured, no functions) ---------- */
  function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }

  global.__CHCN_CM_CORE__ = {
    load: load, save: save, esc: esc, nowISO: nowISO, slug: slug, shortHash: shortHash,
    genId: genId, parseSemver: parseSemver, bumpVersion: bumpVersion,
    freshRepo: freshRepo, getRepo: getRepo, putRepo: putRepo, nextUpdateId: nextUpdateId,
    clone: clone, REPO_KEY: REPO_KEY, SCHEMA: SCHEMA
  };
})(typeof window !== 'undefined' ? window : this);

/* ===========================================================================
 * PART 2 — merge engine, duplicate detection, validation gate, gap audit,
 *          public content API, rollback, self-test.
 * ======================================================================== */
(function (global) {
  'use strict';
  var C = global.__CHCN_CM_CORE__;
  if (!C) { return; }
  var clone = C.clone, esc = C.esc, nowISO = C.nowISO, shortHash = C.shortHash;

  function CD() { return global.COURSE_DATA || (global.COURSE_DATA = {}); }
  function courseExists(id) { return !!CD()[id]; }

  /* ---------- normalizers: build well-formed fragments ---------- */
  function normLesson(l) {
    l = l || {};
    var type = (l.type === 'quiz') ? 'quiz' : 'lesson';
    var out = { title: String(l.title || '').trim(), type: type };
    if (l.duration) out.duration = String(l.duration);
    if (type === 'quiz') { out.questions = (l.questions != null) ? l.questions : 10; if (l.isFinal) out.isFinal = true; }
    if (l.content) out.content = String(l.content);
    return out;
  }
  function normModule(m) {
    m = m || {};
    return {
      title: String(m.title || '').trim(),
      lessons: (Array.isArray(m.lessons) ? m.lessons : []).map(normLesson)
    };
  }
  function normCourse(id, c) {
    c = c || {};
    return {
      name: String(c.name || '').trim(),
      cat: String(c.cat || c.category || 'General').trim(),
      level: (c.level != null ? c.level : 1),
      lvlLabel: String(c.lvlLabel || c.levelLabel || 'Foundational'),
      icon: String(c.icon || '📘'),
      price: String(c.price || 'Free'),
      cert: 'CHCN-CERT',
      certFull: 'Certificate of Completion — ' + String(c.name || '').trim(),
      desc: String(c.desc || c.description || ''),
      modules: (Array.isArray(c.modules) ? c.modules : []).map(normModule)
    };
  }

  /* ---------- content hashing (change / duplicate detection) ---------- */
  function hashCourse(c) { return shortHash(JSON.stringify(c)); }
  function moduleTitles(course) { return (course.modules || []).map(function (m) { return (m.title || '').toLowerCase().trim(); }); }

  /* ---------- duplicate / conflict detection ----------
   * Returns { level:'none'|'warn'|'block', messages:[...] }
   */
  function detectConflicts(op) {
    var msgs = [], level = 'none';
    var cd = CD();
    if (op.kind === 'course') {
      if (cd[op.courseId]) { level = 'block'; msgs.push('A course with id "' + op.courseId + '" already exists. Use "add module/lesson" to extend it, or choose a new id.'); }
      var dupName = Object.keys(cd).filter(function (k) { return cd[k].name && op.payload.name && cd[k].name.toLowerCase() === op.payload.name.toLowerCase(); });
      if (dupName.length) { if (level !== 'block') level = 'warn'; msgs.push('Another course already uses the name "' + op.payload.name + '" (' + dupName.join(', ') + ').'); }
    } else {
      var course = cd[op.courseId];
      if (!course) { level = 'block'; msgs.push('Target course "' + op.courseId + '" does not exist — cannot attach content to it.'); return { level: level, messages: msgs }; }
      if (op.kind === 'module') {
        if (moduleTitles(course).indexOf((op.payload.title || '').toLowerCase().trim()) !== -1) { level = 'warn'; msgs.push('Module "' + op.payload.title + '" already exists in this course. Adding it again will create a duplicate.'); }
      }
      if (op.kind === 'lesson' || op.kind === 'quiz') {
        var mod = course.modules[op.moduleIndex];
        if (!mod) { level = 'block'; msgs.push('Module index ' + op.moduleIndex + ' not found in course "' + op.courseId + '".'); return { level: level, messages: msgs }; }
        var titles = (mod.lessons || []).map(function (l) { return (l.title || '').toLowerCase().trim(); });
        if (titles.indexOf((op.payload.title || '').toLowerCase().trim()) !== -1) { level = 'warn'; msgs.push('An item titled "' + op.payload.title + '" already exists in module ' + (op.moduleIndex + 1) + '.'); }
        if (op.kind === 'quiz' && op.payload.isFinal) {
          var hasFinal = course.modules.some(function (m) { return (m.lessons || []).some(function (l) { return l.isFinal; }); });
          if (hasFinal) { level = 'warn'; msgs.push('This course already has a final assessment. Only one final assessment should exist.'); }
        }
      }
    }
    return { level: level, messages: msgs };
  }

  global.__CHCN_CM_CORE__.CD = CD;
  global.__CHCN_CM_CORE__.courseExists = courseExists;
  global.__CHCN_CM_CORE__.normCourse = normCourse;
  global.__CHCN_CM_CORE__.normModule = normModule;
  global.__CHCN_CM_CORE__.normLesson = normLesson;
  global.__CHCN_CM_CORE__.hashCourse = hashCourse;
  global.__CHCN_CM_CORE__.detectConflicts = detectConflicts;
})(typeof window !== 'undefined' ? window : this);

/* ===========================================================================
 * PART 3 — apply/replay engine + public content API (window.CHCN_CM)
 * ======================================================================== */
(function (global) {
  'use strict';
  var C = global.__CHCN_CM_CORE__;
  if (!C) { return; }
  var CD = C.CD, clone = C.clone, normCourse = C.normCourse, normModule = C.normModule,
      normLesson = C.normLesson, detectConflicts = C.detectConflicts,
      getRepo = C.getRepo, putRepo = C.putRepo, nextUpdateId = C.nextUpdateId,
      bumpVersion = C.bumpVersion, genId = C.genId, nowISO = C.nowISO, shortHash = C.shortHash;

  /* Snapshot of the immutable BUNDLED base (taken before any overlay applied). */
  var BASE_SNAPSHOT = null;
  function captureBase() {
    if (BASE_SNAPSHOT) return;
    BASE_SNAPSHOT = {};
    var cd = CD();
    Object.keys(cd).forEach(function (k) { BASE_SNAPSHOT[k] = clone(cd[k]); });
  }
  function baseIds() { return BASE_SNAPSHOT ? Object.keys(BASE_SNAPSHOT) : []; }

  /* Apply a single op onto the live COURSE_DATA (mutating). Returns true/err. */
  function applyOp(op) {
    var cd = CD();
    try {
      if (op.kind === 'course') {
        cd[op.courseId] = clone(op.payload);
      } else {
        var course = cd[op.courseId];
        if (!course) return 'target course missing';
        if (!Array.isArray(course.modules)) course.modules = [];
        if (op.kind === 'module') {
          course.modules.push(clone(op.payload));
        } else if (op.kind === 'lesson' || op.kind === 'quiz') {
          var mod = course.modules[op.moduleIndex];
          if (!mod) return 'target module missing';
          if (!Array.isArray(mod.lessons)) mod.lessons = [];
          mod.lessons.push(clone(op.payload));
        } else if (op.kind === 'doc') {
          if (!Array.isArray(course.docs)) course.docs = [];
          course.docs.push(clone(op.payload));
        }
      }
      return true;
    } catch (e) { return e.message || 'apply error'; }
  }

  /* Rebuild COURSE_DATA = base snapshot + replay all 'applied' ops in order. */
  function rebuild() {
    captureBase();
    var cd = CD();
    // reset to base: drop overlay-added courses, restore base courses
    Object.keys(cd).forEach(function (k) { if (!BASE_SNAPSHOT[k]) delete cd[k]; });
    Object.keys(BASE_SNAPSHOT).forEach(function (k) { cd[k] = clone(BASE_SNAPSHOT[k]); });
    var repo = getRepo(), applied = 0;
    repo.ops.forEach(function (op) { if (op.status === 'applied') { if (applyOp(op) === true) applied++; } });
    if (typeof global.buildContentIndex === 'function') { try { global.COURSE_CONTENT_INDEX = global.buildContentIndex(); } catch (e) {} }
    return applied;
  }

  /* Validation gate: tentatively apply op, run validateCourse, revert if bad. */
  function validateCandidate(op) {
    if (typeof global.validateCourse !== 'function') return { ok: true, note: 'validator unavailable — gate skipped', report: null };
    var cd = CD();
    var targetId = op.courseId;
    var before = cd[targetId] ? clone(cd[targetId]) : null;
    var existed = !!cd[targetId];
    var res = applyOp(op);
    if (res !== true) { if (before) cd[targetId] = before; else if (!existed) delete cd[targetId]; return { ok: false, note: res, report: null }; }
    var report = null;
    try { report = global.validateCourse(targetId); } catch (e) { report = { finalStatus: 'ERROR', issues: [e.message] }; }
    // revert (gate must not commit)
    if (existed) cd[targetId] = before; else delete cd[targetId];
    var ok = report && (report.finalStatus === 'PASS');
    return { ok: ok, note: ok ? 'passes course-integrity validation' : 'course-integrity reports: ' + (report ? report.finalStatus : 'unknown'), report: report };
  }

  /* Commit an op: dup-check -> validation gate -> persist -> rebuild. */
  function commit(op, options) {
    options = options || {};
    captureBase();
    var conflicts = detectConflicts(op);
    if (conflicts.level === 'block') return { ok: false, stage: 'duplicate', conflicts: conflicts };
    if (conflicts.level === 'warn' && !options.force) return { ok: false, stage: 'duplicate', conflicts: conflicts, needsForce: true };
    var gate = validateCandidate(op);
    if (!gate.ok && !options.skipValidation) return { ok: false, stage: 'validation', gate: gate, conflicts: conflicts };
    var repo = getRepo();
    op.id = nextUpdateId(repo);
    op.ts = nowISO();
    op.status = 'applied';
    op.version = bumpVersion(repo.version, op.kind === 'course' ? 'minor' : 'patch');
    op.hash = shortHash(JSON.stringify(op.payload));
    op.gateStatus = gate.report ? gate.report.finalStatus : (gate.note || 'n/a');
    repo.version = op.version;
    repo.ops.push(op);
    putRepo(repo);
    rebuild();
    return { ok: true, op: op, gate: gate, conflicts: conflicts };
  }

  /* ---------------- public API ---------------- */
  var API = {};

  API.addCourse = function (course, options) {
    var id = (course && course.id) ? String(course.id) : genId('chcn-course', course && course.name);
    var payload = normCourse(id, course);
    return commit({ kind: 'course', courseId: id, payload: payload, summary: 'Add course: ' + payload.name }, options);
  };
  API.addModule = function (courseId, module, options) {
    var payload = normModule(module);
    return commit({ kind: 'module', courseId: courseId, payload: payload, summary: 'Add module "' + payload.title + '" to ' + courseId }, options);
  };
  API.addLesson = function (courseId, moduleIndex, lesson, options) {
    var payload = normLesson(lesson); payload.type = 'lesson';
    return commit({ kind: 'lesson', courseId: courseId, moduleIndex: +moduleIndex, payload: payload, summary: 'Add lesson "' + payload.title + '"' }, options);
  };
  API.addQuiz = function (courseId, moduleIndex, quiz, options) {
    var payload = normLesson(quiz); payload.type = 'quiz';
    return commit({ kind: 'quiz', courseId: courseId, moduleIndex: +moduleIndex, payload: payload, summary: 'Add quiz "' + payload.title + '"' }, options);
  };
  API.addDoc = function (courseId, doc, options) {
    var payload = { title: String((doc && doc.title) || 'Document'), url: String((doc && doc.url) || ''), body: String((doc && doc.body) || '') };
    return commit({ kind: 'doc', courseId: courseId, payload: payload, summary: 'Add document "' + payload.title + '"' }, options);
  };

  API.history = function () { return getRepo().ops.slice(); };
  API.manifest = function () { var r = getRepo(); return { version: r.version, updated: r.updated, applied: r.ops.filter(function (o) { return o.status === 'applied'; }).length, total: r.ops.length, baseCourses: baseIds().length }; };

  API.rollback = function (opId) {
    var repo = getRepo(), found = false;
    repo.ops.forEach(function (o) { if (o.id === opId && o.status === 'applied') { o.status = 'rolledback'; o.rolledbackAt = nowISO(); found = true; } });
    if (!found) return { ok: false, note: 'update not found or already rolled back' };
    putRepo(repo);
    var n = rebuild();
    return { ok: true, applied: n };
  };
  API.restore = function (opId) {
    var repo = getRepo(), found = false;
    repo.ops.forEach(function (o) { if (o.id === opId && o.status === 'rolledback') { o.status = 'applied'; delete o.rolledbackAt; found = true; } });
    if (!found) return { ok: false, note: 'update not found or not rolled back' };
    putRepo(repo); return { ok: true, applied: rebuild() };
  };

  API.exportRepo = function () { return JSON.stringify(getRepo(), null, 2); };
  API.importRepo = function (json, merge) {
    var incoming; try { incoming = JSON.parse(json); } catch (e) { return { ok: false, note: 'invalid JSON' }; }
    if (!incoming || !Array.isArray(incoming.ops)) return { ok: false, note: 'not a CHCN repo' };
    if (merge) {
      var repo = getRepo(), have = {};
      repo.ops.forEach(function (o) { have[o.hash + '|' + o.summary] = true; });
      incoming.ops.forEach(function (o) { if (!have[o.hash + '|' + o.summary]) { repo.counter = (repo.counter || 0) + 1; repo.ops.push(o); } });
      putRepo(repo);
    } else { putRepo(incoming); }
    return { ok: true, applied: rebuild() };
  };
  API.rebuild = rebuild;
  API.baseIds = baseIds;
  API._captureBase = captureBase;
  API._commit = commit;

  global.CHCN_CM = API;
  C.rebuild = rebuild; C.captureBase = captureBase; C.baseIds = baseIds;
})(typeof window !== 'undefined' ? window : this);

/* ===========================================================================
 * PART 4 — gap / completeness audit + regression self-test
 * ======================================================================== */
(function (global) {
  'use strict';
  var C = global.__CHCN_CM_CORE__;
  if (!C) { return; }
  var CD = C.CD, clone = C.clone, API = global.CHCN_CM;

  /* Per-course completeness: what is present and what is MISSING. */
  function courseGaps(id) {
    var d = CD()[id]; if (!d) return null;
    var missing = [], present = [], lessonCount = 0, quizCount = 0, finalCount = 0, emptyModules = 0, quizNoQuestions = 0;
    (d.modules || []).forEach(function (m) {
      if (!m.lessons || !m.lessons.length) emptyModules++;
      (m.lessons || []).forEach(function (l) {
        if (l.type === 'quiz') { quizCount++; if (l.questions == null) quizNoQuestions++; if (l.isFinal) finalCount++; }
        else lessonCount++;
      });
    });
    if (d.desc && d.desc.length > 80) present.push('description'); else missing.push('adequate description (>80 chars)');
    if (d.modules && d.modules.length) present.push(d.modules.length + ' module(s)'); else missing.push('at least one module');
    if (lessonCount) present.push(lessonCount + ' lesson(s)'); else missing.push('teaching lessons');
    if (quizCount) present.push(quizCount + ' quiz item(s)'); else missing.push('knowledge-check quizzes');
    if (finalCount === 1) present.push('final assessment'); else if (finalCount === 0) missing.push('a final assessment'); else missing.push('exactly one final assessment (found ' + finalCount + ')');
    if (emptyModules) missing.push(emptyModules + ' module(s) with no lessons');
    if (quizNoQuestions) missing.push(quizNoQuestions + ' quiz item(s) without a question count');
    if (d.meta && d.meta.objectives && d.meta.objectives.length >= 3) present.push('learning objectives'); else missing.push('>=3 learning objectives');
    var qb = global.NEW_QUIZBANK && global.NEW_QUIZBANK[id];
    var amqb = global.ACADEMIC_MUSIC_QUIZZES && global.ACADEMIC_MUSIC_QUIZZES[id];
    if (qb || amqb) present.push('dedicated quiz bank'); else missing.push('a dedicated quiz bank (falls back to generated questions)');
    var score = Math.round(present.length / (present.length + missing.length) * 100);
    return { courseId: id, name: d.name, category: (d.meta && d.meta.cat) || d.cat, present: present, missing: missing, completeness: score, lessonCount: lessonCount, quizCount: quizCount };
  }

  API.gapReport = function () {
    return Object.keys(CD()).map(courseGaps).filter(Boolean).sort(function (a, b) { return a.completeness - b.completeness; });
  };

  /* Full audit: reuse course-integrity validateAllCourses + gap report + repo. */
  API.audit = function () {
    var validation = (typeof global.validateAllCourses === 'function') ? global.validateAllCourses() : [];
    var gaps = API.gapReport();
    var pass = validation.filter(function (r) { return r.finalStatus === 'PASS'; }).length;
    return {
      generatedAt: C.nowISO(),
      totalCourses: Object.keys(CD()).length,
      bundledCourses: API.baseIds().length,
      overlayApplied: API.manifest().applied,
      validation: validation,
      validationPass: pass,
      validationTotal: validation.length,
      gaps: gaps,
      incompleteCount: gaps.filter(function (g) { return g.missing.length > 0; }).length,
      manifest: API.manifest()
    };
  };

  /* Regression self-test: pure-logic + non-destructive guarantees. */
  API.selfTest = function () {
    var results = [];
    function t(name, cond, detail) { results.push({ name: name, pass: !!cond, detail: detail || '' }); }
    // version bump
    t('semver patch bump', C.bumpVersion('1.2.3', 'patch') === '1.2.4');
    t('semver minor bump resets patch', C.bumpVersion('1.2.3', 'minor') === '1.3.0');
    t('semver major bump resets minor+patch', C.bumpVersion('1.2.3', 'major') === '2.0.0');
    // slug + hash determinism
    t('slug normalizes', C.slug('Hello World! 2024') === 'hello-world-2024');
    t('hash deterministic', C.shortHash('abc') === C.shortHash('abc') && C.shortHash('abc') !== C.shortHash('abd'));
    // non-destructive add + rollback round-trip
    var before = Object.keys(CD()).length;
    var baseKeys = API.baseIds().slice();
    var testId = 'chcn-selftest-' + Date.now().toString(36);
    var r = API.addCourse({
      id: testId, name: 'Self Test Course', cat: 'Diagnostics', desc: 'This is a self-test course used only to verify that incremental additions and rollback behave correctly and never destroy bundled content or learner data.',
      modules: [{ title: 'Module 1', lessons: [{ title: 'Intro lesson', type: 'lesson' }, { title: 'Module quiz', type: 'quiz', questions: 5 }, { title: 'Final assessment', type: 'quiz', questions: 10, isFinal: true }] }]
    }, { skipValidation: true });
    t('addCourse commits', r.ok, r.ok ? '' : JSON.stringify(r.conflicts || r.gate || {}));
    t('addCourse increments catalogue', Object.keys(CD()).length === before + 1);
    t('bundled courses still present after add', baseKeys.every(function (k) { return !!CD()[k]; }));
    // duplicate detection
    var dup = API.addCourse({ id: testId, name: 'Self Test Course', cat: 'Diagnostics', desc: 'dup' });
    t('duplicate id is blocked', dup.ok === false && dup.stage === 'duplicate');
    // rollback restores exactly
    if (r.ok) {
      var rb = API.rollback(r.op.id);
      t('rollback succeeds', rb.ok);
      t('rollback removes test course', !CD()[testId]);
      t('rollback preserves catalogue size', Object.keys(CD()).length === before);
      t('rollback preserves bundled courses', baseKeys.every(function (k) { return !!CD()[k]; }));
      // purge the self-test op from history so it leaves no trace
      var repo = C.getRepo();
      repo.ops = repo.ops.filter(function (o) { return o.courseId !== testId; });
      C.putRepo(repo); C.rebuild();
    }
    var passed = results.filter(function (x) { return x.pass; }).length;
    return { passed: passed, total: results.length, allPass: passed === results.length, results: results };
  };
})(typeof window !== 'undefined' ? window : this);

/* ===========================================================================
 * PART 5 — boot (apply overlay before UI renders) + admin Content Update Center
 * ======================================================================== */
(function (global) {
  'use strict';
  var C = global.__CHCN_CM_CORE__;
  if (!C) { return; }
  var API = global.CHCN_CM, esc = C.esc;

  /* ---- BOOT: capture immutable base, then replay overlay synchronously ---- */
  try { API._captureBase(); API.rebuild(); } catch (e) { if (global.console) console.warn('CHCN-CM boot:', e); }

  function isAdmin() {
    var u = (typeof global.getUser === 'function') ? global.getUser() : null;
    return global.COURSE_ADMIN_MODE === true || (u && u.role === 'admin') || localStorage.getItem('chcn_cm_admin') === '1';
  }
  global.CHCN_enableContentCenter = function () {
    localStorage.setItem('chcn_cm_admin', '1');
    ensurePage(); openCenter();
    return 'Content Update Center enabled on this device.';
  };
  global.CHCN_disableContentCenter = function () { localStorage.removeItem('chcn_cm_admin'); var e = document.getElementById('chcn-cc-entry'); if (e) e.remove(); return 'disabled'; };

  /* ---- page scaffold ---- */
  function ensurePage() {
    if (document.getElementById('page-chcn-content-center')) return;
    var s = document.createElement('section');
    s.id = 'page-chcn-content-center';
    s.style.cssText = 'display:none;min-height:100vh;background:#f4f6f9;';
    s.innerHTML =
      '<div class="page-header" style="background:#0f2a4a;color:#fff;padding:28px 20px;">' +
        '<div style="max-width:1200px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">' +
          '<div><h1 style="margin:0;font-size:24px;">Content Update Center</h1>' +
          '<p style="margin:6px 0 0;opacity:.85;font-size:14px;">Add courses, modules, lessons and quizzes one at a time — existing content is never overwritten.</p></div>' +
          '<button class="btn" id="chcn-cc-close" style="background:#fff;color:#0f2a4a;border:none;padding:10px 16px;border-radius:8px;cursor:pointer;">← Back to site</button>' +
        '</div></div>' +
      '<div style="max-width:1200px;margin:0 auto;padding:20px;">' +
        '<div id="chcn-cc-tabs" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;"></div>' +
        '<div id="chcn-cc-body"></div>' +
      '</div>';
    document.body.appendChild(s);
    document.getElementById('chcn-cc-close').onclick = closeCenter;
    buildTabs();
  }

  var TABS = [
    { id: 'dashboard', label: 'Audit Dashboard' },
    { id: 'gaps', label: "What's Missing" },
    { id: 'add', label: '+ Add Content' },
    { id: 'history', label: 'Update History' },
    { id: 'tools', label: 'Self-Test & Backup' }
  ];
  var activeTab = 'dashboard';
  function buildTabs() {
    var host = document.getElementById('chcn-cc-tabs'); if (!host) return;
    host.innerHTML = TABS.map(function (t) {
      var on = t.id === activeTab;
      return '<button data-tab="' + t.id + '" style="padding:9px 15px;border-radius:8px;border:1px solid ' + (on ? '#0f2a4a' : '#cbd5e1') + ';background:' + (on ? '#0f2a4a' : '#fff') + ';color:' + (on ? '#fff' : '#334155') + ';cursor:pointer;font-size:14px;">' + esc(t.label) + '</button>';
    }).join('');
    Array.prototype.forEach.call(host.querySelectorAll('button'), function (b) {
      b.onclick = function () { activeTab = b.getAttribute('data-tab'); buildTabs(); renderBody(); };
    });
  }

  function openCenter() { ensurePage(); document.querySelectorAll('section[id^="page-"]').forEach(function (p) { p.style.display = 'none'; }); document.getElementById('page-chcn-content-center').style.display = 'block'; window.scrollTo(0, 0); renderBody(); }
  function closeCenter() { document.getElementById('page-chcn-content-center').style.display = 'none'; if (typeof global.navigate === 'function') global.navigate('courses'); }
  global.CHCN_CM_UI = { open: openCenter, close: closeCenter, render: function () { renderBody(); } };

  function card(inner, pad) { return '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:' + (pad || 18) + 'px;margin-bottom:16px;">' + inner + '</div>'; }

  function renderBody() {
    var host = document.getElementById('chcn-cc-body'); if (!host) return;
    var V = global.__CHCN_CM_VIEWS__ || {};
    if (activeTab === 'dashboard') host.innerHTML = V.dashboard ? V.dashboard() : '';
    else if (activeTab === 'gaps') host.innerHTML = V.gaps ? V.gaps() : '';
    else if (activeTab === 'add') { host.innerHTML = V.add ? V.add() : ''; if (V.wireAdd) V.wireAdd(); }
    else if (activeTab === 'history') { host.innerHTML = V.history ? V.history() : ''; if (V.wireHistory) V.wireHistory(); }
    else if (activeTab === 'tools') { host.innerHTML = V.tools ? V.tools() : ''; if (V.wireTools) V.wireTools(); }
  }

  global.__CHCN_CM_UI_INTERNAL__ = { ensurePage: ensurePage, openCenter: openCenter, renderBody: renderBody, isAdmin: isAdmin, card: card };
})(typeof window !== 'undefined' ? window : this);

/* ===========================================================================
 * PART 6 — view renderers (dashboard / gaps / tools)
 * ======================================================================== */
(function (global) {
  'use strict';
  var C = global.__CHCN_CM_CORE__; if (!C) return;
  var API = global.CHCN_CM, esc = C.esc;
  var UI = global.__CHCN_CM_UI_INTERNAL__, card = UI.card;
  var V = global.__CHCN_CM_VIEWS__ = global.__CHCN_CM_VIEWS__ || {};

  function stat(label, val, color) {
    return '<div style="flex:1;min-width:150px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:16px;text-align:center;">' +
      '<div style="font-size:28px;font-weight:700;color:' + (color || '#0f2a4a') + ';">' + esc(val) + '</div>' +
      '<div style="font-size:12px;color:#64748b;margin-top:4px;">' + esc(label) + '</div></div>';
  }

  V.dashboard = function () {
    var a = API.audit();
    var out = '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">' +
      stat('Courses in catalogue', a.totalCourses) +
      stat('Bundled (base)', a.bundledCourses) +
      stat('Added via overlay', a.overlayApplied, '#0a7d34') +
      stat('Pass integrity audit', a.validationPass + ' / ' + a.validationTotal, a.validationPass === a.validationTotal ? '#0a7d34' : '#b45309') +
      stat('Repo version', a.manifest.version) +
    '</div>';
    out += card('<p style="margin:0;color:#475569;font-size:13px;">This dashboard runs the live <strong>course-integrity</strong> validator across every course (bundled + added). A course is <strong>PASS</strong> only when title, description, objectives, lessons, quizzes, exactly one final assessment and certificate metadata all check out.</p>');
    var rows = a.validation.slice().sort(function (x, y) { return (x.finalStatus === 'PASS') - (y.finalStatus === 'PASS'); });
    var body = rows.map(function (r) {
      var ok = r.finalStatus === 'PASS';
      var checks = Object.keys(r.checks || {}).map(function (k) {
        var v = r.checks[k], good = (v === 'PASS' || v === 'NO');
        return '<span style="display:inline-block;margin:2px;padding:2px 7px;border-radius:6px;font-size:11px;background:' + (good ? '#dcfce7' : '#fee2e2') + ';color:' + (good ? '#166534' : '#991b1b') + ';">' + esc(k) + '</span>';
      }).join('');
      return '<details style="border:1px solid ' + (ok ? '#bbf7d0' : '#fecaca') + ';border-radius:8px;margin:6px 0;padding:8px 12px;background:' + (ok ? '#f0fdf4' : '#fef2f2') + ';">' +
        '<summary style="cursor:pointer;"><strong>' + esc(r.course) + '</strong> <span style="color:#64748b;font-size:12px;">(' + esc(r.category || '') + ')</span> — <strong style="color:' + (ok ? '#166534' : '#991b1b') + ';">' + esc(r.finalStatus) + '</strong></summary>' +
        '<div style="margin-top:8px;">' + checks + '</div>' +
        (r.issues && r.issues.length ? '<ul style="color:#991b1b;font-size:13px;margin:8px 0 0;">' + r.issues.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>' : '') +
      '</details>';
    }).join('');
    out += card('<h3 style="margin:0 0 10px;">Course Audit — ' + a.validationPass + '/' + a.validationTotal + ' pass</h3>' + body);
    return out;
  };

  V.gaps = function () {
    var gaps = API.gapReport();
    var out = card('<p style="margin:0;color:#475569;font-size:13px;">"What\u2019s Missing" scores each course by how much required structure is present. Lowest completeness first, so you can see exactly what to add next.</p>');
    out += gaps.map(function (g) {
      var col = g.completeness >= 90 ? '#0a7d34' : (g.completeness >= 70 ? '#b45309' : '#b91c1c');
      return card(
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">' +
          '<div><strong>' + esc(g.name) + '</strong> <span style="color:#64748b;font-size:12px;">(' + esc(g.category || '') + ')</span></div>' +
          '<div style="font-weight:700;color:' + col + ';">' + g.completeness + '% complete</div>' +
        '</div>' +
        '<div style="height:8px;background:#e2e8f0;border-radius:5px;margin:8px 0;overflow:hidden;"><div style="height:100%;width:' + g.completeness + '%;background:' + col + ';"></div></div>' +
        (g.missing.length
          ? '<div style="font-size:13px;color:#991b1b;"><strong>Missing:</strong><ul style="margin:6px 0 0;">' + g.missing.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul></div>'
          : '<div style="font-size:13px;color:#166534;">✓ All required structure present.</div>'),
      12);
    }).join('');
    return out;
  };

  V.tools = function () {
    return card('<h3 style="margin:0 0 10px;">Regression self-test</h3>' +
        '<p style="margin:0 0 12px;color:#475569;font-size:13px;">Verifies versioning, duplicate detection, and that adding + rolling back content never destroys bundled courses. Runs against live data and cleans up after itself.</p>' +
        '<button id="chcn-run-selftest" class="btn btn-primary" style="padding:9px 16px;border-radius:8px;background:#0f2a4a;color:#fff;border:none;cursor:pointer;">Run self-test</button>' +
        '<div id="chcn-selftest-out" style="margin-top:12px;"></div>') +
      card('<h3 style="margin:0 0 10px;">Backup &amp; migration (export / import)</h3>' +
        '<p style="margin:0 0 12px;color:#475569;font-size:13px;">The overlay of added content lives in this device\u2019s local storage. Export it to a file to back it up or move it to another device. <strong>Note:</strong> automatic cross-device server sync is not available in this offline build — export/import is the supported migration path.</p>' +
        '<button id="chcn-export" class="btn" style="padding:9px 16px;border-radius:8px;background:#e2e8f0;border:none;cursor:pointer;margin-right:8px;">Export overlay JSON</button>' +
        '<button id="chcn-import" class="btn" style="padding:9px 16px;border-radius:8px;background:#e2e8f0;border:none;cursor:pointer;">Import overlay JSON</button>' +
        '<textarea id="chcn-io" style="width:100%;height:140px;margin-top:12px;font-family:monospace;font-size:12px;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" placeholder="Exported JSON appears here; paste JSON here then click Import."></textarea>');
  };

  V.wireTools = function () {
    var run = document.getElementById('chcn-run-selftest');
    if (run) run.onclick = function () {
      var r = API.selfTest();
      document.getElementById('chcn-selftest-out').innerHTML =
        '<div style="font-weight:700;color:' + (r.allPass ? '#166534' : '#991b1b') + ';margin-bottom:8px;">' + r.passed + '/' + r.total + ' checks passed' + (r.allPass ? ' — all green' : ' — see failures') + '</div>' +
        r.results.map(function (x) { return '<div style="font-size:13px;padding:3px 0;color:' + (x.pass ? '#166534' : '#991b1b') + ';">' + (x.pass ? '✓' : '✗') + ' ' + esc(x.name) + (x.detail ? ' — ' + esc(x.detail) : '') + '</div>'; }).join('');
    };
    var exp = document.getElementById('chcn-export');
    if (exp) exp.onclick = function () { document.getElementById('chcn-io').value = API.exportRepo(); };
    var imp = document.getElementById('chcn-import');
    if (imp) imp.onclick = function () {
      var v = document.getElementById('chcn-io').value;
      var res = API.importRepo(v, true);
      if (typeof global.showToast === 'function') global.showToast(res.ok ? 'Imported. Overlay rebuilt (' + res.applied + ' ops).' : ('Import failed: ' + res.note), !res.ok);
      UI.renderBody();
    };
  };
})(typeof window !== 'undefined' ? window : this);

/* ===========================================================================
 * PART 7 — Add-content form + Update History + entry injection + boot
 * ======================================================================== */
(function (global) {
  'use strict';
  var C = global.__CHCN_CM_CORE__; if (!C) return;
  var API = global.CHCN_CM, esc = C.esc;
  var UI = global.__CHCN_CM_UI_INTERNAL__, card = UI.card;
  var V = global.__CHCN_CM_VIEWS__;

  function courseOptions() {
    var cd = C.CD();
    return Object.keys(cd).map(function (id) { return '<option value="' + esc(id) + '">' + esc(cd[id].name || id) + '</option>'; }).join('');
  }
  function moduleOptions(courseId) {
    var c = C.CD()[courseId]; if (!c || !c.modules) return '';
    return c.modules.map(function (m, i) { return '<option value="' + i + '">' + (i + 1) + '. ' + esc(m.title || 'Module ' + (i + 1)) + '</option>'; }).join('');
  }
  function fld(label, inner) { return '<label style="display:block;margin:10px 0;"><span style="display:block;font-size:13px;color:#334155;margin-bottom:4px;">' + label + '</span>' + inner + '</label>'; }
  var IN = 'width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;box-sizing:border-box;';

  V.add = function () {
    return card(
      '<h3 style="margin:0 0 10px;">Add a content piece</h3>' +
      '<p style="margin:0 0 12px;color:#475569;font-size:13px;">Every addition passes duplicate detection and the course-integrity gate before it is saved. Additions are versioned and can be rolled back. Existing content is never modified.</p>' +
      fld('What are you adding?', '<select id="chcn-kind" style="' + IN + '"><option value="course">A whole new course</option><option value="module">A module (into an existing course)</option><option value="lesson">A lesson (into a module)</option><option value="quiz">A quiz (into a module)</option><option value="doc">A document / resource</option></select>') +
      '<div id="chcn-add-fields"></div>' +
      '<label style="display:flex;gap:8px;align-items:center;margin:10px 0;font-size:13px;color:#475569;"><input type="checkbox" id="chcn-force"> Proceed even if duplicate warnings appear</label>' +
      '<button id="chcn-add-submit" class="btn btn-primary" style="padding:10px 18px;border-radius:8px;background:#0a7d34;color:#fff;border:none;cursor:pointer;">Validate &amp; add</button>' +
      '<div id="chcn-add-out" style="margin-top:14px;"></div>'
    );
  };

  function fieldsFor(kind) {
    if (kind === 'course') {
      return fld('Course name', '<input id="f-name" style="' + IN + '" placeholder="e.g. Introduction to Beekeeping">') +
        fld('Category', '<input id="f-cat" style="' + IN + '" placeholder="e.g. Agriculture">') +
        fld('Icon (emoji, optional)', '<input id="f-icon" style="' + IN + '" placeholder="🐝">') +
        fld('Description (min 80 characters to pass the gate)', '<textarea id="f-desc" style="' + IN + 'height:80px;" placeholder="What learners will study and be able to do..."></textarea>') +
        '<p style="font-size:12px;color:#64748b;margin:4px 0;">A starter module with an intro lesson, a module quiz and a final assessment is created automatically so the course passes validation. You can add more afterwards.</p>';
    }
    var target = fld('Target course', '<select id="f-course" style="' + IN + '">' + courseOptions() + '</select>');
    if (kind === 'module') {
      return target + fld('Module title', '<input id="f-title" style="' + IN + '" placeholder="e.g. Module 5: Advanced Techniques">') +
        fld('First lesson title (optional)', '<input id="f-l1" style="' + IN + '" placeholder="Lesson 1 title">');
    }
    var modSel = fld('Target module', '<select id="f-module" style="' + IN + '">' + '</select>');
    if (kind === 'lesson') {
      return target + modSel + fld('Lesson title', '<input id="f-title" style="' + IN + '" placeholder="Lesson title">') +
        fld('Duration (optional)', '<input id="f-dur" style="' + IN + '" placeholder="e.g. 12 min">') +
        fld('Lesson content (optional)', '<textarea id="f-content" style="' + IN + 'height:80px;"></textarea>');
    }
    if (kind === 'quiz') {
      return target + modSel + fld('Quiz title', '<input id="f-title" style="' + IN + '" placeholder="e.g. Module 5 Quiz">') +
        fld('Number of questions', '<input id="f-q" type="number" min="1" value="10" style="' + IN + '">') +
        '<label style="display:flex;gap:8px;align-items:center;font-size:13px;color:#475569;"><input type="checkbox" id="f-final"> This is the course final assessment</label>';
    }
    if (kind === 'doc') {
      return target + fld('Document title', '<input id="f-title" style="' + IN + '" placeholder="e.g. Study guide (PDF)">') +
        fld('Link URL (optional)', '<input id="f-url" style="' + IN + '" placeholder="https://...">') +
        fld('Or paste text body (optional)', '<textarea id="f-body" style="' + IN + 'height:80px;"></textarea>');
    }
    return '';
  }

  V.wireAdd = function () {
    var kindSel = document.getElementById('chcn-kind');
    var fields = document.getElementById('chcn-add-fields');
    function refresh() {
      fields.innerHTML = fieldsFor(kindSel.value);
      var cs = document.getElementById('f-course');
      var ms = document.getElementById('f-module');
      if (cs && ms) { ms.innerHTML = moduleOptions(cs.value); cs.onchange = function () { ms.innerHTML = moduleOptions(cs.value); }; }
    }
    kindSel.onchange = refresh; refresh();
    document.getElementById('chcn-add-submit').onclick = function () {
      var kind = kindSel.value, force = document.getElementById('chcn-force').checked, res;
      var opt = { force: force };
      var val = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; };
      if (kind === 'course') {
        var nm = val('f-name');
        res = API.addCourse({ name: nm, cat: val('f-cat'), icon: val('f-icon') || undefined, desc: val('f-desc'),
          modules: [{ title: 'Module 1: Getting Started', lessons: [
            { title: 'Introduction to ' + (nm || 'the course'), type: 'lesson', content: val('f-desc') },
            { title: 'Module 1 Quiz', type: 'quiz', questions: 5 },
            { title: 'Final Assessment', type: 'quiz', questions: 10, isFinal: true }
          ] }] }, opt);
      } else if (kind === 'module') {
        var lessons = []; if (val('f-l1')) lessons.push({ title: val('f-l1'), type: 'lesson' });
        res = API.addModule(val('f-course'), { title: val('f-title'), lessons: lessons }, opt);
      } else if (kind === 'lesson') {
        res = API.addLesson(val('f-course'), val('f-module'), { title: val('f-title'), duration: val('f-dur'), content: val('f-content') }, opt);
      } else if (kind === 'quiz') {
        res = API.addQuiz(val('f-course'), val('f-module'), { title: val('f-title'), questions: +val('f-q') || 10, isFinal: document.getElementById('f-final').checked }, opt);
      } else if (kind === 'doc') {
        res = API.addDoc(val('f-course'), { title: val('f-title'), url: val('f-url'), body: val('f-body') }, opt);
      }
      renderAddResult(res);
    };
  };

  function renderAddResult(res) {
    var out = document.getElementById('chcn-add-out'); if (!out) return;
    if (res && res.ok) {
      out.innerHTML = '<div style="padding:12px;border:1px solid #bbf7d0;background:#f0fdf4;border-radius:8px;color:#166534;">✓ Added as <strong>' + esc(res.op.id) + '</strong> (v' + esc(res.op.version) + '). Gate: ' + esc(res.op.gateStatus) + '. It is live in the catalogue now and appears in the Audit Dashboard.' +
        (res.conflicts && res.conflicts.messages.length ? '<div style="color:#b45309;margin-top:6px;">Note: ' + res.conflicts.messages.map(esc).join(' ') + '</div>' : '') + '</div>';
      global.__CHCN_CM_UI_INTERNAL__.renderBody();
    } else if (res && res.stage === 'duplicate') {
      out.innerHTML = '<div style="padding:12px;border:1px solid #fed7aa;background:#fffbeb;border-radius:8px;color:#b45309;">⚠ Duplicate/conflict detected:<ul style="margin:6px 0 0;">' + res.conflicts.messages.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>' + (res.needsForce ? '<div style="margin-top:6px;">Tick “Proceed even if duplicate warnings appear” to add anyway.</div>' : '') + '</div>';
    } else if (res && res.stage === 'validation') {
      var g = res.gate, rep = g && g.report;
      out.innerHTML = '<div style="padding:12px;border:1px solid #fecaca;background:#fef2f2;border-radius:8px;color:#991b1b;">✗ Blocked by the content-integrity gate (' + esc(g ? g.note : '') + ').' + (rep && rep.issues && rep.issues.length ? '<ul style="margin:6px 0 0;">' + rep.issues.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>' : '') + '<div style="margin-top:6px;font-size:12px;">Fix the fields above (e.g. longer description, valid module) and try again.</div></div>';
    } else {
      out.innerHTML = '<div style="padding:12px;border:1px solid #fecaca;background:#fef2f2;border-radius:8px;color:#991b1b;">Could not add this piece. ' + esc(res ? JSON.stringify(res) : '') + '</div>';
    }
  }

  V.history = function () {
    var ops = API.history().slice().reverse();
    if (!ops.length) return card('<p style="margin:0;color:#64748b;">No incremental updates yet. Use “+ Add Content” to add your first piece; every change will be logged here with a version and a rollback button.</p>');
    return card('<h3 style="margin:0 0 6px;">Update history (' + ops.length + ')</h3><p style="margin:0 0 12px;color:#475569;font-size:13px;">Each entry is a versioned, reversible change. Rolling back rebuilds the catalogue from the bundled base plus the remaining applied updates — nothing is destroyed.</p>' +
      ops.map(function (o) {
        var rolled = o.status === 'rolledback';
        return '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;margin:6px 0;' + (rolled ? 'opacity:.6;' : '') + '">' +
          '<div><div style="font-weight:600;">' + esc(o.summary || o.kind) + '</div>' +
            '<div style="font-size:12px;color:#64748b;">' + esc(o.id) + ' · v' + esc(o.version) + ' · ' + esc((o.ts || '').replace('T', ' ').slice(0, 19)) + ' · gate: ' + esc(o.gateStatus || 'n/a') + (rolled ? ' · ROLLED BACK' : '') + '</div></div>' +
          '<button data-op="' + esc(o.id) + '" data-act="' + (rolled ? 'restore' : 'rollback') + '" style="padding:7px 12px;border-radius:8px;border:1px solid ' + (rolled ? '#0a7d34' : '#b91c1c') + ';background:#fff;color:' + (rolled ? '#0a7d34' : '#b91c1c') + ';cursor:pointer;">' + (rolled ? 'Restore' : 'Roll back') + '</button>' +
        '</div>';
      }).join(''));
  };
  V.wireHistory = function () {
    Array.prototype.forEach.call(document.querySelectorAll('#chcn-cc-body button[data-op]'), function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-op'), act = b.getAttribute('data-act');
        var res = (act === 'rollback') ? API.rollback(id) : API.restore(id);
        if (typeof global.showToast === 'function') global.showToast(res.ok ? (act === 'rollback' ? 'Update rolled back.' : 'Update restored.') : ('Failed: ' + res.note), !res.ok);
        global.__CHCN_CM_UI_INTERNAL__.renderBody();
      };
    });
  };

  /* ---- entry link injection (only when admin) ---- */
  function injectEntry() {
    if (!UI.isAdmin()) return;
    UI.ensurePage();
    if (document.getElementById('chcn-cc-entry')) return;
    var host = document.getElementById('page-account') || document.body;
    var box = document.createElement('div');
    box.id = 'chcn-cc-entry';
    box.style.cssText = 'max-width:1200px;margin:20px auto;padding:16px 20px;background:#0f2a4a;color:#fff;border-radius:12px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;';
    box.innerHTML = '<div><strong>Content Update Center</strong><div style="font-size:13px;opacity:.85;">Add courses/modules/lessons incrementally, audit content, and roll back changes.</div></div>' +
      '<button id="chcn-cc-open" style="background:#fff;color:#0f2a4a;border:none;padding:10px 18px;border-radius:8px;cursor:pointer;font-weight:600;">Open</button>';
    host.appendChild(box);
    document.getElementById('chcn-cc-open').onclick = function () { global.CHCN_CM_UI.open(); };
  }

  function boot() {
    injectEntry();
    if (typeof global.navigate === 'function' && !global.__chcn_nav_wrapped__) {
      var orig = global.navigate;
      global.navigate = function (p) { var r = orig.apply(this, arguments); if (p === 'account') setTimeout(injectEntry, 0); return r; };
      global.__chcn_nav_wrapped__ = true;
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(typeof window !== 'undefined' ? window : this);
