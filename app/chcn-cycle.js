/* =============================================================================
 * Creator Hub Creator Network — CycleCalculationService (spec §29)
 * -----------------------------------------------------------------------------
 * Menstrual-cycle math. Pure & deterministic; no DOM. Node-testable.
 *
 * Design rules honoured:
 *   - NO hard-coded universal 28-day cycle.
 *   - NO hard-coded ovulation = day 14. Ovulation is estimated as
 *     (cycle length - luteal phase); luteal phase is a disclosed parameter.
 *   - Estimates carry confidence + ranges. Irregular data widens ranges.
 *   - Never returns "guaranteed safe/infertile".
 * ========================================================================== */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
  if (typeof window !== 'undefined') { window.CHCN = window.CHCN || {}; window.CHCN.Cycle = api; }
})(this, function () {
  'use strict';

  var DAY = 86400000;
  var DEFAULT_LUTEAL = 14; // disclosed assumption, not applied as "day 14 for all"

  function toDate(d) {
    if (d instanceof Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
    var s = String(d).slice(0, 10).split('-');
    return new Date(+s[0], (+s[1]) - 1, +s[2]);
  }
  function iso(d) {
    var x = toDate(d);
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  }
  function daysBetween(a, b) { return Math.round((toDate(b) - toDate(a)) / DAY); }
  function addDays(d, n) { var x = toDate(d); x.setDate(x.getDate() + n); return x; }

  // periodStarts: array of period start dates (any order). Returns sorted cycle lengths (days).
  function cycleLengths(periodStarts) {
    var s = (periodStarts || []).map(toDate).sort(function (a, b) { return a - b; });
    var out = [];
    for (var i = 1; i < s.length; i++) {
      var len = daysBetween(s[i - 1], s[i]);
      if (len > 0 && len < 200) { out.push(len); } // ignore impossible gaps
    }
    return out;
  }

  function mean(arr) { return arr.length ? arr.reduce(function (a, b) { return a + b; }, 0) / arr.length : 0; }

  function stats(periodStarts) {
    var lens = cycleLengths(periodStarts);
    if (!lens.length) {
      return { count: 0, average: null, shortest: null, longest: null, variability: null, regular: null, lengths: [] };
    }
    var avg = Math.round(mean(lens));
    var shortest = Math.min.apply(null, lens);
    var longest = Math.max.apply(null, lens);
    var variability = longest - shortest;
    // "regular" heuristic: variation of 7 days or less across recorded cycles
    var regular = variability <= 7;
    return { count: lens.length, average: avg, shortest: shortest, longest: longest, variability: variability, regular: regular, lengths: lens };
  }

  // Weight recent cycles a little more heavily than old ones.
  function weightedAverage(lens) {
    if (!lens.length) { return null; }
    var num = 0, den = 0;
    for (var i = 0; i < lens.length; i++) { var w = i + 1; num += lens[i] * w; den += w; }
    return num / den;
  }

  // opts: { typicalLength, shortest, longest, luteal, irregular }
  function resolveLength(periodStarts, opts) {
    opts = opts || {};
    var lens = cycleLengths(periodStarts);
    if (lens.length >= 2) { return { value: Math.round(weightedAverage(lens)), source: 'history' }; }
    if (lens.length === 1) { return { value: lens[0], source: 'single-cycle' }; }
    if (opts.typicalLength) { return { value: Math.round(opts.typicalLength), source: 'user-typical' }; }
    return { value: null, source: 'insufficient' };
  }

  function confidence(periodStarts, opts) {
    var st = stats(periodStarts);
    if (opts && opts.irregular) { return 'low'; }
    if (st.count >= 3 && st.variability <= 4) { return 'high'; }
    if (st.count >= 2 && st.variability <= 9) { return 'medium'; }
    if (st.count >= 1 || (opts && opts.typicalLength)) { return 'low'; }
    return 'none';
  }

  // Predict next period start. Returns { date, rangeStart, rangeEnd, confidence, source } or null.
  function predictNextPeriod(periodStarts, opts) {
    opts = opts || {};
    var starts = (periodStarts || []).map(toDate).sort(function (a, b) { return a - b; });
    var last = starts.length ? starts[starts.length - 1] : (opts.lastPeriodStart ? toDate(opts.lastPeriodStart) : null);
    if (!last) { return null; }
    var L = resolveLength(periodStarts, opts);
    if (L.value == null) { return { date: null, rangeStart: null, rangeEnd: null, confidence: 'none', source: 'insufficient' }; }
    var st = stats(periodStarts);
    var lo = (st.shortest != null) ? st.shortest : (opts.shortest || L.value - 3);
    var hi = (st.longest != null) ? st.longest : (opts.longest || L.value + 3);
    return {
      date: iso(addDays(last, L.value)),
      rangeStart: iso(addDays(last, Math.min(lo, L.value))),
      rangeEnd: iso(addDays(last, Math.max(hi, L.value))),
      confidence: confidence(periodStarts, opts),
      source: L.source
    };
  }

  // Estimate fertile window + ovulation for the cycle beginning at cycleStart.
  // Returns labelled ranges. Never returns "safe" days.
  function fertileWindow(cycleStart, periodStarts, opts) {
    opts = opts || {};
    var luteal = opts.luteal || DEFAULT_LUTEAL;
    var L = resolveLength(periodStarts, opts);
    if (!cycleStart || L.value == null) {
      return { insufficient: true, note: 'Insufficient data to estimate a fertile window.' };
    }
    var st = stats(periodStarts);
    var ovDay = L.value - luteal; // cycle day of estimated ovulation (1-indexed-ish)
    // range from shortest/longest cycles
    var shortest = (st.shortest != null) ? st.shortest : L.value;
    var longest = (st.longest != null) ? st.longest : L.value;
    var ovEarliest = shortest - luteal;
    var ovLatest = longest - luteal;
    // fertile window: 5 days before ovulation through 1 day after (sperm survival + ovum)
    return {
      insufficient: false,
      ovulationEstimateDay: ovDay,
      ovulationDate: iso(addDays(cycleStart, ovDay - 1)),
      ovulationWindowStart: iso(addDays(cycleStart, ovEarliest - 1)),
      ovulationWindowEnd: iso(addDays(cycleStart, ovLatest - 1)),
      fertileStart: iso(addDays(cycleStart, ovEarliest - 1 - 5)),
      fertileEnd: iso(addDays(cycleStart, ovLatest - 1 + 1)),
      lutealAssumed: luteal,
      confidence: confidence(periodStarts, opts),
      note: 'Estimated fertile window. Ovulation timing varies; this cannot confirm ovulation.'
    };
  }

  function currentCycleDay(lastPeriodStart, today) {
    if (!lastPeriodStart) { return null; }
    var d = daysBetween(lastPeriodStart, today || new Date());
    return d >= 0 ? d + 1 : null; // first day of period = cycle day 1
  }

  function cyclePhase(cycleDay, avgLength, opts) {
    if (cycleDay == null || !avgLength) { return 'unknown'; }
    var luteal = (opts && opts.luteal) || DEFAULT_LUTEAL;
    var ov = avgLength - luteal;
    if (cycleDay <= 5) { return 'menstrual'; }
    if (cycleDay < ov - 1) { return 'follicular'; }
    if (cycleDay <= ov + 1) { return 'ovulation (estimated)'; }
    return 'luteal';
  }

  // Neutral observations (NOT diagnoses).
  function observations(periodStarts, opts) {
    var st = stats(periodStarts);
    var out = [];
    if (st.count >= 2) {
      if (st.variability > 9) { out.push('Cycle length varies by more than 9 days across your records — this is a tracking observation, not a medical diagnosis.'); }
      if (st.shortest < 21) { out.push('One or more recorded cycles were shorter than 21 days — a tracking observation, not a diagnosis.'); }
      if (st.longest > 35) { out.push('One or more recorded cycles were longer than 35 days — a tracking observation, not a diagnosis.'); }
    }
    return out;
  }

  return {
    DEFAULT_LUTEAL: DEFAULT_LUTEAL,
    iso: iso, daysBetween: daysBetween, addDays: function (d, n) { return iso(addDays(d, n)); },
    cycleLengths: cycleLengths, stats: stats, weightedAverage: weightedAverage,
    resolveLength: resolveLength, confidence: confidence,
    predictNextPeriod: predictNextPeriod, fertileWindow: fertileWindow,
    currentCycleDay: currentCycleDay, cyclePhase: cyclePhase, observations: observations
  };
});
