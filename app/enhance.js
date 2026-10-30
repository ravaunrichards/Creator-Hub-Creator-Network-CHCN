/* ===== Creator Hub Creator Network \u2014 Course catalogue expansion & enhancements ===== */
/* Loaded AFTER app.js and courses-data.js. Adds the full TVET catalogue,
   course-matched quizzes, certificate previews and catalogue wiring. */
(function () {
  if (!window.NEW_COURSES) return;

  // 1) Merge accurate TVET courses into the existing engine so all lesson /
  //    quiz / progress / certificate flows work unchanged.
  try { Object.assign(COURSE_DATA, window.NEW_COURSES); } catch (e) {}

  // Make the new course ids known to the router.
  try {
    Object.keys(window.NEW_COURSES).forEach(function (id) {
      if (pages.indexOf(id) === -1) pages.push(id);
    });
    if (pages.indexOf('course-view') === -1) pages.push('course-view');
  } catch (e) {}

  // 2) Course-matched quiz generator: draw from THIS course's own bank.
  window.generateCourseQuiz = function (count, courseId) {
    var bank = (window.NEW_QUIZBANK && window.NEW_QUIZBANK[courseId]) ? window.NEW_QUIZBANK[courseId] : null;
    if (!bank) {
      // fall back to the original security bank for the legacy courses
      if (typeof generateQuizQuestions === 'function') return generateQuizQuestions(count);
      return [];
    }
    var shuffled = bank.slice().sort(function () { return Math.random() - 0.5; });
    return shuffled.slice(0, Math.min(count, shuffled.length));
  };

  // 3) Course-aware startQuiz (overrides the app.js version for ALL courses).
  //    Legacy courses keep the security bank; new courses use their own bank.
  var _origStartQuiz = window.startQuiz;
  window.startQuiz = function (courseId, moduleIdx, lessonIdx) {
    var data = COURSE_DATA[courseId];
    if (!data) return;
    var lesson = data.modules[moduleIdx].lessons[lessonIdx];
    navigate('quiz');
    document.getElementById('quiz-page-title').textContent = lesson.title;
    document.getElementById('quiz-page-subtitle').textContent = data.name + ' \u2014 ' + lesson.questions + ' Questions';
    var qs = window.NEW_QUIZBANK && window.NEW_QUIZBANK[courseId]
      ? window.generateCourseQuiz(lesson.questions, courseId)
      : generateQuizQuestions(lesson.questions);
    quizState = {
      questions: qs, current: 0, answers: new Array(qs.length).fill(-1),
      timer: null, timeLeft: (typeof parseDuration === 'function' ? parseDuration(lesson.duration) : 300),
      courseId: courseId, moduleIdx: moduleIdx, lessonIdx: lessonIdx, isFinal: lesson.isFinal || false
    };
    renderQuizQuestion();
    startQuizTimer();
  };

  // 4) Route new-course navigation through the generic detail view.
  var _origNavigate = navigate;
  navigate = function (page) {
    if (window.NEW_COURSES && window.NEW_COURSES[page]) { openCourse(page); return; }
    _origNavigate(page);
    if (page === 'courses') ensureCatalogInjected();
  };

  var REVIEWERS = [
    ['Kemar Willoughby', 'Graduate'], ['Shanice Bailey', 'Trainee'],
    ['Ackeem Foster', 'Apprentice'], ['Roxanne Clarke', 'Student'],
    ['Devon Palmer', 'Graduate'], ['Tarik Grantley', 'Learner'],
    ['Ayana Bennett', 'Trainee'], ['Marlon Service', 'Graduate']
  ];
  function reviewFor(id, i) {
    var r = REVIEWERS[(id.length + i) % REVIEWERS.length];
    return r;
  }

  window.currentCourseView = null;
  window.openCourse = function (id) {
    if (!COURSE_DATA[id]) { _origNavigate(id); return; }
    window.currentCourseView = id;
    _origNavigate('course-view');
    renderCourseView(id);
  };

  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }

  function renderCourseView(id) {
    var data = COURSE_DATA[id];
    if (!data) return;
    var host = document.getElementById('page-course-view');
    if (!host) return;
    var enrolled = (typeof getEnrolled === 'function') ? getEnrolled() : [];
    var isEnrolled = enrolled.indexOf(data.name) > -1;

    // header
    var h = '';
    h += '<section class="page-header"><h1>' + esc(data.name) + '</h1><p>' + esc(data.cat) + ' \u00b7 ' + esc(data.lvlLabel) + ' \u00b7 ' + (data.unitCount || 0) + ' curriculum units \u00b7 ' + (data.totalHours || 0) + ' estimated study hours</p></section>';
    h += '<section class="course-detail"><div class="container">';
    h += '<div class="course-detail-main">';
    h += '<div class="course-detail-tabs" id="cv-tabs">';
    h += '<div class="tab active" onclick="cvTab(event,\'cv-desc\')">Description</div>';
    h += '<div class="tab" onclick="cvTab(event,\'cv-cur\')">Curriculum</div>';
    h += '<div class="tab" onclick="cvTab(event,\'cv-quiz\')">Quizzes</div>';
    h += '<div class="tab" onclick="cvTab(event,\'cv-rev\')">Reviews</div>';
    h += '<div class="tab" onclick="cvTab(event,\'cv-cert\')">Certificate</div>';
    h += '</div>';

    // description
    h += '<div class="tab-content active" id="cv-desc"><div class="course-desc">';
    h += '<p style="font-size:40px;line-height:1;margin-bottom:10px;">' + (data.icon || '\uD83C\uDF93') + '</p>';
    h += '<p>' + esc(data.desc) + '</p>';
    h += '<h3>Programme at a Glance</h3><ul style="padding-left:20px;list-style:disc;line-height:2;">';
    h += '<li><strong>' + (data.unitCount || 0) + '</strong> curriculum units</li>';
    h += '<li><strong>' + (data.totalHours || 0) + '</strong> total estimated study hours of study</li>';
    h += '<li>Level ' + data.level + ' \u2014 ' + esc(data.lvlLabel) + '</li>';
    h += '<li>Self-paced online delivery, available 24/7</li></ul>';
    h += '<div class="highlight-box"><strong>Accreditation:</strong> This programme is a Creator Hub educational foundation unless an external accrediting body is explicitly named. It does not by itself represent a college degree, government licence or professional licence.</div>';
    h += '<h3>Certificate Awarded</h3><p><strong>\uD83C\uDF93 ' + esc(data.certFull) + '</strong></p>';
    h += '<div style="margin-top:25px;display:flex;gap:10px;flex-wrap:wrap;">';
    h += '<button class="btn btn-primary enroll-btn" id="cv-enroll" ' + (isEnrolled ? 'disabled' : '') + ' onclick="cvEnroll()">' + (isEnrolled ? '\u2713 Enrolled' : 'Enroll Now \u2014 Free') + '</button>';
    h += '<button class="btn btn-outline" onclick="previewCertificate(\'' + id + '\')">\uD83D\uDC41 Preview Certificate</button>';
    h += '</div></div></div>';

    // curriculum
    h += '<div class="tab-content" id="cv-cur">' + buildCurriculum(id, data) + '</div>';
    // quizzes
    h += '<div class="tab-content" id="cv-quiz">' + buildQuizList(id, data) + '</div>';
    // reviews
    h += '<div class="tab-content" id="cv-rev">' + buildReviews(id) + '</div>';
    // certificate preview tab
    h += '<div class="tab-content" id="cv-cert"><div class="course-desc"><h3>Certificate Preview</h3>';
    h += '<p>Below is a specimen of the certificate you will earn on successful completion of this programme. Complete all modules and pass the final assessment (80%) to unlock your personalised, printable certificate.</p>';
    h += '<div style="margin:16px 0;">' + certPreviewMarkup(data, true) + '</div>';
    h += '<button class="btn btn-primary" onclick="previewCertificate(\'' + id + '\')">\uD83D\uDDA8 Open / Print Specimen</button></div></div>';

    h += '</div>'; // main

    // sidebar
    h += '<div class="course-sidebar"><div class="sidebar-header"><div class="price" style="color:var(--success);">Free</div><p style="font-size:14px;opacity:.8;margin-top:5px;">' + esc(data.cert) + ' Certificate Included</p></div><div class="sidebar-body">';
    h += row('Instructor', 'Ravaun Richards');
    h += row('Category', data.cat);
    h += row('Units', String(data.unitCount || 0));
    h += row('Estimated Study Hours', String(data.totalHours || 0));
    h += row('Level', data.lvlLabel);
    h += row('Certificate', data.cert);
    h += '<button class="btn btn-primary enroll-btn" ' + (isEnrolled ? 'disabled' : '') + ' onclick="cvEnroll()">' + (isEnrolled ? '\u2713 Enrolled' : 'Enroll Now \u2014 Free') + '</button>';
    h += '<button class="btn btn-outline" style="width:100%;margin-top:10px;" onclick="toggleWishlist(this,\'' + esc(data.name).replace(/'/g, "\\'") + '\')">\u2661 Add to Wishlist</button>';
    h += '</div></div>';

    h += '</div></section>';
    host.innerHTML = h;
    window.scrollTo(0, 0);
  }
  window.renderCourseView = renderCourseView;

  function row(l, v) { return '<div class="detail-row"><span class="label">' + esc(l) + '</span><span class="value">' + esc(v) + '</span></div>'; }

  function buildCurriculum(id, data) {
    var html = '';
    data.modules.forEach(function (mod, mi) {
      var isFinal = mod.title.indexOf('FINAL') > -1;
      html += '<div class="curriculum-module' + (isFinal ? ' final-module' : '') + '">';
      html += '<div class="module-header" onclick="toggleModule(this)">' + esc(mod.title) + ' <span class="arrow">\u25bc</span></div>';
      html += '<div class="module-body">';
      mod.lessons.forEach(function (les, li) {
        var typeClass = les.type === 'quiz' ? 'quiz' : '';
        var typeLabel = les.type === 'quiz' ? 'Quiz (' + les.questions + 'Q)' : '\uD83D\uDCD6 Lesson';
        html += '<div class="curriculum-lesson">';
        html += '<span class="lesson-title" onclick="startLesson(\'' + id + '\',' + mi + ',' + li + ')">' + esc(les.title) + '</span>';
        html += '<span class="lesson-type ' + typeClass + '">' + typeLabel + '</span>';
        html += '<span class="lesson-duration">' + esc(les.duration) + '</span>';
        html += '</div>';
      });
      html += '</div></div>';
    });
    return html;
  }

  function buildQuizList(id, data) {
    var html = '';
    data.modules.forEach(function (mod, mi) {
      mod.lessons.forEach(function (les, li) {
        if (les.type === 'quiz') {
          html += '<div class="course-list-item" style="cursor:pointer;" onclick="startLesson(\'' + id + '\',' + mi + ',' + li + ')">';
          html += '<span class="cl-name">' + esc(les.title) + ' \u2014 ' + les.questions + ' Questions</span>';
          html += '<button class="btn btn-sm btn-primary">Start Quiz</button></div>';
        }
      });
    });
    return html || '<p style="color:#888;">No quizzes available for this course.</p>';
  }

  function buildReviews(id) {
    return '<div class="review-empty" style="padding:20px;color:#666;">No verified learner reviews have been published for this programme yet.</div>';
  }

  // Tab switch inside the generic course view
  window.cvTab = function (e, tabId) {
    var tabs = document.getElementById('cv-tabs');
    if (tabs) { tabs.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); }); e.target.classList.add('active'); }
    var el = document.getElementById(tabId);
    if (el) { el.parentElement.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); }); el.classList.add('active'); }
  };

  window.cvEnroll = function () {
    var id = window.currentCourseView; if (!id) return;
    var data = COURSE_DATA[id];
    if (!getUser()) { openModal('signupModal'); showToast('Please sign up or sign in first', true); return; }
    var enrolled = getEnrolled();
    if (enrolled.indexOf(data.name) === -1) { enrolled.push(data.name); setEnrolled(enrolled); }
    showToast('Enrolled in ' + data.name + '!');
    document.querySelectorAll('#page-course-view .enroll-btn').forEach(function (b) { b.textContent = '\u2713 Enrolled'; b.classList.add('enrolled'); b.disabled = true; });
    var cur = document.getElementById('cv-cur');
    if (cur) { document.getElementById('cv-tabs').querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); }); document.getElementById('cv-tabs').querySelectorAll('.tab')[1].classList.add('active'); cur.parentElement.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); }); cur.classList.add('active'); }
  };

  // ===== Certificate preview (specimen) =====
  function certPreviewMarkup(data, specimen) {
    return '<div style="position:relative;border:6px double #c9a84c;padding:26px;text-align:center;background:#fff;max-width:520px;margin:0 auto;font-family:Georgia,serif;">' +
      (specimen ? '<div style="position:absolute;top:10px;right:14px;color:#c9a84c;font-size:11px;letter-spacing:2px;font-weight:bold;">SPECIMEN</div>' : '') +
      '<div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#888;">Creator Hub Creator Network</div>' +
      '<div style="font-size:22px;font-weight:bold;color:#1a1a2e;margin:6px 0;">Certificate of Completion</div>' +
      '<div style="font-size:15px;color:#c9a84c;font-weight:bold;margin-bottom:10px;">' + esc(data.cert) + '</div>' +
      '<div style="font-size:12px;color:#666;">This is to certify that</div>' +
      '<div style="font-size:18px;font-weight:bold;color:#1a1a2e;border-bottom:2px solid #c9a84c;display:inline-block;padding:0 10px 3px;margin:6px 0;">[ Learner Name ]</div>' +
      '<div style="font-size:12px;color:#555;line-height:1.7;margin:8px 0;">has successfully completed the <strong>' + esc(data.name) + '</strong> programme and is awarded<br><strong>' + esc(data.certFull) + '</strong></div>' +
      '<div style="font-size:11px;color:#888;margin-top:10px;">Ravaun Richards \u00b7 Founder &amp; Lead Instructor</div>' +
      '</div>';
  }
  window.certPreviewMarkup = certPreviewMarkup;

  window.previewCertificate = function (id) {
    var data = COURSE_DATA[id]; if (!data) return;
    var user = getUser();
    var name = user ? user.name : '[ Learner Name ]';
    var date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    var certHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Certificate Specimen \u2014 ' + esc(data.cert) + '</title>' +
      '<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Georgia,serif;background:#f5f5f5;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px;}.cert{background:#fff;border:8px double #c9a84c;padding:50px 60px;max-width:800px;width:100%;text-align:center;position:relative;box-shadow:0 4px 20px rgba(0,0,0,.15);}.cert::before{content:"";position:absolute;top:15px;left:15px;right:15px;bottom:15px;border:2px solid #c9a84c;pointer-events:none;}.wm{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-25deg);font-size:90px;color:rgba(201,168,76,.12);font-weight:bold;letter-spacing:8px;pointer-events:none;}.logo{width:80px;height:80px;border-radius:12px;margin:0 auto 15px;overflow:hidden;}.logo img{width:100%;height:100%;object-fit:cover;}.title{font-size:14px;letter-spacing:6px;text-transform:uppercase;color:#888;}.heading{font-size:34px;font-weight:bold;color:#1a1a2e;margin:6px 0;}.cert-type{font-size:19px;color:#c9a84c;font-weight:bold;margin-bottom:20px;}.recipient{font-size:17px;color:#666;}.name{font-size:30px;font-weight:bold;color:#1a1a2e;border-bottom:2px solid #c9a84c;display:inline-block;padding-bottom:5px;margin:8px 0 16px;}.body-text{font-size:15px;color:#555;line-height:1.8;margin:16px 0;}.signatures{display:flex;justify-content:space-around;margin-top:36px;}.sig-line{width:180px;border-top:1px solid #333;margin:0 auto 5px;}.sig-name{font-size:14px;font-weight:bold;color:#1a1a2e;}.sig-title{font-size:12px;color:#888;}.date{font-size:13px;color:#888;margin-top:18px;}.note{font-size:12px;color:#b8860b;margin-top:10px;}.print-btn{margin-top:26px;background:#1a1a2e;color:#fff;border:none;padding:12px 30px;border-radius:8px;font-size:14px;cursor:pointer;}@media print{.print-btn{display:none;}body{background:#fff;padding:0;}.cert{box-shadow:none;}}</style></head>' +
      '<body><div class="cert"><div class="wm">SPECIMEN</div><div class="logo"><img src="icon.png" alt="CHCN"></div>' +
      '<div class="title">Creator Hub Creator Network</div><div class="heading">Certificate of Completion</div>' +
      '<div class="cert-type">' + esc(data.cert) + '</div><div class="recipient">This is to certify that</div>' +
      '<div class="name">' + esc(name) + '</div>' +
      '<div class="body-text">has successfully completed the <strong>' + esc(data.name) + '</strong> programme and is hereby awarded the designation of<br><strong>' + esc(data.certFull) + '</strong></div>' +
      '<div class="signatures"><div><div class="sig-line"></div><div class="sig-name">Ravaun Richards</div><div class="sig-title">Founder &amp; Lead Instructor</div></div>' +
      '<div><div class="sig-line"></div><div class="sig-name">Creator Hub Creator Network</div><div class="sig-title">Training Academy</div></div></div>' +
      '<div class="date">Specimen generated: ' + date + '</div>' +
      '<div class="note">This is a preview specimen. Your personalised certificate is issued after you pass the final assessment.</div>' +
      '<button class="print-btn" onclick="window.print()">\uD83D\uDDA8 Print Specimen</button></div></body></html>';
    var w = window.open('', '_blank');
    if (w) { w.document.write(certHtml); w.document.close(); }
    else {
      var blob = new Blob([certHtml], { type: 'text/html' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a'); a.href = url; a.download = 'Certificate-Specimen-' + data.cert + '.html'; a.click(); URL.revokeObjectURL(url);
    }
    showToast('Certificate specimen opened');
  };

  // ===== Catalogue card injection =====
  function cardMarkup(id, data, withStats) {
    var badge = 'New';
    var meta = '<span class="level-' + data.lvlLabel.toLowerCase() + '">' + esc(data.lvlLabel) + '</span><span>' + (data.unitCount || 0) + ' Units</span><span>Self Paced</span>';
    var html = '<div class="course-card" data-category="' + esc(data.cat) + '" data-level="' + esc(data.lvlLabel) + '" data-price="free" data-views="0" onclick="openCourse(\'' + id + '\')">';
    html += '<div class="card-header"><span class="badge badge-new">' + badge + '</span>' + esc(data.cat) + '</div>';
    html += '<div class="card-body"><h3>' + (data.icon || '') + ' ' + esc(data.name) + '</h3>';
    html += '<p>' + esc((data.desc || '').slice(0, 120)) + ((data.desc || '').length > 120 ? '\u2026' : '') + '</p>';
    html += '<div class="course-meta">' + meta + '</div>';
    if (withStats) html += '<div class="course-stats"><span class="views">\uD83D\uDCD8 ' + (data.totalHours || 0) + ' hrs</span><span class="students">\uD83C\uDF93 ' + esc(data.cert) + '</span></div>';
    html += '<div class="course-footer"><span class="course-price free">Free</span><button class="btn btn-primary btn-sm">Preview</button></div>';
    html += '</div></div>';
    return html;
  }

  var catalogInjected = false;
  function ensureCatalogInjected() {
    if (catalogInjected) return;
    var grid = document.getElementById('coursesGrid');
    if (!grid) return;
    var frag = '';
    Object.keys(window.NEW_COURSES).forEach(function (id) { frag += cardMarkup(id, COURSE_DATA[id], false); });
    grid.insertAdjacentHTML('beforeend', frag);
    // extend category filter with new categories
    var sel = document.getElementById('filterCategory');
    if (sel) {
      var seen = {};
      Array.prototype.forEach.call(sel.options, function (o) { seen[o.value] = true; });
      var cats = {};
      Object.keys(window.NEW_COURSES).forEach(function (id) { cats[COURSE_DATA[id].cat] = true; });
      Object.keys(cats).sort().forEach(function (c) { if (!seen[c]) { var o = document.createElement('option'); o.value = c; o.textContent = c; sel.appendChild(o); } });
    }
    catalogInjected = true;
  }
  window.ensureCatalogInjected = ensureCatalogInjected;

  function injectHomeFeatured() {
    var grids = document.querySelectorAll('.courses .courses-grid');
    var homeGrid = grids && grids.length ? grids[0] : null;
    if (!homeGrid) return;
    var ids = Object.keys(window.NEW_COURSES).slice(0, 8);
    var frag = '';
    ids.forEach(function (id) { frag += cardMarkup(id, COURSE_DATA[id], true); });
    homeGrid.insertAdjacentHTML('beforeend', frag);
  }

  // ===== Extended profile: bio / background / status / privacy =====
  var _origSaveProfile = window.saveProfile;
  window.saveProfile = function () {
    var u = (typeof getUser === 'function') ? getUser() : null;
    if (!u) { showToast('Please sign in first', true); return; }
    var nameEl = document.getElementById('profileName');
    if (nameEl && nameEl.value) u.name = nameEl.value;
    var g = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    var chk = function (id) { var el = document.getElementById(id); return el ? !!el.checked : false; };
    u.status = g('profileStatus');
    u.background = g('profileBackground');
    u.bio = g('profileBio');
    u.privacy = {
      profilePublic: chk('privacyProfilePublic'),
      showProgress: chk('privacyShowProgress'),
      allowMessages: chk('privacyAllowMessages')
    };
    try { localStorage.setItem('chcn_user', JSON.stringify(u)); if (typeof updateAuthUI === 'function') updateAuthUI(); } catch (e) {}
    showToast('Profile saved!');
  };

  var _origLoadAccount = window.loadAccountData;
  window.loadAccountData = function () {
    if (typeof _origLoadAccount === 'function') _origLoadAccount();
    var u = (typeof getUser === 'function') ? getUser() : null;
    if (!u) return;
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.value = v || ''; };
    var setChk = function (id, v) { var el = document.getElementById(id); if (el) el.checked = !!v; };
    set('profileStatus', u.status);
    set('profileBackground', u.background);
    set('profileBio', u.bio);
    if (u.privacy) {
      setChk('privacyProfilePublic', u.privacy.profilePublic);
      setChk('privacyShowProgress', u.privacy.showProgress);
      setChk('privacyAllowMessages', u.privacy.allowMessages);
    }
  };

  function boot() {
    injectHomeFeatured();
    ensureCatalogInjected();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
