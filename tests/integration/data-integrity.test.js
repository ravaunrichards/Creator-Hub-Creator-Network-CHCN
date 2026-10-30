/* CHCN data-integrity tests. Pure Node, no framework, no network.
   Run: node tests/integration/data-integrity.test.js
   Validates the REAL course catalogue + quiz bank that the app ships. */
'use strict';
const path = require('path');
global.window = {};
require(path.join(__dirname, '..', '..', 'app', 'courses-data.js'));
const C = window.NEW_COURSES || {};
const Q = window.NEW_QUIZBANK || {};

let pass = 0, fail = 0;
const fails = [];
function ok(cond, msg) { if (cond) { pass++; } else { fail++; fails.push(msg); } }

// 1. Catalogue is non-empty
const ids = Object.keys(C);
ok(ids.length > 0, 'catalogue has courses');

// 2. Every course has the required registry fields
ids.forEach(function (id) {
  const c = C[id];
  ok(typeof c.name === 'string' && c.name.length > 2, id + ': has name');
  ok(typeof c.cat === 'string' && c.cat.length > 0, id + ': has category');
  ok(typeof c.level === 'number', id + ': has numeric level');
  ok(Array.isArray(c.modules) && c.modules.length > 0, id + ': has modules');
  ok(Array.isArray(c.outcomes), id + ': has outcomes array');
});

// 3. Every course has a quiz bank entry
ids.forEach(function (id) {
  ok(Array.isArray(Q[id]) && Q[id].length > 0, id + ': has quiz bank');
});

// 4. Every quiz question is well-formed and the answer index is in range
Object.keys(Q).forEach(function (id) {
  Q[id].forEach(function (q, i) {
    const ref = id + ' Q' + i;
    ok(typeof q.q === 'string' && q.q.length > 0, ref + ': has prompt');
    ok(Array.isArray(q.opts) && q.opts.length >= 2, ref + ': has >=2 options');
    ok(Number.isInteger(q.ans) && q.ans >= 0 && q.ans < (q.opts || []).length,
       ref + ': answer index in range');
  });
});

// 5. Final assessment present in every course's module list
ids.forEach(function (id) {
  const hasFinal = (C[id].modules || []).some(function (m) {
    return (m.lessons || []).some(function (l) { return l.isFinal === true; });
  });
  ok(hasFinal, id + ': has a final assessment lesson');
});

console.log('DATA INTEGRITY: ' + pass + ' passed, ' + fail + ' failed  (courses=' + ids.length + ')');
if (fail) { fails.slice(0, 30).forEach(function (m) { console.log('  FAIL: ' + m); }); process.exit(1); }
process.exit(0);
