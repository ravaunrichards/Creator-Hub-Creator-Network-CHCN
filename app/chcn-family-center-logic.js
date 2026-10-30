/* =============================================================================
 * Life & Tools — FAMILY & RELATIONSHIPS CENTER (behaviour half)
 * ========================================================================== */
(function () {
  'use strict';
  var F = window.__FAM; if (!F) { return; }
  var A = F.A;
  function el(id) { return A.el(id); }

  function engine() { return window.CHCN && window.CHCN.FamilyEngine; }

  // relationship of `p` as seen from self; manual label wins.
  function relationshipLabel(list, self, p) {
    if (p.isSelf) { return { text: 'You', manual: false }; }
    if (p.relationship) { return { text: p.relationship, manual: true }; }
    if (!self) { return { text: 'Set who \u201cyou\u201d are to calculate', manual: false, hint: true }; }
    var eng = engine();
    if (!eng) { return { text: 'Relative', manual: false }; }
    var graph = list.filter(function (x) { return !x.archived; }).map(function (x) {
      return { id: x.id, gender: x.gender, parents: x.parents || [], partners: x.partners || [] };
    });
    var r = eng.deriveRelationship(self.id, p.id, graph);
    return { text: r.label, manual: false, kind: r.kind };
  }

  /* ---------------- LIST ---------------- */
  function renderList() {
    var host = el('famList'); if (!host) { return; }
    var list = F.loadPeople(); var self = F.selfPerson(list);
    var q = (el('famSearch').value || '').trim().toLowerCase();
    var people = F.active(list).filter(function (p) { return !q || F.fullName(p).toLowerCase().indexOf(q) !== -1; });
    if (!F.active(list).length) {
      host.innerHTML = '<div class="fam-empty-state"><p>No people yet.</p><p class="fam-empty-sub">Add yourself first (tick \u201cThis person is me\u201d), then add relatives and link their parents/partners \u2014 relationships are calculated automatically.</p></div>';
      return;
    }
    if (!people.length) { host.innerHTML = '<p class="fam-empty">No matches for \u201c' + A.esc(q) + '\u201d.</p>'; return; }
    host.innerHTML = people.map(function (p) {
      var rel = relationshipLabel(list, self, p);
      var badge = p.isSelf ? '<span class="fam-rel-badge self">You</span>'
        : '<span class="fam-rel-badge' + (rel.manual ? ' manual' : ' auto') + '">' + A.esc(rel.text) + (rel.manual ? ' \u00b7 manual' : (rel.hint ? '' : ' \u00b7 auto')) + '</span>';
      var dob = p.dob ? '<span class="fam-meta">b. ' + A.esc(p.dob) + '</span>' : '';
      return '<div class="fam-person-card"><div class="fam-person-main"><b>' + A.esc(F.fullName(p)) + '</b> ' + badge + dob +
        (p.notes ? '<div class="fam-notes">' + A.esc(p.notes) + '</div>' : '') + '</div>' +
        '<div class="fam-person-actions">' +
          '<button class="btn btn-sm btn-outline" data-edit="' + p.id + '" type="button">Edit</button>' +
          '<button class="btn btn-sm btn-outline" data-arch="' + p.id + '" type="button">Archive</button>' +
        '</div></div>';
    }).join('');
    host.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { startEdit(b.getAttribute('data-edit')); }; });
    host.querySelectorAll('[data-arch]').forEach(function (b) { b.onclick = function () { archive(b.getAttribute('data-arch')); }; });
  }

  /* ---------------- TREE (generational, centred on you) ---------------- */
  function renderTree() {
    var host = el('famTree'); if (!host) { return; }
    var list = F.loadPeople(); var self = F.selfPerson(list);
    if (!self) { host.innerHTML = '<div class="fam-empty-state"><p>Set who \u201cyou\u201d are first.</p><p class="fam-empty-sub">Edit a person and tick \u201cThis person is me\u201d to centre the tree.</p></div>'; return; }
    var eng = engine();
    var graph = F.active(list).map(function (x) { return { id: x.id, gender: x.gender, parents: x.parents || [], partners: x.partners || [] }; });
    var anc = eng ? eng.ancestors(self.id, graph) : {};
    // generation offset: ancestors positive up; use kind to place descendants down
    var rows = {}; // gen -> [people]
    F.active(list).forEach(function (p) {
      var gen = 0;
      if (p.isSelf) { gen = 0; }
      else {
        var r = eng ? eng.deriveRelationship(self.id, p.id, graph) : { kind: 'unknown' };
        var map = { parent: 1, grandparent: 2, ancestor: 3, 'aunt-uncle': 1, child: -1, grandchild: -2, descendant: -3, 'niece-nephew': -1, sibling: 0, 'half-sibling': 0, partner: 0, cousin: 0 };
        gen = (map[r.kind] != null) ? map[r.kind] : 0;
      }
      (rows[gen] = rows[gen] || []).push(p);
    });
    var gens = Object.keys(rows).map(Number).sort(function (a, b) { return b - a; });
    var label = { 3: 'Great-grandparents', 2: 'Grandparents', 1: 'Parents\u2019 generation', 0: 'Your generation', '-1': 'Children\u2019s generation', '-2': 'Grandchildren', '-3': 'Great-grandchildren' };
    host.innerHTML = '<div class="fam-tree">' + gens.map(function (g) {
      var name = label[g] || (g > 0 ? g + ' generation(s) up' : Math.abs(g) + ' generation(s) down');
      var chips = rows[g].map(function (p) {
        var rel = relationshipLabel(list, self, p);
        return '<span class="fam-tree-chip' + (p.isSelf ? ' self' : '') + '"><b>' + A.esc(F.fullName(p)) + '</b><small>' + A.esc(rel.text) + '</small></span>';
      }).join('');
      return '<div class="fam-tree-row"><div class="fam-tree-gen">' + A.esc(name) + '</div><div class="fam-tree-chips">' + chips + '</div></div>';
    }).join('') + '</div>';
  }

  /* ---------------- ARCHIVED ---------------- */
  function renderArchived() {
    var host = el('famArchived'); if (!host) { return; }
    var list = F.loadPeople(); var arch = list.filter(function (p) { return p.archived; });
    if (!arch.length) { host.innerHTML = '<p class="fam-empty">Nothing archived.</p>'; return; }
    host.innerHTML = arch.map(function (p) {
      return '<div class="fam-person-card"><div class="fam-person-main"><b>' + A.esc(F.fullName(p)) + '</b></div>' +
        '<div class="fam-person-actions">' +
        '<button class="btn btn-sm btn-outline" data-restore="' + p.id + '" type="button">Restore</button>' +
        '<button class="btn btn-sm" data-del="' + p.id + '" type="button" style="background:#b00020;color:#fff">Delete</button>' +
        '</div></div>';
    }).join('');
    host.querySelectorAll('[data-restore]').forEach(function (b) { b.onclick = function () { setArchived(b.getAttribute('data-restore'), false); }; });
    host.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { del(b.getAttribute('data-del')); }; });
  }

  function refreshAll() {
    // rebuild link checkboxes reflecting current people & editing target
    var editing = F.state.editing;
    var p = editing ? F.byId(F.loadPeople(), editing) : null;
    el('fParents').innerHTML = F.personCheckboxes('parent', p ? p.parents : [], editing);
    el('fPartners').innerHTML = F.personCheckboxes('partner', p ? p.partners : [], editing);
    renderList(); renderTree(); renderArchived();
  }
  window.__FAM_REFRESH = refreshAll;

  /* ---------------- form ---------------- */
  function readChecks(grp) {
    var out = [];
    document.querySelectorAll('input[data-grp="' + grp + '"]:checked').forEach(function (c) { out.push(c.value); });
    return out;
  }
  function clearForm() {
    F.state.editing = null;
    ['fPref','fFirst','fMiddle','fLast','fDob','fNotes'].forEach(function (id) { el(id).value = ''; });
    el('fGender').value = ''; el('fRel').value = ''; el('fSelf').checked = false;
    el('famFormTitle').textContent = 'Add a person';
    el('fSave').textContent = 'Save person';
    refreshAll();
  }
  function startEdit(id) {
    var p = F.byId(F.loadPeople(), id); if (!p) { return; }
    F.state.editing = id;
    el('fPref').value = p.preferred || ''; el('fFirst').value = p.first || '';
    el('fMiddle').value = p.middle || ''; el('fLast').value = p.last || '';
    el('fGender').value = p.gender || ''; el('fDob').value = p.dob || '';
    el('fRel').value = p.relationship || ''; el('fNotes').value = p.notes || '';
    el('fSelf').checked = !!p.isSelf;
    el('famFormTitle').textContent = 'Edit person';
    el('fSave').textContent = 'Update person';
    refreshAll();
    var pg = el('page-family'); if (pg && pg.scrollIntoView) { pg.scrollIntoView({ behavior: 'smooth' }); }
  }
  function save() {
    var list = F.loadPeople();
    var pref = el('fPref').value.trim(), first = el('fFirst').value.trim(), last = el('fLast').value.trim();
    if (!pref && !first && !last) { A.toast('Enter at least a name', true); el('fPref').focus(); return; }
    var isSelf = el('fSelf').checked;
    if (isSelf) { list.forEach(function (x) { if (F.state.editing !== x.id) { x.isSelf = false; } }); }
    var data = {
      preferred: pref, first: first, middle: el('fMiddle').value.trim(), last: last,
      gender: el('fGender').value, dob: el('fDob').value, relationship: el('fRel').value,
      notes: el('fNotes').value.trim(), isSelf: isSelf,
      parents: readChecks('parent'), partners: readChecks('partner')
    };
    if (F.state.editing) {
      var ex = F.byId(list, F.state.editing);
      if (ex) { for (var k in data) { ex[k] = data[k]; } }
      // keep partner links symmetric
      syncPartners(list, ex);
      if (F.savePeople(list)) { A.toast('Updated'); clearForm(); }
    } else {
      data.id = F.uid(); data.created = new Date().toISOString();
      list.push(data); syncPartners(list, data);
      if (F.savePeople(list)) { A.toast('Saved on this device'); clearForm(); }
    }
  }
  // make partner links mutual so relationship calc & tree work both ways
  function syncPartners(list, person) {
    (person.partners || []).forEach(function (pid) {
      var o = F.byId(list, pid); if (!o) { return; }
      o.partners = o.partners || [];
      if (o.partners.indexOf(person.id) === -1) { o.partners.push(person.id); }
    });
  }
  function archive(id) { setArchived(id, true); }
  function setArchived(id, val) {
    var list = F.loadPeople(); var p = F.byId(list, id); if (!p) { return; }
    p.archived = val; if (val && p.isSelf) { p.isSelf = false; }
    if (F.savePeople(list)) { A.toast(val ? 'Archived' : 'Restored'); if (F.state.editing === id) { clearForm(); } else { refreshAll(); } }
  }
  function del(id) {
    if (!window.confirm('Permanently delete this person? This cannot be undone.')) { return; }
    var list = F.loadPeople().filter(function (p) { return p.id !== id; });
    // strip dangling links
    list.forEach(function (p) {
      p.parents = (p.parents || []).filter(function (x) { return x !== id; });
      p.partners = (p.partners || []).filter(function (x) { return x !== id; });
    });
    if (F.savePeople(list)) { A.toast('Deleted'); refreshAll(); }
  }
  function exportData() {
    var list = F.loadPeople();
    if (!list.length) { A.toast('Nothing to export yet', true); return; }
    try {
      var blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'my-family.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
      A.toast('Exported to my-family.json');
    } catch (e) { A.toast('Export not supported on this device', true); }
  }

  function switchTab(tab) {
    document.querySelectorAll('.fam-tab').forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-tab') === tab); });
    el('famList').style.display = tab === 'list' ? 'block' : 'none';
    el('famTree').style.display = tab === 'tree' ? 'block' : 'none';
    el('famArchived').style.display = tab === 'archived' ? 'block' : 'none';
  }

  window.__FAM_INIT = function () {
    el('fSave').onclick = save;
    el('fReset').onclick = clearForm;
    el('famExport').onclick = exportData;
    var s = el('famSearch'); if (s) { s.addEventListener('input', renderList); }
    document.querySelectorAll('.fam-tab').forEach(function (t) { t.onclick = function () { switchTab(t.getAttribute('data-tab')); }; });
    refreshAll();
  };
})();
