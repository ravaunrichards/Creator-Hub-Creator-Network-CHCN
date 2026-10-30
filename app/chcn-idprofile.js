/* ===== Creator Hub Creator Network — profile identity add-ons (v26) =====
   - Date of birth (month / day / year) selectors + automatic age.
   - Nationality + blood type persist via the profile save/load wrapper.
   - Identification documents: upload / view / replace / remove / delete,
     stored privately on this device (localStorage) as data URLs.
   Purely additive. Loaded before chcn-docstudio.js. */
(function () {
  'use strict';

  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  function esc(s) { var d = document.createElement('div'); d.textContent = String(s == null ? '' : s); return d.innerHTML; }
  function getUserSafe() { try { return (typeof getUser === 'function') ? getUser() : null; } catch (e) { return null; } }

  // ---------- DOB selects + age ----------
  function fillSelect(el, items, keepFirst) {
    if (!el) return;
    var first = keepFirst ? el.options[0] : null;
    el.innerHTML = '';
    if (first) el.appendChild(first);
    items.forEach(function (it) {
      var o = document.createElement('option');
      o.value = String(it.v); o.textContent = it.t; el.appendChild(o);
    });
  }
  function buildDob() {
    var m = document.getElementById('profileDobMonth');
    var d = document.getElementById('profileDobDay');
    var y = document.getElementById('profileDobYear');
    if (m && m.options.length <= 1) fillSelect(m, MONTHS.map(function (n, i) { return { v: i + 1, t: n }; }), true);
    if (d && d.options.length <= 1) { var days = []; for (var i = 1; i <= 31; i++) days.push({ v: i, t: i }); fillSelect(d, days, true); }
    if (y && y.options.length <= 1) {
      var now = new Date().getFullYear(); var yrs = [];
      for (var yr = now; yr >= 1915; yr--) yrs.push({ v: yr, t: yr });
      fillSelect(y, yrs, true);
    }
    [m, d, y].forEach(function (el) { if (el && !el.__chcnAge) { el.addEventListener('change', refreshAge); el.__chcnAge = true; } });
  }
  function computeAge(y, mo, day) {
    if (!y || !mo || !day) return null;
    var today = new Date();
    var age = today.getFullYear() - y;
    var mDiff = (today.getMonth() + 1) - mo;
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < day)) age--;
    if (age < 0 || age > 130) return null;
    return age;
  }
  function refreshAge() {
    var m = document.getElementById('profileDobMonth');
    var d = document.getElementById('profileDobDay');
    var y = document.getElementById('profileDobYear');
    var out = document.getElementById('profileAge');
    if (!out) return;
    var mo = m && m.value ? parseInt(m.value, 10) : 0;
    var day = d && d.value ? parseInt(d.value, 10) : 0;
    var yr = y && y.value ? parseInt(y.value, 10) : 0;
    var age = computeAge(yr, mo, day);
    if (age == null) { out.textContent = ''; return; }
    out.textContent = 'Age: ' + age + ' years old';
  }
  window.chcnRefreshAge = refreshAge;

  // ---------- Identification documents ----------
  var ID_TYPES = [
    'National ID', 'Passport', "Driver's License", 'Birth Certificate (Birth Paper)',
    'TRN (Tax Registration Number)', 'NIS (National Insurance Scheme)',
    'NHT (National Housing Trust)', "Voter's ID / Elector Card",
    'Social Security / SSN', 'Work Permit', 'Residency / Green Card',
    'Student ID', 'Employee ID', 'Marriage Certificate',
    'Health / Insurance Card', 'Proof of Address', 'Other ID'
  ];
  function loadDocs() { try { return JSON.parse(localStorage.getItem('chcn_id_docs')) || []; } catch (e) { return []; } }
  function saveDocs(a) { try { localStorage.setItem('chcn_id_docs', JSON.stringify(a)); } catch (e) { if (typeof showToast === 'function') showToast('Storage full — could not save that document', true); } }

  function renderDocs() {
    var mount = document.getElementById('chcnIdDocsMount');
    if (!mount) return;
    var docs = loadDocs();
    var h = '<div class="chcn-id-add">';
    h += '<select id="chcnIdType">';
    ID_TYPES.forEach(function (t) { h += '<option>' + esc(t) + '</option>'; });
    h += '</select>';
    h += '<input type="text" id="chcnIdLabel" placeholder="Label / ID number (optional)">';
    h += '<label class="chcn-id-file">📎 Choose file<input type="file" accept="image/*,application/pdf" onchange="chcnAddIdDoc(event)" style="display:none;"></label>';
    h += '</div>';
    if (!docs.length) {
      h += '<p class="chcn-id-empty">No identification documents added yet.</p>';
    } else {
      h += '<div class="chcn-id-list">';
      docs.forEach(function (dc) {
        var isImg = (dc.mime || '').indexOf('image') === 0;
        h += '<div class="chcn-id-card">';
        h += '<div class="chcn-id-thumb">' + (isImg ? '<img src="' + dc.dataUrl + '" alt="">' : '<span>📄 PDF</span>') + '</div>';
        h += '<div class="chcn-id-meta"><strong>' + esc(dc.type) + '</strong>';
        if (dc.label) h += '<span class="chcn-id-lbl">' + esc(dc.label) + '</span>';
        h += '<span class="chcn-id-fn">' + esc(dc.fileName || '') + '</span></div>';
        h += '<div class="chcn-id-btns">';
        h += '<button class="btn btn-outline btn-sm" onclick="chcnViewIdDoc(\'' + dc.id + '\')">View</button>';
        h += '<label class="btn btn-outline btn-sm chcn-id-replace">Replace<input type="file" accept="image/*,application/pdf" onchange="chcnReplaceIdDoc(event,\'' + dc.id + '\')" style="display:none;"></label>';
        h += '<button class="btn btn-outline btn-sm" onclick="chcnDeleteIdDoc(\'' + dc.id + '\')">Delete</button>';
        h += '</div></div>';
      });
      h += '</div>';
    }
    mount.innerHTML = h;
  }

  function readFile(file, cb) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { if (typeof showToast === 'function') showToast('File too large (max 8 MB)', true); return; }
    var r = new FileReader();
    r.onload = function () { cb(r.result, file); };
    r.readAsDataURL(file);
  }

  window.chcnAddIdDoc = function (ev) {
    var file = ev.target.files && ev.target.files[0]; if (!file) return;
    var typeEl = document.getElementById('chcnIdType');
    var lblEl = document.getElementById('chcnIdLabel');
    var type = typeEl ? typeEl.value : 'ID';
    var label = lblEl ? lblEl.value.trim() : '';
    readFile(file, function (dataUrl, f) {
      var docs = loadDocs();
      docs.push({ id: 'id' + Date.now().toString(36) + Math.floor(Math.random() * 1000),
        type: type, label: label, fileName: f.name, mime: f.type, dataUrl: dataUrl, ts: Date.now() });
      saveDocs(docs); renderDocs();
      if (typeof showToast === 'function') showToast(type + ' added.');
    });
    ev.target.value = '';
  };
  window.chcnReplaceIdDoc = function (ev, id) {
    var file = ev.target.files && ev.target.files[0]; if (!file) return;
    readFile(file, function (dataUrl, f) {
      var docs = loadDocs();
      for (var i = 0; i < docs.length; i++) if (docs[i].id === id) { docs[i].dataUrl = dataUrl; docs[i].fileName = f.name; docs[i].mime = f.type; docs[i].ts = Date.now(); }
      saveDocs(docs); renderDocs();
      if (typeof showToast === 'function') showToast('Document replaced.');
    });
    ev.target.value = '';
  };
  window.chcnDeleteIdDoc = function (id) {
    if (!window.confirm('Delete this identification document? This cannot be undone.')) return;
    var docs = loadDocs().filter(function (d) { return d.id !== id; });
    saveDocs(docs); renderDocs();
    if (typeof showToast === 'function') showToast('Document deleted.');
  };
  window.chcnViewIdDoc = function (id) {
    var dc = loadDocs().filter(function (d) { return d.id === id; })[0]; if (!dc) return;
    var ov = document.createElement('div');
    ov.className = 'chcn-id-viewer';
    var body = (dc.mime || '').indexOf('image') === 0
      ? '<img src="' + dc.dataUrl + '" alt="' + esc(dc.type) + '">'
      : '<iframe src="' + dc.dataUrl + '" title="' + esc(dc.type) + '"></iframe>';
    ov.innerHTML = '<div class="chcn-id-viewer-box"><div class="chcn-id-viewer-head"><strong>' + esc(dc.type) + (dc.label ? ' — ' + esc(dc.label) : '') + '</strong><button aria-label="Close" onclick="this.closest(\'.chcn-id-viewer\').remove()">×</button></div>' + body + '</div>';
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
  };

  window.chcnGetIdDocs = loadDocs;

  function install() {
    buildDob();
    refreshAge();
    renderDocs();
    if (typeof window.loadAccountData === 'function' && !window.loadAccountData.__chcnId) {
      var orig = window.loadAccountData;
      window.loadAccountData = function () { orig.apply(this, arguments); try { buildDob(); refreshAge(); renderDocs(); } catch (e) {} };
      window.loadAccountData.__chcnId = true;
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
