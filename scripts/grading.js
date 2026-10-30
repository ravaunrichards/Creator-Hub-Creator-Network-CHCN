/* Canonical, side-effect-free CHCN grading/gating rules.
   Shared so the rule is testable in Node and documented in one place.
   The browser quiz engine (course-integrity.js / chcn-quiz-gate.js) enforces
   the SAME 80% pass mark; this module is the executable specification. */
'use strict';
(function (root) {
  var PASS_MARK = 80;

  // Score a set of answers. answers[i] is the chosen option index for question i.
  // questions[i].ans is the correct index. Returns {correct,total,percentage,passed}.
  function gradeQuiz(questions, answers) {
    var total = questions.length;
    var correct = 0;
    for (var i = 0; i < total; i++) {
      if (answers[i] === questions[i].ans) correct++;
    }
    var percentage = total === 0 ? 0 : Math.round((correct / total) * 100);
    return { correct: correct, total: total, percentage: percentage, passed: percentage >= PASS_MARK };
  }

  // A required quiz item counts as complete only when it was PASSED.
  // progress[itemKey] === 'passed' means the gate opens for the next item.
  function isItemComplete(item, progressState) {
    if (item.type === 'quiz') return progressState === 'passed';
    return progressState === 'done' || progressState === 'passed';
  }

  // Can the learner open item at orderedItems[targetIdx]?
  // Every earlier required item must be complete.
  function canOpen(orderedItems, progressMap, targetIdx) {
    for (var i = 0; i < targetIdx; i++) {
      var it = orderedItems[i];
      if (!isItemComplete(it, progressMap[it.key])) return false;
    }
    return true;
  }

  var api = { PASS_MARK: PASS_MARK, gradeQuiz: gradeQuiz, isItemComplete: isItemComplete, canOpen: canOpen };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CHCNgrading = api;
})(typeof window !== 'undefined' ? window : this);
