/* =============================================================================
 * Life & Tools — PERIOD & CYCLE TRACKER (behaviour half)
 * ========================================================================== */
(function () {
  'use strict';
  var C = window.__CYC; if (!C) { return; }
  var A = C.A;
  function el(id) { return A.el(id); }
  function eng() { return window.CHCN && window.CHCN.Cycle; }
  var SYMPTOMS = ['Light flow','Medium flow','Heavy flow','Spotting','Cramps','Headache','Tender breasts','Low mood','Energetic','Bloating'];
  var CONF_TEXT = { high: 'higher confidence', medium: 'moderate confidence', low: 'low confidence', none: 'not enough data' };

  function periodDates(d) { return (d.periods || []).slice().sort(); }
  function opts(d) { return { typicalLength: d.settings.typicalLength || null, irregular: !!d.settings.irregular, luteal: d.settings.luteal || 14 }; }

  /* ---------------- logging ---------------- */
  function addPeriod() {
    var v = el('cycDate').value; if (!v) { A.toast('Pick the first day of your period', true); return; }
    var d = C.load();
    if (d.periods.indexOf(v) !== -1) { A.toast('That date is already logged', true); return; }
    d.periods.push(v); if (C.save(d)) { A.toast('Logged'); el('cycDate').value = ''; refresh(); }
  }
  function delPeriod(date) {
    var d = C.load(); d.periods = d.periods.filter(function (x) { return x !== date; });
    if (C.save(d)) { refresh(); }
  }
  function renderList() {
    var host = el('cycList'); var d = C.load(); var arr = periodDates(d).reverse();
    if (!arr.length) { host.innerHTML = '<p class="cyc-empty">No periods logged yet.</p>'; return; }
    host.innerHTML = arr.map(function (x) {
      return '<div class="cyc-li"><span>' + A.esc(x) + '</span><button class="cyc-x" data-d="' + A.esc(x) + '" type="button" title="Remove">\u00d7</button></div>';
    }).join('');
    host.querySelectorAll('.cyc-x').forEach(function (b) { b.onclick = function () { delPeriod(b.getAttribute('data-d')); }; });
  }

  /* ---------------- settings ---------------- */
  function loadSettings() {
    var d = C.load(); var s = d.settings || {};
    el('cycTypical').value = s.typicalLength || '';
    el('cycIrregular').checked = !!s.irregular;
    el('cycGoal').value = s.goal || 'awareness';
    el('cycLuteal').value = s.luteal || 14;
  }
  function saveSettings() {
    var d = C.load();
    var t = parseInt(el('cycTypical').value, 10);
    var l = parseInt(el('cycLuteal').value, 10);
    d.settings = {
      typicalLength: (t >= 15 && t <= 90) ? t : null,
      irregular: el('cycIrregular').checked,
      goal: el('cycGoal').value,
      luteal: (l >= 10 && l <= 16) ? l : 14
    };
    if (C.save(d)) { A.toast('Settings saved'); refresh(); }
  }

  /* ---------------- symptoms ---------------- */
  var symSel = {};
  function renderSymTags() {
    el('cycSymTags').innerHTML = SYMPTOMS.map(function (s) {
      return '<button type="button" class="cyc-tag' + (symSel[s] ? ' on' : '') + '" data-s="' + A.esc(s) + '">' + A.esc(s) + '</button>';
    }).join('');
    el('cycSymTags').querySelectorAll('.cyc-tag').forEach(function (b) {
      b.onclick = function () { var s = b.getAttribute('data-s'); symSel[s] = !symSel[s]; renderSymTags(); };
    });
  }
  function addSymptom() {
    var date = el('cycSymDate').value; if (!date) { A.toast('Pick a date', true); return; }
    var tags = Object.keys(symSel).filter(function (k) { return symSel[k]; });
    var note = el('cycSymNote').value.trim();
    if (!tags.length && !note) { A.toast('Choose a symptom or write a note', true); return; }
    var d = C.load(); d.symptoms = d.symptoms || [];
    d.symptoms.push({ id: 's_' + Date.now().toString(36), date: date, tags: tags, note: note });
    if (C.save(d)) { A.toast('Saved'); symSel = {}; el('cycSymNote').value = ''; renderSymTags(); renderSymList(); }
  }
  function renderSymList() {
    var host = el('cycSymList'); var d = C.load(); var arr = (d.symptoms || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    if (!arr.length) { host.innerHTML = '<p class="cyc-empty">No symptoms logged.</p>'; return; }
    host.innerHTML = arr.map(function (s) {
      var tags = (s.tags || []).map(function (t) { return '<span class="cyc-tagchip">' + A.esc(t) + '</span>'; }).join('');
      return '<div class="cyc-li cyc-sym"><div><b>' + A.esc(s.date) + '</b> ' + tags + (s.note ? '<div class="cyc-notes">' + A.esc(s.note) + '</div>' : '') + '</div>' +
        '<button class="cyc-x" data-id="' + s.id + '" type="button">\u00d7</button></div>';
    }).join('');
    host.querySelectorAll('.cyc-x').forEach(function (b) { b.onclick = function () {
      var d2 = C.load(); d2.symptoms = (d2.symptoms || []).filter(function (x) { return x.id !== b.getAttribute('data-id'); });
      if (C.save(d2)) { renderSymList(); }
    }; });
  }

  /* ---------------- dashboard ---------------- */
  function todayISO() { var t = new Date(); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); }
  function renderDash() {
    var d = C.load(); var E = eng(); var starts = periodDates(d); var o = opts(d);
    var last = starts[starts.length - 1] || null;
    var st = E.stats(starts);
    // today
    if (!last) {
      el('cycToday').innerHTML = '<h3>Today</h3><p class="cyc-empty">Log your most recent period start to see your current cycle day and phase.</p>';
    } else {
      var day = E.currentCycleDay(last, todayISO());
      var phase = (st.average) ? E.cyclePhase(day, st.average, o) : 'more data needed';
      el('cycToday').innerHTML = '<h3>Today</h3><div class="cyc-big">Cycle day <b>' + (day || '?') + '</b></div>' +
        '<div class="cyc-phase">Estimated phase: <b>' + A.esc(phase) + '</b></div>' +
        '<small class="cyc-hint">Counted from your last logged period start (' + A.esc(last) + ').</small>';
    }
    // stats
    if (st.count < 1) {
      el('cycStats').innerHTML = '<h3>Cycle statistics</h3><p class="cyc-empty">Log at least two period starts to calculate your cycle length.</p>';
    } else {
      el('cycStats').innerHTML = '<h3>Cycle statistics</h3><div class="cyc-stats">' +
        stat('Average', st.average + ' days') + stat('Shortest', st.shortest + ' days') +
        stat('Longest', st.longest + ' days') + stat('Variation', st.variability + ' days') +
        stat('Pattern', st.regular ? 'fairly regular' : 'variable') +
        stat('Cycles recorded', String(st.count)) + '</div>';
    }
    // predict
    var p = E.predictNextPeriod(starts, o);
    if (!p || !p.date) {
      el('cycPredict').innerHTML = '<h3>Next period (estimate)</h3><p class="cyc-empty">Log two or more periods (or set a typical length) for an estimate.</p>';
    } else {
      el('cycPredict').innerHTML = '<h3>Next period (estimate)</h3>' +
        '<div class="cyc-big">~ <b>' + A.esc(p.date) + '</b></div>' +
        '<div class="cyc-range">Likely between <b>' + A.esc(p.rangeStart) + '</b> and <b>' + A.esc(p.rangeEnd) + '</b></div>' +
        '<div class="cyc-conf conf-' + p.confidence + '">' + A.esc(CONF_TEXT[p.confidence] || p.confidence) + '</div>' +
        '<small class="cyc-hint">An estimate, not a guarantee \u2014 cycles vary.</small>';
    }
    // fertile
    var startForWindow = last;
    var fw = startForWindow ? E.fertileWindow(startForWindow, starts, o) : { insufficient: true };
    if (fw.insufficient) {
      el('cycFertile').innerHTML = '<h3>Fertile window (estimate)</h3><p class="cyc-empty">' + A.esc(fw.note || 'Not enough data yet.') + '</p>';
    } else {
      el('cycFertile').innerHTML = '<h3>Fertile window (estimate)</h3>' +
        '<div class="cyc-range">Estimated fertile days: <b>' + A.esc(fw.fertileStart) + '</b> to <b>' + A.esc(fw.fertileEnd) + '</b></div>' +
        '<div class="cyc-range">Estimated ovulation: around <b>' + A.esc(fw.ovulationDate) + '</b> (window ' + A.esc(fw.ovulationWindowStart) + ' to ' + A.esc(fw.ovulationWindowEnd) + ')</div>' +
        '<div class="cyc-conf conf-' + fw.confidence + '">' + A.esc(CONF_TEXT[fw.confidence] || fw.confidence) + '</div>' +
        '<small class="cyc-hint">' + A.esc(fw.note) + ' There are no \u201csafe\u201d days \u2014 this cannot prevent pregnancy.</small>';
    }
    // observations
    var obs = E.observations(starts, o);
    if (!obs.length) { el('cycObs').innerHTML = '<h3>Notes</h3><p class="cyc-empty">No unusual patterns flagged from your records.</p>'; }
    else { el('cycObs').innerHTML = '<h3>Notes</h3><ul class="cyc-obs">' + obs.map(function (x) { return '<li>' + A.esc(x) + '</li>'; }).join('') + '</ul>'; }
  }
  function stat(k, v) { return '<div class="cyc-stat"><span>' + A.esc(k) + '</span><b>' + A.esc(v) + '</b></div>'; }

  /* ---------------- data ---------------- */
  function exportData() {
    var d = C.load();
    if (!d.periods.length && !(d.symptoms || []).length) { A.toast('Nothing to export yet', true); return; }
    try {
      var blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'my-cycle-data.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
      A.toast('Exported');
    } catch (e) { A.toast('Export not supported on this device', true); }
  }
  function clearAll() {
    if (!window.confirm('Erase ALL your cycle data from this device? This cannot be undone.')) { return; }
    if (C.save({ periods: [], symptoms: [], settings: {} })) { A.toast('All cycle data cleared'); refresh(); }
  }

  function refresh() { renderList(); loadSettings(); renderSymList(); renderDash(); }
  window.__CYC_REFRESH = refresh;

  window.__CYC_INIT = function () {
    if (!eng()) { return; }
    el('cycAdd').onclick = addPeriod;
    el('cycSaveSettings').onclick = saveSettings;
    el('cycSymAdd').onclick = addSymptom;
    el('cycExport').onclick = exportData;
    el('cycClear').onclick = clearAll;
    renderSymTags();
    refresh();
  };
})();
