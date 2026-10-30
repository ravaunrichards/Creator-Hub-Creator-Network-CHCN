/* ============================================================================
 * chcn-resume-photo.js  —  Creator Hub Creator Network
 *
 * Two ADDITIVE features. Loaded LAST so it can safely wrap the originals.
 * It deliberately does NOT touch navigate()/history — the app already has a
 * full history/back service (chcn-nav.js). This only adds:
 *
 *   1. "Resume where you left off": remembers the exact lesson/quiz you last
 *      opened and shows a Continue banner at the top of that course page, so
 *      after the back button takes you to the course list you can jump
 *      straight back into your place.
 *   2. A crop + rotate + zoom photo editor for the profile picture AND the
 *      cover photo.
 * ==========================================================================*/
(function () {
  'use strict';

  var PAGE_IDS = ['index','courses','about','contact','account','course-level1','course-assessment','course-senior','course-junior','course-driver-beginner','course-driver-intermediate','course-driver-advanced','payment','map','music','lesson','quiz'];
  function visiblePage() {
    for (var i = 0; i < PAGE_IDS.length; i++) {
      var el = document.getElementById('page-' + PAGE_IDS[i]);
      if (el && el.style.display !== 'none' && el.offsetParent !== null) return PAGE_IDS[i];
    }
    return null;
  }
  function domText(id) {
    var el = document.getElementById(id);
    return el ? (el.textContent || '').trim() : '';
  }

  /* ---------------------------------------------------------------------
   * 1. RESUME WHERE YOU LEFT OFF
   * ------------------------------------------------------------------- */
  function rememberResume(courseId, mi, li, title) {
    try {
      localStorage.setItem('chcn_last_lesson', JSON.stringify({
        courseId: courseId, mi: mi, li: li, title: title || '', ts: Date.now()
      }));
    } catch (e) {}
  }
  function getResume() {
    try { return JSON.parse(localStorage.getItem('chcn_last_lesson')); } catch (e) { return null; }
  }

  var _startLesson = window.startLesson;
  var _startQuiz   = window.startQuiz;
  var _loadCourse  = window.loadCourseContent;

  if (typeof _startLesson === 'function') {
    window.startLesson = function (courseId, mi, li) {
      try { _startLesson(courseId, mi, li); } catch (e) {}
      var vp = visiblePage();
      if (vp === 'lesson')    rememberResume(courseId, mi, li, domText('lesson-page-title'));
      else if (vp === 'quiz') rememberResume(courseId, mi, li, domText('quiz-page-title'));
      // gate / locked lessons don't navigate — nothing to remember.
    };
  }
  if (typeof _startQuiz === 'function') {
    window.startQuiz = function (courseId, mi, li) {
      try { _startQuiz(courseId, mi, li); } catch (e) {}
      if (visiblePage() === 'quiz') rememberResume(courseId, mi, li, domText('quiz-page-title'));
    };
  }

  var CONTENT_IDS = {
    'course-level1': 'lvl1-curriculum-content',
    'course-assessment': 'assess-curriculum-content',
    'course-senior': 'senior-curriculum-content',
    'course-junior': 'junior-curriculum-content',
    'course-driver-beginner': 'drvb-curriculum-content',
    'course-driver-intermediate': 'drvi-curriculum-content',
    'course-driver-advanced': 'drva-curriculum-content'
  };
  if (typeof _loadCourse === 'function') {
    window.loadCourseContent = function (courseId) {
      try { _loadCourse(courseId); } catch (e) {}
      try { injectResumeBanner(courseId); } catch (e) {}
    };
  }
  function injectResumeBanner(courseId) {
    var host = document.getElementById(CONTENT_IDS[courseId]);
    if (!host) return;
    var prev = document.getElementById('chResumeBanner');
    if (prev) prev.remove();
    var r = getResume();
    if (!r || r.courseId !== courseId) return;
    var banner = document.createElement('div');
    banner.id = 'chResumeBanner';
    banner.className = 'ch-resume-banner';
    var label = document.createElement('div');
    label.className = 'ch-resume-label';
    label.textContent = 'Resume where you left off: ' + (r.title || 'your last lesson');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ch-resume-btn';
    btn.textContent = '▶ Continue';
    btn.addEventListener('click', function () {
      if (typeof window.startLesson === 'function') window.startLesson(r.courseId, r.mi, r.li);
    });
    banner.appendChild(label);
    banner.appendChild(btn);
    host.insertBefore(banner, host.firstChild);
  }

  /* ---------------------------------------------------------------------
   * 2. PHOTO EDITOR  —  crop + rotate + zoom  (avatar AND cover)
   * ------------------------------------------------------------------- */
  var ed = {
    open: false, mode: 'avatar', img: null,
    rot: 0, zoom: 1, base: 1, ox: 0, oy: 0,
    outW: 512, outH: 512, fw: 0, fh: 0,
    drag: false, sx: 0, sy: 0
  };

  function ensureDom() {
    if (document.getElementById('chEditorOverlay')) return;
    var ov = document.createElement('div');
    ov.id = 'chEditorOverlay';
    ov.className = 'ch-ed-overlay';
    ov.innerHTML =
      '<div class="ch-ed-modal">' +
        '<div class="ch-ed-title" id="chEdTitle">Edit photo</div>' +
        '<div class="ch-ed-hint">Drag the image to reposition. Use the sliders to zoom and rotate.</div>' +
        '<div class="ch-ed-stage" id="chEdStage">' +
          '<canvas id="chEdCanvas"></canvas>' +
          '<div class="ch-ed-frame" id="chEdFrame"></div>' +
        '</div>' +
        '<div class="ch-ed-row"><span>Zoom</span>' +
          '<input type="range" id="chEdZoom" min="1" max="4" step="0.01" value="1"></div>' +
        '<div class="ch-ed-row"><span>Rotate</span>' +
          '<input type="range" id="chEdRot" min="-180" max="180" step="1" value="0"></div>' +
        '<div class="ch-ed-btns">' +
          '<button type="button" class="ch-ed-b" id="chEdL">↺ 90°</button>' +
          '<button type="button" class="ch-ed-b" id="chEdR">↻ 90°</button>' +
          '<button type="button" class="ch-ed-b" id="chEdReset">Reset</button>' +
        '</div>' +
        '<div class="ch-ed-actions">' +
          '<button type="button" class="ch-ed-cancel" id="chEdCancel">Cancel</button>' +
          '<button type="button" class="ch-ed-save" id="chEdSave">Save photo</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);

    document.getElementById('chEdZoom').addEventListener('input', function () { ed.zoom = parseFloat(this.value); draw(); });
    document.getElementById('chEdRot').addEventListener('input', function () { ed.rot = parseFloat(this.value); draw(); });
    document.getElementById('chEdL').addEventListener('click', function () { ed.rot -= 90; syncRot(); draw(); });
    document.getElementById('chEdR').addEventListener('click', function () { ed.rot += 90; syncRot(); draw(); });
    document.getElementById('chEdReset').addEventListener('click', function () {
      ed.rot = 0; ed.zoom = 1; ed.ox = 0; ed.oy = 0; syncRot();
      document.getElementById('chEdZoom').value = 1; draw();
    });
    document.getElementById('chEdCancel').addEventListener('click', close);
    document.getElementById('chEdSave').addEventListener('click', save);

    var cv = document.getElementById('chEdCanvas');
    cv.addEventListener('mousedown', dStart);
    cv.addEventListener('touchstart', dStart, { passive: true });
    window.addEventListener('mousemove', dMove);
    window.addEventListener('touchmove', dMove, { passive: false });
    window.addEventListener('mouseup', dEnd);
    window.addEventListener('touchend', dEnd);
  }

  function syncRot() {
    while (ed.rot > 180) ed.rot -= 360;
    while (ed.rot < -180) ed.rot += 360;
    var s = document.getElementById('chEdRot');
    if (s) s.value = ed.rot;
  }
  function pt(e) {
    if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }
  function dStart(e) { if (!ed.open) return; ed.drag = true; var p = pt(e); ed.sx = p.x; ed.sy = p.y; }
  function dMove(e) {
    if (!ed.drag) return;
    if (e.cancelable && e.touches) e.preventDefault();
    var p = pt(e);
    ed.ox += (p.x - ed.sx); ed.oy += (p.y - ed.sy);
    ed.sx = p.x; ed.sy = p.y; draw();
  }
  function dEnd() { ed.drag = false; }

  function open(mode, dataUrl) {
    ensureDom();
    ed.mode = mode; ed.rot = 0; ed.zoom = 1; ed.ox = 0; ed.oy = 0;
    if (mode === 'cover') { ed.outW = 1200; ed.outH = 400; }
    else { ed.outW = 512; ed.outH = 512; }
    document.getElementById('chEdTitle').textContent =
      mode === 'cover' ? 'Edit cover photo' : 'Edit profile picture';
    document.getElementById('chEdZoom').value = 1;
    document.getElementById('chEdRot').value = 0;

    var maxW = Math.min(window.innerWidth - 64, 460), fw, fh;
    if (mode === 'cover') { fw = maxW; fh = Math.round(maxW * ed.outH / ed.outW); }
    else { fh = Math.min(320, Math.max(200, window.innerHeight - 360)); fw = fh; }
    ed.fw = fw; ed.fh = fh;
    var stage = document.getElementById('chEdStage');
    stage.style.width = fw + 'px'; stage.style.height = fh + 'px';
    var frame = document.getElementById('chEdFrame');
    frame.style.width = fw + 'px'; frame.style.height = fh + 'px';
    frame.style.borderRadius = (mode === 'avatar') ? '50%' : '10px';
    var cv = document.getElementById('chEdCanvas');
    cv.width = fw; cv.height = fh;

    var im = new Image();
    im.onload = function () {
      ed.img = im;
      ed.base = Math.max(fw / im.width, fh / im.height); // cover the frame
      draw();
    };
    im.onerror = function () { alert('Sorry, that image could not be opened.'); close(); };
    im.src = dataUrl;
    document.getElementById('chEditorOverlay').style.display = 'flex';
    ed.open = true;
  }

  function draw() {
    var cv = document.getElementById('chEdCanvas');
    if (!cv || !ed.img) return;
    var ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.save();
    ctx.translate(cv.width / 2 + ed.ox, cv.height / 2 + ed.oy);
    ctx.rotate(ed.rot * Math.PI / 180);
    var s = ed.base * ed.zoom, w = ed.img.width * s, h = ed.img.height * s;
    ctx.drawImage(ed.img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  function close() {
    var ov = document.getElementById('chEditorOverlay');
    if (ov) ov.style.display = 'none';
    ed.open = false; ed.img = null;
  }

  function save() {
    if (!ed.img) { close(); return; }
    var out = document.createElement('canvas');
    out.width = ed.outW; out.height = ed.outH;
    var ctx = out.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out.width, out.height);
    var k = ed.outW / ed.fw; // frame -> output scale
    ctx.save();
    ctx.translate(out.width / 2 + ed.ox * k, out.height / 2 + ed.oy * k);
    ctx.rotate(ed.rot * Math.PI / 180);
    var s = ed.base * ed.zoom * k, w = ed.img.width * s, h = ed.img.height * s;
    ctx.drawImage(ed.img, -w / 2, -h / 2, w, h);
    ctx.restore();
    var dataUrl = out.toDataURL('image/jpeg', ed.mode === 'cover' ? 0.85 : 0.9);
    var u = (typeof window.getUser === 'function') ? window.getUser() : null;
    try {
      if (ed.mode === 'cover') {
        localStorage.setItem('chcn_cover', dataUrl);
        if (typeof window.renderCover === 'function') window.renderCover();
      } else {
        localStorage.setItem('chcn_avatar', dataUrl);
        if (typeof window.renderAvatar === 'function') window.renderAvatar(u);
      }
      if (typeof window.showToast === 'function') {
        window.showToast(ed.mode === 'cover' ? 'Cover photo updated!' : 'Profile picture updated!');
      }
    } catch (e) {
      if (typeof window.showToast === 'function') window.showToast('Could not save — try zooming out or a smaller image', true);
      else alert('Could not save the photo — try a smaller image.');
      return;
    }
    close();
  }

  // Route the existing upload inputs through the editor first.
  function toEditor(mode, input) {
    var f = input && input.files && input.files[0];
    if (!f) return;
    if (!f.type || f.type.indexOf('image/') !== 0) {
      if (typeof window.showToast === 'function') window.showToast('Please choose an image file', true);
      input.value = ''; return;
    }
    var rd = new FileReader();
    rd.onload = function () { open(mode, rd.result); input.value = ''; };
    rd.onerror = function () { if (typeof window.showToast === 'function') window.showToast('Could not read that file', true); };
    rd.readAsDataURL(f);
  }
  window.uploadProfilePic = function (e) { toEditor('avatar', (e && e.target) || e); };
  window.uploadCoverPhoto = function (e) { toEditor('cover',  (e && e.target) || e); };
})();
