/* ===== Creator Hub Creator Network — completeness patch (v25) =====
   Loaded LAST, after every other course script.
   - Reviews: REAL learner submissions only (no seeded/fake reviews).
   - Certificate: in-app modal (view / print / download), auto-awarded on
     completion, recipient defaults to the profile name or "Learner Name",
     and every course has a viewable sample certificate.
   - Profile: editable email, phone (any country), full home address,
     gender, marital status, relationship type, deactivate / reactivate.
   - Single-open guard so external links (TikTok / donate) open ONE window.
   - Location: only auto-locate when permission was already granted.
   Purely additive — does not replace core app logic destructively. */
(function () {
  'use strict';

  // ---- Single-open guard: dedupe rapid identical window.open calls ----
  (function () {
    var _open = window.open;
    var last = { u: null, t: 0, win: null };
    window.open = function (u) {
      var now = Date.now();
      if (u && u === last.u && (now - last.t) < 1500) { return last.win || null; }
      last.u = u; last.t = now;
      var w = _open.apply(window, arguments);
      last.win = w; return w;
    };
  })();

  function esc(s) {
    if (typeof escapeHtml === 'function') return escapeHtml(s);
    var d = document.createElement('div'); d.textContent = String(s == null ? '' : s); return d.innerHTML;
  }
  function tok(k) { return String(k).replace(/[^a-z0-9]/gi, '_'); }
  function getUserSafe() { try { return (typeof getUser === 'function') ? getUser() : null; } catch (e) { return null; } }

  // ---- Built-in course registry (short id + tab prefix + names) ----
  var COURSES = [
    { page: 'course-level1', short: 'level1', pfx: 'lvl1', name: 'Level 1 Security Officer Training', cert: 'Certified Professional Security Officer (CPSO)', code: 'CPSO' },
    { page: 'course-assessment', short: 'assessment', pfx: 'assess', name: 'Same Day Security Assessment', cert: 'CSO-1 Certificate', code: 'CSO-1' },
    { page: 'course-senior', short: 'senior', pfx: 'senior', name: 'AISS-S Senior Supervisor', cert: 'Advanced Security Operations Specialist (ASOS)', code: 'ASOS' },
    { page: 'course-junior', short: 'junior', pfx: 'junior', name: 'AISS-J Junior Supervisor', cert: 'Advanced Professional Security Officer (APSO)', code: 'APSO' },
    { page: 'course-driver-beginner', short: 'drvb', pfx: 'drvb', name: "Driver's Course — Beginner", cert: 'Certified Driver — Beginner Level (CDL-B)', code: 'CDL-B' },
    { page: 'course-driver-intermediate', short: 'drvi', pfx: 'drvi', name: "Driver's Course — Intermediate", cert: 'Certified Driver — Intermediate Level (CDL-I)', code: 'CDL-I' },
    { page: 'course-driver-advanced', short: 'drva', pfx: 'drva', name: "Driver's Course — Advanced", cert: 'Certified Driver — Advanced Level (CDL-A)', code: 'CDL-A' }
  ];
  var BY_PAGE = {}; COURSES.forEach(function (c) { BY_PAGE[c.page] = c; });

  // ================= REVIEWS (real learner submissions only) =================
  function loadStore() { try { return JSON.parse(localStorage.getItem('chcn_reviews')) || {}; } catch (e) { return {}; } }
  function saveStore(o) { try { localStorage.setItem('chcn_reviews', JSON.stringify(o)); } catch (e) {} }
  function userReviews(key) { var s = loadStore(); return Array.isArray(s[key]) ? s[key] : []; }
  function stars(n) { n = Math.max(0, Math.min(5, Math.round(n))); return '\u2605'.repeat(n) + '\u2606'.repeat(5 - n); }
  var CTX = {};

  function reviewsHtml(key) {
    var list = userReviews(key);
    var t = tok(key);
    var h = '';
    if (list.length) {
      var avg = list.reduce(function (a, r) { return a + (r.s || 0); }, 0) / list.length;
      h += '<div class="chcn-rev-summary"><div class="chcn-rev-score">';
      h += '<span class="chcn-rev-num">' + avg.toFixed(1) + '</span>';
      h += '<span class="chcn-rev-stars">' + stars(avg) + '</span>';
      h += '<span class="chcn-rev-count">' + list.length + ' review' + (list.length !== 1 ? 's' : '') + '</span></div></div>';
      h += '<div class="chcn-rev-list">';
      list.forEach(function (r) {
        h += '<div class="chcn-rev-item"><div class="chcn-rev-head"><span class="chcn-rev-name">' + esc(r.n) + '</span>';
        h += '<span class="chcn-rev-date">' + esc(r.d || '') + '</span></div>';
        h += '<div class="chcn-rev-istars">' + stars(r.s) + '</div>';
        h += '<p class="chcn-rev-text">' + esc(r.t) + '</p></div>';
      });
      h += '</div>';
    } else {
      h += '<div class="review-empty" style="padding:18px;color:#666;">No learner reviews have been published for this programme yet. Be the first to share your experience.</div>';
    }
    h += '<div class="chcn-rev-form"><h4>Leave a review</h4>';
    h += '<div class="chcn-rev-row"><input type="text" id="chcnRevName-' + t + '" placeholder="Your name">';
    h += '<select id="chcnRevStars-' + t + '"><option value="5">\u2605\u2605\u2605\u2605\u2605 (5)</option><option value="4">\u2605\u2605\u2605\u2605 (4)</option><option value="3">\u2605\u2605\u2605 (3)</option><option value="2">\u2605\u2605 (2)</option><option value="1">\u2605 (1)</option></select></div>';
    h += '<textarea id="chcnRevText-' + t + '" rows="3" placeholder="Share your experience with this course"></textarea>';
    h += '<button class="btn btn-primary btn-sm" onclick="chcnSubmitReview(\'' + esc(key).replace(/'/g, "\\'") + '\')">Submit review</button></div>';
    return h;
  }

  function renderReviews(key) {
    var ctx = CTX[key]; if (!ctx) return;
    var el = document.getElementById(ctx.containerId);
    if (el) el.innerHTML = reviewsHtml(key);
  }

  window.chcnSubmitReview = function (key) {
    var t = tok(key);
    var nameEl = document.getElementById('chcnRevName-' + t);
    var starEl = document.getElementById('chcnRevStars-' + t);
    var textEl = document.getElementById('chcnRevText-' + t);
    var u = getUserSafe();
    var name = (nameEl && nameEl.value.trim()) || (u && u.name) || '';
    var text = textEl ? textEl.value.trim() : '';
    if (!name) { if (typeof showToast === 'function') showToast('Please add your name', true); return; }
    if (!text) { if (typeof showToast === 'function') showToast('Please write your review', true); return; }
    var store = loadStore();
    if (!Array.isArray(store[key])) store[key] = [];
    store[key].unshift({ n: name, s: parseInt(starEl ? starEl.value : '5', 10) || 5, d: new Date().toISOString().slice(0, 10), t: text });
    saveStore(store);
    renderReviews(key);
    if (typeof showToast === 'function') showToast('Thanks! Your review was posted.');
  };

  function fillBuiltinReviews(page) {
    var c = BY_PAGE[page]; if (!c) return;
    CTX[c.short] = { containerId: c.pfx + '-reviews-content' };
    renderReviews(c.short);
  }
  function fillCatalogueReviews() {
    var id = window.currentCourseView; if (!id) return;
    var el = document.getElementById('cv-rev'); if (!el) return;
    CTX[id] = { containerId: 'cv-rev' };
    el.innerHTML = reviewsHtml(id);
  }
  // ================= CERTIFICATE (in-app view / print / download) =================
  function fmtDate(d) {
    try { return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch (e) { return d.toDateString(); }
  }
  function recipientDefault() {
    var u = getUserSafe();
    if (u && u.name && u.name.trim()) return u.name.trim();
    var saved = '';
    try { saved = localStorage.getItem('chcn_cert_recipient') || ''; } catch (e) {}
    return saved.trim() || 'Learner Name';
  }
  function certDoc(data, name, dateStr, specimen) {
    var wm = specimen ? '<div class="wm">SPECIMEN</div>' : '';
    var note = specimen
      ? '<div class="note">This is a preview specimen. Your personalised certificate is issued after you complete the programme and pass the final assessment.</div>'
      : '';
    var idLine = specimen ? '' : '<div class="cert-id">Certificate ID: CHCN-' + esc(data.cert) + '-' + Date.now().toString(36).toUpperCase() + '</div>';
    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Certificate — ' + esc(data.cert) + '</title>' +
      '<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Georgia,"Times New Roman",serif;background:#f5f5f5;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;}' +
      '.cert{background:#fff;border:8px double #c9a84c;padding:44px 54px;max-width:820px;width:100%;text-align:center;position:relative;box-shadow:0 4px 20px rgba(0,0,0,.15);}' +
      '.cert::before{content:"";position:absolute;top:15px;left:15px;right:15px;bottom:15px;border:2px solid #c9a84c;pointer-events:none;}' +
      '.wm{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-25deg);font-size:92px;color:rgba(201,168,76,.12);font-weight:bold;letter-spacing:8px;pointer-events:none;}' +
      '.logo{width:78px;height:78px;border-radius:12px;margin:0 auto 14px;overflow:hidden;}.logo img{width:100%;height:100%;object-fit:cover;}' +
      '.title{font-size:13px;letter-spacing:6px;text-transform:uppercase;color:#888;}.heading{font-size:34px;font-weight:bold;color:#1a1a2e;margin:6px 0;}' +
      '.cert-type{font-size:19px;color:#c9a84c;font-weight:bold;margin-bottom:20px;}.recipient{font-size:17px;color:#666;}' +
      '.name{font-size:31px;font-weight:bold;color:#1a1a2e;border-bottom:2px solid #c9a84c;display:inline-block;padding-bottom:5px;margin:8px 0 16px;}' +
      '.body-text{font-size:15px;color:#555;line-height:1.8;margin:16px 0;}.signatures{display:flex;justify-content:space-around;margin-top:38px;}' +
      '.sig-line{width:180px;border-top:1px solid #333;margin:0 auto 5px;}.sig-name{font-size:14px;font-weight:bold;color:#1a1a2e;}.sig-title{font-size:12px;color:#888;}' +
      '.date{font-size:13px;color:#888;margin-top:18px;}.cert-id{font-size:11px;color:#aaa;margin-top:8px;}.note{font-size:12px;color:#b8860b;margin-top:10px;}' +
      '.print-btn{margin-top:24px;background:#1a1a2e;color:#fff;border:none;padding:12px 30px;border-radius:8px;font-size:14px;cursor:pointer;}' +
      '@media print{.print-btn{display:none;}body{background:#fff;padding:0;}.cert{box-shadow:none;}}</style></head>' +
      '<body><div class="cert">' + wm + '<div class="logo"><img src="icon.png" alt="CHCN"></div>' +
      '<div class="title">Creator Hub Creator Network</div><div class="heading">Certificate of Completion</div>' +
      '<div class="cert-type">' + esc(data.cert) + '</div><div class="recipient">This is to certify that</div>' +
      '<div class="name">' + esc(name) + '</div>' +
      '<div class="body-text">has successfully completed the <strong>' + esc(data.name) + '</strong> programme and is hereby awarded the designation of<br><strong>' + esc(data.certFull || data.cert) + '</strong></div>' +
      '<div class="signatures"><div><div class="sig-line"></div><div class="sig-name">Ravaun Richards</div><div class="sig-title">Founder &amp; Lead Instructor</div></div>' +
      '<div><div class="sig-line"></div><div class="sig-name">Creator Hub Creator Network</div><div class="sig-title">Training Academy</div></div></div>' +
      '<div class="date">Issued: ' + esc(dateStr) + '</div>' + idLine + note +
      '<button class="print-btn" onclick="window.print()">\uD83D\uDDA8 Print Certificate</button></div></body></html>';
  }

  function iframePrint(doc) {
    var f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    f.srcdoc = doc;
    document.body.appendChild(f);
    var done = false;
    function go() {
      if (done) return; done = true;
      try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) {}
      setTimeout(function () { try { document.body.removeChild(f); } catch (e) {} }, 2000);
    }
    f.onload = function () { setTimeout(go, 250); };
    setTimeout(go, 900);
  }
  function downloadDoc(doc, fname) {
    try {
      var blob = new Blob([doc], { type: 'text/html' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a'); a.href = url; a.download = fname; a.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    } catch (e) {}
  }

  window.chcnShowCertificate = function (courseId, opts) {
    opts = opts || {};
    var data = (typeof COURSE_DATA !== 'undefined') ? COURSE_DATA[courseId] : null;
    if (!data) { if (typeof showToast === 'function') showToast('Certificate not available for this course', true); return; }
    var specimen = !!opts.specimen;
    var name = specimen ? recipientDefault() : recipientDefault();
    var dateStr = fmtDate(new Date());

    var old = document.getElementById('chcnCertModal');
    if (old) old.parentNode.removeChild(old);
    var ov = document.createElement('div');
    ov.id = 'chcnCertModal';
    ov.className = 'chcn-cert-modal';
    var head = specimen ? 'Sample Certificate' : 'Your Certificate';
    var sub = specimen
      ? 'This is a preview of the certificate you earn on completing this programme.'
      : 'This certificate is saved to your account. Edit the name if needed, then print or download.';
    var h = '<div class="chcn-cert-box">';
    h += '<div class="chcn-cert-mhead"><div><h3>' + esc(head) + '</h3><p>' + esc(sub) + '</p></div>';
    h += '<button class="chcn-cert-x" onclick="chcnCloseCertificate()" aria-label="Close">\u00D7</button></div>';
    h += '<div class="chcn-cert-row"><label>Certificate name</label>';
    h += '<input type="text" id="chcnCertName" value="' + esc(name) + '" placeholder="Learner Name">';
    h += '<button class="btn btn-outline btn-sm" onclick="chcnCertRefresh()">Update name</button></div>';
    h += '<iframe id="chcnCertFrame" class="chcn-cert-frame" title="Certificate preview"></iframe>';
    h += '<div class="chcn-cert-actions">';
    h += '<button class="btn btn-primary" onclick="chcnCertPrint()">\uD83D\uDDA8 Print</button>';
    h += '<button class="btn btn-outline" onclick="chcnCertDownload()">\u2B07 Download</button>';
    h += '<button class="btn btn-outline" onclick="chcnCloseCertificate()">Close</button></div></div>';
    ov.innerHTML = h;
    ov.addEventListener('click', function (e) { if (e.target === ov) chcnCloseCertificate(); });
    document.body.appendChild(ov);
    ov._courseId = courseId; ov._specimen = specimen;
    chcnCertRefresh();
  };
  function currentCertState() {
    var ov = document.getElementById('chcnCertModal'); if (!ov) return null;
    var data = COURSE_DATA[ov._courseId];
    var nameEl = document.getElementById('chcnCertName');
    var name = (nameEl && nameEl.value.trim()) || 'Learner Name';
    return { ov: ov, data: data, name: name, specimen: ov._specimen, dateStr: fmtDate(new Date()) };
  }
  window.chcnCertRefresh = function () {
    var s = currentCertState(); if (!s) return;
    if (!s.specimen && s.name && s.name !== 'Learner Name') {
      try { localStorage.setItem('chcn_cert_recipient', s.name); } catch (e) {}
    }
    var fr = document.getElementById('chcnCertFrame');
    if (fr) fr.srcdoc = certDoc(s.data, s.name, s.dateStr, s.specimen);
  };
  window.chcnCertPrint = function () {
    var s = currentCertState(); if (!s) return;
    iframePrint(certDoc(s.data, s.name, s.dateStr, s.specimen));
  };
  window.chcnCertDownload = function () {
    var s = currentCertState(); if (!s) return;
    var pre = s.specimen ? 'Certificate-Specimen-' : 'Certificate-';
    downloadDoc(certDoc(s.data, s.name, s.dateStr, s.specimen), pre + s.data.cert + '.html');
    if (typeof showToast === 'function') showToast('Certificate downloaded.');
  };
  window.chcnCloseCertificate = function () {
    var ov = document.getElementById('chcnCertModal'); if (ov) ov.parentNode.removeChild(ov);
  };
  // Override the core certificate generator so the results screen and the
  // Certificates panel open the in-app certificate instead of a file download.
  window.generateCertificate = function (courseId) { window.chcnShowCertificate(courseId, {}); };

  // ---- Certificate tab for the 7 built-in HTML courses ----
  function certHtml(c) {
    var h = '<div class="chcn-cert-panel">';
    h += '<div class="chcn-cert-badge"><div class="chcn-cert-seal">\uD83C\uDF93</div>';
    h += '<div class="chcn-cert-title"><span class="chcn-cert-code">' + esc(c.code) + '</span>';
    h += '<h3>' + esc(c.cert) + '</h3><p>Awarded by Creator Hub Creator Network</p></div></div>';
    h += '<h4>What this certificate confirms</h4>';
    h += '<p>On completing <strong>' + esc(c.name) + '</strong> you earn the <strong>' + esc(c.cert) + '</strong>, confirming you have covered the full curriculum and passed the required knowledge checks.</p>';
    h += '<h4>How to earn it</h4><ul class="chcn-cert-req">';
    h += '<li>Enrol in the course (free).</li>';
    h += '<li>Complete every lesson and unit in the Curriculum tab.</li>';
    h += '<li>Pass each quiz (80% or higher).</li>';
    h += '<li>Pass the final assessment to unlock your certificate.</li></ul>';
    h += '<p class="chcn-cert-note">Certificates are issued in your name and signed by the founder, Ravaun Richards. On completion your certificate is saved automatically to your account under Certificates.</p>';
    h += '<div class="chcn-cert-actions">';
    h += '<button class="btn btn-outline" onclick="chcnShowCertificate(\'' + c.page + '\',{specimen:true})">\uD83D\uDC41 View sample certificate</button>';
    h += '<button class="btn btn-primary" onclick="chcnViewMyCerts()">View My Certificates</button>';
    h += '</div></div>';
    return h;
  }
  window.chcnViewMyCerts = function () {
    if (typeof navigate === 'function') navigate('account');
    var link = document.querySelector('.account-sidebar-link[onclick*="panel-certificates"]');
    if (typeof switchAccountTab === 'function') switchAccountTab('panel-certificates', link || document.createElement('a'));
  };
  function ensureCertTab(page) {
    var c = BY_PAGE[page]; if (!c) return;
    var tabs = document.getElementById('course-detail-tabs-' + c.short);
    if (!tabs) return;
    if (document.getElementById('chcn-certtab-' + c.short)) return;
    var certTabId = c.pfx + '-certificate';
    var btn = document.createElement('div');
    btn.className = 'tab'; btn.id = 'chcn-certtab-' + c.short;
    btn.setAttribute('onclick', "switchCourseTab(event,'" + certTabId + "','" + c.short + "')");
    btn.textContent = 'Certificate';
    var reviewsTab = tabs.querySelector('.tab[onclick*="-reviews"]');
    if (reviewsTab) tabs.insertBefore(btn, reviewsTab); else tabs.appendChild(btn);
    var reviewsPanel = document.getElementById(c.pfx + '-reviews');
    var panel = document.createElement('div');
    panel.className = 'tab-content'; panel.id = certTabId; panel.innerHTML = certHtml(c);
    if (reviewsPanel && reviewsPanel.parentElement) reviewsPanel.parentElement.insertBefore(panel, reviewsPanel.nextSibling);
    else tabs.parentElement.appendChild(panel);
  }
  // ================= PROFILE: extended fields + deactivate =================
  function chcnRenderAccountStatus() {
    var u = getUserSafe();
    var txt = document.getElementById('accountStatusText');
    var btn = document.getElementById('deactivateBtn');
    if (!txt || !btn) return;
    if (u && u.deactivated) {
      txt.textContent = 'Your account is deactivated. Your profile is hidden and activity is paused — reactivate any time. Nothing has been deleted.';
      txt.style.color = '#c0392b';
      btn.textContent = 'Reactivate my account';
    } else {
      txt.textContent = 'Your account is active.';
      txt.style.color = '#888';
      btn.textContent = 'Deactivate my account';
    }
  }
  window.chcnToggleAccountActive = function () {
    var u = getUserSafe();
    if (!u) { if (typeof showToast === 'function') showToast('Please sign in first', true); return; }
    if (u.deactivated) {
      u.deactivated = false;
      try { setUser(u); } catch (e) {}
      if (typeof showToast === 'function') showToast('Welcome back — your account is active again.');
    } else {
      if (!window.confirm('Deactivate your account? Your profile will be hidden and activity paused. You can reactivate any time by pressing Reactivate — nothing is deleted.')) return;
      u.deactivated = true;
      try { setUser(u); } catch (e) {}
      if (typeof showToast === 'function') showToast('Your account has been deactivated. Press Reactivate any time to return.');
    }
    chcnRenderAccountStatus();
  };

  function wrapProfile() {
    if (typeof window.saveProfile === 'function' && !window.saveProfile.__chcn) {
      var origSave = window.saveProfile;
      window.saveProfile = function () {
        origSave();
        try {
          var u = getUserSafe(); if (!u) return;
          var gv = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; };
          var sel = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
          var em = gv('profileEmail'); if (em) u.email = em;
          u.phone = gv('profilePhone');
          u.country = gv('profileCountry');
          u.addr1 = gv('profileAddr1');
          u.addr2 = gv('profileAddr2');
          u.city = gv('profileCity');
          u.state = gv('profileState');
          u.zip = gv('profileZip');
          u.gender = sel('profileGender');
          u.marital = sel('profileMarital');
          u.relationship = sel('profileRelationship');
          u.nationality = gv('profileNationality');
          u.bloodType = sel('profileBloodType');
          u.dobMonth = sel('profileDobMonth');
          u.dobDay = sel('profileDobDay');
          u.dobYear = sel('profileDobYear');
          setUser(u);
          var ae = document.getElementById('accountEmail'); if (ae && u.email) ae.textContent = u.email;
        } catch (e) {}
      };
      window.saveProfile.__chcn = true;
    }
    if (typeof window.loadAccountData === 'function' && !window.loadAccountData.__chcn) {
      var origLoad = window.loadAccountData;
      window.loadAccountData = function () {
        origLoad();
        try {
          var u = getUserSafe(); if (!u) return;
          var sv = function (id, v) { var e = document.getElementById(id); if (e) e.value = v || ''; };
          sv('profilePhone', u.phone); sv('profileCountry', u.country);
          sv('profileAddr1', u.addr1); sv('profileAddr2', u.addr2);
          sv('profileCity', u.city); sv('profileState', u.state); sv('profileZip', u.zip);
          sv('profileGender', u.gender); sv('profileMarital', u.marital); sv('profileRelationship', u.relationship);
          sv('profileNationality', u.nationality); sv('profileBloodType', u.bloodType);
          sv('profileDobMonth', u.dobMonth); sv('profileDobDay', u.dobDay); sv('profileDobYear', u.dobYear);
          if (typeof window.chcnRefreshAge === 'function') window.chcnRefreshAge();
          var em = document.getElementById('profileEmail'); if (em) em.removeAttribute('readonly');
          chcnRenderAccountStatus();
        } catch (e) {}
      };
      window.loadAccountData.__chcn = true;
    }
  }

  // ---- Map: only auto-locate when permission is already granted ----
  window.chcnMaybeAutoLocate = function () {
    if (!navigator.geolocation) return;
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then(function (st) {
        if (st && st.state === 'granted') { try { locateMe(); } catch (e) {} }
      }).catch(function () {});
    }
  };

  function install() {
    COURSES.forEach(function (c) { ensureCertTab(c.page); fillBuiltinReviews(c.page); });
    wrapProfile();
    chcnRenderAccountStatus();

    if (typeof window.loadCourseContent === 'function' && !window.loadCourseContent.__chcnDone) {
      var origL = window.loadCourseContent;
      window.loadCourseContent = function (id) { origL(id); try { ensureCertTab(id); fillBuiltinReviews(id); } catch (e) {} };
      window.loadCourseContent.__chcnDone = true;
    }
    if (typeof window.renderCourseView === 'function' && !window.renderCourseView.__chcnDone) {
      var origR = window.renderCourseView;
      window.renderCourseView = function (id) { origR(id); try { fillCatalogueReviews(); } catch (e) {} };
      window.renderCourseView.__chcnDone = true;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
