/* =============================================================================
 * Life & Tools — CALCULATORS & CONVERTERS UI (uses CHCN.Calc)
 * Pages: calc, datecalc, bmi, convert
 * ========================================================================== */
(function () {
  'use strict';
  var A = window.LTApp; if (!A) { return; }
  function K() { return window.CHCN && window.CHCN.Calc; }
  function num(id) { var v = parseFloat(A.el(id).value); return isFinite(v) ? v : null; }
  function out(id, html) { A.el(id).innerHTML = html; }

  /* ---------------- markup ---------------- */
  function build() {
    return [
      // Everyday calculator
      '<div id="page-calc" style="display:none"><section class="page-header"><h1>Everyday Calculator</h1><p>Percentages, tips and bill splitting.</p></section>',
      '<section style="padding:16px 0 48px"><div class="container ltc-cols">',
        '<div class="ltc-card"><h3>Percentage</h3><div class="ltc-row"><input id="pcA" type="number" placeholder="percent"> % of <input id="pcB" type="number" placeholder="total"></div>',
          '<button class="btn btn-sm btn-primary" id="pcGo" type="button">Calculate</button><div id="pcOut" class="ltc-out" aria-live="polite"></div></div>',
        '<div class="ltc-card"><h3>Percentage change</h3><div class="ltc-row">from <input id="pchA" type="number" placeholder="old"> to <input id="pchB" type="number" placeholder="new"></div>',
          '<button class="btn btn-sm btn-primary" id="pchGo" type="button">Calculate</button><div id="pchOut" class="ltc-out" aria-live="polite"></div></div>',
        '<div class="ltc-card"><h3>Tip &amp; split</h3><div class="ltc-row">bill <input id="tipBill" type="number" placeholder="amount"> tip <input id="tipPct" type="number" value="15">% split <input id="tipSplit" type="number" value="1" min="1"></div>',
          '<button class="btn btn-sm btn-primary" id="tipGo" type="button">Calculate</button><div id="tipOut" class="ltc-out" aria-live="polite"></div></div>',
      '</div></section></div>',
      // Date & age
      '<div id="page-datecalc" style="display:none"><section class="page-header"><h1>Date &amp; Age Calculator</h1><p>Days between dates, age breakdown and date arithmetic.</p></section>',
      '<section style="padding:16px 0 48px"><div class="container ltc-cols">',
        '<div class="ltc-card"><h3>Days between two dates</h3><div class="ltc-row"><input id="dbA" type="date"> \u2192 <input id="dbB" type="date"></div>',
          '<button class="btn btn-sm btn-primary" id="dbGo" type="button">Calculate</button><div id="dbOut" class="ltc-out" aria-live="polite"></div></div>',
        '<div class="ltc-card"><h3>Age</h3><div class="ltc-row">born <input id="ageDob" type="date"> on <input id="ageOn" type="date"></div>',
          '<button class="btn btn-sm btn-primary" id="ageGo" type="button">Calculate</button><div id="ageOut" class="ltc-out" aria-live="polite"></div></div>',
        '<div class="ltc-card"><h3>Add / subtract days</h3><div class="ltc-row"><input id="adA" type="date"> + <input id="adN" type="number" value="0"> days</div>',
          '<button class="btn btn-sm btn-primary" id="adGo" type="button">Calculate</button><div id="adOut" class="ltc-out" aria-live="polite"></div></div>',
      '</div></section></div>',
      // BMI
      '<div id="page-bmi" style="display:none"><section class="page-header"><h1>BMI Calculator</h1><p>A general screening figure \u2014 not a diagnosis or health assessment.</p></section>',
      '<section style="padding:16px 0 48px"><div class="container"><div class="ltc-card" style="max-width:460px"><h3>Body Mass Index</h3>',
        '<div class="ltc-row">weight <input id="bmiKg" type="number" placeholder="kg"> kg</div>',
        '<div class="ltc-row">height <input id="bmiCm" type="number" placeholder="cm"> cm</div>',
        '<button class="btn btn-sm btn-primary" id="bmiGo" type="button">Calculate</button><div id="bmiOut" class="ltc-out" aria-live="polite"></div></div></div></section></div>',
      // Converter
      '<div id="page-convert" style="display:none"><section class="page-header"><h1>Unit Converter</h1><p>Length, mass, volume, speed, temperature and data.</p></section>',
      '<section style="padding:16px 0 48px"><div class="container"><div class="ltc-card" style="max-width:560px"><h3>Convert</h3>',
        '<div class="ltc-row">category <select id="cvCat"></select></div>',
        '<div class="ltc-row"><input id="cvVal" type="number" value="1"> <select id="cvFrom"></select> \u2192 <select id="cvTo"></select></div>',
        '<button class="btn btn-sm btn-primary" id="cvGo" type="button">Convert</button><div id="cvOut" class="ltc-out" aria-live="polite"></div></div></div></section></div>'
    ].join('');
  }

  /* ---------------- wiring ---------------- */
  var CATS = { length: 'Length', mass: 'Mass', volume: 'Volume', speed: 'Speed', temperature: 'Temperature', data: 'Data' };
  var TEMP_UNITS = ['C', 'F', 'K'];

  function fillUnitSelects() {
    var cat = A.el('cvCat').value, units;
    if (cat === 'temperature') { units = TEMP_UNITS; }
    else { units = Object.keys(K().FACTORS[cat]); }
    var o = units.map(function (u) { return '<option value="' + u + '">' + u + '</option>'; }).join('');
    A.el('cvFrom').innerHTML = o; A.el('cvTo').innerHTML = o;
    if (units[1]) { A.el('cvTo').selectedIndex = 1; }
  }

  function init() {
    var k = K(); if (!k) { return; }
    A.el('pcGo').onclick = function () { var a = num('pcA'), b = num('pcB'); out('pcOut', a == null || b == null ? err() : '<b>' + k.percentOf(a, b) + '</b>'); };
    A.el('pchGo').onclick = function () { var a = num('pchA'), b = num('pchB'); var r = (a == null || b == null) ? null : k.percentChange(a, b); out('pchOut', r == null ? err('Enter two numbers; old value cannot be 0.') : '<b>' + (r > 0 ? '+' : '') + r + '%</b>'); };
    A.el('tipGo').onclick = function () { var bill = num('tipBill'), pct = num('tipPct'), sp = num('tipSplit') || 1; if (bill == null || pct == null) { return out('tipOut', err()); } var t = k.tip(bill, pct, Math.max(1, Math.round(sp))); out('tipOut', 'Tip <b>' + t.tip + '</b> \u00b7 Total <b>' + t.total + '</b> \u00b7 Per person <b>' + t.perPerson + '</b>'); };
    A.el('dbGo').onclick = function () { var a = A.el('dbA').value, b = A.el('dbB').value; if (!a || !b) { return out('dbOut', err('Pick both dates.')); } out('dbOut', '<b>' + k.daysBetween(a, b) + '</b> day(s)'); };
    A.el('ageGo').onclick = function () { var d = A.el('ageDob').value, o2 = A.el('ageOn').value || undefined; if (!d) { return out('ageOut', err('Enter a birth date.')); } var a = k.ageOn(d, o2); out('ageOut', '<b>' + a.years + '</b> years, ' + a.months + ' months, ' + a.days + ' days &nbsp;(' + a.totalDays + ' days total)'); };
    A.el('adGo').onclick = function () { var a = A.el('adA').value, n = num('adN') || 0; if (!a) { return out('adOut', err('Pick a date.')); } out('adOut', '<b>' + k.addDays(a, Math.round(n)) + '</b>'); };
    A.el('bmiGo').onclick = function () { var kg = num('bmiKg'), cm = num('bmiCm'); var r = k.bmi(kg, cm); if (!r) { return out('bmiOut', err('Enter weight and height.')); } out('bmiOut', 'BMI <b>' + r.bmi + '</b> \u2014 ' + A.esc(r.category) + '<div class="ltc-note">' + A.esc(r.note) + '</div>'); };
    // converter
    A.el('cvCat').innerHTML = Object.keys(CATS).map(function (c) { return '<option value="' + c + '">' + CATS[c] + '</option>'; }).join('');
    fillUnitSelects();
    A.el('cvCat').onchange = fillUnitSelects;
    A.el('cvGo').onclick = function () {
      var cat = A.el('cvCat').value, v = num('cvVal'), f = A.el('cvFrom').value, t = A.el('cvTo').value;
      if (v == null) { return out('cvOut', err('Enter a value.')); }
      var r = cat === 'temperature' ? k.convertTemp(v, f, t) : k.convert(cat, v, f, t);
      out('cvOut', r == null ? err('Conversion not available.') : '<b>' + v + ' ' + f + ' = ' + r + ' ' + t + '</b>');
    };
  }
  function err(m) { return '<span class="ltc-err">' + A.esc(m || 'Please enter valid numbers.') + '</span>'; }

  A.register({ name: 'calc', pages: ['calc', 'datecalc', 'bmi', 'convert'], build: build, init: init });
})();
