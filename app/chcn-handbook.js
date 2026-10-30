/* ===== Creator Hub Creator Network — Handbook Navigation System (v52) =====
   Full handbook layer: data-driven per-course + master handbooks, a persistent
   draggable floating navigation button, a quick-nav drawer (search, categories,
   recent, bookmarks, notes, continue reading), and in-reader navigation (TOC,
   prev/next, jump, search, open-another) that NEVER forces the reader closed.
   Pure additive; reads live course data (COURSE_DATA + NEW_COURSES). Loaded last. */
(function () {
  'use strict';
  var PASS = 80;

  // ---------- storage (per account) ----------
  function email(){try{return localStorage.getItem('chcn_session_email')||'__guest__';}catch(e){return '__guest__';}}
  function k(name){return 'chcn_hb_'+name+'::'+email();}
  function get(name,def){try{var v=localStorage.getItem(k(name));return v==null?def:JSON.parse(v);}catch(e){return def;}}
  function set(name,val){try{localStorage.setItem(k(name),JSON.stringify(val));}catch(e){}}
  // button position is shared (device-level, not per account)
  function cfgGet(def){try{var v=localStorage.getItem('chcn_hb_btncfg');return v==null?def:JSON.parse(v);}catch(e){return def;}}
  function cfgSet(v){try{localStorage.setItem('chcn_hb_btncfg',JSON.stringify(v));}catch(e){}}

  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];});}
  function allCourses(){var o={};try{Object.assign(o,window.COURSE_DATA||{});}catch(e){}try{Object.assign(o,window.NEW_COURSES||{});}catch(e){}return o;}
  function courseName(id){var c=allCourses()[id];return c?(c.name||id):id;}
  function lessonList(c){var out=[];(c.modules||[]).forEach(function(m){(m.lessons||[]).forEach(function(l){if(l.type!=='gate')out.push(l);});});return out;}
  function quizzes(c){return lessonList(c).filter(function(l){return l.type==='quiz';});}
  function lessons(c){return lessonList(c).filter(function(l){return l.type!=='quiz';});}
  function duration(c){
    if(c.totalHours)return c.totalHours+' structured hours';
    var mins=0;lessonList(c).forEach(function(l){var m=/([0-9]+)\s*min/.exec(l.duration||'');if(m)mins+=parseInt(m[1],10);var h=/([0-9]+)\s*hr/.exec(l.duration||'');if(h)mins+=parseInt(h[1],10)*60;});
    if(!mins)return (lessonList(c).length)+' learning items';
    return mins>=60?(Math.round(mins/60*10)/10)+' hours':mins+' minutes';
  }
  function outcomes(c){
    if(c.outcomes&&c.outcomes.length)return c.outcomes.slice();
    return lessons(c).slice(0,6).map(function(l){return 'Demonstrate understanding of: '+l.title;});
  }
  // Category -> which of the six programme handbooks is the reference source.
  function sourceFor(c){
    var cat=(c.cat||'').toLowerCase(), nm=(c.name||'').toLowerCase();
    if(/arts? management|humanit/.test(cat+nm))return 'Arts Management & Humanities Programme Handbook';
    if(/dance/.test(cat+nm))return 'Dance Programme Handbook';
    if(/drama|theatre|acting/.test(cat+nm))return 'Drama Programme Handbook';
    if(/music/.test(cat+nm))return 'Music Programme Handbook';
    if(/visual art|fine art|ceramic|paint/.test(cat+nm))return 'Visual Arts Programme Handbook';
    return 'HEART/NSTA Trust NVQ-J curriculum / O*NET occupational material (TVET)';
  }
  // ---------- per-course handbook ----------
  function courseHandbook(id,c){
    if(!c)return '<p>Course not found.</p>';
    var level=c.lvlLabel||(c.level?('Level '+c.level):'Foundational');
    var cat=c.cat||'General';
    var cert=c.certFull||c.cert||('Certificate of Completion \u2014 '+c.name);
    var qz=quizzes(c);
    var h='';
    h+='<h2>CHCN Handbook \u2014 '+esc(c.name)+'</h2>';
    h+='<p class="hb-meta"><strong>Category:</strong> '+esc(cat)+' &nbsp;|&nbsp; <strong>Level:</strong> '+esc(level)+' &nbsp;|&nbsp; <strong>Estimated study:</strong> '+esc(duration(c))+'</p>';
    h+='<h3>Overview</h3><p>'+esc(c.desc||('A structured Creator Hub Creator Network programme in '+c.name+'.'))+'</p>';
    h+='<h3>Description &amp; Purpose</h3><p>This handbook is the reference for the CHCN <strong>'+esc(c.name)+'</strong> programme. Its purpose is to describe what the course covers, how it is assessed and what is required for completion. CHCN presents independent educational material and does not claim external accreditation, a degree, or affiliation with any named institution unless separately verified.</p>';
    h+='<h3>Intended Learners</h3><p>Learners who want structured, assessed training in '+esc(cat)+' at the '+esc(level)+' level.</p>';
    h+='<h3>Prerequisites</h3><p>'+esc(c.prerequisites||'No formal prerequisite; a basic command of English and numeracy is recommended.')+'</p>';
    h+='<h3>Learning Outcomes</h3><ul>'+outcomes(c).map(function(o){return '<li>'+esc(o)+'</li>';}).join('')+'</ul>';
    h+='<h3>Skills &amp; Competencies</h3><ul>'+outcomes(c).slice(0,6).map(function(o){return '<li>'+esc(o)+'</li>';}).join('')+'</ul>';
    h+='<h3>Curriculum \u2014 Units, Modules &amp; Lessons</h3>';
    (c.modules||[]).forEach(function(m,mi){
      h+='<p><strong>'+esc(m.title||('Unit '+(mi+1)))+'</strong>'+(m.focus?' \u2014 '+esc(m.focus):'')+'</p><ul>';
      (m.lessons||[]).forEach(function(l){h+='<li>'+(l.type==='quiz'?'\ud83d\udcdd ':'\ud83d\udcd6 ')+esc(l.title)+(l.duration?' <span class="hb-dim">('+esc(l.duration)+')</span>':'')+(l.isFinal?' <em>\u2014 Final Assessment</em>':'')+'</li>';});
      h+='</ul>';
    });
    h+='<h3>Materials &amp; Examples</h3><p>Each lesson provides concepts/vocabulary, worked examples and guided practice drawn from the '+esc(cat)+' curriculum.</p>';
    h+='<h3>Practical Activities &amp; Assignments</h3>';
    if(c.projects&&c.projects.length){h+='<ul>'+c.projects.map(function(p){return '<li>'+esc(p)+'</li>';}).join('')+'</ul>';}
    else{h+='<p>Each module includes guided practice/reflection activities. Complete the practice tasks in each unit before attempting that unit\u2019s knowledge check.</p>';}
    h+='<h3>Reviews</h3><p>Eligible learners can rate and review this course; reviews are moderated. No fake reviews are generated.</p>';
    h+='<h3>Quizzes &amp; Assessments</h3><p>This course contains <strong>'+qz.length+' assessment(s)</strong>'+(qz.length?' ('+qz.map(function(q){return esc(q.title)+' \u2014 '+(q.questions||'?')+' questions';}).join('; ')+')':'')+'.</p>';
    h+='<h3>Pass Requirements</h3><ul>'+
       '<li>Pass mark: <strong>'+PASS+'%</strong> on every required assessment.</li>'+
       '<li><strong>Progression gate:</strong> the next assessment stays locked until the previous one is passed at '+PASS+'%+. Opening a quiz does not unlock the next one.</li>'+
       '<li>Every attempt is recorded (score, percentage, pass/fail, time, answers) in your quiz registry.</li></ul>';
    h+='<h3>Certificate Requirements</h3><ul>'+
       '<li>Complete all required lessons in every unit.</li>'+
       '<li>Pass every required module quiz and the final assessment at '+PASS+'%+.</li>'+
       '<li>Eligibility is then calculated automatically and the certificate (<em>'+esc(cert)+'</em>) is issued with a verification code.</li></ul>';
    try{if(window.CHCN_quizGate&&window.CHCN_quizGate.eligibility&&window.COURSE_DATA&&window.COURSE_DATA[id]){var e=window.CHCN_quizGate.eligibility(id);h+='<p class="hb-dim">Your status: '+e.completedLessons+'/'+e.requiredLessons+' lessons, '+e.passedQuizzes+'/'+e.requiredQuizzes+' quizzes passed \u2014 '+(e.eligible?'<strong>certificate eligible</strong>.':'not yet eligible.')+'</p>';}}catch(_){}
    h+='<h3>Career / Application Context</h3><p>The '+esc(c.name)+' programme builds knowledge and practical skills relevant to '+esc(cat)+'. It is educational and is not a professional licence; verify any regulated requirement with the responsible authority.</p>';
    if(/safety|welding|electric|first aid|driving|forklift|health|plumb|construction/.test((cat+' '+c.name).toLowerCase()))
      h+='<h3>Safety Information</h3><p>Follow all occupational health &amp; safety rules, use the correct PPE, and never attempt a regulated or hazardous task outside a properly supervised setting.</p>';
    h+='<h3>Glossary</h3><ul>'+
       '<li><strong>Knowledge check / quiz:</strong> a timed assessment of a unit\u2019s key concepts.</li>'+
       '<li><strong>Pass mark:</strong> the minimum score ('+PASS+'%) to pass an assessment.</li>'+
       '<li><strong>Progression gate:</strong> the rule that locks the next assessment until the current one is passed.</li>'+
       '<li><strong>Final assessment:</strong> the cumulative assessment required for completion.</li></ul>';
    h+='<h3>References</h3>';
    if(c.sources&&c.sources.length){h+='<ul>'+c.sources.map(function(s){return '<li>'+esc(s[0])+(s[1]?' \u2014 <span class="hb-dim">'+esc(s[1])+'</span>':'')+'</li>';}).join('')+'</ul>';}
    else{h+='<p>Continue with the next level in the '+esc(cat)+' pathway and related CHCN courses.</p>';}
    h+='<h3>Version &amp; Revision History</h3><p class="hb-dim">Reference source: '+esc(sourceFor(c))+'. Handbook format v52. Generated live from the current course data, so edits to the course update this handbook automatically.</p>';
    return h;
  }

  // ---------- master handbook (directory, never a dead end) ----------
  function masterHandbook(){
    var courses=allCourses(), ids=Object.keys(courses);
    var cats={};ids.forEach(function(id){var cat=courses[id].cat||'General';(cats[cat]=cats[cat]||[]).push(id);});
    var totalQ=0;ids.forEach(function(id){totalQ+=quizzes(courses[id]).length;});
    var h='';
    h+='<h2>Creator Hub Creator Network \u2014 Master Academic &amp; Learning Handbook</h2>';
    h+='<p>How learning, assessment and certification work across the whole CHCN platform. CHCN is an independent learning platform and does not claim external accreditation unless separately verified. Use the floating \ud83d\udcd8 button or the cards below to open any course handbook \u2014 you do not need to close this one.</p>';
    h+='<h3>Directory \u2014 Course Categories</h3><div class="hb-cards">';
    Object.keys(cats).sort().forEach(function(cat){h+='<a class="hb-card" data-cat="'+esc(cat)+'"><strong>'+esc(cat)+'</strong><span class="hb-dim">'+cats[cat].length+' handbook(s)</span></a>';});
    h+='</div>';
    h+='<h3>All Course Handbooks</h3><div class="hb-cards">';
    ids.sort(function(a,b){return courseName(a).localeCompare(courseName(b));}).forEach(function(id){h+='<a class="hb-card" data-hb="'+esc(id)+'">\ud83d\udcd8 '+esc(courseName(id))+'<span class="hb-dim">'+esc(courses[id].cat||'')+'</span></a>';});
    h+='</div>';
    h+='<h3>Academic Structure</h3><p>CHCN organises learning as <strong>Course \u2192 Unit/Module \u2192 Lesson \u2192 Practice \u2192 Quiz \u2192 Final Assessment \u2192 Completion \u2192 Certificate</strong>. '+ids.length+' courses across '+Object.keys(cats).length+' categories, with '+totalQ+' assessments.</p>';
    h+='<h3>80% Progression Gate</h3><p>A required quiz stays <strong>locked</strong> until the previous required item is complete and its quiz is passed at <strong>'+PASS+'%+</strong>. Opening a quiz does not unlock the next one. Example: Quiz 1 at 75% = FAILED \u2192 Quiz 2 LOCKED; Quiz 1 at 85% = PASSED \u2192 Quiz 2 UNLOCKS.</p>';
    h+='<h3>Quiz Registry</h3><p>Every attempt is stored per account (user, course, unit, quiz, attempt, score, percentage, pass/fail, date, time used, answers). The registry drives progression and certificate eligibility.</p>';
    h+='<h3>Certificate Requirements &amp; Verification</h3><p>Certificates are not issued on a button click. Eligibility is calculated from required lessons, all required quizzes at '+PASS+'%+ and the final assessment, then issued with a verification code.</p>';
    h+='<h3>Review System</h3><p>Eligible learners may rate and review courses; administrators moderate. No fake reviews are generated.</p>';
    h+='<h3>Academic Integrity</h3><p>Assessments must be the learner\u2019s own genuine effort. Active-assessment answers are not revealed in a way that defeats the assessment.</p>';
    h+='<h3>Roles &amp; Support</h3><p>Student, Instructor/Content Manager, Moderator and Admin/Super Admin roles are supported. Use the in-app assistant and search for help.</p>';
    return h;
  }
  // ---------- styles ----------
  function ensureStyles(){
    if(document.getElementById('chcn-hb-style'))return;
    var s=document.createElement('style');s.id='chcn-hb-style';
    s.textContent='.chcn-hb-ov{position:fixed;inset:0;background:rgba(15,23,42,.6);z-index:99998;display:none}'+
      '.chcn-hb-ov.open{display:block}.chcn-hb-box{position:absolute;inset:16px;max-width:1000px;margin:0 auto;background:#fff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.3);display:flex;flex-direction:column;overflow:hidden}'+
      '.chcn-hb-bar{display:flex;gap:6px;align-items:center;padding:10px 12px;background:#0f172a;color:#fff;flex-wrap:wrap}'+
      '.chcn-hb-bar input{flex:1;min-width:120px;padding:7px 10px;border-radius:8px;border:1px solid #334155;background:#1e293b;color:#fff}'+
      '.chcn-hb-bar button{padding:7px 10px;border:0;border-radius:8px;background:#2563eb;color:#fff;cursor:pointer;font-size:13px}'+
      '.chcn-hb-bar button.alt{background:#475569}.chcn-hb-main{display:flex;flex:1;min-height:0}'+
      '.chcn-hb-toc{width:230px;border-right:1px solid #e5e7eb;overflow:auto;padding:10px;font-size:13px;background:#f8fafc}'+
      '.chcn-hb-toc a{display:block;padding:5px 8px;border-radius:6px;color:#334155;cursor:pointer;text-decoration:none}'+
      '.chcn-hb-toc a.cur{background:#dbeafe;color:#1d4ed8;font-weight:600}'+
      '.chcn-hb-content{flex:1;overflow:auto;padding:16px 22px;line-height:1.55;color:#1e293b}'+
      '.chcn-hb-content h2{margin-top:0}.chcn-hb-content h3{margin:18px 0 6px;color:#0f172a;scroll-margin-top:8px}'+
      '.chcn-hb-dim{color:#64748b;font-size:.9em}.hb-meta{color:#475569}'+
      '.chcn-hb-navrow{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px;position:sticky;top:0;background:#fff;padding:6px 0;border-bottom:1px solid #eee;z-index:1}'+
      '.chcn-hb-navrow button,.chcn-hb-navrow select{padding:6px 9px;border:1px solid #cbd5e1;border-radius:7px;background:#f8fafc;cursor:pointer;font-size:12px}'+
      '.hb-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;margin:8px 0}'+
      '.hb-card{display:flex;flex-direction:column;gap:3px;padding:10px 12px;border:1px solid #e5e7eb;border-radius:10px;color:#1d4ed8;cursor:pointer;text-decoration:none;background:#fff}'+
      '.hb-card:hover{background:#eff6ff;border-color:#93c5fd}'+
      '.chcn-hb-secbtn{border:0;background:transparent;cursor:pointer;font-size:13px;margin-left:6px}'+
      '.chcn-hb-drawer{position:absolute;top:0;left:0;bottom:0;width:300px;max-width:85%;background:#fff;box-shadow:4px 0 24px rgba(0,0,0,.25);transform:translateX(-105%);transition:transform .2s;overflow:auto;z-index:3;padding:12px}'+
      '.chcn-hb-drawer.open{transform:none}.chcn-hb-drawer h4{margin:14px 0 6px;font-size:13px;text-transform:uppercase;color:#64748b}'+
      '.chcn-hb-drawer a{display:block;padding:6px 8px;border-radius:6px;color:#1d4ed8;cursor:pointer;text-decoration:none;font-size:13px}'+
      '.chcn-hb-drawer a:hover{background:#eff6ff}.chcn-hb-drawer a.cur{background:#dbeafe;font-weight:600}'+
      '.chcn-hb-launch{position:fixed;z-index:9997;background:#0f172a;color:#fff;border:0;border-radius:999px;padding:11px 15px;box-shadow:0 6px 20px rgba(0,0,0,.28);cursor:pointer;font-size:14px;touch-action:none;user-select:none}'+
      '.chcn-hb-hl{background:#fde68a}@media(max-width:640px){.chcn-hb-toc{display:none}.chcn-hb-box{inset:0;border-radius:0}}';
    document.head.appendChild(s);
  }

  // ---------- reader ----------
  var cur={type:'master',id:null}, sections=[];
  function ov(){
    var o=document.getElementById('chcn-hb-ov');if(o)return o;
    ensureStyles();
    o=document.createElement('div');o.id='chcn-hb-ov';o.className='chcn-hb-ov';
    o.innerHTML='<div class="chcn-hb-box">'+
      '<div class="chcn-hb-bar">'+
        '<button class="alt" id="hb-menu">\u2630 Handbooks</button>'+
        '<input id="hb-find" placeholder="Search in this handbook\u2026">'+
        '<button id="hb-read">\ud83d\udd0a</button><button class="alt" id="hb-stop">\u23f9</button>'+
        '<button class="alt" id="hb-print">\ud83d\udda8</button><button class="alt" id="hb-dl">\u2b07</button>'+
        '<button class="alt" id="hb-close">\u2715</button></div>'+
      '<div class="chcn-hb-main"><div class="chcn-hb-toc" id="hb-toc"></div><div class="chcn-hb-content" id="hb-content"></div></div>'+
      '<div class="chcn-hb-drawer" id="hb-drawer"></div></div>';
    document.body.appendChild(o);
    o.querySelector('#hb-close').onclick=close;
    o.querySelector('#hb-menu').onclick=toggleDrawer;
    o.querySelector('#hb-read').onclick=readAloud;
    o.querySelector('#hb-stop').onclick=stopRead;
    o.querySelector('#hb-print').onclick=printHb;
    o.querySelector('#hb-dl').onclick=downloadHb;
    o.querySelector('#hb-find').addEventListener('input',function(e){findInHb(e.target.value);});
    content().addEventListener('scroll',onScroll);
    return o;
  }
  function box(){return ov().querySelector('.chcn-hb-box');}
  function content(){return ov().querySelector('#hb-content');}
  function open(){ov().classList.add('open');}
  function close(){saveContinue();stopRead();ov().classList.remove('open');}
  function title(){return cur.type==='master'?'CHCN Master Handbook':('CHCN Handbook \u2014 '+courseName(cur.id));}
  function currentHtml(){return cur.type==='master'?masterHandbook():courseHandbook(cur.id,allCourses()[cur.id]);}

  function render(){
    var c=content();c.innerHTML=currentHtml();
    // assign section ids + bookmark/note buttons
    sections=[];var hs=c.querySelectorAll('h3');
    hs.forEach(function(hh,i){hh.id='hb-sec-'+i;sections.push({i:i,title:hh.textContent});
      var bm=document.createElement('button');bm.className='chcn-hb-secbtn';bm.title='Bookmark';bm.textContent='\u2606';bm.onclick=function(e){e.stopPropagation();toggleBookmark(i,hh.textContent);};
      var nt=document.createElement('button');nt.className='chcn-hb-secbtn';nt.title='Note';nt.textContent='\u270e';nt.onclick=function(e){e.stopPropagation();addNote(i,hh.textContent);};
      hh.appendChild(bm);hh.appendChild(nt);});
    // nav row (prev/next/jump + directory + open-another)
    var nav=document.createElement('div');nav.className='chcn-hb-navrow';
    var jump='<select id="hb-jump"><option>Jump to section\u2026</option>'+sections.map(function(s){return '<option value="'+s.i+'">'+esc(s.title.replace(/[\u2606\u270e\u2605]/g,'').trim())+'</option>';}).join('')+'</select>';
    nav.innerHTML='<button id="hb-prev">\u2190 Prev</button><button id="hb-next">Next \u2192</button>'+jump+
      '<button id="hb-dir">\ud83d\udcda Directory</button><button id="hb-another">\ud83d\udcd8 Open another</button>';
    c.insertBefore(nav,c.firstChild);
    nav.querySelector('#hb-prev').onclick=function(){gotoSection(curSection-1);};
    nav.querySelector('#hb-next').onclick=function(){gotoSection(curSection+1);};
    nav.querySelector('#hb-jump').onchange=function(e){if(e.target.value!==''&&!isNaN(e.target.value))gotoSection(parseInt(e.target.value,10));};
    nav.querySelector('#hb-dir').onclick=showMaster;
    nav.querySelector('#hb-another').onclick=openDrawer;
    // master directory cards clickable
    c.querySelectorAll('[data-hb]').forEach(function(a){a.onclick=function(){showCourse(a.getAttribute('data-hb'));};});
    c.querySelectorAll('[data-cat]').forEach(function(a){a.onclick=function(){openDrawer(a.getAttribute('data-cat'));};});
    buildTOC();pushRecent();buildDrawer();curSection=0;
    var fi=ov().querySelector('#hb-find');if(fi)fi.value='';
  }
  var curSection=0;
  function buildTOC(){
    var t=ov().querySelector('#hb-toc');
    t.innerHTML='<div class="chcn-hb-dim" style="margin-bottom:6px">Table of contents</div>'+
      sections.map(function(s){return '<a data-sec="'+s.i+'">'+esc(s.title.replace(/[\u2606\u270e\u2605]/g,'').trim())+'</a>';}).join('');
    t.querySelectorAll('[data-sec]').forEach(function(a){a.onclick=function(){gotoSection(parseInt(a.getAttribute('data-sec'),10));};});
  }
  function gotoSection(i){if(i<0||i>=sections.length)return;curSection=i;var el=content().querySelector('#hb-sec-'+i);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});markTOC();}
  function markTOC(){var as=ov().querySelectorAll('#hb-toc [data-sec]');as.forEach(function(a){a.classList.toggle('cur',parseInt(a.getAttribute('data-sec'),10)===curSection);});}
  function onScroll(){var c=content(),top=c.scrollTop+90,idx=0;for(var i=0;i<sections.length;i++){var el=c.querySelector('#hb-sec-'+i);if(el&&el.offsetTop<=top)idx=i;}if(idx!==curSection){curSection=idx;markTOC();}}
  function findInHb(q){var c=content();c.querySelectorAll('.chcn-hb-hl').forEach(function(sp){var p=sp.parentNode;p.replaceChild(document.createTextNode(sp.textContent),sp);p.normalize();});if(!q||q.length<2)return;var rx=new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig');var first=null;c.querySelectorAll('p,li,td').forEach(function(node){if(rx.test(node.textContent)&&node.children.length===0){node.innerHTML=node.innerHTML.replace(rx,'<span class="chcn-hb-hl">$1</span>');if(!first)first=node.querySelector('.chcn-hb-hl');}});if(first)first.scrollIntoView({behavior:'smooth',block:'center'});}

  function showMaster(){stopRead();saveContinue();cur={type:'master',id:null};render();open();closeDrawer();}
  function showCourse(id){if(!allCourses()[id])return;stopRead();saveContinue();cur={type:'course',id:id};render();open();closeDrawer();}
  // ---------- drawer (quick nav) ----------
  function drawerEl(){return ov().querySelector('#hb-drawer');}
  function toggleDrawer(){var d=drawerEl();d.classList.contains('open')?closeDrawer():openDrawer();}
  function openDrawer(filterCat){buildDrawer(typeof filterCat==='string'?filterCat:'');drawerEl().classList.add('open');}
  function closeDrawer(){drawerEl().classList.remove('open');}
  function buildDrawer(filterCat){
    var d=drawerEl();if(!d)return;var courses=allCourses();
    var cats={};Object.keys(courses).forEach(function(id){var cat=courses[id].cat||'General';(cats[cat]=cats[cat]||[]).push(id);});
    var cont=get('continue',null);
    var h='<div style="display:flex;gap:6px;align-items:center;margin-bottom:8px"><strong style="flex:1">Handbooks</strong><button class="chcn-hb-secbtn" id="hb-dclose" title="Close">\u2715</button></div>';
    h+='<input id="hb-search" placeholder="Search all handbooks\u2026" style="width:100%;padding:7px 9px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:6px">';
    h+='<h4>Quick actions</h4>';
    if(cont)h+='<a id="hb-continue">\u25b6 Continue: '+esc(cont.label||'last handbook')+'</a>';
    h+='<a data-master="1" class="'+(cur.type==='master'?'cur':'')+'">\ud83c\udfdb\ufe0f Master Handbook</a>';
    h+='<a id="hb-bk">\u2b50 Bookmarks ('+(get('bookmarks',[]).length)+')</a>';
    h+='<a id="hb-nt">\u270e Notes ('+(get('notes',[]).length)+')</a>';
    h+='<a id="hb-rd">\ud83d\udd0a Read aloud</a>';
    var recent=get('recent',[]);
    if(recent.length){h+='<h4>Recent</h4>';recent.slice(0,6).forEach(function(r){h+='<a data-hb="'+esc(r)+'" class="'+(cur.id===r?'cur':'')+'">\ud83d\udcd8 '+esc(courseName(r))+'</a>';});}
    Object.keys(cats).sort().forEach(function(cat){
      if(filterCat&&cat!==filterCat)return;
      h+='<h4>'+esc(cat)+'</h4>';
      cats[cat].sort(function(a,b){return courseName(a).localeCompare(courseName(b));}).forEach(function(id){h+='<a data-hb="'+esc(id)+'" class="'+(cur.id===id?'cur':'')+'">\ud83d\udcd8 '+esc(courseName(id))+'</a>';});
    });
    d.innerHTML=h;
    d.querySelector('#hb-dclose').onclick=closeDrawer;
    d.querySelectorAll('[data-hb]').forEach(function(a){a.onclick=function(){showCourse(a.getAttribute('data-hb'));};});
    var m=d.querySelector('[data-master]');if(m)m.onclick=showMaster;
    var cEl=d.querySelector('#hb-continue');if(cEl&&cont)cEl.onclick=function(){cont.type==='master'?showMaster():showCourse(cont.id);setTimeout(function(){gotoSection(cont.sec||0);},300);};
    d.querySelector('#hb-rd').onclick=readAloud;
    d.querySelector('#hb-bk').onclick=showBookmarks;
    d.querySelector('#hb-nt').onclick=showNotes;
    d.querySelector('#hb-search').addEventListener('input',function(e){searchAll(e.target.value,d);});
  }
  function searchAll(q,d){
    var box=d.querySelector('#hb-results')||(function(){var x=document.createElement('div');x.id='hb-results';d.insertBefore(x,d.querySelector('h4'));return x;})();
    q=(q||'').trim().toLowerCase();if(q.length<2){box.innerHTML='';return;}
    var courses=allCourses(),hits=[];
    Object.keys(courses).forEach(function(id){var c=courses[id];var hay=(c.name+' '+(c.cat||'')+' '+(c.desc||'')).toLowerCase();var secs=[];lessonList(c).forEach(function(l){if(l.title.toLowerCase().indexOf(q)!==-1)secs.push(l.title);});if(hay.indexOf(q)!==-1||secs.length)hits.push({id:id,sec:secs[0]});});
    box.innerHTML='<h4>Results ('+hits.length+')</h4>'+hits.slice(0,20).map(function(hh){return '<a data-hb="'+esc(hh.id)+'">\ud83d\udcd8 '+esc(courseName(hh.id))+(hh.sec?'<span class="chcn-hb-dim"> \u2014 '+esc(hh.sec)+'</span>':'')+'</a>';}).join('');
    box.querySelectorAll('[data-hb]').forEach(function(a){a.onclick=function(){showCourse(a.getAttribute('data-hb'));};});
  }
  function showBookmarks(){var bk=get('bookmarks',[]);var h='<h2>\u2b50 Bookmarks</h2>';h+=bk.length?('<ul>'+bk.map(function(b,i){return '<li><a data-bk="'+i+'">'+esc(b.label)+'</a> <span class="chcn-hb-dim">\u2014 '+esc(b.section)+'</span></li>';}).join('')+'</ul>'):'<p>No bookmarks yet. Open a handbook and tap \u2606 beside a section.</p>';content().innerHTML=h;content().querySelectorAll('[data-bk]').forEach(function(a){a.onclick=function(){var b=bk[parseInt(a.getAttribute('data-bk'),10)];if(b.type==='master')showMaster();else showCourse(b.id);setTimeout(function(){gotoSection(b.sec);},300);};});closeDrawer();open();}
  function showNotes(){var nt=get('notes',[]);var h='<h2>\u270e My Notes</h2>';h+=nt.length?('<ul>'+nt.map(function(n,i){return '<li><strong>'+esc(courseName(n.id)||'Master')+'</strong> \u2014 '+esc(n.section)+'<br><span class="chcn-hb-dim">'+esc(n.text)+'</span> <a data-del="'+i+'" class="chcn-hb-dim">[delete]</a></li>';}).join('')+'</ul>'):'<p>No notes yet. Open a handbook and tap \u270e beside a section.</p>';content().innerHTML=h;content().querySelectorAll('[data-del]').forEach(function(a){a.onclick=function(){nt.splice(parseInt(a.getAttribute('data-del'),10),1);set('notes',nt);showNotes();};});closeDrawer();open();}

  // ---------- per-user actions ----------
  function pushRecent(){if(cur.type!=='course')return;var r=get('recent',[]).filter(function(x){return x!==cur.id;});r.unshift(cur.id);set('recent',r.slice(0,12));}
  function toggleBookmark(i,label){var bk=get('bookmarks',[]);var key=(cur.id||'master')+'#'+i;var ex=bk.findIndex(function(b){return (b.id||'master')+'#'+b.sec===key;});if(ex>=0){bk.splice(ex,1);}else{bk.push({type:cur.type,id:cur.id,sec:i,section:label.replace(/[\u2606\u270e\u2605]/g,'').trim(),label:title()});}set('bookmarks',bk);buildDrawer();}
  function addNote(i,label){var txt=prompt('Note for \u201c'+label.replace(/[\u2606\u270e\u2605]/g,'').trim()+'\u201d:');if(!txt)return;var nt=get('notes',[]);nt.push({type:cur.type,id:cur.id,sec:i,section:label.replace(/[\u2606\u270e\u2605]/g,'').trim(),text:txt});set('notes',nt);buildDrawer();}
  function saveContinue(){try{set('continue',{type:cur.type,id:cur.id,sec:curSection,label:title()});}catch(e){}}

  // ---------- read aloud / print / download ----------
  function readAloud(){try{if(!('speechSynthesis'in window))return;stopRead();var t=content().innerText||'';if(!t.trim())return;var u=new SpeechSynthesisUtterance(t.slice(0,9000));u.rate=1;window.speechSynthesis.speak(u);}catch(e){}}
  function stopRead(){try{if('speechSynthesis'in window)window.speechSynthesis.cancel();}catch(e){}}
  function printHb(){try{var w=window.open('','_blank');if(!w)return;w.document.write('<html><head><title>'+esc(title())+'</title></head><body>'+currentHtml()+'</body></html>');w.document.close();w.focus();w.print();}catch(e){}}
  function downloadHb(){try{var html='<!doctype html><meta charset="utf-8"><title>'+esc(title())+'</title><body style="font-family:system-ui;max-width:800px;margin:24px auto;line-height:1.55">'+currentHtml()+'</body>';var b=new Blob([html],{type:'text/html'});var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=(title().replace(/[^a-z0-9]+/ig,'-'))+'.html';document.body.appendChild(a);a.click();document.body.removeChild(a);}catch(e){}}
  // ---------- floating button (draggable + persistent + safe area) ----------
  function defaultCfg(){return {show:true,x:null,y:null,side:'right',anchor:'bottom'};}
  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function applyBtnPos(b){
    var cfg=cfgGet(defaultCfg());
    b.style.display=cfg.show?'block':'none';
    var vw=window.innerWidth,vh=window.innerHeight,bw=b.offsetWidth||120,bh=b.offsetHeight||44;
    var safe=16;
    if(cfg.x!=null&&cfg.y!=null){
      b.style.left=clamp(cfg.x,safe,vw-bw-safe)+'px';
      b.style.top=clamp(cfg.y,safe,vh-bh-safe-70)+'px';// keep clear of bottom nav bar
      b.style.right='';b.style.bottom='';
    }else{
      b.style.left=cfg.side==='left'?safe+'px':(vw-bw-safe)+'px';
      b.style.right='';
      b.style.top=cfg.anchor==='top'?safe+'px':(cfg.anchor==='middle'?(vh/2-bh/2)+'px':(vh-bh-safe-70)+'px');
      b.style.bottom='';
    }
  }
  function addLauncher(){
    if(document.getElementById('chcn-hb-launch'))return;
    ensureStyles();
    var b=document.createElement('button');b.id='chcn-hb-launch';b.className='chcn-hb-launch';b.textContent='\ud83d\udcd8 Handbooks';
    document.body.appendChild(b);applyBtnPos(b);
    var drag=false,moved=false,ox=0,oy=0;
    function start(e){drag=true;moved=false;var p=e.touches?e.touches[0]:e;var r=b.getBoundingClientRect();ox=p.clientX-r.left;oy=p.clientY-r.top;e.preventDefault();}
    function move(e){if(!drag)return;var p=e.touches?e.touches[0]:e;moved=true;b.style.left=(p.clientX-ox)+'px';b.style.top=(p.clientY-oy)+'px';b.style.right='';b.style.bottom='';}
    function end(){if(!drag)return;drag=false;if(moved){var r=b.getBoundingClientRect();var cfg=cfgGet(defaultCfg());cfg.x=r.left;cfg.y=r.top;cfgSet(cfg);applyBtnPos(b);}else{openHub();}}
    b.addEventListener('mousedown',start);window.addEventListener('mousemove',move);window.addEventListener('mouseup',end);
    b.addEventListener('touchstart',start,{passive:false});window.addEventListener('touchmove',move,{passive:false});window.addEventListener('touchend',end);
    window.addEventListener('resize',function(){applyBtnPos(b);});
  }
  function refreshBtn(){var b=document.getElementById('chcn-hb-launch');if(b)applyBtnPos(b);}

  // ---------- Tools settings panel ----------
  function settingsHtml(){
    var cfg=cfgGet(defaultCfg());var ck=function(v){return v?'checked':'';};var sel=function(a,b){return a===b?'selected':'';};
    return '<div class="ct-card" style="background:#fff;border:1px solid #e6e8eb;border-radius:12px;padding:16px;margin:12px 0;max-width:520px">'+
      '<h3>\ud83d\udcd8 Handbook Floating Button</h3>'+
      '<label style="display:flex;gap:8px;align-items:center;margin:8px 0"><input type="checkbox" id="hbset-show" '+ck(cfg.show)+'> Show floating handbook button</label>'+
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:8px 0"><label>Side <select id="hbset-side"><option value="right" '+sel(cfg.side,'right')+'>Right</option><option value="left" '+sel(cfg.side,'left')+'>Left</option></select></label>'+
      '<label>Position <select id="hbset-anchor"><option value="top" '+sel(cfg.anchor,'top')+'>Top</option><option value="middle" '+sel(cfg.anchor,'middle')+'>Middle</option><option value="bottom" '+sel(cfg.anchor,'bottom')+'>Bottom</option></select></label>'+
      '<button id="hbset-reset" style="padding:6px 10px;border:1px solid #cbd5e1;border-radius:7px;background:#f8fafc;cursor:pointer">Reset position</button></div>'+
      '<p class="chcn-hb-dim">You can also drag the button anywhere on screen; its position is remembered and kept clear of the bottom navigation bar.</p></div>';
  }
  function wireSettings(root){
    root=root||document;
    var sh=root.querySelector('#hbset-show');if(!sh)return;
    function save(){var cfg=cfgGet(defaultCfg());cfg.show=root.querySelector('#hbset-show').checked;cfg.side=root.querySelector('#hbset-side').value;cfg.anchor=root.querySelector('#hbset-anchor').value;cfgSet(cfg);refreshBtn();}
    sh.onchange=save;root.querySelector('#hbset-side').onchange=function(){var cfg=cfgGet(defaultCfg());cfg.x=null;cfg.y=null;cfgSet(cfg);save();};
    root.querySelector('#hbset-anchor').onchange=function(){var cfg=cfgGet(defaultCfg());cfg.x=null;cfg.y=null;cfgSet(cfg);save();};
    root.querySelector('#hbset-reset').onclick=function(){var cfg=cfgGet(defaultCfg());cfg.x=null;cfg.y=null;cfgSet(cfg);refreshBtn();};
  }
  // inject the settings card into the Tools page when it renders
  function injectToolsSettings(){
    var el=document.getElementById('page-tools');if(!el||el.querySelector('#hbset-show'))return;
    var wrap=el.querySelector('.ct-wrap')||el;var div=document.createElement('div');div.innerHTML=settingsHtml();wrap.appendChild(div);wireSettings(wrap);
  }

  function openHub(){stopRead();if(cur.type==='master'||!cur.id){cur={type:'master',id:null};}render();open();openDrawer();}

  // ---------- exports + install ----------
  window.CHCN_handbook={openHub:openHub,showMaster:showMaster,showCourse:showCourse,buildCourse:courseHandbook,buildMaster:masterHandbook,settingsHtml:settingsHtml,wireSettings:wireSettings,refreshButton:refreshBtn};
  window.openCHCNHandbook=openHub;window.openCourseHandbook=showCourse;window.openHandbookSettings=function(){injectToolsSettings();};

  function hook(fn,resolver){if(typeof window[fn]!=='function'||window[fn].__chcnHB)return;var orig=window[fn];window[fn]=function(){var r=orig.apply(this,arguments);try{if(fn==='renderTools'||arguments[0]==='tools')setTimeout(injectToolsSettings,200);var id=resolver?resolver.apply(this,arguments):null;}catch(e){}return r;};window[fn].__chcnHB=true;}
  function install(){addLauncher();hook('renderTools');hook('navigate',function(p){return p;});setTimeout(injectToolsSettings,500);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
