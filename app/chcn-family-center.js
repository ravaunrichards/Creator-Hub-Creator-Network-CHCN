/* =============================================================================
 * Life & Tools — FAMILY & RELATIONSHIPS CENTER
 * Person CRUD + auto relationship calculation (CHCN.FamilyEngine) + tree.
 * Private-by-default: stored only on this device (chcn_family_people_v2).
 * Manual relationship labels always win over the auto-calculated value.
 * Period/health data is intentionally NEVER shown or stored here.
 * ========================================================================== */
(function () {
  'use strict';
  var A = window.LTApp; if (!A) { return; }
  var LS = 'chcn_family_people_v2';

  // grouped relationship taxonomy for the manual override dropdown
  var TAXONOMY = [
    ['Immediate', ['Mother','Father','Parent','Son','Daughter','Child','Brother','Sister','Sibling','Husband','Wife','Partner']],
    ['Extended', ['Grandmother','Grandfather','Grandparent','Grandson','Granddaughter','Grandchild','Aunt','Uncle','Niece','Nephew','Cousin']],
    ['Step & half', ['Stepmother','Stepfather','Stepson','Stepdaughter','Stepbrother','Stepsister','Half-brother','Half-sister']],
    ['In-law', ['Mother-in-law','Father-in-law','Son-in-law','Daughter-in-law','Brother-in-law','Sister-in-law']],
    ['Chosen & other', ['Guardian','Ward','Godparent','Godchild','Friend','Other']]
  ];

  var state = { editing: null }; // id being edited, or null

  function loadPeople() { var a = A.load(LS, []); return Array.isArray(a) ? a : []; }
  function savePeople(a) { return A.save(LS, a); }
  function uid() { return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function active(list) { return list.filter(function (p) { return !p.archived; }); }
  function byId(list, id) { for (var i = 0; i < list.length; i++) { if (list[i].id === id) { return list[i]; } } return null; }
  function fullName(p) {
    if (!p) { return ''; }
    if (p.preferred) { return p.preferred; }
    return [p.first, p.middle, p.last].filter(Boolean).join(' ') || '(unnamed)';
  }
  function selfPerson(list) { return list.filter(function (p) { return p.isSelf && !p.archived; })[0] || null; }

  function relOptions(selected) {
    var html = '<option value="">Auto \u2014 calculate from links</option>';
    TAXONOMY.forEach(function (grp) {
      html += '<optgroup label="' + A.esc(grp[0]) + '">';
      grp[1].forEach(function (r) { html += '<option value="' + A.esc(r) + '"' + (r === selected ? ' selected' : '') + '>' + A.esc(r) + '</option>'; });
      html += '</optgroup>';
    });
    return html;
  }
  function personCheckboxes(idPrefix, currentIds, excludeId) {
    var list = active(loadPeople()).filter(function (p) { return p.id !== excludeId; });
    if (!list.length) { return '<p class="fam-empty">Add other people first to link them.</p>'; }
    currentIds = currentIds || [];
    return list.map(function (p) {
      var on = currentIds.indexOf(p.id) !== -1;
      return '<label class="fam-chk"><input type="checkbox" data-grp="' + idPrefix + '" value="' + p.id + '"' + (on ? ' checked' : '') + '> ' + A.esc(fullName(p)) + '</label>';
    }).join('');
  }

  function build() {
    return '<div id="page-family" style="display:none">' +
      '<section class="page-header"><h1>Family &amp; Relationships</h1>' +
      '<p>Add the people in your family, link parents and partners, and the app works out how everyone is related. No family type is ranked above another.</p></section>' +
      '<section style="padding:8px 0 48px"><div class="container">' +
        '<div class="fam-privacy">\uD83D\uDD12 Private by default. Everything you enter here is stored only on this device and is never uploaded. Use <b>Export</b> to keep your own copy.</div>' +
        '<div class="fam-layout">' +
          '<div class="fam-col-form"><h3 id="famFormTitle">Add a person</h3>' +
            '<div class="fam-field"><label>Preferred / display name</label><input id="fPref" type="text" placeholder="e.g. Mum, Alex"></div>' +
            '<div class="fam-field-row">' +
              '<div class="fam-field"><label>First</label><input id="fFirst" type="text"></div>' +
              '<div class="fam-field"><label>Middle</label><input id="fMiddle" type="text"></div>' +
              '<div class="fam-field"><label>Last</label><input id="fLast" type="text"></div>' +
            '</div>' +
            '<div class="fam-field-row">' +
              '<div class="fam-field"><label>Sex/gender (for relationship words)</label><select id="fGender"><option value="">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other / non-binary</option></select></div>' +
              '<div class="fam-field"><label>Date of birth (optional)</label><input id="fDob" type="date"></div>' +
            '</div>' +
            '<div class="fam-field"><label>Relationship to you</label><select id="fRel">' + relOptions('') + '</select>' +
              '<small class="fam-hint">Leave on \u201cAuto\u201d to calculate it from parent/partner links. A manual choice always overrides the calculation.</small></div>' +
            '<div class="fam-field"><label class="fam-chk fam-self"><input type="checkbox" id="fSelf"> This person is <b>me</b> (the centre of the tree)</label></div>' +
            '<div class="fam-field"><label>Parents (link existing people)</label><div id="fParents" class="fam-chk-grid"></div></div>' +
            '<div class="fam-field"><label>Partner / spouse (link existing people)</label><div id="fPartners" class="fam-chk-grid"></div></div>' +
            '<div class="fam-field"><label>Notes (optional)</label><textarea id="fNotes" rows="2"></textarea></div>' +
            '<div class="fam-form-actions"><button class="btn btn-primary btn-sm" id="fSave" type="button">Save person</button>' +
              '<button class="btn btn-outline btn-sm" id="fReset" type="button">Clear form</button></div>' +
          '</div>' +
          '<div class="fam-col-view">' +
            '<div class="fam-viewbar"><h3>Your family</h3>' +
              '<div class="fam-viewbar-actions"><input id="famSearch" type="search" placeholder="Search names\u2026">' +
                '<button class="btn btn-outline btn-sm" id="famExport" type="button">Export</button></div></div>' +
            '<div class="fam-tabs"><button class="fam-tab active" data-tab="list" type="button">List</button>' +
              '<button class="fam-tab" data-tab="tree" type="button">Tree</button>' +
              '<button class="fam-tab" data-tab="archived" type="button">Archived</button></div>' +
            '<div id="famList" class="fam-view"></div>' +
            '<div id="famTree" class="fam-view" style="display:none"></div>' +
            '<div id="famArchived" class="fam-view" style="display:none"></div>' +
          '</div>' +
        '</div>' +
      '</div></section></div>';
  }

  // expose internals for the logic half
  window.__FAM = {
    A: A, LS: LS, state: state, loadPeople: loadPeople, savePeople: savePeople, uid: uid,
    active: active, byId: byId, fullName: fullName, selfPerson: selfPerson,
    relOptions: relOptions, personCheckboxes: personCheckboxes
  };

  A.register({ name: 'family', pages: ['family'], build: build,
    init: function () { if (window.__FAM_INIT) { window.__FAM_INIT(); } },
    onShow: { family: function () { if (window.__FAM_REFRESH) { window.__FAM_REFRESH(); } } } });
})();
