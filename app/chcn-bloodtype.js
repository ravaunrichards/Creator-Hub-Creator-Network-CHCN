/* =============================================================================
 * Life & Tools — BLOOD TYPE INHERITANCE (spec 70–72)
 * UI labels: Mother / Father.  Internally parent1 / parent2 (order-independent).
 * ========================================================================== */
(function () {
  'use strict';
  var A = window.LTApp; if (!A) { return; }

  var TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
  var GENOTYPES = { A: 'AA or AO', B: 'BB or BO', AB: 'AB', O: 'OO' };
  var RH_GENO = { '+': 'DD or Dd', '-': 'dd' };
  var TYPE_NOTES = { 'O-': 'Universal red-cell donor', 'AB+': 'Universal plasma recipient' };

  function opts() { return TYPES.map(function (t) { return '<option value="' + t + '">' + t + '</option>'; }).join(''); }

  function build() {
    return '<div id="page-bloodtype" style="display:none">' +
      '<section class="page-header"><h1>Blood Type Inheritance</h1>' +
      '<p>Standard ABO &amp; Rh inheritance for education only.</p></section>' +
      '<section style="padding:16px 0 48px"><div class="container">' +
        '<div class="bt-form">' +
          '<div class="bt-parent"><label for="btMother">Mother\u2019s blood type</label>' +
            '<select id="btMother">' + opts() + '</select></div>' +
          '<div class="bt-parent"><label for="btFather">Father\u2019s blood type</label>' +
            '<select id="btFather">' + opts() + '</select></div>' +
          '<button class="btn btn-primary" id="btGo" type="button">Check possible blood types</button>' +
        '</div>' +
        '<div id="btResult" class="bt-result" aria-live="polite"></div>' +
        '<div class="bt-disclaimer"><strong>Important:</strong> This educational calculator shows the blood types a child <em>could</em> inherit based on standard inheritance patterns. It does <strong>not</strong> determine a baby\u2019s actual blood type, which must be confirmed by laboratory testing, and it <strong>must not</strong> be used as proof or disproof of biological parentage.</div>' +
        '<div class="bt-edu"><h3>How ABO &amp; Rh inheritance works</h3><ul>' +
          '<li><b>Alleles &amp; genotype:</b> you inherit one ABO allele from each parent. A and B are co-dominant; O is recessive. Genotype <code>AO</code> still shows as blood type A (the phenotype).</li>' +
          '<li><b>ABO groups:</b> A = AA/AO, B = BB/BO, AB = AB, O = OO.</li>' +
          '<li><b>Rh factor:</b> D (positive) is dominant over d (negative). Rh+ = DD or Dd; Rh\u2212 = dd.</li>' +
        '</ul></div>' +
      '</div></section></div>';
  }

  function parentLine(label, t) {
    var G = window.CHCN.Genetics; var p = G.parseType(t);
    return '<li><b>' + A.esc(label) + ' (' + A.esc(t) + '):</b> ABO genotype ' + A.esc(GENOTYPES[p.abo]) +
      ', Rh genotype ' + A.esc(RH_GENO[p.rh]) + ' \u2014 can pass ABO {' + G.ABO_ALLELES[p.abo].join(', ') +
      '} and Rh {' + G.RH_ALLELES[p.rh].join(', ') + '}.</li>';
  }

  function run() {
    var box = A.el('btResult');
    var G = window.CHCN && window.CHCN.Genetics;
    if (!G) { box.innerHTML = '<div class="bt-error">The genetics engine did not load. Please reload the page.</div>'; return; }
    var mother = A.el('btMother').value, father = A.el('btFather').value;
    box.innerHTML = '<div class="bt-loading">Calculating\u2026</div>';
    try {
      var res = G.possibleChildTypes(mother, father);
      if (!res.types.length) { box.innerHTML = '<div class="bt-error">No valid outcome could be calculated.</div>'; return; }
      var chips = res.types.map(function (t) {
        var note = TYPE_NOTES[t] ? '<small>' + A.esc(TYPE_NOTES[t]) + '</small>' : '';
        return '<span class="bt-chip">' + A.esc(t) + note + '</span>';
      }).join('');
      box.innerHTML =
        '<div class="bt-summary">Mother <b>' + A.esc(mother) + '</b> \u00d7 Father <b>' + A.esc(father) +
          '</b> \u2014 a child could have <b>' + res.types.length + '</b> possible blood type' + (res.types.length !== 1 ? 's' : '') + ':</div>' +
        '<div class="bt-chips">' + chips + '</div>' +
        '<div class="bt-breakdown">Possible ABO groups: <b>' + res.abo.join(', ') + '</b> &nbsp;|&nbsp; Possible Rh: <b>' + res.rh.join(', ') + '</b></div>' +
        '<div class="bt-geno"><h4>Why these are possible</h4><ul>' + parentLine('Mother', mother) + parentLine('Father', father) + '</ul></div>';
    } catch (e) { box.innerHTML = '<div class="bt-error">Could not calculate: ' + A.esc(e.message) + '</div>'; }
  }

  function init() { var b = A.el('btGo'); if (b) { b.onclick = run; } }

  A.register({ name: 'bloodtype', pages: ['bloodtype'], build: build, init: init });
})();
