/* =============================================================================
 * Creator Hub Creator Network — BLOOD-TYPE GENETICS ENGINE
 * -----------------------------------------------------------------------------
 * Pure, deterministic ABO + Rh inheritance logic (spec sections 70–72).
 * No DOM, no globals with side effects — safe to unit-test under Node.
 *
 * Model:
 *   ABO alleles carried by a phenotype (genotype unknown):
 *     A  -> can pass {A, O}   (AA or AO)
 *     B  -> can pass {B, O}   (BB or BO)
 *     AB -> can pass {A, B}   (AB)
 *     O  -> can pass {O}      (OO)
 *   Rh:
 *     +  -> can pass {D, d}   (DD or Dd)
 *     -  -> can pass {d}      (dd)
 *   Child ABO phenotype from two alleles:
 *     A+A=A, A+O=A, B+B=B, B+O=B, A+B=AB, O+O=O
 *   Child Rh: any D present -> +, else -
 * ========================================================================== */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  if (typeof window !== 'undefined') {
    window.CHCN = window.CHCN || {};
    window.CHCN.Genetics = api;
  }
})(this, function () {
  'use strict';

  var ABO_ALLELES = {
    A:  ['A', 'O'],
    B:  ['B', 'O'],
    AB: ['A', 'B'],
    O:  ['O']
  };
  var RH_ALLELES = {
    '+': ['D', 'd'],
    '-': ['d']
  };

  function aboPhenotype(a1, a2) {
    var pair = [a1, a2].sort().join('');
    switch (pair) {
      case 'AA': return 'A';
      case 'AO': return 'A';
      case 'BB': return 'B';
      case 'BO': return 'B';
      case 'AB': return 'AB';
      case 'OO': return 'O';
      default:   return null;
    }
  }

  function uniqueSorted(arr, order) {
    var seen = {}, out = [];
    arr.forEach(function (x) { if (!seen[x]) { seen[x] = 1; out.push(x); } });
    if (order) { out.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); }); }
    return out;
  }

  // Split a full type like 'A+' into { abo:'A', rh:'+' } (also accepts 'AB-').
  function parseType(t) {
    var s = String(t).trim().toUpperCase();
    var rh = s.slice(-1);
    if (rh !== '+' && rh !== '-') { throw new Error('Invalid Rh in type: ' + t); }
    var abo = s.slice(0, -1);
    if (!ABO_ALLELES[abo]) { throw new Error('Invalid ABO in type: ' + t); }
    return { abo: abo, rh: rh };
  }

  // Returns the set of possible ABO phenotypes for the child.
  function crossABO(p1, p2) {
    var g1 = ABO_ALLELES[p1], g2 = ABO_ALLELES[p2];
    if (!g1 || !g2) { throw new Error('Invalid ABO group'); }
    var results = [];
    g1.forEach(function (a) {
      g2.forEach(function (b) {
        var ph = aboPhenotype(a, b);
        if (ph) { results.push(ph); }
      });
    });
    return uniqueSorted(results, ['O', 'A', 'B', 'AB']);
  }

  // Returns the set of possible Rh phenotypes for the child.
  function crossRh(r1, r2) {
    var g1 = RH_ALLELES[r1], g2 = RH_ALLELES[r2];
    if (!g1 || !g2) { throw new Error('Invalid Rh group'); }
    var results = [];
    g1.forEach(function (a) {
      g2.forEach(function (b) {
        results.push((a === 'D' || b === 'D') ? '+' : '-');
      });
    });
    return uniqueSorted(results, ['+', '-']);
  }

  // Full cross — accepts either full type strings ('A+','O-') or objects.
  function possibleChildTypes(t1, t2) {
    var p1 = (typeof t1 === 'string') ? parseType(t1) : t1;
    var p2 = (typeof t2 === 'string') ? parseType(t2) : t2;
    var abo = crossABO(p1.abo, p2.abo);
    var rh  = crossRh(p1.rh, p2.rh);
    var out = [];
    abo.forEach(function (a) { rh.forEach(function (r) { out.push(a + r); }); });
    return { abo: abo, rh: rh, types: out };
  }

  return {
    ABO_ALLELES: ABO_ALLELES,
    RH_ALLELES: RH_ALLELES,
    parseType: parseType,
    aboPhenotype: aboPhenotype,
    crossABO: crossABO,
    crossRh: crossRh,
    possibleChildTypes: possibleChildTypes
  };
});
