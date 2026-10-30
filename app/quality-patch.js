/* Creator Hub reliability + navigation + jobs + donation receipt patch. */
(function () {
  'use strict';
  var esc = function (s) {
    var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML;
  };

  // ---------------- JOB SEARCH ----------------
  function regionListFor(hq) {
    var s = String(hq || ''), out = [];
    if (/global/i.test(s)) out.push('Global');
    var parts = s.split('/').map(function (x) { return x.trim(); }).filter(Boolean);
    parts.forEach(function (p) {
      if (!/global/i.test(p) && out.indexOf(p) < 0) out.push(p);
    });
    return out.length ? out : ['Global'];
  }
  function jobRecords() {
    return (window.GLOBAL_CAREERS || []).map(function (c) {
      var roles = Array.isArray(c.roles) ? c.roles : [];
      return { company: c.company, industry: c.industry, hq: c.hq, site: c.site, roles: roles, regions: regionListFor(c.hq) };
    });
  }
  function rebuildJobFilters() {
    var ind = document.getElementById('jobIndustry'), reg = document.getElementById('jobRegion');
    if (!ind || !reg) return;
    var industries = {}, regions = {};
    jobRecords().forEach(function (c) {
      if (c.industry) industries[c.industry] = true;
      c.regions.forEach(function (r) { regions[r] = true; });
    });
    var currentI = ind.value, currentR = reg.value;
    ind.innerHTML = '<option value="">All industries</option>';
    Object.keys(industries).sort(function(a,b){return a.localeCompare(b);}).forEach(function (x) {
      var o = document.createElement('option'); o.value = x; o.textContent = x; ind.appendChild(o);
    });
    reg.innerHTML = '<option value="">All regions</option>';
    Object.keys(regions).sort(function(a,b){return a.localeCompare(b);}).forEach(function (x) {
      var o = document.createElement('option'); o.value = x; o.textContent = x; reg.appendChild(o);
    });
    if (Object.prototype.hasOwnProperty.call(industries, currentI)) ind.value = currentI;
    if (Object.prototype.hasOwnProperty.call(regions, currentR)) reg.value = currentR;
  }
  function renderJobResults() {
    var grid = document.getElementById('jobGrid'); if (!grid) return;
    var q = (document.getElementById('jobSearch')?.value || '').trim().toLowerCase();
    var industry = document.getElementById('jobIndustry')?.value || '';
    var region = document.getElementById('jobRegion')?.value || '';
    var all = jobRecords(), matches = [];
    all.forEach(function (c) {
      var hay = [c.company, c.industry, c.hq].concat(c.roles.map(function (r) { return r[0] + ' ' + r[1]; })).join(' ').toLowerCase();
      if (q && hay.indexOf(q) < 0) return;
      if (industry && c.industry !== industry) return;
      if (region && c.regions.indexOf(region) < 0) return;
      matches.push(c);
    });
    matches.sort(function(a,b){ return a.company.localeCompare(b.company); });
    var roleCount = matches.reduce(function(n,c){return n+c.roles.length;},0);
    var html = '<div class="job-result-summary" style="grid-column:1/-1;margin-bottom:4px;padding:10px 14px;border-radius:10px;background:#f7f9fc;border:1px solid #e4e8ef;"><strong>' + matches.length + '</strong> employer' + (matches.length===1?'':'s') + ' · <strong>' + roleCount + '</strong> representative role' + (roleCount===1?'':'s') + ' shown' + (q ? ' · Search: “' + esc(q) + '”' : '') + '</div>';
    matches.forEach(function (c) {
      html += '<article class="company-card">';
      html += '<div class="company-head"><div><h3>' + esc(c.company) + '</h3><div class="company-meta">' + esc(c.industry) + ' · ' + esc(c.hq) + '</div></div><span>🌐</span></div>';
      html += '<div class="role-list">';
      c.roles.forEach(function (role) {
        html += '<div class="role-item"><strong>' + esc(role[0]) + '</strong><span>' + esc(role[1]) + '</span><small><b>Requirements:</b> Exact qualifications, experience, location, work authorization and closing date are defined by the current employer posting. Open the official careers portal for the authoritative requirements.</small></div>';
      });
      html += '</div><div class="career-actions"><a class="btn btn-primary btn-sm" href="' + esc(c.site) + '" target="_blank" rel="noopener noreferrer">View Official Careers</a><button type="button" class="btn btn-outline btn-sm" data-copy-company="' + esc(c.company) + '">Copy Company</button></div></article>';
    });
    if (!matches.length) html += '<div class="career-empty" style="grid-column:1/-1;padding:28px;text-align:center"><strong>No matching jobs/employers found.</strong><br>Change the keyword, industry or region, then press Search Jobs.</div>';
    grid.innerHTML = html;
    grid.querySelectorAll('[data-copy-company]').forEach(function(btn){
      btn.addEventListener('click', function(){ if (typeof copyText === 'function') copyText(btn.getAttribute('data-copy-company'), 'Company'); });
    });
  }
  window.filterJobs = function () { rebuildJobFilters(); renderJobResults(); };
  window.resetJobFilters = function () {
    var q = document.getElementById('jobSearch'), i = document.getElementById('jobIndustry'), r = document.getElementById('jobRegion');
    if (q) q.value = ''; if (i) i.value = ''; if (r) r.value = '';
    rebuildJobFilters(); renderJobResults();
  };
  function patchJobs() {
    if (!document.getElementById('page-jobs')) return;
    rebuildJobFilters();
    var q = document.getElementById('jobSearch');
    if (q && !q.dataset.patched) {
      q.dataset.patched = '1';
      q.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); window.filterJobs(); } });
    }
    var toolbar = document.querySelector('#page-jobs .career-toolbar');
    if (toolbar && !toolbar.querySelector('[data-reset-jobs]')) {
      var b = document.createElement('button'); b.type='button'; b.className='btn btn-outline'; b.textContent='Reset'; b.setAttribute('data-reset-jobs','1'); b.addEventListener('click', window.resetJobFilters); toolbar.appendChild(b);
    }
    renderJobResults();
  }

  // ---------------- COURSE PREVIOUS / NEXT / BACK ----------------
  function allCourseIds() {
    var ids = Object.keys(window.COURSE_DATA || {});
    return ids.filter(function(id){
      var d = window.COURSE_DATA[id];
      return d && d.name && Array.isArray(d.modules);
    });
  }
  function injectCourseNav() {
    var host = document.getElementById('page-course-view'); if (!host) return;
    var old = host.querySelector('#course-nav-controls'); if (old) old.remove();
    var id = window.currentCourseView; if (!id) return;
    var ids = allCourseIds(), idx = ids.indexOf(id), prev = idx > 0 ? ids[idx-1] : null, next = idx >= 0 && idx < ids.length-1 ? ids[idx+1] : null;
    var bar = document.createElement('div'); bar.id='course-nav-controls'; bar.className='container'; bar.style.cssText='display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:0 auto 20px;padding:0 20px;';
    bar.innerHTML = '<button type="button" class="btn btn-outline" data-course-back>← Back to All Courses</button><div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end">' + (prev?'<button type="button" class="btn btn-outline" data-course-prev>← Previous</button>':'') + (next?'<button type="button" class="btn btn-primary" data-course-next>Next →</button>':'') + '</div>';
    host.insertBefore(bar, host.firstChild);
    bar.querySelector('[data-course-back]').addEventListener('click', function(){ navigate('courses'); });
    if(prev) bar.querySelector('[data-course-prev]').addEventListener('click', function(){ openCourse(prev); });
    if(next) bar.querySelector('[data-course-next]').addEventListener('click', function(){ openCourse(next); });
  }
  var openCourseOriginal = window.openCourse;
  if (typeof openCourseOriginal === 'function' && !openCourseOriginal.__qualityWrapped) {
    var wrappedOpenCourse = function(id){ openCourseOriginal(id); setTimeout(injectCourseNav,0); };
    wrappedOpenCourse.__qualityWrapped=true; window.openCourse=wrappedOpenCourse;
  }
  function injectStaticCourseNav(page) {
    var host = document.getElementById('page-' + page); if (!host || !page || page.indexOf('course-') !== 0) return;
    if (host.querySelector('#static-course-nav-controls')) return;
    var ids = ['course-level1','course-assessment','course-senior','course-junior','course-driver-beginner','course-driver-intermediate','course-driver-advanced'];
    Object.keys(window.COURSE_DATA || {}).forEach(function(id){ if (id.indexOf('course-')===0 && ids.indexOf(id)<0) ids.push(id); });
    // Academic/TVET courses use the generic course view; legacy static pages use this navigation.
    var idx=ids.indexOf(page); if(idx<0)return;
    var prev=idx>0?ids[idx-1]:null, next=idx<ids.length-1?ids[idx+1]:null;
    var bar=document.createElement('div'); bar.id='static-course-nav-controls'; bar.className='container'; bar.style.cssText='display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:0 auto 20px;padding:0 20px;';
    bar.innerHTML='<button type=\"button\" class=\"btn btn-outline\" data-course-back>← Back to All Courses</button><div style=\"display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end\">'+(prev?'<button type=\"button\" class=\"btn btn-outline\" data-course-prev>← Previous</button>':'')+(next?'<button type=\"button\" class=\"btn btn-primary\" data-course-next>Next →</button>':'')+'</div>';
    host.insertBefore(bar,host.firstChild);
    bar.querySelector('[data-course-back]').addEventListener('click',function(){navigate('courses');});
    if(prev)bar.querySelector('[data-course-prev]').addEventListener('click',function(){navigate(prev);});
    if(next)bar.querySelector('[data-course-next]').addEventListener('click',function(){navigate(next);});
  }
  var navForQuality = window.navigate;
  if (typeof navForQuality === 'function' && !navForQuality.__qualityWrapped) {
    var wrappedNavigate = function(page){ navForQuality(page); setTimeout(function(){ if(page && page.indexOf('course-')===0) injectStaticCourseNav(page); },0); };
    wrappedNavigate.__qualityWrapped=true; window.navigate=wrappedNavigate;
  }

  // ---------------- DONATION RECEIPT UPLOAD ----------------
  function patchDonation() {
    var box = document.getElementById('donationSection'); if (!box) return;
    var form = box.querySelector('.donation-form'); if (!form || form.dataset.receiptPatched) return;
    form.dataset.receiptPatched = '1';
    var fileWrap = document.createElement('div');
    fileWrap.className = 'donation-receipt-upload';
    fileWrap.style.cssText='grid-column:1/-1;padding:14px;border:1px dashed #c9a84c;border-radius:10px;background:#fffaf0;';
    fileWrap.innerHTML='<label for="donationReceipt" style="font-weight:700;display:block;margin-bottom:6px;">Payment / Donation Receipt (optional)</label><input id="donationReceipt" type="file" accept="image/*,application/pdf"><small style="display:block;color:#777;margin-top:6px;">Upload a receipt image or PDF. On supported devices you can share the receipt directly with your email/messaging app.</small><div id="donationReceiptStatus" style="margin-top:8px;color:#555;"></div>';
    form.insertBefore(fileWrap, form.querySelector('button[type="submit"]'));
    var input=fileWrap.querySelector('#donationReceipt'), status=fileWrap.querySelector('#donationReceiptStatus');
    input.addEventListener('change', function(){
      var f=input.files && input.files[0];
      if(!f){status.textContent='';return;}
      if(f.size>10*1024*1024){input.value='';status.textContent='Receipt is too large. Please choose a file up to 10 MB.';return;}
      status.textContent='Selected: '+f.name+' ('+Math.round(f.size/1024)+' KB)';
    });
    var originalSubmit = window.submitDonation;
    window.submitDonation = async function(e){
      e.preventDefault();
      var f=input.files && input.files[0];
      if(f && f.size>10*1024*1024){showToast('Receipt must be 10 MB or smaller',true);return;}
      var n=document.getElementById('donorName')?.value.trim()||'', mail=document.getElementById('donorEmail')?.value.trim()||'', amt=document.getElementById('donationAmount')?.value||'', purpose=document.getElementById('donationPurpose')?.value||'';
      if(!n||!mail||!amt){showToast('Donor name, email and amount are required',true);return;}
      var shareText='Creator Hub donation details\nName: '+n+'\nEmail: '+mail+'\nAmount: '+amt+'\nPurpose: '+purpose+(f?'\nReceipt: '+f.name:'');
      if(f && navigator.share && navigator.canShare){
        try{
          if(navigator.canShare({files:[f]})){await navigator.share({title:'Creator Hub Donation',text:shareText,files:[f]});showToast('Donation details and receipt shared');return;}
        }catch(err){if(err && err.name==='AbortError')return;}
      }
      var body=shareText+'\n\nPlease provide donation payment instructions. If the receipt is not attached automatically by your email app, attach '+f.name+' before sending.';
      window.location.href='mailto:info.creatorhubcreatornetwork@gmail.com?subject='+encodeURIComponent('Creator Hub Donation — '+purpose)+'&body='+encodeURIComponent(body);
      showToast('Opening your email app. Attach the selected receipt if it is not included automatically.');
      if(typeof originalSubmit==='function'){} // intentionally do not call the old handler twice
    };
  }

  // ---------------- MAP HARDENING ----------------
  function patchMap() {
    if (typeof window.searchPlace === 'function' && !window.searchPlace.__patched) {
      var oldSearch=window.searchPlace;
      var wrapped=function(){
        try { if (typeof initMap === 'function') initMap(); } catch(e) { showToast('Map could not be initialized',true); return; }
        return oldSearch.apply(this,arguments);
      };
      wrapped.__patched=true; window.searchPlace=wrapped;
    }
  }

  function patchAllStaticCoursePages(){
    ['course-level1','course-assessment','course-senior','course-junior','course-driver-beginner','course-driver-intermediate','course-driver-advanced'].forEach(injectStaticCourseNav);
  }
  function boot(){
    patchJobs();
    patchDonation();
    patchMap();
    patchAllStaticCoursePages();
    if(window.currentCourseView) injectCourseNav();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.addEventListener('load',boot);
  // No DOM observer is used here: job rendering itself mutates the DOM and an observer would recurse.
})();
