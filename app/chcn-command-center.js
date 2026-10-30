/* ===== CHCN AI Command Center (v53) — natural-language intent router =====
 * ADDITIVE. Does NOT create a parallel command system: it delegates into the
 * EXISTING CHCN.Commands registry + real global functions (navigate,
 * openTVETCourse, openCHCNHandbook/openCourseHandbook, MSshow, GCshow,
 * CHCN_integrity.audit, startQuiz, handleSignOut ...).
 *
 * Voice + text parity (directive PART XLVIII): the panel's text box AND its
 * mic BOTH call CHCN_CC.run(); every new phrase is ALSO registered into
 * CHCN.Commands, so the global voice mic (onCommand -> CHCN.Commands.handle)
 * reaches the exact same handlers.
 *
 * Honesty: every action verifies its real target exists first; if it does not,
 * it reports an honest 'not available here' instead of pretending.
 * Destructive acts (sign out) require an explicit yes/no confirmation.
 * ====================================================================== */
(function (W, D) {
  'use strict';
  if (W.CHCN_CC) return;
  var CHCN = W.CHCN = W.CHCN || {};

  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function hasFn(n){return typeof W[n]==='function';}
  function speak(t){ try{ if(CHCN.Voice&&CHCN.Voice.announce) CHCN.Voice.announce(t); }catch(e){} }
  function nav(p){ if(hasFn('navigate')){ W.navigate(p); return true; } return false; }
  function pageExists(p){ return !!D.getElementById('page-'+p); }

  /* ---- session context memory ---------------------------------------- */
  var ctx = { lastCourse:null, lastCourseName:'', lastGame:null, lastIntent:null };

  /* ---- course resolver (fuzzy over the REAL NEW_COURSES catalogue) ---- */
  function courseList(){ var o=W.NEW_COURSES||{}; return Object.keys(o).map(function(k){ return {slug:k, name:o[k].name||k}; }); }
  function findCourse(q){
    q=(q||'').toLowerCase().replace(/\b(course|programme|program|the|open|my|start|show|go to)\b/g,' ').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
    if(!q) return null;
    var list=courseList(); if(!list.length) return null;
    var qw=q.split(' ').filter(function(w){return w.length>2;});
    var best=null,bestScore=0;
    list.forEach(function(c){
      var name=c.name.toLowerCase(), score=0;
      qw.forEach(function(w){ if(name.indexOf(w)!==-1) score+=w.length; });
      if(name.indexOf(q)!==-1) score+=q.length*2;
      if(score>bestScore){ bestScore=score; best=c; }
    });
    return bestScore>=3?best:null;
  }

  /* ---- game resolver (REAL GCshow keys) ------------------------------ */
  var GAMES={ memory:['memory match','memory'], mines:['minesweeper','mines'],
    merge:['number merge','2048','merge'], snake:['snake'], simon:['simon says','simon'],
    math:['math challenge','maths game','math game','math'], scramble:['word scramble','scramble'],
    capitals:['capital cities','capitals','capital'], typing:['typing test','typing'] };
  function findGame(q){ q=(q||'').toLowerCase(); for(var k in GAMES){ for(var i=0;i<GAMES[k].length;i++){ if(q.indexOf(GAMES[k][i])!==-1) return k; } } return null; }

  /* =====================================================================
   * ACTIONS — each one calls a REAL existing function and verifies it.
   * They return a short natural-language result string (also spoken).
   * ================================================================== */
  function A_navigate(page,label){ return function(){ if(!pageExists(page)){ return 'The '+label+' page is not available here.'; } nav(page); return 'Opening '+label+'.'; }; }

  function openCourse(name){
    var c=findCourse(name);
    if(!c){ nav('courses'); return 'I could not find a course called “'+name+'”, so here is the full course list.'; }
    if(!hasFn('openTVETCourse')){ nav('courses'); return 'Here are the courses.'; }
    W.openTVETCourse(c.slug); ctx.lastCourse=c.slug; ctx.lastCourseName=c.name;
    return 'Opening '+c.name+'.';
  }

  function openStudentHandbook(){
    if(hasFn('openCHCNHandbook')){ W.openCHCNHandbook(); return 'Opening the student handbook.'; }
    return 'The handbook is not available here.';
  }
  function openCourseHandbookFor(name){
    var slug=null,cname='';
    if(name){ var c=findCourse(name); if(c){ slug=c.slug; cname=c.name; } }
    if(!slug && ctx.lastCourse){ slug=ctx.lastCourse; cname=ctx.lastCourseName; }
    if(!hasFn('openCourseHandbook')){ return 'The course handbook is not available here.'; }
    if(!slug){ return 'Open a course first, then say “show its handbook”.'; }
    W.openCourseHandbook(slug); ctx.lastCourse=slug; ctx.lastCourseName=cname;
    return 'Opening the handbook'+(cname?' for '+cname:'')+'.';
  }
  function openHandbookSettings(){ if(hasFn('openHandbookSettings')){ W.openHandbookSettings(); return 'Opening handbook settings.'; } return 'Handbook settings are not available here.'; }

  function openStudioTool(kind){
    if(!pageExists('studio')){ return 'The studio is not available here.'; }
    nav('studio');
    if(!hasFn('MSshow')){ return 'Opening the studio.'; }
    var k = kind==='tuner'?'tuner' : kind==='photo'?'photo' : 'inst';
    setTimeout(function(){ try{ W.MSshow(k); }catch(e){} }, 60);
    return k==='tuner' ? 'Opening the tuner.' : k==='photo' ? 'Opening the photo studio.' : 'Opening the instruments — you can play piano, guitar and bass.';
  }

  function openGames(){ if(!pageExists('games')&&!nav('games')){ return 'The game centre is not available here.'; } nav('games'); return 'Opening the game centre.'; }
  function playGame(name){
    var k=findGame(name);
    if(!k){ openGames(); return 'I could not find that game, so here is the game centre.'; }
    nav('games');
    if(!hasFn('GCshow')){ return 'Opening the game centre.'; }
    setTimeout(function(){ try{ W.GCshow(k); }catch(e){} }, 80);
    ctx.lastGame=k;
    return 'Starting '+k+'.';
  }

  function runIntegrityAudit(){
    if(!(W.CHCN_integrity&&typeof W.CHCN_integrity.audit==='function')){ return 'The integrity audit tool is not available here.'; }
    var r=null; try{ r=W.CHCN_integrity.audit(); }catch(e){ return 'The integrity audit could not run: '+(e&&e.message||'error')+'.'; }
    try{ if(typeof W.CHCN_integrity.renderDashboard==='function') W.CHCN_integrity.renderDashboard(); }catch(e){}
    var n=(r&&r.courses)|| (r&&r.length) || 0;
    var avg=(r&&(r.avg||r.average))||null;
    var msg='Integrity audit complete';
    if(n) msg+=' across '+n+' courses';
    if(avg!=null) msg+=', average match score '+avg;
    return msg+'. Opening the audit dashboard.';
  }

  function startCourseQuiz(name){
    var slug=null;
    if(name){ var c=findCourse(name); if(c){ slug=c.slug; ctx.lastCourse=slug; ctx.lastCourseName=c.name; } }
    if(!slug) slug=ctx.lastCourse;
    if(!slug){ return 'Open a course first, then say “start its quiz”.'; }
    if(hasFn('openTVETCourse')) W.openTVETCourse(slug);
    if(hasFn('startQuiz')){ try{ W.startQuiz(slug,0,0); return 'Starting the first quiz for this course.'; }catch(e){} }
    return 'Opening the course so you can start a quiz.';
  }

  function doSignOut(){ if(hasFn('handleSignOut')){ W.handleSignOut(); return 'You are signed out.'; } return 'I could not find the sign-out option here.'; }

  /* =====================================================================
   * REGISTER new vocabulary INTO the shared CHCN.Commands registry so the
   * global voice mic reaches it too (parity). Registered synchronously at
   * load — BEFORE the assistant's deferred catch-all — so these keep priority.
   * ================================================================== */
  function reg(patterns, handler){ if(CHCN.Commands&&CHCN.Commands.register) CHCN.Commands.register(patterns, function(t,m){ var r=handler(t,m); if(r) speak(r); }); }

  function registerVocabulary(){
    if(!(CHCN.Commands&&CHCN.Commands.register)) return;
    // Studio / instruments
    reg(['open the studio','open studio','studio'], function(){ return openStudioTool('inst'); });
    reg(['play guitar','play the guitar','guitar'], function(){ return openStudioTool('inst'); });
    reg(['play bass','play the bass','bass guitar'], function(){ return openStudioTool('inst'); });
    reg(['play piano','play the piano','piano','keyboard'], function(){ return openStudioTool('inst'); });
    reg(['open instruments','instruments','let me play an instrument'], function(){ return openStudioTool('inst'); });
    reg(['open the tuner','tuner','tune my guitar','guitar tuner'], function(){ return openStudioTool('tuner'); });
    reg(['photo studio','open photo studio','edit a photo'], function(){ return openStudioTool('photo'); });
    // Games
    reg(['open games','open the game centre','open the game center','game centre','game center','games'], function(){ return openGames(); });
    reg([/^(?:play|open|start|launch)\s+(memory(?:\s*match)?|minesweeper|mines|number\s*merge|2048|merge|snake|simon(?:\s*says)?|math(?:s)?(?:\s*(?:game|challenge))?|word\s*scramble|scramble|capital(?:s| cities)?|typing(?:\s*test)?)\b/],
      function(t,m){ return playGame(m[1]); });
    // Handbook
    reg(['open the handbook','open handbook','student handbook','open the student handbook','show the handbook'], function(){ return openStudentHandbook(); });
    reg(['open the course handbook','course handbook','show its handbook','show the course handbook','handbook for this course'], function(){ return openCourseHandbookFor(''); });
    reg([/^(?:open|show)\s+(?:the\s+)?handbook\s+for\s+(.+)/], function(t,m){ return openCourseHandbookFor(m[1]); });
    reg(['handbook settings','open handbook settings'], function(){ return openHandbookSettings(); });
    // Course by name
    reg([/^(?:open|start|go to|take me to|show)\s+(?:the\s+|my\s+)?(.+?)\s+(?:course|programme|program)\b/], function(t,m){ return openCourse(m[1]); });
    reg([/^(?:open|start)\s+(?:the\s+)?course\s+(.+)/], function(t,m){ return openCourse(m[1]); });
    // Quiz for a course
    reg([/^start\s+(?:the\s+|a\s+)?quiz\s+for\s+(.+)/], function(t,m){ return startCourseQuiz(m[1]); });
    reg(['start its quiz','start the quiz for this course','take its quiz'], function(){ return startCourseQuiz(''); });
    // Integrity audit
    reg(['run the integrity audit','integrity audit','run integrity audit','audit the courses','check course integrity','run the course audit'], function(){ return runIntegrityAudit(); });
    // Command book / help (voice can open it too)
    reg(['command center','command centre','command book','open command center','open the command center','what commands do you have'], function(){ openPanel(); showBook(''); return 'Here is the command book — browse or search it.'; });
  }

  /* ---- destructive-intent detection (requires confirmation) ---------- */
  function destructiveOf(t){
    if(/\b(sign|log)\s*(me\s*)?out\b|\bsignout\b|\blogout\b/.test(t)) return { label:'sign you out', run:doSignOut };
    return null;
  }

  /* ---- searchable command catalogue (the “command book”) ------------- */
  var CATALOG=[
    ['Get around', [
      ['Go home','“take me home”, “home”'],
      ['Open courses','“show my courses”'],
      ['Open a course by name','“open the welding course”, “start the plumbing programme”'],
      ['Open my account','“my profile”, “account settings”'],
      ['Open the map','“show the map”, “directions”'],
      ['Open payments / donate','“make a payment”, “donate”'],
      ['Open the studio','“open the studio”'],
      ['Open the game centre','“open games”'],
      ['About / Contact','“about the network”, “contact page”']
    ]],
    ['Learn', [
      ['Student handbook','“open the handbook”'],
      ['Course handbook','“show its handbook”, “handbook for the welding course”'],
      ['Handbook settings','“handbook settings”'],
      ['Start a quiz','“start its quiz”, “start the quiz for the plumbing course”'],
      ['Filter / search courses','“filter courses for electrical”, “search for welding”']
    ]],
    ['Studio & tools', [
      ['Play instruments','“play guitar”, “play piano”, “play bass”'],
      ['Guitar tuner','“open the tuner”'],
      ['Photo studio','“photo studio”'],
      ['Maths & conversions','“what is 15 percent of 200”, “convert 10 miles to km”'],
      ['Time & date','“what time is it”, “what day is it”']
    ]],
    ['Games', [
      ['Play a specific game','“play memory match”, “play snake”, “play 2048”, “play typing test”']
    ]],
    ['Quality', [
      ['Run the integrity audit','“run the integrity audit”, “check course integrity”']
    ]],
    ['Accessibility & voice', [
      ['Read aloud','“read this page”, “stop reading”'],
      ['Voice commands','“turn off voice commands”'],
      ['Text size','“bigger text”, “smaller text”'],
      ['Dark / light mode','“dark mode”, “light mode”']
    ]],
    ['Account', [
      ['Sign out (asks to confirm)','“sign me out”']
    ]]
  ];

  /* =====================================================================
   * DISPATCHER — the single router used by BOTH the text box and the mic.
   * Adds multi-intent chaining, context pronouns, destructive confirmation
   * and honest fallbacks ON TOP OF the shared CHCN.Commands registry.
   * ================================================================== */
  var pending = null;  // { label, run } awaiting yes/no

  function isHelp(t){ return /^(help|what can you (do|help)(\s+me)?|what commands|commands?|command (book|list|cent(er|re)))\s*\??$/.test(t) || t==='?'; }

  // Resolve pronouns against session context before matching.
  function resolveContext(seg){
    var t=seg;
    if(ctx.lastCourseName){
      t=t.replace(/\b(?:its|this course'?s)\s+handbook\b/gi, 'handbook for '+ctx.lastCourseName);
      t=t.replace(/\b(?:its|this course'?s)\s+quiz\b/gi, 'quiz for '+ctx.lastCourseName);
    }
    return t;
  }

  // Split a sentence into chained commands — conservatively.
  function splitIntents(raw){
    var parts=String(raw).split(/\s*(?:;|\band then\b|\bthen\b)\s*/i);
    var out=[];
    parts.forEach(function(p){ p=p.trim(); if(p) out.push(p); });
    return out.length?out:[String(raw).trim()];
  }

  // Run ONE command segment through the shared registry, capturing its reply.
  function execSegment(seg){
    seg=resolveContext(seg);
    var t=seg.toLowerCase().trim();
    if(!t) return '';
    if(isHelp(t)){ openPanel(); showBook(''); var h='Here is the command book — browse or search what I can do.'; speak(h); return h; }
    if(!(CHCN.Commands&&CHCN.Commands.handle)) return 'The command service is not ready yet.';
    var captured=[], orig = CHCN.Voice?CHCN.Voice.announce:null;
    if(CHCN.Voice){ CHCN.Voice.announce=function(x){ captured.push(String(x)); if(orig){ try{ orig.call(CHCN.Voice,x);}catch(e){} } }; }
    var handled=false; try{ handled=CHCN.Commands.handle(seg); }catch(e){}
    if(CHCN.Voice) CHCN.Voice.announce=orig;
    var resp=captured.join(' ').trim();
    if(!handled && !resp) resp='I could not do that one yet. Say “help” to see what I can do.';
    return resp;
  }

  // Public entry point — text box AND mic both call this.
  function run(raw){
    var text=String(raw==null?'':raw).trim();
    if(!text) return;
    logLine('user', text);
    var low=text.toLowerCase();

    // 1) resolve a pending yes/no confirmation first
    if(pending){
      if(/^(yes|yeah|yep|sure|ok(ay)?|do it|go ahead|please|confirm)\b/.test(low)){ var p=pending; pending=null; var r=p.run(); speak(r); logLine('cc', r); return; }
      if(/^(no|nope|nah|cancel|stop|don'?t|never ?mind)\b/.test(low)){ pending=null; var c='Okay, cancelled.'; speak(c); logLine('cc', c); return; }
      pending=null; // not a yes/no — drop it and treat as a fresh command
    }

    // 2) destructive intent — confirm before doing
    var d=destructiveOf(low);
    if(d){ pending=d; var q='Are you sure you want me to '+d.label+'? Say yes or no.'; speak(q); logLine('cc', q); return; }

    // 3) run each chained command segment in order
    var segs=splitIntents(text), replies=[];
    segs.forEach(function(s){
      // a destructive act hidden inside a chain also needs confirmation
      var dd=destructiveOf(s.toLowerCase());
      if(dd){ replies.push('I’ll ask about “'+dd.label+'” separately for your safety.'); pending=dd; return; }
      replies.push(execSegment(s));
    });
    var out=replies.filter(Boolean).join(' ');
    if(out) logLine('cc', out);
    if(pending){ var pq='Are you sure you want me to '+pending.label+'? Say yes or no.'; speak(pq); logLine('cc', pq); }
  }

  /* =====================================================================
   * UI — floating button + chat panel + searchable command book.
   * Built with DOM APIs + addEventListener (no inline handlers / no XSS).
   * ================================================================== */
  var fab, panel, logEl, inputEl, micBtn, bookEl, bookList, bookQ, built=false, recog=null;

  function injectCSS(){
    if(D.getElementById('cc-css')) return;
    var s=D.createElement('style'); s.id='cc-css';
    s.textContent=[
      '#cc-fab{position:fixed;right:18px;bottom:18px;z-index:99990;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;background:#1f6feb;color:#fff;font-size:24px;box-shadow:0 6px 18px rgba(0,0,0,.3)}',
      '#cc-fab:focus{outline:3px solid #90c2ff}',
      '#cc-panel{position:fixed;right:18px;bottom:84px;z-index:99991;width:340px;max-width:calc(100vw - 24px);height:460px;max-height:calc(100vh - 110px);background:#fff;color:#111;border-radius:14px;box-shadow:0 10px 36px rgba(0,0,0,.35);display:none;flex-direction:column;overflow:hidden;font-family:inherit}',
      '#cc-panel.cc-open{display:flex}',
      '.cc-hd{background:#1f6feb;color:#fff;padding:10px 12px;display:flex;align-items:center;gap:8px}',
      '.cc-hd b{font-size:15px;flex:1}',
      '.cc-hd button{background:rgba(255,255,255,.2);border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:13px;padding:4px 8px}',
      '#cc-log{flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:8px;background:#f6f8fa}',
      '.cc-msg{max-width:85%;padding:8px 10px;border-radius:12px;font-size:14px;line-height:1.35;white-space:pre-wrap;word-wrap:break-word}',
      '.cc-user{align-self:flex-end;background:#1f6feb;color:#fff;border-bottom-right-radius:3px}',
      '.cc-bot{align-self:flex-start;background:#e9edf2;color:#111;border-bottom-left-radius:3px}',
      '.cc-row{display:flex;gap:6px;padding:8px;border-top:1px solid #e2e6ea;background:#fff}',
      '#cc-input{flex:1;border:1px solid #cdd3d9;border-radius:18px;padding:8px 12px;font-size:14px;outline:none}',
      '#cc-input:focus{border-color:#1f6feb}',
      '.cc-row button{border:none;border-radius:50%;width:38px;height:38px;cursor:pointer;font-size:17px}',
      '#cc-mic{background:#eef1f4}#cc-mic.cc-live{background:#e5484d;color:#fff}',
      '#cc-send{background:#1f6feb;color:#fff}',
      '#cc-book{position:absolute;inset:0;background:#fff;display:none;flex-direction:column}',
      '#cc-book.cc-open{display:flex}',
      '#cc-book-q{margin:10px;padding:8px 12px;border:1px solid #cdd3d9;border-radius:18px;font-size:14px;outline:none}',
      '#cc-book-list{flex:1;overflow-y:auto;padding:0 12px 12px}',
      '.cc-cat{font-weight:700;margin:12px 0 4px;color:#1f6feb;font-size:13px;text-transform:uppercase;letter-spacing:.04em}',
      '.cc-cmd{padding:7px 0;border-bottom:1px solid #eef1f4}',
      '.cc-cmd .t{font-weight:600;font-size:14px}',
      '.cc-cmd .e{font-size:12.5px;color:#5a6472;margin-top:2px}',
      '@media (prefers-color-scheme:dark){#cc-panel{background:#161b22;color:#e6edf3}#cc-log{background:#0d1117}.cc-bot{background:#21262d;color:#e6edf3}.cc-row,#cc-book{background:#161b22}#cc-input,#cc-book-q{background:#0d1117;color:#e6edf3;border-color:#30363d}.cc-cmd{border-color:#21262d}}'
    ].join('');
    (D.head||D.documentElement).appendChild(s);
  }

  function el(tag,attrs,txt){ var e=D.createElement(tag); if(attrs) for(var k in attrs) e.setAttribute(k,attrs[k]); if(txt!=null) e.textContent=txt; return e; }

  function buildUI(){
    if(built||!D.body) return; built=true; injectCSS();
    fab=el('button',{id:'cc-fab','aria-label':'Open the AI Command Center',title:'AI Command Center'},'\uD83E\uDDED');
    fab.addEventListener('click', togglePanel);
    D.body.appendChild(fab);

    panel=el('div',{id:'cc-panel',role:'dialog','aria-label':'AI Command Center'});
    var hd=el('div',{'class':'cc-hd'});
    hd.appendChild(el('b',null,'AI Command Center'));
    var bBook=el('button',{type:'button',title:'What can you do?'},'What can you do?');
    bBook.addEventListener('click', function(){ showBook(''); });
    var bClose=el('button',{type:'button','aria-label':'Close'},'\u2715');
    bClose.addEventListener('click', closePanel);
    hd.appendChild(bBook); hd.appendChild(bClose);
    panel.appendChild(hd);

    logEl=el('div',{id:'cc-log','aria-live':'polite'});
    panel.appendChild(logEl);

    var row=el('div',{'class':'cc-row'});
    inputEl=el('input',{id:'cc-input',type:'text',placeholder:'Type a command, e.g. “open the welding course”','aria-label':'Command input'});
    inputEl.addEventListener('keydown', function(e){ if(e.key==='Enter'){ submitInput(); } });
    micBtn=el('button',{id:'cc-mic',type:'button','aria-label':'Speak a command',title:'Speak a command'},'\uD83C\uDFA4');
    micBtn.addEventListener('click', toggleMic);
    var send=el('button',{id:'cc-send',type:'button','aria-label':'Send',title:'Send'},'\u27a4');
    send.addEventListener('click', submitInput);
    row.appendChild(inputEl); row.appendChild(micBtn); row.appendChild(send);
    panel.appendChild(row);

    bookEl=el('div',{id:'cc-book'});
    var bhd=el('div',{'class':'cc-hd'});
    bhd.appendChild(el('b',null,'Command book'));
    var bBack=el('button',{type:'button'},'\u2190 Back');
    bBack.addEventListener('click', function(){ bookEl.classList.remove('cc-open'); });
    bhd.appendChild(bBack); bookEl.appendChild(bhd);
    bookQ=el('input',{id:'cc-book-q',type:'text',placeholder:'Search commands…','aria-label':'Search commands'});
    bookQ.addEventListener('input', function(){ renderBook(bookQ.value); });
    bookEl.appendChild(bookQ);
    bookList=el('div',{id:'cc-book-list'}); bookEl.appendChild(bookList);
    panel.appendChild(bookEl);

    D.body.appendChild(panel);
    logLine('cc', 'Hi! I’m your AI Command Center. Tell me what to do in plain words — type it or tap the mic. Say “what can you do” to see everything.');
  }

  function logLine(kind, text){
    if(!built) buildUI(); if(!logEl||!text) return;
    var m=el('div',{'class':'cc-msg '+(kind==='user'?'cc-user':'cc-bot')}, String(text));
    logEl.appendChild(m); logEl.scrollTop=logEl.scrollHeight;
  }

  function renderBook(filter){
    if(!bookList) return;
    filter=String(filter||'').toLowerCase().trim();
    bookList.innerHTML=''; var any=false;
    CATALOG.forEach(function(cat){
      var rows=cat[1].filter(function(c){ return !filter || (c[0]+' '+c[1]).toLowerCase().indexOf(filter)!==-1; });
      if(!rows.length) return; any=true;
      bookList.appendChild(el('div',{'class':'cc-cat'}, cat[0]));
      rows.forEach(function(c){
        var d=el('div',{'class':'cc-cmd'});
        d.appendChild(el('div',{'class':'t'}, c[0]));
        d.appendChild(el('div',{'class':'e'}, 'Try: '+c[1]));
        bookList.appendChild(d);
      });
    });
    if(!any) bookList.appendChild(el('div',{'class':'cc-cmd'}, 'No commands match “'+filter+'”.'));
  }
  function showBook(filter){ if(!built) buildUI(); openPanel(); if(bookQ) bookQ.value=filter||''; renderBook(filter||''); bookEl.classList.add('cc-open'); }

  function openPanel(){ if(!built) buildUI(); if(panel){ panel.classList.add('cc-open'); if(inputEl) try{ inputEl.focus(); }catch(e){} } }
  function closePanel(){ if(panel) panel.classList.remove('cc-open'); if(bookEl) bookEl.classList.remove('cc-open'); stopMic(); }
  function togglePanel(){ if(panel&&panel.classList.contains('cc-open')) closePanel(); else openPanel(); }

  function submitInput(){ if(!inputEl) return; var v=inputEl.value; inputEl.value=''; if(v&&v.trim()) run(v); }

  /* ---- voice input: real Web Speech when present; honest when not ---- */
  function stopMic(){ if(recog){ try{ recog.onend=null; recog.stop(); }catch(e){} recog=null; } if(micBtn) micBtn.classList.remove('cc-live'); }
  function toggleMic(){
    if(recog){ stopMic(); return; }
    var SR=W.SpeechRecognition||W.webkitSpeechRecognition;
    if(!SR){ logLine('cc','Voice input needs a supported speech-recognition service on this device. You can still type your command.'); return; }
    try{
      recog=new SR(); recog.lang=navigator.language||'en-US'; recog.interimResults=false; recog.maxAlternatives=1; recog.continuous=false;
      micBtn.classList.add('cc-live');
      recog.onresult=function(e){ var txt=''; try{ txt=e.results[0][0].transcript; }catch(x){} stopMic(); if(txt&&txt.trim()) run(txt); };
      recog.onerror=function(e){ stopMic(); logLine('cc','I could not hear that ('+(e&&e.error||'error')+'). Please try again or type it.'); };
      recog.onend=function(){ micBtn&&micBtn.classList.remove('cc-live'); recog=null; };
      recog.start();
    }catch(e){ stopMic(); logLine('cc','Voice input could not start on this device. Please type your command.'); }
  }

  /* =====================================================================
   * PUBLIC API + boot
   * ================================================================== */
  W.CHCN_CC = {
    run: run,                 // single router (text + voice parity)
    open: openPanel,
    close: closePanel,
    toggle: togglePanel,
    book: function(f){ showBook(f||''); },
    context: function(){ return { course:ctx.lastCourseName||null, game:ctx.lastGame||null }; },
    // Admin dry-run: shows which real target a phrase would hit, runs nothing.
    test: function(phrase){
      var t=String(phrase||'').toLowerCase().trim();
      var d=destructiveOf(t); if(d) return { phrase:phrase, match:'confirm: '+d.label, destructive:true };
      if(isHelp(t)) return { phrase:phrase, match:'open command book', destructive:false };
      if(!(CHCN.Commands&&CHCN.Commands.list)) return { phrase:phrase, match:null };
      var reg=CHCN.Commands.list();
      for(var i=0;i<reg.length;i++){ var e=reg[i]; for(var j=0;j<e.patterns.length;j++){ var p=e.patterns[j]; var ok=(p instanceof RegExp)?p.test(t):(t===p||t.indexOf(p)!==-1); if(ok && !(p instanceof RegExp && p.source==='[\\s\\S]*')) return { phrase:phrase, match:(e.help||String(p)), destructive:false }; } }
      return { phrase:phrase, match:'conversation fallback', destructive:false };
    }
  };

  function boot(){ /* No automatic floating launcher; the command API remains available when explicitly opened. */ }
  // Register the new vocabulary synchronously NOW so it lands in the shared
  // registry before the assistant's deferred catch-all (keeps priority).
  try{ registerVocabulary(); }catch(e){}
  if(D){ if(D.readyState==='loading') D.addEventListener('DOMContentLoaded', boot); else boot(); }

})(typeof window!=='undefined'?window:this, typeof document!=='undefined'?document:null);
