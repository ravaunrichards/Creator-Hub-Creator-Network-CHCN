/* ============================================================================
 * CHCN Course Content Integrity Engine (v52) — ADDITIVE
 * ----------------------------------------------------------------------------
 * Adds what the existing course-integrity.js does NOT provide:
 *   (1) a numeric PER-COURSE MATCH SCORE (how well each course's lesson
 *       content matches its own category/domain), and
 *   (2) a real CROSS-COURSE CONTAMINATION SCAN (does a course contain lessons
 *       that actually belong to a different course/category?), plus duplicate
 *       lesson-title detection across unrelated categories.
 *   (3) an admin dashboard + exportable report.
 * It never mutates COURSE_DATA/NEW_COURSES and does not replace the existing
 * validator — both can run side by side. Works in-browser and headless (Node).
 * ========================================================================= */
(function (root) {
  'use strict';

  // ---- generic words that carry no category signal ----
  var STOP = ('a an the and or of to for in on with at by from into out up as is are be being been this that these those your you we they it its '
    + 'use using used apply applied applying perform performing basic intro introduction fundamentals principles overview module unit lesson course '
    + 'level beginner intermediate advanced practical practice skills skill work working workplace procedure procedures process safe safety '
    + 'professional conduct quality system systems operation operations manage management maintain maintenance identify identifying prepare '
    + 'preparation support communication communicate record records report reporting')
    .split(/\s+/).reduce(function (o, w) { o[w] = 1; return o; }, {});

  function norm(s) { return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }

  // Cross-cutting employability/foundation units are EXPECTED to appear in many
  // TVET courses (competency-based curricula share them). They are NOT
  // contamination and must not be flagged as cross-course leaks.
  var GENERIC_PATTERNS = [
    /occupational health and safety|health and safety|workplace safety|first aid|fire safety|emergency/,
    /professional|ethic|workplace relationship|teamwork|work in a team|communicat/,
    /customer service|customer care|quality (service|customer)/,
    /sustainab|environment|green practice|energy efficien/,
    /numeracy|literacy|basic math|calculation|measurement/,
    /job|career|employ|entrepreneur|business plan|interview|resume|cv/,
    /information technology (basics|skills)|basic computer|digital literacy/
  ];
  function isGeneric(title) {
    var t = norm(title);
    return GENERIC_PATTERNS.some(function (rx) { return rx.test(t); });
  }
  function toks(s) {
    return norm(s).split(' ').filter(function (w) { return w.length >= 3 && !STOP[w]; });
  }
  function allCourses() {
    var o = {};
    try { Object.assign(o, root.COURSE_DATA || {}); } catch (e) {}
    try { Object.assign(o, root.NEW_COURSES || {}); } catch (e) {}
    return o;
  }
  function lessonTitles(c) {
    var out = [];
    (c.modules || []).forEach(function (m) {
      (m.lessons || []).forEach(function (l) {
        if (l && l.title && l.type !== 'gate' && l.type !== 'quiz') out.push(l.title);
      });
    });
    return out;
  }

  /* -------- build distinctive vocabulary per CATEGORY --------
     For every category, aggregate token frequency from its courses'
     names + descriptions + lesson titles. Then down-weight tokens that are
     common across many categories (document-frequency), keeping each
     category's DISTINCTIVE terms. */
  function buildModel(courses) {
    var ids = Object.keys(courses);
    var catTokens = {};   // cat -> {token: weightedCount}
    var catList = {};      // cat -> [ids]
    var tokenCats = {};    // token -> set of cats (document frequency)
    ids.forEach(function (id) {
      var c = courses[id], cat = c.cat || 'General';
      catList[cat] = catList[cat] || [];
      catList[cat].push(id);
      var bag = catTokens[cat] = catTokens[cat] || {};
      var seenHere = {};
      // category label + course name weigh more; desc + lessons add body
      var sources = [].concat(
        [cat, cat, cat], [c.name, c.name], [c.desc || ''], lessonTitles(c)
      );
      sources.forEach(function (txt) {
        toks(txt).forEach(function (w) {
          bag[w] = (bag[w] || 0) + 1;
          seenHere[w] = 1;
        });
      });
      Object.keys(seenHere).forEach(function (w) {
        (tokenCats[w] = tokenCats[w] || {})[cat] = 1;
      });
    });
    var catCount = Object.keys(catList).length;
    // idf-like distinctiveness: tokens in few categories are distinctive
    var distinct = {}; // cat -> {token: score}
    Object.keys(catTokens).forEach(function (cat) {
      var bag = catTokens[cat], d = distinct[cat] = {};
      Object.keys(bag).forEach(function (w) {
        var df = Object.keys(tokenCats[w] || {}).length || 1;
        if (df >= Math.max(2, catCount * 0.6)) return; // too common -> drop
        d[w] = bag[w] * (Math.log(catCount / df) + 0.1);
      });
    });
    return { catList: catList, distinct: distinct, catCount: catCount };
  }

  // score a bag of tokens against one category's distinctive vocab
  function scoreAgainst(tokens, dist) {
    if (!tokens.length) return 0;
    var hit = 0, total = 0;
    tokens.forEach(function (w) {
      total += 1;
      if (dist[w]) hit += Math.min(1, dist[w]); // cap per-token contribution
    });
    return total ? hit / total : 0;
  }

  // classify one lesson title -> best matching category + margin
  function classify(title, model, ownCat) {
    var tk = toks(title);
    var best = null, bestScore = -1, own = 0;
    Object.keys(model.distinct).forEach(function (cat) {
      var s = scoreAgainst(tk, model.distinct[cat]);
      if (cat === ownCat) own = s;
      if (s > bestScore) { bestScore = s; best = cat; }
    });
    return { tokens: tk, best: best, bestScore: bestScore, own: own };
  }

  /* -------- audit one course --------
     matchScore (0-100) = mean on-domain ratio of its lessons.
     contamination = lessons whose BEST category is a foreign one with a clear
     margin over the course's own category (and non-trivial signal). */
  function auditCourse(id, courses, model) {
    var c = courses[id], ownCat = c.cat || 'General';
    var titles = lessonTitles(c);
    var perLesson = [], sum = 0, scored = 0, offenders = [];
    titles.forEach(function (t) {
      var r = classify(t, model, ownCat);
      if (r.tokens.length === 0) return; // no usable signal, skip
      scored += 1;
      sum += r.own;
      perLesson.push({ title: t, own: +(r.own).toFixed(3), best: r.best, bestScore: +(r.bestScore).toFixed(3) });
      // contamination: belongs more to another category
      if (!isGeneric(t) && r.best && r.best !== ownCat && r.bestScore >= 0.18 && (r.bestScore - r.own) >= 0.12) {
        offenders.push({ title: t, belongsTo: r.best, foreignScore: +(r.bestScore).toFixed(3), ownScore: +(r.own).toFixed(3) });
      }
    });
    var matchScore = scored ? Math.round((sum / scored) * 100) : 0;
    // rescale: on-domain ratios are small by nature; normalise by the
    // category's own self-match ceiling so scores are interpretable.
    var ceiling = model._ceiling && model._ceiling[ownCat] ? model._ceiling[ownCat] : 1;
    var normScore = ceiling > 0 ? Math.min(100, Math.round((sum / Math.max(1, scored)) / ceiling * 100)) : matchScore;
    var status = normScore >= 75 ? 'PASS' : (normScore >= 50 ? 'WARN' : 'FAIL');
    if (offenders.length && status === 'PASS') status = 'WARN';
    if (offenders.length >= Math.max(2, Math.ceil(scored * 0.15))) status = 'FAIL';
    return {
      courseId: id, course: c.name, category: ownCat,
      lessonsScored: scored, matchScore: normScore, rawMatch: matchScore,
      status: status, contamination: offenders, perLesson: perLesson
    };
  }

  // compute each category's self-match ceiling (mean own-score of its lessons)
  function computeCeilings(courses, model) {
    var acc = {}, cnt = {};
    Object.keys(courses).forEach(function (id) {
      var c = courses[id], cat = c.cat || 'General';
      lessonTitles(c).forEach(function (t) {
        var r = classify(t, model, cat);
        if (!r.tokens.length) return;
        acc[cat] = (acc[cat] || 0) + r.own;
        cnt[cat] = (cnt[cat] || 0) + 1;
      });
    });
    var ceil = {};
    Object.keys(acc).forEach(function (cat) { ceil[cat] = cnt[cat] ? acc[cat] / cnt[cat] : 1; });
    return ceil;
  }

  // duplicate lesson titles across DIFFERENT categories (true cross-course leak)
  function duplicateScan(courses) {
    var map = {}; // normalized title -> [{id,cat}]
    Object.keys(courses).forEach(function (id) {
      var c = courses[id], cat = c.cat || 'General';
      lessonTitles(c).forEach(function (t) {
        var key = norm(t);
        if (key.split(' ').length < 2) return; // ignore 1-word titles
        if (isGeneric(t)) return;              // shared employability units are expected
        (map[key] = map[key] || []).push({ id: id, cat: cat, title: t });
      });
    });
    var dups = [];
    Object.keys(map).forEach(function (k) {
      var cats = {}; map[k].forEach(function (e) { cats[e.cat] = 1; });
      if (map[k].length > 1 && Object.keys(cats).length > 1) {
        dups.push({ title: map[k][0].title, courses: map[k].map(function (e) { return e.id + ' [' + e.cat + ']'; }) });
      }
    });
    return dups;
  }

  function audit() {
    var courses = allCourses();
    var model = buildModel(courses);
    model._ceiling = computeCeilings(courses, model);
    var reports = Object.keys(courses).map(function (id) { return auditCourse(id, courses, model); });
    var dups = duplicateScan(courses);
    var pass = reports.filter(function (r) { return r.status === 'PASS'; }).length;
    var warn = reports.filter(function (r) { return r.status === 'WARN'; }).length;
    var fail = reports.filter(function (r) { return r.status === 'FAIL'; }).length;
    var contaminated = reports.filter(function (r) { return r.contamination.length; });
    return {
      generatedAt: new Date().toISOString(),
      totalCourses: reports.length,
      summary: { pass: pass, warn: warn, fail: fail },
      avgMatchScore: reports.length ? Math.round(reports.reduce(function (a, r) { return a + r.matchScore; }, 0) / reports.length) : 0,
      crossCourseDuplicates: dups,
      contaminatedCourses: contaminated.length,
      reports: reports
    };
  }

  // ---------- admin dashboard (browser) ----------
  function escH(s){var d=document.createElement('div');d.textContent=s==null?'':String(s);return d.innerHTML;}
  function badge(st){var c=st==='PASS'?'#176b2c':(st==='WARN'?'#9a6700':'#9b1c1c');var b=st==='PASS'?'#e6f4ea':(st==='WARN'?'#fff4d6':'#fdecea');return '<span style="background:'+b+';color:'+c+';padding:2px 8px;border-radius:999px;font-size:12px;font-weight:600">'+st+'</span>';}
  function bar(v){var c=v>=75?'#176b2c':(v>=50?'#9a6700':'#9b1c1c');return '<div style="background:#eef2f7;border-radius:6px;height:8px;overflow:hidden;min-width:90px"><div style="width:'+v+'%;height:100%;background:'+c+'"></div></div>';}
  function renderDashboard(rep){
    rep=rep||audit();
    var h='<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px">'+
      '<div style="flex:1;min-width:120px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:12px"><div style="font-size:24px;font-weight:700">'+rep.totalCourses+'</div><div style="color:#64748b;font-size:12px">Courses scanned</div></div>'+
      '<div style="flex:1;min-width:120px;background:#e6f4ea;border:1px solid #b7d8bd;border-radius:10px;padding:12px"><div style="font-size:24px;font-weight:700;color:#176b2c">'+rep.summary.pass+'</div><div style="color:#176b2c;font-size:12px">PASS</div></div>'+
      '<div style="flex:1;min-width:120px;background:#fff4d6;border:1px solid #e7d08a;border-radius:10px;padding:12px"><div style="font-size:24px;font-weight:700;color:#9a6700">'+rep.summary.warn+'</div><div style="color:#9a6700;font-size:12px">WARN</div></div>'+
      '<div style="flex:1;min-width:120px;background:#fdecea;border:1px solid #e7b0b0;border-radius:10px;padding:12px"><div style="font-size:24px;font-weight:700;color:#9b1c1c">'+rep.summary.fail+'</div><div style="color:#9b1c1c;font-size:12px">FAIL</div></div>'+
      '<div style="flex:1;min-width:120px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:12px"><div style="font-size:24px;font-weight:700">'+rep.avgMatchScore+'%</div><div style="color:#64748b;font-size:12px">Avg match score</div></div></div>';
    h+='<p style="color:#64748b;font-size:12px;margin:0 0 10px">Each course is scored for how well its lesson content matches its own category, and scanned for lessons that look like they belong to another course/category. Shared employability units (safety, professionalism, numeracy, etc.) are expected across courses and are not flagged.</p>';
    h+='<table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="text-align:left;border-bottom:2px solid #e5e7eb"><th style="padding:6px">Course</th><th>Category</th><th>Match</th><th>Status</th><th>Cross-course items</th></tr></thead><tbody>';
    rep.reports.slice().sort(function(a,b){return a.matchScore-b.matchScore;}).forEach(function(r){
      h+='<tr style="border-bottom:1px solid #eef2f7"><td style="padding:6px">'+escH(r.course)+'</td><td>'+escH(r.category)+'</td>'+
        '<td style="display:flex;gap:6px;align-items:center">'+bar(r.matchScore)+'<span>'+r.matchScore+'%</span></td><td>'+badge(r.status)+'</td>'+
        '<td>'+(r.contamination.length?('<details><summary>'+r.contamination.length+' flagged</summary><ul style="margin:4px 0;padding-left:16px">'+r.contamination.map(function(c){return '<li>'+escH(c.title)+' <span style="color:#9a6700">\u2192 looks like '+escH(c.belongsTo)+'</span></li>';}).join('')+'</ul></details>'):'<span style="color:#176b2c">clean</span>')+'</td></tr>';
    });
    h+='</tbody></table>';
    if(rep.crossCourseDuplicates.length){
      h+='<h3 style="margin-top:18px">Identical lesson titles shared across different categories ('+rep.crossCourseDuplicates.length+')</h3>';
      h+='<p style="color:#64748b;font-size:12px">These are non-generic lesson titles that appear verbatim in courses from different categories. Review whether each is a legitimately shared competency or an accidental copy.</p>';
      h+='<ul style="font-size:13px">'+rep.crossCourseDuplicates.slice(0,40).map(function(d){return '<li><strong>'+escH(d.title)+'</strong> \u2014 '+escH(d.courses.join(', '))+'</li>';}).join('')+'</ul>';
    }
    return h;
  }
  function exportReport(){
    try{var rep=audit();var blob=new Blob([JSON.stringify(rep,null,2)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='chcn-content-integrity-report.json';document.body.appendChild(a);a.click();document.body.removeChild(a);}catch(e){}
  }
  function injectPanel(){
    if(typeof document==='undefined')return;
    var u=(typeof getUser==='function')?getUser():null;
    if(!(root.COURSE_ADMIN_MODE===true||(u&&u.role==='admin')))return;
    if(document.getElementById('chcn-integrity-panel'))return;
    var host=document.getElementById('page-account')||document.getElementById('page-tools')||document.body;
    var p=document.createElement('section');p.id='chcn-integrity-panel';
    p.style.cssText='margin:24px auto;max-width:1100px;padding:20px;background:#fff;border:1px solid #e5e7eb;border-radius:12px';
    p.innerHTML='<div style="display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap"><div><h2 style="margin:0">Content Integrity &amp; Contamination Scan</h2><p style="margin:4px 0;color:#64748b">Per-course match score + cross-course contamination report.</p></div><div style="display:flex;gap:8px"><button class="btn btn-primary" id="chcn-int-run">Run scan</button><button class="btn btn-outline" id="chcn-int-export">Export JSON</button></div></div><div id="chcn-int-results" style="margin-top:16px"></div>';
    host.appendChild(p);
    document.getElementById('chcn-int-run').onclick=function(){document.getElementById('chcn-int-results').innerHTML=renderDashboard();};
    document.getElementById('chcn-int-export').onclick=exportReport;
  }
  if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(injectPanel,600);});else setTimeout(injectPanel,600);
  }

  root.CHCN_integrity = root.CHCN_integrity || {};
  root.CHCN_integrity.audit = audit;
  root.CHCN_integrity.renderDashboard = renderDashboard;
  root.CHCN_integrity.exportReport = exportReport;
  root.CHCN_integrity.auditCourse = function (id) {
    var c = allCourses(), m = buildModel(c); m._ceiling = computeCeilings(c, m);
    return auditCourse(id, c, m);
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.CHCN_integrity;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
