/* =============================================================================
 * Creator Hub Creator Network — Family relationship engine (spec: Family center)
 * -----------------------------------------------------------------------------
 * Pure & deterministic; no DOM. Node-testable.
 * Model: people connected by parent→child edges + partner edges.
 * deriveRelationship() computes common blood relationships automatically.
 * A person's manual `relationship` label ALWAYS wins over the auto value.
 * ========================================================================== */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  if (typeof window !== 'undefined') { window.CHCN = window.CHCN || {}; window.CHCN.FamilyEngine = api; }
})(this, function () {
  'use strict';

  function ordinal(n) {
    var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
  function times(word, n) { // 'great' x n
    var out = ''; for (var i = 0; i < n; i++) { out += word + '-'; } return out;
  }

  // ---- graph helpers --------------------------------------------------------
  // people: array of {id, parents:[id], partners:[id], gender}
  function index(people) {
    var m = {}; (people || []).forEach(function (p) { m[p.id] = p; }); return m;
  }

  // Map of ancestorId -> shortest generation distance up from `id` (id itself = 0).
  function ancestors(id, idx) {
    var dist = {}; var q = [{ id: id, d: 0 }];
    while (q.length) {
      var cur = q.shift();
      if (dist[cur.id] !== undefined && dist[cur.id] <= cur.d) { continue; }
      dist[cur.id] = cur.d;
      var p = idx[cur.id];
      if (p && p.parents) { p.parents.forEach(function (pid) { if (idx[pid]) { q.push({ id: pid, d: cur.d + 1 }); } }); }
    }
    return dist;
  }

  function genderNoun(gender, male, female, neutral) {
    if (gender === 'male' || gender === 'm') { return male; }
    if (gender === 'female' || gender === 'f') { return female; }
    return neutral;
  }

  // Derive relationship of `other` as seen from `self`.
  // Returns { label, kind, degrees } or { label:'Relative', kind:'unknown' }.
  function deriveRelationship(selfId, otherId, people) {
    var idx = index(people);
    var self = idx[selfId], other = idx[otherId];
    if (!self || !other) { return { label: 'Unknown', kind: 'unknown' }; }
    if (selfId === otherId) { return { label: 'Self', kind: 'self' }; }
    var g = other.gender;

    // partner / spouse (direct edge)
    if ((self.partners || []).indexOf(otherId) !== -1 || (other.partners || []).indexOf(selfId) !== -1) {
      return { label: genderNoun(g, 'Husband', 'Wife', 'Partner'), kind: 'partner' };
    }

    var A = ancestors(selfId, idx);   // self's ancestors w/ distance
    var B = ancestors(otherId, idx);  // other's ancestors w/ distance

    // nearest common ancestor minimising max(m,n)
    var best = null;
    Object.keys(A).forEach(function (aid) {
      if (B[aid] !== undefined) {
        var m = A[aid], n = B[aid], score = Math.max(m, n) * 100 + (m + n);
        if (!best || score < best.score) { best = { id: aid, m: m, n: n, score: score }; }
      }
    });

    if (best) {
      var m = best.m, n = best.n; // m = self->CA, n = other->CA
      if (m === 0 && n === 0) { return { label: 'Self', kind: 'self' }; }
      // other is a direct ancestor of self (m>0, n===0 means CA is other)
      if (best.id === otherId) { // other is self's ancestor
        if (m === 1) { return { label: genderNoun(g, 'Father', 'Mother', 'Parent'), kind: 'parent' }; }
        if (m === 2) { return { label: genderNoun(g, 'Grandfather', 'Grandmother', 'Grandparent'), kind: 'grandparent' }; }
        return { label: times('Great', m - 2) + genderNoun(g, 'Grandfather', 'Grandmother', 'Grandparent'), kind: 'ancestor' };
      }
      if (best.id === selfId) { // self is other's ancestor -> other is descendant
        if (n === 1) { return { label: genderNoun(g, 'Son', 'Daughter', 'Child'), kind: 'child' }; }
        if (n === 2) { return { label: genderNoun(g, 'Grandson', 'Granddaughter', 'Grandchild'), kind: 'grandchild' }; }
        return { label: times('Great', n - 2) + genderNoun(g, 'Grandson', 'Granddaughter', 'Grandchild'), kind: 'descendant' };
      }
      // siblings: both one step from common ancestor
      if (m === 1 && n === 1) {
        // full vs half: compare shared parents
        var sp = (self.parents || []).filter(function (x) { return (other.parents || []).indexOf(x) !== -1; });
        var half = sp.length === 1 && (self.parents || []).length >= 2 && (other.parents || []).length >= 2;
        var base = genderNoun(g, 'Brother', 'Sister', 'Sibling');
        return { label: (half ? 'Half-' : '') + base, kind: half ? 'half-sibling' : 'sibling' };
      }
      // aunt/uncle  (self is 2+ from CA, other is 1 from CA -> other is parent's sibling line)
      if (n === 1 && m >= 2) {
        var pre = m > 2 ? times('Great', m - 2) : '';
        return { label: pre + genderNoun(g, 'Uncle', 'Aunt', 'Aunt/Uncle'), kind: 'aunt-uncle' };
      }
      // niece/nephew (other is 2+ from CA, self is 1 from CA)
      if (m === 1 && n >= 2) {
        var pre2 = n > 2 ? times('Great', n - 2) : '';
        return { label: pre2 + genderNoun(g, 'Nephew', 'Niece', 'Nibling'), kind: 'niece-nephew' };
      }
      // cousins
      if (m >= 2 && n >= 2) {
        var degree = Math.min(m, n) - 1;
        var removed = Math.abs(m - n);
        var label = ordinal(degree) + ' cousin';
        if (removed === 1) { label += ' once removed'; }
        else if (removed === 2) { label += ' twice removed'; }
        else if (removed > 2) { label += ' ' + removed + ' times removed'; }
        return { label: label, kind: 'cousin', degrees: { degree: degree, removed: removed } };
      }
    }

    // in-law via partner's blood relations (one hop)
    var found = null;
    (self.partners || []).forEach(function (pid) {
      if (found) { return; }
      var r = deriveRelationship(pid, otherId, people);
      if (r.kind === 'parent') { found = { label: genderNoun(g, 'Father-in-law', 'Mother-in-law', 'Parent-in-law'), kind: 'in-law' }; }
      else if (r.kind === 'sibling') { found = { label: genderNoun(g, 'Brother-in-law', 'Sister-in-law', 'Sibling-in-law'), kind: 'in-law' }; }
    });
    if (found) { return found; }

    return { label: 'Relative', kind: 'unknown' };
  }

  return {
    deriveRelationship: deriveRelationship,
    ancestors: function (id, people) { return ancestors(id, index(people)); },
    _ordinal: ordinal
  };
});
