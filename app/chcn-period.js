/* =============================================================================
 * Life & Tools — PERIOD, CYCLE & FERTILITY TRACKER (spec §29, §45)
 * Powered by CHCN.Cycle. Private-by-default: data lives ONLY on this device
 * under chcn_cycle_v1 and is never shown in the family tree or profile.
 * No hard-coded 28-day cycle / day-14 ovulation. Never reports “safe” days.
 * ========================================================================== */
(function () {
  'use strict';
  var A = window.LTApp; if (!A) { return; }
  var LS = 'chcn_cycle_v1';

  function build() {
    return '<div id="page-cycle" style="display:none">' +
      '<section class="page-header"><h1>Period &amp; Cycle Tracker</h1>' +
      '<p>Track your period, understand your cycle, and see estimated \u2014 not guaranteed \u2014 fertile windows. Everything stays private on this device.</p></section>' +
      '<section style="padding:8px 0 48px"><div class="container">' +
        '<div class="cyc-privacy">\uD83D\uDD12 Private by default. This information is stored only on your device, is not part of your family tree or public profile, and is never uploaded. Use <b>Export</b> to keep a copy or <b>Clear all</b> to erase it.</div>' +
        '<div class="cyc-disclaimer"><strong>Not medical advice.</strong> This tracker is for general awareness and education only. Predictions and fertile-window estimates are approximate and can be wrong. It is <strong>not</strong> a contraceptive method and must not be relied on to prevent or achieve pregnancy. For medical concerns, contact a qualified healthcare professional.</div>' +
        '<div class="cyc-layout">' +
          '<div class="cyc-col">' +
            '<div class="cyc-card"><h3>Log a period start</h3>' +
              '<div class="cyc-row"><input id="cycDate" type="date"><button class="btn btn-sm btn-primary" id="cycAdd" type="button">Add</button></div>' +
              '<small class="cyc-hint">Add the first day of each period. The more you log, the better the estimates.</small>' +
              '<div id="cycList" class="cyc-list"></div></div>' +
            '<div class="cyc-card"><h3>Settings</h3>' +
              '<div class="cyc-field"><label>Typical cycle length (optional)</label><input id="cycTypical" type="number" min="15" max="90" placeholder="used only until you log 2+ periods"></div>' +
              '<div class="cyc-field"><label class="cyc-chk"><input type="checkbox" id="cycIrregular"> My cycles are irregular (widen ranges, lower confidence)</label></div>' +
              '<div class="cyc-field"><label>Tracking goal</label><select id="cycGoal"><option value="awareness">General awareness</option><option value="conceive">Trying to conceive</option><option value="understand">Understanding my body</option></select></div>' +
              '<details class="cyc-adv"><summary>Advanced</summary><div class="cyc-field"><label>Assumed luteal phase (days)</label><input id="cycLuteal" type="number" min="10" max="16" value="14"><small class="cyc-hint">Used to estimate ovulation as (cycle length \u2212 luteal phase). Default 14 is an assumption, not a fact about your body.</small></div></details>' +
              '<div class="cyc-row"><button class="btn btn-sm" id="cycSaveSettings" type="button">Save settings</button></div></div>' +
            '<div class="cyc-card"><h3>Symptom / note</h3>' +
              '<div class="cyc-row"><input id="cycSymDate" type="date"></div>' +
              '<div id="cycSymTags" class="cyc-tags"></div>' +
              '<div class="cyc-row"><input id="cycSymNote" type="text" placeholder="optional note"><button class="btn btn-sm btn-primary" id="cycSymAdd" type="button">Save</button></div>' +
              '<div id="cycSymList" class="cyc-list"></div></div>' +
            '<div class="cyc-card"><h3>Your data</h3>' +
              '<div class="cyc-row"><button class="btn btn-sm btn-outline" id="cycExport" type="button">Export</button>' +
              '<button class="btn btn-sm" id="cycClear" type="button" style="background:#b00020;color:#fff">Clear all</button></div></div>' +
          '</div>' +
          '<div class="cyc-col cyc-dash">' +
            '<div id="cycToday" class="cyc-card cyc-today"></div>' +
            '<div id="cycStats" class="cyc-card"></div>' +
            '<div id="cycPredict" class="cyc-card"></div>' +
            '<div id="cycFertile" class="cyc-card"></div>' +
            '<div id="cycObs" class="cyc-card"></div>' +
          '</div>' +
        '</div>' +
      '</div></section></div>';
  }

  window.__CYC = {
    A: A, LS: LS,
    load: function () { var d = A.load(LS, null); return d && typeof d === 'object' ? d : { periods: [], symptoms: [], settings: {} }; },
    save: function (d) { return A.save(LS, d); }
  };

  A.register({ name: 'cycle', pages: ['cycle'], build: build,
    init: function () { if (window.__CYC_INIT) { window.__CYC_INIT(); } },
    onShow: { cycle: function () { if (window.__CYC_REFRESH) { window.__CYC_REFRESH(); } } } });
})();
