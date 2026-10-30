/* ===== Creator Hub Creator Network — Quiz Progression Gate + Attempt Registry (v50) =====
   Fixes the CRITICAL requirement:
     "A learner MUST NOT unlock the next required quiz simply because they opened
      or attempted the previous quiz. The previous quiz must be PASSED (>=80%)."

   Behaviour added (purely additive — wraps the existing startQuiz / submitQuiz
   that course-integrity.js defines; does not modify the quiz engine itself):
     1. startQuiz() is gated: a quiz lesson will not open until every REQUIRED
        item that comes before it in the course order is complete — and a prior
        QUIZ only counts as complete when it was PASSED (>=80%), which the engine
        records in chcn_progress only on a pass. A 75% attempt leaves the next
        quiz LOCKED; retaking the SAME quiz is always allowed.
     2. Every submission writes a permanent attempt record to a per-account
        registry (chcn_quiz_attempts): userId, courseId, unit, quizId, attempt
        number, score, percentage, pass/fail, timestamp, time used, answers,
        correct answers, completion status.
     3. Exposes a certificate-eligibility registry read:
        window.CHCN_quizGate.eligibility(courseId).
   Loaded LAST so it wraps whatever final startQuiz/submitQuiz exist. */
(function () {
  'use strict';

  var PASS_MARK = 80;
  var ATTEMPTS_KEY = 'chcn_quiz_attempts';

  function courseData(id) { return (window.COURSE_DATA || {})[id]; }
  function progressObj() {
    try { return JSON.parse(localStorage.getItem('chcn_progress')) || {}; }
    catch (e) { return {}; }
  }
  function currentUserId() {
    try {
      var u = (typeof getUser === 'function') ? getUser() : null;
      return (u && (u.email || u.id)) || 'guest';
    } catch (e) { return 'guest'; }
  }

  // Ordered list of required items for a course (gate items excluded).
  function requiredItems(id) {
    var d = courseData(id); if (!d || !d.modules) return [];
    var out = [];
    d.modules.forEach(function (m, mi) {
      (m.lessons || []).forEach(function (l, li) {
        if (l.type === 'gate') return;
        out.push({ moduleIdx: mi, lessonIdx: li, title: l.title,
                   type: l.type, isFinal: !!l.isFinal, unit: m.title });
      });
    });
    return out;
  }

  function isComplete(courseName, title) {
    var p = progressObj()[courseName];
    return !!(p && p.lessons && p.lessons.indexOf(title) !== -1);
  }

  // ---- Core gate decision (pure, unit-testable) ----
  function check(courseId, moduleIdx, lessonIdx) {
    var d = courseData(courseId);
    if (!d) return { allowed: true };
    var mod = d.modules && d.modules[moduleIdx];
    var lesson = mod && mod.lessons && mod.lessons[lessonIdx];
    if (!lesson || lesson.type !== 'quiz') return { allowed: true };

    var items = requiredItems(courseId), pos = -1;
    for (var i = 0; i < items.length; i++) {
      if (items[i].moduleIdx === moduleIdx && items[i].lessonIdx === lessonIdx) { pos = i; break; }
    }
    if (pos <= 0) return { allowed: true }; // first item in the course

    for (var j = 0; j < pos; j++) {
      var it = items[j];
      if (!isComplete(d.name, it.title)) {
        return {
          allowed: false,
          blockingItem: it,
          reason: (it.type === 'quiz')
            ? 'Locked — you must PASS "' + it.title + '" (at least ' + PASS_MARK +
              '%) before this assessment unlocks.'
            : 'Locked — complete "' + it.title + '" before this assessment unlocks.'
        };
      }
    }
    return { allowed: true };
  }

  // ---- Certificate eligibility registry ----
  function eligibility(courseId) {
    var d = courseData(courseId);
    if (!d) return { eligible: false, missing: ['Unknown course'] };
    var items = requiredItems(courseId), missing = [];
    var reqLessons = 0, doneLessons = 0, reqQuizzes = 0, passedQuizzes = 0;
    items.forEach(function (it) {
      var done = isComplete(d.name, it.title);
      if (it.type === 'quiz') { reqQuizzes++; if (done) passedQuizzes++; else missing.push(it.title + ' (not passed)'); }
      else { reqLessons++; if (done) doneLessons++; else missing.push(it.title + ' (not completed)'); }
    });
    return {
      courseId: courseId, courseName: d.name,
      requiredLessons: reqLessons, completedLessons: doneLessons,
      requiredQuizzes: reqQuizzes, passedQuizzes: passedQuizzes,
      passMark: PASS_MARK, missing: missing, eligible: missing.length === 0
    };
  }

  // ---- Permanent attempt registry ----
  function getAttempts() {
    try { return JSON.parse(localStorage.getItem(ATTEMPTS_KEY)) || []; }
    catch (e) { return []; }
  }
  function setAttempts(arr) {
    try { localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(arr)); } catch (e) {}
    // Persist into the per-account store immediately if available.
    try { if (typeof window.chcnSyncAccountData === 'function') window.chcnSyncAccountData(); } catch (e) {}
  }

  function parseDur(d) {
    if (typeof window.parseDuration === 'function') { try { return window.parseDuration(d) || 0; } catch (e) {} }
    var m = /([0-9]+)\s*min/i.exec(d || ''); return m ? parseInt(m[1], 10) * 60 : 0;
  }

  function recordAttempt(snap) {
    if (!snap || !snap.courseId) return;
    var d = courseData(snap.courseId); if (!d) return;
    var lesson = d.modules[snap.moduleIdx] && d.modules[snap.moduleIdx].lessons[snap.lessonIdx];
    var unit = d.modules[snap.moduleIdx] && d.modules[snap.moduleIdx].title;
    var qs = snap.questions || [], ans = snap.answers || [], correct = 0, correctAnswers = [];
    qs.forEach(function (q, i) {
      correctAnswers.push(q.ans);
      if (ans[i] === q.ans) correct++;
    });
    var total = qs.length;
    var pct = total ? Math.round(correct / total * 100) : 0;
    var passed = pct >= PASS_MARK;
    var all = getAttempts();
    var uid = currentUserId();
    var prior = all.filter(function (a) {
      return a.userId === uid && a.courseId === snap.courseId && a.quizId === (lesson && lesson.title);
    }).length;
    all.push({
      userId: uid,
      courseId: snap.courseId,
      courseName: d.name,
      moduleIdx: snap.moduleIdx,
      unit: unit,
      quizId: lesson && lesson.title,
      quizTitle: lesson && lesson.title,
      isFinal: !!snap.isFinal,
      attempt: prior + 1,
      score: correct,
      total: total,
      percentage: pct,
      result: passed ? 'PASS' : 'FAIL',
      passed: passed,
      timeUsed: Math.max(0, parseDur(lesson && lesson.duration) - (snap.timeLeft || 0)),
      answers: ans.slice(),
      correctAnswers: correctAnswers,
      completed: passed,
      timestamp: new Date().toISOString()
    });
    setAttempts(all);
  }

  function attemptsFor(courseId, quizTitle) {
    var uid = currentUserId();
    return getAttempts().filter(function (a) {
      return a.userId === uid && (!courseId || a.courseId === courseId) &&
             (!quizTitle || a.quizId === quizTitle);
    });
  }

  // ---- Wrap the live quiz functions ----
  function wrap() {
    if (typeof window.startQuiz === 'function' && !window.startQuiz.__chcnGate) {
      var origStart = window.startQuiz;
      window.startQuiz = function (courseId, mi, li) {
        var g = check(courseId, mi, li);
        if (!g.allowed) {
          if (typeof showToast === 'function') showToast('\uD83D\uDD12 ' + g.reason, true);
          else try { alert(g.reason); } catch (e) {}
          try { if (typeof navigate === 'function') navigate(courseId); } catch (e) {}
          return;
        }
        return origStart.apply(this, arguments);
      };
      window.startQuiz.__chcnGate = true;
    }

    if (typeof window.submitQuiz === 'function' && !window.submitQuiz.__chcnGate) {
      var origSubmit = window.submitQuiz;
      window.submitQuiz = function () {
        var snap = null, s = window.quizState;
        if (s) snap = {
          courseId: s.courseId, moduleIdx: s.moduleIdx, lessonIdx: s.lessonIdx,
          questions: (s.questions || []).slice(), answers: (s.answers || []).slice(),
          timeLeft: s.timeLeft, isFinal: !!s.isFinal
        };
        var r = origSubmit.apply(this, arguments);
        try { if (snap) recordAttempt(snap); } catch (e) {}
        return r;
      };
      window.submitQuiz.__chcnGate = true;
    }
  }

  // Public registry API.
  window.CHCN_quizGate = {
    check: check,
    eligibility: eligibility,
    requiredItems: requiredItems,
    getAttempts: getAttempts,
    attemptsFor: attemptsFor,
    _recordAttempt: recordAttempt,
    PASS_MARK: PASS_MARK
  };

  function install() {
    wrap();
    // startQuiz may be re-wrapped by other late modules; re-apply shortly after.
    setTimeout(wrap, 1200);
    setTimeout(wrap, 4000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
