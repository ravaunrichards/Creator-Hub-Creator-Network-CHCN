/* Unit tests for the canonical grading/gating rules. Pure Node, no network.
   Run: node tests/unit/grading.test.js */
'use strict';
const path = require('path');
const G = require(path.join(__dirname, '..', '..', 'scripts', 'grading.js'));

let pass = 0, fail = 0; const fails = [];
function eq(a, b, msg) { if (JSON.stringify(a) === JSON.stringify(b)) pass++; else { fail++; fails.push(msg + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')'); } }
function ok(c, m) { if (c) pass++; else { fail++; fails.push(m); } }

const qs = [{ ans: 0 }, { ans: 1 }, { ans: 2 }, { ans: 3 }, { ans: 0 }];

// All correct -> 100%, passed
eq(G.gradeQuiz(qs, [0, 1, 2, 3, 0]).percentage, 100, '5/5 = 100%');
ok(G.gradeQuiz(qs, [0, 1, 2, 3, 0]).passed, '100% passes');

// 4/5 = 80% -> exactly at the pass boundary, passes
const r80 = G.gradeQuiz(qs, [0, 1, 2, 3, 9]);
eq(r80.percentage, 80, '4/5 = 80%');
ok(r80.passed, '80% passes (boundary)');

// 3/5 = 60% -> fails
const r60 = G.gradeQuiz(qs, [0, 1, 2, 9, 9]);
eq(r60.percentage, 60, '3/5 = 60%');
ok(!r60.passed, '60% fails');

// Empty quiz -> 0%, fails
ok(!G.gradeQuiz([], []).passed, 'empty quiz fails');

// Gating: a failed prior quiz keeps the next item locked
const items = [
  { key: 'a', type: 'lesson' },
  { key: 'b', type: 'quiz' },
  { key: 'c', type: 'lesson' }
];
ok(G.canOpen(items, { a: 'done' }, 0), 'first item always openable');
ok(G.canOpen(items, { a: 'done' }, 1), 'quiz openable after lesson done');
ok(!G.canOpen(items, { a: 'done', b: 'attempted' }, 2), 'item after FAILED quiz is locked');
ok(!G.canOpen(items, { a: 'done', b: 'done' }, 2), 'quiz marked done but not passed still locks next');
ok(G.canOpen(items, { a: 'done', b: 'passed' }, 2), 'item unlocks after quiz PASSED');

console.log('GRADING UNIT: ' + pass + ' passed, ' + fail + ' failed');
if (fail) { fails.forEach(function (m) { console.log('  FAIL: ' + m); }); process.exit(1); }
process.exit(0);
