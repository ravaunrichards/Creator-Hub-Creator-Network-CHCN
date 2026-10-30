/* =============================================================================
 * Creator Hub Creator Network — Life & Tools calculation engines
 * -----------------------------------------------------------------------------
 * Pure & deterministic; no DOM. Node-testable. Powers the utility hub.
 * ========================================================================== */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  if (typeof window !== 'undefined') { window.CHCN = window.CHCN || {}; window.CHCN.Calc = api; }
})(this, function () {
  'use strict';

  function round(n, dp) { var f = Math.pow(10, dp == null ? 2 : dp); return Math.round(n * f) / f; }

  // ---- everyday calculators -------------------------------------------------
  function percentOf(percent, total) { return round((percent / 100) * total); }
  function whatPercent(part, total) { return total === 0 ? null : round((part / total) * 100); }
  function percentChange(from, to) { return from === 0 ? null : round(((to - from) / Math.abs(from)) * 100); }

  function tip(bill, pct, split) {
    split = split || 1;
    var t = round((pct / 100) * bill), total = round(bill + t);
    return { tip: t, total: total, perPerson: round(total / split) };
  }

  function bmi(kg, cm) {
    if (!kg || !cm) { return null; }
    var m = cm / 100, v = round(kg / (m * m), 1);
    var cat = v < 18.5 ? 'Underweight' : v < 25 ? 'Normal range' : v < 30 ? 'Overweight' : 'Obese range';
    return { bmi: v, category: cat, note: 'BMI is a general screening figure, not a diagnosis or health assessment.' };
  }

  function loanMonthlyPayment(principal, annualRatePct, years) {
    var n = years * 12, r = (annualRatePct / 100) / 12;
    if (r === 0) { return round(principal / n); }
    var p = principal * r / (1 - Math.pow(1 + r, -n));
    return round(p);
  }

  // ---- date / time ----------------------------------------------------------
  var DAY = 86400000;
  function toDate(d) {
    if (d instanceof Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
    var s = String(d).slice(0, 10).split('-'); return new Date(+s[0], (+s[1]) - 1, +s[2]);
  }
  function daysBetween(a, b) { return Math.round((toDate(b) - toDate(a)) / DAY); }
  function ageOn(dob, on) {
    var b = toDate(dob), o = toDate(on || new Date());
    var years = o.getFullYear() - b.getFullYear();
    var m = o.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && o.getDate() < b.getDate())) { years--; }
    // months/days remainder
    var months = m < 0 ? m + 12 : m;
    if (o.getDate() < b.getDate()) { months = (months + 11) % 12; }
    var anchor = new Date(o.getFullYear(), o.getMonth() - (o.getDate() < b.getDate() ? 1 : 0), b.getDate());
    var days = Math.round((o - anchor) / DAY);
    return { years: years, months: months, days: days, totalDays: daysBetween(b, o) };
  }
  function addDays(d, n) { var x = toDate(d); x.setDate(x.getDate() + n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }

  // ---- unit conversion ------------------------------------------------------
  // base units: length=metre, mass=kg, volume=litre, speed=m/s, data=byte
  var FACTORS = {
    length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254, nmi: 1852 },
    mass: { kg: 1, g: 0.001, mg: 0.000001, t: 1000, lb: 0.45359237, oz: 0.028349523125, st: 6.35029318 },
    volume: { l: 1, ml: 0.001, m3: 1000, gal: 3.785411784, qt: 0.946352946, pt: 0.473176473, cup: 0.2365882365, floz: 0.0295735295625 },
    speed: { 'm/s': 1, 'km/h': 0.2777777778, mph: 0.44704, knot: 0.5144444444, 'ft/s': 0.3048 },
    data: { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 }
  };
  function convert(category, value, from, to) {
    var f = FACTORS[category];
    if (!f || f[from] == null || f[to] == null) { return null; }
    return round(value * f[from] / f[to], 6);
  }
  function convertTemp(value, from, to) {
    var c; from = from.toUpperCase(); to = to.toUpperCase();
    if (from === 'C') { c = value; } else if (from === 'F') { c = (value - 32) * 5 / 9; } else if (from === 'K') { c = value - 273.15; } else { return null; }
    if (to === 'C') { return round(c, 4); } if (to === 'F') { return round(c * 9 / 5 + 32, 4); } if (to === 'K') { return round(c + 273.15, 4); }
    return null;
  }

  return {
    round: round,
    percentOf: percentOf, whatPercent: whatPercent, percentChange: percentChange,
    tip: tip, bmi: bmi, loanMonthlyPayment: loanMonthlyPayment,
    daysBetween: daysBetween, ageOn: ageOn, addDays: addDays,
    convert: convert, convertTemp: convertTemp,
    FACTORS: FACTORS
  };
});
